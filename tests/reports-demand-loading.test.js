import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,tick} from './helpers/game-ui.js';
test('PvP and Defense do not fetch archives; opening Reports fetches once and paging remains available',async t=>{
 const {doc,api}=ui(t);let calls=0;
 const rows=Array.from({length:12},(_,i)=>({id:'saved-'+i,missionId:'mission-'+i,time:Date.now()-i,kind:'battle',title:'Gefecht',archived:false,payload:{outcome:'draw'}}));
 const cloud={user:{id:'test-player'},authoritative:true,pvp:{enabled:true,incoming:[],outgoing:[],reports:[],features:{},attackCapacity:3},reports:async query=>{calls++;const offset=query.offset||0;return {items:rows.slice(offset,offset+6),total:rows.length};},galaxy:async()=>({systems:[],planets:[]})};api.attach(cloud);cloud.gameRequest=async()=>({state:structuredClone(api.state())});await api.sync();
 doc.querySelector('nav [data-tab="fleet"]').click();
 doc.querySelector('[data-action="fleet-group-nav"][data-group="pvp"]').click();
 for(const key of ['pvp','defense','pvp']){doc.querySelector(`[data-action="fleet-section"][data-section="${key}"]`).click();await tick();}
 assert.equal(calls,0,'opening PvP/Defense must not load the archive');
 doc.querySelector('[data-action="fleet-group-nav"][data-group="trade"]').click();
 doc.querySelector('[data-action="fleet-section"][data-section="reports"]').click();await tick();
 assert.equal(calls,1);assert.equal(doc.querySelectorAll('.report-list-row').length,6);
 cloud.gameRequest=async()=>({state:structuredClone(api.state())});await api.sync();await tick();assert.equal(calls,1,'world sync must not poll the archive, even while Reports is open');
 doc.querySelector('[data-action="report-more"]').click();await tick();assert.equal(calls,2);assert.equal(doc.querySelectorAll('.report-list-row').length,12);
 doc.querySelector('[data-action="fleet-group-nav"][data-group="pvp"]').click();await tick();assert.equal(calls,2);
});
