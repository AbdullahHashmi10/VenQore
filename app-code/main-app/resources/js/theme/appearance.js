/**
 * Applying a user's appearance choice to the live document.
 *
 * ── Division of labour ──────────────────────────────────────────────────────
 *
 * Almost none of the work happens here. Theme, density, corner radius and
 * typeface are all attribute switches — the generated stylesheet already
 * contains every combination, scoped by `[data-vq-theme]`, `[data-vq-density]`,
 * `[data-vq-radius]` and `[data-vq-font]`, and Blade has already written the
 * right ones onto <html> before the page painted. This module only has to keep
 * them in step when the user changes something without a page load.
 *
 * The exception is the two custom colours. A user-chosen primary is not one
 * colour, it is an eleven-stop ramp — the codebase writes `bg-indigo-600`,
 * `text-indigo-400` and `ring-indigo-500/30`, and all of them have to move
 * together or the result is a button whose hover state is from a different
 * palette. Generating that ramp needs the perceptual curve in `color.js`, which
 * is why it happens in JavaScript and is written as inline custom properties on
 * <html> — the one place with higher precedence than every stylesheet rule.
 *
 * ── Why the inline style is rebuilt rather than patched ────────────────────
 *
 * `applyAppearance` composes the complete override set and assigns it in one go,
 * clearing what it no longer needs. Incrementally adding properties would leave
 * a stale `--vq-ramp-brand-600` behind the first time a user cleared their
 * custom colour, and they would have no way to get rid of it short of a hard
 * refresh.
 */

import { ramp } from './color.js';
import { cssVar, SHADES } from './contract.js';

export const DEFAULT_APPEARANCE = {
    theme: 'minimal',
    mode: 'system',
    primary: null,
    accent: null,
    font: 'theme',
    density: 'comfortable',
    radius: 'default',
    experience: 'classic',
};

/* ------------------------------------------------------------------ *
 * Mode
 * ------------------------------------------------------------------ */

const prefersDark = () =>
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Turn the stored mode ('light' | 'dark' | 'system') into a boolean. */
export function resolveDarkMode(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return prefersDark();
}

/* ------------------------------------------------------------------ *
 * Custom colour ramps
 * ------------------------------------------------------------------ */

/**
 * Expand one hex colour into the ramp variables the theme engine reads.
 *
 * Writing `--vq-ramp-<role>-<shade>` rather than `--vq-indigo-<shade>` is
 * deliberate: the palette bindings already point every pigment name at its role
 * ramp, so overriding the ramp reaches `bg-indigo-600`, `bg-brand-600`,
 * `bg-violet-500` and everything else bound to it in one move. Overriding the
 * pigment names instead would mean writing 250 properties and still missing the
 * role vocabulary.
 */
function rampOverrides(role, hex) {
    if (!hex) return {};

    const stops = ramp(hex);
    const out = {};

    for (const shade of SHADES) {
        // `ramp()` already returns the canonical `"R G B"` triplet form. That
        // format is not incidental: the variables hold bare channels precisely
        // so Tailwind's `/30` opacity modifiers keep working, and a hex value
        // here would break every one of them.
        out[cssVar.ramp(role, shade)] = stops[shade];
    }

    return out;
}

/**
 * Build every inline override for an appearance.
 *
 * The focus ring follows the primary colour. It is the one semantic token that
 * must track a custom brand rather than the theme's own — a keyboard user
 * tabbing through a store that has set its colour to green should not get an
 * indigo ring, and accessibility is exactly where an inconsistency is least
 * acceptable.
 */
export function buildOverrides(appearance = {}) {
    const overrides = {
        ...rampOverrides('brand', appearance.primary),
        ...rampOverrides('accent', appearance.accent),
    };

    if (appearance.primary) {
        overrides[cssVar.semantic('focus-ring')] = ramp(appearance.primary)[500];
    }

    return overrides;
}

/* ------------------------------------------------------------------ *
 * Application
 * ------------------------------------------------------------------ */

/**
 * Put an appearance into force on the document.
 *
 * Safe to call before React mounts — and it should be, so the first render sees
 * the final values. Returns silently outside a browser so the SSR build (used
 * for the marketing pages) can import this module without guarding every call.
 */
export function applyAppearance(appearance = {}) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const settings = { ...DEFAULT_APPEARANCE, ...appearance };

    root.setAttribute('data-vq-theme', settings.theme);
    root.setAttribute('data-vq-density', settings.density);
    root.setAttribute('data-vq-radius', settings.radius);

    if (settings.font && settings.font !== 'theme') {
        root.setAttribute('data-vq-font', settings.font);
    } else {
        root.removeAttribute('data-vq-font');
    }

    root.classList.toggle('dark', resolveDarkMode(settings.mode));

    // Rebuilt wholesale — see the header for why patching leaks stale ramps.
    const overrides = buildOverrides(settings);

    for (const property of Array.from(root.style)) {
        if (property.startsWith('--vq-') && !(property in overrides)) {
            root.style.removeProperty(property);
        }
    }

    for (const [property, value] of Object.entries(overrides)) {
        root.style.setProperty(property, value);
    }
}

/**
 * Read the appearance Inertia shared with the page.
 *
 * Falls back to the defaults rather than throwing, because this runs on public
 * pages where there is no user and therefore no preference.
 */
export function appearanceFromPage(pageProps) {
    return { ...DEFAULT_APPEARANCE, ...(pageProps?.appearance || {}) };
}
