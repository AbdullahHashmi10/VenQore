/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   THE SWITCH                                                              ║
 * ║                                                                           ║
 * ║   This is the one place that decides how the entire product looks.        ║
 * ║   Every colour, font, corner radius and spacing value across all 393       ║
 * ║   screens follows whatever is set here.                                    ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * ── To change the theme ─────────────────────────────────────────────────────
 *
 *   1. Change ACTIVE_THEME below to one of the ids in AVAILABLE_THEMES.
 *   2. Run `npm run build` (or restart `npm run dev`).
 *
 *   That's it. No database, no cache to clear, no per-store setting. The choice
 *   is committed to git, so the look of the product is versioned alongside the
 *   code that renders it and can be reverted like any other change.
 *
 * ── To create a new theme ───────────────────────────────────────────────────
 *
 *   1. Copy `themes/_template.js` to `themes/your-theme.js`.
 *   2. Register it in AVAILABLE_THEMES below.
 *   3. Point ACTIVE_THEME at it.
 *
 *   See ../../../docs/THEMING.md for the full walkthrough.
 */

import midnightNebula from './themes/midnight-nebula.js';
import daylightCalm from './themes/daylight-calm.js';
import minimal from './themes/minimal.js';
import classic from './themes/classic.js';
import colour from './themes/colour.js';

/* ─────────────────────────────────────────────────────────────────────────── *
 *  ▼▼▼  CHANGE THIS LINE TO RESKIN THE ENTIRE APPLICATION  ▼▼▼
 * ─────────────────────────────────────────────────────────────────────────── */

export const ACTIVE_THEME = 'midnight-nebula';

/* ─────────────────────────────────────────────────────────────────────────── *
 *  ▲▲▲                                                                    ▲▲▲
 * ─────────────────────────────────────────────────────────────────────────── */

/**
 * Every theme the build knows about. Adding an entry here does not activate it;
 * it only makes it selectable and includes it in validation, so a broken theme
 * is caught at build time even while it is still being drafted.
 */
export const AVAILABLE_THEMES = {
    'midnight-nebula': midnightNebula,
    'daylight-calm': daylightCalm,
    minimal,
    classic,
    colour,
};

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RUNTIME THEME SELECTION
 * ─────────────────────────────────────────────────────────────────────────── *
 *
 * ACTIVE_THEME above still decides what lands in `:root` — the build-time
 * default, and what a page renders before any JavaScript runs.
 *
 * Everything in SELECTABLE_THEMES is additionally emitted by the generator
 * under `[data-vq-theme="<id>"]`, so a user can switch between them at runtime
 * by changing one attribute on <html>. See Contexts/AppearanceContext.jsx.
 *
 * Why a separate list rather than just using AVAILABLE_THEMES: a theme being
 * registered means "the build validates it". A theme being selectable means "we
 * are willing to support a paying customer running their whole business in it",
 * which is a much higher bar, and a draft theme should be able to sit in the
 * first list for a while before it enters the second.
 */
export const SELECTABLE_THEMES = ['midnight-nebula', 'daylight-calm'];

/**
 * What Appearance settings shows. Kept next to the registry so a new theme
 * cannot be made selectable without someone deciding how to describe it.
 *
 * `swatch` is picked by hand rather than read from the ramps: the preview chip
 * needs the two or three colours that *characterise* the theme, which is a
 * judgement call and not always the 500 stop.
 */
export const THEME_CATALOG = [
    {
        id: 'midnight-nebula',
        name: 'Midnight',
        tagline: 'The VenQore look — dark, premium, technical',
        supportsDark: true,
        swatch: ['#0b1020', '#6366f1', '#a855f7'],
    },
    {
        id: 'daylight-calm',
        name: 'Daylight',
        tagline: 'The same interface in light colours',
        supportsDark: true,
        swatch: ['#f4f2ef', '#4a6fa5', '#9c7b6a'],
    },
];

/**
 * The theme a user lands on before they have ever chosen one.
 * Must match ACTIVE_THEME above and Appearance::defaults() in PHP.
 */
export const DEFAULT_THEME_ID = 'midnight-nebula';

/**
 * Which mode the app opens in when a user has no saved preference.
 *
 *   'dark' | 'light' — force it
 *   'theme'          — defer to the active theme's own `defaultMode`
 *   'system'         — follow the operating system setting
 *
 * A store-level setting (`dark_mode_default`) still overrides this at runtime;
 * see Contexts/ThemeContext.jsx.
 */
export const DEFAULT_MODE = 'theme';

/**
 * Resolve the active theme object, failing loudly rather than silently falling
 * back — a typo here would otherwise ship an unthemed build where roughly
 * 40,000 colour classes resolve to nothing.
 */
export function getActiveTheme() {
    const theme = AVAILABLE_THEMES[ACTIVE_THEME];

    if (!theme) {
        throw new Error(
            `[theme] ACTIVE_THEME is set to "${ACTIVE_THEME}", which is not registered ` +
            `in AVAILABLE_THEMES. Known themes: ${Object.keys(AVAILABLE_THEMES).join(', ')}.`,
        );
    }

    return theme;
}
