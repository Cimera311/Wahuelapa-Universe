import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function archiveGameCommand(root, version, description, sourceCommit) {
  if (!/^\d{4}-\d{2}-\d{2}\.\d{2,}$/.test(version)) throw new Error('Version muss YYYY-MM-DD.NN entsprechen.');
  if (!description?.trim()) throw new Error('Eine Beschreibung der Änderungen fehlt.');
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Quell-Commit fehlt oder ist ungültig.');
  const archive = resolve(root, 'supabase/releases/game-command');
  const target = resolve(archive, version);
  const indexPath = resolve(archive, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  if (existsSync(target) || index.releases.some(r => r.version === version)) throw new Error('Diese Version existiert bereits und darf nicht überschrieben werden.');
  const bundle = readFileSync(resolve(root, 'supabase/dashboard/game-command.ts'));
  for (const name of ['game-command-gesamt.txt', 'game-command-werft.txt']) {
    if (!bundle.equals(readFileSync(resolve(root, 'supabase/dashboard', name)))) throw new Error(`Dashboard-Datei ${name} weicht vom TS-Bundle ab.`);
  }
  const digest = sha256(bundle);
  if (index.releases.some(r => r.sha256 === digest)) throw new Error('Dieser Code-Stand ist bereits archiviert.');
  const release = { version, createdAt: new Date().toISOString(), sourceCommit, description: description.trim(), sha256: digest };
  mkdirSync(target);
  writeFileSync(resolve(target, 'game-command.ts'), bundle);
  writeFileSync(resolve(target, 'game-command.txt'), bundle);
  writeFileSync(resolve(target, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  index.releases.push(release);
  index.latest = version;
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
  return release;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const [, , version, ...words] = process.argv;
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const release = archiveGameCommand(root, version, words.join(' '), commit);
    console.log(`Archiviert: ${release.version} · SHA-256 ${release.sha256}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
