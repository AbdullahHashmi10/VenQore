/**
 * One answer to "can this device reach the VenQore server right now?".
 *
 * The truth is whether the SERVER answers, not whether the network adapter is up:
 *  - a till on a local or LAN server keeps working with the internet unplugged,
 *    although navigator.onLine says false (the browser only knows about adapters);
 *  - Wi-Fi with no internet, or a server that is down, leaves navigator.onLine true.
 * So navigator.onLine is only a hint that makes us check sooner. What decides is:
 *   - real requests: one that gets no answer marks the server unreachable, any answer marks it reachable;
 *   - a /ping probe (retried once; a merely slow answer is not an outage);
 *   - the Windows Station's own connection monitor when running inside Station.
 */
import { useSyncExternalStore } from 'react';

let serverReachable = true;
let adapterOffline = typeof navigator !== 'undefined' && navigator.onLine === false; // hint only
let stationOnline = true;
let started = false;
let probeTimer = null;
let probing = null;
const listeners = new Set();

const compute = () => serverReachable && stationOnline;
let snapshot = compute();

function emit() {
    const next = compute();
    if (next === snapshot) return;
    const wasOffline = snapshot === false;
    snapshot = next;
    listeners.forEach((fn) => { try { fn(); } catch { /* a listener must never break the others */ } });
    if (next && wasOffline && typeof window !== 'undefined') {
        // Things that wait for "back online" (the sale queue) listen for the browser event.
        window.dispatchEvent(new Event('online'));
    }
    schedule();
}

export function isOnline() { return snapshot; }

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function useConnectivity() {
    return useSyncExternalStore(subscribe, () => snapshot, () => true);
}

/** Called by the HTTP layer. `sameOrigin` keeps third-party failures from looking like ours. */
export function reportRequest({ ok, sameOrigin = true }) {
    if (!sameOrigin) return;
    const was = serverReachable;
    serverReachable = !!ok;
    if (was !== serverReachable) emit();
}

async function pingOnce(ms) {
    try {
        await fetch('/ping', { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(ms) });
        return 'up'; // any HTTP answer, even an error page, proves the server is reachable
    } catch (e) {
        return e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'slow' : 'down';
    }
}

export function probeNow() {
    if (typeof fetch === 'undefined') return Promise.resolve(snapshot);
    if (probing) return probing;
    probing = (async () => {
        let result = await pingOnce(5000);
        if (result === 'down') {
            await new Promise((r) => setTimeout(r, 800));
            result = await pingOnce(5000);
        }
        if (result === 'up') serverReachable = true;
        else if (result === 'down') serverReachable = false;
        else if (adapterOffline) serverReachable = false; // slow AND the adapter is down: treat as offline
        // slow while the adapter is up: a busy server is not an outage, keep the current answer
        emit();
        return snapshot;
    })().finally(() => { probing = null; });
    return probing;
}

function schedule() {
    clearTimeout(probeTimer);
    if (!started || typeof window === 'undefined') return;
    // While we think we are offline, look again every 5 s. While online, a slow 60 s check.
    probeTimer = setTimeout(async () => { await probeNow(); schedule(); }, snapshot ? 60000 : 5000);
}

export function startConnectivityMonitor() {
    if (started || typeof window === 'undefined') return;
    started = true;
    // The adapter events only make us look sooner; the server's answer decides.
    window.addEventListener('online', () => { adapterOffline = false; probeNow(); });
    window.addEventListener('offline', () => { adapterOffline = true; probeNow(); });
    try {
        // Windows Station: its main process watches the connection too.
        window.amdAPI?.onConnectionChange?.((payload) => { stationOnline = payload?.online !== false; emit(); });
    } catch { /* not in Station */ }
    if (adapterOffline) probeNow();
    schedule();
}
