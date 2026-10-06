'use strict';
/**
 * Optional signed environment profile.
 * A profile is a small file that is only honoured when ALL of these hold:
 *   - its signature verifies against the public key below (the private key is not in this app),
 *   - it was issued for THIS computer (hash of the Windows machine id),
 *   - it has not expired,
 *   - the address it names is a local / private-network address.
 * Anything else — missing file, bad signature, other computer, expired, public address — is ignored
 * and Station behaves exactly as shipped.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA9Jkf0s5xI2E3SdIS0ikt4+plkiBe0zQusFmZnb4IE5Y=
-----END PUBLIC KEY-----`;
const FILE = 'profile.dat';
const MAX_DAYS = 400;

function rawMachineId() {
    try {
        if (process.platform === 'win32') {
            const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding: 'utf8', windowsHide: true, timeout: 4000 });
            const m = /MachineGuid\s+REG_SZ\s+([0-9a-f-]{16,})/i.exec(out);
            if (m) return m[1].toLowerCase();
        } else if (fs.existsSync('/etc/machine-id')) {
            return fs.readFileSync('/etc/machine-id', 'utf8').trim().toLowerCase();
        }
    } catch {}
    return null;
}
function machineHash(raw = rawMachineId()) {
    return raw ? crypto.createHash('sha256').update(`vq-profile-v1:${raw}`).digest('hex') : null;
}

/** Loopback, private ranges, and .test / .local / .localhost names. Never a public address. */
function isLocalOrigin(value) {
    let u; try { u = new URL(value); } catch { return false; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (u.username || u.password) return false;
    const h = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (h === 'localhost' || h === '::1' || /\.(test|local|localhost)$/.test(h)) return true;
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
    if (!m) return false;
    const [a, b, c, d] = m.slice(1).map(Number);
    if ([a, b, c, d].some(n => n > 255)) return false;
    return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/** → { origin, slug?, expires } or null. `dir` is where the file lives; `machine` lets tests inject an id. */
function load(dir, { now = Date.now(), machine } = {}) {
    try {
        const file = path.join(dir, FILE);
        if (!fs.existsSync(file) || fs.statSync(file).size > 4096) return null;
        const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!doc || typeof doc.payload !== 'string' || typeof doc.sig !== 'string') return null;
        const ok = crypto.verify(null, Buffer.from(doc.payload, 'base64'), crypto.createPublicKey(PUBLIC_KEY), Buffer.from(doc.sig, 'base64'));
        if (!ok) return null;
        const p = JSON.parse(Buffer.from(doc.payload, 'base64').toString('utf8'));
        if (p.v !== 1 || typeof p.m !== 'string' || typeof p.o !== 'string' || !Number.isFinite(p.e)) return null;
        const mine = machineHash(machine);
        if (!mine || p.m !== mine) return null;
        if (p.e <= now || p.e > now + MAX_DAYS * 86400000) return null;
        if (!isLocalOrigin(p.o)) return null;
        const origin = new URL(p.o).origin;
        const slug = typeof p.s === 'string' && /^[a-z0-9-]{1,80}$/i.test(p.s) ? p.s : null;
        return { origin, slug, expires: p.e };
    } catch { return null; }
}

module.exports = { load, machineHash, isLocalOrigin, FILE };
