import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBattle} from '../src/combat.js';
import {loadBattleRound,summarizeRound,roundSummaryView} from '../src/combat-summary.js';
import {battleLogView} from '../src/combat-ui.js';

test('200 Falken versus Titan: both rounds reproduce the actual damage and losses',()=>{
 const {trace}=resolveBattle({fleet:{falke:200}},{fleet:{titan:1}},'200-falken-vs-titan');
 const first=summarizeRound(trace,trace.rounds[0]);
 assert.deepEqual(first.pairs.map(p=>[p.shots,p.damage]),[[200,7500],[4,1100]]);
 const titan=first.outcomes.find(o=>o.target.key==='titan');
 assert.equal(titan.shield,1400);assert.equal(titan.hull,6100);assert.equal(titan.hpAfter,400);assert.equal(titan.destroyed,0);
 const second=summarizeRound(trace,trace.rounds[1]);
 assert.equal(second.outcomes.find(o=>o.target.key==='titan').destroyed,1);
 assert.equal(second.outcomes.find(o=>o.target.key==='falke').destroyed,4);
});

test('pagination includes independently paginated shots and impacts beyond 200',async()=>{
 const shots=Array.from({length:405},(_,n)=>({n})),impacts=Array.from({length:201},(_,n)=>({n})),offsets=[];
 const result=await loadBattleRound(async(m,r,o)=>{offsets.push(o);return {round:r,limit:200,shotTotal:shots.length,impactTotal:impacts.length,shots:shots.slice(o,o+200),impacts:impacts.slice(o,o+200)};},'m',1);
 assert.deepEqual(offsets,[0,200,400]);assert.deepEqual(result.shots,shots);assert.deepEqual(result.impacts,impacts);
 await assert.rejects(loadBattleRound(async()=>({shotTotal:2,impactTotal:0,shots:[],impacts:[]}), 'm',1),/vollständig/);
});

test('mixed classes share outcomes without assigning a fictitious kill; names are escaped',()=>{
 const header={initial:[{id:'a',side:'attacker',key:'falke',name:'<Falke>'},{id:'b',side:'attacker',key:'titan',name:'Titan'},{id:'d',side:'defender',key:'waechter',name:'Wächter'}]};
 const page={round:1,shots:[{shooter:'a',target:'d',damage:30},{shooter:'b',target:'d',damage:100}],impacts:[{target:'d',shieldDamage:20,hullDamage:100,overkill:10,destroyed:true,hpAfter:0}]};
 const summary=summarizeRound(header,page);assert.equal(summary.outcomes.length,1);assert.equal(summary.outcomes[0].destroyed,1);assert.deepEqual(summary.outcomes[0].sources,['<Falke>','Titan']);
 const html=roundSummaryView(header,page);assert.ok(html.includes('&lt;Falke&gt;'));assert.ok(!html.includes('<Falke>'));assert.ok(html.includes('Gemeinsames Trefferergebnis'));
});

test('raw unit cards are collapsed by default',()=>{
 const {trace}=resolveBattle({fleet:{falke:1}},{fleet:{titan:1}},'test');
 const html=battleLogView({...trace,ownSide:'attacker'},null);
 assert.ok(html.includes('<details class="battle-raw-details"><summary>Einzelne Schiffe anzeigen'));
});
