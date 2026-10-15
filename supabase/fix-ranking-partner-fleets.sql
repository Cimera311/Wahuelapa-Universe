-- Run AFTER partnerships.sql and any previous ranking fixes. Safe to rerun.
-- Restores owner points for active partner defense, delivery and trade fleets.
-- Outbound, stationed and returning fleets count; returned/lost fleets do not.
-- No changes to saves, fleets, combat, scoring costs or swift-handler.
begin;
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
  from public.game_saves g cross join lateral public.imperium_rank_points(jsonb_set(g.state,'{missions}',coalesce(g.state->'missions','[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('ship',case when gm.kind='scan' then 'longProbe' else 'starColony' end,'count',1)) from public.galaxy_missions gm where gm.user_id=g.user_id and not gm.completed),'[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('type','route','fleet',case when pa.status='outbound' then pa.data->'fleet' else pa.data->'survivors' end)) from public.pvp_attacks pa where pa.attacker_id=g.user_id and pa.status<>'returned'),'[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('type','route','fleet',m->'fleet')) from public.partner_world sw cross join lateral jsonb_array_elements(sw.data->'socialMissions') m where m->>'owner'=g.user_id::text and m->>'status' in ('outbound','stationed','returning')),'[]'::jsonb))) p
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
