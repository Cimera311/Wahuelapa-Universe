// Server-only telemetry: bounded labels and no player or payload data.
const phases=new Set(['auth','snapshot','snapshotBytes','simulation','pvp','pve','commit','read','projection','serialization','admin']);
const types=new Set(['sync','new','command','pirate','social','galaxy','attack','set-pvp','set-combat','rename']);
const actions=new Set(['build','research','ship','demolish','repair','scrap-ship','route','attack','scan']);
export function createCommandMetrics({rate=0,random=Math.random,clock=()=>performance.now(),emit=line=>console.log(line),id=()=>crypto.randomUUID()}={}){
 rate=Number(rate);if(!Number.isFinite(rate)||rate<=0||random()>=Math.min(1,rate))return undefined;
 const started=clock(),request=id(),totals={},counts={},attempts=[];let current,finished=false,type='unknown',action='other',responseBytes=0,snapshotMode='legacy';
 const round=n=>Math.round(n*1000)/1000;
 const stop=name=>{const begin=clock();return ()=>{const ms=Math.max(0,clock()-begin);totals[name]=(totals[name]||0)+ms;if(current)current.ms[name]=(current.ms[name]||0)+ms;};};
 return {
  mode(value){snapshotMode=value==='compact'?'compact':'legacy';},
  label(input){type=types.has(input?.type)?input.type:'unknown';action=actions.has(input?.action?.type)?input.action.type:'other';},
  start(name){return phases.has(name)?stop(name):()=>{};},
  count(name){if(['events','pvpBattles','pveBattles'].includes(name)){counts[name]=(counts[name]||0)+1;if(current)current.counts[name]=(current.counts[name]||0)+1;}},
  attempt(){current={attempt:attempts.length+1,ms:{},counts:{},snapshotBytes:0,committed:false};attempts.push(current);},
  snapshot(value){const end=stop('snapshotBytes');try{if(current)current.snapshotBytes=new TextEncoder().encode(JSON.stringify(value)).byteLength;}finally{end();}},
  committed(ok){if(current)current.committed=!!ok;},
  response(text){responseBytes=new TextEncoder().encode(text).byteLength;},
  finish(status){
   if(finished)return;finished=true;
   const rounded=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,round(v)]));
   const record={kind:'game_command_metrics',schema:1,request,type,action,snapshotMode,status,totalMs:round(clock()-started),ms:rounded(totals),counts,responseBytes,retries:Math.max(0,attempts.length-1),attempts:attempts.map(a=>({...a,ms:rounded(a.ms)}))};
   try{emit(JSON.stringify(record));}catch{}
  }
 };
}
export function measure(metrics,name,fn){const end=metrics?.start(name);try{return fn();}finally{end?.();}}
export async function measureAsync(metrics,name,fn){const end=metrics?.start(name);try{return await fn();}finally{end?.();}}
