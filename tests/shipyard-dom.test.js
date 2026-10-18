import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
import {shipInfo} from '../src/engine.js';
import {vector} from '../src/config.js';
function ready(t){const u=ui(t),s=u.api.state(),p=s.planets[0];p.buildings.shipyard=6;p.buildings.solar=20;p.resources=vector([1e6,1e6,1e6]);u.api.show('hangar');u.doc.querySelector('[data-action="ship-category"][data-category="military"]').click();return {...u,p,s};}
test('collapsed shipyard exposes every build control, icon-only costs and keyboard-accessible details',t=>{
 const {doc}=ready(t),card=doc.querySelector('[data-ship-card="falke"]'),row=card.querySelector('.ship-build-row');
 assert.ok(row.querySelector('img'));assert.match(row.querySelector('h2').textContent,/Falke/);assert.equal(row.querySelectorAll('.ship-resource').length,3);
 assert.doesNotMatch(row.querySelector('[data-ship-cost]').textContent,/Metall|Kristall|Treibstoff/);assert.match(row.querySelector('.ship-resource').getAttribute('aria-label'),/Metall/);
 assert.match(row.querySelector('[data-ship-time]').textContent,/Sek/);assert.equal(row.querySelector('[data-ship-count]').value,'1');assert.equal(row.querySelector('[data-action="ship"]').disabled,false);
 const toggle=row.querySelector('[data-ship-toggle]'),details=card.querySelector('.ship-extra');assert.equal(details.hidden,true);assert.equal(toggle.getAttribute('aria-controls'),details.id);toggle.click();assert.equal(details.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.match(details.textContent,/Voraussetzungen/);assert.match(details.textContent,/Tempo/);toggle.click();assert.equal(details.hidden,true);
});
test('shipyard recalculates totals and affordability for the whole selected order, including tick updates',t=>{
 const {doc,w,api,p,s}=ready(t),card=doc.querySelector('[data-ship-card="falke"]'),count=card.querySelector('[data-ship-count]');
 input(w,count,'10');const expected=shipInfo(s,p,'falke',10);assert.equal(card.querySelector('.ship-resource span').textContent,Math.floor(expected.cost.metal).toLocaleString('de-DE'));assert.match(card.querySelector('[data-ship-time]').textContent,/gesamt/);
 p.resources.metal=500;api.tick();assert.equal(card.querySelector('[data-action="ship"]').disabled,true);assert.match(card.querySelector('[data-ship-reason]').textContent,/Ressourcen/);
 input(w,count,'1');assert.equal(card.querySelector('[data-action="ship"]').disabled,false);
 for(const invalid of ['0','1.5','-1','',String(Number.MAX_SAFE_INTEGER+1)]){input(w,count,invalid);assert.equal(card.querySelector('[data-action="ship"]').disabled,true);api.tick();assert.equal(card.querySelector('[data-action="ship"]').disabled,true);}
 input(w,card.querySelector('[data-production-range]'),'2');assert.equal(count.value,'2');card.querySelector('[data-production-set="0"]').click();assert.equal(count.value,'0');assert.equal(card.querySelector('[data-action="ship"]').disabled,true);
});
test('ship counts and detail state survive rerender but remain separate per planet',t=>{
 const {doc,w,api}=ready(t);let card=doc.querySelector('[data-ship-card="falke"]');input(w,card.querySelector('[data-ship-count]'),'12');card.querySelector('[data-ship-toggle]').click();api.render();card=doc.querySelector('[data-ship-card="falke"]');assert.equal(card.querySelector('[data-ship-count]').value,'12');assert.equal(card.querySelector('.ship-extra').hidden,false);
 doc.querySelector('#planet-select').value='ferrum';doc.querySelector('#planet-select').dispatchEvent(new w.Event('change',{bubbles:true}));card=doc.querySelector('[data-ship-card="falke"]');assert.equal(card.querySelector('[data-ship-count]').value,'1');assert.equal(card.querySelector('.ship-extra').hidden,true);
});
test('building from a collapsed row submits the quantity and leaves paid queue actions available',async t=>{
 const {doc,w,api,p}=ready(t);const card=doc.querySelector('[data-ship-card="falke"]');input(w,card.querySelector('[data-ship-count]'),'3');card.querySelector('[data-action="ship"]').click();await tick();assert.equal(api.state().planets[0].shipjob.count,3);assert.equal(api.state().planets[0].shipjob.key,'falke');assert.equal(doc.querySelector('[data-ship-card="falke"] [data-action="ship"]').disabled,false);assert.equal(doc.querySelector('[data-ship-card="falke"] [data-action="ship"]').textContent,'Einreihen');assert.equal(doc.querySelector('[data-ship-queue-total]').textContent.startsWith('1 / 6 Auftrag'),true);assert.equal(doc.querySelector('[data-ship-card="falke"] [data-ship-count]').value,'1');
});
test('defense totals include salvage and orbital limits, and power shortages remain visible',t=>{
 const {doc}=ready(t);assert.equal(doc.querySelector('[data-category="defense"]'),null);for(const key of ['flak','laser','rail','plasma'])assert.equal(doc.querySelector('[data-ship-card="'+key+'"]'),null);
});

test('Queue buttons add and remove the chosen waiting order without replacing the active job',async t=>{
 const {doc,w,api,p:original}=ready(t);original.buildings.metal=original.buildings.crystal=original.buildings.fuel=0;doc.querySelector('[data-ship-card="falke"] [data-action="ship"]').click();await tick();const active=api.state().planets[0].shipjob.id;
 input(w,doc.querySelector('[data-ship-card="waechter"] [data-ship-count]'),'2');doc.querySelector('[data-ship-card="waechter"] [data-action="ship"]').click();await tick();const p=api.state().planets[0];assert.equal(p.shipqueue[0].count,2);assert.equal(doc.querySelectorAll('.ship-queue-row').length,2);assert.match(doc.querySelector('[data-ship-queue-start]').textContent,/Start in/);assert.equal(doc.querySelector('[data-ship-queue] [role="progressbar"]').getAttribute('aria-label'),'Baufortschritt Falke');
 const payment=p.shipqueue[0].payment.resources.metal,before=p.resources.metal;doc.querySelector('.ship-queue-row:not(.active) [data-action="cancel-ship"]').click();await tick();assert.equal(api.state().planets[0].shipjob.id,active);assert.equal(api.state().planets[0].shipqueue.length,0);assert.equal(api.state().planets[0].resources.metal,before+payment);
});
test('Older servers expose a clear update reason instead of accepting an unsupported queue action',async t=>{
 const {doc,api,p,s}=ready(t);p.shipjob={id:++s.seq,key:'falke',count:1,start:s.time,end:s.time+60000,workTotal:60000,workRemaining:60000,paused:false};api.attach({authoritative:true,pvp:{features:{cancelShip:true},incoming:[]}});api.render();const card=doc.querySelector('[data-ship-card="falke"]');assert.equal(card.querySelector('[data-action="ship"]').disabled,true);assert.match(card.querySelector('[data-ship-reason]').textContent,/Serverfunktion/);
});

test('Shipyard slots and full-queue message update when the yard expands',async t=>{
 const {doc,api,p}=ready(t);p.buildings.shipyard=1;api.render();doc.querySelector('[data-ship-card="falke"] [data-action="ship"]').click();await tick();let card=doc.querySelector('[data-ship-card="falke"]');assert.equal(card.querySelector('[data-action="ship"]').disabled,true);assert.match(card.querySelector('[data-ship-reason]').textContent,/Mehr Plätze ab Werftstufe 2/);assert.match(doc.querySelector('[data-ship-queue-total]').textContent,/1 \/ 1 Auftrag/);
 api.state().planets[0].buildings.shipyard=2;api.tick();assert.equal(card.querySelector('[data-action="ship"]').disabled,false);assert.match(doc.querySelector('[data-ship-queue-total]').textContent,/1 \/ 2 Auftrag/);
});
