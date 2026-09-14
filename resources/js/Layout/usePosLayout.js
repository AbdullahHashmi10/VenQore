/* ==========================================================================
   usePosLayout — the register's one layout decision
   ==========================================================================
   The old page decided its own layout in nine places: two percentage widths
   in localStorage, a `lg:` breakpoint on every pane, a mobile tab bar, and
   four settings (`pos_layout_variant`, `pos_catalog_placement`,
   `pos_tender_placement`, `pos_simulated_device`) that were written by the
   settings drawer and then read by nothing at all. That is why the layout
   did not respond to a window resize and why choosing a variant changed
   nothing: the choices were real, the wiring was not.

   There is now exactly one decision, made here, from two inputs:

     1. THE MEASURED ELEMENT. Not `window.innerWidth` — the actual content
        box of the terminal, observed. It already has the sidebar, the rail,
        the browser chrome and the OS scrollbar subtracted from it, which is
        the reason a breakpoint could never get this right. There is no
        screen-size setting because there is nothing for a user to tell us
        that we cannot measure more accurately ourselves.

     2. THE COMPOSITION — what the shop asked for: whether there is a
        catalog and where, how the cart and tender divide the rest, whether
        tender is a column, a bar or a sheet, whether there is a floor plan.
        A composition is a WISH. The engine clamps it against the measured
        floors, and the floors win: 20% of a screen that is below the
        catalog's floor produces no catalog, not an unreadable one.

   The output is a plain object describing what every pane BECOMES right
   now. Components read it; they never decide for themselves.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LAW, composeTerminal, presetComposition, formatToFit } from './venqoreLayoutEngine';

export const PRESETS = LAW.pos.presets.map(p => ({
    id: p.id,
    name: p.name,
    /* `tagline` is the one-line "what this shape IS" and `for` is "who it is
       for". The settings drawer shows the first and falls back to the second;
       both were being dropped here, so every preset card in the picker was
       blank under its name. */
    tagline: p.tagline || '',
    for: p.for || p.note || '',
    why: p.why || '',
    comp: p.comp,
    terminal: p.comp && p.comp.floor && p.comp.floor !== 'off' ? 'table' : 'counter',
}));

/* The presets a given terminal may offer. */
export const presetsFor = (terminal = 'counter') =>
    PRESETS.filter(p => p.terminal === terminal);

/* Which preset is this composition? A composition is not tagged with the
   preset it came from -- it is just geometry, and it stops being any preset
   the moment a divider moves. So identity is decided the only way it can
   honestly be decided: by comparing the parts a preset actually fixes, and
   letting the shares drift.

   Without this the register matched on `catalog.mode` alone, which meant Grid,
   Stack, Counter and Table could be applied but never appeared selected -- the
   card you had just clicked stayed unhighlighted, which reads as a dead
   control. */
export function matchPreset(comp) {
    if (!comp) return DEFAULT_PRESET;
    /* The floor is compared as PRESENT or ABSENT, not by mode. It is derived
       from the terminal now and the engine rewrites 'left' to 'overlay' the
       moment the width cannot carry a column -- so an exact comparison meant
       the Table preset stopped matching itself on a narrow screen, and the
       card the operator was looking at went unhighlighted. */
    const same = p => p.comp.catalog.mode === comp.catalog?.mode
        && p.comp.tender === comp.tender
        && (p.comp.floor === 'off') === ((comp.floor || 'off') === 'off');
    const exact = PRESETS.find(same);
    if (exact) return exact.id;
    /* No exact shape match: name the closest one rather than lying about it. */
    const near = PRESETS.find(p => p.comp.catalog.mode === comp.catalog?.mode
                                && p.comp.tender === comp.tender)
              || PRESETS.find(p => p.comp.catalog.mode === comp.catalog?.mode);
    return near ? near.id : DEFAULT_PRESET;
}

/* The default before a shop has configured anything. `column` degrades most
   gracefully of the seven: catalog to a button, tender to a docked bar, and
   the cart never gives up a pixel it needs. */
export const DEFAULT_PRESET = 'column';

const STORE_KEY = 'pos_composition_v2';
const STORE_KEY_TABLE = 'pos_composition_table_v1';
const keyFor = (terminal) => (terminal === 'table' ? STORE_KEY_TABLE : STORE_KEY);

const isNum = v => typeof v === 'number' && Number.isFinite(v);

/* A stored composition is user data, so it is validated rather than trusted:
   a hand-edited localStorage value must not be able to produce a layout the
   engine has to guess its way out of. */
export function normaliseComposition(raw) {
    const base = presetComposition(DEFAULT_PRESET);
    if (!raw || typeof raw !== 'object') return base;
    const catModes = ['left', 'right', 'top', 'bottom', 'overlay', 'off'];
    const tenderModes = ['column', 'bar', 'sheet'];
    const floorModes = ['left', 'overlay', 'off'];
    const c = raw.catalog || {};
    const mode = catModes.includes(c.mode) ? c.mode : base.catalog.mode;
    /* A BAND is measured in whole tile rows, a COLUMN in a share of the width,
       and the engine reads `size` first for both. That is why a strip could end
       up two rows tall for a three-product catalog: `size` was still carrying
       the 0.4 a column preset had left behind, and 40% of the height bought two
       rows whether or not there was anything to put in them. Zeroing it for a
       band hands authority to `rows` -- which is the control the operator has,
       and which now defaults to one. */
    const isBand = mode === 'top' || mode === 'bottom';
    return {
        catalog: {
            mode,
            size: isBand ? 0 : (isNum(c.size) ? Math.max(0, Math.min(0.55, c.size)) : base.catalog.size),
            rows: isNum(c.rows) ? Math.max(1, Math.min(3, Math.round(c.rows))) : 1,
            tiles: isNum(c.tiles) ? Math.max(1, Math.min(12, Math.round(c.tiles))) : null,
        },
        split: {
            cart: isNum(raw.split?.cart) ? Math.max(0.2, Math.min(1, raw.split.cart)) : base.split.cart,
            tender: isNum(raw.split?.tender) ? Math.max(0, Math.min(0.45, raw.split.tender)) : base.split.tender,
        },
        tender: tenderModes.includes(raw.tender) ? raw.tender : base.tender,
        /* WHICH SIDE the payment panel lives on. The panel was hard-wired to the
           right in three separate places -- the column order, the sheet
           transform and the dock -- so a left-handed counter, or a till whose
           customer display sits on the left, had no say. One value, read by all
           three. `bottom` turns the column into a full-width row under the
           panes, which is the right shape on a wide, short screen. */
        tenderSide: ['right', 'left', 'bottom'].includes(raw.tenderSide) ? raw.tenderSide : (base.tenderSide || 'right'),
        /* WHERE THE SCAN BAR LIVES. It was derived -- a resident catalog column
           swallowed it, anything else put it on the order pane -- so a shop that
           wanted a catalog AND a scan bar over the order list could not have
           one, and a scan-led shop could not move it into the catalog. 'auto'
           keeps the old derivation for anyone who liked it. */
        scanBar: ['auto', 'order', 'catalog'].includes(raw.scanBar) ? raw.scanBar : (base.scanBar || 'auto'),
        /* A catalog-led shop with a handful of SKUs does not always want a
           standing order column: the tiles carry an in-cart badge and payment
           has the totals. Off puts the order behind a button. */
        showOrder: typeof raw.showOrder === 'boolean' ? raw.showOrder : (base.showOrder !== false),
        /* CARDS OR ROWS. The engine derives a shape from the width it can
           afford, which is the right default and the wrong answer for a shop
           that has an opinion: a grocer reading long names wants rows at every
           width, a cafe pointing at pictures wants cards even in a narrow
           column. 'auto' keeps the derivation. */
        catalogShape: ['auto', 'cards', 'rows', 'pills'].includes(raw.catalogShape) ? raw.catalogShape : 'auto',
        floor: floorModes.includes(raw.floor) ? raw.floor : base.floor,
    };
}

export function loadComposition(settings, terminal = 'counter') {
    /* Order of authority: this device's saved choice, then the store's
       setting, then the default preset. A device override exists because one
       shop can run a 1920 counter station and a 10" tablet on the floor and
       they do not want the same register. */
    try {
        const local = localStorage.getItem(keyFor(terminal));
        if (local) return normaliseComposition(JSON.parse(local));
    } catch (e) { /* corrupt value: fall through to the store setting */ }

    const fromSettings = terminal === 'table' ? settings?.pos_composition_table : settings?.pos_composition;
    if (fromSettings) {
        try {
            return normaliseComposition(
                typeof fromSettings === 'string' ? JSON.parse(fromSettings) : fromSettings
            );
        } catch (e) { /* same */ }
    }

    /* A store that only ever picked one of the six named variants still has
       `pos_layout_variant` set. Honour it rather than silently resetting the
       register they are used to. */
    if (terminal === 'table') return presetComposition('table');

    const legacy = settings?.pos_layout_variant || localStorage.getItem('pos_layout_variant');
    if (legacy && PRESETS.some(p => p.id === legacy) && p_terminal(legacy) === 'counter') {
        return presetComposition(legacy);
    }

    return presetComposition(DEFAULT_PRESET);
}

const p_terminal = (id) => {
    const p = PRESETS.find(x => x.id === id);
    return p ? p.terminal : 'counter';
};

export function saveComposition(comp, terminal = 'counter') {
    try { localStorage.setItem(keyFor(terminal), JSON.stringify(comp)); } catch (e) { /* private mode */ }
}

/* --------------------------------------------------------------------------
   The hook
   -------------------------------------------------------------------------- */
export function usePosLayout({ settings, senior = false, scale = 1, terminal = 'counter' } = {}) {
    const ref = useRef(null);
    const [box, setBox] = useState(() => ({
        /* A first paint before the observer has fired still has to be legal,
           so we seed from the window and correct on the very next frame. */
        w: typeof window !== 'undefined' ? window.innerWidth : 1440,
        h: typeof window !== 'undefined' ? window.innerHeight : 900,
    }));
    const [comp, setComp] = useState(() => loadComposition(settings, terminal));

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;

        let frame = 0;
        const ro = new ResizeObserver(entries => {
            const e = entries[0];
            if (!e) return;
            const cb = e.contentBoxSize
                ? (Array.isArray(e.contentBoxSize) ? e.contentBoxSize[0] : e.contentBoxSize)
                : null;
            const w = Math.round(cb ? cb.inlineSize : e.contentRect.width);
            const h = Math.round(cb ? cb.blockSize : e.contentRect.height);
            if (!w || !h) return;
            /* Coalesce to one update per frame. A sidebar animating open
               fires this ~60 times and each one would otherwise re-run the
               solver and re-render the whole register. */
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                setBox(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
            });
        });
        ro.observe(el);
        return () => { cancelAnimationFrame(frame); ro.disconnect(); };
    }, []);

    /* Senior mode raises every measured floor, because the same pane needs
       more room to stay legible at a larger ramp. Feeding the engine a
       proportionally smaller box is how a pane demotes to a button instead
       of crushing its own contents — which is the difference between large
       text and large text you can actually read. */
    const SENIOR_FACTOR = 0.86;

    const layout = useMemo(() => {
        const w = Math.max(LAW.minViewport, box.w);
        const h = Math.max(320, box.h);
        /* Interface scale is the same trick as senior mode and composes with it:
           a register at 120% has 120% of the type in the same box, so the box the
           engine is shown is 1/1.2 of the real one. That is why raising the scale
           turns a catalog column into a button instead of clipping its tiles. */
        const s = Math.max(0.9, Math.min(1.3, Number(scale) || 1));
        const factor = (senior ? SENIOR_FACTOR : 1) / s;
        const ew = w * factor;
        const eh = h * factor;
        /* The engine expects a viewport and subtracts its own bar and margin;
           we hand it the element we actually measured plus that allowance, so
           the numbers it returns describe THIS box and not a hypothetical
           window. */
        /* THE FLOOR IS NOT A PREFERENCE. It is what the table terminal IS, so
           it is derived from the terminal rather than stored -- which is how a
           retail till stopped being one checkbox away from a floor plan, and
           how a restaurant can never lose the pane its whole workflow starts
           from. 'left' is a request, not a promise: the engine still demotes it
           to a step when the width cannot carry a column for free. */
        const effective = terminal === 'table'
            ? { ...comp, floor: comp.floor && comp.floor !== 'off' ? comp.floor : 'left' }
            : { ...comp, floor: 'off' };
        const t = composeTerminal(effective, Math.round(ew + 2 * 12), Math.round(eh + LAW.terminal.bar_h + 2 * 12));
        return t;
    }, [comp, box.w, box.h, senior, scale, terminal]);

    /* The grid template for the resident panes, in the order they appear.
       Written as a custom property so the stylesheet never has to know how
       many panes there are. */
    const paneCols = useMemo(() => {
        if (layout.regime === 'stacked' || layout.regime === 'phone') {
            return 'minmax(0, 1fr)';
        }
        const parts = [];
        const cat = layout.catalog;
        const side = comp.tenderSide || 'right';
        const tenderIsColumn = layout.tender.mode === 'column' && side !== 'bottom';

        /* On the left, the payment column is the FIRST track -- before the
           catalog, so the money stays at the edge of the screen rather than
           being sandwiched between two things. */
        if (tenderIsColumn && side === 'left') parts.push(`${Math.round(layout.tender.px)}px`);
        if (cat && cat.mode === 'left') parts.push(`${Math.round(cat.px)}px`);
        if (layout.floor && layout.floor.mode === 'left') parts.push(`${Math.round(layout.floor.px)}px`);
        /* The cart takes what is left -- unless the shop hid it, in which case
           the catalog does. Something must hold the flexible track or the grid
           collapses to its fixed columns and leaves a gap. */
        if (comp.showOrder === false && cat && (cat.mode === 'left' || cat.mode === 'right')) {
            parts[parts.length - 1] = 'minmax(0, 1fr)';
        } else {
            parts.push('minmax(0, 1fr)');
        }
        if (tenderIsColumn && side === 'right') parts.push(`${Math.round(layout.tender.px)}px`);
        if (cat && cat.mode === 'right') parts.push(`${Math.round(cat.px)}px`);
        return parts.join(' ');
        /* `comp` belongs here as much as `layout` does. tenderSide and
           showOrder are placement, not geometry -- the engine never sees them,
           so `layout` is byte-identical before and after either one changes.
           Watching only `layout` meant the memo held the old track order and
           the payment column stayed exactly where it was. */
    }, [layout, comp]);

    const update = useCallback(next => {
        setComp(prev => {
            const merged = normaliseComposition(typeof next === 'function' ? next(prev) : next);
            saveComposition(merged, terminal);
            return merged;
        });
    }, [terminal]);

    const applyPreset = useCallback(id => {
        const p = presetComposition(id);
        if (!p) return;
        saveComposition(p, terminal);
        setComp(p);
    }, [terminal]);

    /* Dragging the cart:tender boundary edits the COMPOSITION, not a pixel
       width. That is the whole reason a drag survives a resize: the shop
       said "give tender a third", and a third of a smaller screen is still a
       third — until it drops below the tender floor, at which point the
       engine turns it into a bar on its own. */
    const dragSplit = useCallback((key, px) => {
        const total = Math.max(1, box.w);
        update(prev => {
            const share = Math.max(0, Math.min(0.55, px / total));
            if (key === 'tender') return { ...prev, split: { ...prev.split, tender: share } };
            if (key === 'catalog') return { ...prev, catalog: { ...prev.catalog, size: share } };
            return prev;
        });
    }, [box.w, update]);

    return {
        ref,
        box,
        comp,
        layout,
        paneCols,
        update,
        applyPreset,
        dragSplit,
        formatToFit,
    };
}

export default usePosLayout;
