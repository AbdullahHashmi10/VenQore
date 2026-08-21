/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  V6 tokens  →  theme module                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Reads `resources/css/venqore-v6/tokens/*.css` — the V6 design system, copied
 * into the app verbatim — and writes `resources/js/theme/themes/venqore-v6.js`.
 *
 * ── Why this script exists ──────────────────────────────────────────────────
 *
 * There are two consumers of a design token and they need different shapes:
 *
 *   1. Components that write `var(--vq-r-lg)` directly. They read the token CSS.
 *   2. Tailwind, which resolves `rounded-lg` through `--vq-radius-lg`, a
 *      different name, emitted by `generate.js` from a theme module.
 *
 * Before this script those two were authored separately and drifted: the token
 * file said `--vq-r-lg: 20px` while the thing Tailwind actually read said
 * `0.5rem`, so `rounded-lg` shipped at 8px across all 312 pages.
 *
 * Now the CSS is the single source and the theme module is generated from it.
 * Editing the theme module by hand is a mistake — it will be overwritten.
 *
 * ── Why generated literals rather than `var()` indirection ─────────────────
 *
 * The theme module could have said `lg: 'var(--vq-r-lg)'` and skipped the
 * parsing entirely. It does not, because `generate.js` also emits the user-
 * facing density and radius presets (`data-vq-radius="sharp|default|round"`) by
 * multiplying each length — and `scaleLength()` returns any non-numeric string
 * unchanged. A `var()` reference would silently make those three settings do
 * nothing. Literals keep them working.
 *
 *     npm run theme:from-v6      # regenerate the theme module
 *     npm run theme:build        # then regenerate theme.generated.css
 *
 * Both run automatically as part of `npm run dev` and `npm run build`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHADES, toTriplet, toHex, mix, ramp as buildRamp } from '../color.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = path.resolve(HERE, '../../../css/venqore-v6/tokens');
const OUT_FILE = path.resolve(HERE, '../themes/venqore-v6.js');

const FILES = [
    'fonts.css', 'colors.css', 'typography.css', 'spacing.css',
    'radius.css', 'elevation.css', 'motion.css', 'theme.css', 'base.css',
];

/* ------------------------------------------------------------------ *
 * 1. Parse
 * ------------------------------------------------------------------ */

/**
 * Pull custom properties out of a CSS file, keyed by selector.
 *
 * Deliberately simple: the token files are flat `:root { --a: b; }` blocks with
 * no nesting, no media queries and no at-rules other than the font `@import`.
 * A real CSS parser would be a dependency for no gain, but this is also why the
 * files must stay flat — see the guard below.
 */
function parseTokenFile(source, file) {
    const out = {};
    // Strip comments first so a `{` inside one cannot open a phantom block.
    const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');

    const blockRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = blockRe.exec(clean)) !== null) {
        const selector = m[1].trim();
        const body = m[2];

        // Only selectors we know how to place. `body`, `html`, `a`, `p` etc. in
        // base.css carry real CSS rather than tokens and are not our business.
        if (!/^:root/.test(selector) && !/\.vq-dark/.test(selector)) continue;

        const decls = out[selector] || (out[selector] = {});
        const declRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
        let d;
        while ((d = declRe.exec(body)) !== null) {
            decls[d[1].trim()] = d[2].replace(/\s+/g, ' ').trim();
        }
    }

    if (/@media|@supports|@container/.test(clean) && file !== 'base.css') {
        throw new Error(
            `[from-v6] ${file} contains an at-rule this parser does not handle. ` +
            `Token files must stay flat.`,
        );
    }

    return out;
}

function readTokens() {
    const light = {};
    const dark = {};

    for (const file of FILES) {
        const full = path.join(TOKENS_DIR, file);
        if (!fs.existsSync(full)) {
            throw new Error(`[from-v6] Missing token file: ${full}`);
        }
        const blocks = parseTokenFile(fs.readFileSync(full, 'utf8'), file);

        for (const [selector, decls] of Object.entries(blocks)) {
            const isDark = /data-theme="dark"/.test(selector) || /\.vq-dark/.test(selector);
            Object.assign(isDark ? dark : light, decls);
        }
    }

    if (!light['--vq-r-lg']) throw new Error('[from-v6] No --vq-r-lg found. Wrong TOKENS_DIR?');
    return { light, dark };
}

/* ------------------------------------------------------------------ *
 * 2. Resolve
 * ------------------------------------------------------------------ */

/** Follow `var(--x)` chains to a literal. Throws on a cycle rather than hanging. */
function resolve(name, scope, base, seen = new Set()) {
    if (seen.has(name)) throw new Error(`[from-v6] Circular token reference at ${name}`);
    seen.add(name);

    const raw = scope[name] ?? base[name];
    if (raw == null) throw new Error(`[from-v6] Undefined token: ${name}`);

    const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw);
    return m ? resolve(m[1], scope, base, seen) : raw;
}

const RGBA_RE = /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\s*\)$/;

/**
 * Flatten a token to an opaque hex.
 *
 * V6 writes several dark-mode values as low-alpha white or mint — `--vq-line:
 * rgb(255 255 255 / .10)`. The theme engine stores every colour as an opaque
 * RGB triplet so Tailwind's `<alpha-value>` modifier keeps working, so a
 * translucent token has to be composited against the surface it sits on first.
 * Composite here, once, rather than letting each component guess.
 */
function flatten(value, backdrop) {
    const m = RGBA_RE.exec(value.trim());
    if (!m) return value;

    const [, r, g, b, a] = m;
    return toHex(mix(backdrop, { r: +r, g: +g, b: +b, a: 1 }, Math.min(1, +a)));
}

/* ------------------------------------------------------------------ *
 * 3. Ramps
 * ------------------------------------------------------------------ */

/**
 * Build an 11-stop ramp.
 *
 * V6 ships its brand and neutral at full 11-stop depth, but the five
 * "playmates" only carry five anchors (100/300/400/500/700) because that is all
 * a five-colour accent needs when a human is choosing. Tailwind needs all
 * eleven, so the gaps are filled by `ramp()` — the engine's own generator,
 * which walks a tuned lightness and saturation curve — and every stop V6 does
 * state is pinned as an override so the generated steps bend around the real
 * colours rather than replacing them.
 */
function rampFrom(anchors, { anchor = 500, label } = {}) {
    const overrides = {};
    for (const shade of SHADES) {
        if (anchors[shade] != null) overrides[shade] = anchors[shade];
    }

    const base = anchors[anchor] ?? anchors[500] ?? Object.values(anchors)[0];
    if (!base) throw new Error(`[from-v6] Cannot build ramp "${label}" — no anchors.`);

    const full = buildRamp(base, { anchor, overrides });

    for (const shade of SHADES) {
        if (full[shade] == null) throw new Error(`[from-v6] ramp "${label}" missing ${shade}`);
    }
    return full;
}

/** Collect `--vq-<family>-<shade>` stops out of the resolved token map. */
function collect(tokens, family) {
    const out = {};
    const re = new RegExp(`^--vq-${family}-(\\d+)$`);
    for (const [name, value] of Object.entries(tokens)) {
        const m = re.exec(name);
        if (m) out[Number(m[1])] = value;
    }
    return out;
}

/* ------------------------------------------------------------------ *
 * 4. Bindings
 * ------------------------------------------------------------------ */

/**
 * Which V6 ramp each Tailwind colour family resolves to.
 *
 * This table is where ~38,000 existing colour classes get their new meaning, so
 * the reasoning matters more than the mapping:
 *
 *   · The four true-neutral families all become `ink`. V6's neutrals carry a
 *     160° green cast so they sit *with* the teal; a stock Tailwind grey next
 *     to V6 teal reads cold and slightly broken.
 *
 *   · `indigo` becomes the brand. It is the de-facto brand colour today at
 *     6,306 usages — almost all of it chrome — and DESIGN-RULES §1 law 2 says
 *     the brand is teal and nothing else is teal.
 *
 *   · `violet` / `purple` / `pink` become `plum` rather than teal. Collapsing
 *     every cool hue onto the brand would erase the distinction between two
 *     adjacent chart series or two adjacent badges. Plum is a real V6 playmate,
 *     so this stays on-system while keeping things apart.
 *
 *   · `emerald` (3,452 — money in, positive deltas) and `red` / `rose` (2,920 —
 *     money out, destructive) carry *meaning*, so they bind to the semantic
 *     ramps, not to playmates. So does `amber` (1,757 — warnings, pending), which
 *     is why V6's butter playmate ends up with no Tailwind family pointing at
 *     it; it stays reachable as `--vq-butter-*` from the token CSS.
 */
const PALETTE_BINDINGS = {
    slate: 'ink', gray: 'ink', zinc: 'ink', neutral: 'ink', stone: 'ink',
    indigo: 'teal', teal: 'teal',
    violet: 'plum', purple: 'plum', fuchsia: 'plum', pink: 'plum',
    blue: 'sky', sky: 'sky', cyan: 'sky',
    emerald: 'success', green: 'success',
    lime: 'lime',
    amber: 'warning', yellow: 'warning',
    orange: 'coral',
    red: 'danger', rose: 'danger',
    void: 'void',
};

/**
 * Role ramps that are an alias for another ramp.
 *
 * `info`, `success`, `warning` and `danger` are deliberately absent: they are
 * built as real ramps from V6's own semantic tokens, so they already exist
 * under those names. Listing them here would emit `get success() { return
 * this.success }` — a self-reference that recurses until the stack gives out.
 */
const ROLE_ALIASES = {
    neutral: 'ink',
    brand: 'teal',
    accent: 'teal',
    highlight: 'coral',
};

/* ------------------------------------------------------------------ *
 * 5. Build
 * ------------------------------------------------------------------ */

function build() {
    const { light, dark } = readTokens();
    const L = (name) => resolve(name, light, light);
    const D = (name) => flatten(resolve(name, dark, light), L('--vq-surface').startsWith('#') ? '#141B19' : '#141B19');

    /* -- ramps ---------------------------------------------------- */
    const teal = collect(light, 'teal');
    const ink = collect(light, 'ink');

    const ramps = {
        teal: rampFrom(teal, { label: 'teal' }),
        ink: rampFrom(ink, { label: 'ink' }),
        lime: rampFrom(collect(light, 'lime'), { label: 'lime' }),
        coral: rampFrom(collect(light, 'coral'), { label: 'coral' }),
        butter: rampFrom(collect(light, 'butter'), { label: 'butter' }),
        sky: rampFrom(collect(light, 'sky'), { label: 'sky' }),
        plum: rampFrom(collect(light, 'plum'), { label: 'plum' }),

        // Semantic ramps. V6 states one value per role plus a wash and a line;
        // those three are pinned and the rest of the scale is generated around
        // them. The stated value lands on 600 because that is the stop the app
        // reaches for when a colour has to carry meaning on a light surface.
        success: rampFrom(
            { 100: L('--vq-success-bg'), 200: L('--vq-success-line'), 600: L('--vq-success') },
            { anchor: 600, label: 'success' },
        ),
        warning: rampFrom(
            { 100: L('--vq-warning-bg'), 200: L('--vq-warning-line'), 600: L('--vq-warning') },
            { anchor: 600, label: 'warning' },
        ),
        danger: rampFrom(
            { 100: L('--vq-danger-bg'), 200: L('--vq-danger-line'), 600: L('--vq-danger') },
            { anchor: 600, label: 'danger' },
        ),
        info: rampFrom(
            { 100: L('--vq-info-bg'), 200: L('--vq-info-line'), 600: L('--vq-info') },
            { anchor: 600, label: 'info' },
        ),

        // `void` is not a Tailwind family. It was introduced by this engine for
        // the deep backgrounds that used to be arbitrary values (`bg-[#05030f]`)
        // on auth, marketing and platform screens. In V6 those are the bottom of
        // the ink scale, which is a near-black green rather than a near-black
        // blue.
        void: rampFrom(
            { 900: L('--vq-ink-950'), 950: L('--vq-ink-1000') },
            { anchor: 900, label: 'void' },
        ),
    };

    /* -- semantic ------------------------------------------------- */
    const semantic = {
        light: {
            'bg-app': L('--vq-bg'),
            'bg-sunken': L('--vq-sunken'),
            'bg-surface': L('--vq-surface'),
            'bg-raised': L('--vq-surface-2'),
            'bg-overlay': L('--vq-raised'),
            'bg-scrim': flatten(L('--vq-scrim'), '#FFFFFF'),

            ink: L('--vq-text'),
            'ink-secondary': L('--vq-text-2'),
            'ink-muted': L('--vq-text-3'),
            'ink-faint': L('--vq-ink-400'),
            'ink-inverted': L('--vq-text-inverted'),

            border: L('--vq-line'),
            'border-strong': L('--vq-line-strong'),
            'border-subtle': L('--vq-line-soft'),

            'interactive-hover': L('--vq-ink-50'),
            'interactive-active': L('--vq-ink-100'),
            'interactive-selected': L('--vq-accent-quiet'),
            'focus-ring': L('--vq-focus'),
        },
        dark: {
            'bg-app': D('--vq-bg'),
            'bg-sunken': D('--vq-sunken'),
            'bg-surface': D('--vq-surface'),
            'bg-raised': D('--vq-surface-2'),
            'bg-overlay': D('--vq-raised'),
            'bg-scrim': flatten(dark['--vq-scrim'], '#0C1211'),

            ink: D('--vq-text'),
            'ink-secondary': D('--vq-text-2'),
            'ink-muted': D('--vq-text-3'),
            'ink-faint': L('--vq-ink-500'),
            'ink-inverted': D('--vq-text-inverted'),

            // These three are stated as low-alpha white in V6 and are composited
            // against the dark card surface, which is where a border is seen.
            border: flatten(dark['--vq-line'], '#141B19'),
            'border-strong': flatten(dark['--vq-line-strong'], '#141B19'),
            'border-subtle': flatten(dark['--vq-line-soft'], '#141B19'),

            'interactive-hover': D('--vq-surface-2'),
            'interactive-active': D('--vq-raised'),
            'interactive-selected': flatten(dark['--vq-accent-quiet'], '#141B19'),
            'focus-ring': D('--vq-focus'),
        },
    };

    /* -- scalars -------------------------------------------------- */
    const px = (name) => L(name);

    const typography = {
        families: {
            sans: L('--vq-font-sans'),
            display: L('--vq-font-display'),
            mono: L('--vq-font-mono'),
            numeric: L('--vq-font-numeric'),
        },
        /**
         * The Tailwind size scale is NOT rebound to V6's semantic sizes.
         *
         * V6 names sizes by role — `--vq-fs-body`, `--vq-fs-metric` — while
         * Tailwind names them by step. There is no honest mapping between the
         * two, and inventing one would move `text-sm` (which carries most of
         * this interface) for no design reason. V6 body is 16px and Tailwind
         * `text-base` is 16px; they already agree where it matters.
         *
         * The role sizes stay available under their own names, so a component
         * that wants the metric size writes `var(--vq-fs-metric)` and gets 38px.
         */
        sizes: {
            '4xs': '0.5rem', '3xs': '0.5625rem', '2xs': '0.625rem', '1xs': '0.6875rem',
            xs: ['0.75rem', '1rem'],
            sm: ['0.875rem', '1.5rem'],
            base: [px('--vq-fs-body'), L('--vq-lh-body')],
            lg: ['1.125rem', '1.75rem'],
            xl: [px('--vq-fs-h3'), L('--vq-lh-h3')],
            '2xl': ['1.5rem', '1.25'],
            '3xl': [px('--vq-fs-h2'), L('--vq-lh-h2')],
            '4xl': [px('--vq-fs-metric'), L('--vq-lh-metric')],
            '5xl': [px('--vq-fs-h1'), L('--vq-lh-h1')],
        },
        weights: {
            light: '300',
            normal: L('--vq-fw-regular'),
            medium: L('--vq-fw-medium'),
            semibold: L('--vq-fw-semi'),
            bold: L('--vq-fw-bold'),
            // 800 and 900 are not in V6. They are held at 700 rather than
            // removed so the 1,948 `font-black` / `font-extrabold` classes stop
            // rendering illegal weights immediately, while still compiling until
            // the Phase 3 codemod deletes them.
            extrabold: L('--vq-fw-bold'),
            black: L('--vq-fw-bold'),
        },
        leading: {
            none: '1',
            tight: L('--vq-lh-h1'),
            snug: L('--vq-lh-h3'),
            normal: L('--vq-lh-body'),
            relaxed: L('--vq-lh-lede'),
            loose: '2',
        },
        tracking: {
            tighter: L('--vq-ls-display'),
            tight: L('--vq-ls-h2'),
            normal: '0em',
            wide: '0.025em',
            wider: '0.05em',
            widest: L('--vq-ls-eyebrow'),
        },
    };

    const shape = {
        radius: {
            none: px('--vq-r-none'),
            xs: px('--vq-r-xs'),
            sm: px('--vq-r-sm'),
            md: px('--vq-r-md'),
            lg: px('--vq-r-lg'),
            xl: px('--vq-r-xl'),
            '2xl': px('--vq-r-2xl'),
            // V6 has no 3xl and DESIGN-RULES §7 caps the scale at 2xl. The key
            // is held at the ceiling rather than deleted so the 348 existing
            // `rounded-3xl` usages keep compiling through Phase 0; Phase 1
            // removes it and the build then reports every one of them.
            '3xl': px('--vq-r-2xl'),
            full: px('--vq-r-full'),
        },
        shadow: {
            none: L('--vq-elev-0'),
            xs: L('--vq-elev-1'),
            sm: L('--vq-elev-1'),
            md: L('--vq-elev-2'),
            lg: L('--vq-elev-2'),
            xl: L('--vq-elev-3'),
            '2xl': L('--vq-elev-3'),
            inner: L('--vq-elev-inset'),
            glow: L('--vq-glow-accent'),
        },
        border: { hairline: '1px', thin: '1px', thick: '2px' },
    };

    const density = {
        // V6's space scale shares Tailwind's 4px base, step for step, so this is
        // a rebinding rather than a rescale. The two half-steps V6 does not
        // state keep their stock values.
        space: {
            '0.5': '0.125rem',
            '1': px('--vq-space-1'), '1.5': '0.375rem', '2': px('--vq-space-2'),
            '3': px('--vq-space-3'), '4': px('--vq-space-4'), '5': px('--vq-space-5'),
            '6': px('--vq-space-6'), '8': px('--vq-space-8'), '10': px('--vq-space-10'),
            '12': px('--vq-space-12'), '16': px('--vq-space-16'), '20': px('--vq-space-20'),
            '24': px('--vq-space-24'),
        },
        control: {
            'height-sm': px('--vq-control-sm'),
            'height-md': px('--vq-control-md'),
            'height-lg': px('--vq-control-lg'),
            'padding-x': px('--vq-space-5'),
            gap: px('--vq-space-2'),
        },
        layout: {
            // Layout Law v2.0 §1. The gutter is 24px on both axes and is
            // implemented as `gap`, never margin-bottom.
            gutter: px('--vq-gutter'),
            'section-gap': px('--vq-space-8'),
            'card-padding': px('--vq-space-5'),
            'page-max-width': px('--vq-page-max'),
            'sidebar-width': px('--vq-rail-w'),
        },
    };

    const motion = {
        duration: {
            instant: '0ms',
            fast: L('--vq-dur-1'),
            normal: L('--vq-dur-2'),
            slow: L('--vq-dur-3'),
            slower: L('--vq-dur-4'),
        },
        easing: {
            standard: L('--vq-ease-out'),
            entrance: L('--vq-ease-spring-soft'),
            exit: L('--vq-ease-in-out'),
            spring: L('--vq-ease-spring'),
        },
    };

    const gradients = {
        brand: L('--vq-grad-mint'),
        'brand-soft': `linear-gradient(135deg, ${L('--vq-teal-100')}, ${L('--vq-teal-50')})`,
        hero: L('--vq-grad-hero'),
        spot: L('--vq-grad-spot'),
        // `bg-gradient-aurora` is referenced by tailwind.config.js and by a
        // handful of screens. V6 renamed the ambient radial pair to `spot`, so
        // without this alias the class would compile to an undefined variable
        // and silently paint nothing.
        aurora: L('--vq-grad-spot'),
        warm: L('--vq-grad-warm'),
        success: `linear-gradient(135deg, ${L('--vq-teal-500')} 0%, ${L('--vq-teal-700')} 100%)`,
        info: `linear-gradient(135deg, ${L('--vq-sky-400')} 0%, ${L('--vq-sky-700')} 100%)`,
        danger: `linear-gradient(135deg, ${L('--vq-coral-400')} 0%, ${L('--vq-coral-700')} 100%)`,
        'hairline-accent': `linear-gradient(to right, transparent, ${L('--vq-teal-500')}, transparent)`,
    };

    return { ramps, semantic, typography, shape, density, motion, gradients };
}

/* ------------------------------------------------------------------ *
 * 6. Emit
 * ------------------------------------------------------------------ */

const j = (v) => JSON.stringify(v);

function emitRamps(ramps) {
    const PER_LINE = 3;
    const lines = [];

    for (const [name, stops] of Object.entries(ramps)) {
        lines.push(`        ${name}: {`);
        const parts = SHADES.map((s) => `${s}: '${stops[s]}'`);
        for (let i = 0; i < parts.length; i += PER_LINE) {
            lines.push('            ' + parts.slice(i, i + PER_LINE).join(', ') + ',');
        }
        lines.push('        },');
    }

    return lines.join('\n');
}

function emitObject(obj, indent = 4) {
    const pad = ' '.repeat(indent);
    const inner = ' '.repeat(indent + 4);
    const lines = [`{`];
    for (const [k, v] of Object.entries(obj)) {
        const key = /^[a-z_$][\w$]*$/i.test(k) ? k : j(k);
        if (Array.isArray(v)) lines.push(`${inner}${key}: [${v.map(j).join(', ')}],`);
        else if (v && typeof v === 'object') lines.push(`${inner}${key}: ${emitObject(v, indent + 4)},`);
        else lines.push(`${inner}${key}: ${j(v)},`);
    }
    lines.push(`${pad}}`);
    return lines.join('\n');
}

function main() {
    const t = build();

    const source = `/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  VenQore V6 — GENERATED FILE, DO NOT EDIT                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Written by \`resources/js/theme/build/from-v6-tokens.js\` from
 * \`resources/css/venqore-v6/tokens/*.css\`, which is the V6 design system copied
 * into the app verbatim.
 *
 * To change a colour, radius, duration or spacing value, edit the token CSS and
 * run \`npm run theme:from-v6\`. Editing this file directly is a mistake: the
 * next build overwrites it, and the token CSS and Tailwind would drift apart
 * again — which is the exact bug this pipeline exists to close.
 *
 * Governed by, in order: VENQORE_LAYOUT_LAW.md v2.0 (geometry) →
 * the V6 token files (values) → DESIGN-RULES.md v3.0 (structure).
 */

export default {
    id: 'venqore-v6',
    name: 'VenQore V6',
    description:
        'The V6 design system. Mint-to-pine teal on green-cast neutrals, soft-and-chunky ' +
        'shape, Bricolage Grotesque over Plus Jakarta Sans with Space Grotesk numerals. ' +
        'Generated from the token files — see from-v6-tokens.js.',
    defaultMode: 'light',

    ramps: {
${emitRamps(t.ramps)}

        // Role aliases. These drive the semantic Tailwind classes
        // (\`bg-brand-500\`, \`text-danger-600\`) that new code should use in place
        // of raw pigment names.
${Object.entries(ROLE_ALIASES).map(([role, target]) => `        ${role}: null, // -> ${target}`).join('\n')}
    },

    palettes: ${emitObject(PALETTE_BINDINGS)},

    semantic: ${emitObject(t.semantic)},

    typography: ${emitObject(t.typography)},

    shape: ${emitObject(t.shape)},

    density: ${emitObject(t.density)},

    motion: ${emitObject(t.motion)},

    gradients: ${emitObject(t.gradients)},
};
`;

    // The role aliases have to point at real ramp objects, not strings, and the
    // emitter above cannot express that. Patch them in as references.
    const withAliases = source.replace(
        /^(\s+)(\w+): null, \/\/ -> (\w+)$/gm,
        (_, pad, role, target) => `${pad}get ${role}() { return this[${j(target)}]; },`,
    );

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, withAliases, 'utf8');

    const stops = Object.keys(t.ramps).length * SHADES.length;
    console.log(`[from-v6] ${path.relative(process.cwd(), OUT_FILE)}`);
    console.log(`[from-v6] ${Object.keys(t.ramps).length} ramps (${stops} stops), ` +
        `${Object.keys(PALETTE_BINDINGS).length} palette bindings`);
    console.log(`[from-v6] radius.lg = ${t.shape.radius.lg}  ·  ` +
        `duration.fast = ${t.motion.duration.fast}  ·  ` +
        `layout.gutter = ${t.density.layout.gutter}`);
}

main();
