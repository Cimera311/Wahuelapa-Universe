import test from 'node:test';
import assert from 'node:assert/strict';
import {ui,tick} from './helpers/game-ui.js';

function login(t){const view=ui(t);view.api.enableCloud();return view;}
function submit(w,form){form.elements.email.value='commander@example.test';form.elements.password.value='secret-password';form.dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:form.querySelector('[value="login"]')}));}

test('A second tab explains the blocked login inside the modal and offers reload',t=>{
 const {w,doc,api}=login(t);let calls=0;api.attach({user:null,signIn(){calls++;}});
 w.dispatchEvent(new w.StorageEvent('storage',{key:'imperium-v1'}));api.settings();
 const status=doc.querySelector('dialog #cloud-auth-status');assert.equal(status.hidden,false);assert.match(status.textContent,/anderen Tab/);assert.match(status.textContent,/lade diese Seite neu/);assert.equal(status.getAttribute('role'),'alert');
 assert.equal(doc.querySelector('[value="login"]').disabled,true);assert.equal(doc.querySelector('[data-action="login-reload"]').hidden,false);assert.equal(doc.querySelector('[data-action="login-reload"]').disabled,false);
 submit(w,doc.querySelector('#cloud-auth-form'));assert.equal(calls,0);
});

test('A tab conflict appearing while the modal is open updates its warning',t=>{
 const {w,doc,api}=login(t);api.settings();assert.equal(doc.querySelector('#cloud-auth-status').hidden,true);
 w.dispatchEvent(new w.StorageEvent('storage',{key:'imperium-v1'}));
 assert.match(doc.querySelector('#cloud-auth-status').textContent,/anderen Tab/);assert.equal(doc.querySelector('[value="login"]').disabled,true);assert.equal(doc.querySelector('[data-action="login-reload"]').hidden,false);
});

test('Login progress and errors are visible in the modal; failures preserve fields and allow retry',async t=>{
 const {w,doc,api}=login(t);let reject;api.attach({user:null,signIn:()=>new Promise((_,r)=>reject=r)});api.settings();const form=doc.querySelector('#cloud-auth-form');submit(w,form);
 assert.equal(form.getAttribute('aria-busy'),'true');assert.match(doc.querySelector('#cloud-auth-status').textContent,/Anmeldung wird geprüft/);assert.equal(form.querySelector('[value="login"]').disabled,true);
 reject(Error('Passwort nicht korrekt. <Fehler>'));await tick();
 const status=doc.querySelector('#cloud-auth-status');assert.equal(status.hidden,false);assert.equal(status.getAttribute('role'),'alert');assert.equal(status.textContent,'Passwort nicht korrekt. <Fehler>');assert.equal(status.children.length,0);assert.equal(form.elements.email.value,'commander@example.test');assert.equal(form.querySelector('[value="login"]').disabled,false);assert.equal(form.hasAttribute('aria-busy'),false);
});

test('Successful login still loads the account and closes the modal',async t=>{
 const {w,doc,api}=login(t);const remote=structuredClone(api.state()),cloud={user:null,revision:1,loaded:true,async signIn(){this.user={id:'a',email:'commander@example.test'};},async load(){return remote;}};api.attach(cloud);api.settings();submit(w,doc.querySelector('#cloud-auth-form'));await tick();
 assert.equal(doc.querySelector('dialog'),null);assert.equal(api.state().name,remote.name);
});
