import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,legInfo,flightInfo,routeLegInfo,act,advance} from '../src/engine.js';
import {sharedDistance,sharedFlight} from '../src/flight.js';
import {attackFlight} from '../src/combat.js';
import {resolveBattle,attackFleet} from '../src/combat.js';
import {galaxyFlight} from '../src/galaxy.js';
import {TECHS,vector} from '../src/config.js';
const ready=()=>{const s=newGame('Flight',1800000000000);for(const [key,t] of Object.entries(TECHS))s.tech[key]=t.max;s.galaxy={x:100,y:100};s.planets[0].buildings.warehouse=15;s.planets[0].resources=vector([10000,10000,10000]);return s;};
const colony=(s,system='helion',slot=1,x=500,y=100)=>({...structuredClone(s.planets[0]),id:'g-'+system+'-p'+slot,system,slot,distance:slot,x,y});

test('same ship, research and path: private transfer, trade and attack have identical galaxy duration',()=>{
 const s=ready(),p=s.planets[0],q=colony(s),r=colony(s,'orion',8,900,300);
 for(const [from,to] of [[p,q],[q,p],[q,r],[r,q],[q,colony(s,'helion',10)]]){
  for(const key of ['karawane','atlas','arche','falke','waechter','donner','titan']){
   const f=legInfo(s,from,to,3,key),expected=sharedFlight(s,from,to,3,key);
   assert.equal(f.ms,expected.ms);assert.equal(f.fuel,expected.fuel);
   if(to.system){const a=attackFlight(s,from,to,{[key]:3,...(['karawane','atlas','arche'].includes(key)?{falke:1}:{})});assert.equal(a.ms,f.ms);assert.equal(a.fuel,f.fuel*2+(['karawane','atlas','arche'].includes(key)?sharedFlight(s,from,to,1,'falke').fuel*2:0));}
   if(['karawane','atlas','arche'].includes(key)){const trade=routeLegInfo(s,from,to,3,key);assert.equal(trade.ms,f.ms);assert.equal(trade.fuel,Math.ceil(f.fuel*.75));}
  }
 }
});

test('distance is symmetric, private planets share entrance, local slots matter everywhere',()=>{
 const s=ready(),q=colony(s),r=colony(s,'helion',10);
 assert.ok(Math.abs(sharedDistance(q,r,s.galaxy)-1.35)<1e-12);assert.equal(sharedDistance(r,q,s.galaxy),sharedDistance(q,r,s.galaxy));
 assert.equal(sharedDistance(s.planets[0],q,s.galaxy),10.15);
 const privatePlanet={...s.planets[0],id:'ferrum',distance:2};
 assert.equal(sharedDistance(privatePlanet,q,s.galaxy),sharedDistance(s.planets[0],q,s.galaxy));
 assert.throws(()=>sharedDistance({},q,undefined),/Startplatz/);
});

test('scans and colonies use ship-specific shared formula; probe fuel includes return',()=>{
 const s=ready(),q=colony(s),from=s.planets[0];
 for(const ship of ['longProbe','starColony']){
  const f=sharedFlight(s,from,q,1,ship),g=galaxyFlight(s,from,q,s.galaxy,ship);
  assert.equal(g.ms,f.ms);assert.equal(g.distance,f.distance);assert.equal(g.fuel,f.fuel*(ship==='longProbe'?2:1));
 }
});

test('minimum one minute, effective slowest ship, research and count only affect appropriate values',()=>{
 const s=ready(),from=colony(s),to=colony(s,'helion',2);
 assert.equal(sharedFlight(s,from,to,1,'falke').ms,68750);
 s.tech.drive=5;assert.equal(flightInfo(s,s.planets[0],{distance:2},1,false,'transport').ms,16250);
 const f=sharedFlight(s,from,to,1,'longProbe');
 s.tech.scout=0;assert.equal(sharedFlight(s,from,to,1,'longProbe').ms,f.ms);
 const a=attackFlight(s,from,to,{falke:100,titan:1});assert.equal(a.ms,sharedFlight(s,from,to,1,'titan').ms);assert.equal(a.slowest,'titan');
 assert.equal(sharedFlight(s,from,to,100,'falke').ms,sharedFlight(s,from,to,1,'falke').ms);
 // Minimum is reached by locally using a researched fast ship.
 s.tech.drive=20;assert.equal(sharedFlight(s,from,to,1,'falke').ms,60000);
});

test('existing outbound and return timestamps survive new logic and research changes',()=>{
 let s=ready(),p=s.planets[0],q=colony(s);s.planets.push(q);p.ships.karawane=1;
 s=act(s,{type:'deliver',ship:'karawane',count:1,to:q.id,order:vector([100,0,0])},s.time);
 const m=s.missions[0],start=s.time; m.duration=123456;m.due=start+m.duration;
 s.tech.ramjet=0;s=advance(s,start+1000);assert.equal(s.missions[0].due,start+123456);
 s=advance(s,start+123456);assert.equal(s.missions[0].duration,123456);assert.equal(s.missions[0].due,start+246912);
 s=advance(s,start+246912);assert.equal(s.missions.length,0);assert.equal(s.planets[0].ships.karawane,1);
});

test('dashboard bundle executes the same flight rules, combat traces and uncapped attack manifests',async()=>{
 const code=readFileSync('supabase/dashboard/game-command.ts','utf8').replace(/^import .*?;$/gm,'');
 const bundled=await import('data:text/javascript;base64,'+Buffer.from('const Deno={serve(){}};\n'+code+'\nexport {sharedFlight,attackFlight,galaxyFlight,resolveBattle,attackFleet};').toString('base64'));
 const s=ready(),from=s.planets[0],to=colony(s);
 assert.deepEqual(bundled.sharedFlight(s,from,to,10,'titan'),sharedFlight(s,from,to,10,'titan'));
 assert.deepEqual(bundled.attackFlight(s,from,to,{falke:110,titan:1}),attackFlight(s,from,to,{falke:110,titan:1}));
 assert.deepEqual(bundled.galaxyFlight(s,from,to,s.galaxy),galaxyFlight(s,from,to,s.galaxy));
 assert.deepEqual(bundled.attackFleet({falke:110}),attackFleet({falke:110}));
 const a={fleet:{falke:200}},d={fleet:{titan:1}};
 assert.deepEqual(bundled.resolveBattle(a,d,'replay'),resolveBattle(a,d,'replay'));
});
