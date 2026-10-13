import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,shipInfo,advance} from '../src/engine.js';
import {SHIPS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
import {ui} from './helpers/game-ui.js';
const T=1800000000000;
test('Retired orbital weapons remain readable, but cannot be ordered by the server',()=>{
 const s=newGame('Test',T),p=s.planets[0];p.buildings.shipyard=6;p.buildings.orbital=4;p.resources=vector([10000,10000,10000]);s.tech.military=4;
 for(const key of ['flak','laser','rail','plasma']){
  assert.equal(SHIPS[key].category,'defense');
  assert.equal(shipInfo(s,p,key).reason,key==='plasma'?'Benötigt Orbitalwerft Stufe 6.':'');
 }
 assert.deepEqual(p.resources,vector([10000,10000,10000]));
 assert.equal(validateSave(s).planets[0].buildings.orbital,4);
});
test('Legacy paid defense orders and archived defense units survive the retirement',()=>{
 let s=newGame('Altbestand',T),p=s.planets[0];p.ships.flak=2;
 p.shipjob={key:'plasma',count:1,start:T,end:T+60000};
 s=validateSave(s);advance(s,T+60000);
 assert.equal(s.planets[0].ships.flak,2);
 assert.equal(s.planets[0].ships.plasma,1);
});
test('Old orbital weapon build cards are hidden in the shipyard',t=>{
 const {doc,api}=ui(t);api.show('hangar');doc.querySelector('[data-category="military"]').click();
 for(const key of ['flak','laser','rail','plasma'])assert.equal(doc.querySelector('[data-ship-card="'+key+'"]'),null);
 assert.equal(doc.querySelector('[data-category="defense"]'),null);
 assert.ok(doc.querySelector('[data-ship-card="falke"]'));
});
