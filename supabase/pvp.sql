-- Run LAST, after setup/leaderboard/ship-tiers/galaxy/player-systems/mixed-routes/public-colonies.
-- Deploy the game-command Edge Function before installing this migration.
begin;
create table if not exists public.pvp_control(
 id boolean primary key default true check(id), enabled boolean not null default false,
 epoch bigint not null default 1, changed_at timestamptz not null default now());
insert into public.pvp_control(id) values(true) on conflict do nothing;
create table if not exists public.pvp_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.pvp_requests(
 user_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
 payload jsonb not null, created_at timestamptz not null default now(), primary key(user_id,request_id));
create table if not exists public.pvp_attacks(
 id uuid primary key, attacker_id uuid not null references auth.users(id) on delete cascade,
 defender_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null, warning_at timestamptz not null,
 arrival_at timestamptz not null, return_at timestamptz not null,
 status text not null check(status in ('outbound','returning','returned')), data jsonb not null);
create index if not exists pvp_attack_arrivals on public.pvp_attacks(arrival_at) where status='outbound';
create index if not exists pvp_attack_returns on public.pvp_attacks(return_at) where status='returning';
create index if not exists pvp_attack_target on public.pvp_attacks(defender_id,started_at);
create table if not exists public.pvp_switch_log(
 id bigint generated always as identity primary key, user_id uuid references auth.users(id),
 enabled boolean not null, changed_at timestamptz not null default now());
alter table public.galaxy_planets add column if not exists colonized_at timestamptz;
alter table public.galaxy_planets add column if not exists protection_ended boolean not null default false;
alter table public.galaxy_planets add column if not exists debris jsonb not null default '{"metal":0,"crystal":0,"fuel":0}'::jsonb;
-- Preserve known founding times; legacy colonies without a completed mission get
-- a single 24-hour grace period. Rerunning this migration does not reset it.
update public.galaxy_planets p set colonized_at=coalesce(
 (select min(m.finish_at) from public.galaxy_missions m where m.planet_id=p.id and m.kind='colony' and m.completed),now())
 where p.owner_id is not null and not p.reserved and p.colonized_at is null;
alter table public.pvp_control enable row level security;
alter table public.pvp_admins enable row level security;
alter table public.pvp_requests enable row level security;
alter table public.pvp_attacks enable row level security;
alter table public.pvp_switch_log enable row level security;
revoke all on public.pvp_control,public.pvp_admins,public.pvp_requests,public.pvp_attacks,public.pvp_switch_log from public,anon,authenticated;
create or replace function public.imperium_pvp_status()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 return (select jsonb_build_object('version',1,'enabled',c.enabled,'isAdmin',exists(select 1 from public.pvp_admins a where a.user_id=auth.uid())) from public.pvp_control c where id);
end $$;
create or replace function public.imperium_pvp_snapshot(p_uid uuid,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; ctl public.pvp_control;
begin
 -- All authoritative writers take this row first. The snapshot is consistent,
 -- while commit later compares epoch instead of keeping a network-spanning lock.
 select * into ctl from public.pvp_control where id for update;
 if p_uid is not null then perform public.imperium_galaxy_start(p_uid);end if;
 select jsonb_build_object('now',floor(extract(epoch from clock_timestamp())*1000),
 'settings',to_jsonb(ctl),'admins',coalesce((select jsonb_agg(user_id) from public.pvp_admins),'[]'::jsonb),
 'saves',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'state',state,'revision',revision) order by user_id) from public.game_saves),'[]'::jsonb),
 'planets',coalesce((select jsonb_agg(to_jsonb(p) order by id) from public.galaxy_planets p),'[]'::jsonb),
 'starts',coalesce((select jsonb_agg(to_jsonb(s)) from public.galaxy_starts s),'[]'::jsonb),
 'surveys',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'planet_id',planet_id)) from public.galaxy_surveys),'[]'::jsonb),
 'missions',coalesce((select jsonb_agg(to_jsonb(m)) from public.galaxy_missions m where not completed),'[]'::jsonb),
 'attacks',coalesce((select jsonb_agg(data order by arrival_at,id) from public.pvp_attacks where status<>'returned' or arrival_at>now()-interval '30 days'),'[]'::jsonb),
 'receipt',(select payload from public.pvp_requests where user_id=p_uid and request_id=p_request_id)) into result;
 return result;
end $$;
create or replace function public.imperium_pvp_commit(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
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
   where id=r->>'id';
 end loop;
 for r in select value from jsonb_array_elements(p_world->'surveys') loop
  insert into public.galaxy_surveys(user_id,planet_id) values((r->>'user_id')::uuid,r->>'planet_id') on conflict do nothing;
 end loop;
 for r in select value from jsonb_array_elements(p_world->'missions') loop
  insert into public.galaxy_missions(id,user_id,kind,from_id,planet_id,started_at,arrival_at,finish_at,completed)
  values((r->>'id')::uuid,(r->>'user_id')::uuid,r->>'kind',r->>'from_id',r->>'planet_id',
   to_timestamp((r->>'started_at')::numeric/1000),to_timestamp((r->>'arrival_at')::numeric/1000),to_timestamp((r->>'finish_at')::numeric/1000),(r->>'completed')::boolean)
  on conflict(id) do update set completed=excluded.completed;
 end loop;
 for r in select value from jsonb_array_elements(p_world->'attacks') loop
  insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data)
  values((r->>'id')::uuid,(r->>'attacker_id')::uuid,(r->>'defender_id')::uuid,to_timestamp((r->>'started_at')::numeric/1000),
   to_timestamp((r->>'warning_at')::numeric/1000),to_timestamp((r->>'arrival_at')::numeric/1000),to_timestamp((r->>'return_at')::numeric/1000),r->>'status',r)
  on conflict(id) do update set status=excluded.status,data=excluded.data;
 end loop;
 if (p_world->'settings'->>'enabled')::boolean is distinct from ctl.enabled then
  insert into public.pvp_switch_log(user_id,enabled) values(p_uid,(p_world->'settings'->>'enabled')::boolean);
 end if;
 update public.pvp_control set enabled=(p_world->'settings'->>'enabled')::boolean,epoch=epoch+1,
 changed_at=case when (p_world->'settings'->>'enabled')::boolean is distinct from ctl.enabled then stamp else changed_at end where id;
 if p_request_id is not null then insert into public.pvp_requests(user_id,request_id,payload) values(p_uid,p_request_id,p_payload) on conflict do nothing;end if;
 return true;
end $$;
revoke all on function public.imperium_pvp_status(),public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_status() to authenticated;
grant select on public.game_saves to service_role;
grant execute on function public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;
-- No client JSON overwrite or alternative economic writer may bypass PvP.
revoke all on function public.save_imperium(jsonb,bigint),public.imperium_galaxy_sync(bigint,text,text,text) from public,anon,authenticated;
-- Run after galaxy.sql and player-systems.sql. Mixed route ships contribute to ranking; pending replacements do not.
create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path = '' as $$
declare
 costs constant jsonb := '{"buildings":{"metal":[80,35,0],"crystal":[65,60,0],"fuel":[90,50,0],"solar":[75,40,0],"warehouse":[120,60,0],"lab":[150,100,0],"shipyard":[200,100,0],"robotics":[400,300,60],"orbital":[600,400,120],"bunker":[450,300,80],"tidal":[700,450,80]},"tech":{"scout":[100,100,30],"logistics":[150,120,40],"colonization":[350,250,100],"drive":[200,150,80],"ramjet":[600,450,200],"impulse":[1800,1400,650],"hyperspace":[5500,4200,2000],"engineering":[250,200,40],"military":[300,220,80],"weapons":[400,300,100],"shields":[350,450,100],"armor":[500,250,100],"assaultDrive":[600,400,200],"energy":[200,180,50]},"ships":{"probe":[90,60,20],"transport":[180,100,40],"longProbe":[280,200,80],"starColony":[1200,850,400],"colony":[500,300,100],"kurier":[140,80,30],"karawane":[800,450,180],"atlas":[2400,1400,600],"arche":[7600,4400,2000],"falke":[240,150,60],"waechter":[900,600,220],"donner":[3000,1800,700],"flak":[160,80,20],"laser":[450,300,70],"rail":[1400,1000,280],"plasma":[4000,2800,900],"titan":[9500,6500,2500]}}'::jsonb;
 p jsonb; m jsonb; item record; base jsonb; lvl integer; i integer;
 buildings_total numeric := 0; research_total numeric := 0; fleet_total numeric := 0;
 planets jsonb := case when jsonb_typeof(s->'planets')='array' then s->'planets' else '[]'::jsonb end;
 missions jsonb := case when jsonb_typeof(s->'missions')='array' then s->'missions' else '[]'::jsonb end;
begin
 for p in select value from jsonb_array_elements(planets) limit 7 loop
  for item in select key,value from jsonb_each(costs->'buildings') loop
   lvl := public.imperium_rank_int(p->'buildings'->item.key,30);
   for i in 0..lvl-1 loop
    for base in select value from jsonb_array_elements(item.value) loop
     buildings_total := buildings_total + ceil((base #>> '{}')::numeric * power(1.6::numeric,i));
    end loop;
   end loop;
  end loop;
  for item in select key,value from jsonb_each(costs->'ships') loop
   for base in select value from jsonb_array_elements(item.value) loop
    fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(p->'ships'->item.key,1000000);
   end loop;
  end loop;
 end loop;
 for item in select key,value from jsonb_each(costs->'tech') loop
  lvl := public.imperium_rank_int(s->'tech'->item.key,case when item.key='colonization' then 6 when item.key='military' then 4 else 5 end);
  for i in 0..lvl-1 loop
   for base in select value from jsonb_array_elements(item.value) loop
    research_total := research_total + ceil((base #>> '{}')::numeric * power(1.6::numeric,i));
   end loop;
  end loop;
 end loop;
 for m in select value from jsonb_array_elements(missions) limit 200 loop
  if m->>'type'='route' and jsonb_typeof(m->'fleet')='object' then
   for item in select key,value from jsonb_each(m->'fleet') loop
    for base in select value from jsonb_array_elements(coalesce(costs->'ships'->item.key,'[]'::jsonb)) loop
     fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(item.value,100);
    end loop;
   end loop;
  else
  for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'ship'),'[]'::jsonb)) loop
   fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(m->'count',100);
  end loop;
  end if;
 end loop;
 return query select floor(buildings_total/100)::bigint,floor(research_total/100)::bigint,
 floor(fleet_total/100)::bigint,greatest(0,least(7,jsonb_array_length(planets))-1);
end $$;
revoke all on function public.imperium_rank_points(jsonb) from public,anon,authenticated;



-- Include ships bound to authoritative galaxy flights in fleet scoring.
create or replace function public.imperium_leaderboard()
returns table(rank bigint,commander text,points bigint,building_points bigint,research_points bigint,fleet_points bigint,colonies integer,is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 return query
 with scores as (
  select g.user_id,left(coalesce(nullif(btrim(g.state->>'name'),''),'Commander'),30) as commander,
   p.building_points+p.research_points+p.fleet_points as points,
   p.building_points,p.research_points,p.fleet_points,p.colonies
  from public.game_saves g cross join lateral public.imperium_rank_points(jsonb_set(g.state,'{missions}',coalesce(g.state->'missions','[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('ship',case when gm.kind='scan' then 'longProbe' else 'starColony' end,'count',1)) from public.galaxy_missions gm where gm.user_id=g.user_id and not gm.completed),'[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('fleet',case when pa.status='outbound' then pa.data->'fleet' else pa.data->'survivors' end)) from public.pvp_attacks pa where pa.attacker_id=g.user_id and pa.status<>'returned'),'[]'::jsonb))) p
  where g.state->>'version'='1'
 ), ranked as (
  select rank() over(order by s.points desc) as rank,
   row_number() over(order by s.points desc,s.commander,s.user_id) as position,s.* from scores s
 )
 select r.rank,r.commander,r.points,r.building_points,r.research_points,r.fleet_points,r.colonies,r.user_id=auth.uid()
 from ranked r where r.position<=100 or r.user_id=auth.uid()
 order by r.position;
end $$;
revoke all on function public.imperium_leaderboard() from public,anon;
grant execute on function public.imperium_leaderboard() to authenticated;

commit;
