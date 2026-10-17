import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,input,tick} from './helpers/game-ui.js';
function mounted(t,mode='deliver'){
 const out=ui(t),calls=[],s=out.api.state();s.galaxy={x:500,y:960};s.planets[0].ships.spyProbe=2;
 const social={players:[],partners:[{id:'p',friend:'silver',name:'Silverstar',status:'accepted',received:{delivery:true,defense:true},granted:{delivery:true,defense:true},planets:[{id:'g-orion-p1',system:'orion',slot:1,name:'Orion 1',x:380,y:250}]}],missions:[],trades:[]};
 const cloud={user:{id:'a'},authoritative:true,pvp:{social,incoming:[],features:{partnerOrigins:true,partnerships:true}},async gameRequest(request){calls.push(request);return {state:structuredClone(out.api.state())};}};
 out.api.attach(cloud);out.api.show('partners');if(mode!=='deliver')out.doc.querySelector('[data-social-mode="'+mode+'"]').click();return {...out,calls,cloud,social};
}
for(const mode of ['deliver','support','trade-offer'])test('Partner '+mode+' uses synchronized hangar quantities and submits one unchanged social payload',async t=>{
 const {doc,w,api,calls}=mounted(t,mode);let form=doc.getElementById('social-flight-form');const key=mode==='support'?'falke':'karawane';
 assert.equal(form.querySelector('[data-fleet-adjust]'),null);assert.equal(form.querySelector('[data-hangar-ship="spyProbe"]'),null);
 assert.equal(form.querySelector('[data-hangar-ship="'+(mode==='support'?'karawane':'falke')+'"]'),null);
 input(w,form.querySelector('[data-hangar-range="'+key+'"]'),2);assert.equal(form.querySelector('[data-fleet-ship="'+key+'"]').value,'2');
 if(mode!=='support')input(w,form.elements.namedItem('cargo-metal'),500);if(mode==='trade-offer')input(w,form.elements.namedItem('payment-crystal'),300);
 assert.match(form.querySelector('#social-estimate').textContent,/Aurelia → Orion 1/);assert.equal(form.querySelector('[type=submit]').disabled,false);
 api.render();form=doc.getElementById('social-flight-form');assert.equal(form.querySelector('[data-hangar-range="'+key+'"]').value,'2');assert.match(form.querySelector('[data-hangar-total]').textContent,/2 Schiffe/);
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,1);const action=calls[0].action;assert.equal(calls[0].type,'social');assert.equal(action.op,mode);assert.equal(action.from,'home');assert.equal(action.to,'g-orion-p1');assert.deepEqual(JSON.parse(JSON.stringify(action.fleet)),{[key]:2});
 if(mode!=='support')assert.equal(action.cargo.metal,500);if(mode==='trade-offer')assert.equal(action.payment.crystal,300);
});
test('Partner card shortcuts and cargo shortcuts update capacity and flight planning together',t=>{
 const {doc,w}=mounted(t);const form=doc.getElementById('social-flight-form'),card=form.querySelector('[data-hangar-ship="karawane"]');
 card.querySelector('[data-hangar-count="all"]').click();assert.equal(card.querySelector('[data-hangar-range]').value,'5');input(w,card.querySelector('[data-fleet-ship]'),2);assert.equal(card.querySelector('[data-hangar-range]').value,'2');assert.equal(form.querySelector('[data-hangar-capacity]').textContent,'17.500');
 const metal=form.elements.namedItem('cargo-metal');metal.closest('.cargo-control').querySelector('[data-cargo-percent="5"]').click();assert.equal(metal.value,'875');assert.equal(form.querySelector('[type=submit]').disabled,false);
 card.querySelector('[data-hangar-count="none"]').click();assert.equal(card.querySelector('[data-hangar-range]').value,'0');assert.equal(form.querySelector('[type=submit]').disabled,true);
});
for(const mode of ['deliver','support','trade-offer'])test('Revoked '+mode+' permission prevents submitting an already open partner planner',async t=>{
 const {doc,w,calls,social}=mounted(t,mode),form=doc.getElementById('social-flight-form');input(w,form.querySelector('[data-hangar-range="'+(mode==='support'?'falke':'karawane')+'"]'),1);
 if(mode!=='support')input(w,form.elements.namedItem('cargo-metal'),500);if(mode==='trade-offer')input(w,form.elements.namedItem('payment-crystal'),200);
 if(mode==='support')social.partners[0].received.defense=false;else if(mode==='trade-offer')social.partners[0].granted.delivery=false;else social.partners[0].received.delivery=false;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();assert.equal(calls.length,0);assert.equal(form.querySelector('[type=submit]').disabled,true);assert.match(form.querySelector('#social-estimate').textContent,/freigegebene Zielkolonie/);
});
test('Partner hangar survives a busy cloud render with quantities and cargo retained',async t=>{
 const {doc,w,api}=mounted(t);let form=doc.getElementById('social-flight-form');input(w,form.querySelector('[data-hangar-range="karawane"]'),2);input(w,form.elements.namedItem('cargo-metal'),500);
 const syncing=api.sync();api.render();await syncing;form=doc.getElementById('social-flight-form');assert.equal(form.querySelector('[data-hangar-range="karawane"]').disabled,false);assert.equal(form.querySelector('[data-hangar-range="karawane"]').value,'2');assert.equal(form.elements.namedItem('cargo-metal').value,'500');assert.equal(form.querySelector('[type=submit]').disabled,false);
});
test('A stale partner fleet remains visible and blocked after stock falls below its draft',t=>{
 const {doc,w,api}=mounted(t);const form=doc.getElementById('social-flight-form');input(w,form.querySelector('[data-hangar-range="karawane"]'),5);input(w,form.elements.namedItem('cargo-metal'),500);api.state().planets[0].ships.karawane=2;api.render();
 const current=doc.getElementById('social-flight-form');assert.equal(current.querySelector('[data-fleet-ship="karawane"]').value,'5');assert.equal(current.querySelector('[type=submit]').disabled,true);assert.match(current.querySelector('#social-estimate').textContent,/Nicht genügend verfügbare/);
});
