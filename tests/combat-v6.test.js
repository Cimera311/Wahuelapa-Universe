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
 const test2=combatConfigForRealmId('test2').rapidFire;
 assert.equal(test2.maxExtraSalvos,1);
 for(const pairs of Object.values(test2.chances))for(const chance of Object.values(pairs))assert.equal(chance,1);
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

test('test3 has individual shot mechanics and no random rapid fire',()=>{
 const cfg=combatConfigForRealmId('test3');
 assert.equal(cfg.rapidFire.enabled,false);
 assert.deepEqual(cfg.shotMechanics.falke.titan,{shots:4,damagePerShot:15,targeting:'locked'});
 assert.equal(cfg.shotMechanics.titan.falke.targeting,'distinct');
 assert.equal(cfg.shotMechanics.titan.titan.targeting,'locked');
 assert.equal(cfg.shotMechanics.waechter.falke.targeting,'distinct');
 const a={fleet:{titan:1},tech:{}},d={fleet:{falke:10},tech:{}};
 const battle=resolveBattleHybridV6(a,d,'test3',REALM_COMBAT_OVERRIDES.test3);
 const titanShots=battle.trace.rounds.flatMap(x=>x.shots).filter(x=>x.shooter==='titan');
 assert.ok(titanShots.length>0);
 assert.ok(titanShots.every(x=>x.extraSalvos===0));
 assert.deepEqual(battle,resolveBattleHybridV6(a,d,'test3',REALM_COMBAT_OVERRIDES.test3));
});
