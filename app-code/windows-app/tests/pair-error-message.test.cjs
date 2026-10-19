'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pairErrorMessage } = require('../lib/pairing-link');

test('a mistyped store name is reported, not "enter the pairing code"', () => {
    assert.match(pairErrorMessage({ status: 404, code: 'STORE_NOT_FOUND', error: 'ignored' }), /no store was found/i);
});

test('an expired or wrong code points at Settings → Terminals', () => {
    assert.match(pairErrorMessage({ status: 403, code: 'PAIRING_REQUIRED' }), /expired|not valid/i);
});

test('a plain 403 with no recognised code falls back to the generic message', () => {
    assert.equal(pairErrorMessage({ status: 403, code: null }), 'This terminal belongs to a different store.');
});

test('a bare 404 with no code still reports a missing store (server-side legacy path)', () => {
    assert.match(pairErrorMessage({ status: 404, code: null }), /no store was found/i);
});

test('an unrecognised failure falls back to the server-sent error text', () => {
    assert.equal(pairErrorMessage({ status: 500, error: 'Something else broke' }), 'Something else broke');
});

test('a failure with no error text at all still returns something to show', () => {
    assert.equal(pairErrorMessage({ status: 500 }), 'Pairing failed.');
});
