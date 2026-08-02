/**
 * VenQore Theme Engine — CSS generator.
 *
 * Reads the theme named in `../active.js` and writes every token out as a CSS
 * custom property into `resources/css/theme.generated.css`.
 *
 * Run automatically before `dev` and `build` (see package.json). Can also be
 * run directly:
 *
 *     npm run theme:build
 *     npm run theme:build -- --check     # verify committed CSS is up to date
 *
 * ── Why generate CSS instead of injecting variables from JavaScript? ────────
 *
 * Injecting at runtime means the first paint happens with no variables set, so
 * every themed colour resolves to nothing and the user sees a flash of unstyled
 * content on every page load. It also breaks server-side rendering, which this
 * app uses (`vite build --ssr`). A static stylesheet has neither problem: the
 * browser has the values before it paints a single pixel.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getActiveTheme, ACTIVE_THEME, AVAILABLE_THEMES } from '../active.js';
import { toTriplet, toHex, contrastRatio, SHADES } from '../color.js';
import {
    validateTheme,
    cssVar,
    CONTROLLED_PALETTES,
    REQUIRED_ROLES,
    SEMANTIC_TOKENS,
} from '../contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'resources/css/theme.generated.css');

const isCheckMode = process.argv.includes('--check');

/* ------------------------------------------------------------------ *
 * Emitters
 * ------------------------------------------------------------------ */

const line = (name, value) => `    ${name}: ${value};`;

/** Layer 1: the ramps themselves, holding real channel triplets. */
function emitRamps(theme) {
    const out = [];

    for (const name of Object.keys(theme.ramps).sort()) {
        const stops = theme.ramps[name];
        out.push(`\n    /* ramp: ${name} */`);
        for (const shade of SHADES) {
            out.push(line(cssVar.ramp(name, shade), toTriplet(stops[shade])));
        }
    }
    return out;
}

/**
 * Layer 2: the indirection that does the actual work.
 *
 * Each Tailwind colour family points at whichever ramp the theme bound it to.
 * This is the single mechanism that makes ~40,000 pre-existing classes follow
 * the theme without any component being edited: Tailwind compiles
 * `bg-indigo-600` to `rgb(var(--vq-indigo-600) / 1)`, and this block decides
 * what `--vq-indigo-600` means.
 */
function emitPaletteBindings(theme) {
    const out = [];
    const grouped = new Map();

    for (const palette of CONTROLLED_PALETTES) {
        const rampName = theme.palettes[palette];
        if (!grouped.has(rampName)) grouped.set(rampName, []);
        grouped.get(rampName).push(palette);
    }

    for (const [rampName, palettes] of grouped) {
        out.push(`\n    /* ${palettes.join(', ')} → ${rampName} */`);
        for (const palette of palettes) {
            for (const shade of SHADES) {
                out.push(line(
                    cssVar.palette(palette, shade),
                    `var(${cssVar.ramp(rampName, shade)})`,
                ));
            }
        }
    }

    // Role names get the same treatment so new code can write `bg-brand-500`
    // and `text-danger-600` instead of inheriting the old pigment vocabulary.
    out.push(`\n    /* semantic role aliases — prefer these in new code */`);
    for (const role of REQUIRED_ROLES) {
        for (const shade of SHADES) {
            out.push(line(
                cssVar.palette(role, shade),
                `var(${cssVar.ramp(role, shade)})`,
            ));
        }
    }

    return out;
}

function emitSemantic(theme, mode) {
    const set = theme.semantic[mode];
    return SEMANTIC_TOKENS.map((token) =>
        line(cssVar.semantic(token), toTriplet(set[token])),
    );
}

/**
 * Font sizes, which may be `'0.875rem'` or `['0.875rem', '1.25rem']`.
 *
 * The paired form emits a companion `--vq-text-<key>--line-height` variable.
 * The bare form emits no line-height at all, which is not an oversight: the
 * micro sizes it represents replace arbitrary values like `text-[10px]` that
 * set font-size only, and inventing a line-height for them would reflow
 * thousands of elements.
 */
function emitSizes(sizes) {
    const out = ['\n    /* type scale */'];

    for (const [key, value] of Object.entries(sizes)) {
        if (Array.isArray(value)) {
            out.push(line(cssVar.size(key), value[0]));
            out.push(line(`${cssVar.size(key)}--line-height`, value[1]));
        } else {
            out.push(line(cssVar.size(key), value));
        }
    }
    return out;
}

function emitScalarGroup(obj, varFn, comment) {
    const out = [`\n    /* ${comment} */`];
    for (const [key, value] of Object.entries(obj)) {
        out.push(line(varFn(key), value));
    }
    return out;
}

/* ------------------------------------------------------------------ *
 * Quality checks — advisory, not fatal
 * ------------------------------------------------------------------ */

/**
 * Flag text/background pairs that fall below WCAG AA (4.5:1 for body text).
 * These are warnings rather than errors: a theme may legitimately use a low
 * contrast pairing for decorative text, and blocking the build on it would just
 * teach everyone to disable the check. But the "hard to read" complaint that
 * prompted this whole exercise is exactly what this catches, so it prints
 * loudly.
 */
function auditContrast(theme) {
    const warnings = [];

    for (const mode of ['light', 'dark']) {
        const s = theme.semantic[mode];

        const pairs = [
            ['ink', 'bg-surface', 4.5, 'primary text on cards'],
            ['ink-secondary', 'bg-surface', 4.5, 'body text on cards'],
            ['ink-muted', 'bg-surface', 4.5, 'labels and metadata on cards'],
            ['ink-faint', 'bg-surface', 3.0, 'placeholder text on cards'],
            ['ink', 'bg-app', 4.5, 'primary text on the page background'],
            ['ink-muted', 'bg-app', 4.5, 'labels on the page background'],
        ];

        for (const [fg, bg, minimum, description] of pairs) {
            const ratio = contrastRatio(s[fg], s[bg]);
            if (ratio < minimum) {
                warnings.push(
                    `${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 ` +
                    `(want ${minimum}:1) — ${description}. ` +
                    `${toHex(s[fg])} on ${toHex(s[bg])}`,
                );
            }
        }
    }

    return warnings;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

function buildCss(theme) {
    const header = [
        '/*',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' *  GENERATED FILE — DO NOT EDIT',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' *',
        ` *  Theme:  ${theme.name} (${theme.id})`,
        ` *  Source: resources/js/theme/themes/${theme.id}.js`,
        ' *',
        ' *  Regenerate with:  npm run theme:build',
        ' *',
        ' *  Edits here are overwritten on every build. To change how the product',
        ' *  looks, edit the theme file above, or switch themes in',
        ' *  resources/js/theme/active.js.',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' */',
        '',
        ':root {',
        `    /* Theme identity — readable from JS via getComputedStyle if ever needed */`,
        `    --vq-theme-id: '${theme.id}';`,
    ];

    const body = [
        '',
        '    /* ═══════════════ COLOUR RAMPS ═══════════════',
        '       Stored as bare "R G B" channel triplets, not hex, so that Tailwind\'s',
        '       opacity modifiers keep working: bg-indigo-500/30 compiles to',
        '       rgb(var(--vq-indigo-500) / 0.3). A hex value here would break every',
        '       /opacity class in the codebase. */',
        ...emitRamps(theme),

        '',
        '    /* ═══════════════ PALETTE BINDINGS ═══════════════',
        '       Tailwind colour families pointed at ramps. This is the layer that',
        '       reskins the ~40,000 pre-existing colour classes without touching a',
        '       single component. */',
        ...emitPaletteBindings(theme),

        '',
        '    /* ═══════════════ SEMANTIC — LIGHT MODE ═══════════════',
        '       Overridden by the .dark block below. */',
        ...emitSemantic(theme, 'light'),

        ...emitScalarGroup(theme.typography.families, cssVar.font, '═══════════════ TYPOGRAPHY ═══════════════'),
        ...emitSizes(theme.typography.sizes),
        ...emitScalarGroup(theme.typography.weights, cssVar.weight, 'weights'),
        ...emitScalarGroup(theme.typography.leading, cssVar.leading, 'line heights'),
        ...emitScalarGroup(theme.typography.tracking, cssVar.tracking, 'letter spacing'),

        ...emitScalarGroup(theme.shape.radius, cssVar.radius, '═══════════════ SHAPE ═══════════════'),
        ...emitScalarGroup(theme.shape.shadow, cssVar.shadow, 'elevation'),

        ...emitScalarGroup(theme.density.space, cssVar.space, '═══════════════ DENSITY ═══════════════'),
        ...emitScalarGroup(theme.density.control, cssVar.control, 'control sizing'),
        ...emitScalarGroup(theme.density.layout, cssVar.layout, 'layout'),

        ...emitScalarGroup(theme.motion.duration, cssVar.duration, '═══════════════ MOTION ═══════════════'),
        ...emitScalarGroup(theme.motion.easing, cssVar.easing, 'easing curves'),

        ...emitScalarGroup(theme.gradients || {}, cssVar.gradient, '═══════════════ GRADIENTS ═══════════════'),
        '}',
        '',
        '/* ═══════════════ SEMANTIC — DARK MODE ═══════════════',
        '   Only the mode-dependent tokens are restated. Ramps deliberately do NOT',
        '   change between modes: the codebase expresses mode by picking different',
        '   stops (bg-white dark:bg-slate-900), so flipping the ramps would invert',
        '   every one of those pairs. */',
        '.dark {',
        ...emitSemantic(theme, 'dark'),
        '}',
        '',
        '/* Colour-scheme hint so native controls (scrollbars, date pickers, form',
        '   widgets) match the theme instead of rendering in stock light chrome. */',
        ':root { color-scheme: light; }',
        '.dark { color-scheme: dark; }',
        '',
    ];

    return [...header, ...body].join('\n');
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

function main() {
    // Validate every registered theme, not just the active one, so a draft
    // theme cannot rot unnoticed until the day someone switches to it.
    let hasErrors = false;

    for (const [id, theme] of Object.entries(AVAILABLE_THEMES)) {
        const problems = validateTheme(theme);
        if (problems.length) {
            hasErrors = true;
            console.error(`\n✗ Theme "${id}" failed validation:\n`);
            for (const problem of problems) console.error(`    • ${problem}`);
        }
    }

    if (hasErrors) {
        console.error('\n[theme] Build aborted. Fix the problems above.\n');
        process.exit(1);
    }

    const theme = getActiveTheme();
    const css = buildCss(theme);

    if (isCheckMode) {
        const existing = fs.existsSync(OUTPUT_PATH)
            ? fs.readFileSync(OUTPUT_PATH, 'utf8')
            : '';
        if (existing !== css) {
            console.error(
                '\n[theme] resources/css/theme.generated.css is out of date.\n' +
                '        Run `npm run theme:build` and commit the result.\n',
            );
            process.exit(1);
        }
        console.log('[theme] Generated CSS is up to date.');
        return;
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, css, 'utf8');

    const varCount = (css.match(/^\s+--vq-/gm) || []).length;
    console.log(
        `[theme] ${theme.name} → resources/css/theme.generated.css ` +
        `(${varCount} variables, ${Object.keys(theme.ramps).length} ramps, ` +
        `${CONTROLLED_PALETTES.length} Tailwind palettes bound)`,
    );

    const warnings = auditContrast(theme);
    if (warnings.length) {
        console.warn(`\n[theme] ${warnings.length} readability warning(s) for "${theme.name}":`);
        for (const w of warnings) console.warn(`    ⚠ ${w}`);
        console.warn('');
    }
}

main();
