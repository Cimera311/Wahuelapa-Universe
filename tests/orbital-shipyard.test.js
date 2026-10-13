import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,stats,orbitalJobInfo,orbitalQueueCapacity,orbitalOrders} from '../src/engine.js';
import {SHIPS,TECHS,vector} from '../src/config.js';
import {resolveBattle,COMBAT_RULE_VERSION} from '../src/combat.js';
import {parseSave,validateSave} from '../src/storage.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
import {processWorld} from '../src/server-world.js';

const ready=()=>{
 const s=newGame('Orbital',1800000000000),p=s.planets[0];
 for(const [k,t] of Object.entries(TECHS))s.tech[k]=t.max;
 Object.assign(p.buildings,{orbital:6,shipyard:6,solar:30,warehouse:16,metal:0,crystal:0,fuel:0});
 p.resources=vector([1000000,1000000,1000000]);return s;
};
test('Each armed orbital platform matches its warship exactly by resource type',()=>{
 for(const [key,ship] of [['flak','falke'],['laser','waechter'],['rail','donner'],['plasma','titan']]){
  assert.deepEqual(SHIPS[key].cost,SHIPS[ship].cost,key);
 }
});
test('Orbital yard consumes power even when idle and its slots are separate',()=>{
 const s=ready(),p=s.planets[0],v=stats(s,p);
 assert.equal(v.consumers.orbital,Math.ceil(10*6**1.5));
 assert.equal(orbitalQueueCapacity(p),6);
 assert.equal(v.consumers.shipyard,Math.ceil(10*6**1.5));
});
test('Construction pays once, runs offline, does not use the regular shipyard and survives save load',()=>{
 let s=ready(),p=s.planets[0],was={...p.resources};
 s=act(s,{type:'orbital-build',key:'plasma',count:4},s.time);p=s.planets[0];
 for(const [i,k] of ['metal','crystal','fuel'].entries())assert.equal(p.resources[k],was[k]-SHIPS.plasma.cost[i]*4);
 assert.equal(p.shipjob,null);assert.equal(p.orbitaljob.count,4);
 s=parseSave(JSON.stringify(s));p=s.planets[0];
 advance(s,p.orbitaljob.end);assert.equal(p.ships.plasma,4);assert.equal(orbitalOrders(p).length,0);
});
test('Destroyed installations remain wrecks and only pay 70% metal/crystal plus full fuel',()=>{
 let s=ready(),p=s.planets[0];p.orbitalWrecks={plasma:4};
 const info=orbitalJobInfo(s,p,'plasma',1,'wreck');
 assert.deepEqual(info.cost,vector([6650,4550,2500]));
 s=act(s,{type:'orbital-repair',key:'plasma',count:2,mode:'wreck'},s.time);
 p=s.planets[0];assert.equal(p.orbitalWrecks.plasma,2);assert.equal(p.orbitaljob.count,2);
 advance(s,p.orbitaljob.end);assert.equal(p.ships.plasma,2);assert.equal(p.orbitalWrecks.plasma,2);
});
test('Queue cancellation refunds without resurrecting a fully repaired installation twice',()=>{
 let s=ready();s.planets[0].orbitalWrecks={rail:3};const original={...s.planets[0].resources};
 s=act(s,{type:'orbital-repair',key:'rail',count:2,mode:'wreck'},s.time);
 const id=s.planets[0].orbitaljob.id;s=act(s,{type:'orbital-cancel',id},s.time);
 assert.deepEqual(s.planets[0].resources,original);assert.equal(s.planets[0].orbitalWrecks.rail,3);
});
test('Round zero is defense-only; old attacks retain pinned rule version',()=>{
 const a={fleet:{titan:4},tech:{}},d={fleet:{plasma:4,titan:1},tech:{}};
 const modern=resolveBattle(a,d,'orbit-first',COMBAT_RULE_VERSION);
 assert.equal(modern.trace.rounds[0].round,0);
 assert.ok(modern.trace.rounds[0].shots.every(shot=>shot.shooter.startsWith('D-plasma')));
 const old=resolveBattle(a,d,'orbit-first',2);
 assert.equal(old.trace.rounds[0].round,1);
});
test('New PvP battle stores wrecks for destroyed defensive platforms',()=>{
 let w=fixture(),d=w.saves[1].state.planets[1];
 d.ships.plasma=1;d.buildings.orbital=6;
 const a=w.saves[0].state.planets[1];a.ships.titan=40;a.buildings.warehouse=22;a.resources.fuel=10000000;
 w=processWorld(w,A,{type:'attack',requestId:'10000000-0000-0000-0000-000000001111',action:{from:a.id,to:d.id,fleet:{titan:40}}});
 const m=w.attacks[0];w.now=m.arrival_at;w=processWorld(w,B,{type:'sync'});
 assert.equal(w.attacks[0].ruleVersion,3);
 assert.equal(w.saves[1].state.planets[1].ships.plasma,0);
 assert.equal(w.saves[1].state.planets[1].orbitalWrecks.plasma,1);
});
