import test from 'node:test';
import assert from 'node:assert/strict';
import {attackSlots,TECHS,SHIPS,vector,costAt} from '../src/config.js';
import {sharedFlight,sharedDistance} from '../src/flight.js';
import {REALM_CONFIG} from '../src/realm-config.js';
import {newGame,researchInfo,act,advance,fleetManifest} from '../src/engine.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {combatStats} from '../src/combat.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {validateSave} from '../src/storage.js';
for(const [level,slots] of [[0,0],[1,1],[4,1],[5,2],[9,2],[10,4]])test(`Military ${level} reserves ${slots} attack slots including return legs`,()=>{
 let w=fixture();const s=w.saves[0].state,p=s.planets[1];s.tech.military=level;p.ships.waechter=20;p.resources.fuel=1000000;p.buildings.warehouse=15;
 for(let i=0;i<slots;i++)w=processWorld(w,A,{type:'attack',eventId:'slot-'+i,combatSeed:'slots',action:{from:p.id,to:w.planets[1].id,fleet:{waechter:1}}});
 assert.equal(projectPvP(w,A).attackCapacity,slots);assert.throws(()=>processWorld(w,A,{type:'attack',eventId:'over-limit',action:{from:p.id,to:w.planets[1].id,fleet:{waechter:1}}}),/Angriffsplätze/);
 if(slots){w.attacks[0].status='returning';w.attacks[0].survivors=w.attacks[0].fleet;assert.throws(()=>processWorld(w,A,{type:'attack',eventId:'still-full',action:{from:p.id,to:w.planets[1].id,fleet:{waechter:1}}}),/Angriffsplätze/);}
});
test('Military upper levels grow 2.4x per level, preserve early cost, and do not grant combat strength',()=>{
 const s=newGame(),p=s.planets[0];p.buildings.lab=10;for(const [k,t] of Object.entries(TECHS))s.tech[k]=t.max;s.tech.engineering=1;
 for(let level=0;level<=4;level++){s.tech.military=level;assert.equal(researchInfo(s,p,'military').cost.metal,Math.ceil(300*1.6**level));}
 s.tech.military=9;const info=researchInfo(s,p,'military');assert.equal(info.cost.metal,Math.ceil(300*1.6**9*1.5**5));assert.ok(info.cost.metal>150000);assert.deepEqual(combatStats('titan',{military:10}),combatStats('titan',{military:1}));
 for(const k of ['military','drive','ramjet','impulse','hyperspace']){s.tech[k]=10;assert.match(researchInfo(s,p,k).reason,/Maximale/);}validateSave(s);
});
test('Each engine affects only its ships and level-five timings retain their relative speed under the realm multiplier',()=>{
 const s=newGame();s.galaxy={x:0,y:0};const from=s.planets[0],to={system:'helion',slot:1,x:500,y:400},distance=sharedDistance(from,to,s.galaxy);
 for(const ship of ['karawane','atlas','titan']){const key=SHIPS[ship].engine;s.tech[key]=5;const f=sharedFlight(s,from,to,1,ship);assert.equal(f.ms,Math.max(60000,Math.ceil((120+distance*45)*1000/(SHIPS[ship].speed*1.6)))*REALM_CONFIG.galaxyFlightTimeFactor);const other=key==='ramjet'?'impulse':'ramjet';s.tech[other]=10;assert.deepEqual(sharedFlight(s,from,to,1,ship),f);s.tech[key]=10;assert.ok(sharedFlight(s,from,to,1,ship).ms<f.ms);s.tech[key]=0;}
});
test('Paused routes at an attacked colony fight, retain ownership and cannot hide ships',()=>{
 let w=fixture();const b=w.saves[1].state,p=b.planets[1];p.ships.karawane=2;
 w=processWorld(w,B,{type:'command',action:{type:'route',planet:p.id,fleet:{karawane:2},stops:[{planet:p.id,load:vector([0,0,0]),unload:vector([0,0,0])},{planet:'home',load:vector([0,0,0]),unload:vector([0,0,0])}],repeat:true}});
 const id=w.saves[1].state.missions[0].id;w=processWorld(w,B,{type:'command',action:{type:'pause-route',id}});
 const end=T+w.saves[1].state.missions[0].duration*2;w=processWorld({...w,now:end},B,{type:'sync'});assert.equal(w.saves[1].state.missions[0].paused,true);
 w.saves[0].state.planets[1].ships.titan=1;w=processWorld(w,A,{type:'attack',eventId:'paused-attack',combatSeed:'paused',action:{from:w.planets[0].id,to:p.id,fleet:{titan:1}}});w=processWorld({...w,now:w.attacks[0].arrival_at},B,{type:'sync'});
 const r=w.attacks[0].report;assert.equal(r.defenderBefore.karawane,2);assert.ok(r.trace.initial.some(u=>u.groupId==='route:'+id));assert.equal(w.saves[1].state.planets[1].ships.karawane,0);const survivors=w.saves[1].state.missions.reduce((n,m)=>n+(fleetManifest(m).karawane||0),0);assert.equal(survivors,r.defenderAfter.karawane);validateSave(w.saves[1].state);
});
