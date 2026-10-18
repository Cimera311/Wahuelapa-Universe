import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,act,advance,routeInfo,capacity} from '../src/engine.js';
import {parseSave,validateSave} from '../src/storage.js';
import {RES,TARGETS,vector} from '../src/config.js';

const zero=()=>vector([0,0,0]),max=()=>Object.fromEntries(RES.map(k=>[k,'max']));
const stop=(planet,load=zero(),unload=max())=>({planet,load,unload});
const stops=()=>[stop('home',vector([200,0,0])),stop('ferrum',vector([0,50,0]))];
const step=s=>advance(s,s.missions[0].due);
function fixture(){
 const s=newGame('Route',1800000000000);s.tech.colonization=1;
 s.planets.push({...structuredClone(s.planets[0]),...TARGETS[0]});
 for(const p of s.planets){for(const k of RES)p.buildings[k]=0;p.buildings.warehouse=4;p.resources=vector([1000,1000,10000]);p.depot=zero();p.ships.transport=3;}
 return s;
}
const launch=(s=fixture(),extra={})=>act(s,{type:'route',name:'Versorgung',count:1,stops:stops(),repeat:true,...extra},s.time);

test('route statistics count actual loading, unloading, visits and prepaid round fuel without success reports',()=>{
 let s=fixture(),fuel=routeInfo(s,stops(),1).fuel;s=launch(s);const start=s.time,m=s.missions[0];
 assert.deepEqual(m.stats.loaded,vector([200,0,0]));assert.deepEqual(m.stats.delivered,zero());assert.equal(m.stats.fuelPaid,fuel);assert.equal(m.stats.stops,0);
 const seq=s.seq;step(s);assert.ok(s.seq>seq);assert.deepEqual(m.stats.delivered,vector([200,0,0]));assert.deepEqual(m.stats.loaded,vector([200,50,0]));assert.equal(m.stats.last.planet,'ferrum');assert.equal(m.stats.stops,1);
 step(s);assert.equal(m.rounds,1);assert.equal(m.stats.since,start);assert.equal(m.stats.fuelPaid,fuel*2);assert.equal(m.stats.stops,2);assert.deepEqual(m.stats.delivered,vector([200,50,0]));assert.deepEqual(m.stats.loaded,vector([400,50,0]));assert.equal(m.stats.last.kind,'round');assert.deepEqual(m.stats.last.delivered,vector([0,50,0]));assert.deepEqual(m.stats.last.loaded,vector([200,0,0]));
 assert.equal(s.reports.filter(r=>['Handelsstopp','Handelsrunde abgeschlossen'].includes(r.title)).length,0);assert.deepEqual(parseSave(JSON.stringify(s)),validateSave(s));
});

test('full and partly full warehouses count only delivered cargo, never requested amounts',()=>{
 let s=fixture();s.planets[1].resources.metal=capacity(s.planets[1])-30;s=launch(s);step(s);const m=s.missions[0];
 assert.equal(m.stats.delivered.metal,30);assert.equal(m.cargo.metal,170);assert.equal(m.stats.loaded.crystal,50);
 step(s);assert.equal(m.stats.delivered.metal,200);assert.equal(m.stats.delivered.crystal,50);assert.equal(m.stats.last.delivered.metal,170);validateSave(s);
});

test('paused and ending routes count delayed unloading once and retain a final summary',()=>{
 for(const ending of [false,true]){
  let s=launch();const id=s.missions[0].id;s=act(s,{type:ending?'stop-route':'pause-route',id},s.time);step(s);s.planets[0].resources.crystal=capacity(s.planets[0]);step(s);
  let m=s.missions[0];assert.equal(m.stats.delivered.crystal,0);assert.equal(m.cargo.crystal,50);assert.ok(m.paused||m.awaitingUnload);
  s.planets[0].resources.crystal-=20;advance(s,s.time+1);m=s.missions[0];assert.equal(m.stats.delivered.crystal,20);assert.equal(m.cargo.crystal,30);assert.equal(m.stats.last.kind,'unload');
  const before=structuredClone(m.stats);advance(s,s.time+1);assert.deepEqual(m.stats,before);
  s.planets[0].resources.crystal-=30;advance(s,s.time+1);
  if(ending){assert.equal(s.missions.length,0);assert.match(s.reports.find(r=>r.title==='Handelsroute beendet').body,/geliefert M\/K\/T: 200\/50\/0/);}
  else{assert.equal(m.stats.delivered.crystal,50);assert.equal(m.stats.stops,2);validateSave(s);}
 }
});

test('legacy routes keep round totals and start counters without inventing historical cargo or fuel',()=>{
 let s=launch();step(s);const m=s.missions[0];delete m.stats;m.rounds=128;const since=s.time;
 s=validateSave(s);advance(s,s.time);const z=s.missions[0].stats;assert.equal(s.missions[0].rounds,128);assert.equal(z.roundsAtStart,128);assert.equal(z.since,since);assert.equal(z.last,null);assert.deepEqual(z.loaded,zero());assert.deepEqual(z.delivered,zero());assert.equal(z.fuelPaid,0);
 step(s);assert.equal(s.missions[0].rounds,129);assert.equal(z.delivered.crystal,50);assert.equal(z.loaded.metal,200);validateSave(s);
});

test('route edits and manual resume preserve statistics and failed requests do not count fuel',()=>{
 let s=launch();const id=s.missions[0].id;s=act(s,{type:'pause-route',id},s.time);step(s);step(s);const before=structuredClone(s.missions[0].stats);
 s=act(s,{type:'edit-route',id,name:'Neue Route',fleet:{transport:1},stops:stops(),repeat:true},s.time);assert.deepEqual(s.missions[0].stats,before);
 const fuel=s.planets[0].resources.fuel;s.planets[0].resources.fuel=0;const failed=structuredClone(s);assert.throws(()=>act(s,{type:'resume-route',id},s.time),/Treibstoff/);assert.deepEqual(s,failed);
 s.planets[0].resources.fuel=fuel;s=act(s,{type:'resume-route',id},s.time);assert.equal(s.missions[0].stats.since,before.since);assert.ok(s.missions[0].stats.fuelPaid>before.fuelPaid);assert.equal(s.missions[0].stats.last.kind,'resumed');validateSave(s);
});

test('long offline catch-up and incremental updates produce identical bounded statistics',()=>{
 let s=fixture();s.planets[0].buildings.warehouse=15;s.planets[0].resources.fuel=1000000;s=launch(s,{stops:[stop('home'),stop('ferrum')]});const start=s.time,direct=structuredClone(s),incremental=structuredClone(s);
 advance(direct,start+86400000);for(let h=1;h<=24;h++)advance(incremental,start+h*3600000);
 assert.deepEqual(direct,incremental);assert.ok(direct.missions[0].rounds>500);assert.ok(JSON.stringify(direct.missions[0].stats).length<600);assert.equal(direct.reports.length,0);validateSave(direct);
});

test('malformed statistics reject during loading while a request cannot supply its own counters',()=>{
 const s=launch();
 for(const mutate of [z=>z.loaded.metal=-1,z=>z.delivered.crystal=Infinity,z=>z.last.planet='foreign',z=>z.last.at=s.time+1,z=>z.since=s.time+1,z=>z.fuelPaid=1.5,z=>z.roundsAtStart=100,z=>z.stops=NaN,z=>z.last.history=[]]){
  const bad=structuredClone(s);mutate(bad.missions[0].stats);assert.throws(()=>validateSave(bad));
 }
 const tampered=launch(fixture(),{stats:{delivered:vector([999999,999999,999999])}});assert.deepEqual(tampered.missions[0].stats.delivered,zero());
});

test('deployable dashboard bundle advances route statistics and advertises the feature',async()=>{
 const code=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');
 const bundled=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+code+'\nexport {processWorld,projectPvP};').toString('base64'));
 const uid='00000000-0000-0000-0000-000000000001',state=launch();
 let w={now:state.missions[0].due,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};
 w=bundled.processWorld(w,uid,{type:'sync'});const z=w.saves[0].state.missions[0].stats;
 assert.equal(z.delivered.metal,200);assert.equal(z.loaded.crystal,50);assert.equal(z.last.planet,'ferrum');assert.equal(w.saves[0].state.reports.length,0);assert.equal(bundled.projectPvP(w,uid).features.routeStatistics,true);
});
