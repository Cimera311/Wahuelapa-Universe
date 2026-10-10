import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,A,B,T,ID} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {combatStats,resolveBattle} from '../src/combat.js';
import {socialFlight} from '../src/social-world.js';
import {sharedFlight} from '../src/flight.js';
import {socialView} from '../src/social-ui.js';
import {vector} from '../src/config.js';
function world(){return {...fixture(),socialVersion:1,partners:[],socialMissions:[],trades:[]};}
let sequence=0;
const cmd=(w,uid,action)=>processWorld(w,uid,{type:'social',eventId:'20000000-0000-0000-0000-'+String(++sequence).padStart(12,'0'),action});
function friends(){let w=cmd(world(),A,{op:'invite',friend:B,delivery:true,defense:true});return cmd(w,B,{op:'accept',id:w.partners[0].id,delivery:true,defense:true});}
const from='g-helion-p1',to='g-orion-p1';
test('Invitations require the named recipient; grants are directional and can be withdrawn',()=>{
 let w=cmd(world(),A,{op:'invite',friend:B,delivery:false,defense:false}),id=w.partners[0].id;assert.throws(()=>cmd(w,A,{op:'accept',id}),/eingeladene/);assert.throws(()=>cmd(w,A,{op:'invite',friend:B}),/bereits/);w=cmd(w,B,{op:'accept',id,delivery:true});assert.equal(projectPvP(w,A).social.partners[0].received.delivery,true);assert.equal(projectPvP(w,B).social.partners[0].received.delivery,false);assert.throws(()=>cmd(w,A,{op:'support',from,to,fleet:{waechter:1}}),/Recht/);assert.throws(()=>cmd(w,B,{op:'permissions',id:'wrong',delivery:true}),/nicht gefunden/);
});
test('Delivery reserves ships, hulls and both-leg fuel; stock arrives on schedule including overflow',()=>{
 let w=friends(),source=w.saves[0].state.planets[1],target=w.saves[1].state.planets[1];source.hulls={karawane:[.7]};const info=socialFlight(w.saves[0].state,source,target,{karawane:2},'delivery');assert.equal(info.ms,sharedFlight(w.saves[0].state,source,target,2,'karawane').ms);target.resources.metal=33408.4;
 w=cmd(w,A,{op:'deliver',from,to,fleet:{karawane:2},cargo:vector([1000,500,0])});const m=w.socialMissions[0];assert.equal(m.due,T+info.ms);assert.equal(w.saves[0].state.planets[1].ships.karawane,2);assert.equal(w.saves[0].state.planets[1].resources.fuel,10000-info.fuel);assert.equal(projectPvP(w,'stranger').social.missions.length,0);
 w=processWorld({...w,now:m.due},B,{type:'sync'});assert.equal(w.socialMissions[0].status,'returning');assert.ok(w.saves[1].state.planets[1].depot.metal>0);assert.equal(w.saves[1].state.planets[1].resources.crystal,10500);
 w=processWorld({...w,now:T+2*info.ms},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].ships.karawane,4);assert.deepEqual(w.saves[0].state.planets[1].hulls.karawane,[.7]);const stocks=structuredClone(w.saves);assert.deepEqual(processWorld(w,A,{type:'sync'}).saves,stocks);
});
test('Tutorial destinations, own planets, negative cargo, invalid fleet classes and unavailable drives reject atomically',()=>{
 const w=friends(),before=JSON.stringify(w);for(const a of [{op:'deliver',from,to:'home',fleet:{karawane:1},cargo:vector([1,0,0])},{op:'deliver',from,to:from,fleet:{karawane:1},cargo:vector([1,0,0])},{op:'support',from,to,fleet:{karawane:1}},{op:'deliver',from,to,fleet:{karawane:1},cargo:vector([-1,0,0])}])assert.throws(()=>cmd(w,A,a));assert.equal(JSON.stringify(w),before);w.saves[0].state.tech.ramjet=0;assert.throws(()=>cmd(w,A,{op:'support',from,to,fleet:{waechter:1}}),/Antrieb/);
});
test('Support ownership stays separate, host cannot use it and either side can send it home',()=>{
 let w=cmd(friends(),A,{op:'support',from,to,fleet:{waechter:2}}),m=w.socialMissions[0];w=processWorld({...w,now:m.due},B,{type:'sync'});assert.equal(w.socialMissions[0].status,'stationed');assert.equal(w.saves[1].state.planets[1].ships.waechter,0);assert.throws(()=>cmd(w,B,{op:'recall',id:m.id}),/darfst/);w=cmd(w,B,{op:'dismiss',id:m.id});assert.equal(w.socialMissions[0].status,'returning');assert.equal(w.socialMissions[0].due,m.due+m.duration);w=processWorld({...w,now:m.due+m.duration},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].ships.waechter,4);
});
test('In-flight recall takes elapsed travel time; ending partnership recalls support and undelivered cargo',()=>{
 let w=cmd(friends(),A,{op:'support',from,to,fleet:{waechter:1}}),m=w.socialMissions[0];w.now=T+10000;w=cmd(w,A,{op:'recall',id:m.id});assert.equal(w.socialMissions[0].due,T+20000);w=processWorld({...w,now:T+20000},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].ships.waechter,4);
 w=cmd(friends(),A,{op:'deliver',from,to,fleet:{karawane:1},cargo:vector([500,0,0])});w.now=T+10000;w=cmd(w,B,{op:'end',id:w.partners[0].id});assert.equal(w.socialMissions[0].status,'returning');w=processWorld({...w,now:T+20000},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].resources.metal,10000);assert.equal(w.saves[1].state.planets[1].resources.metal,10000);
});
test('Direct barter pays both parties exactly once; cargo and payment are bound at acceptance',()=>{
 let w=cmd(friends(),A,{op:'trade-offer',from,to,fleet:{karawane:1},cargo:vector([1000,0,0]),payment:vector([0,500,0])}),offer=w.trades[0];assert.equal(w.saves[0].state.planets[1].ships.karawane,4);assert.throws(()=>cmd(w,A,{op:'trade-accept',id:offer.id}),/Empfänger/);w=cmd(w,B,{op:'trade-accept',id:offer.id});const m=w.socialMissions[0];assert.equal(w.saves[1].state.planets[1].resources.crystal,9500);assert.equal(w.saves[0].state.planets[1].resources.metal,9000);assert.throws(()=>cmd(w,B,{op:'trade-accept',id:offer.id}),/nicht mehr offen/);
 // Ending a relationship does not cancel a paid and accepted exchange.
 w=cmd(w,B,{op:'end',id:w.partners[0].id});w=processWorld({...w,now:m.due},B,{type:'sync'});assert.equal(w.saves[1].state.planets[1].resources.metal,11000);assert.equal(w.saves[0].state.planets[1].resources.crystal,10000);w=processWorld({...w,now:m.due+m.duration},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].resources.crystal,10500);
});
test('A failed trade acceptance never withdraws the buyer payment, and expired offers cannot be accepted',()=>{
 let w=cmd(friends(),A,{op:'trade-offer',from,to,fleet:{karawane:1},cargo:vector([1000,0,0]),payment:vector([0,500,0])});w.saves[0].state.planets[1].ships.karawane=0;const before=JSON.stringify(w);assert.throws(()=>cmd(w,B,{op:'trade-accept',id:w.trades[0].id}),/Schiffe/);assert.equal(JSON.stringify(w),before);w.now=T+3600000;assert.throws(()=>cmd(w,B,{op:'trade-accept',id:w.trades[0].id}),/nicht mehr offen/);
});
test('Coalition combat preserves each owner research and assigns losses and damage to its original group',()=>{
 const groups=[{id:'host',owner:B,commander:'Host',fleet:{waechter:1},tech:{}},{id:'ally',owner:A,commander:'Ally',fleet:{waechter:2},tech:{armor:5,weapons:5,shields:5}}];const result=resolveBattle({fleet:{titan:1},tech:{}},{fleet:{waechter:3},tech:{},groups},'coalition');const initial=result.trace.initial;assert.equal(initial.find(u=>u.owner===B).maxHp,combatStats('waechter').hp);assert.equal(initial.find(u=>u.owner===A).maxHp,combatStats('waechter',{armor:5}).hp);assert.equal(result.defenderGroups.length,2);assert.equal(result.defenderGroups.reduce((n,g)=>n+(g.fleet.waechter||0),0),result.defender.fleet.waechter||0);
});
test('Support arriving exactly with an attack defends and reports preserve individual ownership',()=>{
 let w=friends();w=cmd(w,A,{op:'support',from,to,fleet:{waechter:4}});const support=w.socialMissions[0];
 const attacker=structuredClone(w.saves[0]);attacker.user_id='00000000-0000-0000-0000-000000000003';attacker.state.name='Enemy';attacker.state.planets[1].id='g-helion-p2';attacker.state.planets[1].ships.titan=1;attacker.state.active='g-helion-p2';attacker.state.planets[1].slot=2;w.saves.push(attacker);const planet=structuredClone(w.planets[0]);planet.id=planet.meta.id='g-helion-p2';planet.meta.slot=2;planet.owner_id=attacker.user_id;w.planets.push(planet);
 w=processWorld(w,attacker.user_id,{type:'attack',eventId:ID,combatSeed:'enemy',action:{from:'g-helion-p2',to,fleet:{titan:1}}});w.attacks[0].arrival_at=support.due;w.attacks[0].return_at=support.due+100000;
 w=processWorld({...w,now:support.due},B,{type:'sync'});const battle=w.attacks[0].report;assert.equal(battle.supporting.length,1);assert.equal(battle.supporting[0].owner,A);assert.equal(battle.defenderBefore.waechter,4);assert.equal(w.saves[1].state.planets[1].ships.waechter,0);assert.equal(projectPvP(w,A).reports.length,1);assert.equal(projectPvP(w,'stranger').reports.length,0);assert.ok(battle.trace.initial.some(u=>u.owner===A));
 const survivors=battle.supporting[0].after.waechter||0;const mission=w.socialMissions[0];if(survivors){w=cmd(w,A,{op:'recall',id:mission.id});w=processWorld({...w,now:w.socialMissions[0].due},A,{type:'sync'});assert.equal(w.saves[0].state.planets[1].ships.waechter,survivors);}
});
test('Partner UI escapes names, distinguishes ownership and explains consent and reserved barter',()=>{
 const w=friends(),s=w.saves[0].state,projection=projectPvP(w,A).social;projection.partners[0].name='<script>bad</script>';const html=socialView(s,projection,{mode:'trade-offer'});assert.ok(!html.includes('<script>bad'));assert.match(html,/Gegenleistung/);assert.match(html,/Lieferungen auf meine/);assert.match(html,/Erst dann werden Ladung/);assert.match(socialView(s,null),/partnerships.sql/);
});
