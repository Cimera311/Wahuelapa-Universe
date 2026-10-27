-- O3 compact-v1: additive rollout after existing social/PvE SQL; activate only after backup and handler preparation.
-- Additive RPC. The legacy snapshot and every authoritative writer remain untouched.
-- No history deletion, backfill, table rewrite or new browser permissions.
begin;
do $$begin
 if to_regprocedure('public.imperium_pvp_snapshot_base(uuid,uuid)') is null
 or to_regclass('public.partner_world') is null or to_regclass('public.pirate_world') is null then
  raise exception 'O3_REQUIRES_PARTNERS_AND_PIRATES';
 end if;
end $$;
create or replace function public.imperium_pvp_snapshot_compact(p_uid uuid,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; ctl public.pvp_control; extra jsonb;
begin
 if p_uid is null then raise exception 'PLAYER_REQUIRED';end if;
 -- Same consistency and lock order as the existing snapshot and all commits.
 select * into ctl from public.pvp_control where id for update;
 perform public.imperium_galaxy_start(p_uid);
 select jsonb_build_object('now',floor(extract(epoch from clock_timestamp())*1000),
 'settings',to_jsonb(ctl),'admins',coalesce((select jsonb_agg(user_id) from public.pvp_admins),'[]'::jsonb),
 'saves',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'state',state,'revision',revision) order by user_id) from public.game_saves),'[]'::jsonb),
 'planets',coalesce((select jsonb_agg(to_jsonb(p) order by id) from public.galaxy_planets p),'[]'::jsonb),
 'starts',coalesce((select jsonb_agg(to_jsonb(s)) from public.galaxy_starts s),'[]'::jsonb),
 'surveys',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'planet_id',planet_id)) from public.galaxy_surveys),'[]'::jsonb),
 'missions',coalesce((select jsonb_agg(to_jsonb(m)) from public.galaxy_missions m where not completed),'[]'::jsonb),
 -- Includes every player's outbound/returning fleet, including awaitingUnload.
 'attacks',coalesce((select jsonb_agg(data order by arrival_at,id) from public.pvp_attacks where status<>'returned'),'[]'::jsonb),
 -- Historical summaries are projection input only, never simulation or commit input.
 -- Same 30-day window, stable tie order and four-card limit as the legacy projection.
 'attackReports',coalesce((select jsonb_agg(card order by arrival_at desc,id) from (
  select id,arrival_at,jsonb_build_object('id',data->'id','attacker_id',data->'attacker_id','defender_id',data->'defender_id',
   'from',data->'from','to',data->'to','arrival_at',data->'arrival_at','return_at',data->'return_at','report',(data->'report')-'trace') as card
  from public.pvp_attacks
  where status='returned' and arrival_at>now()-interval '30 days'
   and data->'report' is not null and data->'report'<>'null'::jsonb
   and (attacker_id=p_uid or defender_id=p_uid or exists(
    select 1 from jsonb_array_elements(coalesce(data->'report'->'supporting','[]'::jsonb)) g where g->>'owner'=p_uid::text))
  order by arrival_at desc,id limit 4
 ) cards),'[]'::jsonb),
 'receipt',(select payload from public.pvp_requests where user_id=p_uid and request_id=p_request_id),
 'snapshotFormat','compact-v1') into result;
 select data into extra from public.partner_world where id;
 result:=result||extra||jsonb_build_object('socialVersion',1);
 select data into extra from public.pirate_world where id;
 extra:=jsonb_set(extra,'{piratePlayers}',coalesce((select jsonb_agg(r.value) from jsonb_array_elements(extra->'piratePlayers') r
  where exists(select 1 from public.game_saves g where g.user_id=(r.value->>'user_id')::uuid)),'[]'::jsonb));
 return result||extra||jsonb_build_object('pirateVersion',1);
end $$;
-- SECURITY DEFINER remains behind the same trusted service-role boundary.
revoke all on function public.imperium_pvp_snapshot_compact(uuid,uuid) from public,anon,authenticated;
grant execute on function public.imperium_pvp_snapshot_compact(uuid,uuid) to service_role;
commit;
