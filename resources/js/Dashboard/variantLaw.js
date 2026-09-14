/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Variant Law — which look a chart may wear, and how small it may be.      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Two things the Layout Law does not decide, because neither is geometry:
 *
 *  1. **Variants.** A chart type is not one picture. An area chart can be a
 *     gradient, a solid, a pattern, stepped, stacked or a bare line — six
 *     genuinely different reads of the same figures. The prototype shipped 71
 *     of these and they are the reason a board stops looking like a template.
 *
 *  2. **The size floor.** The Layout Law's `minCategoryForChart` is a floor in
 *     *categories*, which is coarse: it cannot say that a ring with five
 *     legend rows needs more height than a ring with two, or that a stat
 *     showing only its number fits in a single row. This states the floor in
 *     grid cells, derived from what the card actually has to draw.
 *
 * Both are enforced, not suggested. A variant that would render the same
 * picture as another is offered disabled with the reason; a fit below the
 * floor is not offered at all. That is what stops a card clipping its own
 * content — the failure the prototype was rebuilt to eliminate.
 *
 * Chart keys here are the registry's wire format (`profit_loss_line`, not
 * `pl`), so this file can be read against `chartRegistry.js` directly.
 */

import { CATEGORIES, CATEGORY_KEYS, GRID, dimensionsOf, fitsFor } from './layoutLaw';

/* ------------------------------------------------------------------ *
 * The variants
 * ------------------------------------------------------------------ */

/**
 * Every look, per chart, leanest-and-most-typical first.
 *
 * The first entry is what a new card gets. Order is the order they are
 * offered in, so it reads as a progression rather than a bag of options.
 */
export const VARIANTS = {
    area: [
        ['gradient', 'Gradient fill'], ['solid', 'Solid fill'], ['pattern', 'Pattern fill'],
        ['step', 'Stepped'], ['stacked', 'Stacked'], ['nofill', 'Line only'],
    ],
    line: [
        ['smooth', 'Smooth'], ['linear', 'Linear'], ['step', 'Stepped'],
        ['dots', 'With points'], ['dashtail', 'Dashed tail'], ['thick', 'Heavy stroke'],
    ],
    bar: [
        ['rounded', 'Rounded'], ['square', 'Square'], ['thin', 'Thin columns'],
        ['grouped', 'Grouped'], ['stacked', 'Stacked'], ['pattern', 'Pattern fill'],
    ],
    composed: [
        ['bar-trend', 'Bar + trend line'], ['bar-line-area', 'Bar + line + area'],
        ['bar-two-lines', 'Bar + two lines'], ['stacked-line', 'Stacked bars + line'],
        ['pattern', 'Pattern fills'], ['thin-columns', 'Thin columns'], ['area-bar', 'Area + bar'],
    ],
    profit_loss_line: [['split', 'Split fill'], ['bars', 'Diverging bars'], ['line', 'Line only']],
    live_line: [['pulse', 'Pulsing head'], ['trail', 'Fading trail'], ['dots', 'With points']],

    pie: [['solid', 'Solid'], ['donut', 'Donut'], ['exploded', 'Exploded'], ['pattern', 'Pattern']],
    ring: [['concentric', 'Concentric rings'], ['single', 'Single ring'], ['thick', 'Heavy stroke']],
    sunburst: [['two-level', 'Two level'], ['three-level', 'Three level']],
    gauge: [['arc', 'Arc'], ['notch', 'Notched'], ['full', 'Full circle']],
    funnel: [['centered', 'Centered'], ['left', 'Left aligned'], ['stepped', 'Stepped']],
    radar: [['filled', 'Filled'], ['outline', 'Outline'], ['dots', 'With points']],
    scatter: [['dots', 'Dots'], ['bubble', 'Bubble'], ['trend', 'With trend line']],
    heatmap: [['square', 'Square cells'], ['rounded', 'Rounded cells'], ['dots', 'Dot scale']],
    table: [['rows', 'Rows'], ['bars', 'With bars'], ['rank', 'Ranked']],
    feed: [['dots', 'Dots'], ['bars', 'With bars']],
    sankey: [['flow', 'Flow'], ['thin', 'Thin links']],
    choropleth: [['grid', 'Region grid'], ['list', 'Ranked list']],

    /* Sparkline first, deliberately. The first entry is what a card with no
       stored variant renders — which is every card created before variants
       existed. A stat that defaulted to `number` would show its figure and an
       empty box below it, so the default has to be the read that fills the
       card. `number` is the opt-in for people who want only the figure. */
    stat: [
        ['spark', 'Sparkline'], ['number', 'Number only'],
        ['delta', 'Period comparison'], ['plain', 'Min / avg / max'],
    ],
    sparkline: [['area', 'Area'], ['line', 'Line'], ['bars', 'Bars']],
    status: [['chip', 'Chip'], ['dot', 'Dot']],
};

export const variantsOf = (chart) => VARIANTS[chart] ?? [['default', 'Default']];
export const defaultVariant = (chart) => variantsOf(chart)[0][0];

/** The look a card is actually wearing, always a legal one. */
export const variantOf = (card) => {
    const want = card?.style?.variant;
    const legal = variantsOf(card?.chart).map(([id]) => id);
    return legal.includes(want) ? want : defaultVariant(card?.chart);
};

/* ------------------------------------------------------------------ *
 * Variants that depend on how many series the card carries
 * ------------------------------------------------------------------ */

/**
 * Looks that only differ once a card carries more than one series.
 *
 * On a single-series card a stacked area is a plain area and a grouped bar is
 * a bar — same picture, different name. Offering them is a fake choice, so
 * they are offered disabled with the count they need.
 */
export const NEEDS_SERIES = {
    area: { stacked: 2 },
    bar: { grouped: 2, stacked: 2 },
    composed: {
        'bar-line-area': 2, 'bar-two-lines': 3, 'stacked-line': 3,
        pattern: 2, 'thin-columns': 2, 'area-bar': 2,
    },
};

/**
 * And the reverse — looks that collapse into another once a series is added.
 *
 * `bar-trend` draws one series twice, as columns and as its own smoothed
 * line. With a second series that is exactly `bar-two-lines`, so it stops
 * being offered rather than becoming a duplicate.
 */
export const ONLY_SINGLE = { composed: ['bar-trend'] };

/** Charts that can plot more than one reading at once. */
export const MULTI_SERIES_CHARTS = new Set(['line', 'area', 'bar', 'composed']);

export const seriesCount = (card) => 1 + (card?.style?.extraKeys?.length ?? 0);

/**
 * Every variant for this card, with whether it is usable and why not.
 *
 * @returns {Array<[string, string, boolean, string]>} [id, label, enabled, why]
 */
export function variantsFor(card) {
    const chart = card?.chart;
    const need = NEEDS_SERIES[chart] ?? {};
    const solo = ONLY_SINGLE[chart] ?? [];
    const have = seriesCount(card);

    return variantsOf(chart).map(([id, label]) => {
        if (solo.includes(id)) return [id, label, have === 1, 'single series only'];
        const want = need[id] ?? 0;
        return [id, label, have >= want, want ? `needs ${want} series` : ''];
    });
}

/**
 * Move a card off a variant it can no longer render.
 *
 * Called after anything that changes the series count. Returns the variant to
 * use — the caller writes it, so this stays pure.
 */
export function fixVariant(card) {
    const options = variantsFor(card);
    const current = variantOf(card);
    if (options.some(([id, , ok]) => id === current && ok)) return current;
    return options.find(([, , ok]) => ok)?.[0] ?? defaultVariant(card?.chart);
}

/* ------------------------------------------------------------------ *
 * The size floor, in grid cells
 * ------------------------------------------------------------------ */

/**
 * The leanest [columns, rows] each chart can be drawn in and still be read.
 *
 * Measured, not guessed: these are the sizes at which the prototype's overflow
 * checker — which walks every element in a card and measures overhang against
 * the card's own box — reported zero clipping across 768 renders in three
 * themes at four viewport widths.
 */
export const MIN_SIZE = {
    stat: [2, 1], status: [3, 3], sparkline: [3, 3],
    gauge: [3, 4], ring: [4, 6], pie: [4, 6], sunburst: [4, 6],
    bar: [4, 4], table: [3, 4], funnel: [5, 4], radar: [4, 5], feed: [3, 4],
    area: [4, 4], line: [4, 4], profit_loss_line: [4, 4], live_line: [4, 4],
    composed: [5, 5], scatter: [4, 4], heatmap: [4, 4],
    sankey: [5, 5], choropleth: [4, 4],
};

/** Charts whose body is text — they need no plot area to make room for. */
const HOSTLESS = new Set(['stat', 'status']);

/** A stat wearing `number` shows its figure and nothing else. */
export const isBareStat = (card) => card?.chart === 'stat' && variantOf(card) === 'number';

/**
 * How many legend rows a card has to find room for.
 *
 * A breakdown reading returns its own categories, so the count is whatever the
 * data says; four is the fallback when the card has not read yet.
 */
const legendRows = (card, data) => {
    const rows = Array.isArray(data) ? data.length : null;
    return Math.min(8, Math.max(2, rows ?? 4));
};

/**
 * The floor for this card, accounting for what it actually has to draw.
 *
 * @param {object} card  the card descriptor
 * @param {Array}  data  the read's rows, when the card has them — a ring with
 *                       five categories needs more height than one with two
 * @returns {[number, number]} [columns, rows]
 */
export function minSizeFor(card, data = null) {
    const chart = card?.chart ?? 'stat';
    let [w, h] = MIN_SIZE[chart] ?? [3, 3];

    if (chart === 'stat') {
        const v = variantOf(card);
        if (v === 'number') [w, h] = [3, 1];
        else if (v === 'spark' || v === 'delta') [w, h] = [3, 3];
        else [w, h] = [3, 4];
    }
    if (chart === 'sparkline') [w, h] = [3, 3];

    /* Anything with a plot needs a body; only text can live in one row. */
    if (!HOSTLESS.has(chart) && !isBareStat(card)) h = Math.max(h, 3);

    /* A dial carries its legend underneath: header ~60px + dial ~200px +
       ~47px a row, over the 88px grid pitch. */
    if (chart === 'pie' || chart === 'ring' || chart === 'sunburst') {
        h = Math.max(h, 2 + Math.ceil(legendRows(card, data) * 0.75));
    }
    /* A funnel is stacked rows — height per stage, no dial. */
    if (chart === 'funnel') h = Math.max(h, legendRows(card, data) + 1);

    /* A comparison needs a row for its legend. */
    if (MULTI_SERIES_CHARTS.has(chart) && seriesCount(card) > 1) h += 1;

    return [w, h];
}

/* ------------------------------------------------------------------ *
 * Applying the floor to categories and fits
 * ------------------------------------------------------------------ */

/** The fits of a category this card is allowed to take. */
export function legalFitsFor(card, category, data = null) {
    const [mw, mh] = minSizeFor(card, data);
    return fitsFor(category).filter((fit) => {
        const { w, h } = dimensionsOf(category, fit.key);
        return w >= mw && h >= mh;
    });
}

/** Categories that have at least one fit this card can take. */
export const legalCategoriesFor = (card, data = null) =>
    CATEGORY_KEYS.filter((c) => legalFitsFor(card, c, data).length > 0);

/** The leanest category that can actually hold this card. */
export const floorCategoryFor = (card, data = null) =>
    legalCategoriesFor(card, data)[0] ?? 'C6';

/**
 * The geometry a card should take right now.
 *
 * Called when the chart or variant changes: the old size was measured for a
 * chart that is gone, so it is discarded rather than carried over. This is the
 * fix for a card keeping a six-row box after being switched to a ring that
 * needs eight — the state where the period line clips and the legend collapses
 * to two scrolling rows.
 *
 * @returns {{category: string, fit: string|null}}
 */
export function resizeForChart(card, data = null) {
    const category = floorCategoryFor(card, data);
    const fits = legalFitsFor(card, category, data);
    return { category, fit: fits[0]?.key ?? null };
}

/**
 * Keep a card's geometry legal after its content changed.
 *
 * Unlike `resizeForChart` this preserves the user's chosen size when it is
 * still big enough — it only grows a card that has outgrown its box.
 */
export function clampGeometry(card, data = null) {
    const category = card?.category;
    const fits = category ? legalFitsFor(card, category, data) : [];

    if (fits.some((f) => f.key === card?.fit)) {
        return { category, fit: card.fit };
    }
    if (fits.length) return { category, fit: fits[0].key };
    return resizeForChart(card, data);
}

/**
 * What `react-grid-layout` must not let a card be dragged past.
 *
 * The Layout Law states a max per category and a floor per chart, and both
 * were being enforced only where a card was *created* — nothing stopped a
 * resize handle dragging a card straight through either. Passing these on the
 * layout item makes the grid itself refuse, so the law holds at the one place
 * a user can actually break it.
 *
 * @returns {{minW:number, minH:number, maxW:number, maxH:number}}
 */
export function constraintsFor(card, data = null) {
    const [minW, minH] = minSizeFor(card, data);
    const max = CATEGORIES?.[card?.category]?.max ?? {};

    const maxW = Math.min(max.w ?? GRID.columns, GRID.columns);
    const maxH = max.h ?? 16;

    return {
        minW: Math.min(minW, maxW),
        minH: Math.min(minH, maxH),
        maxW,
        maxH,
    };
}

export default {
    VARIANTS, constraintsFor, variantsOf, defaultVariant, variantOf, variantsFor, fixVariant,
    NEEDS_SERIES, ONLY_SINGLE, MULTI_SERIES_CHARTS, seriesCount,
    MIN_SIZE, minSizeFor, isBareStat,
    legalFitsFor, legalCategoriesFor, floorCategoryFor, resizeForChart, clampGeometry,
};
