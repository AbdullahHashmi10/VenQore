/**
 * VenQore — the document layout law.
 *
 * Companion to `resources/js/Sales/document-law.css`. One pure function
 * decides the arrangement; the page renders it and the settings preview shows
 * it. Two implementations of a layout is one too many, which is why the
 * preview calls this and does not draw its own idea of the screen.
 *
 * The floors below come from the measured study in
 * `extras/Layout Law/venqore-document.html` — real advance widths, not
 * guesses. They are the only numbers in the product that know about them:
 * nothing in the interface ever prints a pixel at the operator.
 *
 * The rule that outranks the rest: the width may simplify the TABLE, and it
 * may move the SUMMARY. It may never remove a capability. Everything a
 * simpler table hides stays one click away.
 */

/* Line-table variants and the width each needs. */
const FIT_FLOOR = { full: 933, standard: 693, compact: 561, cards: 305 };
const FIT_ORDER = ['cards', 'compact', 'standard', 'full'];

/* Summary column variants. */
const SUM_FLOOR = { panel: 384, tight: 262 };

/* Which table variant each detail level wants, and the best level each
   variant can actually carry. Inverses of one another, on purpose. */
const LEVEL_WANTS = { simple: 'compact', standard: 'standard', detailed: 'full' };
const FIT_ALLOWS = { full: 'detailed', standard: 'standard', compact: 'simple', cards: 'simple' };
const LEVEL_ORDER = ['simple', 'standard', 'detailed'];

/* The text-size steps, shared with the stylesheet's --d-scale. The layout is
   handed a box DIVIDED by this number, so raising the text size demotes a
   crowded table honestly instead of clipping it — the same trick the register
   uses. Scaling the element itself with a transform would blur the type and
   lie to every measurement. */
export const UI_SCALE = { 1: 1, 2: 1.09, 3: 1.18, 4: 1.3, 5: 1.45 };

export const SPLIT_MIN = 22;
export const SPLIT_MAX = 44;
const SPLIT_GUTTER = 16;

/* ── the three detail levels ─────────────────────────────────────────────
   Described the way a shopkeeper would describe them, never by pixel. */
export const LEVELS = {
    simple: {
        id: 'simple',
        name: 'Simple',
        blurb: 'Item, quantity, price, total. Nothing else on the row.',
        who: 'A counter, a single-product shop, someone new to the till.',
        cols: ['item', 'qty', 'rate', 'total', 'del'],
        header: ['party', 'method', 'date'],
        summary: ['total', 'settled', 'balance'],
    },
    standard: {
        id: 'standard',
        name: 'Standard',
        blurb: 'Adds line numbers, discounts and the running breakdown.',
        who: 'The everyday setting, and the one most shops keep.',
        cols: ['idx', 'item', 'qty', 'rate', 'disc', 'total', 'del'],
        /* Header ids other documents rely on live here too. A purchase whose
            supplier bill number and warehouse were only reachable behind "All
            fields" is a purchase screen missing its two most-typed boxes. */
        header: ['party', 'method', 'account', 'accountOut', 'refund', 'supplierRef', 'docno', 'date', 'terms', 'warehouse'],
        summary: ['subtotal', 'item_disc', 'doc_disc', 'tax', 'total', 'settled', 'balance', 'prevbal'],
    },
    detailed: {
        id: 'detailed',
        name: 'Detailed',
        blurb: 'Adds free goods, units, due dates and every charge line.',
        who: 'Wholesale, accounts, and anywhere tax has to be itemised.',
        cols: ['idx', 'item', 'qty', 'free', 'uom', 'rate', 'disc', 'total', 'del'],
        header: ['party', 'method', 'account', 'accountOut', 'refund', 'supplierRef', 'source', 'docno', 'date',
                 'terms', 'due', 'validity', 'delivery', 'expected', 'warehouse', 'fromWh', 'toWh',
                 'frequency', 'nextRun', 'status', 'reason', 'attachment', 'notes'],
        summary: ['subtotal', 'item_disc', 'doc_disc', 'tax', 'shipping', 'extra', 'total', 'settled', 'balance', 'prevbal'],
    },
};

/* Everything a level leaves off the row is still on the document — this is
   what "Show all fields" puts back. */
export const ALL_HEADER = ['party', 'method', 'account', 'accountOut', 'refund', 'supplierRef', 'source',
    'docno', 'date', 'terms', 'due', 'validity', 'delivery', 'expected', 'warehouse', 'fromWh', 'toWh',
    'frequency', 'nextRun', 'status', 'reason', 'attachment', 'notes'];
export const ALL_SUMMARY = ['subtotal', 'item_disc', 'doc_disc', 'tax', 'shipping', 'extra', 'total', 'settled', 'balance', 'prevbal'];

export const DEFAULT_COMP = {
    details: 'open',      /* open | collapsed                    */
    summary: 'auto',      /* auto | side | below | hidden        */
    pin: 'auto',          /* auto | pinned | docked | scroll     */
    split: 32,
    level: 'standard',
};

/* ── the six arrangements ────────────────────────────────────────────────
   `art` drives the thumbnail in settings: where the lines end, where the
   summary sits, whether the dock is shown. */
export const LAYOUTS = [
    {
        id: 'panel',
        name: 'Side panel',
        blurb: 'Details open, totals resident on the right.',
        comp: { details: 'open', summary: 'auto', pin: 'auto', split: 32, level: 'standard' },
        art: { details: true, sum: 'side', dock: false },
    },
    {
        id: 'wide',
        name: 'Wide lines',
        blurb: 'Customer block folded away so the items get the width.',
        comp: { details: 'collapsed', summary: 'auto', pin: 'auto', split: 26, level: 'standard' },
        art: { details: 'strip', sum: 'side', dock: false },
    },
    {
        id: 'focus',
        name: 'Focus',
        blurb: 'Nothing but the item table. Totals live in the bar.',
        comp: { details: 'collapsed', summary: 'hidden', pin: 'docked', split: 32, level: 'standard' },
        art: { details: 'strip', sum: null, dock: true },
    },
    {
        id: 'stack',
        name: 'Stacked',
        blurb: 'Totals under the last line, with the bar following you down.',
        comp: { details: 'open', summary: 'below', pin: 'docked', split: 32, level: 'standard' },
        art: { details: true, sum: 'below', dock: true },
    },
    {
        id: 'ledger',
        name: 'Pro ledger',
        blurb: 'Every column, every field, the full breakdown.',
        comp: { details: 'open', summary: 'auto', pin: 'auto', split: 34, level: 'detailed' },
        art: { details: true, sum: 'side', dock: true },
    },
];

export const CHOICES = {
    details: [['open', 'Open'], ['collapsed', 'Folded away']],
    summary: [['auto', 'Automatic'], ['side', 'Beside the items'], ['below', 'Under the items'], ['hidden', 'In the bar only']],
    pin: [['auto', 'Automatic'], ['pinned', 'Stay in view'], ['docked', 'Follow in the bar'], ['scroll', 'Scroll away']],
    level: [['simple', 'Simple'], ['standard', 'Standard'], ['detailed', 'Detailed']],
};

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

const fitFor = (w) => {
    if (w >= FIT_FLOOR.full) return 'full';
    if (w >= FIT_FLOOR.standard) return 'standard';
    if (w >= FIT_FLOOR.compact) return 'compact';
    return 'cards';
};
const sumFitFor = (w) => (w >= SUM_FLOOR.panel ? 'panel' : w >= SUM_FLOOR.tight ? 'tight' : null);
const rankFit = (f) => FIT_ORDER.indexOf(f);
const rankLevel = (l) => LEVEL_ORDER.indexOf(l);

export const matchLayout = (comp) => {
    const hit = LAYOUTS.find(l => (
        l.comp.details === comp.details
        && l.comp.summary === comp.summary
        && l.comp.pin === comp.pin
        && l.comp.level === comp.level
        && Math.abs(l.comp.split - comp.split) < 2
    ));
    return hit ? hit.id : null;
};

/**
 * Decide the arrangement for a measured width.
 *
 * Returns only what the interface needs to render. The `simplified` and
 * `moved` flags are booleans, not sentences with numbers in them — if the
 * operator needs to be told anything, the page says it in words.
 */
export function composeDocument(width, comp) {
    const w = Math.max(0, Math.round(width || 0));
    const split = clamp(comp.split, SPLIT_MIN, SPLIT_MAX);

    const sideSumW = Math.floor((w * split) / 100);
    const sideLinesW = w - sideSumW - SPLIT_GUTTER;
    const sideSum = sumFitFor(sideSumW);
    const wants = LEVEL_WANTS[comp.level] || 'standard';

    let summary;
    if (comp.summary === 'hidden') {
        summary = 'hidden';
    } else if (comp.summary === 'below') {
        summary = 'below';
    } else if (comp.summary === 'side') {
        /* An explicit choice is honoured until it would stop the items being
           a table at all. That floor is not a preference. */
        summary = (sideSum && rankFit(fitFor(sideLinesW)) >= rankFit('compact')) ? 'side' : 'below';
    } else {
        summary = (sideSum && rankFit(fitFor(sideLinesW)) >= rankFit(wants)) ? 'side' : 'below';
    }
    const moved = comp.summary !== 'auto' && comp.summary !== summary && comp.summary !== 'hidden';

    const linesW = summary === 'side' ? sideLinesW : w;
    const fit = fitFor(linesW);
    const allowed = FIT_ALLOWS[fit];
    const simplified = rankLevel(comp.level) > rankLevel(allowed);
    const level = simplified ? allowed : comp.level;

    return {
        split,
        summary,                       /* side | below | hidden          */
        cards: fit === 'cards',
        level,                         /* what the row can actually show */
        wantedLevel: comp.level,
        simplified,                    /* the width had to simplify it   */
        moved,                         /* the summary could not stay     */
        narrow: fit === 'cards' || fit === 'compact',
        pinnable: summary === 'side',
    };
}

export const PREVIEW_DEVICES = [
    { id: 'phone', name: 'Phone', w: 390, h: 760 },
    { id: 'tablet', name: 'Tablet', w: 1024, h: 740 },
    { id: 'laptop', name: 'Laptop', w: 1440, h: 860 },
    { id: 'desktop', name: 'Desktop', w: 1920, h: 1040 },
];

/* The rail is chrome the operator can spend. Under this width it overlays
   rather than pushes, so hiding it buys nothing. */
export const RAIL_PUSH_FROM = 1216;
export const RAIL_W = 248;
