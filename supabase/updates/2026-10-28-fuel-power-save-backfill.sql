-- PR #131: Existing game saves get fuelPower=0 on every planet.
-- Run during a maintenance window, after backing up public.game_saves.
-- Idempotent: existing fuelPower levels are preserved, untouched saves are not rewritten.
BEGIN;

WITH migrated AS (
  SELECT gs.user_id,
         jsonb_agg(
           CASE
             WHEN jsonb_typeof(p.planet->'buildings') = 'object'
                  AND NOT (p.planet->'buildings' ? 'fuelPower')
             THEN jsonb_set(p.planet, '{buildings,fuelPower}', '0'::jsonb, true)
             ELSE p.planet
           END
           ORDER BY p.ordinality
         ) AS planets
  FROM public.game_saves AS gs
  CROSS JOIN LATERAL jsonb_array_elements(gs.state->'planets')
    WITH ORDINALITY AS p(planet, ordinality)
  WHERE jsonb_typeof(gs.state->'planets') = 'array'
  GROUP BY gs.user_id
  HAVING bool_or(jsonb_typeof(p.planet->'buildings') = 'object'
                 AND NOT (p.planet->'buildings' ? 'fuelPower'))
)
UPDATE public.game_saves AS gs
SET state = jsonb_set(gs.state, '{planets}', m.planets, false),
    revision = gs.revision + 1,
    updated_at = now()
FROM migrated AS m
WHERE gs.user_id = m.user_id;

COMMIT;

-- Verification (read-only): should return 0 for standard game saves.
SELECT count(*) AS planets_missing_fuel_power
FROM public.game_saves AS gs
CROSS JOIN LATERAL jsonb_array_elements(gs.state->'planets') AS p(planet)
WHERE jsonb_typeof(p.planet->'buildings') = 'object'
  AND NOT (p.planet->'buildings' ? 'fuelPower');
