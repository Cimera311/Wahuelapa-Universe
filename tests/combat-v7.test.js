import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBattleHybrid,resolveBattleHybridV6,resolveBattleHybridV7} from '../src/combat-hybrid.js';
import {REALM_COMBAT_OVERRIDES} from '../src/realm-config.js';
import {reconcileRepairBattle} from '../src/repair.js';
import {battleLogView} from '../src/combat-ui.js';
import {rapidFireInfoHTML} from '../src/rapid-fire-ui.js';
const off={combat:{rapidFire:{enabled:false}}};
const forced={combat:{rapidFire:{replaceChances:true,chances:{titan:{falke:1}},maxExtraSalvos:3}}};
const side=fleet=>({fleet,tech:{}});
const first=r=>r.trace.rounds.find(q=>q.round===1);

test('v7 normal shots retarget on death, RF full salvos stay on the killed target',()=>{
 const a=side({titan:1}),d=side({falke:4});
 const plain=resolveBattleHybridV7(a,d,'retarget',off);
 const rapid=resolveBattleHybridV7(a,d,'retarget',forced);
 for(const result of [plain,rapid]){
  assert.equal(result.outcome,'attacker');
  assert.equal(first(result).impacts.find(i=>i.groupId==='host').destroyed,4);
  // All four Falcons still return fire in the same round, despite being killed.
  assert.equal(first(result).shots.find(s=>s.shooter==='falke').shots,4);
 }
 const hit=first(rapid).shots.find(s=>s.shooter==='titan');
 assert.equal(hit.extraSalvos,3);
 assert.equal(hit.rapidFireShots,12);
 assert.equal(hit.rapidFireDamage,3300);
 assert.equal(hit.shots,16); // 4 normal shots + 3 full salvos, not 3 per shot.
 assert.equal(hit.damage,4400);
 assert.equal(first(rapid).impacts.find(i=>i.groupId==='host').overkill,3600);
 assert.equal(first(plain).shots.find(s=>s.shooter==='titan').shots,4);
});

test('v7 excludes projected lethal targets for subsequent ships, without removing return fire',()=>{
 const result=resolveBattleHybridV7(side({titan:10}),side({falke:5}),'avoid-dead',off);
 const r=first(result);
 assert.equal(r.shots.find(s=>s.shooter==='titan').shots,5);
 assert.equal(r.shots.find(s=>s.shooter==='falke').shots,5);
 assert.equal(r.impacts.find(i=>i.groupId==='host').destroyed,5);
});

test('v7 a single RF bait does not monopolize Titans; civilians stay protected',()=>{
 const a=side({titan:1000}),d=side({flak:1,plasma:266,arche:2});
 const r=resolveBattleHybridV7(a,d,'one-flak',REALM_COMBAT_OVERRIDES.test4);
 const shots=first(r).shots.filter(s=>s.shooter==='titan');
 assert.ok(shots.some(s=>s.target==='plasma'&&s.shots>300));
 assert.ok(shots.every(s=>s.target!=='arche'));
 const flak=shots.find(s=>s.target==='flak');
 assert.ok(!flak||flak.shots<=13); // one normal lethal shot, at most 3 RF salvos.
 const old=resolveBattleHybridV6(a,d,'one-flak',REALM_COMBAT_OVERRIDES.test4);
 assert.ok(first(old).shots.filter(s=>s.shooter==='titan').every(s=>s.target==='flak'));
});

test('v7 retains a living target across rounds, shields do not regenerate',()=>{
 const r=resolveBattleHybridV7(side({falke:1}),side({arche:2}),'persistent-lock',off);
 assert.equal(r.rounds.length,6);
 for(const round of r.trace.rounds){
  const impact=round.impacts.find(i=>i.groupId==='host');
  assert.equal(impact.hitUnits,1);
  assert.equal(impact.shieldDamage,30);
 }
 // One lock receives 6 * 30 damage. Choosing another ship would leave two damaged shields.
 // Long-lived lock is also explicit in the reproducibility header.
 assert.equal(r.trace.targetingRules.lock,'until-destroyed');
 // Reduce shields to show exactly one hull is hit over all rounds.
 const damaged=resolveBattleHybridV7(side({falke:1}),{...side({arche:2}),shieldFactor:0},'persistent-lock',off);
 assert.equal(damaged.defender.hulls.arche.length,1);
 assert.equal(damaged.defender.hulls.arche[0],.955);
});

test('v7 RF chance is checked after a normal hit; no proc for non-RF targets',()=>{
 const a=side({titan:1}),d=side({plasma:5});
 const result=resolveBattleHybridV7(a,d,'plasma',REALM_COMBAT_OVERRIDES.test4);
 assert.ok(result.trace.rounds.flatMap(r=>r.shots).filter(s=>s.shooter==='titan').every(s=>s.extraSalvos===0));
 const single=resolveBattleHybridV7(side({falke:1}),side({arche:1}), 'one-shot', {combat:{rapidFire:{replaceChances:true,chances:{falke:{arche:1}},maxExtraSalvos:2}}});
 for(const r of single.trace.rounds){
  const s=r.shots.find(s=>s.shooter==='falke');assert.equal(s.extraSalvos,2);assert.equal(s.damage,90);
 }
});

test('v7 orbital RF flag is respected; only defenders fire in round zero',()=>{
 const config=allow=>({combat:{rapidFire:{replaceChances:true,chances:{flak:{falke:1}},maxExtraSalvos:3,allowInOrbitalOpening:allow}}});
 for(const allow of [false,true]){
  const result=resolveBattleHybridV7(side({falke:10}),side({flak:1}),'opening',config(allow));
  const r=result.trace.rounds[0];assert.equal(r.round,0);
  assert.ok(r.shots.every(s=>s.shooter==='flak'));
  const shot=r.shots[0];assert.equal(shot.extraSalvos,allow?3:0);
  assert.equal(shot.damage,allow?140:35);
 }
});

test('v7 is deterministic, preserves inputs, support and destroyed repair slots, and renders logs',()=>{
 const a=side({titan:5});
 const d={groups:[{id:'host',owner:'B',...side({plasma:2})},
  {id:'ally',owner:'C',...side({falke:3})},
  {id:'repair:slot',owner:'B',...side({falke:3}),hulls:{falke:[.2,.4,.7]}}]};
 const original=structuredClone({a,d});
 const r=resolveBattleHybridV7(a,d,'groups',REALM_COMBAT_OVERRIDES.test4);
 assert.deepEqual(r,resolveBattleHybridV7(a,d,'groups',REALM_COMBAT_OVERRIDES.test4));
 assert.deepEqual({a,d},original);
 assert.equal(r.trace.ruleVersion,7);
 assert.equal(r.defenderGroups.find(g=>g.id==='repair:slot').repairUnits.length,3);
 const p={repairQueue:[{id:'slot',key:'falke',factor:1,lost:0,entries:[{hp:.2},{hp:.4},{hp:.7}]}]};
 assert.doesNotThrow(()=>reconcileRepairBattle(p,r));
 assert.match(battleLogView({...r.trace,rounds:[]}),/Hybrid v7/);
 assert.match(rapidFireInfoHTML('titan',7),/v7 aktiv/);
 assert.match(rapidFireInfoHTML('titan',7),/auf demselben Ziel/);
 assert.doesNotMatch(rapidFireInfoHTML('titan',7),/Aktuell gilt v5/);
 assert.deepEqual(resolveBattleHybrid(a,d,'groups',7,REALM_COMBAT_OVERRIDES.test4),r);
});

test('v7 conserves finite hulls, debris and counts for mixed fleets across seeds',()=>{
 const a=side({falke:30,waechter:8,donner:5,titan:3}),d=side({falke:20,flak:8,laser:4,plasma:2,arche:1});
 for(let seed=0;seed<30;seed++){
  const r=resolveBattleHybridV7(a,d,seed,REALM_COMBAT_OVERRIDES.test4);
  for(const [out,initial] of [[r.attacker,a.fleet],[r.defender,d.fleet]]){
   for(const [key,n] of Object.entries(out.fleet))assert.ok(Number.isSafeInteger(n)&&n>=0&&n<=initial[key]);
   for(const values of Object.values(out.hulls))for(const v of values)assert.ok(Number.isFinite(v)&&v>0&&v<1);
  }
  for(const round of r.trace.rounds)for(const impact of round.impacts)for(const key of ['shieldDamage','hullDamage','overkill'])assert.ok(Number.isFinite(impact[key])&&impact[key]>=0);
  for(const value of Object.values(r.debris))assert.ok(Number.isSafeInteger(value)&&value>=0);
 }
});

test('Aster-2 reference first reproduces stored v6 rounds before comparing v7',async()=>{
 const {aster2Comparison}=await import('../scripts/combat-v7-reference.mjs');
 const {results}=aster2Comparison();
 assert.equal(results[0].attackerLosses.donner,23);
 assert.equal(results[1].outcome,'attacker');
 assert.ok(results[1].round1TitanTargets.some(s=>s.target==='plasma'));
});
