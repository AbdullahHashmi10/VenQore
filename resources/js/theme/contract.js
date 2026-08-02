/**
 * VenQore Theme Engine — the contract.
 *
 * This file defines *what a theme must provide*. It contains no colours of its
 * own. Every theme in `./themes/` is validated against this shape at build
 * time, so a malformed theme fails `npm run build` instead of shipping a page
 * full of invisible text.
 *
 * ── The two layers ────────────────────────────────────────────────────────
 *
 * 1. PALETTE RAMPS (`ramps` + `palettes`)
 *    The ~40,000 existing Tailwind colour classes in this codebase — things
 *    like `bg-indigo-600` and `dark:text-slate-400` — are rewired so that the
 *    *name* `indigo` resolves to whatever ramp the active theme binds to it.
 *    Ramps are NOT mode-dependent: light/dark is already handled throughout the
 *    app by picking different stops (`bg-white dark:bg-slate-900`), so flipping
 *    ramp values per mode would invert every one of those pairs.
 *
 * 2. SEMANTIC TOKENS (`semantic`)
 *    Role-named values (`surface`, `ink`, `border`) that DO flip between light
 *    and dark. New code should use these — `bg-surface text-ink` — because they
 *    need no `dark:` twin and they say what they mean.
 *
 * Both layers are emitted as CSS custom properties by `build/generate.js`.
 */

import { SHADES } from './color.js';

export { SHADES };

/* ------------------------------------------------------------------ *
 * 1. Tailwind palettes under theme control
 * ------------------------------------------------------------------ */

/**
 * Every Tailwind colour family that appears in `resources/js`. Each one must be
 * bound to a ramp by every theme, otherwise classes using it would silently
 * fall back to Tailwind's stock colours and drift away from the theme.
 *
 * Counts are occurrences found in the JSX at the time of the migration and are
 * kept here purely as a hint about which families actually carry weight.
 */
export const CONTROLLED_PALETTES = [
    'slate',   // 24,452 — the entire UI chrome
    'gray',    //    319
    'zinc',    //     38
    'indigo',  //  6,306 — de facto brand colour
    'violet',  //    347
    'purple',  //    899
    'fuchsia', //      3
    'blue',    //    830
    'sky',     //     59
    'cyan',    //     77
    'teal',    //    104
    'emerald', //  3,452 — money in, positive deltas
    'green',   //     90
    'lime',    //      0 — reserved
    'yellow',  //     60
    'amber',   //  1,757 — warnings, pending states
    'orange',  //    396
    'red',     //  2,122 — money out, destructive
    'rose',    //    798
    'pink',    //     49
    'stone',   //      0 — reserved for warm-neutral themes
    'neutral', //      0 — reserved for warm-neutral themes
    'void',    //    287 — VenQore-specific: the deep backgrounds that used to be
               //          written as arbitrary values (`bg-[#05030f]`) on auth,
               //          marketing and platform-shell screens. Not a Tailwind
               //          family; introduced by this engine so those screens are
               //          themeable rather than hardcoded.
];

/* ------------------------------------------------------------------ *
 * 2. Semantic roles
 * ------------------------------------------------------------------ */

/**
 * Role ramps every theme must define. These power the semantic Tailwind
 * classes (`bg-brand-500`, `text-success-600`, …) that new code should prefer.
 * A theme is free to point several roles at the same ramp.
 */
export const REQUIRED_ROLES = [
    'neutral',   // page chrome, text, borders
    'brand',     // primary actions, active nav, focus rings
    'accent',    // secondary brand, decorative gradients
    'info',      // neutral informational states
    'success',   // completed, paid, stock in
    'warning',   // pending, low stock, needs attention
    'danger',    // destructive, overdue, stock out
    'highlight', // promotional, "new", callouts
];

/**
 * Mode-flipping surface/text tokens. Keys are required in BOTH `semantic.light`
 * and `semantic.dark`. Emitted as `--vq-<key>`.
 */
export const SEMANTIC_TOKENS = [
    // Backgrounds, from furthest back to closest to the reader
    'bg-app',        // the page itself
    'bg-sunken',     // wells, table headers, inactive tabs
    'bg-surface',    // cards, panels, modals
    'bg-raised',     // elements sitting on top of a card
    'bg-overlay',    // dropdowns, popovers, tooltips
    'bg-scrim',      // the dim behind a modal

    // Text, from loudest to quietest
    'ink',           // headings and primary values
    'ink-secondary', // body copy
    'ink-muted',     // labels, captions, metadata
    'ink-faint',     // placeholders, disabled
    'ink-inverted',  // text on a brand-filled surface

    // Lines
    'border',        // default hairline
    'border-strong', // emphasised divider, input outline
    'border-subtle', // barely-there separator

    // Interaction
    'interactive-hover',
    'interactive-active',
    'interactive-selected',
    'focus-ring',
];

/* ------------------------------------------------------------------ *
 * 3. Non-colour token groups
 * ------------------------------------------------------------------ */

/**
 * Typography. This is the half of "make it less tacky" that colour alone can't
 * fix — line-height and measure do more for readability than any palette.
 */
export const TYPOGRAPHY_TOKENS = {
    families: ['sans', 'display', 'mono', 'numeric'],

    /**
     * The scale extends unusually far downward — `4xs` is 8px — because the
     * codebase does. An audit found ~2,700 hardcoded micro sizes written as
     * arbitrary values: `text-[10px]` (1,851), `text-[9px]` (431),
     * `text-[11px]` (237), `text-[8px]` (132).
     *
     * Arbitrary values are invisible to any theme, so as long as they exist no
     * theme can fix legibility. Giving those four sizes real names is what
     * brings them under control; the downward steps mirror Tailwind's upward
     * `2xl`/`3xl` convention so the ordering reads correctly.
     *
     * A size may be either a bare string (font-size only, leaving line-height
     * inherited — which is how the arbitrary values behaved) or a
     * `[size, lineHeight]` pair.
     */
    sizes: [
        '4xs', '3xs', '2xs', '1xs',
        'xs', 'sm', 'base', 'lg', 'xl',
        '2xl', '3xl', '4xl', '5xl',
    ],

    weights: ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'],
    leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
    tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'],
};

/** Corner radii and elevation. */
export const SHAPE_TOKENS = {
    radius: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
    shadow: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'glow'],
    border: ['hairline', 'thin', 'thick'],
};

/**
 * Density — the single dial that makes a theme feel "spacious" or "compact".
 * Control heights, gutters and the base spacing step all scale from here, so a
 * theme can be loosened without editing a single component.
 */
export const DENSITY_TOKENS = {
    space: ['0.5', '1', '1.5', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24'],
    control: ['height-sm', 'height-md', 'height-lg', 'padding-x', 'gap'],
    layout: ['gutter', 'section-gap', 'card-padding', 'page-max-width', 'sidebar-width'],
};

/** Motion. Themes that feel calmer generally move slower and ease softer. */
export const MOTION_TOKENS = {
    duration: ['instant', 'fast', 'normal', 'slow', 'slower'],
    easing: ['standard', 'entrance', 'exit', 'spring'],
};

/* ------------------------------------------------------------------ *
 * 4. CSS custom property naming
 * ------------------------------------------------------------------ */

/** All theme variables share this prefix so they can never collide. */
export const VAR_PREFIX = '--vq';

/**
 * Ramps and palettes live in separate namespaces on purpose.
 *
 * A palette variable is an *indirection* onto a ramp variable:
 *
 *     --vq-ramp-neutral-500: 125 119 112;          <- the ramp defines the value
 *     --vq-slate-500: var(--vq-ramp-neutral-500);  <- the palette points at it
 *
 * Without the `ramp-` prefix, a theme that names a ramp after a palette (which
 * Midnight Nebula does for all 22 of them) would emit
 * `--vq-slate-500: var(--vq-slate-500)` — a self-reference that CSS discards,
 * leaving the colour undefined. The extra namespace makes that impossible.
 */
export const cssVar = {
    /** `--vq-ramp-brand-600` — where a ramp's actual value lives. */
    ramp: (name, shade) => `${VAR_PREFIX}-ramp-${name}-${shade}`,
    /** `--vq-indigo-600` — what Tailwind reads; points at a ramp variable. */
    palette: (name, shade) => `${VAR_PREFIX}-${name}-${shade}`,
    /** `--vq-bg-surface` */
    semantic: (key) => `${VAR_PREFIX}-${key}`,
    /** `--vq-font-sans` */
    font: (key) => `${VAR_PREFIX}-font-${key}`,
    /** `--vq-text-base` */
    size: (key) => `${VAR_PREFIX}-text-${key}`,
    weight: (key) => `${VAR_PREFIX}-weight-${key}`,
    leading: (key) => `${VAR_PREFIX}-leading-${key}`,
    tracking: (key) => `${VAR_PREFIX}-tracking-${key}`,
    radius: (key) => `${VAR_PREFIX}-radius-${key}`,
    shadow: (key) => `${VAR_PREFIX}-shadow-${key}`,
    space: (key) => `${VAR_PREFIX}-space-${key}`,
    control: (key) => `${VAR_PREFIX}-control-${key}`,
    layout: (key) => `${VAR_PREFIX}-layout-${key}`,
    duration: (key) => `${VAR_PREFIX}-duration-${key}`,
    easing: (key) => `${VAR_PREFIX}-ease-${key}`,
    gradient: (key) => `${VAR_PREFIX}-gradient-${key}`,
};

/**
 * How a ramp variable is consumed by Tailwind. The `<alpha-value>` placeholder
 * is what keeps `/30` opacity modifiers working — see color.js for why the
 * variables hold bare channel triplets rather than hex.
 */
export const paletteColorRef = (name, shade) =>
    `rgb(var(${cssVar.palette(name, shade)}) / <alpha-value>)`;

export const semanticColorRef = (key) =>
    `rgb(var(${cssVar.semantic(key)}) / <alpha-value>)`;

/* ------------------------------------------------------------------ *
 * 5. Validation
 * ------------------------------------------------------------------ */

/**
 * Check a theme against the contract. Returns a list of human-readable
 * problems; an empty list means the theme is safe to compile.
 */
export function validateTheme(theme) {
    const problems = [];
    const at = theme?.id ? `theme "${theme.id}"` : 'theme';

    if (!theme || typeof theme !== 'object') {
        return [`${at}: expected an object, got ${typeof theme}.`];
    }
    if (!theme.id) problems.push(`${at}: missing "id".`);
    if (!theme.name) problems.push(`${at}: missing "name".`);

    // -- ramps ------------------------------------------------------
    const ramps = theme.ramps || {};
    if (!Object.keys(ramps).length) problems.push(`${at}: defines no ramps.`);

    for (const [rampName, stops] of Object.entries(ramps)) {
        for (const shade of SHADES) {
            if (stops?.[shade] == null) {
                problems.push(`${at}: ramp "${rampName}" is missing the ${shade} stop.`);
            }
        }
    }

    for (const role of REQUIRED_ROLES) {
        if (!ramps[role]) {
            problems.push(`${at}: missing required role ramp "${role}".`);
        }
    }

    // -- palette bindings -------------------------------------------
    const palettes = theme.palettes || {};
    for (const palette of CONTROLLED_PALETTES) {
        const target = palettes[palette];
        if (!target) {
            problems.push(
                `${at}: Tailwind palette "${palette}" is not bound to a ramp. ` +
                `Every controlled palette needs a binding or its classes fall back to stock Tailwind.`,
            );
        } else if (!ramps[target]) {
            problems.push(`${at}: palette "${palette}" points at unknown ramp "${target}".`);
        }
    }

    // -- semantic tokens --------------------------------------------
    for (const mode of ['light', 'dark']) {
        const set = theme.semantic?.[mode];
        if (!set) {
            problems.push(`${at}: missing semantic.${mode}.`);
            continue;
        }
        for (const token of SEMANTIC_TOKENS) {
            if (set[token] == null) {
                problems.push(`${at}: semantic.${mode} is missing "${token}".`);
            }
        }
    }

    // -- non-colour groups ------------------------------------------
    const groupChecks = [
        ['typography.families', theme.typography?.families, TYPOGRAPHY_TOKENS.families],
        ['typography.sizes', theme.typography?.sizes, TYPOGRAPHY_TOKENS.sizes],
        ['typography.weights', theme.typography?.weights, TYPOGRAPHY_TOKENS.weights],
        ['typography.leading', theme.typography?.leading, TYPOGRAPHY_TOKENS.leading],
        ['typography.tracking', theme.typography?.tracking, TYPOGRAPHY_TOKENS.tracking],
        ['shape.radius', theme.shape?.radius, SHAPE_TOKENS.radius],
        ['shape.shadow', theme.shape?.shadow, SHAPE_TOKENS.shadow],
        ['density.space', theme.density?.space, DENSITY_TOKENS.space],
        ['density.control', theme.density?.control, DENSITY_TOKENS.control],
        ['density.layout', theme.density?.layout, DENSITY_TOKENS.layout],
        ['motion.duration', theme.motion?.duration, MOTION_TOKENS.duration],
        ['motion.easing', theme.motion?.easing, MOTION_TOKENS.easing],
    ];

    for (const [label, actual, expectedKeys] of groupChecks) {
        if (!actual) {
            problems.push(`${at}: missing ${label}.`);
            continue;
        }
        for (const key of expectedKeys) {
            if (actual[key] == null) {
                problems.push(`${at}: ${label} is missing "${key}".`);
            }
        }
    }

    return problems;
}
