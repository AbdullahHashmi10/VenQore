'use strict';

// A single pasted link supplies both fields without weakening server approval.
function parsePairingLink(value, allowedOrigin = null) {
    try {
        const u = new URL(String(value));
        const originOk = allowedOrigin
            ? u.origin === new URL(allowedOrigin).origin
            : (u.protocol === 'https:' && ['www.venqore.com', 'venqore.com'].includes(u.hostname) && !u.port);
        if (!originOk || u.username || u.password) return null;
        const m = /^\/s\/([a-z0-9-]{1,63})\/station-pair\/?$/.exec(u.pathname);
        const code = new URLSearchParams(u.hash.slice(1)).get('code') || '';
        if (!m || !/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code)) return null;
        return { slug: m[1], code: code.toUpperCase() };
    } catch { return null; }
}

// The Store field takes the store name, but owners paste whatever they copied:
// a POS address (…/s/my-store/pos), a subdomain (my-store.venqore.com) or the
// bare name. Only the store name is taken from it — never a pairing code,
// which stays limited to parsePairingLink's trusted origins.
function storeSlugFromInput(value) {
    const raw = String(value || '').trim();
    const path = /\/s\/([a-z0-9-]{1,63})(?=[/?#]|$)/i.exec(raw);
    if (path) return path[1].toLowerCase();
    if (/^[a-z0-9-]{1,63}$/i.test(raw)) return raw.toLowerCase();
    try {
        const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
        const parts = u.hostname.toLowerCase().split('.');
        if (parts.length === 3 && parts.slice(1).join('.') === 'venqore.com' && !['www', 'app', 'api'].includes(parts[0])
            && /^[a-z0-9-]{1,63}$/.test(parts[0])) return parts[0];
    } catch { /* not a URL */ }
    return raw.toLowerCase();
}
// Turns a failed pairing attempt into the one sentence shown on the pairing
// screen. Pulled out of main.js so the mapping — the thing a typo or an
// expired code actually shows the owner — has its own test, not just the
// code path it happens to run inside of.
function pairErrorMessage(r) {
    if (r.code === 'STORE_NOT_FOUND') return 'No store was found with that name. Check the store name and try again.';
    if (r.code === 'PAIRING_REQUIRED') return 'That pairing code is not valid for this store, or it has expired. Create a new one in Settings → Terminals.';
    if (r.status === 403) return 'This terminal belongs to a different store.';
    if (r.status === 404) return 'No store was found with that name.';
    return r.error || 'Pairing failed.';
}

module.exports = { parsePairingLink, storeSlugFromInput, pairErrorMessage };
