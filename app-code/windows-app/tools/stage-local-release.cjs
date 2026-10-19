'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const dist = path.join(root, 'dist-local');
const setup = `VenQore-Station-Local-Setup-${version}.exe`;
const portable = `VenQore-Station-Local-${version}-Portable.exe`;
const hash = (f, a, enc = 'hex') => crypto.createHash(a).update(fs.readFileSync(f)).digest(enc);

const out = path.resolve(root, '../../releases', `station-local-${version}`);
fs.mkdirSync(out, { recursive: true });

const filesToCopy = [setup, portable];
for (const f of filesToCopy) {
    const src = path.join(dist, f);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(out, f));
    }
}

const checksums = {};
for (const f of filesToCopy) {
    const target = path.join(out, f);
    if (fs.existsSync(target)) {
        checksums[f] = hash(target, 'sha256');
    }
}

fs.writeFileSync(path.join(out, 'checksums.json'), JSON.stringify(checksums, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify({
    name: 'VenQore Station (Local Testing Edition)',
    version,
    release_date: new Date().toISOString().slice(0, 10),
    files: filesToCopy,
    checksums,
    target_environment: 'Strictly Local / Offline LAN (http://127.0.0.1:8000 by default)',
    public_site_enabled: false,
    auto_update_enabled: false,
    offline_lock_limit_days: 'Unlimited / Disabled',
    note: 'Dedicated local development and hardware testing build. Cannot connect to venqore.com or public production sites.'
}, null, 2) + '\n');

console.log('Staged local release to:', out);
