param(
 [ValidateSet('Snapshot','Function')][string]$Mode = 'Snapshot',
 [string]$SupabaseCli = 'supabase'
)
$ErrorActionPreference = 'Stop'
$projectRef = 'qavlbxbkhahjbpgcmazd'
$root = Split-Path $PSScriptRoot -Parent
$backup = Join-Path $root 'supabase\rollback\2026-10-27-v45\game-command.ts'
$expectedHash = '116aabda02d2045852480cf47ed2d6a9350d7922b7d292c5cbea52ae65e6d5d6'
if (!(Test-Path -LiteralPath $backup) -or (Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
 throw 'Live-v45-Rueckfallartefakt fehlt oder Pruefsumme weicht ab.'
}
Get-Command $SupabaseCli -ErrorAction Stop | Out-Null
# Changes only these two operating flags; preserves all other project secrets.
& $SupabaseCli secrets set 'GAME_COMMAND_SNAPSHOT=legacy' 'GAME_COMMAND_METRICS_RATE=0' --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { throw 'Legacy-Snapshot konnte nicht aktiviert werden.' }
if ($Mode -eq 'Snapshot') {
 Write-Host 'Legacy-Snapshot angefordert. Neue Anfragen und Logs pruefen; Website/Function unveraendert.'
 return
}
$stage = Join-Path ([IO.Path]::GetTempPath()) ('wahuelapa-live-rollback-' + [guid]::NewGuid())
try {
 $functionDir = Join-Path $stage 'supabase\functions\swift-handler'
 New-Item -ItemType Directory -Path $functionDir -Force | Out-Null
 [IO.File]::WriteAllText((Join-Path $stage 'supabase\config.toml'), 'project_id = "Wahuelapa"', (New-Object Text.UTF8Encoding($false)))
 Copy-Item -LiteralPath $backup -Destination (Join-Path $functionDir 'index.ts')
 # Gateway verification was false in captured v45; handler still validates getUser(token).
 & $SupabaseCli functions deploy swift-handler --workdir $stage --project-ref $projectRef --no-verify-jwt --use-api
 if ($LASTEXITCODE -ne 0) { throw 'Rueckdeployment von v45 fehlgeschlagen.' }
 Write-Host 'Gesicherter v45-Code erneut deployed (neue Deploymentnummer). Spiel pruefen; Website-PR bei Bedarf separat revertieren.'
} finally {
 if (Test-Path -LiteralPath $stage) {
  $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
  $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
  if (!$resolvedStage.StartsWith($resolvedTemp,[StringComparison]::OrdinalIgnoreCase) -or
      (Split-Path $resolvedStage -Leaf) -notlike 'wahuelapa-live-rollback-*') { throw 'Unsicherer temporaerer Pfad; nicht entfernt.' }
  Remove-Item -LiteralPath $resolvedStage -Recurse -Force
 }
}
