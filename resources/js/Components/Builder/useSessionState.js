/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  useSessionState — survive a back button, not a lifetime.                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Every builder screen used to keep its answers, its step index and its
 * resolved preset in plain `useState`. That is correct for the in-app Back
 * button — nothing there ever remounted the page — but wrong for anything that
 * actually navigates: the browser's own back/forward, closing the tab and
 * reopening it, or leaving mid-flow and coming back to the same URL later. Any
 * of those does a real Inertia page visit, which throws the whole component
 * tree away and rebuilds it from nothing. The person did not experience that
 * as "starting over" — they experienced it as the product forgetting what they
 * just told it, which is the complaint that sent this file into existence.
 *
 * The fix is not clever: read `sessionStorage` once, in the state initialiser,
 * and write to it on every change. `sessionStorage` rather than `localStorage`
 * on purpose — a half-finished setup from three days ago should not resurrect
 * itself on a shared machine or a different visitor's session; a tab that is
 * still open, or was closed and reopened in the same browser session, should
 * get its progress back.
 *
 * `key` scopes the slot. Give every independent piece of state its own key
 * rather than one giant blob — a corrupt or stale value in one slot then
 * cannot take the rest of the page down with it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const memoryFallback = new Map();

function readRaw(key) {
    if (typeof window === 'undefined') return memoryFallback.get(key);
    try {
        const raw = window.sessionStorage.getItem(key);
        return raw === null ? undefined : raw;
    } catch (e) {
        /* Private mode, blocked storage, storage full — fall through. */
        return memoryFallback.get(key);
    }
}

function writeRaw(key, raw) {
    if (typeof window === 'undefined') {
        memoryFallback.set(key, raw);
        return;
    }
    try {
        window.sessionStorage.setItem(key, raw);
    } catch (e) {
        memoryFallback.set(key, raw);
    }
}

function removeRaw(key) {
    memoryFallback.delete(key);
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(key);
    } catch (e) {
        /* nothing left to do */
    }
}

/**
 * Reads `storageKey` once (SSR-safe, private-mode-safe) and keeps it synced on
 * every update, exactly like `useState` otherwise.
 *
 * @param {string} storageKey  unique per page + per in-progress attempt
 * @param {*} fallback         used when nothing is stored, or storage is empty/corrupt
 * @returns {[*, Function, Function]} [value, setValue, clear]
 */
export default function useSessionState(storageKey, fallback) {
    const [value, setValue] = useState(() => {
        const raw = readRaw(storageKey);
        if (raw === undefined) return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    });

    /* Avoid writing straight back the value we just hydrated from storage on
       the very first render — harmless either way, but pointless work. */
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        try {
            writeRaw(storageKey, JSON.stringify(value));
        } catch (e) {
            /* A value that cannot serialise (shouldn't happen — this hook only
               ever holds plain data) simply does not persist this tick. */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const clear = useCallback(() => {
        removeRaw(storageKey);
    }, [storageKey]);

    return [value, setValue, clear];
}
