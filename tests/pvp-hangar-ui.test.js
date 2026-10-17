import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {fixture,A,T} from './helpers/pvp-fixture.js';
import {processWorld,prepareWorld,projectPvP} from '../src/server-world.js';
import {GALAXY_SYSTEMS} from '../src/galaxy.js';
function mounted(t){
 let world=prepareWorld(fixture());const p=world.saves[0].state.planets[1];Object.assign(p.ships,{falke:100,titan:4,karawane:6});p.resources.fuel=100000;
 const out=ui(t,{state:world.saves[0].state}),calls=[],overrides={};
 const galaxy={systems:GALAXY_SYSTEMS,planets:world.planets.map(q=>({...q.meta,owner:q.owner_id===A?'mine':'foreign',reserved:false,surveyed:true,commander:q.owner_id===A?'Commander':'Rivale'})),missions:[]};
 const cloud={user:{id:A},authoritative:true,get now(){return overrides.clock??world.now;},get pvp(){return {...projectPvP(world,A),...overrides};},async gameRequest(request){calls.push(request);world=processWorld(world,A,{...request,eventId:'pvp-ui-'+calls.length,combatSeed:'ui'});return {state:world.saves[0].state,pvp:this.pvp};}};
 out.api.attach(cloud);out.api.setGalaxy(galaxy);out.api.show('pvp');return {...out,calls,overrides,cloud};
}
test('PvP slider and exact fields retain raw ship names and send the selected real fleet exactly once',async t=>{
 const {doc,w,api,calls}=mounted(t);const form=doc.getElementById('pvp-attack-form');assert.ok(form);
 assert.equal(form.querySelector('[name="falke"]').name,'falke');assert.equal(form.querySelector('[name="fleet-falke"]'),null);assert.equal(form.querySelector('[data-hangar-ship="donner"]'),null);assert.equal(form.querySelector('[data-hangar-ship="probe"]'),null);
 input(w,form.querySelector('[data-hangar-range="falke"]'),50);input(w,form.querySelector('[data-fleet-ship="titan"]'),2);input(w,form.querySelector('[data-hangar-range="karawane"]'),3);
 assert.equal(form.querySelector('[data-fleet-ship="falke"]').value,'50');assert.equal(form.querySelector('[data-hangar-range="titan"]').value,'2');assert.match(form.querySelector('[data-hangar-total]').textContent,/55 Schiffe/);assert.match(form.querySelector('#pvp-estimate').textContent,/Startbereit/);assert.ok(Number(form.querySelector('[data-hangar-capacity]').textContent.replaceAll('.',''))>0);
 api.render();const current=doc.getElementById('pvp-attack-form');assert.equal(current.querySelector('[data-hangar-range="falke"]').value,'50');assert.equal(current.querySelector('[type="submit"]').disabled,false);
 current.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].type,'attack');assert.deepEqual(JSON.parse(JSON.stringify(calls[0].action.fleet)),{falke:50,titan:2,karawane:3});assert.equal(calls[0].action.to,'g-orion-p1');
});
test('Global and individual shortcuts keep PvP cards, ranges and start readiness synchronized',t=>{
 const {doc,w}=mounted(t);const form=doc.getElementById('pvp-attack-form');form.querySelector('[data-action="pvp-select-all"]').click();
 assert.equal(form.querySelector('[data-hangar-range="falke"]').value,'100');assert.equal(form.querySelector('[data-hangar-ship="falke"]').classList.contains('is-selected'),true);
 form.querySelector('[data-action="pvp-select-none"]').click();assert.equal(form.querySelector('[data-hangar-range="falke"]').value,'0');assert.equal(form.querySelector('[type="submit"]').disabled,true);
 form.querySelector('[data-hangar-ship="karawane"] [data-hangar-count="all"]').click();assert.equal(form.querySelector('[type="submit"]').disabled,true);assert.match(form.querySelector('#pvp-estimate').textContent,/mindestens ein Kriegsschiff/);
 input(w,form.querySelector('[data-hangar-range="falke"]'),10);assert.equal(form.querySelector('[type="submit"]').disabled,false);
});
for(const kind of ['protection','slots','paused','fuel'])test('PvP launch remains blocked for '+kind+' including forged submit',async t=>{
 const {doc,w,api,calls,overrides}=mounted(t);if(kind==='protection')overrides.colonies=[{id:'g-orion-p1',protectedUntil:T+60000}];
 if(kind==='slots'){overrides.attackCapacity=1;overrides.pirates={missions:[{kind:'attack',status:'returning'}]};}
 if(kind==='paused')overrides.enabled=false;if(kind==='fuel')api.state().planets[1].resources.fuel=0;api.render();
 const form=doc.getElementById('pvp-attack-form');input(w,form.querySelector('[data-hangar-range="falke"]'),10);assert.equal(form.querySelector('[type="submit"]').disabled,true);
 assert.match(form.querySelector('#pvp-estimate').textContent,kind==='protection'?/Gründungsschutz/:kind==='slots'?/Alle Angriffsplätze/:kind==='paused'?/pausiert/:/Nicht genug Treibstoff/);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,0);
});
test('A stale PvP selection is visible and blocked rather than silently reduced after refresh',t=>{
 const {doc,w,api}=mounted(t);input(w,doc.querySelector('#pvp-attack-form [data-hangar-range="falke"]'),50);api.state().planets[1].ships.falke=2;api.render();
 const form=doc.getElementById('pvp-attack-form');assert.equal(form.querySelector('[name="falke"]').value,'50');assert.equal(form.querySelector('[type="submit"]').disabled,true);assert.match(form.querySelector('#pvp-estimate').textContent,/Nicht genügend verfügbare Falke/);
});

test('Target protection expires without replacing the slider or losing the selected fleet',t=>{
 const {doc,w,api,overrides}=mounted(t);overrides.colonies=[{id:'g-orion-p1',protectedUntil:T+1000}];api.render();
 const slider=doc.querySelector('#pvp-attack-form [data-hangar-range="falke"]');input(w,slider,10);assert.equal(doc.querySelector('#pvp-attack-form [type="submit"]').disabled,true);
 overrides.clock=T+1001;api.tick();assert.equal(doc.querySelector('#pvp-attack-form [type="submit"]').disabled,false);assert.equal(doc.querySelector('#pvp-attack-form [data-hangar-range="falke"]'),slider);assert.equal(slider.value,'10');
});
test('A cloud sync preserves the PvP fleet and releases all new controls after a busy render',async t=>{
 const {doc,w,api}=mounted(t);input(w,doc.querySelector('#pvp-attack-form [data-hangar-range="falke"]'),30);
 const syncing=api.sync();api.render();await syncing;
 const form=doc.getElementById('pvp-attack-form');assert.equal(form.querySelector('[data-hangar-range="falke"]').disabled,false);assert.equal(form.querySelector('[name="falke"]').value,'30');assert.equal(form.querySelector('[type="submit"]').disabled,false);
});
