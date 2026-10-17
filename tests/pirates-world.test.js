import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {pirateConfig} from '../src/pirates-config.js';
import {SHIPS,vector} from '../src/config.js';
import {capacity} from '../src/engine.js';
function setup(){const w=fixture();w.pirateVersion=1;w.pirateConfig={flightTimeFactor:.1};w.piratePlayers=[];w.settings.combat_engine=6;const p=w.saves[0].state.planets[0];p.buildings.warehouse=8;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.resources=vector([20000,20000,20000]);p.ships.spyProbe=3;p.ships.falke=100;p.ships.karawane=10;return processWorld(w,A,{type:'pirate',action:{op:'open'}});}
let seq=0;
const call=(w,action,uid=A)=>processWorld(w,uid,{type:'pirate',eventId:'pirate-'+ ++seq,combatSeed:'server-seed',action});
const advance=(w,time)=>processWorld({...w,now:time},A,{type:'sync'});
const row=w=>w.piratePlayers[0],home=w=>w.saves[0].state.planets[0];
test('Admin-only ownership boundary; no hidden station fleet or resources are projected before a scan',()=>{
 const w=setup();assert.throws(()=>call(w,{op:'open'},B),/Administratoren/);assert.equal(projectPvP(w,B).pirates,null);
 const q=projectPvP(w,A).pirates.stations[0];assert.equal(q.scan,null);assert.equal(q.fleet,undefined);assert.equal(q.resources,undefined);
 assert.throws(()=>call(w,{op:'attack',station:'not-real',from:'home',fleet:{falke:1}}),/Unbekannte/);
 assert.throws(()=>processWorld({...w,pirateVersion:undefined},A,{type:'pirate',action:{op:'open'}}),/SQL/);
});
test('Sensor requirement, real probe travel, arrival-only information and exactly-once return',()=>{
 let w=setup();w.saves[0].state.tech.scout=0;assert.throws(()=>call(w,{op:'scan',station:'smugglers',from:'home'}),/Sensortechnik/);
 w.saves[0].state.tech.scout=1;w=call(w,{op:'scan',station:'smugglers',from:'home'});const m=row(w).missions[0];assert.equal(home(w).ships.spyProbe,2);assert.equal(row(w).stations.smugglers.scan,null);
 assert.throws(()=>call(w,{op:'scan',station:'smugglers',from:'home'}),/bereits unterwegs/);
 w=advance(w,m.arrivalAt);assert.equal(row(w).stations.smugglers.scan.fleet.falke,3);assert.equal(home(w).ships.spyProbe,2);
 w=advance(w,m.arrivalAt+m.duration);assert.equal(home(w).ships.spyProbe,3);w=advance(w,w.now);assert.equal(home(w).ships.spyProbe,3);
});
test('Real v6 battle removes units, grants limited cargo, leaves separately salvageable debris and enforces one arrival per hour',()=>{
 let w=setup();w=call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:100,karawane:1}});const m=structuredClone(row(w).missions[0]);
 assert.equal(home(w).ships.falke,0);assert.throws(()=>call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:1}}),/Cooldown/);
 w=advance(w,m.arrivalAt);const q=row(w).stations.smugglers,r=row(w).reports[0];assert.equal(r.outcome,'attacker');assert.equal(r.ruleVersion,6);assert.equal(r.attackerBefore.falke,100);assert.equal(q.defeated,true);assert.ok(q.debris.metal>0);assert.equal(q.nextAttackAt,m.arrivalAt+3600000);
 assert.equal(row(w).missions[0].cargo.metal,2400);assert.equal(row(w).missions[0].cargo.crystal,1600);
 const debris={...q.debris};w=advance(w,m.arrivalAt+m.duration);assert.equal(row(w).missions.length,0);assert.ok(home(w).resources.metal>=22400);assert.equal(row(w).reports.length,1);
 assert.throws(()=>call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:1}}),/Cooldown/);
 w=call(w,{op:'salvage',station:'smugglers',from:'home',fleet:{karawane:1}});const salvage=row(w).missions[0];w=advance(w,salvage.arrivalAt);assert.equal(row(w).stations.smugglers.debris.metal,0);assert.equal(row(w).missions[0].cargo.metal,debris.metal);
 w=advance(w,salvage.arrivalAt+salvage.duration);w=advance(w,m.arrivalAt+3600000);assert.equal(row(w).stations.smugglers.fleet.falke,3);assert.equal(row(w).stations.smugglers.resources.metal,2400);assert.equal(row(w).reports.length,1);
});
test('Empty hold leaves depot for peaceful collection, which aborts safely across station renewal; debris survives renewal',()=>{
 let w=setup();w=call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:100}});let m=row(w).missions[0];w=advance(w,m.arrivalAt+m.duration);assert.equal(row(w).stations.smugglers.resources.metal,2400);
 w=call(w,{op:'collect',station:'smugglers',from:'home',fleet:{karawane:1}});m=structuredClone(row(w).missions[0]);w=advance(w,m.arrivalAt+m.duration);assert.equal(row(w).stations.smugglers.resources.metal,0);
 const q=row(w).stations.smugglers,next=q.refreshAt;w=advance(w,next);assert.ok(row(w).stations.smugglers.debris.metal>0);
 assert.throws(()=>call(w,{op:'collect',station:'smugglers',from:'home',fleet:{karawane:1}}),/bewacht/);
});
test('Realm factors apply only on renewal, outbound target stays pinned and malformed settings are rejected',()=>{
 let w=setup();w=call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:100}});const m=row(w).missions[0];
 w=call(w,{op:'configure',config:{strengthFactor:2,resourceFactor:2}});assert.equal(row(w).stations.smugglers.fleet.falke,3);
 w=advance(w,m.arrivalAt);assert.equal(row(w).reports[0].defenderBefore.falke,3);w=advance(w,row(w).stations.smugglers.refreshAt);assert.equal(row(w).stations.smugglers.fleet.falke,6);assert.equal(row(w).stations.smugglers.resources.metal,4800);
 for(const bad of [{strengthFactor:NaN},{debrisRate:2},{stations:{smugglers:{fleet:{spyProbe:4}}}},{cooldownMinutes:0}])assert.throws(()=>pirateConfig(bad));
});
test('Returning cargo remains bound at full storage and releases exactly once; fleet shadows follow live ships',()=>{
 let w=setup();w=call(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:100,karawane:1}});const m=row(w).missions[0];assert.equal(w.saves[0].state.pveFleets[0].fleet.falke,100);
 w=advance(w,m.arrivalAt);home(w).resources.metal=capacity(home(w));w=advance(w,m.arrivalAt+m.duration);assert.equal(row(w).missions[0].awaitingUnload,true);assert.equal(home(w).ships.karawane,9);
 home(w).resources.metal-=3000;w=advance(w,w.now);assert.equal(home(w).ships.karawane,10);assert.equal(row(w).missions.length,0);assert.equal(w.saves[0].state.pveFleets.length,0);
 w=advance(w,w.now);assert.equal(home(w).ships.karawane,10);
});
