import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveBattle,COMBAT_RULE_VERSION} from '../src/combat.js';
import {battleLogView} from '../src/combat-ui.js';
import {roundSummaryView} from '../src/combat-summary.js';

const attacker={fleet:{falke:10,titan:1},tech:{weapons:1,armor:1,shields:1}};
const defender={fleet:{flak:4,laser:2,rail:1,plasma:1,waechter:1},tech:{weapons:2,armor:2,shields:2}};

test('New combat v3 starts with one defender-only orbital attack round',()=>{
 assert.equal(COMBAT_RULE_VERSION,3);
 const r=resolveBattle(attacker,defender,'opening-attack',3);
 assert.equal(r.trace.ruleVersion,3);
 assert.equal(r.rounds[0].round,0);
 assert.equal(r.trace.rounds[0].round,0);
 assert.ok(r.trace.rounds[0].shots.length>0);
 assert.ok(r.trace.rounds[0].shots.every(shot=>shot.shooter.startsWith('D-')));
 assert.ok(r.trace.rounds[0].shots.every(shot=>['flak','laser','rail','plasma'].some(k=>shot.shooter.startsWith('D-'+k+'-'))));
 assert.ok(r.trace.rounds[0].impacts.every(hit=>hit.target.startsWith('A-')));
 assert.ok(r.trace.rounds.length<=7);
 assert.ok(r.trace.rounds.slice(1).every(x=>x.round>=1&&x.round<=6));
 assert.deepEqual(r,resolveBattle(attacker,defender,'opening-attack',3),'fixed seed must remain deterministic');
});

test('Without orbital units combat v3 starts at regular round one',()=>{
 const r=resolveBattle(attacker,{fleet:{waechter:1},tech:{}},'no-platforms',3);
 assert.ok(r.rounds.length);
 assert.equal(r.rounds[0].round,1);
});

test('Rule v2 keeps its historical outcome and never gains round zero',()=>{
 const old=resolveBattle(attacker,defender,'historical',2);
 assert.equal(old.trace.ruleVersion,2);
 assert.ok(old.rounds.every(x=>x.round>=1));
 const next=resolveBattle(attacker,defender,'historical',3);
 assert.notDeepEqual(old.trace.rounds,next.trace.rounds);
 const legacy=resolveBattle(attacker,defender,'historical',1);
 assert.ok(legacy.rounds.every(x=>x.round>=1));
});

test('Round zero is shown independently from battle start in both views',()=>{
 const {trace}=resolveBattle(attacker,defender,'opening-ui',3);
 const view=battleLogView({...trace,ownSide:'defender'},null,{round:-2});
 assert.match(view,/data-battle-round="-2"/);
 assert.match(view,/data-battle-round="0"/);
 assert.match(view,/Orbitaler Erstschlag/);
 const summary=roundSummaryView(trace,trace.rounds[0]);
 assert.match(summary,/Angreifer können in Runde 0 nicht zurückschießen/);
 assert.match(battleLogView({...trace,ownSide:'defender'}, {...trace.rounds[0],shotTotal:trace.rounds[0].shots.length,impactTotal:trace.rounds[0].impacts.length},{round:0}),/Runde 0/);
});

test('Supabase migration allows round zero while retaining historical combat rules v2',()=>{
 const sql=readFileSync('supabase/combat-round-zero-v3.sql','utf8');
 assert.match(sql,/check\(round between 0 and 6\)/);
 assert.match(sql,/ruleVersion'\)::integer not in \(2,3\)/);
 assert.match(sql,/jsonb_array_length\(trace->'rounds'\)>7/);
 assert.match(sql,/p_round not between 0 and 6/);
});
