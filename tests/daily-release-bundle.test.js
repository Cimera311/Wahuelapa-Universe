import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('Daily release Game-Command files are identical, syntax-valid and retain reconnaissance fix',()=>{
 const files=['supabase/dashboard/game-command.ts','supabase/dashboard/game-command-gesamt.txt','supabase/dashboard/game-command-werft.txt'];
 const text=files.map(f=>readFileSync(f,'utf8'));
 assert.equal(text[0],text[1]);assert.equal(text[1],text[2]);
 for(const fragment of ['daily-accept','daily-claim','dailyQuestStatus','dailyPirateBonus','dailyBonus','bonusExpiry'])assert.ok(text[0].includes(fragment),fragment);
 assert.ok(!text[0].includes('station.scan = null;'),'scan fix must not regress');
 const parse=spawnSync(process.execPath,['--check','--input-type=module'],{input:text[0],encoding:'utf8'});
 assert.equal(parse.status,0,parse.stderr);
});
test('generated HTML includes Daily Quest controls and local production badges',()=>{
 const html=readFileSync('START_HERE.html','utf8');
 for(const fragment of ['daily-pirate-accept','daily-pirate-claim','daily-bonus-badge','daily-pirate-card'])assert.ok(html.includes(fragment),fragment);
});
