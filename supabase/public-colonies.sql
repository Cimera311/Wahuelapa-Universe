-- Run after galaxy.sql and player-systems.sql. Repeatable; preserves colonies and saves.
-- Ownership and reservations are public to signed-in players; planet properties require a survey.
begin;
create or replace function public.imperium_galaxy_projection(uid uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 -- Scan data becomes visible at arrival; returning probe remains in flight.
 insert into public.galaxy_surveys(user_id,planet_id)
 select uid,planet_id from public.galaxy_missions where user_id=uid and kind='scan' and arrival_at<=now()
 on conflict(user_id,planet_id) do nothing;
 select jsonb_build_object('serverNow',floor(extract(epoch from now())*1000),'start',public.imperium_galaxy_start(uid),
 'players',coalesce((select jsonb_agg(jsonb_build_object('id',md5(gs.user_id::text),'name',left(coalesce(nullif(btrim(g.state->>'systemName'),''),'Sonnensystem'),30),'commander',left(coalesce(g.state->>'name','Commander'),30),'x',gs.x,'y',gs.y,'is_me',gs.user_id=uid) order by gs.user_id) from public.galaxy_starts gs join public.game_saves g on g.user_id=gs.user_id),'[]'::jsonb),
 'systems',(select jsonb_agg(jsonb_build_object('id',id,'name',name,'x',x,'y',y,'planetCount',planet_count) order by id) from public.galaxy_systems),
 'planets',(select jsonb_agg(case when p.owner_id=uid or q.user_id is not null then p.meta||jsonb_build_object('surveyed',true,'owner',case when p.owner_id is null then 'free' when p.owner_id=uid then 'mine' else 'foreign' end,'reserved',p.reserved,'commander',case when p.owner_id is null then null else left(coalesce(g.state->>'name','Commander'),30) end)
 else jsonb_build_object('id',p.id,'system',p.system,'slot',p.slot,'surveyed',false,'owner',case when p.owner_id is null then 'free' when p.owner_id=uid then 'mine' else 'foreign' end,'reserved',p.reserved,'commander',case when p.owner_id is null then null else left(coalesce(g.state->>'name','Commander'),30) end) end order by p.system,p.slot) from public.galaxy_planets p left join public.galaxy_surveys q on q.planet_id=p.id and q.user_id=uid left join public.game_saves g on g.user_id=p.owner_id),
 'missions',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'kind',m.kind,'from',m.from_id,'to',m.planet_id,'system',p.system,'slot',p.slot,'start',floor(extract(epoch from m.started_at)*1000),'arrival',floor(extract(epoch from m.arrival_at)*1000),'due',floor(extract(epoch from m.finish_at)*1000)) order by m.started_at) from public.galaxy_missions m join public.galaxy_planets p on p.id=m.planet_id where m.user_id=uid and not completed),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.imperium_galaxy_projection(uuid) from public,anon,authenticated;
commit;
