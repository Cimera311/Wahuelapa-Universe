import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ui,tick} from './helpers/game-ui.js';
import {buildInfo,stats} from '../src/engine.js';
import {RES} from '../src/config.js';

function openBuild(t){
 const fixture=ui(t),{doc}=fixture;
 doc.querySelector('[data-action="tab"][data-tab="build"]').click();
 return fixture;
}
const num=n=>Math.floor(n).toLocaleString('de-DE');

test('Compact builds are real cards with existing building/resource assets and cost quotes',t=>{
 const {api,doc}=openBuild(t),state=api.state(),p=state.planets[0];
 const row=doc.querySelector('[data-building-key="metal"]'),info=buildInfo(state,p,'metal');
 assert.ok(row);
 assert.equal(row.querySelector('.compact-building-icon img').getAttribute('src'),'./assets/buildings-research-v1/buildings/metal.webp');
 assert.ok(row.querySelectorAll('.compact-cost img').length>=2);
 assert.ok(row.querySelector('.compact-cost img').getAttribute('src').includes('pvp-resource-v1/resources/'));
 assert.deepEqual([...row.querySelectorAll('.compact-cost strong')].map(x=>x.textContent),RES.filter(key=>info.cost[key]).map(key=>num(info.cost[key])));
 assert.match(row.querySelector('.compact-time').textContent,/Sek|Min|Std/);
 assert.ok(row.querySelector('.compact-energy svg'),'yellow lightning must be an SVG, not the old resource image');
 assert.equal(row.querySelector('.compact-energy img'),null);
 assert.ok(row.querySelector('.compact-production'));
 const future=structuredClone(p);future.buildings.metal++;
 assert.equal(row.querySelector('.compact-production strong').textContent,num(stats(state,future).rates.metal));
 assert.ok(row.querySelector('.compact-controls .compact-upgrade'));
 assert.ok(row.querySelector('.compact-controls .compact-demolish'));
});

test('Compact covers energy generators, warehouse, and non-resource buildings without invented production',t=>{
 const {doc}=openBuild(t);
 const solar=doc.querySelector('[data-building-key="solar"]');
 assert.match(solar.querySelector('.compact-energy small').textContent,/Ertrag/);
 assert.ok(solar.querySelector('.compact-production'));
 assert.ok(doc.querySelector('[data-building-key="warehouse"] .compact-production'));
 const lab=doc.querySelector('[data-building-key="lab"]');
 assert.equal(lab.querySelector('.compact-production'),null);
 assert.ok(lab.querySelector('[data-action="building-info"]'));
});

test('Compact info dialog shows existing building text, complete energy balance and correct costs',t=>{
 const {doc}=openBuild(t);
 doc.querySelector('[data-building-key="metal"] [data-action="building-info"]').click();
 const dialog=doc.querySelector('dialog.compact-building-dialog');
 assert.ok(dialog?.open);
 assert.match(dialog.textContent,/Fördert Metall/);
 assert.match(dialog.textContent,/Energiebilanz nach Ausbau/);
 assert.match(dialog.textContent,/Bauzeit/);
 assert.ok(dialog.querySelector('.compact-cost img'));
 dialog.querySelector('[data-compact-close]').click();
 assert.equal(doc.querySelector('dialog.compact-building-dialog'),null);
});

test('New building and demolition buttons dispatch unchanged commands and preserve confirmation',async t=>{
 const {doc,api}=openBuild(t),initial=api.state().planets[0].buildings.metal;
 doc.querySelector('[data-building-key="metal"] [data-action="demolish-open"]').click();
 const confirm=doc.querySelector('dialog.demolition-dialog');
 assert.ok(confirm);
 assert.equal(api.state().planets[0].build,null);
 confirm.querySelector('[data-demolition-cancel]').click();
 confirm.remove();
 assert.equal(api.state().planets[0].build,null);
 doc.querySelector('[data-building-key="metal"] [data-action="build"]').click();
 await tick();
 assert.equal(api.state().planets[0].build.level,initial+1);
 assert.equal(api.state().planets[0].build.key,'metal');
 assert.equal(doc.querySelector('[data-building-key="metal"] [data-action="build"]').disabled,true);
});

test('Compact mobile CSS keeps original assets, meaningful touch targets and smaller demolition action',()=>{
 const css=readFileSync('src/style.css','utf8');
 assert.match(css,/\.compact-building \.compact-building-icon img/);
 assert.match(css,/\.compact-building \.compact-energy svg/);
 assert.match(css,/\.compact-building \.compact-controls \.compact-demolish/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/min-height:40px;font-size:13px/);
});
