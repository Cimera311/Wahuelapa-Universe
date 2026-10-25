import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,isFreighter} from './config.js';
import {SHIP_QUEUE_LEGACY_LIMIT} from './engine.js';
export const SAVE_KEY='imperium-v1';
const isNum=(x,max=1e12)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
const integer=(x,max)=>isNum(x,max)&&Number.isInteger(x);
const text=(x,max=100)=>typeof x==='string'&&x.length<=max;
export class SaveValidationError extends Error{
 constructor(rule){super('Ungültiger oder inkompatibler Spielstand.');this.name='SaveValidationError';this.rule=rule;}
}
function check(rule,ok){if(!ok)throw new SaveValidationError(rule);}
// Rule IDs are stable diagnostics: retain existing IDs when adding or moving checks.
// REALM-CANDIDATE[saveCompatibility]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function validateSave(input){
 check('SV001',input&&typeof input==='object'&&input.version===1);
 const s=structuredClone(input);
 if(s.systemName!==undefined)check('SV002',text(s.systemName,30)&&s.systemName.trim().length>0);
 check('SV003',text(s.name,30)&&s.name.trim().length>0&&isNum(s.time,8.64e15)&&isNum(s.created,8.64e15)&&s.created<=s.time&&integer(s.seq,1e9));
 check('SV004',Array.isArray(s.planets)&&s.planets.length>=1&&s.planets.length<=9);
 if(s.galaxy)check('SV005',isNum(s.galaxy.x,1200)&&isNum(s.galaxy.y,1200));
 if(s.tech)for(const k of Object.keys(TECHS))if(!Object.hasOwn(s.tech,k))s.tech[k]=0;
 check('SV006',s.tech&&Object.entries(TECHS).every(([k,t])=>integer(s.tech[k],t.max)));
 const ids=s.planets.map(p=>p.id);check('SV007',ids[0]==='home'&&new Set(ids).size===ids.length&&ids.every(id=>id==='home'||TARGETS.some(t=>t.id===id)||/^g-[a-z]+-p(?:[1-9]|10)$/.test(id))&&ids.includes(s.active));
 const cargo=c=>c&&RES.every(k=>isNum(c[k]));
 const job=(j,defs)=>j===null||(j&&Object.hasOwn(defs,j.key)&&isNum(j.start,8.64e15)&&isNum(j.end,8.64e15)&&j.start<=s.time&&j.end>=s.time&&j.end>j.start);
 for(const p of s.planets){if(p.id.startsWith('g-'))check('SV008',typeof p.system==='string'&&/^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id)&&isNum(p.x,1200)&&isNum(p.y,1200)&&integer(p.slot,10)&&p.slot>0);check('SV009',text(p.name,40)&&text(p.coord,30)&&text(p.kind,40)&&/^#[0-9a-f]{6}$/i.test(p.color)&&typeof p.ocean==='boolean'&&isNum(p.energy,10)&&p.energy>0&&isNum(p.distance,100));check('SV010',Array.isArray(p.mult)&&p.mult.length===3&&p.mult.every(x=>isNum(x,10)));p.reserves??={metal:0,crystal:0,fuel:0};check('SV011',cargo(p.reserves)&&cargo(p.resources)&&cargo(p.depot));for(const k of ['orbital','bunker','repairDock'])if(p.buildings&&!Object.hasOwn(p.buildings,k))p.buildings[k]=0;check('SV012',p.buildings&&Object.keys(BUILDINGS).every(k=>integer(p.buildings[k],30)));if(p.ships)for(const k of Object.keys(SHIPS))if(!['probe','transport','colony'].includes(k)&&!Object.hasOwn(p.ships,k))p.ships[k]=0;check('SV013',p.ships&&Object.keys(SHIPS).every(k=>integer(p.ships[k],Number.MAX_SAFE_INTEGER)));check('SV014',job(p.build,BUILDINGS)&&(!p.build||(p.build.kind==='demolish'?p.build.level===p.buildings[p.build.key]-1:p.build.kind===undefined&&p.build.level===p.buildings[p.build.key]+1)));
  if(p.build){const j=p.build;
   if(j.kind==='demolish')check('SV015',j.refund&&RES.every(k=>integer(j.refund[k],1e12))&&integer(j.originalMs,8.64e15)&&j.originalMs>0);
   else if(j.paid!==undefined||j.originalMs!==undefined)check('SV016',j.paid&&RES.every(k=>integer(j.paid[k],1e12))&&integer(j.originalMs,8.64e15)&&j.originalMs>0);
  }
  p.buildHistory??={};
  check('SV017',p.buildHistory&&typeof p.buildHistory==='object'&&!Array.isArray(p.buildHistory)&&Object.keys(p.buildHistory).every(k=>Object.hasOwn(BUILDINGS,k)));
  for(const [key,levels] of Object.entries(p.buildHistory)){
   check('SV018',levels&&typeof levels==='object'&&!Array.isArray(levels)&&Object.keys(levels).length<=30);
   for(const [lvl,info] of Object.entries(levels))check('SV019',/^(?:[1-9]|[12][0-9]|30)$/.test(lvl)&&Number(lvl)<=p.buildings[key]&&info&&typeof info==='object'&&info.cost&&RES.every(k=>integer(info.cost[k],1e12))&&integer(info.ms,8.64e15)&&info.ms>0);
  }check('SV020',job(p.shipjob,SHIPS)&&(!p.shipjob||integer(p.shipjob.count,Number.MAX_SAFE_INTEGER)&&p.shipjob.count>0));p.orbitaljob??=null;p.orbitalqueue??=[];check('SV021',job(p.orbitaljob,SHIPS)&&(!p.orbitaljob||SHIPS[p.orbitaljob.key].category==='defense'));check('SV022',Array.isArray(p.orbitalqueue)&&p.orbitalqueue.length+(p.orbitaljob?1:0)<=SHIP_QUEUE_LEGACY_LIMIT&&(!p.orbitalqueue.length||p.orbitaljob));}
 for(const p of s.planets){
  p.disabledDefenses??={};check('SV023',p.disabledDefenses&&typeof p.disabledDefenses==='object'&&!Array.isArray(p.disabledDefenses)&&Object.entries(p.disabledDefenses).every(([k,n])=>SHIPS[k]?.category==='defense'&&integer(n,Number.MAX_SAFE_INTEGER)));
  p.repairQueue??=[];check('SV024',Array.isArray(p.repairQueue)&&p.repairQueue.length<=20&&(!p.repairQueue.length||p.buildings.repairDock>=1));
  for(const j of p.repairQueue){check('SV025',j.restore===undefined||j.restore===true&&SHIPS[j.key]?.category==='defense');check('SV026',integer(j.id,s.seq)&&j.id>0&&Object.hasOwn(SHIPS,j.key)&&isNum(j.start,s.time)&&integer(j.count,100000)&&j.count>0&&integer(j.completed,j.count)&&integer(j.lost,j.count)&&isNum(j.factor,1)&&j.factor>0&&Array.isArray(j.entries)&&j.entries.length>0&&j.entries.length+j.completed+j.lost===j.count);
   for(const e of j.entries)check('SV027',isNum(e.hp,1)&&(j.restore||e.hp>0)&&isNum(e.initialHp,1)&&(j.restore||e.initialHp>0)&&e.initialHp<=e.hp&&isNum(e.workRemaining,8.64e15)&&e.credit&&RES.every(k=>isNum(e.credit[k]))&&e.credit.fuel===0);
  }
 }
 const shipIds=[];
 for(const p of s.planets){
  p.shipqueue??=[];check('SV028',Array.isArray(p.shipqueue)&&p.shipqueue.length+(p.shipjob?1:0)<=SHIP_QUEUE_LEGACY_LIMIT&&(!p.shipqueue.length||!!p.shipjob));
  for(const j of [p.shipjob,...p.shipqueue,p.orbitaljob,...p.orbitalqueue].filter(Boolean)){
   check('SV029',job(j,SHIPS)&&integer(j.count,Number.MAX_SAFE_INTEGER)&&j.count>0);if(j===p.orbitaljob||p.orbitalqueue.includes(j))check('SV030',SHIPS[j.key].category==='defense');
   const waiting=j!==p.shipjob&&j!==p.orbitaljob;
   if(j.workTotal!==undefined||j.workRemaining!==undefined){check('SV031',isNum(j.workTotal,8.64e15)&&j.workTotal>0&&isNum(j.workRemaining,j.workTotal)&&typeof j.paused==='boolean');if(j.orderEnd!==undefined)check('SV032',isNum(j.orderEnd,8.64e15)&&j.orderEnd>j.start);}
   if(waiting)check('SV033',j.workRemaining===j.workTotal&&j.payment!==undefined&&j.id!==undefined);
   if(j.id!==undefined){check('SV034',integer(j.id,s.seq)&&j.id>0);shipIds.push(j.id);}
   if(j.payment!==undefined)check('SV035',j.payment&&cargo(j.payment.resources)&&cargo(j.payment.salvage)&&RES.every((k,i)=>Number.isSafeInteger(j.payment.resources[k])&&Number.isSafeInteger(j.payment.salvage[k])&&(j.payment.resources[k]+j.payment.salvage[k]===SHIPS[j.key].cost[i]*j.count||({'flak':[160,80,20],'laser':[450,300,70],'rail':[1400,1000,280],'plasma':[4000,2800,900]}[j.key]?.[i]*j.count===j.payment.resources[k]+j.payment.salvage[k]&&j!==p.orbitaljob&&!p.orbitalqueue.includes(j))))&&j.payment.salvage.fuel===0&&(SHIPS[j.key].category==='defense'||RES.every(k=>j.payment.salvage[k]===0)));
  }
 }
 check('SV036',new Set(shipIds).size===shipIds.length);
 check('SV037',job(s.research,TECHS)&&(!s.research||s.research.level===s.tech[s.research.key]+1&&ids.includes(s.research.planet)));
 check('SV038',Array.isArray(s.discovered)&&s.discovered.length<=3&&new Set(s.discovered).size===s.discovered.length&&s.discovered.every(id=>TARGETS.some(t=>t.id===id)));
 if(s.pveFleets!==undefined)check('SV039',Array.isArray(s.pveFleets)&&s.pveFleets.length<=50&&s.pveFleets.every(m=>m&&m.fleet&&typeof m.fleet==='object'&&!Array.isArray(m.fleet)&&Object.entries(m.fleet).every(([k,n])=>SHIPS[k]?.speed>0&&integer(n,Number.MAX_SAFE_INTEGER)&&n>0)));
 check('SV040',Array.isArray(s.missions)&&s.missions.length<=100);
 const fleetOK=(f,military=false)=>f&&typeof f==='object'&&!Array.isArray(f)&&Object.keys(f).length>0&&Object.entries(f).every(([k,n])=>(isFreighter(k)||military&&['military','civil'].includes(SHIPS[k]?.category))&&integer(n,Number.MAX_SAFE_INTEGER)&&n>0);
 const repairIds=s.planets.flatMap(p=>p.repairQueue.map(j=>j.id));
 const eventIds=[...shipIds,...repairIds];
 const order=o=>o&&RES.every(k=>o[k]==='max'||integer(o[k],1e12));
 for(const m of s.missions){
  check('SV041',integer(m.id,s.seq)&&m.id>0&&ids.includes(m.from)&&['probe','colony','transport','deliver','collect','salvage','station','route'].includes(m.type)&&Object.hasOwn(SHIPS,m.ship)&&integer(m.count,Number.MAX_SAFE_INTEGER)&&m.count>0&&cargo(m.cargo)&&['outbound','return'].includes(m.phase)&&isNum(m.start,8.64e15)&&m.start<=s.time&&isNum(m.due,8.64e15)&&m.due>=s.time&&isNum(m.duration,86400000)&&m.duration>0);
  if(['probe','colony'].includes(m.type)){check('SV042',m.ship===m.type&&TARGETS.some(t=>t.id===m.to));check('SV043',m.type!=='colony'||m.phase==='outbound'&&m.count===1&&!ids.includes(m.to));}
  else {check('SV044',ids.includes(m.to)&&m.from!==m.to);check('SV045',m.type==='station'||isFreighter(m.ship));if(m.type!=='transport'){const total=RES.reduce((a,k)=>a+m.cargo[k],0);const max=m.fleet?Object.entries(m.fleet).reduce((a,[k,n])=>a+Math.floor((SHIPS[k]?.cargo||0)*(1+s.tech.logistics*.15))*n,0):Math.floor(SHIPS[m.ship].cargo*(1+s.tech.logistics*.15))*m.count;check('SV046',total<=max);}}
  if(m.awaitingUnload!==undefined)check('SV047',ids.includes(m.awaitingUnload)&&m.awaitingUnload===(m.type==='station'?m.to:m.type==='route'?m.home:m.from)&&!['probe','colony'].includes(m.type)&&RES.some(k=>m.cargo[k]>0)&&(m.type==='station'||m.type==='route'&&m.index===0||m.phase==='return'));
  if(m.finishTitle!==undefined)check('SV048',text(m.finishTitle,80));
  if(m.type==='collect')check('SV049',order(m.order));
  if(m.type==='salvage')check('SV050',!!s.planets.find(p=>p.id===m.to)?.system&&(!m.fleet||fleetOK(m.fleet))&&(m.phase!=='outbound'||RES.every(k=>m.cargo[k]===0)));
  if(m.type==='station')check('SV051',m.phase==='outbound');
  if(m.fleet)check('SV052',['transport','route','deliver','collect','salvage','station'].includes(m.type)&&fleetOK(m.fleet,m.type==='station')&&m.fleet[m.ship]===m.count);
  if(m.pending)check('SV053',m.type==='route'&&fleetOK(m.pending.fleet)&&text(m.pending.name,40)&&m.pending.name.trim().length>0&&typeof m.pending.repeat==='boolean'&&Array.isArray(m.pending.stops)&&m.pending.stops.length>=2&&m.pending.stops.length<=12&&m.pending.stops[0].planet===m.home&&m.pending.stops.every((stop,i)=>ids.includes(stop.planet)&&stop.planet!==m.pending.stops[(i+1)%m.pending.stops.length].planet&&order(stop.load)&&order(stop.unload)));
  if(m.paused!==undefined)check('SV054',m.type==='route'&&typeof m.paused==='boolean'&&(!m.paused||m.index===0));
  if(m.pauseRequested!==undefined)check('SV055',m.type==='route'&&typeof m.pauseRequested==='boolean');
  if(m.type==='route'){
   check('SV056',m.phase==='outbound'&&text(m.name,40)&&typeof m.repeat==='boolean'&&typeof m.stopping==='boolean'&&integer(m.rounds,1e12)&&Array.isArray(m.stops)&&m.stops.length>=2&&m.stops.length<=12&&ids.includes(m.home)&&m.stops[0].planet===m.home&&integer(m.index,m.stops.length-1));
   check('SV057',m.stops.every((stop,i)=>ids.includes(stop.planet)&&stop.planet!==m.stops[(i+1)%m.stops.length].planet&&order(stop.load)&&order(stop.unload))&&m.to===m.stops[m.index].planet&&m.from===m.stops[(m.index+m.stops.length-1)%m.stops.length].planet);
  }
  if(m.stats!==undefined){
   const z=m.stats,amounts=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===RES.length&&RES.every(k=>isNum(v[k],Number.MAX_SAFE_INTEGER));
   check('SV058',m.type==='route'&&z&&typeof z==='object'&&!Array.isArray(z)&&Object.keys(z).length===7&&isNum(z.since,s.time)&&integer(z.roundsAtStart,m.rounds)&&integer(z.stops,Number.MAX_SAFE_INTEGER)&&amounts(z.loaded)&&amounts(z.delivered)&&integer(z.fuelPaid,Number.MAX_SAFE_INTEGER));
   if(z.last!==null){const a=z.last;check('SV059',a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).length===5&&isNum(a.at,s.time)&&a.at>=z.since&&ids.includes(a.planet)&&['started','stop','round','unload','resumed'].includes(a.kind)&&amounts(a.loaded)&&amounts(a.delivered));}
  }
  eventIds.push(m.id);
 }
 check('SV060',new Set(eventIds).size===eventIds.length);
 check('SV061',Array.isArray(s.reports)&&s.reports.length<=60&&s.reports.every(r=>integer(r.id,s.seq)&&isNum(r.time,8.64e15)&&r.time<=s.time&&text(r.title,100)&&text(r.body,1000)));
 const hullOK=(hulls,fleet)=>hulls===undefined||(hulls&&typeof hulls==='object'&&!Array.isArray(hulls)&&Object.entries(hulls).every(([k,hp])=>Object.hasOwn(SHIPS,k)&&Array.isArray(hp)&&hp.length<=(fleet[k]||0)&&hp.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<1)));
 for(const p of s.planets)check('SV062',hullOK(p.hulls,p.ships));for(const m of s.missions)check('SV063',hullOK(m.hulls,m.fleet||{[m.ship]:m.count}));
 return s;
}
export function parseSave(raw){if(typeof raw!=='string'||raw.length>2000000)throw Error('Die Spielstanddatei ist zu groß.');try{return validateSave(JSON.parse(raw));}catch(e){throw Error(e.message==='Die Spielstanddatei ist zu groß.'?e.message:'Die Datei enthält keinen gültigen WaHueLaPa-Universe-Spielstand (Version 1).');}}
export function saveGame(s,store=globalThis.localStorage,key=SAVE_KEY){const raw=JSON.stringify(s);const old=store.getItem(key);if(old)store.setItem(key+'-backup',old);store.setItem(key,raw);}
export function loadGame(store=globalThis.localStorage,saveKey=SAVE_KEY){let damaged=false;for(const key of [saveKey,saveKey+'-backup']){const raw=store.getItem(key);if(raw){try{return {state:parseSave(raw),recovered:damaged};}catch{damaged=true;}}}if(damaged)throw Error('Spielstand und Sicherung sind beschädigt. Exportiere vorhandene Dateien oder starte bewusst neu.');return {state:null,recovered:false};}
