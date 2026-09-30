import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * useDocumentDrafts — several documents open at once, kept per document type.
 *
 * The old screens shared one draft store: opening a quotation and a sale return
 * put them in the same tab strip, and closing one closed the other. Sales
 * orders had their own; recurring templates had none at all and lost everything
 * on a reload. The namespace comes from the document spec, so a purchase can
 * never collide with a sale.
 *
 * Drafts live in sessionStorage rather than localStorage on purpose: an
 * unfinished document belongs to the shift the operator is working, not to the
 * machine forever.
 */

const keyFor = (ns) => `vqdoc_drafts_${ns}`;

const read = (ns, seed) => {
    try {
        const raw = sessionStorage.getItem(keyFor(ns));
        if (!raw) return [seed()];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length ? parsed : [seed()];
    } catch (_) { return [seed()]; }
};

const write = (ns, list) => {
    try { sessionStorage.setItem(keyFor(ns), JSON.stringify(list)); } catch (_) { /* private mode */ }
};

export default function useDocumentDrafts({ doc, seed, enabled = true }) {
    const ns = doc.drafts;
    const live = enabled && !!ns && doc.tabs !== false;

    const [list, setList] = useState(() => (live ? read(ns, seed) : [seed()]));
    const [activeId, setActiveId] = useState(() => list[0]?.id);

    useEffect(() => { if (live) write(ns, list); }, [live, ns, list]);

    /* A document whose tab was closed while it was open leaves the pointer
       dangling; fall back to the first rather than rendering nothing. */
    useEffect(() => {
        if (!list.some((x) => x.id === activeId)) setActiveId(list[0]?.id);
    }, [list, activeId]);

    const current = useMemo(
        () => list.find((x) => x.id === activeId) || list[0],
        [list, activeId],
    );

    const patch = useCallback((p) => {
        setList((prev) => prev.map((x) => (x.id === activeId ? { ...x, ...p } : x)));
    }, [activeId]);

    const add = useCallback((initial) => {
        const next = { ...seed(), ...(initial || {}) };
        setList((prev) => [...prev, next]);
        setActiveId(next.id);
        return next;
    }, [seed]);

    const close = useCallback((id) => {
        setList((prev) => {
            const rest = prev.filter((x) => x.id !== id);
            /* Never leave the operator on a screen with no document. Closing the
               last one starts a fresh one rather than emptying the page. */
            return rest.length ? rest : [seed()];
        });
    }, [seed]);

    const replace = useCallback((id, value) => {
        setList((prev) => prev.map((x) => (x.id === id ? value : x)));
    }, []);

    return { list, current, activeId, setActiveId, patch, add, close, replace, live };
}
