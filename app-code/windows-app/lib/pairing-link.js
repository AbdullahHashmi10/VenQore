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
module.exports = { parsePairingLink, storeSlugFromInput };
