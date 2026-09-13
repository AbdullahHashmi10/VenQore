/**
 * VenQore Theme Engine — JavaScript access to theme values.
 *
 * ── When to use this instead of a CSS class ─────────────────────────────────
 *
 * Almost never. If you can express it as a Tailwind class, do that — the class
 * reads through a CSS variable and costs nothing at runtime.
 *
 * There is one place classes genuinely can't reach: **SVG presentation
 * attributes**. `fill`, `stroke` and `stopColor` on an SVG element render as
 * HTML attributes, and `var()` is only valid inside a CSS declaration — not in
 * an attribute value. So this does NOT work:
 *
 *     <Area stroke="var(--vq-indigo-500)" />     ✗ renders nothing
 *
 * Recharts passes its `stroke`/`fill` props straight through as attributes, so
 * every chart in the app hits this. Use the exported values instead:
 *
 *     import { vq } from '@/theme/runtime';
 *     <Area stroke={vq.indigo[500]} />           ✓
 *
 * The export is called `vq` rather than something shorter deliberately: `c` was
 * the obvious choice and turned out to collide with local variables and callback
 * parameters in 19 files. Shadowing like that is legal JavaScript and parses
 * cleanly, so it fails silently at runtime — the worst possible failure mode.
 *
 * ── Why plain values rather than a hook ─────────────────────────────────────
 *
 * Ramps do not change between light and dark mode — the app expresses mode by
 * picking different stops (`bg-white dark:bg-slate-900`), not by redefining what
 * `slate-900` means. So a ramp colour is a constant for the whole session and
 * needs no hook, no context and no re-render. It changes when you switch themes
 * and rebuild, which is exactly the intended granularity.
 *
 * Values that *do* flip with the mode live in `useSemanticTokens()` below.
 */

/**
 * Note: this module imports no React and no context on purpose. It is pulled in
 * by ordinary utility modules and by files that run outside the React tree, and
 * dragging the component layer along would be both wasteful and circular. The
 * one React-flavoured helper lives in `useSemanticTokens.js` next door.
 */

import { getActiveTheme } from './active.js';
import { toHex } from './color.js';
import { CONTROLLED_PALETTES, REQUIRED_ROLES, SHADES } from './contract.js';

const theme = getActiveTheme();

/* ------------------------------------------------------------------ *
 * Ramp colours — mode-independent, safe as constants
 * ------------------------------------------------------------------ */

function buildScale(rampName) {
    const stops = theme.ramps[rampName];
    const out = {};
    for (const shade of SHADES) out[shade] = toHex(stops[shade]);
    return out;
}

/**
 * Every themed colour, by the pigment name the codebase already uses.
 *
 *     vq.indigo[500]   vq.slate[800]   vq.emerald[400]   vq.void[950]
 *
 * These follow the active theme: under Daylight Calm, `vq.indigo[500]` returns a
 * muted slate-blue, because that theme binds the `indigo` family to its `brand`
 * ramp. The name is legacy vocabulary; the value is always current.
 */
export const vq = Object.fromEntries(
    CONTROLLED_PALETTES.map((palette) => [palette, buildScale(theme.palettes[palette])]),
);

/**
 * The same colours by role. Prefer these in new code — `role.brand[500]` keeps
 * meaning the right thing after a rebrand, where `vq.indigo[500]` starts lying.
 *
 *     role.brand[500]   role.success[600]   role.danger[400]
 */
export const role = Object.fromEntries(
    REQUIRED_ROLES.map((name) => [name, buildScale(name)]),
);

/** Theme gradients, as ready-to-use CSS `background` values. */
export const gradients = { ...(theme.gradients || {}) };

/**
 * A sensible default series for charts, ordered so that adjacent series stay
 * distinguishable. Reach for this instead of hand-picking colours per chart —
 * that is how a product ends up with eleven different blues.
 */
const ramp = (name) => buildScale(name);

/**
 * Categorical data colour — DESIGN-RULES §5, the eight slots, in order.
 *
 * Fixed order, never cycled. Slot 1 is the brand, so the first series in every
 * chart is VenQore teal. A ninth series folds into "Other", becomes small
 * multiples, or the chart is wrong.
 *
 * Light marks take the 600 stop, not 500: §5 records that `--vq-series-1`
 * (#0BAA8F) measures 2.93:1 on a white card, under the 3:1 floor for a mark that
 * encodes a quantity. Dark takes the 400 stop for the same reason inverted.
 *
 * Every value here comes from the active theme's ramps, so a rebrand moves the
 * charts with it. Do NOT hand-pick chart colours at the call site — that is how
 * a product ends up with eleven different blues, and how five palettes in this
 * codebase came to render four identical slices (violet, purple, fuchsia and
 * pink all resolve to the same plum ramp).
 */
const SERIES_RAMPS = ['teal', 'coral', 'sky', 'butter', 'lime', 'plum', 'teal', 'ink'];

export const series = {
    light: SERIES_RAMPS.map((r, i) => ramp(r)[i === 6 ? 900 : i === 7 ? 500 : 600]),
    dark:  SERIES_RAMPS.map((r, i) => ramp(r)[i === 6 ? 100 : i === 7 ? 400 : 400]),
};

/** The categorical series for the current mode. Pass `isDarkMode`. */
export const seriesFor = (isDark) => (isDark ? series.dark : series.light);

/**
 * Sequential — magnitude, one hue (§5). Use for a single measure ramped by size,
 * never for unrelated categories.
 */
export const sequential = {
    light: [100, 300, 500, 700, 900].map((s) => ramp('teal')[s]),
    dark:  [900, 700, 500, 300, 100].map((s) => ramp('teal')[s]),
};

/**
 * Diverging — polarity, two hues with a NEUTRAL midpoint (§5). Never a hue in
 * the middle: a third colour reads as a third category.
 */
export const diverging = {
    light: [ramp('danger')[600], ramp('danger')[300], ramp('ink')[100], ramp('teal')[300], ramp('teal')[600]],
    dark:  [ramp('danger')[400], ramp('danger')[200], ramp('ink')[800], ramp('teal')[300], ramp('teal')[500]],
};

/** @deprecated Use `series` / `seriesFor(isDark)`. Kept so old imports resolve. */
export const chartSeries = series.light;

/** Metadata, occasionally useful for debug panels and support screenshots. */
export const themeInfo = {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    defaultMode: theme.defaultMode,
};

/* ------------------------------------------------------------------ *
 * Semantic tokens — these DO flip with light/dark
 * ------------------------------------------------------------------ */

const semanticHex = {
    light: Object.fromEntries(
        Object.entries(theme.semantic.light).map(([k, v]) => [k, toHex(v)]),
    ),
    dark: Object.fromEntries(
        Object.entries(theme.semantic.dark).map(([k, v]) => [k, toHex(v)]),
    ),
};

/**
 * Mode-aware surface and text colours as plain strings.
 *
 * In React, prefer the `useSemanticTokens()` hook in `./useSemanticTokens.js`,
 * which reads the current mode for you. This form exists for module scope and
 * anything running outside the component tree.
 */
export function getSemanticTokens(isDarkMode) {
    return isDarkMode ? semanticHex.dark : semanticHex.light;
}
