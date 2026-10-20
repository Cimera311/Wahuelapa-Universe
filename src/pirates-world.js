import {PIRATE_STATION_META,pirateConfig,pirateFlight,pirateCooldownMinutes} from './pirates-config.js';
import {RES,SHIPS,attackSlots,vector,isFreighter} from './config.js';
import {getPlanet,fleetCapacity,unloadCargo,cargoPresent,nextCargoSpaceEvent,settle} from './engine.js';
import {attackFleet,takeHulls,putHulls,resolveBattle,COMBAT_RULE_VERSION} from './combat.js';
import {resolveBattleHybrid} from './combat-hybrid.js';
import {REALM_COMBAT_OVERRIDES} from './realm-config.js';
const pirateZero=()=>vector([0,0,0]);
const pirateState=(w,uid)=>w.saves.find(r=>r.user_id===uid)?.state;
const pirateOwner=(w,uid)=>w.piratePlayers?.find(r=>r.user_id===uid);
function pirateLog(s,time,title,body){s.reports.unshift({id:++s.seq,time,title,body:body.slice(0,1000)});s.reports=s.reports.slice(0,60);}
function spawnPirate(meta,c,time,old){const b=c.stations[meta.id],cooldownMs=pirateCooldownMinutes(c,meta.id)*60000;return {id:meta.id,generation:(old?.generation||0)+1,sensor:b.sensor,enabled:b.enabled,tech:{...b.tech},fleet:Object.fromEntries(Object.entries(b.fleet).map(([k,n])=>[k,Math.max(1,Math.round(n*c.strengthFactor))])),hulls:{},resources:vector(RES.map(k=>Math.floor(b.resources[k]*c.resourceFactor))),debris:{...old?.debris||pirateZero()},debrisExpiresAt:old?.debrisExpiresAt||0,refreshAt:time+cooldownMs,nextAttackAt:0,lastAttackAt:old?.lastAttackAt||0,scan:null,defeated:false,cooldownMs,debrisRate:c.debrisRate,debrisLifetimeMs:c.debrisLifetimeHours*3600000};}
export function preparePirates(w){if(w.pirateVersion!==1)return;w.pirateConfig=pirateConfig(w.pirateConfig||{});w.piratePlayers??=[];for(const row of w.piratePlayers)for(const meta of PIRATE_STATION_META)syncPirateCooldown(w,row,meta);}
// Rebase an existing wait on the original battle, never on the current request.
function syncPirateCooldown(w,row,meta){
 const q=row.stations[meta.id];if(!q)return;const next=pirateCooldownMinutes(w.pirateConfig,meta.id)*60000,old=q.cooldownMs||3600000;
 q.lastAttackAt??=q.nextAttackAt?q.nextAttackAt-old:row.reports.find(r=>r.station===meta.id)?.at||0;
 if(old===next)return;
 const deadline=q.lastAttackAt+next;
 if(q.nextAttackAt||q.lastAttackAt&&deadline>w.now){q.nextAttackAt=deadline;q.refreshAt=deadline;}else q.refreshAt=q.refreshAt-old+next;
 q.cooldownMs=next;
}
export function refreshPirates(w,time){
 if(w.pirateVersion!==1)return;
 for(const row of w.piratePlayers)for(const meta of PIRATE_STATION_META){
  syncPirateCooldown(w,row,meta);
  let q=row.stations[meta.id];
  if(!q||time>=q.refreshAt&&!row.missions.some(m=>m.station===meta.id&&m.kind==='attack'&&m.status==='outbound'))q=row.stations[meta.id]=spawnPirate(meta,w.pirateConfig,time,q);
  if(q.debrisExpiresAt&&time>=q.debrisExpiresAt){q.debris=pirateZero();q.debrisExpiresAt=0;}
 }
}
function pirateReady(w,uid){if(w.pirateVersion!==1)throw Error('Piraten benötigen zuerst die PvE-SQL und die neue Game-command.');}
function ensurePirateOwner(w,uid){let row=pirateOwner(w,uid);if(!row){row={user_id:uid,stations:{},missions:[],reports:[]};w.piratePlayers.push(row);}refreshPirates(w,w.now);return row;}
export function pirateAction(w,uid,action,id,seed){
 pirateReady(w,uid);
 const s=pirateState(w,uid);if(!s)throw Error('Spielstand fehlt.');
 if(action.op==='configure'){if(!w.admins.includes(uid))throw Error('Nur Administratoren dürfen die Piraten-Realm-Einstellungen ändern.');w.pirateConfig=pirateConfig(action.config);return;}
 const row=ensurePirateOwner(w,uid);
 if(action.op==='open')return;
 const meta=PIRATE_STATION_META.find(x=>x.id===action.station),q=row.stations[action.station];
 if(!meta||!q)throw Error('Unbekannte Piratenstation.');
 if(!w.pirateConfig.enabled||!w.pirateConfig.stations[meta.id].enabled)throw Error('Diese Piratenstation ist pausiert.');
 if(!['scan','attack','collect','salvage'].includes(action.op))throw Error('Unbekannter Piratenauftrag.');
 if(row.missions.length>=w.pirateConfig.maxMissions)throw Error('Alle Piraten-Missionsplätze sind belegt.');
 const from=getPlanet(s,action.from),kind=action.op;
 let fleet;
 if(kind==='scan'){
  if((s.tech.scout||0)<q.sensor)throw Error('Sensortechnik '+q.sensor+' benötigt.');
  if(row.missions.some(m=>m.station===meta.id&&m.kind==='scan'&&m.status==='outbound'))throw Error('Eine Spionagesonde ist bereits unterwegs.');
  fleet={spyProbe:1};
 }else if(kind==='attack'){
  if(w.now<q.nextAttackAt||row.missions.some(m=>m.station===meta.id&&m.kind==='attack'&&m.status==='outbound'))throw Error('Diese Station hat noch Angriffs-Cooldown oder einen Angriff im Anflug.');
  const slots=attackSlots(s.tech.military||0),used=row.missions.filter(m=>m.kind==='attack').length+w.attacks.filter(m=>m.attacker_id===uid&&m.status!=='returned').length;
  if(used>=slots)throw Error('Alle Angriffsplätze sind belegt.');
  fleet=attackFleet(action.fleet);
 }else{
  fleet=action.fleet;
  if(!fleet||Array.isArray(fleet)||!Object.keys(fleet).length||Object.entries(fleet).some(([k,n])=>!isFreighter(k)||!Number.isSafeInteger(n)||n<1))throw Error('Wähle verfügbare Frachter in ganzen Zahlen.');
  if(kind==='collect'&&!q.defeated)throw Error('Das Depot ist noch von Piraten bewacht.');
  if(kind==='salvage'&&!RES.some(k=>q.debris[k]>0))throw Error('Kein Trümmerfeld vorhanden.');
 }
 for(const [k,n] of Object.entries(fleet))if((from.ships[k]||0)<n)throw Error('Nicht genügend verfügbare '+SHIPS[k].name+'.');
 const f=pirateFlight(s,from,meta,fleet,w.pirateConfig);settle(from);
 if(from.resources.fuel<f.fuel)throw Error('Nicht genug Treibstoff für Hin- und Rückflug.');
 const hulls=takeHulls(from,fleet);from.resources.fuel-=f.fuel;for(const [k,n] of Object.entries(fleet))from.ships[k]-=n;
 const version=[3,4,5,6,7].includes(w.settings.combat_engine)?w.settings.combat_engine:COMBAT_RULE_VERSION;
 row.missions.push({id,kind,station:meta.id,generation:q.generation,from:from.id,fleet:{...fleet},initialFleet:{...fleet},hulls,tech:{...s.tech},shieldUntil:from.shieldUntil||0,startedAt:w.now,arrivalAt:w.now+f.ms,due:w.now+f.ms,duration:f.ms,status:'outbound',cargo:pirateZero(),fuel:f.fuel,ruleVersion:version,combatConfig:version>=6?structuredClone(REALM_COMBAT_OVERRIDES.test4):{},seed});
 pirateLog(s,w.now,'Piratenauftrag gestartet',meta.name+' · '+({scan:'Spionagesonde',attack:'Angriff',collect:'Depot abholen',salvage:'Trümmer bergen'})[kind]+' · Start: '+from.name);
}
export function pirateEvents(w){
 if(w.pirateVersion!==1)return [];
 return w.piratePlayers.flatMap(row=>row.missions.map(m=>({time:m.awaitingUnload?nextCargoSpaceEvent(pirateState(w,row.user_id),getPlanet(pirateState(w,row.user_id),m.from)):m.due,id:m.id,kind:'pirate',mission:m,owner:row.user_id,order:m.status==='outbound'?2:3})).filter(e=>Number.isFinite(e.time)));
}
function takePirateCargo(stock,room){const cargo=pirateZero();for(const k of RES){const n=Math.min(Math.floor(stock[k]),room);stock[k]-=n;cargo[k]=n;room-=n;}return cargo;}
function pirateReport(row,r){row.reports.unshift(r);row.reports=row.reports.slice(0,30);}
export function arrivePirate(w,uid,m,time){
 const row=pirateOwner(w,uid),s=pirateState(w,uid),meta=PIRATE_STATION_META.find(x=>x.id===m.station);
 if(m.status==='returning'){returnPirate(w,row,m,time);return;}
 refreshPirates(w,time);
 const station=row.stations[m.station];
 if(m.kind==='scan'){
  if((s.tech.scout||0)>=station.sensor){station.scan={at:time,generation:station.generation,fleet:{...station.fleet},resources:{...station.resources},tech:{...station.tech}};pirateLog(s,time,'Spionagebericht',meta.name+' aufgeklärt. Flotte und Depot im Piratenbereich einsehbar.');}
  else pirateLog(s,time,'Spionage gescheitert','Die Station benötigt inzwischen höhere Sensortechnik.');
 }else if(m.kind==='attack'){
  const resolver=[4,5,6,7].includes(m.ruleVersion)?resolveBattleHybrid:resolveBattle;
  const before={...station.fleet};
  const result=resolver({fleet:m.fleet,tech:m.tech,hulls:m.hulls,shieldFactor:m.shieldUntil?Math.max(0,Math.min(1,1-(m.shieldUntil-time)/300000)):1},{fleet:station.fleet,tech:station.tech,hulls:station.hulls},m.seed||m.id,m.ruleVersion,m.combatConfig);
  const debris=pirateZero();
  for(const [side,after] of [[m.fleet,result.attacker.fleet],[before,result.defender.fleet]])for(const [k,n] of Object.entries(side)){const lost=n-(after[k]||0);debris.metal+=lost*SHIPS[k].cost[0]*station.debrisRate;debris.crystal+=lost*SHIPS[k].cost[1]*station.debrisRate;}
  for(const k of RES){debris[k]=Math.floor(debris[k]);station.debris[k]+=debris[k];}
  if(RES.some(k=>debris[k]>0))station.debrisExpiresAt=time+station.debrisLifetimeMs;
  station.fleet=result.defender.fleet;station.hulls=result.defender.hulls;station.defeated=!Object.values(station.fleet).some(n=>n>0);
  station.lastAttackAt=time;station.nextAttackAt=time+station.cooldownMs;station.refreshAt=station.nextAttackAt;
  m.fleet=result.attacker.fleet;m.hulls=result.attacker.hulls;m.shieldUntil=time+300000;
  if(result.outcome==='attacker')m.cargo=takePirateCargo(station.resources,fleetCapacity({tech:m.tech},m.fleet));
  pirateReport(row,{id:m.id,station:m.station,at:time,outcome:result.outcome,ruleVersion:m.ruleVersion,rounds:result.rounds,attackerBefore:{...m.initialFleet},attackerAfter:{...m.fleet},defenderBefore:before,defenderAfter:{...station.fleet},cargo:{...m.cargo},debris});
  pirateLog(s,time,'PvE-Kampfbericht',meta.name+' · '+(result.outcome==='attacker'?'Sieg':result.outcome==='defender'?'Niederlage':'Unentschieden')+' · '+result.rounds.length+' Runden. Details unter Galaxie → Piraten.');
  station.scan=null;
 }else if(m.kind==='salvage')m.cargo=takePirateCargo(station.debris,fleetCapacity({tech:m.tech},m.fleet));
 else if(station.defeated)m.cargo=takePirateCargo(station.resources,fleetCapacity({tech:m.tech},m.fleet));
 else pirateLog(s,time,'Piraten-Abholung abgebrochen','Die Station wurde erneuert. Dein Frachter kehrt ohne Beute zurück.');
 if(!Object.values(m.fleet).some(n=>n>0)){row.missions=row.missions.filter(x=>x.id!==m.id);return;}
 m.status='returning';m.due=time+m.duration;
}
function returnPirate(w,row,m,time){
 const s=pirateState(w,row.user_id),p=getPlanet(s,m.from);unloadCargo(p,m.cargo);
 if(cargoPresent(m.cargo)){m.awaitingUnload=true;return;}
 for(const [k,n] of Object.entries(m.fleet))p.ships[k]+=n;
 putHulls(p,m.hulls);p.shieldUntil=Math.max(p.shieldUntil||0,m.shieldUntil||0);
 row.missions=row.missions.filter(x=>x.id!==m.id);
 pirateLog(s,time,'Piratenflotte zurückgekehrt',PIRATE_STATION_META.find(x=>x.id===m.station).name+' · Schiffe und Ladung auf '+p.name+' eingetroffen.');
}
export function settlePirates(w,time){if(w.pirateVersion!==1)return;for(const row of w.piratePlayers)for(const m of [...row.missions])if(m.awaitingUnload)returnPirate(w,row,m,time);}
export function pirateFleetShadows(w){if(w.pirateVersion!==1)return;for(const row of w.saves)row.state.pveFleets=(pirateOwner(w,row.user_id)?.missions||[]).map(m=>({fleet:{...m.fleet}}));}
export function projectPirates(w,uid){
 if(w.pirateVersion!==1||!pirateState(w,uid))return null;
 const row=pirateOwner(w,uid);
 return {config:w.admins.includes(uid)?structuredClone(w.pirateConfig):{flightTimeFactor:w.pirateConfig.flightTimeFactor,fuelFactor:w.pirateConfig.fuelFactor},stations:PIRATE_STATION_META.map(meta=>{const q=row?.stations[meta.id];return {...meta,cooldownMinutes:pirateCooldownMinutes(w.pirateConfig,meta.id),sensor:q?.sensor??w.pirateConfig.stations[meta.id].sensor,enabled:w.pirateConfig.enabled&&w.pirateConfig.stations[meta.id].enabled,initialized:!!q,generation:q?.generation,refreshAt:q?.refreshAt||0,nextAttackAt:q?.nextAttackAt||0,defeated:!!q?.defeated,debris:{...q?.debris||pirateZero()},debrisExpiresAt:q?.debrisExpiresAt||0,scan:q?.scan?structuredClone(q.scan):null};}),missions:structuredClone(row?.missions||[]).map(({seed,combatConfig,initialFleet,...m})=>m),reports:structuredClone(row?.reports||[])};
}
// Returning PvE fleets waiting for warehouse space remain vulnerable in the origin orbit.
export function pirateDefense(w,uid,planet){return (pirateOwner(w,uid)?.missions||[]).filter(m=>m.awaitingUnload&&m.from===planet).map(m=>({id:'pirate:'+m.id,owner:uid,commander:'PvE-Rückkehrer',fleet:{...m.fleet},hulls:m.hulls,tech:m.tech}));}
export function reconcilePirateDefense(w,uid,groups,result,time){const row=pirateOwner(w,uid);for(const g of groups){const m=row.missions.find(x=>'pirate:'+x.id===g.id),after=result.defenderGroups.find(x=>x.id===g.id);m.fleet=after.fleet;m.hulls=after.hulls;m.shieldUntil=time+300000;g.fleet=after.fleet;let room=fleetCapacity({tech:m.tech},m.fleet);for(const k of RES){m.cargo[k]=Math.min(m.cargo[k],room);room-=m.cargo[k];}if(!Object.keys(m.fleet).length)row.missions=row.missions.filter(x=>x.id!==m.id);}}
