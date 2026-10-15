-- Nur Ranglistenbewertung der Orbitalwerft an neue Schiffswerftkosten angleichen.
-- Keine Stufenumrechnung, keine Erstattung und keine Aenderung der Leaderboard-Funktion.
-- Den bereits ausgefuehrten Squish NICHT erneut vorbereiten oder ausfuehren.
-- Nach vorhandenen Ranglisten-Erweiterungen installieren. Wiederholbar.
begin;
create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path = '' as $$
declare
 costs constant jsonb := '{"buildings":{"metal":[80,35,0],"crystal":[65,60,0],"fuel":[90,50,0],"solar":[75,40,0],"warehouse":[120,60,0],"lab":[150,100,0],"shipyard":[200,100,0],"robotics":[400,300,60],"orbital":[200,100,0],"repairDock":[1200,800,300],"bunker":[450,300,80],"tidal":[700,450,80]},"tech":{"scout":[100,100,30],"logistics":[150,120,40],"colonization":[350,250,100],"drive":[200,150,80],"ramjet":[600,450,200],"impulse":[1800,1400,650],"hyperspace":[5500,4200,2000],"engineering":[250,200,40],"military":[300,220,80],"weapons":[400,300,100],"shields":[350,450,100],"armor":[500,250,100],"assaultDrive":[600,400,200],"energy":[200,180,50]},"ships":{"probe":[90,60,20],"transport":[180,100,40],"longProbe":[280,200,80],"starColony":[1200,850,400],"colony":[500,300,100],"kurier":[140,80,30],"karawane":[800,450,180],"atlas":[2400,1400,600],"arche":[7600,4400,2000],"falke":[240,150,60],"waechter":[900,600,220],"donner":[3000,1800,700],"flak":[240,150,60],"laser":[900,600,220],"rail":[3000,1800,700],"plasma":[9500,6500,2500],"titan":[9500,6500,2500]}}'::jsonb;
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
  -- Dock reservations remain owned units, including stationary platforms.
  for m in select value from jsonb_array_elements(case when jsonb_typeof(p->'repairQueue')='array' then p->'repairQueue' else '[]'::jsonb end) limit 20 loop
   for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'key'),'[]'::jsonb)) loop
    if m->>'key' in ('flak','laser','rail','plasma') then
     buildings_total := buildings_total + (base #>> '{}')::numeric * jsonb_array_length(case when jsonb_typeof(m->'entries')='array' then m->'entries' else '[]'::jsonb end);
    else
     fleet_total := fleet_total + (base #>> '{}')::numeric * jsonb_array_length(case when jsonb_typeof(m->'entries')='array' then m->'entries' else '[]'::jsonb end);
    end if;
   end loop;
  end loop;
  for item in select key,value from jsonb_each(costs->'ships') loop
   for base in select value from jsonb_array_elements(item.value) loop
    if item.key in ('flak','laser','rail','plasma') then
     buildings_total := buildings_total + (base #>> '{}')::numeric * public.imperium_rank_int(p->'ships'->item.key,1000000);
    else
     fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(p->'ships'->item.key,1000000);
    end if;
   end loop;
  end loop;
 end loop;
 for item in select key,value from jsonb_each(costs->'tech') loop
  lvl := public.imperium_rank_int(s->'tech'->item.key,case when item.key='scout' then 100 when item.key in ('drive','ramjet','impulse','hyperspace','military') then 10 when item.key='colonization' then 6 when item.key='assaultDrive' then 1 else 5 end);
  for i in 0..lvl-1 loop
   for base in select value from jsonb_array_elements(item.value) loop
    research_total := research_total + least(1000000000000::numeric,ceil((base #>> '{}')::numeric * power(1.6::numeric,i) * power(1.5::numeric,case when item.key='military' then greatest(0,i-4) else 0 end)));
   end loop;
  end loop;
 end loop;
 for m in select value from jsonb_array_elements(missions) limit 100 loop
  -- Attack fleets live in public.pvp_attacks, not in planetary hangars.
  -- The leaderboard appends each active attack as a mission with a fleet object.
  for item in select key,value from jsonb_each(case when jsonb_typeof(m->'fleet')='object' then m->'fleet' else '{}'::jsonb end) loop
   if costs->'ships' ? item.key and item.key not in ('flak','laser','rail','plasma') then
    for base in select value from jsonb_array_elements(costs->'ships'->item.key) loop
     fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(item.value,1000000);
    end loop;
   end if;
  end loop;
  for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'ship'),'[]'::jsonb)) loop
   fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(m->'count',100);
  end loop;
 end loop;
 return query select floor(buildings_total/100)::bigint,floor(research_total/100)::bigint,
 floor(fleet_total/100)::bigint,greatest(0,least(7,jsonb_array_length(planets))-1);
end $$;
revoke all on function public.imperium_rank_points(jsonb) from public,anon,authenticated;


commit;
