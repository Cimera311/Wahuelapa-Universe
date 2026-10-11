import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {newGame,act} from '../src/engine.js';
import {TARGETS,TECHS,vector} from '../src/config.js';
function ui(t){
 const dom=new JSDOM('<div id="app"></div><div id="toast"></div>',{url:'https://game.test/',runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 Object.assign(w,{structuredClone,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},scrollTo(){}});w.Element.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 const s=newGame('DOM',Date.now());s.planets.push({...structuredClone(s.planets[0]),...TARGETS[0]});for(const [k,d] of Object.entries(TECHS))s.tech[k]=d.max;for(const p of s.planets){p.buildings.warehouse=10;p.resources=vector([10000,10000,10000]);p.ships.karawane=5;p.ships.atlas=2;p.ships.falke=10;}
 w.localStorage.setItem('imperium-v1',JSON.stringify(s));
 const files=JSON.parse(readFileSync('scripts/build.js','utf8').match(/const files=(\[[^\]]+\])/)[1].replaceAll("'",'"'));
 const source=files.map(f=>readFileSync('src/'+f+'.js','utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n').replace(/const CLOUD_CONFIG=\{\s*enabled:true/,'const CLOUD_CONFIG={enabled:false');
 w.eval(source+'\nglobalThis.fleetTest={state:()=>state,show(section){tab="fleet";fleetSection=section;render();},attach(c){cloud=c;cloudBlocked=false;},render};');
 return {w,doc:w.document,api:w.fleetTest};
}
function input(w,node,value){node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
const tick=()=>new Promise(r=>setImmediate(r));
test('Real DOM fleet controls clamp counts and add 5% of combined capacity',t=>{
 const {w,doc,api}=ui(t);api.show('orders');let form=doc.getElementById('fleet-order-form');const ship=form.querySelector('[name="fleet-karawane"]');input(w,ship,99);assert.equal(ship.value,'5');input(w,ship,2);const metal=form.elements.namedItem('metal');assert.equal(metal.value,'0');metal.closest('.cargo-control').querySelector('[data-cargo-percent]').click();assert.equal(metal.value,'875');metal.closest('.cargo-control').querySelector('[data-cargo-percent]').click();assert.equal(metal.value,'1750');metal.closest('.cargo-control').querySelector('[data-cargo-set="0"]').click();assert.equal(metal.value,'0');assert.match(form.querySelector('#fleet-estimate').textContent,/Karawane/);
});
test('Real DOM route stop modes expose only selected rules and retain combined mode',async t=>{
 const {w,doc,api}=ui(t);api.show('routes');doc.querySelector('[data-action="route-new"]').click();let form=doc.getElementById('route-form'),rows=form.querySelectorAll('.route-stop');assert.equal(rows[0].querySelector('[data-stop-section="unload"]').hidden,true);assert.equal(rows[1].querySelector('[data-stop-section="load"]').hidden,true);const mode=rows[1].querySelector('[name="stop-mode"]');mode.value='both';mode.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(rows[1].querySelector('[data-stop-section="load"]').hidden,false);assert.equal(rows[1].querySelector('[data-stop-section="unload"]').hidden,false);
 const calls=[],cloud={user:{id:'a'},authoritative:true,pvp:{features:{routePause:true},incoming:[]},async gameRequest(request){calls.push(request);return {state:act(api.state(),request.action,api.state().time)};}};api.attach(cloud);
 input(w,form.querySelector('[name="fleet-karawane"]'),1);form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].action.type,'route');assert.equal(api.state().missions.length,1);api.show('routes');doc.querySelector('[data-action="route-edit"]').click();const pause=doc.querySelector('#route-form [data-action="pause-route"]');assert.equal(pause.type,'button');pause.click();await tick();assert.deepEqual(calls.map(c=>c.action.type),['route','pause-route']);assert.equal(api.state().missions[0].pauseRequested,true);
});
test('Partner shortcut opens the matching order and submits exactly one social request',async t=>{
 const {w,doc,api}=ui(t);const calls=[],social={players:[],partners:[{id:'p',name:'Ally',status:'accepted',received:{delivery:true,defense:true},granted:{delivery:true,defense:true},planets:[{id:'g-orion-p1',system:'orion',slot:1,name:'Orion 1',x:380,y:250}]}],missions:[],trades:[]};
 const s=api.state();Object.assign(s.planets[0],{id:'home'});Object.assign(s.planets[1],{id:'g-helion-p1',system:'helion',slot:1,x:520,y:400});s.active=s.planets[1].id;s.galaxy={x:500,y:960};
 api.attach({user:{id:'a'},authoritative:true,pvp:{social,incoming:[],features:{partnerships:true,routePause:true}},async gameRequest(request){calls.push(request);return {state:structuredClone(api.state())};}});api.show('orders');doc.querySelector('[data-social-link="support"]').click();const form=doc.getElementById('social-flight-form');assert.ok(form);assert.equal(form.dataset.op,'support');assert.equal(form.elements.namedItem('to').value,'g-orion-p1');assert.equal(doc.getElementById('social-invite-form'),null);input(w,form.querySelector('[name="fleet-falke"]'),2);form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);assert.equal(calls[0].type,'social');assert.equal(calls[0].action.op,'support');assert.equal(calls[0].action.fleet.falke,2);
});
