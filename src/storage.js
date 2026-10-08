import {RES,BUILDINGS,TECHS,SHIPS,TARGETS} from './config.js';
export const SAVE_KEY='imperium-v1';
const isNum=(x,max=1e12)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
const integer=(x,max)=>isNum(x,max)&&Number.isInteger(x);
const text=(x,max=100)=>typeof x==='string'&&x.length<=max;
function check(ok){if(!ok)throw Error('Ungültiger oder inkompatibler Spielstand.');}
export function validateSave(input){
 check(input&&typeof input==='object'&&input.version===1);
 const s=structuredClone(input);
 check(text(s.name,30)&&s.name.trim().length>0&&isNum(s.time,8.64e15)&&isNum(s.created,8.64e15)&&s.created<=s.time&&integer(s.seq,1e9));
 check(Array.isArray(s.planets)&&s.planets.length>=1&&s.planets.length<=3);
 check(s.tech&&Object.entries(TECHS).every(([k,t])=>integer(s.tech[k],t.max)));
 const ids=s.planets.map(p=>p.id);check(ids[0]==='home'&&new Set(ids).size===ids.length&&ids.every(id=>id==='home'||TARGETS.some(t=>t.id===id))&&ids.includes(s.active));
 const cargo=c=>c&&RES.every(k=>isNum(c[k]));
 const job=(j,defs)=>j===null||(j&&Object.hasOwn(defs,j.key)&&isNum(j.start,8.64e15)&&isNum(j.end,8.64e15)&&j.start<=s.time&&j.end>=s.time&&j.end>j.start);
 for(const p of s.planets){check(text(p.name,40)&&text(p.coord,30)&&text(p.kind,40)&&/^#[0-9a-f]{6}$/i.test(p.color)&&typeof p.ocean==='boolean'&&isNum(p.energy,10)&&p.energy>0&&isNum(p.distance,100));check(Array.isArray(p.mult)&&p.mult.length===3&&p.mult.every(x=>isNum(x,10)));check(cargo(p.resources)&&cargo(p.depot));check(p.buildings&&Object.keys(BUILDINGS).every(k=>integer(p.buildings[k],30)));check(p.ships&&Object.keys(SHIPS).every(k=>integer(p.ships[k],1e6)));check(job(p.build,BUILDINGS)&&(!p.build||p.build.level===p.buildings[p.build.key]+1));check(job(p.shipjob,SHIPS)&&(!p.shipjob||integer(p.shipjob.count,50)&&p.shipjob.count>0));}
 check(job(s.research,TECHS)&&(!s.research||s.research.level===s.tech[s.research.key]+1&&ids.includes(s.research.planet)));
 check(Array.isArray(s.discovered)&&s.discovered.length<=3&&new Set(s.discovered).size===s.discovered.length&&s.discovered.every(id=>TARGETS.some(t=>t.id===id)));
 check(Array.isArray(s.missions)&&s.missions.length<=100);
 const eventIds=[];
 for(const m of s.missions){check(integer(m.id,s.seq)&&m.id>0&&ids.includes(m.from)&&['probe','colony','transport'].includes(m.type)&&m.ship===(m.type==='probe'?'probe':m.type==='colony'?'colony':'transport')&&integer(m.count,100)&&m.count>0&&cargo(m.cargo)&&['outbound','return'].includes(m.phase)&&isNum(m.start,8.64e15)&&m.start<=s.time&&isNum(m.due,8.64e15)&&m.due>=s.time&&isNum(m.duration,86400000)&&m.duration>0);check(m.type==='transport'?ids.includes(m.to)&&m.from!==m.to:TARGETS.some(t=>t.id===m.to));check(m.type!=='colony'||m.phase==='outbound'&&m.count===1&&!ids.includes(m.to));eventIds.push(m.id);}
 check(new Set(eventIds).size===eventIds.length);
 check(Array.isArray(s.reports)&&s.reports.length<=60&&s.reports.every(r=>integer(r.id,s.seq)&&isNum(r.time,8.64e15)&&r.time<=s.time&&text(r.title,100)&&text(r.body,1000)));
 return s;
}
export function parseSave(raw){if(typeof raw!=='string'||raw.length>2000000)throw Error('Die Spielstanddatei ist zu groß.');try{return validateSave(JSON.parse(raw));}catch(e){throw Error(e.message==='Die Spielstanddatei ist zu groß.'?e.message:'Die Datei enthält keinen gültigen Imperium-Spielstand (Version 1).');}}
export function saveGame(s,store=globalThis.localStorage){const raw=JSON.stringify(s);const old=store.getItem(SAVE_KEY);if(old)store.setItem(SAVE_KEY+'-backup',old);store.setItem(SAVE_KEY,raw);}
export function loadGame(store=globalThis.localStorage){let damaged=false;for(const key of [SAVE_KEY,SAVE_KEY+'-backup']){const raw=store.getItem(key);if(raw){try{return {state:parseSave(raw),recovered:damaged};}catch{damaged=true;}}}if(damaged)throw Error('Spielstand und Sicherung sind beschädigt. Exportiere vorhandene Dateien oder starte bewusst neu.');return {state:null,recovered:false};}
