import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { archiveGameCommand, sha256 } from '../scripts/archive-game-command.mjs';

const archive = 'supabase/releases/game-command';
const index = JSON.parse(readFileSync(`${archive}/index.json`, 'utf8'));

test('all archived game commands retain their exact TS/TXT content and recorded checksum', () => {
  assert.equal(new Set(index.releases.map(r => r.version)).size, index.releases.length);
  assert.deepEqual(readdirSync(archive, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort(), index.releases.map(r => r.version).sort());
  for (const release of index.releases) {
    assert.match(release.version, /^\d{4}-\d{2}-\d{2}\.\d{2,}$/);
    assert.match(release.sourceCommit, /^[a-f0-9]{40}$/);
    assert.ok(Number.isFinite(Date.parse(release.createdAt)));
    const ts = readFileSync(`${archive}/${release.version}/game-command.ts`);
    assert.ok(ts.equals(readFileSync(`${archive}/${release.version}/game-command.txt`)), release.version);
    assert.equal(sha256(ts), release.sha256, release.version);
    assert.deepEqual(JSON.parse(readFileSync(`${archive}/${release.version}/release.json`, 'utf8')), release);
  }
});

test('every current dashboard bundle must have an archived release before merging', () => {
  const release = index.releases.find(r => r.version === index.latest);
  assert.ok(release, 'latest muss auf eine vorhandene Version zeigen');
  const expected = readFileSync(`${archive}/${release.version}/game-command.ts`);
  for (const file of ['game-command.ts', 'game-command-gesamt.txt', 'game-command-werft.txt']) {
    assert.ok(expected.equals(readFileSync(`supabase/dashboard/${file}`)), `${file}: Neuen Code-Stand mit npm run game-command:archive archivieren.`);
  }
});

test('release writer preserves previous versions, refuses overwrite and rejects mismatched dashboard files', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'game-command-archive-'));
  const dashboard = resolve(root, 'supabase/dashboard');
  const target = resolve(root, archive);
  try {
    mkdirSync(dashboard, { recursive: true });
    mkdirSync(target, { recursive: true });
    writeFileSync(resolve(target, 'index.json'), JSON.stringify({ format: 1, latest: null, releases: [] }));
    const names = ['game-command.ts', 'game-command-gesamt.txt', 'game-command-werft.txt'];
    for (const name of names) writeFileSync(resolve(dashboard, name), 'first');
    const commit = 'a'.repeat(40);
    archiveGameCommand(root, '2026-10-11.01', 'First version', commit);
    for (const name of names) writeFileSync(resolve(dashboard, name), 'second');
    assert.throws(() => archiveGameCommand(root, '2026-10-11.01', 'Overwrite', commit), /überschrieben/);
    assert.equal(readFileSync(resolve(target, '2026-10-11.01/game-command.txt'), 'utf8'), 'first');
    writeFileSync(resolve(dashboard, names[1]), 'mismatch');
    assert.throws(() => archiveGameCommand(root, '2026-10-11.02', 'Second version', commit), /weicht/);
    writeFileSync(resolve(dashboard, names[1]), 'second');
    archiveGameCommand(root, '2026-10-11.02', 'Second version', commit);
    const actual = JSON.parse(readFileSync(resolve(target, 'index.json'), 'utf8'));
    assert.equal(actual.latest, '2026-10-11.02');
    assert.equal(actual.releases.length, 2);
    assert.throws(() => archiveGameCommand(root, '2026-10-11.03', 'Duplicate content', commit), /bereits archiviert/);
    assert.throws(() => archiveGameCommand(root, '../escape', 'Invalid version', commit), /YYYY/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
