/**
 * palette.js — chart ink, from the V6 token layer.
 *
 * ── What changed and why ────────────────────────────────────────────────────
 *
 * This file used to hold seven literal hex values — indigo, violet, blue,
 * emerald, amber, rose, cyan — and a light/dark pair of grid and axis colours,
 * all of them off-system. It was the reason a chart never looked like the card
 * it sat in: `DashboardCardFrame` is written entirely in tokens and the nine
 * chart components under it contained zero.
 *
 * Every value here is now a `var()` onto a V6 token. SVG `fill` and `stroke`
 * resolve custom properties, and so does recharts, so nothing downstream has to
 * change to get a themed chart.
 *
 * ── Three rules this file enforces ──────────────────────────────────────────
 *
 * 1. **Eight slots, fixed order, never cycled.** DESIGN-RULES v3.0 §5. Colour
 *    follows the entity, not its rank, so filtering to fewer series must never
 *    repaint the survivors — and `index % 7`, which is what this did, repaints
 *    everything the moment a ninth series appears. Past slot 8 a series folds
 *    into "Other" in ink rather than wrapping round to slot 1 and claiming to
 *    be the brand.
 *
 * 2. **Slot 1 has two values.** `--vq-series-1` measures 2.93:1 on a
 *    white card — under the 3:1 floor for a mark that encodes a quantity. Light
 *    mode uses `--vq-series-1-ink` (teal-600, 4.33:1) for marks; dark keeps
 *    series-1, which is 7.58:1 there. This is a correction V6 documents against
 *    itself, not a divergence.
 *
 * 3. **The M5 ink law.** One accent hue plus neutrals — a bar chart colours ONE
 *    bar and leaves the rest grey. `emphasis()` is that rule as a function.
 *    Counting hues in a plot area is the check: one accent plus neutrals
 *    passes, a rainbow fails.
 *
 * The light/dark pair is gone. `--vq-chart-grid`, `--vq-chart-axis`,
 * `--vq-chart-label` and `--vq-chart-track` already flip with the theme, so a
 * component asking "which mode am I in" was asking a question the token layer
 * had already answered.
 */

/** The eight categorical slots. Slot 1 is the brand. */
export const SERIES_SLOTS = 8;

export const PALETTE = {
    /**
     * Categorical, in fixed order.
     *
     * Slot 1 reads `--vq-series-1-ink`, which the token layer defines as
     * teal-600 in light and series-1 itself in dark — so the contrast
     * correction happens once, in CSS, rather than in every chart.
     */
    colors: [
        'var(--vq-series-1-ink)',
        'var(--vq-series-2)',
        'var(--vq-series-3)',
        'var(--vq-series-4)',
        'var(--vq-series-5)',
        'var(--vq-series-6)',
        'var(--vq-series-7)',
        'var(--vq-series-8)',
    ],

    /** Magnitude. One hue, light to dark. Never a categorical slot for this. */
    sequential: [
        'var(--vq-seq-1)', 'var(--vq-seq-2)', 'var(--vq-seq-3)',
        'var(--vq-seq-4)', 'var(--vq-seq-5)',
    ],

    /**
     * Polarity. Two hues with a NEUTRAL midpoint — never a hue at the middle,
     * because a coloured centre reads as a third category rather than as zero.
     */
    diverging: [
        'var(--vq-div-neg-2)', 'var(--vq-div-neg-1)',
        'var(--vq-div-mid)',
        'var(--vq-div-pos-1)', 'var(--vq-div-pos-2)',
    ],

    /**
     * State. Semantic colour is data; module colour is wayfinding; they never
     * swap jobs. `neutral` is ink, not the brand — teal means "this is the
     * brand", and the moment a user learns green means *reconciled* a green
     * button becomes a lie.
     */
    semantic: {
        success: 'var(--vq-success)',
        warning: 'var(--vq-warning)',
        danger: 'var(--vq-danger)',
        info: 'var(--vq-info)',
        neutral: 'var(--vq-text-3)',
    },

    /**
     * Chart furniture. Mode-aware in the token layer, so there is no light/dark
     * split here any more.
     */
    chrome: {
        surface: 'var(--vq-chart-surface)',
        grid: 'var(--vq-chart-grid)',
        axis: 'var(--vq-chart-axis)',
        label: 'var(--vq-chart-label)',
        /** The unfilled part of a bar, ring or gauge. */
        track: 'var(--vq-chart-track)',
    },

    /** The accent, for the one mark a chart is drawing attention to. */
    accent: 'var(--vq-accent)',
    ink: 'var(--vq-text)',
    inkMuted: 'var(--vq-text-2)',
    inkFaint: 'var(--vq-text-3)',
};

/**
 * Categorical colour for a series.
 *
 * Beyond eight, returns the "Other" ink rather than wrapping. Eight is not an
 * arbitrary cap: the palette is verified against the Machado–Oliveira–Fernandes
 * CVD model at severity 1.0, and a ninth hue that still separated from the
 * other eight for every form of colour blindness does not exist. A ninth series
 * folds into Other, becomes small multiples, or the chart is wrong.
 */
export function getColor(index) {
    return PALETTE.colors[index] ?? PALETTE.semantic.neutral;
}

/** True when a series has run past the eight slots and should fold to Other. */
export const isOverflowSeries = (index) => index >= SERIES_SLOTS;

/** Semantic colour by state. Never used for a category. */
export function getSemanticColor(status) {
    return PALETTE.semantic[status] ?? PALETTE.semantic.neutral;
}

/**
 * Mechanism M5, as a function.
 *
 * One mark carries the accent and every other mark is neutral. Use it for
 * "today against the last six days", "this branch against the others", "the
 * selected bar" — anywhere the chart has a subject rather than a set of peers.
 *
 * Charts with genuinely equal series use `getColor()` instead. The test is
 * whether one of the marks is what the card is *about*.
 */
export function emphasis(index, activeIndex) {
    return index === activeIndex ? PALETTE.accent : PALETTE.chrome.track;
}

/**
 * Position on the sequential ramp, for a value in 0..1.
 *
 * Magnitude only — heatmap cells, density. Clamped rather than wrapped, because
 * an out-of-range value that quietly re-enters at the light end would read as
 * "almost nothing" when it means "off the scale".
 */
export function getSequential(t) {
    const n = PALETTE.sequential.length;
    const i = Math.round(Math.max(0, Math.min(1, t)) * (n - 1));
    return PALETTE.sequential[i];
}

/**
 * Position on the diverging ramp, for a value in −1..1 where 0 is neutral.
 *
 * Polarity only — budget variance, over/under, profit and loss.
 */
export function getDiverging(t) {
    const n = PALETTE.diverging.length;
    const clamped = Math.max(-1, Math.min(1, t));
    const i = Math.round(((clamped + 1) / 2) * (n - 1));
    return PALETTE.diverging[i];
}

/**
 * Recharts axis and grid props, so no chart hand-writes chart furniture.
 *
 * The defaults encode M5: gridlines dashed and horizontal only, no axis spine,
 * no Y-axis tick labels, X labels bare in `--vq-text-3`. A chart that wants a
 * vertical gridline or a drawn axis is a chart that has not read the rule.
 */
export const AXIS_PROPS = {
    grid: {
        stroke: PALETTE.chrome.grid,
        strokeDasharray: '3 3',
        vertical: false,
    },
    xAxis: {
        axisLine: false,
        tickLine: false,
        tick: {
            fill: PALETTE.chrome.label,
            fontSize: 11,
            fontFamily: 'var(--vq-font-numeric)',
        },
    },
    yAxis: {
        axisLine: false,
        tickLine: false,
        // No Y labels. The value is on the card, in the number block, at 38px.
        // Repeating it down the left edge in 11px is furniture, not information.
        tick: false,
        width: 0,
    },
};

export default PALETTE;
