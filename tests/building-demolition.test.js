import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,buildInfo,buildingLevelCost,demolishInfo,stats,capacity} from '../src/engine.js';
import {validateSave,parseSave} from '../src/storage.js';
import {RES,vector} from '../src/config.js';
import {readFileSync} from 'node:fs';
import {processWorld,projectPvP} from '../src/server-world.js';
import {ui,tick} from './helpers/game-ui.js';

const T=1800000000000;
const resourceFree=()=>{
 const s=newGame('Demolition',T),p=s.planets[0];
 p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;
 p.buildings.warehouse=10;p.resources=vector([100000,100000,100000]);
 return s;
};
const refund=cost=>Object.fromEntries(RES.map(k=>[k,Math.floor(cost[k]*.2)]));

test('Single-level demolition has 20% refund, 25% duration and no immediate payment',()=>{
 let s=resourceFree(),p=s.planets[0];p.buildings.solar=3;
 const quote=demolishInfo(s,p,'solar'),original=buildInfo({...s,tech:{...s.tech}}, {...p,buildings:{...p.buildings,solar:2}},'solar');
 assert.deepEqual(quote.originalCost,buildingLevelCost('solar',2));
 assert.deepEqual(quote.refund,refund(original.cost));
 assert.equal(quote.ms,Math.ceil(original.ms*.25));
 const before={...p.resources};
 s=act(s,{type:'demolish',key:'solar'},T);p=s.planets[0];
 assert.equal(p.buildings.solar,3);
 assert.deepEqual(p.resources,before);
 assert.equal(p.build.kind,'demolish');
 assert.equal(p.build.level,2);
 validateSave(s);
 advance(s,p.build.end-1);assert.equal(p.buildings.solar,3);
 advance(s,p.build.end);assert.equal(p.buildings.solar,2);
 assert.equal(p.build,null);
 for(const k of RES)assert.equal(p.resources[k],before[k]+quote.refund[k]);
 const again=structuredClone(p.resources);advance(s,s.time+1000000);
 assert.deepEqual(p.resources,again,'refund must only be paid once');
 assert.match(s.reports[0].title,/Rückbau abgeschlossen/);
});

test('Real paid cost and build time survive changed tech, robotics and save reload',()=>{
 let s=resourceFree(),p=s.planets[0];s.tech.engineering=1;p.buildings.robotics=1;
 const quote=buildInfo(s,p,'solar');
 s=act(s,{type:'build',key:'solar'},T);p=s.planets[0];assert.deepEqual(p.build.paid,quote.cost);
 assert.equal(p.build.originalMs,quote.ms);
 advance(s,p.build.end);
 const level=p.buildings.solar;
 assert.deepEqual(p.buildHistory.solar[level],{cost:quote.cost,ms:quote.ms});
 s.tech.engineering=5;p.buildings.robotics=5;
 s=parseSave(JSON.stringify(s));p=s.planets[0];
 const demolition=demolishInfo(s,p,'solar');
 assert.deepEqual(demolition.refund,refund(quote.cost));
 assert.equal(demolition.ms,Math.ceil(quote.ms*.25));
 s=act(s,{type:'demolish',key:'solar'},s.time);advance(s,s.planets[0].build.end);
 assert.equal(s.planets[0].buildHistory.solar[level],undefined);
 validateSave(s);
});

test('Warehouse downsize conserves all stocks by moving overflow into the depot',()=>{
 let s=resourceFree(),p=s.planets[0];p.buildings.warehouse=1;p.resources=vector([6000,5500,4200]);
 const before=Object.fromEntries(RES.map(k=>[k,p.resources[k]+p.depot[k]]));
 const quote=demolishInfo(s,p,'warehouse');
 s=act(s,{type:'demolish',key:'warehouse'},T);p=s.planets[0];
 advance(s,p.build.end);
 assert.equal(p.buildings.warehouse,0);
 for(const k of RES){
  assert.ok(p.resources[k]<=capacity(p));
  assert.equal(p.resources[k]+p.depot[k],before[k]+quote.refund[k]);
 }
});

test('Downgrade guard preserves essential live dependencies but allows power shortages',()=>{
 let s=resourceFree(),p=s.planets[0];p.buildings.solar=1;p.buildings.metal=1;
 assert.equal(demolishInfo(s,p,'solar').reason,'');
 assert.ok(stats(s,{...p,buildings:{...p.buildings,solar:0}}).ratio<stats(s,p).ratio);
 assert.equal(demolishInfo(s,p,'metal').reason,'');
 assert.match(demolishInfo(s,p,'tidal').reason,/Keine Gebäudestufe/);
 p.buildings.lab=1;p.buildings.shipyard=1;
 assert.match(demolishInfo(s,p,'lab').reason,/Schiffswerft/);
 p.buildings.shipyard=2;p.buildings.repairDock=1;
 assert.match(demolishInfo(s,p,'shipyard').reason,/Reparaturdock/);
 p.repairQueue=[{id:1,entries:[{hp:.5}]}];
 assert.match(demolishInfo(s,p,'repairDock').reason,/Einheiten/);
 p.repairQueue=[];p.buildings.repairDock=0;p.buildings.shipyard=1;
 p.shipjob={key:'falke'};
 assert.match(demolishInfo(s,p,'shipyard').reason,/Schiffsbauaufträge/);
 p.shipjob=null;p.buildings.orbital=1;p.orbitaljob={key:'flak'};
 assert.match(demolishInfo(s,p,'orbital').reason,/Plattformaufträge/);
 p.orbitaljob=null;
 s.research={planet:'home',key:'scout'};
 assert.match(demolishInfo(s,p,'lab').reason,/laufende Forschung|Schiffswerft/);
});

test('Active building slot rejects second demolition and all upgrades; malformed jobs and ledger rejected',()=>{
 let s=resourceFree();s=act(s,{type:'demolish',key:'solar'},T);
 assert.throws(()=>act(s,{type:'demolish',key:'solar'},T),/Bauauftrag/);
 assert.throws(()=>act(s,{type:'build',key:'metal'},T),/Bauauftrag/);
 for(const mutate of [
  j=>j.level+=2,
  j=>j.refund.metal=-1,
  j=>j.originalMs=Infinity,
  j=>j.kind='invalid'
 ]){
  const bad=structuredClone(s);mutate(bad.planets[0].build);assert.throws(()=>validateSave(bad));
 }
 const bad=structuredClone(resourceFree());bad.planets[0].buildHistory={solar:{'4':{cost:vector([9999,9999,9999]),ms:2000}}};
 assert.throws(()=>validateSave(bad));
 // Unmodified older saves had neither a historical ledger nor a new job kind.
 const old=resourceFree();delete old.planets[0].buildHistory;
 old.planets[0].build={key:'metal',level:1,start:T,end:T+1000};
 old.planets[0].buildings.metal=0;
 validateSave(old);
});

test('Server processes demolition through authoritative command and keeps its return idempotent',()=>{
 const uid='00000000-0000-0000-0000-000000000001',s=resourceFree();
 const w={now:T,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state:s}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};
 const result=processWorld(w,uid,{type:'command',action:{type:'demolish',key:'solar',planet:'home'}});
 assert.equal(projectPvP(result,uid).features.buildingDemolition,true);
 assert.equal(result.saves[0].state.planets[0].build.kind,'demolish');
 assert.equal(w.saves[0].state.planets[0].build,null);
 const at=result.saves[0].state.planets[0].build.end;
 const paid=processWorld({...result,now:at},uid,{type:'sync'});
 const again=processWorld({...paid,now:at+5000},uid,{type:'sync'});
 assert.equal(again.saves[0].state.planets[0].buildings.solar,2);
 assert.equal(again.saves[0].state.reports.filter(r=>r.title==='Rückbau abgeschlossen').length,1);
});

test('Demolition confirmation modal previews values and cancel never triggers a command',async t=>{
 const {doc,api}=ui(t),p=api.state().planets[0];p.buildings.solar=5;
 doc.querySelector('[data-action="tab"][data-tab="build"]').click();
 let trigger=doc.querySelector('[data-action="demolish-open"][data-key="solar"]');
 assert.ok(trigger);trigger.click();
 let dialog=doc.querySelector('dialog.demolition-dialog');assert.ok(dialog);
 assert.match(dialog.textContent,/Wirklich zurückbauen/);
 assert.match(dialog.textContent,/Erstattung \(20 %\)/);
 assert.match(dialog.textContent,/Rückbauzeit \(25 %\)/);
 assert.match(dialog.textContent,/5\s*→\s*4/);
 dialog.querySelector('[data-demolition-cancel]').click();
 assert.equal(api.state().planets[0].build,null);
 dialog.remove();
 trigger=doc.querySelector('[data-action="demolish-open"][data-key="solar"]');trigger.click();
 dialog=doc.querySelector('dialog.demolition-dialog');
 dialog.querySelector('[data-demolition-confirm]').click();
 await tick();assert.equal(api.state().planets[0].build.kind,'demolish');
});

test('Older game-command blocks demolition buttons until server advertises the feature',t=>{
 const {doc,api}=ui(t);
 api.attach({authoritative:true,pvp:{features:{repairDock:true}}});api.show('overview');
 doc.querySelector('[data-action="tab"][data-tab="build"]').click();
 const action=doc.querySelector('[data-action="demolish-open"][data-key="solar"]');
 assert.equal(action.disabled,true);
 assert.match(doc.body.textContent,/Rückbau benötigt die neue Serverversion/);
});

test('Archived dashboard game-command handles demolition exactly like server sources',async()=>{
 const content=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');
 const module=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+content+'\nexport {processWorld,projectPvP};').toString('base64'));
 const uid='00000000-0000-0000-0000-000000000001',s=resourceFree();
 const w={now:T,settings:{enabled:false},admins:[],saves:[{user_id:uid,revision:1,state:s}],starts:[],planets:[],missions:[],attacks:[],surveys:[]};
 const request={type:'command',action:{type:'demolish',key:'solar',planet:'home'}};
 const sourceResult=processWorld(w,uid,request),bundledResult=module.processWorld(w,uid,request);
 assert.deepEqual(bundledResult,sourceResult);
 const due=sourceResult.saves[0].state.planets[0].build.end;
 assert.deepEqual(module.processWorld({...bundledResult,now:due},uid,{type:'sync'}),processWorld({...sourceResult,now:due},uid,{type:'sync'}));
});
