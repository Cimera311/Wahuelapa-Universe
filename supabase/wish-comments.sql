-- Install after community.sql. Safe to rerun; leaves wishes and votes untouched.
begin;
create table if not exists public.community_wish_comments(
 id bigint generated always as identity primary key,
 wish_id bigint not null references public.community_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 commander text not null,
 body text not null check(char_length(body) between 1 and 1000),
 created_at timestamptz not null default now(),
 deleted boolean not null default false,
 unique(user_id,request_id)
);
create index if not exists community_wish_comments_feed on public.community_wish_comments(wish_id,id asc);
alter table public.community_wish_comments enable row level security;
revoke all on public.community_wish_comments from public,anon,authenticated;
revoke all on sequence public.community_wish_comments_id_seq from public,anon,authenticated;
create or replace function public.imperium_wish_comments(p_wish bigint,p_op text default 'list',p_id bigint default null,p_body text default '',p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); admin boolean; who text; rec public.community_wish_comments; cleaned text:=btrim(coalesce(p_body,'')); items jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if not exists(select 1 from public.community_posts p where p.id=p_wish and p.kind='wish' and not p.deleted) then raise exception 'WISH_NOT_FOUND';end if;
 select exists(select 1 from public.pvp_admins a where a.user_id=uid) into admin;
 if p_op='post' then
  if p_request is null then raise exception 'REQUEST_REQUIRED';end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,1));
  select * into rec from public.community_wish_comments c where c.user_id=uid and c.request_id=p_request;
  if found then
   if rec.wish_id<>p_wish or rec.body<>cleaned then raise exception 'REQUEST_CONFLICT';end if;
   return jsonb_build_object('id',rec.id);
  end if;
  if char_length(cleaned)<1 or char_length(cleaned)>1000 then raise exception 'INVALID_CONTENT';end if;
  select left(nullif(btrim(g.state->>'name'),''),30) into who from public.game_saves g where g.user_id=uid;
  if who is null then raise exception 'GAME_REQUIRED';end if;
  if exists(select 1 from public.community_wish_comments c where c.user_id=uid and c.created_at>now()-interval '5 seconds') then raise exception 'RATE_LIMIT';end if;
  insert into public.community_wish_comments(wish_id,user_id,request_id,commander,body) values(p_wish,uid,p_request,who,cleaned) returning * into rec;
  return jsonb_build_object('id',rec.id);
 elsif p_op='delete' then
  select * into rec from public.community_wish_comments c where c.id=p_id and c.wish_id=p_wish for update;
  if not found or rec.deleted then raise exception 'COMMENT_NOT_FOUND';end if;
  if rec.user_id<>uid and not admin then raise exception 'FORBIDDEN';end if;
  update public.community_wish_comments set deleted=true where id=p_id;
  return jsonb_build_object('id',p_id);
 elsif p_op<>'list' then raise exception 'INVALID_OPERATION';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'commander',c.commander,'body',c.body,'createdAt',c.created_at,'mine',c.user_id=uid,'deleted',c.deleted) order by c.id asc),'[]'::jsonb)
 into items from public.community_wish_comments c where c.wish_id=p_wish and not c.deleted;
 return jsonb_build_object('items',items,'isAdmin',admin);
end $$;
revoke all on function public.imperium_wish_comments(bigint,text,bigint,text,uuid) from public,anon;
grant execute on function public.imperium_wish_comments(bigint,text,bigint,text,uuid) to authenticated;
commit;