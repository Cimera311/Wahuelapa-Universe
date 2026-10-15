import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBattleHybrid} from '../src/combat-hybrid.js';
import {resolveBattle} from '../src/combat.js';
import {reconcileRepairBattle} from '../src/repair.js';
import {battleLogView} from '../src/combat-ui.js';
import {roundSummaryView} from '../src/combat-summary.js';

test('v4 destroyed repair slots reconcile without losing original indexing',()=>{
 const p={repairQueue:[{id:'slot1',key:'falke',factor:1,lost:0,entries:[
  {hp:.2},{hp:.4},{hp:.7}
 ]}]};
 const defense={groups:[
  {id:'host',owner:'A',fleet:{},tech:{}},
  {id:'repair:slot1',owner:'A',fleet:{falke:3},hulls:{falke:[.2,.4,.7]},tech:{}}
 ]};
 const out=resolveBattleHybrid({fleet:{titan:100},tech:{}},defense,'repair-destruction');
 assert.equal(out.defenderGroups.find(g=>g.id==='repair:slot1').repairUnits.length,3);
 assert.doesNotThrow(()=>reconcileRepairBattle(p,out));
 assert.equal(p.repairQueue.length,0);
});

test('v4 compact log stays readable across rounds and old v3 trace stays detailed',()=>{
 const attacker={fleet:{titan:4},tech:{}},defender={fleet:{falke:8},tech:{}};
 const result=resolveBattleHybrid(attacker,defender,'report-seed');
 const trace=result.trace;
 const header={...trace,rounds:trace.rounds.map(q=>({round:q.round,after:q.after})),from:'Planet A',to:'Planet B',ownSide:'attacker'};
 assert.equal(trace.version,2);
 assert.ok(trace.initialGroups?.length);
 assert.ok(trace.finalGroups?.length);
 assert.match(battleLogView(header),/Hybrid v4/);
 for(const page of trace.rounds){
  const roundPage={...page,shotTotal:page.shots.length,impactTotal:page.impacts.length};
  assert.match(battleLogView(header,roundPage,{round:page.round}),/Aggregierte Schüsse/);
  assert.match(roundSummaryView(header,roundPage),/Schäden und Verluste/);
 }
 const old=resolveBattle(attacker,defender,'old-report',3).trace;
 assert.equal(old.version,1);
 assert.ok(Array.isArray(old.initial));
 assert.ok(Array.isArray(old.final));
 assert.match(battleLogView({...old,rounds:old.rounds.map(q=>({round:q.round,after:q.after})),from:'A',to:'B',ownSide:'attacker'}),/Regelversion 3/);
});

test('v4 results respect conservation and produce finite hull fractions',()=>{
 const original={falke:20,titan:4},defense={flak:12,laser:4};
 const out=resolveBattleHybrid({fleet:original,tech:{armor:5,shields:4,weapons:3}},
  {fleet:defense,tech:{armor:3,shields:2,weapons:1}},'conservation');
 for(const [side,initial] of [[out.attacker,original],[out.defender,defense]]){
  for(const [key,n] of Object.entries(side.fleet)){
   assert.ok(n>=0&&n<=initial[key]);
   assert.ok((side.hulls[key]||[]).length<=n);
  }
  for(const arr of Object.values(side.hulls)){
   for(const fraction of arr)assert.ok(Number.isFinite(fraction)&&fraction>0&&fraction<1);
  }
 }
 for(const n of Object.values(out.debris))assert.ok(Number.isSafeInteger(n)&&n>=0);
});
