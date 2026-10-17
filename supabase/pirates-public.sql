-- Public PvE release; requires the already installed pirates-admin.sql.
-- Preserves all station states, missions, rewards and realm settings. Safe to repeat.
begin;
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
revoke all on function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;
commit;
