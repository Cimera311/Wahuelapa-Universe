import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance} from '../src/engine.js';
import {vector} from '../src/config.js';
const T=1800000000000;
function fixture(){
 const s=newGame('Catch-up',T),p=s.planets[0];
 Object.assign(p.buildings,{solar:1,metal:5,crystal:4,fuel:3,shipyard:2,warehouse:3});
 p.resources=vector([500,400,300]);
 const second=structuredClone(p);second.id='ferrum';second.name='Ferrum';s.planets.push(second);
 for(const q of s.planets)q.shipjob={id:1,key:'falke',count:1,start:T,end:T+600000,workTotal:600000,workRemaining:600000};
 return s;
}
function splitCompare(s,boundaries,callback){
 const once=structuredClone(s),split=structuredClone(s),end=T+60000;
 advance(once,end,callback);
 for(const at of [...boundaries,end])advance(split,at,callback);
 assert.deepEqual(once,split);
 return once;
}
test('catch-up refreshes all planets after research and changed planet after construction',()=>{
 for(const key of ['solar','metal','warehouse']){
  const s=fixture();s.research={key:'energy',level:2,planet:'home',start:T,end:T+10000};
  s.planets[0].build={key,level:s.planets[0].buildings[key]+1,start:T,end:T+20000};
  splitCompare(s,[T+10000,T+20000]);
 }
});
test('demolition refreshes production and storage capacity at its exact event time',()=>{
 const s=fixture(),p=s.planets[0];p.resources.metal=19000;
 p.build={key:'warehouse',level:1,kind:'demolish',start:T,end:T+10000,refund:vector([0,0,0])};
 const result=splitCompare(s,[T+10000]);assert.ok(result.planets[0].depot.metal>0);
});
test('production cache never survives a completed advance invocation',()=>{
 const s=fixture();advance(s,T+1000);
 s.tech.energy=8;s.planets[0].energy=2;s.planets[0].mult[0]=3;s.planets[0].buildings.metal=8;
 const fresh=structuredClone(s);advance(s,T+60000);advance(fresh,T+60000);assert.deepEqual(s,fresh);
});
test('external debris callback invalidates cached production inside the same catch-up',()=>{
 const s=fixture();
 s.missions.push({id:1,type:'salvage',phase:'outbound',from:'home',to:'home',fleet:{transport:1},count:1,ship:'transport',cargo:vector([0,0,0]),duration:1000,start:T,due:T+10000});
 const callback=world=>{world.tech.energy=4;world.planets[0].energy=1.5;world.planets[0].mult[0]=2;};
 splitCompare(s,[T+10000],callback);
});
