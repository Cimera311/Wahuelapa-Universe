import {SHIPS,TECHS,RES,LABEL,shipFlightEngine} from './config.js';
import {cargoCapacity} from './engine.js';
import {resourceIcon} from './ui-assets.js';
export const fleetEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fleetPicker(state,planet,{fleet={},extra={},prefix='fleet-',categories=['freighter']}={}){
 return '<div class="unified-fleet-list">'+Object.entries(SHIPS).filter(([,s])=>categories.includes(s.category)).map(([key,ship])=>{
 const available=(planet.ships[key]||0)+(extra[key]||0),engine=shipFlightEngine(state,key,false);
 return `<div class="fleet-choice"><img src="./assets/${ship.image||key}.webp" alt="" width="64" height="64"><div class="fleet-choice-copy"><strong>${fleetEscape(ship.name)}</strong><small data-engine-label="${key}">${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}${ship.cargo?' · '+cargoCapacity(state,1,key).toLocaleString('de-DE')+' Laderaum':''}</small></div><div class="fleet-choice-count"><button type="button" data-fleet-adjust="-1" aria-label="${ship.name} verringern">−</button><label><input name="${prefix+key}" data-fleet-ship="${key}" type="number" min="0" max="${available}" step="1" value="${fleet[key]||0}" aria-label="Anzahl ${ship.name}"><span aria-label="${available} verfügbar">/ <strong class="available-ships">${available.toLocaleString('de-DE')}</strong></span></label><button type="button" data-fleet-adjust="1" aria-label="${ship.name} erhöhen">+</button><button type="button" data-fleet-adjust="all">Alle</button></div></div>`;
 }).join('')+'</div>';
}
export function cargoControl(name,value=0,label='',allowMax=true){return `<div class="amount-control cargo-control"><input name="${name}" value="${value}" inputmode="numeric" pattern="${allowMax?'[0-9]+|[mM][aA][xX]':'[0-9]+'}" required aria-label="${fleetEscape(label)}"><div class="amount-shortcuts"><button type="button" data-cargo-set="0">0</button><button type="button" data-cargo-percent="5">+5 %</button><button type="button" data-cargo-set="max">MAX</button></div></div>`;}
export function cargoFields(prefix='',values={},allowMax=true){return '<div class="unified-cargo">'+RES.map(k=>`<label>${resourceIcon(k)} ${LABEL[k]}${cargoControl(prefix+k,values[k]??0,LABEL[k],allowMax)}</label>`).join('')+'</div>';}
export function cargoStep(capacity){return Math.max(1,Math.floor(capacity*.05));}
export function clampFleetCount(value,available){return Math.max(0,Math.min(available,Math.floor(Number(value)||0)));}
