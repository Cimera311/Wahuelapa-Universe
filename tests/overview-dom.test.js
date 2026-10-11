import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,tick} from './helpers/game-ui.js';
import {newGame,stats,act} from '../src/engine.js';
import {vector} from '../src/config.js';
const number=text=>Number(text.replaceAll('.',''));
test('Overview sums real planet production, including energy shortages, and switches to active world',t=>{
 const {doc,api}=ui(t),s=api.state();s.planets[0].buildings.metal=8;s.planets[1].buildings.metal=6;s.planets[1].mult=[1.6,.8,1.2];s.planets[1].buildings.solar=0;s.planets[1].buildings.fusion=0;s.planets[1].buildings.tidal=0;
 api.show('overview');const read=()=>number(doc.querySelector('[data-production-resource="metal"]').textContent),expected=Math.floor(s.planets.reduce((sum,p)=>sum+stats(s,p).rates.metal,0));assert.equal(read(),expected);assert.equal(stats(s,s.planets[1]).ratio,0);
 doc.querySelector('[data-production-scope="local"]').click();assert.equal(read(),Math.floor(stats(s,s.planets[0]).rates.metal));doc.querySelector('[data-action="planet"][data-id="ferrum"]').click();assert.equal(read(),0);assert.match(doc.querySelector('.production-caption').textContent,/Ferrum/);
 const card=doc.querySelector('[data-id="ferrum"].overview-world');assert.match(card.textContent,/M 160 %/);assert.match(card.textContent,/M 6/);assert.match(card.textContent,/Werft 0/);assert.match(card.textContent,/Leistung 0 %/);assert.equal(card.type,'button');
});
test('Completed tutorial dismisses persistently, reopens from help and isolates accounts and new worlds',t=>{
 const {doc,api,w}=ui(t);api.state().planets[0].buildings.lab=2;api.state().planets[0].buildings.shipyard=1;api.state().discovered=['ferrum'];api.show('overview');assert.ok(doc.querySelector('[data-action="tutorial-dismiss"]'));doc.querySelector('[data-action="tutorial-dismiss"]').click();assert.equal(doc.querySelector('.tutorial-banner'),null);
 const s=structuredClone(api.state());s.reports=[];const preferences=Object.fromEntries(Object.keys(w.localStorage).filter(k=>k.includes("-tutorial-")).map(k=>[k,w.localStorage.getItem(k)]));const restored=ui(t,{state:s,preferences});restored.api.show('overview');assert.equal(restored.doc.querySelector('.tutorial-banner'),null);
 restored.api.settings();restored.doc.querySelector('[data-action="tutorial-reopen"]').click();assert.ok(restored.doc.querySelector('.tutorial-banner.completed'));restored.doc.querySelector('[data-action="tutorial-dismiss"]').click();restored.api.attach({user:{id:'other'},authoritative:false});restored.api.render();assert.ok(restored.doc.querySelector('.tutorial-banner.completed'));
 const fresh=ui(t,{state:newGame('New',s.created+1),preferences});fresh.api.show('overview');assert.ok(fresh.doc.querySelector('.tutorial-banner:not(.completed)'));assert.equal(fresh.doc.querySelector('[data-action="tutorial-dismiss"]'),null);
});
test('New orders stay compact and preserve their cancellation action inside details',async t=>{
 const {doc,api}=ui(t),s=api.state(),p=s.planets[0];p.buildings.shipyard=8;p.resources=vector([1e6,1e6,1e6]);Object.assign(s,act(s,{type:'ship',key:'titan',count:2},s.time));api.show('overview');const details=doc.querySelector('.overview-job-info details');assert.ok(details);assert.equal(details.open,false);assert.match(doc.querySelector('.overview-jobs').textContent,/2 × Titan/);assert.match(doc.querySelector('.overview-job-info').textContent,/Werft St. 8/);assert.ok(details.querySelector('[data-action="cancel-ship"]'));await tick();
});
