import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {repairPlan} from '../src/repair-ui.js';
import {repairQuote} from '../src/repair.js';
import {newGame,act} from '../src/engine.js';
import {TARGETS} from '../src/config.js';
function ready(t){const s=newGame('Dock',Date.now()),p=s.planets[0];p.buildings.repairDock=1;p.buildings.solar=30;p.buildings.warehouse=20;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.resources={metal:712500,crystal:487500,fuel:10000};p.ships.titan=500;p.hulls={titan:Array(500).fill(.5)};p.disabledDefenses={flak:3};s.planets.push({...structuredClone(p),...TARGETS[0]});const u=ui(t,{state:s});u.api.show('repair');return {...u,p:u.api.state().planets[0],form:key=>u.doc.querySelector(`[data-repair-form] [name=key][value="${key}"]`)?.closest('form')};}
test('Repair plan matches exact backend quotes for known hulls, orbital restoration and energy ratios',()=>{
 const p={buildings:{repairDock:3,orbital:4,robotics:2},resources:{metal:1e7,crystal:1e7},hulls:{titan:[.8,.1,.5],flak:[.6]},disabledDefenses:{flak:3}};const before=structuredClone(p);
 for(const key of ['titan','flak'])for(const n of [1,2,3])for(const ratio of [1,.4,0]){const m=repairPlan(p,key,n,ratio),q=repairQuote(p,key,n,ratio);assert.deepEqual(m.quote.cost,q.cost);assert.equal(m.quote.ms,q.ms);assert.equal(m.estimated,false);}assert.deepEqual(p,before);
});
test('A 1000-unit repair wish survives tick and rerender with stock/material for 500',t=>{
 const {w,api,form}=ready(t);let f=form('titan');input(w,f.elements.namedItem('count'),1000);assert.equal(f.elements.namedItem('count').hasAttribute('max'),false);assert.equal(f.elements.namedItem('count').value,'1000');assert.equal(f.querySelector('[data-repair-range]').max,'500');assert.match(f.querySelector('[data-repair-quote]').textContent,/1.425.000/);assert.match(f.querySelector('[data-repair-quote]').textContent,/Planungsschätzung/);assert.match(f.querySelector('[data-repair-reason]').textContent,/500 beschädigte Einheiten fehlen/);assert.equal(f.querySelector('[type=submit]').disabled,true);api.tick();api.render();f=form('titan');assert.equal(f.elements.namedItem('count').value,'1000');assert.equal(f.querySelector('[data-repair-range]').value,'500');
});
test('Maximum includes worst hulls first and honors exact rounded costs',()=>{
 const p={buildings:{repairDock:1},resources:{metal:0,crystal:100000},hulls:{titan:[.9,.5,.1]}};p.resources.metal=repairQuote(p,'titan',2).cost.metal-1;const m=repairPlan(p,'titan',3);assert.equal(m.possible,1);assert.ok(m.missing[0].amount>0);assert.equal(m.estimated,false);
});
test('Card slider and Maximum submit exactly one order and leave another card draft untouched',async t=>{
 const {w,api,form}=ready(t);input(w,form('flak').elements.namedItem('count'),1000);const f=form('titan');input(w,f.querySelector('[data-repair-range]'),3);assert.equal(f.elements.namedItem('count').value,'3');f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[0].repairQueue.length,1);assert.equal(api.state().planets[0].repairQueue[0].count,3);assert.equal(form('flak').elements.namedItem('count').value,'1000');assert.equal(form('titan').elements.namedItem('count').value,'497');form('titan').querySelector('[data-repair-set="max"]').click();assert.equal(form('titan').elements.namedItem('count').value,form('titan').querySelector('[data-repair-range]').max);
});
test('Disabled and partially damaged platforms remain separate restoration batches',async t=>{
 const {w,api,form,p}=ready(t);p.ships.flak=2;p.hulls.flak=[.5,.8];api.render();let f=form('flak');assert.equal(f.elements.namedItem('count').value,'3');assert.match(f.textContent,/3 defekt/);f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[0].repairQueue[0].restore,true);f=form('flak');assert.equal(f.elements.namedItem('count').value,'2');assert.match(f.textContent,/2 beschädigt/);assert.equal(api.state().planets[0].ships.flak,2);
});
test('Cloud refresh preserves free plans and disclosures and unlocks the controls',async t=>{
 const {w,api,form}=ready(t);api.attach({user:{id:'dock'},authoritative:true,pvp:{incoming:[],features:{repairDock:true}},async gameRequest(){return {state:structuredClone(api.state())};}});api.render();input(w,form('titan').elements.namedItem('count'),1000);form('titan').querySelector('details').open=true;const syncing=api.sync();api.render();await syncing;assert.equal(form('titan').elements.namedItem('count').value,'1000');assert.equal(form('titan').elements.namedItem('count').disabled,false);assert.equal(form('titan').querySelector('[data-repair-range]').disabled,false);assert.equal(form('titan').querySelector('details').open,true);
});
test('Depleted stock keeps an oversized draft visible, and repair drafts stay local to their planet',t=>{
 const {w,api,doc,form,p}=ready(t);input(w,form('titan').elements.namedItem('count'),1000);p.hulls.titan=[];api.render();assert.equal(form('titan').elements.namedItem('count').value,'1000');assert.equal(form('titan').querySelector('[data-repair-range]').disabled,true);assert.equal(form('titan').querySelector('[type=submit]').disabled,true);const select=doc.querySelector('#planet-select');select.value='ferrum';select.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(form('titan').elements.namedItem('count').value,'500');
});
test('Invalid or oversized drafts cannot dispatch a repair command',async t=>{
 const {w,api,form}=ready(t);const f=form('titan');for(const n of [0,-1,1.5,1000,'']){input(w,f.elements.namedItem('count'),n);f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[0].repairQueue?.length||0,0);}assert.equal(f.querySelector('[type=submit]').disabled,true);
});
test('Repair plans do not cross account boundaries on rerender',t=>{
 const {w,api,form}=ready(t);api.attach({user:{id:'a'},authoritative:true,pvp:{incoming:[],features:{repairDock:true}}});api.render();input(w,form('titan').elements.namedItem('count'),1000);api.attach({user:{id:'b'},authoritative:true,pvp:{incoming:[],features:{repairDock:true}}});api.render();assert.equal(form('titan').elements.namedItem('count').value,'500');
});
test('Full dock queue and unsupported servers keep repair dispatch blocked',async t=>{
 const {w,api,form,doc}=ready(t);let s=api.state();for(let i=0;i<20;i++)s=act(s,{type:'repair',key:'titan',count:1},s.time);Object.assign(api.state(),s);api.render();let f=form('titan');input(w,f.elements.namedItem('count'),1);assert.equal(f.querySelector('[type=submit]').disabled,true);assert.match(f.querySelector('[type=submit]').textContent,/Alle Auftragsplätze/);f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(api.state().planets[0].repairQueue.length,20);api.attach({user:{id:'a'},authoritative:true,pvp:{incoming:[],features:{}}});api.render();assert.equal(doc.querySelector('[data-repair-form]'),null);assert.match(doc.querySelector('main').textContent,/benötigt die neue Serverversion/);
});
