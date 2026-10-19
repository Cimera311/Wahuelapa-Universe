import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {fixture,A,B,ID} from './helpers/pvp-fixture.js';
import {processWorld,projectPvP} from '../src/server-world.js';
import {resolveBattleHybridV7} from '../src/combat-hybrid.js';
import {pvpSettings} from '../src/pvp-ui.js';

const attack={type:'attack',eventId:ID,combatSeed:'v7-pinned',action:{from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:4,karawane:4}}};
test('v7 PvP launch pins version and matrix; switching back does not rewrite an in-flight battle',()=>{
 let w=fixture();w.settings.combat_engine=7;w.saves[1].state.planets[1].ships.falke=3;
 w=processWorld(w,A,attack);const mission=w.attacks[0];
 assert.equal(mission.ruleVersion,7);assert.equal(mission.combatConfig.combat.rapidFire.chances.falke.titan,.4);
 assert.equal(projectPvP(w,A).combatEngine,7);
 w.settings.combat_engine=5;w.now=mission.arrival_at;
 w=processWorld(w,B,{type:'sync'});
 assert.equal(w.attacks[0].report.ruleVersion,7);assert.equal(w.attacks[0].report.trace.ruleVersion,7);
 assert.equal(w.attacks[0].report.trace.targetingRules.rapidFireTarget,'same');
 assert.equal(projectPvP(w,A).combatEngine,5);
});

test('v7 is available in admin controls, v6 and v5 remain available',()=>{
 const html=pvpSettings({enabled:true,isAdmin:true,combatEngine:7});
 for(const n of [5,6,7])assert.match(html,new RegExp('data-action="combat-engine-'+n+'"'));
 assert.match(html,/v7 · Zieltreues Rapid Fire/);
});

test('v7 PvE mission pins rules at launch and resolves after a switch back',()=>{
 let w=fixture();w.settings.combat_engine=7;w.pirateVersion=1;w.piratePlayers=[];w.pirateConfig={flightTimeFactor:.1};
 const p=w.saves[0].state.planets[0];p.buildings.warehouse=8;p.resources={metal:20000,crystal:20000,fuel:20000};p.ships.falke=100;
 w=processWorld(w,A,{type:'pirate',action:{op:'open'}});
 w=processWorld(w,A,{type:'pirate',eventId:'pirate-v7',combatSeed:'pirate-seed',action:{op:'attack',station:'smugglers',from:'home',fleet:{falke:100}}});
 const m=w.piratePlayers[0].missions[0];assert.equal(m.ruleVersion,7);
 assert.equal(m.combatConfig.combat.rapidFire.chances.falke.titan,.4);
 w.settings.combat_engine=6;w.now=m.arrivalAt;w=processWorld(w,A,{type:'sync'});
 assert.equal(w.piratePlayers[0].reports[0].ruleVersion,7);
 assert.equal(w.piratePlayers[0].reports[0].outcome,'attacker');
});

test('v7 SQL preserves active selection, stores real traces, protects permissions and immutable history',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-round-zero-v3.sql','combat-log-pagination.sql','combat-engine-control-v6.sql','combat-hybrid-v6.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 for(const id of [A,B])await db.query('insert into auth.users values($1)',[id]);
 await db.query('insert into public.pvp_admins values($1)',[A]);
 await db.query('select public.imperium_set_combat_engine($1,6)',[A]);
 const migration=readFileSync('supabase/combat-v7.sql','utf8');
 await db.exec(migration);await db.exec(migration);
 assert.equal((await db.query('select combat_engine from public.pvp_control')).rows[0].combat_engine,6);
 await assert.rejects(db.query('select public.imperium_set_combat_engine($1,7)',[B]),/ADMIN_REQUIRED/);
 await db.exec('set role authenticated');
 await assert.rejects(db.query('select public.imperium_set_combat_engine($1,7)',[A]),/permission denied/);
 await db.exec('reset role');await db.exec('set role service_role');
 await db.query('select public.imperium_set_combat_engine($1,7)',[A]);
 await db.exec('reset role');
 assert.equal((await db.query('select combat_engine from public.pvp_control')).rows[0].combat_engine,7);
 assert.equal((await db.query('select count(*)::int as n from public.pvp_combat_engine_log where engine=7')).rows[0].n,1);
 const result=resolveBattleHybridV7({fleet:{titan:1},tech:{}},{fleet:{falke:4,flak:1},tech:{}},'sql');
 const data={id:ID,from:'home',to:'g-solace-p3',fleet:{titan:1},report:{at:1700000000000,outcome:result.outcome,traceAvailable:true,trace:result.trace,rounds:result.rounds}};
 await db.query("insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data) values($1,$2,$3,now(),now(),now(),now(),'returning',$4)",[ID,A,B,JSON.stringify(data)]);
 assert.equal((await db.query('select header from public.pvp_battle_logs where mission_id=$1',[ID])).rows[0].header.ruleVersion,7);
 assert.equal((await db.query('select count(*)::int as n from public.pvp_battle_rounds where mission_id=$1',[ID])).rows[0].n,result.trace.rounds.length);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);await db.exec('set role authenticated');
 const header=(await db.query('select public.imperium_battle_log($1,null,0) as data',[ID])).rows[0].data;assert.equal(header.ruleVersion,7);
 const page=(await db.query('select public.imperium_battle_log($1,0,0) as data',[ID])).rows[0].data;assert.ok(page.shots.length);
 await db.exec('reset role');
 const changed=structuredClone(data);changed.report.trace.seed='tampered';
 await assert.rejects(db.query('update public.pvp_attacks set data=$1 where id=$2',[JSON.stringify(changed),ID]),/IMMUTABLE/);
 await db.query('select public.imperium_set_combat_engine($1,6)',[A]);
 await db.query('select public.imperium_set_combat_engine($1,5)',[A]);
 assert.equal((await db.query('select combat_engine from public.pvp_control')).rows[0].combat_engine,5);
});
