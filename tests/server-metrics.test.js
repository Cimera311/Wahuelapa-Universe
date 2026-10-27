import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCommandMetrics} from '../src/server-metrics.js';
import {runServerCommand} from '../src/server-service.js';
import {processWorld} from '../src/server-world.js';
import {fixture,A,B,ID} from './helpers/pvp-fixture.js';
import {summarize,parseMetrics} from '../scripts/summarize-command-metrics.mjs';
function capture(){let n=0;const logs=[];const metrics=createCommandMetrics({rate:1,clock:()=>++n,id:()=> 'correlation',emit:s=>logs.push(JSON.parse(s))});return {metrics,logs};}
function db(world,conflicts=0){let committed,calls=0;return {rpc:async(name,args)=>{
 if(name==='imperium_pvp_snapshot')return {data:world};
 if(name==='imperium_pvp_commit'){committed=args.p_world;return {data:++calls>conflicts};}
 throw Error(name);
},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:committed.saves[0]})})})})};}
test('disabled and unsampled metrics do not read clocks, IDs or payloads',()=>{
 const fail=()=>{throw Error('disabled path evaluated');};
 for(const rate of [0,-1,'bad'])assert.equal(createCommandMetrics({rate,random:fail,clock:fail,id:fail}),undefined);
 assert.equal(createCommandMetrics({rate:.1,random:()=>.9,clock:fail,id:fail}),undefined);
});
test('retries retain separate attempts and leave response and snapshot unchanged',async()=>{
 const snapshot=fixture(),before=structuredClone(snapshot),{metrics,logs}=capture();
 const measured=await runServerCommand(db(snapshot,2),A,{type:'sync'},metrics);
 const plain=await runServerCommand(db(snapshot),A,{type:'sync'});
 metrics.finish(200);metrics.finish(500);
 assert.deepEqual(measured,plain);assert.deepEqual(snapshot,before);assert.equal(logs.length,1);
 const r=logs[0];assert.equal(r.retries,2);assert.equal(r.attempts.length,3);assert.deepEqual(r.attempts.map(a=>a.committed),[false,false,true]);
 for(const a of r.attempts){assert.equal(a.snapshotBytes,new TextEncoder().encode(JSON.stringify(snapshot)).length);assert.ok(a.ms.snapshot>0);assert.ok(a.ms.simulation>0);assert.ok(a.ms.commit>0);}
 assert.equal(r.ms.snapshot,r.attempts.reduce((s,a)=>s+a.ms.snapshot,0));
 for(const secret of [A,B,'Attacker','Defender'])assert.ok(!JSON.stringify(r).includes(secret));
});
test('exhausted conflicts and database failures preserve errors and attempts',async()=>{
 let c=capture();await assert.rejects(runServerCommand(db(fixture(),5),A,{type:'sync'},c.metrics),/gleichzeitige/);c.metrics.finish(400);assert.equal(c.logs[0].retries,4);
 c=capture();await assert.rejects(runServerCommand({rpc:async()=>({error:{message:'db failed'}})},A,{type:'sync'},c.metrics),/db failed/);c.metrics.finish(503);assert.equal(c.logs[0].attempts.length,1);assert.ok(c.logs[0].ms.snapshot>0);
});
test('PvP event metrics preserve seeded world outcome',()=>{
 let world=processWorld(fixture(),A,{type:'attack',requestId:ID,combatSeed:'fixed',action:{from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:4,karawane:4}}});
 world.now=world.attacks[0].arrival_at;const {metrics,logs}=capture();metrics.attempt();
 assert.deepEqual(processWorld(world,A,{type:'sync'},metrics),processWorld(world,A,{type:'sync'}));metrics.finish(200);
 assert.equal(logs[0].counts.pvpBattles,1);assert.ok(logs[0].counts.events>=1);assert.ok(logs[0].ms.pvp>0);
});
test('PvE event metrics preserve seeded world outcome',()=>{
 let world=fixture();world.pirateVersion=1;world.pirateConfig={flightTimeFactor:.1};world.piratePlayers=[];world.settings.combat_engine=6;world.saves[0].state.planets[0].ships.falke=100;
 world=processWorld(world,A,{type:'pirate',action:{op:'open'}});
 world=processWorld(world,A,{type:'pirate',eventId:ID,combatSeed:'fixed',action:{op:'attack',station:'smugglers',from:'home',fleet:{falke:100}}});world.now=world.piratePlayers[0].missions[0].arrivalAt;
 const {metrics,logs}=capture();metrics.attempt();assert.deepEqual(processWorld(world,A,{type:'sync'},metrics),processWorld(world,A,{type:'sync'}));metrics.finish(200);assert.equal(logs[0].counts.pveBattles,1);assert.ok(logs[0].ms.pve>0);
});
test('unknown input labels and logging destination failures cannot leak or break commands',()=>{
 const {metrics,logs}=capture();metrics.label({type:'private@example.test',action:{type:'secret'}});metrics.count('private');metrics.finish(400);
 assert.equal(logs[0].type,'unknown');assert.equal(logs[0].action,'other');assert.deepEqual(logs[0].counts,{});
 const m=createCommandMetrics({rate:1,emit:()=>{throw Error('log unavailable');}});assert.doesNotThrow(()=>m.finish(200));
});
test('summary separates action groups and calculates nearest-rank percentiles',()=>{
 const rows=Array.from({length:100},(_,i)=>({kind:'game_command_metrics',schema:1,type:'sync',action:'other',status:i===99?503:200,totalMs:i+1,ms:{snapshot:i+1},responseBytes:42,retries:i===99?1:0,attempts:[{snapshotBytes:100}]}));
 const parsed=parseMetrics('noise\n'+rows.map(r=>'[Info] '+JSON.stringify(r)).join('\n')+'\ninvalid');assert.equal(parsed.length,100);
 const result=summarize(parsed)['legacy/sync/other'];assert.deepEqual(result.totalMs,{p50:50,p95:95,p99:99});assert.equal(result.errorRate,.01);assert.deepEqual(result.retries,{'0':99,'1':1});
});
test('deployable handler logs auth failures, malformed input, success and validation failure exactly once',async()=>{
 const source=readFileSync(new URL('../supabase/dashboard/game-command.ts',import.meta.url),'utf8').replace(/^import .* from "npm:.*";$/gm,'');
 for(const scenario of ['unauthorized','malformed','success','invalid']){
  const world=fixture();if(scenario==='invalid')world.saves[1].state.version=999;
  const database=db(world);database.auth={getUser:async()=>({data:{user:{id:A}}})};const logs=[];let handler;
  vm.runInNewContext(source,{createClient:()=>database,Deno:{env:{get:n=>n==='GAME_COMMAND_METRICS_RATE'?'1':''},serve:f=>handler=f},console:{log:s=>logs.push(JSON.parse(s)),error:()=>{}},structuredClone,crypto,Request,Response,TextEncoder,URL,setTimeout,performance});
  const headers=scenario==='unauthorized'?{}:{Authorization:'Bearer private-token'};
  const response=await handler(new Request('http://test',{method:'POST',headers,body:scenario==='malformed'?'{':JSON.stringify({type:'sync'})}));
  assert.equal(response.status,{unauthorized:401,malformed:400,success:200,invalid:503}[scenario]);assert.equal(logs.length,1);assert.equal(logs[0].status,response.status);
  assert.equal(logs[0].responseBytes,new TextEncoder().encode(await response.text()).length);
  for(const secret of [A,B,'private-token','Attacker','Defender'])assert.ok(!JSON.stringify(logs).includes(secret));
 }
});
