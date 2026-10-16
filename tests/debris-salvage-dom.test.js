import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {fixture,B} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';

test('Bergungsauftrag selects an own field, previews fuel and dispatches an empty freighter',async t=>{
 const w=fixture();w.now=Date.now();const state=w.saves[1].state;state.planets[0].ships.karawane=4;state.planets[0].resources.fuel=3000;w.planets[1].debris={metal:200,crystal:100,fuel:0};const canonical=processWorld(w,B,{type:'sync'});const s=canonical.saves[1].state;s.active='home';
 const {doc,api,w:browser}=ui(t,{state:s});let request;api.attach({authoritative:true,user:{id:B},now:canonical.now,pvp:projectPvP(canonical,B),gameRequest:async r=>{request=r;const n=processWorld(canonical,B,r);return {state:n.saves[1].state,pvp:projectPvP(n,B),revision:2};}});api.show('orders');doc.querySelector('[data-order-mode="salvage"]').click();
 const form=doc.getElementById('fleet-order-form');assert.ok(form);assert.equal(form.elements.namedItem('to').value,'g-orion-p1');assert.match(form.textContent,/200 Metall \/ 100 Kristall/);input(browser,form.querySelector('[data-fleet-ship="karawane"]'),1);assert.match(doc.getElementById('fleet-estimate').textContent,/Treibstoff gesamt/);assert.equal(form.querySelector('button[type="submit"]').disabled,false);
 form.dispatchEvent(new browser.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(request.action.type,'salvage');assert.deepEqual(JSON.parse(JSON.stringify(request.action.order)),{metal:0,crystal:0,fuel:0});assert.match(doc.body.textContent,/Trümmerbergung/);
});
