/**
 * Theme: Colour
 * ─────────────────────────────────────────────────────────────────────────────
 * For cafés, salons, boutiques and lifestyle retail — businesses whose own brand
 * is warm and expressive, and for whom a grey accounting interface feels like
 * borrowed clothes.
 *
 * The temptation with an "expressive" theme is to make everything colourful,
 * which produces a screen nobody can read. This one keeps the discipline the
 * rest of the library has and spends its colour budget in three specific places:
 *
 *   1. A warm cream page background instead of grey-white. This is the single
 *      change that carries most of the feeling, and it costs no legibility.
 *   2. A confident coral-to-violet brand pair for actions and highlights.
 *   3. Rounder corners and a slightly larger type scale, so the product reads as
 *      approachable rather than clinical.
 *
 * Text stays near-black on light surfaces. Warmth in the chrome, not in the copy.
 */

import { buildRamps, composeTheme, FONT_STACKS } from './_kit.js';

const BASES = {
    /** Warm taupe-grey. Reads as paper and card stock, not as screen. */
    neutral: '#8a7f78',

    /** Primary: coral. Friendly, energetic, and still legible when filled. */
    brand: '#e05a47',

    /** Secondary: violet. The counterweight that keeps coral from reading as an error state. */
    accent: '#7c5cd6',

    info: '#3f8fbf',
    success: '#3f9d6a',
    warning: '#dd9a2b',

    /** Danger is pulled deliberately away from the coral brand — a destructive
        action must never be mistakable for a primary one. Deep crimson does it. */
    danger: '#c2255c',

    highlight: '#d9528f',
};

const RAMPS = buildRamps({
    bases: BASES,
    chroma: 1.05,
    // Warmth in the shadows so dark mode stays cocoa rather than going blue.
    neutralHueShift: 8,
    neutralOverrides: {
        50: '#fdfaf7',
        100: '#f8f2ec',
        200: '#eee3d9',
        800: '#332b26',
        900: '#241e1a',
        950: '#171310',
    },
    voidStops: {
        50: '#f2ece7', 100: '#ddd2c9', 200: '#b8a89c', 300: '#93806f',
        400: '#6e5b4c', 500: '#4e3f34', 600: '#3a2f27', 700: '#2b231d',
        800: '#1e1815', 900: '#141010', 950: '#0a0807',
    },
});

const SEMANTIC = {
    light: {
        'bg-app': '#fdf8f3',
        'bg-sunken': '#f6ece3',
        'bg-surface': '#ffffff',
        'bg-raised': '#fffaf6',
        'bg-overlay': '#ffffff',
        'bg-scrim': '#241e1a',

        ink: '#241e1a',
        'ink-secondary': '#463b34',
        'ink-muted': '#6d5f56',
        'ink-faint': '#9d8d82',
        'ink-inverted': '#ffffff',

        border: '#eee0d4',
        'border-strong': '#d8c4b4',
        'border-subtle': '#f7ede5',

        'interactive-hover': '#fdf3ec',
        'interactive-active': '#f8e9df',
        'interactive-selected': '#fde8e4',
        'focus-ring': '#e05a47',
    },

    dark: {
        'bg-app': '#171310',
        'bg-sunken': '#0a0807',
        'bg-surface': '#241e1a',
        'bg-raised': '#2f2721',
        'bg-overlay': '#2f2721',
        'bg-scrim': '#0a0807',

        ink: '#f8f2ec',
        'ink-secondary': '#e0d5cb',
        'ink-muted': '#ab9a8d',
        'ink-faint': '#7d6e63',
        'ink-inverted': '#171310',

        border: '#342b25',
        'border-strong': '#4c3f36',
        'border-subtle': '#241e1a',

        'interactive-hover': '#2f2721',
        'interactive-active': '#3b322b',
        'interactive-selected': '#43241f',
        'focus-ring': '#f08a79',
    },
};

export default composeTheme({
    id: 'colour',
    name: 'Colour',
    description:
        'Warm cream surfaces, coral and violet brand pair, rounder corners. ' +
        'Built for cafés, salons, boutiques and lifestyle retail.',
    defaultMode: 'light',

    ramps: RAMPS,
    semantic: SEMANTIC,

    typography: {
        families: {
            sans: FONT_STACKS.figtree,
            display: FONT_STACKS.grotesk,
            numeric: FONT_STACKS.figtree,
        },
        sizes: {
            sm: ['0.9375rem', '1.5rem'],
            base: ['1rem', '1.6875rem'],
            lg: ['1.25rem', '1.9375rem'],
            xl: ['1.4375rem', '2.0625rem'],
            '2xl': ['1.75rem', '2.375rem'],
            '3xl': ['2.125rem', '2.625rem'],
        },
        tracking: {
            tighter: '-0.035em',
            tight: '-0.02em',
        },
    },

    shape: {
        radius: {
            xs: '0.25rem',
            sm: '0.375rem',
            md: '0.625rem',
            lg: '0.875rem',
            xl: '1.125rem',
            '2xl': '1.5rem',
            '3xl': '2rem',
        },
        // Warm-tinted shadows. A neutral grey shadow over a cream surface reads
        // as dirt; tinting it toward the background keeps the surface clean.
        shadow: {
            xs: '0 1px 2px 0 rgb(36 30 26 / 0.04)',
            sm: '0 2px 4px -1px rgb(36 30 26 / 0.06)',
            md: '0 6px 14px -4px rgb(36 30 26 / 0.09)',
            lg: '0 14px 28px -8px rgb(36 30 26 / 0.12)',
            xl: '0 24px 44px -12px rgb(36 30 26 / 0.15)',
            '2xl': '0 36px 68px -18px rgb(36 30 26 / 0.20)',
            glow: '0 0 0 1px rgb(224 90 71 / 0.22), 0 10px 30px -10px rgb(224 90 71 / 0.28)',
        },
    },

    density: {
        control: {
            'height-sm': '2rem',
            'height-md': '2.625rem',
            // Roomier than the baseline: this theme's audience is very often on a
            // counter-top tablet taking orders with a thumb.
            'height-lg': '3.25rem',
            'padding-x': '1.0625rem',
            gap: '0.75rem',
        },
        layout: {
            gutter: '1.5rem',
            'section-gap': '2.5rem',
            'card-padding': '1.5rem',
            'page-max-width': '1560px',
            'sidebar-width': '17.5rem',
        },
    },

    motion: {
        duration: { instant: '0ms', fast: '180ms', normal: '260ms', slow: '420ms', slower: '650ms' },
        easing: {
            standard: 'cubic-bezier(0.34, 0.1, 0.22, 1)',
            entrance: 'cubic-bezier(0.18, 0.9, 0.26, 1)',
            exit: 'cubic-bezier(0.5, 0, 0.84, 0.16)',
            spring: 'cubic-bezier(0.26, 1.3, 0.4, 1)',
        },
    },

    gradients: {
        brand: 'linear-gradient(135deg, #e05a47 0%, #d9528f 55%, #7c5cd6 100%)',
        'brand-soft': 'linear-gradient(135deg, rgb(224 90 71 / 0.12), rgb(124 92 214 / 0.04))',
        success: 'linear-gradient(135deg, #3f9d6a 0%, #2f8256 100%)',
        info: 'linear-gradient(135deg, #3f8fbf 0%, #3a6fa8 100%)',
        danger: 'linear-gradient(135deg, #c2255c 0%, #a01c4c 100%)',
        aurora:
            'radial-gradient(ellipse at 10% -12%, rgb(224 90 71 / 0.10), transparent 52%), ' +
            'radial-gradient(ellipse at 92% 4%, rgb(124 92 214 / 0.08), transparent 48%)',
        'hairline-accent':
            'linear-gradient(to right, transparent, rgb(224 90 71 / 0.55), rgb(124 92 214 / 0.45), transparent)',
    },
});
