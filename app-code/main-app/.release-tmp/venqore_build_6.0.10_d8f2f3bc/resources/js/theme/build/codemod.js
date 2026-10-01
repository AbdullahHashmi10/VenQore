/**
 * VenQore Theme Engine — hardcoded-value codemod.
 *
 * Rewrites values that no theme can reach — raw hex, Tailwind arbitrary colour
 * values, arbitrary font sizes — into theme tokens.
 *
 *     node resources/js/theme/build/codemod.js            # dry run + report
 *     node resources/js/theme/build/codemod.js --write    # apply
 *     node resources/js/theme/build/codemod.js --write --only=classes,sizes
 *
 * ── Safety rules ────────────────────────────────────────────────────────────
 *
 * 1. EXACT MATCHES ONLY. A hex is converted only if it matches a theme value
 *    outright, or differs by at most 4/255 on every channel (imperceptible; this
 *    exists to fold the near-duplicate near-blacks the codebase accumulated —
 *    #020010, #02000c and #02000f are the same colour to any human eye).
 *
 *    Anything else is left alone and reported. That single rule is what protects
 *    third-party brand colours: #ff9900 (Amazon), #69c9d0 (TikTok) and
 *    #207985 (the VenQore logo) match no theme token, so they survive untouched.
 *    Those colours *should* be hardcoded — they are not ours to restyle.
 *
 * 2. WHOLE QUOTED STRINGS ONLY. A hex is converted only when it is the entire
 *    contents of a quoted string: `fill="#6366f1"`, `{ color: '#10b981' }`.
 *    This avoids the trap of matching inside SVG identifiers — `url(#0e19ec6dbb)`
 *    contains a valid-looking 6-digit hex, and a naive regex silently corrupts
 *    every clip path in the file.
 *
 * 3. SKIP LIST. Logo and brand-asset files are excluded outright.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getActiveTheme } from '../active.js';
import { parseHex, toHex } from '../color.js';
import { CONTROLLED_PALETTES, SHADES } from '../contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const SCAN_ROOT = path.join(PROJECT_ROOT, 'resources/js');

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').replace('--only=', '')
    .split(',').filter(Boolean);

const enabled = (step) => ONLY.length === 0 || ONLY.includes(step);

/** Colours here are somebody else's intellectual property, artwork, or tokens. */
const SKIP_FILES = [
    'Components/ApplicationLogo.jsx',
    'Components/MidnightNebula.jsx',
    // Already a token file; converted by hand to delegate to the engine.
    'Platform/theme.js',
];

/**
 * How close a colour must be to a theme token before it is treated as that
 * token. Tolerance is graded by darkness, for a reason worth spelling out.
 *
 * At normal luminance, 4/255 per channel is the point where a difference stops
 * being visible. Down in near-black territory the eye is far less sensitive to
 * absolute channel differences, and the codebase accumulated a long tail of
 * hand-typed voids — #05030f, #050508, #0a0a10, #0b081e, #0c0c12, #080d17 —
 * that are all "the dark background" as far as any user is concerned.
 *
 * Folding those onto a small number of named stops is the point of the exercise,
 * not a regrettable side effect: twenty subtly different near-blacks was never a
 * design decision, it was drift. The wider window is capped at 16 and only
 * applies when every channel is already below 48, so genuinely coloured darks
 * (#1e3a5f steel blue, #2d0000 maroon) stay out of reach.
 */
const TOLERANCE = 4;
const DARK_CEILING = 48;
const DARK_TOLERANCE = 16;

/**
 * The wider dark window must not be allowed to change *hue*.
 *
 * A first pass with a plain distance check folded #001a1c (a teal-black) onto
 * slate-900 (a navy-black) and #05130c (a green-black) onto stone-950 (a
 * brown-black). Both are within 16 on every channel, and both are visibly wrong:
 * at these luminances the eye reads hue long before it reads brightness.
 *
 * So a dark match additionally has to preserve the relationships *between*
 * channels — which is what hue actually is — to within this many units.
 */
const HUE_TOLERANCE = 8;

/**
 * Pure black and pure white are never converted.
 *
 * They are not theme colours; they are the ends of the scale, and code that
 * asks for #000 usually means it — print styles, canvas fills, a genuine black
 * backdrop. Nudging #000000 to the theme's near-black (#09090b) is exactly the
 * sort of unrequested change that erodes trust in a migration like this.
 */
const NEVER_CONVERT = new Set(['#000', '#fff', '#000000', '#ffffff']);

const isDark = (r, g, b) => r < DARK_CEILING && g < DARK_CEILING && b < DARK_CEILING;

/** Channel *relationships* — a rough, cheap stand-in for hue. */
const chromaSignature = (r, g, b) => [r - g, g - b, r - b];

const hueDrift = (a, b) => {
    const sa = chromaSignature(a.r, a.g, a.b);
    const sb = chromaSignature(b.r, b.g, b.b);
    return Math.max(...sa.map((v, i) => Math.abs(v - sb[i])));
};

/* ------------------------------------------------------------------ *
 * Build the hex → token lookup from the active theme
 * ------------------------------------------------------------------ */

const theme = getActiveTheme();

/** [{ r, g, b, palette, shade }] for every stop of every bound palette. */
const LOOKUP = [];
for (const palette of CONTROLLED_PALETTES) {
    const stops = theme.ramps[theme.palettes[palette]];
    for (const shade of SHADES) {
        const { r, g, b } = parseHex(toHex(stops[shade]));
        LOOKUP.push({ r, g, b, palette, shade });
    }
}

/**
 * Preference order when several palettes share a value. Under a theme that
 * collapses families (Daylight Calm binds slate, gray, zinc, stone and neutral
 * to one ramp) many stops are identical, and we want the name the codebase
 * already uses rather than an arbitrary winner.
 */
const PALETTE_PRIORITY = [
    'slate', 'indigo', 'emerald', 'red', 'amber', 'violet', 'purple',
    'blue', 'rose', 'orange', 'teal', 'sky', 'cyan', 'green', 'yellow',
    'pink', 'fuchsia', 'gray', 'zinc', 'stone', 'neutral', 'void',
];
const priorityOf = (p) => {
    const i = PALETTE_PRIORITY.indexOf(p);
    return i === -1 ? 999 : i;
};

const matchCache = new Map();

/** Nearest theme token within TOLERANCE, or null. */
function findToken(hex) {
    const key = hex.toLowerCase();
    if (matchCache.has(key)) return matchCache.get(key);

    if (NEVER_CONVERT.has(key)) {
        matchCache.set(key, null);
        return null;
    }

    let best = null;
    try {
        const { r, g, b } = parseHex(hex);

        for (const entry of LOOKUP) {
            const delta = Math.max(
                Math.abs(entry.r - r),
                Math.abs(entry.g - g),
                Math.abs(entry.b - b),
            );

            const bothDark = isDark(r, g, b) && isDark(entry.r, entry.g, entry.b);

            if (bothDark) {
                if (delta > DARK_TOLERANCE) continue;
                // The wider window buys brightness latitude, not hue latitude.
                if (hueDrift({ r, g, b }, entry) > HUE_TOLERANCE) continue;
            } else if (delta > TOLERANCE) {
                continue;
            }

            if (
                !best ||
                delta < best.delta ||
                (delta === best.delta && priorityOf(entry.palette) < priorityOf(best.palette))
            ) {
                best = { ...entry, delta };
            }
        }
    } catch {
        best = null;
    }

    matchCache.set(key, best);
    return best;
}

/* ------------------------------------------------------------------ *
 * Transforms
 * ------------------------------------------------------------------ */

const stats = {
    arbitraryClasses: 0,
    brokenShades: 0,
    fontSizes: 0,
    inlineHex: 0,
    importsAdded: 0,
};

const unmapped = new Map();   // hex -> count
const touchedFiles = new Set();

const noteUnmapped = (hex) => {
    const k = hex.toLowerCase();
    unmapped.set(k, (unmapped.get(k) || 0) + 1);
};

/**
 * 1. Tailwind arbitrary colour values.
 *
 *    bg-[#05030f]  →  bg-void-900
 *
 * These are the 287 deep-background usages on auth, marketing and platform
 * screens. Pure class renames, so they carry no runtime risk at all.
 */
const UTILITY_PREFIXES =
    'bg|text|border|from|to|via|ring|ring-offset|shadow|fill|stroke|decoration|outline|accent|caret|divide|placeholder';

function transformArbitraryClasses(src) {
    const re = new RegExp(
        `\\b(${UTILITY_PREFIXES})-\\[(#[0-9a-fA-F]{3,8})\\]`,
        'g',
    );

    return src.replace(re, (whole, prefix, hex) => {
        const token = findToken(hex);
        if (!token) {
            noteUnmapped(hex);
            return whole;
        }
        stats.arbitraryClasses += 1;
        return `${prefix}-${token.palette}-${token.shade}`;
    });
}

/**
 * 2. Shades that do not exist.
 *
 *    bg-brand-650  →  bg-brand-600
 *
 * Tailwind has no 650, 205 or 705 stop, so these classes compile to nothing and
 * the elements carrying them are rendering unstyled today. Found during the
 * audit; snapping each to the nearest real stop is a straight bug fix.
 */
const BROKEN_SHADES = {
    650: 600,
    605: 600,
    205: 200,
    705: 700,
};

function transformBrokenShades(src) {
    const families = CONTROLLED_PALETTES.join('|');
    const re = new RegExp(
        `\\b(${UTILITY_PREFIXES})-(${families})-(${Object.keys(BROKEN_SHADES).join('|')})\\b`,
        'g',
    );

    return src.replace(re, (whole, prefix, family, shade) => {
        stats.brokenShades += 1;
        return `${prefix}-${family}-${BROKEN_SHADES[shade]}`;
    });
}

/**
 * 3. Arbitrary font sizes.
 *
 *    text-[10px]  →  text-2xs
 *
 * ~2,700 of these, and the single biggest obstacle to fixing legibility: an
 * arbitrary value is invisible to the theme, so no amount of typography tokens
 * can reach it. Naming them hands control back to the theme file.
 *
 * Only the four micro sizes are mapped, and this is the subtle part: under
 * Midnight Nebula those four tokens deliberately carry no line-height, exactly
 * like the arbitrary values they replace. So the swap is a true no-op.
 *
 * `text-[12px]` is left alone even though `text-xs` is also 12px, because
 * `text-xs` additionally sets line-height: 1rem — the 27 elements using it are
 * currently inheriting their leading, and quietly changing that is the kind of
 * one-pixel reflow nobody traces back. The remaining stragglers (13px, 15px,
 * 20px) have no natural slot either. About 70 in total, left for a human.
 */
const FONT_SIZE_MAP = {
    '8px': '4xs',
    '9px': '3xs',
    '10px': '2xs',
    '11px': '1xs',
};

function transformFontSizes(src) {
    return src.replace(/\btext-\[(\d+px)\]/g, (whole, size) => {
        const token = FONT_SIZE_MAP[size];
        if (!token) return whole;
        stats.fontSizes += 1;
        return `text-${token}`;
    });
}

/**
 * 4. Inline hex in JavaScript.
 *
 *    stroke="#6366f1"        →  stroke={c.indigo[500]}
 *    { color: '#10b981' }    →  { color: c.emerald[500] }
 *
 * Only whole quoted strings are considered — see safety rule 2. SVG attributes
 * cannot take `var()`, which is why these resolve to real values through
 * `theme/runtime.js` rather than to CSS variables.
 */
function transformInlineHex(src, relPath) {
    let usesToken = false;

    // JSX attribute form: prop="#rrggbb" → prop={c.family[shade]}
    let out = src.replace(
        /(\s[a-zA-Z][a-zA-Z0-9]*\s*=\s*)"(#[0-9a-fA-F]{3,8})"/g,
        (whole, lead, hex) => {
            const token = findToken(hex);
            if (!token) {
                noteUnmapped(hex);
                return whole;
            }
            stats.inlineHex += 1;
            usesToken = true;
            return `${lead}{vq.${token.palette}[${token.shade}]}`;
        },
    );

    // Quoted-string form inside expressions: '#rrggbb' → c.family[shade]
    out = out.replace(
        /(['"])(#[0-9a-fA-F]{3,8})\1/g,
        (whole, quote, hex) => {
            const token = findToken(hex);
            if (!token) {
                noteUnmapped(hex);
                return whole;
            }
            stats.inlineHex += 1;
            usesToken = true;
            return `vq.${token.palette}[${token.shade}]`;
        },
    );

    if (usesToken && !/from ['"]@\/theme\/runtime['"]/.test(out)) {
        out = addRuntimeImport(out, relPath);
        stats.importsAdded += 1;
    }

    return out;
}

/** Insert `import { vq } from '@/theme/runtime';` after the final import. */
function addRuntimeImport(src, relPath) {
    const importRe = /^import\s.*?;\s*$/gm;
    let last = null;
    let m;
    while ((m = importRe.exec(src)) !== null) last = m;

    const statement = "import { vq } from '@/theme/runtime';";

    if (!last) {
        console.warn(`    ! ${relPath}: no import block found; prepending.`);
        return `${statement}\n${src}`;
    }

    const at = last.index + last[0].length;
    return `${src.slice(0, at)}\n${statement}${src.slice(at)}`;
}

/* ------------------------------------------------------------------ *
 * Walk
 * ------------------------------------------------------------------ */

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'theme') continue;
            yield* walk(full);
        } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
            yield full;
        }
    }
}

function main() {
    console.log(
        `\n[codemod] Theme: ${theme.name}  |  mode: ${WRITE ? 'WRITE' : 'dry run'}` +
        `${ONLY.length ? `  |  steps: ${ONLY.join(', ')}` : ''}\n`,
    );

    for (const file of walk(SCAN_ROOT)) {
        const relPath = path.relative(SCAN_ROOT, file).replace(/\\/g, '/');
        if (SKIP_FILES.some((skip) => relPath.endsWith(skip))) continue;

        const original = fs.readFileSync(file, 'utf8');
        let src = original;

        if (enabled('classes')) src = transformArbitraryClasses(src);
        if (enabled('shades')) src = transformBrokenShades(src);
        if (enabled('sizes')) src = transformFontSizes(src);
        if (enabled('hex')) src = transformInlineHex(src, relPath);

        if (src !== original) {
            touchedFiles.add(relPath);
            if (WRITE) fs.writeFileSync(file, src, 'utf8');
        }
    }

    /* ---- report ---- */

    console.log('  Conversions');
    console.log(`    arbitrary colour classes  bg-[#hex] → bg-void-900     ${stats.arbitraryClasses}`);
    console.log(`    non-existent shades       bg-brand-650 → -600        ${stats.brokenShades}`);
    console.log(`    arbitrary font sizes      text-[10px] → text-2xs      ${stats.fontSizes}`);
    console.log(`    inline hex                "#6366f1" → vq.indigo[500]   ${stats.inlineHex}`);
    console.log(`    runtime imports added                                 ${stats.importsAdded}`);
    console.log(`\n  Files touched: ${touchedFiles.size}`);

    if (unmapped.size) {
        const sorted = [...unmapped.entries()].sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((n, [, count]) => n + count, 0);

        console.log(
            `\n  Left alone: ${total} value(s) across ${unmapped.size} distinct colours.` +
            `\n  These match no theme token, which usually means they are deliberate —` +
            `\n  third-party brand colours, logo fills, one-off illustration shades.` +
            `\n  Review and either add them to the theme or leave them hardcoded.\n`,
        );
        for (const [hex, count] of sorted.slice(0, 25)) {
            console.log(`    ${hex}  ×${count}`);
        }
        if (sorted.length > 25) console.log(`    … and ${sorted.length - 25} more`);
    }

    if (!WRITE) {
        console.log('\n  Dry run — nothing written. Re-run with --write to apply.\n');
    } else {
        console.log('\n  Applied.\n');
    }
}

main();
