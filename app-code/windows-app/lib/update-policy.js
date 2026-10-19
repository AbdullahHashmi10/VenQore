'use strict';

/**
 * When may Station install a downloaded update by itself?
 *
 * Station downloads updates silently in the background. The install happens at a moment
 * when nobody is mid-sale: when Station is opened (the first minutes after launch, before
 * the cashier has started selling) or when it is closed normally. Local data (saved sales,
 * offline queue, printers, PIN, pairing) lives in the user profile and is untouched by the
 * installer.
 */
const LAUNCH_WINDOW_MS = 4 * 60_000;   // only auto-apply this soon after Station starts
const MAX_ATTEMPTS = 2;                // per version; then leave it to the owner (no restart loops)
const RETRY_AFTER_MS = 6 * 3600_000;   // a failed attempt may be retried after this long

/**
 * @param {object} i
 * @param {string}  i.state        updater state ('ready' once downloaded)
 * @param {string}  i.version      downloaded version
 * @param {string}  i.current      running version
 * @param {number}  i.uptimeMs     time since Station started
 * @param {number}  i.pendingJobs  receipts still printing
 * @param {boolean} i.enabled      owner has not turned automatic updates off
 * @param {object}  [i.attempt]    last attempt: { version, count, at }
 * @param {number}  [i.now]
 */
function shouldApplyOnLaunch(i) {
    if (!i.enabled) return { apply: false, reason: 'disabled' };
    if (i.state !== 'ready') return { apply: false, reason: 'not-ready' };
    if (!i.version || i.version === i.current) return { apply: false, reason: 'not-newer' };
    if (i.uptimeMs > LAUNCH_WINDOW_MS) return { apply: false, reason: 'launch-window-passed' };
    if (i.pendingJobs) return { apply: false, reason: 'printing' };
    const a = i.attempt;
    const now = i.now ?? Date.now();
    if (a && a.version === i.version && a.count >= MAX_ATTEMPTS && now - a.at < RETRY_AFTER_MS) return { apply: false, reason: 'too-many-attempts' };
    return { apply: true, reason: 'launch' };
}

function nextAttempt(prev, version, now = Date.now()) {
    if (prev && prev.version === version && now - prev.at < RETRY_AFTER_MS) return { version, count: prev.count + 1, at: now };
    return { version, count: 1, at: now };
}

module.exports = { shouldApplyOnLaunch, nextAttempt, LAUNCH_WINDOW_MS, MAX_ATTEMPTS, RETRY_AFTER_MS };
