/**
 * The till's offline / uncertain sale queue (sale-reliability plan §4).
 *
 * Every queued row is a CHECKOUT INTENT: the exact request body, the receipt
 * key (idempotency_key) created before the first request, and the store and
 * cashier it belongs to. Rules:
 *  - a row is only ever sent to the store it was rung in — never the store
 *    that happens to be open now; a row with no owner is quarantined;
 *  - a row is 'synced' only on a canonical success that names a sale;
 *  - a definitive rejection waits for a person (no retry loop);
 *  - an unknown outcome (timeout, 5xx, HTML) is reconciled by asking the
 *    server about the SAME key, then resent with the same key — never a new one;
 *  - nothing unresolved is ever deleted: it can be exported or marked resolved
 *    by a person, and the original row is kept.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { db, isOnline } from '@/Utils/db';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export const QUEUE_PAYLOAD_VERSION = 2;
/* Payload versions this build knows how to send. Anything else (a row written
   by a NEWER build, or an old row with no version) is held for review — never
   posted on a guess. Add a version here only with an explicit adapter. */
export const SENDABLE_PAYLOAD_VERSIONS = [2];

/** Row states. Only SENDABLE states are picked up automatically. */
export const QUEUE_STATES = {
    PENDING: 'pending',               // never confirmed; safe to (re)send with its key
    UNCERTAIN: 'uncertain',           // sent, outcome unknown — check status, then resend same key
    AWAITING_AUTH: 'awaiting_auth',   // 401/403/419 — retried after sign-in
    NEEDS_ATTENTION: 'needs_attention', // definitive rejection — a person must correct it
    CONFLICT: 'conflict',             // key already used for different content
    QUARANTINED: 'quarantined',       // no store identity / no receipt key / unknown version
    SYNCED: 'synced',
    RESOLVED: 'resolved',             // closed by a person; row kept for audit
};
const SENDABLE = [QUEUE_STATES.PENDING, QUEUE_STATES.UNCERTAIN, QUEUE_STATES.AWAITING_AUTH];
const UNRESOLVED = [...SENDABLE, QUEUE_STATES.NEEDS_ATTENTION, QUEUE_STATES.CONFLICT, QUEUE_STATES.QUARANTINED];

const REQUEST_TIMEOUT_MS = 30000;
const CLAIM_MS = 90000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;

/* One sync at a time per tab (a React state flag is not a lock: every render
   captures its own copy). Cross-tab exclusion uses the Web Locks API where the
   browser has it; the server's unique (store, key) index is the final guard. */
let tabSyncRunning = false;

/* Reconnect telemetry: counts and ages only, at most every few minutes
   unless something changed. */
const TELEMETRY_MIN_INTERVAL_MS = 5 * 60 * 1000;
const TELEMETRY_IDLE_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastTelemetry = { at: 0, signature: '' };

/** Tests only: forget the last telemetry report. */
export function resetQueueTelemetry() {
    lastTelemetry = { at: 0, signature: '' };
}

/** A random id for this browser, kept in localStorage (never personal data). */
export function tillDeviceId() {
    try {
        let id = window.localStorage.getItem('vq-till-device-id');
        if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
            id = 'dev_' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 0x100000000).toString(36)).join('');
            window.localStorage.setItem('vq-till-device-id', id);
        }
        return id;
    } catch {
        return null; // private mode / storage blocked: no telemetry, nothing else changes
    }
}

/** Summary of this store's unresolved rows: { counts, oldest_age_seconds }. */
export function summarizeQueue(rows, now = Date.now()) {
    const counts = {};
    let oldest = null;
    for (const r of rows) {
        counts[r.status] = (counts[r.status] || 0) + 1;
        const t = new Date(r.created_at).getTime();
        if (Number.isFinite(t) && (oldest === null || t < oldest)) oldest = t;
    }
    return { counts, oldest_age_seconds: oldest === null ? null : Math.max(0, Math.round((now - oldest) / 1000)) };
}

export function newIntentKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${hex()}-${hex()}${hex()}${hex()}`;
}

function backoffMs(attempts, retryAfterSeconds) {
    if (retryAfterSeconds > 0) return Math.min(retryAfterSeconds * 1000, MAX_BACKOFF_MS);
    const base = Math.min(MAX_BACKOFF_MS, 30000 * 2 ** Math.max(0, attempts - 1));
    return Math.round(base * (0.75 + Math.random() * 0.5)); // jitter
}

/** What the server said, as a queue decision. Exported for tests and FOH. */
export function classifyOutcome({ response, error, intentKey }) {
    if (response) {
        const data = response.data;
        if (typeof data !== 'object' || data === null) {
            // 200 with an HTML page (login redirect, proxy error) is not a sale.
            return { state: QUEUE_STATES.UNCERTAIN, message: 'The server answered with a page, not a sale. Will check again.' };
        }
        if (data.success === true && (data.sale_id || data.id)) {
            // A contract-v2 server always echoes the receipt key. A success that
            // names no key, or another key, is not proof THIS sale was recorded:
            // check it again by its own key instead of trusting it.
            if (intentKey && data.idempotency_key !== intentKey) {
                return { state: QUEUE_STATES.UNCERTAIN, message: data.idempotency_key
                    ? 'The server confirmed a different receipt key. Will check this sale again by its own key.'
                    : 'The server did not echo the receipt key. Will check this sale again by its key.' };
            }
            return { state: QUEUE_STATES.SYNCED, sale: data };
        }
        if (response.status === 202 || data.status === 'pending_approval') {
            return { state: QUEUE_STATES.NEEDS_ATTENTION, message: data.message || 'Sent for approval — check Approvals.' };
        }
        return { state: QUEUE_STATES.NEEDS_ATTENTION, message: data.message || 'The server did not confirm this sale.' };
    }
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = (data && typeof data === 'object' && (data.message || data.error)) || error?.message || 'Unknown error';
    if (!status) return { state: QUEUE_STATES.UNCERTAIN, message: `No answer (${message}). Will check with the same receipt key.` };
    if (status === 401 || status === 403 || status === 419) return { state: QUEUE_STATES.AWAITING_AUTH, message: 'Sign in again to send this sale.' };
    if (status === 409 && data?.code === 'idempotency_conflict') return { state: QUEUE_STATES.CONFLICT, message };
    if (status === 409) return { state: QUEUE_STATES.NEEDS_ATTENTION, message };
    if (status === 429) {
        const retryAfter = parseInt(error.response.headers?.['retry-after'] || '0', 10) || 0;
        return { state: QUEUE_STATES.PENDING, message: 'Server busy — will retry.', retryAfter };
    }
    if (status >= 400 && status < 500) return { state: QUEUE_STATES.NEEDS_ATTENTION, message, code: data?.code };
    // 5xx: the sale may or may not have been written. Never "not saved".
    return { state: QUEUE_STATES.UNCERTAIN, message: `Status unconfirmed (${data?.correlation_id || 'server ' + status}). Will check with the same receipt key.` };
}

export const useOfflineSync = () => {
    const { store, auth } = usePage().props;
    const storeRef = useRef(store);
    storeRef.current = store;
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    // { [row.id]: string } — last message per row (also persisted as row.last_error)
    const [syncErrors, setSyncErrors] = useState({});
    const [storagePersisted, setStoragePersisted] = useState(null);
    const storagePersistedRef = useRef(null);
    storagePersistedRef.current = storagePersisted;

    const hasTenant = (row) => row.tenant_id !== undefined && row.tenant_id !== null;
    const hasIdentity = (row) => hasTenant(row) || !!row.store_slug;
    /* Identity that contradicts itself (this store's id with another store's
       slug, or the reverse) is never resolved by guessing either half. */
    const identityConflict = (row) => {
        const s = storeRef.current;
        if (!s || !hasTenant(row) || !row.store_slug) return false;
        return (String(row.tenant_id) === String(s.id)) !== (row.store_slug === s.slug);
    };
    const belongsHere = (row) => {
        const s = storeRef.current;
        if (!s || identityConflict(row)) return false;
        if (hasTenant(row)) return String(row.tenant_id) === String(s.id);
        if (row.store_slug) return row.store_slug === s.slug;
        return false;
    };

    const rowsIn = async (states) => {
        const out = [];
        for (const st of states) out.push(...await db.sales_queue.where('status').equals(st).toArray());
        return out;
    };

    /** Unresolved rows this till must show: this store's, plus any with no owner. */
    const getPendingSales = useCallback(async () => {
        const rows = await rowsIn(UNRESOLVED);
        return rows.filter(r => belongsHere(r) || !hasIdentity(r))
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const checkPending = useCallback(async () => {
        const rows = await getPendingSales();
        setPendingCount(rows.length);
        return rows.length;
    }, [getPendingSales]);

    const mark = async (row, changes) => {
        await db.sales_queue.update(row.id, { ...changes, claimed_until: null });
    };

    async function lookupStatus(row, key) {
        try {
            const res = await axios.get(route('store.pos.sales.intent', { store_slug: row.store_slug || storeRef.current?.slug, intentKey: key }),
                { timeout: REQUEST_TIMEOUT_MS, _skipGlobalErrorHandler: true });
            return res?.data || null;
        } catch {
            return null;
        }
    }

    async function sendOne(row, { force = false } = {}) {
        const key = row.data?.idempotency_key || row.intent_key;
        if (!hasIdentity(row) || !key) {
            await mark(row, {
                status: QUEUE_STATES.QUARANTINED,
                last_error: !hasIdentity(row)
                    ? 'This sale has no store recorded on it. It was kept; export it and check it before sending.'
                    : 'This sale has no receipt key, so it could already be on the server. Check it before sending.',
            });
            return { state: QUEUE_STATES.QUARANTINED };
        }
        if (identityConflict(row)) {
            await mark(row, { status: QUEUE_STATES.QUARANTINED, last_error: 'This sale names two different stores. It was kept; a manager must check it before it is sent.' });
            return { state: QUEUE_STATES.QUARANTINED };
        }
        if (!belongsHere(row)) return { state: 'skipped', message: 'This sale was rung in another store. Open that store to send it.' };
        // A row an owner adopted from an older till build is sent as it was
        // saved; the server's legacy path works its totals out exactly.
        if (!SENDABLE_PAYLOAD_VERSIONS.includes(row.payload_version) && !row.adopted_legacy) {
            await mark(row, {
                status: QUEUE_STATES.QUARANTINED,
                last_error: row.payload_version === undefined || row.payload_version === null
                    ? 'This sale was saved by an older version of the till. It was kept; export it and check it before sending.'
                    : `This sale was saved by a newer version of the till (format ${row.payload_version}). Update this device; the sale was kept.`,
            });
            return { state: QUEUE_STATES.QUARANTINED };
        }
        // Force Sync (a person pressed it) does not wait out the back-off.
        if (!force && row.next_retry_at && new Date(row.next_retry_at).getTime() > Date.now()) {
            return { state: 'skipped', message: `Waiting to retry at ${new Date(row.next_retry_at).toLocaleTimeString()}. Press Force Sync to send it now.` };
        }
        if (row.claimed_until && new Date(row.claimed_until).getTime() > Date.now()) {
            return { state: 'skipped', message: 'Being sent right now (by this or another tab). Check again in a minute.' };
        }

        await db.sales_queue.update(row.id, { claimed_until: new Date(Date.now() + CLAIM_MS) });
        const attempts = (row.attempt_count || 0) + 1;

        // A previous attempt may have reached the books: ask before resending.
        if (row.status === QUEUE_STATES.UNCERTAIN && typeof route === 'function') {
            let known = null;
            try { known = await lookupStatus(row, key); } catch { known = null; }
            if (known?.outcome === 'committed' && known.sale_id && known.idempotency_key === key) {
                await mark(row, { status: QUEUE_STATES.SYNCED, synced_at: new Date(), sale_id: known.sale_id, server_response: known, last_error: null });
                return { state: QUEUE_STATES.SYNCED };
            }
        }

        let decision;
        try {
            const response = await axios.post(
                route('store.pos.sales.store', { store_slug: row.store_slug || storeRef.current.slug }),
                /* The sale belongs to the moment it was rung, not the day it is
                   delivered: the occurrence time travels with it (the server keeps
                   it apart from its own receipt time; closed periods still refuse). */
                { ...row.data, idempotency_key: key, occurred_at: row.data?.occurred_at ?? row.occurred_at },
                { timeout: REQUEST_TIMEOUT_MS, _skipGlobalErrorHandler: true },
            );
            decision = classifyOutcome({ response, intentKey: key });
        } catch (error) {
            decision = classifyOutcome({ error, intentKey: key });
        }

        const base = { attempt_count: attempts, last_attempt_at: new Date() };
        if (decision.state === QUEUE_STATES.SYNCED) {
            await mark(row, { ...base, status: QUEUE_STATES.SYNCED, synced_at: new Date(), sale_id: decision.sale.sale_id || decision.sale.id, server_response: decision.sale, last_error: null });
        } else {
            const retry = SENDABLE.includes(decision.state)
                ? new Date(Date.now() + backoffMs(attempts, decision.retryAfter || 0))
                : null;
            await mark(row, { ...base, status: decision.state, last_error: decision.message, last_error_code: decision.code || null, next_retry_at: retry });
        }
        return decision;
    }

    // Sync function
    const syncPendingSales = async ({ force = false } = {}) => {
        if (!isOnline() || tabSyncRunning) return 0;
        tabSyncRunning = true;
        setIsSyncing(true);
        let syncedCount = 0;
        const newErrors = {};
        const run = async () => {
            const rows = await rowsIn(SENDABLE);
            for (const row of rows) {
                try {
                    const d = await sendOne(row, { force: force === true });
                    if (d.state === QUEUE_STATES.SYNCED) syncedCount++;
                    else if (d.message) newErrors[row.id] = d.message;
                } catch (e) {
                    // A storage failure on one row never stops the next one.
                    console.error('Sync failed for queued sale', row.id, e);
                    newErrors[row.id] = e?.message || 'Could not update this queued sale.';
                }
            }
        };
        try {
            const locks = typeof navigator !== 'undefined' ? navigator.locks : null;
            if (locks?.request) {
                await locks.request(`vq-sales-queue-${storeRef.current?.id ?? 'none'}`, { ifAvailable: true }, async (lock) => {
                    if (lock) { await run(); return; }
                    // Another tab of this till holds the queue: say so instead of doing nothing.
                    for (const row of await rowsIn(SENDABLE)) newErrors[row.id] = 'Another POS tab on this device is sending the queue. Close the other tabs and press Force Sync again.';
                });
            } else {
                await run();
            }
        } finally {
            tabSyncRunning = false;
            setSyncErrors(prev => ({ ...prev, ...newErrors }));
            setIsSyncing(false);
            setLastSyncTime(new Date());
            checkPending().catch(() => {});
            reportRef.current?.();
        }
        return syncedCount;
    };
    const syncRef = useRef(syncPendingSales);
    syncRef.current = syncPendingSales;

    /* Tell the server what this till still holds (after every sync and on
       reconnect). Fire and forget: a failure here never touches the queue. */
    const reportQueueStatus = async () => {
        try {
            const s = storeRef.current;
            if (!isOnline() || !s?.slug || typeof route !== 'function') return;
            const device_id = tillDeviceId();
            if (!device_id) return;
            const rows = (await rowsIn(UNRESOLVED)).filter(belongsHere);
            const summary = summarizeQueue(rows);
            const signature = JSON.stringify([s.id, summary.counts, storagePersistedRef.current]);
            const now = Date.now();
            // An empty queue that has not changed is re-reported rarely.
            const minGap = rows.length ? TELEMETRY_MIN_INTERVAL_MS : TELEMETRY_IDLE_INTERVAL_MS;
            if (signature === lastTelemetry.signature && now - lastTelemetry.at < minGap) return;
            lastTelemetry = { at: now, signature };
            await axios.post(route('store.pos.queue-status', { store_slug: s.slug }), {
                device_id, counts: summary.counts, oldest_age_seconds: summary.oldest_age_seconds,
                storage_persisted: storagePersistedRef.current, client_build: `queue-v${QUEUE_PAYLOAD_VERSION}`,
            }, { timeout: 10000, _skipGlobalErrorHandler: true });
        } catch {
            // telemetry is best effort
        }
    };
    const reportRef = useRef(reportQueueStatus);
    reportRef.current = reportQueueStatus;

    // Auto-sync when online
    useEffect(() => {
        checkPending().catch(() => {});
        const handleOnline = () => syncRef.current();
        window.addEventListener('online', handleOnline);
        const interval = setInterval(() => { if (isOnline()) syncRef.current(); }, 60000);
        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(interval);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /** Ask the browser to keep queued sales through storage pressure (best effort). */
    const ensurePersistentStorage = async () => {
        try {
            if (!navigator?.storage?.persist) { setStoragePersisted(null); return null; }
            const already = await navigator.storage.persisted?.();
            const granted = already || await navigator.storage.persist();
            setStoragePersisted(!!granted);
            return !!granted;
        } catch {
            setStoragePersisted(false);
            return false;
        }
    };

    /**
     * Persist a checkout intent. `meta.status` is 'pending' (never sent) or
     * 'uncertain' (sent; the answer was lost). Resolves the row id, or false
     * when the device could not store it — the caller must then NOT claim the
     * sale was saved.
     */
    const saveOfflineSale = async (saleData, meta = {}) => {
        const s = storeRef.current;
        const key = saleData?.idempotency_key || meta.intentKey;
        if (!s?.id || !key) {
            console.error('Refusing to queue a sale without a store or receipt key');
            return false;
        }
        try {
            const id = await db.sales_queue.add({
                data: { ...saleData, idempotency_key: key },
                intent_key: key,
                tenant_id: s.id,
                store_slug: s.slug,
                user_id: auth?.user?.id ?? null,
                payload_version: QUEUE_PAYLOAD_VERSION,
                occurred_at: saleData.occurred_at || new Date().toISOString(),
                timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })(),
                created_at: new Date(),
                status: meta.status || QUEUE_STATES.PENDING,
                attempt_count: meta.attempted ? 1 : 0,
                last_error: meta.error || null,
            });
            ensurePersistentStorage();
            await checkPending();
            if (isOnline() && (meta.status || QUEUE_STATES.PENDING) === QUEUE_STATES.PENDING) syncPendingSales();
            return id ?? true;
        } catch (error) {
            console.error('Failed to save offline sale:', error);
            return false;
        }
    };

    /**
     * Persist a checkout intent BEFORE the first request (online checkout).
     * It is saved as 'uncertain' and claimed for CLAIM_MS so the background
     * loop leaves the live request alone; if the tab dies mid-request, the loop
     * later asks the server about this key and resends it with the same key.
     * Resolves the row id, or false if the device could not store it.
     */
    const beginIntent = async (saleData) => {
        const s = storeRef.current;
        const key = saleData?.idempotency_key;
        if (!s?.id || !key) return false;
        try {
            const id = await db.sales_queue.add({
                data: saleData, intent_key: key, tenant_id: s.id, store_slug: s.slug,
                user_id: auth?.user?.id ?? null, payload_version: QUEUE_PAYLOAD_VERSION,
                occurred_at: saleData.occurred_at || new Date().toISOString(),
                timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })(),
                created_at: new Date(), status: QUEUE_STATES.UNCERTAIN, attempt_count: 1,
                claimed_until: new Date(Date.now() + CLAIM_MS),
            });
            return id ?? false;
        } catch (error) {
            console.error('Could not persist the checkout intent:', error);
            return false;
        }
    };

    /** Record what the live request concluded for an intent saved by beginIntent. */
    const settleIntent = async (id, { state, sale = null, message = null, note = null }) => {
        if (!id) return;
        try {
            const changes = { status: state, claimed_until: null, last_attempt_at: new Date(), last_error: message };
            if (state === QUEUE_STATES.SYNCED) Object.assign(changes, { synced_at: new Date(), sale_id: sale?.sale_id || sale?.id || null, server_response: sale });
            if (state === QUEUE_STATES.RESOLVED) Object.assign(changes, { resolved_at: new Date(), resolution_note: note || message });
            if (state === QUEUE_STATES.UNCERTAIN) changes.next_retry_at = new Date(Date.now() + backoffMs(1, 0));
            await db.sales_queue.update(id, changes);
        } catch (error) {
            console.error('Could not update the checkout intent:', error);
        }
        checkPending().catch(() => {});
    };

    /** Close an unresolved row by a person's decision. The row is kept. */
    const resolvePendingSale = async (id, note = '') => {
        await db.sales_queue.update(id, { status: QUEUE_STATES.RESOLVED, resolved_at: new Date(), resolution_note: note, resolved_by: auth?.user?.id ?? null });
        await checkPending();
    };

    /** Put a quarantined/needs-attention row back in the send queue (same key). */
    const retryPendingSale = async (id) => {
        await db.sales_queue.update(id, { status: QUEUE_STATES.UNCERTAIN, next_retry_at: null });
        await checkPending();
        return syncPendingSales();
    };

    /** This store's unresolved sales only, as a JSON string for a controlled export. */
    const exportUnresolved = async () => {
        const rows = (await rowsIn(UNRESOLVED)).filter(belongsHere);
        return JSON.stringify({ exported_at: new Date().toISOString(), store: { id: storeRef.current?.id, slug: storeRef.current?.slug }, rows }, null, 2);
    };

    /**
     * Rows on this device that name NO store (saved by old builds). They cannot
     * be attributed, so they are never mixed into a store export; the caller
     * must restrict this to an owner/manager.
     */
    const exportUnassigned = async () => {
        const rows = (await rowsIn(UNRESOLVED)).filter(r => !hasIdentity(r));
        return JSON.stringify({ exported_at: new Date().toISOString(), unassigned: true, rows }, null, 2);
    };

    /**
     * An owner/manager confirms that a sale saved by an older till build (no
     * store recorded on it) belongs to THIS store. It is then sent like any
     * other, with its own receipt key — or, if it never had one, a new key the
     * person accepted after checking the Sales list. The original row is kept.
     */
    const adoptUnassigned = async (id, { newKey = null } = {}) => {
        const s = storeRef.current;
        const row = await db.sales_queue.get(id);
        if (!s?.id || !row) return false;
        const key = row.data?.idempotency_key || row.intent_key || newKey;
        if (!key) return false;
        await db.sales_queue.update(id, {
            tenant_id: s.id, store_slug: s.slug, intent_key: key,
            data: { ...row.data, idempotency_key: key },
            adopted_legacy: !SENDABLE_PAYLOAD_VERSIONS.includes(row.payload_version),
            adopted_by: auth?.user?.id ?? null, adopted_at: new Date(),
            status: QUEUE_STATES.PENDING, next_retry_at: null, claimed_until: null, last_error: null,
        });
        await checkPending();
        return true;
    };

    /** @deprecated Unresolved sales are never deleted; kept so old callers mark them resolved. */
    const deletePendingSale = async (id) => resolvePendingSale(id, 'Removed from the list by the cashier');

    return {
        isSyncing,
        pendingCount,
        lastSyncTime,
        syncErrors,
        storagePersisted,
        checkPending,
        saveOfflineSale,
        beginIntent,
        settleIntent,
        syncPendingSales,
        getPendingSales,
        resolvePendingSale,
        retryPendingSale,
        exportUnresolved,
        exportUnassigned,
        adoptUnassigned,
        deletePendingSale,
    };
};
