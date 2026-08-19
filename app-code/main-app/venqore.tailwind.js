/* ============================================================================
   VenQore Design System v2.0 — tailwind fragment
   Merge into tailwind.config.js under `theme.extend`.

   This file exists to make the wrong thing impossible to type. Once `zIndex`
   is a closed set, `z-[9999]` stops compiling. Once `borderRadius` tops out at
   24px, `rounded-[3.5rem]` stops compiling. That is the point — the audit found
   31 hand-written z-index values and 20 distinct corner radii in the app, and
   every one of them was typed by someone who had no list to consult.

   Pair it with the `content` safelist OFF and run `npx tailwindcss --content …`
   once: anything that disappears was using a value the system doesn't have.
   ============================================================================ */

module.exports = {
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans:    ['var(--vq-font-sans)'],
                serif:   ['var(--vq-font-serif)'],
                mono:    ['var(--vq-font-mono)'],
                numeric: ['var(--vq-font-numeric)'],
            },

            colors: {
                /* Brand */
                teal: {
                    50: 'var(--vq-teal-50)',
                    100: 'var(--vq-teal-100)',
                    200: 'var(--vq-teal-200)',
                    300: 'var(--vq-teal-300)',
                    400: 'var(--vq-teal-400)',
                    500: 'var(--vq-teal-500)',
                    600: 'var(--vq-teal-600)',
                    700: 'var(--vq-teal-700)',
                    800: 'var(--vq-teal-800)',
                    900: 'var(--vq-teal-900)',
                    950: 'var(--vq-teal-950)',
                    DEFAULT: 'var(--vq-teal-500)',
                },
                /* Neutral — cool, hue 250°. There is no `gray`, `zinc`, `slate`
                   or `neutral` in this system. `ink` is the only neutral. */
                ink: {
                    0: 'var(--vq-ink-0)',
                    25: 'var(--vq-ink-25)',
                    50: 'var(--vq-ink-50)',
                    100: 'var(--vq-ink-100)',
                    200: 'var(--vq-ink-200)',
                    300: 'var(--vq-ink-300)',
                    400: 'var(--vq-ink-400)',
                    550: 'var(--vq-ink-550)',
                    600: 'var(--vq-ink-600)',
                    700: 'var(--vq-ink-700)',
                    800: 'var(--vq-ink-800)',
                    900: 'var(--vq-ink-900)',
                    950: 'var(--vq-ink-950)',
                    1000: 'var(--vq-ink-1000)',
                    DEFAULT: 'var(--vq-text)',
                },

                /* Mode-aware surfaces — these flip on their own, so
                   `bg-surface` never needs a `dark:` twin. Prefer these. */
                app:      'var(--vq-bg)',
                sunken:   'var(--vq-sunken)',
                surface:  'var(--vq-surface)',
                raised:   'var(--vq-raised)',
                scrim:    'var(--vq-scrim)',

                content: {
                    DEFAULT:  'var(--vq-text)',
                    secondary:'var(--vq-text-2)',
                    muted:    'var(--vq-text-3)',
                    inverted: 'var(--vq-text-inverted)',
                },
                accent: {
                    DEFAULT: 'var(--vq-accent)',
                    hover:   'var(--vq-accent-hover)',
                    text:    'var(--vq-accent-text)',
                    quiet:   'var(--vq-accent-quiet)',
                    on:      'var(--vq-on-accent)',
                },
                line: {
                    DEFAULT: 'var(--vq-line)',
                    soft:    'var(--vq-line-soft)',
                    strong:  'var(--vq-line-strong)',
                },

                /* Semantic — meaning, never decoration. */
                success: { DEFAULT:'var(--vq-success)', bg:'var(--vq-success-bg)', line:'var(--vq-success-line)' },
                warning: { DEFAULT:'var(--vq-warning)', bg:'var(--vq-warning-bg)', line:'var(--vq-warning-line)' },
                danger:  { DEFAULT:'var(--vq-danger)',  bg:'var(--vq-danger-bg)',  line:'var(--vq-danger-line)'  },
                info:    { DEFAULT:'var(--vq-info)',    bg:'var(--vq-info-bg)',    line:'var(--vq-info-line)'    },

                /* Module accents — chrome only. Never inside a data region. */
                mod: {
                accounting: {
                    50: 'var(--vq-mod-accounting-50)',
                    100: 'var(--vq-mod-accounting-100)',
                    200: 'var(--vq-mod-accounting-200)',
                    300: 'var(--vq-mod-accounting-300)',
                    400: 'var(--vq-mod-accounting-400)',
                    500: 'var(--vq-mod-accounting-500)',
                    600: 'var(--vq-mod-accounting-600)',
                    700: 'var(--vq-mod-accounting-700)',
                    800: 'var(--vq-mod-accounting-800)',
                    900: 'var(--vq-mod-accounting-900)',
                    950: 'var(--vq-mod-accounting-950)',
                    DEFAULT: 'var(--vq-mod-accounting-accent)',
                },
                reports: {
                    50: 'var(--vq-mod-reports-50)',
                    100: 'var(--vq-mod-reports-100)',
                    200: 'var(--vq-mod-reports-200)',
                    300: 'var(--vq-mod-reports-300)',
                    400: 'var(--vq-mod-reports-400)',
                    500: 'var(--vq-mod-reports-500)',
                    600: 'var(--vq-mod-reports-600)',
                    700: 'var(--vq-mod-reports-700)',
                    800: 'var(--vq-mod-reports-800)',
                    900: 'var(--vq-mod-reports-900)',
                    950: 'var(--vq-mod-reports-950)',
                    DEFAULT: 'var(--vq-mod-reports-accent)',
                },
                sales: {
                    50: 'var(--vq-mod-sales-50)',
                    100: 'var(--vq-mod-sales-100)',
                    200: 'var(--vq-mod-sales-200)',
                    300: 'var(--vq-mod-sales-300)',
                    400: 'var(--vq-mod-sales-400)',
                    500: 'var(--vq-mod-sales-500)',
                    600: 'var(--vq-mod-sales-600)',
                    700: 'var(--vq-mod-sales-700)',
                    800: 'var(--vq-mod-sales-800)',
                    900: 'var(--vq-mod-sales-900)',
                    950: 'var(--vq-mod-sales-950)',
                    DEFAULT: 'var(--vq-mod-sales-accent)',
                },
                inventory: {
                    50: 'var(--vq-mod-inventory-50)',
                    100: 'var(--vq-mod-inventory-100)',
                    200: 'var(--vq-mod-inventory-200)',
                    300: 'var(--vq-mod-inventory-300)',
                    400: 'var(--vq-mod-inventory-400)',
                    500: 'var(--vq-mod-inventory-500)',
                    600: 'var(--vq-mod-inventory-600)',
                    700: 'var(--vq-mod-inventory-700)',
                    800: 'var(--vq-mod-inventory-800)',
                    900: 'var(--vq-mod-inventory-900)',
                    950: 'var(--vq-mod-inventory-950)',
                    DEFAULT: 'var(--vq-mod-inventory-accent)',
                },
                purchasing: {
                    50: 'var(--vq-mod-purchasing-50)',
                    100: 'var(--vq-mod-purchasing-100)',
                    200: 'var(--vq-mod-purchasing-200)',
                    300: 'var(--vq-mod-purchasing-300)',
                    400: 'var(--vq-mod-purchasing-400)',
                    500: 'var(--vq-mod-purchasing-500)',
                    600: 'var(--vq-mod-purchasing-600)',
                    700: 'var(--vq-mod-purchasing-700)',
                    800: 'var(--vq-mod-purchasing-800)',
                    900: 'var(--vq-mod-purchasing-900)',
                    950: 'var(--vq-mod-purchasing-950)',
                    DEFAULT: 'var(--vq-mod-purchasing-accent)',
                },
                parties: {
                    50: 'var(--vq-mod-parties-50)',
                    100: 'var(--vq-mod-parties-100)',
                    200: 'var(--vq-mod-parties-200)',
                    300: 'var(--vq-mod-parties-300)',
                    400: 'var(--vq-mod-parties-400)',
                    500: 'var(--vq-mod-parties-500)',
                    600: 'var(--vq-mod-parties-600)',
                    700: 'var(--vq-mod-parties-700)',
                    800: 'var(--vq-mod-parties-800)',
                    900: 'var(--vq-mod-parties-900)',
                    950: 'var(--vq-mod-parties-950)',
                    DEFAULT: 'var(--vq-mod-parties-accent)',
                },
                staff: {
                    50: 'var(--vq-mod-staff-50)',
                    100: 'var(--vq-mod-staff-100)',
                    200: 'var(--vq-mod-staff-200)',
                    300: 'var(--vq-mod-staff-300)',
                    400: 'var(--vq-mod-staff-400)',
                    500: 'var(--vq-mod-staff-500)',
                    600: 'var(--vq-mod-staff-600)',
                    700: 'var(--vq-mod-staff-700)',
                    800: 'var(--vq-mod-staff-800)',
                    900: 'var(--vq-mod-staff-900)',
                    950: 'var(--vq-mod-staff-950)',
                    DEFAULT: 'var(--vq-mod-staff-accent)',
                },
                production: {
                    50: 'var(--vq-mod-production-50)',
                    100: 'var(--vq-mod-production-100)',
                    200: 'var(--vq-mod-production-200)',
                    300: 'var(--vq-mod-production-300)',
                    400: 'var(--vq-mod-production-400)',
                    500: 'var(--vq-mod-production-500)',
                    600: 'var(--vq-mod-production-600)',
                    700: 'var(--vq-mod-production-700)',
                    800: 'var(--vq-mod-production-800)',
                    900: 'var(--vq-mod-production-900)',
                    950: 'var(--vq-mod-production-950)',
                    DEFAULT: 'var(--vq-mod-production-accent)',
                },
                growth: {
                    50: 'var(--vq-mod-growth-50)',
                    100: 'var(--vq-mod-growth-100)',
                    200: 'var(--vq-mod-growth-200)',
                    300: 'var(--vq-mod-growth-300)',
                    400: 'var(--vq-mod-growth-400)',
                    500: 'var(--vq-mod-growth-500)',
                    600: 'var(--vq-mod-growth-600)',
                    700: 'var(--vq-mod-growth-700)',
                    800: 'var(--vq-mod-growth-800)',
                    900: 'var(--vq-mod-growth-900)',
                    950: 'var(--vq-mod-growth-950)',
                    DEFAULT: 'var(--vq-mod-growth-accent)',
                },
                channels: {
                    50: 'var(--vq-mod-channels-50)',
                    100: 'var(--vq-mod-channels-100)',
                    200: 'var(--vq-mod-channels-200)',
                    300: 'var(--vq-mod-channels-300)',
                    400: 'var(--vq-mod-channels-400)',
                    500: 'var(--vq-mod-channels-500)',
                    600: 'var(--vq-mod-channels-600)',
                    700: 'var(--vq-mod-channels-700)',
                    800: 'var(--vq-mod-channels-800)',
                    900: 'var(--vq-mod-channels-900)',
                    950: 'var(--vq-mod-channels-950)',
                    DEFAULT: 'var(--vq-mod-channels-accent)',
                },
                platform: {
                    50: 'var(--vq-mod-platform-50)',
                    100: 'var(--vq-mod-platform-100)',
                    200: 'var(--vq-mod-platform-200)',
                    300: 'var(--vq-mod-platform-300)',
                    400: 'var(--vq-mod-platform-400)',
                    600: 'var(--vq-mod-platform-600)',
                    700: 'var(--vq-mod-platform-700)',
                    800: 'var(--vq-mod-platform-800)',
                    900: 'var(--vq-mod-platform-900)',
                    950: 'var(--vq-mod-platform-950)',
                    DEFAULT: 'var(--vq-mod-platform-accent)',
                },
                },

                /* Chart series — assigned in fixed order, never cycled. */
                series: {
                    1:'var(--vq-series-1)', 2:'var(--vq-series-2)',
                    3:'var(--vq-series-3)', 4:'var(--vq-series-4)',
                    5:'var(--vq-series-5)', 6:'var(--vq-series-6)',
                    7:'var(--vq-series-7)', 8:'var(--vq-series-8)',
                },
            },

            /* ── RADIUS — closed set. 10px base, 24px ceiling. ───────────── */
            borderRadius: {
                none: 'var(--vq-r-none)',
                xs:   'var(--vq-r-xs)',    /*  4px — checkbox, cell chip        */
                sm:   'var(--vq-r-sm)',    /*  6px — badge, tag, tooltip        */
                DEFAULT:'var(--vq-r-md)',  /* 10px — BASE                       */
                md:   'var(--vq-r-md)',    /* 10px — button, input, menu item   */
                lg:   'var(--vq-r-lg)',    /* 14px — card, panel, dropdown      */
                xl:   'var(--vq-r-xl)',    /* 20px — modal, drawer, sheet       */
                '2xl':'var(--vq-r-2xl)',   /* 24px — CEILING                    */
                full: 'var(--vq-r-full)',
                /* Deliberately absent: 3xl, 4xl, and every arbitrary value.
                   `rounded-3xl` and `rounded-[2rem]` will now fail to compile —
                   that is the migration signal, not a bug. */
            },

            /* ── Z-INDEX — the whole ladder. Twelve names, no arbitraries. ── */
            zIndex: {
                base:     'var(--vq-z-base)',
                raised:   'var(--vq-z-raised)',
                sticky:   'var(--vq-z-sticky)',
                nav:      'var(--vq-z-nav)',
                rail:     'var(--vq-z-rail)',
                dropdown: 'var(--vq-z-dropdown)',
                'drawer-scrim':'499',
                drawer:   'var(--vq-z-drawer)',
                'modal-scrim': '599',
                modal:    'var(--vq-z-modal)',
                popover:  'var(--vq-z-popover)',
                tooltip:  'var(--vq-z-tooltip)',
                toast:    'var(--vq-z-toast)',
                command:  'var(--vq-z-command)',
                /* No `0`, `10`, `20`, `30`, `40`, `50`. Those are what produced
                   the 31-value mess: `z-50` on a sidebar and `z-50` on a modal
                   are the same number and the DOM order decides, which is how a
                   dropdown ends up under a table header. */
            },

            boxShadow: {
                none: 'var(--vq-elev-0)',
                sm:   'var(--vq-elev-1)',
                DEFAULT:'var(--vq-elev-1)',
                md:   'var(--vq-elev-2)',
                lg:   'var(--vq-elev-3)',
                /* No `xl`, `2xl`, `inner`, and no coloured shadows. A teal-tinted
                   shadow looks like a mistake at 100% zoom and a bug at 200%. */
            },

            transitionDuration: {
                instant: 'var(--vq-dur-instant)',
                fast:    'var(--vq-dur-fast)',
                base:    'var(--vq-dur-base)',
                slow:    'var(--vq-dur-slow)',
            },
            transitionTimingFunction: {
                DEFAULT: 'var(--vq-ease)',
                vq:      'var(--vq-ease)',
                'vq-out':'var(--vq-ease-out)',
                'vq-in': 'var(--vq-ease-in)',
            },

            fontSize: {
                eyebrow: ['var(--vq-fs-eyebrow)', { lineHeight:'var(--vq-lh-eyebrow)', letterSpacing:'var(--vq-ls-eyebrow)', fontWeight:'500' }],
                caption: ['var(--vq-fs-caption)', { lineHeight:'var(--vq-lh-caption)' }],
                small:   ['var(--vq-fs-small)',   { lineHeight:'var(--vq-lh-small)' }],
                body:    ['var(--vq-fs-body)',    { lineHeight:'var(--vq-lh-body)' }],
                lede:    ['var(--vq-fs-lede)',    { lineHeight:'var(--vq-lh-lede)',    letterSpacing:'var(--vq-ls-lede)' }],
                h3:      ['var(--vq-fs-h3)',      { lineHeight:'var(--vq-lh-h3)',      letterSpacing:'var(--vq-ls-h3)', fontWeight:'600' }],
                h2:      ['var(--vq-fs-h2)',      { lineHeight:'var(--vq-lh-h2)',      letterSpacing:'var(--vq-ls-h2)', fontWeight:'600' }],
                h1:      ['var(--vq-fs-h1)',      { lineHeight:'var(--vq-lh-h1)',      letterSpacing:'var(--vq-ls-h1)', fontWeight:'600' }],
                display: ['var(--vq-fs-display)', { lineHeight:'var(--vq-lh-display)', letterSpacing:'var(--vq-ls-display)', fontWeight:'600' }],
            },

            fontWeight: {
                normal:   '400',
                medium:   '500',
                semibold: '600',
                /* `font-bold` (700) is not in this system. Three weights is a
                   system; five is a mess. If 600 next to 400 isn't enough
                   separation, change the size or the colour — not the weight. */
            },

            height: {
                control:    'var(--vq-control-md)',
                'control-sm':'var(--vq-control-sm)',
                'control-lg':'var(--vq-control-lg)',
                'control-xl':'var(--vq-control-xl)',
                row:        'var(--vq-row-h)',
                topbar:     'var(--vq-topbar-h)',
            },
            width:   { rail:'var(--vq-rail-w)', 'rail-min':'var(--vq-rail-w-min)' },
            maxWidth:{ page:'var(--vq-page-max)', measure:'var(--vq-measure)' },
        },
    },
};
