'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldApplyOnLaunch, nextAttempt, LAUNCH_WINDOW_MS, RETRY_AFTER_MS } = require('../lib/update-policy');

const base = { state: 'ready', version: '4.0.1', current: '4.0.0', uptimeMs: 20_000, pendingJobs: 0, enabled: true, now: 1_000_000 };

test('applies a downloaded newer update right after launch', () => {
    assert.deepEqual(shouldApplyOnLaunch(base), { apply: true, reason: 'launch' });
});
test('never applies when not downloaded, not newer or turned off', () => {
    assert.equal(shouldApplyOnLaunch({ ...base, state: 'downloading' }).apply, false);
    assert.equal(shouldApplyOnLaunch({ ...base, version: '4.0.0' }).apply, false);
    assert.equal(shouldApplyOnLaunch({ ...base, enabled: false }).reason, 'disabled');
});
test('does not interrupt a till that has been running or is printing', () => {
    assert.equal(shouldApplyOnLaunch({ ...base, uptimeMs: LAUNCH_WINDOW_MS + 1 }).reason, 'launch-window-passed');
    assert.equal(shouldApplyOnLaunch({ ...base, pendingJobs: 1 }).reason, 'printing');
});
test('stops after repeated failed attempts, retries much later', () => {
    const attempt = { version: '4.0.1', count: 2, at: base.now - 1000 };
    assert.equal(shouldApplyOnLaunch({ ...base, attempt }).reason, 'too-many-attempts');
    assert.equal(shouldApplyOnLaunch({ ...base, attempt, now: base.now + RETRY_AFTER_MS }).apply, true);
});
test('attempt counter resets for a new version', () => {
    assert.deepEqual(nextAttempt({ version: '4.0.1', count: 1, at: 5 }, '4.0.1', 10), { version: '4.0.1', count: 2, at: 10 });
    assert.deepEqual(nextAttempt({ version: '4.0.1', count: 2, at: 5 }, '4.0.2', 10), { version: '4.0.2', count: 1, at: 10 });
});
