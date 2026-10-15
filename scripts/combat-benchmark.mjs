import {performance} from 'node:perf_hooks';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolveBattle} from '../src/combat.js';
import {resolveBattleHybrid,resolveBattleHybridV5,resolveBattleHybridV6} from '../src/combat-hybrid.js';

const scenarios={
 duel:{attacker:{titan:400},defender:{titan:332}},
 swarm:{attacker:{titan:10},defender:{falke:100}},
 mid:{attacker:{titan:100},defender:{falke:1000}},
 orbital:{attacker:{titan:600},defender:{flak:1000,laser:200,rail:50,plasma:200}},
 large:{attacker:{titan:1000},defender:{falke:10000}},
 stress:{attacker:{titan:10000},defender:{falke:100000}},
 falke_titan:{attacker:{falke:350},defender:{titan:10}},
 titan_falke:{attacker:{titan:10},defender:{falke:320}},
 waechter_falke:{attacker:{waechter:40},defender:{falke:240}},
 waechter_titan:{attacker:{waechter:60},defender:{titan:20}},
 donner_flak:{attacker:{donner:30},defender:{flak:200}},
 donner_laser:{attacker:{donner:30},defender:{laser:160}},
 donner_orbital:{attacker:{donner:40,titan:15},defender:{flak:120,laser:80,rail:30,plasma:15}},
 mixed_special:{attacker:{falke:80,waechter:35,donner:20,titan:8},defender:{falke:160,titan:12,flak:100,laser:40}}
};
import {REALM_COMBAT_OVERRIDES,combatConfigForRealmId} from '../src/realm-config.js';
const realm=process.env.REALM||'main';
const realmConfig=combatConfigForRealmId(realm);
const comparison=process.env.COMPARE||'v4-v5';
if(!['v3-v4','v4-v5','v5-v6'].includes(comparison))throw Error('Unknown comparison: '+comparison);
const scenario=process.env.SCENARIO||'duel';
const special=['falke_titan','titan_falke','waechter_falke','waechter_titan','donner_flak','donner_laser','donner_orbital','mixed_special'];
const all=scenario==='all'?['swarm','mid','duel','orbital','large']
 :scenario==='special'?special:[scenario];
const runs=Math.max(1,Math.min(1000,Number(process.env.RUNS||10)));
const legacyLimit=Number(process.env.V3_MAX_UNITS||3000);
const results=[];
function count(f){return Object.values(f||{}).reduce((a,b)=>a+b,0);}
function compare(name,seed){
 const input=scenarios[name];if(!input)throw Error('Unknown scenario: '+name);
 const total=count(input.attacker)+count(input.defender);
 const iterations=total>10000?Math.min(runs,3):runs;
 const versions=comparison==='v5-v6'
  ?[['v5',resolveBattleHybridV5],['v6',(a,d,seed)=>resolveBattleHybridV6(a,d,seed,REALM_COMBAT_OVERRIDES[realm])]]
  :comparison==='v4-v5'
  ?[['v4',resolveBattleHybrid],['v5',resolveBattleHybridV5]]
  :total>legacyLimit?[['v4',resolveBattleHybrid]]:[['v3',(a,d,s)=>resolveBattle(a,d,s,3)],['v4',resolveBattleHybrid]];
 for(const [engine,fn] of versions){
  const start=performance.now();let outputBytes=0,attackers=0,defenders=0,damaged=0,wins=0,draws=0,metal=0,crystal=0;
  for(let i=0;i<iterations;i++){
   const a={fleet:{...input.attacker},tech:{}},d={fleet:{...input.defender},tech:{}};
   const result=fn(a,d,'benchmark:'+name+':'+i);
   attackers+=count(result.attacker.fleet);defenders+=count(result.defender.fleet);
   damaged+=Object.values(result.attacker.hulls||{}).reduce((n,h)=>n+h.length,0)+Object.values(result.defender.hulls||{}).reduce((n,h)=>n+h.length,0);
   wins+=Number(result.outcome==='attacker');draws+=Number(result.outcome==='draw');
   metal+=result.debris.metal;crystal+=result.debris.crystal;
   outputBytes+=Buffer.byteLength(JSON.stringify(result));
  }
  const ms=(performance.now()-start)/iterations;
  results.push({scenario:name,totalUnits:total,engine,runs:iterations,msPerBattle:+ms.toFixed(2),avgAttackers:+(attackers/iterations).toFixed(2),avgDefenders:+(defenders/iterations).toFixed(2),avgDamaged:+(damaged/iterations).toFixed(2),attackerWinPercent:+(100*wins/iterations).toFixed(2),drawPercent:+(100*draws/iterations).toFixed(2),avgDebrisMetal:+(metal/iterations).toFixed(2),avgDebrisCrystal:+(crystal/iterations).toFixed(2),avgResultKB:+(outputBytes/iterations/1024).toFixed(2)});
 }
}
for(const name of all)compare(name);
console.table(results);
const differences=[];
for(const name of all){
 const a=results.find(r=>r.scenario===name&&r.engine===(comparison==='v5-v6'?'v5':comparison==='v4-v5'?'v4':'v3')),b=results.find(r=>r.scenario===name&&r.engine===(comparison==='v5-v6'?'v6':comparison==='v4-v5'?'v5':'v4'));
 if(a&&b)differences.push({scenario:name,speedup:a.msPerBattle/b.msPerBattle,deltaAttackers:b.avgAttackers-a.avgAttackers,deltaDefenders:b.avgDefenders-a.avgDefenders,deltaDamaged:b.avgDamaged-a.avgDamaged,deltaDebrisMetal:b.avgDebrisMetal-a.avgDebrisMetal});
}
console.table(differences);
mkdirSync('benchmark-results',{recursive:true});
writeFileSync('benchmark-results/results.json',JSON.stringify({createdAt:new Date().toISOString(),scenario,comparison,realm,rapidFireRules:comparison==='v5-v6'?realmConfig.rapidFire:null,runs,legacyLimit,results,differences},null,2));
let md='# WaHueLaPa – Kampfprüfstand v3 vs. v4\n\n';
md+='**Realm-Profil:** '+realm+'\\n\\n';
md+='**Hinweis:** v3 wird bei mehr als '+legacyLimit+' Schiffen bewusst übersprungen. v4 ist noch NICHT im Live-Spiel. Unterschiedliche Ergebnisse sind kein automatischer Fehler, müssen aber untersucht werden. Die identischen Seeds garantieren wegen verschiedener Zufalls-Abrufreihenfolge keine identischen Treffer.\n\n';
md+='| Szenario | Einheiten | Engine | Läufe | ms/Kampf | Angreifer übrig | Verteidiger übrig | Beschädigte | Ergebnis KB |\n|---|---:|---|---:|---:|---:|---:|---:|---:|\n';
for(const r of results)md+=`| ${r.scenario} | ${r.totalUnits} | ${r.engine} | ${r.runs} | ${r.msPerBattle} | ${r.avgAttackers} | ${r.avgDefenders} | ${r.avgDamaged} | ${r.avgResultKB} |\n`;
md+='\n## Vergleichbare Szenarien\n\n| Szenario | Beschleunigung (v3/v4) | Δ Angreifer | Δ Verteidiger | Δ beschädigt | Δ Trümmer Metall |\n|---|---:|---:|---:|---:|---:|\n';
for(const d of differences)md+=`| ${d.scenario} | ${Number(d.speedup).toFixed(2)}× | ${d.deltaAttackers.toFixed(2)} | ${d.deltaDefenders.toFixed(2)} | ${d.deltaDamaged.toFixed(2)} | ${d.deltaDebrisMetal.toFixed(2)} |\n`;
md+='\n**Status:** Messdaten, kein Balancing-Freigabetest. Forschungsboni, Reparaturgruppen und Speicherverbrauch benötigen separate Freigabetests.\n';
writeFileSync('benchmark-results/report.md',md);
console.log('Ergebnis: benchmark-results/report.md und results.json');
