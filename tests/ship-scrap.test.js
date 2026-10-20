import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,capacity,scrapShipInfo} from '../src/engine.js';
import {validateSave} from '../src/storage.js';
import {RES,SHIPS,TECHS,TARGETS,vector} from '../src/config.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {fixture,A,B,T} from './helpers/pvp-fixture.js';
const ready=()=>{const s=newGame('Schrott',T),p=s.planets[0];p.buildings.shipyard=6;p.buildings.repairDock=1;p.buildings.warehouse=10;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.resources=vector([100000,100000,100000]);for(const k of Object.keys(TECHS))s.tech[k]=TECHS[k].max;for(const [k,sh]of Object.entries(SHIPS))if(sh.category!=='defense')p.ships[k]=10;return s;};
test('Every ship returns at most 30% of each base build resource, ignoring forged refund fields',()=>{
 for(const [key,sh]of Object.entries(SHIPS).filter(([,sh])=>sh.category!=='defense')){const s=ready(),before={...s.planets[0].resources};const out=act(s,{type:'scrap-ship',key,count:3,refund:vector([1e12,1e12,1e12]),factor:100},T),p=out.planets[0];assert.equal(p.ships[key],7);for(const [i,k]of RES.entries())assert.equal(p.resources[k],before[k]+Math.floor(sh.cost[i]*3*30/100));validateSave(out);assert.equal(s.planets[0].ships[key],10);}
});
test('Full warehouses keep all refund in the existing depot, with no debris or duplicate credit on later ticks',()=>{
 const s=ready(),p=s.planets[0];p.resources=vector([capacity(p),capacity(p),capacity(p)]);const out=act(s,{type:'scrap-ship',key:'titan',count:2},T);assert.deepEqual(out.planets[0].depot,vector([5700,3900,1500]));assert.equal(out.planets[0].ships.titan,8);assert.match(out.reports[0].title,/verschrottet/);validateSave(out);
});
test('Scrapping damaged ships removes worst free hulls first, preserving docked units and their material',()=>{
 let s=ready();s.planets[0].hulls={titan:[.8,.1,.5]};s=act(s,{type:'repair',key:'titan',count:1},T);const dock=structuredClone(s.planets[0].repairQueue);const out=act(s,{type:'scrap-ship',key:'titan',count:1},T);assert.deepEqual(out.planets[0].hulls.titan,[.8]);assert.deepEqual(out.planets[0].repairQueue,dock);assert.equal(out.planets[0].ships.titan,8);validateSave(out);
});
test('Invalid counts, defenses, unknown types, missing yard and unavailable stock are rejected atomically',()=>{
 const s=ready(),before=structuredClone(s);for(const count of [0,-1,1.5,NaN,Infinity,'1',11,Number.MAX_SAFE_INTEGER])assert.throws(()=>act(s,{type:'scrap-ship',key:'titan',count},T));for(const key of ['flak','plasma','unknown'])assert.throws(()=>act(s,{type:'scrap-ship',key,count:1},T));assert.deepEqual(s,before);const full=ready();full.planets[0].resources=vector([capacity(full.planets[0]),capacity(full.planets[0]),capacity(full.planets[0])]);full.planets[0].depot.metal=1e12;assert.throws(()=>act(full,{type:'scrap-ship',key:'titan',count:1},T),/Depotmenge/);assert.equal(full.planets[0].ships.titan,10);s.planets[0].buildings.shipyard=0;assert.match(scrapShipInfo(s.planets[0],'titan',1).reason,/Schiffswerft/);
});
test('Travelling and docked ships never count as available; server ownership and feature flag are enforced',()=>{
 let s=ready();s.planets.push({...structuredClone(s.planets[0]),...TARGETS[0]});s=act(s,{type:'station',to:'ferrum',fleet:{titan:4}},T);assert.throws(()=>act(s,{type:'scrap-ship',key:'titan',count:7},T),/verfügbare/);const w=fixture();w.saves[0].state=s;const before=structuredClone(w.saves[1].state);const out=processWorld(w,A,{type:'command',action:{type:'scrap-ship',planet:'home',key:'titan',count:2}});assert.equal(out.saves[0].state.planets[0].ships.titan,4);assert.deepEqual(out.saves[1].state,validateSave(before));assert.equal(projectPvP(out,A).features.shipScrapping,true);assert.throws(()=>processWorld(w,A,{type:'command',action:{type:'scrap-ship',planet:w.saves[1].state.planets[1].id,key:'titan',count:1}}),/Planet nicht gefunden/);
});

test('Deployable dashboard bundle matches the source scrapping refund and ownership checks',async()=>{
 const {readFileSync}=await import('node:fs'),code=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');const bundled=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+code+'\nexport {act,scrapShipInfo};').toString('base64'));const s=ready(),action={type:'scrap-ship',key:'titan',count:2};assert.deepEqual(bundled.scrapShipInfo(s.planets[0],'titan',2),scrapShipInfo(s.planets[0],'titan',2));assert.deepEqual(bundled.act(s,action,T),act(s,action,T));
});
