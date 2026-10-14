// Passive views need fewer authoritative world writes. Events are caught up
// at their exact timestamps by advanceWorld() when the next sync runs.
export const NORMAL_SYNC_MS = 30_000;
export const ACTIVE_PVP_SYNC_MS = 15_000;

export function shouldSyncCloud({now,lastAttempt=0,hidden=false,authoritative=false,dirty=false,pvp=null}){
 if(!authoritative&&!dirty)return false;
 // The server's authoritative world is advanced on the next foreground sync.
 // Legacy cloud saves must still be allowed while a tab is in the background.
 if(hidden&&authoritative)return false;
 const combatActive=authoritative&&(
  (Array.isArray(pvp?.outgoing)&&pvp.outgoing.length>0) ||
  (Array.isArray(pvp?.incoming)&&pvp.incoming.length>0)
 );
 return now-lastAttempt>=(combatActive?ACTIVE_PVP_SYNC_MS:NORMAL_SYNC_MS);
}
