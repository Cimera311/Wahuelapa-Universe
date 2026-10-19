import {SHIPS} from './config.js';
import {combatConfigForRealmId} from './realm-config.js';

// Read the same Test4 values that the v6/v7 battle engines use. Never duplicate
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
 const active=[6,7].includes(engineVersion);
 const legacy=engineVersion!=null&&!active;
 const subtitle=active?'v'+engineVersion+' aktiv':legacy?'Nur bei v6 / v7':'Kampfengine v6 / v7';
 const chips=entries.map(({name,chance})=>`<span class="ship-rapid-fire-target"><span>${escapeHTML(name)}</span><strong>${percent(chance)} %</strong></span>`).join('');
 const description=!['military','defense'].includes(sh.category)
  ?'<p class="fine">Keine Rapid-Fire-Funktion für diesen Schiffstyp.</p>'
  :!entries.length
   ?'<p class="fine">Keine Rapid-Fire-Ziele konfiguriert.</p>'
   :`<div class="ship-rapid-fire-targets">${chips}</div><p class="fine">Chance auf eine weitere vollständige Salve gegen das jeweilige Ziel, nach jeder Zusatzsalve erneut geprüft. Maximal ${combat.maxExtraSalvos} Zusatzsalven pro Einheit und Kampfrunde.${sh.category==='defense'?(combat.allowInOrbitalOpening?' Rapid Fire gilt auch beim orbitalen Erstschlag (Runde 0).':' Kein Rapid Fire beim orbitalen Erstschlag.') :''}</p>`;
 return `<section class="ship-rapid-fire" aria-label="Rapid Fire"><div class="ship-rapid-fire-heading"><strong>⚡ Rapid Fire</strong><small>${subtitle}</small></div>${description}${engineVersion===7&&entries.length?'<p class="fine">v7: Normale Schüsse bleiben bis zur Zerstörung am Ziel. Jeder normale Schuss kann Rapid Fire auslösen; Zusatzsalven bleiben auf demselben Ziel, auch bei Überschaden. Erst der nächste normale Schuss wählt nach einer Zerstörung neu. Keine Bevorzugung von Rapid-Fire-Zielen.</p>':''}${legacy?`<p class="fine ship-rapid-fire-inactive">Aktuell gilt v${engineVersion} ohne Rapid Fire. Die Werte gelten bei Aktivierung von v6 oder v7.</p>`:''}</section>`;
}
