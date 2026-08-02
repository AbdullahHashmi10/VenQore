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
};

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
