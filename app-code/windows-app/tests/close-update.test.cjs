'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { finishClose } = require('../lib/close-update');
function scenario(overrides = {}) {
    const events = [];
    const options = { updater: { quitAndInstall: (...args) => events.push(['install', ...args]) }, state: 'ready', portable: false, restart: false,
        quit: () => events.push(['quit']), relaunch: () => events.push(['relaunch']), onError: e => events.push(['error', e.message]), ...overrides };
    finishClose(options);
    return events;
}
test('ready update installs silently during close without reopening unexpectedly', () => {
    assert.deepEqual(scenario(), [['install', true, false], ['quit']]);
});
test('explicit restart reopens after silent install', () => {
    assert.deepEqual(scenario({ restart: true }), [['install', true, true], ['quit']]);
});
test('portable and incomplete downloads never invoke setup', () => {
    assert.deepEqual(scenario({ portable: true }), [['quit']]);
    assert.deepEqual(scenario({ state: 'downloading' }), [['quit']]);
    assert.deepEqual(scenario({ updater: null, restart: true }), [['relaunch'], ['quit']]);
});
test('installer launch failure still completes close', () => {
    assert.deepEqual(scenario({ updater: { quitAndInstall() { throw Error('blocked'); } } }), [['error', 'blocked'], ['quit']]);
});
