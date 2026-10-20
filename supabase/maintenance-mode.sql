-- Wartungsmodus v1. Installieren, solange Modus AUS ist.
-- Es werden keine vorhandenen Spielstaende migriert oder geloescht.
begin;
create table if not exists public.imperium_maintenance(
 id boolean primary key default true check(id),
 enabled boolean not null default false,
 message text not null default 'Wir führen gerade Wartungsarbeiten durch. Deine Spielstände bleiben erhalten.',
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 constraint imperium_maintenance_message_length check(char_length(message) between 1 and 240)
);
insert into public.imperium_maintenance(id) values(true) on conflict(id) do nothing;
alter table public.imperium_maintenance enable row level security;
revoke all on public.imperium_maintenance from public,anon,authenticated;

create or replace function public.imperium_maintenance_status()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('version',1,'enabled',m.enabled,'message',m.message,
 'isAdmin',auth.uid() is not null and exists(select 1 from public.pvp_admins a where a.user_id=auth.uid()))
 from public.imperium_maintenance m where m.id;
$$;
revoke all on function public.imperium_maintenance_status() from public;
grant execute on function public.imperium_maintenance_status() to anon,authenticated;

create or replace function public.imperium_maintenance_set(p_enabled boolean,p_message text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.pvp_admins where user_id=auth.uid()) then
  raise exception 'ADMIN_REQUIRED' using errcode='42501';
 end if;
 if p_enabled is null or p_message is null or char_length(p_message) not between 1 and 240 then
  raise exception 'INVALID_MAINTENANCE_SETTINGS' using errcode='22023';
 end if;
 update public.imperium_maintenance set enabled=p_enabled,message=p_message,
  updated_at=clock_timestamp(),updated_by=auth.uid() where id;
 return public.imperium_maintenance_status();
end $$;
revoke all on function public.imperium_maintenance_set(boolean,text) from public,anon;
grant execute on function public.imperium_maintenance_set(boolean,text) to authenticated;

-- This lightweight check executes BEFORE the original heavyweight shared world snapshot,
-- so old browsers/handlers also stop early during maintenance.
create or replace function public.imperium_maintenance_server_check(p_uid uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select not m.enabled or exists(select 1 from public.pvp_admins a where a.user_id=p_uid)
 from public.imperium_maintenance m where m.id;
$$;
revoke all on function public.imperium_maintenance_server_check(uuid) from public,anon,authenticated;
grant execute on function public.imperium_maintenance_server_check(uuid) to service_role;

-- Keep the existing pirate/partner wrapper and world processing untouched.
create or replace function public.imperium_pvp_snapshot(p_uid uuid,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb; extra jsonb;
begin
 if not coalesce(public.imperium_maintenance_server_check(p_uid),false) then
  raise exception 'MAINTENANCE_ACTIVE';
 end if;
 base:=public.imperium_pvp_snapshot_before_pirates(p_uid,p_request_id);
 select data into extra from public.pirate_world where id;
 extra:=jsonb_set(extra,'{piratePlayers}',coalesce((select jsonb_agg(r.value)
  from jsonb_array_elements(extra->'piratePlayers') r
  where exists(select 1 from public.game_saves g where g.user_id=(r.value->>'user_id')::uuid)),'[]'::jsonb));
 return base||extra||jsonb_build_object('pirateVersion',1);
end $$;
revoke all on function public.imperium_pvp_snapshot(uuid,uuid) from public,anon,authenticated;
grant execute on function public.imperium_pvp_snapshot(uuid,uuid) to service_role;

-- Defense in depth: the FOR SHARE lock serializes maintenance activation
-- with in-flight commit transactions, so no non-admin commit begins after activation.
create or replace function public.imperium_pvp_commit(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare extra jsonb; blocked boolean;
begin
 select enabled into blocked from public.imperium_maintenance where id for share;
 if coalesce(blocked,true) and not exists(select 1 from public.pvp_admins where user_id=p_uid) then
  raise exception 'MAINTENANCE_ACTIVE';
 end if;
 if p_payload->>'type'='pirate' and p_payload->'action'->>'op'='configure' and not exists(select 1 from public.pvp_admins where user_id=p_uid) then raise exception 'ADMIN_REQUIRED';end if;
 if not public.imperium_pvp_commit_before_pirates(p_world,p_expected,p_uid,p_request_id,p_payload) then return false;end if;
 if p_world->>'pirateVersion' is distinct from '1' then return true;end if;
 if jsonb_typeof(p_world->'pirateConfig') is distinct from 'object' or jsonb_typeof(p_world->'piratePlayers') is distinct from 'array' then raise exception 'INVALID_PIRATE_WORLD';end if;
 extra:=jsonb_build_object('pirateConfig',p_world->'pirateConfig','piratePlayers',p_world->'piratePlayers');
 update public.pirate_world set data=extra where id and data is distinct from extra;
 return true;
end $$;
revoke all on function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;
commit;
