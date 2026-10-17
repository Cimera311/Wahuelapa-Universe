import {SHIPS,TECHS,RES,LABEL,shipFlightEngine} from './config.js';
import {cargoCapacity,fleetCapacity} from './engine.js';
import {resourceIcon} from './ui-assets.js';
export const fleetEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fleetPicker(state,planet,{fleet={},extra={},prefix='fleet-',categories=['freighter'],availableOnly=false}={}){
 return '<div class="unified-fleet-list">'+Object.entries(SHIPS).filter(([key,s])=>categories.includes(s.category)&&(!availableOnly||(planet.ships[key]||0)+(extra[key]||0)>0)).map(([key,ship])=>{
 const available=(planet.ships[key]||0)+(extra[key]||0),engine=shipFlightEngine(state,key,false);
 return `<div class="fleet-choice"><img src="./assets/${ship.image||key}.webp" alt="" width="64" height="64"><div class="fleet-choice-copy"><strong>${fleetEscape(ship.name)}</strong><small data-engine-label="${key}">${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}${ship.cargo?' · '+cargoCapacity(state,1,key).toLocaleString('de-DE')+' Laderaum':''}</small></div><div class="fleet-choice-count"><button type="button" data-fleet-adjust="-1" aria-label="${ship.name} verringern">−</button><label><input name="${prefix+key}" data-fleet-ship="${key}" type="number" min="0" max="${available}" step="1" value="${fleet[key]||0}" aria-label="Anzahl ${ship.name}"><span aria-label="${available} verfügbar">/ <strong class="available-ships">${available.toLocaleString('de-DE')}</strong></span></label><button type="button" data-fleet-adjust="1" aria-label="${ship.name} erhöhen">+</button><button type="button" data-fleet-adjust="all">Alle</button></div></div>`;
 }).join('')+'</div>';
}
export function cargoControl(name,value=0,label='',allowMax=true){return `<div class="amount-control cargo-control"><input name="${name}" value="${value}" inputmode="numeric" pattern="${allowMax?'[0-9]+|[mM][aA][xX]':'[0-9]+'}" required aria-label="${fleetEscape(label)}"><div class="amount-shortcuts"><button type="button" data-cargo-set="0">0</button><button type="button" data-cargo-percent="5">+5 %</button><button type="button" data-cargo-set="max">MAX</button></div></div>`;}
export function cargoFields(prefix='',values={},allowMax=true){return '<div class="unified-cargo">'+RES.map(k=>`<label>${resourceIcon(k)} ${LABEL[k]}${cargoControl(prefix+k,values[k]??0,LABEL[k],allowMax)}</label>`).join('')+'</div>';}
export function cargoStep(capacity){return Math.max(1,Math.floor(capacity*.05));}
export function clampFleetCount(value,available){return Math.max(0,Math.min(available,Math.floor(Number(value)||0)));}

// Shared hangar cards for the PvE and own-colony order planners.
const fleetHangarNum=n=>Math.floor(n||0).toLocaleString('de-DE');
export function fleetHangarPicker(state,planet,{fleet={},categories=['freighter'],disabled=false,idPrefix='hangar',prefix='fleet-',preserveStale=false,heading='Flotte zusammenstellen',groupLabels={}}={}){
 const ships=Object.entries(SHIPS).filter(([key,ship])=>((planet.ships[key]||0)>0||preserveStale&&Number(fleet[key])>0)&&categories.includes(ship.category));
 const selection=Object.fromEntries(ships.map(([key])=>[key,preserveStale?Math.max(0,Math.floor(Number(fleet[key])||0)):clampFleetCount(fleet[key],planet.ships[key])]).filter(([,n])=>n>0));
 return `<section class="pirate-hangar" aria-label="Flotte zusammenstellen"><div class="pirate-hangar-heading"><div><span class="eyebrow">DEIN HANGAR</span><h3>${fleetEscape(heading)}</h3></div><span class="pirate-hangar-origin">${fleetEscape(planet.name)}</span></div><p class="pirate-hangar-hint">Menge ziehen oder direkt eingeben.</p>${['military','freighter','civil'].map(category=>{
 const group=ships.filter(([,ship])=>ship.category===category);if(!group.length)return '';
 return `<section class="pirate-hangar-group"><h4>${fleetEscape(groupLabels[category]||{military:'Militärflotte',freighter:'Transportflotte',civil:'Sonden & Kolonieschiffe'}[category])}<span>${group.length} ${group.length===1?'Schiffstyp':'Schiffstypen'}</span></h4>${group.map(([key,ship])=>{
  const available=planet.ships[key]||0,count=selection[key]||0,bounded=clampFleetCount(count,available),engine=shipFlightEngine(state,key,false),num=fleetHangarNum;
  return `<article class="pirate-hangar-card ${category}${count?' is-selected':''}" data-hangar-ship="${key}" style="--hangar-fill:${available?bounded/available*100:0}%"><div class="pirate-hangar-identity"><div class="pirate-hangar-art"><img src="./assets/${ship.image||key}.webp" alt="" width="100" height="80" decoding="async"><span class="pirate-hangar-thrust" aria-hidden="true"></span></div><div class="pirate-hangar-copy"><label for="${fleetEscape(idPrefix)}-count-${key}">${fleetEscape(ship.name)}</label><small>${num(available)} verfügbar</small></div><div class="pirate-hangar-number"><input id="${fleetEscape(idPrefix)}-count-${key}" name="${fleetEscape(prefix)}${key}" data-fleet-ship="${key}" type="number" inputmode="numeric" min="0" max="${available}" step="1" value="${count}" aria-label="Anzahl ${fleetEscape(ship.name)}" ${disabled?'disabled':''}><span>ausgewählt</span></div></div><div class="pirate-hangar-controls"><button type="button" data-hangar-count="none" aria-label="Keine ${fleetEscape(ship.name)} auswählen" ${disabled?'disabled':''}>Keine</button><input type="range" min="0" max="${available}" step="1" value="${bounded}" data-hangar-range="${key}" aria-label="${fleetEscape(ship.name)} auswählen" aria-valuetext="${num(bounded)} von ${num(available)}" ${disabled?'disabled':''}><button type="button" data-hangar-count="all" aria-label="Alle ${fleetEscape(ship.name)} auswählen" ${disabled?'disabled':''}>Alle</button></div><details class="pirate-hangar-info"><summary>${ship.category==='freighter'?num(cargoCapacity(state,1,key))+' Laderaum je Schiff':ship.category==='military'?'Kampfschiff · Stufe '+ship.tier:'Zivilschiff'}<span>Details</span></summary><p>${fleetEscape(ship.role)}<br><span data-engine-label="${key}">${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}</span></p></details></article>`;
 }).join('')}</section>`;
 }).join('')||'<p class="pirate-hangar-empty">Keine passenden Schiffe auf dieser Welt verfügbar. Wähle einen anderen Startplaneten oder baue Schiffe in der Werft.</p>'}<div class="pirate-hangar-selection" role="status" aria-live="polite" aria-atomic="true"><div class="pirate-hangar-selection-title"><strong data-hangar-total>${fleetHangarNum(Object.values(selection).reduce((a,n)=>a+n,0))} Schiffe</strong><span><b data-hangar-capacity>${fleetHangarNum(fleetCapacity(state,selection))}</b> Laderaum</span></div><div class="pirate-hangar-manifest" data-hangar-manifest>${fleetHangarManifest(selection)}</div></div></section>`;
}
function fleetHangarManifest(fleet){return Object.entries(fleet).filter(([,n])=>n>0).map(([key,n])=>`<span><img src="./assets/${SHIPS[key].image||key}.webp" alt="" width="32" height="26"><b>${fleetHangarNum(n)}</b> ${fleetEscape(SHIPS[key].name)}</span>`).join('')||'<small>Noch keine Schiffe ausgewählt</small>';}
export function updateFleetHangar(root,state){
 if(!root)return;
 const fleet={};
 for(const card of root.querySelectorAll('[data-hangar-ship]')){
  const input=card.querySelector('[data-fleet-ship]'),range=card.querySelector('[data-hangar-range]'),n=Math.max(0,Math.floor(Number(input.value)||0)),bounded=clampFleetCount(n,Number(input.max));
  input.value=n;range.value=bounded;range.setAttribute('aria-valuetext',fleetHangarNum(bounded)+' von '+fleetHangarNum(Number(input.max)));
  card.classList.toggle('is-selected',n>0);card.style.setProperty('--hangar-fill',(Number(input.max)?bounded/Number(input.max)*100:0)+'%');if(n)fleet[input.dataset.fleetShip]=n;
 }
 const total=root.querySelector('[data-hangar-total]');if(!total)return;
 const n=Object.values(fleet).reduce((a,b)=>a+b,0);total.textContent=fleetHangarNum(n)+(n===1?' Schiff':' Schiffe');
 root.querySelector('[data-hangar-capacity]').textContent=fleetHangarNum(fleetCapacity(state,fleet));
 root.querySelector('[data-hangar-manifest]').innerHTML=fleetHangarManifest(fleet);
}
