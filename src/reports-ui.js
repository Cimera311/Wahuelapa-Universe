import {actionIcon} from './ui-assets.js';
import {SHIPS,RES,LABEL} from './config.js';
export const reportEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const reportDate=t=>new Date(t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const reportNumber=n=>Math.floor(n||0).toLocaleString('de-DE');
const reportKinds={battle:'Gefecht',attack:'Angriff',return:'Rückkehr',transport:'Transport',scan:'Erkundung',colony:'Kolonisierung',other:'Sonstiges'};
const reportResults={win:'Sieg',loss:'Niederlage',draw:'Unentschieden',cancelled:'Abgebrochen'};
export function reportPlanetName(id,state,galaxy){
 const owned=state?.planets?.find(p=>p.id===id);if(owned)return owned.name;
 const known=galaxy?.planets?.find(p=>p.id===id);if(known?.surveyed&&known.name)return known.name;
 const match=/^g-([a-z]+)-p(\d+)$/.exec(id||'');if(match){const system=galaxy?.systems?.find(s=>s.id===match[1]);return (system?.name||match[1][0].toUpperCase()+match[1].slice(1))+' '+match[2];}
 return id||'Unbekannt';
}
function reportFleet(f){return Object.entries(f||{}).filter(([,n])=>n).map(([k,n])=>reportNumber(n)+' × '+(SHIPS[k]?.name||k)).join(' · ')||'Keine';}
function reportCargo(c){return RES.filter(k=>c?.[k]).map(k=>reportNumber(c[k])+' '+LABEL[k]).join(' · ')||'Keine';}
function reportSide(r,state){
 const p=r.payload||{};
 if(['attacker','defender'].includes(p.ownSide))return p.ownSide;
 if(r.kind==='attack'||r.kind==='return')return 'attacker';
 // Current planet ownership cannot establish a player's historical role.
 return null;
}
function reportContext(r,state,galaxy){
 const p=r.payload||{},side=reportSide(r,state),own='Du'+(state?.name?' ('+state.name+')':''),unknown='Nicht im Bericht gespeichert';
 const attacker=p.attackerName||(side==='attacker'?own:side==='defender'?p.commander:null)||unknown;
 const defender=p.defenderName||(side==='defender'?own:side==='attacker'?p.commander:null)||unknown;
 const from=p.fromName||(p.from?side==='attacker'?reportPlanetName(p.from,state,galaxy):p.from.startsWith('g-')?reportPlanetName(p.from,null,galaxy):'Privates Heimatsystem ('+p.from+')':unknown);
 const to=p.toName||(p.to?reportPlanetName(p.to,state,galaxy):unknown);
 return {side,attacker,defender,from,to,perspective:side==='attacker'?'Du hast angegriffen':side==='defender'?'Du wurdest angegriffen':'Eigene Rolle nicht im Bericht gespeichert'};
}
function reportLosses(before,after){return Object.fromEntries(Object.entries(before||{}).map(([k,n])=>[k,Math.max(0,n-(after?.[k]||0))]));}
function reportForces(before,after,label){
 if(!before||!after)return '<p>'+label+': Einheiten nicht im Bericht gespeichert.</p>';
 const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]||after[k]);
 return '<div class="report-force-table"><table><caption>'+label+'</caption><thead><tr><th scope="col">Einheit</th><th scope="col">Eingesetzt</th><th scope="col">Verloren</th><th scope="col">Überlebt</th></tr></thead><tbody>'+(keys.map(k=>'<tr><th scope="row">'+reportEscape(SHIPS[k]?.name||k)+(SHIPS[k]?.category==='defense'?'<small>Orbitale Verteidigung</small>':'')+'</th><td>'+reportNumber(before[k])+'</td><td>'+reportNumber(Math.max(0,(before[k]||0)-(after[k]||0)))+'</td><td>'+reportNumber(after[k])+'</td></tr>').join('')||'<tr><td colspan="4">Keine Einheiten eingesetzt.</td></tr>')+'</tbody></table></div>';
}
function reportParticipants(r,state,galaxy){
 const c=reportContext(r,state,galaxy);
 return '<p class="report-perspective">'+reportEscape(c.perspective)+'</p><div class="report-participants"><section><h4>⚔ Angreifer'+(c.side==='attacker'?' · Du':'')+'</h4><strong>'+reportEscape(c.attacker)+'</strong><p>Startplanet: '+reportEscape(c.from)+'</p></section><section><h4>🛡 Verteidiger'+(c.side==='defender'?' · Du':'')+'</h4><strong>'+reportEscape(c.defender)+'</strong><p>Verteidigter Planet: '+reportEscape(c.to)+'</p></section></div><p>Angriffsroute: '+reportEscape(c.from)+' → '+reportEscape(c.to)+'</p>';
}
export function fallbackReports(state,pvp){
 const local=state.reports.filter(r=>r.title!=='PvP-Kampfbericht').map(r=>({...r,id:'local:'+r.id,kind:/sonde|entdeck/i.test(r.title)?'scan':/koloni/i.test(r.title)?'colony':/transport|liefer|route|flotte/i.test(r.title)?'transport':'other',archived:false,payload:{}}));
 const battles=(pvp?.reports||[]).map(r=>({id:'attack:'+r.id+':battle',time:r.at,kind:'battle',title:'Gefecht',missionId:r.id,payload:r,outcome:r.outcome==='draw'?'draw':r.outcome==='cancelled'?'cancelled':reportSide({kind:'battle',payload:r},state)?(r.outcome===reportSide({kind:'battle',payload:r},state)?'win':'loss'):null,archived:false}));
 return [...local,...battles].sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id));
}
export function reportDetail(r,state,galaxy){
 const p=r.payload||{},combat=['battle','attack','return'].includes(r.kind),participants=combat?reportParticipants(r,state,galaxy):'';
 if(r.kind==='battle'){
  const result=p.outcome==='attacker'?'Sieg des Angreifers':p.outcome==='defender'?'Sieg des Verteidigers':p.outcome==='draw'?'Unentschieden':p.outcome==='cancelled'?'Angriff abgebrochen':reportResults[r.outcome]||'Ergebnis nicht gespeichert';
  const header=participants+'<p class="report-result"><strong>Ergebnis: '+reportEscape(result)+'</strong></p>';
  if(p.reason)return header+'<p>'+reportEscape(p.reason)+'</p>';
  const side=reportSide(r,state),before=p[(side||'attacker')+'Before'],after=p[(side||'attacker')+'After'],loss=before&&after?reportNumber(Object.values(reportLosses(before,after)).reduce((a,n)=>a+n,0)):'Nicht gespeichert';
  const survivors=p.attackerAfter?Object.values(p.attackerAfter).some(n=>n>0):null;
  return header+'<div class="report-metrics"><div><small>'+(side?'Eigene Verluste':'Verluste Angreifer')+'</small><strong>'+loss+'</strong></div><div><small>Beute des Angreifers</small><strong>'+reportEscape(reportCargo(p.loot))+'</strong></div><div><small>Kampfrunden</small><strong>'+(p.rounds?.length??'Nicht gespeichert')+'</strong></div></div>'+reportForces(p.attackerBefore,p.attackerAfter,'Angreifer · Flotte')+reportForces(p.defenderBefore,p.defenderAfter,'Verteidiger · Flotte und orbitale Verteidigung')+'<p>'+actionIcon('debris')+'Vom Angreifer geborgene Trümmer: '+reportEscape(reportCargo(p.salvage))+'</p><p>'+actionIcon('debris')+'Verbleibende Trümmer am Ziel: '+reportEscape(reportCargo(p.debrisLeft))+'</p>'+(p.defenseRepair?'<p>Reparaturmaterial des Verteidigers: '+reportEscape(reportCargo(p.defenseRepair))+'</p>':'')+(survivors===false?'<p>Keine Angreiferschiffe überlebt · kein Rückflug.</p>':survivors&&p.returnAt?'<p>Geplante Heimkehr der Angreiferflotte: '+reportEscape(reportDate(p.returnAt))+'</p>':'')+(p.traceAvailable?'<div class="report-skirmishes"><h4>Schlagabtausch je Runde</h4>'+p.rounds.map(q=>'<div class="report-round-exchange"><button data-action="battle-summary" data-mission="'+reportEscape(r.missionId||p.id)+'" data-round="'+q.round+'" aria-expanded="false">Runde '+q.round+' · Wer schoss auf wen?</button><div class="report-round-content" hidden></div></div>').join('')+'</div><button data-action="battle-log" data-mission="'+reportEscape(r.missionId||p.id)+'">Vollständiges Kampfprotokoll öffnen</button>':'<p class="fine">Historischer Bericht: Einzelne Schüsse und Hüllenzustände wurden damals nicht gespeichert.</p>')+'<details class="report-rounds"><summary>Kampfrunden im Detail</summary><p>Verbleibende Einheiten nach jeder Runde:</p><ol>'+(p.rounds||[]).map(q=>'<li>Runde '+reportNumber(q.round)+': Angreifer '+reportNumber(q.attacker)+' · Verteidiger '+reportNumber(q.defender)+'</li>').join('')+'</ol></details>';
 }
 return participants+(r.body?'<p>'+reportEscape(r.body)+'</p>':'')+(p.fleet?'<p>'+(r.kind==='return'?'Zurückgekehrte Angreiferflotte':r.kind==='attack'?'Eingesetzte Angreiferflotte':'Flotte')+': '+reportEscape(reportFleet(p.fleet))+'</p>':'')+(p.cargo?'<p>'+(r.kind==='return'?'Zurückgebrachte Ladung':'Ladung')+': '+reportEscape(reportCargo(p.cargo))+'</p>':'');
}
export function reportRows(items,state,galaxy,{selectable=false,selected=new Set(),opened=new Set()}={}){
 if(!items.length)return '<p class="muted report-empty">Keine passenden Berichte.</p>';
 let day='';return items.map(original=>{
  const related=original.missionId&&items.find(q=>q.kind==='battle'&&q.missionId===original.missionId&&q.payload?.ownSide==='attacker');
  const r=related&&['attack','return'].includes(original.kind)?{...original,payload:{...original.payload,commander:original.payload?.commander||related.payload.commander}}:original;
  const date=new Date(r.time).toLocaleDateString('de-DE'),group=date!==day?'<h3 class="report-day">'+reportEscape(date)+'</h3>':'';day=date;
  const p=r.payload||{},place=p.to?reportPlanetName(p.to,state,galaxy):'',badge=reportResults[r.outcome]||(p.outcome==='attacker'?'Angreifer gewinnt':p.outcome==='defender'?'Verteidiger gewinnt':'');
  return group+'<div class="report-list-row">'+(selectable?'<input type="checkbox" data-report-select="'+reportEscape(r.id)+'" aria-label="Bericht auswählen: '+reportEscape(r.title)+'" '+(selected.has(r.id)?'checked':'')+'>':'')+'<details data-report-id="'+reportEscape(r.id)+'" '+(opened.has(r.id)?'open':'')+'><summary><time datetime="'+new Date(r.time).toISOString()+'">'+reportEscape(reportDate(r.time))+'</time><span class="report-row-copy"><strong>'+reportEscape(r.title||reportKinds[r.kind])+'</strong><small>'+reportEscape(['battle','attack','return'].includes(r.kind)?[reportContext(r,state,galaxy).perspective,place,p.commander].filter(Boolean).join(' · '):[place,p.commander].filter(Boolean).join(' · '))+'</small></span><span class="report-badge '+reportEscape(r.outcome||'')+'">'+reportEscape(badge||reportKinds[r.kind]||'Ereignis')+'</span><span class="report-chevron" aria-hidden="true">⌄</span></summary><div class="report-detail">'+reportDetail(r,state,galaxy)+'</div></details></div>';
 }).join('');
}
export function filterReports(items,filters,now){
 const since=filters.days?now-Number(filters.days)*86400000:0,q=(filters.search||'').trim().toLocaleLowerCase('de-DE');
 return items.filter(r=>!!r.archived===!!filters.archived&&(!filters.kind||r.kind===filters.kind)&&(!filters.outcome||r.outcome===filters.outcome)&&r.time>=since&&[r.title,r.body,r.payload?.from,r.payload?.to,r.payload?.commander].join(' ').toLocaleLowerCase('de-DE').includes(q));
}
export function reportsPage(data,filters,state,galaxy,{busy=false,error='',selected=new Set(),opened=new Set(),durable=false}={}){
 const options=(map,value)=>'<option value="">Alle</option>'+Object.entries(map).map(([k,v])=>'<option value="'+k+'" '+(value===k?'selected':'')+'>'+v+'</option>').join('');
 return '<div class="page-heading"><span class="eyebrow">EREIGNISSE & EINSÄTZE</span><h1>Berichte</h1><p>Neueste Ereignisse zuerst. Öffne eine Zeile für alle Details.</p></div><div class="report-tabs" role="tablist" aria-label="Berichtsbereiche"><button role="tab" aria-selected="'+!filters.archived+'" data-action="report-view" data-archived="false">Übersicht</button><button role="tab" aria-selected="'+!!filters.archived+'" data-action="report-view" data-archived="true">Archiv</button></div><section class="panel"><form id="report-filters" class="report-filters"><label>Suche<input name="search" maxlength="80" value="'+reportEscape(filters.search)+'" placeholder="Planet oder Spieler suchen"></label><label>Typ<select name="kind">'+options(reportKinds,filters.kind)+'</select></label><label>Ergebnis<select name="outcome">'+options(reportResults,filters.outcome)+'</select></label><label>Zeitraum<select name="days">'+[['','Alle Zeiträume'],['1','Letzte 24 Stunden'],['7','Letzte 7 Tage'],['30','Letzte 30 Tage']].map(([k,v])=>'<option value="'+k+'" '+(String(filters.days||'')===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><button type="submit">Filtern</button></form>'+(filters.mission?'<p class="notice">Berichte dieses Einsatzes · <button data-action="reports-open">Alle Berichte anzeigen</button></p>':'')+(!durable?'<p class="notice">'+reportEscape(error||'Hier siehst du die noch gespeicherten Berichte. Das dauerhafte Archiv benötigt die SQL-Erweiterung reports.sql.')+'</p>':'')+'<div class="report-toolbar"><span>'+selected.size+' ausgewählt · '+data.total+' Bericht(e)</span><button data-action="report-archive" '+(!selected.size||!durable||busy?'disabled':'')+'>'+(filters.archived?'Wiederherstellen':'Archivieren')+'</button><button data-action="report-refresh" '+(busy?'disabled':'')+'>Aktualisieren</button></div>'+(error&&durable?'<p role="alert">'+reportEscape(error)+'</p>':'')+'<div id="report-list" aria-busy="'+busy+'">'+reportRows(data.items,state,galaxy,{selectable:durable,selected,opened})+'</div>'+(data.items.length<data.total?'<button data-action="report-more" '+(busy?'disabled':'')+'>Weitere Berichte laden</button>':'')+'</section>';
}
