import test from 'node:test';
import assert from 'node:assert/strict';
import {REALM_CONFIG,REALM_COMBAT_OVERRIDES,combatConfigForRealm,combatConfigForRealmId} from '../src/realm-config.js';
import {resolveBattleHybridV5,resolveBattleHybridV6} from '../src/combat-hybrid.js';
const a={fleet:{waechter:10,donner:5,titan:5},tech:{}};
const d={fleet:{falke:100,flak:10,laser:10},tech:{}};
test('Rapid Fire defaults and realm-specific overrides are isolated',()=>{
 const main=combatConfigForRealmId('main').rapidFire,testRealm=combatConfigForRealmId('test').rapidFire;
 assert.equal(main.chances.titan.falke,.10);
 assert.equal(testRealm.chances.titan.falke,.15);
 assert.equal(main.maxExtraSalvos,3);
 assert.equal(testRealm.maxExtraSalvos,2);
 assert.equal(REALM_CONFIG.combat.rapidFire.chances.donner.flak,.15);
 assert.throws(()=>combatConfigForRealm({combat:{rapidFire:{chances:{titan:{falke:1.1}}}}}));
 assert.throws(()=>combatConfigForRealmId('missing'));
});
test('Rapid Fire v6 is deterministic and does not affect v5',()=>{
 const before=resolveBattleHybridV5(a,d,'battle-seed');
 const v6=resolveBattleHybridV6(a,d,'battle-seed',REALM_COMBAT_OVERRIDES.main);
 assert.deepEqual(v6,resolveBattleHybridV6(a,d,'battle-seed',REALM_COMBAT_OVERRIDES.main));
 assert.deepEqual(before,resolveBattleHybridV5(a,d,'battle-seed'));
 assert.equal(v6.trace.ruleVersion,6);
 assert.ok(v6.trace.rounds.every(x=>x.shots.every(y=>y.extraSalvos===undefined||y.extraSalvos<=a.fleet.waechter*3+a.fleet.donner*3+a.fleet.titan*3+d.fleet.falke*3+d.fleet.flak*3+d.fleet.laser*3)));
});
test('100% chance forces extra salvo, 0% does not',()=>{
 const attacker={fleet:{titan:1},tech:{}},defender={fleet:{falke:3},tech:{}};
 const zero=resolveBattleHybridV6(attacker,defender,'guaranteed',{combat:{rapidFire:{chances:{titan:{falke:0}}}}});
 const full=resolveBattleHybridV6(attacker,defender,'guaranteed',{combat:{rapidFire:{chances:{titan:{falke:1}}},maxExtraSalvos:2}});
 const sum=r=>r.trace.rounds.flatMap(x=>x.shots).filter(x=>x.shooter==='titan').reduce((n,x)=>n+(x.extraSalvos||0),0);
 assert.equal(sum(zero),0);
 assert.ok(sum(full)>0);
});
