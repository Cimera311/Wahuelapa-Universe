-- Combat v6: accept compact v4/v5/v6 traces alongside unchanged v2/v3 logs.
-- Apply only after the corresponding game-command/UI release is ready.
-- Idempotent. Keeps historical battle rows immutable and preserves access control.
begin;
create or replace function public.imperium_store_battle_log()
returns trigger language plpgsql security definer set search_path='' as $$
declare trace jsonb:=new.data->'report'->'trace'; q jsonb; old_header jsonb; h jsonb;
begin
 if trace is null then return new;end if;
 if NOT (
   ((trace->>'version')::integer=1 and (trace->>'ruleVersion')::integer in (2,3)) or
   ((trace->>'version')::integer=2 and (trace->>'ruleVersion')::integer in (4,5,6) and
    jsonb_typeof(trace->'initialGroups')='array' and
    jsonb_typeof(trace->'finalGroups')='array')
 ) or jsonb_typeof(trace->'rounds')<>'array' or
 jsonb_array_length(trace->'rounds')>7 then raise exception 'INVALID_BATTLE_TRACE';end if;
 h=(trace-'rounds')||jsonb_build_object('summary',(new.data->'report')-'trace','from',new.data->>'from','to',new.data->>'to');
 select header into old_header from public.pvp_battle_logs where mission_id=new.id;
 if old_header is not null and old_header is distinct from h then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
 insert into public.pvp_battle_logs(mission_id,attacker_id,defender_id,occurred_at,header)
 values(new.id,new.attacker_id,new.defender_id,new.arrival_at,h) on conflict do nothing;
 for q in select value from jsonb_array_elements(trace->'rounds') loop
  if (q->>'round')::integer not between 0 and 6 or
     jsonb_typeof(q->'shots')<>'array' or jsonb_typeof(q->'impacts')<>'array' then
   raise exception 'INVALID_BATTLE_ROUND';
  end if;
  if exists(select 1 from public.pvp_battle_rounds where mission_id=new.id and round=(q->>'round')::integer and data is distinct from q) then raise exception 'BATTLE_LOG_IMMUTABLE';end if;
  insert into public.pvp_battle_rounds(mission_id,round,data) values(new.id,(q->>'round')::integer,q) on conflict do nothing;
 end loop;
 new.data=jsonb_set(new.data,'{report}',((new.data->'report')-'trace')||jsonb_build_object('traceAvailable',true));
 return new;
end $$;
revoke all on function public.imperium_store_battle_log() from public,anon,authenticated;
commit;
