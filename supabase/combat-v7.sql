-- Combat v7 migration: extend the existing admin selector to v7. Current selection is preserved.
-- Run before deploying the v7 Game Command.
begin;
alter table public.pvp_control add column if not exists combat_engine integer not null default 3;
alter table public.pvp_control drop constraint if exists pvp_control_combat_engine_check;
alter table public.pvp_control add constraint pvp_control_combat_engine_check check(combat_engine in (3,4,5,6,7));
create table if not exists public.pvp_combat_engine_log (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 engine integer not null check(engine in (3,4,5,6,7)),
 changed_at timestamptz not null default now()
);
alter table public.pvp_combat_engine_log drop constraint if exists pvp_combat_engine_log_engine_check;
alter table public.pvp_combat_engine_log add constraint pvp_combat_engine_log_engine_check check(engine in (3,4,5,6,7));
alter table public.pvp_combat_engine_log enable row level security;
revoke all on public.pvp_combat_engine_log from public,anon,authenticated;
create or replace function public.imperium_set_combat_engine(p_uid uuid,p_engine integer)
returns integer language plpgsql security definer set search_path='' as $$
declare old_engine integer;
begin
 if p_engine not in (3,4,5,6,7) or p_engine is null then raise exception 'INVALID_COMBAT_ENGINE';end if;
 if not exists(select 1 from public.pvp_admins where user_id=p_uid) then raise exception 'ADMIN_REQUIRED';end if;
 select combat_engine into old_engine from public.pvp_control where id=true for update;
 if old_engine is distinct from p_engine then
  update public.pvp_control set combat_engine=p_engine,epoch=epoch+1,changed_at=clock_timestamp() where id=true;
  insert into public.pvp_combat_engine_log(user_id,engine) values(p_uid,p_engine);
 end if;
 return p_engine;
end $$;
revoke all on function public.imperium_set_combat_engine(uuid,integer) from public,anon,authenticated;
grant execute on function public.imperium_set_combat_engine(uuid,integer) to service_role;
create or replace function public.imperium_store_battle_log()
returns trigger language plpgsql security definer set search_path='' as $$
declare trace jsonb:=new.data->'report'->'trace'; q jsonb; old_header jsonb; h jsonb;
begin
 if trace is null then return new;end if;
 if NOT (
   ((trace->>'version')::integer=1 and (trace->>'ruleVersion')::integer in (2,3)) or
   ((trace->>'version')::integer=2 and (trace->>'ruleVersion')::integer in (4,5,6,7) and
    jsonb_typeof(trace->'initialGroups')='array' and
    jsonb_typeof(trace->'finalGroups')='array')
 ) or jsonb_typeof(trace->'rounds')<>'array' or
 jsonb_array_length(trace->'rounds')>7 then raise exception 'INVALID_BATTLE_TRACE';end if;
 h=(trace-'rounds')||jsonb_build_object('summary',(new.data->'report')-'trace','from',new.data->>'from','to',new.data->>'to');
 select header into old_header from public.pvp_battle_logs where mission_id=new.id;
 if old_header is not null and old_header is distinct from h then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
 insert into public.pvp_battle_logs(mission_id,attacker_id,defender_id,occurred_at,header)
 values(new.id,new.attacker_id,new.defender_id,new.arrival_at,h) on conflict do nothing;
 for q in select value from jsonb_array_elements(trace->'rounds') loop
  if (q->>'round')::integer not between 0 and 6 or
     jsonb_typeof(q->'shots')<>'array' or jsonb_typeof(q->'impacts')<>'array' then
   raise exception 'INVALID_BATTLE_ROUND';
  end if;
  if exists(select 1 from public.pvp_battle_rounds where mission_id=new.id and round=(q->>'round')::integer and data is distinct from q) then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
  insert into public.pvp_battle_rounds(mission_id,round,data) values(new.id,(q->>'round')::integer,q) on conflict do nothing;
 end loop;
 new.data=jsonb_set(new.data,'{report}',((new.data->'report')-'trace')||jsonb_build_object('traceAvailable',true));
 return new;
end $$;
revoke all on function public.imperium_store_battle_log() from public,anon,authenticated;
commit;
