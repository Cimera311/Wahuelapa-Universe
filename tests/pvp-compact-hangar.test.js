import test from 'node:test';
import assert from 'node:assert/strict';
import {pvpCompactHangarPicker} from '../src/fleet-controls.js';
import {SHIPS,TECHS} from '../src/config.js';

const state={tech:Object.fromEntries(Object.keys(TECHS).map(k=>[k,0]))};
const planet={name:'Aster 1',ships:Object.fromEntries(Object.keys(SHIPS).map(k=>[k,0]))};
planet.ships.falke=5466;planet.ships.waechter=15;planet.ships.titan=1254;planet.ships.atlas=25;
test('PvP B3.3 uses ship assets, selection controls and accordions',()=>{
 const html=pvpCompactHangarPicker(state,planet,{fleet:{falke:3413}});
 assert.match(html,/assets\/ship-icons-v3\/falke\.webp/);
 assert.match(html,/3413/);
 assert.match(html,/5\.466 verfügbar/);
 assert.match(html,/data-hangar-count="none"/);
 assert.match(html,/data-hangar-count="all"/);
 assert.match(html,/data-hangar-range="falke"/);
 assert.match(html,/data-pvp-ship-details="falke"/);
 assert.match(html,/Angriff/);
 assert.match(html,/Schild/);
 assert.match(html,/Hülle/);
 assert.doesNotMatch(html,/>ausgewählt<\/span>/);
 assert.match(html,/pirate-hangar-card pvp-hangar-card/);
});
test('PvP B3.3 preserves precise quantities and does not mutate fleets',()=>{
 const fleet={falke:6000,atlas:2},copy={...fleet};
 const html=pvpCompactHangarPicker(state,planet,{fleet});
 assert.match(html,/name="falke"[^>]*value="6000"/);
 assert.match(html,/data-hangar-range="falke"[^>]*max="5466" value="5466"/);
 assert.deepEqual(fleet,copy);
 assert.match(html,/data-hangar-capacity/);
});
