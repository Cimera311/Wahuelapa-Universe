import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,shipInfo} from '../src/engine.js';
import {SHIPS} from '../src/config.js';
test('robotics shorten new ship builds by 8 percent each level on the same planet',()=>{
 const s=newGame('Robotik',1800000000000),p=s.planets[0];p.buildings.shipyard=4;
 p.buildings.robotics=0;const normal=shipInfo(s,p,'falke',1).ms;
 p.buildings.robotics=1;const first=shipInfo(s,p,'falke',1).ms;
 p.buildings.robotics=5;const fifth=shipInfo(s,p,'falke',1).ms;
 assert.equal(normal,Math.ceil(SHIPS.falke.time*1000*.92**3));
 assert.equal(first,Math.ceil(SHIPS.falke.time*1000*.92**4));
 assert.equal(fifth,Math.ceil(SHIPS.falke.time*1000*.92**8));
 assert.ok(fifth<first&&first<normal);
});
test('robotics effect remains local to each planet',()=>{
 const s=newGame('Robotik',1800000000000),p=s.planets[0];p.buildings.shipyard=4;p.buildings.robotics=7;
 const second=structuredClone(p);second.id='second';second.buildings.robotics=0;s.planets.push(second);
 assert.ok(shipInfo(s,p,'falke',1).ms<shipInfo(s,second,'falke',1).ms);
});
test('robotics retain original orbital build discount',()=>{
 const s=newGame('Robotik',1800000000000),p=s.planets[0];p.buildings.orbital=3;p.buildings.robotics=3;
 const info=shipInfo(s,p,'flak',1);
 assert.equal(info.ms,Math.ceil(SHIPS.flak.time*1000*.92**(2+3)));
});
