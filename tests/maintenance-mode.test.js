import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {maintenanceBlocked,maintenanceView} from '../src/maintenance-ui.js';

test('server status gates the game for visitors, but admins can bypass',()=>{
 assert.equal(maintenanceBlocked({checking:true,enabled:false,isAdmin:false}),true);
 assert.equal(maintenanceBlocked({checking:false,unavailable:true,enabled:false,isAdmin:false}),true);
 assert.equal(maintenanceBlocked({checking:false,enabled:true,isAdmin:false}),true);
 assert.equal(maintenanceBlocked({checking:false,enabled:true,isAdmin:true}),false);
 assert.equal(maintenanceBlocked({checking:false,enabled:false,isAdmin:false}),false);
});
test('maintenance copy escapes HTML and offers admin login',()=>{
 const html=maintenanceView({checking:false,unavailable:false,enabled:true,isAdmin:false,message:'<img src=x onerror=alert(1)>',error:''});
 assert.match(html,/Wartungsarbeiten/);
 assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/maintenance-admin-form/);
});
test('SQL guards both snapshot and commit while keeping current pirate world logic',()=>{
 const src=readFileSync('supabase/maintenance-mode.sql','utf8');
 assert.match(src,/imperium_maintenance_server_check/);
 assert.match(src,/where id for share/);
 assert.match(src,/MAINTENANCE_ACTIVE/);
 assert.match(src,/imperium_pvp_snapshot_before_pirates/);
 assert.match(src,/imperium_pvp_commit_before_pirates/);
 assert.match(src,/grant execute on function public\.imperium_maintenance_status\(\) to anon,authenticated/);
});
