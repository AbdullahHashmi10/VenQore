'use strict';
// Immutable handoff only: never uploads or silently overwrites an earlier release.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const pilot = process.argv.includes('--pilot');
const version = pkg.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A numeric release version is required');
const dist = path.join(root, 'dist');
const setup = `VenQore-Station-Setup-${version}.exe`;
const portable = `VenQore-Station-${version}-Portable.exe`;
const hash = (file, algorithm, encoding = 'hex') => crypto.createHash(algorithm).update(fs.readFileSync(file)).digest(encoding);
const feed = yaml.load(fs.readFileSync(path.join(dist, 'latest.yml'), 'utf8'));
const entry = feed.files?.find(f => f.url === setup);
const bytes = fs.statSync(path.join(dist, setup)).size;
if (feed.version !== version || feed.path !== setup || entry?.size !== bytes || entry.sha512 !== hash(path.join(dist, setup), 'sha512', 'base64') || feed.sha512 !== entry.sha512) throw new Error('Update metadata does not match installer bytes');
for (const file of [setup, `${setup}.blockmap`, portable]) if (!fs.statSync(path.join(dist, file)).size) throw new Error(`Empty artifact: ${file}`);
const signature = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(__dirname, 'inspect-signature.ps1'), '-Artifact', path.join(dist, setup)], { encoding: 'utf8', windowsHide: true }));
if (!pilot && signature.status !== 'Valid') throw new Error('Production handoff requires valid Authenticode signing. Use --pilot only for a test candidate.');
const out = path.resolve(root, '../../releases', `station-${version}${pilot ? '-pilot' : ''}`);
if (fs.existsSync(out)) throw new Error(`Refusing to overwrite ${out}`);
const manifest = {
    name: 'VenQore Station for Windows', version, release_date: new Date().toISOString().slice(0, 10),
    installer_url: `/downloads/station/${setup}`, bytes, file_size: `${(bytes / 1048576).toFixed(1)} MiB`,
    sha256: hash(path.join(dist, setup), 'sha256'), signature,
    min_os: 'Windows 10 build 19045+ / Windows 11, x64', status: pilot ? 'pilot' : 'staging', is_live: true,
};
fs.mkdirSync(out);
for (const file of [setup, `${setup}.blockmap`, portable]) fs.copyFileSync(path.join(dist, file), path.join(out, file));
fs.copyFileSync(path.join(dist, 'latest.yml'), path.join(out, pilot ? 'latest.pilot.yml' : 'latest.staging.yml'));
fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'checksums.json'), JSON.stringify(Object.fromEntries([setup, `${setup}.blockmap`, portable].map(f => [f, hash(path.join(out, f), 'sha256')])), null, 2) + '\n');
const sourceFiles = ['package.json', 'package-lock.json', 'main.js', 'preload.js', 'shell-preload.js', 'display-preload.js', 'print-payload.js', 'shell.html', 'shell.css', 'shell-renderer.js', 'customer-display.html', 'customer-display.js', ...fs.readdirSync(path.join(root, 'lib')).filter(f => f.endsWith('.js')).map(f => `lib/${f}`)];
fs.writeFileSync(path.join(out, 'source-files-sha256.json'), JSON.stringify(Object.fromEntries(sourceFiles.map(f => [f, hash(path.join(root, f), 'sha256')])), null, 2) + '\n');
fs.writeFileSync(path.join(out, 'DEPLOYMENT.txt'), [
    `Station ${version}: ${pilot ? 'PILOT ONLY' : 'STAGING CANDIDATE'}. Not approved for broad rollout.`,
    'Rehearse clean install, old-version upgrade, pairing, hardware, owner controls and safe restart on a test till.',
    'After approval: publish versioned binaries and blockmap to https://www.venqore.com/downloads/station/.',
    'Verify remote checksums, then publish release.json with the corresponding approved status.',
    'Activate latest.yml LAST, only for a signed, approved release. Revalidate latest.yml and release.json on every request.',
    'Old Stations use updates.venqore.com/station/: restore DNS/TLS and serve the same approved feed, or migrate with the setup installer.',
    'Replace the legacy /downloads/VenQore_Station_Setup.exe or redirect it to the approved installer; purge its old cache.',
    'Keep installer assets outside the web updater ZIP. Preserve user profiles, databases and server runtime state.',
].join('\n') + '\n');
console.log(JSON.stringify({ output: out, version, signature: signature.status, status: manifest.status }, null, 2));
