import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptDailyQuest, completeDailyQuest, claimDailyQuest, dailyQuestMultiplier, dailyQuestStatus} from '../src/daily-pirate-quest.js';
const t=Date.parse('2026-11-02T08:00:00Z');
test('only victories after acceptance unlock claim',()=>{
 const q=acceptDailyQuest(null,t);
 assert.equal(dailyQuestStatus(completeDailyQuest(q,t+1000,'defender'),t+1000),'active');
 assert.equal(dailyQuestStatus(completeDailyQuest(q,t-1000,'attacker'),t),'active');
 assert.equal(dailyQuestStatus(completeDailyQuest(q,t+1000,'attacker'),t+1000),'ready');
});
test('claim validates planet and reward and rejects duplicate claim',()=>{
 const q=completeDailyQuest(acceptDailyQuest(null,t),t+1000,'attacker');
 assert.throws(()=>claimDailyQuest(q,'all','other',['home'],t+2000,null));
 assert.throws(()=>claimDailyQuest(q,'cheat','home',['home'],t+2000,null));
 const {quest,bonus}=claimDailyQuest(q,'all','home',['home'],t+2000,null);
 assert.equal(dailyQuestStatus(quest,t+2000),'claimed');
 assert.throws(()=>claimDailyQuest(quest,'metal','home',['home'],t+3000,null));
 assert.equal(dailyQuestMultiplier(bonus,'home','metal',t+5000),1.05);
 assert.equal(dailyQuestMultiplier(bonus,'other','metal',t+5000),1);
 assert.equal(dailyQuestMultiplier(bonus,'home','metal',bonus.expiresAt),1);
});
test('single-resource bonuses and active bonus guard',()=>{
 const q=completeDailyQuest(acceptDailyQuest(null,t),t+100,'attacker');
 const bonus=claimDailyQuest(q,'crystal','home',['home'],t+200,null).bonus;
 assert.equal(dailyQuestMultiplier(bonus,'home','crystal',t+300),1.09);
 assert.equal(dailyQuestMultiplier(bonus,'home','fuel',t+300),1);
 assert.throws(()=>claimDailyQuest(q,'all','home',['home'],t+201,bonus));
});
test('UTC day reset',()=>{
 const q=acceptDailyQuest(null,Date.parse('2026-11-02T23:59:00Z'));
 assert.equal(dailyQuestStatus(q,Date.parse('2026-11-03T00:00:00Z')),'available');
});
