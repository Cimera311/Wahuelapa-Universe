import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {runServerCommand} from '../src/server-service.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {vector} from '../src/config.js';
import {capacity} from '../src/engine.js';

test('Partnership database persistence, atomic delivery, private reports and fleet scoring',async t=>{
 const db=new PGlite();t.after(()=>db.close());await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-log-pagination.sql','partnerships.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 // The upgrade can safely be installed repeatedly without resetting relationships.
 await db.exec(readFileSync('supabase/partnerships.sql','utf8'));
 // Apply the production patch twice: function replacements must be idempotent.
 for(let i=0;i<2;i++)await db.exec(readFileSync('supabase/pvp-sync-performance.sql','utf8'));
 const seed=fixture();for(const row of seed.saves){await db.query('insert into auth.users values($1)',[row.user_id]);await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[row.user_id,JSON.stringify(row.state)]);const p=seed.planets.find(p=>p.owner_id===row.user_id);await db.query('update public.galaxy_planets set owner_id=$1,reserved=false,colonized_at=to_timestamp($2) where id=$3',[row.user_id,(T-86400000)/1000,p.id]);}
 let now=T;
 const rpc={async rpc(name,p){try{const r=name==='imperium_pvp_snapshot'?await db.query('select public.imperium_pvp_snapshot($1,$2) as data',[p.p_uid,p.p_request_id]):await db.query('select public.imperium_pvp_commit($1,$2,$3,$4,$5) as data',[JSON.stringify(p.p_world),p.p_expected,p.p_uid,p.p_request_id,JSON.stringify(p.p_payload)]);if(name==='imperium_pvp_snapshot')r.rows[0].data.now=now;return {data:r.rows[0].data};}catch(e){return {error:{message:e.message}};}},from(){return {select(){return {eq(_,id){return {async maybeSingle(){return {data:(await db.query('select state,revision from public.game_saves where user_id=$1',[id])).rows[0]};}};}};}};}};
 let seq=0;const call=(uid,action)=>runServerCommand(rpc,uid,{type:'social',requestId:'30000000-0000-0000-0000-'+String(++seq).padStart(12,'0'),action});
 const invite=await call(A,{op:'invite',friend:B,delivery:true,defense:true});let partner=invite.pvp.social.partners[0];await call(B,{op:'accept',id:partner.id,delivery:true,defense:true});assert.equal((await runServerCommand(rpc,A,{type:'sync'})).pvp.social.partners[0].status,'accepted');
 await t.test('Unchanged global world rows are not rewritten on an idle sync',async()=>{
  await runServerCommand(rpc,A,{type:'sync'}); // First pass normalizes any legacy timestamps.
  const versions=async()=>(await db.query(`
   select 'planet:'||id as row_id,xmin::text as version from public.galaxy_planets
   union all select 'partner' as row_id,xmin::text as version from public.partner_world
   union all select 'attack:'||id::text as row_id,xmin::text as version from public.pvp_attacks
   order by row_id`)).rows;
  const before=await versions(),epoch=(await db.query('select epoch from public.pvp_control')).rows[0].epoch;
  await runServerCommand(rpc,A,{type:'sync'});
  assert.deepEqual(await versions(),before,'unchanged planet, attack and partner records must not receive UPDATE');
  const next=(await db.query('select epoch from public.pvp_control')).rows[0].epoch;
  assert.equal(Number(next),Number(epoch)+1,'optimistic epoch must still advance on successful sync');
 });
 await t.test('Unauthenticated and authenticated clients cannot read private social state or call trusted wrappers',async()=>{
  await db.exec('set role authenticated');for(const q of ['select * from public.partner_world','select public.imperium_pvp_snapshot(null,null)','select public.imperium_pvp_snapshot_base(null,null)'])await assert.rejects(db.query(q),/permission denied/);await db.exec('reset role');
 });
 await t.test('A lost response retried with the same ID cannot duplicate a support launch; owner keeps ranking points',async()=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);const before=(await db.query('select * from public.imperium_leaderboard() where is_me')).rows[0].fleet_points;
  const request={type:'social',requestId:'40000000-0000-0000-0000-000000000001',action:{op:'support',from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:2}}};const one=await runServerCommand(rpc,A,request),two=await runServerCommand(rpc,A,request);assert.equal(two.pvp.social.missions.length,1);assert.equal(two.state.planets[1].ships.waechter,2);assert.equal((await db.query('select * from public.imperium_leaderboard() where is_me')).rows[0].fleet_points,before);now=one.pvp.social.missions[0].due;const hosted=await runServerCommand(rpc,B,{type:'sync'});assert.equal(hosted.pvp.social.missions[0].status,'stationed');assert.equal(hosted.state.planets[1].ships.waechter,0);
 });
 await t.test('Optimistic epoch rejection never modifies social data',async()=>{
  const snap=(await rpc.rpc('imperium_pvp_snapshot',{p_uid:A,p_request_id:null})).data,before=(await db.query('select data from public.partner_world')).rows[0].data;const forged={...snap,partners:[]};const result=await rpc.rpc('imperium_pvp_commit',{p_world:forged,p_expected:snap.settings.epoch-1,p_uid:A,p_request_id:null,p_payload:{type:'sync'}});assert.equal(result.data,false);assert.deepEqual((await db.query('select data from public.partner_world')).rows[0].data,before);
 });
 await t.test('Accepted direct exchange persists payment and completes for offline users',async()=>{
  const offered=await call(A,{op:'trade-offer',from:'g-helion-p1',to:'g-orion-p1',fleet:{karawane:1},cargo:vector([1000,0,0]),payment:vector([0,500,0])});const accepted=await call(B,{op:'trade-accept',id:offered.pvp.social.trades[0].id});const m=accepted.pvp.social.missions.find(m=>m.kind==='trade');assert.equal(accepted.state.planets[1].resources.crystal,9500);now=m.due+m.duration;const done=await runServerCommand(rpc,A,{type:'sync'});assert.equal(done.state.planets[1].resources.crystal,10500);const buyer=await runServerCommand(rpc,B,{type:'sync'});assert.equal(buyer.state.planets[1].resources.metal,11000);
 });
 await t.test('Waiting cargo persists through SQL snapshots and releases ships exactly once after warehouse completion',async()=>{
  const fill=async(id)=>{const row=(await db.query('select state from public.game_saves where user_id=$1',[id])).rows[0];row.state.planets[1].resources.metal=capacity(row.state.planets[1]);await db.query('update public.game_saves set state=$2 where user_id=$1',[id,JSON.stringify(row.state)]);};
  await fill(B);const launched=await call(A,{op:'deliver',from:'g-helion-p1',to:'g-orion-p1',fleet:{karawane:1},cargo:vector([500,0,0])});const m=launched.pvp.social.missions.find(m=>m.kind==='delivery');await fill(A);now=m.due+m.duration;
  const waiting=await runServerCommand(rpc,A,{type:'sync'}),held=waiting.pvp.social.missions.find(x=>x.id===m.id);assert.equal(held.awaitingUnload,true);assert.equal(held.cargo.metal,500);assert.equal(waiting.state.planets[1].depot.metal,0);assert.equal(waiting.state.planets[1].ships.karawane,3);
  const repeated=await runServerCommand(rpc,A,{type:'sync'});assert.equal(repeated.pvp.social.missions.find(x=>x.id===m.id).cargo.metal,500);assert.equal(repeated.state.planets[1].ships.karawane,3);
  const building=await runServerCommand(rpc,A,{type:'command',requestId:'60000000-0000-0000-0000-000000000001',action:{type:'build',planet:'g-helion-p1',key:'warehouse'}});now=building.state.planets[1].build.end;
  const done=await runServerCommand(rpc,A,{type:'sync'});assert.ok(!done.pvp.social.missions.some(x=>x.id===m.id));assert.equal(done.state.planets[1].ships.karawane,4);assert.equal(done.state.planets[1].depot.metal,0);assert.equal((await runServerCommand(rpc,A,{type:'sync'})).state.planets[1].ships.karawane,4);
 });
 await t.test('Support launched from the private homeworld persists and returns there after recall',async()=>{
  const row=(await db.query('select state from public.game_saves where user_id=$1',[A])).rows[0];const home=row.state.planets[0];home.ships.waechter=1;home.buildings.warehouse=4;home.resources.fuel=10000;await db.query('update public.game_saves set state=$2 where user_id=$1',[A,JSON.stringify(row.state)]);
  const launched=await call(A,{op:'support',from:'home',to:'g-orion-p1',fleet:{waechter:1}}),m=launched.pvp.social.missions.find(m=>m.from==='home');assert.equal(launched.state.planets[0].ships.waechter,0);now=m.due;const host=await runServerCommand(rpc,B,{type:'sync'});assert.equal(host.pvp.social.missions.find(x=>x.id===m.id).status,'stationed');
  const recalled=await call(A,{op:'recall',id:m.id});now=recalled.pvp.social.missions.find(x=>x.id===m.id).due;const returned=await runServerCommand(rpc,A,{type:'sync'});assert.equal(returned.state.planets[0].ships.waechter,1);assert.ok(!returned.pvp.social.missions.some(x=>x.id===m.id));
 });
 await t.test('Ship queues survive SQL snapshots, retries, removals and offline completion',async()=>{
  const row=(await db.query('select state from public.game_saves where user_id=$1',[A])).rows[0],p=row.state.planets[0];Object.assign(p.buildings,{shipyard:6,solar:20,warehouse:4,metal:0,crystal:0,fuel:0});p.resources=vector([10000,10000,10000]);const before=p.ships.falke;await db.query('update public.game_saves set state=$2 where user_id=$1',[A,JSON.stringify(row.state)]);
  const first=await runServerCommand(rpc,A,{type:'command',requestId:'70000000-0000-0000-0000-000000000001',action:{type:'ship',planet:'home',key:'falke',count:1}});
  const request={type:'command',requestId:'70000000-0000-0000-0000-000000000002',action:{type:'ship',planet:'home',key:'transport',count:2}},queued=await runServerCommand(rpc,A,request),retried=await runServerCommand(rpc,A,request);assert.equal(queued.pvp.features.shipQueue,true);assert.equal(retried.state.planets[0].shipqueue.length,1);assert.equal(retried.state.planets[0].resources.metal,queued.state.planets[0].resources.metal);
  const j=queued.state.planets[0].shipqueue[0],cancel={type:'command',requestId:'70000000-0000-0000-0000-000000000003',action:{type:'cancel-ship',planet:'home',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.end}}};const removed=await runServerCommand(rpc,A,cancel);assert.equal(removed.state.planets[0].shipqueue.length,0);assert.equal(removed.state.planets[0].shipjob.id,first.state.planets[0].shipjob.id);assert.equal((await runServerCommand(rpc,A,cancel)).state.planets[0].resources.metal,removed.state.planets[0].resources.metal);
  const restored=await runServerCommand(rpc,A,{...request,requestId:'70000000-0000-0000-0000-000000000004'});now=restored.state.planets[0].shipqueue[0].end;const finished=await runServerCommand(rpc,A,{type:'sync'});assert.equal(finished.state.planets[0].ships.falke,before+1);assert.equal(finished.state.planets[0].ships.transport,p.ships.transport+2);assert.equal(finished.state.planets[0].shipjob,null);assert.equal(finished.state.planets[0].shipqueue.length,0);
 });
 await t.test('Support owner receives private persistent battle reports and trace access; strangers do not',async()=>{
  const C='00000000-0000-0000-0000-000000000003';await db.query('insert into auth.users values($1)',[C]);await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[C,JSON.stringify(seed.saves[0].state)]);
  const id='50000000-0000-0000-0000-000000000001',report={at:now,outcome:'defender',rounds:[],supporting:[{owner:A,commander:'Ally',before:{waechter:2},after:{waechter:1}}],trace:{version:1,ruleVersion:2,initial:[],final:[],rounds:[]}};
  await db.query("insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data) values($1,$2,$3,now(),now(),now(),now(),'returned',$4)",[id,C,B,JSON.stringify({id,from:'g-helion-p1',to:'g-orion-p1',report})]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);const logs=(await db.query('select public.imperium_battle_log($1,null,0) as data',[id])).rows[0].data;assert.equal(logs.ownSide,'defender');assert.equal(logs.summary.supporting[0].owner,A);assert.equal((await db.query('select count(*)::int as n from public.game_reports where user_id=$1 and mission_id=$2',[A,id])).rows[0].n,1);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-000000000004']);await assert.rejects(db.query('select public.imperium_battle_log($1,null,0)',[id]),/NOT_FOUND/);
 });


});
