import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,act,advance,shipInfo,shipOrders,defenseSlots,SHIP_QUEUE_LIMIT,SHIP_QUEUE_LEGACY_LIMIT,shipQueueCapacity,shipQueueFullReason} from '../src/engine.js';
import {validateSave,parseSave} from '../src/storage.js';
import {SHIPS,TECHS,vector} from '../src/config.js';
import {processWorld,projectPvP} from '../src/server-world.js';
const T=1800000000000,uid='00000000-0000-0000-0000-000000000001';
function ready(){const s=newGame('Queue',T),p=s.planets[0];for(const [k,v] of Object.entries(TECHS))s.tech[k]=v.max;Object.assign(p.buildings,{metal:0,crystal:0,fuel:0,shipyard:6,solar:20,warehouse:10,orbital:1});p.resources=vector([50000,50000,50000]);return s;}
const add=(s,key='falke',count=1,now=s.time)=>act(s,{type:'ship',key,count},now);
const cancel=j=>({type:'cancel-ship',order:{id:j.id,key:j.key,count:j.count,start:j.start,end:j.end}});
test('FIFO pays each order once and offline completion matches small time steps after a save reload',()=>{
 let s=add(add(add(ready(),'falke',2),'waechter'),'transport',3),p=s.planets[0];
 assert.deepEqual(shipOrders(p).map(j=>j.key),['falke','waechter','transport']);
 const spent=shipOrders(p).reduce((a,j)=>a+j.payment.resources.metal,0);assert.equal(p.resources.metal,50000-spent);
 s=parseSave(JSON.stringify(s));const offline=structuredClone(s),ticks=structuredClone(s),end=p.shipqueue.at(-1).end;
 for(let t=T+1000;t<end;t+=1000)advance(ticks,t);advance(ticks,end);advance(offline,end);
 assert.deepEqual(offline,ticks);assert.equal(offline.planets[0].ships.falke,2);assert.equal(offline.planets[0].ships.waechter,1);assert.equal(offline.planets[0].ships.transport,3);assert.equal(shipOrders(offline.planets[0]).length,0);
 advance(offline,end+100000);assert.equal(offline.planets[0].ships.transport,3);
});
test('Waiting jobs earn no work; power restoration resumes the current order before the next',()=>{
 let s=ready();s.tech.energy=0;s.planets[0].buildings.solar=0;s=add(add(s),'transport');
 const [active,next]=shipOrders(s.planets[0]);advance(s,T+3600000);assert.equal(active.workRemaining,active.workTotal);assert.equal(next.workRemaining,next.workTotal);parseSave(JSON.stringify(s));
 s.planets[0].buildings.solar=20;advance(s,s.time);const end=s.planets[0].shipjob.end;advance(s,end);assert.equal(s.planets[0].ships.falke,1);assert.equal(s.planets[0].shipjob.id,next.id);assert.equal(s.planets[0].shipjob.workRemaining,next.workTotal);
 advance(s,end+next.workTotal);assert.equal(s.planets[0].ships.transport,1);
});
test('Cancelling active or waiting jobs refunds only their own payment and preserves earned work',()=>{
 let s=add(add(add(ready()),'waechter'),'transport');const p=s.planets[0],active=p.shipjob,waiting=p.shipqueue[0],last=p.shipqueue[1];s=act(s,cancel(waiting),T+1000);
 assert.equal(s.planets[0].shipjob.workRemaining,active.workTotal-1000);assert.deepEqual(s.planets[0].shipqueue.map(j=>j.id),[last.id]);assert.equal(s.planets[0].resources.metal,50000-active.payment.resources.metal-last.payment.resources.metal);
 const before=structuredClone(s);assert.throws(()=>act(s,cancel(waiting),s.time),/abgeschlossen|geändert/);assert.deepEqual(s,before);
 s=act(s,cancel(active),s.time);assert.equal(s.planets[0].shipjob.id,last.id);assert.equal(s.planets[0].shipjob.workRemaining,last.workTotal);assert.equal(s.planets[0].resources.metal,50000-last.payment.resources.metal);
 // The original waiting identity remains valid after it is promoted to active.
 s=act(s,cancel(last),s.time);assert.equal(s.planets[0].resources.metal,50000);assert.equal(shipOrders(s.planets[0]).length,0);
});
test('Cancellation at a completion boundary cannot refund a finished order or remove its successor',()=>{
 let s=add(add(ready()),'transport');const first=s.planets[0].shipjob,second=s.planets[0].shipqueue[0];assert.throws(()=>act(s,cancel(first),first.end),/abgeschlossen/);advance(s,first.end);assert.equal(s.planets[0].ships.falke,1);assert.equal(s.planets[0].shipjob.id,second.id);
});
test('Defense orders reserve all queued orbital slots and return salvage separately',()=>{
 let s=ready();s.planets[0].defenseSalvage=vector([400,200,0]);s.planets[0].ships.flak=2;assert.equal(defenseSlots(s.planets[0]),2);const before=structuredClone(s);const next=add(s,'flak',2);assert.equal(next.planets[0].orbitaljob.count,2);assert.equal(next.planets[0].ships.flak,2);assert.deepEqual(s,before);
});
test('An existing legacy job keeps its progress when a paid order is appended',()=>{
 const s=ready();s.time=T+30000;s.planets[0].shipjob={key:'falke',count:2,start:T,end:T+120000};const next=add(s,'transport');assert.equal(next.planets[0].shipjob.workRemaining,90000);assert.equal(next.planets[0].shipqueue[0].workRemaining,next.planets[0].shipqueue[0].workTotal);parseSave(JSON.stringify(next));advance(next,T+120000);assert.equal(next.planets[0].ships.falke,2);assert.equal(next.planets[0].shipjob.key,'transport');
});
test('Queued construction time is fixed when paid, and another planet builds independently',()=>{
 let s=ready();s.planets.push({...structuredClone(s.planets[0]),id:'ferrum',name:'Ferrum'});s=add(add(s),'transport');const work=s.planets[0].shipqueue[0].workTotal;s=act(s,{type:'ship',planet:'ferrum',key:'falke',count:1},s.time);s.planets[0].build={key:'shipyard',level:7,start:T,end:T+1000};advance(s,s.planets[0].shipjob.end);assert.equal(s.planets[1].ships.falke,1);assert.equal(s.planets[0].shipjob.workTotal,work);assert.ok(shipInfo(s,s.planets[0],'transport').ms<work);
});
test('Queue validation rejects duplicate identities, partial waiting work and forged payments',()=>{
 const s=add(add(ready()),'transport');for(const mutate of [p=>p.shipqueue[0].id=p.shipjob.id,p=>p.shipqueue[0].workRemaining--,p=>p.shipqueue[0].payment.resources.metal++,p=>p.shipjob=null,p=>p.shipqueue={}]){const bad=structuredClone(s);mutate(bad.planets[0]);assert.throws(()=>validateSave(bad));}
});
test('Queue and payment limits reject atomically instead of generating unreadable saves',()=>{
 let s=ready();s.planets[0].buildings.shipyard=30;for(let i=0;i<SHIP_QUEUE_LIMIT;i++)s=add(s,'probe');assert.equal(shipOrders(s.planets[0]).length,SHIP_QUEUE_LIMIT);validateSave(s);const before=structuredClone(s);assert.throws(()=>add(s,'probe'),/Auftragsplätze belegt/);assert.deepEqual(s,before);assert.throws(()=>add(ready(),'falke',Number.MAX_SAFE_INTEGER),/groß/);
});
test('Authoritative and generated dashboard commands support queues, cancel identities and own planets',async()=>{
 const code=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');const bundled=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+code+'\nexport {processWorld,projectPvP};').toString('base64'));
 for(const engine of [{processWorld,projectPvP},bundled]){
  let w={now:T,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state:ready()}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};
  for(const key of ['falke','transport'])w=engine.processWorld(w,uid,{type:'command',action:{type:'ship',key,count:1}});
  assert.equal(engine.projectPvP(w,uid).features.shipQueue,true);const p=w.saves[0].state.planets[0];assert.equal(p.shipqueue.length,1);assert.throws(()=>engine.processWorld(w,uid,{type:'command',action:{...cancel(p.shipqueue[0]),planet:'g-orion-p1'}}),/Planet nicht gefunden/);
  w=engine.processWorld(w,uid,{type:'command',action:cancel(p.shipjob)});assert.equal(w.saves[0].state.planets[0].shipjob.key,'transport');w.saves[0].state.planets[0].buildings.shipyard=1;assert.throws(()=>engine.processWorld(w,uid,{type:'command',action:{type:'ship',key:'probe',count:1}}),/Werftstufe 2/);
 }
});

test('Queue slots follow the shipyard level, include the active job and stop growing at 20',()=>{
 for(const level of [0,1,2,5,10,20,30]){let s=ready();s.planets[0].buildings.shipyard=level;const slots=Math.min(level,20);assert.equal(shipQueueCapacity(s.planets[0]),slots);for(let i=0;i<slots;i++)s=add(s,'probe');if(level)assert.throws(()=>add(s,'probe'),level<20?new RegExp('Werftstufe '+(level+1)):/Maximale Warteschlangengröße/);else assert.throws(()=>add(s,'probe'),/Schiffswerft Stufe 1/);}
});
test('A completed yard upgrade unlocks another slot immediately, including at its exact event time',()=>{
 let s=ready();s.planets[0].buildings.shipyard=1;s=add(s,'probe');assert.throws(()=>add(s,'probe'),/Werftstufe 2/);s.planets[0].build={key:'shipyard',level:2,start:T,end:T+1000};s=add(s,'probe',1,T+1000);assert.equal(shipOrders(s.planets[0]).length,2);assert.equal(shipQueueCapacity(s.planets[0]),2);
});
test('Legacy paid queues above the new capacity keep all jobs, cancellations and offline completion',()=>{
 let s=add(ready(),'probe'),p=s.planets[0],original=p.shipjob;p.shipqueue=[];
 for(let i=1;i<SHIP_QUEUE_LEGACY_LIMIT;i++){const j=structuredClone(original);j.id=++s.seq;p.shipqueue.push(j);for(const k of ['metal','crystal','fuel'])p.resources[k]-=j.payment.resources[k];}
 advance(s,s.time);s=parseSave(JSON.stringify(s));assert.equal(shipOrders(s.planets[0]).length,50);assert.match(shipQueueFullReason(s.planets[0]),/Werftstufe 7/);const paid=s.planets[0].shipqueue[0],metal=s.planets[0].resources.metal;s=act(s,cancel(paid),s.time);assert.equal(shipOrders(s.planets[0]).length,49);assert.equal(s.planets[0].resources.metal,metal+paid.payment.resources.metal);assert.throws(()=>add(s,'probe'),/Auftragsplätze belegt/);
 const end=s.planets[0].shipqueue.at(-1).end;advance(s,end);assert.equal(s.planets[0].ships.probe,49);assert.equal(shipOrders(s.planets[0]).length,0);s=add(s,'probe');assert.equal(shipOrders(s.planets[0]).length,1);
});
