import test from 'node:test';
import assert from 'node:assert/strict';
import {TECHS, costAt, RES} from '../src/config.js';
import {newGame, researchInfo} from '../src/engine.js';
import {validateSave} from '../src/storage.js';

test('colonization research 7 and 8 uses exact fixed prices without changing levels 1–6', () => {
  assert.equal(TECHS.colonization.max, 8);
  for (const [level,price] of [[6,1_000_000],[7,1_500_000]]) {
    const cost=costAt(TECHS.colonization,level);
    for(const resource of RES) assert.equal(cost[resource],price);
  }
  assert.deepEqual(costAt(TECHS.colonization,5),Object.fromEntries(RES.map((key,i)=>[key,Math.ceil([350,250,100][i]*1.6**5)])));
});

test('the new two stages are available in research UI, and level 8 is the cap', () => {
  const state=newGame('Expansion',1800000000000), planet=state.planets[0];
  planet.buildings.lab=5;state.tech.scout=1;
  for(const k of ['ramjet','impulse','hyperspace'])state.tech[k]=1;
  for(const level of [6,7]){
    state.tech.colonization=level;
    const info=researchInfo(state,planet,'colonization');
    assert.equal(info.reason,'');
    for(const k of RES)assert.equal(info.cost[k],level===6?1_000_000:1_500_000);
  }
  state.tech.colonization=8;
  assert.match(researchInfo(state,planet,'colonization').reason,/Maximale/);
});

test('expanded research level remains compatible with saving', () => {
  const state=newGame('Expansion',1800000000000);
  state.tech.colonization=8;
  assert.equal(validateSave(state).tech.colonization,8);
});

test('a valid expanded empire accepts nine planets but rejects a tenth', () => {
  const state=newGame('Nine Planets',1800000000000);
  state.tech.colonization=8;
  for(let n=1;n<=8;n++) {
    const planet=structuredClone(state.planets[0]);
    planet.id=`g-aster-p${n}`;
    planet.system='g-aster';
    planet.x=100+n;
    planet.y=200+n;
    planet.slot=n;
    planet.coord=`Aster ${n}`;
    state.planets.push(planet);
  }
  assert.equal(validateSave(state).planets.length,9);
  const tenth=structuredClone(state.planets[8]);
  tenth.id='g-aster-p9';
  tenth.slot=9;
  state.planets.push(tenth);
  assert.throws(()=>validateSave(state),e=>e.rule==='SV004');
});
