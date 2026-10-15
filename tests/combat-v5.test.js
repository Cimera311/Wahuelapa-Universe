import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBattleHybrid,resolveBattleHybridV5} from '../src/combat-hybrid.js';

const attacker={fleet:{titan:8,waechter:12},tech:{weapons:1}};
const defender={fleet:{titan:8,waechter:12,falke:80},tech:{armor:1}};

test('v5 target lock is deterministic and leaves v4 unchanged',()=>{
 const before=JSON.stringify({attacker,defender});
 const v4a=resolveBattleHybrid(attacker,defender,'stable');
 const v4b=resolveBattleHybrid(attacker,defender,'stable',4);
 assert.deepEqual(v4a,v4b);
 const v5a=resolveBattleHybridV5(attacker,defender,'stable');
 const v5b=resolveBattleHybridV5(attacker,defender,'stable');
 assert.deepEqual(v5a,v5b);
 assert.equal(v4a.trace.ruleVersion,4);
 assert.equal(v5a.trace.ruleVersion,5);
 assert.equal(JSON.stringify({attacker,defender}),before);
});

test('v5 one target per firing ship: aggregate defender shot counts',()=>{
 const a={fleet:{titan:1},tech:{}},d={fleet:{titan:2},tech:{}};
 const locked=resolveBattleHybridV5(a,d,'lock');
 const round=locked.trace.rounds.find(r=>r.round===1);
 assert.equal(round.shots.filter(x=>x.shooter==='titan').reduce((n,x)=>n+x.shots,0),12);
 // With identical types, logs aggregate, while lock changes where hull damage lands.
 const fromV4=resolveBattleHybrid(a,d,'lock');
 assert.notDeepEqual(locked.trace.rounds,fromV4.trace.rounds);
});

test('v5 supports orbital opener and defender repair groups',()=>{
 const a={fleet:{titan:5},tech:{}};
 const d={groups:[
  {id:'host',owner:'host',fleet:{plasma:2},tech:{}},
  {id:'repair:example',owner:'host',fleet:{falke:2},hulls:{falke:[.6,.8]},tech:{}}
 ]};
 const out=resolveBattleHybridV5(a,d,'orbital');
 assert.equal(out.trace.rounds[0].round,0);
 assert.equal(out.defenderGroups.find(g=>g.id==='repair:example').repairUnits.length,2);
 assert.ok(out.rounds.length<=7);
});
