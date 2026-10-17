import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {newGame,act,advance} from '../src/engine.js';
import {TARGETS,TECHS,vector} from '../src/config.js';
const zero=()=>vector([0,0,0]);
const stops=()=>[{planet:'home',load:zero(),unload:zero()},{planet:'ferrum',load:zero(),unload:{metal:'max',crystal:'max',fuel:'max'}}];
function mounted(t,{editing=false,pending=false,paused=false,noFree=false}={}){
 let s=newGame('Routen',Date.now());for(const [k,v]of Object.entries(TECHS))s.tech[k]=v.max;
 const p=s.planets[0];p.buildings.warehouse=10;p.resources=vector([100000,100000,100000]);p.ships.karawane=5;p.ships.atlas=2;p.ships.falke=10;s.planets.push({...structuredClone(p),...TARGETS[0]});
 if(editing){s=act(s,{type:'route',name:'Versorgung',fleet:{karawane:2},stops:stops(),repeat:true},s.time);
  if(pending)s=act(s,{type:'edit-route',id:s.missions[0].id,name:'Mehr Frachter',fleet:{atlas:4},stops:stops(),repeat:true},s.time);
  if(paused){s=act(s,{type:'pause-route',id:s.missions[0].id},s.time);let m=s.missions[0];while(m.index!==0){advance(s,m.due);m=s.missions[0];}advance(s,m.due);assert.equal(s.missions[0].paused,true);}
  if(noFree)s.planets[0].ships.karawane=0;
 }
 const out=ui(t,{state:s}),calls=[];out.api.attach({user:{id:'a'},authoritative:true,pvp:{incoming:[],features:{routePause:true}},async gameRequest(request){calls.push(request);return {state:request.type==='sync'?structuredClone(out.api.state()):act(out.api.state(),request.action,out.api.state().time)};}});
 out.api.show('routes');out.doc.querySelector(editing?'[data-action="route-edit"]':'[data-action="route-new"]').click();return {...out,calls};
}
test('New mixed route reads exact slider fleet and stop rules, and launches once',async t=>{
 const {doc,w,calls,api}=mounted(t);const form=doc.getElementById('route-form');assert.equal(form.querySelector('[data-hangar-ship="falke"]'),null);assert.equal(form.querySelector('[data-fleet-adjust]'),null);
 input(w,form.querySelector('[data-hangar-range="karawane"]'),2);input(w,form.querySelector('[data-hangar-range="atlas"]'),1);input(w,form.elements.namedItem('name'),'Kristallrunde');
 assert.match(form.querySelector('[data-hangar-total]').textContent,/3 Schiffe/);assert.match(doc.getElementById('route-estimate').textContent,/je Runde/);assert.equal(form.querySelector('[type=submit]').disabled,false);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].action.type,'route');assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),{karawane:2,atlas:1});assert.equal(calls[0].action.stops[1].unload.metal,'max');assert.equal(api.state().missions[0].name,'Kristallrunde');
});
test('Editing includes bound route ships once even with no free ships at home',async t=>{
 const {doc,w,calls,api}=mounted(t,{editing:true,noFree:true}),form=doc.getElementById('route-form'),ship=form.querySelector('[data-fleet-ship="karawane"]');assert.equal(ship.max,'2');assert.equal(ship.value,'2');assert.match(ship.closest('article').textContent,/0 frei · 2 auf Route/);assert.doesNotMatch(doc.getElementById('route-estimate').textContent,/Verfügbarkeit wird/);
 input(w,form.elements.namedItem('name'),'Neue Stopps');form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].action.type,'edit-route');assert.equal(api.state().planets[0].ships.karawane,0);assert.equal(api.state().missions[0].fleet.karawane,2);assert.equal(api.state().missions[0].pending.name,'Neue Stopps');
});
test('An existing pending replacement above current stock keeps its exact count and remains editable',async t=>{
 const {doc,w,calls,api}=mounted(t,{editing:true,pending:true}),form=doc.getElementById('route-form'),ship=form.querySelector('[data-fleet-ship="atlas"]');assert.equal(ship.value,'4');assert.equal(ship.max,'4');assert.equal(ship.checkValidity(),true);assert.match(ship.closest('article').textContent,/2 verfügbar · 4 vorgemerkt/);assert.match(doc.getElementById('route-estimate').textContent,/Fehlen Schiffe, bleibt die bisherige Route aktiv/);
 ship.closest('article').querySelector('[data-hangar-count="all"]').click();assert.equal(ship.value,'2');input(w,form.querySelector('[data-hangar-range="atlas"]'),4);input(w,form.elements.namedItem('name'),'Später mehr');form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),{atlas:4});assert.equal(api.state().missions[0].fleet.karawane,2);assert.equal(api.state().missions[0].pending.fleet.atlas,4);assert.equal(api.state().planets[0].ships.atlas,2);
});
test('Paused route edits immediately reuse bound ships without duplicating them',async t=>{
 const {doc,w,api,calls}=mounted(t,{editing:true,paused:true,noFree:true}),form=doc.getElementById('route-form');assert.equal(form.querySelector('[data-hangar-range="karawane"]').max,'2');input(w,form.querySelector('[data-hangar-range="karawane"]'),1);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(api.state().missions[0].paused,true);assert.equal(api.state().missions[0].fleet.karawane,1);assert.equal(api.state().planets[0].ships.karawane,1);assert.equal(api.state().missions[0].pending,undefined);
});
test('Paused route cannot save an immediate expansion when its draft stock is no longer available',t=>{
 const {doc,w,api}=mounted(t,{editing:true,paused:true});input(w,doc.querySelector('#route-form [data-hangar-range="karawane"]'),4);api.state().planets[0].ships.karawane=0;api.render();const form=doc.getElementById('route-form');assert.equal(form.querySelector('[data-fleet-ship="karawane"]').value,'4');assert.equal(form.querySelector('[type=submit]').disabled,true);assert.match(doc.getElementById('route-estimate').textContent,/Nicht genügend freie oder auf dieser Route gebundene Schiffe/);
});
test('Cloud refresh retains route ranges, name and stop quantities, then releases controls',async t=>{
 const {doc,w,api}=mounted(t);let form=doc.getElementById('route-form');input(w,form.querySelector('[data-hangar-range="karawane"]'),2);input(w,form.elements.namedItem('name'),'Entwurf');const load=form.querySelector('.route-stop [name="load-metal"]');input(w,load,400);
 const syncing=api.sync();api.render();await syncing;form=doc.getElementById('route-form');assert.equal(form.querySelector('[data-hangar-range="karawane"]').value,'2');assert.equal(form.querySelector('[data-hangar-range="karawane"]').disabled,false);assert.equal(form.elements.namedItem('name').value,'Entwurf');assert.equal(form.querySelector('.route-stop [name="load-metal"]').value,'400');
});
