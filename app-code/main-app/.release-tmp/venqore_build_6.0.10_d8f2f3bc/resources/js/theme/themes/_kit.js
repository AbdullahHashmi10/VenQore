/**
 * Theme kit — shared scaffolding for the curated theme library.
 * ─────────────────────────────────────────────────────────────────────────────
 * Midnight Nebula and Daylight Calm are written out longhand, and deliberately
 * so: they were the two themes the visual language was designed *in*, and every
 * pinned value in them carries an argument.
 *
 * The themes added for the New Experience (Minimal, Classic, Colour) are a
 * different kind of object. They are variations on an agreed baseline, and
 * writing each one as another 450-line file would mean three more copies of the
 * same type scale, the same motion curves and the same palette bindings — three
 * more places to forget when the contract grows a token.
 *
 * So this module holds the parts that do not vary, and `composeTheme()` merges a
 * short spec over them. A theme file then says only what makes it that theme.
 *
 * Nothing here bypasses the contract: the output is an ordinary theme object,
 * validated by `validateTheme()` at build time exactly like the longhand ones.
 */

import { ramp, literalRamp } from '../color.js';

/* ------------------------------------------------------------------ *
 * Palette bindings
 * ------------------------------------------------------------------ *
 * Every controlled Tailwind family collapsed onto the nine role ramps —
 * the same consolidation Daylight Calm performs, and the direction the
 * engine's own documentation recommends. A theme can override any entry.
 */
export const ROLE_PALETTES = {
    slate: 'neutral',
    gray: 'neutral',
    zinc: 'neutral',
    stone: 'neutral',
    neutral: 'neutral',

    indigo: 'brand',

    violet: 'accent',
    purple: 'accent',
    fuchsia: 'accent',

    blue: 'info',
    sky: 'info',
    cyan: 'info',
    teal: 'info',

    emerald: 'success',
    green: 'success',
    lime: 'success',

    yellow: 'warning',
    amber: 'warning',
    orange: 'warning',

    red: 'danger',

    rose: 'highlight',
    pink: 'highlight',

    void: 'void',
};

/* ------------------------------------------------------------------ *
 * Typography baseline
 * ------------------------------------------------------------------ *
 * Carried over from Daylight Calm, including the two decisions that did
 * the most for readability: no step below 11px, and flattened top-end
 * weights so `font-bold` (2,023 usages) stops shouting.
 */
const SYSTEM_SANS =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const FONT_STACKS = {
    inter: `'Inter', ${SYSTEM_SANS}`,
    figtree: `'Figtree', ${SYSTEM_SANS}`,
    system: SYSTEM_SANS,
    grotesk: `'Space Grotesk', ${SYSTEM_SANS}`,
    serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
};

export const BASE_TYPOGRAPHY = {
    families: {
        sans: FONT_STACKS.inter,
        display: FONT_STACKS.inter,
        mono: FONT_STACKS.mono,
        numeric: FONT_STACKS.inter,
    },

    sizes: {
        '4xs': ['0.6875rem', '1rem'],
        '3xs': ['0.6875rem', '1rem'],
        '2xs': ['0.75rem', '1.125rem'],
        '1xs': ['0.8125rem', '1.25rem'],

        xs: ['0.8125rem', '1.25rem'],
        sm: ['0.9375rem', '1.5rem'],
        base: ['1rem', '1.625rem'],
        lg: ['1.1875rem', '1.875rem'],
        xl: ['1.375rem', '2rem'],
        '2xl': ['1.625rem', '2.25rem'],
        '3xl': ['2rem', '2.5rem'],
        '4xl': ['2.5rem', '3rem'],
        '5xl': ['3.25rem', '1.1'],
    },

    weights: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '600',
        extrabold: '700',
        black: '700',
    },

    leading: {
        none: '1.1',
        tight: '1.3',
        snug: '1.45',
        normal: '1.6',
        relaxed: '1.75',
        loose: '2.1',
    },

    tracking: {
        tighter: '-0.03em',
        tight: '-0.015em',
        normal: '0em',
        wide: '0.015em',
        wider: '0.025em',
        widest: '0.05em',
    },
};

/* ------------------------------------------------------------------ *
 * Shape baseline
 * ------------------------------------------------------------------ */

export const BASE_SHAPE = {
    radius: {
        none: '0px',
        xs: '0.125rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        full: '9999px',
    },

    shadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        md: '0 4px 10px -2px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        lg: '0 12px 24px -6px rgb(15 23 42 / 0.09), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
        xl: '0 24px 40px -10px rgb(15 23 42 / 0.11), 0 8px 16px -8px rgb(15 23 42 / 0.06)',
        '2xl': '0 32px 64px -16px rgb(15 23 42 / 0.16)',
        inner: 'inset 0 1px 3px 0 rgb(15 23 42 / 0.05)',
        glow: '0 0 0 1px rgb(15 23 42 / 0.08), 0 8px 28px -8px rgb(15 23 42 / 0.14)',
    },

    border: { hairline: '1px', thin: '1px', thick: '2px' },
};

/* ------------------------------------------------------------------ *
 * Density baseline
 * ------------------------------------------------------------------ */

export const BASE_DENSITY = {
    space: {
        '0.5': '0.15625rem', '1': '0.28125rem', '1.5': '0.40625rem', '2': '0.5625rem',
        '3': '0.875rem', '4': '1.125rem', '5': '1.40625rem', '6': '1.6875rem',
        '8': '2.25rem', '10': '2.8125rem', '12': '3.375rem', '16': '4.5rem',
        '20': '5.625rem', '24': '6.75rem',
    },

    control: {
        'height-sm': '1.9375rem',
        'height-md': '2.5rem',
        'height-lg': '3rem',
        'padding-x': '0.9375rem',
        gap: '0.6875rem',
    },

    layout: {
        gutter: '1.375rem',
        'section-gap': '2.25rem',
        'card-padding': '1.375rem',
        'page-max-width': '1600px',
        'sidebar-width': '17rem',
    },
};

/* ------------------------------------------------------------------ *
 * Motion baseline
 * ------------------------------------------------------------------ */

export const BASE_MOTION = {
    duration: {
        instant: '0ms', fast: '160ms', normal: '240ms',
        slow: '380ms', slower: '600ms',
    },
    easing: {
        standard: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
        entrance: 'cubic-bezier(0.16, 0.84, 0.28, 1)',
        exit: 'cubic-bezier(0.5, 0, 0.84, 0.16)',
        spring: 'cubic-bezier(0.22, 1.1, 0.36, 1)',
    },
};

/* ------------------------------------------------------------------ *
 * Ramp construction
 * ------------------------------------------------------------------ */

/**
 * Build the nine required role ramps from a compact spec of base colours.
 *
 * `void` is the one that cannot be derived: it is the near-black used by auth,
 * marketing and the platform shell, and its stops need to be chosen rather than
 * curve-generated, so it is supplied literally.
 */
export function buildRamps({ bases, chroma = 1, neutralHueShift = 0, neutralOverrides = {}, voidStops }) {
    return {
        neutral: ramp(bases.neutral, { chroma, hueShift: neutralHueShift, overrides: neutralOverrides }),
        brand: ramp(bases.brand, { chroma }),
        accent: ramp(bases.accent, { chroma }),
        info: ramp(bases.info, { chroma }),
        success: ramp(bases.success, { chroma }),
        warning: ramp(bases.warning, { chroma }),
        danger: ramp(bases.danger, { chroma }),
        highlight: ramp(bases.highlight, { chroma }),
        void: literalRamp(voidStops, 'void'),
    };
}

/* ------------------------------------------------------------------ *
 * Composition
 * ------------------------------------------------------------------ */

const mergeGroup = (base, override) => ({ ...base, ...(override || {}) });

/**
 * Merge a theme spec over the shared baseline.
 *
 * Groups are merged one level deep — `{ typography: { families: {...} } }`
 * replaces only the families it names and leaves sizes, weights, leading and
 * tracking intact. Deeper merging would be guesswork; shallower would force
 * every theme to restate the full type scale, which is exactly what this exists
 * to avoid.
 */
export function composeTheme(spec) {
    return {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        defaultMode: spec.defaultMode || 'light',

        ramps: spec.ramps,
        palettes: { ...ROLE_PALETTES, ...(spec.palettes || {}) },
        semantic: spec.semantic,

        typography: {
            families: mergeGroup(BASE_TYPOGRAPHY.families, spec.typography?.families),
            sizes: mergeGroup(BASE_TYPOGRAPHY.sizes, spec.typography?.sizes),
            weights: mergeGroup(BASE_TYPOGRAPHY.weights, spec.typography?.weights),
            leading: mergeGroup(BASE_TYPOGRAPHY.leading, spec.typography?.leading),
            tracking: mergeGroup(BASE_TYPOGRAPHY.tracking, spec.typography?.tracking),
        },

        shape: {
            radius: mergeGroup(BASE_SHAPE.radius, spec.shape?.radius),
            shadow: mergeGroup(BASE_SHAPE.shadow, spec.shape?.shadow),
            border: mergeGroup(BASE_SHAPE.border, spec.shape?.border),
        },

        density: {
            space: mergeGroup(BASE_DENSITY.space, spec.density?.space),
            control: mergeGroup(BASE_DENSITY.control, spec.density?.control),
            layout: mergeGroup(BASE_DENSITY.layout, spec.density?.layout),
        },

        motion: {
            duration: mergeGroup(BASE_MOTION.duration, spec.motion?.duration),
            easing: mergeGroup(BASE_MOTION.easing, spec.motion?.easing),
        },

        gradients: spec.gradients || {},
    };
}
