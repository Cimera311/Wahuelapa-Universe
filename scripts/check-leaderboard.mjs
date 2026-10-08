import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {newGame,act,advance} from '../src/engine.js';
const db=new PGlite();
await db.exec(`create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
await db.exec(readFileSync(new URL('../supabase/setup.sql',import.meta.url),'utf8'));
await db.exec(readFileSync(new URL('../supabase/leaderboard.sql',import.meta.url),'utf8'));
const sql=readFileSync(new URL('../supabase/leaderboard.sql',import.meta.url),'utf8');await db.exec(sql); // rerun safe
const s=newGame('Sebastian',1000);s.planets[0].ships.transport=2;
const point=async state=>(await db.query('select * from public.imperium_rank_points($1::jsonb)',[JSON.stringify(state)])).rows[0];
const base=await point(s);assert.equal(Number(base.building_points),9);assert.equal(Number(base.fleet_points),6);
const flying=structuredClone(s);flying.planets[0].ships.transport=1;flying.missions=[{ship:'transport',count:1}];assert.deepEqual(await point(flying),base);
const richer=structuredClone(s);richer.planets[0].resources.metal=1e12;assert.deepEqual(await point(richer),base);
const building=act(s,{type:'build',key:'metal'},1000);assert.deepEqual(await point(building),base);advance(building,building.planets[0].build.end);assert.ok(Number((await point(building)).building_points)>Number(base.building_points));
assert.equal(Number((await point({planets:[{buildings:{metal:'oops'}}]})).building_points),0);
const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002'];
for(const id of ids)await db.query('insert into auth.users values ($1)',[id]);
await db.query('insert into public.game_saves(user_id,state) values ($1,$2),($3,$4)',[ids[0],JSON.stringify(s),ids[1],JSON.stringify({...s,name:'Friend'})]);
await db.exec(`set role anon`);await assert.rejects(db.query('select * from public.imperium_leaderboard()'),/permission denied/);await assert.rejects(db.query('select * from public.game_saves'),/permission denied/);
await db.exec(`reset role;set role authenticated`);await assert.rejects(db.query('select * from public.imperium_leaderboard()'),/AUTH_REQUIRED/);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[0]]);
let rows=(await db.query('select * from public.imperium_leaderboard()')).rows;assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>Number(r.rank)),[1,1]);assert.equal(rows.filter(r=>r.is_me).length,1);assert.deepEqual(Object.keys(rows[0]),['rank','commander','points','building_points','research_points','fleet_points','colonies','is_me']);
assert.equal((await db.query('select * from public.game_saves')).rows.length,1);
await assert.rejects(db.query('select * from public.imperium_rank_points($1)',[JSON.stringify(s)]),/permission denied/);
await db.exec('reset role');
for(let i=3;i<=104;i++){const id='00000000-0000-0000-0000-'+String(i).padStart(12,'0');await db.query('insert into auth.users values ($1)',[id]);const better=structuredClone(s);better.name='Commander '+i;better.planets[0].buildings.metal=10;await db.query('insert into public.game_saves(user_id,state) values ($1,$2)',[id,JSON.stringify(better)]);}
await db.exec('set role authenticated');rows=(await db.query('select * from public.imperium_leaderboard()')).rows;assert.equal(rows.length,101);assert.equal(Number(rows.find(r=>r.is_me).rank),103);
await db.close();console.log('SQL verified: scoring, in-flight fleet, construction, ties, top 100 + own rank, anonymous denial, private saves, rerun safety.');
