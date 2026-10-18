import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SaveValidationError,validateSave} from '../src/storage.js';
import {runServerCommand} from '../src/server-service.js';
import {fixture,A} from './helpers/pvp-fixture.js';

function invalidWorld(phase){
 const world=fixture();
 if(phase==='stored')world.saves[1].state.version=999;
 else world.starts[0].x=1300; // Applied after initial validation, before output validation.
 return world;
}
function database(world){
 const calls=[];
 return {calls,auth:{getUser:async()=>({data:{user:{id:A}},error:null})},rpc:async(name)=>{
  calls.push(name);assert.equal(name,'imperium_pvp_snapshot','invalid worlds must never reach commit');
  return {data:world,error:null};
 }};
}
test('save validation preserves its message and adds a stable rule without save data',()=>{
 assert.throws(()=>validateSave({version:999,secret:'private'}),error=>{
  assert.ok(error instanceof SaveValidationError);
  assert.equal(error.rule,'SV001');
  assert.equal(error.message,'Ungültiger oder inkompatibler Spielstand.');
  assert.ok(!JSON.stringify(error).includes('private'));return true;
 });
});
for(const phase of ['stored','processed'])test(`shared-world ${phase} failure identifies phase and aborts without committing`,async()=>{
 const world=invalidWorld(phase),before=structuredClone(world),db=database(world);
 await assert.rejects(runServerCommand(db,A,{type:'sync'}),error=>{
  assert.equal(error.code,'WORLD_SAVE_INVALID');assert.equal(error.phase,phase);
  assert.equal(error.rule,phase==='stored'?'SV001':'SV005');assert.equal(error.status,503);
  assert.ok(!JSON.stringify(error).includes(world.saves[1].user_id));return true;
 });
 assert.deepEqual(world,before);assert.deepEqual(db.calls,['imperium_pvp_snapshot']);
});
test('deployable handler returns and logs only static validation diagnostics',async()=>{
 const world=invalidWorld('stored'),db=database(world),logs=[];let handle;
 const source=readFileSync(new URL('../supabase/dashboard/game-command.ts',import.meta.url),'utf8').replace(/^import .* from "npm:.*";$/gm,'');
 vm.runInNewContext(source,{createClient:()=>db,Deno:{env:{get:()=>''},serve:f=>handle=f},
  console:{error:(...args)=>logs.push(args)},structuredClone,crypto,Request,Response,TextEncoder,URL,setTimeout});
 const response=await handle(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer private-token'},body:JSON.stringify({type:'sync'})}));
 assert.equal(response.status,503);const body=await response.json();
 assert.deepEqual(Object.keys(body).sort(),['code','error','phase','rule']);
 assert.equal(body.code,'WORLD_SAVE_INVALID');assert.equal(body.phase,'stored');assert.equal(body.rule,'SV001');
 assert.equal(logs.length,1);assert.deepEqual(JSON.parse(logs[0][1]),{code:'WORLD_SAVE_INVALID',phase:'stored',rule:'SV001'});
 for(const privateValue of [A,world.saves[1].user_id,'private-token','Defender'])assert.ok(!JSON.stringify({body,logs}).includes(privateValue));
 assert.deepEqual(db.calls,['imperium_pvp_snapshot']);
});
