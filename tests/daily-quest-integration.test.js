import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,A} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {newGame,stats,advance} from '../src/engine.js';
import {vector} from '../src/config.js';
let seq=0;
function command(world,action){return processWorld(world,A,{type:'pirate',eventId:'daily-'+ ++seq,combatSeed:'daily-test',action});}
function fixtureWorld(){
 const w=fixture();w.pirateVersion=1;w.pirateConfig={flightTimeFactor:.1};w.piratePlayers=[];w.settings.combat_engine=6;
 const home=w.saves[0].state.planets[0];home.buildings.warehouse=10;home.resources=vector([20000,20000,20000]);home.ships.falke=100;home.ships.karawane=2;
 return command(w,{op:'open'});
}
test('daily quest is claimed only for a victorious attack launched after acceptance and persists in pirate world',()=>{
 let w=fixtureWorld();
 assert.equal(projectPvP(w,A).pirates.dailyQuest.status,'available');
 w=command(w,{op:'daily-accept'});
 assert.equal(projectPvP(w,A).pirates.dailyQuest.status,'active');
 assert.throws(()=>command(w,{op:'daily-accept'}),/bereits angenommen/);
 assert.throws(()=>command(w,{op:'daily-claim',reward:'all',planetId:'home'}),/noch nicht abgeschlossen/);
 w=command(w,{op:'attack',station:'smugglers',from:'home',fleet:{falke:100,karawane:1}});
 const m=w.piratePlayers[0].missions[0];
 w=processWorld({...w,now:m.arrivalAt},A,{type:'sync'});
 assert.equal(w.piratePlayers[0].reports[0].outcome,'attacker');
 assert.equal(projectPvP(w,A).pirates.dailyQuest.status,'ready');
 assert.throws(()=>command(w,{op:'daily-claim',reward:'all',planetId:'not-owned'}),/gehört dir nicht/);
 w=command(w,{op:'daily-claim',reward:'all',planetId:'home'});
 assert.equal(projectPvP(w,A).pirates.dailyQuest.status,'claimed');
 assert.equal(w.piratePlayers[0].dailyBonus.planetId,'home');
 assert.equal(w.piratePlayers[0].dailyBonus.reward,'all');
 assert.equal(w.saves[0].state.dailyPirateBonus.planetId,'home');
 assert.equal(w.piratePlayers[0].dailyBonus.expiresAt-w.piratePlayers[0].dailyBonus.startedAt,12*3600000);
 assert.throws(()=>command(w,{op:'daily-claim',reward:'metal',planetId:'home'}),/noch nicht abgeschlossen/);
 // Client-supplied bonus is discarded on the next authoritative snapshot.
 w.saves[0].state.dailyPirateBonus={planetId:'home',reward:'metal',startedAt:w.now,expiresAt:w.now+999999999};
 w=processWorld({...w,now:w.now+1000},A,{type:'sync'});
 assert.equal(w.saves[0].state.dailyPirateBonus.reward,'all');
});
test('production splits exactly at the bonus expiry and only boosts chosen resource',()=>{
 const t=1800000000000;const s=newGame('Quest test',t),p=s.planets[0];
 p.buildings.solar=20;p.buildings.metal=4;p.buildings.crystal=4;p.buildings.fuel=4;p.buildings.warehouse=20;
 p.resources=vector([0,0,0]);
 const baseline=stats(s,p).rates;
 s.dailyPirateBonus={planetId:p.id,reward:'crystal',startedAt:t,expiresAt:t+1800000};
 const during=stats(s,p).rates;
 assert.equal(during.crystal,baseline.crystal*1.09);
 assert.equal(during.metal,baseline.metal);
 assert.equal(during.fuel,baseline.fuel);
 const a=structuredClone(s),b=structuredClone(s);
 advance(a,t+3600000);
 advance(b,t+1800000);advance(b,t+3600000);
 for(const k of ['metal','crystal','fuel'])assert.ok(Math.abs(a.planets[0].resources[k]-b.planets[0].resources[k])<1e-6,k);
 assert.ok(Math.abs(a.planets[0].resources.crystal-baseline.crystal*1.045)<1e-4);
 assert.equal(stats(a,a.planets[0]).rates.crystal,baseline.crystal);
});
