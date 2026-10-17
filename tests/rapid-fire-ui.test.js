import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIPS} from '../src/config.js';
import {combatConfigForRealmId} from '../src/realm-config.js';
import {rapidFireTargets,rapidFireInfoHTML} from '../src/rapid-fire-ui.js';

test('rapid fire info lists every Test4 matchup for all eight fighting types',()=>{
 const matrix=combatConfigForRealmId('test4').rapidFire.chances;
 for(const [key,sh] of Object.entries(SHIPS)){
  const html=rapidFireInfoHTML(key,6);
  assert.ok(html.includes('Rapid Fire'),key);
  if(!['military','defense'].includes(sh.category)){
   assert.match(html,/Keine Rapid-Fire-Funktion/);
   continue;
  }
  const targets=rapidFireTargets(key);
  assert.equal(targets.length,Object.entries(matrix[key]||{}).filter(([,v])=>v>0).length,key);
  for(const {name,chance} of targets){
   assert.ok(html.includes(name),key+': '+name);
   assert.ok(html.includes(Number((chance*100).toFixed(1)).toLocaleString('de-DE')+' %'),key+': '+chance);
  }
  assert.match(html,/Maximal 3 Zusatzsalven/);
 }
});
test('v5 fallback and orbital opening are clearly explained',()=>{
 assert.match(rapidFireInfoHTML('flak',5),/Aktuell gilt v5 ohne Rapid Fire/);
 assert.match(rapidFireInfoHTML('plasma',6),/Rapid Fire gilt auch beim orbitalen Erstschlag \(Runde 0\)/);
 assert.doesNotMatch(rapidFireInfoHTML('titan',6),/Kein Rapid Fire beim orbitalen Erstschlag/);
 assert.match(rapidFireInfoHTML('titan',6),/v6 aktiv/);
 assert.deepEqual(rapidFireTargets('transport'),[]);
 assert.equal(rapidFireInfoHTML('missing'), '');
});
