import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBattleHybrid} from '../src/combat-hybrid.js';

test('v4 deterministic and preserves original inputs',()=>{
 const a={fleet:{titan:10},tech:{}},d={fleet:{falke:100},tech:{}};
 const original=JSON.stringify({a,d});
 const x=resolveBattleHybrid(a,d,'seed-1'),y=resolveBattleHybrid(a,d,'seed-1');
 assert.deepEqual(x,y);
 assert.equal(JSON.stringify({a,d}),original);
 assert.equal(x.trace.ruleVersion,4);
 assert.ok(x.trace.rounds.every(r=>r.shots.every(s=>s.shots>0)));
});
test('v4 sparse hulls survive and are available for repair',()=>{
 const out=resolveBattleHybrid({fleet:{titan:1},tech:{}},{fleet:{titan:1},tech:{}},'one');
 assert.equal(out.attacker.fleet.titan,1);
 assert.equal(out.defender.fleet.titan,1);
 assert.ok(out.defender.hulls.titan?.[0]<1);
});
test('v4 supports defended groups with separate fleet ownership',()=>{
 const out=resolveBattleHybrid({fleet:{titan:1},tech:{}},{
  groups:[{id:'host',owner:'A',fleet:{falke:10},tech:{}},{id:'ally',owner:'B',fleet:{falke:10},tech:{}}]
 },'groups');
 assert.equal(out.defenderGroups.length,2);
 assert.equal(out.defenderGroups[0].owner,'A');
 assert.equal(out.defenderGroups[1].owner,'B');
});
test('v4 round zero defense fires first and results do not exceed six normal rounds',()=>{
 const out=resolveBattleHybrid({fleet:{titan:2},tech:{}},{fleet:{plasma:5},tech:{}},'platforms');
 assert.equal(out.rounds[0].round,0);
 assert.ok(out.rounds.length<=7);
});
test('v4 aggregates shots instead of storing individual per-shot logs',()=>{
 const out=resolveBattleHybrid({fleet:{titan:100},tech:{}},{fleet:{titan:100},tech:{}},'large');
 const first=out.trace.rounds.find(r=>r.round===1);
 assert.ok(first.shots.length<=2);
 assert.equal(first.shots.reduce((n,s)=>n+s.shots,0),800);
});

test('v4 repair dock retains original slots including destroyed units',()=>{
 const defender={groups:[
  {id:'host',owner:'A',fleet:{},tech:{}},
  {id:'repair:slot1',owner:'A',fleet:{falke:3},hulls:{falke:[.2,.4,.7]},tech:{}}
 ]};
 const out=resolveBattleHybrid({fleet:{titan:100},tech:{}},defender,'repair-destruction');
 const dock=out.defenderGroups.find(g=>g.id==='repair:slot1');
 assert.equal(dock.repairUnits.length,3);
 assert.ok(dock.repairUnits.every(x=>x.maxHp===160));
 assert.ok(dock.repairUnits.some(x=>x.hp<=1e-8));
});
