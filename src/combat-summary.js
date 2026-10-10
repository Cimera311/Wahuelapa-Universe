import {reportEscape} from './reports-ui.js';
const number=n=>Number(n||0).toLocaleString('de-DE',{maximumFractionDigits:2});
const side=s=>s==='attacker'?'Angreifer':'Verteidiger';

// Read every page before aggregating. Never infer outcomes from a partial page.
export async function loadBattleRound(read,mission,round){
 const first=await read(mission,round,0),shots=[...first.shots],impacts=[...first.impacts];
 const total=Math.max(first.shotTotal,first.impactTotal),limit=first.limit||200;
 for(let offset=limit;offset<total;offset+=limit){const page=await read(mission,round,offset);shots.push(...page.shots);impacts.push(...page.impacts);}
 if(shots.length!==first.shotTotal||impacts.length!==first.impactTotal)throw Error('Die Runde konnte nicht vollständig geladen werden.');
 return {...first,shots,impacts};
}

export function summarizeRound(header,page){
 const units=new Map(header.initial.map(u=>[u.id,u])),pairs=new Map(),contributors=new Map();
 for(const shot of page.shots){
  const shooter=units.get(shot.shooter),target=units.get(shot.target);
  if(!shooter||!target)throw Error('Einheit im Kampfprotokoll fehlt.');
  const key=JSON.stringify([shooter.side,shooter.key,target.side,target.key]);
  if(!pairs.has(key))pairs.set(key,{shooter,target,shots:0,damage:0});
  const pair=pairs.get(key);pair.shots++;pair.damage+=shot.damage;
  if(!contributors.has(shot.target))contributors.set(shot.target,new Map());
  contributors.get(shot.target).set(shooter.key,shooter.name);
 }
 const outcomes=new Map();
 for(const hit of page.impacts){
  const target=units.get(hit.target),sources=[...(contributors.get(hit.target)||new Map())].sort(([a],[b])=>a.localeCompare(b));
  if(!target||!sources.length)throw Error('Treffer im Kampfprotokoll nicht zuordenbar.');
  const key=JSON.stringify([target.side,target.key,sources.map(([key])=>key)]);
  if(!outcomes.has(key))outcomes.set(key,{target,sources:sources.map(([,name])=>name),shield:0,hull:0,overkill:0,destroyed:0,surviving:0,hpAfter:0});
  const row=outcomes.get(key);row.shield+=hit.shieldDamage;row.hull+=hit.hullDamage;row.overkill+=hit.overkill;
  row.destroyed+=Number(hit.destroyed);row.surviving+=Number(!hit.destroyed);row.hpAfter+=hit.hpAfter;
 }
 return {pairs:[...pairs.values()],outcomes:[...outcomes.values()]};
}

export function roundSummaryView(header,page){
 const {pairs,outcomes}=summarizeRound(header,page);
 const label=u=>reportEscape(u.name)+' <small>'+side(u.side)+'</small>';
 return '<section class="battle-round-summary"><h3>Runde '+page.round+' · Schlagabtausch</h3><p class="fine">Beide Seiten feuern gleichzeitig. Verluste gelten am Rundenende.</p>'+pairs.map(p=>'<article class="battle-exchange"><strong>'+label(p.shooter)+' → '+label(p.target)+'</strong><p>'+number(p.shots)+' Schüsse · '+number(p.damage)+' berechneter Schaden</p></article>').join('')+'<h4>Was wurde beschädigt oder zerstört?</h4>'+outcomes.map(o=>'<article class="battle-impact-summary"><strong>'+label(o.target)+' · getroffen von '+reportEscape(o.sources.join(' + '))+'</strong><p>'+number(o.shield)+' Schild + '+number(o.hull)+' Hülle beschädigt</p><p class="'+(o.destroyed?'battle-loss':'')+'">'+(o.destroyed?'💥 '+number(o.destroyed)+' zerstört':'Keine Zerstörung')+(o.surviving?' · '+number(o.surviving)+' getroffene Einheiten überleben mit insgesamt '+number(o.hpAfter)+' Hülle':'')+'</p>'+(o.overkill?'<small>'+number(o.overkill)+' Überschaden · nicht auf andere Ziele übertragen</small>':'')+(o.sources.length>1?'<small>Gemeinsames Trefferergebnis; kein einzelner Klasse zugeschriebener Abschuss.</small>':'')+'</article>').join('')+(!pairs.length?'<p>Keine Schüsse in dieser Runde.</p>':'')+'</section>';
}
