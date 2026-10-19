'use strict';
// Stages dist/ into releases/station-<version>/ for upload. Works without a code-signing certificate:
// the signature status is recorded honestly as "NotSigned" in release.json.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const dist = path.join(root, 'dist');
const setup = `VenQore-Station-Setup-${version}.exe`;
const portable = `VenQore-Station-${version}-Portable.exe`;
const hash = (f, a, enc = 'hex') => crypto.createHash(a).update(fs.readFileSync(f)).digest(enc);
const feed = yaml.load(fs.readFileSync(path.join(dist, 'latest.yml'), 'utf8'));
const bytes = fs.statSync(path.join(dist, setup)).size;
const entry = feed.files?.find(f => f.url === setup);
if (feed.version !== version || feed.path !== setup || entry?.size !== bytes || entry.sha512 !== hash(path.join(dist, setup), 'sha512', 'base64')) throw new Error('latest.yml does not match the installer');
const out = path.resolve(root, '../../releases', `station-${version}`);
if (fs.existsSync(out)) throw new Error(`Refusing to overwrite ${out}`);
fs.mkdirSync(out, { recursive: true });
for (const f of [setup, `${setup}.blockmap`, portable]) fs.copyFileSync(path.join(dist, f), path.join(out, f));
fs.copyFileSync(path.join(dist, 'latest.yml'), path.join(out, 'latest.yml'));
fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify({
    name: 'VenQore Station for Windows', version, release_date: new Date().toISOString().slice(0, 10),
    installer_url: `/downloads/station/${setup}`, bytes, file_size: `${(bytes / 1048576).toFixed(1)} MiB`,
    sha256: hash(path.join(dist, setup), 'sha256'), signature: { status: 'NotSigned', publisher: null },
    min_os: 'Windows 10 build 19045+ / Windows 11, x64', status: 'stable', is_live: true,
}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'checksums.json'), JSON.stringify(Object.fromEntries([setup, `${setup}.blockmap`, portable, 'latest.yml'].map(f => [f, hash(path.join(out, f), 'sha256')])), null, 2) + '\n');
console.log('Staged', out);
