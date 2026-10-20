import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,stats} from '../src/engine.js';
import {validateSave} from '../src/storage.js';
import {repairQuote,repairCount,orbitCondition,repairMaterials,repairRefund} from '../src/repair.js';
import {processWorld} from '../src/server-world.js';
import {fixture,A,B,T,ID} from './helpers/pvp-fixture.js';
import {ui,input,tick} from './helpers/game-ui.js';
const ready=()=>{const s=newGame('Repair',T),p=s.planets[0];p.buildings.repairDock=1;p.buildings.shipyard=2;p.buildings.warehouse=10;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.resources={metal:1000000,crystal:1000000,fuel:1000000};p.ships.titan=122;p.hulls={titan:Array(36).fill(.5)};return s;};
test('Dock quote matches agreed costs and time, reserves worst hulls and releases ships individually',()=>{
 let s=ready(),p=s.planets[0];assert.deepEqual(repairQuote(p,'titan',36).cost,{metal:51300,crystal:35100,fuel:0});assert.equal(repairQuote(p,'titan',36).ms,6480000);
 s=act(s,{type:'repair',key:'titan',count:36},T);p=s.planets[0];assert.equal(p.ships.titan,86);assert.equal(repairCount(p,'titan'),36);assert.equal(orbitCondition(p,'titan').total,122);assert.equal(p.hulls.titan,undefined);assert.equal(s.planets[0].shipjob,null);validateSave(s);
 advance(s,T+90000);assert.equal(p.repairQueue[0].entries[0].hp,.75);assert.equal(p.ships.titan,86);assert.deepEqual(repairRefund(p.repairQueue[0]),{metal:50587,crystal:34612,fuel:0});
 advance(s,T+180000);assert.equal(p.ships.titan,87);assert.equal(p.repairQueue[0].completed,1);validateSave(s);
 advance(s,T+6480000);assert.equal(p.ships.titan,122);assert.equal(p.repairQueue.length,0);assert.equal(orbitCondition(p,'titan').damaged,0);
});
test('Dock work is deterministic offline and respects energy, locked bonuses and independent queues',()=>{
 let s=ready();s.planets[0].hulls.titan=[.8,.2];s=act(s,{type:'repair',key:'titan',count:2},T);assert.equal(s.planets[0].repairQueue[0].entries[0].hp,.2);
 const a=structuredClone(s),b=structuredClone(s);advance(a,T+360000);for(let t=T+1000;t<=T+360000;t+=1000)advance(b,t);assert.equal(a.planets[0].ships.titan,b.planets[0].ships.titan);assert.equal(a.planets[0].repairQueue.length,b.planets[0].repairQueue.length);
 let zero=ready();zero.planets[0].buildings.solar=0;zero=act(zero,{type:'repair',key:'titan',count:1},T);advance(zero,T+3600000);assert.equal(zero.planets[0].repairQueue[0].entries[0].hp,.5);validateSave(zero);
 zero.planets[0].buildings.solar=3;advance(zero,zero.time+180000);assert.equal(zero.planets[0].repairQueue.length,0);
 let level=ready();level.planets[0].buildings.repairDock=2;assert.equal(repairQuote(level.planets[0],'titan',1).ms,165600);
});
test('Cancellation returns only unspent material and the current damaged hull without duplication',()=>{
 let s=act(ready(),{type:'repair',key:'titan',count:1},T);advance(s,T+90000);const id=s.planets[0].repairQueue[0].id,metal=s.planets[0].resources.metal;
 s=act(s,{type:'cancel-repair',id},T+90000);const p=s.planets[0];assert.equal(p.ships.titan,122);assert.equal(p.hulls.titan.at(-1),.75);assert.equal(p.resources.metal,metal+712);assert.equal(p.repairQueue.length,0);assert.throws(()=>act(s,{type:'cancel-repair',id}));validateSave(s);
});
test('Dock requires building and valid counts; malformed queues cannot enter saved state',()=>{
 const s=ready();s.planets[0].buildings.repairDock=0;assert.throws(()=>act(s,{type:'repair',key:'titan',count:1}),/Reparaturdock/);
 for(const count of [0,-1,37,1.5,NaN])assert.throws(()=>act(ready(),{type:'repair',key:'titan',count}));
 const pending=act(ready(),{type:'repair',key:'titan',count:1},T);for(const mutate of [j=>j.entries[0].hp=0,j=>j.entries[0].credit.metal=-1,j=>j.completed=2,j=>j.id=0,j=>j.entries[0].workRemaining=Infinity]){const bad=structuredClone(pending);mutate(bad.planets[0].repairQueue[0]);assert.throws(()=>validateSave(bad));}
});
function attacked(dockShips,attackerShips){const w=fixture(),d=w.saves[1].state,p=d.planets[1];p.buildings.repairDock=1;p.buildings.solar=10;p.resources.metal=p.resources.crystal=1000000;p.ships.titan=dockShips;p.hulls={titan:Array(dockShips).fill(.5)};w.saves[1].state=act(d,{type:'repair',planet:p.id,key:'titan',count:dockShips},T);const a=w.saves[0].state.planets[1];a.ships.titan=attackerShips;a.buildings.warehouse=10;a.resources.fuel=1000000;const launched=processWorld(w,A,{type:'attack',eventId:ID,combatSeed:'dock-attack',action:{from:a.id,to:p.id,fleet:{titan:attackerShips}}});launched.attacks[0].arrival_at=T+1;launched.attacks[0].return_at=T+1000;launched.now=T+1;return processWorld(launched,A,{type:'sync'});}
test('Dock ships defend and can be destroyed; losses remove their paid orders, never resurrect them',()=>{
 const w=attacked(1,100),p=w.saves[1].state.planets[1];assert.equal(p.ships.titan,0);assert.equal(p.repairQueue.length,0);assert.equal(w.attacks[0].report.defenderBefore.titan,1);assert.equal(w.attacks[0].report.defenderAfter.titan,0);advance(w.saves[1].state,T+1000000);assert.equal(p.ships.titan,0);validateSave(w.saves[1].state);
});
test('Surviving dock units retain identity and require new material for new hull damage',()=>{
 const w=attacked(2,1),d=w.saves[1].state,p=d.planets[1];assert.ok(p.repairQueue.length);const j=p.repairQueue[0],cost=repairMaterials(j);assert.ok(cost.metal>0);assert.equal(p.ships.titan,0);const before=j.entries.map(e=>e.hp);advance(d,T+10000);assert.deepEqual(j.entries.map(e=>e.hp),before);const resumed=act(d,{type:'resume-repair',planet:p.id,id:j.id},d.time);assert.equal(repairMaterials(resumed.planets[1].repairQueue[0]).metal,0);validateSave(resumed);
});
test('Reserved ships cannot leave via stationing or PvP',()=>{
 const w=fixture(),s=w.saves[0].state,p=s.planets[1];p.buildings.repairDock=1;p.ships.titan=1;p.hulls={titan:[.5]};w.saves[0].state=act(s,{type:'repair',planet:p.id,key:'titan',count:1},T);
 assert.throws(()=>processWorld(w,A,{type:'attack',eventId:ID,action:{from:p.id,to:w.saves[1].state.active,fleet:{titan:1}}}),/verfügbare/);
 assert.throws(()=>act(w.saves[0].state,{type:'station',planet:p.id,to:'home',fleet:{titan:1}},T),/verfügbare|Anzahl/);
});
test('Mobile hangar exposes local damage and opens a costed dock form; quote and start are wired',async t=>{
 const s=ready(),{doc,w,api}=ui(t,{state:s});api.show('overview');doc.querySelector('nav [data-tab="fleet"]').click();assert.match(doc.querySelector('.fleet-stock-grid').textContent,/36 beschädigt/);doc.querySelector('[data-action="repair-open"]').click();assert.equal(doc.getElementById('fleet-pane-repair').hidden,false);assert.match(doc.querySelector('[data-repair-quote]').textContent,/51.300/);input(w,doc.querySelector('[data-repair-form] [name=count]'),1);assert.match(doc.querySelector('[data-repair-quote]').textContent,/1.425/);doc.querySelector('[data-repair-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[0].repairQueue.length,1);assert.match(doc.querySelector('.repair-queue').textContent,/1 im Dock/);
});
test('Rank points count dock ships exactly once and preserve in-flight fleets and orbital classification',async t=>{
 const {PGlite}=await import('@electric-sql/pglite'),{readFileSync}=await import('node:fs');const db=new PGlite();t.after(()=>db.close());
 await db.exec('create role anon;create role authenticated;');
 const base=readFileSync('supabase/leaderboard.sql','utf8');await db.exec(base.slice(0,base.indexOf('create or replace function public.imperium_leaderboard')));await db.exec(readFileSync('supabase/repair-dock.sql','utf8'));
 const s=ready(),score=async state=>(await db.query('select * from public.imperium_rank_points($1::jsonb)',[JSON.stringify(state)])).rows[0],before=await score(s);const pending=act(s,{type:'repair',key:'titan',count:36},T);assert.deepEqual(await score(pending),before);
 const pendingPlanet=pending.planets[0];pendingPlanet.ships.plasma=2;pendingPlanet.hulls.plasma=[.5];const prePlasma=await score(pending);const withPlasma=act(pending,{type:'repair',key:'plasma',count:1},T);assert.deepEqual(await score(withPlasma),prePlasma);
 withPlasma.missions=[{fleet:{titan:2}}];assert.equal((await score(withPlasma)).fleet_points,prePlasma.fleet_points+370);
});
