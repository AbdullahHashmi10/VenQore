/**
 * ============================================================
 * New Experience — theme engine and appearance verification
 * ============================================================
 *
 * The theme engine is unusual in this codebase in that a bug in it is invisible
 * to every other test. It produces CSS custom properties; if one of them is
 * malformed, no JavaScript throws, no request fails and no assertion about a
 * total is wrong — the product simply renders incorrectly, and only a human
 * looking at a screen notices.
 *
 * That is not hypothetical. The spacing scale's `1.5` step compiled to
 * `--vq-space-1.5`, which is not a legal custom property name. Browsers dropped
 * the declaration and every `var()` that read it, so `py-1.5 px-3` — the most
 * common small-button padding pair in the codebase — rendered with no vertical
 * padding at all, across 2,772 class usages. Nothing caught it but a person
 * saying "the buttons look shrunk".
 *
 * So this suite asserts the things a human would otherwise have to check:
 * that every emitted variable name is valid, that every selectable theme
 * satisfies the contract, and that the generated stylesheet's cascade order is
 * the one runtime theme switching depends on.
 *
 * @group new-experience
 * @group theme
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
    ACTIVE_THEME,
    AVAILABLE_THEMES,
    DEFAULT_THEME_ID,
    SELECTABLE_THEMES,
    THEME_CATALOG,
    getActiveTheme,
} from '../theme/active.js';
import {
    CONTROLLED_PALETTES,
    DENSITY_TOKENS,
    REQUIRED_ROLES,
    SEMANTIC_TOKENS,
    SHAPE_TOKENS,
    TYPOGRAPHY_TOKENS,
    cssVar,
    paletteColorRef,
    validateTheme,
} from '../theme/contract.js';
import { shadowedV6Colours, v6ReservedPaletteFamilies } from '../theme/build/v6-owned.js';
import {
    DEFAULT_APPEARANCE,
    appearanceFromPage,
    buildOverrides,
    resolveDarkMode,
} from '../theme/appearance.js';

const GENERATED_CSS = path.resolve(__dirname, '../../css/theme.generated.css');
const css = fs.readFileSync(GENERATED_CSS, 'utf8');

/**
 * A custom property name must be a dashed-ident: two hyphens, then ident
 * characters only. No dots, no spaces, no brackets.
 */
const VALID_CUSTOM_PROPERTY = /^--[a-zA-Z_][a-zA-Z0-9_-]*$/;

/* ------------------------------------------------------------------ *
 * Variable naming — the regression that started this file
 * ------------------------------------------------------------------ */

describe('CSS custom property naming', () => {
    it('produces a legal ident for fractional spacing steps', () => {
        // The original bug, pinned. `--vq-space-1.5` is not a custom property.
        expect(cssVar.space('1.5')).toBe('--vq-space-1_5');
        expect(cssVar.space('0.5')).toBe('--vq-space-0_5');

        expect(cssVar.space('1.5')).toMatch(VALID_CUSTOM_PROPERTY);
        expect(cssVar.space('0.5')).toMatch(VALID_CUSTOM_PROPERTY);
    });

    it('names every token in the contract legally', () => {
        const names = [
            ...DENSITY_TOKENS.space.map(cssVar.space),
            ...DENSITY_TOKENS.control.map(cssVar.control),
            ...DENSITY_TOKENS.layout.map(cssVar.layout),
            ...TYPOGRAPHY_TOKENS.families.map(cssVar.font),
            ...TYPOGRAPHY_TOKENS.sizes.map(cssVar.size),
            ...TYPOGRAPHY_TOKENS.weights.map(cssVar.weight),
            ...TYPOGRAPHY_TOKENS.leading.map(cssVar.leading),
            ...TYPOGRAPHY_TOKENS.tracking.map(cssVar.tracking),
            ...SHAPE_TOKENS.radius.map(cssVar.radius),
            ...SHAPE_TOKENS.shadow.map(cssVar.shadow),
            ...SEMANTIC_TOKENS.map(cssVar.semantic),
        ];

        const invalid = names.filter((name) => !VALID_CUSTOM_PROPERTY.test(name));

        expect(invalid).toEqual([]);
    });

    it('emits no malformed declaration into the generated stylesheet', () => {
        const declared = [...css.matchAll(/^\s+(--[^:\s]+)\s*:/gm)].map((match) => match[1]);

        expect(declared.length).toBeGreaterThan(1000);

        const invalid = [...new Set(declared.filter((name) => !VALID_CUSTOM_PROPERTY.test(name)))];

        expect(invalid).toEqual([]);
    });

    it('references no malformed variable from the generated stylesheet', () => {
        const referenced = [...css.matchAll(/var\((--[^,)\s]+)/g)].map((match) => match[1]);

        const invalid = [...new Set(referenced.filter((name) => !VALID_CUSTOM_PROPERTY.test(name)))];

        expect(invalid).toEqual([]);
    });

    /**
     * The same failure mode as the `--vq-space-1.5` bug above, arrived at from
     * the other direction — and it shipped.
     *
     * This sheet holds bare channel triplets so Tailwind's `/30` opacity
     * modifiers work. The V6 token layer holds resolved colours under some of
     * the same names, and app.css imports this sheet LAST, so on any shared
     * name the triplet won. `background: var(--vq-accent-fill)` then resolved
     * to `8 137 117`, which is invalid at computed-value time, so the browser
     * dropped the declaration whole. Thirteen semantic tokens — every accent,
     * every focus ring, the slot-1 chart mark — painted nothing in both modes,
     * across the entire product, with no error anywhere.
     *
     * The generator now moves those families to `--vq-tw-*` on its own. This
     * asserts it stayed moved.
     */
    it('shadows no V6 colour token with a channel triplet', () => {
        expect(shadowedV6Colours(css)).toEqual([]);
    });

    /**
     * And that the move did not simply delete them: `bg-teal-600` and its ~180
     * siblings still have to resolve to something.
     */
    it('still binds every reserved palette family under --vq-tw-*', () => {
        const reserved = v6ReservedPaletteFamilies([...CONTROLLED_PALETTES, ...REQUIRED_ROLES]);

        expect(reserved.size).toBeGreaterThan(0);

        for (const family of reserved) {
            expect(css).toContain(`--vq-tw-${family}-500:`);
            expect(paletteColorRef(family, 500, reserved)).toBe(
                `rgb(var(--vq-tw-${family}-500) / <alpha-value>)`,
            );
        }
    });
});

/* ------------------------------------------------------------------ *
 * The theme library
 * ------------------------------------------------------------------ */

describe('theme library', () => {
    // Two, and the order matters: Midnight is the product's look and the
    // default every user gets, so it is listed and rendered first. Minimal,
    // Classic and Colour remain registered in AVAILABLE_THEMES — the build
    // still validates them — but are not offered, because they were never
    // verified across all screens.
    it('offers Midnight and Daylight, with Midnight first', () => {
        expect(SELECTABLE_THEMES).toEqual([
            'midnight-nebula',
            'daylight-calm',
        ]);
    });

    it('defaults to the same theme the build paints into :root', () => {
        // These drifting apart is what drained the colour out of the product:
        // the build painted Midnight, the PHP default asked for Minimal, and
        // every authenticated page got Minimal.
        expect(DEFAULT_THEME_ID).toBe(ACTIVE_THEME);
        expect(SELECTABLE_THEMES).toContain(DEFAULT_THEME_ID);
    });

    it('satisfies the contract for every registered theme', () => {
        for (const [id, theme] of Object.entries(AVAILABLE_THEMES)) {
            expect(validateTheme(theme), `theme "${id}" failed validation`).toEqual([]);
        }
    });

    it('describes every selectable theme in the catalogue', () => {
        // A theme that is selectable but undescribed reaches Appearance settings
        // as a blank row, which is how a half-finished theme ships.
        const described = THEME_CATALOG.map((entry) => entry.id);

        expect(described.sort()).toEqual([...SELECTABLE_THEMES].sort());

        for (const entry of THEME_CATALOG) {
            expect(entry.name).toBeTruthy();
            expect(entry.tagline).toBeTruthy();
            expect(entry.swatch.length).toBeGreaterThanOrEqual(2);
        }
    });

    it('keeps the build-time default registered', () => {
        expect(getActiveTheme()).toBeTruthy();
    });
});

/* ------------------------------------------------------------------ *
 * Generated stylesheet structure
 * ------------------------------------------------------------------ */

describe('generated stylesheet', () => {
    it('emits a scoped block for every selectable theme', () => {
        for (const id of SELECTABLE_THEMES) {
            expect(css).toContain(`[data-vq-theme="${id}"] {`);
            expect(css).toContain(`[data-vq-theme="${id}"].dark {`);
        }
    });

    it('emits density, radius and font variants', () => {
        for (const id of SELECTABLE_THEMES) {
            for (const level of ['compact', 'comfortable', 'spacious']) {
                expect(css).toContain(`[data-vq-theme="${id}"][data-vq-density="${level}"] {`);
            }
            for (const level of ['sharp', 'default', 'round']) {
                expect(css).toContain(`[data-vq-theme="${id}"][data-vq-radius="${level}"] {`);
            }
        }

        for (const font of ['inter', 'figtree', 'system', 'grotesk', 'serif', 'mono']) {
            expect(css).toContain(`[data-vq-font="${font}"] {`);
        }
    });

    /**
     * The ordering constraint that makes runtime switching work.
     *
     * `.dark` and `[data-vq-theme="x"]` have equal specificity, so the later of
     * the two wins. A theme's light-mode semantics must therefore be emitted
     * BEFORE `.dark`, and its dark-mode semantics — which carry the higher
     * specificity of an attribute plus a class — after it. Get this backwards and
     * choosing a theme in dark mode paints white cards on a black page.
     */
    it('orders theme blocks so dark mode survives a theme switch', () => {
        // Driven off SELECTABLE_THEMES rather than a hardcoded id: this rule has
        // to hold for every theme on offer, and naming one meant the test kept
        // passing for a theme that had been withdrawn while saying nothing about
        // the ones that had not.
        const globalDark = css.indexOf('\n.dark {');
        expect(globalDark).toBeGreaterThan(-1);

        for (const id of SELECTABLE_THEMES) {
            const themeBlock = css.indexOf(`[data-vq-theme="${id}"] {`);
            const themeDark = css.indexOf(`[data-vq-theme="${id}"].dark {`);

            expect(themeBlock, `light block missing for "${id}"`).toBeGreaterThan(-1);
            expect(globalDark, `"${id}" light block must precede .dark`).toBeGreaterThan(themeBlock);
            expect(themeDark, `"${id}" dark block must follow .dark`).toBeGreaterThan(globalDark);
        }
    });

    it('stores colours as channel triplets so opacity modifiers keep working', () => {
        // `bg-brand-500/30` compiles to `rgb(var(--vq-brand-500) / 0.3)`. A hex
        // value in the variable would break every `/opacity` class in the app.
        const match = css.match(/--vq-ramp-brand-500:\s*([^;]+);/);

        expect(match).toBeTruthy();
        expect(match[1].trim()).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    });
});

/* ------------------------------------------------------------------ *
 * Appearance runtime
 * ------------------------------------------------------------------ */

describe('appearance runtime', () => {
    it('resolves explicit modes without consulting the system', () => {
        expect(resolveDarkMode('dark')).toBe(true);
        expect(resolveDarkMode('light')).toBe(false);
    });

    it('expands a custom primary colour into a full ramp', () => {
        const overrides = buildOverrides({ primary: '#3366ff' });

        // All eleven stops, or hover and active states come from the old palette.
        for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
            expect(overrides[`--vq-ramp-brand-${shade}`]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
        }

        // The focus ring follows the brand: a keyboard user in a green-branded
        // store must not get an indigo ring.
        expect(overrides['--vq-focus-ring']).toBe(overrides['--vq-ramp-brand-500']);
    });

    it('writes no overrides when no custom colour is set', () => {
        expect(buildOverrides({})).toEqual({});
        expect(buildOverrides({ primary: null, accent: null })).toEqual({});
    });

    it('keeps brand and accent independent', () => {
        const overrides = buildOverrides({ primary: '#3366ff', accent: '#ff6633' });

        expect(overrides['--vq-ramp-brand-500']).not.toBe(overrides['--vq-ramp-accent-500']);
    });

    it('falls back to defaults for a page with no appearance prop', () => {
        expect(appearanceFromPage(undefined)).toEqual(DEFAULT_APPEARANCE);
        expect(appearanceFromPage({})).toEqual(DEFAULT_APPEARANCE);
    });

    it('lets a page override only the keys it supplies', () => {
        const resolved = appearanceFromPage({ appearance: { theme: 'classic', mode: 'dark' } });

        expect(resolved.theme).toBe('classic');
        expect(resolved.mode).toBe('dark');
        expect(resolved.density).toBe(DEFAULT_APPEARANCE.density);
    });

    it('defaults new users to the Classic experience', () => {
        // Nobody is moved into a new interface by a deploy. They opt in.
        expect(DEFAULT_APPEARANCE.experience).toBe('classic');
    });
});
