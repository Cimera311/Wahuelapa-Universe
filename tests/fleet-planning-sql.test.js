import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {newGame} from '../src/engine.js';
import {costAt,TECHS} from '../src/config.js';
test('Ranking upgrade counts new research tiers and every ship in bound mixed orders',async t=>{
 const db=new PGlite();t.after(()=>db.close());await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 for(const f of ['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-log-pagination.sql','partnerships.sql','fleet-planning.sql'])await db.exec(readFileSync('supabase/'+f,'utf8'));
 await db.exec(readFileSync('supabase/fleet-planning.sql','utf8'));
 const s=newGame();s.planets[0].buildings=Object.fromEntries(Object.keys(s.planets[0].buildings).map(k=>[k,0]));s.tech.military=10;s.tech.hyperspace=10;
 let spent=0;for(const key of ['military','hyperspace'])for(let l=0;l<10;l++)spent+=Object.values(costAt(TECHS[key],l)).reduce((a,b)=>a+b,0);
 for(const type of ['route','deliver','collect','station']){s.missions=[{type,ship:'karawane',count:2,fleet:{karawane:2,atlas:1},paused:type==='route'}];const r=await db.query('select * from public.imperium_rank_points($1)',[JSON.stringify(s)]);assert.equal(Number(r.rows[0].research_points),Math.floor(spent/100));assert.equal(Number(r.rows[0].fleet_points),72);}
});
