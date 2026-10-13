import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,energyDemand,stats,buildInfo,act} from '../src/engine.js';
import {BUILDINGS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
import {ui} from './helpers/game-ui.js';
const T=1800000000000;
test('Orbitalwerft keeps legacy building key and scales beyond old level four',()=>{
 const s=newGame('Werft',T),p=s.planets[0];s.tech.military=1;
 assert.equal(BUILDINGS.orbital.name,'Orbitalwerft');
 p.buildings.orbital=4;
 assert.equal(buildInfo(s,p,'orbital').reason,'');
 p.buildings.orbital=30;
 assert.match(buildInfo(s,p,'orbital').reason,/Maximale Gebäudestufe/);
 assert.equal(validateSave(s).planets[0].buildings.orbital,30);
});
test('Orbitalwerft permanently uses energy with same consumption curve as shipyard',()=>{
 const s=newGame('Werft',T),p=s.planets[0];
 p.buildings.orbital=6;p.buildings.shipyard=6;p.energy=1.25;
 const demand=energyDemand(p);
 assert.equal(demand.orbital,demand.shipyard);
 assert.equal(demand.orbital,Math.ceil(10*6**1.5)*1.25);
 assert.ok(stats(s,p).demand>=demand.orbital+demand.shipyard);
 p.buildings.orbital=0;assert.equal(energyDemand(p).orbital,0);
});
test('Only orbital facility is introduced; no decommissioned weapons can be ordered',()=>{
 const s=newGame('Werft',T),p=s.planets[0];p.buildings.orbital=6;p.buildings.shipyard=6;p.buildings.warehouse=5;p.resources=vector([20000,20000,20000]);s.tech.military=4;
 for(const key of ['flak','laser','rail','plasma'])assert.equal(typeof act(s,{type:'ship',key,count:1},T).planets[0].orbitaljob,'object');
});
test('Orbital yard section does not display buildable guns or create units',t=>{
 const {api,doc}=ui(t);
 api.show('orbital');
 assert.match(doc.querySelector('#fleet-pane-orbital').textContent,/Flakplattform/);
 assert.ok(doc.querySelector('#fleet-pane-orbital [data-action="ship"]'));
});
