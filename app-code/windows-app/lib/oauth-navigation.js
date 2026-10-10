'use strict';

const GOOGLE_ACCOUNTS_ORIGIN = 'https://accounts.google.com';

function parseUrl(value) {
    try { return new URL(value); } catch { return null; }
}

function isGoogleOAuthProviderUrl(value) {
    const url = parseUrl(value);
    return !!url && url.origin === GOOGLE_ACCOUNTS_ORIGIN && !url.username && !url.password;
}

function isGoogleOAuthStartUrl(value, trustedOrigins) {
    const url = parseUrl(value);
    return !!url && trustedOrigins.has(url.origin) && url.pathname === '/auth/google';
}

function isGoogleOAuthCallbackUrl(value, trustedOrigins) {
    const url = parseUrl(value);
    return !!url && trustedOrigins.has(url.origin) && url.pathname === '/auth/google/callback';
}

module.exports = {
    GOOGLE_ACCOUNTS_ORIGIN,
    isGoogleOAuthProviderUrl,
    isGoogleOAuthStartUrl,
    isGoogleOAuthCallbackUrl,
};
