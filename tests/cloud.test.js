import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloud,CloudConflict,connectCloud} from '../src/cloud.js';
import {newGame} from '../src/engine.js';
import {saveGame,loadGame,SAVE_KEY} from '../src/storage.js';
function backend(){const rows=new Map();let fail=false,lost=false;return {rows,setFail:v=>fail=v,setLost:v=>lost=v,client(id){return {auth:{getSession:async()=>({data:{session:{user:{id,email:id+'@test.de'}}}}),signOut:async()=>({data:{}})},from:()=>({select:()=>({eq:(_,uid)=>({maybeSingle:async()=>({data:rows.get(uid)||null})})})}),rpc:async(_,p)=>{if(fail)return {error:{message:'network down'}};const old=rows.get(id);if((old?.revision||0)!==p.p_expected)return {error:{message:'SAVE_CONFLICT'}};const revision=p.p_expected+1;rows.set(id,{revision,state:structuredClone(p.p_state)});if(lost){lost=false;return {error:{message:'response lost'}};}return {data:revision};}};}};}
async function opened(b,id){const c=createCloud(b.client(id));await c.session();await c.load();return c;}
test('Cloud stays disabled without project settings',async()=>{assert.equal(await connectCloud({enabled:false}),null);await assert.rejects(connectCloud({enabled:true,url:'invalid'}));});
test('Load before save, valid snapshot roundtrip and account isolation',async()=>{const b=backend(),a=createCloud(b.client('a'));await a.session();await assert.rejects(a.save(newGame('A')),/zuerst laden/);assert.equal(await a.load(),null);const s=newGame('A');await a.save(s);s.name='mutated';assert.equal((await a.load()).name,'A');const other=await opened(b,'b');assert.equal(await other.load(),null);await other.save(newGame('B'));assert.equal((await a.load()).name,'A');await a.signOut();await assert.rejects(a.save(s));});
test('Concurrent devices cannot silently overwrite each other',async()=>{const b=backend(),a=await opened(b,'a'),second=await opened(b,'a');await a.save(newGame('first'));await assert.rejects(second.save(newGame('second')),CloudConflict);assert.equal(second.loaded,false);assert.equal((await second.load()).name,'first');await second.save(newGame('second'));await assert.rejects(a.save(newGame('stale')),CloudConflict);});
test('Network error keeps revision, lost acknowledgement triggers conflict instead of overwrite',async()=>{const b=backend(),a=await opened(b,'a'),s=newGame('A');b.setFail(true);await assert.rejects(a.save(s));assert.equal(a.revision,0);b.setFail(false);await a.save(s);b.setLost(true);await assert.rejects(a.save(s));assert.equal(a.revision,1);await assert.rejects(a.save(s),CloudConflict);await a.load();assert.equal(a.revision,2);});
test('Malformed remote or local saves are rejected before use',async()=>{const b=backend(),a=await opened(b,'a');await assert.rejects(a.save({version:1}));b.rows.set('a',{revision:1,state:{version:1}});await assert.rejects(a.load());assert.equal(a.loaded,false);assert.equal(b.rows.get('a').revision,1);});
test('Guest and account local caches remain separate with independent backups',()=>{const mem=new Map(),store={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};saveGame(newGame('Guest'),store);saveGame(newGame('Account'),store,SAVE_KEY+'-account-a');saveGame(newGame('Account updated'),store,SAVE_KEY+'-account-a');assert.equal(loadGame(store).state.name,'Guest');assert.equal(loadGame(store,SAVE_KEY+'-account-a').state.name,'Account updated');assert.equal(loadGame(store,SAVE_KEY+'-account-b').state,null);store.setItem(SAVE_KEY+'-account-a','broken');assert.equal(loadGame(store,SAVE_KEY+'-account-a').state.name,'Account');});
test('Leaderboard requires login and fetches only the ranking RPC',async()=>{let calls=0;const client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}})},rpc:async(name,params)=>{calls++;assert.equal(name,'imperium_leaderboard');assert.equal(params,undefined);return {data:[{commander:'Friend',points:10,is_me:false}]};}};const c=createCloud(client);await assert.rejects(c.leaderboard(),/anmelden/);assert.equal(calls,0);await c.session();assert.equal((await c.leaderboard())[0].commander,'Friend');assert.equal(c.revision,0);});
test('Missing ranking migration is actionable; ranking failures do not block saves',async()=>{const b=backend(),client=b.client('a'),original=client.rpc;client.rpc=(name,p)=>name==='imperium_leaderboard'?Promise.resolve({error:{code:'PGRST202',message:'not found'}}):original(name,p);const c=createCloud(client);await c.session();await c.load();await assert.rejects(c.leaderboard(),/leaderboard.sql/);assert.equal(c.loaded,true);await c.save(newGame('A'));assert.equal(c.revision,1);});

test('Cloud server mode cannot overwrite canonical state even while PvP is paused',async()=>{
 let calls=0,reads=0;const canonical=newGame('Canonical'),client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}})},rpc:async name=>{assert.equal(name,'imperium_pvp_status');return {data:{version:1,enabled:false}};},functions:{invoke:async(name,{body})=>{calls++;assert.equal(name,'game-command');assert.equal(body.type,'sync');return {data:{state:canonical,revision:7,pvp:{serverNow:canonical.time,enabled:false,isAdmin:false,incoming:[],outgoing:[],reports:[],colonies:[]}}};}},from(){reads++;throw Error('Must not read stale saves');}};
 const c=createCloud(client);await c.session();assert.equal((await c.load()).name,'Canonical');assert.ok(c.authoritative);assert.equal(c.pvp.enabled,false);assert.equal(c.revision,7);assert.equal(reads,0);
 await assert.rejects(c.save(newGame('Forged')),/Server-Spielstände/);assert.equal(calls,1);
});
test('Installed authority fails closed when the Edge Function is unavailable',async()=>{
 let reads=0;const client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}})},rpc:async()=>({data:{version:1,enabled:false}}),functions:{invoke:async()=>({error:{message:'Function missing',context:{status:404,json:async()=>({error:'Deploy required'})}}})},from(){reads++;}};
 const c=createCloud(client);await c.session();await assert.rejects(c.load(),/Deploy required/);assert.equal(c.loaded,false);assert.equal(reads,0);assert.ok(c.authoritative);
});
test('A lost command response is retried with the identical request ID; rejection clears pending commands',async()=>{
 const requests=[],s=newGame('Canonical');let lost=true,reject=false;
 const result=()=>({state:s,revision:1,pvp:{serverNow:s.time,enabled:true,isAdmin:false,incoming:[],outgoing:[],reports:[],colonies:[]}});
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}}})},rpc:async()=>({data:{version:1,enabled:true}}),functions:{async invoke(name,{body}){
  if(body.type==='sync')return {data:result()};requests.push(body);
  if(reject)return {error:{message:'Bad request',context:{status:400,json:async()=>({error:'Insufficient ships'})}}};
  if(lost){lost=false;return {error:{message:'Response lost'}};}return {data:result()};
 }}};
 const c=createCloud(client);await c.session();await c.load();await c.gameRequest({type:'command',action:{type:'build',key:'metal'}});
 assert.equal(requests.length,2);assert.equal(requests[0].requestId,requests[1].requestId);assert.equal(c.pending,null);
 reject=true;await assert.rejects(c.gameRequest({type:'attack',action:{}}),/Insufficient ships/);assert.equal(c.pending,null);
});
