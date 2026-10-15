-- Combat v5 migration: extend the existing admin selector to v5. Current selection is preserved.
-- Run before deploying the v5 Game Command.
begin;
alter table public.pvp_control add column if not exists combat_engine integer not null default 3;
alter table public.pvp_control drop constraint if exists pvp_control_combat_engine_check;
alter table public.pvp_control add constraint pvp_control_combat_engine_check check(combat_engine in (3,4,5));
create table if not exists public.pvp_combat_engine_log (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 engine integer not null check(engine in (3,4,5)),
 changed_at timestamptz not null default now()
);
alter table public.pvp_combat_engine_log drop constraint if exists pvp_combat_engine_log_engine_check;
alter table public.pvp_combat_engine_log add constraint pvp_combat_engine_log_engine_check check(engine in (3,4,5));
revoke all on public.pvp_combat_engine_log from public,anon,authenticated;
create or replace function public.imperium_set_combat_engine(p_uid uuid,p_engine integer)
returns integer language plpgsql security definer set search_path='' as $$
declare old_engine integer;
begin
 if p_engine not in (3,4,5) or p_engine is null then raise exception 'INVALID_COMBAT_ENGINE';end if;
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
commit;
