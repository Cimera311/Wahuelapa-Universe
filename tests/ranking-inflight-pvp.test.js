import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

test('PvP fleets in transit retain points, survivors count on return, orbital units stay buildings',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create schema if not exists public;
   create or replace function public.imperium_rank_int(value jsonb, maximum integer) returns integer language sql immutable as $$select case when value is null or jsonb_typeof(value)!='number' then 0 else greatest(0,least(maximum,(value #>> '{}')::numeric))::integer end$$;`);
  const sql=readFileSync('supabase/fix-ranking-inflight-pvp.sql','utf8');
  const rank=sql.slice(sql.indexOf('create or replace function public.imperium_rank_points'),sql.indexOf('create or replace function public.imperium_leaderboard'));
  // PGlite has no Supabase auth roles; role grants are unrelated to point calculation.
  await db.exec(rank.replace(/revoke all on function public\.imperium_rank_points\(jsonb\) from public,anon,authenticated;/g,''));
  const tech={};const planet={buildings:{},ships:{flak:2,atlas:1}};
  const state=(missions)=>JSON.stringify({planets:[planet],tech,missions});
  const score=async missions=>(await db.query('select building_points,research_points,fleet_points from public.imperium_rank_points($1::jsonb)',[state(missions)])).rows[0];
  const docked=await score([]);
  const outbound=await score([{fleet:{titan:30,atlas:2}}]);
  const returning=await score([{fleet:{titan:12,atlas:1}}]);
  assert.ok(outbound.fleet_points>docked.fleet_points);
  assert.ok(returning.fleet_points>docked.fleet_points);
  assert.ok(outbound.fleet_points>returning.fleet_points);
  assert.equal(outbound.building_points,docked.building_points);
  assert.deepEqual(await score([{fleet:{flak:80,plasma:2}}]),docked);
 }finally{await db.close();}
});
