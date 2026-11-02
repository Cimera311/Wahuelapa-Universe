// PvP daily state is owned by the server-controlled pirate_world player row.
// One attack launched after accepting, with a winning PvP battle, per UTC day.
export const PVP_DAILY_MS = 12 * 3600000;
export const pvpDailyDay = at=>new Date(at).toISOString().slice(0,10);
export function pvpDailyStatus(q,at){
 if(!q||q.day!==pvpDailyDay(at))return 'available';
 return q.claimedAt?'claimed':q.wonAt?'ready':'active';
}
export function acceptPvpDaily(q,at){
 if(pvpDailyStatus(q,at)!=='available')throw Error('PvP-Daily bereits angenommen.');
 return {day:pvpDailyDay(at),acceptedAt:at,wonAt:null,claimedAt:null};
}
export function completePvpDaily(q,attack,time,outcome){
 if(pvpDailyStatus(q,time)!=='active'||outcome!=='attacker'||attack.started_at<q.acceptedAt)return q;
 return {...q,wonAt:time};
}
export function claimPvpDaily(q,planetId,owned,at,existing){
 if(pvpDailyStatus(q,at)!=='ready')throw Error('PvP-Daily noch nicht abgeschlossen.');
 if(!owned.includes(planetId))throw Error('Wähle einen eigenen Planeten.');
 if(existing&&existing.expiresAt>at)throw Error('Ein Werftbonus ist bereits aktiv.');
 return {quest:{...q,claimedAt:at},bonus:{planetId,startedAt:at,expiresAt:at+PVP_DAILY_MS,speed:1.1}};
}
export function pvpShipyardSpeed(bonus,planetId,time){
 return bonus&&bonus.planetId===planetId&&time>=bonus.startedAt&&time<bonus.expiresAt?1.1:1;
}
