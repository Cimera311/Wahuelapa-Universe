import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {newGame} from '../src/engine.js';
import {pirateMissionProgress,pirateStationCard,updatePirateFlights} from '../src/pirates-ui.js';
const time=1700000000000;
const mission=(patch={})=>({id:'flight-1',station:'smugglers',kind:'scan',from:'home',status:'outbound',startedAt:time,due:time+60000,duration:60000,fleet:{spyProbe:1},cargo:{metal:0,crystal:0,fuel:0},...patch});
test('Actual phase timestamps determine outward and return positions; due flights await server confirmation',()=>{
 assert.equal(pirateMissionProgress(mission(),time+15000).position,25);
 assert.equal(pirateMissionProgress(mission({status:'returning',due:time+120000}),time+75000).position,75);
 assert.equal(pirateMissionProgress(mission(),time+80000).position,100);
 assert.equal(pirateMissionProgress(mission(),time+80000).pending,true);
 assert.equal(pirateMissionProgress(mission({status:'returning',awaitingUnload:true}),time+80000).position,0);
});
test('Flights are grouped under the correct station without nesting controls or dropping parallel missions',()=>{
 const state=newGame(),station={id:'smugglers',name:'Schmugglernest',tier:1,sensor:1,enabled:true};
 const html=pirateStationCard(station,'smugglers',[mission(),mission({id:'flight-2',kind:'attack',fleet:{falke:1}}),mission({id:'elsewhere',station:'outpost'})],state,time);
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-pirate-flight]').length,2);
 assert.equal(doc.querySelectorAll('button details,button button,button [data-pirate-flight]').length,0);
 assert.match(doc.querySelector('[data-pirate-flight="flight-1"]').textContent,/Spionage/);
 assert.match(doc.querySelector('[data-pirate-flight="flight-2"]').textContent,/Angriff/);
 assert.match(html,/2 Einsätze/);dom.window.close();
});
test('Live updates change position, accessibility value and countdown without replacing the DOM',()=>{
 const state=newGame(),station={id:'smugglers',name:'Schmugglernest',tier:1,sensor:1,enabled:true},dom=new JSDOM(pirateStationCard(station,'smugglers',[mission()],state,time,new Set(['flight-1']))),doc=dom.window.document;
 const card=doc.querySelector('[data-pirate-flight]'),details=card.querySelector('details');assert.equal(details.open,true);
 updatePirateFlights(doc,time+30000);assert.equal(card.style.getPropertyValue('--flight-position'),'50%');assert.equal(card.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),'50');assert.equal(card.querySelector('time').textContent,'0:30');assert.equal(card.querySelector('details'),details);
 updatePirateFlights(doc,time+65000);assert.equal(card.querySelector('time').textContent,'Ankunft wird bestätigt …');assert.equal(card.classList.contains('is-due'),true);assert.equal(details.open,true);dom.window.close();
});
test('Waiting cargo stays at the origin and unsafe player labels are escaped',()=>{
 const state=newGame();state.planets[0].name='<img src=x onerror=alert(1)>';
 const station={id:'smugglers',name:'Schmugglernest',tier:1,sensor:1,enabled:true},dom=new JSDOM(pirateStationCard(station,'smugglers',[mission({awaitingUnload:true,status:'returning',cargo:{metal:400,crystal:0,fuel:0}})],state,time)),doc=dom.window.document;
 updatePirateFlights(doc,time+90000);assert.equal(doc.querySelector('[onerror]'),null);assert.match(doc.querySelector('time').textContent,/Wartet auf Lagerplatz/);assert.equal(doc.querySelector('[data-pirate-flight]').style.getPropertyValue('--flight-position'),'0%');dom.window.close();
});
