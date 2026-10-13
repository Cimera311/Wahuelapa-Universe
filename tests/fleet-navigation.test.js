import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input} from './helpers/game-ui.js';
import {pvpView} from '../src/pvp-ui.js';
import {FLEET_GROUPS,fleetGroupFor} from '../src/fleet-navigation.js';

const select=(doc,key)=>doc.querySelector(`[data-action="fleet-section"][data-section="${key}"]`).click();
const group=(doc,key)=>doc.querySelector(`[data-action="fleet-group-nav"][data-group="${key}"]`).click();
test('Fleet entry opens overview and groups recall the last section without changing the active world',t=>{
 const {doc,api}=ui(t);const world=api.state().active;doc.querySelector('nav [data-tab="fleet"]').click();
 assert.equal(doc.getElementById('fleet-pane-overview').hidden,false);
 assert.equal(doc.querySelector('.fleet-navigation').dataset.activeGroup,'hangar');
 select(doc,'hangar');group(doc,'trade');assert.equal(doc.getElementById('fleet-pane-orders').hidden,false);
 select(doc,'routes');group(doc,'hangar');assert.equal(doc.getElementById('fleet-pane-hangar').hidden,false);
 group(doc,'trade');assert.equal(doc.getElementById('fleet-pane-routes').hidden,false);
 group(doc,'pvp');assert.equal(doc.querySelector('.fleet-navigation').dataset.activeGroup,'pvp');
 select(doc,'defense');group(doc,'hangar');group(doc,'pvp');assert.equal(doc.getElementById('fleet-pane-defense').hidden,false);
 assert.equal(api.state().active,world);
 assert.deepEqual(FLEET_GROUPS.pvp.sections,['pvp','defense','partners']);
 assert.equal(fleetGroupFor('reports'),'trade');
});
test('Reports navigation stays scroll-safe without changing other fleet sections',t=>{
 const {doc,api}=ui(t);
 api.show('reports');
 assert.equal(doc.querySelector('.fleet-navigation').dataset.activeSection,'reports');
 assert.equal(doc.querySelector('#fleet-pane-reports').hidden,false);
 api.show('hangar');
 assert.equal(doc.querySelector('.fleet-navigation').dataset.activeSection,'hangar');
});

test('Orders keep unsent amounts when navigating through another group',t=>{
 const {doc,w,api}=ui(t);api.show('orders');input(w,doc.querySelector('#fleet-order-form [name="metal"]'),321);
 group(doc,'hangar');group(doc,'trade');assert.equal(doc.querySelector('#fleet-order-form [name="metal"]').value,'321');
});
test('Group navigation uses the same direct sections and keyboard behavior at every width',t=>{
 const {doc,w,api}=ui(t);api.show('hangar');
 doc.getElementById('fleet-tab-hangar').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 assert.equal(doc.getElementById('fleet-pane-orbital').hidden,false);
 assert.equal(doc.activeElement.id,'fleet-tab-orbital');
 assert.equal(doc.querySelector('[data-action="fleet-more"]'),null);
 group(doc,'pvp');assert.deepEqual([...doc.querySelectorAll('.fleet-nav-sections button')].map(b=>b.dataset.section),['pvp','defense','partners']);
 doc.getElementById('fleet-tab-pvp').dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
 assert.equal(doc.activeElement.id,'fleet-tab-partners');
});
test('Attack and defense split the existing UI while retaining repair, reports and alerts',t=>{
 const {doc,api}=ui(t),state=api.state(),pvp={enabled:true,serverNow:state.time,colonies:[],incoming:[{commander:'Enemy',to:'home',arrival:state.time+60000}],outgoing:[],reports:[],features:{combatRules:2}};
 const defense=pvpView(state,pvp,null,false,{}, {section:'defense'}),attack=pvpView(state,pvp,null,false,{}, {section:'pvp'});
 assert.match(defense,/Verteidigung auf Aurelia/);assert.match(defense,/Angriff von Enemy/);assert.match(defense,/pvp-repair/);assert.match(defense,/reports-open/);
 assert.doesNotMatch(attack,/Angriff von Enemy/);assert.match(attack,/<h1>Angriff<\/h1>/);
 api.attach({pvp});api.show('hangar');const warning=doc.querySelector('main>.notice');assert.ok(warning.querySelector('[data-action="pvp-defense"]'));
 warning.querySelector('button').click();assert.equal(doc.getElementById('fleet-pane-defense').hidden,false);
 assert.equal(doc.querySelector('.fleet-navigation').dataset.activeGroup,'pvp');
});
