import { useCallback, useEffect, useRef, useState } from 'react';
import { invoiceAssistantApi, newRequestId, toAssistantError } from './invoiceAssistantApi';

/**
 * Conversation state for the invoice assistant.
 *
 *  - ONE operation at a time (a double click or Enter-spam cannot send twice).
 *  - A retry of the SAME operation reuses its request id, so the server returns
 *    the first result instead of doing the work again; a different input gets
 *    a new id.
 *  - A generation counter + AbortController drop any answer that arrives after
 *    the panel was reset, closed or unmounted.
 *  - Nothing is written to browser storage: the draft lives on the server.
 *
 * The hook never posts an invoice. Its last act is `handoff()`, which returns
 * the redirect the editor will claim the draft from.
 */
/** Outcomes where the server may still be working on, or already hold, the first attempt. */
const KEEP_ID_CODES = new Set(['network', 'timeout', 'still_interpreting', 'request_in_progress']);

export function useInvoiceAssistant({ slug, api = invoiceAssistantApi } = {}) {
    const [draft, setDraft] = useState(null);
    const [busy, setBusy] = useState(null);       // null | 'create' | 'message' | 'handoff'
    const [error, setError] = useState(null);     // AssistantError | null
    const [notice, setNotice] = useState(null);   // soft info, e.g. "the draft changed"

    const draftRef = useRef(null);
    const busyRef = useRef(false);
    const genRef = useRef(0);
    const abortRef = useRef(null);
    const pendingRef = useRef(null);              // { key, id }
    const mountedRef = useRef(true);

    const commitDraft = (d) => { draftRef.current = d; setDraft(d); };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            genRef.current += 1;
            abortRef.current?.abort();
        };
    }, []);

    const idFor = (key) => {
        if (pendingRef.current?.key === key) return pendingRef.current.id;
        pendingRef.current = { key, id: newRequestId() };
        return pendingRef.current.id;
    };

    /** Run one exclusive operation. */
    const run = useCallback(async (kind, key, exec) => {
        if (busyRef.current) return null;
        busyRef.current = true;
        const gen = ++genRef.current;
        const ctl = new AbortController();
        abortRef.current = ctl;
        setBusy(kind);
        setError(null);
        setNotice(null);
        try {
            const out = await exec(idFor(key), ctl.signal);
            if (gen !== genRef.current || !mountedRef.current) return null;
            pendingRef.current = null;
            // Only a draft answer replaces the draft, and only while this operation is current.
            if (kind !== 'handoff' && out && out.draft_id) commitDraft(out);
            return out;
        } catch (raw) {
            const e = toAssistantError(raw);
            if (gen !== genRef.current || !mountedRef.current || e.aborted) return null;
            // The server told us what the draft looks like now: show THAT.
            if (e.draft) {
                commitDraft(e.draft);
                if (e.code === 'stale_revision' || e.code === 'changed_since_review') pendingRef.current = null;
            }
            if (e.code === 'draft_expired' || e.code === 'draft_not_found') {
                commitDraft(null);
                pendingRef.current = null;
            }
            // Keep the request id ONLY when the outcome is unknown (the answer may
            // still exist server-side). A failure the server reported is final for
            // that id — a retry must start a fresh attempt, or it would just be
            // told "that attempt failed" forever.
            if (!KEEP_ID_CODES.has(e.code)) pendingRef.current = null;
            setError(e);
            return null;
        } finally {
            if (gen === genRef.current) {
                busyRef.current = false;
                if (mountedRef.current) setBusy(null);
            }
        }
    }, []);

    const start = useCallback((text, inputMode = 'text') => {
        const clean = String(text || '').trim();
        if (clean.length < 2) return Promise.resolve(null);
        return run('create', `create|${inputMode}|${clean}`, async (requestId, signal) => {
            const d = await api.createDraft(slug, { text: clean, inputMode, requestId }, { signal });
            return d;
        });
    }, [run, api, slug]);

    const reply = useCallback((text) => {
        const clean = String(text || '').trim();
        const cur = draftRef.current;
        if (!clean || !cur) return Promise.resolve(null);
        return run('message', `msg|${cur.draft_id}|${cur.revision}|${clean}`, async (requestId, signal) => {
            const d = await api.sendMessage(slug, cur.draft_id, { expectedRevision: cur.revision, text: clean, requestId }, { signal });
            return d;
        });
    }, [run, api, slug]);

    /** selections: [{ field, line_key?, candidate_set_id, selected_id }] */
    const choose = useCallback((selections) => {
        const cur = draftRef.current;
        if (!cur || !selections?.length) return Promise.resolve(null);
        const key = `sel|${cur.draft_id}|${cur.revision}|${JSON.stringify(selections)}`;
        return run('message', key, async (requestId, signal) => {
            const d = await api.sendMessage(slug, cur.draft_id, { expectedRevision: cur.revision, selections, requestId }, { signal });
            return d;
        });
    }, [run, api, slug]);

    /** Resolves to { redirect_url, draft_id } or null. The caller navigates. */
    const handoff = useCallback(() => {
        const cur = draftRef.current;
        if (!cur || !cur.can_handoff) return Promise.resolve(null);
        return run('handoff', `handoff|${cur.draft_id}|${cur.revision}`, async (requestId, signal) =>
            api.handoff(slug, cur.draft_id, { expectedRevision: cur.revision, requestId }, { signal }));
    }, [run, api, slug]);

    /** Throw the draft away (server drops its content) and start over. */
    const discard = useCallback(async () => {
        const cur = draftRef.current;
        genRef.current += 1;
        abortRef.current?.abort();
        busyRef.current = false;
        pendingRef.current = null;
        commitDraft(null);
        setBusy(null);
        setError(null);
        setNotice(null);
        if (cur) {
            try { await api.discard(slug, cur.draft_id, cur.revision); } catch (_) { /* it expires on its own */ }
        }
    }, [api, slug]);

    const clearError = useCallback(() => setError(null), []);

    return { draft, busy, error, notice, start, reply, choose, handoff, discard, clearError };
}

export default useInvoiceAssistant;
