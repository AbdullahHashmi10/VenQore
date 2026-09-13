/**
 * Theme: Classic
 * ─────────────────────────────────────────────────────────────────────────────
 * Traditional business software, for the accountant who has used the same ERP
 * since 2009 and does not want a redesign.
 *
 * Three deliberate departures from the rest of the library:
 *
 *   1. HIGHER CONTRAST. Near-black text on white, hard borders, no soft greys.
 *      This is the theme people over 45 and people on cheap monitors ask for,
 *      and it is the one that survives a fluorescent-lit back office.
 *
 *   2. DENSER. Roughly 20% tighter than the baseline and a smaller type scale,
 *      because the audience for this theme measures a screen by how many rows
 *      it shows without scrolling.
 *
 *   3. SQUARER. Radii drop to 2–4px. Rounded corners read as "consumer app";
 *      square corners read as "record system".
 *
 * The floor of 11px from the baseline type scale is kept even here. Density is
 * worth paying for; illegibility is not.
 */

import { buildRamps, composeTheme, FONT_STACKS } from './_kit.js';

const BASES = {
    neutral: '#6b7280',
    brand: '#1447b0',
    accent: '#5b4bb8',
    info: '#0f6fbd',
    success: '#15803d',
    warning: '#b45309',
    danger: '#b91c1c',
    highlight: '#a21caf',
};

const RAMPS = buildRamps({
    bases: BASES,
    chroma: 1.06,
    neutralOverrides: {
        50: '#f8f9fa',
        100: '#f1f3f5',
        200: '#e2e5e9',
        700: '#333a44',
        800: '#1f242c',
        900: '#131820',
        950: '#0a0d12',
    },
    voidStops: {
        50: '#eceff3', 100: '#d5dae1', 200: '#aab3bf', 300: '#7f8b9c',
        400: '#57647a', 500: '#3a4557', 600: '#2a3242', 700: '#1d2431',
        800: '#141a24', 900: '#0d1219', 950: '#06080c',
    },
});

const SEMANTIC = {
    light: {
        'bg-app': '#eef1f4',
        'bg-sunken': '#e2e6eb',
        'bg-surface': '#ffffff',
        'bg-raised': '#f8f9fa',
        'bg-overlay': '#ffffff',
        'bg-scrim': '#0a0d12',

        // Pure-ish black. This theme's whole promise is contrast.
        ink: '#0d1219',
        'ink-secondary': '#293241',
        'ink-muted': '#4d5665',
        'ink-faint': '#7b8595',
        'ink-inverted': '#ffffff',

        border: '#c9d0d8',
        'border-strong': '#9aa4b1',
        'border-subtle': '#e2e6eb',

        'interactive-hover': '#eef1f4',
        'interactive-active': '#dfe4ea',
        'interactive-selected': '#dbe7fa',
        'focus-ring': '#1447b0',
    },

    dark: {
        'bg-app': '#0d1219',
        'bg-sunken': '#06080c',
        'bg-surface': '#141a24',
        'bg-raised': '#1d2431',
        'bg-overlay': '#1d2431',
        'bg-scrim': '#06080c',

        ink: '#ffffff',
        'ink-secondary': '#dee3ea',
        'ink-muted': '#a3adbb',
        'ink-faint': '#75808f',
        'ink-inverted': '#0d1219',

        border: '#2a3242',
        'border-strong': '#44506380',
        'border-subtle': '#1a212c',

        'interactive-hover': '#1d2431',
        'interactive-active': '#26303f',
        'interactive-selected': '#16305c',
        'focus-ring': '#5b93e8',
    },
};

export default composeTheme({
    id: 'classic',
    name: 'Classic',
    description:
        'High-contrast, dense, square-cornered business software. Built for ' +
        'long shifts, wide tables and users who prefer conventional ERP chrome.',
    defaultMode: 'light',

    ramps: RAMPS,
    semantic: SEMANTIC,

    typography: {
        families: {
            sans: FONT_STACKS.system,
            display: FONT_STACKS.system,
            numeric: FONT_STACKS.mono,
        },
        // One step down from the baseline across the board, floored at 11px.
        sizes: {
            '2xs': ['0.6875rem', '1rem'],
            '1xs': ['0.75rem', '1.125rem'],
            xs: ['0.75rem', '1.125rem'],
            sm: ['0.875rem', '1.375rem'],
            base: ['0.9375rem', '1.5rem'],
            lg: ['1.0625rem', '1.625rem'],
            xl: ['1.25rem', '1.75rem'],
            '2xl': ['1.5rem', '2rem'],
            '3xl': ['1.875rem', '2.25rem'],
        },
        // Restored bold. Where Daylight Calm softens weight to reduce shouting,
        // this theme uses weight as its primary hierarchy signal — it is what
        // traditional ERP chrome does, and the audience reads it as structure.
        weights: {
            semibold: '600',
            bold: '700',
            extrabold: '800',
            black: '800',
        },
        leading: {
            none: '1.05',
            tight: '1.2',
            snug: '1.35',
            normal: '1.5',
            relaxed: '1.65',
            loose: '1.9',
        },
    },

    shape: {
        radius: {
            xs: '0px',
            sm: '2px',
            md: '3px',
            lg: '4px',
            xl: '5px',
            '2xl': '6px',
            '3xl': '8px',
        },
        shadow: {
            xs: '0 1px 0 0 rgb(13 18 25 / 0.06)',
            sm: '0 1px 2px 0 rgb(13 18 25 / 0.10)',
            md: '0 2px 4px 0 rgb(13 18 25 / 0.12)',
            lg: '0 4px 10px -2px rgb(13 18 25 / 0.16)',
            xl: '0 10px 20px -6px rgb(13 18 25 / 0.20)',
            '2xl': '0 18px 36px -12px rgb(13 18 25 / 0.28)',
            glow: '0 0 0 2px rgb(20 71 176 / 0.35)',
        },
        border: { hairline: '1px', thin: '1px', thick: '2px' },
    },

    density: {
        space: {
            '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.34375rem', '2': '0.46875rem',
            '3': '0.6875rem', '4': '0.9375rem', '5': '1.1875rem', '6': '1.375rem',
            '8': '1.875rem', '10': '2.3125rem', '12': '2.75rem', '16': '3.75rem',
            '20': '4.6875rem', '24': '5.625rem',
        },
        control: {
            'height-sm': '1.75rem',
            'height-md': '2.125rem',
            'height-lg': '2.625rem',
            'padding-x': '0.75rem',
            gap: '0.5rem',
        },
        layout: {
            gutter: '1rem',
            'section-gap': '1.5rem',
            'card-padding': '1rem',
            // Uncapped on purpose: this audience wants the whole monitor used.
            'page-max-width': '100%',
            'sidebar-width': '15.5rem',
        },
    },

    motion: {
        // Traditional software does not animate. Fast enough to feel responsive,
        // short enough to feel like nothing moved.
        duration: { instant: '0ms', fast: '90ms', normal: '130ms', slow: '200ms', slower: '300ms' },
        easing: {
            standard: 'ease-out',
            entrance: 'ease-out',
            exit: 'ease-in',
            spring: 'ease-out',
        },
    },

    gradients: {
        brand: 'linear-gradient(180deg, #2159c9 0%, #1447b0 100%)',
        'brand-soft': 'linear-gradient(180deg, rgb(20 71 176 / 0.10), rgb(20 71 176 / 0.03))',
        success: 'linear-gradient(180deg, #1a9349 0%, #15803d 100%)',
        info: 'linear-gradient(180deg, #1580d4 0%, #0f6fbd 100%)',
        danger: 'linear-gradient(180deg, #d02323 0%, #b91c1c 100%)',
        aurora: 'none',
        'hairline-accent': 'linear-gradient(to right, rgb(20 71 176 / 0.4), rgb(20 71 176 / 0.4))',
    },
});
