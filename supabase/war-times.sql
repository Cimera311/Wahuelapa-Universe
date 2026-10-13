-- Public, deliberately coarse battle newspaper. Install after combat-logs.sql.
-- No combat traces, exact losses, cargo quantities, or live fleet positions are exposed.
begin;
create or replace function public.imperium_war_times()
returns jsonb language sql stable security definer set search_path='' as $$
 with published as (
  select b.mission_id, b.occurred_at, a.return_at,
   coalesce(nullif(left(sa.state->>'name',30),''),'Unbekannt') attacker,
   coalesce(nullif(left(sd.state->>'name',30),''),'Unbekannt') defender,
   coalesce(nullif(left(gp.meta->>'name',80),''),nullif(left(a.data->>'to',80),''),'Unbekannter Planet') planet,
   b.header->'summary' summary
  from public.pvp_battle_logs b
  join public.pvp_attacks a on a.id=b.mission_id
  left join public.game_saves sa on sa.user_id=b.attacker_id
  left join public.game_saves sd on sd.user_id=b.defender_id
  left join public.galaxy_planets gp on gp.id=a.data->>'to'
  where auth.uid() is not null and now()>=a.return_at and a.status in ('returning','returned')
  order by b.occurred_at desc limit 100
 ), classified as (
 select mission_id,occurred_at,attacker,defender,planet,
  case when summary->>'outcome' in ('attacker','defender','draw') then summary->>'outcome' else 'draw' end outcome,
  coalesce((select sum(case when value ~ '^[0-9]+$' then least(value::numeric,1000000000) else 0 end) from jsonb_each_text(case when jsonb_typeof(summary->'attackerBefore')='object' then summary->'attackerBefore' else '{}'::jsonb end)),0) attack_ships,
  coalesce((select sum(case when value ~ '^[0-9]+$' then least(value::numeric,1000000000) else 0 end) from jsonb_each_text(case when jsonb_typeof(summary->'defenderBefore')='object' then summary->'defenderBefore' else '{}'::jsonb end)),0) defense_ships,
  coalesce((select sum(case when value ~ '^[0-9]+$' then least(value::numeric,1000000000) else 0 end) from jsonb_each_text(case when jsonb_typeof(summary->'attackerAfter')='object' then summary->'attackerAfter' else '{}'::jsonb end)),0) survivors,
  coalesce((select sum(case when value ~ '^[0-9]+$' then least(value::numeric,1000000000) else 0 end) from jsonb_each_text(case when jsonb_typeof(summary->'loot')='object' then summary->'loot' else '{}'::jsonb end)),0) loot
 from published)
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',mission_id,'at',occurred_at,'attacker',attacker,'defender',defender,'planet',planet,
 'outcome',outcome,'wipe',outcome='defender' and survivors=0,
 'loot',outcome='attacker' and loot>0,
 'attackSize',case when attack_ships<10 then 'kleinen Kampfgruppe' when attack_ships<100 then 'mittelgroßen Flotte' else 'gewaltigen Armada' end,
 'defenseSize',case when defense_ships<10 then 'kleinen Verteidigung' when defense_ships<100 then 'stattlichen Verteidigung' else 'massiven Verteidigung' end
 ) order by occurred_at desc),'[]'::jsonb) from classified;
$$;
revoke all on function public.imperium_war_times() from public,anon;
grant execute on function public.imperium_war_times() to authenticated;
commit;