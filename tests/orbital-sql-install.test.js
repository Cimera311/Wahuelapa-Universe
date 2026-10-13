import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

test('Orbital SQL migration installs after the existing game schema and accepts a seven-step trace',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec("create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create role anon;create role authenticated;create role service_role;");
 const files=['setup.sql','leaderboard.sql','ship-tiers.sql','galaxy.sql','player-systems.sql','mixed-routes.sql','public-colonies.sql','pvp.sql','reports.sql','combat-logs.sql','combat-log-pagination.sql','partnerships.sql','orbital-firststrike.sql'];
 for(const f of files){try{await db.exec(readFileSync('supabase/'+f,'utf8'));}catch(e){throw new Error('Migration failed in '+f+': '+e.message,{cause:e});}}
 const q=await db.query("select pg_get_constraintdef(oid) as def from pg_constraint where conname='pvp_battle_rounds_round_zero_to_six'");
 assert.match(q.rows[0].def,/round.*0.*6/i);
});
