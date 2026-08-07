/**
 * Theme: <YOUR THEME NAME>
 * ─────────────────────────────────────────────────────────────────────────────
 * Copy this file, rename it, fill in the four dials, register it in
 * `../active.js`, then run `npm run theme:build`.
 *
 * The build validates the result and refuses to compile a theme with missing
 * tokens, so you cannot half-finish one and discover it in production.
 *
 * ── The short version ───────────────────────────────────────────────────────
 *
 *   1. Set the four BASE colours below.
 *   2. Run `npm run theme:build` — it will tell you if anything is missing and
 *      warn you about any text/background pair that fails WCAG AA.
 *   3. Point `ACTIVE_THEME` at your theme and run `npm run dev`.
 *
 * Everything else has a working default. Adjust once you can see it running.
 */

import { ramp, literalRamp } from '../color.js';

/* ═══════════════════════════════════════════════════════════════════════════
   1. THE FOUR DIALS
   ═══════════════════════════════════════════════════════════════════════════
   Start here. Most of the theme derives from these.
   ═══════════════════════════════════════════════════════════════════════════ */

const BASE = {
    /**
     * Chrome. Drives nearly every surface, border and body text in the product,
     * because the `slate` family alone accounts for ~24,000 class usages.
     *
     * This is the highest-leverage colour in the whole file. Cool greys (blue
     * undertone) read as "software"; warm greys (yellow/red undertone) read as
     * "paper". Pick deliberately.
     */
    neutral: '#71717a',

    /** Primary actions, active navigation, focus rings, links. */
    brand: '#4a6fa5',

    /** Secondary brand. Decorative gradients, secondary CTAs, highlights. */
    accent: '#9c7b6a',

    /**
     * Global saturation multiplier. 1 = exactly as specified above.
     * Drop to 0.8–0.9 for a calmer feel; push past 1 to intensify.
     */
    chroma: 1,
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. RAMPS
   ═══════════════════════════════════════════════════════════════════════════
   `ramp(base)` builds all 11 stops (50 → 950) from one colour.

     ramp('#4a6fa5')                          // base lands on the 500 stop
     ramp('#4a6fa5', { anchor: 600 })         // base lands on 600 instead
     ramp('#4a6fa5', { hueShift: -8 })        // hue drifts across the scale
     ramp('#4a6fa5', { overrides: { 950: '#0b0a1c' } })   // pin one stop

   Use `literalRamp({...})` instead when you want to specify all 11 by hand.
   ═══════════════════════════════════════════════════════════════════════════ */

const RAMPS = {
    neutral: ramp(BASE.neutral, { chroma: BASE.chroma }),
    brand: ramp(BASE.brand, { chroma: BASE.chroma }),
    accent: ramp(BASE.accent, { chroma: BASE.chroma }),

    // Status colours. Keep these distinguishable from each other and from the
    // brand — in an accounting product, mistaking "paid" for "overdue" costs
    // somebody real money.
    success: ramp('#4f8a5b', { chroma: BASE.chroma }),
    warning: ramp('#c08a3e', { chroma: BASE.chroma }),
    danger: ramp('#b4544a', { chroma: BASE.chroma }),
    info: ramp('#4a7b9d', { chroma: BASE.chroma }),
    highlight: ramp('#a9647a', { chroma: BASE.chroma }),

    /**
     * The deep backgrounds used by auth screens, marketing pages and the
     * platform shell. Required — around 287 elements reference `void-*`.
     */
    void: literalRamp({
        50: '#eceae7',
        100: '#d6d2cd',
        200: '#ada79f',
        300: '#847d73',
        400: '#5c564e',
        500: '#403b35',
        600: '#2f2b26',
        700: '#242019',
        800: '#1a1713',
        900: '#12100d',
        950: '#0a0908',
    }, 'template void'),
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. PALETTE BINDINGS
   ═══════════════════════════════════════════════════════════════════════════
   Which ramp each Tailwind colour family resolves to. Every family listed in
   contract.js must appear here, or the build fails.

   Collapsing families onto shared roles (as below) is usually the right call:
   the codebase accumulated violet, purple AND fuchsia, plus emerald AND green,
   which is how an interface starts looking accidental rather than designed.
   ═══════════════════════════════════════════════════════════════════════════ */

const PALETTES = {
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

/* ═══════════════════════════════════════════════════════════════════════════
   4. SEMANTIC TOKENS
   ═══════════════════════════════════════════════════════════════════════════
   The only values that flip between light and dark mode.

   `npm run theme:build` checks these for contrast and warns about anything
   below WCAG AA. Pay attention to those warnings — "hard to read" is the most
   common complaint about any interface, and it is almost always here.
   ═══════════════════════════════════════════════════════════════════════════ */

const SEMANTIC = {
    light: {
        'bg-app': '#f4f4f5',       // the page itself
        'bg-sunken': '#e9e9ec',    // wells, table headers, inactive tabs
        'bg-surface': '#ffffff',   // cards, panels, modals
        'bg-raised': '#fafafa',    // elements on top of a card
        'bg-overlay': '#ffffff',   // dropdowns, popovers, tooltips
        'bg-scrim': '#27272a',     // the dim behind a modal

        ink: '#27272a',            // headings, primary values
        'ink-secondary': '#3f3f46',// body copy
        'ink-muted': '#5f5f68',    // labels, metadata
        'ink-faint': '#8b8b94',    // placeholders, disabled
        'ink-inverted': '#ffffff', // text on a brand-filled surface

        border: '#e4e4e7',
        'border-strong': '#c9c9cf',
        'border-subtle': '#f0f0f2',

        'interactive-hover': '#f4f4f5',
        'interactive-active': '#e9e9ec',
        'interactive-selected': '#eaf0f7',
        'focus-ring': BASE.brand,
    },

    dark: {
        'bg-app': '#18181b',
        'bg-sunken': '#101012',
        'bg-surface': '#212124',
        'bg-raised': '#2b2b30',
        'bg-overlay': '#2b2b30',
        'bg-scrim': '#0a0a0b',

        ink: '#f4f4f5',
        'ink-secondary': '#d8d8dc',
        'ink-muted': '#a1a1aa',
        'ink-faint': '#71717a',
        'ink-inverted': '#18181b',

        border: '#303035',
        'border-strong': '#45454c',
        'border-subtle': '#212124',

        'interactive-hover': '#2b2b30',
        'interactive-active': '#37373d',
        'interactive-selected': '#2b3745',
        'focus-ring': '#7d9cc4',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════════════════
   Worth more attention than it usually gets: readability complaints are far
   more often a size and leading problem than a colour problem.

   A size is either `'0.875rem'` (font-size only, leading inherited) or
   `['0.875rem', '1.25rem']` (font-size and line-height).

   The `4xs`–`1xs` steps replace ~2,700 hardcoded micro sizes that used to be
   written as `text-[10px]`. Anything below about 11px is uncomfortable for most
   people; this is your chance to fix that everywhere at once.
   ═══════════════════════════════════════════════════════════════════════════ */

const TYPOGRAPHY = {
    families: {
        sans: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Figtree', ui-sans-serif, system-ui, -apple-system, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        // Tabular figures keep currency columns aligned.
        numeric: "'Figtree', ui-sans-serif, system-ui, sans-serif",
    },

    sizes: {
        '4xs': ['0.6875rem', '1rem'],     // 11px
        '3xs': ['0.6875rem', '1rem'],     // 11px
        '2xs': ['0.75rem', '1.125rem'],   // 12px — the workhorse label size
        '1xs': ['0.8125rem', '1.25rem'],  // 13px

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

    /**
     * `font-bold` appears 5,334 times in this codebase and `font-black` 2,023.
     * When almost everything is heavy, nothing reads as emphasised. Lowering
     * what these names resolve to is a legitimate way to calm the interface
     * without editing 7,000 class names.
     */
    weights: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
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
        wide: '0.02em',
        wider: '0.03em',
        widest: '0.06em',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. SHAPE
   ═══════════════════════════════════════════════════════════════════════════ */

const SHAPE = {
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
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        md: '0 4px 10px -2px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg: '0 12px 24px -6px rgb(0 0 0 / 0.09), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
        xl: '0 24px 40px -10px rgb(0 0 0 / 0.11), 0 8px 16px -8px rgb(0 0 0 / 0.06)',
        '2xl': '0 32px 64px -16px rgb(0 0 0 / 0.16)',
        inner: 'inset 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        glow: '0 0 0 1px rgb(74 111 165 / 0.16), 0 8px 28px -8px rgb(74 111 165 / 0.18)',
    },

    border: { hairline: '1px', thin: '1px', thick: '2px' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. DENSITY
   ═══════════════════════════════════════════════════════════════════════════
   The compact-versus-spacious dial. These feed padding, margin and gap — but
   deliberately not width/height, so icon boxes and fixed dimensions stay put.

   Scale the whole `space` block by ~1.25 for a noticeably roomier product.
   ═══════════════════════════════════════════════════════════════════════════ */

const DENSITY = {
    space: {
        '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem', '2': '0.5rem',
        '3': '0.75rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem',
        '8': '2rem', '10': '2.5rem', '12': '3rem', '16': '4rem',
        '20': '5rem', '24': '6rem',
    },

    control: {
        'height-sm': '2rem',
        'height-md': '2.5rem',
        'height-lg': '3rem',
        'padding-x': '0.875rem',
        gap: '0.625rem',
    },

    layout: {
        gutter: '1.25rem',
        'section-gap': '2rem',
        'card-padding': '1.25rem',
        // Capping the measure matters more than it sounds: full-bleed tables on
        // a wide monitor are tiring, because the eye has to cross the whole
        // screen to connect a row label to its value.
        'page-max-width': '1600px',
        'sidebar-width': '16rem',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. MOTION
   ═══════════════════════════════════════════════════════════════════════════ */

const MOTION = {
    duration: {
        instant: '0ms', fast: '160ms', normal: '260ms',
        slow: '420ms', slower: '650ms',
    },
    easing: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        entrance: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   9. GRADIENTS
   ═══════════════════════════════════════════════════════════════════════════
   Available as `bg-gradient-brand`, `bg-gradient-aurora`, and so on.
   Keep the hue range narrow — a button that travels through three hues reads
   as decoration rather than as a control.
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENTS = {
    brand: `linear-gradient(135deg, ${BASE.brand} 0%, ${BASE.accent} 100%)`,
    'brand-soft': 'linear-gradient(135deg, rgb(74 111 165 / 0.10), rgb(74 111 165 / 0.02))',
    success: 'linear-gradient(135deg, #4f8a5b 0%, #427049 100%)',
    info: 'linear-gradient(135deg, #4a7b9d 0%, #4a6fa5 100%)',
    danger: 'linear-gradient(135deg, #b4544a 0%, #a04a52 100%)',
    aurora:
        'radial-gradient(ellipse at 15% -10%, rgb(74 111 165 / 0.07), transparent 50%), ' +
        'radial-gradient(ellipse at 95% 0%, rgb(156 123 106 / 0.05), transparent 45%)',
    'hairline-accent':
        'linear-gradient(to right, transparent, rgb(74 111 165 / 0.5), transparent)',
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export default {
    id: 'your-theme-id',          // must match the filename and the key in active.js
    name: 'Your Theme Name',
    description: 'One line on who this theme is for and what it is going for.',
    defaultMode: 'light',         // 'light' | 'dark'

    ramps: RAMPS,
    palettes: PALETTES,
    semantic: SEMANTIC,
    typography: TYPOGRAPHY,
    shape: SHAPE,
    density: DENSITY,
    motion: MOTION,
    gradients: GRADIENTS,
};
