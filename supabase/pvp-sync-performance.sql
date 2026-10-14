-- WaHueLaPa: avoid unnecessary row updates during 15/30s world synchronization.
-- Apply ONCE after supabase/partnerships.sql on the existing production project.
-- Safe to repeat. Does not change the authoritative epoch or battle rules.
do $guard$
begin
 if to_regprocedure('public.imperium_pvp_commit_base(jsonb,bigint,uuid,uuid,jsonb)') is null then
  raise exception 'pvp-sync-performance.sql requires partnerships.sql already installed';
 end if;
end $guard$;

create or replace function public.imperium_pvp_commit_base(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare ctl public.pvp_control; r jsonb; old_revision bigint; stamp timestamptz:=clock_timestamp(); receipt jsonb;
begin
 select * into ctl from public.pvp_control where id for update;
 if ctl.epoch is distinct from p_expected then return false;end if;
 if p_world->'settings'->>'enabled' is null then raise exception 'INVALID_WORLD';end if;
 if (p_world->'settings'->>'enabled')::boolean is distinct from ctl.enabled and
 not exists(select 1 from public.pvp_admins where user_id=p_uid) then raise exception 'ADMIN_REQUIRED';end if;
 if p_request_id is not null then
  select payload into receipt from public.pvp_requests where user_id=p_uid and request_id=p_request_id;
  if receipt is not null and receipt is distinct from p_payload then raise exception 'REQUEST_REUSED';end if;
 end if;
 -- Detect any legacy/admin save writes too. Locks are short and ordered.
 perform 1 from public.game_saves order by user_id for update;
 if exists(select 1 from public.game_saves g where not exists(select 1 from jsonb_array_elements(p_world->'saves') x where (x->>'user_id')::uuid=g.user_id and (x->>'revision')::bigint=g.revision)) then return false;end if;
 for r in select value from jsonb_array_elements(p_world->'saves') loop
  select revision into old_revision from public.game_saves where user_id=(r->>'user_id')::uuid;
  if old_revision is null then
   if (r->>'user_id')::uuid is distinct from p_uid or (r->>'revision')::bigint<>0 then raise exception 'INVALID_NEW_SAVE';end if;
   insert into public.game_saves(user_id,state,revision,updated_at) values(p_uid,r->'state',1,stamp);
  else
   if old_revision<>(r->>'revision')::bigint then return false;end if;
   update public.game_saves set state=r->'state',revision=revision+1,updated_at=stamp
    where user_id=(r->>'user_id')::uuid and state is distinct from r->'state';
  end if;
 end loop;
 for r in select value from jsonb_array_elements(p_world->'planets') loop
  update public.galaxy_planets set owner_id=(r->>'owner_id')::uuid,reserved=(r->>'reserved')::boolean,
   colonized_at=case when r->>'colonized_at' is null then null else to_timestamp((r->>'colonized_at')::numeric/1000) end,
   protection_ended=coalesce((r->>'protection_ended')::boolean,false),debris=coalesce(r->'debris','{"metal":0,"crystal":0,"fuel":0}'::jsonb)
   where id=r->>'id'
   and (owner_id,reserved,colonized_at,protection_ended,debris) is distinct from (
    (r->>'owner_id')::uuid,(r->>'reserved')::boolean,
    case when r->>'colonized_at' is null then null else to_timestamp((r->>'colonized_at')::numeric/1000) end,
    coalesce((r->>'protection_ended')::boolean,false),
    coalesce(r->'debris','{"metal":0,"crystal":0,"fuel":0}'::jsonb)
   );
 end loop;
 for r in select value from jsonb_array_elements(p_world->'surveys') loop
  insert into public.galaxy_surveys(user_id,planet_id) values((r->>'user_id')::uuid,r->>'planet_id') on conflict do nothing;
 end loop;
 for r in select value from jsonb_array_elements(p_world->'missions') loop
  insert into public.galaxy_missions(id,user_id,kind,from_id,planet_id,started_at,arrival_at,finish_at,completed)
  values((r->>'id')::uuid,(r->>'user_id')::uuid,r->>'kind',r->>'from_id',r->>'planet_id',
   to_timestamp((r->>'started_at')::numeric/1000),to_timestamp((r->>'arrival_at')::numeric/1000),to_timestamp((r->>'finish_at')::numeric/1000),(r->>'completed')::boolean)
  on conflict(id) do update set completed=excluded.completed
   where public.galaxy_missions.completed is distinct from excluded.completed;
 end loop;
 for r in select value from jsonb_array_elements(p_world->'attacks') loop
  insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data)
  values((r->>'id')::uuid,(r->>'attacker_id')::uuid,(r->>'defender_id')::uuid,to_timestamp((r->>'started_at')::numeric/1000),
   to_timestamp((r->>'warning_at')::numeric/1000),to_timestamp((r->>'arrival_at')::numeric/1000),to_timestamp((r->>'return_at')::numeric/1000),r->>'status',r)
  on conflict(id) do update set status=excluded.status,data=excluded.data
   where (public.pvp_attacks.status,public.pvp_attacks.data) is distinct from (excluded.status,excluded.data);
 end loop;
 if (p_world->'settings'->>'enabled')::boolean is distinct from ctl.enabled then
  insert into public.pvp_switch_log(user_id,enabled) values(p_uid,(p_world->'settings'->>'enabled')::boolean);
 end if;
 update public.pvp_control set enabled=(p_world->'settings'->>'enabled')::boolean,epoch=epoch+1,
 changed_at=case when (p_world->'settings'->>'enabled')::boolean is distinct from ctl.enabled then stamp else changed_at end where id;
 if p_request_id is not null then insert into public.pvp_requests(user_id,request_id,payload) values(p_uid,p_request_id,p_payload) on conflict do nothing;end if;
 return true;
end $$;

create or replace function public.imperium_pvp_commit(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.imperium_pvp_commit_base(p_world,p_expected,p_uid,p_request_id,p_payload) then return false;end if;
 if p_world->>'socialVersion' is distinct from '1' or jsonb_typeof(p_world->'partners') is distinct from 'array' or jsonb_typeof(p_world->'socialMissions') is distinct from 'array' or jsonb_typeof(p_world->'trades') is distinct from 'array' then raise exception 'INVALID_PARTNER_WORLD';end if;
 update public.partner_world set data=jsonb_build_object('partners',p_world->'partners','socialMissions',p_world->'socialMissions','trades',p_world->'trades')
  where id and data is distinct from jsonb_build_object('partners',p_world->'partners','socialMissions',p_world->'socialMissions','trades',p_world->'trades');
 return true;
end $$;

-- Preserve the trusted server boundary after the replacements.
revoke all on function public.imperium_pvp_commit_base(jsonb,bigint,uuid,uuid,jsonb),
 public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;
