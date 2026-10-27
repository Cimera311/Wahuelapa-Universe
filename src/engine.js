import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,ROUTE_ECONOMY,vector,costAt,isFreighter,shipFlightEngine,canFlyInterstellar} from './config.js';
import {repairOrders,repairQuote,repairRefund,reserveRepair,releaseRepair,forecastRepair,produceRepair,finishRepair,repairMaterials,payRepairMaterials} from './repair.js';
import {powerExponent} from './realm-config.js';

import {takeHulls,putHulls} from './combat.js';
import {sharedFlight,ENGINE_SPEED_BONUS,FLIGHT_BASE_SCALE} from './flight.js';

function planet(id,name,meta={}){
 return {id,name,coord:meta.coord||'1:1:4',kind:meta.kind||'Heimatwelt',mult:meta.mult||[1,1,1],color:meta.color||'#53add3',ocean:meta.ocean??true,energy:meta.energy||1,distance:meta.distance||0,reserves:vector([0,0,0]),resources:vector([0,0,0]),depot:vector([0,0,0]),buildings:Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,0])),ships:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,0])),build:null,shipjob:null,orbitaljob:null,orbitalqueue:[]};
}
// REALM-CANDIDATE[newGame]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function newGame(name='Commander',now=Date.now()){
 const home=planet('home','Aurelia');
 home.resources=vector([3000,2200,1000]); Object.assign(home.buildings,{metal:1,crystal:1,fuel:1,solar:3});
 return {version:1,name:name.trim().slice(0,30)||'Commander',time:now,created:now,seq:0,active:'home',planets:[home],tech:Object.fromEntries(Object.keys(TECHS).map(k=>[k,0])),research:null,discovered:[],missions:[],reports:[]};
}
export function getPlanet(s,id){const p=s.planets.find(p=>p.id===id);if(!p)throw Error('Planet nicht gefunden.');return p;}
// REALM-CANDIDATE[warehouse]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function capacity(p){return 4000*Math.pow(1.7,p.buildings.warehouse);}
// REALM-CANDIDATE[yardTime]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function shipyardTimeFactor(level){return Math.pow(.92,Math.max(0,level-1));}
// REALM-CANDIDATE[energyDemand]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function energyDemand(p){
 const consumers={metal:p.buildings.metal*15,crystal:p.buildings.crystal*18,fuel:p.buildings.fuel*20,shipyard:Math.ceil(10*Math.pow(p.buildings.shipyard,1.5)),orbital:Math.ceil(10*Math.pow((p.buildings.orbital||0),1.5)),repairDock:Math.ceil(10*Math.pow((p.buildings.repairDock||0),1.5))};
 return Object.fromEntries(Object.entries(consumers).map(([key,value])=>[key,value*p.energy]));
}
// REALM-CANDIDATE[production]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function stats(s,p){
 const supply=(45*Math.pow(p.buildings.solar||0,powerExponent(p.kind,'solar'))+180*Math.pow(p.buildings.tidal||0,powerExponent(p.kind,'tidal')))*(1+s.tech.energy*.1);
 const consumers=energyDemand(p),demand=Object.values(consumers).reduce((a,b)=>a+b,0);
 const ratio=demand?Math.min(1,supply/demand):1;
 const rates=vector(RES.map((k,i)=>p.buildings[k]?([300,220,140][i]*p.buildings[k]*Math.pow(1.12,p.buildings[k]-1)*p.mult[i]*ratio):0));
 return {supply,demand,consumers,ratio,rates,cap:capacity(p)};
}
export function settle(p){const cap=capacity(p);for(const k of RES){const n=Math.min(Math.max(0,cap-p.resources[k]),p.depot[k]);p.resources[k]+=n;p.depot[k]-=n;}}
function deliver(p,cargo){for(const k of RES)p.depot[k]+=cargo[k];settle(p);}
// A ship can unload only into actual warehouse space. Remaining cargo stays aboard.
export function unloadCargo(p,cargo,order=null){settle(p);const cap=capacity(p),out=vector([0,0,0]);for(const k of RES){const wanted=!order||order[k]==='max'?cargo[k]:Math.min(cargo[k],order[k]);out[k]=Math.min(wanted,Math.floor(Math.max(0,cap-p.resources[k])));p.resources[k]+=out[k];cargo[k]-=out[k];}return out;}
export function cargoPresent(cargo){return RES.some(k=>cargo[k]>0);}
// Shared cargo can become unloadable when a warehouse completes or a local route loads.
export function nextCargoSpaceEvent(s,p){return Math.min(p.build?.key==='warehouse'?p.build.end:Infinity,...s.missions.filter(m=>!m.paused&&!m.awaitingUnload).map(m=>m.due));}
function waitingCargo(s){for(const m of [...s.missions])if(m.paused&&m.type==='route'){const out=unloadCargo(getPlanet(s,m.home),m.cargo);if(cargoPresent(out))routeActivity(s,m,m.home,out,vector([0,0,0]),'unload');}else if(m.awaitingUnload){const p=getPlanet(s,m.awaitingUnload),out=unloadCargo(p,m.cargo);if(m.type==='route'&&cargoPresent(out))routeActivity(s,m,p.id,out,vector([0,0,0]),'unload');m.due=s.time;if(!cargoPresent(m.cargo))parkFleet(s,m,p.id,m.finishTitle||'Flotte entladen');}}
// Work is measured in milliseconds at full power; forecasts never replace earned progress.
function forecastShipJobs(s,readStats=p=>stats(s,p)){for(const p of s.planets)for(const kind of ['ship','orbital']){const j=p[kind+'job'];if(!j)continue;
 if(j.workRemaining===undefined){j.orderEnd=j.end;j.workTotal=j.end-j.start;j.workRemaining=Math.max(0,j.end-s.time);}
 const ratio=readStats(p).ratio;j.paused=ratio===0&&j.workRemaining>0;
 // Keep paused saves finite. Their end is a placeholder, excluded from scheduling.
 j.end=s.time+Math.max(1,Math.ceil(j.workRemaining/(ratio||1)));
 let work=j.workRemaining;for(const queued of p[kind==='ship'?'shipqueue':'orbitalqueue']||[]){work+=queued.workTotal;queued.paused=ratio===0;queued.end=s.time+Math.max(1,Math.ceil(work/(ratio||1)));}
}}
// REALM-CANDIDATE[queues]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const SHIP_QUEUE_LIMIT=20;
// Saves from 2026-10-11.04 may contain 50 already-paid orders; keep every one.
export const SHIP_QUEUE_LEGACY_LIMIT=50;
export function shipQueueCapacity(p){return Math.min(SHIP_QUEUE_LIMIT,Math.max(0,p.buildings.shipyard));}
export function shipQueueFullReason(p){return shipOrders(p).length>=shipQueueCapacity(p)?(shipQueueCapacity(p)<SHIP_QUEUE_LIMIT?`Alle Auftragsplätze belegt. Mehr Plätze ab Werftstufe ${shipQueueCapacity(p)+1}.`:`Alle ${SHIP_QUEUE_LIMIT} Auftragsplätze belegt. Maximale Warteschlangengröße erreicht.`):'';}
export function shipOrders(p){return [p.shipjob,...p.shipqueue||[]].filter(Boolean);}
export function orbitalOrders(p){return [p.orbitaljob,...p.orbitalqueue||[]].filter(Boolean);}
export function orbitalQueueCapacity(p){return Math.min(SHIP_QUEUE_LIMIT,Math.max(0,p.buildings.orbital||0));}
export function orbitalQueueFullReason(p){const cap=orbitalQueueCapacity(p);return orbitalOrders(p).length>=cap?`Alle ${cap} Auftragsplätze der Orbitalwerft belegt.`:'';}
function nextShipOrder(p){p.shipjob=(p.shipqueue||[]).shift()||null;}
function nextOrbitalOrder(p){p.orbitaljob=(p.orbitalqueue||[]).shift()||null;}
function produce(s,ms,readStats=p=>stats(s,p)){for(const p of s.planets){settle(p);const z=readStats(p);produceRepair(p,ms,z.ratio);for(const k of RES)p.resources[k]=Math.min(z.cap,p.resources[k]+z.rates[k]*ms/3600000);for(const kind of ['ship','orbital'])if(p[kind+'job'])p[kind+'job'].workRemaining=Math.max(0,p[kind+'job'].workRemaining-ms*z.ratio);}}
function report(s,title,body){s.reports.unshift({id:++s.seq,time:s.time,title,body});s.reports=s.reports.slice(0,60);}
export function need(s,p,req){if(!req)return '';if(req.tech&&s.tech[req.tech]<req.level)return `Benötigt ${TECHS[req.tech].name} Stufe ${req.level}.`;if(req.building&&p.buildings[req.building]<req.level)return `Benötigt ${BUILDINGS[req.building].name} Stufe ${req.level}.`;return '';}
// REALM-CANDIDATE[demolition]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const DEMOLITION_REFUND=.20;
export const DEMOLITION_TIME=.25;
// Level is zero-based: the original cost/time for completed level N uses index N-1.
export function buildingLevelCost(key,index){
 const b=BUILDINGS[key];if(!b)throw Error('Unbekanntes Gebäude.');
 return costAt(b,index);
}
// REALM-CANDIDATE[buildingTime]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function buildingLevelTime(s,p,key,index){
 const b=BUILDINGS[key];if(!b)throw Error('Unbekanntes Gebäude.');
 return Math.ceil(b.time*Math.pow(1.35,index)*Math.pow(.95,s.tech.engineering)*Math.pow(.92,p.buildings.robotics)*1000);
}
// REALM-CANDIDATE[buildingCaps]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function buildInfo(s,p,key){const b=BUILDINGS[key];if(!b)throw Error('Unbekanntes Gebäude.');const l=p.buildings[key],cost=buildingLevelCost(key,l);return {cost,ms:buildingLevelTime(s,p,key,l),reason:(key==='repairDock'&&s.tech.engineering<1?'Benötigt Bautechnik Stufe 1.':'')||need(s,p,b.requires)||(b.ocean&&!p.ocean?'Benötigt einen Ozeanplaneten.':'')||(l>=(key==='bunker'?4:30)?'Maximale Gebäudestufe erreicht.':'')};}
// Paid values are recorded when a new level finishes. Already-built legacy levels
// fall back to the current level formula because their old prices were never saved.
export function demolishInfo(s,p,key){
 if(!Object.hasOwn(BUILDINGS,key))throw Error('Unbekanntes Gebäude.');
 const level=p.buildings[key]||0;
 if(level<1)return {reason:'Keine Gebäudestufe vorhanden.'};
 const target=level-1,historical=p.buildHistory?.[key]?.[level];
 const originalCost=historical?.cost||buildingLevelCost(key,target);
 const originalMs=historical?.ms||buildingLevelTime(s,p,key,target);
 const refund=vector(RES.map(k=>Math.floor(originalCost[k]*DEMOLITION_REFUND)));
 const ms=Math.max(1,Math.ceil(originalMs*DEMOLITION_TIME));
 let reason=p.build?'Auf diesem Planeten läuft bereits ein Bauauftrag.':'';
 if(!reason&&key==='lab'&&target===0&&p.buildings.shipyard>0)reason='Die Schiffswerft benötigt Forschungslabor Stufe 1.';
 if(!reason&&key==='lab'&&s.research?.planet===p.id&&target<TECHS[s.research.key].lab)reason='Eine laufende Forschung benötigt dieses Labor.';
 if(!reason&&key==='shipyard'&&target<2&&p.buildings.repairDock>0)reason='Das Reparaturdock benötigt Schiffswerft Stufe 2.';
 if(!reason&&key==='shipyard'&&[p.shipjob,...p.shipqueue||[]].filter(Boolean).some(j=>target<(SHIPS[j.key]?.shipyard||1)))reason='Laufende Schiffsbauaufträge benötigen diese Werftstufe.';
 if(!reason&&key==='orbital'&&[p.orbitaljob,...p.orbitalqueue||[]].filter(Boolean).some(j=>target<(SHIPS[j.key]?.shipyard||1)))reason='Laufende Plattformaufträge benötigen diese Orbitalwerftstufe.';
 if(!reason&&key==='repairDock'&&target===0&&(p.repairQueue||[]).length)reason='Im Reparaturdock befinden sich noch Einheiten.';
 return {key,level,target,originalCost,originalMs,refund,ms,reason};
}
// REALM-CANDIDATE[researchTime]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function researchInfo(s,p,key){const t=TECHS[key];if(!t)throw Error('Unbekannte Forschung.');const l=s.tech[key];return {cost:costAt(t,l),ms:Math.ceil(t.time*Math.pow(1.5,l)*Math.pow(key==='military'?1.5:1,Math.max(0,l-4))/Math.max(1,1+(p.buildings.lab-1)*.15)*1000),reason:(key==='colonization'&&l>=3&&l<6?need(s,p,{tech:['ramjet','impulse','hyperspace'][l-3],level:1}):'')||(p.buildings.lab<t.lab?`Benötigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.`:need(s,p,t.requires)||(l>=t.max?'Maximale Forschungsstufe erreicht.':''))};}
function pay(p,c){settle(p);for(const k of RES)if(!Number.isFinite(c[k])||c[k]<0||p.resources[k]+1e-8<c[k])throw Error('Nicht genügend lokale Ressourcen.');for(const k of RES)p.resources[k]=Math.max(0,p.resources[k]-c[k]);settle(p);}
export function defenseSlots(p){return Object.entries(SHIPS).reduce((a,[k,sh])=>a+(sh.slots||0)*(p.ships[k]||0),0)+repairOrders(p).reduce((n,j)=>n+(SHIPS[j.key]?.slots||0)*j.entries.length,0)+[...shipOrders(p),...orbitalOrders(p)].reduce((a,j)=>a+(SHIPS[j.key]?.slots||0)*j.count,0);}
export function shipRefund(job){
 if(!job)return {resources:vector([0,0,0]),salvage:vector([0,0,0]),legacyDefense:false};
 if(job.payment)return {resources:{...job.payment.resources},salvage:{...job.payment.salvage},legacyDefense:false};
 const legacyDefense=SHIPS[job.key].category==='defense',legacyCosts={flak:[160,80,20],laser:[450,300,70],rail:[1400,1000,280],plasma:[4000,2800,900]},cost=legacyDefense?legacyCosts[job.key]:SHIPS[job.key].cost,gross=vector(cost.map(v=>v*job.count));
 return {resources:legacyDefense?vector([0,0,gross.fuel]):gross,salvage:legacyDefense?vector([gross.metal,gross.crystal,0]):vector([0,0,0]),legacyDefense};
}
// REALM-CANDIDATE[scrapping]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const SHIP_SCRAP_PERCENT=30;
export function scrapShipInfo(p,key,count=1){
 const sh=SHIPS[key],available=p.ships?.[key]||0,valid=Number.isSafeInteger(count)&&count>=1,refund=vector([0,0,0]);
 let reason=!sh||!['freighter','military','civil'].includes(sh.category)?'Nur Schiffe können in der Schiffswerft verschrottet werden.':!p.buildings.shipyard?'Benötigt Schiffswerft Stufe 1.':!valid?'Wähle eine positive ganze Anzahl Schiffe.':'';
 if(!reason){for(let i=0;i<RES.length;i++){const gross=sh.cost[i]*count;if(!Number.isSafeInteger(gross*SHIP_SCRAP_PERCENT)||gross*SHIP_SCRAP_PERCENT>Number.MAX_SAFE_INTEGER){reason='Diese Verschrottungsmenge ist zu groß.';break;}refund[RES[i]]=Math.floor(gross*SHIP_SCRAP_PERCENT/100);}if(!reason&&RES.some(k=>refund[k]>1e12||(p.depot?.[k]||0)+refund[k]>1e12))reason='Die Erstattung überschreitet die maximale Depotmenge.';if(!reason&&count>available)reason='Nicht genügend verfügbare Schiffe auf diesem Planeten.';}
 return {key,count,available,refund,reason};
}
export function shipInfo(s,p,key,count=1){const sh=SHIPS[key];if(!sh)throw Error('Unbekanntes Schiff.');const defense=sh.category==='defense',yard=defense?(p.buildings.orbital||0):p.buildings.shipyard,gross=vector(sh.cost.map(v=>v*count));return {cost:gross,salvage:vector([0,0,0]),ms:Math.ceil(sh.time*count*1000*shipyardTimeFactor(yard)*(defense?Math.pow(.92,p.buildings.robotics||0):1)),ratio:stats(s,p).ratio,reason:yard<(sh.shipyard||1)?`Benötigt ${defense?'Orbitalwerft':'Schiffswerft'} Stufe ${sh.shipyard||1}.`:s.tech[sh.tech]<(sh.techLevel||1)?`Benötigt ${TECHS[sh.tech].name} Stufe ${sh.techLevel||1}.`:(s.tech[sh.engine||'drive']||0)<(sh.engineLevel||0)?`Benötigt ${TECHS[sh.engine].name} Stufe ${sh.engineLevel}.`:''};}

// REALM-CANDIDATE[cargoBonus]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function cargoCapacity(s,n=1,ship='transport'){return Math.floor((SHIPS[ship]?.cargo||0)*(1+s.tech.logistics*.15))*n;}
// REALM-CANDIDATE[tutorialFlight]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function flightInfo(s,from,to,n=1,probe=false,ship='transport'){if(from.system||to.system){const f=sharedFlight(s,from,to,n,probe?'probe':ship);return {...f,fuel:f.fuel*2};}const def=SHIPS[probe?'probe':ship];if(!def)throw Error('Unbekanntes Schiff.');const remote=(from.system||'tutorial')!==(to.system||'tutorial');const engine=shipFlightEngine(s,probe?'probe':ship,remote);const anchor=s.galaxy||{x:500,y:960};const a=from.system?from:anchor,b=to.system?to:anchor;const dist=remote?Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)/40):Math.max(1,Math.abs((from.distance||0)-(to.distance||0)));return {ms:Math.ceil((10+dist*8)*FLIGHT_BASE_SCALE*1000/((1+(s.tech[engine]||0)*ENGINE_SPEED_BONUS+(probe?s.tech.scout*.1:0))*def.speed)),fuel:Math.ceil(def.fuel*2*dist*n/(1+(s.tech[engine]||0)*.12))};}
// Fleet fuel is prepaid for a complete itinerary; cargo never includes engine fuel.
export function legInfo(s,from,to,n=1,ship='transport'){const f=flightInfo(s,from,to,n,ship==='probe',ship);return {...f,fuel:Math.ceil(f.fuel/2)};}
export function routeLegInfo(s,from,to,n=1,ship='transport'){const f=legInfo(s,from,to,n,ship);return {ms:Math.ceil(f.ms*ROUTE_ECONOMY.time),fuel:Math.ceil(f.fuel*ROUTE_ECONOMY.fuel)};}
export function fleetManifest(m){return m.fleet||{[m.ship]:m.count};}
export function checkedFleet(fleet){if(!fleet||typeof fleet!=='object'||Array.isArray(fleet)||!Object.keys(fleet).length||Object.entries(fleet).some(([k,n])=>!isFreighter(k)||!Number.isSafeInteger(n)||n<1))throw Error('Wähle verfügbare Frachter in positiven ganzen Zahlen.');return {...fleet};}
export function missionFleet(fleet,military=false){
 if(!fleet||typeof fleet!=='object'||Array.isArray(fleet)||!Object.keys(fleet).length||Object.entries(fleet).some(([k,n])=>!(isFreighter(k)||military&&['military','civil'].includes(SHIPS[k]?.category))||!Number.isSafeInteger(n)||n<1))throw Error('Wähle verfügbare Schiffe in positiven ganzen Zahlen.');return {...fleet};
}
export function fleetLegInfo(s,from,to,fleet){let ms=0,fuel=0,slowest='';for(const [k,n] of Object.entries(missionFleet(fleet,true))){if((from.system||'tutorial')!==(to.system||'tutorial')&&!canFlyInterstellar(s,k))throw Error('Für '+SHIPS[k].name+' fehlt der Galaxieantrieb.');const f=legInfo(s,from,to,n,k);if(f.ms>ms){ms=f.ms;slowest=k;}fuel+=f.fuel;}return {ms,fuel,slowest,capacity:fleetCapacity(s,fleet)};}
export function fleetCapacity(s,fleet){return Object.entries(fleet).reduce((a,[k,n])=>a+cargoCapacity(s,n,k),0);}
export function mixedRouteLeg(s,from,to,fleet){let ms=0,fuel=0,slowest='';for(const [ship,count] of Object.entries(checkedFleet(fleet))){if((from.system||'tutorial')!==(to.system||'tutorial')&&!SHIPS[ship].engine)throw Error('Interstellare Routen benötigen bei allen Schiffen ein fortgeschrittenes Triebwerk.');const f=routeLegInfo(s,from,to,count,ship);if(f.ms>ms){ms=f.ms;slowest=ship;}fuel+=f.fuel;}return {ms,fuel,slowest};}
export function routeInfo(s,stops,count,ship='transport'){const fleet=typeof count==='object'?checkedFleet(count):checkedFleet({[ship]:count});let fuel=0,ms=0,slowest='';for(let i=0;i<stops.length;i++){const f=mixedRouteLeg(s,getPlanet(s,stops[i].planet),getPlanet(s,stops[(i+1)%stops.length].planet),fleet);fuel+=f.fuel;ms+=f.ms;slowest=f.slowest;}return {fuel,ms,slowest,capacity:fleetCapacity(s,fleet)};}
// REALM-CANDIDATE[routeStops]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
function checkedStops(s,stops,home){if(!Array.isArray(stops)||stops.length<2||stops.length>12||stops[0].planet!==home)throw Error('Eine Route benötigt 2–12 Stopps und beginnt am Startplaneten.');for(let i=0;i<stops.length;i++){getPlanet(s,stops[i].planet);if(stops[i].planet===stops[(i+1)%stops.length].planet||!validOrder(stops[i].load)||!validOrder(stops[i].unload))throw Error('Ungültiger Stopp oder Laderegel.');}return structuredClone(stops);}
function setFleet(m,fleet){m.fleet={...fleet};[m.ship,m.count]=Object.entries(fleet)[0];}
function validOrder(order){return order&&RES.every(k=>order[k]==='max'||Number.isSafeInteger(order[k])&&order[k]>=0&&order[k]<=1e12);}
function loadCargo(s,p,cargo,order,count,ship='transport',fleet=null){settle(p);let room=(fleet?fleetCapacity(s,fleet):cargoCapacity(s,count,ship))-RES.reduce((a,k)=>a+cargo[k],0);for(const k of RES){const want=order[k]==='max'?Infinity:order[k];const amount=Math.min(room,want,Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0))));cargo[k]+=amount;const local=Math.min(amount,p.resources[k]);p.resources[k]-=local;p.depot[k]-=amount-local;room-=amount;}settle(p);}
// Fixed-size counters replace one permanent report per successful route event.
// Legacy routes start at their last canonical simulation time; no history is inferred.
function routeStats(s,m){return m.stats??={since:s.time,roundsAtStart:m.rounds,stops:0,loaded:vector([0,0,0]),delivered:vector([0,0,0]),fuelPaid:0,last:null};}
const routeSum=(a,b)=>Math.min(Number.MAX_SAFE_INTEGER,a+b);
function routeActivity(s,m,planet,delivered,loaded,kind='stop',visit=false){
 const z=routeStats(s,m),previous=z.last;
 for(const k of RES){z.delivered[k]=routeSum(z.delivered[k],delivered[k]);z.loaded[k]=routeSum(z.loaded[k],loaded[k]);}
 if(visit)z.stops=routeSum(z.stops,1);
 const same=previous?.at===s.time&&previous.planet===planet;
 z.last={at:s.time,planet,kind:kind==='stop'&&same&&previous.kind==='round'?'round':kind,delivered:vector(RES.map(k=>delivered[k]+(same?previous.delivered[k]:0))),loaded:vector(RES.map(k=>loaded[k]+(same?previous.loaded[k]:0)))};
 // seq also invalidates route cards when no report is appended.
 s.seq++;
}
function stopCargo(s,m,stop,kind='stop',visit=true){const p=getPlanet(s,stop.planet),out=unloadCargo(p,m.cargo,stop.unload),before={...m.cargo};loadCargo(s,p,m.cargo,stop.load,m.count,m.ship,fleetManifest(m));routeActivity(s,m,p.id,out,vector(RES.map(k=>m.cargo[k]-before[k])),kind,visit);}
function leaveRoute(s,m,index){const from=m.stops[m.index].planet,to=m.stops[index].planet,f=mixedRouteLeg(s,getPlanet(s,from),getPlanet(s,to),fleetManifest(m));m.from=from;m.to=to;m.index=index;m.start=s.time;m.duration=f.ms;m.due=s.time+f.ms;}
function parkFleet(s,m,id,title){const p=getPlanet(s,id),out=unloadCargo(p,m.cargo);if(m.type==='route'&&cargoPresent(out))routeActivity(s,m,id,out,vector([0,0,0]),'unload');if(cargoPresent(m.cargo)){if(!m.awaitingUnload)report(s,'Flotte wartet auf Lagerplatz',`${p.name}: Restladung bleibt im Frachter. Schiffe bleiben gebunden.`);m.awaitingUnload=id;m.finishTitle=title;m.due=s.time;return;}for(const [k,n] of Object.entries(fleetManifest(m)))p.ships[k]+=n;putHulls(p,m.hulls);p.shieldUntil=Math.max(p.shieldUntil||0,m.shieldUntil||0);s.missions=s.missions.filter(x=>x.id!==m.id);const summary=m.type==='route'&&m.stats?` ${m.rounds} Runden insgesamt. Seit Statistikbeginn (${new Date(m.stats.since).toISOString()}) geliefert M/K/T: ${RES.map(k=>Math.floor(m.stats.delivered[k])).join('/')}; geladen M/K/T: ${RES.map(k=>Math.floor(m.stats.loaded[k])).join('/')}; ${m.stats.stops} Stopps; Treibstoff bezahlt: ${m.stats.fuelPaid}.`:'';report(s,title,`${Object.entries(fleetManifest(m)).map(([k,n])=>n+' × '+SHIPS[k].name).join(', ')} im Orbit von ${p.name}. Ladung wurde eingelagert.${summary}`);}
function applyRouteEdit(s,m){
 if(!m.pending)return;
 const next=m.pending,p=getPlanet(s,m.home),old=fleetManifest(m);
 if(RES.reduce((a,k)=>a+m.cargo[k],0)>fleetCapacity(s,next.fleet))return false;
 if(Object.entries(next.fleet).some(([k,n])=>p.ships[k]+(old[k]||0)<n))return false;
 for(const [k,n] of Object.entries(old))p.ships[k]+=n;putHulls(p,m.hulls);
 for(const [k,n] of Object.entries(next.fleet))p.ships[k]-=n;
 setFleet(m,next.fleet);m.hulls=takeHulls(p,next.fleet);m.name=next.name;m.stops=structuredClone(next.stops);m.repeat=next.repeat;
 // Edits activate at home, including on arrival before a fuel/manual pause or
 // waiting for cargo space. Keep the parked position consistent with new stops.
 m.index=0;m.to=m.home;m.from=m.stops.at(-1).planet;delete m.pending;
 report(s,'Routenänderung aktiviert',`${m.name}: Flotte und Stopps am Startplaneten aktualisiert.`);return true;
}
function pauseRoute(s,m,reason='Manuell pausiert'){
 m.paused=true;m.pauseRequested=false;m.pauseReason=reason;
 report(s,'Handelsroute pausiert',`${m.name}: ${reason}. Schiffe bleiben an die Route gebunden.`);
}
function resumeRoute(s,m,continuing=false){
 const p=getPlanet(s,m.home),f=routeInfo(s,m.stops,fleetManifest(m));
 if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel)throw Error('Treibstoff reicht nicht für die Runde einschließlich Reserve.');
 pay(p,vector([0,0,f.fuel]));const z=routeStats(s,m);z.fuelPaid=routeSum(z.fuelPaid,f.fuel);m.paused=false;m.pauseRequested=false;delete m.pauseReason;stopCargo(s,m,m.stops[0],continuing?'round':'resumed',false);leaveRoute(s,m,1);
}
function routeArrival(s,m){
 if(m.index===0){const out=unloadCargo(getPlanet(s,m.home),m.cargo);routeActivity(s,m,m.home,out,vector([0,0,0]),'round',true);m.rounds++;
  if(m.pending&&!m.stopping&&applyRouteEdit(s,m)===false)report(s,'Routenänderung wartet',`${m.name}: Am Startplaneten fehlen Schiffe; bisherige Route bleibt aktiv.`);
  if(m.stopping){parkFleet(s,m,m.home,'Handelsroute beendet');return;}
  if(m.pauseRequested){pauseRoute(s,m);return;}
  if(!m.repeat){parkFleet(s,m,m.home,'Handelsroute beendet');return;}
  const p=getPlanet(s,m.home),f=routeInfo(s,m.stops,fleetManifest(m));
  if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel){pauseRoute(s,m,'Treibstoff fehlt');return;}
  resumeRoute(s,m,true);
 }else{stopCargo(s,m,m.stops[m.index]);leaveRoute(s,m,(m.index+1)%m.stops.length);}
}
export function advance(s,now,collectDebris){
 if(!Number.isFinite(now))throw Error('Ungültige Zeit.');
 // Browser prediction waits for the authoritative shared-field arrival.
 if(!collectDebris)now=Math.min(now,...s.missions.filter(m=>m.type==='salvage'&&m.phase==='outbound').map(m=>m.due-1));
 now=Math.max(now,s.time);
 for(const m of s.missions)if(m.type==='route')routeStats(s,m);
 // Rates depend on buildings, planet modifiers and technology, not cargo.
 // Keep this cache inside one advance call; invalidate at structural events.
 const production=new Map(),readStats=p=>{if(!production.has(p))production.set(p,stats(s,p));return production.get(p);};
 waitingCargo(s);let guard=0;
 while(true){
  forecastShipJobs(s,readStats);
  const times=[];for(const p of s.planets){times.push(forecastRepair(p,s.time,readStats(p).ratio));if(p.build)times.push(p.build.end);for(const kind of ['ship','orbital'])if(p[kind+'job']&&!p[kind+'job'].paused)times.push(p[kind+'job'].workRemaining===0?s.time:p[kind+'job'].end);}if(s.research)times.push(s.research.end);for(const m of s.missions)if(!m.paused&&!m.awaitingUnload)times.push(m.due);
  const next=Math.min(...times);if(next>now||!Number.isFinite(next))break;if(++guard>100000){for(const m of s.missions)if(m.type==='route'&&!m.stopping){m.stopping=true;report(s,'Handelsroute endet nach langer Abwesenheit',`${m.name}: Die aktuelle Runde wird noch abgeschlossen.`);}guard=0;}
  produce(s,Math.max(0,next-s.time),readStats);s.time=Math.max(s.time,next);
  // Fixed order: research, buildings, shipbuilding, then missions by id.
  if(s.research&&s.research.end<=s.time){const j=s.research;s.tech[j.key]=j.level;s.research=null;production.clear();report(s,'Forschung abgeschlossen',`${TECHS[j.key].name} erreicht Stufe ${j.level}.`);}
  for(const p of s.planets){s.seq+=finishRepair(p,(title,body)=>report(s,title,body));if(p.build&&p.build.end<=s.time){
   const j=p.build;p.buildings[j.key]=j.level;p.build=null;production.delete(p);
   if(j.kind==='demolish'){
    // A smaller warehouse must not delete goods: overflow is parked in the depot.
    const cap=capacity(p);for(const k of RES){const excess=Math.max(0,p.resources[k]-cap);p.resources[k]-=excess;p.depot[k]+=excess;}
    if(p.buildHistory?.[j.key])delete p.buildHistory[j.key][j.level+1];
    deliver(p,j.refund);
    report(s,'Rückbau abgeschlossen',`${p.name}: ${BUILDINGS[j.key].name} auf Stufe ${j.level} zurückgebaut. 20 % Material erstattet.`);
   }else{
    if(j.paid&&j.originalMs){p.buildHistory??={};p.buildHistory[j.key]??={};p.buildHistory[j.key][j.level]={cost:j.paid,ms:j.originalMs};}
    report(s,'Ausbau abgeschlossen',`${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);
   }
  }if(p.shipjob&&p.shipjob.workRemaining===0){const j=p.shipjob;p.ships[j.key]+=j.count;nextShipOrder(p);report(s,'Schiffbau abgeschlossen',`${p.name}: ${j.count} × ${SHIPS[j.key].name}.`);}if(p.orbitaljob&&p.orbitaljob.workRemaining===0){const j=p.orbitaljob;p.ships[j.key]+=j.count;nextOrbitalOrder(p);report(s,'Orbitalplattform fertiggestellt',`${p.name}: ${j.count} × ${SHIPS[j.key].name}.`);}}
  for(const m of [...s.missions].sort((a,b)=>a.id-b.id))if(!m.paused&&!m.awaitingUnload&&m.due<=s.time){
   if(m.type==='route'){routeArrival(s,m);}
   else if(m.type==='station'){parkFleet(s,m,m.to,'Flotte stationiert');}
   else if(m.type==='salvage'&&m.phase==='outbound'){if(!collectDebris)throw Error('Trümmerbergung benötigt den Spielserver.');collectDebris(s,m);production.clear();m.phase='return';m.due=s.time+m.duration;report(s,'Trümmer geborgen',`${getPlanet(s,m.to).name}: ${Math.floor(m.cargo.metal)} Metall und ${Math.floor(m.cargo.crystal)} Kristall auf dem Rückweg.`);}
   else if(m.type==='collect'&&m.phase==='outbound'){loadCargo(s,getPlanet(s,m.to),m.cargo,m.order,m.count,m.ship,m.fleet);m.phase='return';m.due=s.time+m.duration;report(s,'Material abgeholt',`${getPlanet(s,m.to).name}: Ladung auf dem Rückweg.`);}
   else if(m.phase==='return'){parkFleet(s,m,m.from,'Flotte zurückgekehrt');}
   else if(m.type==='probe'){if(!s.discovered.includes(m.to))s.discovered.push(m.to);const t=TARGETS.find(t=>t.id===m.to);report(s,'Sondenbericht',`${t.name} [${t.coord}] · ${t.kind}. Metall ×${t.mult[0]}, Kristall ×${t.mult[1]}, Treibstoff ×${t.mult[2]}. Energiebedarf ×${t.energy}.`);m.phase='return';m.due=s.time+m.duration;}
   else if(m.type==='colony'){const t=TARGETS.find(t=>t.id===m.to);if(!s.planets.some(p=>p.id===t.id)){const p=planet(t.id,t.name,t);p.buildings.solar=2;deliver(p,m.cargo);s.planets.push(p);report(s,'Kolonie gegründet',`${t.name} ist besiedelt. Mitgebrachte Startmaterialien stehen dort bereit. Baue zuerst lokale Minen.`);}s.missions=s.missions.filter(x=>x.id!==m.id);}
   else {const out=unloadCargo(getPlanet(s,m.to),m.cargo);report(s,'Transport angekommen',`${getPlanet(s,m.from).name} → ${getPlanet(s,m.to).name}: ${RES.map(k=>`${Math.round(out[k])} ${k==='metal'?'Metall':k==='crystal'?'Kristall':'Treibstoff'}`).join(', ')} abgeladen.${cargoPresent(m.cargo)?' Restladung kehrt im Frachter zurück.':''}`);m.phase='return';m.due=s.time+m.duration;}
  }
  waitingCargo(s);
 }
 produce(s,now-s.time,readStats);s.time=now;waitingCargo(s);for(const m of s.missions)if(m.paused||m.awaitingUnload)m.due=now;forecastShipJobs(s,readStats);for(const p of s.planets)forecastRepair(p,s.time,readStats(p).ratio);return s;
}
export function act(s,action,now=Date.now()){
 // Work on a copy; a rejected command cannot partially mutate the caller.
 const n=structuredClone(s);advance(n,now);const p=getPlanet(n,action.planet||n.active);
 if(action.type==='build'){const info=buildInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(p.build)throw Error('Auf diesem Planeten läuft bereits ein Bauauftrag.');pay(p,info.cost);p.build={key:action.key,level:p.buildings[action.key]+1,start:n.time,end:n.time+info.ms,paid:info.cost,originalMs:info.ms};}
 else if(action.type==='demolish'){
  const info=demolishInfo(n,p,action.key);
  if(info.reason)throw Error(info.reason);
  // Re-evaluate on the authoritative server; the client confirmation is never trusted.
  if(!Number.isSafeInteger(info.ms)||n.time+info.ms>8.64e15)throw Error('Rückbaudauer ungültig.');
  p.build={kind:'demolish',key:action.key,level:info.target,start:n.time,end:n.time+info.ms,refund:info.refund,originalMs:info.originalMs};
 }
 else if(action.type==='research'){const info=researchInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(n.research)throw Error('Es läuft bereits eine imperiumsweite Forschung.');pay(p,info.cost);n.research={key:action.key,level:n.tech[action.key]+1,start:n.time,end:n.time+info.ms,planet:p.id};}
 else if(action.type==='ship'){const count=action.count;if(!Number.isSafeInteger(count)||count<1)throw Error('Wähle eine positive ganze Anzahl Schiffe.');const info=shipInfo(n,p,action.key,count);if(info.reason)throw Error(info.reason);const defense=SHIPS[action.key]?.category==='defense',full=defense?orbitalQueueFullReason(p):shipQueueFullReason(p);if(full)throw Error(full);if(!Number.isSafeInteger(info.ms)||n.time+info.ms>8.64e15||RES.some(k=>!Number.isSafeInteger(info.cost[k])||info.cost[k]>1e12))throw Error('Dieser Bauauftrag ist zu groß.');if(p.defenseSalvage)for(const k of RES)p.defenseSalvage[k]-=info.salvage[k];pay(p,info.cost);const job={id:++n.seq,key:action.key,count,start:n.time,end:n.time+info.ms,workTotal:info.ms,workRemaining:info.ms,payment:{resources:{...info.cost},salvage:{...info.salvage}}};if(defense){if(p.orbitaljob){p.orbitalqueue??=[];p.orbitalqueue.push(job);}else p.orbitaljob=job;}else if(p.shipjob){p.shipqueue??=[];p.shipqueue.push(job);}else p.shipjob=job;}
 else if(action.type==='scrap-ship'){
  const q=scrapShipInfo(p,action.key,action.count);if(q.reason)throw Error(q.reason);
  // Consume free damaged hulls first; docked and travelling units are not in p.ships.
  if(p.hulls?.[action.key])p.hulls[action.key].sort((a,b)=>a-b);
  takeHulls(p,{[action.key]:action.count});p.ships[action.key]-=action.count;
  for(const k of RES)p.depot[k]+=q.refund[k];settle(p);
  report(n,'Schiffe verschrottet',p.name+': '+action.count+' × '+SHIPS[action.key].name+' endgültig verschrottet. 30 % der Bauressourcen erstattet; Überschüsse bleiben im Lieferdepot.');
 }
 else if(action.type==='cancel-ship'){
  const o=action.order,j=o?.id!==undefined?[...shipOrders(p),...orbitalOrders(p)].find(j=>j.id===o.id):p.shipjob;
  if(!j)throw Error('Dieser Schiffsbauauftrag ist bereits abgeschlossen oder abgebrochen. Der Bauauftrag hat sich geändert. Bitte die Ansicht aktualisieren.');
  if(!o||['key','count','start'].some(k=>o[k]!==j[k])||(j.id!==undefined?o.id!==j.id:o.end!==(j.orderEnd??j.end)))throw Error('Der Bauauftrag hat sich geändert. Bitte die Ansicht aktualisieren.');
  const refund=shipRefund(j);for(const k of RES){p.depot[k]+=refund.resources[k];p.defenseSalvage??=vector([0,0,0]);p.defenseSalvage[k]+=refund.salvage[k];}settle(p);if(j===p.shipjob)nextShipOrder(p);else if(j===p.orbitaljob)nextOrbitalOrder(p);else if((p.orbitalqueue||[]).includes(j))p.orbitalqueue=p.orbitalqueue.filter(q=>q!==j);else p.shipqueue=p.shipqueue.filter(q=>q!==j);
  report(n,'Schiffsbau abgebrochen',p.name+': '+j.count+' × '+SHIPS[j.key].name+'. Rohstoffe zurückerstattet; Überschüsse bleiben im Lieferdepot.'+(refund.legacyDefense?' Metall und Kristall des alten Verteidigungsauftrags bleiben als Reparaturmaterial verfügbar.':''));
 }
 else if(action.type==='probe'||action.type==='colony'||action.type==='transport'){
  const ship=action.type==='probe'?'probe':action.type==='colony'?'colony':'transport';const count=ship==='transport'?action.count:1;if(!Number.isSafeInteger(count)||count<1)throw Error('Ungültige Flottengröße.');if(p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe.');
  let dest,cargo=vector([0,0,0]);
  if(ship==='transport'){dest=getPlanet(n,action.to);if((p.system||'tutorial')!==(dest.system||'tutorial'))throw Error('Interstellare Flüge benötigen einen fortgeschrittenen Frachter.');if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');cargo=action.cargo;if(!cargo||RES.some(k=>!Number.isSafeInteger(cargo[k])||cargo[k]<0))throw Error('Ladung muss aus nichtnegativen ganzen Zahlen bestehen.');const total=RES.reduce((sum,k)=>sum+cargo[k],0);if(!total)throw Error('Wähle eine Ladung.');if(total>cargoCapacity(n,count))throw Error('Die Ladung übersteigt den Laderaum.');}
  else {if(p.system)throw Error('Tutorial-Sonden und Kolonieschiffe starten im Tutorial-System. Wähle dort eine Heimatwelt.');dest=TARGETS.find(t=>t.id===action.to);if(!dest)throw Error('Unbekanntes Erkundungsziel.');if(ship==='colony'){if(!n.discovered.includes(dest.id))throw Error('Zuerst mit einer Sonde erkunden.');if(n.planets.some(p=>p.id===dest.id)||n.missions.some(m=>m.type==='colony'&&m.to===dest.id))throw Error('Planet bereits besiedelt oder reserviert.');if(n.planets.length-1+n.missions.filter(m=>m.type==='colony').length>=n.tech.colonization)throw Error('Erforsche eine weitere Kolonisierungsstufe.');cargo=vector([350,250,100]);}}
  const f=flightInfo(n,p,dest,count,ship==='probe',ship);const cost={...cargo,fuel:cargo.fuel+f.fuel};pay(p,cost);p.ships[ship]-=count;const hulls=takeHulls(p,{[ship]:count});n.missions.push({id:++n.seq,type:action.type,ship,count,hulls,shieldUntil:p.shieldUntil||0,from:p.id,to:dest.id,cargo,phase:'outbound',start:n.time,duration:f.ms,due:n.time+f.ms});
 }
 else if(action.type==='repair'){
  if(!(p.buildings.repairDock>=1))throw Error('Baue zuerst ein Reparaturdock auf diesem Planeten.');
  if(repairOrders(p).length>=20)throw Error('Alle 20 Reparaturaufträge sind belegt.');
  const q=repairQuote(p,action.key,action.count,stats(n,p).ratio);if(q.count>100000)throw Error('Maximal 100.000 Einheiten je Auftrag.');pay(p,q.cost);reserveRepair(p,action.key,q,++n.seq,n.time);report(n,'Reparatur eingereiht',`${p.name}: ${q.count} × ${SHIPS[action.key].name}.`);
 }
 else if(['cancel-repair','resume-repair'].includes(action.type)){
  const j=repairOrders(p).find(j=>j.id===action.id);if(!j)throw Error('Der Reparaturauftrag hat sich geändert.');
  if(action.type==='cancel-repair'){const refund=repairRefund(j);for(const k of RES)p.depot[k]+=refund[k];releaseRepair(p,j);settle(p);report(n,'Reparatur abgebrochen',p.name+': ungenutztes Material erstattet; Schiffe freigegeben.');}
  else{const cost=repairMaterials(j);if(!RES.some(k=>cost[k]>0))throw Error('Kein Zusatzmaterial erforderlich.');pay(p,cost);payRepairMaterials(j,cost);report(n,'Reparatur fortgesetzt',p.name+': zusätzliches Kampfmaterial bereitgestellt.');}
 }
 else if(action.type==='reserve'){if(!action.reserves||RES.some(k=>!Number.isSafeInteger(action.reserves[k])||action.reserves[k]<0||action.reserves[k]>1e12))throw Error('Ungültige Reserve.');p.reserves={...action.reserves};}
 else if(action.type==='edit-route'||action.type==='cancel-route-edit'){const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m||m.stopping||m.awaitingUnload)throw Error('Diese Route lässt sich nicht mehr bearbeiten.');if(action.type==='cancel-route-edit'){delete m.pending;}else{const fleet=checkedFleet(action.fleet),stops=checkedStops(n,action.stops,m.home);routeInfo(n,stops,fleet);m.pending={name:String(action.name||'Handelsroute').trim().slice(0,40)||'Handelsroute',fleet,stops,repeat:!!action.repeat};if(m.paused){if(applyRouteEdit(n,m)===false)throw Error('Für die Änderung fehlen Schiffe oder die Restladung passt nicht in die neue Flotte.');}else report(n,'Routenänderung vorgemerkt',`${m.name}: Aktivierung bei Rückkehr zum Startplaneten.`);}}
 else if(['pause-route','resume-route','cancel-route-pause'].includes(action.type)){
 const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m||m.stopping)throw Error('Route nicht verfügbar.');
 if(action.type==='pause-route'){if(m.paused)throw Error('Route ist bereits pausiert.');m.pauseRequested=true;report(n,'Routenpause vorgemerkt',`${m.name}: Pause nach Rückkehr zum Startplaneten.`);}
 else if(action.type==='cancel-route-pause'){if(m.paused)throw Error('Route ist bereits pausiert.');m.pauseRequested=false;}
 else{if(!m.paused)throw Error('Route ist nicht pausiert.');resumeRoute(n,m);report(n,'Route fortgesetzt',m.name);}
 }
 else if(action.type==='stop-route'){const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m)throw Error('Route nicht gefunden.');if(m.paused)parkFleet(n,m,m.home,'Handelsroute beendet');else{m.stopping=true;report(n,'Route endet nach dieser Runde',m.name);}}
 else if(['station','collect','salvage','route','deliver'].includes(action.type)){
  if(n.missions.length>=100)throw Error('Zu viele Flotten unterwegs.');
  if(!action.fleet&&action.type!=='route'&&action.type!=='station'&&!isFreighter(action.ship||'transport'))throw Error('Liefern, Abholen und Handelsrouten benötigen Transporter.');
  const manifest=action.type==='route'?checkedFleet(action.fleet||{[action.ship||'transport']:action.count}):action.fleet?missionFleet(action.fleet,action.type==='station'):null;const ship=manifest?Object.keys(manifest)[0]:action.ship||'transport',count=manifest?manifest[ship]:action.count;
  if(SHIPS[ship]?.category==='defense')throw Error('Orbitale Verteidigung kann nicht verlegt werden.');
  if(!Object.hasOwn(SHIPS,ship)||!Number.isSafeInteger(count)||count<1||p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe oder ungültige Anzahl.');
  const cargo=vector([0,0,0]),hulls={};let m={id:++n.seq,type:action.type,ship,count,from:p.id,cargo,phase:'outbound',start:n.time};
  if(action.type==='route'){
   const stops=checkedStops(n,action.stops,p.id);if(!Array.isArray(stops)||stops.length<2||stops.length>12||stops[0].planet!==p.id)throw Error('Eine Route benötigt 2–12 Stopps und beginnt hier.');
   for(let i=0;i<stops.length;i++){getPlanet(n,stops[i].planet);if(stops[i].planet===stops[(i+1)%stops.length].planet||!validOrder(stops[i].load)||!validOrder(stops[i].unload))throw Error('Ungültiger Stopp oder Laderegel.');}
   if(Object.entries(manifest).some(([k,v])=>p.ships[k]<v))throw Error('Nicht genügend verfügbare Schiffe.');setFleet(m,manifest);const f=routeInfo(n,stops,manifest);if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel)throw Error('Treibstoff reicht nicht für die Runde einschließlich Reserve.');pay(p,vector([0,0,f.fuel]));
   Object.assign(m,{name:String(action.name||'Handelsroute').trim().slice(0,40)||'Handelsroute',stops:structuredClone(stops),home:p.id,index:0,repeat:!!action.repeat,stopping:false,rounds:0});routeStats(n,m).fuelPaid=f.fuel;stopCargo(n,m,stops[0],'started',false);leaveRoute(n,m,1);
  }else{
   if(manifest){if(Object.entries(manifest).some(([k,v])=>p.ships[k]<v))throw Error('Nicht genügend verfügbare Schiffe.');setFleet(m,manifest);}
   const dest=getPlanet(n,action.to);if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');if((p.system||'tutorial')!==(dest.system||'tutorial')&&!canFlyInterstellar(n,ship))throw Error(ship==='falke'?'Interstellare Falkenflüge benötigen Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1.':'Interstellare Flüge benötigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.');const f=manifest?fleetLegInfo(n,p,dest,manifest):legInfo(n,p,dest,count,ship);
   const order=action.order||action.cargo||vector([0,0,0]);if(!validOrder(order))throw Error('Ladung: ganze Mengen oder Maximum wählen.');
   if(!(manifest?Object.keys(manifest).some(isFreighter):isFreighter(ship))&&RES.some(k=>order[k]!==0))throw Error('Material benötigt Transporter.');
   const fuel=f.fuel*(action.type==='station'?1:2);if(p.resources.fuel-(p.reserves?.fuel||0)<fuel)throw Error('Nicht genügend Treibstoff einschließlich Reserve.');pay(p,vector([0,0,fuel]));
   if(action.type==='salvage'){if(!dest.system)throw Error('Trümmer liegen an einer gemeinsamen Galaxiekolonie.');}
   else if(action.type!=='collect'){const exact=RES.reduce((a,k)=>a+(order[k]==='max'?0:order[k]),0);if(exact>(manifest?fleetCapacity(n,manifest):cargoCapacity(n,count,ship))||RES.some(k=>order[k]!=='max'&&order[k]>Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0)))))throw Error('Die gewählte Ladung passt nicht oder lokale Ressourcen fehlen.');loadCargo(n,p,cargo,order,count,ship,manifest);if(action.type==='deliver'&&!RES.some(k=>cargo[k]>0))throw Error('Wähle verfügbare Ladung.');}else {if(!RES.some(k=>order[k]==='max'||order[k]>0))throw Error('Wähle Material zum Abholen.');m.order={...order};}
   Object.assign(m,{to:dest.id,duration:f.ms,due:n.time+f.ms});
  }
  for(const [k,v] of Object.entries(fleetManifest(m)))p.ships[k]-=v;m.hulls=takeHulls(p,fleetManifest(m));n.missions.push(m);
 }
 else throw Error('Unbekannte Aktion.');waitingCargo(n);forecastShipJobs(n);for(const q of n.planets)forecastRepair(q,n.time,stats(n,q).ratio);return n;
}
