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

import { getActiveTheme, ACTIVE_THEME, AVAILABLE_THEMES, SELECTABLE_THEMES } from '../active.js';
import { toTriplet, toHex, contrastRatio, SHADES } from '../color.js';
import {
    validateTheme,
    cssVar,
    paletteVar,
    CONTROLLED_PALETTES,
    REQUIRED_ROLES,
    SEMANTIC_TOKENS,
} from '../contract.js';
import { v6ReservedPaletteFamilies, shadowedV6Colours } from './v6-owned.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'resources/css/theme.generated.css');

const isCheckMode = process.argv.includes('--check');

/**
 * Palette families the V6 token layer has already claimed for resolved colours.
 *
 * Derived from the token CSS on every build, never typed — see v6-owned.js for
 * what goes wrong when both layers write the same name. Today this is
 * `teal`, `sky`, `lime`; it is whatever V6 says it is tomorrow.
 */
const RESERVED_PALETTES = v6ReservedPaletteFamilies([
    ...CONTROLLED_PALETTES,
    ...REQUIRED_ROLES,
]);

/* ------------------------------------------------------------------ *
 * Emitters
 * ------------------------------------------------------------------ */

/**
 * A single custom-property declaration.
 *
 * The name is asserted rather than trusted. A custom property whose name is not
 * a legal ident is not a custom property: the browser silently discards both the
 * declaration and every `var()` reading it, so the failure surfaces as missing
 * padding on a button rather than as an error anyone can search for. That
 * happened once already — the spacing scale's `1.5` step produced
 * `--vq-space-1.5`, which took the padding off 2,772 class usages — and the cost
 * of never letting it happen again is this one regex.
 */
const VALID_CUSTOM_PROPERTY = /^--[a-zA-Z_][a-zA-Z0-9_-]*$/;

const line = (name, value) => {
    if (!VALID_CUSTOM_PROPERTY.test(name)) {
        throw new Error(
            `[theme] "${name}" is not a valid CSS custom property name. ` +
            `Browsers drop such declarations silently, along with every var() that reads them. ` +
            `Route the token key through cssVar() in contract.js, which sanitises it.`,
        );
    }

    return `    ${name}: ${value};`;
};

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
 * `bg-brand-600` to `rgb(var(--vq-indigo-600) / 1)`, and this block decides
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
        const moved = palettes.filter((p) => RESERVED_PALETTES.has(p));
        out.push(`\n    /* ${palettes.join(', ')} → ${rampName}${
            moved.length ? ` (${moved.join(', ')} under --vq-tw-*: V6 owns the plain name)` : ''
        } */`);
        for (const palette of palettes) {
            for (const shade of SHADES) {
                out.push(line(
                    paletteVar(palette, shade, RESERVED_PALETTES),
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
                paletteVar(role, shade, RESERVED_PALETTES),
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

/**
 * Every token a theme owns except its dark-mode semantics, as declaration lines.
 *
 * Factored out of `buildCss` when the theme system became runtime-switchable:
 * the same token set now has to be emitted once into `:root` (the build-time
 * default, and what paints before any JavaScript runs) and once per selectable
 * theme into `[data-vq-theme="…"]`. Two copies of this list would guarantee that
 * a token added to one is forgotten in the other.
 */
function emitThemeTokens(theme) {
    return [
        `    /* Theme identity — readable from JS via getComputedStyle if ever needed */`,
        `    --vq-theme-id: '${theme.id}';`,
        '',
        '    /* ═══════════════ COLOUR RAMPS ═══════════════',
        '       Stored as bare "R G B" channel triplets, not hex, so that Tailwind\'s',
        '       opacity modifiers keep working: bg-brand-500/30 compiles to',
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
        '       Overridden by the dark blocks further down. */',
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
    ];
}

/**
 * The selectable themes, each scoped to an attribute on <html>.
 *
 * ── Why the block order below is not negotiable ─────────────────────────────
 *
 * `.dark` and `[data-vq-theme="x"]` have identical specificity (0,1,0), so
 * between them the later rule wins. If a theme's LIGHT semantics were emitted
 * after `.dark`, then switching to that theme in dark mode would paint light
 * surfaces with light-mode tokens — white cards on a black page.
 *
 * So: theme light blocks first, then `.dark`, then the theme dark blocks, which
 * are `[data-vq-theme="x"].dark` (0,2,0) and therefore beat `.dark` regardless
 * of order. That single ordering constraint is what makes runtime switching work
 * with no JavaScript beyond setting one attribute.
 */
function emitThemeLibrary(themes) {
    const light = [];
    const dark = [];

    for (const theme of themes) {
        light.push(
            '',
            `/* ── ${theme.name} (${theme.id}) ── */`,
            `[data-vq-theme="${theme.id}"] {`,
            ...emitThemeTokens(theme),
            '}',
        );

        dark.push(
            '',
            `[data-vq-theme="${theme.id}"].dark {`,
            ...emitSemantic(theme, 'dark'),
            '}',
        );
    }

    return { light, dark };
}

/* ------------------------------------------------------------------ *
 * User customisation — density, radius and font
 * ------------------------------------------------------------------ *
 *
 * These are the three dials Appearance settings exposes that cannot be
 * expressed as a colour, and the reason they are emitted as CSS rather than
 * written from JavaScript is the same reason the themes are: a page that has to
 * wait for JavaScript to learn how much padding it uses reflows in front of the
 * user on every single load.
 *
 * They are emitted per theme because the values are per theme — Classic's
 * "compact" is already tighter than Colour's, and a single global scale would
 * either bloat Classic or crush Colour.
 */

/** Multiply a CSS length, leaving `0`, `%`, `9999px` and `none` alone. */
function scaleLength(value, factor) {
    if (typeof value !== 'string') return value;

    const match = value.trim().match(/^(-?[\d.]+)(rem|em|px)$/);
    if (!match) return value;

    const amount = parseFloat(match[1]);
    const unit = match[2];

    if (!Number.isFinite(amount) || amount === 0) return value;
    if (unit === 'px' && amount >= 1000) return value; // 9999px pill radii

    // Three decimals is below a tenth of a pixel at any sane root size, and
    // keeps the generated file from filling with floating-point noise.
    const scaled = Math.round(amount * factor * 1000) / 1000;
    return `${scaled}${unit}`;
}

const scaleGroup = (group, factor, varFn) =>
    Object.entries(group).map(([key, value]) => line(varFn(key), scaleLength(value, factor)));

/**
 * Density presets.
 *
 * `comfortable` is emitted even though it is the theme's own value, so that
 * switching back to it is a plain attribute change rather than a special case
 * that has to clear the attribute — the kind of asymmetry that produces
 * "it won't go back" bugs.
 */
const DENSITY_SCALES = { compact: 0.84, comfortable: 1, spacious: 1.18 };

/** Corner radius presets. Sharp does not go fully square: 0.35 keeps a 1–2px
 *  softening that stops borders from looking like a rendering artefact. */
const RADIUS_SCALES = { sharp: 0.35, default: 1, round: 1.6 };

function emitDensityVariants(theme) {
    const out = [];

    for (const [level, factor] of Object.entries(DENSITY_SCALES)) {
        out.push(
            '',
            `[data-vq-theme="${theme.id}"][data-vq-density="${level}"] {`,
            ...scaleGroup(theme.density.space, factor, cssVar.space),
            ...scaleGroup(theme.density.control, factor, cssVar.control),
            // Page and sidebar widths are structure, not density. Scaling them
            // would move the sidebar every time someone nudged the spacing dial.
            ...scaleGroup(
                {
                    gutter: theme.density.layout.gutter,
                    'section-gap': theme.density.layout['section-gap'],
                    'card-padding': theme.density.layout['card-padding'],
                },
                factor,
                cssVar.layout,
            ),
            '}',
        );
    }

    return out;
}

function emitRadiusVariants(theme) {
    const out = [];

    for (const [level, factor] of Object.entries(RADIUS_SCALES)) {
        out.push(
            '',
            `[data-vq-theme="${theme.id}"][data-vq-radius="${level}"] {`,
            ...scaleGroup(theme.shape.radius, factor, cssVar.radius),
            '}',
        );
    }

    return out;
}

/**
 * Font choices. Unlike density and radius these are theme-independent — a font
 * stack means the same thing in every theme — so they are emitted once.
 *
 * `theme` is deliberately NOT one of the options: a user who wants the theme's
 * own typography simply has no `data-vq-font` attribute set.
 */
const FONT_CHOICES = {
    inter: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    figtree: "'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    grotesk: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
};

function emitFontVariants() {
    const out = [];

    for (const [key, stack] of Object.entries(FONT_CHOICES)) {
        out.push(
            '',
            `[data-vq-font="${key}"] {`,
            line(cssVar.font('sans'), stack),
            line(cssVar.font('display'), stack),
            // Numeric follows the choice too, except for the serif option: serif
            // digits in a currency column are genuinely harder to scan, and this
            // is an accounting product before it is a stylish one.
            line(cssVar.font('numeric'), key === 'serif' ? FONT_CHOICES.inter : stack),
            '}',
        );
    }

    return out;
}

function buildCss(theme) {
    const selectable = SELECTABLE_THEMES
        .map((id) => AVAILABLE_THEMES[id])
        .filter(Boolean);

    const library = emitThemeLibrary(selectable);

    return [
        '/*',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' *  GENERATED FILE — DO NOT EDIT',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' *',
        ` *  Build-time default:  ${theme.name} (${theme.id})`,
        ` *  Source:              resources/js/theme/themes/${theme.id}.js`,
        ` *  Runtime-selectable:  ${selectable.map((t) => t.id).join(', ')}`,
        ' *',
        ' *  Regenerate with:  npm run theme:build',
        ' *',
        ' *  Edits here are overwritten on every build. To change how the product',
        ' *  looks, edit the theme files above, or switch the build-time default in',
        ' *  resources/js/theme/active.js.',
        ' *',
        ' *  The :root block is what paints before any JavaScript runs. The',
        ' *  [data-vq-theme="…"] blocks let a user switch themes at runtime by',
        ' *  changing one attribute on <html> — see Contexts/AppearanceContext.jsx.',
        ' * ═══════════════════════════════════════════════════════════════════════════',
        ' */',
        '',
        ':root {',
        ...emitThemeTokens(theme),
        '}',
        '',
        '/* ═══════════════════════════════════════════════════════════════════════════',
        '   THEME LIBRARY — LIGHT',
        '   ═══════════════════════════════════════════════════════════════════════════ */',
        ...library.light,
        '',
        '/* ═══════════════════════════════════════════════════════════════════════════',
        '   USER CUSTOMISATION — DENSITY',
        '   Attribute pairs, so specificity (0,2,0) beats the theme block above',
        '   without depending on source order.',
        '   ═══════════════════════════════════════════════════════════════════════════ */',
        ...selectable.flatMap(emitDensityVariants),
        '',
        '/* ═══════════════════════════════════════════════════════════════════════════',
        '   USER CUSTOMISATION — CORNER RADIUS',
        '   ═══════════════════════════════════════════════════════════════════════════ */',
        ...selectable.flatMap(emitRadiusVariants),
        '',
        '/* ═══════════════════════════════════════════════════════════════════════════',
        '   USER CUSTOMISATION — TYPEFACE',
        '   Theme-independent, and emitted after the theme blocks because it shares',
        '   their specificity. No attribute set means "use the theme\'s own type".',
        '   ═══════════════════════════════════════════════════════════════════════════ */',
        ...emitFontVariants(),
        '',
        '/* ═══════════════ SEMANTIC — DARK MODE (build-time default) ═══════════════',
        '   Only the mode-dependent tokens are restated. Ramps deliberately do NOT',
        '   change between modes: the codebase expresses mode by picking different',
        '   stops (bg-white dark:bg-slate-900), so flipping the ramps would invert',
        '   every one of those pairs. */',
        '.dark {',
        ...emitSemantic(theme, 'dark'),
        '}',
        '',
        '/* ═══════════════════════════════════════════════════════════════════════════',
        '   THEME LIBRARY — DARK',
        '   ═══════════════════════════════════════════════════════════════════════════ */',
        ...library.dark,
        '',
        '/* Colour-scheme hint so native controls (scrollbars, date pickers, form',
        '   widgets) match the theme instead of rendering in stock light chrome. */',
        ':root { color-scheme: light; }',
        '.dark { color-scheme: dark; }',
        '',
    ].join('\n');
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

    /*
     * The guard.
     *
     * A generated triplet landing on a name the V6 layer holds a colour in is
     * not a style regression — it is a silent one. `background: var(--vq-…)`
     * resolves to `8 137 117`, which is invalid at computed-value time, so the
     * browser drops the whole declaration and paints nothing. Nobody sees an
     * error; they see an invisible button and go looking in the component.
     *
     * That cost a lot of hours once. It costs this check now.
     */
    const shadowed = shadowedV6Colours(css);
    if (shadowed.length) {
        console.error(
            `\n[theme] Build aborted — ${shadowed.length} generated name(s) would ` +
            'shadow a V6 colour token:\n',
        );
        for (const name of shadowed) console.error(`    • ${name}`);
        console.error(
            '\n        The V6 layer holds resolved colours in these names and this\n' +
            '        sheet would overwrite them with channel triplets. Everything\n' +
            '        reading them as a colour would then paint nothing, silently.\n\n' +
            '        Fix: the family belongs in the --vq-tw-* namespace. That is\n' +
            '        automatic for anything listed in CONTROLLED_PALETTES or\n' +
            '        REQUIRED_ROLES — see theme/build/v6-owned.js.\n',
        );
        process.exit(1);
    }

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
        `${CONTROLLED_PALETTES.length} Tailwind palettes bound` +
        `${RESERVED_PALETTES.size ? `, ${[...RESERVED_PALETTES].join('/')} via --vq-tw-*` : ''})`,
    );

    const warnings = auditContrast(theme);
    if (warnings.length) {
        console.warn(`\n[theme] ${warnings.length} readability warning(s) for "${theme.name}":`);
        for (const w of warnings) console.warn(`    ⚠ ${w}`);
        console.warn('');
    }
}

main();
