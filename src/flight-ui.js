import {SHIPS,planetImagePath} from './config.js';
import {reportEscape,reportPlanetName,reportRows} from './reports-ui.js';
export function attackProgress(m,now){
 const leg=Math.max(1,m.returnAt-m.arrival),returning=m.status==='returning',start=returning?m.arrival:m.arrival-leg,end=returning?m.returnAt:m.arrival;
 const percent=Math.min(100,Math.max(0,100*(now-start)/leg));return {percent,start,end,leg,returning};
}
function flightClock(t){const seconds=Math.max(0,Math.ceil(t/1000));return (seconds>=3600?Math.floor(seconds/3600)+' Std ':'')+Math.floor(seconds%3600/60)+' Min '+seconds%60+' Sek';}
function flightPlanet(id,state,galaxy){
 const p=state.planets.find(p=>p.id===id)||galaxy?.planets?.find(p=>p.id===id&&p.surveyed);
 return p?'<img src="'+planetImagePath(p)+'" alt="" width="120" height="120" decoding="async">':'<span class="flight-unknown" aria-label="Planet noch nicht untersucht">?</span>';
}
export function attackDistance(m,state,galaxy){
 const from=state.planets.find(p=>p.id===m.from),target=galaxy?.planets?.find(p=>p.id===m.to),system=galaxy?.systems?.find(s=>s.id===target?.system),origin=from?.system?from:state.galaxy||galaxy?.start;
 if(!origin||!target||!system)return null;
 return Math.max(1,Math.hypot(origin.x-system.x,origin.y-system.y)/40+Math.abs((from.system?from.slot:0)-target.slot)*.15);
}
export function missionReports(m,pvp,cached=[]){
 const start=m.arrival-(m.returnAt-m.arrival),r=pvp.reports.find(r=>r.id===m.id);
 const fallback=[{id:'attack:'+m.id+':start',missionId:m.id,time:start,kind:'attack',title:'Angriff gestartet',payload:{from:m.from,to:m.to,fleet:m.fleet}}];
 if(r)fallback.push({id:'attack:'+m.id+':battle',missionId:m.id,time:r.at,kind:'battle',title:'Gefecht',payload:r});
 const map=new Map(fallback.map(r=>[r.id,r]));for(const r of cached)if(r.missionId===m.id)map.set(r.id,r);
 return [...map.values()].sort((a,b)=>b.time-a.time);
}
export function attackCard(m,state,pvp,galaxy,now=pvp.serverNow,cached=[],opened=new Set()){
 const f=attackProgress(m,now),distance=attackDistance(m,state,galaxy),fleet=Object.entries(m.fleet||{}).filter(([,n])=>n),primary=fleet.find(([k])=>SHIPS[k]?.category==='military')||fleet[0],name=reportPlanetName(m.to,state,galaxy),reports=missionReports(m,pvp,cached);
 return '<article class="attack-card panel '+(f.returning?'returning':'')+'" data-flight-card="'+reportEscape(m.id)+'"><div class="attack-heading"><h3>'+reportEscape((f.returning?'Rückflug von ':'Angriff auf ')+name)+'</h3><span class="flight-status">'+(f.returning?'← Rückflug':'Hinflug →')+'</span></div><div class="attack-journey"><div class="attack-world">'+flightPlanet(m.from,state,galaxy)+'<strong>'+reportEscape(reportPlanetName(m.from,state,galaxy))+'</strong><small>Startbasis</small></div><div class="attack-center"><div class="attack-track" role="progressbar" aria-label="Fortschritt '+(f.returning?'Rückflug':'Hinflug')+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(f.percent)+'" data-flight-start="'+f.start+'" data-flight-end="'+f.end+'"><i style="width:'+f.percent+'%"></i>'+(primary?'<img class="attack-ship" src="./assets/'+(SHIPS[primary[0]]?.image||primary[0])+'.webp" alt="'+reportEscape(SHIPS[primary[0]]?.name||primary[0])+'" style="left:'+(f.returning?100-f.percent:f.percent)+'%">':'')+'</div><strong class="attack-countdown" data-due="'+f.end+'">'+flightClock(f.end-now)+'</strong><small>'+(f.returning?'bis zur Heimkehr':'bis zur Ankunft')+'</small></div><div class="attack-world">'+flightPlanet(m.to,state,galaxy)+'<strong>'+reportEscape(name)+'</strong><small>'+(f.returning?'Abflugplanet':'Zielkolonie')+'</small></div></div><div class="attack-manifest">'+fleet.map(([k,n])=>'<span><img src="./assets/'+(SHIPS[k]?.image||k)+'.webp" alt="" width="48" height="48"><strong>'+n+' × '+reportEscape(SHIPS[k]?.name||k)+'</strong></span>').join('')+'</div><div class="attack-metrics"><div><small>Entfernung</small><strong>'+(distance===null?'Wird geladen …':distance.toLocaleString('de-DE',{maximumFractionDigits:1})+' AE')+'</strong></div><div><small>'+(f.returning?'Rückflug gesamt':'Hinflug gesamt')+'</small><strong>'+flightClock(f.leg)+'</strong></div><div><small>Unterwegs</small><strong data-flight-percent="'+reportEscape(m.id)+'">'+Math.round(f.percent)+' %</strong></div></div><div class="attack-phases"><span class="done">'+(f.returning?'✓':'●')+' Hinflug</span><span class="'+(f.returning?'done':'')+'">'+(f.returning?'✓':'○')+' Gefecht</span><span class="'+(f.returning?'done':'')+'">'+(f.returning?'●':'○')+' Rückflug</span></div>'+(!f.returning?'<p class="fine">Geplante Heimkehr in <span data-due="'+m.returnAt+'">'+flightClock(m.returnAt-now)+'</span></p>':'')+'<details class="mission-report-accordion" data-ui-key="mission:'+reportEscape(m.id)+'" '+(opened.has('mission:'+m.id)?'open':'')+'><summary>Berichte zu diesem Einsatz · '+reports.length+'</summary>'+reportRows(reports,state,galaxy,{opened})+'<button data-action="reports-open" data-mission="'+reportEscape(m.id)+'">Alle Einsatzberichte öffnen →</button></details></article>';
}
