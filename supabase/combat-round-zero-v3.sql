-- Paket 3: Combat v3. Runde 0 in gespeicherten Kampfprotokollen zulassen.
-- ZUERST in Supabase SQL Editor ausfuehren, DANACH den neuen game-command deployen.
-- Historische v2-Berichte bleiben unveraendert; idempotent.
begin;
alter table public.pvp_battle_rounds drop constraint if exists pvp_battle_rounds_round_check;
alter table public.pvp_battle_rounds add constraint pvp_battle_rounds_round_check check(round between 0 and 6);
create or replace function public.imperium_store_battle_log()
returns trigger language plpgsql security definer set search_path='' as $$
declare trace jsonb:=new.data->'report'->'trace'; q jsonb; old_header jsonb; h jsonb;
begin
 if trace is null then return new;end if;
 if (trace->>'version')::integer<>1 or (trace->>'ruleVersion')::integer not in (2,3) or jsonb_typeof(trace->'rounds')<>'array' or jsonb_array_length(trace->'rounds')>7 then raise exception 'INVALID_BATTLE_TRACE';end if;
 h=(trace-'rounds')||jsonb_build_object('summary',(new.data->'report')-'trace','from',new.data->>'from','to',new.data->>'to');
 select header into old_header from public.pvp_battle_logs where mission_id=new.id;
 if old_header is not null and old_header is distinct from h then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
 insert into public.pvp_battle_logs(mission_id,attacker_id,defender_id,occurred_at,header)
 values(new.id,new.attacker_id,new.defender_id,new.arrival_at,h) on conflict do nothing;
 for q in select value from jsonb_array_elements(trace->'rounds') loop
  if exists(select 1 from public.pvp_battle_rounds where mission_id=new.id and round=(q->>'round')::integer and data is distinct from q) then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
  insert into public.pvp_battle_rounds(mission_id,round,data) values(new.id,(q->>'round')::integer,q) on conflict do nothing;
 end loop;
 -- Keep snapshots, report lists and subsequent commits compact.
 new.data=jsonb_set(new.data,'{report}',((new.data->'report')-'trace')||jsonb_build_object('traceAvailable',true));
 return new;
end $$;
drop trigger if exists imperium_store_battle_log on public.pvp_attacks;
create trigger imperium_store_battle_log before insert or update of data on public.pvp_attacks
 for each row execute function public.imperium_store_battle_log();

create or replace function public.imperium_battle_log(p_mission uuid,p_round integer default null,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); h public.pvp_battle_logs; q jsonb; result jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_offset<0 or (p_round is not null and p_round not between 0 and 6) then raise exception 'INVALID_PAGE';end if;
 select * into h from public.pvp_battle_logs where mission_id=p_mission and uid in (attacker_id,defender_id);
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
revoke all on function public.imperium_store_battle_log(),public.imperium_battle_log(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.imperium_battle_log(uuid,integer,integer) to authenticated;

commit;
