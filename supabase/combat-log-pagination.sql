-- Update an already installed combat-logs.sql. Safe to rerun.
-- Removes only the fixed 40,000-entry offset limit; pages still contain 200 entries.
begin;
create or replace function public.imperium_battle_log(p_mission uuid,p_round integer default null,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); h public.pvp_battle_logs; q jsonb; result jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_offset<0 or (p_round is not null and p_round not between 1 and 6) then raise exception 'INVALID_PAGE';end if;
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
