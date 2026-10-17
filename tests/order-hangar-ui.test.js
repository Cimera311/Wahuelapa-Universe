import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {cargoCapacity} from '../src/engine.js';

for(const mode of ['deliver','collect','station'])test('Hangar sliders submit the exact '+mode+' fleet once and retain draft quantities on refresh',async t=>{
 const {w,doc,api}=ui(t),calls=[];api.state().planets[0].ships.spyProbe=2;
 api.attach({user:{id:'a'},authoritative:true,pvp:{incoming:[],features:{fleetPlanning:true,cargoRetention:true}},async gameRequest(request){calls.push(request);return {state:structuredClone(api.state())};}});
 api.show('orders');doc.querySelector('[data-order-mode="'+mode+'"]').click();let form=doc.getElementById('fleet-order-form');
 assert.equal(form.querySelector('[data-fleet-adjust]'),null);
 input(w,form.querySelector('[data-hangar-range="karawane"]'),2);input(w,form.querySelector('[data-hangar-range="atlas"]'),1);
 const expected={karawane:2,atlas:1};
 if(mode==='station'){
  input(w,form.querySelector('[data-hangar-range="falke"]'),3);input(w,form.querySelector('[data-hangar-range="spyProbe"]'),1);expected.falke=3;expected.spyProbe=1;
  assert.match(form.querySelector('[data-hangar-ship="spyProbe"] summary').textContent,/Zivilschiff/);
 }else{
  assert.equal(form.querySelector('[data-hangar-ship="falke"]'),null);assert.equal(form.querySelector('[data-hangar-ship="spyProbe"]'),null);
  input(w,form.elements.namedItem('metal'),100);
 }
 assert.match(form.querySelector('#fleet-estimate').textContent,/Laderaum/);
 api.render();form=doc.getElementById('fleet-order-form');assert.equal(form.querySelector('[data-hangar-range="karawane"]').value,'2');assert.equal(form.querySelector('[data-fleet-ship="atlas"]').value,'1');
 assert.equal(form.querySelector('[type="submit"]').disabled,false);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.equal(calls.length,1);assert.equal(calls[0].action.type,mode);assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),expected);
 if(mode!=='station')assert.equal(calls[0].action.order.metal,100);
});
test('Order hangar shortcuts, exact quantity and cargo shortcuts stay synchronized',t=>{
 const {w,doc,api}=ui(t);api.show('orders');const form=doc.getElementById('fleet-order-form'),card=form.querySelector('[data-hangar-ship="karawane"]');
 card.querySelector('[data-hangar-count="all"]').click();assert.equal(card.querySelector('[data-hangar-range]').value,'5');
 input(w,card.querySelector('[data-fleet-ship]'),100);assert.equal(card.querySelector('[data-fleet-ship]').value,'5');
 input(w,card.querySelector('[data-hangar-range]'),2);assert.equal(card.querySelector('[data-fleet-ship]').value,'2');
 const capacity=cargoCapacity(api.state(),2,'karawane');assert.equal(form.querySelector('[data-hangar-capacity]').textContent,capacity.toLocaleString('de-DE'));
 const metal=form.elements.namedItem('metal');metal.closest('.cargo-control').querySelector('[data-cargo-fraction="half"]').click();assert.equal(Number(metal.value),Math.ceil(capacity/2));
 card.querySelector('[data-hangar-count="none"]').click();assert.equal(card.querySelector('[data-fleet-ship]').value,'0');assert.equal(card.classList.contains('is-selected'),false);assert.equal(form.querySelector('[type="submit"]').disabled,true);
});
test('Debris salvage uses the shared hangar and sends only the chosen freighters',async t=>{
 const {w,doc,api}=ui(t),calls=[],target=api.state().planets[1];Object.assign(target,{system:'helion',slot:1,x:520,y:400});api.state().galaxy={x:500,y:960};
 api.attach({user:{id:'a'},authoritative:true,pvp:{incoming:[],debris:[{planet:target.id,metal:1000,crystal:500,fuel:0}],features:{fleetPlanning:true,debrisSalvage:true}},async gameRequest(request){calls.push(request);return {state:structuredClone(api.state())};}});
 api.show('orders');doc.querySelector('[data-order-mode="salvage"]').click();const form=doc.getElementById('fleet-order-form');
 assert.equal(form.querySelector('[data-hangar-ship="falke"]'),null);input(w,form.querySelector('[data-hangar-range="karawane"]'),2);assert.equal(form.querySelector('[type="submit"]').disabled,false);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].action.type,'salvage');assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),{karawane:2});assert.equal(calls[0].action.to,target.id);
});
