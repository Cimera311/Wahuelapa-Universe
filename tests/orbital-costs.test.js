import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {BUILDINGS,RES,SHIPS,vector} from '../src/config.js';
import {newGame,buildingLevelCost,buildInfo,act,advance,demolishInfo,shipInfo} from '../src/engine.js';
import {processWorld} from '../src/server-world.js';
import {validateSave} from '../src/storage.js';
const T=1800000000000,uid='00000000-0000-0000-0000-000000000001';
function fixture(){const s=newGame('Werftkosten',T),p=s.planets[0];p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.buildings.warehouse=15;p.resources=vector([100000,100000,0]);s.tech.military=4;s.tech.engineering=1;return s;}

test('Every orbital upgrade from level 0 to 29 costs exactly the shipyard price and no fuel',()=>{
 assert.deepEqual(BUILDINGS.orbital.cost,BUILDINGS.shipyard.cost);
 for(let level=0;level<30;level++){
  assert.deepEqual(buildingLevelCost('orbital',level),buildingLevelCost('shipyard',level));
  assert.equal(buildingLevelCost('orbital',level).fuel,0);
 }
 const s=fixture(),p=s.planets[0];p.buildings.orbital=11;
 assert.deepEqual(buildInfo(s,p,'orbital').cost,vector([35185,17593,0]));
 assert.equal(buildInfo(s,p,'orbital').reason,'');
});

test('Authoritative upgrade charges the new cost without fuel and preserves orbital units and production',()=>{
 const s=fixture(),p=s.planets[0];p.buildings.orbital=11;p.ships.plasma=7;p.hulls={plasma:[.4]};p.resources.fuel=SHIPS.laser.cost[2];
 const queued=act(s,{type:'ship',key:'laser',count:1},T),before=structuredClone(queued.planets[0]),price=buildInfo(queued,before,'orbital').cost;
 const result=processWorld({now:T,settings:{enabled:false},admins:[],saves:[{user_id:uid,state:queued,revision:1}],planets:[],starts:[],missions:[],attacks:[]},uid,{type:'command',action:{type:'build',key:'orbital'}});
 const after=result.saves[0].state.planets[0];
 for(const k of RES)assert.equal(after.resources[k],before.resources[k]-price[k]);
 assert.deepEqual(after.ships,before.ships);assert.deepEqual(after.hulls,before.hulls);assert.deepEqual(after.orbitaljob,before.orbitaljob);
 assert.equal(after.build.level,12);assert.deepEqual(after.build.paid,price);validateSave(result.saves[0].state);
});

test('Legacy prepaid upgrades finish with historical payments; converted history refunds only new retained investment',()=>{
 const s=fixture(),p=s.planets[0];p.buildings.orbital=11;
 const oldPaid=vector([4549,3033,910]);p.build={key:'orbital',level:12,start:T,end:T+1000,paid:oldPaid,originalMs:1000};
 const resources=structuredClone(p.resources);advance(s,T+1000);
 assert.deepEqual(p.resources,resources);assert.deepEqual(demolishInfo(s,p,'orbital').originalCost,oldPaid);
 p.buildings.orbital=11;p.buildHistory.orbital={'11':{cost:buildingLevelCost('shipyard',10),ms:1000}};
 const q=demolishInfo(s,p,'orbital');assert.deepEqual(q.originalCost,buildingLevelCost('shipyard',10));assert.equal(q.refund.fuel,0);validateSave(s);
 const sh=shipInfo(s,p,'plasma');assert.deepEqual(sh.cost,vector(SHIPS.plasma.cost));
});

test('Ranking patch changes only point calculation, reruns safely and values both yards equally',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated');
  const base=readFileSync('supabase/leaderboard.sql','utf8');await db.exec(base.slice(base.indexOf('create or replace function public.imperium_rank_int'),base.indexOf('create or replace function public.imperium_leaderboard')));
  const sql=readFileSync('supabase/orbitalwerft-costs.sql','utf8');assert.doesNotMatch(sql,/create or replace function public\.imperium_leaderboard/);
  await db.exec(sql);await db.exec(sql);
  for(const level of [1,4,6,11,19,30]){
   const points=async key=>(await db.query('select * from public.imperium_rank_points($1::jsonb)',[JSON.stringify({planets:[{buildings:{[key]:level}}]})])).rows[0];
   assert.deepEqual(await points('orbital'),await points('shipyard'));
  }
  // Existing platform/repair/fleet handling is carried forward verbatim from the current scorer.
  const baseline=readFileSync('supabase/repair-dock.sql','utf8');assert.ok(sql.includes(baseline.slice(baseline.indexOf('create or replace function public.imperium_rank_points')).trim()));
  for(const file of readdirSync('supabase').filter(f=>f.endsWith('.sql'))){const text=readFileSync('supabase/'+file,'utf8');if(!text.includes('costs constant jsonb'))continue;const costs=JSON.parse(text.match(/costs constant jsonb := '(.*?)'::jsonb/s)[1]);assert.deepEqual(costs.buildings.orbital,[200,100,0],file);}
 }finally{await db.close();}
});
