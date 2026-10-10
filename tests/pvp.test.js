import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance} from '../src/engine.js';
import {SHIPS,TECHS,vector} from '../src/config.js';
import {validateSave} from '../src/storage.js';
import {processWorld,prepareWorld,advanceWorld,projectPvP,DAY,COLONY_PROTECTION} from '../src/server-world.js';
import {resolveBattle,attackFlight,warningFraction,loadPlunder} from '../src/combat.js';
import {pvpSettings,pvpView,pvpEstimate} from '../src/pvp-ui.js';
export const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002';
export const ID='10000000-0000-0000-0000-000000000001',T=1700000000000;
export function fixture(){
 const saves=[A,B].map((user_id,i)=>{
  const s=newGame(i?'Defender':'Attacker',T);s.galaxy={x:500,y:i?40:960};for(const [k,t] of Object.entries(TECHS))s.tech[k]=t.max;
  const p=structuredClone(s.planets[0]);Object.assign(p,{id:i?'g-orion-p1':'g-helion-p1',name:i?'Target':'Origin',system:i?'orion':'helion',slot:1,x:i?380:520,y:i?250:400});
  p.resources=vector([10000,10000,10000]);p.buildings.warehouse=4;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.buildings.orbital=4;
  p.ships.waechter=i?0:4;p.ships.karawane=i?0:4;
  s.planets.push(p);s.active=p.id;return {user_id,revision:1,state:s};
 });
 return {now:T,settings:{enabled:true,epoch:1},admins:[A],saves,starts:[{user_id:A,x:500,y:960},{user_id:B,x:500,y:40}],surveys:[],missions:[],attacks:[],
 planets:saves.map(r=>({id:r.state.active,meta:((p)=>Object.fromEntries(['id','system','slot','x','y','name','coord','kind','image','mult','ocean','energy','color','distance'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]])))(r.state.planets[1]),owner_id:r.user_id,reserved:false,colonized_at:T-DAY-1,protection_ended:false,debris:vector([0,0,0])}))};
}
const attack=()=>({type:'attack',requestId:ID,action:{from:'g-helion-p1',to:'g-orion-p1',fleet:{waechter:4,karawane:4}}});
test('Launch is atomic, uses slowest ship, reserves both-leg fuel and ends origin protection',()=>{
 const w=fixture(),before=JSON.stringify(w),p=w.saves[0].state.planets[1],f=attackFlight(w.saves[0].state,p,w.planets[1].meta,attack().action.fleet);
 const n=processWorld(w,A,attack()),m=n.attacks[0];assert.equal(m.arrival_at,T+f.ms);assert.equal(m.return_at,T+2*f.ms);assert.equal(m.slowest,'karawane');
 assert.equal(n.saves[0].state.planets[1].ships.waechter,0);assert.equal(n.saves[0].state.planets[1].resources.fuel,10000-f.fuel);assert.ok(n.planets[0].protection_ended);assert.equal(JSON.stringify(w),before);
});
test('Warning stays private until exact research-dependent cutoff',()=>{
 const w=processWorld(fixture(),A,attack()),m=w.attacks[0];w.now=m.warning_at-1;assert.equal(projectPvP(w,B).incoming.length,0);
 w.now=m.warning_at;const warning=projectPvP(w,B).incoming[0];assert.ok(warning);assert.deepEqual(Object.keys(warning).sort(),['arrival','commander','id','to']);
 assert.equal(warningFraction(0),.9);assert.ok(Math.abs(warningFraction(5)-.1)<1e-10);assert.equal(projectPvP(w,'stranger').outgoing.length,0);
});
test('1h protection has an exact boundary; tutorial targets, own targets and unavailable ships reject without mutation',()=>{
 const w=fixture();w.planets[1].colonized_at=T-COLONY_PROTECTION+1;assert.throws(()=>processWorld(w,A,attack()),/Gründungsschutz/);
 w.planets[1].colonized_at=T-COLONY_PROTECTION;assert.equal(processWorld(w,A,attack()).attacks.length,1);
 const before=JSON.stringify(w);assert.throws(()=>processWorld(w,A,{...attack(),action:{...attack().action,to:'home'}}),/gemeinsame/);
 assert.throws(()=>processWorld(w,A,{...attack(),action:{...attack().action,to:'g-helion-p1'}}),/gemeinsame/);
 assert.throws(()=>processWorld(w,A,{...attack(),action:{...attack().action,fleet:{titan:100}}}),/Schiffe/);assert.equal(JSON.stringify(w),before);
});
test('Pause blocks new attacks, permits only admin toggles and lets launched battles/returns finish',()=>{
 let w=fixture();w.settings.enabled=false;assert.throws(()=>processWorld(w,A,attack()),/pausiert/);
 assert.throws(()=>processWorld(w,B,{type:'set-pvp',enabled:true}),/Administratoren/);
 w=processWorld(w,A,{type:'set-pvp',enabled:true});w=processWorld(w,A,attack());w=processWorld(w,A,{type:'set-pvp',enabled:false});
 w.now=w.attacks[0].return_at+1;w=processWorld(w,B,{type:'sync'});assert.equal(w.settings.enabled,false);assert.equal(w.attacks[0].status,'returned');assert.equal(w.attacks[0].report.outcome,'attacker');
});
test('Offline catch-up equals incremental updates, creates one report per side and returns cargo exactly once',()=>{
 const launched=processWorld(fixture(),A,attack()),end=launched.attacks[0].return_at+3600000;
 const lazy=processWorld({...structuredClone(launched),now:end},B,{type:'sync'});
 let frequent=launched;for(let now=T+10000;now<end;now+=10000)frequent=processWorld({...frequent,now},B,{type:'sync'});
 frequent=processWorld({...frequent,now:end},A,{type:'sync'});const normalized=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='resolved_at'?0:typeof v==='number'?Math.round(v*1e6)/1e6:v));assert.deepEqual(normalized(lazy.saves),normalized(frequent.saves));assert.deepEqual(normalized(lazy.attacks),normalized(frequent.attacks));
 const m=lazy.attacks[0];assert.equal(m.status,'returned');assert.equal(m.report.at,m.arrival_at);assert.equal(m.report.loot.metal,2500);
 const s=lazy.saves[0].state;assert.equal(s.planets[1].ships.karawane,4);assert.equal(s.planets[1].resources.metal,12500);
 const again=processWorld(lazy,A,{type:'sync'});assert.deepEqual(again.saves,lazy.saves);assert.equal(s.reports.filter(r=>r.title==='PvP-Kampfbericht').length,1);
});
test('Arrival resolves before a late resource transfer, while pre-arrival stationing actually evades combat',()=>{
 let w=processWorld(fixture(),A,attack()),at=w.attacks[0].arrival_at;
 w.now=at+1;w=processWorld(w,B,{type:'command',action:{type:'reserve',planet:'g-orion-p1',reserves:vector([99999,99999,99999])}});
 assert.equal(w.attacks[0].report.loot.metal,2500);assert.equal(w.saves[1].state.planets[1].resources.metal,7500);
 w=fixture();w.saves[1].state.planets[1].ships.waechter=1;w=processWorld(w,A,attack());
 w=processWorld(w,B,{type:'command',action:{type:'station',planet:'g-orion-p1',to:'home',ship:'waechter',count:1}});
 w.now=w.attacks[0].arrival_at;w=processWorld(w,B,{type:'sync'});assert.equal(w.attacks[0].report.defenderBefore.waechter,0);
});
test('Defense completion at arrival counts; completion one millisecond later does not',()=>{
 let w=fixture();w=processWorld(w,A,attack());const at=w.attacks[0].arrival_at;
 w.saves[1].state.planets[1].shipjob={key:'laser',count:1,start:T,end:at};
 const exact=processWorld({...structuredClone(w),now:at},B,{type:'sync'});assert.equal(exact.attacks[0].report.defenderBefore.laser,1);
 w.saves[1].state.planets[1].shipjob.end=at+1;const late=processWorld({...w,now:at+1},B,{type:'sync'});
 assert.equal(late.attacks[0].report.defenderBefore.laser,0);assert.equal(late.saves[1].state.planets[1].ships.laser,1);assert.equal(late.attacks[0].report.defenderAfter.laser,0);
});
test('Seeded combat is reproducible and simultaneous lethal salvos permit mutual destruction',()=>{
 const a={fleet:{falke:1},tech:{},hulls:{falke:[.01]}},d={fleet:{falke:1},tech:{},hulls:{falke:[.01]}};
 // No shields leaves both ships lethal to the first simultaneous exchange.
 a.shieldFactor=d.shieldFactor=0;
 const one=resolveBattle(a,d,ID),two=resolveBattle(a,d,ID);assert.deepEqual(one,two);assert.equal(one.outcome,'draw');assert.deepEqual(one.attacker.fleet,{});assert.deepEqual(one.defender.fleet,{});
 assert.deepEqual(one.debris,vector([144,90,0]));
});
test('Draws and cargo exhaustion do not plunder; warehouse overflow is included and bunkers protect stock',()=>{
 const none=loadPlunder(vector([10000,10000,10000]),vector([5000,0,0]),2000,0,vector([999,999,0]),true);assert.deepEqual(none.cargo,vector([0,0,0]));
 assert.deepEqual(loadPlunder(vector([10000,10000,10000]),vector([0,0,0]),0,99999,vector([999,999,0]),false).cargo,vector([0,0,0]));
 const cap=loadPlunder(vector([10000,10000,10000]),vector([5000,0,0]),2000,3300,vector([999,999,0]),true);assert.equal(cap.loot.metal,3250);assert.equal(cap.loot.crystal,50);assert.equal(cap.salvage.metal,0);
});
test('Destroyed freighters lose their cargo capacity; debris excludes fuel and defense salvage stays local',()=>{
 const b=resolveBattle({fleet:{falke:1,karawane:1},tech:{},shieldFactor:0},{fleet:{titan:10,flak:1},tech:{}},ID);
 assert.equal(b.attacker.fleet.karawane||0,0);assert.equal(b.debris.fuel,0);
 const defense=resolveBattle({fleet:{titan:30},tech:{}},{fleet:{flak:1},tech:{}},ID);assert.equal(defense.defenseRepair.metal,112);assert.equal(defense.debris.metal,0);
});
test('Victim-wide 24h loot budget prevents repeated raids from stacking the 25% limit',()=>{
 let w=processWorld(fixture(),A,attack());w.now=w.attacks[0].return_at;w=processWorld(w,A,{type:'sync'});
 assert.equal(w.attacks[0].report.loot.metal,2500);
 w=processWorld(w,A,{...attack(),requestId:'10000000-0000-0000-0000-000000000002'});w.now=w.attacks[1].return_at;w=processWorld(w,A,{type:'sync'});
 assert.equal(w.attacks[1].report.loot.metal,0);assert.throws(()=>processWorld(w,A,{...attack(),requestId:'10000000-0000-0000-0000-000000000003'}),/zwei Angriffe/);
});
test('Damage survives stationing, saving and repair; defense slots prevent overspending and movement',()=>{
 const w=fixture();let s=w.saves[0].state,p=s.planets[1];p.hulls={waechter:[.5]};
 s=act(s,{type:'station',planet:p.id,to:'home',ship:'waechter',count:1},T);s=validateSave(s);advance(s,s.missions[0].due);
 assert.deepEqual(s.planets[0].hulls.waechter,[.5]);const metal=s.planets[0].resources.metal,crystal=s.planets[0].resources.crystal;
 s=act(s,{type:'repair',planet:'home'},s.time);assert.deepEqual(s.planets[0].hulls,{});assert.equal(s.planets[0].resources.metal,metal-135);assert.equal(s.planets[0].resources.crystal,crystal-90);
 p=s.planets[1];p.buildings.shipyard=6;p.buildings.orbital=1;assert.throws(()=>act(s,{type:'ship',planet:p.id,key:'plasma',count:2},s.time),/Plätze/);assert.throws(()=>act(s,{type:'station',planet:p.id,to:'home',ship:'flak',count:1},s.time),/Verteidigung/);
});
test('PvP UI exposes the switch only to admins, escapes names and supports public unknown target labels',()=>{
 const w=fixture(),data=projectPvP(w,A);assert.match(pvpSettings(data),/role="switch"/);assert.doesNotMatch(pvpSettings(projectPvP(w,B)),/role="switch"/);
 const html=pvpView(w.saves[0].state,data,{planets:[{id:'g-orion-p1',owner:'foreign',reserved:false,commander:'<script>',system:'orion',slot:1,surveyed:false}],systems:[]});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Unbekannt'));assert.ok(html.includes('pvp-attack-form'));
});

test('Stationing permits hangars above the former 5000-unit limit',()=>{
 const w=fixture(),source=w.saves[0].state.planets[1],home=w.saves[0].state.planets[0];source.ships.waechter=100;source.resources.fuel=50000;home.ships.transport=4990;
 const n=processWorld(w,A,{type:'command',action:{type:'station',planet:source.id,to:'home',ship:'waechter',count:100}});assert.equal(n.saves[0].state.missions[0].count,100);const m=n.saves[0].state.missions[0];n.now=m.due;const arrived=advanceWorld(n);assert.equal(arrived.saves[0].state.planets[0].ships.waechter,100);assert.ok(Object.values(arrived.saves[0].state.planets[0].ships).reduce((a,b)=>a+b,0)>5000);
});
test('Local defense salvage reduces displayed and paid costs without becoming ordinary cargo',()=>{
 const w=fixture();let s=w.saves[0].state,p=s.planets[1];p.buildings.shipyard=2;p.defenseSalvage=vector([112,56,0]);p.resources=vector([48,24,20]);
 s=act(s,{type:'ship',planet:p.id,key:'flak',count:1},T);p=s.planets[1];assert.deepEqual(p.defenseSalvage,vector([0,0,0]));assert.deepEqual(p.resources,vector([0,0,0]));advance(s,p.shipjob.end);assert.equal(p.ships.flak,1);
});

test('A failed raid does not start or consume the victim loot-budget window',()=>{
 let w=fixture();w.saves[1].state.planets[1].ships.titan=100;w=processWorld(w,A,attack());w.now=w.attacks[0].arrival_at;w=processWorld(w,B,{type:'sync'});
 assert.equal(w.attacks[0].report.outcome,'defender');assert.equal(w.saves[1].state.planets[1].raidWindowStart,undefined);assert.equal(w.saves[1].state.planets[1].raidBudget,undefined);assert.equal(w.attacks[0].status,'returned');
});

const request=(from='home',fleet={waechter:4,karawane:4})=>({type:'attack',requestId:ID,action:{from,to:'g-orion-p1',fleet}});
function homeWorld(){const w=fixture(),s=w.saves[0].state,home=s.planets[0];s.active='home';home.ships.waechter=4;home.ships.karawane=4;home.resources.fuel=10000;home.buildings.warehouse=4;w.planets[0].colonized_at=T;return w;}
function publicGalaxy(w){return {start:{x:500,y:960},systems:[{id:'orion',x:380,y:250}],planets:w.planets.map(p=>({id:p.id,system:p.meta.system,slot:p.meta.slot,owner:p.owner_id===A?'mine':'foreign',reserved:p.reserved,commander:'Commander'}))};}
test('Home attacks use assigned coordinates and return ships and loot to home while ending outpost protection',()=>{
 const w=homeWorld(),before=JSON.stringify(w),home=w.saves[0].state.planets[0];
 let n=processWorld(w,A,request());const m=n.attacks[0],s=n.saves[0].state;
 const f=attackFlight(s,s.planets[0],w.planets[1].meta,request().action.fleet);
 assert.equal(m.from,'home');assert.equal(m.arrival_at,T+f.ms);assert.equal(m.return_at,T+2*f.ms);
 assert.equal(s.planets[0].resources.fuel,home.resources.fuel-f.fuel);assert.equal(s.planets[0].ships.waechter,0);
 assert.equal(n.planets[0].protection_ended,true);assert.equal(projectPvP(n,A).colonies.some(p=>p.id==='home'),false);
 assert.equal(f.distance,Math.hypot(500-380,960-250)/40+.15);
 n=processWorld({...n,now:m.return_at},B,{type:'sync'});assert.equal(n.attacks[0].status,'returned');assert.equal(n.saves[0].state.planets[0].ships.waechter,4);assert.equal(n.saves[0].state.planets[0].ships.karawane,4);
 assert.equal(JSON.stringify(w),before);
});
test('Home attacks require an actually settled owned outpost, a start position and suitable engines',()=>{
 let w=homeWorld();w.planets[0].reserved=true;assert.throws(()=>processWorld(w,A,request()),/besiedelte Galaxiekolonie/);
 w=homeWorld();w.planets[0].owner_id=B;assert.throws(()=>processWorld(w,A,request()),/besiedelte Galaxiekolonie/);
 w=homeWorld();w.saves[0].state.tech.ramjet=0;assert.throws(()=>processWorld(w,A,request()),/Staustrahl/);
 w=homeWorld();w.starts=[];delete w.saves[0].state.galaxy;assert.throws(()=>processWorld(w,A,request()),/Startplatz/);
 w=homeWorld();const s=w.saves[0].state;s.planets[0].ships.falke=1;s.planets[0].ships.transport=1;
 assert.throws(()=>processWorld(w,A,request('home',{falke:1,transport:1})),/geeigneter Antrieb/);
 s.tech.assaultDrive=0;assert.throws(()=>processWorld(w,A,request('home',{falke:1})),/geeigneter Antrieb/);
 s.tech.assaultDrive=1;assert.equal(processWorld(w,A,request('home',{falke:1})).attacks.length,1);
});
test('Every private tutorial planet may be a base but never an attack target',()=>{
 const w=homeWorld(),p=structuredClone(w.saves[0].state.planets[0]);p.id='ferrum';w.saves[0].state.planets.push(p);
 assert.equal(processWorld(w,A,request('ferrum')).attacks[0].from,'ferrum');
 assert.throws(()=>processWorld(w,A,{...request(),action:{...request().action,to:'home'}}),/gemeinsame Kolonie/);
});
test('One-hour protection is projected and enforced for existing colonies at start and arrival',()=>{
 let w=homeWorld();w.planets[1].colonized_at=T-COLONY_PROTECTION+1;
 assert.equal(projectPvP(w,A).colonies[1].protectedUntil,T+1);assert.throws(()=>processWorld(w,A,request()),/1 Stunde/);
 w.planets[1].colonized_at=T-COLONY_PROTECTION;w=processWorld(w,A,request());
 w.planets[1].colonized_at=w.attacks[0].arrival_at-1;w=processWorld({...w,now:w.attacks[0].arrival_at},B,{type:'sync'});
 assert.equal(w.attacks[0].report.outcome,'cancelled');
});
test('Home planner matches server flight estimate and distinguishes loading, missing colonies and old server',()=>{
 const w=homeWorld(),s=w.saves[0].state;s.galaxy={x:500,y:960};const g=publicGalaxy(w),pvp=projectPvP(w,A);
 assert.match(pvpView(s,pvp,g),/pvp-attack-form/);assert.match(pvpView(s,pvp,g),/1 Stunde Gründungsschutz/);
 assert.match(pvpView(s,pvp,null),/Angriffsziele werden geladen/);
 assert.doesNotMatch(pvpView(s,{...pvp,homeAttacks:false,protectionMs:86400000},g),/pvp-attack-form/);
 assert.match(pvpView(s,{...pvp,homeAttacks:false,protectionMs:86400000},g),/Spielserver-Update/);
 g.planets[0].reserved=true;assert.match(pvpView(s,pvp,g),/besiedelte Galaxiekolonie/);g.planets[0].reserved=false;
 const f=attackFlight(s,s.planets[0],w.planets[1].meta,request().action.fleet);
 assert.ok(pvpEstimate(s,g,'g-orion-p1',request().action.fleet).includes(f.fuel+' Treibstoff'));
});

test('New attacks pin v2, legacy launches stay v1, and full traces never enter sync projections',()=>{
 const launched=processWorld(fixture(),A,attack());assert.equal(launched.attacks[0].ruleVersion,2);
 const resolved=processWorld({...structuredClone(launched),now:launched.attacks[0].arrival_at},B,{type:'sync'});assert.ok(resolved.attacks[0].report.trace);assert.equal(projectPvP(resolved,B).reports[0].trace,undefined);assert.equal(projectPvP(resolved,B).reports[0].traceAvailable,true);
 const legacy=structuredClone(launched);delete legacy.attacks[0].ruleVersion;legacy.now=legacy.attacks[0].arrival_at;const old=processWorld(legacy,B,{type:'sync'});assert.equal(old.attacks[0].report.ruleVersion,1);assert.equal(old.attacks[0].report.trace,undefined);
});
test('Attacks can send all 110 selected ships and still enforce availability',()=>{
 const w=fixture(),p=w.saves[0].state.planets[1];Object.assign(p.ships,{falke:100,titan:4,karawane:6});p.resources.fuel=100000;
 const request=attack();request.action.fleet={falke:100,titan:4,karawane:6};
 const next=processWorld(w,A,request);assert.deepEqual(next.attacks[0].fleet,request.action.fleet);
 assert.equal(next.saves[0].state.planets[1].ships.falke,0);
 request.action.fleet.falke=101;assert.throws(()=>processWorld(w,A,request),/Schiffe/);
 const ui=pvpView(w.saves[0].state,{...projectPvP(prepareWorld(w),A),incoming:[],outgoing:[],reports:[]},{planets:w.planets.map(q=>({...q.meta,owner:q.owner_id===A?'mine':'foreign',ownerName:'Commander'}))},w.now);
 assert.match(ui,/data-action="pvp-select-all"/);assert.match(ui,/data-action="pvp-select-none"/);
 assert.match(ui,/name="falke" type="number" min="0" max="100"/);
});

test('Large shipbuilding and transport fleets preserve save validation and resource rules',()=>{
 const w=fixture();let s=w.saves[0].state,p=s.planets[1];p.buildings.shipyard=4;p.resources=vector([100000,100000,100000]);
 s=act(s,{type:'ship',key:'probe',count:51},s.time);assert.equal(s.planets[1].shipjob.count,51);validateSave(s);
 s=advance(s,s.planets[1].shipjob.end);p=s.planets[1];p.ships.karawane=151;p.resources.fuel=100000;
 s=act(s,{type:'station',to:'home',ship:'karawane',count:151,order:vector([0,0,0])},s.time);assert.equal(s.missions[0].count,151);validateSave(s);
 p=s.planets[1];p.ships.falke=1000001;validateSave(s);
 assert.throws(()=>act(s,{type:'ship',key:'probe',count:1.5},s.time));
});
test('Combat records all units and shots above the former 5000-unit cap',()=>{
 const r=resolveBattle({fleet:{falke:5001},tech:{}},{fleet:{falke:1,atlas:1},tech:{}},'large-fleet');
 assert.equal(r.trace.initial.filter(u=>u.side==='attacker').length,5001);
 assert.equal(r.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A-')).length,5001);
 assert.ok(r.trace.rounds[0].shots.filter(s=>s.shooter.startsWith('A-')).every(s=>s.target==='D-falke-001'));
 assert.equal(r.trace.final.length,5003);
});
