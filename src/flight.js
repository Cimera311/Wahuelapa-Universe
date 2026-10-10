import {SHIPS,shipFlightEngine} from './config.js';

export const GALAXY_FLIGHT_RULE_VERSION=2;
// Every private planet shares the account's galaxy entrance at slot zero.
export function sharedDistance(from,to,start){
 if(from.system&&from.system===to.system)return Math.max(1,Math.abs((from.slot||from.distance||0)-(to.slot||to.distance||0))*.15);
 const a=from.system?from:{...start,slot:0},b=to.system?to:{...start,slot:0};
 if(![a.x,a.y,b.x,b.y].every(Number.isFinite))throw Error('Der persönliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.');
 return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)/40+Math.abs((a.slot||0)-(b.slot||0))*.15);
}
export function sharedFlight(s,from,to,count=1,ship='transport',start=s.galaxy){
 const def=SHIPS[ship];if(!def||def.speed<=0)throw Error('Unbekanntes oder unbewegliches Schiff.');
 const distance=sharedDistance(from,to,start),remote=(from.system||'tutorial')!==(to.system||'tutorial');
 const engine=shipFlightEngine(s,ship,remote),factor=1+(s.tech[engine]||0)*.12;
 return {distance,ms:Math.max(60000,Math.ceil((120+distance*45)*1000/(def.speed*factor))),fuel:Math.ceil(def.fuel*distance*count/factor)};
}
