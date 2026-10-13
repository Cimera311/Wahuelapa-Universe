import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,stats,shipInfo,orbitalOrders,shipOrders,energyDemand,buildInfo} from '../src/engine.js';
import {SHIPS,vector} from '../src/config.js';
import {resolveBattle} from '../src/combat.js';
import {validateSave} from '../src/storage.js';

const T=1800000000000;
const ready=()=>{
 const s=newGame('Verteidigung',T),p=s.planets[0];
 p.buildings.shipyard=6;p.buildings.orbital=6;p.buildings.solar=30;
 p.resources=vector([500000,500000,500000]);p.depot=vector([0,0,0]);
 s.tech.military=4;return s;
};
test('Full platform + chosen weapon matches corresponding military ship cost, independently of orbital yard price',()=>{
 const s=ready(),p=s.planets[0];
 for(const [defense,ship] of [['flak','falke'],['laser','waechter'],['rail','donner'],['plasma','titan']]){
  assert.deepEqual(SHIPS[defense].cost,SHIPS[ship].cost);
  assert.deepEqual(shipInfo(s,p,defense).cost,vector(SHIPS[ship].cost));
 }
 assert.equal(buildInfo(s,p,'orbital').cost.metal>0,true);
});
test('Orbital shipyard draws power permanently and does not share the shipbuilding queue',()=>{
 let s=ready(),p=s.planets[0];assert.ok(energyDemand(p).orbital>0);
 const before=stats(s,p).demand;p.buildings.orbital=0;assert.ok(before>stats(s,p).demand);p.buildings.orbital=6;
 s=act(s,{type:'ship',planet:'home',key:'plasma',count:1},T);
 s=act(s,{type:'ship',planet:'home',key:'titan',count:1},T);
 p=s.planets[0];assert.equal(p.orbitaljob.key,'plasma');assert.equal(p.shipjob.key,'titan');
 assert.equal(orbitalOrders(p).length,1);assert.equal(shipOrders(p).length,1);
 validateSave(s);advance(s,Math.max(p.shipjob.end,p.orbitaljob.end)+1000);
 assert.equal(s.planets[0].ships.plasma,1);assert.equal(s.planets[0].ships.titan,1);
});
test('Orbital initiative phase 0 is defender-platform-only; later rounds fire simultaneously',()=>{
 const a={fleet:{titan:4,donner:4},tech:{}},d={fleet:{plasma:4,waechter:4},tech:{}};
 const r=resolveBattle(a,d,'orbital-round-zero');
 assert.equal(r.trace.ruleVersion,3);assert.equal(r.trace.rounds[0].round,0);
 assert.ok(r.trace.rounds[0].shots.length>0);
 assert.ok(r.trace.rounds[0].shots.every(q=>q.shooter.startsWith('D-plasma-')));
 assert.ok(r.trace.rounds.some(q=>q.round===1&&q.shots.some(shot=>shot.shooter.startsWith('A-'))));
 const none=resolveBattle(a,{fleet:{waechter:4},tech:{}},'without-platform');
 assert.equal(none.trace.rounds[0].round,1);
 const old=resolveBattle(a,d,'orbital-round-zero',2);
 assert.equal(old.trace.rounds[0].round,1);
});
test('Destroyed platform is repaired in orbital dock for 70% M/K and 100% T, with cancellation restoring wreck',()=>{
 let s=ready(),p=s.planets[0];p.orbitalWrecks={plasma:1};
 const old={...p.resources};
 s=act(s,{type:'repair-orbital',planet:'home',key:'plasma',count:1},T);
 p=s.planets[0];assert.equal(p.orbitalWrecks.plasma,0);assert.equal(p.orbitaljob.repair,true);
 assert.equal(old.metal-p.resources.metal,6650);assert.equal(old.crystal-p.resources.crystal,4550);
 assert.equal(old.fuel-p.resources.fuel,2500);
 validateSave(s);
 const job=p.orbitaljob;
 s=act(s,{type:'cancel-ship',planet:'home',order:{id:job.id,key:job.key,count:job.count,start:job.start,end:job.orderEnd??job.end}},T);
 assert.equal(s.planets[0].orbitalWrecks.plasma,1);
 s=act(s,{type:'repair-orbital',planet:'home',key:'plasma',count:1},T);
 advance(s,s.planets[0].orbitaljob.end);
 assert.equal(s.planets[0].ships.plasma,1);assert.equal(s.planets[0].orbitalWrecks.plasma,0);
 validateSave(s);
});
test('Older paid platform orders and built defenses survive save migration',()=>{
 const s=ready(),p=s.planets[0];p.ships.flak=4;p.shipjob={id:1,key:'flak',count:1,start:T,end:T+60000,workTotal:60000,workRemaining:60000,paused:false,payment:{resources:vector([48,24,20]),salvage:vector([112,56,0])}};s.seq=Math.max(s.seq,1);
 assert.equal(validateSave(s).planets[0].ships.flak,4);
 assert.equal(validateSave(s).planets[0].shipjob.key,'flak');
});
