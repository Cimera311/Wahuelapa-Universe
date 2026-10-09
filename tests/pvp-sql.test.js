import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {runServerCommand,missionId} from '../src/server-service.js';
import {processWorld} from '../src/server-world.js';
import {newGame} from '../src/engine.js';
import {TECHS,SHIPS,vector} from '../src/config.js';
const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002',R='10000000-0000-0000-0000-000000000001';
test('PvP database and trusted command boundary',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 for(const id of [A,B]){await db.query('insert into auth.users values($1)',[id]);const s=newGame(id,Date.now());await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[id,JSON.stringify(s)]);}
 await db.exec(readFileSync('supabase/pvp.sql','utf8'));
 const uid=id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 const snapshot=async(id=A,request=null)=>(await db.query('select public.imperium_pvp_snapshot($1,$2) as data',[id,request])).rows[0].data;
 const commit=async(w,epoch,uid=A,request=null,payload={type:'sync'})=>(await db.query('select public.imperium_pvp_commit($1,$2,$3,$4,$5) as ok',[JSON.stringify(w),epoch,uid,request,JSON.stringify(payload)])).rows[0].ok;
 let fakeNow=null;
 const rpc={async rpc(name,p){try{let rows;if(name==='imperium_pvp_snapshot')rows=(await db.query('select public.imperium_pvp_snapshot($1,$2) as data',[p.p_uid,p.p_request_id])).rows;else rows=(await db.query('select public.imperium_pvp_commit($1,$2,$3,$4,$5) as data',[JSON.stringify(p.p_world),p.p_expected,p.p_uid,p.p_request_id,JSON.stringify(p.p_payload)])).rows;if(name==='imperium_pvp_snapshot'&&fakeNow!==null)rows[0].data.now=fakeNow;return {data:rows[0].data};}catch(e){return {error:{message:e.message}};}},from(){return {select(){return {eq(_,id){return {async maybeSingle(){return {data:(await db.query('select state,revision from public.game_saves where user_id=$1',[id])).rows[0]||null};}};}};}};}};
 await t.test('Authenticated users can read status but cannot forge snapshots, economic writes, settings or reports',async()=>{
  await uid(A);await db.exec('set role authenticated');
  const status=(await db.query('select public.imperium_pvp_status() as data')).rows[0].data;assert.equal(status.enabled,false);assert.equal(status.isAdmin,false);
  for(const query of ['select * from public.pvp_control','select * from public.pvp_attacks','select public.imperium_pvp_snapshot(null,null)',"select public.save_imperium('{}',1)",'select public.imperium_galaxy_sync(1,null,null,null)'])await assert.rejects(db.query(query),/permission denied/);
  await db.exec('reset role');await uid('');
 });
 await t.test('Default remains off and migration reruns preserve flag, admin and actual founding timestamp',async()=>{
  await db.query('insert into public.pvp_admins values($1)',[A]);
  await db.exec("update public.galaxy_planets set owner_id='"+B+"',reserved=false,colonized_at=now()-interval '2 days' where id='g-orion-p1'");
  const before=(await db.query("select colonized_at from public.galaxy_planets where id='g-orion-p1'")).rows[0].colonized_at;
  await db.exec(readFileSync('supabase/pvp.sql','utf8'));assert.equal((await snapshot()).settings.enabled,false);
  assert.deepEqual((await db.query("select colonized_at from public.galaxy_planets where id='g-orion-p1'")).rows[0].colonized_at,before);
 });
 await t.test('Nonadmins cannot toggle through either handler or commit; admin changes are logged',async()=>{
  await assert.rejects(runServerCommand(rpc,B,{type:'set-pvp',enabled:true,requestId:R}),/Administratoren/);
  const snap=await snapshot(B),w=processWorld(snap,B,{type:'sync'});w.settings.enabled=true;
  await assert.rejects(commit(w,snap.settings.epoch,B),/ADMIN_REQUIRED/);
  await runServerCommand(rpc,A,{type:'set-pvp',enabled:true,requestId:R});assert.equal((await snapshot()).settings.enabled,true);
  assert.equal((await db.query('select count(*)::int as n from public.pvp_switch_log')).rows[0].n,1);
 });
 await t.test('Stale concurrent world commits do not partially write or issue cargo',async()=>{
  const one=await snapshot(),two=await snapshot(),w1=processWorld(one,A,{type:'sync'}),w2=processWorld(two,B,{type:'sync'});
  assert.equal(await commit(w1,one.settings.epoch),true);const before=(await db.query('select user_id,state,revision from public.game_saves order by user_id')).rows;
  w2.saves[0].state.planets[0].resources.metal=999999;assert.equal(await commit(w2,two.settings.epoch),false);
  assert.deepEqual((await db.query('select user_id,state,revision from public.game_saves order by user_id')).rows,before);
 });
 await t.test('Lost-response retry with the same ID never builds or pays twice; changed payload is rejected',async()=>{
  const request={type:'command',requestId:'10000000-0000-0000-0000-000000000002',action:{type:'build',planet:'home',key:'metal'}};
  const first=await runServerCommand(rpc,A,request),metal=first.state.planets[0].resources.metal,job=first.state.planets[0].build;
  const retry=await runServerCommand(rpc,A,request);assert.deepEqual(retry.state.planets[0].build,job);assert.ok(retry.state.planets[0].resources.metal-metal<1);
  await assert.rejects(runServerCommand(rpc,A,{...request,action:{...request.action,key:'crystal'}}),/anders verwendet/);
  assert.equal((await db.query('select count(*)::int as n from public.pvp_requests where request_id=$1',[request.requestId])).rows[0].n,1);
 });
 await t.test('Service-role RPCs are granted explicitly; anon and authenticated never receive another save',async()=>{
  await db.exec('set role service_role');const data=await snapshot();assert.equal(data.saves.length,2);await db.exec('reset role');
  await db.exec('set role anon');await assert.rejects(db.query('select public.imperium_pvp_status()'),/permission denied/);await db.exec('reset role');
 });
 await t.test('Command endpoint validates ownership and cannot accept a forged client state',async()=>{
  const request={type:'command',requestId:'10000000-0000-0000-0000-000000000003',action:{type:'reserve',planet:'g-orion-p1',reserves:vector([0,0,0])},state:{planets:[{resources:{metal:9999999}}]}};
  await assert.rejects(runServerCommand(rpc,A,request),/Planet nicht gefunden/);
 });
 await t.test('Real SQL attack persistence, offline battle, pause and cargo return remain exactly once',async()=>{
  const snap=await snapshot();
  for(const [uid,id] of [[A,'g-helion-p1'],[B,'g-orion-p1']]){
   const gp=snap.planets.find(p=>p.id===id),row=snap.saves.find(r=>r.user_id===uid),s=row.state;
   for(const [k,t] of Object.entries(TECHS))s.tech[k]=t.max;
   const p={...structuredClone(s.planets[0]),...gp.meta,build:null,shipjob:null};
   p.resources=vector([10000,10000,10000]);p.buildings={...p.buildings,warehouse:4,metal:0,crystal:0,fuel:0,orbital:4};p.ships=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,0]));
   if(uid===A){p.ships.waechter=4;p.ships.karawane=4;p.ships.longProbe=1;p.ships.starColony=1;}
   s.planets.push(p);s.active=id;
   await db.query('update public.game_saves set state=$1,revision=revision+1 where user_id=$2',[JSON.stringify(s),uid]);
   await db.query("update public.galaxy_planets set owner_id=$1,reserved=false,colonized_at=now()-interval '2 days' where id=$2",[uid,id]);
  }
  const request={type:'attack',combatSeed:'client-chosen-seed',requestId:'10000000-0000-0000-0000-000000000005',action:{from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:4,karawane:4}}};
  const launched=await runServerCommand(rpc,A,request);assert.equal(launched.pvp.outgoing.length,1);
  const m=(await db.query('select data from public.pvp_attacks where id=$1',[launched.pvp.outgoing[0].id])).rows[0].data;
  assert.equal(m.status,'outbound');assert.notEqual(m.seed,request.combatSeed);assert.equal(m.id,await missionId(A,request.requestId));assert.notEqual(m.id,await missionId(B,request.requestId));
  await runServerCommand(rpc,A,{type:'set-pvp',enabled:false,requestId:'10000000-0000-0000-0000-000000000006'});
  fakeNow=m.arrival_at;const battle=await runServerCommand(rpc,B,{type:'sync'});assert.equal(battle.pvp.reports.length,1);
  assert.equal(battle.pvp.reports[0].loot.metal,2500);assert.equal((await db.query('select status from public.pvp_attacks where id=$1',[m.id])).rows[0].status,'returning');
  fakeNow=m.return_at+1;const returned=await runServerCommand(rpc,A,{type:'sync'});assert.equal(returned.state.planets[1].ships.karawane,4);assert.equal(returned.state.planets[1].resources.metal,12500);
  const retry=await runServerCommand(rpc,A,request);assert.equal(retry.state.planets[1].resources.metal,12500);assert.equal(retry.pvp.outgoing.length,0);
  assert.equal((await db.query('select count(*)::int as n from public.pvp_attacks')).rows[0].n,1);
  assert.equal(retry.state.reports.filter(r=>r.title==='PvP-Kampfbericht').length,1);
  // Existing galaxy missions use the same authoritative chronology.
  const scan={type:'galaxy',requestId:'10000000-0000-0000-0000-000000000007',action:{kind:'scan',from:'g-helion-p1',to:'g-cetus-p1'}};
  await runServerCommand(rpc,A,scan);const probe=(await db.query('select * from public.galaxy_missions where id=$1',[await missionId(A,scan.requestId)])).rows[0];
  fakeNow=new Date(probe.finish_at).getTime()+1;const surveyed=await runServerCommand(rpc,A,{type:'sync'});assert.equal(surveyed.state.planets[1].ships.longProbe,1);
  const colony={type:'galaxy',requestId:'10000000-0000-0000-0000-000000000008',action:{kind:'colony',from:'g-helion-p1',to:'g-cetus-p1'}};
  await runServerCommand(rpc,A,colony);const cm=(await db.query('select * from public.galaxy_missions where id=$1',[await missionId(A,colony.requestId)])).rows[0];
  fakeNow=new Date(cm.arrival_at).getTime()+1;const colonized=await runServerCommand(rpc,A,{type:'sync'});assert.equal(colonized.state.planets.length,3);
  const gp=(await db.query("select * from public.galaxy_planets where id='g-cetus-p1'")).rows[0];assert.equal(gp.reserved,false);assert.equal(new Date(gp.colonized_at).getTime(),new Date(cm.arrival_at).getTime());
  assert.equal(colonized.pvp.colonies.find(p=>p.id==='g-cetus-p1').protectedUntil,new Date(cm.arrival_at).getTime()+86400000);
 });

 await t.test('Ship cancellation commits one refund even after a lost response and rejects stale orders',async()=>{
  const state=newGame('Cancellation',Date.now()),p=state.planets[0];p.buildings.shipyard=1;state.tech.logistics=1;p.resources=vector([2000,2000,2000]);for(const k of ['metal','crystal','fuel'])p.buildings[k]=0;
  await db.query('update public.game_saves set state=$1,revision=revision+1 where user_id=$2',[JSON.stringify(state),A]);fakeNow=state.time;
  const queued=await runServerCommand(rpc,A,{type:'command',requestId:'10000000-0000-0000-0000-000000000010',action:{type:'ship',planet:'home',key:'transport',count:2}}),j=queued.state.planets[0].shipjob;
  const request={type:'command',requestId:'10000000-0000-0000-0000-000000000011',action:{type:'cancel-ship',planet:'home',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.end}}};fakeNow++;
  const first=await runServerCommand(rpc,A,request),retry=await runServerCommand(rpc,A,request);assert.equal(first.state.planets[0].shipjob,null);assert.deepEqual(first.state.planets[0].resources,vector([2000,2000,2000]));assert.deepEqual(retry.state.planets[0].resources,first.state.planets[0].resources);
  const replacement=await runServerCommand(rpc,A,{type:'command',requestId:'10000000-0000-0000-0000-000000000012',action:{type:'ship',planet:'home',key:'transport',count:2}});
  await assert.rejects(runServerCommand(rpc,A,{...request,requestId:'10000000-0000-0000-0000-000000000013'}),/geändert/);assert.deepEqual((await snapshot()).saves.find(r=>r.user_id===A).state.planets[0].shipjob,replacement.state.planets[0].shipjob);
 });

});
