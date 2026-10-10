import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {newGame} from '../src/engine.js';
import {attackProgress,attackCard,attackDistance,missionReports} from '../src/flight-ui.js';
import {reportRows,reportsPage,filterReports,reportPlanetName} from '../src/reports-ui.js';
const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002',ID='10000000-0000-0000-0000-000000000001',T=1700000000000;
test('Flight phases use actual timestamps, correct direction, ship assets and unknown-world silhouettes',()=>{
 const s=newGame('A',T);s.galaxy={x:500,y:960};const m={id:ID,from:'home',to:'g-orion-p1',arrival:T+480000,returnAt:T+960000,status:'outbound',fleet:{waechter:1,karawane:2}};
 const pvp={serverNow:T,reports:[]},g={systems:[{id:'orion',name:'Orion',x:380,y:250}],planets:[{id:m.to,system:'orion',slot:1,surveyed:false,name:'SECRET',image:'nereus'}]};
 assert.equal(attackProgress(m,T+240000).percent,50);assert.equal(attackProgress(m,T-1).percent,0);assert.equal(attackProgress(m,T+1000000).percent,100);
 const html=attackCard(m,s,pvp,g,T+240000);assert.match(html,/waechter.webp/);assert.match(html,/karawane.webp/);assert.match(html,/50 %/);assert.match(html,/flight-unknown/);assert.doesNotMatch(html,/SECRET|nereus.webp/);assert.match(html,/Orion 1/);assert.match(html,/Berichte zu diesem Einsatz · 1/);
 m.status='returning';assert.equal(attackProgress(m,T+720000).percent,50);assert.match(attackCard(m,s,pvp,g,T+720000),/bis zur Heimkehr/);assert.match(attackCard(m,s,pvp,g,T+720000),/returning/);
 const expected=Math.hypot(500-380,960-250)/40+.15;assert.equal(attackDistance(m,s,g),expected);
 g.planets[0].surveyed=true;assert.match(attackCard(m,s,pvp,g,T+720000),/SECRET/);assert.equal(reportPlanetName(m.to,s,g),'SECRET');
});
test('Mission reports replace fallback rows with durable records without mixing another mission',()=>{
 const m={id:ID,from:'home',to:'g-orion-p1',arrival:T+1000,returnAt:T+2000,fleet:{waechter:1}},pvp={reports:[{id:ID,at:T+1000,outcome:'attacker'}]};
 const rows=missionReports(m,pvp,[{id:'attack:'+ID+':battle',missionId:ID,time:T+1000,outcome:'win',payload:{ownSide:'attacker'}},{id:'other',missionId:'other',time:T}]);
 assert.equal(rows.length,2);assert.equal(rows[0].outcome,'win');assert.equal(rows.some(r=>r.id==='other'),false);
});
test('Report rows escape all user text, preserve open details and filter archive/type/outcome/time',()=>{
 const s=newGame('A',T),r={id:'<bad>',time:T,kind:'battle',title:'<script>',outcome:'win',archived:false,payload:{commander:'<img>',to:'g-orion-p1',ownSide:'defender',defenderBefore:{waechter:4},defenderAfter:{waechter:2},rounds:[],loot:{metal:500}}};
 const html=reportRows([r],s,null,{selectable:true,selected:new Set([r.id]),opened:new Set([r.id])});assert.doesNotMatch(html,/<script>|<img>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/checked/);assert.match(html,/Eigene Verluste/);assert.match(html,/datetime=/);assert.match(html,/data-report-id="&lt;bad&gt;" open/);
 assert.equal(filterReports([r],{archived:false,kind:'battle',outcome:'win',days:'1',search:'script'},T+1).length,1);assert.equal(filterReports([r],{archived:true},T).length,0);assert.equal(filterReports([r],{days:'1'},T+86400001).length,0);
 assert.doesNotMatch(reportsPage({items:[],total:0},{archived:false,search:''},s,null,{error:'<script>'}),/<script>/);
});
test('Persistent report SQL backfills, stays private, preserves archives and exposes no premature defense event or seed',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 for(const id of [A,B]){await db.query('insert into auth.users values($1)',[id]);const s=newGame(id,T);s.seq=1;s.reports=[{id:1,time:T,title:'Transport angekommen',body:'Ferrum → Aurelia'}];await db.query('insert into public.game_saves(user_id,state) values($1,$2)',[id,JSON.stringify(s)]);}
 const sql=readFileSync('supabase/reports.sql','utf8');await db.exec(sql);
 const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
 const list=async args=>{const a=args||[false,null,null,'',null,0,null];return (await db.query('select public.imperium_reports($1,$2,$3,$4,$5,$6,$7) as d',a)).rows[0].d;};
 await asUser(A);let d=await list();assert.equal(d.total,1);assert.equal(d.items[0].id,'local:1');await assert.rejects(db.query('select * from public.game_reports'),/permission denied/);
 assert.equal((await db.query('select public.imperium_archive_reports($1,true) as n',[['local:1']])).rows[0].n,1);assert.equal((await list()).total,0);
 await db.exec('reset role');await db.exec(sql);await asUser(A);assert.equal((await list([true,null,null,'',null,0,null])).total,1);
 await asUser(B);assert.equal((await list()).total,1);assert.equal((await list([true,null,null,'',null,0,null])).total,0);
 await db.exec('reset role');const data={from:'home',to:'g-orion-p1',fleet:{waechter:1},seed:'PRIVATE-SEED',combat:{tech:{weapons:5}}};
 await db.query("insert into public.pvp_attacks(id,attacker_id,defender_id,started_at,warning_at,arrival_at,return_at,status,data) values($1,$2,$3,to_timestamp($4/1000.0),to_timestamp($4/1000.0+100),to_timestamp($4/1000.0+200),to_timestamp($4/1000.0+400),'outbound',$5)",[ID,A,B,T,JSON.stringify(data)]);
 await asUser(A);d=await list();assert.equal(d.items.some(r=>r.kind==='attack'),true);assert.equal(JSON.stringify(d).includes('PRIVATE-SEED'),false);
 await asUser(B);assert.equal((await list()).items.some(r=>r.missionId===ID),false);
 await db.exec('reset role');data.report={at:T+200000,outcome:'attacker',attackerBefore:{waechter:1},attackerAfter:{waechter:1},defenderBefore:{},defenderAfter:{},rounds:[],loot:{metal:500}};data.survivors={waechter:1};data.cargo={metal:500};
 await db.query("update public.pvp_attacks set status='returned',data=$1 where id=$2",[JSON.stringify(data),ID]);
 await asUser(B);d=await list();const battle=d.items.find(r=>r.kind==='battle');assert.equal(battle.outcome,'loss');assert.equal(battle.payload.ownSide,'defender');assert.equal(JSON.stringify(d).includes('PRIVATE-SEED'),false);
 assert.equal((await db.query('select public.imperium_archive_reports($1,true) as n',[['attack:'+ID+':start']])).rows[0].n,0);
 await asUser(A);d=await list([null,null,null,'',null,0,ID]);assert.equal(d.total,3);assert.equal(d.items.filter(r=>r.kind==='battle')[0].outcome,'win');assert.equal(d.items.some(r=>r.kind==='return'),true);
 assert.equal((await list([false,'battle','win','orion',null,0,null])).total,1);
 await db.exec('reset role');await db.exec(sql);await asUser(A);assert.equal((await list([null,null,null,'',null,0,ID])).total,3);
 await db.exec('reset role');const history=newGame('A',T+1000000);history.seq=100;history.reports=Array.from({length:60},(_,i)=>({id:i+10,time:T+i,title:'Lieferung angekommen',body:'Material'}));
 await db.query('update public.game_saves set state=$1 where user_id=$2',[JSON.stringify(history),A]);history.reports=[];await db.query('update public.game_saves set state=$1 where user_id=$2',[JSON.stringify(history),A]);
 await asUser(A);const first=await list(),second=await list([false,null,null,'',null,50,null]);assert.equal(first.total,63);assert.equal(first.items.length,50);assert.equal(second.items.length,13);assert.equal(new Set([...first.items,...second.items].map(r=>r.id)).size,63);
 assert.equal((await list([true,null,null,'',null,0,null])).total,1);
 await db.exec('reset role');await db.exec('set role anon');await assert.rejects(db.query('select public.imperium_reports()'),/permission denied/);
});

test('Battle reports identify both roles, route and losses from the defender perspective',()=>{
 const s=newGame('Verteidiger',T);s.planets.push({id:'g-orion-p1',name:'Silverstar'});
 const r={id:'battle',time:T,kind:'battle',title:'Gefecht',outcome:'loss',payload:{ownSide:'defender',commander:'<Angreifer>',from:'home',to:'g-orion-p1',outcome:'attacker',attackerBefore:{waechter:3},attackerAfter:{waechter:2},defenderBefore:{flak:4},defenderAfter:{flak:0},loot:{metal:500},rounds:[{round:1,attacker:2,defender:0}],returnAt:T+1000}};
 const html=reportRows([r],s,null);
 assert.match(html,/Du wurdest angegriffen/);assert.match(html,/Angreifer/);assert.match(html,/&lt;Angreifer&gt;/);assert.match(html,/Verteidiger · Du/);assert.match(html,/Verteidigter Planet: Silverstar/);assert.match(html,/Startplanet: Privates Heimatsystem \(home\)/);assert.doesNotMatch(html,/Startplanet: Aurelia/);
 assert.match(html,/Sieg des Angreifers/);assert.match(html,/Eigene Verluste<\/small><strong>4/);assert.match(html,/Orbitale Verteidigung/);assert.match(html,/Verloren/);assert.match(html,/Überlebt/);assert.match(html,/Beute des Angreifers/);assert.match(html,/Verbleibende Einheiten nach jeder Runde/);
});
test('Attack, cancelled battle and legacy reports retain context without inventing ownership',()=>{
 const s=newGame('A',T),base={id:'x',time:T,payload:{from:'home',to:'g-orion-p1'}};
 const start=reportRows([{...base,kind:'attack',title:'Angriff gestartet'}],s,null);
 assert.match(start,/Du hast angegriffen/);assert.match(start,/Angreifer · Du/);assert.match(start,/Nicht im Bericht gespeichert/);
 const old=reportRows([{...base,kind:'battle',title:'Gefecht'}],s,null);
 assert.match(old,/Eigene Rolle nicht im Bericht gespeichert/);assert.doesNotMatch(old,/Angreifer · Du/);assert.match(old,/Einheiten nicht im Bericht gespeichert/);
 const cancelled=reportRows([{...base,kind:'battle',title:'Gefecht',payload:{...base.payload,ownSide:'attacker',outcome:'cancelled',reason:'Ziel nicht angreifbar'}}],s,null);
 assert.match(cancelled,/Angriffsroute/);assert.match(cancelled,/Angriff abgebrochen/);assert.match(cancelled,/Ziel nicht angreifbar/);
 const destroyed=reportRows([{...base,kind:'battle',title:'Gefecht',payload:{...base.payload,attackerBefore:{waechter:2},attackerAfter:{},defenderBefore:{},defenderAfter:{},rounds:[]}}],s,null);
 assert.match(destroyed,/kein Rückflug/);
});
