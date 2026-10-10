import {RES,BUILDINGS,SHIPS,vector} from './config.js';
import {newGame,getPlanet,advance,act,capacity,settle,fleetCapacity} from './engine.js';
import {validateSave} from './storage.js';
import {galaxyFlight} from './galaxy.js';
import {attackFleet,attackFlight,warningFraction,resolveBattle,COMBAT_RULE_VERSION,loadPlunder,takeHulls,putHulls} from './combat.js';
export const DAY=86400000;
export const COLONY_PROTECTION=3600000;
const ms=v=>typeof v==='number'?v:Date.parse(v);
const zero=()=>vector([0,0,0]);
function log(s,time,title,body){s.reports.unshift({id:++s.seq,time:Math.max(time,s.time),title,body:body.slice(0,1000)});s.reports=s.reports.slice(0,60);}
function subtract(p,cost){settle(p);for(const k of RES)if(p.resources[k]<cost[k])throw Error('Lokale Ressourcen reichen nicht.');for(const k of RES)p.resources[k]-=cost[k];settle(p);}
function withdraw(p,cargo){for(const k of RES){const n=Math.min(p.resources[k],cargo[k]);p.resources[k]-=n;p.depot[k]-=cargo[k]-n;}settle(p);}
function fleetText(fleet){return Object.entries(fleet).map(([k,n])=>n+' × '+SHIPS[k].name).join(', ')||'keine';}
export function prepareWorld(snapshot){
 const w=structuredClone(snapshot);
 w.now=ms(w.now);
 w.saves=w.saves.map(row=>({...row,state:validateSave(row.state)}));
 w.attacks??=[];w.missions??=[];w.surveys??=[];w.planets??=[];w.starts??=[];w.admins??=[];
 for(const p of w.planets)if(p.colonized_at)p.colonized_at=ms(p.colonized_at);
 for(const m of w.missions)for(const key of ['started_at','arrival_at','finish_at'])m[key]=ms(m[key]);
 return w;
}
function stateOf(w,id){const row=w.saves.find(x=>x.user_id===id);if(!row)throw Error('Spielstand fehlt.');return row.state;}
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
function shieldFactor(until,time){return until?Math.max(0,Math.min(1,1-(until-time)/300000)):1;}
function resolveAttack(w,m,time){
 const a=stateOf(w,m.attacker_id),target=w.planets.find(p=>p.id===m.to),row=w.saves.find(x=>x.user_id===m.defender_id);
 if(!target||target.owner_id!==m.defender_id||target.reserved||!row||(!target.protection_ended&&time<(target.colonized_at||time)+COLONY_PROTECTION)){
  m.status='returning';m.survivors={...m.fleet};m.return_hulls=m.hulls;m.cargo=zero();m.resolved_at=w.now;
  m.report={outcome:'cancelled',at:time,reason:'Das Ziel ist nicht mehr angreifbar.'};log(a,time,'Angriff abgebrochen',m.report.reason);return;
 }
 const d=row.state,p=getPlanet(d,m.to),defense={fleet:{...p.ships},tech:{...d.tech},hulls:p.hulls,shieldFactor:shieldFactor(p.shieldUntil,time)};
 const result=resolveBattle({...m.combat,shieldFactor:shieldFactor(m.shieldUntil,time)},defense,m.seed||m.id,m.ruleVersion||1);
 const before={...p.ships};
 for(const key of Object.keys(SHIPS))p.ships[key]=result.defender.fleet[key]||0;
 p.hulls=result.defender.hulls;p.shieldUntil=time+300000;
 p.defenseSalvage??=zero();for(const k of RES)p.defenseSalvage[k]+=result.defenseRepair[k];
 const bunker=Math.min(2000,capacity(p)*.025*(p.buildings.bunker||0));
 if(result.outcome==='attacker'&&(!p.raidWindowStart||time-p.raidWindowStart>=DAY)){p.raidWindowStart=time;p.raidBudget=vector(RES.map(k=>Math.floor(Math.max(0,p.resources[k]+p.depot[k]-bunker)*.25)));}
 const cap=fleetCapacity({tech:m.combat.tech},result.attacker.fleet);
 const field=vector(RES.map(k=>(target.debris?.[k]||0)+result.debris[k]));
 const cargo=loadPlunder(p.resources,p.depot,bunker,cap,field,result.outcome==='attacker',p.raidBudget||zero());
 withdraw(p,cargo.loot);if(p.raidBudget)for(const k of RES)p.raidBudget[k]-=cargo.loot[k];
 target.debris??=zero();for(const k of RES)target.debris[k]=field[k]-cargo.salvage[k];
 m.status=Object.keys(result.attacker.fleet).length?'returning':'returned';m.resolved_at=w.now;m.survivors=result.attacker.fleet;m.return_hulls=result.attacker.hulls;m.cargo=cargo.cargo;m.shieldUntil=time+300000;
 if(result.trace)result.trace.participants={attacker:a.name,defender:d.name};
 m.report={at:time,outcome:result.outcome,ruleVersion:m.ruleVersion||1,traceAvailable:!!result.trace,...(result.trace?{trace:result.trace}:{}),rounds:result.rounds,attackerBefore:m.fleet,attackerAfter:m.survivors,defenderBefore:before,defenderAfter:{...p.ships},loot:cargo.loot,salvage:cargo.salvage,debrisLeft:{...target.debris},defenseRepair:result.defenseRepair};
 const outcome=result.outcome==='attacker'?'Angreifer gewinnt':result.outcome==='defender'?'Verteidiger gewinnt':'Unentschieden';
 const body=outcome+' · '+target.meta.name+' · '+result.rounds.length+' Runden. Angreifer übrig: '+fleetText(m.survivors)+'. Beute M/K/T: '+RES.map(k=>cargo.loot[k]).join('/')+'. Trümmer geborgen M/K: '+cargo.salvage.metal+'/'+cargo.salvage.crystal+'.';
 log(a,time,'PvP-Kampfbericht',body);log(d,time,'PvP-Kampfbericht',body);
}
function returnAttack(w,m,time){
 const s=stateOf(w,m.attacker_id),p=getPlanet(s,m.from);
 for(const [k,n] of Object.entries(m.survivors||{}))p.ships[k]+=n;
 putHulls(p,m.return_hulls);p.shieldUntil=Math.max(p.shieldUntil||0,m.shieldUntil||0);
 for(const k of RES)p.depot[k]+=(m.cargo?.[k]||0);settle(p);
 log(s,time,'Angriffsflotte zurückgekehrt',fleetText(m.survivors||{})+' · Ladung wurde eingelagert.');
 m.status='returned';
}
// Every externally shared event is processed in time order, with the existing engine
// advancing research, construction and local fleets up to that exact cutoff first.
export function advanceWorld(w){
 let guard=0;
 while(true){
  const events=[];
  for(const m of w.missions)if(!m.completed){
   if(m.kind==='scan'&&!w.surveys.some(q=>q.user_id===m.user_id&&q.planet_id===m.planet_id))events.push({time:m.arrival_at,id:m.id,kind:'survey',mission:m,order:0});
   events.push({time:m.finish_at,id:m.id,kind:'galaxy',mission:m,order:1});
  }
  for(const m of w.attacks)if(m.status==='outbound')events.push({time:m.arrival_at,id:m.id,kind:'battle',mission:m,order:2});else if(m.status==='returning')events.push({time:m.return_at,id:m.id,kind:'return',mission:m,order:3});
  events.sort((a,b)=>a.time-b.time||a.order-b.order||a.id.localeCompare(b.id));
  const e=events[0];if(!e||e.time>w.now)break;
  if(++guard>10000)throw Error('Zu viele fällige Ereignisse.');
  for(const row of w.saves)advance(row.state,e.time);
  if(e.kind==='survey')survey(w,e.mission);
  if(e.kind==='galaxy')finishGalaxy(w,e.mission,e.time);
  if(e.kind==='battle')resolveAttack(w,e.mission,e.time);
  if(e.kind==='return')returnAttack(w,e.mission,e.time);
 }
 for(const row of w.saves)advance(row.state,w.now);
 return w;
}
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
 if(w.attacks.some(m=>m.attacker_id===uid&&m.status!=='returned'))throw Error('Du hast bereits eine Angriffsflotte unterwegs.');
 if(w.attacks.filter(m=>m.attacker_id===uid&&m.defender_id===target.owner_id&&m.started_at>w.now-DAY).length>=2)throw Error('Maximal zwei Angriffe auf denselben Commander innerhalb von 24 Stunden.');
 const fleet=attackFleet(action.fleet);
 for(const [k,n] of Object.entries(fleet))if((from.ships[k]||0)<n)throw Error('Nicht genügend verfügbare Schiffe.');
 const f=attackFlight(s,from,target.meta,fleet),defender=stateOf(w,target.owner_id),fraction=warningFraction(defender.tech.scout||0);
 subtract(from,vector([0,0,f.fuel]));const hulls=takeHulls(from,fleet);for(const [k,n] of Object.entries(fleet))from.ships[k]-=n;
 if(origin)origin.protection_ended=true;
 else for(const p of colonies)p.protection_ended=true;
 w.attacks.push({id,attacker_id:uid,defender_id:target.owner_id,from:from.id,to:target.id,fleet,hulls,ruleVersion:COMBAT_RULE_VERSION,combat:{fleet,tech:{...s.tech},hulls},shieldUntil:from.shieldUntil||0,started_at:w.now,warning_at:w.now+Math.ceil(f.ms*fraction),arrival_at:w.now+f.ms,return_at:w.now+2*f.ms,status:'outbound',fuel:f.fuel,slowest:f.slowest});
}

export function processWorld(snapshot,uid,request){
 const w=advanceWorld(prepareWorld(snapshot)),type=request.type,action=request.action||{};
 if(!w.saves.some(r=>r.user_id===uid)){
  if(type!=='new')return w;
  const name=String(request.name||'Commander').trim().slice(0,30)||'Commander';
  w.saves.push({user_id:uid,revision:0,state:newGame(name,w.now)});
 }
 const s=stateOf(w,uid),start=w.starts.find(x=>x.user_id===uid);
 if(start)s.galaxy={x:start.x,y:start.y};
 if(type==='command'){
  if(!['build','research','ship','probe','colony','transport','reserve','edit-route','cancel-route-edit','stop-route','station','collect','route','deliver','repair','cancel-ship'].includes(action.type))throw Error('Unbekannte Spielaktion.');
  const updated=act(s,action,w.now);w.saves.find(r=>r.user_id===uid).state=updated;
 }else if(type==='galaxy')launchGalaxy(w,uid,action,request.eventId||request.requestId);
 else if(type==='attack'){launchAttack(w,uid,action,request.eventId||request.requestId);w.attacks[w.attacks.length-1].seed=request.combatSeed||request.requestId;}
 else if(type==='set-pvp'){if(!w.admins.includes(uid))throw Error('Nur Administratoren dürfen PvP umschalten.');if(typeof request.enabled!=='boolean')throw Error('Ungültiger PvP-Status.');w.settings.enabled=request.enabled;}
 else if(type==='rename'){const name=String(request.name||'').trim();if(!name||name.length>30)throw Error('Name muss 1–30 Zeichen lang sein.');s.systemName=name;}
 else if(!['new','sync'].includes(type))throw Error('Unbekannte Anfrage.');
 for(const row of w.saves)row.state=validateSave(row.state);
 return w;
}
export function projectPvP(w,uid){
 return {enabled:w.settings.enabled,isAdmin:w.admins.includes(uid),serverNow:w.now,features:{cancelShip:true,combatRules:COMBAT_RULE_VERSION,combatTrace:true},homeAttacks:true,protectionMs:COLONY_PROTECTION,
 colonies:w.planets.filter(p=>p.owner_id&&!p.reserved).map(p=>({id:p.id,protectedUntil:p.protection_ended?0:(p.colonized_at||w.now)+COLONY_PROTECTION})),
 outgoing:w.attacks.filter(m=>m.attacker_id===uid&&m.status!=='returned').map(m=>({id:m.id,from:m.from,to:m.to,fleet:m.status==='outbound'?m.fleet:m.survivors,status:m.status,arrival:m.arrival_at,returnAt:m.return_at})),
 incoming:w.attacks.filter(m=>m.defender_id===uid&&m.status==='outbound'&&m.warning_at<=w.now).map(m=>({id:m.id,to:m.to,commander:w.saves.find(r=>r.user_id===m.attacker_id)?.state.name||'Commander',arrival:m.arrival_at})),
 reports:w.attacks.filter(m=>(m.attacker_id===uid||m.defender_id===uid)&&m.report).sort((a,b)=>b.arrival_at-a.arrival_at).slice(0,30).map(m=>({id:m.id,from:m.from,to:m.to,returnAt:m.return_at,...Object.fromEntries(Object.entries(m.report).filter(([key])=>key!=='trace'))}))};
}
