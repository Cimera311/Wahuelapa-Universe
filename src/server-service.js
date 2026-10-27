import {processWorld,projectPvP} from './server-world.js';
import {measure,measureAsync} from './server-metrics.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const value=result=>{if(result.error){const e=Error(result.error.message);e.status=503;throw e;}return result.data;};
export async function missionId(uid,requestId){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid.toLowerCase()+':'+requestId.toLowerCase()))).slice(0,16);bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
export async function runServerCommand(db,uid,input,metrics,options={}){
 const compact=options.snapshot==='compact';metrics?.mode(compact?'compact':'legacy');
 metrics?.label(input);
 if(!uuid.test(uid)||!input||typeof input!=='object')throw Error('Ungültige Anfrage.');
 const mutating=input.type!=='sync';
 if(mutating&&!uuid.test(input.requestId))throw Error('Eine eindeutige Auftrags-ID fehlt.');
 // Admin engine selection is persisted independently of world commits.
 // SQL RPC enforces pvp_admins; selecting the current value is idempotent.
 if(input.type==='set-combat'){
  if(![3,4,5,6,7].includes(input.engine))throw Error('Unbekannte Kampfengine.');
  value(await measureAsync(metrics,'admin',()=>db.rpc('imperium_set_combat_engine',{p_uid:uid,p_engine:input.engine})));
  try{return await runServerCommand(db,uid,{type:'sync'},metrics,options);}finally{metrics?.label(input);}
 }
 const requestId=mutating?input.requestId:null;
 const eventId=mutating?await missionId(uid,requestId):null,combatSeed=crypto.randomUUID();
 for(let retry=0;retry<5;retry++){
  metrics?.attempt();
  const snapshot=value(await measureAsync(metrics,'snapshot',()=>db.rpc(compact?'imperium_pvp_snapshot_compact':'imperium_pvp_snapshot',{p_uid:uid,p_request_id:requestId})));
  metrics?.snapshot(snapshot);
  if(compact&&(snapshot.snapshotFormat!=='compact-v1'||!Array.isArray(snapshot.attackReports)))throw Object.assign(Error('Kompakter Snapshot ist inkompatibel. Bitte Test-SQL pruefen.'),{status:503});
  if(snapshot.receipt&&JSON.stringify(snapshot.receipt)!==JSON.stringify(input)){
   // JSONB key order is canonicalized by PostgreSQL; compare recursively.
   const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
   if(JSON.stringify(canonical(snapshot.receipt))!==JSON.stringify(canonical(input)))throw Error('Diese Auftrags-ID wurde bereits anders verwendet.');
  }
  const w=measure(metrics,'simulation',()=>processWorld(snapshot,uid,snapshot.receipt?{type:'sync'}:{...input,eventId,combatSeed},metrics));
  // Returned history is read-only projection input; never send it to a writer.
  const {attackReports,snapshotFormat,...compactWorld}=w;
  const commitWorld=compact?compactWorld:w;
  const ok=value(await measureAsync(metrics,'commit',()=>db.rpc('imperium_pvp_commit',{p_world:commitWorld,p_expected:snapshot.settings.epoch,p_uid:uid,p_request_id:requestId,p_payload:input})));
  metrics?.committed(ok);
  if(!ok)continue;
  // Read the latest canonical own save; another valid request may have committed
  // in between. Never return the internal world snapshot to a browser.
  const row=value(await measureAsync(metrics,'read',()=>db.from('game_saves').select('state,revision').eq('user_id',uid).maybeSingle()));
  return {state:row?.state||null,revision:row?.revision||0,pvp:measure(metrics,'projection',()=>projectPvP(w,uid))};
 }
 throw Error('Mehrere gleichzeitige Aktionen. Bitte erneut versuchen.');
}
