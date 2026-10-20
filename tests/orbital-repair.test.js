import test from 'node:test';
import assert from 'node:assert/strict';
import {act,advance,shipInfo} from '../src/engine.js';
import {repairQuote,repairDefense,orbitCondition,repairRefund} from '../src/repair.js';
import {validateSave} from '../src/storage.js';
import {processWorld} from '../src/server-world.js';
import {SHIPS} from '../src/config.js';
import {fixture,A,B,T,ID} from './helpers/pvp-fixture.js';
import {ui,tick} from './helpers/game-ui.js';
function ready(){const s=fixture().saves[1].state,p=s.planets[1];p.buildings.repairDock=1;p.buildings.solar=30;p.buildings.warehouse=15;p.resources={metal:10000000,crystal:10000000,fuel:10000000};p.disabledDefenses={flak:2};return s;}
function attack(w,id=ID){const p=w.saves[0].state.planets[1];p.ships.titan=100;p.buildings.warehouse=15;p.resources.fuel=10000000;w=processWorld(w,A,{type:'attack',eventId:id,action:{from:p.id,to:w.saves[1].state.active,fleet:{titan:100}}});const m=w.attacks.at(-1);m.arrival_at=w.now+1;m.return_at=w.now+100;w.now=m.arrival_at;return processWorld(w,A,{type:'sync'});}
test('Orbital losses persist as disabled, emit 30% debris and never fight or emit debris twice',()=>{
 let w=fixture();w.saves[1].state.planets[1].ships.flak=2;w=attack(w);let p=w.saves[1].state.planets[1];assert.equal(p.ships.flak,0);assert.equal(p.disabledDefenses.flak,2);assert.equal(w.attacks[0].report.defenseRepair.metal,0);
 const report=w.attacks[0].report;assert.equal(report.salvage.metal+report.debrisLeft.metal,144);assert.equal(report.salvage.crystal+report.debrisLeft.crystal,90);assert.equal(report.salvage.fuel+report.debrisLeft.fuel,0);
 w=attack(w,'10000000-0000-0000-0000-000000000002');p=w.saves[1].state.planets[1];assert.equal(p.disabledDefenses.flak,2);assert.equal(w.attacks[1].report.defenderBefore.flak,0);validateSave(w.saves[1].state);
});
test('Restoration costs 70% metal/crystal, equals new construction time, uses robots and finishes one at a time',()=>{
 let s=ready(),p=s.planets[1];p.buildings.robotics=3;const q=repairQuote(p,'flak',2);assert.deepEqual(q.cost,{metal:336,crystal:210,fuel:0});assert.equal(q.ms,shipInfo(s,p,'flak',2).ms);
 s=act(s,{type:'repair',key:'flak',count:2},T);p=s.planets[1];validateSave(s);assert.equal(p.disabledDefenses.flak,0);assert.equal(p.ships.flak,0);assert.equal(repairDefense(p,B,'Defender',{},1).length,0);assert.equal(orbitCondition(p,'flak').total,2);
 const work=p.repairQueue[0].entries[0].workRemaining;advance(s,T+Math.ceil(work));assert.equal(p.ships.flak,1);assert.equal(p.repairQueue[0].entries.length,1);advance(s,T+q.ms+10);assert.equal(p.ships.flak,2);assert.equal(p.repairQueue.length,0);validateSave(s);
});
test('Cancelling restoration returns only unspent materials and restores disabled status, no active unit',()=>{
 let s=act(ready(),{type:'repair',key:'flak',count:2},T),p=s.planets[1];const id=p.repairQueue[0].id;advance(s,T+1000);const refund=repairRefund(p.repairQueue[0]),before=p.resources.metal;
 s=act(s,{type:'cancel-repair',id},s.time);p=s.planets[1];assert.equal(p.ships.flak,0);assert.equal(p.disabledDefenses.flak,2);assert.equal(p.resources.metal,before+refund.metal);assert.equal(p.repairQueue.length,0);validateSave(s);
});
test('Ongoing orbital restoration is excluded from subsequent attacks and retains its paid order',()=>{
 let w=fixture();w.saves[1].state=act(ready(),{type:'repair',key:'flak',count:2},T);w=attack(w);const p=w.saves[1].state.planets[1];assert.equal(p.repairQueue[0].entries.length,2);assert.equal(w.attacks[0].report.defenderBefore.flak,0);assert.equal(w.attacks[0].report.defenderAfter.flak,0);assert.equal(w.attacks[0].report.debrisLeft.metal,0);validateSave(w.saves[1].state);
});
test('Partially damaged orbital units destroyed in dock become disabled too',()=>{
 let w=fixture(),s=ready(),p=s.planets[1];p.disabledDefenses={};p.ships.flak=1;p.hulls={flak:[.1]};w.saves[1].state=act(s,{type:'repair',key:'flak',count:1},T);w=attack(w);p=w.saves[1].state.planets[1];assert.equal(p.disabledDefenses.flak,1);assert.equal(p.repairQueue.length,0);assert.equal(p.ships.flak,0);validateSave(w.saves[1].state);
});
test('Dock UI shows disabled-only units and submits a restoration order',async t=>{
 const s=ready(),{doc,w,api}=ui(t,{state:s});api.show('overview');doc.querySelector('nav [data-tab="fleet"]').click();assert.match(doc.querySelector('.fleet-stock-grid').textContent,/2 defekt/);doc.querySelector('[data-action="repair-open"]').click();assert.match(doc.querySelector('[data-repair-quote]').textContent,/336/);doc.querySelector('[data-repair-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[1].repairQueue[0].restore,true);
});
test('Invalid disabled counts and restore flags cannot enter persisted state',()=>{
 for(const disabled of [{titan:1},{flak:-1},{flak:1.5}]){const s=ready();s.planets[1].disabledDefenses=disabled;assert.throws(()=>validateSave(s));}
 const s=act(ready(),{type:'repair',key:'flak',count:1},T);s.planets[1].repairQueue[0].restore='true';assert.throws(()=>validateSave(s));
});
test('Ranking removes disabled and restoring platforms, restores points only on completion',async t=>{
 const {PGlite}=await import('@electric-sql/pglite'),{readFileSync}=await import('node:fs');const db=new PGlite();t.after(()=>db.close());await db.exec('create role anon;create role authenticated;');const base=readFileSync('supabase/leaderboard.sql','utf8');await db.exec(base.slice(0,base.indexOf('create or replace function public.imperium_leaderboard')));await db.exec(readFileSync('supabase/orbital-repair.sql','utf8'));
 const score=async s=>(await db.query('select * from public.imperium_rank_points($1::jsonb)',[JSON.stringify(s)])).rows[0];let s=ready(),before=await score(s);s=act(s,{type:'repair',key:'flak',count:2},T);assert.deepEqual(await score(s),before);advance(s,T+1000000);assert.equal((await score(s)).building_points,before.building_points+9);
});
test('Every orbital type uses its own cost, robots and yard bonuses; partial damage remains separate',()=>{
 for(const key of ['flak','laser','rail','plasma']){let s=ready(),p=s.planets[1];p.disabledDefenses={[key]:2};p.ships[key]=1;p.hulls={[key]:[.5]};p.buildings.robotics=4;p.buildings.orbital=8;const q=repairQuote(p,key,2);assert.equal(q.ms,shipInfo(s,p,key,2).ms);assert.deepEqual(q.cost,{metal:Math.ceil(SHIPS[key].cost[0]*.7*2),crystal:Math.ceil(SHIPS[key].cost[1]*.7*2),fuel:0});s=act(s,{type:'repair',key,count:2},T);assert.equal(s.planets[1].ships[key],1);assert.deepEqual(s.planets[1].hulls[key],[.5]);assert.equal(repairQuote(s.planets[1],key,1).restore,false);validateSave(s);}
});
test('Restoration respects energy and segmented/offline progress',()=>{
 let s=ready();s.planets[1].buildings.solar=0;s=act(s,{type:'repair',key:'flak',count:2},T);advance(s,T+100000);assert.equal(s.planets[1].repairQueue[0].entries[0].hp,0);assert.equal(s.planets[1].ships.flak,0);validateSave(s);s.planets[1].buildings.solar=30;const a=structuredClone(s),b=structuredClone(s);advance(a,s.time+1000000);for(let t=s.time+1000;t<=s.time+1000000;t+=1000)advance(b,t);assert.equal(a.planets[1].ships.flak,2);assert.equal(b.planets[1].ships.flak,2);assert.equal(a.planets[1].repairQueue.length,0);assert.equal(b.planets[1].repairQueue.length,0);
});
