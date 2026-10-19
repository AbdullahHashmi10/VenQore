'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isLocalOrigin } = require('../lib/env-profile');
const { parsePairingLink } = require('../lib/pairing-link');

test('local origin verification allows only loopback and private LAN addresses', () => {
    // Valid local loopback / LAN
    assert.equal(isLocalOrigin('http://127.0.0.1:8000'), true);
    assert.equal(isLocalOrigin('http://localhost:8000'), true);
    assert.equal(isLocalOrigin('http://127.0.0.1:3000'), true);
    assert.equal(isLocalOrigin('http://192.168.1.50:8000'), true);
    assert.equal(isLocalOrigin('http://10.0.0.2:8000'), true);
    assert.equal(isLocalOrigin('http://172.20.0.1:8000'), true);
    assert.equal(isLocalOrigin('http://pos.test:8000'), true);

    // Strictly forbidden: production site and public internet
    assert.equal(isLocalOrigin('https://www.venqore.com'), false);
    assert.equal(isLocalOrigin('https://venqore.com'), false);
    assert.equal(isLocalOrigin('http://venqore.com'), false);
    assert.equal(isLocalOrigin('https://updates.venqore.com'), false);
    assert.equal(isLocalOrigin('https://google.com'), false);
    assert.equal(isLocalOrigin('http://8.8.8.8'), false);
    assert.equal(isLocalOrigin('http://1.1.1.1:8000'), false);
});

test('local pairing link accepts local target and rejects public domains', () => {
    const local = 'http://127.0.0.1:8000';
    // Accepts local pairing link
    assert.deepEqual(
        parsePairingLink('http://127.0.0.1:8000/s/my-store/station-pair#code=TEST-1234', local),
        { slug: 'my-store', code: 'TEST-1234' }
    );

    // Rejects production domain when local origin is expected
    assert.equal(
        parsePairingLink('https://www.venqore.com/s/my-store/station-pair#code=TEST-1234', local),
        null
    );

    // Rejects evil lookalikes
    assert.equal(
        parsePairingLink('http://127.0.0.1.attacker.com/s/my-store/station-pair#code=TEST-1234', local),
        null
    );
});
