import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,shipInfo,shipOrders,orbitalOrders,orbitalQueueCapacity,energyDemand,stats,buildInfo} from '../src/engine.js';
import {SHIPS,vector} from '../src/config.js';
import {parseSave,validateSave} from '../src/storage.js';
import {ui} from './helpers/game-ui.js';
const T=1800000000000;
const ready=()=>{
 const s=newGame('Werften',T),p=s.planets[0];
 p.buildings.shipyard=6;p.buildings.orbital=6;p.buildings.solar=30;p.buildings.warehouse=10;
 p.resources=vector([500000,500000,500000]);s.tech.military=4;s.tech.hyperspace=1;
 return s;
};
test('Orbital shipyard uses existing building key and the same 30-level limit as ordinary shipyard',()=>{
 const s=ready(),p=s.planets[0];
 assert.equal(buildInfo(s,p,'orbital').reason,'');
 assert.equal(buildInfo(s,p,'orbital').cost.metal>0,true);
 p.buildings.orbital=30;assert.match(buildInfo(s,p,'orbital').reason,/Maximale/);
});
test('Orbital yard consumes energy even without work and multiplies planet energy factor once',()=>{
 const s=ready(),p=s.planets[0];p.energy=1.4;
 assert.equal(energyDemand(p).orbital,Math.ceil(10*6**1.5)*1.4);
 assert.equal(energyDemand(p).shipyard,Math.ceil(10*6**1.5)*1.4);
 assert.equal(stats(s,p).demand,Object.values(energyDemand(p)).reduce((a,b)=>a+b,0));
 p.buildings.orbital=0;assert.equal(energyDemand(p).orbital,0);
});
test('Defense construction runs in its own queue and does not block the shipyard',()=>{
 let s=ready(),p=s.planets[0],plasmaCost=SHIPS.plasma.cost;
 assert.deepEqual(plasmaCost,[4000,2800,900]); // Stage 1 deliberately does not alter prices.
 s=act(s,{type:'ship',key:'plasma',count:1},T);
 s=act(s,{type:'ship',key:'titan',count:1},T);
 p=s.planets[0];assert.equal(p.orbitaljob.key,'plasma');assert.equal(p.shipjob.key,'titan');
 assert.equal(orbitalOrders(p).length,1);assert.equal(shipOrders(p).length,1);
 assert.equal(orbitalQueueCapacity(p),6);
 const out=validateSave(s);assert.equal(out.planets[0].orbitaljob.key,'plasma');
 const end=Math.max(p.orbitaljob.end,p.shipjob.end);advance(s,end+1000);
 assert.equal(s.planets[0].ships.plasma,1);assert.equal(s.planets[0].ships.titan,1);
 assert.equal(s.planets[0].shipjob,null);assert.equal(s.planets[0].orbitaljob,null);
});
test('Legacy saves and paid defensive shipyard orders stay intact',()=>{
 let s=ready();const p=s.planets[0];p.shipjob={key:'flak',count:1,start:T,end:T+60000};
 delete p.orbitaljob;delete p.orbitalqueue;
 s=parseSave(JSON.stringify(s));
 assert.equal(s.planets[0].shipjob.key,'flak');
 assert.equal(s.planets[0].orbitaljob,null);
 assert.deepEqual(s.planets[0].orbitalqueue,[]);
 advance(s,T+60000);assert.equal(s.planets[0].ships.flak,1);
});
test('New orbital queue rejects forged nondefense jobs',()=>{
 const s=ready(),p=s.planets[0];p.orbitaljob={id:1,key:'falke',count:1,start:T,end:T+1000,workTotal:1000,workRemaining:1000,paused:false};
 s.seq=1;assert.throws(()=>validateSave(s),/Spielstand/);
});
test('Orbital construction view is separately reachable under the hangar group',t=>{
 const {doc,api}=ui(t),p=api.state().planets[0];p.buildings.orbital=2;p.buildings.solar=10;
 api.show('orbital');
 assert.ok(doc.querySelector('#fleet-pane-orbital'));
 assert.match(doc.querySelector('#fleet-pane-orbital').textContent,/Orbitalwerft/);
 assert.ok(doc.querySelector('[data-ship-card="flak"]'));
 assert.match(doc.querySelector('#fleet-pane-orbital').textContent,/Leerlauf|leer/);
});
