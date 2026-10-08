-- Run once in the Supabase SQL Editor. No passwords or secret keys in this file.
create table if not exists public.game_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null check (jsonb_typeof(state) = 'object' and state->>'version' = '1' and octet_length(state::text) <= 2000000),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.game_saves enable row level security;
drop policy if exists "Read own Imperium save" on public.game_saves;
create policy "Read own Imperium save" on public.game_saves for select to authenticated using ((select auth.uid()) = user_id);
-- Writes are only possible through the atomic function, never directly from clients.
revoke all on public.game_saves from anon, authenticated;
grant select on public.game_saves to authenticated;
create or replace function public.save_imperium(p_state jsonb, p_expected bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); next_revision bigint;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_expected is null or p_expected < 0 or p_state is null or jsonb_typeof(p_state) <> 'object' or p_state->>'version' is distinct from '1' or octet_length(p_state::text) > 2000000 then raise exception 'INVALID_SAVE'; end if;
 if p_expected = 0 then
  insert into public.game_saves(user_id,state,revision) values(uid,p_state,1)
  on conflict (user_id) do nothing returning revision into next_revision;
 else
  update public.game_saves set state=p_state,revision=revision+1,updated_at=now()
  where user_id=uid and revision=p_expected returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'SAVE_CONFLICT'; end if;
 return next_revision;
end $$;
revoke all on function public.save_imperium(jsonb,bigint) from public, anon;
grant execute on function public.save_imperium(jsonb,bigint) to authenticated;
