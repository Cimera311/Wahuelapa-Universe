import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,shipInfo,shipOrders,orbitalOrders,defenseSlots,energyDemand} from '../src/engine.js';
import {SHIPS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
const T=1800000000000;
function ready(){const s=newGame('Werft',T),p=s.planets[0];p.buildings.orbital=6;p.buildings.shipyard=6;p.buildings.solar=30;p.buildings.warehouse=10;p.resources=vector([500000,500000,500000]);s.tech.military=4;s.tech.hyperspace=1;return s;}
test('Each armed platform costs exactly as much as comparable warship',()=>{
 const s=ready(),p=s.planets[0];
 for(const [k,other] of [['flak','falke'],['laser','waechter'],['rail','donner'],['plasma','titan']]){
  assert.deepEqual(SHIPS[k].cost,SHIPS[other].cost);
  assert.deepEqual(shipInfo(s,p,k).cost,vector(SHIPS[other].cost));
  assert.equal(shipInfo(s,p,k).reason,'');
 }
});
test('Orbitalwerft runs independently and supports many platforms per order',()=>{
 let s=ready();s=act(s,{type:'ship',key:'flak',count:30},T);s=act(s,{type:'ship',key:'falke',count:1},T);
 const p=s.planets[0];assert.equal(p.orbitaljob.count,30);assert.equal(p.shipjob.key,'falke');
 assert.equal(orbitalOrders(p).length,1);assert.equal(shipOrders(p).length,1);
 assert.equal(defenseSlots(p),30);assert.ok(energyDemand(p).orbital>0);
 validateSave(s);
 advance(s,Math.max(p.orbitaljob.end,p.shipjob.end));
 assert.equal(p.ships.flak,30);assert.equal(p.ships.falke,1);
});
test('Each orbital yard level gives one order slot, capped at 20',()=>{
 let s=ready();s.planets[0].buildings.orbital=2;
 s=act(s,{type:'ship',key:'flak',count:1},T);
 s=act(s,{type:'ship',key:'flak',count:1},T);
 assert.throws(()=>act(s,{type:'ship',key:'flak',count:1},T),/Auftragsplätze/);
});
test('Cancelling queued orbital order refunds to depot without disrupting shipyard',()=>{
 let s=ready();s=act(s,{type:'ship',key:'flak',count:1},T);s=act(s,{type:'ship',key:'laser',count:1},T);s=act(s,{type:'ship',key:'falke',count:1},T);
 const j=s.planets[0].orbitalqueue[0];
 const before=s.planets[0].resources.metal;
 s=act(s,{type:'cancel-ship',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.end}},T);
 assert.equal(s.planets[0].orbitalqueue.length,0);
 assert.equal(s.planets[0].shipjob.key,'falke');
 assert.equal(s.planets[0].resources.metal,before+SHIPS.laser.cost[0]);
});
test('Legacy defense jobs still pass save validation after the migration',()=>{
 const s=ready(),p=s.planets[0];
 p.shipjob={key:'flak',count:1,start:T,end:T+60000};
 assert.equal(validateSave(s).planets[0].shipjob.key,'flak');
});
