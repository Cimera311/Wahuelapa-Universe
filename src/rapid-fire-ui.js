import {SHIPS} from './config.js';
import {combatConfigForRealmId} from './realm-config.js';

// Read the same Test4 values that the v6 battle engine uses. Never duplicate
// Rapid Fire percentages in the UI, so balance changes are reflected here.
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=value=>Number((value*100).toFixed(1)).toLocaleString('de-DE');

export function rapidFireTargets(key,combat=combatConfigForRealmId('test4').rapidFire){
 if(!combat.enabled)return [];
 return Object.entries(combat.chances[key]||{})
  .filter(([target,chance])=>SHIPS[target]&&Number.isFinite(chance)&&chance>0)
  .map(([target,chance])=>({key:target,name:SHIPS[target].name,chance}));
}

export function rapidFireInfoHTML(key,engineVersion=null){
 const sh=SHIPS[key];
 if(!sh)return '';
 const combat=combatConfigForRealmId('test4').rapidFire;
 const entries=rapidFireTargets(key,combat);
 const active=engineVersion===6;
 const legacy=engineVersion!=null&&engineVersion!==6;
 const subtitle=active?'v6 aktiv':legacy?'Nur bei v6':'Kampfengine v6';
 const chips=entries.map(({name,chance})=>`<span class="ship-rapid-fire-target"><span>${escapeHTML(name)}</span><strong>${percent(chance)} %</strong></span>`).join('');
 const description=!['military','defense'].includes(sh.category)
  ?'<p class="fine">Keine Rapid-Fire-Funktion für diesen Schiffstyp.</p>'
  :!entries.length
   ?'<p class="fine">Keine Rapid-Fire-Ziele konfiguriert.</p>'
   :`<div class="ship-rapid-fire-targets">${chips}</div><p class="fine">Chance auf eine weitere vollständige Salve gegen das jeweilige Ziel, nach jeder Zusatzsalve erneut geprüft. Maximal ${combat.maxExtraSalvos} Zusatzsalven pro Kampfrunde.${sh.category==='defense'?(combat.allowInOrbitalOpening?' Rapid Fire gilt auch beim orbitalen Erstschlag (Runde 0).':' Kein Rapid Fire beim orbitalen Erstschlag.') :''}</p>`;
 return `<section class="ship-rapid-fire" aria-label="Rapid Fire"><div class="ship-rapid-fire-heading"><strong>⚡ Rapid Fire</strong><small>${subtitle}</small></div>${description}${legacy?'<p class="fine ship-rapid-fire-inactive">Aktuell gilt v5 ohne Rapid Fire. Die Werte gelten bei Aktivierung von v6.</p>':''}</section>`;
}
