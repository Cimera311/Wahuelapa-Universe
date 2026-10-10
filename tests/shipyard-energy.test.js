import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,stats,shipInfo,energyDemand,shipyardTimeFactor} from '../src/engine.js';
import {SHIPS,vector} from '../src/config.js';
import {validateSave,parseSave} from '../src/storage.js';
import {processWorld,projectPvP} from '../src/server-world.js';
const T=1800000000000;
function ready(level=2,ratio=1){const s=newGame('Werft',T),p=s.planets[0];for(const k of ['metal','crystal','fuel'])p.buildings[k]=0;p.buildings.shipyard=level;p.buildings.solar=1;p.energy=ratio===0?1:45/(Math.ceil(10*level**1.5)*ratio);if(ratio===0)p.buildings.solar=0;s.tech.military=1;p.resources=vector([3000,2200,1000]);return s;}
const order=j=>({type:'cancel-ship',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.orderEnd??j.end}});
test('Shipyard levels compound time reduction with diminishing absolute savings for all units',()=>{
 const s=ready(),p=s.planets[0];for(const key of Object.keys(SHIPS)){p.buildings.shipyard=1;assert.equal(shipInfo(s,p,key,3).ms,SHIPS[key].time*3000);p.buildings.shipyard=6;assert.equal(shipInfo(s,p,key,3).ms,Math.ceil(SHIPS[key].time*3000*.92**5));}
 assert.equal(shipyardTimeFactor(0),1);assert.ok(1-shipyardTimeFactor(2)>shipyardTimeFactor(10)-shipyardTimeFactor(11));
});
test('Planet factor applies once to every consumer including idle shipyards, but not supply',()=>{
 const s=ready(10),p=s.planets[0];p.energy=1.4;Object.assign(p.buildings,{metal:3,crystal:2,fuel:1});assert.deepEqual(energyDemand(p),{metal:45*1.4,crystal:36*1.4,fuel:20*1.4,shipyard:317*1.4});assert.equal(stats(s,p).supply,45);assert.equal(stats(s,p).demand,(45+36+20+317)*1.4);p.buildings.shipyard=0;assert.equal(energyDemand(p).shipyard,0);
});
test('Half power doubles shipbuilding time and earned progress survives storage',()=>{
 let s=act(ready(2,.5),{type:'ship',key:'falke',count:1},T);const j=s.planets[0].shipjob;assert.equal(j.end,T+j.workTotal*2);advance(s,T+30000);assert.equal(s.planets[0].shipjob.workRemaining,40200);s=parseSave(JSON.stringify(s));advance(s,T+110399);assert.equal(s.planets[0].ships.falke,0);advance(s,T+110400);assert.equal(s.planets[0].ships.falke,1);advance(s,T+200000);assert.equal(s.planets[0].ships.falke,1);
});
test('Solar completion speeds up an active order at its event time; offline and ticks agree',()=>{
 let s=act(ready(2,.5),{type:'ship',key:'falke',count:1},T);s=act(s,{type:'build',key:'solar'},T);s.planets[0].build.end=T+30000;const a=structuredClone(s),b=structuredClone(s);advance(a,T+70200);for(let t=T+1000;t<T+70200;t+=1000)advance(b,t);advance(b,T+70200);assert.equal(a.planets[0].ships.falke,1);assert.deepEqual(a.reports,b.reports);assert.equal(a.reports[0].time,T+70200);for(const k of ['metal','crystal','fuel'])assert.ok(Math.abs(a.planets[0].resources[k]-b.planets[0].resources[k])<1e-7);
});
test('Mine expansion reduces ongoing work speed; cancellation uses order identity despite changing forecast',()=>{
 let s=act(ready(),{type:'ship',key:'falke',count:2},T);const old=order(s.planets[0].shipjob);s=act(s,{type:'build',key:'metal'},T);s.planets[0].build.end=T+10000;advance(s,T+20000);const ratio=29/44;assert.ok(Math.abs(s.planets[0].shipjob.workRemaining-(110400-10000-10000*ratio))<1e-7);assert.ok(s.planets[0].shipjob.end>old.order.end);const remaining=s.planets[0].resources.metal;s=act(s,old,T+20000);assert.equal(s.planets[0].shipjob,null);assert.equal(s.planets[0].resources.metal,remaining+480);
});
test('No power pauses jobs with finite saves, solar construction resumes without free progress',()=>{
 let s=act(ready(2,0),{type:'ship',key:'falke',count:1},T);advance(s,T+3600000);const j=s.planets[0].shipjob;assert.equal(j.workRemaining,j.workTotal);assert.equal(j.paused,true);assert.ok(Number.isFinite(j.end));s=parseSave(JSON.stringify(s));s=act(s,{type:'build',key:'solar'},s.time);const powerTime=s.planets[0].build.end;advance(s,powerTime);assert.equal(s.planets[0].shipjob.workRemaining,55200);assert.equal(s.planets[0].shipjob.paused,false);advance(s,powerTime+55200);assert.equal(s.planets[0].ships.falke,1);
});
test('Energy research changes all planets at completion while yard bonus is fixed at order placement',()=>{
 let s=ready(2,.5);const colony=structuredClone(s.planets[0]);colony.id='ferrum';colony.name='Ferrum';s.planets.push(colony);s=act(s,{type:'ship',key:'falke',count:1},T);s=act(s,{type:'ship',planet:'ferrum',key:'falke',count:1},T);const p=s.planets[0];s.research={key:'energy',level:1,planet:'home',start:T,end:T+10000};p.build={key:'shipyard',level:3,start:T,end:T+20000};advance(s,T+30000);assert.equal(p.shipjob.workTotal,55200);const ratioAfter=49.5/(Math.ceil(10*3**1.5)*p.energy);assert.ok(Math.abs(p.shipjob.workRemaining-(55200-5000-5500-10000*ratioAfter))<1e-7);assert.equal(shipInfo(s,p,'falke').ms,50784);assert.equal(s.planets[1].shipjob.workRemaining,39200);
});
test('Legacy jobs retain normal work and earlier progress without a retroactive yard bonus',()=>{
 const s=ready(2,.5),p=s.planets[0];s.time=T+30000;p.shipjob={key:'falke',count:2,start:T,end:T+120000};advance(s,s.time);assert.equal(p.shipjob.workTotal,120000);assert.equal(p.shipjob.workRemaining,90000);assert.equal(p.shipjob.end,T+210000);validateSave(s);const cancelled=act(s,order(p.shipjob),s.time+1000);assert.equal(cancelled.planets[0].shipjob,null);advance(s,T+210000);assert.equal(p.ships.falke,2);
});
test('Stored work cannot be negative, nonfinite, incomplete or exceed total',()=>{
 const s=act(ready(),{type:'ship',key:'falke',count:1},T);for(const value of [-1,Infinity,NaN,100000]){const bad=structuredClone(s);bad.planets[0].shipjob.workRemaining=value;assert.throws(()=>validateSave(bad));}const bad=structuredClone(s);delete bad.planets[0].shipjob.workTotal;assert.throws(()=>validateSave(bad));
});
test('Authoritative server uses the same energy-limited work and exposes support',()=>{
 const s=act(ready(2,.5),{type:'ship',key:'falke',count:1},T),uid='00000000-0000-0000-0000-000000000001';const snapshot={now:T+60000,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state:s}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};const w=processWorld(snapshot,uid,{type:'command',action:{type:'reserve',reserves:vector([0,0,0])}});assert.equal(w.saves[0].state.planets[0].ships.falke,0);assert.equal(w.saves[0].state.planets[0].shipjob.workRemaining,25200);assert.equal(projectPvP(w,uid).features.shipyardEnergy,true);
});
