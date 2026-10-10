-- Install LAST, after pvp.sql, reports.sql, combat-logs.sql and combat-log-pagination.sql.
-- Then deploy the cumulative swift-handler bundle and publish the website.
begin;
create table if not exists public.partner_world(id boolean primary key default true check(id),data jsonb not null default '{"partners":[],"socialMissions":[],"trades":[]}'::jsonb);
insert into public.partner_world(id) values(true) on conflict do nothing;
alter table public.partner_world enable row level security;
revoke all on public.partner_world from public,anon,authenticated;
-- Preserve the existing authoritative writers. Both wrappers share their epoch lock.
do $$begin
 if to_regprocedure('public.imperium_pvp_snapshot_base(uuid,uuid)') is null then
  alter function public.imperium_pvp_snapshot(uuid,uuid) rename to imperium_pvp_snapshot_base;
  alter function public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) rename to imperium_pvp_commit_base;
 end if;
end $$;
create or replace function public.imperium_pvp_snapshot(p_uid uuid,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb;extra jsonb;
begin
 base:=public.imperium_pvp_snapshot_base(p_uid,p_request_id);
 select data into extra from public.partner_world where id;
 return base||extra||jsonb_build_object('socialVersion',1);
end $$;
create or replace function public.imperium_pvp_commit(p_world jsonb,p_expected bigint,p_uid uuid,p_request_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.imperium_pvp_commit_base(p_world,p_expected,p_uid,p_request_id,p_payload) then return false;end if;
 if p_world->>'socialVersion' is distinct from '1' or jsonb_typeof(p_world->'partners') is distinct from 'array' or jsonb_typeof(p_world->'socialMissions') is distinct from 'array' or jsonb_typeof(p_world->'trades') is distinct from 'array' then raise exception 'INVALID_PARTNER_WORLD';end if;
 update public.partner_world set data=jsonb_build_object('partners',p_world->'partners','socialMissions',p_world->'socialMissions','trades',p_world->'trades') where id;
 return true;
end $$;
revoke all on function public.imperium_pvp_snapshot_base(uuid,uuid),public.imperium_pvp_commit_base(jsonb,bigint,uuid,uuid,jsonb),public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.imperium_pvp_snapshot(uuid,uuid),public.imperium_pvp_commit(jsonb,bigint,uuid,uuid,jsonb) to service_role;

create or replace function public.imperium_capture_attack_reports(p public.pvp_attacks)
returns void language plpgsql security definer set search_path=public as $$
declare r jsonb:=p.data->'report'; side uuid; result text;
begin
 insert into public.game_reports(user_id,id,occurred_at,kind,title,mission_id,payload)
 values(p.attacker_id,'attack:'||p.id||':start',p.started_at,'attack','Angriff gestartet',p.id::text,
  jsonb_build_object('from',p.data->>'from','to',p.data->>'to','fleet',p.data->'fleet'))
 on conflict(user_id,id) do nothing;
 -- No defender record before resolution: the warning cutoff remains private.
 if r is not null and r<>'null'::jsonb then
  for side in select distinct owner from (select p.attacker_id as owner union all select p.defender_id union all select (value->>'owner')::uuid from jsonb_array_elements(coalesce(r->'supporting','[]'::jsonb))) participants loop
   result=case when r->>'outcome'='cancelled' then 'cancelled' when r->>'outcome'='draw' then 'draw'
    when (r->>'outcome'='attacker')=(side=p.attacker_id) then 'win' else 'loss' end;
   insert into public.game_reports(user_id,id,occurred_at,kind,title,mission_id,outcome,payload)
   values(side,'attack:'||p.id||':battle',to_timestamp((r->>'at')::double precision/1000),'battle','Gefecht',p.id::text,result,
    r||jsonb_build_object('isSupport',side not in (p.attacker_id,p.defender_id),'attackerName',(select state->>'name' from public.game_saves where user_id=p.attacker_id),'defenderName',(select state->>'name' from public.game_saves where user_id=p.defender_id),'ownBefore',case when side=p.attacker_id then r->'attackerBefore' when side=p.defender_id then coalesce(r->'hostBefore',r->'defenderBefore') else (select jsonb_object_agg(key,total) from (select f.key,sum((f.value #>> '{}')::numeric) total from jsonb_array_elements(r->'supporting') g cross join lateral jsonb_each(g->'before') f where g->>'owner'=side::text group by f.key) counts) end,'ownAfter',case when side=p.attacker_id then r->'attackerAfter' when side=p.defender_id then coalesce(r->'hostAfter',r->'defenderAfter') else coalesce((select jsonb_object_agg(key,total) from (select f.key,sum((f.value #>> '{}')::numeric) total from jsonb_array_elements(r->'supporting') g cross join lateral jsonb_each(g->'after') f where g->>'owner'=side::text group by f.key) counts),'{}'::jsonb) end)||jsonb_build_object('from',p.data->>'from','to',p.data->>'to','ownSide',case when side=p.attacker_id then 'attacker' else 'defender' end,'commander',(select state->>'name' from public.game_saves where user_id=case when side=p.attacker_id then p.defender_id else p.attacker_id end)))
   on conflict(user_id,id) do nothing;
  end loop;
 end if;
 if p.status='returned' and exists(select 1 from jsonb_each(coalesce(p.data->'survivors','{}'::jsonb))) then
  insert into public.game_reports(user_id,id,occurred_at,kind,title,mission_id,payload)
  values(p.attacker_id,'attack:'||p.id||':return',p.return_at,'return','Angriffsflotte zurückgekehrt',p.id::text,
   jsonb_build_object('from',p.data->>'from','to',p.data->>'to','fleet',p.data->'survivors','cargo',p.data->'cargo'))
  on conflict(user_id,id) do nothing;
 end if;
end $$;

create or replace function public.imperium_battle_log(p_mission uuid,p_round integer default null,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); h public.pvp_battle_logs; q jsonb; result jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_offset<0 or (p_round is not null and p_round not between 1 and 6) then raise exception 'INVALID_PAGE';end if;
 select * into h from public.pvp_battle_logs where mission_id=p_mission and (uid in (attacker_id,defender_id) or exists(select 1 from jsonb_array_elements(coalesce(header->'summary'->'supporting','[]'::jsonb)) x where x->>'owner'=uid::text));
 if not found then raise exception 'BATTLE_LOG_NOT_FOUND';end if;
 if p_round is null then
  select h.header||jsonb_build_object('missionId',h.mission_id,'ownSide',case when uid=h.attacker_id then 'attacker' else 'defender' end,
   'rounds',coalesce((select jsonb_agg(jsonb_build_object('round',round,'after',data->'after','shots',jsonb_array_length(data->'shots'),'impacts',jsonb_array_length(data->'impacts')) order by round) from public.pvp_battle_rounds where mission_id=p_mission),'[]'::jsonb)) into result;
  return result;
 end if;
 select data into q from public.pvp_battle_rounds where mission_id=p_mission and round=p_round;
 if q is null then raise exception 'BATTLE_ROUND_NOT_FOUND';end if;
 return jsonb_build_object('missionId',p_mission,'round',p_round,'offset',p_offset,'limit',200,'after',q->'after',
  'shotTotal',jsonb_array_length(q->'shots'),'impactTotal',jsonb_array_length(q->'impacts'),
  'shots',coalesce((select jsonb_agg(value order by ord) from jsonb_array_elements(q->'shots') with ordinality as e(value,ord) where ord>p_offset and ord<=p_offset+200),'[]'::jsonb),
  'impacts',coalesce((select jsonb_agg(value order by ord) from jsonb_array_elements(q->'impacts') with ordinality as e(value,ord) where ord>p_offset and ord<=p_offset+200),'[]'::jsonb));
end $$;

create or replace function public.imperium_rank_count(j jsonb)
returns numeric language sql immutable set search_path='' as $$
select case when jsonb_typeof(j)='number' and (j #>> '{}') ~ '^[0-9]+$' then least(9007199254740991::numeric,(j #>> '{}')::numeric) else 0::numeric end;
$$;
revoke all on function public.imperium_rank_count(jsonb) from public,anon,authenticated;

create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path = '' as $$
declare
 costs constant jsonb := '{"buildings":{"metal":[80,35,0],"crystal":[65,60,0],"fuel":[90,50,0],"solar":[75,40,0],"warehouse":[120,60,0],"lab":[150,100,0],"shipyard":[200,100,0],"robotics":[400,300,60],"orbital":[600,400,120],"bunker":[450,300,80],"tidal":[700,450,80]},"tech":{"scout":[100,100,30],"logistics":[150,120,40],"colonization":[350,250,100],"drive":[200,150,80],"ramjet":[600,450,200],"impulse":[1800,1400,650],"hyperspace":[5500,4200,2000],"engineering":[250,200,40],"military":[300,220,80],"weapons":[400,300,100],"shields":[350,450,100],"armor":[500,250,100],"assaultDrive":[600,400,200],"energy":[200,180,50]},"ships":{"probe":[90,60,20],"transport":[180,100,40],"longProbe":[280,200,80],"starColony":[1200,850,400],"colony":[500,300,100],"kurier":[140,80,30],"karawane":[800,450,180],"atlas":[2400,1400,600],"arche":[7600,4400,2000],"falke":[240,150,60],"waechter":[900,600,220],"donner":[3000,1800,700],"flak":[160,80,20],"laser":[450,300,70],"rail":[1400,1000,280],"plasma":[4000,2800,900],"titan":[9500,6500,2500]}}'::jsonb;
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
  for item in select key,value from jsonb_each(costs->'ships') loop
   for base in select value from jsonb_array_elements(item.value) loop
    fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_count(p->'ships'->item.key);
   end loop;
  end loop;
 end loop;
 for item in select key,value from jsonb_each(costs->'tech') loop
  lvl := public.imperium_rank_int(s->'tech'->item.key,case when item.key='colonization' then 6 when item.key='military' then 4 else 5 end);
  for i in 0..lvl-1 loop
   for base in select value from jsonb_array_elements(item.value) loop
    research_total := research_total + ceil((base #>> '{}')::numeric * power(1.6::numeric,i));
   end loop;
  end loop;
 end loop;
 for m in select value from jsonb_array_elements(missions) limit 200 loop
  if m->>'type'='route' and jsonb_typeof(m->'fleet')='object' then
   for item in select key,value from jsonb_each(m->'fleet') loop
    for base in select value from jsonb_array_elements(coalesce(costs->'ships'->item.key,'[]'::jsonb)) loop
     fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_count(item.value);
    end loop;
   end loop;
  else
  for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'ship'),'[]'::jsonb)) loop
   fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_count(m->'count');
  end loop;
  end if;
 end loop;
 return query select floor(buildings_total/100)::bigint,floor(research_total/100)::bigint,
 floor(fleet_total/100)::bigint,greatest(0,least(7,jsonb_array_length(planets))-1);
end $$;

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

commit;
