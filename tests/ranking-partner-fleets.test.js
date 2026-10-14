import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const owner='00000000-0000-0000-0000-000000000001';
const host='00000000-0000-0000-0000-000000000002';
test('Partner fleets retain owner points through travel, defense, losses and homecoming',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create schema auth;create role anon;create role authenticated;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.game_saves(user_id uuid,state jsonb);
   create table public.galaxy_missions(user_id uuid,kind text,completed boolean);
   create table public.pvp_attacks(attacker_id uuid,status text,data jsonb);
   create table public.partner_world(id boolean,data jsonb);
   alter table public.partner_world enable row level security;
   revoke all on public.partner_world from public,anon,authenticated;`);
  const base=readFileSync('supabase/leaderboard.sql','utf8');
  await db.exec(base.slice(base.indexOf('create or replace function public.imperium_rank_int'),base.indexOf('create or replace function public.imperium_rank_points')));
  const old=readFileSync('supabase/fix-ranking-inflight-pvp.sql','utf8');
  await db.exec(old);
  const save=(name,ships)=>JSON.stringify({version:1,name,planets:[{buildings:{},ships}],tech:{},missions:[]});
  await db.query('insert into public.game_saves values($1,$2),($3,$4)',[owner,save('Owner',{}),host,save('Host',{})]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
  const missions=async rows=>{await db.exec('delete from public.partner_world');await db.query('insert into public.partner_world values(true,$1)',[JSON.stringify({socialMissions:rows})]);};
  const scores=async()=>(await db.query('select * from public.imperium_leaderboard()')).rows;
  const points=async()=>Number((await scores()).find(r=>r.is_me).fleet_points);
  await missions([{owner,host,status:'stationed',kind:'support',fleet:{titan:50}}]);
  assert.equal(await points(),0,'reproduce regression in previous deployed SQL');
  const fix=readFileSync('supabase/fix-ranking-partner-fleets.sql','utf8');
  await db.exec(fix);await db.exec(fix);
  assert.equal(await points(),9250);
  assert.equal(Number((await scores()).find(r=>!r.is_me).fleet_points),0,'host does not own supporting ships');
  for(const kind of ['support','delivery','trade'])for(const status of ['outbound','stationed','returning']){
   await missions([{owner,host,status,kind,fleet:{titan:50}}]);
   assert.equal(await points(),9250,kind+' '+status);
  }
  await missions([{owner,host,status:'returning',fleet:{titan:30},awaitingUnload:true}]);
  assert.equal(await points(),5550,'only survivors, including blocked unloading');
  for(const status of ['returned','lost']){
   await missions([{owner,host,status,fleet:{titan:50}}]);assert.equal(await points(),0,status);
  }
  await db.query('update public.game_saves set state=$1 where user_id=$2',[save('Owner',{titan:50}),owner]);
  await missions([{owner,host,status:'returned',fleet:{titan:50}}]);assert.equal(await points(),9250,'returned ships are counted once in hangar');
  await db.query("insert into public.pvp_attacks values($1,'outbound',$2),($1,'returning',$3),($1,'returned',$2)",[owner,JSON.stringify({fleet:{titan:10}}),JSON.stringify({fleet:{titan:10},survivors:{titan:3}})]);
  await db.query("insert into public.galaxy_missions values($1,'scan',false),($1,'scan',true)",[owner]);
  await missions([{owner,host,status:'stationed',fleet:{titan:10}}]);
  assert.equal(await points(),13510,'hangar + PvP outbound/survivors + active probe + partner defense');
  await db.exec('set role authenticated');assert.equal(await points(),13510);
  await assert.rejects(db.query('select * from public.partner_world'),/permission denied/);
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  await assert.rejects(scores(),/AUTH_REQUIRED/);
  await db.exec('reset role;set role anon');await assert.rejects(scores(),/permission denied/);
 }finally{await db.close();}
});
