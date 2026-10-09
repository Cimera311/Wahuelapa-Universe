import {RES,SHIPS,vector} from './config.js';
export const COMBAT={
 probe:{hp:30,shield:0,attack:0,shots:1},longProbe:{hp:60,shield:10,attack:0,shots:1},
 colony:{hp:250,shield:30,attack:0,shots:1},starColony:{hp:500,shield:80,attack:0,shots:1},
 transport:{hp:100,shield:20,attack:0,shots:1},kurier:{hp:80,shield:10,attack:0,shots:1},
 karawane:{hp:450,shield:80,attack:0,shots:1},atlas:{hp:1400,shield:200,attack:0,shots:1},arche:{hp:4000,shield:600,attack:0,shots:1},
 falke:{hp:160,shield:40,attack:30,shots:1,bonus:{donner:.25,titan:.25}},
 waechter:{hp:650,shield:180,attack:100,shots:2,bonus:{falke:.5}},
 donner:{hp:2000,shield:400,attack:350,shots:2,bonus:{flak:.5,laser:.5,rail:.5,plasma:.5}},
 titan:{hp:6500,shield:1400,attack:1100,shots:4,bonus:{waechter:.25,donner:.25}},
 flak:{hp:180,shield:30,attack:35,shots:2,bonus:{falke:.75}},
 laser:{hp:600,shield:150,attack:100,shots:2},
 rail:{hp:1600,shield:300,attack:300,shots:1,bonus:{donner:.25,titan:.25}},
 plasma:{hp:4500,shield:800,attack:800,shots:2,bonus:{titan:.25}}
};
export function combatStats(key,tech={}){
 const c=COMBAT[key];if(!c)throw Error('Unbekannte Kampfeinheit.');
 return {...c,hp:c.hp*(1+.08*(tech.armor||0)),shield:c.shield*(1+.08*(tech.shields||0)),attack:c.attack*(1+.08*(tech.weapons||0))};
}
export function attackFleet(fleet){
 if(!fleet||typeof fleet!=='object'||Array.isArray(fleet))throw Error('Ungültige Angriffsflotte.');
 const entries=Object.entries(fleet);if(!entries.length||entries.some(([k,n])=>!['military','freighter'].includes(SHIPS[k]?.category)||!Number.isSafeInteger(n)||n<1)||entries.reduce((a,[,n])=>a+n,0)>100||!entries.some(([k])=>SHIPS[k].category==='military'))throw Error('Wähle 1–100 Schiffe und mindestens ein Kriegsschiff.');
 return {...fleet};
}
export function attackFlight(s,from,to,fleet){
 attackFleet(fleet);if(!to.system)throw Error('Angriffsziele müssen fremde gemeinsame Kolonien sein.');
 const origin=from.system?from:{...s.galaxy,slot:0};
 if(![origin.x,origin.y,origin.slot,to.x,to.y,to.slot].every(Number.isFinite))throw Error('Der persönliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.');
 if(!from.system&&(s.tech.ramjet||0)<1)throw Error('Für Angriffe aus dem Heimatsystem fehlen Staustrahltriebwerke Stufe 1.');
 const dist=Math.max(1,Math.hypot(origin.x-to.x,origin.y-to.y)/40+Math.abs(origin.slot-to.slot)*.15);
 let ms=0,fuel=0,slowest='';
 for(const [key,count] of Object.entries(fleet)){
  const sh=SHIPS[key],remote=from.system!==to.system;
  let engine=sh.engine||'drive';
  if(remote&&!sh.engine){if(key!=='falke'||!s.tech.assaultDrive)throw Error('Für interstellare Flüge fehlt ein geeigneter Antrieb.');engine='ramjet';}
  if(remote&&(s.tech[engine]||0)<1)throw Error('Für interstellare Flüge fehlt die passende Triebwerksforschung.');
  const factor=1+.12*(s.tech[engine]||0);
  const time=Math.max(300000,Math.ceil((600+dist*120)*1000/(sh.speed*factor)));
  if(time>ms){ms=time;slowest=key;}fuel+=Math.ceil(sh.fuel*2*dist*count/factor);
 }
 return {distance:dist,ms,fuel,slowest};
}
export function warningFraction(sensorLevel){return Math.max(.1,Math.min(.9,.9-.16*sensorLevel));}
export function takeHulls(p,fleet){const out={};p.hulls??={};for(const [k,n] of Object.entries(fleet)){const damaged=p.hulls[k]||[];out[k]=damaged.splice(0,n);if(!damaged.length)delete p.hulls[k];}return out;}
export function putHulls(p,hulls={}){p.hulls??={};for(const [k,hp] of Object.entries(hulls))if(hp.length)p.hulls[k]=[...(p.hulls[k]||[]),...hp];}
function rng(seed){let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
function units(fleet,tech,hulls,shieldFactor=1){
 const out=[];for(const key of Object.keys(fleet).sort()){const n=fleet[key];if(!Number.isInteger(n)||n<0)throw Error('Ungültiger Flottenbestand.');if(out.length+n>5000)throw Error('Kampfflotten sind vorerst auf 5000 Einheiten je Seite begrenzt.');const z=combatStats(key,tech);z.shield*=shieldFactor;for(let i=0;i<n;i++)out.push({key,...z,maxHp:z.hp,hp:z.hp*(hulls?.[key]?.[i]??1)});}return out;
}
function survivors(list){const fleet={},hulls={};for(const u of list)if(u.hp>1e-8){fleet[u.key]=(fleet[u.key]||0)+1;if(u.hp<u.maxHp-1e-8)(hulls[u.key]??=[]).push(u.hp/u.maxHp);}return {fleet,hulls};}
export function resolveBattle(attacker,defender,seed){
 const a=units(attacker.fleet,attacker.tech,attacker.hulls,attacker.shieldFactor),d=units(defender.fleet,defender.tech,defender.hulls,defender.shieldFactor),random=rng(seed),rounds=[];
 for(let i=1;i<=6;i++){
  const aa=a.filter(u=>u.hp>1e-8),dd=d.filter(u=>u.hp>1e-8);if(!aa.length||!dd.length)break;
  const damage=new Map();
  function fire(shooters,targets){for(const u of shooters)if(u.attack)for(let shot=0;shot<u.shots;shot++){const target=targets[Math.floor(random()*targets.length)],hit=u.attack/u.shots*(1+(u.bonus?.[target.key]||0));damage.set(target,(damage.get(target)||0)+hit);}}
  fire(aa,dd);fire(dd,aa);
  for(const [u,hit] of damage){const shield=Math.min(u.shield,hit);u.shield-=shield;u.hp-=hit-shield;}
  rounds.push({round:i,attacker:a.filter(u=>u.hp>1e-8).length,defender:d.filter(u=>u.hp>1e-8).length});
 }
 const aa=survivors(a),dd=survivors(d),ac=Object.values(aa.fleet).reduce((a,b)=>a+b,0),dc=Object.values(dd.fleet).reduce((a,b)=>a+b,0);
 const debris=vector([0,0,0]),defenseRepair=vector([0,0,0]);
 for(const u of [...a,...d])if(u.hp<=1e-8){const sh=SHIPS[u.key],out=sh.category==='defense'?defenseRepair:debris,rate=sh.category==='defense'?.7:.3;out.metal+=sh.cost[0]*rate;out.crystal+=sh.cost[1]*rate;}
 for(const k of RES){debris[k]=Math.floor(debris[k]);defenseRepair[k]=Math.floor(defenseRepair[k]);}
 return {outcome:ac&&!dc?'attacker':dc&&!ac?'defender':'draw',attacker:aa,defender:dd,debris,defenseRepair,rounds};
}
export function loadPlunder(stock,depot,bunker,capacity,debris,victory,budget=stock){
 const loot=vector([0,0,0]),salvage=vector([0,0,0]);let room=Math.max(0,capacity);
 if(victory)for(const k of RES){loot[k]=Math.min(room,Math.floor(Math.max(0,stock[k]+depot[k]-bunker)*.25),budget[k]);room-=loot[k];}
 if(victory)for(const k of RES){salvage[k]=Math.min(room,debris[k]);room-=salvage[k];}
 return {loot,salvage,cargo:vector(RES.map(k=>loot[k]+salvage[k]))};
}
