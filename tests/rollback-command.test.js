import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('rollback archive is exactly deployed v45 and live flight factor remains 3',()=>{
 const root='supabase/rollback/2026-10-27-v45',a=readFileSync(root+'/game-command.ts'),b=readFileSync(root+'/game-command.txt');
 assert.deepEqual(a,b);
 const meta=JSON.parse(readFileSync(root+'/deployment.json','utf8'));
 assert.equal(meta.project_id,'qavlbxbkhahjbpgcmazd');assert.equal(meta.version,45);assert.equal(meta.verify_jwt,false);
 assert.equal(createHash('sha256').update(a).digest('hex'),meta.source_sha256);
 assert.match(readFileSync('src/realm-config.js','utf8'),/galaxyFlightTimeFactor:\s*3,/);
});
test('rollback keeps project/auth fixed and rejects corrupt backup before CLI',{skip:process.platform!=='win32'},()=>{
 const dir=mkdtempSync(join(tmpdir(),'wahuelapa-rollback-test-')),scripts=join(dir,'scripts'),backup=join(dir,'supabase/rollback/2026-10-27-v45');
 const quote=s=>s.replaceAll("'","''");
 try{
  mkdirSync(scripts,{recursive:true});mkdirSync(backup,{recursive:true});
  copyFileSync('scripts/rollback-server-optimization.ps1',join(scripts,'rollback-server-optimization.ps1'));
  copyFileSync('supabase/rollback/2026-10-27-v45/game-command.ts',join(backup,'game-command.ts'));
  const fixture="\n$ErrorActionPreference='Stop'\n$global:rollbackCalls=@()\nfunction fake-supabase {\n $global:rollbackCalls+=,@($args)\n if ($args[0] -eq 'functions') {\n  $workdir=$args[[array]::IndexOf($args,'--workdir')+1]\n  $file=Join-Path $workdir 'supabase\\functions\\swift-handler\\index.ts'\n  if ((Get-FileHash -LiteralPath $file).Hash.ToLowerInvariant() -ne '116aabda02d2045852480cf47ed2d6a9350d7922b7d292c5cbea52ae65e6d5d6') { throw 'Wrong rollback source' }\n }\n $global:LASTEXITCODE=0\n}\n& '__SCRIPT__' -Mode Snapshot -SupabaseCli fake-supabase\nif ($rollbackCalls.Count -ne 1) { throw 'Snapshot mode deployed a function' }\nif (($rollbackCalls[0] -join ' ') -ne 'secrets set GAME_COMMAND_SNAPSHOT=legacy GAME_COMMAND_METRICS_RATE=0 --project-ref qavlbxbkhahjbpgcmazd') { throw 'Unexpected flag/project update' }\n$global:rollbackCalls=@()\n& '__SCRIPT__' -Mode Function -SupabaseCli fake-supabase\nif ($rollbackCalls.Count -ne 2) { throw 'Full rollback must set flags before deploy' }\n$cmd=$rollbackCalls[1] -join ' '\nif ($cmd -notmatch 'functions deploy swift-handler' -or $cmd -notmatch '--project-ref qavlbxbkhahjbpgcmazd --no-verify-jwt --use-api') { throw 'Wrong deployment target or auth' }\nSet-Content -LiteralPath '__BACKUP__' -Value 'corrupt'\n$global:rollbackCalls=@();$rejected=$false\ntry { & '__SCRIPT__' -Mode Function -SupabaseCli fake-supabase } catch { $rejected=$true }\nif (!$rejected -or $rollbackCalls.Count) { throw 'Corrupt backup reached CLI' }\n$global:LASTEXITCODE=0\nWrite-Output 'MOCK_ROLLBACK_OK'\n".replaceAll('__SCRIPT__',quote(join(scripts,'rollback-server-optimization.ps1'))).replaceAll('__BACKUP__',quote(join(backup,'game-command.ts')));
  const path=join(dir,'check.ps1');writeFileSync(path,fixture);
  const r=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path],{encoding:'utf8',timeout:20000,windowsHide:true});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/MOCK_ROLLBACK_OK/);
 }finally{
  assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));assert.match(dir,/wahuelapa-rollback-test-/);
  rmSync(dir,{recursive:true,force:true});
 }
});
