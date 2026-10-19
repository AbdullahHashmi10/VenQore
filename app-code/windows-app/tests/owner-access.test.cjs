'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { OwnerAccess } = require('../lib/owner-access');
const { parsePairingLink } = require('../lib/pairing-link');
const { classifyWindows } = require('../lib/kiosk-readiness');

test('owner session expires, closes explicitly and does not survive process restart', () => {
    let now = 1000;
    const data = {};
    const prefs = { hasPin: () => true, verifyPin: p => p === '784269', get: k => data[k], set: p => Object.assign(data, p) };
    const gate = new OwnerAccess(prefs, () => now);
    assert.equal(gate.authorized(), false);
    assert.equal(gate.verify('784269', true).ok, true);
    assert.equal(gate.authorized(), true);
    now += 300001;
    assert.equal(gate.authorized(), false);
    gate.verify('784269', true); gate.lock();
    assert.equal(gate.authorized(), false);
    gate.verify('784269', true);
    assert.equal(new OwnerAccess(prefs, () => now).authorized(), false);
});
test('PIN lockout survives restart and correct PIN cannot bypass an active lockout', () => {
    let now = 1000;
    const data = {};
    const prefs = { hasPin: () => true, verifyPin: p => p === '784269', get: k => data[k], set: p => Object.assign(data, p) };
    const gate = new OwnerAccess(prefs, () => now);
    for (let i = 0; i < 5; i++) assert.equal(gate.verify('000000').ok, false);
    const restarted = new OwnerAccess(prefs, () => now);
    assert.equal(restarted.verify('784269', true).locked, true);
    assert.equal(restarted.authorized(), false);
    now += 60001;
    assert.equal(restarted.verify('784269', true).ok, true);
});
test('pairing link accepts exact trusted origin and fragment code only', () => {
    assert.deepEqual(parsePairingLink('https://www.venqore.com/s/demo/station-pair#code=abcd-2345'), { slug: 'demo', code: 'ABCD-2345' });
    for (const url of ['https://venqore.com.evil.test/s/demo/station-pair#code=ABCD-2345', 'http://venqore.com/s/demo/station-pair#code=ABCD-2345', 'https://evil@venqore.com/s/demo/station-pair#code=ABCD-2345', 'https://venqore.com/s/demo/station-pair?code=ABCD-2345']) assert.equal(parsePairingLink(url), null);
    assert.deepEqual(parsePairingLink('http://127.0.0.1:8000/s/local-store/station-pair#code=wxyz-7890', 'http://127.0.0.1:8000'), { slug: 'local-store', code: 'WXYZ-7890' });
    assert.equal(parsePairingLink('http://192.168.1.5:8000/s/local-store/station-pair#code=wxyz-7890', 'http://127.0.0.1:8000'), null);
});
test('Windows readiness distinguishes supported app from OS kiosk capability', () => {
    const windows = { platform: 'win32', arch: 'x64', build: 22631 };
    assert.equal(classifyWindows({ ...windows, edition: 'Core' }).method, 'unavailable');
    assert.equal(classifyWindows({ ...windows, edition: 'Professional' }).method, 'assigned-access');
    assert.equal(classifyWindows({ ...windows, edition: 'Enterprise' }).method, 'shell-launcher');
    assert.equal(classifyWindows({ ...windows, edition: 'Enterprise' }).kioskProvisioned, false);
    assert.equal(classifyWindows({ ...windows, build: 7601 }).supported, false);
});
