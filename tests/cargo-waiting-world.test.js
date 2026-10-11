import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
const from='g-helion-p1',to='g-orion-p1';
function heldRaid(){const w=fixture();w.attacks=[{id:'90000000-0000-0000-0000-000000000001',attacker_id:A,defender_id:B,from,to,status:'returning',arrival_at:T-1000,return_at:T,survivors:{karawane:1},return_hulls:{karawane:[.8]},cargo:vector([500,0,0]),combat:{fleet:{karawane:1},tech:{...w.saves[0].state.tech}},shieldUntil:T}];w.saves[0].state.planets[1].ships.karawane=3;w.saves[0].state.planets[1].resources.metal=33408.4;return w;}
test('returning raid keeps loot aboard, ships and attack slot bound, and credits it only once after room is free',()=>{
 let w=processWorld(heldRaid(),A,{type:'sync'});assert.equal(w.attacks[0].awaitingUnload,true);assert.equal(w.attacks[0].cargo.metal,500);assert.equal(w.saves[0].state.planets[1].depot.metal,0);assert.equal(projectPvP(w,A).outgoing[0].awaitingUnload,true);
 w.saves[0].state.planets[1].resources.metal-=500;w=processWorld(w,A,{type:'sync'});assert.equal(w.attacks[0].status,'returned');assert.equal(w.saves[0].state.planets[1].ships.karawane,4);assert.ok(Math.abs(w.saves[0].state.planets[1].resources.metal-33408.4)<1e-8);assert.equal(w.attacks[0].cargo.metal,0);const again=processWorld(w,A,{type:'sync'});assert.equal(again.saves[0].state.planets[1].ships.karawane,4);
});
test('unloading private fleets participate in defense; destroyed ships cannot retain impossible cargo',()=>{
 let w=fixture(),s=w.saves[0].state,p=s.planets[1];p.ships.karawane=0;p.ships.waechter=0;p.resources.metal=33408.4;
 s.missions=[{id:++s.seq,type:'transport',ship:'transport',count:1,cargo:vector([500,0,0]),phase:'return',from,to:'home',start:T-1000,due:T,duration:1000,awaitingUnload:from,finishTitle:'Flotte zurückgekehrt'}];validateSave(s);w.saves[1].state.planets[1].ships.titan=1;
 w=processWorld(w,B,{type:'attack',eventId:'90000000-0000-0000-0000-000000000002',action:{from:to,to:from,fleet:{titan:1}}});const attack=w.attacks[0];w=processWorld({...w,now:attack.arrival_at},A,{type:'sync'});assert.equal(w.saves[0].state.missions.length,0);assert.equal(w.saves[0].state.planets[1].ships.transport,0);assert.equal(w.attacks[0].report.defenderBefore.transport,1);validateSave(w.saves[0].state);
});
test('docked returning attack fleet can be destroyed at its homeworld while its loot waits',()=>{
 let w=processWorld(heldRaid(),A,{type:'sync'});w.saves[0].state.planets[1].ships.karawane=0;w.saves[0].state.planets[1].ships.waechter=0;w.saves[1].state.planets[1].ships.titan=1;
 w=processWorld(w,B,{type:'attack',eventId:'90000000-0000-0000-0000-000000000003',action:{from:to,to:from,fleet:{titan:1}}});const attack=w.attacks.find(m=>m.attacker_id===B);w=processWorld({...w,now:attack.arrival_at},A,{type:'sync'});assert.equal(w.attacks[0].status,'returned');assert.equal(w.attacks[0].cargo.metal,0);assert.equal(w.saves[0].state.planets[1].ships.karawane,0);assert.equal(w.attacks[1].report.defenderBefore.karawane,1);
});
