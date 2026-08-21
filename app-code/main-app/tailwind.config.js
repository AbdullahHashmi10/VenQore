import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

import {
    CONTROLLED_PALETTES,
    REQUIRED_ROLES,
    TYPOGRAPHY_TOKENS,
    SHAPE_TOKENS,
    DENSITY_TOKENS,
    MOTION_TOKENS,
    SHADES,
    cssVar,
    paletteColorRef,
    semanticColorRef,
} from './resources/js/theme/contract.js';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  VenQore — Tailwind configuration                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This file contains no colours, sizes or spacing values of its own. Every entry
 * below points at a CSS custom property, and those properties are written by
 *
 *     resources/js/theme/build/generate.js  →  resources/css/theme.generated.css
 *
 * from whichever theme is named in `resources/js/theme/active.js`.
 *
 * ── Why the indirection ─────────────────────────────────────────────────────
 *
 * The codebase carries roughly 40,000 hardcoded colour classes — `bg-slate-800`
 * appears 4,949 times, `bg-indigo-600` 1,345 times — across 393 component files.
 * Editing them all to adopt a theme system would mean touching the POS terminal,
 * the accounting ledger and every report: a great deal of risk for a cosmetic
 * change.
 *
 * But `bg-indigo-600` is not really a colour. It is a *lookup*, and Tailwind
 * resolves it through this file. Redefining the lookup means all 1,345 usages
 * start following the active theme without one of them being edited.
 *
 * The cost is that a class can now say "indigo" while rendering something that
 * isn't. That wart is real, and the answer is the role aliases further down —
 * `bg-brand-600`, `text-ink`, `bg-surface` — which new code should use, with old
 * files renamed opportunistically. Both vocabularies resolve to the same tokens,
 * so the cleanup never has to be a single big-bang rewrite.
 *
 * ── Two deliberate omissions ────────────────────────────────────────────────
 *
 * Bare `rounded` and bare `shadow` are left at Tailwind's stock values, and the
 * global `spacing` scale is left alone (see `spacingWithDensity` below). Both
 * choices are about not moving things that 3,000+ existing classes depend on.
 *
 * ── Adding a colour ─────────────────────────────────────────────────────────
 *
 * Don't add one here. Add it to the theme files in resources/js/theme/themes/.
 * This file describes *shape*; themes supply *values*.
 */

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */

/** `{ 50: 'rgb(var(--vq-indigo-50) / <alpha-value>)', … }` */
const rampScale = (name) =>
    Object.fromEntries(SHADES.map((shade) => [shade, paletteColorRef(name, shade)]));

/** Turn a list of token keys into `{ key: 'var(--vq-prefix-key)' }`. */
const varMap = (keys, varFn) =>
    Object.fromEntries(keys.map((key) => [key, `var(${varFn(key)})`]));

/**
 * Font sizes reference an optional companion line-height variable.
 *
 * The `, inherit` fallback matters: the four micro sizes (`4xs`–`1xs`) replace
 * arbitrary values like `text-[10px]`, which set font-size and leave leading to
 * the cascade. A theme that defines no line-height for them reproduces that
 * behaviour exactly; a theme that does define one takes control of it.
 */
const fontSizeMap = Object.fromEntries(
    TYPOGRAPHY_TOKENS.sizes.map((key) => [
        key,
        [
            `var(${cssVar.size(key)})`,
            { lineHeight: `var(${cssVar.size(key)}--line-height, inherit)` },
        ],
    ]),
);

/**
 * Density is applied to padding, margin and gap — deliberately NOT to the global
 * `spacing` scale, which also drives `w-*`, `h-*` and `size-*`.
 *
 * Rescaling those would resize every icon box in the product. The codebase
 * freely mixes scale classes with fixed ones (`w-8` sitting next to `h-[32px]`),
 * so a theme that grew `w-8` would knock those pairs out of alignment
 * everywhere. Padding, margin and gap carry the compact-versus-spacious feeling
 * on their own, without touching a single fixed dimension.
 */
const densitySpacing = varMap(DENSITY_TOKENS.space, cssVar.space);

const spacingWithDensity = {
    ...defaultTheme.spacing,
    ...densitySpacing,

    // Named layout steps, for new code that would rather state intent.
    gutter: `var(${cssVar.layout('gutter')})`,
    section: `var(${cssVar.layout('section-gap')})`,
    card: `var(${cssVar.layout('card-padding')})`,
};

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],

    theme: {
        extend: {
            screens: {
                xs: '400px',
            },

            /* ───────────────────────────────────────────────────────────────
               COLOUR — two vocabularies, one source of truth
               ───────────────────────────────────────────────────────────────
               1. Pigment names (indigo, slate, emerald…) — what the existing
                  ~40,000 classes use. Rebound here so they follow the theme.
               2. Role names (brand, surface, ink, danger…) — what new code
                  should use, because they survive a rebrand without lying.
               ─────────────────────────────────────────────────────────────── */
            colors: {
                // 1. Every Tailwind family the app uses, rebound to the theme.
                //    Includes `void`, a VenQore-specific family covering the deep
                //    backgrounds that used to be written as `bg-[#05030f]`.
                ...Object.fromEntries(
                    CONTROLLED_PALETTES.map((palette) => [palette, rampScale(palette)]),
                ),

                // 2. Role ramps: bg-brand-500, text-danger-600, ring-success-400…
                ...Object.fromEntries(
                    REQUIRED_ROLES.map((role) => [role, rampScale(role)]),
                ),

                // 3. Mode-aware single-value tokens. These flip between light and
                //    dark on their own, so `bg-surface` needs no `dark:` twin —
                //    which is the main reason to prefer them in new code.
                app: semanticColorRef('bg-app'),
                sunken: semanticColorRef('bg-sunken'),
                surface: semanticColorRef('bg-surface'),
                raised: semanticColorRef('bg-raised'),
                overlay: semanticColorRef('bg-overlay'),
                scrim: semanticColorRef('bg-scrim'),

                ink: {
                    DEFAULT: semanticColorRef('ink'),
                    secondary: semanticColorRef('ink-secondary'),
                    muted: semanticColorRef('ink-muted'),
                    faint: semanticColorRef('ink-faint'),
                    inverted: semanticColorRef('ink-inverted'),
                },

                // Named `line` rather than `border` so it reads as
                // `border-line-strong` instead of `border-border-strong`.
                line: {
                    DEFAULT: semanticColorRef('border'),
                    strong: semanticColorRef('border-strong'),
                    subtle: semanticColorRef('border-subtle'),
                },

                interactive: {
                    hover: semanticColorRef('interactive-hover'),
                    active: semanticColorRef('interactive-active'),
                    selected: semanticColorRef('interactive-selected'),
                },

                focus: semanticColorRef('focus-ring'),
            },

            /* ───────────────────────────────────────────────────────────────
               TYPOGRAPHY
               ─────────────────────────────────────────────────────────────── */
            fontFamily: {
                sans: [`var(${cssVar.font('sans')})`],
                display: [`var(${cssVar.font('display')})`],
                mono: [`var(${cssVar.font('mono')})`],
                // Tabular figures, so currency columns align. Worth reaching for
                // on any table cell holding money.
                numeric: [`var(${cssVar.font('numeric')})`],
            },

            fontSize: fontSizeMap,
            fontWeight: varMap(TYPOGRAPHY_TOKENS.weights, cssVar.weight),
            lineHeight: varMap(TYPOGRAPHY_TOKENS.leading, cssVar.leading),
            letterSpacing: varMap(TYPOGRAPHY_TOKENS.tracking, cssVar.tracking),

            /* ───────────────────────────────────────────────────────────────
               SHAPE
               ─────────────────────────────────────────────────────────────── */
            borderRadius: varMap(SHAPE_TOKENS.radius, cssVar.radius),
            boxShadow: varMap(SHAPE_TOKENS.shadow, cssVar.shadow),

            /* ───────────────────────────────────────────────────────────────
               DENSITY
               ─────────────────────────────────────────────────────────────── */
            padding: spacingWithDensity,
            margin: spacingWithDensity,
            gap: spacingWithDensity,
            space: spacingWithDensity,

            height: {
                'control-sm': `var(${cssVar.control('height-sm')})`,
                'control-md': `var(${cssVar.control('height-md')})`,
                'control-lg': `var(${cssVar.control('height-lg')})`,
            },
            minHeight: {
                'control-sm': `var(${cssVar.control('height-sm')})`,
                'control-md': `var(${cssVar.control('height-md')})`,
                'control-lg': `var(${cssVar.control('height-lg')})`,
            },
            width: {
                sidebar: `var(${cssVar.layout('sidebar-width')})`,
            },
            maxWidth: {
                page: `var(${cssVar.layout('page-max-width')})`,
            },

            /* ───────────────────────────────────────────────────────────────
               STACKING
               ───────────────────────────────────────────────────────────────
               The audit found 31 distinct hand-written z-index values, from
               `z-[5]` to `z-[99999]`, and ZERO `zIndex` entries in this file.
               The second fact caused the first: there was no list to consult,
               so every time something was invisible someone raised the number.

               Twelve values, from layout-law.json's own ladder. Roughly: how
               much of the screen a thing owns, then what has to be dismissable
               on top of what. A tooltip outranks a modal because you can have a
               tooltip ON a modal; a toast outranks both because a "Saved"
               confirmation that appears behind the dialog that triggered it is
               worse than useless.

               Two rules that prevent the next 31:
                 · A scrim is its owner's level MINUS ONE. Never its own number.
                 · If a thing is invisible, look for an `overflow-hidden`
                   ancestor BEFORE touching z-index. Clipping happens during
                   paint, before stacking is considered, so no z-index can
                   escape it — which is what most of those 31 values were
                   actually trying to do.

               These are additive for now. `theme.zIndex` (replacing rather than
               extending) is what finally stops `z-[9999]` compiling, and that
               switch is thrown after the Phase 3 codemod, not before — closing
               the set today would strip the stacking off 96 live call sites.
               ─────────────────────────────────────────────────────────────── */
            zIndex: {
                base: 'var(--vq-z-base)',
                raised: 'var(--vq-z-raised)',
                sticky: 'var(--vq-z-sticky)',
                nav: 'var(--vq-z-nav)',
                rail: 'var(--vq-z-rail)',
                dropdown: 'var(--vq-z-dropdown)',
                drawer: 'var(--vq-z-drawer)',
                'drawer-scrim': 'calc(var(--vq-z-drawer) - 1)',
                modal: 'var(--vq-z-modal)',
                'modal-scrim': 'calc(var(--vq-z-modal) - 1)',
                popover: 'var(--vq-z-popover)',
                tooltip: 'var(--vq-z-tooltip)',
                toast: 'var(--vq-z-toast)',
                command: 'var(--vq-z-command)',
            },

            /* ───────────────────────────────────────────────────────────────
               LAYOUT LAW
               ───────────────────────────────────────────────────────────────
               size(n) = n*64 + (n-1)*24. The gutter is part of the PITCH, not
               a margin, so `gap-gutter` on a grid is the whole implementation.
               ─────────────────────────────────────────────────────────────── */
            spacing: {
                'row-unit': 'var(--vq-row-unit)',
                gutter: 'var(--vq-gutter)',
                'rail-w': 'var(--vq-rail-w)',
                'rail-min': 'var(--vq-rail-w-min)',
                'topbar-h': 'var(--vq-topbar-h)',
            },

            /* ───────────────────────────────────────────────────────────────
               MOTION
               ─────────────────────────────────────────────────────────────── */
            transitionDuration: varMap(MOTION_TOKENS.duration, cssVar.duration),
            transitionTimingFunction: varMap(MOTION_TOKENS.easing, cssVar.easing),

            /* ───────────────────────────────────────────────────────────────
               GRADIENTS
               ───────────────────────────────────────────────────────────────
               Usable as `bg-gradient-brand`, replacing hand-written
               `from-… via-… to-…` chains that no theme can restyle.
               ─────────────────────────────────────────────────────────────── */
            backgroundImage: {
                'gradient-brand': `var(${cssVar.gradient('brand')})`,
                'gradient-brand-soft': `var(${cssVar.gradient('brand-soft')})`,
                'gradient-success': `var(${cssVar.gradient('success')})`,
                'gradient-info': `var(${cssVar.gradient('info')})`,
                'gradient-danger': `var(${cssVar.gradient('danger')})`,
                'gradient-aurora': `var(${cssVar.gradient('aurora')})`,
                'gradient-hairline': `var(${cssVar.gradient('hairline-accent')})`,
                // V6's signature marketing gradients. Public pages only —
                // inside the app the background is flat --vq-bg and nothing
                // else (DESIGN-RULES v3.0 §14).
                'gradient-hero': `var(${cssVar.gradient('hero')})`,
                'gradient-spot': `var(${cssVar.gradient('spot')})`,
                'gradient-warm': `var(${cssVar.gradient('warm')})`,
            },
        },
    },

    plugins: [forms],
};
