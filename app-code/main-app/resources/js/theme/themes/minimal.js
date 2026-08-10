/**
 * Theme: Minimal
 * ─────────────────────────────────────────────────────────────────────────────
 * The quietest theme in the library, and the intended default for the New
 * Experience.
 *
 * The organising idea is that in a system where a user looks at forty numbers a
 * minute, colour should be *information*, not decoration. So the chrome is very
 * nearly monochrome — a cool grey that never competes with content — and the
 * only saturated things on a screen are the ones that mean something: money in
 * (success), money out (danger), needs attention (warning), and the one action
 * the page wants you to take (brand).
 *
 * The brand ramp is a near-black ink rather than a hue. That is unusual and it
 * is the point: a primary button that is simply "dark" reads as authoritative
 * without claiming a colour the business did not choose. Users who want a hue
 * pick one in Appearance → it overrides this ramp at runtime.
 */

import { buildRamps, composeTheme, FONT_STACKS } from './_kit.js';

const BASES = {
    neutral: '#71767f',
    brand: '#1d232c',
    accent: '#5b6472',
    info: '#3f6fa8',
    success: '#2f7d54',
    warning: '#b07714',
    danger: '#b23b34',
    highlight: '#7a5aa8',
};

const RAMPS = buildRamps({
    bases: BASES,
    chroma: 0.82,
    neutralOverrides: {
        50: '#fafafa',
        100: '#f4f5f6',
        200: '#e6e8ea',
        800: '#252a31',
        900: '#171b21',
        950: '#0e1116',
    },
    voidStops: {
        50: '#eef0f2', 100: '#d9dde1', 200: '#b0b7bf', 300: '#87919c',
        400: '#5e6a78', 500: '#3d4854', 600: '#2c343d', 700: '#1f252c',
        800: '#151a20', 900: '#0e1116', 950: '#07090c',
    },
});

const SEMANTIC = {
    light: {
        'bg-app': '#f7f8f8',
        'bg-sunken': '#eef0f1',
        'bg-surface': '#ffffff',
        'bg-raised': '#fafafa',
        'bg-overlay': '#ffffff',
        'bg-scrim': '#171b21',

        ink: '#171b21',
        'ink-secondary': '#3a424c',
        'ink-muted': '#616b77',
        'ink-faint': '#949ca6',
        'ink-inverted': '#ffffff',

        border: '#e4e7e9',
        'border-strong': '#c8cdd2',
        'border-subtle': '#f0f2f3',

        'interactive-hover': '#f4f5f6',
        'interactive-active': '#e9ebed',
        'interactive-selected': '#eceef0',
        'focus-ring': '#1d232c',
    },

    dark: {
        'bg-app': '#0e1116',
        'bg-sunken': '#07090c',
        'bg-surface': '#171b21',
        'bg-raised': '#1f242b',
        'bg-overlay': '#1f242b',
        'bg-scrim': '#07090c',

        ink: '#f4f5f6',
        'ink-secondary': '#d3d7db',
        'ink-muted': '#98a0aa',
        'ink-faint': '#6b747e',
        'ink-inverted': '#0e1116',

        border: '#252b33',
        'border-strong': '#39414b',
        'border-subtle': '#1b2027',

        'interactive-hover': '#1f242b',
        'interactive-active': '#282e37',
        'interactive-selected': '#252b33',
        'focus-ring': '#c8cdd2',
    },
};

export default composeTheme({
    id: 'minimal',
    name: 'Minimal',
    description:
        'Near-monochrome chrome, ink-black brand, colour reserved for meaning. ' +
        'The most readable theme and the default for the New Experience.',
    defaultMode: 'light',

    ramps: RAMPS,
    semantic: SEMANTIC,

    typography: {
        families: {
            sans: FONT_STACKS.inter,
            display: FONT_STACKS.inter,
            numeric: FONT_STACKS.inter,
        },
    },

    shape: {
        radius: {
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            '2xl': '1rem',
            '3xl': '1.25rem',
        },
        // Elevation carried by hairlines rather than shadow. Stacked shadows are
        // the fastest way to make a flat, information-dense product look busy.
        shadow: {
            xs: '0 1px 1px 0 rgb(23 27 33 / 0.03)',
            sm: '0 1px 2px 0 rgb(23 27 33 / 0.05)',
            md: '0 2px 6px -2px rgb(23 27 33 / 0.06)',
            lg: '0 8px 18px -6px rgb(23 27 33 / 0.08)',
            xl: '0 16px 30px -10px rgb(23 27 33 / 0.10)',
            '2xl': '0 24px 48px -16px rgb(23 27 33 / 0.14)',
            glow: '0 0 0 1px rgb(23 27 33 / 0.08)',
        },
    },

    gradients: {
        brand: 'linear-gradient(135deg, #1d232c 0%, #2c343d 100%)',
        'brand-soft': 'linear-gradient(135deg, rgb(29 35 44 / 0.06), rgb(29 35 44 / 0.01))',
        success: 'linear-gradient(135deg, #2f7d54 0%, #276645 100%)',
        info: 'linear-gradient(135deg, #3f6fa8 0%, #355c8c 100%)',
        danger: 'linear-gradient(135deg, #b23b34 0%, #96322c 100%)',
        aurora: 'radial-gradient(ellipse at 12% -10%, rgb(29 35 44 / 0.04), transparent 55%)',
        'hairline-accent':
            'linear-gradient(to right, transparent, rgb(29 35 44 / 0.28), transparent)',
    },
});
