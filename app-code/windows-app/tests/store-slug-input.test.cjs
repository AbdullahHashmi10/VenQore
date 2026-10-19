'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { storeSlugFromInput, parsePairingLink } = require('../lib/pairing-link');

test('Store field accepts a full store URL and keeps only the store name', () => {
    assert.equal(storeSlugFromInput('my-store'), 'my-store');
    assert.equal(storeSlugFromInput('  My-Store '), 'my-store');
    assert.equal(storeSlugFromInput('https://www.venqore.com/s/my-store/pos'), 'my-store');
    assert.equal(storeSlugFromInput('https://www.venqore.com/s/my-store'), 'my-store');
    assert.equal(storeSlugFromInput('www.venqore.com/s/my-store/dashboard?x=1'), 'my-store');
    assert.equal(storeSlugFromInput('https://my-store.venqore.com/'), 'my-store');
    assert.equal(storeSlugFromInput('my-store.venqore.com'), 'my-store');
    assert.equal(storeSlugFromInput('http://127.0.0.1:8000/s/local-store/pos'), 'local-store');
    // Not a store URL: left as typed so validation rejects it.
    assert.notEqual(storeSlugFromInput('https://www.venqore.com/'), 'www');
    assert.equal(/^[a-z0-9-]{1,63}$/.test(storeSlugFromInput('https://evil.test/x')), false);
});

test('a pairing link from an untrusted host still gives no code', () => {
    assert.equal(parsePairingLink('https://evil.test/s/demo/station-pair#code=ABCD-2345'), null);
    assert.equal(storeSlugFromInput('https://evil.test/s/demo/station-pair#code=ABCD-2345'), 'demo');
});
