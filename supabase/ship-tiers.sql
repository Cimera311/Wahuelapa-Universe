-- Einmal nach setup.sql und leaderboard.sql ausführen. Kann erneut ausgeführt werden.
-- Erweitert nur die Ranglistenwertung; vorhandene Spielstände bleiben unverändert.
create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path = '' as $$
declare
 costs constant jsonb := '{"buildings":{"metal":[80,35,0],"crystal":[65,60,0],"fuel":[90,50,0],"solar":[75,40,0],"warehouse":[120,60,0],"lab":[150,100,0],"shipyard":[200,100,0],"robotics":[400,300,60],"tidal":[700,450,80]},"tech":{"scout":[100,100,30],"logistics":[150,120,40],"colonization":[350,250,100],"drive":[200,150,80],"engineering":[250,200,40],"energy":[200,180,50],"military":[300,220,80]},"ships":{"probe":[90,60,20],"transport":[180,100,40],"colony":[500,300,100],"kurier":[140,80,30],"karawane":[800,450,180],"atlas":[2400,1400,600],"arche":[7600,4400,2000],"falke":[240,150,60],"waechter":[900,600,220],"donner":[3000,1800,700],"titan":[9500,6500,2500]}}'::jsonb;
 p jsonb; m jsonb; item record; base jsonb; lvl integer; i integer;
 buildings_total numeric := 0; research_total numeric := 0; fleet_total numeric := 0;
 planets jsonb := case when jsonb_typeof(s->'planets')='array' then s->'planets' else '[]'::jsonb end;
 missions jsonb := case when jsonb_typeof(s->'missions')='array' then s->'missions' else '[]'::jsonb end;
begin
 for p in select value from jsonb_array_elements(planets) limit 3 loop
  for item in select key,value from jsonb_each(costs->'buildings') loop
   lvl := public.imperium_rank_int(p->'buildings'->item.key,30);
   for i in 0..lvl-1 loop
    for base in select value from jsonb_array_elements(item.value) loop
     buildings_total := buildings_total + ceil((base #>> '{}')::numeric * power(1.6::numeric,i));
    end loop;
   end loop;
  end loop;
  for item in select key,value from jsonb_each(costs->'ships') loop
   for base in select value from jsonb_array_elements(item.value) loop
    fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(p->'ships'->item.key,1000000);
   end loop;
  end loop;
 end loop;
 for item in select key,value from jsonb_each(costs->'tech') loop
  lvl := public.imperium_rank_int(s->'tech'->item.key,case when item.key='colonization' then 2 when item.key='military' then 4 else 5 end);
  for i in 0..lvl-1 loop
   for base in select value from jsonb_array_elements(item.value) loop
    research_total := research_total + ceil((base #>> '{}')::numeric * power(1.6::numeric,i));
   end loop;
  end loop;
 end loop;
 for m in select value from jsonb_array_elements(missions) limit 100 loop
  for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'ship'),'[]'::jsonb)) loop
   fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(m->'count',100);
  end loop;
 end loop;
 return query select floor(buildings_total/100)::bigint,floor(research_total/100)::bigint,
 floor(fleet_total/100)::bigint,greatest(0,least(3,jsonb_array_length(planets))-1);
end $$;
revoke all on function public.imperium_rank_points(jsonb) from public,anon,authenticated;

