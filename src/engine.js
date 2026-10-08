import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,ROUTE_ECONOMY,vector,costAt,isFreighter} from './config.js';

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
export function stats(s,p){
 const supply=(p.buildings.solar*45+p.buildings.tidal*180)*(1+s.tech.energy*.1);
 const demand=(p.buildings.metal*15+p.buildings.crystal*18+p.buildings.fuel*20)*p.energy;
 const ratio=demand?Math.min(1,supply/demand):1;
 const rates=vector(RES.map((k,i)=>p.buildings[k]?([300,220,140][i]*p.buildings[k]*Math.pow(1.12,p.buildings[k]-1)*p.mult[i]*ratio):0));
 return {supply,demand,ratio,rates,cap:capacity(p)};
}
export function settle(p){const cap=capacity(p);for(const k of RES){const n=Math.min(Math.max(0,cap-p.resources[k]),p.depot[k]);p.resources[k]+=n;p.depot[k]-=n;}}
function deliver(p,cargo){for(const k of RES)p.depot[k]+=cargo[k];settle(p);}
function produce(s,ms){for(const p of s.planets){settle(p);const z=stats(s,p);for(const k of RES)p.resources[k]=Math.min(z.cap,p.resources[k]+z.rates[k]*ms/3600000);}}
function report(s,title,body){s.reports.unshift({id:++s.seq,time:s.time,title,body});s.reports=s.reports.slice(0,60);}
export function need(s,p,req){if(!req)return '';if(req.tech&&s.tech[req.tech]<req.level)return `Benötigt ${TECHS[req.tech].name} Stufe ${req.level}.`;if(req.building&&p.buildings[req.building]<req.level)return `Benötigt ${BUILDINGS[req.building].name} Stufe ${req.level}.`;return '';}
export function buildInfo(s,p,key){const b=BUILDINGS[key];if(!b)throw Error('Unbekanntes Gebäude.');const l=p.buildings[key];return {cost:costAt(b,l),ms:Math.ceil(b.time*Math.pow(1.35,l)*Math.pow(.95,s.tech.engineering)*Math.pow(.92,p.buildings.robotics)*1000),reason:need(s,p,b.requires)||(b.ocean&&!p.ocean?'Benötigt einen Ozeanplaneten.':'')||(l>=30?'Maximale Prototyp-Stufe 30 erreicht.':'')};}
export function researchInfo(s,p,key){const t=TECHS[key];if(!t)throw Error('Unbekannte Forschung.');const l=s.tech[key];return {cost:costAt(t,l),ms:Math.ceil(t.time*Math.pow(1.5,l)/Math.max(1,1+(p.buildings.lab-1)*.15)*1000),reason:(key==='colonization'&&l>=3&&l<t.max?need(s,p,{tech:['ramjet','impulse','hyperspace'][l-3],level:1}):'')||(p.buildings.lab<t.lab?`Benötigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.`:need(s,p,t.requires)||(l>=t.max?'Maximale Forschungsstufe erreicht.':''))};}
function pay(p,c){settle(p);for(const k of RES)if(!Number.isFinite(c[k])||c[k]<0||p.resources[k]+1e-8<c[k])throw Error('Nicht genügend lokale Ressourcen.');for(const k of RES)p.resources[k]=Math.max(0,p.resources[k]-c[k]);settle(p);}
export function shipInfo(s,p,key,count=1){const sh=SHIPS[key];if(!sh)throw Error('Unbekanntes Schiff.');return {cost:vector(sh.cost.map(v=>v*count)),ms:sh.time*count*1000,reason:p.buildings.shipyard<(sh.shipyard||1)?`Benötigt Schiffswerft Stufe ${sh.shipyard||1}.`:s.tech[sh.tech]<(sh.techLevel||1)?`Benötigt ${TECHS[sh.tech].name} Stufe ${sh.techLevel||1}.`:(s.tech[sh.engine||'drive']||0)<(sh.engineLevel||0)?`Benötigt ${TECHS[sh.engine].name} Stufe ${sh.engineLevel}.`:''};}
export function cargoCapacity(s,n=1,ship='transport'){return Math.floor((SHIPS[ship]?.cargo||0)*(1+s.tech.logistics*.15))*n;}
export function flightInfo(s,from,to,n=1,probe=false,ship='transport'){const def=SHIPS[probe?'probe':ship];if(!def)throw Error('Unbekanntes Schiff.');const remote=(from.system||'tutorial')!==(to.system||'tutorial');const anchor=s.galaxy||{x:500,y:960};const a=from.system?from:anchor,b=to.system?to:anchor;const dist=remote?Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)/40):Math.max(1,Math.abs((from.distance||0)-(to.distance||0)));return {ms:Math.ceil((10+dist*8)*1000/((1+(s.tech[def.engine||'drive']||0)*.12+(probe?s.tech.scout*.1:0))*def.speed)),fuel:Math.ceil(def.fuel*2*dist*n/(1+(s.tech[def.engine||'drive']||0)*.12))};}
// Fleet fuel is prepaid for a complete itinerary; cargo never includes engine fuel.
export function legInfo(s,from,to,n=1,ship='transport'){const f=flightInfo(s,from,to,n,ship==='probe',ship);return {...f,fuel:Math.ceil(f.fuel/2)};}
export function routeLegInfo(s,from,to,n=1,ship='transport'){const f=legInfo(s,from,to,n,ship);return {ms:Math.ceil(f.ms*ROUTE_ECONOMY.time),fuel:Math.ceil(f.fuel*ROUTE_ECONOMY.fuel)};}
export function routeInfo(s,stops,count,ship='transport'){let fuel=0,ms=0;for(let i=0;i<stops.length;i++){const origin=getPlanet(s,stops[i].planet),destination=getPlanet(s,stops[(i+1)%stops.length].planet);if((origin.system||'tutorial')!==(destination.system||'tutorial')&&!SHIPS[ship]?.engine)throw Error('Interstellare Flüge benötigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.');const f=routeLegInfo(s,origin,getPlanet(s,stops[(i+1)%stops.length].planet),count,ship);fuel+=f.fuel;ms+=f.ms;}return {fuel,ms};}
function validOrder(order){return order&&RES.every(k=>order[k]==='max'||Number.isSafeInteger(order[k])&&order[k]>=0&&order[k]<=1e12);}
function loadCargo(s,p,cargo,order,count,ship='transport'){settle(p);let room=cargoCapacity(s,count,ship)-RES.reduce((a,k)=>a+cargo[k],0);for(const k of RES){const want=order[k]==='max'?Infinity:order[k];const amount=Math.min(room,want,Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0))));cargo[k]+=amount;const local=Math.min(amount,p.resources[k]);p.resources[k]-=local;p.depot[k]-=amount-local;room-=amount;}settle(p);}
function stopCargo(s,m,stop){const p=getPlanet(s,stop.planet),out=vector(RES.map(k=>stop.unload[k]==='max'?m.cargo[k]:Math.min(m.cargo[k],stop.unload[k])));for(const k of RES)m.cargo[k]-=out[k];deliver(p,out);loadCargo(s,p,m.cargo,stop.load,m.count,m.ship);}
function leaveRoute(s,m,index){const from=m.stops[m.index].planet,to=m.stops[index].planet,f=routeLegInfo(s,getPlanet(s,from),getPlanet(s,to),m.count,m.ship);m.from=from;m.to=to;m.index=index;m.start=s.time;m.duration=f.ms;m.due=s.time+f.ms;}
function parkFleet(s,m,id,title){const p=getPlanet(s,id);deliver(p,m.cargo);p.ships[m.ship]+=m.count;s.missions=s.missions.filter(x=>x.id!==m.id);report(s,title,`${m.count} × ${SHIPS[m.ship].name} im Orbit von ${p.name}. Ladung wurde eingelagert.`);}
function routeArrival(s,m){
 if(m.index===0){deliver(getPlanet(s,m.home),m.cargo);m.cargo=vector([0,0,0]);m.rounds++;report(s,'Handelsrunde abgeschlossen',`${m.name}: Runde ${m.rounds} beendet.`);
  if(!m.repeat||m.stopping){parkFleet(s,m,m.home,'Handelsroute beendet');return;}
  const p=getPlanet(s,m.home),f=routeInfo(s,m.stops,m.count,m.ship);
  if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel){parkFleet(s,m,m.home,'Handelsroute pausiert: Treibstoff fehlt');return;}
  pay(p,vector([0,0,f.fuel]));stopCargo(s,m,m.stops[0]);leaveRoute(s,m,1);
 }else{stopCargo(s,m,m.stops[m.index]);report(s,'Handelsstopp',`${m.name}: ${getPlanet(s,m.to).name} · Runde ${m.rounds+1}.`);leaveRoute(s,m,(m.index+1)%m.stops.length);}
}
export function advance(s,now){
 if(!Number.isFinite(now))throw Error('Ungültige Zeit.');now=Math.max(now,s.time);
 let guard=0;
 while(true){
  const times=[];for(const p of s.planets){if(p.build)times.push(p.build.end);if(p.shipjob)times.push(p.shipjob.end);}if(s.research)times.push(s.research.end);for(const m of s.missions)times.push(m.due);
  const next=Math.min(...times);if(next>now||!Number.isFinite(next))break;if(++guard>100000){for(const m of s.missions)if(m.type==='route'&&!m.stopping){m.stopping=true;report(s,'Handelsroute endet nach langer Abwesenheit',`${m.name}: Die aktuelle Runde wird noch abgeschlossen.`);}guard=0;}
  produce(s,Math.max(0,next-s.time));s.time=Math.max(s.time,next);
  // Fixed order: research, buildings, shipbuilding, then missions by id.
  if(s.research&&s.research.end<=s.time){const j=s.research;s.tech[j.key]=j.level;s.research=null;report(s,'Forschung abgeschlossen',`${TECHS[j.key].name} erreicht Stufe ${j.level}.`);}
  for(const p of s.planets){if(p.build&&p.build.end<=s.time){const j=p.build;p.buildings[j.key]=j.level;p.build=null;report(s,'Ausbau abgeschlossen',`${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);}if(p.shipjob&&p.shipjob.end<=s.time){const j=p.shipjob;p.ships[j.key]+=j.count;p.shipjob=null;report(s,'Schiffbau abgeschlossen',`${p.name}: ${j.count} × ${SHIPS[j.key].name}.`);}}
  for(const m of [...s.missions].sort((a,b)=>a.id-b.id))if(m.due<=s.time){
   if(m.type==='route'){routeArrival(s,m);}
   else if(m.type==='station'){parkFleet(s,m,m.to,'Flotte stationiert');}
   else if(m.type==='collect'&&m.phase==='outbound'){loadCargo(s,getPlanet(s,m.to),m.cargo,m.order,m.count,m.ship);m.phase='return';m.due=s.time+m.duration;report(s,'Material abgeholt',`${getPlanet(s,m.to).name}: Ladung auf dem Rückweg.`);}
   else if(m.phase==='return'){if(m.type==='collect')deliver(getPlanet(s,m.from),m.cargo);getPlanet(s,m.from).ships[m.ship]+=m.count;s.missions=s.missions.filter(x=>x.id!==m.id);report(s,'Flotte zurückgekehrt',`${SHIPS[m.ship].name}: ${m.count} zurück auf ${getPlanet(s,m.from).name}.`);}
   else if(m.type==='probe'){if(!s.discovered.includes(m.to))s.discovered.push(m.to);const t=TARGETS.find(t=>t.id===m.to);report(s,'Sondenbericht',`${t.name} [${t.coord}] · ${t.kind}. Metall ×${t.mult[0]}, Kristall ×${t.mult[1]}, Treibstoff ×${t.mult[2]}. Energiebedarf ×${t.energy}.`);m.phase='return';m.due=s.time+m.duration;}
   else if(m.type==='colony'){const t=TARGETS.find(t=>t.id===m.to);if(!s.planets.some(p=>p.id===t.id)){const p=planet(t.id,t.name,t);p.buildings.solar=2;deliver(p,m.cargo);s.planets.push(p);report(s,'Kolonie gegründet',`${t.name} ist besiedelt. Mitgebrachte Startmaterialien stehen dort bereit. Baue zuerst lokale Minen.`);}s.missions=s.missions.filter(x=>x.id!==m.id);}
   else {deliver(getPlanet(s,m.to),m.cargo);report(s,'Transport angekommen',`${getPlanet(s,m.from).name} → ${getPlanet(s,m.to).name}: ${RES.map(k=>`${Math.round(m.cargo[k])} ${k==='metal'?'Metall':k==='crystal'?'Kristall':'Treibstoff'}`).join(', ')}. Überschüsse bleiben im Lieferdepot.`);m.cargo=vector([0,0,0]);m.phase='return';m.due=s.time+m.duration;}
  }
 }
 produce(s,now-s.time);s.time=now;return s;
}
export function act(s,action,now=Date.now()){
 // Work on a copy; a rejected command cannot partially mutate the caller.
 const n=structuredClone(s);advance(n,now);const p=getPlanet(n,action.planet||n.active);
 if(action.type==='build'){const info=buildInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(p.build)throw Error('Auf diesem Planeten läuft bereits ein Bauauftrag.');pay(p,info.cost);p.build={key:action.key,level:p.buildings[action.key]+1,start:n.time,end:n.time+info.ms};}
 else if(action.type==='research'){const info=researchInfo(n,p,action.key);if(info.reason)throw Error(info.reason);if(n.research)throw Error('Es läuft bereits eine imperiumsweite Forschung.');pay(p,info.cost);n.research={key:action.key,level:n.tech[action.key]+1,start:n.time,end:n.time+info.ms,planet:p.id};}
 else if(action.type==='ship'){const info=shipInfo(n,p,action.key,action.count);if(info.reason)throw Error(info.reason);if(p.shipjob)throw Error('Die Schiffswerft ist beschäftigt.');const count=action.count;if(!Number.isInteger(count)||count<1||count>50)throw Error('Baue zwischen 1 und 50 Schiffe.');pay(p,info.cost);p.shipjob={key:action.key,count,start:n.time,end:n.time+info.ms};}
 else if(action.type==='probe'||action.type==='colony'||action.type==='transport'){
  const ship=action.type==='probe'?'probe':action.type==='colony'?'colony':'transport';const count=ship==='transport'?action.count:1;if(!Number.isInteger(count)||count<1||count>100)throw Error('Ungültige Flottengröße.');if(p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe.');
  let dest,cargo=vector([0,0,0]);
  if(ship==='transport'){dest=getPlanet(n,action.to);if((p.system||'tutorial')!==(dest.system||'tutorial'))throw Error('Interstellare Flüge benötigen einen fortgeschrittenen Frachter.');if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');cargo=action.cargo;if(!cargo||RES.some(k=>!Number.isSafeInteger(cargo[k])||cargo[k]<0))throw Error('Ladung muss aus nichtnegativen ganzen Zahlen bestehen.');const total=RES.reduce((sum,k)=>sum+cargo[k],0);if(!total)throw Error('Wähle eine Ladung.');if(total>cargoCapacity(n,count))throw Error('Die Ladung übersteigt den Laderaum.');}
  else {if(p.system)throw Error('Tutorial-Sonden und Kolonieschiffe starten im Tutorial-System. Wähle dort eine Heimatwelt.');dest=TARGETS.find(t=>t.id===action.to);if(!dest)throw Error('Unbekanntes Erkundungsziel.');if(ship==='colony'){if(!n.discovered.includes(dest.id))throw Error('Zuerst mit einer Sonde erkunden.');if(n.planets.some(p=>p.id===dest.id)||n.missions.some(m=>m.type==='colony'&&m.to===dest.id))throw Error('Planet bereits besiedelt oder reserviert.');if(n.planets.length-1+n.missions.filter(m=>m.type==='colony').length>=n.tech.colonization)throw Error('Erforsche eine weitere Kolonisierungsstufe.');cargo=vector([350,250,100]);}}
  const f=flightInfo(n,p,dest,count,ship==='probe',ship);const cost={...cargo,fuel:cargo.fuel+f.fuel};pay(p,cost);p.ships[ship]-=count;n.missions.push({id:++n.seq,type:action.type,ship,count,from:p.id,to:dest.id,cargo,phase:'outbound',start:n.time,duration:f.ms,due:n.time+f.ms});
 }
 else if(action.type==='reserve'){if(!action.reserves||RES.some(k=>!Number.isSafeInteger(action.reserves[k])||action.reserves[k]<0||action.reserves[k]>1e12))throw Error('Ungültige Reserve.');p.reserves={...action.reserves};}
 else if(action.type==='stop-route'){const m=n.missions.find(m=>m.id===action.id&&m.type==='route');if(!m)throw Error('Route nicht gefunden.');m.stopping=true;report(n,'Route endet nach dieser Runde',m.name);}
 else if(['station','collect','route','deliver'].includes(action.type)){
  if(n.missions.length>=100)throw Error('Zu viele Flotten unterwegs.');
  if(action.type!=='station'&&!isFreighter(action.ship||'transport'))throw Error('Liefern, Abholen und Handelsrouten benötigen Transporter.');
  const ship=action.ship||'transport',count=action.count;
  if(!Object.hasOwn(SHIPS,ship)||!Number.isInteger(count)||count<1||count>100||p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe (1–100 pro Flotte).');
  const cargo=vector([0,0,0]);let m={id:++n.seq,type:action.type,ship,count,from:p.id,cargo,phase:'outbound',start:n.time};
  if(action.type==='route'){
   const stops=action.stops;if(!Array.isArray(stops)||stops.length<2||stops.length>12||stops[0].planet!==p.id)throw Error('Eine Route benötigt 2–12 Stopps und beginnt hier.');
   for(let i=0;i<stops.length;i++){getPlanet(n,stops[i].planet);if(stops[i].planet===stops[(i+1)%stops.length].planet||!validOrder(stops[i].load)||!validOrder(stops[i].unload))throw Error('Ungültiger Stopp oder Laderegel.');}
   const f=routeInfo(n,stops,count,ship);if(p.resources.fuel-(p.reserves?.fuel||0)<f.fuel)throw Error('Treibstoff reicht nicht für die Runde einschließlich Reserve.');pay(p,vector([0,0,f.fuel]));
   Object.assign(m,{name:String(action.name||'Handelsroute').trim().slice(0,40)||'Handelsroute',stops:structuredClone(stops),home:p.id,index:0,repeat:!!action.repeat,stopping:false,rounds:0});stopCargo(n,m,stops[0]);leaveRoute(n,m,1);
  }else{
   const dest=getPlanet(n,action.to);if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');if((p.system||'tutorial')!==(dest.system||'tutorial')&&!SHIPS[ship].engine)throw Error('Interstellare Flüge benötigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.');const f=legInfo(n,p,dest,count,ship);
   const order=action.order||action.cargo||vector([0,0,0]);if(!validOrder(order))throw Error('Ladung: ganze Mengen oder Maximum wählen.');
   if(!isFreighter(ship)&&RES.some(k=>order[k]!==0))throw Error('Material benötigt Transporter.');
   const fuel=f.fuel*(action.type==='station'?1:2);if(p.resources.fuel-(p.reserves?.fuel||0)<fuel)throw Error('Nicht genügend Treibstoff einschließlich Reserve.');pay(p,vector([0,0,fuel]));
   if(action.type!=='collect'){const exact=RES.reduce((a,k)=>a+(order[k]==='max'?0:order[k]),0);if(exact>cargoCapacity(n,count,ship)||RES.some(k=>order[k]!=='max'&&order[k]>Math.floor(Math.max(0,p.resources[k]+p.depot[k]-(p.reserves?.[k]||0)))))throw Error('Die gewählte Ladung passt nicht oder lokale Ressourcen fehlen.');loadCargo(n,p,cargo,order,count,ship);if(action.type==='deliver'&&!RES.some(k=>cargo[k]>0))throw Error('Wähle verfügbare Ladung.');}else {if(!RES.some(k=>order[k]==='max'||order[k]>0))throw Error('Wähle Material zum Abholen.');m.order={...order};}
   Object.assign(m,{to:dest.id,duration:f.ms,due:n.time+f.ms});
  }
  p.ships[ship]-=count;n.missions.push(m);
 }
 else throw Error('Unbekannte Aktion.');return n;
}
