/**
 * Builder v2 API client (BUILDER_FINAL_PLAN.md §10).
 * The browser only displays what the server returns. It never maps facts to modules.
 */

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

export async function post(path, body = {}) {
    const res = await fetch(`/workspace/discover/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
        body: JSON.stringify(body),
    });
    let data = {};
    try {
        data = await res.json();
    } catch (e) {
        data = {};
    }
    return { ok: res.ok, status: res.status, data };
}

export async function getReview(sessionId) {
    const res = await fetch(`/workspace/discover/${encodeURIComponent(sessionId)}/review`, {
        headers: { Accept: 'application/json' },
    });
    let data = {};
    try {
        data = await res.json();
    } catch (e) {
        data = {};
    }
    return { ok: res.ok, status: res.status, data };
}

export const STORE_KEY = 'vq-builder-v2';

export const remember = (obj) => {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(obj));
    } catch (e) {
        /* private window: the run simply will not survive a reload */
    }
};

export const recall = () => {
    try {
        return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    } catch (e) {
        return null;
    }
};

export const forget = () => {
    try {
        sessionStorage.removeItem(STORE_KEY);
    } catch (e) {
        /* nothing to do */
    }
};
