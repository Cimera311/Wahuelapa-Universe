-- Run after pvp.sql. Persistent private reports; no Edge Function update required.
begin;
create table if not exists public.game_reports(
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null,
 occurred_at timestamptz not null,
 kind text not null,
 title text not null,
 body text not null default '',
 mission_id text,
 outcome text,
 payload jsonb not null default '{}'::jsonb,
 archived boolean not null default false,
 primary key(user_id,id)
);
create index if not exists game_reports_list on public.game_reports(user_id,archived,occurred_at desc,id);
create index if not exists game_reports_mission on public.game_reports(user_id,mission_id) where mission_id is not null;
alter table public.game_reports enable row level security;
revoke all on public.game_reports from public,anon,authenticated;

create or replace function public.imperium_capture_save_reports(p_user uuid,p_state jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare r jsonb; category text;
begin
 for r in select value from jsonb_array_elements(coalesce(p_state->'reports','[]'::jsonb)) loop
  -- Detailed combat reports come from the attack record and must not be duplicated.
  if r->>'title'='PvP-Kampfbericht' then continue; end if;
  category=case when r->>'title' ilike '%sonde%' or r->>'title' ilike '%entdeckt%' then 'scan'
   when r->>'title' ilike '%koloni%' then 'colony'
   when r->>'title' ilike '%transport%' or r->>'title' ilike '%liefer%' or r->>'title' ilike '%route%' or r->>'title' ilike '%flotte%' then 'transport'
   else 'other' end;
  insert into public.game_reports(user_id,id,occurred_at,kind,title,body)
  values(p_user,'local:'||(r->>'id'),to_timestamp((r->>'time')::double precision/1000),category,left(r->>'title',100),left(coalesce(r->>'body',''),1000))
  on conflict(user_id,id) do nothing;
 end loop;
end $$;
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
  foreach side in array array[p.attacker_id,p.defender_id] loop
   result=case when r->>'outcome'='cancelled' then 'cancelled' when r->>'outcome'='draw' then 'draw'
    when (r->>'outcome'='attacker')=(side=p.attacker_id) then 'win' else 'loss' end;
   insert into public.game_reports(user_id,id,occurred_at,kind,title,mission_id,outcome,payload)
   values(side,'attack:'||p.id||':battle',to_timestamp((r->>'at')::double precision/1000),'battle','Gefecht',p.id::text,result,
    r||jsonb_build_object('from',p.data->>'from','to',p.data->>'to','ownSide',case when side=p.attacker_id then 'attacker' else 'defender' end,'commander',(select state->>'name' from public.game_saves where user_id=case when side=p.attacker_id then p.defender_id else p.attacker_id end)))
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
create or replace function public.imperium_reports_save_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.imperium_capture_save_reports(new.user_id,new.state);return new;end $$;
create or replace function public.imperium_reports_attack_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.imperium_capture_attack_reports(new);return new;end $$;
drop trigger if exists imperium_reports_save_insert on public.game_saves;
create trigger imperium_reports_save_insert after insert on public.game_saves for each row execute function public.imperium_reports_save_trigger();
drop trigger if exists imperium_reports_save_update on public.game_saves;
create trigger imperium_reports_save_update after update of state on public.game_saves for each row
 when ((old.state->'reports') is distinct from (new.state->'reports')) execute function public.imperium_reports_save_trigger();
drop trigger if exists imperium_reports_attack on public.pvp_attacks;
create trigger imperium_reports_attack after insert or update of data,status on public.pvp_attacks for each row execute function public.imperium_reports_attack_trigger();
do $$ declare r record; a public.pvp_attacks; begin
 for r in select user_id,state from public.game_saves loop perform public.imperium_capture_save_reports(r.user_id,r.state);end loop;
 for a in select * from public.pvp_attacks loop perform public.imperium_capture_attack_reports(a);end loop;
end $$;

create or replace function public.imperium_reports(p_archived boolean default false,p_kind text default null,p_outcome text default null,p_search text default '',p_since bigint default null,p_offset integer default 0,p_mission text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_offset<0 or p_offset>1000000 or length(coalesce(p_search,''))>80 then raise exception 'INVALID_FILTER';end if;
 with matches as (
  select r.* from public.game_reports r where r.user_id=uid
   and (p_archived is null or r.archived=p_archived)
   and (p_kind is null or r.kind=p_kind) and (p_outcome is null or r.outcome=p_outcome)
   and (p_since is null or r.occurred_at>=to_timestamp(p_since::double precision/1000))
   and (p_mission is null or r.mission_id=p_mission)
   and (coalesce(p_search,'')='' or position(lower(p_search) in lower(r.title||' '||r.body||' '||coalesce(r.payload->>'from','')||' '||coalesce(r.payload->>'to','')||' '||coalesce(r.payload->>'commander','')))>0)
 ), page as (select * from matches order by occurred_at desc,id desc limit 50 offset p_offset)
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'time',extract(epoch from occurred_at)*1000,'kind',kind,'title',title,'body',body,'missionId',mission_id,'outcome',outcome,'payload',payload,'archived',archived) order by occurred_at desc,id desc) from page),'[]'::jsonb),'total',(select count(*) from matches)) into result;
 return result;
end $$;
create or replace function public.imperium_archive_reports(p_ids text[],p_archived boolean)
returns integer language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); changed integer;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_ids is null or cardinality(p_ids)>50 or p_archived is null then raise exception 'INVALID_SELECTION';end if;
 update public.game_reports set archived=p_archived where user_id=uid and id=any(p_ids);
 get diagnostics changed=row_count;return changed;
end $$;
revoke all on function public.imperium_capture_save_reports(uuid,jsonb),public.imperium_capture_attack_reports(public.pvp_attacks),public.imperium_reports_save_trigger(),public.imperium_reports_attack_trigger() from public,anon,authenticated;
revoke all on function public.imperium_reports(boolean,text,text,text,bigint,integer,text),public.imperium_archive_reports(text[],boolean) from public,anon,authenticated;
grant execute on function public.imperium_reports(boolean,text,text,text,bigint,integer,text),public.imperium_archive_reports(text[],boolean) to authenticated;
commit;
