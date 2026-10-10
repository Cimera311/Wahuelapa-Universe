import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,ROUTE_ECONOMY,vector,costAt,isFreighter,shipFlightEngine,canFlyInterstellar} from './config.js';

import {takeHulls,putHulls} from './combat.js';
import {sharedFlight} from './flight.js';

function planet(id,name,meta={}){
 return {id,name,coord:meta.coord||'1:1:4',kind:meta.kind||'Heimatwelt',mult:meta.mult||[1,1,1],color:meta.color||'#53add3',ocean:meta.ocean??true,energy:meta.energy||1,distance:meta.distance||0,reserves:vector([0,0,0]),resources:vector([0,0,0]),depot:vector([0,0,0]),buildings:Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,0])),ships:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,0])),build:null,shipjob:null};
}
export function newGame(name='Commander',now=Date.now()){
 const home=planet('home','Aurelia');
 home.resources=vector([3000,2200,1000]); Object.assign(home.buildings,{metal:1,crystal:1,fuel:1,solar:3});
 return {version:1,name:name.trim().slice(0,30)||'Commander',time:now,created:now,seq:0,active:'home',planets:[home],tech:Object.fromEntries(Object.keys(TECHS).map(k=>[k,0])),research:null,discovered:[],missions:[],reports:[]};
}
export function getPlanet(s,id){const p=s.planets.find(p=>p.id===id);if(!p)throw Error('Planet nicht gefunden.');return p;}
export function capacity(p){return 4000*Math.pow(1.7,p.buildings.warehouse);}
export function shipyardTimeFactor(level){return Math.pow(.92,Math.max(0,level-1));}
export function energyDemand(p){
 const consumers={metal:p.buildings.metal*15,crystal:p.buildings.crystal*18,fuel:p.buildings.fuel*20,shipyard:Math.ceil(10*Math.pow(p.buildings.shipyard,1.5))};
 return Object.fromEntries(Object.entries(consumers).map(([key,value])=>[key,value*p.energy]));
}
export function stats(s,p){
 const supply=(p.buildings.solar*45+p.buildings.tidal*180)*(1+s.tech.energy*.1);
 const consumers=energyDemand(p),demand=Object.values(consumers).reduce((a,b)=>a+b,0);
 const ratio=demand?Math.min(1,supply/demand):1;
 const rates=vector(RES.map((k,i)=>p.buildings[k]?([300,220,140][i]*p.buildings[k]*Math.pow(1.12,p.buildings[k]-1)*p.mult[i]*ratio):0));
 return {supply,demand,consumers,ratio,rates,cap:capacity(p)};
}
export function settle(p){const cap=capacity(p);for(const k of RES){const n=Math.min(Math.max(0,cap-p.resources[k]),p.depot[k]);p.resources[k]+=n;p.depot[k]-=n;}}
function deliver(p,cargo){for(const k of RES)p.depot[k]+=cargo[k];settle(p);}
// Work is measured in milliseconds at full power; forecasts never replace earned progress.
function forecastShipJobs(s){for(const p of s.planets){const j=p.shipjob;if(!j)continue;
 if(j.workRemaining===undefined){j.orderEnd=j.end;j.workTotal=j.end-j.start;j.workRemaining=Math.max(0,j.end-s.time);}
 const ratio=stats(s,p).ratio;j.paused=ratio===0&&j.workRemaining>0;
 // Keep paused saves finite. Their end is a placeholder, excluded from scheduling.
 j.end=s.time+Math.max(1,Math.ceil(j.workRemaining/(ratio||1)));
}}
function produce(s,ms){for(const p of s.planets){settle(p);const z=stats(s,p);for(const k of RES)p.resources[k]=Math.min(z.cap,p.resources[k]+z.rates[k]*ms/3600000);if(p.shipjob)p.shipjob.workRemaining=Math.max(0,p.shipjob.workRemaining-ms*z.ratio);}}
function report(s,title,body){s.reports.unshift({id:++s.seq,time:s.time,title,body});s.reports=s.reports.slice(0,60);}
export function need(s,p,req){if(!req)return '';if(req.tech&&s.tech[req.tech]<req.level)return `Benötigt ${TECHS[req.tech].name} Stufe ${req.level}.`;if(req.building&&p.buildings[req.building]<req.level)return `Benötigt ${BUILDINGS[req.building].name} Stufe ${req.level}.`;return '';}
export function buildInfo(s,p,key){const b=BUILDINGS[key];if(!b)throw Error('Unbekanntes Gebäude.');const l=p.buildings[key];return {cost:costAt(b,l),ms:Math.ceil(b.time*Math.pow(1.35,l)*Math.pow(.95,s.tech.engineering)*Math.pow(.92,p.buildings.robotics)*1000),reason:need(s,p,b.requires)||(b.ocean&&!p.ocean?'Benötigt einen Ozeanplaneten.':'')||(l>=(['orbital','bunker'].includes(key)?4:30)?'Maximale Gebäudestufe erreicht.':'')};}
export function researchInfo(s,p,key){const t=TECHS[key];if(!t)throw Error('Unbekannte Forschung.');const l=s.tech[key];return {cost:costAt(t,l),ms:Math.ceil(t.time*Math.pow(1.5,l)/Math.max(1,1+(p.buildings.lab-1)*.15)*1000),reason:(key==='colonization'&&l>=3&&l<t.max?need(s,p,{tech:['ramjet','impulse','hyperspace'][l-3],level:1}):'')||(p.buildings.lab<t.lab?`Benötigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.`:need(s,p,t.requires)||(l>=t.max?'Maximale Forschungsstufe erreicht.':''))};}
function pay(p,c){settle(p);for(const k of RES)if(!Number.isFinite(c[k])||c[k]<0||p.resources[k]+1e-8<c[k])throw Error('Nicht genügend lokale Ressourcen.');for(const k of RES)p.resources[k]=Math.max(0,p.resources[k]-c[k]);settle(p);}
export function defenseSlots(p){return Object.entries(SHIPS).reduce((a,[k,sh])=>a+(sh.slots||0)*(p.ships[k]||0),0)+(SHIPS[p.shipjob?.key]?.slots||0)*(p.shipjob?.count||0);}
export function shipRefund(job){
 if(!job)return {resources:vector([0,0,0]),salvage:vector([0,0,0]),legacyDefense:false};
 if(job.payment)return {resources:{...job.payment.resources},salvage:{...job.payment.salvage},legacyDefense:false};
 const gross=vector(SHIPS[job.key].cost.map(v=>v*job.count)),legacyDefense=SHIPS[job.key].category==='defense';
 return {resources:legacyDefense?vector([0,0,gross.fuel]):gross,salvage:legacyDefense?vector([gross.metal,gross.crystal,0]):vector([0,0,0]),legacyDefense};
}
export function shipInfo(s,p,key,count=1){const sh=SHIPS[key];if(!sh)throw Error('Unbekanntes Schiff.');const gross=vector(sh.cost.map(v=>v*count)),salvage=vector(RES.map(k=>sh.category==='defense'?Math.min(gross[k],p.defenseSalvage?.[k]||0):0));return {cost:vector(RES.map(k=>gross[k]-salvage[k])),salvage,ms:Math.ceil(sh.time*count*1000*shipyardTimeFactor(p.buildings.shipyard)),ratio:stats(s,p).ratio,reason:sh.slots&&defenseSlots(p)+sh.slots*count>(p.buildings.orbital||0)*4?'Nicht genügend freie Plätze auf der Orbitalplattform.':p.buildings.shipyard<(sh.shipyard||1)?`Benötigt Schiffswerft Stufe ${sh.shipyard||1}.`:s.tech[sh.tech]<(sh.techLevel||1)?`Benötigt ${TECHS[sh.tech].name} Stufe ${sh.techLevel||1}.`:(s.tech[sh.engine||'drive']||0)<(sh.engineLevel||0)?`Benötigt ${TECHS[sh.engine].name} Stufe ${sh.engineLevel}.`:''};}
export function cargoCapacity(s,n=1,ship='transport'){return Math.floor((SHIPS[ship]?.cargo||0)*(1+s.tech.logistics*.15))*n;}
export function flightInfo(s,from,to,n=1,probe=false,ship='transport'){if(from.system||to.system){const f=sharedFlight(s,from,to,n,probe?'probe':ship);return {...f,fuel:f.fuel*2};}const def=SHIPS[probe?'probe':ship];if(!def)throw Error('Unbekanntes Schiff.');const remote=(from.system||'tutorial')!==(to.system||'tutorial');const engine=shipFlightEngine(s,probe?'probe':ship,remote);const anchor=s.galaxy||{x:500,y:960};const a=from.system?from:anchor,b=to.system?to:anchor;const dist=remote?Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)/40):Math.max(1,Math.abs((from.distance||0)-(to.distance||0)));return {ms:Math.ceil((10+dist*8)*1000/((1+(s.tech[engine]||0)*.12+(probe?s.tech.scout*.1:0))*def.speed)),fuel:Math.ceil(def.fuel*2*dist*n/(1+(s.tech[engine]||0)*.12))};}
// Fleet fuel is prepaid for a complete itinerary; cargo never includes engine fuel.
export function legInfo(s,from,to,n=1,ship='transport'){const f=flightInfo(s,from,to,n,ship==='probe',ship);return {...f,fuel:Math.ceil(f.fuel/2)};}
export function routeLegInfo(s,from,to,n=1,ship='transport'){const f=legInfo(s,from,to,n,ship);return {ms:Math.ceil(f.ms*ROUTE_ECONOMY.time),fuel:Math.ceil(f.fuel*ROUTE_ECONOMY.fuel)};}
export function fleetManifest(m){return m.fleet||{[m.ship]:m.count};}
export function checkedFleet(fleet){if(!fleet||typeof fleet!=='object'||Array.isArray(fleet)||!Object.keys(fleet).length||Object.entries(fleet).some(([k,n])=>!isFreighter(k)||!Number.isSafeInteger(n)||n<1))throw Error('Wähle verfügbare Frachter in positiven ganzen Zahlen.');return {...fleet};}
export function fleetCapacity(s,fleet){return Object.entries(fleet).reduce((a,[k,n])=>a+cargoCapacity(s,n,k),0);}
export function mixedRouteLeg(s,from,to,fleet){let ms=0,fuel=0,slowest='';for(const [ship,count] of Object.entries(checkedFleet(fleet))){if((from.system||'tutorial')!==(to.system||'tutorial')&&!SHIPS[ship].engine)throw Error('Interstellare Routen benötigen bei allen Schiffen ein fortgeschrittenes Triebwerk.');const f=routeLegInfo(s,from,to,count,ship);if(f.ms>ms){ms=f.ms;slowest=ship;}fuel+=f.fuel;}return {ms,fuel,slowest};}
export function routeInfo(s,stops,count,ship='transport'){const fleet=typeof count==='object'?checkedFleet(count):checkedFleet({[ship]:count});let fuel=0,ms=0,slowest='';for(let i=0;i<stops.length;i++){const f=mixedRouteLeg(s,getPlanet(s,stops[i].planet),getPlanet(s,stops[(i+1)%stops.length].planet),fleet);fuel+=f.fuel;ms+=f.ms;slowest=f.slowest;}return {fuel,ms,slowest,capacity:fleetCapacity(s,fleet)};}
function checkedStops(s,stops,home){if(!Array.isArray(stops)||stops.length<2||stops.length>12||stops[0].planet!==home)throw Error('Eine Route benötigt 2–12 Stopps und beginnt am Startplaneten.');for(let i=0;i<stops.length;i++){getPlanet(s,stops[i].planet);if(stops[i].planet===stops[(i+1)%stops.length].planet||!validOrder(stops[i].load)||!validOrder(stops[i].unload))throw Error('Ungültiger Stopp oder Laderegel.');}return structuredClone(stops);}
function setFleet(m,fleet){m.fleet={...fleet};[m.ship,m.count]=Object.entries(fleet)[0];}
function validOrder(order){return order&&RES.every(k=>order[k]==='max'||Number.isSafeInteger(order[k])&&order[k]>=0&&order[k]<=1e12);}
function loadCargo(s,p,cargo,order,count,ship='transport',fleet=null){settle(p);let room=(fleet?fleetCapacity(s,fleet):cargoCapacity(s,count,ship))-RES.reduce((a,k)=>a+cargo[k],0);for(const k of RES){const want=order[k]==='max'?Infinity:order[k];const amount=Math.min(room,want,Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0))));cargo[k]+=amount;const local=Math.min(amount,p.resources[k]);p.resources[k]-=local;p.depot[k]-=amount-local;room-=amount;}settle(p);}
function stopCargo(s,m,stop){const p=getPlanet(s,stop.planet),out=vector(RES.map(k=>stop.unload[k]==='max'?m.cargo[k]:Math.min(m.cargo[k],stop.unload[k])));for(const k of RES)m.cargo[k]-=out[k];deliver(p,out);loadCargo(s,p,m.cargo,stop.load,m.count,m.ship,fleetManifest(m));}
function leaveRoute(s,m,index){const from=m.stops[m.index].planet,to=m.stops[index].planet,f=mixedRouteLeg(s,getPlanet(s,from),getPlanet(s,to),fleetManifest(m));m.from=from;m.to=to;m.index=index;m.start=s.time;m.duration=f.ms;m.due=s.time+f.ms;}
function parkFleet(s,m,id,title){const p=getPlanet(s,id);deliver(p,m.cargo);for(const [k,n] of Object.entries(fleetManifest(m)))p.ships[k]+=n;putHulls(p,m.hulls);p.shieldUntil=Math.max(p.shieldUntil||0,m.shieldUntil||0);s.missions=s.missions.filter(x=>x.id!==m.id);report(s,title,`${Object.entries(fleetManifest(m)).map(([k,n])=>n+' × '+SHIPS[k].name).join(', ')} im Orbit von ${p.name}. Ladung wurde eingelagert.`);}
function routeArrival(s,m){
 if(m.index===0){deliver(getPlanet(s,m.home),m.cargo);m.cargo=vector([0,0,0]);m.rounds++;report(s,'Handelsrunde abgeschlossen',`${m.name}: Runde ${m.rounds} beendet.`);
  if(m.pending&&!m.stopping){const next=m.pending,p=getPlanet(s,m.home),old=fleetManifest(m);if(Object.entries(next.fleet).every(([k,n])=>p.ships[k]+(old[k]||0)>=n)){for(const [k,n] of Object.entries(old))p.ships[k]+=n;putHulls(p,m.hulls);for(const [k,n] of Object.entries(next.fleet))p.ships[k]-=n;setFleet(m,next.fleet);m.hulls=takeHulls(p,next.fleet);m.name=next.name;m.stops=structuredClone(next.stops);m.repeat=next.repeat;delete m.pending;report(s,'Routenänderung aktiviert',`${m.name}: Flotte und Stopps am Startplaneten aktualisiert.`);}else report(s,'Routenänderung wartet',`${m.name}: Am Startplaneten fehlen Schiffe; bisherige Route bleibt aktiv.`);}
  if(!m.repeat||m.stopping){parkFleet(s,m,m.home,'Handelsroute beendet');return;}
  const p=getPlanet(s,m.home),f=routeInfo(s,m.stops,fleetManifest(m));
  if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel){parkFleet(s,m,m.home,'Handelsroute pausiert: Treibstoff fehlt');return;}
  pay(p,vector([0,0,f.fuel]));stopCargo(s,m,m.stops[0]);leaveRoute(s,m,1);
 }else{stopCargo(s,m,m.stops[m.index]);report(s,'Handelsstopp',`${m.name}: ${getPlanet(s,m.to).name} · Runde ${m.rounds+1}.`);leaveRoute(s,m,(m.index+1)%m.stops.length);}
}
export function advance(s,now){
 if(!Number.isFinite(now))throw Error('Ungültige Zeit.');now=Math.max(now,s.time);
 let guard=0;
 while(true){
  forecastShipJobs(s);
  const times=[];for(const p of s.planets){if(p.build)times.push(p.build.end);if(p.shipjob&&!p.shipjob.paused)times.push(p.shipjob.workRemaining===0?s.time:p.shipjob.end);}if(s.research)times.push(s.research.end);for(const m of s.missions)times.push(m.due);
  const next=Math.min(...times);if(next>now||!Number.isFinite(next))break;if(++guard>100000){for(const m of s.missions)if(m.type==='route'&&!m.stopping){m.stopping=true;report(s,'Handelsroute endet nach langer Abwesenheit',`${m.name}: Die aktuelle Runde wird noch abgeschlossen.`);}guard=0;}
  produce(s,Math.max(0,next-s.time));s.time=Math.max(s.time,next);
  // Fixed order: research, buildings, shipbuilding, then missions by id.
  if(s.research&&s.research.end<=s.time){const j=s.research;s.tech[j.key]=j.level;s.research=null;report(s,'Forschung abgeschlossen',`${TECHS[j.key].name} erreicht Stufe ${j.level}.`);}
  for(const p of s.planets){if(p.build&&p.build.end<=s.time){const j=p.build;p.buildings[j.key]=j.level;p.build=null;report(s,'Ausbau abgeschlossen',`${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);}if(p.shipjob&&p.shipjob.workRemaining===0){const j=p.shipjob;p.ships[j.key]+=j.count;p.shipjob=null;report(s,'Schiffbau abgeschlossen',`${p.name}: ${j.count} × ${SHIPS[j.key].name}.`);}}
  for(const m of [...s.missions].sort((a,b)=>a.id-b.id))if(m.due<=s.time){
   if(m.type==='route'){routeArrival(s,m);}
   else if(m.type==='station'){parkFleet(s,m,m.to,'Flotte stationiert');}
   else if(m.type==='collect'&&m.phase==='outbound'){loadCargo(s,getPlanet(s,m.to),m.cargo,m.order,m.count,m.ship);m.phase='return';m.due=s.time+m.duration;report(s,'Material abgeholt',`${getPlanet(s,m.to).name}: Ladung auf dem Rückweg.`);}
   else if(m.phase==='return'){if(m.type==='collect')deliver(getPlanet(s,m.from),m.cargo);getPlanet(s,m.from).ships[m.ship]+=m.count;putHulls(getPlanet(s,m.from),m.hulls);getPlanet(s,m.from).shieldUntil=Math.max(getPlanet(s,m.from).shieldUntil||0,m.shieldUntil||0);s.missions=s.missions.filter(x=>x.id!==m.id);report(s,'Flotte zurückgekehrt',`${SHIPS[m.ship].name}: ${m.count} zurück auf ${getPlanet(s,m.from).name}.`);}
   else if(m.type==='probe'){if(!s.discovered.includes(m.to))s.discovered.push(m.to);const t=TARGETS.find(t=>t.id===m.to);report(s,'Sondenbericht',`${t.name} [${t.coord}] · ${t.kind}. Metall ×${t.mult[0]}, Kristall ×${t.mult[1]}, Treibstoff ×${t.mult[2]}. Energiebedarf ×${t.energy}.`);m.phase='return';m.due=s.time+m.duration;}
   else if(m.type==='colony'){const t=TARGETS.find(t=>t.id===m.to);if(!s.planets.some(p=>p.id===t.id)){const p=planet(t.id,t.name,t);p.buildings.solar=2;deliver(p,m.cargo);s.planets.push(p);report(s,'Kolonie gegründet',`${t.name} ist besiedelt. Mitgebrachte Startmaterialien stehen dort bereit. Baue zuerst lokale Minen.`);}s.missions=s.missions.filter(x=>x.id!==m.id);}
   else {deliver(getPlanet(s,m.to),m.cargo);report(s,'Transport angekommen',`${getPlanet(s,m.from).name} → ${getPlanet(s,m.to).name}: ${RES.map(k=>`${Math.round(m.cargo[k])} ${k==='metal'?'Metall':k==='crystal'?'Kristall':'Treibstoff'}`).join(', ')}. Überschüsse bleiben im Lieferdepot.`);m.cargo=vector([0,0,0]);m.phase='return';m.due=s.time+m.duration;}
  }
 }
 produce(s,now-s.time);s.time=now;forecastShipJobs(s);return s;
}
export function act(s,action,now=Date.now()){
 // Work on a copy; a rejected command cannot partially mutate the caller.
 const n=structuredClone(s);advance(n,now);const p=getPlanet(n,action.planet||n.active);
 if(action.type==='build'){const info=buildInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(p.build)throw Error('Auf diesem Planeten läuft bereits ein Bauauftrag.');pay(p,info.cost);p.build={key:action.key,level:p.buildings[action.key]+1,start:n.time,end:n.time+info.ms};}
 else if(action.type==='research'){const info=researchInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(n.research)throw Error('Es läuft bereits eine imperiumsweite Forschung.');pay(p,info.cost);n.research={key:action.key,level:n.tech[action.key]+1,start:n.time,end:n.time+info.ms,planet:p.id};}
 else if(action.type==='ship'){const info=shipInfo(n,p,action.key,action.count);if(info.reason)throw Error(info.reason);if(p.shipjob)throw Error('Die Schiffswerft ist beschäftigt.');const count=action.count;if(!Number.isSafeInteger(count)||count<1)throw Error('Wähle eine positive ganze Anzahl Schiffe.');if(p.defenseSalvage)for(const k of RES)p.defenseSalvage[k]-=info.salvage[k];pay(p,info.cost);p.shipjob={id:++n.seq,key:action.key,count,start:n.time,end:n.time+info.ms,workTotal:info.ms,workRemaining:info.ms,payment:{resources:{...info.cost},salvage:{...info.salvage}}};}
 else if(action.type==='cancel-ship'){
  const j=p.shipjob,o=action.order;
  if(!j)throw Error('Dieser Schiffsbauauftrag ist bereits abgeschlossen oder abgebrochen.');
  if(!o||['key','count','start'].some(k=>o[k]!==j[k])||(j.id!==undefined?o.id!==j.id:o.end!==(j.orderEnd??j.end)))throw Error('Der Bauauftrag hat sich geändert. Bitte die Ansicht aktualisieren.');
  const refund=shipRefund(j);for(const k of RES){p.depot[k]+=refund.resources[k];p.defenseSalvage??=vector([0,0,0]);p.defenseSalvage[k]+=refund.salvage[k];}settle(p);p.shipjob=null;
  report(n,'Schiffsbau abgebrochen',p.name+': '+j.count+' × '+SHIPS[j.key].name+'. Rohstoffe zurückerstattet; Überschüsse bleiben im Lieferdepot.'+(refund.legacyDefense?' Metall und Kristall des alten Verteidigungsauftrags bleiben als Reparaturmaterial verfügbar.':''));
 }
 else if(action.type==='probe'||action.type==='colony'||action.type==='transport'){
  const ship=action.type==='probe'?'probe':action.type==='colony'?'colony':'transport';const count=ship==='transport'?action.count:1;if(!Number.isSafeInteger(count)||count<1)throw Error('Ungültige Flottengröße.');if(p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe.');
  let dest,cargo=vector([0,0,0]);
  if(ship==='transport'){dest=getPlanet(n,action.to);if((p.system||'tutorial')!==(dest.system||'tutorial'))throw Error('Interstellare Flüge benötigen einen fortgeschrittenen Frachter.');if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');cargo=action.cargo;if(!cargo||RES.some(k=>!Number.isSafeInteger(cargo[k])||cargo[k]<0))throw Error('Ladung muss aus nichtnegativen ganzen Zahlen bestehen.');const total=RES.reduce((sum,k)=>sum+cargo[k],0);if(!total)throw Error('Wähle eine Ladung.');if(total>cargoCapacity(n,count))throw Error('Die Ladung übersteigt den Laderaum.');}
  else {if(p.system)throw Error('Tutorial-Sonden und Kolonieschiffe starten im Tutorial-System. Wähle dort eine Heimatwelt.');dest=TARGETS.find(t=>t.id===action.to);if(!dest)throw Error('Unbekanntes Erkundungsziel.');if(ship==='colony'){if(!n.discovered.includes(dest.id))throw Error('Zuerst mit einer Sonde erkunden.');if(n.planets.some(p=>p.id===dest.id)||n.missions.some(m=>m.type==='colony'&&m.to===dest.id))throw Error('Planet bereits besiedelt oder reserviert.');if(n.planets.length-1+n.missions.filter(m=>m.type==='colony').length>=n.tech.colonization)throw Error('Erforsche eine weitere Kolonisierungsstufe.');cargo=vector([350,250,100]);}}
  const f=flightInfo(n,p,dest,count,ship==='probe',ship);const cost={...cargo,fuel:cargo.fuel+f.fuel};pay(p,cost);p.ships[ship]-=count;const hulls=takeHulls(p,{[ship]:count});n.missions.push({id:++n.seq,type:action.type,ship,count,hulls,shieldUntil:p.shieldUntil||0,from:p.id,to:dest.id,cargo,phase:'outbound',start:n.time,duration:f.ms,due:n.time+f.ms});
 }
 else if(action.type==='repair'){const hulls=p.hulls||{},cost=vector(RES.map((k,i)=>i===2?0:Object.entries(hulls).reduce((a,[key,list])=>a+list.reduce((v,hp)=>v+SHIPS[key].cost[i]*.3*(1-hp),0),0)));for(const k of RES)cost[k]=Math.ceil(cost[k]);if(!Object.values(hulls).some(x=>x.length))throw Error('Keine beschädigten Einheiten.');pay(p,cost);p.hulls={};report(n,'Einheiten repariert',p.name);}
 else if(action.type==='reserve'){if(!action.reserves||RES.some(k=>!Number.isSafeInteger(action.reserves[k])||action.reserves[k]<0||action.reserves[k]>1e12))throw Error('Ungültige Reserve.');p.reserves={...action.reserves};}
 else if(action.type==='edit-route'||action.type==='cancel-route-edit'){const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m||m.stopping)throw Error('Diese Route lässt sich nicht mehr bearbeiten.');if(action.type==='cancel-route-edit'){delete m.pending;}else{const fleet=checkedFleet(action.fleet),stops=checkedStops(n,action.stops,m.home);routeInfo(n,stops,fleet);m.pending={name:String(action.name||'Handelsroute').trim().slice(0,40)||'Handelsroute',fleet,stops,repeat:!!action.repeat};report(n,'Routenänderung vorgemerkt',`${m.name}: Aktivierung bei Rückkehr zum Startplaneten.`);}}
 else if(action.type==='stop-route'){const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m)throw Error('Route nicht gefunden.');m.stopping=true;report(n,'Route endet nach dieser Runde',m.name);}
 else if(['station','collect','route','deliver'].includes(action.type)){
  if(n.missions.length>=100)throw Error('Zu viele Flotten unterwegs.');
  if(action.type!=='route'&&action.type!=='station'&&!isFreighter(action.ship||'transport'))throw Error('Liefern, Abholen und Handelsrouten benötigen Transporter.');
  const manifest=action.type==='route'?checkedFleet(action.fleet||{[action.ship||'transport']:action.count}):null;const ship=manifest?Object.keys(manifest)[0]:action.ship||'transport',count=manifest?manifest[ship]:action.count;
  if(SHIPS[ship]?.category==='defense')throw Error('Orbitale Verteidigung kann nicht verlegt werden.');
  if(!Object.hasOwn(SHIPS,ship)||!Number.isSafeInteger(count)||count<1||p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe oder ungültige Anzahl.');
  const cargo=vector([0,0,0]),hulls={};let m={id:++n.seq,type:action.type,ship,count,from:p.id,cargo,phase:'outbound',start:n.time};
  if(action.type==='route'){
   const stops=checkedStops(n,action.stops,p.id);if(!Array.isArray(stops)||stops.length<2||stops.length>12||stops[0].planet!==p.id)throw Error('Eine Route benötigt 2–12 Stopps und beginnt hier.');
   for(let i=0;i<stops.length;i++){getPlanet(n,stops[i].planet);if(stops[i].planet===stops[(i+1)%stops.length].planet||!validOrder(stops[i].load)||!validOrder(stops[i].unload))throw Error('Ungültiger Stopp oder Laderegel.');}
   if(Object.entries(manifest).some(([k,v])=>p.ships[k]<v))throw Error('Nicht genügend verfügbare Schiffe.');setFleet(m,manifest);const f=routeInfo(n,stops,manifest);if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel)throw Error('Treibstoff reicht nicht für die Runde einschließlich Reserve.');pay(p,vector([0,0,f.fuel]));
   Object.assign(m,{name:String(action.name||'Handelsroute').trim().slice(0,40)||'Handelsroute',stops:structuredClone(stops),home:p.id,index:0,repeat:!!action.repeat,stopping:false,rounds:0});stopCargo(n,m,stops[0]);leaveRoute(n,m,1);
  }else{
   const dest=getPlanet(n,action.to);if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');if((p.system||'tutorial')!==(dest.system||'tutorial')&&!canFlyInterstellar(n,ship))throw Error(ship==='falke'?'Interstellare Falkenflüge benötigen Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1.':'Interstellare Flüge benötigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.');const f=legInfo(n,p,dest,count,ship);
   const order=action.order||action.cargo||vector([0,0,0]);if(!validOrder(order))throw Error('Ladung: ganze Mengen oder Maximum wählen.');
   if(!isFreighter(ship)&&RES.some(k=>order[k]!==0))throw Error('Material benötigt Transporter.');
   const fuel=f.fuel*(action.type==='station'?1:2);if(p.resources.fuel-(p.reserves?.fuel||0)<fuel)throw Error('Nicht genügend Treibstoff einschließlich Reserve.');pay(p,vector([0,0,fuel]));
   if(action.type!=='collect'){const exact=RES.reduce((a,k)=>a+(order[k]==='max'?0:order[k]),0);if(exact>cargoCapacity(n,count,ship)||RES.some(k=>order[k]!=='max'&&order[k]>Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0)))))throw Error('Die gewählte Ladung passt nicht oder lokale Ressourcen fehlen.');loadCargo(n,p,cargo,order,count,ship);if(action.type==='deliver'&&!RES.some(k=>cargo[k]>0))throw Error('Wähle verfügbare Ladung.');}else {if(!RES.some(k=>order[k]==='max'||order[k]>0))throw Error('Wähle Material zum Abholen.');m.order={...order};}
   Object.assign(m,{to:dest.id,duration:f.ms,due:n.time+f.ms});
  }
  for(const [k,v] of Object.entries(fleetManifest(m)))p.ships[k]-=v;m.hulls=takeHulls(p,fleetManifest(m));n.missions.push(m);
 }
 else throw Error('Unbekannte Aktion.');forecastShipJobs(n);return n;
}
