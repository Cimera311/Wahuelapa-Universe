import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,shipRefund,defenseSlots} from '../src/engine.js';
import {SHIPS,TECHS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
import {processWorld} from '../src/server-world.js';
const T=1700000000000;
function ready(){const s=newGame('Cancel',T),p=s.planets[0];for(const [k,v] of Object.entries(TECHS))s.tech[k]=v.max;p.resources=vector([3000,2000,1000]);p.buildings.shipyard=6;p.buildings.orbital=4;for(const k of ['metal','crystal','fuel'])p.buildings[k]=0;return s;}
const cancel=j=>({type:'cancel-ship',planet:'home',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.end}});
test('Cancelling a batch refunds payment, leaves existing ships and frees the yard',()=>{
 const original=ready();original.planets[0].ships.falke=3;let s=act(original,{type:'ship',key:'falke',count:2},T),j=s.planets[0].shipjob;
 assert.deepEqual(j.payment.resources,vector([480,300,120]));assert.equal(validateSave(s).planets[0].shipjob.id,j.id);
 s=act(s,cancel(j),T+30000);const p=s.planets[0];assert.equal(p.shipjob,null);assert.equal(p.ships.falke,3);assert.deepEqual(p.resources,original.planets[0].resources);assert.match(s.reports[0].title,/abgebrochen/);
 s=act(s,{type:'ship',key:'transport',count:1},T+30000);assert.equal(s.planets[0].shipjob.key,'transport');
});
test('Refund overflow goes to the depot without disappearing or overflowing storage',()=>{
 let s=act(ready(),{type:'ship',key:'falke',count:2},T),j=s.planets[0].shipjob;s.planets[0].resources=vector([4000,4000,4000]);s=act(s,cancel(j),T+1);
 assert.deepEqual(s.planets[0].resources,vector([4000,4000,4000]));assert.deepEqual(s.planets[0].depot,vector([480,300,120]));
});
test('Orbital cancellations return paid material and restore a reserved wreck',()=>{
 const s=ready(),p=s.planets[0];p.buildings.orbital=6;p.resources=vector([50000,40000,20000]);p.orbitalWrecks={flak:2};
 let n=act(s,{type:'orbital-repair',key:'flak',count:1,mode:'wreck'},T);
 const j=n.planets[0].orbitaljob;assert.deepEqual(j.payment,vector([168,105,60]));assert.equal(n.planets[0].orbitalWrecks.flak,1);
 n=act(n,{type:'orbital-cancel',id:j.id},T+1);
 assert.equal(n.planets[0].orbitaljob,null);assert.equal(n.planets[0].orbitalWrecks.flak,2);
 assert.deepEqual(n.planets[0].resources,s.planets[0].resources);
});
test('Existing defense jobs from the old shipyard still refund the original cost',()=>{
 let s=ready(),p=s.planets[0];s.seq++;p.shipjob={id:s.seq,key:'flak',count:2,start:T,end:T+120000};
 const j=p.shipjob;assert.ok(shipRefund(j).legacyDefense);
 s=act(s,cancel(j),T+1);
 assert.deepEqual(s.planets[0].defenseSalvage,vector([320,160,0]));
 assert.equal(s.planets[0].resources.fuel,1040);
});
test('Stale cancellation cannot cancel a replacement order or refund a completed batch',()=>{
 let s=act(ready(),{type:'ship',key:'falke',count:1},T),old=s.planets[0].shipjob;s=act(s,cancel(old),T);s=act(s,{type:'ship',key:'falke',count:1},T);const before=structuredClone(s);
 assert.throws(()=>act(s,cancel(old),T),/geändert/);assert.deepEqual(s,before);
 const j=s.planets[0].shipjob;assert.throws(()=>act(s,cancel(j),j.end),/abgeschlossen/);advance(s,j.end);assert.equal(s.planets[0].ships.falke,1);assert.equal(s.planets[0].shipjob,null);
});
test('Server commands allow cancellation only of the caller own planet',()=>{
 const s=act(ready(),{type:'ship',key:'falke',count:1},T),uid='00000000-0000-0000-0000-000000000001',snapshot={now:T+1,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state:s}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};
 const w=processWorld(snapshot,uid,{type:'command',action:cancel(s.planets[0].shipjob)});assert.equal(w.saves[0].state.planets[0].shipjob,null);assert.equal(w.saves[0].state.planets[0].resources.metal,3000);assert.equal(w.settings.enabled,false);
 assert.throws(()=>processWorld(snapshot,uid,{type:'command',action:{...cancel(s.planets[0].shipjob),planet:'g-orion-p1'}}),/Planet nicht gefunden/);
});
test('Malformed stored payment is rejected before it can become a refund',()=>{
 const s=act(ready(),{type:'ship',key:'falke',count:1},T);s.planets[0].shipjob.payment.resources.metal=-1;assert.throws(()=>validateSave(s));s.planets[0].shipjob.payment.resources.metal=240;s.planets[0].shipjob.payment.salvage.metal=1;assert.throws(()=>validateSave(s));
});
