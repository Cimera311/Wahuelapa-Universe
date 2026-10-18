import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {newGame,act,advance,capacity,fleetManifest} from '../src/engine.js';
import {TARGETS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
import {processWorld} from '../src/server-world.js';
import {fixture,A,T} from './helpers/pvp-fixture.js';
const order=(metal=0)=>({metal,crystal:0,fuel:0});
function pendingRoute(mode){
 let s=newGame('Route regression',T);
 for(const target of TARGETS.slice(0,2))s.planets.push({...structuredClone(s.planets[0]),...target});
 for(const p of s.planets){for(const k in p.buildings)p.buildings[k]=0;p.resources=vector([1000,0,3000]);p.ships.transport=2;}
 const stops=[{planet:'home',load:order(),unload:order()},{planet:'ferrum',load:order(mode==='finish'?100:0),unload:order()}];
 s=act(s,{type:'route',name:'Original',fleet:{transport:1},stops,repeat:true},T);
 const id=s.missions[0].id;
 s=act(s,{type:'edit-route',id,name:'Changed final stop',fleet:{transport:1},stops:[stops[0],{...stops[1],planet:'nereus'}],repeat:mode!=='finish'},T);
 if(mode==='manual')s=act(s,{type:'pause-route',id},T);
 if(mode==='fuel')s.planets[0].resources.fuel=0;
 if(mode==='finish')s.planets[0].resources.metal=capacity(s.planets[0]);
 advance(s,s.missions[0].due); // Old final stop; return to home still follows the old itinerary.
 validateSave(s);
 return s;
}
function shipTotal(s){return s.planets.reduce((n,p)=>n+p.ships.transport,0)+s.missions.reduce((n,m)=>n+(fleetManifest(m).transport||0),0);}
function worldFor(s){const w=fixture();w.saves[0].state=s;w.starts=[];w.now=s.missions[0].due;return w;}
for(const mode of ['fuel','manual','finish'])test(`changed final stop remains valid when arrival ends in ${mode}`,()=>{
 const s=pendingRoute(mode),before=structuredClone(s),ships=shipTotal(s),w=worldFor(s);
 const result=processWorld(w,A,{type:'sync'}),after=result.saves[0].state,m=after.missions[0];
 assert.equal(m.index,0);assert.equal(m.to,'home');assert.equal(m.from,'nereus');assert.equal(m.pending,undefined);
 assert.equal(m.rounds,1);assert.equal(shipTotal(after),ships);validateSave(after);assert.deepEqual(s,before);
 if(mode==='finish'){assert.equal(m.awaitingUnload,'home');assert.equal(m.cargo.metal,100);}
 else {assert.equal(m.paused,true);assert.equal(m.pauseReason,mode==='fuel'?'Treibstoff fehlt':'Manuell pausiert');}
 const again=processWorld({...result,now:result.now+60000},A,{type:'sync'}).saves[0].state;
 assert.equal(again.missions[0].rounds,1);assert.equal(shipTotal(again),ships);validateSave(again);
});
test('deployed bundle catches up a pending route edit and fuel pause without blocking another player',()=>{
 const source=readFileSync(new URL('../supabase/dashboard/game-command.ts',import.meta.url),'utf8').replace(/^import .* from "npm:.*";$/gm,'');
 const context={structuredClone,Deno:{serve(){}},console};
 vm.runInNewContext(source,context);
 const w=worldFor(pendingRoute('fuel')),result=context.processWorld(w,w.saves[1].user_id,{type:'sync'});
 const m=result.saves[0].state.missions[0];assert.equal(m.from,'nereus');assert.equal(m.paused,true);
 for(const row of result.saves)validateSave(row.state);
});
