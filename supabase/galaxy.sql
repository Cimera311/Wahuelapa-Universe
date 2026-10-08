-- WaHueLaPa Universe: after setup.sql, leaderboard.sql and ship-tiers.sql.
-- Re-runnable. Creates 10 shared systems once; never regenerates existing planets.
create table if not exists public.galaxy_systems(id text primary key,name text not null,x numeric not null,y numeric not null,planet_count integer not null check(planet_count between 3 and 10));
create table if not exists public.galaxy_planets(id text primary key,system text not null references public.galaxy_systems(id),slot integer not null check(slot between 1 and 10),meta jsonb not null,owner_id uuid references auth.users(id) on delete set null,reserved boolean not null default false,unique(system,slot));
create table if not exists public.galaxy_starts(user_id uuid primary key references auth.users(id) on delete cascade,x numeric not null,y numeric not null);
create table if not exists public.galaxy_surveys(user_id uuid not null references auth.users(id) on delete cascade,planet_id text not null references public.galaxy_planets(id),scanned_at timestamptz not null default now(),primary key(user_id,planet_id));
create table if not exists public.galaxy_missions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in ('scan','colony')),from_id text not null,planet_id text not null references public.galaxy_planets(id),started_at timestamptz not null default now(),arrival_at timestamptz not null,finish_at timestamptz not null,completed boolean not null default false);
create unique index if not exists galaxy_scan_unique on public.galaxy_missions(user_id,planet_id) where kind='scan' and not completed;
create unique index if not exists galaxy_colony_unique on public.galaxy_missions(planet_id) where kind='colony' and not completed;
alter table public.galaxy_systems enable row level security;
alter table public.galaxy_planets enable row level security;
alter table public.galaxy_starts enable row level security;
alter table public.galaxy_surveys enable row level security;
alter table public.galaxy_missions enable row level security;
revoke all on public.galaxy_systems,public.galaxy_planets,public.galaxy_starts,public.galaxy_surveys,public.galaxy_missions from public,anon,authenticated;
insert into public.galaxy_systems(id,name,x,y,planet_count)
select id,name,x,y,3+floor(random()*8)::integer from (values
 ('helion','Helion',520,400),('orion','Orion',380,250),('cetus','Cetus',220,450),('aster','Aster',600,180),('lysara','Lysara',750,300),('vela','Vela',850,180),('umbra','Umbra',760,650),('nyx','Nyx',520,720),('solace','Solace',870,730),('nova','Nova',330,700)
) as initial(id,name,x,y) on conflict(id) do nothing;
do $$
declare sys record; i integer; kind integer; mult jsonb; meta jsonb; planet_id text;
begin
 for sys in select * from public.galaxy_systems loop
  for i in 1..sys.planet_count loop
   planet_id:='g-'||sys.id||'-p'||i;
   if exists(select 1 from public.galaxy_planets where id=planet_id) then continue; end if;
   kind:=floor(random()*4)::integer;
   mult:=jsonb_build_array(round((.6+random()*1.5)::numeric,2),round((.6+random()*1.5)::numeric,2),round((.6+random()*1.5)::numeric,2));
   meta:=jsonb_build_object('id',planet_id,'system',sys.id,'slot',i,'x',sys.x,'y',sys.y,'name',sys.name||' '||i,'coord','G:'||sys.id||':'||i,'kind',(array['Kontinentalplanet','Gesteinsplanet','Eisplanet','Ozeanplanet'])[kind+1],'image',(array['home','ferrum','nereus','thalassa'])[kind+1],'mult',mult,'ocean',kind=3,'energy',round((.8+random()*.5)::numeric,2),'color',(array['#53add3','#ba7047','#80cbe3','#3c92c9'])[kind+1],'distance',i);
   insert into public.galaxy_planets(id,system,slot,meta) values(planet_id,sys.id,i,meta);
  end loop;
 end loop;
end $$;
create or replace function public.imperium_galaxy_start(uid uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare angle double precision:=random()*2*pi(); result jsonb;
begin
 insert into public.galaxy_starts(user_id,x,y) values(uid,round((500+460*cos(angle))::numeric,2),round((500+460*sin(angle))::numeric,2)) on conflict(user_id) do nothing;
 select jsonb_build_object('x',x,'y',y) into result from public.galaxy_starts where user_id=uid;
 return result;
end $$;
create or replace function public.imperium_galaxy_projection(uid uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 -- Scan data becomes visible at arrival; returning probe remains in flight.
 insert into public.galaxy_surveys(user_id,planet_id)
 select uid,planet_id from public.galaxy_missions where user_id=uid and kind='scan' and arrival_at<=now()
 on conflict(user_id,planet_id) do nothing;
 select jsonb_build_object('serverNow',floor(extract(epoch from now())*1000),'start',public.imperium_galaxy_start(uid),
 'systems',(select jsonb_agg(jsonb_build_object('id',id,'name',name,'x',x,'y',y,'planetCount',planet_count) order by id) from public.galaxy_systems),
 'planets',(select jsonb_agg(case when p.owner_id=uid or q.user_id is not null then p.meta||jsonb_build_object('surveyed',true,'owner',case when p.owner_id is null then 'free' when p.owner_id=uid then 'mine' else 'foreign' end,'reserved',p.reserved,'commander',case when p.owner_id is null then null else left(coalesce(g.state->>'name','Commander'),30) end)
 else jsonb_build_object('id',p.id,'system',p.system,'slot',p.slot,'surveyed',false) end order by p.system,p.slot) from public.galaxy_planets p left join public.galaxy_surveys q on q.planet_id=p.id and q.user_id=uid left join public.game_saves g on g.user_id=p.owner_id),
 'missions',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'kind',m.kind,'from',m.from_id,'to',m.planet_id,'system',p.system,'slot',p.slot,'start',floor(extract(epoch from m.started_at)*1000),'arrival',floor(extract(epoch from m.arrival_at)*1000),'due',floor(extract(epoch from m.finish_at)*1000)) order by m.started_at) from public.galaxy_missions m join public.galaxy_planets p on p.id=m.planet_id where m.user_id=uid and not completed),'[]'::jsonb)) into result;
 return result;
end $$;
create or replace function public.imperium_galaxy_view()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 return public.imperium_galaxy_projection(uid);
end $$;
create or replace function public.imperium_galaxy_sync(p_expected bigint,p_kind text default null,p_from text default null,p_to text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); s jsonb; v_revision bigint; m record; destination record; origin jsonb; idx integer; ship text; available integer; dist numeric; seconds integer; fuel integer; cargo integer; level integer; start jsonb; colony jsonb; changed boolean:=false; report_title text; seq bigint;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 select g.state,g.revision into s,v_revision from public.game_saves g where g.user_id=uid for update;
 if s is null then raise exception 'SAVE_REQUIRED'; end if;
 if p_expected is distinct from v_revision then raise exception 'SAVE_CONFLICT'; end if;
 start:=public.imperium_galaxy_start(uid);
 if s->'galaxy' is distinct from start then s:=jsonb_set(s,'{galaxy}',start);changed:=true;end if;
 -- Resolve only this user's flights. A planet reservation prevents races.
 for m in select * from public.galaxy_missions where user_id=uid and not completed and finish_at<=now() order by finish_at for update loop
  if m.kind='scan' then
   select (ordinality-1)::integer,value into idx,origin from jsonb_array_elements(s->'planets') with ordinality where value->>'id'=m.from_id;
   if origin is null then raise exception 'ORIGIN_MISSING';end if;
   s:=jsonb_set(s,array['planets',idx::text,'ships','longProbe'],to_jsonb(coalesce((origin->'ships'->>'longProbe')::integer,0)+1));
   insert into public.galaxy_surveys(user_id,planet_id) values(uid,m.planet_id) on conflict(user_id,planet_id) do nothing;
   report_title:='Fernsonde zurückgekehrt';
  else
   select * into destination from public.galaxy_planets where id=m.planet_id for update;
   if destination.owner_id is distinct from uid or not destination.reserved then raise exception 'RESERVATION_MISSING';end if;
   if not exists(select 1 from jsonb_array_elements(s->'planets') p where p->>'id'=m.planet_id) then
    colony:=destination.meta||jsonb_build_object('resources',jsonb_build_object('metal',350,'crystal',250,'fuel',100),'depot',jsonb_build_object('metal',0,'crystal',0,'fuel',0),'reserves',jsonb_build_object('metal',0,'crystal',0,'fuel',0),'buildings',jsonb_build_object('metal',0,'crystal',0,'fuel',0,'solar',2,'warehouse',0,'lab',0,'shipyard',0,'robotics',0,'tidal',0),'ships',jsonb_build_object('probe',0,'transport',0,'colony',0,'kurier',0,'karawane',0,'atlas',0,'arche',0,'falke',0,'waechter',0,'donner',0,'titan',0,'longProbe',0,'starColony',0),'build',null,'shipjob',null);
    s:=jsonb_set(s,'{planets}',(s->'planets')||jsonb_build_array(colony));
   end if;
   update public.galaxy_planets set reserved=false where id=m.planet_id;
   report_title:='Galaxiekolonie gegründet';
  end if;
  seq:=coalesce((s->>'seq')::bigint,0)+1;s:=jsonb_set(s,'{seq}',to_jsonb(seq));
  s:=jsonb_set(s,'{reports}',(select coalesce(jsonb_agg(value order by ordinality),'[]'::jsonb) from jsonb_array_elements(jsonb_build_array(jsonb_build_object('id',seq,'time',(s->>'time')::numeric,'title',report_title,'body',m.planet_id))||(s->'reports')) with ordinality where ordinality<=60));
  update public.galaxy_missions set completed=true where id=m.id;changed:=true;
 end loop;
 if p_kind is not null then
  if p_kind not in ('scan','colony') then raise exception 'INVALID_MISSION';end if;
  if (select count(*) from public.galaxy_missions where user_id=uid and not completed)>=100 then raise exception 'TOO_MANY_MISSIONS';end if;
  if public.imperium_rank_int(s->'tech'->'ramjet',5)<1 then raise exception 'RAMJET_REQUIRED';end if;
  select (ordinality-1)::integer,value into idx,origin from jsonb_array_elements(s->'planets') with ordinality where value->>'id'=p_from;
  if origin is null then raise exception 'ORIGIN_MISSING';end if;
  select * into destination from public.galaxy_planets where id=p_to for update;
  if destination.id is null then raise exception 'UNKNOWN_PLANET';end if;
  ship:=case when p_kind='scan' then 'longProbe' else 'starColony' end;
  available:=public.imperium_rank_int(origin->'ships'->ship,1000000);
  if available<1 then raise exception 'SHIP_REQUIRED';end if;
  if p_kind='scan' and exists(select 1 from public.galaxy_missions where user_id=uid and planet_id=p_to and kind='scan' and not completed) then raise exception 'SCAN_UNDERWAY';end if;
  if p_kind='colony' then
   if not exists(select 1 from public.galaxy_surveys where user_id=uid and planet_id=p_to) then raise exception 'SURVEY_REQUIRED';end if;
   if destination.owner_id is not null then raise exception 'PLANET_TAKEN';end if;
   if (select count(*) from public.galaxy_planets where owner_id=uid)>=greatest(0,public.imperium_rank_int(s->'tech'->'colonization',6)-3) then raise exception 'COLONY_LIMIT';end if;
  end if;
  level:=public.imperium_rank_int(s->'tech'->'ramjet',5);
  dist:=greatest(1,sqrt(power(case when origin->>'id' like 'g-%' then (origin->>'x')::numeric else (start->>'x')::numeric end-(destination.meta->>'x')::numeric,2)+power(case when origin->>'id' like 'g-%' then (origin->>'y')::numeric else (start->>'y')::numeric end-(destination.meta->>'y')::numeric,2))/40+destination.slot*.15);
  seconds:=ceil((60+dist*25)/(1+level*.12));fuel:=ceil(dist*(case when p_kind='scan' then 6 else 18 end)/(1+level*.12));
  cargo:=case when p_kind='colony' then 100 else 0 end;
  if (origin->'resources'->>'fuel')::numeric<fuel+cargo or (p_kind='colony' and ((origin->'resources'->>'metal')::numeric<350 or (origin->'resources'->>'crystal')::numeric<250)) then raise exception 'RESOURCES_REQUIRED';end if;
  s:=jsonb_set(s,array['planets',idx::text,'ships',ship],to_jsonb(available-1));
  s:=jsonb_set(s,array['planets',idx::text,'resources','fuel'],to_jsonb((origin->'resources'->>'fuel')::numeric-fuel-cargo));
  if p_kind='colony' then
   s:=jsonb_set(s,array['planets',idx::text,'resources','metal'],to_jsonb((origin->'resources'->>'metal')::numeric-350));
   s:=jsonb_set(s,array['planets',idx::text,'resources','crystal'],to_jsonb((origin->'resources'->>'crystal')::numeric-250));
   update public.galaxy_planets set owner_id=uid,reserved=true where id=p_to;
  end if;
  insert into public.galaxy_missions(user_id,kind,from_id,planet_id,arrival_at,finish_at) values(uid,p_kind,p_from,p_to,now()+seconds*interval '1 second',now()+seconds*(case when p_kind='scan' then 2 else 1 end)*interval '1 second');
  changed:=true;
 end if;
 if changed then v_revision:=v_revision+1;update public.game_saves set state=s,revision=v_revision,updated_at=now() where user_id=uid;end if;
 return jsonb_build_object('state',s,'revision',v_revision,'galaxy',public.imperium_galaxy_projection(uid));
end $$;
-- Save guard: shared colonies cannot be forged, removed by an old export, or have their secret metadata rewritten.
create or replace function public.save_imperium(p_state jsonb,p_expected bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); next_revision bigint; p jsonb; meta jsonb; begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_expected is null or p_expected<0 or p_state is null or jsonb_typeof(p_state)<>'object' or p_state->>'version' is distinct from '1' or octet_length(p_state::text)>2000000 then raise exception 'INVALID_SAVE';end if;
 if exists(select 1 from public.galaxy_starts where user_id=uid) then p_state:=jsonb_set(p_state,'{galaxy}',(select jsonb_build_object('x',x,'y',y) from public.galaxy_starts where user_id=uid));end if;
 -- Serialize with galaxy_sync, including imports/reset on another device.
 perform 1 from public.game_saves where user_id=uid for update;
 if exists(select 1 from public.galaxy_planets gp where gp.owner_id=uid and not gp.reserved and not exists(select 1 from jsonb_array_elements(p_state->'planets') q where q->>'id'=gp.id)) then raise exception 'GALAXY_COLONIES_REQUIRED';end if;
 for p in select value from jsonb_array_elements(p_state->'planets') where value->>'id' like 'g-%' loop
  select gp.meta into meta from public.galaxy_planets gp where gp.id=p->>'id' and gp.owner_id=uid and not gp.reserved;
  if meta is null or not p @> meta then raise exception 'INVALID_GALAXY_COLONY';end if;
 end loop;
 if p_expected=0 then insert into public.game_saves(user_id,state,revision) values(uid,p_state,1) on conflict(user_id) do nothing returning revision into next_revision;
 else update public.game_saves set state=p_state,revision=revision+1,updated_at=now() where user_id=uid and revision=p_expected returning revision into next_revision;end if;
 if next_revision is null then raise exception 'SAVE_CONFLICT';end if;
 return next_revision;
end $$;
revoke all on function public.imperium_galaxy_start(uuid),public.imperium_galaxy_projection(uuid),public.imperium_galaxy_view(),public.imperium_galaxy_sync(bigint,text,text,text),public.save_imperium(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.imperium_galaxy_view(),public.imperium_galaxy_sync(bigint,text,text,text),public.save_imperium(jsonb,bigint) to authenticated;

-- Extend ranking with interstellar ships and up to six colonies.
create or replace function public.imperium_rank_points(s jsonb)
returns table(building_points bigint,research_points bigint,fleet_points bigint,colonies integer)
language plpgsql immutable set search_path = '' as $$
declare
 costs constant jsonb := '{"buildings":{"metal":[80,35,0],"crystal":[65,60,0],"fuel":[90,50,0],"solar":[75,40,0],"warehouse":[120,60,0],"lab":[150,100,0],"shipyard":[200,100,0],"robotics":[400,300,60],"tidal":[700,450,80]},"tech":{"scout":[100,100,30],"logistics":[150,120,40],"colonization":[350,250,100],"drive":[200,150,80],"engineering":[250,200,40],"energy":[200,180,50],"military":[300,220,80],"ramjet":[600,450,200],"impulse":[1800,1400,650],"hyperspace":[5500,4200,2000]},"ships":{"probe":[90,60,20],"transport":[180,100,40],"colony":[500,300,100],"kurier":[140,80,30],"karawane":[800,450,180],"atlas":[2400,1400,600],"arche":[7600,4400,2000],"falke":[240,150,60],"waechter":[900,600,220],"donner":[3000,1800,700],"titan":[9500,6500,2500],"longProbe":[280,200,80],"starColony":[1200,850,400]}}'::jsonb;
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
    fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(p->'ships'->item.key,1000000);
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
  for base in select value from jsonb_array_elements(coalesce(costs->'ships'->(m->>'ship'),'[]'::jsonb)) loop
   fleet_total := fleet_total + (base #>> '{}')::numeric * public.imperium_rank_int(m->'count',100);
  end loop;
 end loop;
 return query select floor(buildings_total/100)::bigint,floor(research_total/100)::bigint,
 floor(fleet_total/100)::bigint,greatest(0,least(7,jsonb_array_length(planets))-1);
end $$;
revoke all on function public.imperium_rank_points(jsonb) from public,anon,authenticated;


-- Include ships bound to authoritative galaxy flights in fleet scoring.
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
  from public.game_saves g cross join lateral public.imperium_rank_points(jsonb_set(g.state,'{missions}',coalesce(g.state->'missions','[]'::jsonb)||coalesce((select jsonb_agg(jsonb_build_object('ship',case when gm.kind='scan' then 'longProbe' else 'starColony' end,'count',1)) from public.galaxy_missions gm where gm.user_id=g.user_id and not gm.completed),'[]'::jsonb))) p
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
