import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {resolveBattle,COMBAT} from '../src/combat.js';
import {battleLogView} from '../src/combat-ui.js';
import {reportDetail} from '../src/reports-ui.js';
const side=(fleet,extra={})=>({fleet,tech:{},...extra});
const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002',C='00000000-0000-0000-0000-000000000003',ID='10000000-0000-0000-0000-000000000001';
test('Civilian protection applies to both sides for the entire simultaneous round',()=>{
 const r=resolveBattle(side({falke:1,atlas:2},{hulls:{falke:[.01]},shieldFactor:0}),side({falke:1,atlas:2},{hulls:{falke:[.01]},shieldFactor:0}),'both');
 assert.equal(r.trace.rounds[0].shots.length,2);assert.ok(r.trace.rounds[0].shots.every(s=>s.target.includes('falke')));assert.equal(r.attacker.fleet.atlas,2);assert.equal(r.defender.fleet.atlas,2);
 const prior=COMBAT.falke.bonus.transport;try{COMBAT.falke.bonus.transport=99;const q=resolveBattle(side({falke:1}),side({titan:1,transport:20}),'protected');assert.ok(q.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A')).every(s=>s.target.includes('titan')));}finally{if(prior===undefined)delete COMBAT.falke.bonus.transport;else COMBAT.falke.bonus.transport=prior;}
});
test('Bonus targets win over normal warships, and fallback is military then defense then civil',()=>{
 const r=resolveBattle(side({donner:1}),side({titan:1,laser:2,atlas:10}),'bonus');assert.ok(r.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A')).every(s=>s.target.includes('laser')&&s.reason==='bonus'&&s.bonus===.5));
 for(const [fleet,target,reason] of [[{titan:1,laser:1,atlas:1},'titan','military'],[{laser:1,atlas:1},'laser','defense'],[{atlas:1},'atlas','civil']]){const q=resolveBattle(side({waechter:1}),side(fleet),'fallback');assert.ok(q.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A')).every(s=>s.target.includes(target)&&s.reason===reason));}
});
test('Every shot is accounted for; simultaneous damage conserves shield, hull and overkill',()=>{
 const r=resolveBattle(side({titan:2},{tech:{weapons:3}}),side({falke:3,laser:1}),'trace');
 const initial=new Map(r.trace.initial.map(u=>[u.id,u]));assert.equal(initial.size,r.trace.initial.length);
 for(const round of r.trace.rounds){const sums=new Map();for(const shot of round.shots){assert.ok(initial.has(shot.shooter)&&initial.has(shot.target));assert.equal(shot.damage,shot.base*(1+shot.bonus));sums.set(shot.target,(sums.get(shot.target)||0)+shot.damage);}
  assert.equal(round.impacts.length,sums.size);for(const hit of round.impacts){assert.equal(hit.damage,sums.get(hit.target));assert.ok(Math.abs(hit.damage-hit.shieldDamage-hit.hullDamage-hit.overkill)<1e-7);assert.ok(hit.hpAfter>=0);}
 }
 assert.deepEqual(resolveBattle(side({titan:2},{tech:{weapons:3}}),side({falke:3,laser:1}),'trace'),r);
});
test('Protected civilians become targets next round, and legacy version remains available',()=>{
 const r=resolveBattle(side({titan:1}),side({falke:1,atlas:1},{hulls:{falke:[.01]},shieldFactor:0}),'next');assert.ok(r.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A')).every(s=>s.target.includes('falke')));assert.ok(r.trace.rounds[1].shots.some(s=>s.target.includes('atlas')));
 const old=resolveBattle(side({titan:1}),side({atlas:1}),'old',1);assert.equal(old.trace,undefined);assert.throws(()=>resolveBattle(side({falke:1}),side({falke:1}),'x',999),/regelversion/);
});
test('Replay UI escapes stored names and explains simultaneous shots, with paged details',()=>{
 const r=resolveBattle(side({titan:1}),side({falke:1}),'ui');const h={...r.trace,from:'<img onerror=x>',to:'Target',participants:{attacker:'<script>x</script>',defender:'B'},ownSide:'attacker',rounds:r.trace.rounds.map(q=>({round:q.round,after:q.after}))};
 const q=r.trace.rounds[0],page={...q,shotTotal:401,impactTotal:q.impacts.length};const html=battleLogView(h,page,{round:1,offset:0});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('Nächste Seite'));assert.ok(html.includes('keine zeitliche Trefferfolge'));assert.ok(html.includes('Schild absorbiert'));
 assert.ok(reportDetail({kind:'battle',missionId:ID,payload:{traceAvailable:true,rounds:[]}},null,null).includes('data-mission="'+ID+'"'));
});
test('Battle logs are stored atomically, separately and once; only participants can page them',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 for(const id of [A,B,C])await db.query('insert into auth.users values($1)',[id]);
 const result=resolveBattle(side({titan:60}),side({titan:60}),'db');const trace=result.trace;
 const data={id:ID,from:'home',to:'g-solace-p3',fleet:{titan:60},report:{at:1700000000000,outcome:result.outcome,traceAvailable:true,trace,rounds:result.rounds}};
 const insert=async d=>db.query("insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data) values($1,$2,$3,now(),now(),now(),now(),'returning',$4)",[ID,A,B,JSON.stringify(d)]);
 await insert(data);assert.equal((await db.query('select data from public.pvp_attacks')).rows[0].data.report.trace,undefined);
 assert.equal((await db.query('select count(*)::int as n from public.pvp_battle_logs')).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int as n from public.pvp_battle_rounds')).rows[0].n,trace.rounds.length);
 const uid=id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 const fetch=async(round=null,offset=0)=>(await db.query('select public.imperium_battle_log($1,$2,$3) as data',[ID,round,offset])).rows[0].data;
 await uid(A);await db.exec('set role authenticated');const h=await fetch();assert.equal(h.ownSide,'attacker');assert.equal(h.initial.length,120);const p1=await fetch(1,0),p2=await fetch(1,200),p3=await fetch(1,400);assert.equal(p1.shots.length,200);assert.equal(p2.shots.length,200);assert.equal(p3.shots.length,80);assert.deepEqual([...p1.shots,...p2.shots,...p3.shots],trace.rounds[0].shots);
 await db.exec('reset role');await db.exec(readFileSync('supabase/combat-log-pagination.sql','utf8'));await db.exec('set role authenticated');assert.equal((await fetch(1,40200)).shots.length,0);await assert.rejects(fetch(1,-1),/INVALID_PAGE/);
 await assert.rejects(db.query('select * from public.pvp_battle_logs'),/permission denied/);
 await uid(B);assert.equal((await fetch()).ownSide,'defender');await uid(C);await assert.rejects(fetch(),/NOT_FOUND/);await uid('');await assert.rejects(fetch(),/AUTH_REQUIRED/);
 await db.exec('reset role');await db.query('update public.pvp_attacks set data=$1 where id=$2',[JSON.stringify(data),ID]);assert.equal((await db.query('select count(*)::int as n from public.pvp_battle_logs')).rows[0].n,1);
 const changed=structuredClone(data);changed.report.trace.seed='changed';await assert.rejects(db.query('update public.pvp_attacks set data=$1 where id=$2',[JSON.stringify(changed),ID]),/IMMUTABLE/);
 assert.equal((await db.query('select header from public.pvp_battle_logs')).rows[0].header.seed,'db');
 assert.ok((await db.query('select payload from public.game_reports where kind=\'battle\'')).rows.every(r=>!r.payload.trace));
 await db.exec(readFileSync('supabase/combat-logs.sql','utf8'));await db.query('delete from public.pvp_attacks where id=$1',[ID]);await uid(A);assert.equal((await fetch()).seed,'db');
});