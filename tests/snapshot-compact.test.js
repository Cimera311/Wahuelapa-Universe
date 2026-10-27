import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {fixture,A,B,ID,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {runServerCommand} from '../src/server-service.js';
const C='00000000-0000-0000-0000-000000000003';
const launch={type:'attack',eventId:ID,combatSeed:'compact-test',action:{from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:4,karawane:4}}};
const id=i=>'90000000-0000-0000-0000-'+String(i).padStart(12,'0');
function completed(i,attacker=A,defender=B){return {id:id(i),attacker_id:attacker,defender_id:defender,from:'g-helion-p1',to:'g-orion-p1',status:'returned',started_at:T-500,warning_at:T-400,arrival_at:T-200+(i%3),return_at:T-100,fleet:{waechter:4},survivors:{waechter:4},unusedHistory:'x'.repeat(1500),report:{at:T-200+(i%3),outcome:'attacker',attackerBefore:{waechter:4},attackerAfter:{waechter:4},defenderBefore:{},defenderAfter:{},traceAvailable:true}};}
function compactWorld(world,uid){const active=world.attacks.filter(m=>m.status!=='returned');const reports=world.attacks.filter(m=>m.status==='returned'&&(m.attacker_id===uid||m.defender_id===uid||m.report?.supporting?.some(g=>g.owner===uid))&&m.report).sort((a,b)=>b.arrival_at-a.arrival_at||a.id.localeCompare(b.id)).slice(0,4).map(m=>Object.fromEntries(['id','attacker_id','defender_id','from','to','arrival_at','return_at','report'].map(k=>[k,m[k]])));return {...structuredClone(world),attacks:structuredClone(active),attackReports:reports,snapshotFormat:'compact-v1'};}
test('compact projection preserves own/support reports, ties and simulation with all active fleets',()=>{
 let world=processWorld(fixture(),A,launch);world.saves.push({...structuredClone(world.saves[0]),user_id:C,state:{...structuredClone(world.saves[0].state),name:'Support'}});
 world.attacks.push(...Array.from({length:50},(_,i)=>completed(i+1)),completed(70,B,C));world.attacks[20].report.supporting=[{owner:C,before:{falke:3},after:{falke:2}}];
 // Same-time active report and historical cards must retain the legacy UUID order.
 const active=structuredClone(world.attacks[0]);active.id=id(100);active.status='returning';active.arrival_at=T-198;active.return_at=T+100000;active.survivors={waechter:4};active.report=completed(2).report;world.attacks.push(active);
 for(const uid of [A,B,C]){
  const compact=compactWorld(world,uid),legacyResult=processWorld(world,uid,{type:'sync'}),compactResult=processWorld(compact,uid,{type:'sync'});
  assert.deepEqual(projectPvP(compactResult,uid),projectPvP(legacyResult,uid));assert.ok(projectPvP(compactResult,uid).reports.length<=4);assert.deepEqual(compactResult.saves,legacyResult.saves);assert.deepEqual(compactResult.attacks,legacyResult.attacks.filter(m=>!world.attacks.some(old=>old.id===m.id&&old.status==='returned')));
  assert.ok(JSON.stringify(compact).length<JSON.stringify(world).length);
 }
});
test('compact service excludes historical cards from commit and retains newly returned attacks across conflicts',async()=>{
 let world=processWorld(fixture(),A,launch);world.now=world.attacks[0].return_at;world.attacks.push(completed(1));const snapshot=compactWorld(world,A),before=structuredClone(snapshot),commits=[];
 const database={rpc:async(name,p)=>{
  if(name==='imperium_pvp_snapshot_compact')return {data:snapshot};
  assert.equal(name,'imperium_pvp_commit');commits.push(p.p_world);return {data:commits.length>1};
 },from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:commits.at(-1).saves[0]})})})})};
 const result=await runServerCommand(database,A,{type:'sync'},undefined,{snapshot:'compact'});
 assert.deepEqual(snapshot,before);assert.equal(commits.length,2);
 for(const w of commits){assert.ok(!('attackReports' in w));assert.ok(!('snapshotFormat' in w));assert.equal(w.attacks.length,1);assert.equal(w.attacks[0].status,'returned');}
 assert.equal(result.pvp.reports.length,2);assert.equal(result.revision,1);
 await assert.rejects(runServerCommand({rpc:async()=>({data:world})},A,{type:'sync'},undefined,{snapshot:'compact'}),/inkompatibel/);
});
test('compact SQL is additive, private, filters only completed history and preserves legacy persistence',async t=>{
 const db=new PGlite();t.after(()=>db.close());await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-log-pagination.sql','partnerships.sql','pvp-sync-performance.sql','pirates-admin.sql','pirates-public.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 const seed=fixture();seed.saves.push({...structuredClone(seed.saves[0]),user_id:C});for(const row of seed.saves){await db.query('insert into auth.users values($1)',[row.user_id]);await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[row.user_id,JSON.stringify(row.state)]);}
 const insert=async(m,days=0)=>db.query("insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data) values($1,$2,$3,now()-interval '1 hour',now()-interval '30 minutes',now()-($4::integer*interval '1 day'),now()+interval '1 hour',$5,$6)",[m.id,m.attacker_id,m.defender_id,days,m.status,JSON.stringify(m)]);
 const own=completed(1),foreign=completed(2,B,C),support=completed(3,B,C);support.report.supporting=[{owner:A,before:{falke:3},after:{falke:2}}];
 await insert(own);await insert(foreign);await insert(support);await insert(completed(4),31);
 const outbound=processWorld(fixture(),A,launch).attacks[0];await insert(outbound,45);
 const waiting={...structuredClone(outbound),id:id(5),status:'returning',survivors:{waechter:4},cargo:{metal:99999999,crystal:0,fuel:0},awaitingUnload:true};await insert(waiting,45);
 const sql=readFileSync('supabase/pvp-snapshot-compact.sql','utf8');await db.exec(sql);await db.exec(sql);
 const snap=async(compact,uid=A)=>(await db.query(`select public.${compact?'imperium_pvp_snapshot_compact':'imperium_pvp_snapshot'}($1,null) as data`,[uid])).rows[0].data;
 const legacy=await snap(false),compact=await snap(true);assert.ok(!('snapshotFormat' in legacy));assert.equal(compact.snapshotFormat,'compact-v1');assert.equal(legacy.attacks.length,5);assert.equal(compact.attacks.length,2);assert.equal(compact.attacks.find(m=>m.id===waiting.id).awaitingUnload,true);
 assert.deepEqual(new Set(compact.attackReports.map(m=>m.id)),new Set([own.id,support.id]));assert.ok(!compact.attackReports.some(m=>m.id===foreign.id));assert.ok(compact.attackReports.every(m=>!('unusedHistory' in m)&&!('fleet' in m)));
 for(const key of ['saves','settings','planets','surveys','starts','missions','partners','socialMissions','trades','piratePlayers','pirateConfig','receipt'])assert.deepEqual(compact[key],legacy[key],key);
 assert.ok(JSON.stringify(compact).length<JSON.stringify(legacy).length);
 for(let i=10;i<17;i++)await insert(completed(i));assert.equal((await snap(true)).attackReports.length,4,'SQL must cap historical cards at four');
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(snap(true),/permission denied/);await db.exec('reset role');}
 await db.exec('set role service_role');assert.equal((await snap(true)).snapshotFormat,'compact-v1');await db.exec('reset role');
 const before=(await db.query('select id,data from public.pvp_attacks order by id')).rows;
 const adapter={rpc:async(name,p)=>{try{let result;if(name.startsWith('imperium_pvp_snapshot')){result=await db.query(`select public.${name}($1,$2) as data`,[p.p_uid,p.p_request_id]);result.rows[0].data.now=T;}else result=await db.query('select public.imperium_pvp_commit($1,$2,$3,$4,$5) as data',[JSON.stringify(p.p_world),p.p_expected,p.p_uid,p.p_request_id,JSON.stringify(p.p_payload)]);return {data:result.rows[0].data};}catch(error){return {error:{message:error.message}};}},from:()=>({select:()=>({eq:(_,uid)=>({maybeSingle:async()=>({data:(await db.query('select state,revision from public.game_saves where user_id=$1',[uid])).rows[0]})})})})};
 const request={type:'command',requestId:id(90),action:{type:'reserve',planet:'home',reserves:{metal:0,crystal:0,fuel:0}}};
 await runServerCommand(adapter,A,request,undefined,{snapshot:'compact'});await runServerCommand(adapter,A,request,undefined,{snapshot:'compact'});
 const after=(await db.query('select id,data from public.pvp_attacks order by id')).rows;
 for(const old of before.filter(r=>r.data.status==='returned'))assert.deepEqual(after.find(r=>r.id===old.id),old,'historical row must remain byte-equivalent');
 assert.equal((await db.query('select count(*)::int as n from public.pvp_requests where request_id=$1',[request.requestId])).rows[0].n,1);
 // Reports remain in the existing archive independently of compact snapshot retention.
 assert.ok((await db.query("select count(*)::int as n from public.game_reports where kind='battle'")).rows[0].n>=8);
 await db.exec('drop function public.imperium_pvp_snapshot_compact(uuid,uuid)');assert.equal((await snap(false)).attacks.length,12);
});
