/**
 * VenQore Theme Engine — visual parity check.
 *
 *     npm run theme:verify
 *
 * Answers one question: does routing ~40,000 existing colour classes through the
 * theme engine change how any of them render?
 *
 * For the baseline theme (Midnight Nebula) the answer must be no. Every
 * `bg-brand-600` in the codebase has to resolve to exactly the value Tailwind
 * would have produced on its own, or the migration was not the no-op it claims
 * to be. This script compares all 23 bound palettes × 11 stops against
 * Tailwind's own colour table and fails on any mismatch.
 *
 * It also checks that the four micro font sizes still equal the arbitrary pixel
 * values they replaced, since `text-[10px]` → `text-2xs` touched ~2,700 elements.
 *
 * Run it against any theme to see a summary of what that theme changes — under
 * a non-baseline theme the differences are the point, so they are reported
 * rather than treated as failures.
 */

import { createRequire } from 'node:module';

import { getActiveTheme } from '../active.js';
import { toHex } from '../color.js';
import { CONTROLLED_PALETTES, SHADES } from '../contract.js';

const require = createRequire(import.meta.url);
const tailwindColors = require('tailwindcss/colors');

/** The theme that must be byte-identical to stock Tailwind. */
const BASELINE_THEME_ID = 'midnight-nebula';

/**
 * Families exempt from the stock-Tailwind comparison.
 *
 *   void    — not a Tailwind family at all. Introduced by this engine for the
 *             deep backgrounds that used to be arbitrary values.
 *
 *   neutral — the one name that is both a Tailwind family and a role in this
 *             system. The role deliberately wins, so `bg-neutral-500` yields the
 *             theme's chrome colour rather than Tailwind's #737373. Nothing in
 *             the codebase uses `neutral-*`, so no rendered pixel depends on it.
 */
const VENQORE_ONLY = ['void', 'neutral'];

/**
 * What the arbitrary font sizes rendered as before the codemod named them.
 * `text-[10px]` set font-size and nothing else; the replacement must match.
 */
const FONT_SIZE_BASELINE = {
    '4xs': '0.5rem',      //  8px
    '3xs': '0.5625rem',   //  9px
    '2xs': '0.625rem',    // 10px
    '1xs': '0.6875rem',   // 11px
};

const theme = getActiveTheme();
const isBaseline = theme.id === BASELINE_THEME_ID;

const failures = [];
const differences = [];

/* ------------------------------------------------------------------ *
 * 1. Palette parity
 * ------------------------------------------------------------------ */

let compared = 0;

for (const palette of CONTROLLED_PALETTES) {
    if (VENQORE_ONLY.includes(palette)) continue;

    const stock = tailwindColors[palette];
    if (!stock) {
        failures.push(`Tailwind has no palette "${palette}" to compare against.`);
        continue;
    }

    const bound = theme.ramps[theme.palettes[palette]];

    for (const shade of SHADES) {
        compared += 1;
        const expected = String(stock[shade]).toLowerCase();
        const actual = toHex(bound[shade]).toLowerCase();

        if (expected === actual) continue;

        const message = `${palette}-${shade}: ${actual} (Tailwind ships ${expected})`;
        if (isBaseline) failures.push(message);
        else differences.push(message);
    }
}

/* ------------------------------------------------------------------ *
 * 2. Font size parity
 * ------------------------------------------------------------------ */

for (const [key, expected] of Object.entries(FONT_SIZE_BASELINE)) {
    const value = theme.typography.sizes[key];
    const size = Array.isArray(value) ? value[0] : value;
    const hasLineHeight = Array.isArray(value);

    if (size !== expected) {
        const message = `text-${key}: ${size} (replaced an arbitrary ${expected})`;
        if (isBaseline) failures.push(message);
        else differences.push(message);
    }

    // The arbitrary values set no line-height. A baseline theme must not add one,
    // or ~2,700 elements silently reflow.
    if (isBaseline && hasLineHeight) {
        failures.push(
            `text-${key} defines a line-height. The arbitrary value it replaced ` +
            `set font-size only, so adding leading here reflows every element using it.`,
        );
    }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log(`\n[parity] Theme: ${theme.name} (${theme.id})`);
console.log(`[parity] Compared ${compared} palette stops + ${Object.keys(FONT_SIZE_BASELINE).length} micro font sizes.\n`);

if (isBaseline) {
    if (failures.length) {
        console.error(`✗ ${failures.length} mismatch(es) against stock Tailwind:\n`);
        for (const f of failures) console.error(`    • ${f}`);
        console.error(
            `\n  "${theme.name}" is the baseline capture: it must render identically to\n` +
            `  the pre-migration codebase. Any difference here means switching the theme\n` +
            `  engine on is a visible change rather than the no-op it is meant to be.\n`,
        );
        process.exit(1);
    }

    console.log('✓ Every bound palette stop matches Tailwind exactly.');
    console.log('✓ Micro font sizes match the arbitrary values they replaced, with no added leading.');
    console.log('\n  Routing the codebase through the theme engine is a visual no-op.\n');
} else {
    console.log(
        `This theme deliberately differs from stock Tailwind — that is what a theme is for.\n` +
        `${differences.length} value(s) changed. A sample:\n`,
    );
    for (const d of differences.slice(0, 15)) console.log(`    • ${d}`);
    if (differences.length > 15) console.log(`    … and ${differences.length - 15} more`);
    console.log(
        `\n  To confirm the engine itself is sound, switch ACTIVE_THEME back to\n` +
        `  "${BASELINE_THEME_ID}" and re-run: that must report a clean no-op.\n`,
    );
}
