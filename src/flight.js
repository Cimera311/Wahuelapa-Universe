import {SHIPS,shipFlightEngine} from './config.js';
import {REALM_CONFIG} from './realm-config.js';

export const GALAXY_FLIGHT_RULE_VERSION=4;
// REALM-CANDIDATE[engineBonuses]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const ENGINE_SPEED_BONUS=.05;
export const ENGINE_FUEL_BONUS=.12;
// Retain former level-five flight times while opening levels six through ten.
export const FLIGHT_BASE_SCALE=1.25/1.6;
// Every private planet shares the account's galaxy entrance at slot zero.
// REALM-CANDIDATE[distance]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function sharedDistance(from,to,start){
 if(from.system&&from.system===to.system)return Math.max(1,Math.abs((from.slot||from.distance||0)-(to.slot||to.distance||0))*.15);
 const a=from.system?from:{...start,slot:0},b=to.system?to:{...start,slot:0};
 if(![a.x,a.y,b.x,b.y].every(Number.isFinite))throw Error('Der persönliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.');
 return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)/40+Math.abs((a.slot||0)-(b.slot||0))*.15);
}
// REALM-CANDIDATE[flightBase]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function sharedFlight(s,from,to,count=1,ship='transport',start=s.galaxy){
 const def=SHIPS[ship];if(!def||def.speed<=0)throw Error('Unbekanntes oder unbewegliches Schiff.');
 const distance=sharedDistance(from,to,start),remote=(from.system||'tutorial')!==(to.system||'tutorial');
 const engine=shipFlightEngine(s,ship,remote),factor=1+(s.tech[engine]||0)*ENGINE_SPEED_BONUS,fuelFactor=1+(s.tech[engine]||0)*ENGINE_FUEL_BONUS;
 return {distance,ms:Math.ceil(Math.max(60000,Math.ceil((120+distance*45)*FLIGHT_BASE_SCALE*1000/(def.speed*factor)))*REALM_CONFIG.galaxyFlightTimeFactor),fuel:Math.ceil(def.fuel*distance*count/fuelFactor)};
}
