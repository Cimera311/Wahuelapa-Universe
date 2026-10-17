import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {fixture,A,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {vector} from '../src/config.js';
function mounted(t,admin=true){
 let world=fixture();if(!admin)world.admins=[];world.pirateVersion=1;world.piratePlayers=[];world.pirateConfig={flightTimeFactor:.1};world.settings.combat_engine=6;
 const p=world.saves[0].state.planets[0];p.buildings.warehouse=6;p.resources=vector([10000,10000,10000]);p.ships.falke=100;p.ships.spyProbe=1;p.ships.karawane=2;
 world=processWorld(world,A,{type:'pirate',action:{op:'open'}});
 const out=ui(t,{state:world.saves[0].state}),calls=[];
 const cloud={user:{id:A},authoritative:true,get now(){return world.now;},get pvp(){return projectPvP(world,A);},async gameRequest(request){calls.push(request);world=processWorld(world,A,{...request,eventId:'ui-'+calls.length,combatSeed:'ui-seed'});return {state:world.saves[0].state,pvp:this.pvp};}};
 out.api.attach(cloud);out.doc.querySelector('nav [data-tab="galaxy"]').click();out.doc.querySelector('[data-section="pirates"]').click();return {...out,calls,cloud};
}
test('Admin PvE planner uses available ships, keeps draft through refresh and submits a real attack without an extra checkbox',async t=>{
 const {doc,w,api,calls}=mounted(t);const form=doc.getElementById('pirate-fleet-form');assert.ok(form);
 const origin=form.querySelector('[name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 const updated=doc.getElementById('pirate-fleet-form');assert.ok(updated.querySelector('[data-fleet-ship="falke"]'));assert.equal(updated.querySelector('[data-fleet-ship="titan"]'),null);
 input(w,updated.querySelector('[data-fleet-ship="falke"]'),100);input(w,updated.querySelector('[data-fleet-ship="karawane"]'),1);
 assert.match(doc.getElementById('pirate-estimate').textContent,/Aurelia → Schmugglernest/);
 api.render();assert.equal(doc.querySelector('[data-fleet-ship="falke"]').value,'100');
 const current=doc.getElementById('pirate-fleet-form');assert.equal(current.querySelector('[name="ack"]'),null);current.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{type:'pirate',action:{op:'attack',station:'smugglers',from:'home',fleet:{karawane:1,falke:100}}});
 assert.match(doc.querySelector('.pirate-flight-card').textContent,/Hinflug/);
});
test('Spionage is dispatched separately from the selected origin',async t=>{
 const {doc,w,calls}=mounted(t);const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));doc.querySelector('[data-action="pirate-scan"]').click();await tick();assert.equal(calls[0].action.op,'scan');
 assert.match(doc.querySelector('.pirate-flight-card').textContent,/Spionage/);
});

test('Ordinary player can launch a real attack while realm settings stay admin-only',async t=>{
 const {doc,w,calls}=mounted(t,false);assert.equal(doc.getElementById('pirate-config-form'),null);
 assert.doesNotMatch(doc.querySelector('.pirate-heading').textContent,/ADMIN-TEST/);
 const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 input(w,doc.querySelector('[data-fleet-ship="falke"]'),100);
 doc.getElementById('pirate-fleet-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.equal(calls[0].action.op,'attack');assert.ok(doc.querySelector('.pirate-flight-card'));
});
test('Admin still has the realm configuration form',t=>{
 const {doc}=mounted(t);assert.ok(doc.getElementById('pirate-config-form'));
});

test('PvE hangar range, exact input and shortcuts share one bounded launch manifest and survive refresh',async t=>{
 const {doc,w,api,calls}=mounted(t,false);
 const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 const range=doc.querySelector('[data-hangar-range="falke"]');input(w,range,43);
 assert.equal(doc.querySelector('[data-fleet-ship="falke"]').value,'43');assert.match(doc.querySelector('[data-hangar-total]').textContent,/43 Schiffe/);assert.ok(range.closest('article').classList.contains('is-selected'));
 assert.equal(range.getAttribute('aria-valuetext'),'43 von 100');assert.match(doc.getElementById('pirate-estimate').textContent,/Aurelia → Schmugglernest/);
 input(w,doc.querySelector('[data-fleet-ship="falke"]'),500);assert.equal(range.value,'100');
 input(w,doc.querySelector('[data-fleet-ship="falke"]'),-2);assert.equal(range.value,'0');assert.equal(range.closest('article').classList.contains('is-selected'),false);
 const cargo=doc.querySelector('[data-hangar-ship="karawane"]');cargo.querySelector('[data-hangar-count="all"]').click();
 assert.equal(cargo.querySelector('[data-hangar-range]').value,'2');assert.ok(Number(doc.querySelector('[data-hangar-capacity]').textContent.replaceAll('.',''))>0);
 cargo.querySelector('[data-hangar-count="none"]').click();assert.equal(cargo.querySelector('[data-fleet-ship]').value,'0');
 input(w,range,43);api.render();assert.equal(doc.querySelector('[data-hangar-range="falke"]').value,'43');
 doc.getElementById('pirate-fleet-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),{falke:43});
});
test('Changing origin or mission resets selection and limits the hangar to ships usable for that task',t=>{
 const {doc,w}=mounted(t,false);let origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 input(w,doc.querySelector('[data-hangar-range="falke"]'),80);
 const op=doc.querySelector('#pirate-fleet-form [name="op"]');op.value='salvage';op.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(doc.querySelector('[data-hangar-ship="falke"]'),null);assert.match(doc.querySelector('[data-hangar-total]').textContent,/0 Schiffe/);assert.ok(doc.querySelector('[data-hangar-ship="karawane"]'));
 origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='g-helion-p1';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(doc.querySelector('[data-fleet-ship="karawane"]').max,'4');assert.equal(doc.querySelector('[data-fleet-ship="karawane"]').value,'0');
});


test('Changed cloud snapshot releases PvE controls and preserves the selected fleet after sync',async t=>{
 const {doc,w,api,cloud}=mounted(t,false);
 const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 input(w,doc.querySelector('[data-hangar-range="falke"]'),37);
 const original=cloud.gameRequest.bind(cloud);cloud.gameRequest=async request=>{const result=await original(request);result.state.seq++;return result;};
 assert.equal(await api.sync(),true);
 assert.equal(doc.querySelector('[data-hangar-range="falke"]').disabled,false);
 assert.equal(doc.querySelector('[data-fleet-ship="falke"]').disabled,false);
 assert.equal(doc.querySelector('[data-fleet-ship="falke"]').value,'37');
 assert.equal(doc.querySelector('[data-hangar-ship="falke"] [data-hangar-count="all"]').disabled,false);
 assert.equal(doc.querySelector('#pirate-fleet-form [type="submit"]').disabled,false);
});
for(const fail of [false,true])test('A view rendered during an in-flight cloud sync unlocks after '+(fail?'failure':'success'),async t=>{
 const {doc,w,api,cloud}=mounted(t,false);
 const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 let complete;const original=cloud.gameRequest.bind(cloud);cloud.gameRequest=()=>new Promise((resolve,reject)=>{complete=async()=>fail?reject(Error('Offline')):resolve(await original({type:'sync'}));});
 const syncing=api.sync();api.render();assert.equal(doc.querySelector('[data-hangar-range="falke"]').disabled,true);
 await complete();assert.equal(await syncing,!fail);
 assert.equal(doc.querySelector('[data-hangar-range="falke"]').disabled,false);
 input(w,doc.querySelector('[data-hangar-range="falke"]'),22);assert.equal(doc.querySelector('[data-fleet-ship="falke"]').value,'22');
});
