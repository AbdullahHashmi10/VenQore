/**
 * Theme: Daylight Calm
 * ─────────────────────────────────────────────────────────────────────────────
 * A deliberate answer to the feedback that Midnight Nebula "feels too technical"
 * and that people are hesitant to work in it.
 *
 * Three changes do most of the work, and they are worth understanding because
 * two of them are not about colour at all:
 *
 *   1. WARM NEUTRALS. The chrome moves off cool blue-grey (slate) onto a warm
 *      grey. Cool greys read as "software"; warm greys read as "paper". Since
 *      `slate` alone accounts for ~24,000 class usages, rebinding that single
 *      ramp changes the temperature of every screen at once.
 *
 *   2. LOWER CHROMA. Electric indigo (#6366f1) is replaced by a muted slate-blue.
 *      Saturated accents on dark backgrounds are what produce the "gamer UI"
 *      impression. The hue barely changes; the intensity does.
 *
 *   3. MORE ROOM AND BIGGER TEXT. Density and type scale up. This is the part
 *      that actually fixes "hard to read" — no palette makes 10px text at 1.5
 *      line-height comfortable in a dense financial table.
 *
 * Treat this as a strong starting point rather than a finished design. It is
 * built to be edited: change the four BASE constants below and the whole theme
 * re-derives.
 */

import { ramp, literalRamp } from '../color.js';

/* ═══════════════════════════════════════════════════════════════════════════
   0. THE FOUR DIALS
   ═══════════════════════════════════════════════════════════════════════════
   Almost every colour in this theme derives from these. Change one and the
   ramps regenerate coherently, which is the whole point of having an engine
   rather than 40,000 hand-typed values.
   ═══════════════════════════════════════════════════════════════════════════ */

const BASE = {
    /** Chrome: warm grey. Slightly yellow-red rather than blue. */
    neutral: '#7d7770',

    /** Primary: muted slate-blue. Trustworthy without shouting. */
    brand: '#4a6fa5',

    /** Secondary: soft clay. Used for decorative gradients and secondary CTAs. */
    accent: '#9c7b6a',

    /** How much saturation the whole theme carries. 1 = as specified, lower = calmer. */
    chroma: 0.9,
};

/* ═══════════════════════════════════════════════════════════════════════════
   1. RAMPS
   ═══════════════════════════════════════════════════════════════════════════
   `ramp()` builds all 11 stops from one colour using a perceptual lightness and
   saturation curve, so a hand-written ramp and a generated one sit beside each
   other without looking like two different systems. Pin individual stops with
   `overrides` where a specific value matters.
   ═══════════════════════════════════════════════════════════════════════════ */

const NEUTRAL = ramp(BASE.neutral, {
    chroma: BASE.chroma,
    // A touch of warmth in the shadows keeps dark mode from going grey-blue.
    hueShift: 6,
    overrides: {
        // Pinned so cards and page backgrounds land on exact, calm values
        // rather than whatever the curve happens to produce.
        50: '#faf9f7',
        100: '#f4f2ef',
        900: '#292623',
        950: '#1a1816',
    },
});

const BRAND = ramp(BASE.brand, { chroma: BASE.chroma, hueShift: -8 });
const ACCENT = ramp(BASE.accent, { chroma: BASE.chroma });

/* Status colours. Muted relative to Tailwind's stock versions — a red that
   shouts is fine once, but this is an accounting product where negative numbers
   are routine, not alarming. */
const SUCCESS = ramp('#4f8a5b', { chroma: BASE.chroma });
const WARNING = ramp('#c08a3e', { chroma: BASE.chroma });
const DANGER = ramp('#b4544a', { chroma: BASE.chroma });
const INFO = ramp('#4a7b9d', { chroma: BASE.chroma });
const HIGHLIGHT = ramp('#a9647a', { chroma: BASE.chroma });

/* The deep backgrounds used by auth, marketing and the platform shell. Warm
   near-black rather than blue-black, so it reads as ink instead of screen. */
const VOID = literalRamp(
    {
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
    },
    'daylight-calm void',
);

const RAMPS = {
    neutral: NEUTRAL,
    brand: BRAND,
    accent: ACCENT,
    info: INFO,
    success: SUCCESS,
    warning: WARNING,
    danger: DANGER,
    highlight: HIGHLIGHT,
    void: VOID,
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. PALETTE BINDINGS
   ═══════════════════════════════════════════════════════════════════════════
   Where Midnight Nebula kept 22 separate families, this theme collapses them
   onto 9 roles. That is the intended direction of travel: eight nearly
   identical purples and four nearly identical greens is how an interface starts
   looking accidental. Existing classes keep working — `bg-purple-500` and
   `bg-violet-500` simply now resolve to the same considered accent.
   ═══════════════════════════════════════════════════════════════════════════ */

const PALETTES = {
    // Chrome — all grey families converge on one warm neutral.
    slate: 'neutral',
    gray: 'neutral',
    zinc: 'neutral',
    stone: 'neutral',
    neutral: 'neutral',

    // Brand.
    indigo: 'brand',

    // Decorative / secondary.
    violet: 'accent',
    purple: 'accent',
    fuchsia: 'accent',

    // Informational.
    blue: 'info',
    sky: 'info',
    cyan: 'info',
    teal: 'info',

    // Positive.
    emerald: 'success',
    green: 'success',
    lime: 'success',

    // Attention.
    yellow: 'warning',
    amber: 'warning',
    orange: 'warning',

    // Negative.
    red: 'danger',

    // Promotional.
    rose: 'highlight',
    pink: 'highlight',

    void: 'void',
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. SEMANTIC TOKENS
   ═══════════════════════════════════════════════════════════════════════════
   Light mode is the star here — this theme is designed to be used in daylight,
   in a shop, by someone who is not a developer. Dark mode is provided and is
   comfortable, but it is no longer the default.
   ═══════════════════════════════════════════════════════════════════════════ */

const SEMANTIC = {
    light: {
        // Off-white rather than pure white: less glare over a long shift.
        'bg-app': '#f4f2ef',
        'bg-sunken': '#ebe8e4',
        'bg-surface': '#ffffff',
        'bg-raised': '#faf9f7',
        'bg-overlay': '#ffffff',
        'bg-scrim': '#292623',

        // Near-black rather than pure black — softer, and still 15:1 on white.
        ink: '#292623',
        'ink-secondary': '#4a453f',
        'ink-muted': '#6b655d',
        'ink-faint': '#9a938a',
        'ink-inverted': '#ffffff',

        border: '#e3dfda',
        'border-strong': '#cbc5bd',
        'border-subtle': '#f0edea',

        'interactive-hover': '#f4f2ef',
        'interactive-active': '#ebe8e4',
        'interactive-selected': '#eaf0f7',
        'focus-ring': '#4a6fa5',
    },

    dark: {
        'bg-app': '#1a1816',
        'bg-sunken': '#12100d',
        'bg-surface': '#242019',
        'bg-raised': '#2f2b26',
        'bg-overlay': '#2f2b26',
        'bg-scrim': '#0a0908',

        ink: '#f4f2ef',
        'ink-secondary': '#ddd8d2',
        'ink-muted': '#a8a19a',
        'ink-faint': '#7d766e',
        'ink-inverted': '#1a1816',

        border: '#332e28',
        'border-strong': '#4a443c',
        'border-subtle': '#242019',

        'interactive-hover': '#2f2b26',
        'interactive-active': '#3b3630',
        'interactive-selected': '#2b3745',
        'focus-ring': '#7d9cc4',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════════════════
   The readability half of the fix.

   Note the leading values: every step is looser than Midnight Nebula's. In a
   product full of dense tables this does more for perceived calm than any
   colour change, because it is the thing that actually makes rows scannable.

   `numeric` gets a tabular-figure stack so currency columns align — a small
   detail that separates "spreadsheet software" from "a tool I trust with money".
   ═══════════════════════════════════════════════════════════════════════════ */

const TYPOGRAPHY = {
    families: {
        sans: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        numeric: "'Figtree', ui-sans-serif, system-ui, sans-serif",
    },

    /**
     * The micro steps get the biggest lift, because they were the worst
     * offenders: 8px and 9px text is below the threshold most people can read
     * comfortably at arm's length, and there were ~560 instances of it.
     *
     * Nothing here drops below 11px, and each micro step now carries an explicit
     * line-height — the old arbitrary values had none, so 10px labels were
     * inheriting whatever leading their parent happened to set.
     */
    sizes: {
        '4xs': ['0.6875rem', '1rem'],     // 11px  (was 8px)
        '3xs': ['0.6875rem', '1rem'],     // 11px  (was 9px)
        '2xs': ['0.75rem', '1.125rem'],   // 12px  (was 10px) — the workhorse label size
        '1xs': ['0.8125rem', '1.25rem'],  // 13px  (was 11px)

        xs: ['0.8125rem', '1.25rem'],     // 13px  (was 12px)
        sm: ['0.9375rem', '1.5rem'],      // 15px  (was 14px)
        base: ['1rem', '1.625rem'],       // 16px
        lg: ['1.1875rem', '1.875rem'],    // 19px
        xl: ['1.375rem', '2rem'],         // 22px
        '2xl': ['1.625rem', '2.25rem'],   // 26px
        '3xl': ['2rem', '2.5rem'],        // 32px
        '4xl': ['2.5rem', '3rem'],        // 40px
        '5xl': ['3.25rem', '1.1'],        // 52px
    },

    /**
     * Deliberately flattened at the top. `font-black` appears 2,023 times in
     * this codebase and `font-bold` 5,334 — when almost everything is heavy,
     * nothing reads as emphasised, and the overall impression is shouting.
     *
     * Rather than edit 7,000 class names, this theme redefines what those
     * weights mean: `black` resolves to 700 and `bold` to 600. Hierarchy then
     * comes from size and spacing, which is where it belongs. Push these back up
     * if the result feels too soft.
     */
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

    /**
     * Tightened at the wide end. `tracking-wider` and `tracking-widest` appear
     * 1,150 times, almost always on small uppercase labels — a strong "technical
     * dashboard" signal, and one that actively hurts reading speed at 10px.
     */
    tracking: {
        tighter: '-0.03em',
        tight: '-0.015em',
        normal: '0em',
        wide: '0.015em',
        wider: '0.025em',
        widest: '0.05em',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. SHAPE
   ═══════════════════════════════════════════════════════════════════════════
   Softer corners, and shadows that suggest depth instead of announcing it.
   The `glow` token — Midnight Nebula's coloured halo — is deliberately reduced
   to an ordinary soft shadow here; ambient neon is the single most "techy"
   signal in the current UI.
   ═══════════════════════════════════════════════════════════════════════════ */

const SHAPE = {
    radius: {
        none: '0px',
        xs: '0.125rem',    //  2px
        sm: '0.25rem',     //  4px
        md: '0.5rem',      //  8px
        lg: '0.6875rem',   // 11px
        xl: '0.9375rem',   // 15px
        '2xl': '1.25rem',  // 20px
        '3xl': '1.75rem',  // 28px
        full: '9999px',
    },

    shadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgb(41 38 35 / 0.04)',
        sm: '0 1px 3px 0 rgb(41 38 35 / 0.06), 0 1px 2px -1px rgb(41 38 35 / 0.04)',
        md: '0 4px 10px -2px rgb(41 38 35 / 0.07), 0 2px 4px -2px rgb(41 38 35 / 0.05)',
        lg: '0 12px 24px -6px rgb(41 38 35 / 0.09), 0 4px 8px -4px rgb(41 38 35 / 0.05)',
        xl: '0 24px 40px -10px rgb(41 38 35 / 0.11), 0 8px 16px -8px rgb(41 38 35 / 0.06)',
        '2xl': '0 32px 64px -16px rgb(41 38 35 / 0.16)',
        inner: 'inset 0 1px 3px 0 rgb(41 38 35 / 0.05)',
        glow: '0 0 0 1px rgb(74 111 165 / 0.16), 0 8px 28px -8px rgb(74 111 165 / 0.18)',
    },

    border: { hairline: '1px', thin: '1px', thick: '2px' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. DENSITY
   ═══════════════════════════════════════════════════════════════════════════
   Roughly 15–25% more room than Midnight Nebula, plus a capped page width.

   `page-max-width` is the quiet hero: full-bleed 1920px tables are exhausting
   to read because the eye has to travel the whole monitor to connect a row
   label to its value. Capping the measure is standard practice in every
   document-like interface and costs nothing.
   ═══════════════════════════════════════════════════════════════════════════ */

const DENSITY = {
    space: {
        '0.5': '0.1875rem', '1': '0.3125rem', '1.5': '0.4375rem', '2': '0.625rem',
        '3': '0.9375rem', '4': '1.25rem', '5': '1.5rem', '6': '1.875rem',
        '8': '2.5rem', '10': '3.125rem', '12': '3.75rem', '16': '5rem',
        '20': '6.25rem', '24': '7.5rem',
    },

    control: {
        'height-sm': '2rem',      // 32px  (was 28px)
        'height-md': '2.625rem',  // 42px  (was 36px)
        'height-lg': '3.125rem',  // 50px  (was 44px) — comfortable for touch POS
        'padding-x': '1rem',
        gap: '0.75rem',
    },

    layout: {
        gutter: '1.5rem',
        'section-gap': '2.5rem',
        'card-padding': '1.5rem',
        'page-max-width': '1600px',
        'sidebar-width': '17.5rem',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. MOTION
   ═══════════════════════════════════════════════════════════════════════════
   Slightly slower and softer. Snappy easing reads as "engineered"; gentle
   easing reads as "considered".
   ═══════════════════════════════════════════════════════════════════════════ */

const MOTION = {
    duration: {
        instant: '0ms', fast: '180ms', normal: '280ms',
        slow: '450ms', slower: '700ms',
    },
    easing: {
        standard: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
        entrance: 'cubic-bezier(0.16, 0.84, 0.28, 1)',
        exit: 'cubic-bezier(0.5, 0, 0.84, 0.16)',
        spring: 'cubic-bezier(0.22, 1.1, 0.36, 1)',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. GRADIENTS
   ═══════════════════════════════════════════════════════════════════════════
   Narrow hue ranges and low opacity. Midnight Nebula's brand gradient travels
   indigo → violet → fuchsia, which is a lot of rainbow for a button.
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENTS = {
    brand: 'linear-gradient(135deg, #4a6fa5 0%, #5a7fb0 100%)',
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
    id: 'daylight-calm',
    name: 'Daylight Calm',
    description:
        'Warm neutrals, muted slate-blue brand, larger type and noticeably more ' +
        'breathing room. Built for a light-first, non-technical audience.',
    defaultMode: 'light',

    ramps: RAMPS,
    palettes: PALETTES,
    semantic: SEMANTIC,
    typography: TYPOGRAPHY,
    shape: SHAPE,
    density: DENSITY,
    motion: MOTION,
    gradients: GRADIENTS,
};
