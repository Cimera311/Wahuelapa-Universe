import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {newGame} from '../../src/engine.js';
import {TARGETS,TECHS,vector} from '../../src/config.js';
export function ui(t,{state:initial,preferences={}}={}){
 const dom=new JSDOM('<div id="app"></div><div id="toast"></div>',{url:'https://game.test/',runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());
 Object.assign(w,{structuredClone,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},scrollTo(){}});w.Element.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const s=newGame('DOM',Date.now());s.planets.push({...structuredClone(s.planets[0]),...TARGETS[0]});for(const [k,d] of Object.entries(TECHS))s.tech[k]=d.max;for(const p of s.planets){p.buildings.warehouse=10;p.resources=vector([10000,10000,10000]);p.ships.karawane=5;p.ships.atlas=2;p.ships.falke=10;}
 w.localStorage.setItem('imperium-v1',JSON.stringify(initial||s));for(const [key,value] of Object.entries(preferences))w.localStorage.setItem(key,value);
 const files=JSON.parse(readFileSync('scripts/build.js','utf8').match(/const files=(\[[^\]]+\])/)[1].replaceAll("'",'"'));
 const source=files.map(f=>readFileSync('src/'+f+'.js','utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n').replace(/const CLOUD_CONFIG=\{\s*enabled:true/,'const CLOUD_CONFIG={enabled:false');
 w.eval(source+'\nglobalThis.fleetTest={state:()=>state,show(section){tab=section==="overview"?"overview":"fleet";fleetSection=section;render();},settings,tick,enableCloud(){CLOUD_CONFIG.enabled=true;},attach(c){cloud=c;cloudBlocked=false;},setGalaxy(data){galaxyData=data;},sync:flushCloud,render};');
 return {w,doc:w.document,api:w.fleetTest};
}
export function input(w,node,value){node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
export const tick=()=>new Promise(r=>setImmediate(r));
