import {SHIPS,RES,vector} from './config.js';

// REALM-CANDIDATE[repairRates]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const REPAIR_RATE=.3;
export const ORBITAL_RESTORE_RATE=.7;
export function repairAvailable(p,key){return (p.disabledDefenses?.[key]||0)+(p.hulls?.[key]||[]).length;}
export function recordDisabledDefenses(p,before,after){p.disabledDefenses??={};for(const [key,sh] of Object.entries(SHIPS))if(sh.category==='defense'){const lost=Math.max(0,(before[key]||0)-(after[key]||0));if(lost)p.disabledDefenses[key]=(p.disabledDefenses[key]||0)+lost;}}

// REALM-CANDIDATE[repairQueue]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const REPAIR_QUEUE_LIMIT=20;
export function repairOrders(p){return p.repairQueue||[];}
export function repairCount(p,key){return repairOrders(p).filter(j=>j.key===key).reduce((n,j)=>n+j.entries.length,0);}
export function orbitCondition(p,key){
 const free=Number(p.ships?.[key]||0),hulls=p.hulls?.[key]||[],docked=repairOrders(p).filter(j=>j.key===key).flatMap(j=>j.entries.map(e=>e.hp));
 const disabled=p.disabledDefenses?.[key]||0;
 const total=free+docked.length+disabled,damaged=hulls.length+docked.length+disabled,missing=[...hulls,...docked].reduce((n,h)=>n+1-h,disabled);
 return {total,disabled,free,docked:docked.length,damaged,intact:total-damaged,hull:total?1-missing/total:1,damagedHull:damaged?1-missing/damaged:1};
}
// REALM-CANDIDATE[repairTime]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function repairQuote(p,key,count=1,ratio=1){
 if(!SHIPS[key])throw Error('Unbekannte Einheit.');
 const hulls=[...p.hulls?.[key]||[]].sort((a,b)=>a-b),disabled=p.disabledDefenses?.[key]||0;
 if(!Number.isSafeInteger(count)||count<1||count>repairAvailable(p,key)||count>100000)throw Error('Wähle eine gültige Anzahl beschädigter Einheiten.');
 const restore=disabled>0;if(restore&&count>(p.disabledDefenses?.[key]||0))throw Error('Defekte und teilbeschädigte Geschütze bitte getrennt reparieren.');
 const selected=restore?Array(count).fill(0):hulls.slice(0,count),damage=selected.reduce((n,h)=>n+1-h,0),factor=restore?Math.pow(.92,Math.max(0,(p.buildings.orbital||0)-1)+(p.buildings.robotics||0)):Math.pow(.92,Math.max(0,(p.buildings.repairDock||0)-1));
 const work=Math.max(1,SHIPS[key].time*1000*(restore?1:REPAIR_RATE)*damage*factor);
 return {restore,hulls:selected,count,cost:vector(SHIPS[key].cost.map((c,i)=>i===2?0:Math.ceil(c*(restore?ORBITAL_RESTORE_RATE:REPAIR_RATE)*damage))),work,factor,ms:ratio>0?Math.ceil(work/ratio):null,hull:1-damage/count};
}
export function repairMaterials(j){if(j.restore)return vector([0,0,0]);return vector(RES.map((k,i)=>i===2?0:Math.max(0,Math.ceil(j.entries.reduce((n,e)=>n+Math.max(0,SHIPS[j.key].cost[i]*REPAIR_RATE*(1-e.hp)-e.credit[k]),0)-1e-7))));}
export function repairRefund(j){return vector(RES.map(k=>Math.floor(j.entries.reduce((n,e)=>n+e.credit[k],0)+1e-7)));}
export function reserveRepair(p,key,quote,id,time){
 if(quote.restore){p.disabledDefenses[key]-=quote.count;}
 const remaining=[...p.hulls?.[key]||[]].sort((a,b)=>a-b).slice(quote.restore?0:quote.count);p.hulls??={};if(remaining.length)p.hulls[key]=remaining;else delete p.hulls[key];
 if(!quote.restore)p.ships[key]-=quote.count;
 const entries=quote.hulls.map(hp=>({hp,initialHp:hp,workRemaining:Math.max(1,SHIPS[key].time*1000*(quote.restore?1:REPAIR_RATE)*(1-hp)*quote.factor),credit:vector(SHIPS[key].cost.map((c,i)=>i===2?0:c*(quote.restore?ORBITAL_RESTORE_RATE:REPAIR_RATE)*(1-hp)))}));
 for(const k of RES)entries[0].credit[k]+=quote.cost[k]-entries.reduce((n,e)=>n+e.credit[k],0);
 const job={...(quote.restore?{restore:true}:{}),id,key,start:time,count:quote.count,completed:0,lost:0,factor:quote.factor,entries};(p.repairQueue??=[]).push(job);return job;
}
export function payRepairMaterials(j,cost){for(const [i,k] of RES.entries()){if(i===2)continue;let left=cost[k];for(const e of j.entries){const need=Math.max(0,SHIPS[j.key].cost[i]*REPAIR_RATE*(1-e.hp)-e.credit[k]),amount=Math.min(need,left);e.credit[k]+=amount;left-=amount;}if(left>0&&j.entries.length)j.entries[0].credit[k]+=left;}}
export function releaseRepair(p,j){p.hulls??={};for(const e of j.entries){if(j.restore){p.disabledDefenses??={};p.disabledDefenses[j.key]=(p.disabledDefenses[j.key]||0)+1;continue;}p.ships[j.key]++;if(e.hp<1)(p.hulls[j.key]??=[]).push(e.hp);}p.repairQueue=repairOrders(p).filter(q=>q.id!==j.id);}
export function forecastRepair(p,time,ratio){
 let wait=0,blocked=false;
 for(const j of repairOrders(p)){j.materials=repairMaterials(j);blocked||=RES.some(k=>j.materials[k]>0);j.paused=blocked||ratio===0;wait+=j.entries.reduce((n,e)=>n+e.workRemaining,0);j.end=time+Math.max(1,Math.ceil(wait/(ratio||1)));}
 const active=repairOrders(p)[0];return active&&!active.paused?time+Math.max(0,Math.ceil(active.entries[0].workRemaining/ratio)):Infinity;
}
export function produceRepair(p,elapsed,ratio){
 const j=repairOrders(p)[0];if(!j||j.paused||!j.entries.length)return;
 const e=j.entries[0],work=Math.min(e.workRemaining,elapsed*ratio),fraction=e.workRemaining?work/e.workRemaining:1;
 e.hp=Math.min(1,e.hp+(1-e.hp)*fraction);for(const k of RES)e.credit[k]*=1-fraction;
 e.workRemaining=Math.max(0,e.workRemaining-work);if(e.workRemaining<1e-6){e.workRemaining=0;e.hp=1;}
}
export function finishRepair(p,notify){const j=repairOrders(p)[0];if(!j||j.entries[0]?.workRemaining>1e-6)return 0;let finished=0;while(j.entries[0]?.workRemaining<=1e-6){j.entries.shift();j.completed++;finished++;p.ships[j.key]++;}if(!j.entries.length){p.repairQueue.shift();notify?.('Reparatur abgeschlossen',`${p.name}: ${j.completed} × ${SHIPS[j.key].name} wieder einsatzbereit.`);}return finished;}
// Docked units remain separate battle groups so losses preserve paid material and identity.
export function repairDefense(p,owner,commander,tech,shieldFactor){return repairOrders(p).filter(j=>!j.restore).map(j=>({id:'repair:'+j.id,owner,commander:commander+' · Reparaturdock',fleet:{[j.key]:j.entries.length},hulls:{[j.key]:j.entries.map(e=>e.hp)},tech,shieldFactor}));}
export function reconcileRepairBattle(p,result){
 for(const j of [...repairOrders(p)].filter(j=>!j.restore)){
  const finals=result.trace?.final?.filter(u=>u.groupId==='repair:'+j.id)||result.defenderGroups?.find(g=>g.id==='repair:'+j.id)?.repairUnits||[];
  if(finals.length!==j.entries.length)throw Error('Reparaturdock: Kampfzuordnung fehlt.');
  j.entries=j.entries.flatMap((e,i)=>{const u=finals[i];if(u.hp<=1e-8){if(SHIPS[j.key].category==='defense'){p.disabledDefenses??={};p.disabledDefenses[j.key]=(p.disabledDefenses[j.key]||0)+1;}j.lost++;return [];}e.hp=Math.min(1,u.hp/u.maxHp);e.initialHp=e.hp;e.workRemaining=Math.max(1,SHIPS[j.key].time*1000*REPAIR_RATE*(1-e.hp)*j.factor);return [e];});
  if(!j.entries.length)p.repairQueue=p.repairQueue.filter(q=>q.id!==j.id);
 }
}
