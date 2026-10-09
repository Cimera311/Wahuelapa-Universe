import {SHIPS,RES} from './config.js';
import {COMBAT,attackFlight,combatStats} from './combat.js';
import {attackCard} from './flight-ui.js';
import {fallbackReports,reportRows} from './reports-ui.js';
const pvpEscape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pvpDuration=n=>{n=Math.max(0,Math.ceil(n/1000));return Math.floor(n/60)+' Min '+n%60+' Sek';};
export function pvpSettings(pvp,busy=false,pending=false){
 if(!pvp)return '';
 return '<section class="panel"><h3>PvP '+(pvp.enabled?'aktiv':'pausiert')+'</h3><p>Eine Pause verhindert neue Angriffe. Laufende Kämpfe und Rückflüge werden weiter verarbeitet.</p>'+
 (pvp.isAdmin?'<button type="button" role="switch" aria-checked="'+pvp.enabled+'" data-action="pvp-toggle" '+(busy?'disabled':'')+'>'+(pvp.enabled?'PvP ausschalten':'PvP einschalten')+'</button>':'<p class="fine">Der PvP-Schalter ist nur für Administratoren verfügbar.</p>')+
 (pending?'<button type="button" data-action="pvp-retry">Offenen Auftrag erneut prüfen</button>':'')+'</section>';
}
export function pvpView(state,pvp,galaxy,busy=false,draft={},view={}){
 if(!pvp)return '<section class="panel"><h2>PvP vorbereiten</h2><p>Das Kampfsystem benötigt die Server-Erweiterung. Nach der Installation findest du hier Angriffe, Warnungen und Berichte.</p></section>';
 const p=state.planets.find(p=>p.id===state.active),targets=(galaxy?.planets||[]).filter(p=>p.owner==='foreign'&&!p.reserved),now=view.now??pvp.serverNow;
 const protection=id=>pvp.colonies.find(p=>p.id===id)?.protectedUntil||0;
 const label=t=>'['+t.system+':'+t.slot+'] '+(t.surveyed?t.name:'Unbekannt')+' · '+t.commander;
 const incoming=pvp.incoming.map(m=>'<article class="notice"><strong>Angriff von '+pvpEscape(m.commander)+'</strong><p>Ziel '+pvpEscape(m.to)+' · Ankunft in <span data-due="'+m.arrival+'">'+pvpDuration(m.arrival-now)+'</span></p><p>Du kannst bis zur Ankunft Flotten verlegen, Ressourcen transportieren und Verteidigung fertigstellen.</p></article>').join('');
 const choices=Object.entries(SHIPS).filter(([,s])=>['military','freighter'].includes(s.category));
 const hasColony=state.planets.some(q=>q.system&&(galaxy?.planets||[]).some(t=>t.id===q.id&&t.owner==='mine'&&!t.reserved));
 const canStart=!!p.system||(hasColony&&pvp.homeAttacks===true);
 const unavailable=!galaxy?'Angriffsziele werden geladen …':!p.system&&hasColony&&!pvp.homeAttacks?'Angriffe aus dem Heimatsystem benötigen noch das Spielserver-Update.':!canStart?'Für Angriffe aus dem Heimatsystem benötigst du mindestens eine eigene besiedelte Galaxiekolonie.':'Es gibt derzeit keine fremden besiedelten Galaxiekolonien als Angriffsziele.';
 const form=targets.length&&canStart?'<form id="pvp-attack-form"><label>Zielkolonie<select name="to">'+targets.map(t=>'<option value="'+t.id+'" '+(t.id===draft.to?'selected':'')+'>'+pvpEscape(label(t))+(protection(t.id)>now?' · Gründungsschutz':'')+'</option>').join('')+'</select></label><div class="pvp-manifest">'+choices.map(([k,s])=>'<label>'+pvpEscape(s.name)+' · verfügbar '+p.ships[k]+'<input name="'+k+'" type="number" min="0" max="'+Math.min(100,p.ships[k])+'" value="'+(draft[k]||0)+'" step="1"></label>').join('')+'</div><p id="pvp-estimate" class="fine">Flotte wählen: Das langsamste Schiff bestimmt die Flugzeit.</p><p class="fine">'+(p.system?'Mit einem Angriff endet der Gründungsschutz deiner Startkolonie.':'Start aus dem geschützten Heimatsystem: Nur Schiffe mit Galaxieantrieb können mitfliegen. Die Entfernung wird von deinem persönlichen Startplatz gemessen. Dein Angriff beendet den Gründungsschutz deiner Galaxiekolonien.')+' Maximal 25 % der plünderbaren Vorräte; innerhalb von 24 Stunden gilt zusätzlich ein gemeinsames Beutebudget je Zielkolonie.</p><button '+(!pvp.enabled||busy?'disabled':'')+'>Angriff losschicken</button></form>':'<p>'+unavailable+'</p>';
 const outgoing=pvp.outgoing.map(m=>attackCard(m,state,pvp,galaxy,now,view.reports||[],view.opened||new Set())).join('')||'<p class="muted">Keine Angriffsflotte unterwegs.</p>';
 const number=(v=0)=>Math.floor(v).toLocaleString('de-DE');
 const reports=reportRows(fallbackReports(state,pvp).filter(r=>r.kind==='battle').slice(0,5),state,galaxy,{opened:view.opened||new Set()})+'<button data-action="reports-open">Berichtsübersicht öffnen →</button>';
 const stats=Object.keys(COMBAT).filter(k=>['military','defense'].includes(SHIPS[k].category)).map(k=>{const c=combatStats(k,state.tech);return '<tr><td>'+pvpEscape(SHIPS[k].name)+'</td><td>'+number(c.hp)+'</td><td>'+number(c.shield)+'</td><td>'+number(c.attack)+'</td></tr>';}).join('');
 return '<div class="page-heading"><span class="eyebrow">GEMEINSAME KOLONIEN</span><h1>PvP & Verteidigung</h1><p>'+(pvp.protectionMs===3600000?'1 Stunde':'24 Stunden')+' Gründungsschutz. Heimat-Welten bleiben sicher.'+(pvp.homeAttacks?' Mit eigener Galaxiekolonie können sie als Angriffsbasis dienen.':'')+' Kämpfe werden zum Ankunftszeitpunkt nachgeholt.</p></div>'+incoming+'<section class="panel"><h2>'+(!pvp.enabled?'PvP pausiert':'Angriff planen')+'</h2>'+form+'</section><section class="attack-deck"><h2>Deine Angriffsflotte</h2>'+outgoing+'</section><section><h2>Kampfberichte</h2>'+reports+'</section><section class="panel"><h2>Kampfwerte mit deiner Forschung</h2><div class="pvp-table"><table><thead><tr><th>Einheit</th><th>Hülle</th><th>Schild</th><th>Schaden/Runde</th></tr></thead><tbody>'+stats+'</tbody></table></div><p>Maximal sechs Runden. Gleichzeitiger Beschuss; Boni gelten je Zielklasse. Schilde laden nach einem Kampf innerhalb von fünf Minuten nach.</p><p>Orbitales Reparaturmaterial M/K: '+number(p.defenseSalvage?.metal)+' / '+number(p.defenseSalvage?.crystal)+'.</p><p>Beschädigte Einheiten auf dieser Welt können für 30 % ihrer Baukosten in Metall/Kristall, anteilig zum Hüllenschaden, repariert werden.</p><button data-action="pvp-repair" '+(busy||!Object.values(p.hulls||{}).some(a=>a.length)?'disabled':'')+'>Einheiten reparieren</button></section>';
}
export function pvpEstimate(state,galaxy,to,fleet){
 const target=galaxy?.planets.find(p=>p.id===to),system=galaxy?.systems.find(s=>s.id===target?.system);
 if(!target||!system)throw Error('Ziel fehlt.');
 const f=attackFlight(state,state.planets.find(p=>p.id===state.active),{...system,system:target.system,slot:target.slot},fleet);
 return pvpDuration(f.ms)+' je Strecke · '+f.fuel+' Treibstoff insgesamt · langsamstes Schiff: '+SHIPS[f.slowest].name;
}
