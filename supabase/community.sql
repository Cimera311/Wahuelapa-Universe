-- Run once in Supabase SQL Editor after setup.sql and pvp.sql. Safe to rerun.
-- Shared signed-in community; account IDs and email addresses never leave the RPC.
begin;
create table if not exists public.community_posts(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 kind text not null check(kind in ('chat','wish')),
 commander text not null,
 title text not null default '',
 body text not null,
 status text not null default 'open' check(status in ('open','planned','done')),
 created_at timestamptz not null default now(),
 deleted boolean not null default false,
 unique(user_id,request_id)
);
create index if not exists community_posts_feed on public.community_posts(kind,id desc);
create index if not exists community_posts_author on public.community_posts(user_id,kind,created_at desc);
create table if not exists public.community_votes(
 post_id bigint not null references public.community_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(post_id,user_id)
);
alter table public.community_posts enable row level security;
alter table public.community_votes enable row level security;
revoke all on public.community_posts,public.community_votes from public,anon,authenticated;
revoke all on sequence public.community_posts_id_seq from public,anon,authenticated;

create or replace function public.imperium_community(
 p_kind text, p_op text default 'list', p_id bigint default null,
 p_title text default '', p_body text default '', p_before bigint default null,
 p_request uuid default null, p_vote boolean default null, p_status text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); admin boolean; commander text; post public.community_posts;
 items jsonb; has_more boolean; clean_body text:=btrim(coalesce(p_body,'')); clean_title text:=btrim(coalesce(p_title,''));
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_kind is null or p_kind not in ('chat','wish') then raise exception 'INVALID_KIND'; end if;
 select exists(select 1 from public.pvp_admins a where a.user_id=uid) into admin;
 if p_op='post' then
  -- Serializes writes from all devices of one account; prevents rate-limit races.
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if p_request is null then raise exception 'REQUEST_REQUIRED'; end if;
  select * into post from public.community_posts p where p.user_id=uid and p.request_id=p_request;
  if found then
   if post.kind<>p_kind or post.body<>clean_body or post.title<>clean_title then raise exception 'REQUEST_CONFLICT'; end if;
   return jsonb_build_object('id',post.id);
  end if;
  if char_length(clean_body)<1 or char_length(clean_body)>(case when p_kind='chat' then 800 else 3000 end)
   or char_length(clean_title)>80 or (p_kind='wish' and char_length(clean_title)<3)
   or (p_kind='chat' and clean_title<>'') then raise exception 'INVALID_CONTENT'; end if;
  select left(nullif(btrim(g.state->>'name'),''),30) into commander from public.game_saves g where g.user_id=uid;
  if commander is null then raise exception 'GAME_REQUIRED'; end if;
  if exists(select 1 from public.community_posts p where p.user_id=uid and p.kind=p_kind
    and p.created_at>now()-case when p_kind='chat' then interval '5 seconds' else interval '60 seconds' end)
   then raise exception 'RATE_LIMIT'; end if;
  insert into public.community_posts(user_id,request_id,kind,commander,title,body)
   values(uid,p_request,p_kind,commander,clean_title,clean_body) returning * into post;
  return jsonb_build_object('id',post.id);
 elsif p_op in ('delete','vote','status') then
  select * into post from public.community_posts p where p.id=p_id and p.kind=p_kind for update;
  if not found or post.deleted then raise exception 'POST_NOT_FOUND'; end if;
  if p_op='delete' then
   if post.user_id<>uid and not admin then raise exception 'FORBIDDEN'; end if;
   update public.community_posts set deleted=true where id=p_id;
  elsif p_op='vote' then
   if p_kind<>'wish' or p_vote is null then raise exception 'INVALID_VOTE'; end if;
   if p_vote then insert into public.community_votes values(p_id,uid) on conflict do nothing;
   else delete from public.community_votes where post_id=p_id and user_id=uid; end if;
  else
   if not admin then raise exception 'FORBIDDEN'; end if;
   if p_kind<>'wish' or p_status is null or p_status not in ('open','planned','done') then raise exception 'INVALID_STATUS'; end if;
   update public.community_posts set status=p_status where id=p_id;
  end if;
  return jsonb_build_object('id',p_id);
 elsif p_op<>'list' or p_op is null then raise exception 'INVALID_OPERATION'; end if;
 select coalesce(jsonb_agg(row_data order by id desc),'[]'::jsonb) into items from (
  select p.id, jsonb_build_object('id',p.id,'commander',case when p.deleted then '' else p.commander end,
   'title',case when p.deleted then '' else p.title end,'body',case when p.deleted then '' else p.body end,
   'status',p.status,'createdAt',p.created_at,'deleted',p.deleted,'mine',p.user_id=uid,
   'votes',(select count(*) from public.community_votes v where v.post_id=p.id),
   'voted',exists(select 1 from public.community_votes v where v.post_id=p.id and v.user_id=uid)) row_data
  from public.community_posts p where p.kind=p_kind and (p_before is null or p.id<p_before)
  order by p.id desc limit 50
 ) feed;
 select exists(select 1 from public.community_posts p where p.kind=p_kind and p.id<
  (select min((v->>'id')::bigint) from jsonb_array_elements(items) v)) into has_more;
 return jsonb_build_object('items',items,'hasMore',has_more,'isAdmin',admin);
end $$;
revoke all on function public.imperium_community(text,text,bigint,text,text,bigint,uuid,boolean,text) from public,anon;
grant execute on function public.imperium_community(text,text,bigint,text,text,bigint,uuid,boolean,text) to authenticated;
commit;
