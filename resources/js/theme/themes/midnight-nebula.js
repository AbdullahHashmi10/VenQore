/**
 * Theme: Midnight Nebula
 * ─────────────────────────────────────────────────────────────────────────────
 * The look VenQore shipped with: deep indigo/violet voids, high-contrast slate
 * chrome, saturated accents.
 *
 * This file is a faithful capture of the palette as it existed BEFORE the theme
 * engine was introduced. Every ramp below holds Tailwind v3's exact stock values
 * — which is precisely what the UI was already using — so switching the engine
 * on changes nothing visually. That is deliberate: the migration is proven safe
 * by the fact that it is a no-op.
 *
 * ── Editing this file ───────────────────────────────────────────────────────
 * Don't. Treat it as the reference capture. To change how the product looks,
 * copy `_template.js` to a new theme and point `../active.js` at it. Keeping
 * Midnight Nebula pristine means you always have a known-good baseline to diff
 * against when a new theme looks wrong.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. RAMPS
   ═══════════════════════════════════════════════════════════════════════════
   An 11-stop scale, light (50) to dark (950).

   IMPORTANT: ramps do not change between light and dark mode. The codebase
   already expresses mode by choosing different stops — `bg-white
   dark:bg-slate-900` — so if the ramp itself flipped, every one of those pairs
   would invert and the UI would turn inside out. Mode-dependent values live in
   section 3 (`semantic`) instead.
   ═══════════════════════════════════════════════════════════════════════════ */

const RAMPS = {
        slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
        },
        gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
            950: '#030712',
        },
        zinc: {
            50: '#fafafa',
            100: '#f4f4f5',
            200: '#e4e4e7',
            300: '#d4d4d8',
            400: '#a1a1aa',
            500: '#71717a',
            600: '#52525b',
            700: '#3f3f46',
            800: '#27272a',
            900: '#18181b',
            950: '#09090b',
        },
        stone: {
            50: '#fafaf9',
            100: '#f5f5f4',
            200: '#e7e5e4',
            300: '#d6d3d1',
            400: '#a8a29e',
            500: '#78716c',
            600: '#57534e',
            700: '#44403c',
            800: '#292524',
            900: '#1c1917',
            950: '#0c0a09',
        },
        neutral: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
            950: '#0a0a0a',
        },
        indigo: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b',
        },
        violet: {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95',
            950: '#2e1065',
        },
        purple: {
            50: '#faf5ff',
            100: '#f3e8ff',
            200: '#e9d5ff',
            300: '#d8b4fe',
            400: '#c084fc',
            500: '#a855f7',
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
            950: '#3b0764',
        },
        fuchsia: {
            50: '#fdf4ff',
            100: '#fae8ff',
            200: '#f5d0fe',
            300: '#f0abfc',
            400: '#e879f9',
            500: '#d946ef',
            600: '#c026d3',
            700: '#a21caf',
            800: '#86198f',
            900: '#701a75',
            950: '#4a044e',
        },
        blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554',
        },
        sky: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
            950: '#082f49',
        },
        cyan: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
            950: '#083344',
        },
        teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e',
        },
        emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22',
        },
        green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
        },
        lime: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
            950: '#1a2e05',
        },
        yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
            950: '#422006',
        },
        amber: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
        },
        orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
            950: '#431407',
        },
        red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a',
        },
        rose: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
            950: '#4c0519',
        },
        pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843',
            950: '#500724',
        },
    /* ── The Void ──────────────────────────────────────────────────────────
       Midnight Nebula's signature backgrounds, darker than slate-950 (#020617).
       These were previously scattered through the JSX as arbitrary values like
       `bg-[#05030f]` — 287 of them across auth screens, marketing pages and the
       platform shell. Collected here as a proper ramp.

       Several near-identical variants were in circulation (#020010, #02000c and
       #02000f differ by at most 3/255 on one channel — invisible) and have been
       collapsed onto the nearest stop. That is a deliberate consolidation, not
       an accident: 20 hand-typed near-blacks were never a design decision.
       ────────────────────────────────────────────────────────────────────── */
    void: {
        50: '#e8e8ef',
        100: '#c9c9d8',
        200: '#9a9ab5',
        300: '#6b6b90',
        400: '#43436a',
        500: '#2a2a48',
        600: '#1e293b',
        700: '#1a1d2e',
        800: '#0f121d',
        900: '#05030f',
        950: '#020010',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. PALETTE BINDINGS
   ═══════════════════════════════════════════════════════════════════════════
   Which ramp each Tailwind colour family resolves to. This is the mechanism
   that makes ~40,000 pre-existing classes theme-aware without touching a single
   component: Tailwind is told that `indigo` means "whatever ramp the theme
   binds to indigo", and every `bg-indigo-600` in the codebase follows.

   Midnight Nebula binds one-to-one, preserving the current appearance exactly.
   A new theme is free to collapse families together — pointing violet, purple
   and fuchsia all at one `accent` ramp, say — which is usually what you want,
   because eight barely-distinguishable purples is how an interface starts
   feeling noisy.
   ═══════════════════════════════════════════════════════════════════════════ */

const PALETTES = {
    slate: 'slate',
    gray: 'gray',
    zinc: 'zinc',
    stone: 'stone',

    // `neutral` is the one name that is both a Tailwind family and a role in
    // this system, and the role wins — so `bg-neutral-500` gives the theme's
    // chrome colour rather than Tailwind's stock grey (#737373).
    //
    // Written out explicitly here because the alternative is an accident: the
    // role aliases are spread over the ramps below, so `neutral` would be
    // silently overwritten whether or not anyone intended it. Stating it makes
    // the behaviour deliberate. Nothing in the codebase uses `neutral-*` today,
    // and if something does later, following the theme is the useful answer.
    neutral: 'slate',
    indigo: 'indigo',
    violet: 'violet',
    purple: 'purple',
    fuchsia: 'fuchsia',
    blue: 'blue',
    sky: 'sky',
    cyan: 'cyan',
    teal: 'teal',
    emerald: 'emerald',
    green: 'green',
    lime: 'lime',
    yellow: 'yellow',
    amber: 'amber',
    orange: 'orange',
    red: 'red',
    rose: 'rose',
    pink: 'pink',
    void: 'void',
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. SEMANTIC TOKENS
   ═══════════════════════════════════════════════════════════════════════════
   Role-named colours that DO flip between light and dark mode. New code should
   reach for these — `bg-surface text-ink border-border` — because they need no
   `dark:` twin and they describe intent rather than pigment.

   Values are stated as hex here for readability; the build step converts them
   to the RGB channel triplets Tailwind needs for opacity modifiers.
   ═══════════════════════════════════════════════════════════════════════════ */

const SEMANTIC = {
    light: {
        'bg-app': '#f1f5f9',      // slate-100 — matches the old --bg-main
        'bg-sunken': '#e2e8f0',
        'bg-surface': '#ffffff',
        'bg-raised': '#f8fafc',
        'bg-overlay': '#ffffff',
        'bg-scrim': '#0f172a',

        ink: '#0f172a',
        'ink-secondary': '#334155',
        'ink-muted': '#475569',
        'ink-faint': '#94a3b8',
        'ink-inverted': '#ffffff',

        border: '#e2e8f0',
        'border-strong': '#cbd5e1',
        'border-subtle': '#f1f5f9',

        'interactive-hover': '#f1f5f9',
        'interactive-active': '#e2e8f0',
        'interactive-selected': '#eef2ff',
        'focus-ring': '#6366f1',
    },

    dark: {
        'bg-app': '#020617',      // slate-950 — matches the old --bg-main
        'bg-sunken': '#020010',
        'bg-surface': '#0f172a',
        'bg-raised': '#1e293b',
        'bg-overlay': '#1e293b',
        'bg-scrim': '#020010',

        ink: '#f8fafc',
        'ink-secondary': '#e2e8f0',
        'ink-muted': '#94a3b8',
        'ink-faint': '#64748b',
        'ink-inverted': '#0f172a',

        border: '#1e293b',
        'border-strong': '#334155',
        'border-subtle': '#0f172a',

        'interactive-hover': '#1e293b',
        'interactive-active': '#334155',
        'interactive-selected': '#312e81',
        'focus-ring': '#818cf8',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════════════════
   Captured as-is: Figtree at Tailwind's stock scale and tight leading.

   Worth knowing for whoever authors the next theme — readability complaints
   about this UI are mostly a leading and size problem, not a colour problem.
   The `sm`/`xs` steps below carry a lot of the interface, and `leading-normal`
   at 1.5 is tight for dense financial tables.
   ═══════════════════════════════════════════════════════════════════════════ */

const TYPOGRAPHY = {
    families: {
        sans: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        numeric: "'Figtree', ui-sans-serif, system-ui, -apple-system, sans-serif",
    },

    /**
     * A size is either a bare string (font-size only) or a `[size, lineHeight]`
     * pair.
     *
     * The four micro steps are intentionally bare. They replace arbitrary values
     * like `text-[10px]`, which set font-size and nothing else — so attaching a
     * line-height here would silently reflow ~2,700 elements. Preserving the
     * old behaviour exactly is what makes this migration a safe no-op.
     *
     * The steps from `xs` upward carry Tailwind v3's stock line-heights, which
     * is what those classes already resolved to.
     */
    sizes: {
        '4xs': '0.5rem',      //  8px — was text-[8px]  ×132
        '3xs': '0.5625rem',   //  9px — was text-[9px]  ×431
        '2xs': '0.625rem',    // 10px — was text-[10px] ×1851, the single most common size
        '1xs': '0.6875rem',   // 11px — was text-[11px] ×237

        xs: ['0.75rem', '1rem'],          // 12px
        sm: ['0.875rem', '1.25rem'],      // 14px
        base: ['1rem', '1.5rem'],         // 16px
        lg: ['1.125rem', '1.75rem'],      // 18px
        xl: ['1.25rem', '1.75rem'],       // 20px
        '2xl': ['1.5rem', '2rem'],        // 24px
        '3xl': ['1.875rem', '2.25rem'],   // 30px
        '4xl': ['2.25rem', '2.5rem'],     // 36px
        '5xl': ['3rem', '1'],             // 48px
    },

    /**
     * `black` (900) is used 2,023 times and `bold` 5,334 times. Weight is
     * currently doing most of the hierarchy work in this UI, which is part of
     * why it reads as loud — but these are the real values, captured as-is.
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
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
    },

    tracking: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. SHAPE
   ═══════════════════════════════════════════════════════════════════════════ */

const SHAPE = {
    /**
     * These match Tailwind v3's stock scale exactly, key for key, so
     * `rounded-lg` (1,831 usages) and `rounded-xl` (2,307) render identically to
     * before. `xs` is new and currently unused — it exists so a softer theme has
     * somewhere to put a sub-2px radius.
     *
     * Note there is no DEFAULT here on purpose: bare `rounded` keeps Tailwind's
     * own 0.25rem rather than being silently redefined.
     */
    radius: {
        none: '0px',
        xs: '0.0625rem',   //  1px  (new)
        sm: '0.125rem',    //  2px  — Tailwind rounded-sm
        md: '0.375rem',    //  6px  — Tailwind rounded-md
        lg: '0.5rem',      //  8px  — Tailwind rounded-lg
        xl: '0.75rem',     // 12px  — Tailwind rounded-xl
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        full: '9999px',
    },

    /**
     * Also key-for-key with Tailwind v3. Bare `shadow` is deliberately left
     * alone for the same reason as bare `rounded`.
     */
    shadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        // The nebula signature: coloured ambient light rather than plain shadow.
        glow: '0 0 0 1px rgb(99 102 241 / 0.2), 0 10px 40px -10px rgb(99 102 241 / 0.35)',
    },

    border: { hairline: '1px', thin: '1px', thick: '2px' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. DENSITY
   ═══════════════════════════════════════════════════════════════════════════
   The single dial that decides whether the product feels cramped or calm.
   Midnight Nebula is compact — a deliberate POS-terminal choice that reads as
   "technical" on a marketing screenshot. A roomier theme mostly just scales
   these numbers up.
   ═══════════════════════════════════════════════════════════════════════════ */

const DENSITY = {
    space: {
        '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem', '2': '0.5rem',
        '3': '0.75rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem',
        '8': '2rem', '10': '2.5rem', '12': '3rem', '16': '4rem',
        '20': '5rem', '24': '6rem',
    },

    control: {
        'height-sm': '1.75rem',   // 28px
        'height-md': '2.25rem',   // 36px
        'height-lg': '2.75rem',   // 44px
        'padding-x': '0.75rem',
        gap: '0.5rem',
    },

    layout: {
        gutter: '1rem',
        'section-gap': '1.5rem',
        'card-padding': '1rem',
        'page-max-width': '100%',
        'sidebar-width': '16rem',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   7. MOTION
   ═══════════════════════════════════════════════════════════════════════════ */

const MOTION = {
    duration: {
        instant: '0ms', fast: '150ms', normal: '250ms',
        slow: '400ms', slower: '600ms',
    },
    easing: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        entrance: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. GRADIENTS
   ═══════════════════════════════════════════════════════════════════════════
   Emitted as CSS variables so components can use `bg-[image:var(--vq-gradient-brand)]`
   or plain `style={{ background: 'var(--vq-gradient-brand)' }}`.
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENTS = {
    brand: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #d946ef 100%)',
    'brand-soft': 'linear-gradient(135deg, rgb(99 102 241 / 0.16), rgb(139 92 246 / 0.06))',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    info: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    // The ambient orbs described in MIDNIGHT_NEBULA_DESIGN.md.
    aurora:
        'radial-gradient(ellipse at 12% -8%, rgb(99 102 241 / 0.18), transparent 45%), ' +
        'radial-gradient(ellipse at 100% 0%, rgb(139 92 246 / 0.12), transparent 42%)',
    'hairline-accent':
        'linear-gradient(to right, transparent, #6366f1, transparent)',
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export default {
    id: 'midnight-nebula',
    name: 'Midnight Nebula',
    description:
        'The original VenQore aesthetic. Deep indigo voids, saturated accents, ' +
        'compact density. Captured verbatim as the baseline — switching to it is a no-op.',
    defaultMode: 'dark',

    ramps: {
        ...RAMPS,

        // Role aliases. These drive the semantic Tailwind classes (`bg-brand-500`,
        // `text-danger-600`) that new code should use in place of raw pigment names.
        neutral: RAMPS.slate,
        brand: RAMPS.indigo,
        accent: RAMPS.violet,
        info: RAMPS.blue,
        success: RAMPS.emerald,
        warning: RAMPS.amber,
        danger: RAMPS.red,
        highlight: RAMPS.rose,
    },

    palettes: PALETTES,
    semantic: SEMANTIC,
    typography: TYPOGRAPHY,
    shape: SHAPE,
    density: DENSITY,
    motion: MOTION,
    gradients: GRADIENTS,
};
