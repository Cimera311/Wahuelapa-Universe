import test from 'node:test';
import assert from 'node:assert/strict';
import {processWorld,projectPvP} from '../src/server-world.js';
import {advance,capacity,fleetCapacity,fleetLegInfo} from '../src/engine.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {vector} from '../src/config.js';
const target='g-orion-p1';
const launch=()=>({type:'command',action:{type:'salvage',planet:'home',to:target,fleet:{karawane:1}}});
function setup(){const w=fixture(),s=w.saves[1].state;s.planets[0].ships.karawane=3;s.planets[0].buildings.warehouse=4;s.planets[0].buildings.metal=s.planets[0].buildings.crystal=s.planets[0].buildings.fuel=0;s.planets[0].resources=vector([capacity(s.planets[0]),capacity(s.planets[0]),10000]);s.planets[1].ships.karawane=1;w.planets[1].debris=vector([10000,10000,0]);return w;}
const own=w=>w.saves.find(r=>r.user_id===B).state;
test('Defender launches from another own planet, pays round-trip fuel and only collects at arrival',()=>{
 const w=setup(),s=own(w),from=s.planets[0],to=s.planets[1],f=fleetLegInfo(s,from,to,{karawane:1}),original=JSON.stringify(w);
 let n=processWorld(w,B,launch());assert.equal(JSON.stringify(w),original);assert.equal(own(n).planets[0].ships.karawane,2);assert.equal(own(n).planets[0].resources.fuel,10000-2*f.fuel);assert.deepEqual(n.planets[1].debris,w.planets[1].debris);
 const cap=fleetCapacity(s,{karawane:1});n.now=T+f.ms;n=processWorld(n,B,{type:'sync'});const m=own(n).missions[0];assert.equal(m.phase,'return');assert.equal(m.cargo.metal,Math.min(cap,10000));assert.equal(m.cargo.crystal,Math.min(Math.max(0,cap-10000),10000));assert.equal(n.planets[1].debris.metal,10000-m.cargo.metal);
 n.now=T+2*f.ms;n=processWorld(n,B,{type:'sync'});assert.equal(own(n).missions[0].awaitingUnload,'home');own(n).planets[0].resources.metal=0;own(n).planets[0].resources.crystal=0;n=processWorld(n,B,{type:'sync'});assert.equal(own(n).missions.length,0);assert.equal(own(n).planets[0].ships.karawane,3);
 const finished=JSON.stringify(n.planets[1].debris);n=processWorld(n,B,{type:'sync'});assert.equal(JSON.stringify(n.planets[1].debris),finished);
});
test('Foreign fields, same-planet launches, empty fields and military fleets reject atomically',()=>{
 const w=setup(),before=JSON.stringify(w);assert.throws(()=>processWorld(w,A,launch()),/eigene/);assert.throws(()=>processWorld(w,B,{type:'command',action:{...launch().action,planet:target}}),/anderen/);
 own(w).planets[0].ships.waechter=2;assert.throws(()=>processWorld(w,B,{type:'command',action:{...launch().action,fleet:{waechter:1}}}),/Transporter|Frachter|verfügbare Schiffe/);own(w).planets[0].ships.waechter=0;assert.equal(JSON.stringify(w),before);
 w.planets[1].debris=vector([0,0,0]);assert.throws(()=>processWorld(w,B,launch()),/keine Trümmer/);
});
test('Competing bergungsflights cannot duplicate debris; depleted field returns empty',()=>{
 let w=setup();w.planets[1].debris=vector([80,20,0]);w=processWorld(w,B,launch());w=processWorld(w,B,launch());w.now=own(w).missions[0].due;w=processWorld(w,B,{type:'sync'});
 const missions=own(w).missions;assert.deepEqual(missions[0].cargo,vector([80,20,0]));assert.deepEqual(missions[1].cargo,vector([0,0,0]));assert.deepEqual(w.planets[1].debris,vector([0,0,0]));
});
test('Offline catch-up gives the same field, fleet and cargo as incremental arrival updates',()=>{
 const started=processWorld(setup(),B,launch()),due=own(started).missions[0].due;
 const offline=structuredClone(started);offline.now=T+2*(due-T);const done=processWorld(offline,B,{type:'sync'});
 started.now=due;let stepped=processWorld(started,B,{type:'sync'});stepped.now=offline.now;stepped=processWorld(stepped,B,{type:'sync'});assert.deepEqual(done,stepped);
});
test('Full home warehouse retains salvaged cargo in the fleet until space is freed',()=>{
 let w=setup();w.planets[1].debris=vector([80,20,0]);w=processWorld(w,B,launch());const m=own(w).missions[0];w.now=m.due*2-T;w=processWorld(w,B,{type:'sync'});
 assert.equal(own(w).missions[0].awaitingUnload,'home');assert.equal(own(w).planets[0].ships.karawane,2);assert.deepEqual(own(w).missions[0].cargo,vector([80,20,0]));
 own(w).planets[0].resources.metal=0;own(w).planets[0].resources.crystal=0;w=processWorld(w,B,{type:'sync'});assert.equal(own(w).missions.length,0);assert.equal(own(w).planets[0].ships.karawane,3);
});
test('Debris projection exposes only own colony fields and announces server support',()=>{
 const w=setup();assert.equal(projectPvP(w,B).features.debrisSalvage,true);assert.deepEqual(projectPvP(w,B).debris,[{planet:target,metal:10000,crystal:10000,fuel:0}]);assert.ok(!projectPvP(w,A).debris.some(d=>d.planet===target));
});

test('Browser prediction waits for server collection without inventing cargo or losing the mission',()=>{
 const w=processWorld(setup(),B,launch()),s=structuredClone(own(w)),due=s.missions[0].due;advance(s,due+60000);assert.equal(s.time,due-1);assert.equal(s.missions[0].phase,'outbound');assert.deepEqual(s.missions[0].cargo,vector([0,0,0]));
});
