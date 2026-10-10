'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    isGoogleOAuthProviderUrl,
    isGoogleOAuthStartUrl,
    isGoogleOAuthCallbackUrl,
} = require('../lib/oauth-navigation');

const trusted = new Set(['https://venqore.com', 'https://www.venqore.com']);

test('Google OAuth navigation admits only the exact accounts origin', () => {
    assert.equal(isGoogleOAuthProviderUrl('https://accounts.google.com/o/oauth2/v2/auth?client_id=x'), true);
    assert.equal(isGoogleOAuthProviderUrl('http://accounts.google.com/o/oauth2/auth'), false);
    assert.equal(isGoogleOAuthProviderUrl('https://google.com/search'), false);
    assert.equal(isGoogleOAuthProviderUrl('https://accounts.google.com.evil.example/o/oauth2/auth'), false);
});

test('Google OAuth start and callback must return through VenQore', () => {
    assert.equal(isGoogleOAuthStartUrl('https://www.venqore.com/auth/google', trusted), true);
    assert.equal(isGoogleOAuthCallbackUrl('https://venqore.com/auth/google/callback?code=x&state=y', trusted), true);
    assert.equal(isGoogleOAuthStartUrl('https://example.com/auth/google', trusted), false);
    assert.equal(isGoogleOAuthCallbackUrl('https://accounts.google.com/auth/google/callback', trusted), false);
});
