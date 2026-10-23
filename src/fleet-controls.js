import {unitArtPath} from './ui-assets.js';
import {SHIPS,TECHS,RES,LABEL,shipFlightEngine} from './config.js';
import {cargoCapacity,fleetCapacity} from './engine.js';
import {resourceIcon} from './ui-assets.js';
import {combatStats} from './combat.js';
export const fleetEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fleetPicker(state,planet,{fleet={},extra={},prefix='fleet-',categories=['freighter'],availableOnly=false}={}){
 return '<div class="unified-fleet-list">'+Object.entries(SHIPS).filter(([key,s])=>categories.includes(s.category)&&(!availableOnly||(planet.ships[key]||0)+(extra[key]||0)>0)).map(([key,ship])=>{
 const available=(planet.ships[key]||0)+(extra[key]||0),engine=shipFlightEngine(state,key,false);
 return `<div class="fleet-choice"><img src="${unitArtPath(key)}" alt="" width="64" height="64"><div class="fleet-choice-copy"><strong>${fleetEscape(ship.name)}</strong><small data-engine-label="${key}">${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}${ship.cargo?' · '+cargoCapacity(state,1,key).toLocaleString('de-DE')+' Laderaum':''}</small></div><div class="fleet-choice-count"><button type="button" data-fleet-adjust="-1" aria-label="${ship.name} verringern">−</button><label><input name="${prefix+key}" data-fleet-ship="${key}" type="number" min="0" max="${available}" step="1" value="${fleet[key]||0}" aria-label="Anzahl ${ship.name}"><span aria-label="${available} verfügbar">/ <strong class="available-ships">${available.toLocaleString('de-DE')}</strong></span></label><button type="button" data-fleet-adjust="1" aria-label="${ship.name} erhöhen">+</button><button type="button" data-fleet-adjust="all">Alle</button></div></div>`;
 }).join('')+'</div>';
}
export function cargoControl(name,value=0,label='',allowMax=true){return `<div class="amount-control cargo-control"><input name="${name}" value="${fleetEscape(value)}" data-cargo-number inputmode="numeric" pattern="${allowMax?'[0-9]+|[mM][aA][xX]':'[0-9]+'}" required aria-label="${fleetEscape(label)}"><span class="cargo-range-wrap pirate-hangar-controls"><input type="range" data-cargo-range min="0" max="0" value="0" step="1" aria-label="${fleetEscape(label)} laden"></span><div class="amount-shortcuts"><button type="button" data-cargo-set="0">0</button><button type="button" data-cargo-percent="5">+5 %</button><button type="button" data-cargo-set="max">MAX</button></div><small data-cargo-availability></small></div>`;}
export function cargoFields(prefix='',values={},allowMax=true){return '<div class="unified-cargo cargo-hangar">'+RES.map(k=>`<label class="cargo-resource-card" data-cargo-resource="${k}"><span class="cargo-resource-heading">${resourceIcon(k)}<strong>${LABEL[k]}</strong></span>${cargoControl(prefix+k,values[k]??0,LABEL[k],allowMax)}</label>`).join('')+'<div class="cargo-hold" aria-live="polite"><div class="cargo-hold-heading"><strong>Frachtraum</strong><span data-cargo-total></span></div><div class="cargo-hold-bar" aria-hidden="true">'+RES.map(k=>`<i data-cargo-segment="${k}"></i>`).join('')+'</div><small data-cargo-note></small></div></div>';}
// Numeric wishes are never clamped: only the slider and the loadable preview are bounded.
export function updateCargoHangar(group,{capacity=0,stock=null,blocked=false,future=false,unknownLabel='Bestand am Ziel unbekannt'}={}){
 const cap=Math.max(0,Math.floor(capacity)),cards=[...group.querySelectorAll('[data-cargo-resource]')],amounts={},requested={};let room=cap,wanted=0,invalid=false;
 for(const card of cards){const k=card.dataset.cargoResource,raw=card.querySelector('[data-cargo-number]').value,isMax=raw.toLowerCase()==='max',n=Number(raw),valid=isMax||raw.trim()!==''&&Number.isSafeInteger(n)&&n>=0&&n<=1e12;invalid||=!valid;requested[k]=isMax?'max':valid?n:0;const available=stock?Math.max(0,Math.floor(stock[k]||0)):cap;amounts[k]=Math.min(room,available,isMax?room:requested[k]);room-=amounts[k];wanted+=isMax?amounts[k]:requested[k];}
 for(const card of cards){const k=card.dataset.cargoResource,input=card.querySelector('[data-cargo-number]'),range=card.querySelector('[data-cargo-range]'),available=stock?Math.max(0,Math.floor(stock[k]||0)):cap,other=cards.reduce((n,c)=>n+(c===card?0:requested[c.dataset.cargoResource]==='max'?amounts[c.dataset.cargoResource]:requested[c.dataset.cargoResource]),0),limit=Math.min(available,Math.max(0,cap-other)),selected=requested[k]==='max'?amounts[k]:requested[k];
 range.max=limit;range.value=Math.min(limit,selected);range.disabled=blocked||limit===0;range.setAttribute('aria-valuetext',`${Math.floor(selected).toLocaleString('de-DE')} gewünscht, bis ${limit.toLocaleString('de-DE')} aktuell wählbar`);input.disabled=blocked;card.querySelectorAll('button').forEach(b=>b.disabled=blocked);card.style.setProperty('--hangar-fill',(limit?Math.min(selected,limit)/limit*100:0)+'%');card.classList.toggle('is-selected',selected>0);card.classList.toggle('is-planned',requested[k]!=='max'&&selected>amounts[k]);card.querySelector('[data-cargo-availability]').textContent=(stock?available.toLocaleString('de-DE')+' verfügbar':unknownLabel)+' · '+(requested[k]==='max'?'MAX dynamisch':selected.toLocaleString('de-DE')+' gewünscht')+(selected>amounts[k]?' · '+(selected-amounts[k]).toLocaleString('de-DE')+' aktuell nicht ladbar':'');
 group.querySelector(`[data-cargo-segment="${k}"]`).style.width=(cap?amounts[k]/cap*100:0)+'%';}
 group.querySelector('[data-cargo-total]').textContent=(cap-room).toLocaleString('de-DE')+' / '+cap.toLocaleString('de-DE');group.querySelector('[data-cargo-note]').textContent=invalid?'Bitte ganze Mengen bis 1 Billion oder MAX eingeben.':(wanted>cap?'Gewünscht: '+wanted.toLocaleString('de-DE')+' · '+(wanted-cap).toLocaleString('de-DE')+' über dem Laderaum. ':'')+(future?'Vorschau · Beladung wird bei Ankunft berechnet. ':'Aktuell ladbare Vorschau · ')+room.toLocaleString('de-DE')+' Laderaum frei.';
}
export function cargoStep(capacity){return Math.max(1,Math.floor(capacity*.05));}
export function clampFleetCount(value,available){return Math.max(0,Math.min(available,Math.floor(Number(value)||0)));}

// Shared hangar cards for the PvE and own-colony order planners.
const fleetHangarNum=n=>Math.floor(n||0).toLocaleString('de-DE');
export function fleetHangarPicker(state,planet,{fleet={},extra={},maxCounts={},categories=['freighter'],disabled=false,idPrefix='hangar',prefix='fleet-',preserveStale=false,heading='Flotte zusammenstellen',groupLabels={}}={}){
 const ships=Object.entries(SHIPS).filter(([key,ship])=>((planet.ships[key]||0)+(extra[key]||0)>0||preserveStale&&Number(fleet[key])>0)&&categories.includes(ship.category));
 const selection=Object.fromEntries(ships.map(([key])=>[key,preserveStale?Math.max(0,Math.floor(Number(fleet[key])||0)):clampFleetCount(fleet[key],(planet.ships[key]||0)+(extra[key]||0))]).filter(([,n])=>n>0));
 return `<section class="pirate-hangar" aria-label="Flotte zusammenstellen"><div class="pirate-hangar-heading"><div><span class="eyebrow">DEIN HANGAR</span><h3>${fleetEscape(heading)}</h3></div><span class="pirate-hangar-origin">${fleetEscape(planet.name)}</span></div><p class="pirate-hangar-hint">Menge ziehen oder direkt eingeben.</p>${['military','freighter','civil'].map(category=>{
 const group=ships.filter(([,ship])=>ship.category===category);if(!group.length)return '';
 return `<section class="pirate-hangar-group"><h4>${fleetEscape(groupLabels[category]||{military:'Militärflotte',freighter:'Transportflotte',civil:'Sonden & Kolonieschiffe'}[category])}<span>${group.length} ${group.length===1?'Schiffstyp':'Schiffstypen'}</span></h4>${group.map(([key,ship])=>{
  const free=planet.ships[key]||0,bound=extra[key]||0,available=free+bound,limit=Math.max(available,maxCounts[key]||0),count=selection[key]||0,bounded=clampFleetCount(count,limit),engine=shipFlightEngine(state,key,false),num=fleetHangarNum;
  return `<article class="pirate-hangar-card ${category}${count?' is-selected':''}" data-hangar-ship="${key}" style="--hangar-fill:${limit?bounded/limit*100:0}%"><div class="pirate-hangar-identity"><div class="pirate-hangar-art"><img src="${unitArtPath(key)}" alt="" width="100" height="80" decoding="async"><span class="pirate-hangar-thrust" aria-hidden="true"></span></div><div class="pirate-hangar-copy"><label for="${fleetEscape(idPrefix)}-count-${key}">${fleetEscape(ship.name)}</label><small>${bound?num(free)+' frei · '+num(bound)+' auf Route':num(available)+' verfügbar'}${limit>available?' · '+num(limit)+' vorgemerkt':''}</small></div><div class="pirate-hangar-number"><input id="${fleetEscape(idPrefix)}-count-${key}" name="${fleetEscape(prefix)}${key}" data-fleet-ship="${key}" type="number" inputmode="numeric" min="0" max="${limit}" step="1" value="${count}" aria-label="Anzahl ${fleetEscape(ship.name)}" ${disabled?'disabled':''}><span>ausgewählt</span></div></div><div class="pirate-hangar-controls"><button type="button" data-hangar-count="none" aria-label="Keine ${fleetEscape(ship.name)} auswählen" ${disabled?'disabled':''}>Keine</button><input type="range" min="0" max="${limit}" step="1" value="${bounded}" data-hangar-range="${key}" aria-label="${fleetEscape(ship.name)} auswählen" aria-valuetext="${num(bounded)} von ${num(available)}" ${disabled?'disabled':''}><button type="button" data-hangar-count="all" data-hangar-available="${available}" aria-label="Alle ${fleetEscape(ship.name)} auswählen" ${disabled?'disabled':''}>Alle</button></div><details class="pirate-hangar-info"><summary>${ship.category==='freighter'?num(cargoCapacity(state,1,key))+' Laderaum je Schiff':ship.category==='military'?'Kampfschiff · Stufe '+ship.tier:'Zivilschiff'}<span>Details</span></summary><p>${fleetEscape(ship.role)}<br><span data-engine-label="${key}">${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}</span></p></details></article>`;
 }).join('')}</section>`;
 }).join('')||'<p class="pirate-hangar-empty">Keine passenden Schiffe auf dieser Welt verfügbar. Wähle einen anderen Startplaneten oder baue Schiffe in der Werft.</p>'}<div class="pirate-hangar-selection" role="status" aria-live="polite" aria-atomic="true"><div class="pirate-hangar-selection-title"><strong data-hangar-total>${fleetHangarNum(Object.values(selection).reduce((a,n)=>a+n,0))} Schiffe</strong><span><b data-hangar-capacity>${fleetHangarNum(fleetCapacity(state,selection))}</b> Laderaum</span></div><div class="pirate-hangar-manifest" data-hangar-manifest>${fleetHangarManifest(selection)}</div></div></section>`;
}
function fleetHangarManifest(fleet){return Object.entries(fleet).filter(([,n])=>n>0).map(([key,n])=>`<span><img src="${unitArtPath(key)}" alt="" width="32" height="26"><b>${fleetHangarNum(n)}</b> ${fleetEscape(SHIPS[key].name)}</span>`).join('')||'<small>Noch keine Schiffe ausgewählt</small>';}
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


/** PvP picker reuses the real hangar card / controls, with a compact PvP skin. */
export function pvpCompactHangarPicker(state,planet,{fleet={},disabled=false,opened=new Set()}={}){
 const fmt=fleetHangarNum;
 const groups=[['military','ANGRIFFSFLOTTE'],['freighter','BEUTEFRACHTER']];
 const rendered=groups.map(([category,label])=>{
  const entries=Object.entries(SHIPS).filter(([key,sh])=>sh.category===category&&((planet.ships[key]||0)>0||Number(fleet[key])>0));
  if(!entries.length)return '';
  return `<section class="pvp-compact-group"><h4>${label}<span>${entries.length} Schiffstypen</span></h4>${entries.map(([key,sh])=>{
   const available=planet.ships[key]||0,count=Math.max(0,Math.floor(Number(fleet[key])||0)),bounded=clampFleetCount(count,available);
   const engine=shipFlightEngine(state,key,false),stats=combatStats(key,state.tech);
   const cargo=fmt(cargoCapacity(state,1,key));
   return `<article class="pirate-hangar-card pvp-hangar-card ${category}${count?' is-selected':''}" data-hangar-ship="${key}" style="--hangar-fill:${available?100*bounded/available:0}%">
     <div class="pirate-hangar-identity">
       <div class="pirate-hangar-art"><img src="${unitArtPath(key)}" alt="" width="100" height="80" decoding="async"><span class="pirate-hangar-thrust" aria-hidden="true"></span></div>
       <div class="pirate-hangar-copy"><label for="pvp-compact-${key}">${fleetEscape(sh.name)}</label><small>${fmt(available)} verfügbar</small></div>
       <div class="pirate-hangar-number"><input id="pvp-compact-${key}" name="${key}" data-fleet-ship="${key}" type="number" min="0" max="${available}" step="1" value="${count}" inputmode="numeric" aria-label="Anzahl ${fleetEscape(sh.name)}" ${disabled?'disabled':''}></div>
     </div>
     <div class="pirate-hangar-controls">
       <button type="button" data-hangar-count="none" aria-label="Keine ${fleetEscape(sh.name)}" ${disabled?'disabled':''}>Keine</button>
       <input type="range" data-hangar-range="${key}" min="0" max="${available}" value="${bounded}" step="1" aria-label="${fleetEscape(sh.name)} auswählen" ${disabled?'disabled':''}>
       <button type="button" data-hangar-count="all" data-hangar-available="${available}" aria-label="Alle ${fleetEscape(sh.name)}" ${disabled?'disabled':''}>Alle</button>
     </div>
     <details class="pirate-hangar-info pvp-compact-details" data-pvp-ship-details="${key}" data-ui-key="pvp-ship:${key}" ${opened.has('pvp-ship:'+key)?'open':''}>
       <summary><span>Details</span></summary>
       <p>${fleetEscape(sh.role||'')}<br>Kampfschiff-Stufe ${sh.tier||'—'} · ${category==='freighter'?cargo+' Laderaum / Schiff · ':''}Angriff ${fmt(stats.attack)} · Schild ${fmt(stats.shield)} · Hülle ${fmt(stats.hp)}<br>${fleetEscape(TECHS[engine].name)} ${state.tech[engine]||0}</p>
     </details>
    </article>`;
  }).join('')}</section>`;
 }).join('');
 return `<section class="pirate-hangar pvp-compact-hangar"><div class="pirate-hangar-heading"><div><span class="eyebrow">DEIN HANGAR</span><h3>Flotte zusammenstellen</h3></div><span class="pirate-hangar-origin">${fleetEscape(planet.name)}</span></div><div class="pvp-compact-grid">${rendered}</div><div class="pirate-hangar-selection" role="status"><div class="pirate-hangar-selection-title"><strong data-hangar-total>${fmt(Object.values(fleet).reduce((n,v)=>n+Math.max(0,Number(v)||0),0))} Schiffe</strong><span><b data-hangar-capacity>${fmt(fleetCapacity(state,fleet))}</b> Laderaum</span></div><div class="pirate-hangar-manifest" data-hangar-manifest>${fleetHangarManifest(fleet)}</div></div></section>`;
}
