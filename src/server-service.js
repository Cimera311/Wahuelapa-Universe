import {processWorld,projectPvP} from './server-world.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const value=result=>{if(result.error){const e=Error(result.error.message);e.status=503;throw e;}return result.data;};
export async function missionId(uid,requestId){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid.toLowerCase()+':'+requestId.toLowerCase()))).slice(0,16);bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
export async function runServerCommand(db,uid,input){
 if(!uuid.test(uid)||!input||typeof input!=='object')throw Error('Ungültige Anfrage.');
 const mutating=input.type!=='sync';
 if(mutating&&!uuid.test(input.requestId))throw Error('Eine eindeutige Auftrags-ID fehlt.');
 const requestId=mutating?input.requestId:null;
 const eventId=mutating?await missionId(uid,requestId):null,combatSeed=crypto.randomUUID();
 for(let retry=0;retry<5;retry++){
  const snapshot=value(await db.rpc('imperium_pvp_snapshot',{p_uid:uid,p_request_id:requestId}));
  if(snapshot.receipt&&JSON.stringify(snapshot.receipt)!==JSON.stringify(input)){
   // JSONB key order is canonicalized by PostgreSQL; compare recursively.
   const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
   if(JSON.stringify(canonical(snapshot.receipt))!==JSON.stringify(canonical(input)))throw Error('Diese Auftrags-ID wurde bereits anders verwendet.');
  }
  const w=processWorld(snapshot,uid,snapshot.receipt?{type:'sync'}:{...input,eventId,combatSeed});
  const ok=value(await db.rpc('imperium_pvp_commit',{p_world:w,p_expected:snapshot.settings.epoch,p_uid:uid,p_request_id:requestId,p_payload:input}));
  if(!ok)continue;
  // Read the latest canonical own save; another valid request may have committed
  // in between. Never return the internal world snapshot to a browser.
  const row=value(await db.from('game_saves').select('state,revision').eq('user_id',uid).maybeSingle());
  return {state:row?.state||null,revision:row?.revision||0,pvp:projectPvP(w,uid)};
 }
 throw Error('Mehrere gleichzeitige Aktionen. Bitte erneut versuchen.');
}
