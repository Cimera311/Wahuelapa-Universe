import {RES,BUILDINGS,TECHS,SHIPS,TARGETS,isFreighter} from './config.js';
export const SAVE_KEY='imperium-v1';
const isNum=(x,max=1e12)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
const integer=(x,max)=>isNum(x,max)&&Number.isInteger(x);
const text=(x,max=100)=>typeof x==='string'&&x.length<=max;
function check(ok){if(!ok)throw Error('Ungültiger oder inkompatibler Spielstand.');}
export function validateSave(input){
 check(input&&typeof input==='object'&&input.version===1);
 const s=structuredClone(input);
 check(text(s.name,30)&&s.name.trim().length>0&&isNum(s.time,8.64e15)&&isNum(s.created,8.64e15)&&s.created<=s.time&&integer(s.seq,1e9));
 check(Array.isArray(s.planets)&&s.planets.length>=1&&s.planets.length<=7);
 if(s.galaxy)check(isNum(s.galaxy.x,1200)&&isNum(s.galaxy.y,1200));
 if(s.tech)for(const k of ['military','ramjet','impulse','hyperspace'])if(!Object.hasOwn(s.tech,k))s.tech[k]=0;
 check(s.tech&&Object.entries(TECHS).every(([k,t])=>integer(s.tech[k],t.max)));
 const ids=s.planets.map(p=>p.id);check(ids[0]==='home'&&new Set(ids).size===ids.length&&ids.every(id=>id==='home'||TARGETS.some(t=>t.id===id)||/^g-[a-z]+-p(?:[1-9]|10)$/.test(id))&&ids.includes(s.active));
 const cargo=c=>c&&RES.every(k=>isNum(c[k]));
 const job=(j,defs)=>j===null||(j&&Object.hasOwn(defs,j.key)&&isNum(j.start,8.64e15)&&isNum(j.end,8.64e15)&&j.start<=s.time&&j.end>=s.time&&j.end>j.start);
 for(const p of s.planets){if(p.id.startsWith('g-'))check(typeof p.system==='string'&&/^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id)&&isNum(p.x,1200)&&isNum(p.y,1200)&&integer(p.slot,10)&&p.slot>0);check(text(p.name,40)&&text(p.coord,30)&&text(p.kind,40)&&/^#[0-9a-f]{6}$/i.test(p.color)&&typeof p.ocean==='boolean'&&isNum(p.energy,10)&&p.energy>0&&isNum(p.distance,100));check(Array.isArray(p.mult)&&p.mult.length===3&&p.mult.every(x=>isNum(x,10)));p.reserves??={metal:0,crystal:0,fuel:0};check(cargo(p.reserves)&&cargo(p.resources)&&cargo(p.depot));check(p.buildings&&Object.keys(BUILDINGS).every(k=>integer(p.buildings[k],30)));if(p.ships)for(const k of Object.keys(SHIPS))if(!['probe','transport','colony'].includes(k)&&!Object.hasOwn(p.ships,k))p.ships[k]=0;check(p.ships&&Object.keys(SHIPS).every(k=>integer(p.ships[k],1e6)));check(job(p.build,BUILDINGS)&&(!p.build||p.build.level===p.buildings[p.build.key]+1));check(job(p.shipjob,SHIPS)&&(!p.shipjob||integer(p.shipjob.count,50)&&p.shipjob.count>0));}
 check(job(s.research,TECHS)&&(!s.research||s.research.level===s.tech[s.research.key]+1&&ids.includes(s.research.planet)));
 check(Array.isArray(s.discovered)&&s.discovered.length<=3&&new Set(s.discovered).size===s.discovered.length&&s.discovered.every(id=>TARGETS.some(t=>t.id===id)));
 check(Array.isArray(s.missions)&&s.missions.length<=100);
 const eventIds=[];
 const order=o=>o&&RES.every(k=>o[k]==='max'||integer(o[k],1e12));
 for(const m of s.missions){
  check(integer(m.id,s.seq)&&m.id>0&&ids.includes(m.from)&&['probe','colony','transport','deliver','collect','station','route'].includes(m.type)&&Object.hasOwn(SHIPS,m.ship)&&integer(m.count,100)&&m.count>0&&cargo(m.cargo)&&['outbound','return'].includes(m.phase)&&isNum(m.start,8.64e15)&&m.start<=s.time&&isNum(m.due,8.64e15)&&m.due>=s.time&&isNum(m.duration,86400000)&&m.duration>0);
  if(['probe','colony'].includes(m.type)){check(m.ship===m.type&&TARGETS.some(t=>t.id===m.to));check(m.type!=='colony'||m.phase==='outbound'&&m.count===1&&!ids.includes(m.to));}
  else {check(ids.includes(m.to)&&m.from!==m.to);check(m.type==='station'||isFreighter(m.ship));if(m.type!=='transport'){const total=RES.reduce((a,k)=>a+m.cargo[k],0);check(total<=Math.floor(SHIPS[m.ship].cargo*(1+s.tech.logistics*.15))*m.count);}}
  if(m.type==='collect')check(order(m.order));
  if(m.type==='station')check(m.phase==='outbound');
  if(m.type==='route'){
   check(m.phase==='outbound'&&text(m.name,40)&&typeof m.repeat==='boolean'&&typeof m.stopping==='boolean'&&integer(m.rounds,1e12)&&Array.isArray(m.stops)&&m.stops.length>=2&&m.stops.length<=12&&ids.includes(m.home)&&m.stops[0].planet===m.home&&integer(m.index,m.stops.length-1));
   check(m.stops.every((stop,i)=>ids.includes(stop.planet)&&stop.planet!==m.stops[(i+1)%m.stops.length].planet&&order(stop.load)&&order(stop.unload))&&m.to===m.stops[m.index].planet&&m.from===m.stops[(m.index+m.stops.length-1)%m.stops.length].planet);
  }
  eventIds.push(m.id);
 }
 check(new Set(eventIds).size===eventIds.length);
 check(Array.isArray(s.reports)&&s.reports.length<=60&&s.reports.every(r=>integer(r.id,s.seq)&&isNum(r.time,8.64e15)&&r.time<=s.time&&text(r.title,100)&&text(r.body,1000)));
 return s;
}
export function parseSave(raw){if(typeof raw!=='string'||raw.length>2000000)throw Error('Die Spielstanddatei ist zu groß.');try{return validateSave(JSON.parse(raw));}catch(e){throw Error(e.message==='Die Spielstanddatei ist zu groß.'?e.message:'Die Datei enthält keinen gültigen WaHueLaPa-Universe-Spielstand (Version 1).');}}
export function saveGame(s,store=globalThis.localStorage,key=SAVE_KEY){const raw=JSON.stringify(s);const old=store.getItem(key);if(old)store.setItem(key+'-backup',old);store.setItem(key,raw);}
export function loadGame(store=globalThis.localStorage,saveKey=SAVE_KEY){let damaged=false;for(const key of [saveKey,saveKey+'-backup']){const raw=store.getItem(key);if(raw){try{return {state:parseSave(raw),recovered:damaged};}catch{damaged=true;}}}if(damaged)throw Error('Spielstand und Sicherung sind beschädigt. Exportiere vorhandene Dateien oder starte bewusst neu.');return {state:null,recovered:false};}
