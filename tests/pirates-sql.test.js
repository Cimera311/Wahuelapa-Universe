import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {runServerCommand} from '../src/server-service.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {vector} from '../src/config.js';

test('PvE SQL: role boundaries, persistent scans/battles, receipt retries, ranking and atomic epochs',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-log-pagination.sql','partnerships.sql','pvp-sync-performance.sql','repair-dock.sql','fix-ranking-partner-fleets.sql','pirates-admin.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 await db.exec(readFileSync('supabase/pirates-admin.sql','utf8'));
 const seed=fixture();for(const row of seed.saves){await db.query('insert into auth.users values($1)',[row.user_id]);const p=row.state.planets[0];p.buildings.warehouse=8;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.resources=vector([20000,20000,20000]);p.ships.falke=100;p.ships.karawane=10;p.ships.spyProbe=3;await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[row.user_id,JSON.stringify(row.state)]);}
 await db.query('insert into public.pvp_admins(user_id) values($1) on conflict do nothing',[A]);
 let now=T,seq=0;
 const rpc={async rpc(name,p){try{const r=name==='imperium_pvp_snapshot'?await db.query('select public.imperium_pvp_snapshot($1,$2) as data',[p.p_uid,p.p_request_id]):await db.query('select public.imperium_pvp_commit($1,$2,$3,$4,$5) as data',[JSON.stringify(p.p_world),p.p_expected,p.p_uid,p.p_request_id,JSON.stringify(p.p_payload)]);if(name==='imperium_pvp_snapshot')r.rows[0].data.now=now;return {data:r.rows[0].data};}catch(e){return {error:{message:e.message}};}},from(){return {select(){return {eq(_,id){return {async maybeSingle(){return {data:(await db.query('select state,revision from public.game_saves where user_id=$1',[id])).rows[0]};}};}};}};}};
 const request=action=>({type:'pirate',requestId:'80000000-0000-0000-0000-'+String(++seq).padStart(12,'0'),action});
 const call=(action,uid=A)=>runServerCommand(rpc,uid,request(action));
 const opened=await call({op:'open'});assert.equal(opened.pvp.pirates.stations.length,5);
 await t.test('Ordinary players can open and scan personal targets; configuration and raw RPCs remain protected',async()=>{
  const before=(await db.query('select data from public.pirate_world')).rows[0].data;
  await db.exec(readFileSync('supabase/pirates-public.sql','utf8'));await db.exec(readFileSync('supabase/pirates-public.sql','utf8'));
  assert.deepEqual((await db.query('select data from public.pirate_world')).rows[0].data,before);
  const opened=await call({op:'open'},B);assert.equal(opened.pvp.pirates.stations.length,5);assert.equal(opened.pvp.pirates.config.stations,undefined);
  await assert.rejects(call({op:'configure',config:{enabled:false}},B),/Administrator/);
  const snap=(await rpc.rpc('imperium_pvp_snapshot',{p_uid:B,p_request_id:null})).data;
  const denied=await rpc.rpc('imperium_pvp_commit',{p_world:snap,p_expected:snap.settings.epoch,p_uid:B,p_request_id:null,p_payload:{type:'pirate',action:{op:'configure'}}});assert.match(denied.error.message,/ADMIN_REQUIRED/);
  const scan=await call({op:'scan',from:'home',station:'smugglers'},B);assert.equal(scan.state.planets[0].ships.spyProbe,2);assert.equal(scan.pvp.pirates.missions.length,1);
  assert.equal((await runServerCommand(rpc,A,{type:'sync'})).pvp.pirates.missions.length,0);
  for(const role of ['anon','authenticated']){await db.exec('set role '+role);for(const q of ['select * from public.pirate_world','select public.imperium_pvp_snapshot(null,null)','select public.imperium_pvp_snapshot_before_pirates(null,null)'])await assert.rejects(db.query(q),/permission denied/);await db.exec('reset role');}
 });
 const rank=async()=>{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);return (await db.query('select * from public.imperium_leaderboard() where is_me')).rows[0].fleet_points;};
 await t.test('Scan consumes a probe only once, does not change fleet points, and reveals data at arrival',async()=>{
  const before=await rank(),req=request({op:'scan',from:'home',station:'smugglers'});let one=await runServerCommand(rpc,A,req);const mission=one.pvp.pirates.missions[0];
  assert.equal(one.pvp.pirates.stations[0].scan,null);assert.equal(await rank(),before);
  one=await runServerCommand(rpc,A,req);assert.equal(one.state.planets[0].ships.spyProbe,2);assert.equal(one.pvp.pirates.missions.length,1);
  now=mission.arrivalAt;one=await runServerCommand(rpc,A,{type:'sync'});assert.equal(one.pvp.pirates.stations[0].scan.fleet.falke,3);
  now=mission.arrivalAt+mission.duration;one=await runServerCommand(rpc,A,{type:'sync'});assert.equal(one.state.planets[0].ships.spyProbe,3);assert.equal(await rank(),before);
 });
 await t.test('World epoch conflicts reject PvE writes without any partial updates',async()=>{
  const snap=(await rpc.rpc('imperium_pvp_snapshot',{p_uid:A,p_request_id:null})).data;
  const before=(await db.query('select data from public.pirate_world')).rows[0].data;
  const r=await rpc.rpc('imperium_pvp_commit',{p_world:{...snap,pirateConfig:{enabled:false}},p_expected:snap.settings.epoch-1,p_uid:A,p_request_id:null,p_payload:{type:'sync'}});assert.equal(r.data,false);assert.deepEqual((await db.query('select data from public.pirate_world')).rows[0].data,before);
 });
 await t.test('Attack cargo and survivors persist, no duplicate launch or reward on lost-response retry',async()=>{
  const before=await rank(),req=request({op:'attack',station:'smugglers',from:'home',fleet:{falke:100,karawane:1}});let one=await runServerCommand(rpc,A,req);const m=one.pvp.pirates.missions[0];assert.equal(await rank(),before);
  assert.equal((await runServerCommand(rpc,A,req)).pvp.pirates.missions.length,1);
  now=m.arrivalAt;one=await runServerCommand(rpc,A,{type:'sync'});assert.equal(one.pvp.pirates.reports[0].outcome,'attacker');assert.ok(one.pvp.pirates.stations[0].debris.metal>0);
  now=m.arrivalAt+m.duration;one=await runServerCommand(rpc,A,{type:'sync'});const stock=one.state.planets[0].resources.metal;assert.equal(one.pvp.pirates.missions.length,0);assert.equal((await runServerCommand(rpc,A,req)).state.planets[0].resources.metal,stock);assert.equal(one.pvp.pirates.reports.length,1);
  await assert.rejects(call({op:'attack',station:'smugglers',from:'home',fleet:{falke:1}}),/Cooldown/);
  const other=(await runServerCommand(rpc,B,{type:'sync'})).pvp.pirates;assert.equal(other.reports.length,0);assert.equal(other.stations[0].defeated,false);assert.equal(other.stations[0].nextAttackAt,0);
 });
 await t.test('Deleted accounts cannot leave orphaned missions that block world updates',async()=>{
  await db.exec(`update public.pirate_world set data=jsonb_set(data,'{piratePlayers}',data->'piratePlayers'||'[ {"user_id":"00000000-0000-0000-0000-000000000099","stations":{},"missions":[],"reports":[]} ]'::jsonb)`);
  await runServerCommand(rpc,A,{type:'sync'});
  assert.equal((await db.query("select jsonb_array_length(data->'piratePlayers') as n from public.pirate_world")).rows[0].n,2);
 });
 await t.test('Reinstallation preserves state; unchanged world data is not rewritten every sync',async()=>{
  const prior=(await db.query('select data from public.pirate_world')).rows[0].data;await db.exec(readFileSync('supabase/pirates-admin.sql','utf8'));assert.deepEqual((await db.query('select data from public.pirate_world')).rows[0].data,prior);
  const before=(await db.query('select xmin::text as v from public.pirate_world')).rows[0].v;await runServerCommand(rpc,A,{type:'sync'});assert.equal((await db.query('select xmin::text as v from public.pirate_world')).rows[0].v,before);
 });
});
