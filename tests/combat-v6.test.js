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


test('Test4 matches the complete Rapid Fire matrix without legacy damage bonuses',()=>{
 const c=combatConfigForRealmId('test4').rapidFire;
 const expected={
  falke:{donner:.20,titan:.40},
  waechter:{falke:.75,flak:.25},
  donner:{waechter:.25,flak:.85,laser:.75,rail:.60,plasma:.40},
  titan:{waechter:.40,donner:.50,flak:.60,laser:.40,rail:.20},
  flak:{falke:.80,waechter:.20},
  laser:{falke:.40,waechter:.60},
  rail:{donner:.60,titan:.40},
  plasma:{donner:.40,titan:.60}
 };
 assert.deepEqual(c.chances,expected);
 assert.equal(c.maxExtraSalvos,3);
 assert.equal(c.allowInOrbitalOpening,true);
 const fleet={fleet:{falke:5},tech:{}},target={fleet:{titan:1},tech:{}};
 const actual=resolveBattleHybridV6(fleet,target,'test4',REALM_COMBAT_OVERRIDES.test4);
 assert.deepEqual(actual,resolveBattleHybridV6(fleet,target,'test4',REALM_COMBAT_OVERRIDES.test4));
 assert.ok(actual.trace.rounds.flatMap(x=>x.shots).some(x=>x.shooter==='falke'));
});

test('v6 opening salvo supports rapid fire with no old damage bonus',()=>{
 const attacker={fleet:{falke:1},tech:{}},defender={fleet:{flak:1},tech:{}};
 const config=allow=>({combat:{rapidFire:{enabled:true,maxExtraSalvos:3,
  allowInOrbitalOpening:allow,replaceChances:true,chances:{flak:{falke:1}}}}});
 const enabled=resolveBattleHybridV6(attacker,defender,'opening-rapid',config(true));
 const disabled=resolveBattleHybridV6(attacker,defender,'opening-rapid',config(false));
 const first=result=>result.trace.rounds.find(round=>round.round===0);
 const hit=result=>first(result).shots.find(shot=>shot.shooter==='flak'&&shot.target==='falke');
 assert.ok(first(enabled));
 assert.equal(first(enabled).shots.some(shot=>shot.shooter==='falke'),false);
 assert.equal(hit(enabled).extraSalvos,3);
 assert.equal(hit(enabled).rapidFireDamage,105);
 assert.equal(hit(enabled).damage,140);
 assert.equal(hit(disabled).extraSalvos,0);
 assert.equal(hit(disabled).damage,35);
 assert.deepEqual(enabled,resolveBattleHybridV6(attacker,defender,'opening-rapid',config(true)));
});

test('Test4 Titans do not receive Rapid Fire against Falcons',()=>{
 const attacker={fleet:{titan:3},tech:{weapons:5}};
 const defender={fleet:{falke:120},tech:{armor:5,shields:5}};
 const result=resolveBattleHybridV6(attacker,defender,'titan-no-falke-rf',REALM_COMBAT_OVERRIDES.test4);
 const shots=result.trace.rounds.flatMap(round=>round.shots).filter(shot=>shot.shooter==='titan'&&shot.target==='falke');
 assert.ok(shots.length>0);
 assert.ok(shots.every(shot=>shot.extraSalvos===0&&shot.rapidFireDamage===0));
 assert.equal(combatConfigForRealmId('test4').rapidFire.chances.titan.falke,undefined);
 assert.equal(combatConfigForRealmId('test4').rapidFire.chances.falke.titan,.40);
});
