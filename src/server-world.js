import {preparePirates,refreshPirates,pirateAction,pirateEvents,arrivePirate,settlePirates,pirateFleetShadows,projectPirates,pirateDefense,reconcilePirateDefense} from './pirates-world.js';
import {repairDefense,reconcileRepairBattle,recordDisabledDefenses} from './repair.js';
import {socialAction,settleSocialCargo,socialEvents,arriveSocial,socialDefense,socialProjection} from './social-world.js';
import {RES,attackSlots,BUILDINGS,SHIPS,vector} from './config.js';
import {newGame,getPlanet,advance,act,capacity,settle,fleetCapacity,unloadCargo,cargoPresent,nextCargoSpaceEvent} from './engine.js';
import {validateSave,SaveValidationError} from './storage.js';
import {galaxyFlight} from './galaxy.js';
import {GALAXY_FLIGHT_RULE_VERSION} from './flight.js';
import {attackFleet,attackFlight,warningFraction,resolveBattle,COMBAT_RULE_VERSION,loadPlunder,takeHulls,putHulls} from './combat.js';
import {resolveBattleHybrid} from './combat-hybrid.js';
import {REALM_COMBAT_OVERRIDES} from './realm-config.js';
import {measure} from './server-metrics.js';
export const DAY=86400000;
// REALM-CANDIDATE[colonyProtection]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const COLONY_PROTECTION=3600000;
const ms=v=>typeof v==='number'?v:Date.parse(v);
const zero=()=>vector([0,0,0]);
function log(s,time,title,body){s.reports.unshift({id:++s.seq,time:Math.max(time,s.time),title,body:body.slice(0,1000)});s.reports=s.reports.slice(0,60);}
function subtract(p,cost){settle(p);for(const k of RES)if(p.resources[k]<cost[k])throw Error('Lokale Ressourcen reichen nicht.');for(const k of RES)p.resources[k]-=cost[k];settle(p);}
function withdraw(p,cargo){for(const k of RES){const n=Math.min(p.resources[k],cargo[k]);p.resources[k]-=n;p.depot[k]-=cargo[k]-n;}settle(p);}
function fleetText(fleet){return Object.entries(fleet).map(([k,n])=>n+' × '+SHIPS[k].name).join(', ')||'keine';}
// A failed shared-world validation must abort before commit. Expose only a
// phase and static rule ID, never the affected player's identity or save data.
function validateWorldSave(state,phase){
 try{return validateSave(state);}catch(error){
  if(error instanceof SaveValidationError){
   error.code='WORLD_SAVE_INVALID';error.phase=phase;error.status=503;
   error.message+=' Diagnose: '+phase+'/'+error.rule+'.';
  }
  throw error;
 }
}
export function prepareWorld(snapshot){
 const w=structuredClone(snapshot);
 w.now=ms(w.now);
 w.saves=w.saves.map(row=>({...row,state:validateWorldSave(row.state,'stored')}));
 w.partners=(w.partners||[]).filter(p=>p.status!=='ended');w.socialMissions=(w.socialMissions||[]).filter(m=>!['returned','lost'].includes(m.status));w.trades=(w.trades||[]).filter(t=>t.status==='offered'&&t.expires>w.now);w.attacks??=[];w.missions??=[];w.surveys??=[];w.planets??=[];w.starts??=[];w.admins??=[];
 for(const p of w.planets)if(p.colonized_at)p.colonized_at=ms(p.colonized_at);
 for(const m of w.missions)for(const key of ['started_at','arrival_at','finish_at'])m[key]=ms(m[key]);
 preparePirates(w);
 return w;
}
function stateOf(w,id){const row=w.saves.find(x=>x.user_id===id);if(!row)throw Error('Spielstand fehlt.');return row.state;}
// REALM-CANDIDATE[colonyStart]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
function makeColony(meta,time){
 return {...meta,colonizedAt:time,resources:vector([350,250,100]),depot:zero(),reserves:zero(),buildings:{...Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,0])),solar:2},ships:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,0])),build:null,shipjob:null};
}
function finishGalaxy(w,m,time){
 const s=stateOf(w,m.user_id),p=getPlanet(s,m.from_id);
 if(m.kind==='scan'){p.ships.longProbe++;log(s,time,'Fernsonde zurückgekehrt',m.planet_id);}
 else{
  const target=w.planets.find(p=>p.id===m.planet_id);
  if(target.owner_id!==m.user_id||!target.reserved)throw Error('Koloniereservierung fehlt.');
  if(!s.planets.some(p=>p.id===target.id))s.planets.push(makeColony(target.meta,time));
  target.reserved=false;target.colonized_at=time;target.protection_ended=false;
  log(s,time,'Galaxiekolonie gegründet',target.meta.name);
 }
 m.completed=true;
}
function survey(w,m){if(!w.surveys.some(q=>q.user_id===m.user_id&&q.planet_id===m.planet_id))w.surveys.push({user_id:m.user_id,planet_id:m.planet_id});}
// REALM-CANDIDATE[shieldRecovery]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
function shieldFactor(until,time){return until?Math.max(0,Math.min(1,1-(until-time)/300000)):1;}
function resolveAttack(w,m,time,metrics){
 const a=stateOf(w,m.attacker_id),target=w.planets.find(p=>p.id===m.to),row=w.saves.find(x=>x.user_id===m.defender_id);
 if(!target||target.owner_id!==m.defender_id||target.reserved||!row||(!target.protection_ended&&time<(target.colonized_at||time)+COLONY_PROTECTION)){
  m.status='returning';m.survivors={...m.fleet};m.return_hulls=m.hulls;m.cargo=zero();m.resolved_at=w.now;
  m.report={outcome:'cancelled',at:time,reason:'Das Ziel ist nicht mehr angreifbar.'};log(a,time,'Angriff abgebrochen',m.report.reason);return;
 }
 const d=row.state,p=getPlanet(d,m.to),defense={fleet:{...p.ships},tech:{...d.tech},hulls:p.hulls,shieldFactor:shieldFactor(p.shieldUntil,time)};
 const pausedRoutes=d.missions.filter(r=>r.awaitingUnload===m.to||r.type==='route'&&r.paused&&r.home===m.to);
 const parked=pausedRoutes.map(r=>({id:'route:'+r.id,owner:m.defender_id,commander:d.name+' · '+(r.name||'Wartet auf Lagerplatz'),fleet:{...r.fleet||{[r.ship]:r.count}},hulls:r.hulls,tech:{...d.tech},shieldFactor:shieldFactor(r.shieldUntil,time)}));
 const dockedRaids=w.attacks.filter(r=>r.awaitingUnload&&r.status==='returning'&&r.attacker_id===m.defender_id&&r.from===m.to);
 parked.push(...dockedRaids.map(r=>({id:'raid:'+r.id,owner:m.defender_id,commander:d.name+' · Rückkehrende Angriffsflotte',fleet:r.survivors,hulls:r.return_hulls,tech:r.combat.tech,shieldFactor:shieldFactor(r.shieldUntil,time)})));
 const pveParked=pirateDefense(w,m.defender_id,m.to);parked.push(...pveParked);
 const repairs=repairDefense(p,m.defender_id,d.name,{...d.tech},shieldFactor(p.shieldUntil,time));
 const supporting=socialDefense(w,m.defender_id,m.to,time);if(supporting.length||parked.length||repairs.length)defense.groups=[{id:'host',owner:m.defender_id,commander:d.name,...defense},...parked,...repairs,...supporting];
 // Mission rules are pinned at launch; v4 is opt-in only until the log storage
 // and admin controls are migrated. Existing missions retain their original engine.
 const version=m.ruleVersion||1;
 const resolver=[4,5,6,7].includes(version)?resolveBattleHybrid:resolveBattle;
 metrics?.count('pvpBattles');
 const result=measure(metrics,'pvp',()=>[4,5,6,7].includes(version)
  ?resolver({...m.combat,shieldFactor:shieldFactor(m.shieldUntil,time)},defense,m.seed||m.id,version,version>=6?(m.combatConfig||REALM_COMBAT_OVERRIDES.test4):{})
  :resolver({...m.combat,shieldFactor:shieldFactor(m.shieldUntil,time)},defense,m.seed||m.id,version));
 if(pveParked.length)reconcilePirateDefense(w,m.defender_id,pveParked,result,time);
 const repairBefore=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,repairs.reduce((n,g)=>n+(g.fleet[k]||0),0)]));
 if(repairs.length)reconcileRepairBattle(p,result);
 const repairAfter=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,(p.repairQueue||[]).filter(j=>j.key===k&&!j.restore).reduce((n,j)=>n+j.entries.length,0)]));
 const before={...p.ships},homeResult=result.defenderGroups?.find(g=>g.id==='host')||result.defender;
 for(const r of pausedRoutes){const after=result.defenderGroups.find(g=>g.id==='route:'+r.id);r.fleet=after.fleet;r.hulls=after.hulls;let room=fleetCapacity(d,r.fleet);for(const k of RES){r.cargo[k]=Math.min(r.cargo[k],room);room-=r.cargo[k];}r.shieldUntil=time+300000;if(!Object.keys(r.fleet).length){d.missions=d.missions.filter(x=>x.id!==r.id);log(d,time,'Gebundene Flotte zerstört',r.name||'Restladung wartet auf Lagerplatz');}else{[r.ship,r.count]=Object.entries(r.fleet)[0];}}
 for(const r of dockedRaids){const after=result.defenderGroups.find(g=>g.id==='raid:'+r.id);r.survivors=after.fleet;r.return_hulls=after.hulls;r.shieldUntil=time+300000;let room=fleetCapacity({tech:r.combat.tech},r.survivors);for(const k of RES){r.cargo[k]=Math.min(r.cargo[k],room);room-=r.cargo[k];}if(!Object.keys(r.survivors).length){r.status='returned';delete r.awaitingUnload;}}
 const hostBefore=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,before[k]+repairBefore[k]+parked.reduce((n,g)=>n+(g.fleet[k]||0),0)]));
 const hostAfter=Object.fromEntries(Object.keys(SHIPS).map(k=>[k,(homeResult.fleet[k]||0)+repairAfter[k]+pausedRoutes.reduce((n,r)=>n+(r.fleet[k]||0),0)+dockedRaids.reduce((n,r)=>n+(r.survivors[k]||0),0)+pveParked.reduce((n,g)=>n+(g.fleet[k]||0),0)]));
 const supportReports=[];for(const group of supporting){const after=result.defenderGroups.find(g=>g.id===group.id),mission=w.socialMissions.find(x=>x.id===group.id);mission.fleet=after.fleet;mission.hulls=after.hulls;let cargoRoom=fleetCapacity(stateOf(w,mission.owner),mission.fleet);for(const k of RES){mission.cargo[k]=Math.min(mission.cargo[k],cargoRoom);cargoRoom-=mission.cargo[k];}mission.shieldUntil=time+300000;if(!Object.keys(after.fleet).length){mission.status='lost';delete mission.awaitingUnload;}supportReports.push({owner:group.owner,commander:group.commander,before:group.fleet,after:after.fleet});log(stateOf(w,group.owner),time,'PvP-Kampfbericht','Deine Unterstützung auf '+p.name+' hat mitverteidigt. Übrig: '+fleetText(after.fleet));}
 recordDisabledDefenses(p,before,homeResult.fleet);
 for(const key of Object.keys(SHIPS))p.ships[key]=homeResult.fleet[key]||0;
 p.hulls=homeResult.hulls;p.shieldUntil=time+300000;
 p.defenseSalvage??=zero();for(const k of RES)p.defenseSalvage[k]+=result.defenseRepair[k];
// REALM-CANDIDATE[bunker]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
 const bunker=Math.min(2000,capacity(p)*.025*(p.buildings.bunker||0));
 const cap=fleetCapacity({tech:m.combat.tech},result.attacker.fleet);
 const field=vector(RES.map(k=>(target.debris?.[k]||0)+result.debris[k]));
 const cargo=loadPlunder(p.resources,p.depot,bunker,cap,field,result.outcome==='attacker');
 withdraw(p,cargo.loot);
 target.debris??=zero();for(const k of RES)target.debris[k]=field[k]-cargo.salvage[k];
 m.status=Object.keys(result.attacker.fleet).length?'returning':'returned';m.resolved_at=w.now;m.survivors=result.attacker.fleet;m.return_hulls=result.attacker.hulls;m.cargo=cargo.cargo;m.shieldUntil=time+300000;
 if(result.trace)result.trace.participants={attacker:a.name,defender:d.name+(supporting.length?' mit '+supporting.map(g=>g.commander).join(', '):'')};
 m.report={at:time,outcome:result.outcome,ruleVersion:m.ruleVersion||1,traceAvailable:!!result.trace,...(result.trace?{trace:result.trace}:{}),rounds:result.rounds,attackerBefore:m.fleet,attackerAfter:m.survivors,defenderBefore:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,hostBefore[k]+supporting.reduce((n,g)=>n+(g.fleet[k]||0),0)])),defenderAfter:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,result.defender.fleet[k]||0])),hostBefore,hostAfter,...(supporting.length?{supporting:supportReports}:{}),loot:cargo.loot,salvage:cargo.salvage,debrisLeft:{...target.debris},defenseRepair:result.defenseRepair};
 const outcome=result.outcome==='attacker'?'Angreifer gewinnt':result.outcome==='defender'?'Verteidiger gewinnt':'Unentschieden';
 const body=outcome+' · '+target.meta.name+' · '+result.rounds.length+' Runden. Angreifer übrig: '+fleetText(m.survivors)+'. Beute M/K/T: '+RES.map(k=>cargo.loot[k]).join('/')+'. Trümmer geborgen M/K: '+cargo.salvage.metal+'/'+cargo.salvage.crystal+'.';
 log(a,time,'PvP-Kampfbericht',body);log(d,time,'PvP-Kampfbericht',body);
}
function returnAttack(w,m,time){
 const s=stateOf(w,m.attacker_id),p=getPlanet(s,m.from);unloadCargo(p,m.cargo||zero());
 if(cargoPresent(m.cargo||zero())){if(!m.awaitingUnload)log(s,time,'Angriffsflotte wartet auf Lagerplatz','Restladung bleibt an Bord; Schiffe und Angriffsplatz bleiben gebunden.');m.awaitingUnload=true;return;}
 delete m.awaitingUnload;for(const [k,n] of Object.entries(m.survivors||{}))p.ships[k]+=n;
 putHulls(p,m.return_hulls);p.shieldUntil=Math.max(p.shieldUntil||0,m.shieldUntil||0);
 log(s,time,'Angriffsflotte zurückgekehrt',fleetText(m.survivors||{})+' · Ladung wurde eingelagert.');m.status='returned';
}
function settleRaidCargo(w,time){for(const m of w.attacks)if(m.awaitingUnload&&m.status==='returning')returnAttack(w,m,time);}
// Every externally shared event is processed in time order, with the existing engine
// advancing research, construction and local fleets up to that exact cutoff first.
function collectWorldDebris(w,uid,s,m){
 const target=w.planets.find(p=>p.id===m.to);
 // Ownership is checked again at arrival; an unavailable field sends the fleet home empty.
 if(!target||target.owner_id!==uid||target.reserved)return;
 target.debris??=zero();let room=fleetCapacity(s,m.fleet||{[m.ship]:m.count});
 for(const k of RES){const amount=Math.min(room,Math.floor(target.debris[k]||0));m.cargo[k]=amount;target.debris[k]-=amount;room-=amount;}
}
export function advanceWorld(w,metrics){
 let guard=0;
 while(true){
  const events=[...socialEvents(w),...pirateEvents(w)];
  for(const row of w.saves)for(const m of row.state.missions)if(m.type==='salvage'&&m.phase==='outbound')events.push({time:m.due,id:row.user_id+':'+String(m.id).padStart(12,'0'),kind:'salvage',order:-1});
  for(const m of w.missions)if(!m.completed){
   if(m.kind==='scan'&&!w.surveys.some(q=>q.user_id===m.user_id&&q.planet_id===m.planet_id))events.push({time:m.arrival_at,id:m.id,kind:'survey',mission:m,order:0});
   events.push({time:m.finish_at,id:m.id,kind:'galaxy',mission:m,order:1});
  }
  for(const m of w.attacks)if(m.status==='outbound')events.push({time:m.arrival_at,id:m.id,kind:'battle',mission:m,order:2});else if(m.status==='returning'){const p=getPlanet(stateOf(w,m.attacker_id),m.from);if(!m.awaitingUnload)events.push({time:m.return_at,id:m.id,kind:'return',mission:m,order:3});else {const time=nextCargoSpaceEvent(stateOf(w,m.attacker_id),p);if(Number.isFinite(time))events.push({time,id:m.id,kind:'return',mission:m,order:3});}}
  events.sort((a,b)=>a.time-b.time||a.order-b.order||a.id.localeCompare(b.id));
  const e=events[0];if(!e||e.time>w.now)break;
  if(++guard>10000)throw Error('Zu viele fällige Ereignisse.');
  metrics?.count('events');
  for(const row of w.saves)advance(row.state,e.time,(s,m)=>collectWorldDebris(w,row.user_id,s,m));
  refreshPirates(w,e.time);
  if(e.kind==='pirate')arrivePirate(w,e.owner,e.mission,e.time,metrics);
  if(e.kind==='survey')survey(w,e.mission);
  if(e.kind==='galaxy')finishGalaxy(w,e.mission,e.time);
  if(e.kind==='battle')resolveAttack(w,e.mission,e.time,metrics);
  if(e.kind==='social')arriveSocial(w,e.mission,e.time);
  if(e.kind==='return')returnAttack(w,e.mission,e.time);
  settleSocialCargo(w,e.time);settleRaidCargo(w,e.time);settlePirates(w,e.time);
 }
 for(const row of w.saves)advance(row.state,w.now,(s,m)=>collectWorldDebris(w,row.user_id,s,m));
 settleSocialCargo(w,w.now);settleRaidCargo(w,w.now);settlePirates(w,w.now);refreshPirates(w,w.now);
 return w;
}
// REALM-CANDIDATE[galaxyMissionLimits]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
function launchGalaxy(w,uid,action,id){
 const s=stateOf(w,uid),p=getPlanet(s,action.from),target=w.planets.find(p=>p.id===action.to),kind=action.kind;
 if(!['scan','colony'].includes(kind)||!target)throw Error('Unbekannte Galaxiemission.');
 if(s.tech.ramjet<1)throw Error('Staustrahltriebwerke Stufe 1 fehlen.');
 if(w.missions.filter(m=>m.user_id===uid&&!m.completed).length>=100)throw Error('Zu viele Galaxiemissionen.');
 const ship=kind==='scan'?'longProbe':'starColony';
 if(!p.ships[ship])throw Error('Das passende Schiff fehlt.');
 if(kind==='scan'&&w.missions.some(m=>m.user_id===uid&&m.planet_id===target.id&&m.kind===kind&&!m.completed))throw Error('Eine Fernsonde ist bereits unterwegs.');
 if(kind==='colony'){
  if(!w.surveys.some(q=>q.user_id===uid&&q.planet_id===target.id))throw Error('Untersuche den Planeten zuerst.');
  if(target.owner_id)throw Error('Dieser Planet ist bereits besiedelt oder reserviert.');
  if(w.planets.filter(p=>p.owner_id===uid).length>=Math.max(0,s.tech.colonization-3))throw Error('Kein freier Galaxie-Kolonieplatz.');
 }
 const f=galaxyFlight(s,p,target.meta,s.galaxy,ship);
 subtract(p,vector([kind==='colony'?350:0,kind==='colony'?250:0,f.fuel+(kind==='colony'?100:0)]));p.ships[ship]--;
 if(kind==='colony'){target.owner_id=uid;target.reserved=true;}
 w.missions.push({id,user_id:uid,kind,from_id:p.id,planet_id:target.id,started_at:w.now,arrival_at:w.now+f.ms,finish_at:w.now+f.ms*(kind==='scan'?2:1),completed:false});
}
function launchAttack(w,uid,action,id){
 if(!w.settings.enabled)throw Error('PvP ist momentan pausiert.');
 const s=stateOf(w,uid),from=getPlanet(s,action.from),target=w.planets.find(p=>p.id===action.to),origin=w.planets.find(p=>p.id===from.id);
 if(!target||!target.owner_id||target.owner_id===uid||target.reserved)throw Error('Wähle eine fremde besiedelte gemeinsame Kolonie als Ziel.');
 const colonies=w.planets.filter(p=>p.owner_id===uid&&!p.reserved&&s.planets.some(q=>q.id===p.id&&q.system));
 if(from.system){if(!origin||origin.owner_id!==uid||origin.reserved)throw Error('Wähle eine eigene besiedelte gemeinsame Kolonie als Start.');}
 else if(!colonies.length)throw Error('Für Angriffe aus dem Heimatsystem benötigst du mindestens eine eigene besiedelte Galaxiekolonie.');
 if(!target.protection_ended&&w.now<(target.colonized_at||w.now)+COLONY_PROTECTION)throw Error('Diese Kolonie hat noch 1 Stunde Gründungsschutz.');
 const slots=attackSlots(s.tech.military||0);if(w.attacks.filter(m=>m.attacker_id===uid&&m.status!=='returned').length+(w.piratePlayers?.find(r=>r.user_id===uid)?.missions.filter(m=>m.kind==='attack').length||0)>=slots)throw Error('Alle '+slots+' Angriffsplätze sind belegt. Militärtechnik 1 / 5 / 10 erlaubt 1 / 2 / 4 gleichzeitige Angriffsflotten.');

 const fleet=attackFleet(action.fleet);
 for(const [k,n] of Object.entries(fleet))if((from.ships[k]||0)<n)throw Error('Nicht genügend verfügbare Schiffe.');
 const f=attackFlight(s,from,target.meta,fleet),defender=stateOf(w,target.owner_id),fraction=warningFraction(defender.tech.scout||0);
 subtract(from,vector([0,0,f.fuel]));const hulls=takeHulls(from,fleet);for(const [k,n] of Object.entries(fleet))from.ships[k]-=n;
 if(origin)origin.protection_ended=true;
 else for(const p of colonies)p.protection_ended=true;
 w.attacks.push({id,attacker_id:uid,defender_id:target.owner_id,from:from.id,to:target.id,fleet,hulls,ruleVersion:[3,4,5,6,7].includes(w.settings.combat_engine)?w.settings.combat_engine:COMBAT_RULE_VERSION,combat:{fleet,tech:{...s.tech},hulls},...(w.settings.combat_engine>=6?{combatConfig:structuredClone(REALM_COMBAT_OVERRIDES.test4)}:{}),shieldUntil:from.shieldUntil||0,started_at:w.now,warning_at:w.now+Math.ceil(f.ms*fraction),arrival_at:w.now+f.ms,return_at:w.now+2*f.ms,status:'outbound',fuel:f.fuel,slowest:f.slowest});
}

export function processWorld(snapshot,uid,request,metrics){
 const w=advanceWorld(prepareWorld(snapshot),metrics),type=request.type,action=request.action||{};
 if(!w.saves.some(r=>r.user_id===uid)){
  if(type!=='new')return w;
  const name=String(request.name||'Commander').trim().slice(0,30)||'Commander';
  w.saves.push({user_id:uid,revision:0,state:newGame(name,w.now)});
 }
 const s=stateOf(w,uid),start=w.starts.find(x=>x.user_id===uid);
 if(start)s.galaxy={x:start.x,y:start.y};
 if(type==='command'){
  if(!['build','demolish','research','ship','probe','colony','transport','reserve','edit-route','cancel-route-edit','stop-route','pause-route','resume-route','cancel-route-pause','station','collect','salvage','route','deliver','repair','cancel-repair','resume-repair','cancel-ship','scrap-ship'].includes(action.type))throw Error('Unbekannte Spielaktion.');
  if(action.type==='salvage'){const target=w.planets.find(p=>p.id===action.to);if(!target||target.owner_id!==uid||target.reserved)throw Error('Wähle eine eigene besiedelte Galaxiekolonie mit Trümmern.');if(!RES.some(k=>(target.debris?.[k]||0)>0))throw Error('An diesem Planeten liegen keine Trümmer.');}
  const updated=act(s,action,w.now);w.saves.find(r=>r.user_id===uid).state=updated;
 }else if(type==='pirate')pirateAction(w,uid,action,request.eventId||request.requestId,request.combatSeed||request.requestId);
 else if(type==='social')socialAction(w,uid,action,request.eventId||request.requestId);
 else if(type==='galaxy')launchGalaxy(w,uid,action,request.eventId||request.requestId);
 else if(type==='attack'){launchAttack(w,uid,action,request.eventId||request.requestId);w.attacks[w.attacks.length-1].seed=request.combatSeed||request.requestId;}
 else if(type==='set-pvp'){if(!w.admins.includes(uid))throw Error('Nur Administratoren dürfen PvP umschalten.');if(typeof request.enabled!=='boolean')throw Error('Ungültiger PvP-Status.');w.settings.enabled=request.enabled;}
 else if(type==='rename'){const name=String(request.name||'').trim();if(!name||name.length>30)throw Error('Name muss 1–30 Zeichen lang sein.');s.systemName=name;}
 else if(!['new','sync'].includes(type))throw Error('Unbekannte Anfrage.');
 settleSocialCargo(w,w.now);settleRaidCargo(w,w.now);settlePirates(w,w.now);refreshPirates(w,w.now);
 pirateFleetShadows(w);
 for(const row of w.saves)row.state=validateWorldSave(row.state,'processed');
 return w;
}
export function projectPvP(w,uid){
 return {enabled:w.settings.enabled,combatEngine:[3,4,5,6,7].includes(w.settings.combat_engine)?w.settings.combat_engine:COMBAT_RULE_VERSION,isAdmin:w.admins.includes(uid),serverNow:w.now,social:socialProjection(w,uid),pirates:projectPirates(w,uid),features:{shipScrapping:true,routeStatistics:true,pirates:w.pirateVersion===1,piratesPublic:w.pirateVersion===1,orbitalRestoration:true,buildingDemolition:true,repairDock:true,debrisSalvage:true,shipQueue:true,partnerOrigins:true,cargoRetention:true,attackSlots:true,fleetPlanning:true,partnerships:w.socialVersion===1,flightRules:GALAXY_FLIGHT_RULE_VERSION,routePause:true,shipyardEnergy:true,orbitalProduction:true,cancelShip:true,combatRules:[3,4,5,6,7].includes(w.settings.combat_engine)?w.settings.combat_engine:COMBAT_RULE_VERSION,combatTrace:true},attackCapacity:attackSlots(w.saves.find(r=>r.user_id===uid)?.state.tech.military||0),homeAttacks:true,protectionMs:COLONY_PROTECTION,
 debris:w.planets.filter(p=>p.owner_id===uid&&!p.reserved).map(p=>({planet:p.id,...p.debris||zero()})),
 colonies:w.planets.filter(p=>p.owner_id&&!p.reserved).map(p=>({id:p.id,protectedUntil:p.protection_ended?0:(p.colonized_at||w.now)+COLONY_PROTECTION})),
 outgoing:w.attacks.filter(m=>m.attacker_id===uid&&m.status!=='returned').map(m=>({id:m.id,from:m.from,to:m.to,fleet:m.status==='outbound'?m.fleet:m.survivors,status:m.status,awaitingUnload:!!m.awaitingUnload,cargo:{...m.cargo||zero()},arrival:m.arrival_at,returnAt:m.return_at})),
 incoming:w.attacks.filter(m=>m.defender_id===uid&&m.status==='outbound'&&m.warning_at<=w.now).map(m=>({id:m.id,to:m.to,commander:w.saves.find(r=>r.user_id===m.attacker_id)?.state.name||'Commander',arrival:m.arrival_at})),
 reports:[...w.attacks,...(w.attackReports||[])].filter(m=>(m.attacker_id===uid||m.defender_id===uid||m.report?.supporting?.some(g=>g.owner===uid))&&m.report).sort((a,b)=>b.arrival_at-a.arrival_at||a.id.localeCompare(b.id)).slice(0,4).map(m=>{const support=m.report.supporting?.filter(g=>g.owner===uid),isAttacker=m.attacker_id===uid;return {id:m.id,from:m.from,to:m.to,returnAt:m.return_at,...Object.fromEntries(Object.entries(m.report).filter(([key])=>key!=='trace')),ownSide:isAttacker?'attacker':'defender',isSupport:!!support?.length,attackerName:stateOf(w,m.attacker_id).name,defenderName:stateOf(w,m.defender_id).name,ownBefore:support?.length?Object.fromEntries(Object.keys(SHIPS).map(k=>[k,support.reduce((n,g)=>n+(g.before[k]||0),0)])):isAttacker?m.report.attackerBefore:m.report.hostBefore||m.report.defenderBefore,ownAfter:support?.length?Object.fromEntries(Object.keys(SHIPS).map(k=>[k,support.reduce((n,g)=>n+(g.after[k]||0),0)])):isAttacker?m.report.attackerAfter:m.report.hostAfter||m.report.defenderAfter};})};
}
