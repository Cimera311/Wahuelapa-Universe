// Reproducible Aster-2 reference, 19 October 2026, 13:23 Europe/Berlin.
// Stored battle started with full hulls and shields; no support/repair groups.
import assert from 'node:assert/strict';
import {resolveBattleHybrid} from '../src/combat-hybrid.js';
import {REALM_COMBAT_OVERRIDES} from '../src/realm-config.js';
export function aster2Comparison(){
 const tech={armor:5,shields:5,weapons:5};
 const attacker={fleet:{arche:30,falke:6314,titan:1205,donner:286,waechter:16},tech};
 const defender={fleet:{flak:22,rail:6,arche:2,laser:12,plasma:266,spyProbe:1},tech};
 const seed='9f763401-3019-4483-aa52-d02c4e6b216b';
 const expected=[{round:0,attacker:7851,defender:309},{round:1,attacker:7845,defender:269},{round:2,attacker:7831,defender:49},{round:3,attacker:7828,defender:3},{round:4,attacker:7828,defender:0}];
 const results=[6,7].map(version=>{
  const start=performance.now(),r=resolveBattleHybrid(attacker,defender,seed,version,REALM_COMBAT_OVERRIDES.test4);
  if(version===6)assert.deepEqual(r.rounds,expected,'v6 must reproduce the stored live battle before comparing v7');
  const losses=Object.fromEntries(Object.entries(attacker.fleet).map(([k,n])=>[k,n-(r.attacker.fleet[k]||0)]));
  return {version,outcome:r.outcome,rounds:r.rounds,attackerLosses:losses,
   damagedAttackerUnits:Object.fromEntries(Object.entries(r.attacker.hulls).map(([k,h])=>[k,h.length])),
   round1TitanTargets:r.trace.rounds.find(r=>r.round===1).shots.filter(s=>s.shooter==='titan'),
   hullDamage:r.trace.rounds.flatMap(q=>q.impacts).filter(i=>i.groupId==='attacker').reduce((n,i)=>n+i.hullDamage,0),
   overkill:r.trace.rounds.flatMap(q=>q.impacts).filter(i=>i.groupId==='host').reduce((n,i)=>n+i.overkill,0),
   elapsedMs:Number((performance.now()-start).toFixed(2))};
 });
 return {reference:'Aster-2, 2026-10-19 13:23 Europe/Berlin',seed,attacker,defender,note:'Same initial full hulls, research, matrix and seed. Different rules consume random numbers differently. One reference, not a balance study.',results};
}
if(process.argv[1]?.endsWith('combat-v7-reference.mjs'))console.log(JSON.stringify(aster2Comparison(),null,2));
