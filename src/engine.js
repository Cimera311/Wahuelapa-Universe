import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,vector,costAt} from './config.js';

function planet(id,name,meta={}){
 return {id,name,coord:meta.coord||'1:1:4',kind:meta.kind||'Heimatwelt',mult:meta.mult||[1,1,1],color:meta.color||'#53add3',ocean:meta.ocean??true,energy:meta.energy||1,distance:meta.distance||0,resources:vector([0,0,0]),depot:vector([0,0,0]),buildings:Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,0])),ships:{probe:0,transport:0,colony:0},build:null,shipjob:null};
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
export function researchInfo(s,p,key){const t=TECHS[key];if(!t)throw Error('Unbekannte Forschung.');const l=s.tech[key];return {cost:costAt(t,l),ms:Math.ceil(t.time*Math.pow(1.5,l)/Math.max(1,1+(p.buildings.lab-1)*.15)*1000),reason:p.buildings.lab<t.lab?`Benötigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.`:need(s,p,t.requires)||(l>=t.max?'Maximale Forschungsstufe erreicht.':'')};}
function pay(p,c){settle(p);for(const k of RES)if(!Number.isFinite(c[k])||c[k]<0||p.resources[k]+1e-8<c[k])throw Error('Nicht genügend lokale Ressourcen.');for(const k of RES)p.resources[k]=Math.max(0,p.resources[k]-c[k]);settle(p);}
export function cargoCapacity(s,n=1){return Math.floor(1000*(1+s.tech.logistics*.15))*n;}
export function flightInfo(s,from,to,n=1,probe=false){const dist=Math.max(1,Math.abs((from.distance||0)-(to.distance||0)));return {ms:Math.ceil((10+dist*8)*1000/(1+s.tech.drive*.12+(probe?s.tech.scout*.1:0))),fuel:Math.ceil((probe?3:8)*dist*n/(1+s.tech.drive*.12))};}
export function advance(s,now){
 if(!Number.isFinite(now))throw Error('Ungültige Zeit.');now=Math.max(now,s.time);
 let guard=0;
 while(true){
  const times=[];for(const p of s.planets){if(p.build)times.push(p.build.end);if(p.shipjob)times.push(p.shipjob.end);}if(s.research)times.push(s.research.end);for(const m of s.missions)times.push(m.due);
  const next=Math.min(...times);if(next>now||!Number.isFinite(next))break;if(++guard>500)throw Error('Zu viele Ereignisse im Spielstand.');
  produce(s,Math.max(0,next-s.time));s.time=Math.max(s.time,next);
  // Fixed order: research, buildings, shipbuilding, then missions by id.
  if(s.research&&s.research.end<=s.time){const j=s.research;s.tech[j.key]=j.level;s.research=null;report(s,'Forschung abgeschlossen',`${TECHS[j.key].name} erreicht Stufe ${j.level}.`);}
  for(const p of s.planets){if(p.build&&p.build.end<=s.time){const j=p.build;p.buildings[j.key]=j.level;p.build=null;report(s,'Ausbau abgeschlossen',`${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);}if(p.shipjob&&p.shipjob.end<=s.time){const j=p.shipjob;p.ships[j.key]+=j.count;p.shipjob=null;report(s,'Schiffbau abgeschlossen',`${p.name}: ${j.count} × ${SHIPS[j.key].name}.`);}}
  for(const m of [...s.missions].sort((a,b)=>a.id-b.id))if(m.due<=s.time){
   if(m.phase==='return'){getPlanet(s,m.from).ships[m.ship]+=m.count;s.missions=s.missions.filter(x=>x.id!==m.id);report(s,'Flotte zurückgekehrt',`${SHIPS[m.ship].name}: ${m.count} zurück auf ${getPlanet(s,m.from).name}.`);}
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
 else if(action.type==='ship'){const sh=SHIPS[action.key];if(!sh)throw Error('Unbekanntes Schiff.');if(!p.buildings.shipyard)throw Error('Benötigt Schiffswerft Stufe 1.');if(!n.tech[sh.tech])throw Error(`Benötigt ${TECHS[sh.tech].name} Stufe 1.`);if(p.shipjob)throw Error('Die Schiffswerft ist beschäftigt.');const count=action.count;if(!Number.isInteger(count)||count<1||count>50)throw Error('Baue zwischen 1 und 50 Schiffe.');pay(p,vector(sh.cost.map(v=>v*count)));p.shipjob={key:action.key,count,start:n.time,end:n.time+sh.time*count*1000};}
 else if(action.type==='probe'||action.type==='colony'||action.type==='transport'){
  const ship=action.type==='probe'?'probe':action.type==='colony'?'colony':'transport';const count=ship==='transport'?action.count:1;if(!Number.isInteger(count)||count<1||count>100)throw Error('Ungültige Flottengröße.');if(p.ships[ship]<count)throw Error('Nicht genügend verfügbare Schiffe.');
  let dest,cargo=vector([0,0,0]);
  if(ship==='transport'){dest=getPlanet(n,action.to);if(dest.id===p.id)throw Error('Wähle einen anderen Zielplaneten.');cargo=action.cargo;if(!cargo||RES.some(k=>!Number.isSafeInteger(cargo[k])||cargo[k]<0))throw Error('Ladung muss aus nichtnegativen ganzen Zahlen bestehen.');const total=RES.reduce((sum,k)=>sum+cargo[k],0);if(!total)throw Error('Wähle eine Ladung.');if(total>cargoCapacity(n,count))throw Error('Die Ladung übersteigt den Laderaum.');}
  else {dest=TARGETS.find(t=>t.id===action.to);if(!dest)throw Error('Unbekanntes Erkundungsziel.');if(ship==='colony'){if(!n.discovered.includes(dest.id))throw Error('Zuerst mit einer Sonde erkunden.');if(n.planets.some(p=>p.id===dest.id)||n.missions.some(m=>m.type==='colony'&&m.to===dest.id))throw Error('Planet bereits besiedelt oder reserviert.');if(n.planets.length-1+n.missions.filter(m=>m.type==='colony').length>=n.tech.colonization)throw Error('Erforsche eine weitere Kolonisierungsstufe.');cargo=vector([350,250,100]);}}
  const f=flightInfo(n,p,dest,count,ship==='probe');const cost={...cargo,fuel:cargo.fuel+f.fuel};pay(p,cost);p.ships[ship]-=count;n.missions.push({id:++n.seq,type:action.type,ship,count,from:p.id,to:dest.id,cargo,phase:'outbound',start:n.time,duration:f.ms,due:n.time+f.ms});
 }
 else throw Error('Unbekannte Aktion.');return n;
}
