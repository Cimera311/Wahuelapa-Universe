import test from 'node:test';
import assert from 'node:assert/strict';
import {fleetInventory,fleetMissionProgress,fleetOverviewHTML} from '../src/fleet-overview.js';
import {ui,input} from './helpers/game-ui.js';

test('Global inventory aggregates orbit stock only and retains civil and defense categories',()=>{
 const planets=[{id:'a',name:'A',ships:{titan:67,starColony:1,laser:4}},{id:'b',name:'B',ships:{titan:2}}];
 assert.equal(fleetInventory(planets).find(x=>x.key==='titan').total,69);
 assert.deepEqual(fleetInventory(planets,'civil').map(x=>x.key),['starColony']);
 assert.deepEqual(fleetInventory(planets,'defense').map(x=>x.key),['laser']);
 assert.equal(fleetInventory(planets,'freighter').length,0);
 assert.match(fleetOverviewHTML([{id:'x',name:'<img src=x>',ships:{}}],{group:'planet'}),/&lt;img src=x&gt;/);
});
test('Return flight progress uses the current leg, not the original departure',()=>{
 assert.deepEqual(fleetMissionProgress({start:0,duration:1000,due:2000,phase:'return'},1500),{start:1000,end:2000,percent:50});
});
test('Grouping and filtering work globally, preserve disclosures and do not switch the active planet',t=>{
 const {doc,api}=ui(t);api.show('hangar');doc.querySelector('[data-action="fleet-group-nav"][data-group="hangar"]').click();
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();
 const active=api.state().active,card=doc.querySelector('[data-fleet-detail="ship:karawane"]');
 assert.match(card.textContent,/10 im Orbit/);card.open=false;
 doc.querySelector('[data-action="fleet-group"][data-value="planet"]').click();
 assert.equal(doc.querySelectorAll('.fleet-stock-card').length,2);
 doc.querySelector('[data-action="fleet-filter"][data-value="defense"]').click();
 assert.match(doc.querySelector('.fleet-stock-grid').textContent,/Keine Einheiten dieser Kategorie/);
 doc.querySelector('[data-action="fleet-filter"][data-value="all"]').click();
 doc.querySelector('[data-action="fleet-group"][data-value="ship"]').click();
 assert.equal(doc.querySelector('[data-fleet-detail="ship:karawane"]').open,false);
 assert.equal(api.state().active,active);
});
test('Overview route ignores route search and its edit button opens the route editor',t=>{
 const {w,doc,api}=ui(t),s=api.state();
 s.missions.push({id:800,type:'route',name:'Test route',fleet:{karawane:1},ship:'karawane',count:1,from:s.planets[0].id,to:s.planets[1].id,home:s.planets[0].id,stops:s.planets.map(p=>({planet:p.id,load:{},unload:{}})),rounds:0,repeat:true,start:s.time,due:s.time+60000,duration:60000,cargo:{metal:20,crystal:0,fuel:0}});
 api.show('routes');input(w,doc.getElementById('route-search'),'nothing matches');
 doc.querySelector('[data-action="fleet-group-nav"][data-group="hangar"]').click();
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();
 const overview=doc.getElementById('fleet-pane-overview'),route=overview.querySelector('.trade-route');
 assert.equal(route.hidden,false);assert.equal(route.querySelector('[role="progressbar"]').getAttribute('aria-valuemax'),'100');
 route.querySelector('[data-action="route-edit"]').click();
 assert.equal(doc.getElementById('fleet-pane-routes').hidden,false);
 assert.equal(doc.getElementById('route-form').dataset.routeId,'800');
});

test('Own partner and attack fleets use mission cards without adding foreign fleets to orbit totals',t=>{
 const {doc,api}=ui(t),s=api.state(),from=s.planets[0].id,to=s.planets[1].id;
 api.attach({pvp:{incoming:[],outgoing:[{id:'attack',from,to,status:'returning',fleet:{falke:3},arrival:s.time-1000,returnAt:s.time+1000}],social:{partners:[],missions:[{id:'own',own:true,kind:'support',status:'stationed',hostName:'Partner',from,to,fleet:{falke:5}},{id:'foreign',own:false,kind:'support',status:'stationed',hostName:'Foreign',from,to,fleet:{falke:99}}]}}});
 api.show('hangar');doc.querySelector('[data-action="fleet-group-nav"][data-group="hangar"]').click();
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();
 const overview=doc.getElementById('fleet-pane-overview');
 assert.match(overview.textContent,/Angriffe & Partnerflotten · 2/);
 assert.equal(overview.querySelectorAll('[data-social-op="recall"]').length,1);
 assert.match(overview.querySelector('[data-fleet-detail="ship:falke"]').textContent,/20 im Orbit/);
 assert.doesNotMatch(overview.textContent,/Foreign/);
 assert.match(overview.querySelector('.fleet-travel-card').textContent,/Rückflug/);
});

test('Waiting freighters show bound ships and remaining cargo without a flight countdown',t=>{
 const {doc,api}=ui(t),s=api.state();s.missions.push({id:900,type:'transport',ship:'transport',count:1,from:s.planets[0].id,to:s.planets[1].id,phase:'return',awaitingUnload:s.planets[0].id,cargo:{metal:123,crystal:0,fuel:0},start:s.time-60000,due:s.time,duration:60000});api.show('hangar');doc.querySelector('[data-action="fleet-group-nav"][data-group="hangar"]').click();
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();const card=doc.querySelector('.fleet-travel-card');assert.match(card.textContent,/Wartet auf Lagerplatz/);assert.match(card.textContent,/123/);assert.match(card.textContent,/Restladung bleibt an Bord/);assert.equal(card.querySelector('[data-due]'),null);assert.equal(card.querySelector('[role="progressbar"]').hidden,true);
});


test('Mini collapse-all closes all cards without changing fleet or filters and survives rerender',t=>{
 const {doc,api}=ui(t);
 api.show('hangar');
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();
 const cards=()=>[...doc.querySelectorAll('.fleet-overview [data-fleet-detail]')];
 const btn=doc.querySelector('[data-action="fleet-collapse-all"]');
 assert.ok(btn,'Mini button is present');
 assert.equal(btn.getAttribute('aria-label'),'Alle Flottenkarten zuklappen');
 assert.equal(btn.getAttribute('aria-controls'),'fleet-stock-grid');
 assert.ok(cards().length>1);
 assert.ok(cards().some(card=>card.open));
 const original=JSON.stringify(api.state().planets.map(p=>p.ships));
 btn.click();
 assert.ok(cards().every(card=>!card.open));
 assert.equal(JSON.stringify(api.state().planets.map(p=>p.ships)),original);
 assert.equal(doc.querySelector('[data-action="fleet-filter"][aria-pressed="true"]').dataset.value,'all');
 api.render();
 assert.ok(cards().every(card=>!card.open),'Rerender must keep all cards closed');
 doc.querySelector('[data-action="fleet-filter"][data-value="military"]').click();
 assert.ok(cards().every(card=>!card.open),'Filter change must not reopen cards');
 doc.querySelector('[data-action="fleet-group"][data-value="planet"]').click();
 assert.ok(cards().every(card=>!card.open),'Switching to planets must keep all cards collapsed');
 assert.equal(cards().length,2);
 const chosen=cards()[0];
 chosen.open=true;
 api.render();
 assert.equal(cards()[0].open,true,'Individual cards stay independently expandable');
 doc.querySelector('[data-action="fleet-collapse-all"]').click();
 assert.ok(cards().every(card=>!card.open));
 doc.querySelector('[data-action="fleet-group"][data-value="ship"]').click();
 assert.ok(cards().every(card=>!card.open),'Another grouping must not restore old expansion choices');
});

test('Fleet collapse-all does not affect underway missions or unrelated disclosure panels',t=>{
 const {doc,api}=ui(t);
 api.show('hangar');
 doc.querySelector('[data-action="fleet-section"][data-section="overview"]').click();
 const panel=doc.querySelector('#fleet-pane-overview');
 const missionCount=panel.querySelectorAll('.fleet-travel-card').length;
 const open=panel.querySelectorAll('[data-fleet-detail][open]').length;
 assert.ok(open>0);
 panel.querySelector('[data-action="fleet-collapse-all"]').click();
 assert.equal(panel.querySelectorAll('[data-fleet-detail][open]').length,0);
 assert.equal(panel.querySelectorAll('.fleet-travel-card').length,missionCount);
});
