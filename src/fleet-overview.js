import {SHIPS,planetImagePath} from './config.js';

const stockEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fleetNumber=n=>Number(n||0).toLocaleString('de-DE');
export const fleetFilters=[['all','Alle'],['freighter','Transport'],['military','Kampf'],['civil','Sonden & Kolonie'],['defense','Verteidigung']];
const fleetArt=key=>SHIPS[key].asset||`./assets/${SHIPS[key].image||key}.webp`;

// Only available orbiting units belong here. Missions are displayed separately.
export function fleetInventory(planets,category='all'){
 return Object.entries(SHIPS).filter(([,s])=>category==='all'||s.category===category).map(([key,ship])=>{
  const locations=planets.filter(p=>Number(p.ships?.[key])>0).map(p=>({planet:p,count:Number(p.ships[key])}));
  return {key,ship,locations,total:locations.reduce((sum,p)=>sum+p.count,0)};
 }).filter(row=>row.total>0).sort((a,b)=>b.total-a.total||a.ship.name.localeCompare(b.ship.name,'de'));
}

export function fleetOverviewHTML(planets,{group='ship',category='all',expanded=new Map(),mobile=false}={}){
 const inventory=fleetInventory(planets,category);
 const controls=(items,action,value)=>items.map(([key,label])=>`<button type="button" data-action="${action}" data-value="${key}" aria-pressed="${value===key}">${label}</button>`).join('');
 const picture=(src)=>`<img src="${stockEscape(src)}" alt="" loading="lazy" decoding="async">`;
 const detail=(key,title,art,total,body,index)=>`<details class="fleet-stock-card" data-fleet-detail="${stockEscape(key)}" ${(expanded.has(key)?expanded.get(key):!mobile||index===0)?'open':''}><summary>${picture(art)}<span><strong>${stockEscape(title)}</strong><span class="fleet-stock-total">${fleetNumber(total)} <small>im Orbit</small></span></span><span class="fleet-stock-chevron" aria-hidden="true">⌄</span></summary><div class="fleet-stock-body">${body}</div></details>`;
 const row=(art,name,count,note='')=>`<div class="fleet-stock-row">${picture(art)}<span>${stockEscape(name)}${note?`<small>${stockEscape(note)}</small>`:''}</span><strong>${fleetNumber(count)}</strong></div>`;
 const cards=group==='ship'?inventory.map((item,i)=>detail('ship:'+item.key,item.ship.name,fleetArt(item.key),item.total,`<p class="fleet-stock-label">Standorte</p>${item.locations.map(({planet,count})=>row(planetImagePath(planet),planet.name,count,planet.coord||'')).join('')}`,i)).join(''):planets.map((p,i)=>{
  const items=inventory.filter(item=>item.locations.some(loc=>loc.planet.id===p.id));
  const total=items.reduce((n,item)=>n+Number(p.ships[item.key]),0);
  const body=items.length?fleetFilters.slice(1).map(([key,label])=>{const matching=items.filter(item=>item.ship.category===key);return matching.length?`<p class="fleet-stock-label">${label}</p>${matching.map(item=>row(fleetArt(item.key),item.ship.name,p.ships[item.key])).join('')}`:'';}).join(''):`<p class="fine">${category==='all'?'Keine Einheiten im Orbit.':'Keine Einheiten dieser Kategorie.'}</p>`;
  return detail('planet:'+p.id,p.name,planetImagePath(p),total,body,i);
 }).join('');
 return `<div class="fleet-stock-heading"><div><h2>Gesamte Flotte</h2><p class="fine">Alle eigenen Planeten im Überblick · Einheiten im Orbit</p></div><div class="fleet-stock-switch" role="group" aria-label="Flotte gruppieren">${controls([['ship','Nach Schiff'],['planet','Nach Planet']],'fleet-group',group)}</div></div><div class="fleet-stock-filters" role="group" aria-label="Einheiten filtern">${controls(fleetFilters,'fleet-filter',category)}</div><div class="fleet-stock-grid">${cards||'<p class="fine" role="status">Keine Einheiten dieser Kategorie im Orbit.</p>'}</div>`;
}

export function fleetMissionProgress(m,now){
 const end=Number(m.due),start=end-Math.max(1,Number(m.duration)||end-Number(m.start)||1);
 return {start,end,percent:Math.round(Math.max(0,Math.min(100,100*(now-start)/(end-start))))};
}

// Shared route-card layout; callers supply only actions valid for this mission type.
export function fleetTravelCard({title,status,worlds,fleet,cargoHTML,capacity,info='',due,start,now,clock,actions=''}){
 const percent=Math.round(Math.max(0,Math.min(100,100*(now-start)/Math.max(1,due-start))));
 return `<article class="route-card fleet-travel-card"><div class="route-card-heading"><h3>${stockEscape(title)}</h3><span class="route-status">${stockEscape(status)}</span></div><div class="route-path" aria-label="Flugstrecke">${worlds.map((p,i)=>`${i?'<span class="route-arrow" aria-hidden="true">→</span>':''}<div class="route-world"><img class="fleet-world-image" src="${stockEscape(planetImagePath(p))}" alt=""><span>${stockEscape(p.name)}</span></div>`).join('')}</div><div class="route-freight"><div class="route-ships">${Object.entries(fleet).filter(([k,n])=>SHIPS[k]&&n>0).map(([k,n])=>`<span><img src="${stockEscape(fleetArt(k))}" alt=""><strong>${fleetNumber(n)} × ${stockEscape(SHIPS[k].name)}</strong></span>`).join('')}</div>${capacity>0?`<div class="route-cargo-metrics"><div><strong>${fleetNumber(capacity)}</strong><small>Laderaum</small></div><div><strong>${cargoHTML||'Leer'}</strong><small>Aktuelle Fracht</small></div></div>`:''}${info?`<p class="fine">${stockEscape(info)}</p>`:''}</div><div class="route-travel"><div class="route-next">Ziel: <strong>${stockEscape(worlds.at(-1).name)}</strong></div><div class="route-flight-progress" role="progressbar" aria-label="Flugfortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" data-overview-start="${start}" data-overview-end="${due}"><i style="width:${percent}%"></i></div><div class="route-arrival">Ankunft in <strong data-due="${due}">${clock}</strong></div>${actions?`<div class="route-actions">${actions}</div>`:''}</div></article>`;
}

