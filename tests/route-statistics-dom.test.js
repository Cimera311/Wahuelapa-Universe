import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance} from '../src/engine.js';
import {RES,TARGETS,vector} from '../src/config.js';
import {ui} from './helpers/game-ui.js';

function route(){
 let s=newGame('Statistik',1800000000000);s.tech.colonization=1;s.planets.push({...structuredClone(s.planets[0]),...TARGETS[0]});
 for(const p of s.planets){p.buildings.warehouse=10;p.resources=vector([10000,10000,10000]);p.ships.transport=2;for(const k of RES)p.buildings[k]=0;}
 const stops=[{planet:'home',load:vector([200,0,0]),unload:vector([0,0,0])},{planet:'ferrum',load:vector([0,50,0]),unload:{metal:'max',crystal:'max',fuel:'max'}}];
 s=act(s,{type:'route',name:'<img src=x onerror=alert(1)>',count:1,stops,repeat:true},s.time);advance(s,s.missions[0].due);return s;
}
test('route cards show last actual transfer, expandable totals and retain the open panel across rendering',t=>{
 const {doc,api}=ui(t,{state:route()});api.show('routes');
 const card=doc.querySelector('.trade-route');assert.ok(card);assert.match(card.querySelector('.route-activity').textContent,/Handelsstopp auf Ferrum/);assert.match(card.querySelector('.route-activity-cargo').textContent,/200 Metall/);
 assert.equal(card.querySelector('h3 img'),null);const details=card.querySelector('[data-route-stat]');assert.ok(details);assert.equal(details.open,false);details.open=true;api.render();assert.equal(doc.querySelector('[data-route-stat]').open,true);
 assert.match(doc.querySelector('.route-stat-grid').textContent,/Tatsächlich geliefert/);assert.match(doc.querySelector('.route-statistics').textContent,/getrennte Zähler/);
 const panels=doc.querySelectorAll('[data-route-stat]');assert.equal(panels.length,2);panels[0].open=false;panels[1].open=true;api.render();
 const restored=doc.querySelectorAll('[data-route-stat]');assert.equal(restored[0].open,false);assert.equal(restored[1].open,true);
});
test('old server versions do not present locally predicted counters as available server statistics',t=>{
 const s=route(),{doc,api}=ui(t,{state:s});api.attach({authoritative:true,now:s.time,pvp:{features:{}}});api.show('routes');
 assert.match(doc.querySelector('.route-activity').textContent,/neue Serverversion/);assert.equal(doc.querySelector('.route-stat-grid'),null);
 api.attach({authoritative:true,now:s.time,pvp:{features:{routeStatistics:true}}});api.render();assert.ok(doc.querySelector('.route-stat-grid'));
});
