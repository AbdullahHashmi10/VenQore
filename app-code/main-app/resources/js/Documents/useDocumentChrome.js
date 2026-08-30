import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    LAYOUTS, LEVELS, DEFAULT_COMP, SPLIT_MIN, SPLIT_MAX, ALL_HEADER,
    composeDocument, clamp, UI_SCALE,
} from '@/Documents/documentLaw';
import { FIELD_LIBRARY } from '@/Documents/documentTypes';

/**
 * useDocumentChrome — everything about how a document screen LOOKS, and
 * nothing about what is on it.
 *
 * Every document editor needs the same apparatus: a remembered layout, a text
 * size that scales the whole screen rather than only the type, a measurement
 * of how much room the table actually has, a divider you can drag, a dock bar
 * that appears when the total scrolls away. That apparatus was written once
 * for the sales invoice and would otherwise have been copied thirteen more
 * times. It lives here instead.
 *
 * Preferences are stored per DOCUMENT TYPE. A goods receipt has no totals
 * column and a stock audit has no money on it at all, so they cannot sensibly
 * share a saved layout with a sales invoice — and an operator who widens the
 * totals on invoices should not find their stock audits rearranged.
 */

const read = (key, fallback) => {
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
    } catch (_) { return fallback; }
};
const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* private mode */ }
};

/* The navigation rail belongs to the application, not to one document, so it
   is the single key that is NOT namespaced. Hiding it on a purchase and
   finding it back on a sale would just be a bug with extra steps. */
const RAIL_KEY = 'vqdoc_rail';

const keysFor = (typeId) => ({
    comp: `vqdoc_${typeId}_layout`,
    fields: `vqdoc_${typeId}_fields`,
    scale: `vqdoc_${typeId}_scale`,
    stock: `vqdoc_${typeId}_stock`,
    quick: `vqdoc_${typeId}_quick`,
    margin: `vqdoc_${typeId}_margin`,
    defaults: `vqdoc_${typeId}_defaults`,
});

/* A document's field list says what it CAN carry; this turns that into the
   on/off state the operator actually controls. Anything the document does not
   list is absent — not off, absent — so it can never be switched back on and
   can never reach the server. */
const defaultFields = (doc) => {
    const out = {};
    doc.fields.forEach((f) => { out[f] = true; });
    return out;
};

export default function useDocumentChrome({
    doc, activeId, seniorMode = false, marginDefault = false,
    /* What the senior-mode space bar does. A till operator who cannot see a
       small button still has to be able to finish a sale. */
    onSave,
    /* Whether the header may fold itself away yet — see onLinesFocus. */
    canFold = true,
    locked = false,
}) {
    const K = useMemo(() => keysFor(doc.id), [doc.id]);
    /* A document may name the keys an older screen of its own used, so an
       operator who has already set their layout, their text size and their
       field switches does not open the rebuilt screen and find all of it
       back at the defaults. Read once, on first use, and then never again —
       the new key is written the moment anything changes. */
    const L = doc.legacyKeys || {};
    const readK = (key, legacy, fallback) => {
        const v = read(key, undefined);
        if (v !== undefined) return v;
        return legacy ? read(legacy, fallback) : fallback;
    };

    /* Reaches through the combobox wrapper to the real input inside it. */
    const focusQuick = useCallback(() => {
        const el = document.querySelector('#quick-entry-input input') || document.getElementById('quick-entry-input');
        if (el) { el.focus(); el.select?.(); }
    }, []);

    const rootRef = useRef(null);
    const scrollRef = useRef(null);
    const bodyRef = useRef(null);
    const sumRef = useRef(null);
    const totalRef = useRef(null);
    const splitRef = useRef(null);

    /* ── remembered preferences ─────────────────────────────────────────── */

    const [showRail, setShowRailState] = useState(() => read(RAIL_KEY, true));
    const setShowRail = useCallback((v) => { setShowRailState(v); write(RAIL_KEY, v); }, []);

    const [textSize, setTextSizeState] = useState(() => readK(K.scale, L.scale, seniorMode ? 4 : 1));
    const setTextSize = useCallback((v) => { setTextSizeState(v); write(K.scale, v); }, [K.scale]);

    const [comp, setCompState] = useState(() => {
        const saved = readK(K.comp, L.comp, null);
        return { ...DEFAULT_COMP, ...(saved && typeof saved === 'object' ? saved : {}) };
    });
    const setComp = useCallback((patch) => {
        setCompState((prev) => { const next = { ...prev, ...patch }; write(K.comp, next); return next; });
    }, [K.comp]);
    const applyLayout = useCallback((id) => {
        const l = LAYOUTS.find((x) => x.id === id);
        if (!l) return;
        setCompState(() => { write(K.comp, l.comp); return { ...l.comp }; });
    }, [K.comp]);

    const [fields, setFieldsState] = useState(() => ({ ...defaultFields(doc), ...(readK(K.fields, L.fields, null) || {}) }));
    const setField = useCallback((key, on) => {
        setFieldsState((prev) => { const next = { ...prev, [key]: on }; write(K.fields, next); return next; });
    }, [K.fields]);
    /* A field the document does not carry is never asked about. This is the
       guard that keeps a stale localStorage entry from resurrecting a control
       on a document that has since dropped it. */
    const carries = useCallback((id) => doc.fields.includes(id) && fields[id] !== false, [doc.fields, fields]);

    const [showStock, setShowStockState] = useState(() => readK(K.stock, L.stock, true));
    const setShowStock = useCallback((v) => { setShowStockState(v); write(K.stock, v); }, [K.stock]);

    const [showQuickEntry, setShowQuickEntryState] = useState(() => read(K.quick, false));
    const setShowQuickEntry = useCallback((v) => {
        setShowQuickEntryState(v);
        write(K.quick, v);
        /* Turning it on is a request to type into it. */
        if (v) setTimeout(() => focusQuick(), 50);
    }, [K.quick]);

    const [showMargin, setShowMarginState] = useState(() => read(K.margin, marginDefault));
    const setShowMargin = useCallback((v) => { setShowMarginState(v); write(K.margin, v); }, [K.margin]);

    const [applyDefaults, setApplyDefaultsState] = useState(() => read(K.defaults, false));
    const setApplyDefaults = useCallback((v) => { setApplyDefaultsState(v); write(K.defaults, v); }, [K.defaults]);

    /* ── things that are true only right now ────────────────────────────── */

    /* Folding the header away is a MOMENT, not a preference. Writing it to the
       stored layout is what made auto-fold stick on the sales screen: the next
       document opened already folded and the header never came back. */
    const [fold, setFold] = useState(null);
    const autoFolded = useRef(null);
    const [showAllFields, setShowAllFields] = useState(false);
    const [showAllTotals, setShowAllTotals] = useState(false);
    const [totalsSheet, setTotalsSheet] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [openLine, setOpenLine] = useState(null);
    const [armedRow, setArmedRow] = useState(null);

    useEffect(() => { setFold(null); autoFolded.current = null; }, [activeId]);
    const detailsOpen = fold === null ? comp.details === 'open' : fold === 'open';

    /* The header folds itself away the first time the operator starts on the
       lines — once per document, so it never fights someone who opened it
       again on purpose. */
    const onLinesFocus = useCallback(() => {
        if (autoFolded.current === activeId) return;
        /* Not while the party is still empty. Folding then hides the one field
           the document cannot be saved without, and the operator is left
           looking for it. */
        if (!canFold) return;
        autoFolded.current = activeId;
        if (comp.details === 'open' && comp.autofold !== false) setFold('collapsed');
    }, [activeId, canFold, comp.details, comp.autofold]);

    /* ── measurement ────────────────────────────────────────────────────── */

    const [bodyW, setBodyW] = useState(1200);
    const [canPin, setCanPin] = useState(false);
    const [totalSeen, setTotalSeen] = useState(true);

    useLayoutEffect(() => {
        const el = bodyRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const measure = () => setBodyW(el.clientWidth || 0);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /* The layout is measured in TEXT-SIZE units, not pixels: at the largest
       size every control is 45% bigger, so the table has 45% less room even
       though the element is the same width. Handing the law a divided box is
       what makes a bigger text size demote the row honestly rather than
       clipping the last column off the end. */
    const law = useMemo(
        () => composeDocument(bodyW / (UI_SCALE[textSize] || 1), comp),
        [bodyW, comp, textSize],
    );
    const level = LEVELS[law.level];
    const asCards = law.cards;

    useLayoutEffect(() => {
        const sc = scrollRef.current;
        const sm = sumRef.current;
        if (!sc || !sm || law.summary !== 'side' || typeof ResizeObserver === 'undefined') { setCanPin(false); return undefined; }
        const measure = () => setCanPin(sm.scrollHeight <= sc.clientHeight - 8);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(sm); ro.observe(sc);
        return () => ro.disconnect();
    }, [law.summary, detailsOpen, law.level]);

    useEffect(() => {
        const target = totalRef.current;
        if (!target || typeof IntersectionObserver === 'undefined') { setTotalSeen(true); return undefined; }
        const io = new IntersectionObserver(([e]) => setTotalSeen(e.isIntersecting), { root: scrollRef.current, threshold: 0.5 });
        io.observe(target);
        return () => io.disconnect();
    }, [law.summary, detailsOpen, law.level, activeId]);

    const pinned = law.summary === 'side' && canPin && (comp.pin === 'auto' || comp.pin === 'pinned');
    const dockOn = law.summary === 'hidden' || comp.pin === 'docked'
        ? true
        : comp.pin === 'scroll' ? false : !totalSeen;

    /* ── the divider between the lines and the totals ───────────────────── */

    const onSplitDown = useCallback((e) => {
        const body = bodyRef.current;
        const handle = splitRef.current;
        if (!body) return;
        e.preventDefault();
        handle?.classList.add('dragging');
        const rect = body.getBoundingClientRect();
        const move = (ev) => {
            const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
            setCompState((prev) => ({ ...prev, split: clamp(((rect.right - x) / rect.width) * 100, SPLIT_MIN, SPLIT_MAX) }));
        };
        const up = () => {
            handle?.classList.remove('dragging');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            setCompState((prev) => { const n = { ...prev, split: Math.round(prev.split) }; write(K.comp, n); return n; });
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }, [K.comp]);

    const onSplitKey = useCallback((e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        setCompState((prev) => {
            const n = { ...prev, split: clamp(prev.split + (e.key === 'ArrowLeft' ? 2 : -2), SPLIT_MIN, SPLIT_MAX) };
            write(K.comp, n);
            return n;
        });
    }, [K.comp]);

    /* ── keys that belong to the chrome ─────────────────────────────────── */

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') { setTotalsSheet(false); return; }

            /* Alt+Q puts the cursor in the quick row from anywhere. F1 does the
               same for an operator who has been told "press F1", and the space
               bar finishes the document — both only in senior mode, where the
               buttons are hard to find and the keyboard is the whole
               interface. */
            if (e.altKey && (e.key || '').toLowerCase() === 'q') {
                e.preventDefault();
                if (!showQuickEntry) setShowQuickEntry(true); else focusQuick();
                return;
            }
            if (seniorMode && e.key === 'F1') {
                e.preventDefault();
                if (!showQuickEntry) setShowQuickEntry(true); else focusQuick();
                return;
            }
            if (seniorMode && e.key === ' ' && onSave && !locked) {
                const tag = (document.activeElement?.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !document.activeElement?.isContentEditable) {
                    e.preventDefault();
                    onSave();
                    return;
                }
            }

            if (!e.altKey) return;
            const k = (e.key || '').toLowerCase();
            if (k === 'l') { e.preventDefault(); setShowRail(!showRail); }
            if (k === 'd') { e.preventDefault(); setFold(detailsOpen ? 'collapsed' : 'open'); autoFolded.current = activeId; }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setShowRail, showRail, detailsOpen, activeId, seniorMode, onSave, locked, showQuickEntry, setShowQuickEntry]);

    /* Start typing anywhere and the quick row takes it. A till operator should
       never have to find the search box with a mouse — the first keystroke IS
       the search box. */
    const [quickQuery, setQuickQuery] = useState('');
    useEffect(() => {
        if (!showQuickEntry || locked || asCards) return undefined;
        const onKey = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
            const t = e.target;
            const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea' || (t && t.isContentEditable)) return;
            e.preventDefault();
            setQuickQuery((prev) => prev + e.key);
            focusQuick();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showQuickEntry, locked, asCards]);

    /* Which optional header fields are on screen right now: the document has
       to carry it, the operator has to want it, and either the detail level
       shows it or they have asked for all of them. */
    const field = useCallback(
        (id) => carries(id) && (level.header.includes(id) || showAllFields || !FIELD_LIBRARY[id]),
        [carries, level.header, showAllFields],
    );

    /* Whether the "All fields" button has anything to reveal at this level. A
       button that does nothing is worse than no button. */
    const hasHiddenFields = useMemo(
        () => (doc.fields || []).some((f) => ALL_HEADER.includes(f) && !level.header.includes(f)),
        [doc.fields, level.header],
    );

    return {
        /* refs the shell wires up */
        rootRef, scrollRef, bodyRef, sumRef, totalRef, splitRef,

        /* preferences */
        showRail, setShowRail,
        textSize, setTextSize,
        comp, setComp, applyLayout,
        fields, setField, carries,
        showStock, setShowStock,
        showQuickEntry, setShowQuickEntry,
        quickQuery, setQuickQuery, focusQuick,
        showMargin, setShowMargin,
        applyDefaults, setApplyDefaults,

        /* right now */
        fold, setFold, detailsOpen, onLinesFocus,
        showAllFields, setShowAllFields,
        showAllTotals, setShowAllTotals,
        totalsSheet, setTotalsSheet,
        settingsOpen, setSettingsOpen,
        openLine, setOpenLine,
        armedRow, setArmedRow,

        /* the law, measured */
        law, level, asCards, bodyW, pinned, dockOn,
        onSplitDown, onSplitKey,

        /* helpers */
        field, hasHiddenFields,
    };
}
