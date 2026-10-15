// Experimental combat v4 core: compact ship-type cohorts and sparse per-ship damage.
// Intentionally not enabled for live missions until log/report compatibility is validated.
import {COMBAT,combatStats} from './combat.js';
import {SHIPS,RES,vector} from './config.js';

function seeded(seed){
 let x=2166136261;
 for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
function cohorts(side,label){
 const groups=side.groups||[{id:label,owner:side.owner,commander:side.commander,...side}];
 return groups.flatMap(g=>Object.entries(g.fleet||{}).filter(([,n])=>n>0).map(([key,n])=>{
  if(!Number.isSafeInteger(n)||n<0||!COMBAT[key])throw Error('Ungültiger Flottenbestand.');
  const stat=combatStats(key,g.tech||{});
  const hulls=g.hulls?.[key]||[];
  const hp=new Float64Array(n),shield=new Float64Array(n),indices=new Uint32Array(n);
  const factor=g.shieldFactor??1;
  for(let i=0;i<n;i++){hp[i]=stat.hp*(hulls[i]??1);shield[i]=stat.shield*factor;indices[i]=i;}
  return {id:g.id,key,owner:g.owner,commander:g.commander,stat,count:n,hp,shield,indices,damage:new Map(),maxShield:stat.shield*factor};
 }));
}
function sampled(pool,random){
 let total=0;for(const g of pool)total+=g.count;
 if(!total)return null;
 let offset=Math.floor(random()*total);
 for(const g of pool){if(offset<g.count)return [g,g.indices[offset]];offset-=g.count;}
 return null;
}
function candidates(shooter,enemies){
 const active=enemies.filter(g=>g.count);
 const military=active.filter(g=>SHIPS[g.key].category==='military');
 const allowed=military.length?active.filter(g=>['military','defense'].includes(SHIPS[g.key].category)):active;
 const bonus=allowed.filter(g=>(shooter.stat.bonus?.[g.key]||0)>0);
 if(bonus.length)return bonus;
 if(military.length)return military;
 const defense=allowed.filter(g=>SHIPS[g.key].category==='defense');
 return defense.length?defense:allowed;
}
function fire(shooters,enemies,random,summary){
 for(const s of shooters){
  if(!s.count||!s.stat.attack)continue;
  const pool=candidates(s,enemies);
  if(!pool.length)continue;
  const shots=s.stat.shots;
  for(let i=0;i<s.count*shots;i++){
   const picked=sampled(pool,random);if(!picked)break;
   const [target,index]=picked,bonus=s.stat.bonus?.[target.key]||0;
   const hit=s.stat.attack/shots*(1+bonus);
   target.damage.set(index,(target.damage.get(index)||0)+hit);
   const k=s.key+':'+target.key;
   const item=summary[k]??={shooter:s.key,target:target.key,shots:0,damage:0};
   item.shots++;item.damage+=hit;
  }
 }
}

// Experimental v5: each firing ship acquires exactly one target per round.
// All of that ship's shots hit the same target, with no retargeting within
// the round. Damage is still applied simultaneously after both sides fire.
function fireLocked(shooters,enemies,random,summary){
 for(const s of shooters){
  if(!s.count||!s.stat.attack)continue;
  const pool=candidates(s,enemies);
  if(!pool.length)continue;
  const shots=s.stat.shots;
  for(let unit=0;unit<s.count;unit++){
   const picked=sampled(pool,random);if(!picked)break;
   const [target,index]=picked,bonus=s.stat.bonus?.[target.key]||0;
   const hit=s.stat.attack/shots*(1+bonus);
   target.damage.set(index,(target.damage.get(index)||0)+hit*shots);
   const k=s.key+':'+target.key;
   const item=summary[k]??={shooter:s.key,target:target.key,shots:0,damage:0};
   item.shots+=shots;item.damage+=hit*shots;
  }
 }
}
function applyDamage(groups){
 const impacts=[];
 for(const g of groups){
  let killed=0,shieldDamage=0,hullDamage=0,overkill=0;
  for(const [i,hit] of g.damage){
   const absorbed=Math.min(g.shield[i],hit),hull=Math.min(Math.max(0,g.hp[i]),hit-absorbed);
   g.shield[i]-=absorbed;g.hp[i]-=hit-absorbed;
   shieldDamage+=absorbed;hullDamage+=hull;
   overkill+=Math.max(0,hit-absorbed-hull);
   if(g.hp[i]<=1e-8)killed++;
  }
  // Rebuild alive index list only after simultaneous round damage.
  if(killed){
   let next=0;
   for(let j=0;j<g.count;j++){const i=g.indices[j];if(g.hp[i]>1e-8)g.indices[next++]=i;}
   g.count=next;
  }
  if(g.damage.size)impacts.push({key:g.key,groupId:g.id,hitUnits:g.damage.size,destroyed:killed,shieldDamage,hullDamage,overkill});
  g.damage.clear();
 }
 return impacts;
}
function result(groups){
 const fleet={},hulls={};
 for(const g of groups)for(let j=0;j<g.count;j++){
  const i=g.indices[j];fleet[g.key]=(fleet[g.key]||0)+1;
  if(g.hp[i]<g.stat.hp-1e-8)(hulls[g.key]??=[]).push(g.hp[i]/g.stat.hp);
 }
 return {fleet,hulls};
}
function total(groups){return groups.reduce((n,g)=>n+g.count,0);}
function groupSummary(groups,side){return groups.map(g=>({side,key:g.key,groupId:g.id,...(g.owner?{owner:g.owner}:{}),count:g.count}));}
export function resolveBattleHybrid(attacker,defender,seed,experimentalVersion=4){
 if(experimentalVersion!==4&&experimentalVersion!==5)throw Error('Unknown hybrid rules version');
 const fireRound=experimentalVersion===5?fireLocked:fire;
 const a=cohorts(attacker,'attacker'),d=cohorts(defender,'host'),random=seeded(seed),rounds=[],aggregates=[];
 const initialGroups=[...groupSummary(a,'attacker'),...groupSummary(d,'defender')];
 for(let round=0;round<=6;round++){
  if(!total(a)||!total(d))break;
  const opening=round===0;
  const platforms=opening?d.filter(g=>SHIPS[g.key].category==='defense'):[];
  if(opening&&!platforms.length)continue;
  const shots={};
  if(!opening)fireRound(a,d,random,shots);
  fireRound(opening?platforms:d,a,random,shots);
  const impacts=applyDamage([...a,...d]);
  rounds.push({round,attacker:total(a),defender:total(d)});
  aggregates.push({round,shots:Object.values(shots),impacts,after:{attacker:{count:total(a)},defender:{count:total(d)}}});
 }
 const attackerAfter=result(a),defenderAfter=result(d);
 const debris=vector([0,0,0]),defenseRepair=vector([0,0,0]);
 for(const g of [...a,...d]){
  const losses=g.hp.length-g.count,ship=SHIPS[g.key];
  debris.metal+=losses*ship.cost[0]*.3;
  debris.crystal+=losses*ship.cost[1]*.3;
 }
 for(const k of RES){debris[k]=Math.floor(debris[k]);defenseRepair[k]=Math.floor(defenseRepair[k]);}
 const ac=total(a),dc=total(d);
 const grouped={};
 if(defender.groups)grouped.defenderGroups=defender.groups.map(group=>{
  const subset=d.filter(g=>g.id===group.id);
  const out=result(subset);
  if(group.id?.startsWith('repair:')){
   // Repair reconciliation requires every original dock slot, including destroyed
   // units, in its original order. Survivors-only arrays corrupt the queue.
   out.repairUnits=subset.flatMap(g=>Array.from({length:g.hp.length},(_,i)=>({
    hp:Math.max(0,g.hp[i]),maxHp:g.stat.hp
   })));
  }
  return {id:group.id,owner:group.owner,...out};
 });
 return {outcome:ac&&!dc?'attacker':dc&&!ac?'defender':'draw',attacker:attackerAfter,defender:defenderAfter,debris,defenseRepair,rounds,...grouped,
  // v4 traces intentionally aggregate; v3's per-unit report reader must not consume these.
  trace:{version:2,ruleVersion:experimentalVersion,seed:String(seed),initialGroups,
   finalGroups:[...groupSummary(a,'attacker'),...groupSummary(d,'defender')],
   tech:{attacker:{...attacker.tech},defender:{...defender.tech}},
   shieldFactors:{attacker:attacker.shieldFactor??1,defender:defender.shieldFactor??1},rounds:aggregates}};
}

// Benchmark-only. Not routed from server-world or selectable in production.
export function resolveBattleHybridV5(attacker,defender,seed){return resolveBattleHybrid(attacker,defender,seed,5);}
