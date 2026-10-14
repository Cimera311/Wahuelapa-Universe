import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ui} from './helpers/game-ui.js';
import {TARGETS} from '../src/config.js';

function openTutorial(doc){
 doc.querySelector('[data-action="tab"][data-tab="galaxy"]').click();
 return doc.querySelector('.tutorial-system-banner');
}

test('Tutorial orbit banner contains sun, Aurelia and all three target planets in orbital order',t=>{
 const {doc,api}=ui(t),state=api.state();
 state.discovered=TARGETS.map(p=>p.id);
 const map=openTutorial(doc);
 assert.ok(map);
 assert.equal(map.querySelectorAll('.sun').length,1);
 const names=[...map.querySelectorAll('.map-planet')].map(el=>el.textContent);
 assert.deepEqual(names,['Aurelia','Ferrum','Nereus','Thalassa']);
 assert.equal(map.querySelector('.map-home').getAttribute('style').includes('left:23%'),true);
 assert.equal(doc.querySelectorAll('.world-grid.targets article').length,3,'Do not add a fourth colonizable planet');
 assert.equal(state.planets.filter(p=>p.id==='home').length,1);
 assert.equal(state.planets.length,2,'Do not create any new planet in a save');
});

test('New strip retains unknown markers until planets are discovered',t=>{
 const {doc,api}=ui(t);
 const map=openTutorial(doc);
 assert.deepEqual([...map.querySelectorAll('.map-planet')].map(el=>el.textContent),['Aurelia','?','?','?']);
 assert.doesNotMatch(map.getAttribute('aria-label'),/Ferrum|Nereus|Thalassa/);
 api.state().discovered=['ferrum'];
 api.render();
 assert.deepEqual([...doc.querySelectorAll('.tutorial-system-banner .map-planet')].map(el=>el.textContent),['Aurelia','Ferrum','?','?']);
});

test('Tutorial banner uses existing home-planet artwork and adaptive orbit styling',()=>{
 const css=readFileSync('src/style.css','utf8');
 assert.match(css,/\.tutorial-system-banner \.map-home::before/);
 assert.match(css,/url\('\.\.\/assets\/home\.webp'\)/);
 assert.match(css,/@media\(max-width:600px\)/);
});
