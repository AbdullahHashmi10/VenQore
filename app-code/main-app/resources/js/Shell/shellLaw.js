/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Layout Law v2.0 — the shell engine                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The executable half of VENQORE_LAYOUT_LAW.md §shell, ported from the
 * reference implementation in `extras/Layout Law/venqore-shell.html`. Geometry
 * comes from `resources/layout-law.json` via `Dashboard/layoutLaw.js` — the
 * same file `app/Reckoner/LayoutLaw.php` reads. Neither side restates a number.
 *
 * The law, in three sentences:
 *
 *   ≥ 1216px the nav PUSHES — the grid recomputes, nothing is hidden, no
 *   scrim. Below 1216px the nav OVERLAYS — zero width taken, a scrim and Esc
 *   close it. The hamburger is ALWAYS present, because the one thing worse
 *   than a nav that takes space is a nav you cannot get back.
 *
 * Why 1216: 1216 = 264 (sidebar) + 48 (two 24px margins) + 904 (the narrowest
 * desktop content). Found by sweeping every integer width from 320 to 3440,
 * not by picking a breakpoint.
 */

import { SHELL } from '../Dashboard/layoutLaw';

export { SHELL };

/** Linear ramp between two stops — the law's only interpolation. */
export const ramp = (v, lo, hi, from, to) =>
    v <= lo ? from : v >= hi ? to : from + ((v - lo) * (to - from)) / (hi - lo);

/** Content margin: 16px on a phone, 24px from 648px up. */
export const marginAt = (vw) => ramp(vw, 600, 648, SHELL.contentMarginMin, SHELL.contentMarginMax);

/**
 * Rail width ramps in from 0 to 72 between 1024 and 1096, so chrome never
 * costs the content a full step at the boundary (d(chrome)/d(vw) ≤ 1).
 */
export const railAt = (vw) => ramp(vw, 1024, 1096, 0, SHELL.navRail);

/**
 * Resting nav state per archetype. The dashboard is a navigation surface —
 * you navigate FROM a dashboard — so it holds the rail from 1024 and expands
 * at 1280. (Terminal/document/console archetypes hold the rail longer; they
 * arrive with their own surfaces.)
 *
 * Note the interaction with `navBehaviour`: between 1024 and 1216 the resting
 * state is a rail, but the shell is still in OVERLAY territory, so that rail
 * takes no width — it rests as a drawer the hamburger opens. The rail becomes
 * a visible column at 1216, where pushing starts. Both facts are the law: the
 * schedule says what the nav *is*, the threshold says whether it *takes room*.
 */
const NAV_SCHEDULE = {
    dashboard: { rail: 1024, expanded: 1280 },
    index: { rail: 1024, expanded: 1280 },
    document: { rail: 1024, expanded: 1708 },
    terminal: { rail: 1024, expanded: null },
    console: { rail: 1024, expanded: 1440 },
    focus: { rail: null, expanded: null },
};

export function navDefault(vw, arch = 'dashboard') {
    const s = NAV_SCHEDULE[arch] || NAV_SCHEDULE.dashboard;
    if (s.rail == null) return 'hidden'; // focus — no nav at all
    if (s.expanded && vw >= s.expanded) return 'expanded';
    return vw >= s.rail ? 'rail' : 'hidden';
}

export const navBehaviour = (vw) => (vw >= SHELL.pushThreshold ? 'push' : 'overlay');

/** Drawer width: min(264, vw − 56) — a 56px peek strip of page stays tappable. */
export const drawerWidth = (vw) => Math.min(SHELL.navExpanded, vw - 56);

/**
 * Resolve the whole shell state for one viewport width + user preference.
 *
 * `prefs.intent` is the hamburger's sticky preference ('expanded' | 'rail' |
 * null): on a push-capable screen it survives resizes — expand at 1920,
 * shrink past 1216 and the nav demotes to a rail on its own; grow back and
 * the choice returns. `prefs.open` is the transient drawer flag, and the
 * stale-open guard discards it the moment the screen becomes push-capable —
 * a drawer `open` persisting into push territory was a documented bug (a
 * 1920px dashboard showing a rail because the drawer was opened at 1024).
 */
export function shellState(vw, arch = 'dashboard', prefs = {}) {
    const def = navDefault(vw, arch);
    const beh = navBehaviour(vw);

    let nav = def;
    // A preference can move the nav between rail and expanded, but it can
    // never conjure a nav onto a surface whose archetype has none (focus).
    if (def !== 'hidden' || beh === 'overlay') {
        if (prefs.intent === 'expanded' && beh === 'push' && NAV_SCHEDULE[arch]?.rail != null) nav = 'expanded';
        if (prefs.intent === 'rail' && def === 'expanded') nav = 'rail';
    }

    const open = Boolean(prefs.open) && beh === 'overlay'; // stale-open guard

    return {
        nav,                      // 'expanded' | 'rail' | 'hidden' (resting state)
        behaviour: beh,           // 'push' | 'overlay'
        hamburger: true,          // always. every width, every archetype.
        overlayOpen: open,
        overlayWidth: beh === 'overlay' ? drawerWidth(vw) : null,
        scrim: open,
        navPx: beh === 'push'
            ? (nav === 'expanded' ? SHELL.navExpanded : nav === 'rail' ? railAt(vw) : 0)
            : 0,
        margin: marginAt(vw),
    };
}
