import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {planetImagePath,BUILDINGS,TECHS} from '../src/config.js';

test('Shared planets keep a stable type-correct mix of original and new art without modifying save data',()=>{
 for(const [base,family] of Object.entries({home:'continental',ferrum:'rock',nereus:'ice',thalassa:'ocean'})){
  assert.equal(planetImagePath({id:base}),`./assets/${base}.webp`);
  const seen=new Set();
  for(let slot=1;slot<=10;slot++){
   const p={id:`g-helion-p${slot}`,image:base},snapshot=structuredClone(p),path=planetImagePath(p);
   assert.equal(planetImagePath(structuredClone(p)),path);
   assert.deepEqual(p,snapshot);
   assert.ok(path===`./assets/${base}.webp`||new RegExp(`/planets-v2/${family}-v[123]\\.webp$`).test(path));
   assert.ok(existsSync(path));seen.add(path);
  }
  assert.equal(seen.size,4);
 }
 assert.equal(planetImagePath({id:'home',image:'../../secret'}),'./assets/home.webp');
});

test('Every building and research image is present',()=>{
 for(const [folder,items] of Object.entries({buildings:BUILDINGS,research:TECHS}))for(const key of Object.keys(items))assert.ok(existsSync(`assets/buildings-research-v1/${folder}/${key}.webp`));
});
