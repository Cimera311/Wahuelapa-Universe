import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,A,T} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {newGame,advance} from '../src/engine.js';
import {acceptPvpDaily,completePvpDaily,claimPvpDaily,pvpDailyStatus} from '../src/pvp-daily.js';
let seq=0;
const cmd=(w,action)=>processWorld(w,A,{type:'pvp-daily',eventId:'daily-'+ ++seq,action});
function setup(){const w=fixture();w.pirateVersion=1;w.piratePlayers=[];w.pirateConfig={flightTimeFactor:.1};return processWorld(w,A,{type:'pirate',action:{op:'open'}});}
test('daily requires acceptance, then actual attacker victory on an attack started afterwards',()=>{
 const q=acceptPvpDaily(null,T);
 assert.equal(pvpDailyStatus(q,T),'active');
 assert.equal(completePvpDaily(q,{started_at:T-1},T+200,'attacker'),q);
 assert.equal(completePvpDaily(q,{started_at:T},T+200,'defender'),q);
 assert.equal(completePvpDaily(q,{started_at:T},T+200,'attacker').wonAt,T+200);
 assert.equal(pvpDailyStatus(completePvpDaily(q,{started_at:T},T+200,'attacker'),T+200),'ready');
});
test('claim rejects foreign planet, overlapping bonus, and double claims',()=>{
 const q=completePvpDaily(acceptPvpDaily(null,T),{started_at:T},T+1,'attacker');
 assert.throws(()=>claimPvpDaily(q,'foreign',['home'],T+2,null),/eigenen Planeten/);
 const x=claimPvpDaily(q,'home',['home'],T+2,null);
 assert.equal(x.bonus.expiresAt-x.bonus.startedAt,12*3600000);
 assert.equal(x.bonus.speed,1.1);
 assert.throws(()=>claimPvpDaily(x.quest,'home',['home'],T+3,null),/noch nicht/);
 assert.throws(()=>claimPvpDaily(q,'home',['home'],T+4,x.bonus),/bereits aktiv/);
});
test('server persists acceptance and does not trust injected bonus from client saves',()=>{
 let w=setup();w=cmd(w,{op:'accept'});
 assert.equal(projectPvP(w,A).pvpDaily.status,'active');
 assert.throws(()=>cmd(w,{op:'accept'}),/bereits angenommen/);
 w.saves[0].state.pvpShipyardBonus={planetId:'home',startedAt:T,expiresAt:T+10000000,speed:1000};
 w=processWorld(w,A,{type:'sync'});
 assert.equal(w.saves[0].state.pvpShipyardBonus,undefined);
});
test('bonus speeds ship job, not orbital job, with offline catch-up identical to split advance',()=>{
 const t=1800000000000,s=newGame('Werkstatt',t),p=s.planets[0];
 Object.assign(p.buildings,{solar:15,shipyard:4,orbital:3});
 p.shipjob={id:10,key:'falke',count:1,start:t,end:t+3600000,workTotal:3600000,workRemaining:3600000};
 p.orbitaljob={id:11,key:'flak',count:1,start:t,end:t+3600000,workTotal:3600000,workRemaining:3600000};
 s.pvpShipyardBonus={planetId:p.id,startedAt:t,expiresAt:t+1800000,speed:1.1};
 const once=structuredClone(s),split=structuredClone(s);
 advance(once,t+3600000);
 advance(split,t+1800000);advance(split,t+3600000);
 assert.deepEqual(once,split);
 assert.ok(once.planets[0].ships.falke>=1);
 assert.equal(once.planets[0].ships.flak,1);
});
