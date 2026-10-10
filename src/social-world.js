import {RES,SHIPS,vector,canFlyInterstellar,shipFlightEngine} from './config.js';
import {getPlanet,settle,fleetCapacity} from './engine.js';
import {sharedFlight} from './flight.js';
import {takeHulls,putHulls} from './combat.js';
const socialZero=()=>vector([0,0,0]);
const socialState=(w,uid)=>{const s=w.saves.find(r=>r.user_id===uid)?.state;if(!s)throw Error('Commander nicht gefunden.');return s;};
const socialLog=(s,time,title,body)=>{s.reports.unshift({id:++s.seq,time:Math.max(time,s.time),title,body});s.reports=s.reports.slice(0,60);};
const socialGrant=(w,owner,friend,right)=>w.partners.some(p=>p.status==='accepted'&&[p.from,p.to].includes(owner)&&[p.from,p.to].includes(friend)&&p.grants[owner]?.[right]);
const socialCargo=c=>{if(!c||typeof c!=='object'||RES.some(k=>!Number.isSafeInteger(c[k])||c[k]<0||c[k]>1e12))throw Error('Rohstoffe müssen positive ganze Mengen sein.');return Object.fromEntries(RES.map(k=>[k,c[k]]));};
const socialSum=c=>RES.reduce((n,k)=>n+c[k],0);
function socialPay(p,c){settle(p);if(RES.some(k=>p.resources[k]<c[k]))throw Error('Lokale Ressourcen reichen nicht.');for(const k of RES)p.resources[k]-=c[k];settle(p);}
function socialDeliver(p,c){for(const k of RES)p.depot[k]+=c[k];settle(p);}
function socialPlanet(w,owner,id){const meta=w.planets.find(p=>p.id===id&&p.owner_id===owner&&!p.reserved);const p=getPlanet(socialState(w,owner),id);if(!meta||!p.system)throw Error('Wähle eine besiedelte gemeinsame Galaxiekolonie.');return p;}
export function socialFlight(s,from,to,fleet,kind){
 const entries=Object.entries(fleet||{});if(!entries.length||entries.some(([k,n])=>!Number.isSafeInteger(n)||n<1||SHIPS[k]?.category!==(kind==='support'?'military':'freighter')))throw Error('Wähle verfügbare '+(kind==='support'?'Kriegsschiffe':'Frachter')+' in ganzen Zahlen.');
 let ms=0,fuel=0,slowest='';for(const [key,count] of entries){if((from.ships[key]||0)<count)throw Error('Nicht genügend verfügbare Schiffe.');if(from.system!==to.system&&(!canFlyInterstellar(s,key)||(s.tech[shipFlightEngine(s,key,true)]||0)<1))throw Error('Für interstellare Flüge fehlt ein geeigneter Antrieb.');const leg=sharedFlight(s,from,to,count,key);if(leg.ms>ms){ms=leg.ms;slowest=key;}fuel+=2*leg.fuel;}
 return {ms,fuel,slowest};
}
function socialReturn(w,m){if(!['outbound','stationed'].includes(m.status))throw Error('Diese Flotte ist bereits auf dem Rückweg.');const duration=m.status==='outbound'?Math.max(1,Math.min(m.duration,w.now-m.startedAt)):m.duration;m.status='returning';m.due=w.now+duration;}
function socialLaunch(w,uid,a,id,kind,payment=socialZero()){
 const s=socialState(w,uid),from=socialPlanet(w,uid,a.from),target=w.planets.find(p=>p.id===a.to&&!p.reserved&&p.owner_id&&p.owner_id!==uid);if(!target)throw Error('Wähle eine fremde besiedelte Galaxiekolonie.');const owner=target.owner_id,to=socialPlanet(w,owner,a.to);
 if(!socialGrant(w,owner,uid,kind==='support'?'defense':'delivery'))throw Error('Dein Partner hat dieses Recht nicht freigegeben.');
 if(w.socialMissions.filter(m=>m.owner===uid&&!['returned','lost'].includes(m.status)).length>=20)throw Error('Maximal 20 gemeinsame Flottenaufträge.');
 const f=socialFlight(s,from,to,a.fleet,kind),cargo=kind==='support'?socialZero():socialCargo(a.cargo);
 const cap=fleetCapacity(s,a.fleet);if(socialSum(cargo)>cap||socialSum(payment)>cap)throw Error('Der Laderaum muss für Hin- und Rückladung reichen.');if(kind!=='support'&&!socialSum(cargo))throw Error('Wähle eine positive Ladung.');
 socialPay(from,{...cargo,fuel:cargo.fuel+f.fuel});const hulls=takeHulls(from,a.fleet);for(const [k,n] of Object.entries(a.fleet))from.ships[k]-=n;
 const m={id,owner:uid,host:owner,from:from.id,to:to.id,kind,status:'outbound',fleet:{...a.fleet},hulls,cargo,payment,shieldUntil:from.shieldUntil||0,startedAt:w.now,due:w.now+f.ms,duration:f.ms,slowest:f.slowest};w.socialMissions.push(m);socialLog(s,w.now,'Partnerflotte gestartet',kind==='support'?'Verteidigung unterwegs nach '+to.name:'Lieferung unterwegs nach '+to.name);return m;
}
export function socialAction(w,uid,a,id){
 if(w.socialVersion!==1)throw Error('Für Partnerschaften fehlt noch die Datenbank-Erweiterung partnerships.sql.');
 const s=socialState(w,uid),op=a.op;
 if(op==='invite'){
  if(a.friend===uid)throw Error('Du kannst dich nicht selbst einladen.');socialState(w,a.friend);
  if(w.partners.some(p=>['pending','accepted'].includes(p.status)&&[p.from,p.to].includes(uid)&&[p.from,p.to].includes(a.friend)))throw Error('Es besteht bereits eine Einladung oder Partnerschaft.');
  if(w.partners.filter(p=>['pending','accepted'].includes(p.status)&&[p.from,p.to].includes(uid)).length>=20)throw Error('Maximal 20 Partnerschaften und Einladungen.');
  w.partners.push({id,from:uid,to:a.friend,status:'pending',grants:{[uid]:{delivery:!!a.delivery,defense:!!a.defense}}});socialLog(s,w.now,'Partnerschaft angefragt','Einladung gesendet.');socialLog(socialState(w,a.friend),w.now,'Partnerschaft eingeladen',s.name+' möchte dein Partner werden.');return;
 }
 if(['accept','permissions','end'].includes(op)){
  const p=w.partners.find(p=>p.id===a.id&&[p.from,p.to].includes(uid));if(!p)throw Error('Partnerschaft nicht gefunden.');
  if(op==='accept'){if(p.status!=='pending'||p.to!==uid)throw Error('Nur der eingeladene Commander kann zustimmen.');p.status='accepted';p.grants[uid]={delivery:!!a.delivery,defense:!!a.defense};}
  if(op==='permissions'){if(p.status!=='accepted')throw Error('Partnerschaft ist nicht aktiv.');p.grants[uid]={delivery:!!a.delivery,defense:!!a.defense};}
  if(op==='end'){if(!['pending','accepted'].includes(p.status))throw Error('Partnerschaft ist bereits beendet.');p.status='ended';}
  for(const m of w.socialMissions)if([p.from,p.to].includes(m.owner)&&[p.from,p.to].includes(m.host)&&['outbound','stationed'].includes(m.status)&&m.kind!=='trade'&&!socialGrant(w,m.host,m.owner,m.kind==='support'?'defense':'delivery'))socialReturn(w,m);
  for(const offer of w.trades)if(offer.status==='offered'&&[p.from,p.to].includes(offer.owner)&&[p.from,p.to].includes(offer.buyer)&&(!socialGrant(w,offer.buyer,offer.owner,'delivery')||!socialGrant(w,offer.owner,offer.buyer,'delivery')))offer.status='cancelled';
  return;
 }
 if(op==='recall'||op==='dismiss'){const m=w.socialMissions.find(m=>m.id===a.id&&m.kind==='support'&&(op==='recall'?m.owner===uid:m.host===uid));if(!m)throw Error('Du darfst diese Flotte nicht zurückschicken.');socialReturn(w,m);return;}
 if(op==='deliver'||op==='support'){socialLaunch(w,uid,a,id,op==='support'?'support':'delivery');return;}
 if(op==='trade-offer'){
  const from=socialPlanet(w,uid,a.from),target=w.planets.find(p=>p.id===a.to&&!p.reserved&&p.owner_id&&p.owner_id!==uid);if(!target)throw Error('Handelspartner fehlt.');const to=socialPlanet(w,target.owner_id,a.to);
  if(!socialGrant(w,target.owner_id,uid,'delivery')||!socialGrant(w,uid,target.owner_id,'delivery'))throw Error('Direkter Handel benötigt beidseitiges Lieferrecht.');
  const cargo=socialCargo(a.cargo),payment=socialCargo(a.payment);if(!socialSum(cargo)||!socialSum(payment))throw Error('Angebot und Gegenleistung dürfen nicht leer sein.');socialFlight(s,from,to,a.fleet,'delivery');const cap=fleetCapacity(s,a.fleet);if(socialSum(cargo)>cap||socialSum(payment)>cap)throw Error('Zu wenig Laderaum.');
  if(w.trades.filter(t=>t.owner===uid&&t.status==='offered').length>=10)throw Error('Maximal 10 offene Tauschangebote.');
  w.trades.push({id,owner:uid,buyer:target.owner_id,from:a.from,to:a.to,fleet:{...a.fleet},cargo,payment,status:'offered',expires:w.now+3600000});socialLog(socialState(w,target.owner_id),w.now,'Tauschangebot erhalten',s.name+' bietet einen direkten Rohstofftausch an.');return;
 }
 if(op==='trade-accept'||op==='trade-cancel'){
  const t=w.trades.find(t=>t.id===a.id);if(!t||t.status!=='offered'||t.expires<=w.now)throw Error('Dieses Angebot ist nicht mehr offen.');
  if(op==='trade-cancel'){if(![t.owner,t.buyer].includes(uid))throw Error('Dieses Angebot gehört dir nicht.');t.status='cancelled';return;}
  if(t.buyer!==uid)throw Error('Nur der Empfänger darf das Angebot annehmen.');if(!socialGrant(w,t.owner,uid,'delivery'))throw Error('Lieferrecht wurde entzogen.');
  const buyer=socialPlanet(w,uid,t.to);socialPay(buyer,t.payment);const m=socialLaunch(w,t.owner,{...t,cargo:t.cargo},id,'trade',t.payment);t.status='accepted';t.mission=m.id;return;
 }
 throw Error('Unbekannte Partneraktion.');
}
export function socialEvents(w){return w.socialMissions.filter(m=>['outbound','returning'].includes(m.status)).map(m=>({time:m.due,id:m.id,kind:'social',mission:m,order:m.status==='outbound'?1:3}));}
export function arriveSocial(w,m,time){
 const s=socialState(w,m.owner),from=socialPlanet(w,m.owner,m.from);
 if(m.status==='returning'){for(const [k,n] of Object.entries(m.fleet))from.ships[k]+=n;putHulls(from,m.hulls);from.shieldUntil=Math.max(from.shieldUntil||0,m.shieldUntil||0);socialDeliver(from,m.cargo);m.status='returned';socialLog(s,time,'Partnerflotte zurückgekehrt','Schiffe und Ladung auf '+from.name+' eingetroffen.');return;}
 const to=socialPlanet(w,m.host,m.to),host=socialState(w,m.host);
 if(m.kind==='support'){if(!socialGrant(w,m.host,m.owner,'defense')){m.status='returning';m.due=time+m.duration;return;}m.status='stationed';socialLog(s,time,'Verteidigungsflotte stationiert',to.name+' wird von deinen Schiffen unterstützt.');socialLog(host,time,'Verstärkung eingetroffen',s.name+' unterstützt '+to.name+'.');return;}
 if(m.kind==='delivery'&&!socialGrant(w,m.host,m.owner,'delivery')){m.status='returning';m.due=time+m.duration;return;}
 socialDeliver(to,m.cargo);m.cargo=m.kind==='trade'?{...m.payment}:socialZero();m.payment=socialZero();m.status='returning';m.due=time+m.duration;socialLog(host,time,'Partnerlieferung angekommen',s.name+' hat Ressourcen auf '+to.name+' abgeladen.');
}
export function socialDefense(w,host,id,time){return w.socialMissions.filter(m=>m.host===host&&m.to===id&&m.kind==='support'&&m.status==='stationed').map(m=>({id:m.id,owner:m.owner,commander:socialState(w,m.owner).name,fleet:m.fleet,tech:socialState(w,m.owner).tech,hulls:m.hulls,shieldFactor:m.shieldUntil?Math.max(0,Math.min(1,1-(m.shieldUntil-time)/300000)):1}));}
export function socialProjection(w,uid){
 if(w.socialVersion!==1)return null;
 const name=id=>socialState(w,id).name;
 const planets=id=>w.planets.filter(p=>p.owner_id===id&&!p.reserved).map(p=>({id:p.id,name:p.meta.name,system:p.meta.system,x:p.meta.x,y:p.meta.y,slot:p.meta.slot}));
 return {players:w.saves.filter(r=>r.user_id!==uid).map(r=>({id:r.user_id,name:r.state.name})),partners:w.partners.filter(p=>[p.from,p.to].includes(uid)&&p.status!=='ended').map(p=>{const friend=p.from===uid?p.to:p.from;return {id:p.id,friend,name:name(friend),incoming:p.to===uid,status:p.status,granted:p.grants[uid]||{},received:p.grants[friend]||{},planets:p.status==='accepted'?planets(friend):[]};}),missions:w.socialMissions.filter(m=>[m.owner,m.host].includes(uid)&&!['returned','lost'].includes(m.status)).map(m=>({...m,own:m.owner===uid,commander:name(m.owner),hostName:name(m.host)})),trades:w.trades.filter(t=>[t.owner,t.buyer].includes(uid)&&t.status==='offered'&&t.expires>w.now).map(t=>({...t,own:t.owner===uid,name:name(t.owner===uid?t.buyer:t.owner)}))};
}
