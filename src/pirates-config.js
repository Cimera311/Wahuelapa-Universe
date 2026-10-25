import {SHIPS,RES,canFlyInterstellar} from './config.js';
import {sharedFlight} from './flight.js';
export const PIRATE_STATION_META=Object.freeze([
 {id:'smugglers',name:'Schmugglernest',tier:1,type:'Leichter Außenposten',description:'Ein Versteck zwischen alten Containern und Antrieben.'},
 {id:'outpost',name:'Piratenposten',tier:2,type:'Bewaffneter Stützpunkt',description:'Ein Umschlagplatz mit eigenen Patrouillen.'},
 {id:'harbor',name:'Raubritterhafen',tier:3,type:'Befestigter Raumhafen',description:'Hier sammeln sich die Freibeuter des Sektors.'},
 {id:'fortress',name:'Freibeuterfestung',tier:4,type:'Schwere Festung',description:'Bewaffnete Dockringe sichern die erbeuteten Vorräte.'},
 {id:'headquarters',name:'Piratenhauptquartier',tier:5,type:'Zentrum der Piratenflotte',description:'Von hier aus werden die großen Raubzüge koordiniert.'}
]);
// REALM-CANDIDATE[pirates]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export const PIRATE_REALM_DEFAULTS=Object.freeze({enabled:true,strengthFactor:1,resourceFactor:1,flightTimeFactor:1,fuelFactor:1,cooldownMinutes:60,debrisRate:.3,debrisLifetimeHours:24,maxMissions:20,
 stations:{
  smugglers:{enabled:true,cooldownMinutes:60,sensor:1,fleet:{falke:3},resources:{metal:2400,crystal:1600,fuel:400},tech:{weapons:0,armor:0,shields:0}},
  outpost:{enabled:true,cooldownMinutes:60,sensor:3,fleet:{falke:12,waechter:2,flak:2},resources:{metal:9000,crystal:6000,fuel:1800},tech:{weapons:1,armor:1,shields:1}},
  harbor:{enabled:true,cooldownMinutes:60,sensor:5,fleet:{falke:30,waechter:10,donner:2,laser:4},resources:{metal:28000,crystal:22000,fuel:6000},tech:{weapons:2,armor:2,shields:2}},
  fortress:{enabled:true,cooldownMinutes:360,sensor:7,fleet:{falke:60,waechter:25,donner:10,titan:2,rail:6},resources:{metal:85000,crystal:65000,fuel:16000},tech:{weapons:3,armor:3,shields:3}},
  headquarters:{enabled:true,cooldownMinutes:360,sensor:10,fleet:{falke:120,waechter:60,donner:30,titan:12,plasma:10},resources:{metal:240000,crystal:180000,fuel:45000},tech:{weapons:5,armor:5,shields:5}}
 }});
// REALM-CANDIDATE[pirateValidation]: siehe auskommentierten Katalog in src/realm-config.js; noch nicht verdrahtet.
export function pirateConfig(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Ungültige Piratenkonfiguration.');
 const c=structuredClone(PIRATE_REALM_DEFAULTS),keys=Object.keys(c);
 if(Object.keys(input).some(k=>!keys.includes(k)))throw Error('Unbekannter Piratenfaktor.');
 for(const k of keys)if(k!=='stations'&&input[k]!==undefined)c[k]=input[k];
 for(const k of ['strengthFactor','resourceFactor','flightTimeFactor','fuelFactor'])if(!Number.isFinite(c[k])||c[k]<.1||c[k]>20)throw Error('Piratenfaktoren müssen zwischen 0,1 und 20 liegen.');
 for(const [k,min,max] of [['cooldownMinutes',1,1440],['debrisLifetimeHours',1,168],['maxMissions',1,50]])if(!Number.isSafeInteger(c[k])||c[k]<min||c[k]>max)throw Error('Ungültiger Piratenwert: '+k);
 if(typeof c.enabled!=='boolean'||!Number.isFinite(c.debrisRate)||c.debrisRate<0||c.debrisRate>1)throw Error('Ungültige Aktivierung oder Trümmerquote.');
 if(input.stations!==undefined&&(!input.stations||typeof input.stations!=='object'||Array.isArray(input.stations)||Object.keys(input.stations).some(id=>!Object.hasOwn(c.stations,id))))throw Error('Unbekannte Piratenstation.');
 for(const meta of PIRATE_STATION_META){
  const patch=input.stations?.[meta.id]||{},b=c.stations[meta.id];
  if(Object.keys(patch).some(k=>!['enabled','cooldownMinutes','sensor','fleet','resources','tech'].includes(k)))throw Error('Unbekannter Stationswert.');
  Object.assign(b,structuredClone(patch));
  if(b.cooldownMinutes!==null&&(!Number.isSafeInteger(b.cooldownMinutes)||b.cooldownMinutes<1||b.cooldownMinutes>1440))throw Error('Ungültige Stations-Abklingzeit.');
  if(typeof b.enabled!=='boolean'||!Number.isSafeInteger(b.sensor)||b.sensor<0||b.sensor>100)throw Error('Ungültige Sensoranforderung.');
  if(!b.fleet||Array.isArray(b.fleet)||!Object.keys(b.fleet).length||Object.entries(b.fleet).some(([k,n])=>!['military','defense'].includes(SHIPS[k]?.category)||!Number.isSafeInteger(n)||n<1||n>10000)||Object.values(b.fleet).reduce((a,n)=>a+n,0)*c.strengthFactor>100000)throw Error('Ungültige Piratenbesatzung.');
  if(!b.resources||Object.keys(b.resources).some(k=>!RES.includes(k))||RES.some(k=>!Number.isSafeInteger(b.resources[k])||b.resources[k]<0||b.resources[k]>1e8))throw Error('Ungültiges Piratendepot.');
  if(!b.tech||Object.keys(b.tech).some(k=>!['weapons','armor','shields'].includes(k))||['weapons','armor','shields'].some(k=>!Number.isSafeInteger(b.tech[k])||b.tech[k]<0||b.tech[k]>5))throw Error('Ungültige Piratenforschung.');
 }
 return c;
}
export function pirateFlight(s,from,station,fleet,c){
 const target={system:'tutorial',slot:5+station.tier,x:s.galaxy?.x||0,y:s.galaxy?.y||0};
 const origin=from.system?from:{...from,system:'tutorial',slot:from.distance||0,x:target.x,y:target.y};
 let ms=0,fuel=0,slowest='';
 for(const [k,n] of Object.entries(fleet)){
  if(origin.system!=='tutorial'&&!canFlyInterstellar(s,k))throw Error('Für '+SHIPS[k].name+' fehlt der Galaxieantrieb. Starte alternativ aus deinem Sonnensystem.');
  const f=sharedFlight(s,origin,target,n,k);if(f.ms>ms){ms=f.ms;slowest=k;}fuel+=2*f.fuel;
 }
 return {ms:Math.max(1000,Math.ceil(ms*c.flightTimeFactor)),fuel:Math.ceil(fuel*c.fuelFactor),slowest};
}

// A station override takes priority; null explicitly inherits the realm fallback.
export function pirateCooldownMinutes(config,station){return config.stations[station].cooldownMinutes??config.cooldownMinutes;}
