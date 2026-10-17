import test from 'node:test';
import assert from 'node:assert/strict';
import {ui} from './helpers/game-ui.js';

function openGalaxy(doc){doc.querySelector('nav [data-tab="galaxy"]').click();}
const pirateButton=doc=>doc.querySelector('[data-section="pirates"]');
test('Pirate teaser is disabled for guests and non-admin accounts; forged navigation is rejected',t=>{
 const {doc,w,api}=ui(t);openGalaxy(doc);
 assert.equal(pirateButton(doc).disabled,true);assert.match(pirateButton(doc).textContent,/Coming soon/);
 api.attach({user:{id:'player'},pvp:{isAdmin:false}});api.render();
 // Removing the disabled attribute must not bypass the navigation guard.
 pirateButton(doc).disabled=false;pirateButton(doc).click();
 assert.equal(doc.querySelector('.pirates-preview'),null);
 // Unknown navigation targets cannot route into preview content either.
 const injected=doc.createElement('button');injected.dataset.action='galaxy-section';injected.dataset.section='unexpected';doc.querySelector('#app').append(injected);injected.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 assert.equal(doc.querySelector('.pirates-preview'),null);
});
test('Server-confirmed admins can select stations without missions or save changes; access is revoked on account change',t=>{
 const {doc,api}=ui(t);api.attach({user:{id:'admin'},pvp:{isAdmin:true}});openGalaxy(doc);
 assert.equal(pirateButton(doc).disabled,false);pirateButton(doc).click();
 assert.equal(doc.querySelectorAll('[data-action="pirate-select"]').length,5);
 const before=JSON.stringify(api.state());
 doc.querySelector('[data-station="fortress"]').click();
 assert.equal(doc.querySelector('#pirate-detail-title').textContent,'Freibeuterfestung');
 assert.ok([...doc.querySelectorAll('.pirate-actions button')].every(b=>b.disabled));
 assert.equal(JSON.stringify(api.state()),before);
 api.attach({user:{id:'other-player'},pvp:{isAdmin:false}});api.render();
 assert.equal(doc.querySelector('.pirates-preview'),null);assert.equal(pirateButton(doc).disabled,true);
});
test('An unverified admin flag without an authenticated account does not open the preview',t=>{
 const {doc,api}=ui(t);api.attach({pvp:{isAdmin:true}});openGalaxy(doc);
 assert.equal(pirateButton(doc).disabled,true);
});

test('Public-capable server unlocks pirates for ordinary signed-in players and removes Coming soon',t=>{
 const {doc,api}=ui(t);api.attach({user:{id:'player'},pvp:{isAdmin:false,features:{piratesPublic:true}}});openGalaxy(doc);
 assert.equal(pirateButton(doc).disabled,false);assert.doesNotMatch(pirateButton(doc).textContent,/Coming soon/);
 pirateButton(doc).click();assert.ok(doc.querySelector('.pirates-preview'));
 api.attach({pvp:{features:{piratesPublic:true}}});api.render();assert.equal(doc.querySelector('.pirates-preview'),null);
});
