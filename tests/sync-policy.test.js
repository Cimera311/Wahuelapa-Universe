import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldSyncCloud,NORMAL_SYNC_MS,ACTIVE_PVP_SYNC_MS} from '../src/sync-policy.js';

test('idle authoritative sessions sync no more than every 30 seconds',()=>{
 const idle={authoritative:true,now:100_000,lastAttempt:70_001};
 assert.equal(shouldSyncCloud(idle),false);
 assert.equal(shouldSyncCloud({...idle,lastAttempt:70_000}),true);
 assert.equal(NORMAL_SYNC_MS,30_000);
});
test('active incoming and outgoing PvP keeps the 15-second refresh',()=>{
 const idle={authoritative:true,now:100_000,lastAttempt:85_000};
 assert.equal(shouldSyncCloud(idle),false);
 for(const pvp of [{outgoing:[{id:'attack'}]},{incoming:[{id:'warning'}]}]){
  assert.equal(shouldSyncCloud({...idle,pvp}),true);
  assert.equal(shouldSyncCloud({...idle,pvp,lastAttempt:85_001}),false);
 }
 assert.equal(ACTIVE_PVP_SYNC_MS,15_000);
});
test('hidden authoritative tabs stop polling, foreground catches up immediately when due',()=>{
 const session={authoritative:true,now:100_000,lastAttempt:1,pvp:{outgoing:[{id:'attack'}]}};
 assert.equal(shouldSyncCloud({...session,hidden:true}),false);
 assert.equal(shouldSyncCloud({...session,hidden:false}),true);
 assert.equal(shouldSyncCloud({...session,hidden:false,lastAttempt:99_999}),false);
});
test('legacy dirty saves remain eligible, even when the tab is hidden',()=>{
 const legacy={authoritative:false,dirty:true,now:100_000,lastAttempt:70_000};
 assert.equal(shouldSyncCloud({...legacy,hidden:true}),true);
 assert.equal(shouldSyncCloud({...legacy,dirty:false}),false);
});
