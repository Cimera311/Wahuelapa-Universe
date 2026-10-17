-- Install after the existing PvP, partnerships and ranking patches.
-- Personal PvE persistence. Safe to repeat; does not reset pirates or player saves.
begin;
create table if not exists public.pirate_world (
 id boolean primary key default true check(id),
 data jsonb not null default '{"pirateConfig":{},"piratePlayers":[]}'::jsonb check(jsonb_typeof(data)='object')
);
insert into public.pirate_world(id) values(true) on conflict do nothing;
alter table public.pirate_world enable row level security;
revoke all on public.pirate_world from public,anon,authenticated;
-- No browser policies: only the trusted authoritative wrapper may access this table.
do $$begin
 if to_regprocedure('public.imperium_pvp_snapshot_before_pirates(uuid,uuid)') is null then
  alter function public.imperium_pvp_snapshot(uuid,uuid) rename to imperium_pvp_snapshot_before_pirates;
  alter function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) rename to imperium_pvp_commit_before_pirates;
 end if;
 if to_regprocedure('public.imperium_rank_points_before_pirates(jsonb)') is null then
  alter function public.imperium_rank_points(jsonb) rename to imperium_rank_points_before_pirates;
 end if;
end $$;
create or replace function public.imperium_pvp_snapshot(p_uid uuid,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb;extra jsonb;
begin
 base:=public.imperium_pvp_snapshot_before_pirates(p_uid,p_request_id);
 select data into extra from public.pirate_world where id;
 -- Deleted accounts must not leave orphaned missions that block global catch-up.
 extra:=jsonb_set(extra,'{piratePlayers}',coalesce((select jsonb_agg(r.value) from jsonb_array_elements(extra->'piratePlayers') r where exists(select 1 from public.game_saves g where g.user_id=(r.value->>'user_id')::uuid)),'[]'::jsonb));
 return base||extra||jsonb_build_object('pirateVersion',1);
end $$;
create or replace function public.imperium_pvp_commit(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare extra jsonb;
begin
 if p_payload->>'type'='pirate' and p_payload->'action'->>'op'='configure' and not exists(select 1 from public.pvp_admins where user_id=p_uid) then raise exception 'ADMIN_REQUIRED';end if;
 -- Original commit takes the global epoch lock. All additional writes are in this transaction.
 if not public.imperium_pvp_commit_before_pirates(p_world,p_expected,p_uid,p_request_id,p_payload) then return false;end if;
 -- Permit the previous handler to keep normal gameplay running between SQL and deployment.
 if p_world->>'pirateVersion' is distinct from '1' then return true;end if;
 if jsonb_typeof(p_world->'pirateConfig') is distinct from 'object' or jsonb_typeof(p_world->'piratePlayers') is distinct from 'array' then raise exception 'INVALID_PIRATE_WORLD';end if;
 extra:=jsonb_build_object('pirateConfig',p_world->'pirateConfig','piratePlayers',p_world->'piratePlayers');
 update public.pirate_world set data=extra where id and data is distinct from extra;
 return true;
end $$;
-- Reuse the installed scoring rules, including historical building prices and repairs.
-- PvE fleet shadows are derived by the server and keep fleets scored throughout travel.
create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path='' as $$
declare q jsonb;extra numeric:=0;p jsonb;m jsonb;r record;
begin
 q:=jsonb_set(s,'{missions}',coalesce(s->'missions','[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('type','route','fleet',value->'fleet')) from jsonb_array_elements(coalesce(s->'pveFleets','[]'::jsonb))),'[]'::jsonb));
 -- The previous ship-cost table does not yet know the new Spionagesonde (310 material).
 for p in select value from jsonb_array_elements(s->'planets') loop extra:=extra+310*public.imperium_rank_count(p->'ships'->'spyProbe');end loop;
 for m in select value from jsonb_array_elements(q->'missions') loop
  extra:=extra+310*case when jsonb_typeof(m->'fleet')='object' then public.imperium_rank_count(m->'fleet'->'spyProbe') when m->>'ship'='spyProbe' then public.imperium_rank_count(m->'count') else 0 end;
 end loop;
 select * into r from public.imperium_rank_points_before_pirates(q);
 return query select r.building_points,r.research_points,r.fleet_points+floor(extra/100)::bigint,r.colonies;
end $$;
revoke all on function public.imperium_pvp_snapshot_before_pirates(uuid,uuid),public.imperium_pvp_commit_before_pirates(jsonb,bigint,uuid,uuid,jsonb),public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb),public.imperium_rank_points_before_pirates(jsonb),public.imperium_rank_points(jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;
commit;
