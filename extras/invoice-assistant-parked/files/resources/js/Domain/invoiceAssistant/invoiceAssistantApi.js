/**
 * Thin client for the conversational invoice assistant.
 *
 * Every call returns the draft/payload on success and THROWS an AssistantError
 * (never an axios error) on failure, so callers handle one shape:
 *   { code, message, fieldErrors, retryable, status, draft }
 *
 * Nothing here stores audio, transcripts or draft content in the browser.
 */

export class AssistantError extends Error {
    constructor({ code, message, fieldErrors = {}, retryable = false, status = 0, draft = null, aborted = false }) {
        super(message || 'Something went wrong.');
        this.name = 'AssistantError';
        this.code = code || 'unknown';
        this.fieldErrors = fieldErrors;
        this.retryable = retryable;
        this.status = status;
        this.draft = draft;
        this.aborted = aborted;
    }
}

/** A client-generated identity for ONE logical operation (reused on retry). */
export function newRequestId() {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) { /* fall through */ }
    return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

const PATHS = {
    config: 'invoice-assistant/config',
    create: 'invoice-assistant/drafts',
    draft: (id) => `invoice-assistant/drafts/${id}`,
    message: (id) => `invoice-assistant/drafts/${id}/messages`,
    handoff: (id) => `invoice-assistant/drafts/${id}/handoff`,
    claim: (id) => `invoice-assistant/drafts/${id}/claim`,
    applied: (id) => `invoice-assistant/drafts/${id}/applied`,
    transcribe: 'invoice-assistant/transcriptions',
};

const ROUTES = {
    config: 'store.invoice-assistant.config',
    create: 'store.invoice-assistant.drafts.store',
    draft: 'store.invoice-assistant.drafts.show',
    message: 'store.invoice-assistant.drafts.message',
    handoff: 'store.invoice-assistant.drafts.handoff',
    claim: 'store.invoice-assistant.drafts.claim',
    applied: 'store.invoice-assistant.drafts.applied',
    transcribe: 'store.invoice-assistant.transcriptions.store',
};

/** Ziggy when it knows the route, the literal store path when the route cache is stale. */
export function urlFor(kind, slug, id) {
    try {
        if (typeof route === 'function') {
            const params = id ? { store_slug: slug, draft: id } : { store_slug: slug };
            return route(ROUTES[kind], params);
        }
    } catch (_) { /* stale Ziggy cache: use the literal path */ }
    const p = PATHS[kind];
    return `/s/${slug}/${typeof p === 'function' ? p(id) : p}`;
}

function client() {
    if (typeof window !== 'undefined' && window.axios) return window.axios;
    throw new AssistantError({ code: 'no_client', message: 'The browser client is not ready.' });
}

export function toAssistantError(e) {
    if (e instanceof AssistantError) return e;
    const cancelled = e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError';
    if (cancelled) return new AssistantError({ code: 'aborted', message: 'Cancelled.', aborted: true });

    const res = e?.response;
    if (!res) {
        const timeout = e?.code === 'ECONNABORTED';
        return new AssistantError({
            code: timeout ? 'timeout' : 'network',
            message: timeout
                ? 'That took too long. Try again — nothing was saved twice.'
                : 'Could not reach the server. Check your connection and try again.',
            retryable: true,
        });
    }
    const b = res.data && typeof res.data === 'object' ? res.data : {};
    return new AssistantError({
        code: b.code || (res.status === 419 ? 'session_expired' : res.status === 429 ? 'rate_limited' : `http_${res.status}`),
        message: b.message || (res.status === 419
            ? 'Your session expired. Refresh the page and try again.'
            : res.status === 429 ? 'Too many requests. Wait a moment and try again.'
                : res.status === 403 ? 'You do not have access to the invoice assistant.'
                    : res.status >= 500 ? 'The assistant had a problem. Try again.' : 'The request could not be completed.'),
        fieldErrors: b.field_errors || b.errors || {},
        retryable: b.retryable ?? (res.status >= 500 || res.status === 429 || res.status === 408),
        status: res.status,
        draft: b.draft || null,
    });
}

async function call(fn) {
    try {
        const res = await fn();
        return res.data;
    } catch (e) {
        throw toAssistantError(e);
    }
}

const JSON_HEADERS = { Accept: 'application/json' };

export const invoiceAssistantApi = {
    getConfig: (slug, { signal } = {}) =>
        call(() => client().get(urlFor('config', slug), { headers: JSON_HEADERS, signal })),

    createDraft: (slug, { text, inputMode = 'text', requestId }, { signal } = {}) =>
        call(() => client().post(urlFor('create', slug),
            { text, input_mode: inputMode, request_id: requestId },
            { headers: JSON_HEADERS, signal, timeout: 45000 })),

    getDraft: (slug, id, { signal } = {}) =>
        call(() => client().get(urlFor('draft', slug, id), { headers: JSON_HEADERS, signal })),

    sendMessage: (slug, id, { expectedRevision, text, selections, requestId }, { signal } = {}) =>
        call(() => client().post(urlFor('message', slug, id), {
            expected_revision: expectedRevision,
            ...(text ? { text } : {}),
            ...(selections && selections.length ? { selections } : {}),
            request_id: requestId,
        }, { headers: JSON_HEADERS, signal, timeout: 45000 })),

    handoff: (slug, id, { expectedRevision, requestId }, { signal } = {}) =>
        call(() => client().post(urlFor('handoff', slug, id),
            { expected_revision: expectedRevision, request_id: requestId },
            { headers: JSON_HEADERS, signal, timeout: 30000 })),

    claim: (slug, id, { signal } = {}) =>
        call(() => client().post(urlFor('claim', slug, id), {}, { headers: JSON_HEADERS, signal })),

    acknowledge: (slug, id, claimToken, { signal } = {}) =>
        call(() => client().post(urlFor('applied', slug, id), { claim_token: claimToken }, { headers: JSON_HEADERS, signal })),

    discard: (slug, id, expectedRevision) =>
        call(() => client().delete(urlFor('draft', slug, id), {
            headers: JSON_HEADERS,
            params: expectedRevision ? { expected_revision: expectedRevision } : undefined,
        })),

    /** audio: a Blob. Sent as multipart; the server sniffs the bytes, never the type. */
    transcribe: (slug, { audio, filename, locale = 'auto', requestId }, { signal } = {}) => {
        const form = new FormData();
        form.append('audio', audio, filename || 'recording');
        form.append('locale', locale);
        form.append('request_id', requestId);
        return call(() => client().post(urlFor('transcribe', slug), form, { headers: JSON_HEADERS, signal, timeout: 60000 }));
    },
};

export default invoiceAssistantApi;
