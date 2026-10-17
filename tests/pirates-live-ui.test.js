import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {fixture,A,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {vector} from '../src/config.js';
function mounted(t){
 let world=fixture();world.pirateVersion=1;world.piratePlayers=[];world.pirateConfig={flightTimeFactor:.1};world.settings.combat_engine=6;
 const p=world.saves[0].state.planets[0];p.buildings.warehouse=6;p.resources=vector([10000,10000,10000]);p.ships.falke=100;p.ships.spyProbe=1;p.ships.karawane=2;
 world=processWorld(world,A,{type:'pirate',action:{op:'open'}});
 const out=ui(t,{state:world.saves[0].state}),calls=[];
 const cloud={user:{id:A},authoritative:true,get now(){return world.now;},get pvp(){return projectPvP(world,A);},async gameRequest(request){calls.push(request);world=processWorld(world,A,{...request,eventId:'ui-'+calls.length,combatSeed:'ui-seed'});return {state:world.saves[0].state,pvp:this.pvp};}};
 out.api.attach(cloud);out.doc.querySelector('nav [data-tab="galaxy"]').click();out.doc.querySelector('[data-section="pirates"]').click();return {...out,calls,cloud};
}
test('Admin PvE planner uses available ships, keeps draft through refresh and submits a confirmed real attack',async t=>{
 const {doc,w,api,calls}=mounted(t);const form=doc.getElementById('pirate-fleet-form');assert.ok(form);
 assert.equal(doc.querySelector('.pirate-art img').getAttribute('src'),'./assets/pirates-meli-v1/smugglers.webp');
 assert.equal(new Set([...doc.querySelectorAll('.pirate-thumbnail img')].map(img=>img.getAttribute('src'))).size,5);
 assert.doesNotMatch(doc.querySelector('.pirate-art-caption').textContent,/Platzhalter|folgen/);
 const origin=form.querySelector('[name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));
 const updated=doc.getElementById('pirate-fleet-form');assert.ok(updated.querySelector('[data-fleet-ship="falke"]'));assert.equal(updated.querySelector('[data-fleet-ship="titan"]'),null);
 input(w,updated.querySelector('[data-fleet-ship="falke"]'),100);input(w,updated.querySelector('[data-fleet-ship="karawane"]'),1);
 assert.match(doc.getElementById('pirate-estimate').textContent,/Aurelia → Schmugglernest/);
 api.render();assert.equal(doc.querySelector('[data-fleet-ship="falke"]').value,'100');
 const current=doc.getElementById('pirate-fleet-form');current.querySelector('[name="ack"]').checked=true;current.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{type:'pirate',action:{op:'attack',station:'smugglers',from:'home',fleet:{karawane:1,falke:100}}});
 assert.match(doc.querySelector('.pirate-missions').textContent,/Hinflug/);
});
test('Spionage is dispatched separately from the selected origin',async t=>{
 const {doc,w,calls}=mounted(t);const origin=doc.querySelector('#pirate-fleet-form [name="from"]');origin.value='home';origin.dispatchEvent(new w.Event('change',{bubbles:true}));doc.querySelector('[data-action="pirate-scan"]').click();await tick();assert.equal(calls[0].action.op,'scan');
 assert.match(doc.querySelector('.pirate-missions').textContent,/Spionage/);
});
