import test from 'node:test';
import assert from 'node:assert/strict';
import {attackCard} from '../src/flight-ui.js';

const mission={id:42,from:'home',to:'g-helion-p4',fleet:{titan:332,atlas:25},status:'returning',arrival:100000,returnAt:200000,cargo:{metal:12500,crystal:8200,fuel:3400}};
const state={name:'Cimera',planets:[{id:'home',name:'Aster 1',kind:'Heimatwelt',color:'#53add3'}]};
const galaxy={planets:[{id:'g-helion-p4',name:'Nyx 4',commander:'Verwalter',surveyed:true,system:'helion',slot:4}],systems:[{id:'helion',x:200,y:100}],start:{x:100,y:100}};
const pvp={serverNow:150000,reports:[]};

test('PvP flight starts compact; route, countdown and commander names remain visible',()=>{
 const html=attackCard(mission,state,pvp,galaxy);
 assert.match(html,/<details class="attack-flight-accordion"/);
 assert.doesNotMatch(html,/<details class="attack-flight-accordion"[^>]* open/);
 assert.match(html,/Aster 1/);assert.match(html,/Nyx 4/);
 assert.match(html,/Cimera/);assert.match(html,/Verwalter/);
 assert.match(html,/data-due="200000"/);
 assert.match(html,/Flotte an Bord/);
 assert.match(html,/12\.500/);assert.match(html,/8\.200/);assert.match(html,/3\.400/);
});

test('Accordion persists opening state independently of nested reports',()=>{
 const html=attackCard(mission,state,pvp,galaxy,150000,[],new Set(['flight:42']));
 assert.match(html,/data-ui-key="flight:42" open/);
 assert.match(html,/data-ui-key="mission:42"/);
});

test('Outbound attack does not invent loot and an empty return declares no cargo',()=>{
 const outbound=attackCard({...mission,status:'outbound',cargo:{metal:0,crystal:0,fuel:0}},state,pvp,galaxy);
 assert.match(outbound,/Noch keine Beute/);
 const empty=attackCard({...mission,cargo:{metal:0,crystal:0,fuel:0}},state,pvp,galaxy);
 assert.match(empty,/Laderaum leer/);
});

test('Waiting for storage retains cargo indicator and does not hide the flight',()=>{
 const html=attackCard({...mission,awaitingUnload:true},state,pvp,galaxy);
 assert.match(html,/Wartet auf Lagerplatz/);assert.match(html,/Restladung bleibt an Bord/);
});
