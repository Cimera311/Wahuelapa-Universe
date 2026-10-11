import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,capacity,fleetCapacity} from '../src/engine.js';
import {TARGETS,vector,RES} from '../src/config.js';
import {validateSave} from '../src/storage.js';
const NOW=1700000000000;
const order=metal=>vector([metal,0,0]);
function fixture(){const s=newGame('Cargo',NOW),p=s.planets[0];for(const k of RES)p.buildings[k]=0;p.resources=vector([3000,3000,3000]);p.ships.transport=3;p.ships.karawane=2;s.tech.logistics=2;s.tech.ramjet=2;s.tech.military=4;const q=structuredClone(p);Object.assign(q,TARGETS[0]);q.ships=Object.fromEntries(Object.entries(p.ships).map(([k])=>[k,0]));q.resources=vector([3000,3000,3000]);q.depot=order(0);s.planets.push(q);return s;}
function metal(s){return s.planets.reduce((a,p)=>a+p.resources.metal+p.depot.metal,0)+s.missions.reduce((a,m)=>a+m.cargo.metal,0);}
const next=s=>advance(s,s.missions.find(m=>!m.paused&&!m.awaitingUnload).due);
test('partial deliveries return leftover cargo; full home keeps ships bound until spending frees room',()=>{
 let s=fixture();s.planets[1].resources.metal=3950;const total=metal(s);s=act(s,{type:'deliver',fleet:{transport:1},to:'ferrum',order:order(200)},s.time);next(s);assert.equal(s.planets[1].depot.metal,0);assert.equal(s.missions[0].cargo.metal,150);s.planets[0].resources.metal=4000;next(s);assert.equal(s.missions[0].awaitingUnload,'home');assert.equal(s.planets[0].ships.transport,2);assert.equal(s.planets[0].depot.metal,0);validateSave(s);
 const before=metal(s);advance(s,s.time+86400000);assert.equal(metal(s),before);assert.equal(s.missions.length,1);s=act(s,{type:'build',key:'metal'},s.time);assert.equal(s.missions[0].cargo.metal,70);assert.equal(s.planets[0].resources.metal,4000);assert.equal(s.planets[0].ships.transport,2);s.planets[0].resources.metal-=70;advance(s,s.time);assert.equal(s.missions.length,0);assert.equal(s.planets[0].ships.transport,3);validateSave(s);assert.ok(total>0);
});
test('routes carry overflow forward and cannot refill already occupied cargo space',()=>{
 let s=fixture();s.planets[1].resources.metal=4000;const total=metal(s);const stops=[{planet:'home',load:order('max'),unload:order(0)},{planet:'ferrum',load:order('max'),unload:order('max')}];s=act(s,{type:'route',name:'Carry',fleet:{transport:1},stops,repeat:true},s.time);const cap=fleetCapacity(s,{transport:1});assert.equal(s.missions[0].cargo.metal,cap);next(s);assert.equal(s.missions[0].cargo.metal,cap);assert.equal(s.planets[1].depot.metal,0);assert.equal(metal(s),total);next(s);assert.equal(s.missions[0].cargo.metal,cap);assert.equal(metal(s),total);validateSave(s);
});
test('ending a route with a full home waits safely and warehouse completion unloads it offline',()=>{
 let s=fixture();s.planets[1].resources.metal=4000;const stops=[{planet:'home',load:order(500),unload:order(0)},{planet:'ferrum',load:order(0),unload:order('max')}];s=act(s,{type:'route',name:'Once',fleet:{transport:1},stops,repeat:false},s.time);next(s);s.planets[0].resources.metal=4000;s=act(s,{type:'build',key:'warehouse'},s.time);s.planets[0].resources.metal=4000;s.planets[0].build.end=s.missions[0].due+10000;const end=s.planets[0].build.end;advance(s,s.missions[0].due);assert.equal(s.missions[0].awaitingUnload,'home');const direct=structuredClone(s),stepped=structuredClone(s);advance(direct,end+100000);advance(stepped,end);advance(stepped,end+100000);assert.deepEqual(direct,stepped);assert.equal(direct.missions.length,0);assert.equal(direct.planets[0].ships.transport,3);assert.equal(direct.planets[0].resources.metal,4500);assert.equal(direct.planets[0].depot.metal,0);validateSave(direct);
});
test('stationing and collection hold cargo in the assigned ships until destination space is free',()=>{
 for(const type of ['station','collect']){let s=fixture();if(type==='station')s.planets[1].resources.metal=4000;s=act(s,{type,fleet:{transport:1},to:'ferrum',order:order(250)},s.time);next(s);if(type==='collect'){s.planets[0].resources.metal=4000;next(s);}const id=type==='station'?'ferrum':'home',p=s.planets.find(p=>p.id===id);assert.equal(s.missions[0].awaitingUnload,id);assert.equal(s.missions[0].cargo.metal,250);assert.equal(p.depot.metal,0);validateSave(s);p.resources.metal-=250;advance(s,s.time);assert.equal(s.missions.length,0);assert.equal(p.resources.metal,4000);validateSave(s);}
});
test('a paused loaded route cannot be shrunk below its remaining cargo capacity',()=>{
 let s=fixture();s.planets[1].resources.metal=4000;const stops=[{planet:'home',load:order(2500),unload:order(0)},{planet:'ferrum',load:order(0),unload:order('max')}];s=act(s,{type:'route',name:'Loaded',fleet:{karawane:1},stops,repeat:true},s.time);s=act(s,{type:'pause-route',id:s.missions[0].id},s.time);next(s);s.planets[0].resources.metal=4000;next(s);assert.equal(s.missions[0].paused,true);assert.equal(s.missions[0].cargo.metal,2500);validateSave(s);const before=structuredClone(s);assert.throws(()=>act(s,{type:'edit-route',id:s.missions[0].id,name:'Small',fleet:{transport:1},stops,repeat:true},s.time),/Restladung/);assert.deepEqual(s,before);
});
test('legacy depot balances remain conserved and are settled before accepting new cargo',()=>{
 let s=fixture();s.planets[1].resources.metal=3900;s.planets[1].depot.metal=100;s=act(s,{type:'deliver',fleet:{transport:1},to:'ferrum',order:order(200)},s.time);next(s);assert.equal(s.planets[1].resources.metal,4000);assert.equal(s.planets[1].depot.metal,0);assert.equal(s.missions[0].cargo.metal,200);validateSave(s);
});

test('dashboard bundle also retains partial cargo and validates a waiting fleet',async()=>{
 const {readFileSync}=await import('node:fs');const code=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');
 const bundled=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+code+'\nexport {unloadCargo,validateSave};').toString('base64'));
 const s=fixture(),p=s.planets[1],cargo=order(200);p.resources.metal=3950;assert.equal(bundled.unloadCargo(p,cargo).metal,50);assert.equal(cargo.metal,150);assert.equal(p.depot.metal,0);
 let live=act(fixture(),{type:'station',fleet:{transport:1},to:'ferrum',order:order(250)},NOW);live.planets[1].resources.metal=4000;next(live);assert.equal(bundled.validateSave(live).missions[0].awaitingUnload,'ferrum');
});

test('paused route unloads newly freed warehouse room without freeing or relaunching its ships',()=>{
 let s=fixture();s.planets[1].resources.metal=4000;const stops=[{planet:'home',load:order(500),unload:order(0)},{planet:'ferrum',load:order(0),unload:order('max')}];s=act(s,{type:'route',fleet:{transport:1},stops,repeat:true},s.time);s=act(s,{type:'pause-route',id:s.missions[0].id},s.time);next(s);s.planets[0].resources.metal=4000;next(s);assert.equal(s.missions[0].paused,true);s.planets[0].resources.metal-=500;advance(s,s.time);assert.equal(s.missions[0].cargo.metal,0);assert.equal(s.missions[0].paused,true);assert.equal(s.planets[0].ships.transport,2);validateSave(s);
});
