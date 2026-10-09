import {resourceIcon,actionIcon} from './ui-assets.js';
import {SHIPS,RES,LABEL} from './config.js';
export const reportEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const reportDate=t=>new Date(t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const reportNumber=n=>Math.floor(n||0).toLocaleString('de-DE');
const reportKinds={battle:'Gefecht',attack:'Angriff',return:'Rückkehr',transport:'Transport',scan:'Erkundung',colony:'Kolonisierung',other:'Sonstiges'};
const reportResults={win:'Sieg',loss:'Niederlage',draw:'Unentschieden',cancelled:'Abgebrochen'};
export function reportPlanetName(id,state,galaxy){
 const owned=state.planets.find(p=>p.id===id);if(owned)return owned.name;
 const known=galaxy?.planets?.find(p=>p.id===id);if(known?.surveyed&&known.name)return known.name;
 const match=/^g-([a-z]+)-p(\d+)$/.exec(id||'');if(match){const system=galaxy?.systems?.find(s=>s.id===match[1]);return (system?.name||match[1][0].toUpperCase()+match[1].slice(1))+' '+match[2];}
 return id||'Unbekannt';
}
function reportFleet(f){return Object.entries(f||{}).filter(([,n])=>n).map(([k,n])=>reportNumber(n)+' × '+(SHIPS[k]?.name||k)).join(' · ')||'Keine';}
function reportCargo(c){return RES.filter(k=>c?.[k]).map(k=>reportNumber(c[k])+' '+LABEL[k]).join(' · ')||'Keine';}
export function fallbackReports(state,pvp){
 const local=state.reports.filter(r=>r.title!=='PvP-Kampfbericht').map(r=>({...r,id:'local:'+r.id,kind:/sonde|entdeck/i.test(r.title)?'scan':/koloni/i.test(r.title)?'colony':/transport|liefer|route|flotte/i.test(r.title)?'transport':'other',archived:false,payload:{}}));
 const battles=(pvp?.reports||[]).map(r=>({id:'attack:'+r.id+':battle',time:r.at,kind:'battle',title:'Gefecht',missionId:r.id,payload:r,outcome:r.outcome==='draw'?'draw':r.outcome==='cancelled'?'cancelled':null,archived:false}));
 return [...local,...battles].sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id));
}
export function reportDetail(r){
 const p=r.payload||{};
 if(r.kind==='battle'){
  if(p.reason)return '<p>'+reportEscape(p.reason)+'</p>';
  const side=p.ownSide||'attacker',before=p[side+'Before']||{},after=p[side+'After']||{},loss=Object.entries(before).reduce((sum,[k,n])=>sum+Math.max(0,n-(after[k]||0)),0);
  return '<div class="report-metrics"><div><small>'+(p.ownSide?'Eigene Verluste':'Verluste Angreifer')+'</small><strong>'+reportNumber(loss)+'</strong></div><div><small>Beute M / K / T</small><strong>'+RES.map(k=>'<span>'+resourceIcon(k)+reportNumber(p.loot?.[k])+'</span>').join(' ')+'</strong></div><div><small>Runden</small><strong>'+(p.rounds?.length||0)+'</strong></div></div><details class="report-rounds"><summary>Flotten & Kampfrunden</summary><p>Angreifer vorher: '+reportEscape(reportFleet(p.attackerBefore))+'</p><p>Angreifer danach: '+reportEscape(reportFleet(p.attackerAfter))+'</p><p>Verteidiger vorher: '+reportEscape(reportFleet(p.defenderBefore))+'</p><p>Verteidiger danach: '+reportEscape(reportFleet(p.defenderAfter))+'</p><p>'+actionIcon('debris')+'Geborgene Trümmer: '+reportEscape(reportCargo(p.salvage))+'</p><p>'+actionIcon('debris')+'Trümmer am Ziel: '+reportEscape(reportCargo(p.debrisLeft))+'</p><ol>'+(p.rounds||[]).map(q=>'<li>Runde '+q.round+': '+q.attacker+' Angreifer / '+q.defender+' Verteidiger</li>').join('')+'</ol></details>';
 }
 return (r.body?'<p>'+reportEscape(r.body)+'</p>':'')+(p.fleet?'<p>Flotte: '+reportEscape(reportFleet(p.fleet))+'</p>':'')+(p.cargo?'<p>Ladung: '+reportEscape(reportCargo(p.cargo))+'</p>':'');
}
export function reportRows(items,state,galaxy,{selectable=false,selected=new Set(),opened=new Set()}={}){
 if(!items.length)return '<p class="muted report-empty">Keine passenden Berichte.</p>';
 let day='';return items.map(r=>{
  const date=new Date(r.time).toLocaleDateString('de-DE'),group=date!==day?'<h3 class="report-day">'+reportEscape(date)+'</h3>':'';day=date;
  const p=r.payload||{},place=p.to?reportPlanetName(p.to,state,galaxy):'',badge=reportResults[r.outcome]||(p.outcome==='attacker'?'Angreifer gewinnt':p.outcome==='defender'?'Verteidiger gewinnt':'');
  return group+'<div class="report-list-row">'+(selectable?'<input type="checkbox" data-report-select="'+reportEscape(r.id)+'" aria-label="Bericht auswählen: '+reportEscape(r.title)+'" '+(selected.has(r.id)?'checked':'')+'>':'')+'<details data-report-id="'+reportEscape(r.id)+'" '+(opened.has(r.id)?'open':'')+'><summary><time datetime="'+new Date(r.time).toISOString()+'">'+reportEscape(reportDate(r.time))+'</time><span class="report-row-copy"><strong>'+reportEscape(r.title||reportKinds[r.kind])+'</strong><small>'+reportEscape([place,p.commander].filter(Boolean).join(' · '))+'</small></span><span class="report-badge '+reportEscape(r.outcome||'')+'">'+reportEscape(badge||reportKinds[r.kind]||'Ereignis')+'</span><span class="report-chevron" aria-hidden="true">⌄</span></summary><div class="report-detail">'+reportDetail(r)+'</div></details></div>';
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
