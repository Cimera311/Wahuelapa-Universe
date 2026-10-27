import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fixture,A} from './helpers/pvp-fixture.js';
import {summarize} from '../scripts/summarize-command-metrics.mjs';
test('HTTP compact opt-in selects the new RPC and keeps mode labels separate in metrics',async()=>{
 const snapshot={...fixture(),snapshotFormat:'compact-v1',attackReports:[]},calls=[],logs=[];let handle,committed;
 const db={auth:{getUser:async()=>({data:{user:{id:A}}})},rpc:async(name,p)=>{calls.push(name);if(name==='imperium_pvp_snapshot_compact')return {data:snapshot};assert.equal(name,'imperium_pvp_commit');committed=p.p_world;return {data:true};},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:committed.saves[0]})})})})};
 const source=readFileSync(new URL('../supabase/dashboard/game-command.ts',import.meta.url),'utf8').replace(/^import .* from "npm:.*";$/gm,'');
 vm.runInNewContext(source,{createClient:()=>db,Deno:{env:{get:n=>n==='GAME_COMMAND_METRICS_RATE'?'1':n==='GAME_COMMAND_SNAPSHOT'?'compact':''},serve:f=>handle=f},console:{log:s=>logs.push(JSON.parse(s)),error:()=>{}},structuredClone,crypto,Request,Response,TextEncoder,URL,setTimeout,performance});
 const response=await handle(new Request('http://test',{method:'POST',headers:{Authorization:'Bearer token'},body:JSON.stringify({type:'sync'})}));
 assert.equal(response.status,200);assert.deepEqual(calls,['imperium_pvp_snapshot_compact','imperium_pvp_commit']);assert.equal(logs[0].snapshotMode,'compact');assert.ok(!('attackReports' in committed));assert.ok(!('snapshotFormat' in committed));
 const old={...logs[0]};delete old.snapshotMode;const summary=summarize([old,logs[0]]);assert.equal(summary['legacy/sync/other'].requests,1);assert.equal(summary['compact/sync/other'].requests,1);
});
