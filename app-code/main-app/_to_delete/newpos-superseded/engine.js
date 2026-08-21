/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  VenQore Layout Engine v2.0 — the terminal slice, ported to a module      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Ported verbatim from `extras/Layout Law/venqore-layout-engine.js`. The only
 * change is the removal of the dashboard-card and document solvers, which the
 * register does not use, and of every DOM touch — this file is pure, so the
 * React page can call it during render and so it can be unit-tested.
 *
 * The contract is unchanged and is the whole point: components declare WHAT
 * they are, the engine decides what they BECOME at the current size. Nothing
 * in NewPos.jsx picks a breakpoint, and nothing there decides what fits.
 *
 *   geometry(vw, {arch})            viewport   -> grid
 *   shell(vw, arch, prefs)          viewport   -> nav state
 *   composeTerminal(comp, vw, vh)   composition-> a composed terminal
 *   presetComposition(id)           preset id  -> a fresh composition
 *   formatToFit(value, px, fontPx)  number     -> the richest form that fits
 *
 * ONE LAW, BOTH AXES:  size(n) = n·UNIT + (n−1)·GUTTER
 */

import { LAW } from './law';

const C = LAW.constants;
const G = C.gutter;
const ROW = C.row;
const TARGET = C.col_target;
const SIDEBAR = C.sidebar_expanded;
const RAIL = C.sidebar_rail;
const SUBNAV = C.subnav_w;
const M_DESK = C.margin_desktop;
const M_MOB = C.margin_mobile;

export { LAW, G as GUTTER, ROW };

/* ---------- MEASUREMENT ----------------------------------------------------
   Advance widths read out of the Space Grotesk binary: a tabular digit at 600
   weight is 0.620em, a comma 0.284em, a period 0.287em. Every pixel floor in
   this file traces back to those three numbers, which is why the fonts are
   vendored rather than fetched — a terminal that falls back to system-ui gets
   proportional figures and every currency column stops aligning, silently. */
const FM = LAW.fontMetrics;

export function measureNumber(str, px) {
    let em = 0;
    for (const ch of String(str)) {
        em += /\d/.test(ch) ? FM.digit_em
            : ch === ',' ? FM.comma_em
            : ch === '.' ? FM.period_em
            : ch === ' ' ? 0.255
            : 0.63;
    }
    return em * px;
}

/* ---------- THE ONE LAW, BOTH AXES ---------------------------------------- */
export const span = (n, unit, gap = G) => n * unit + (n - 1) * gap;
export const rowHeight = (rows) => span(rows, ROW);

/* ---------- RAMPS ----------------------------------------------------------
   A step of PUSHING chrome can never be free: by the time the viewport has
   grown by the chrome's width, the no-chrome baseline has grown by the same
   amount, so the deficit is permanent. Chrome that must not cost content
   therefore RAMPS — its width is a clamp over a band at least as long as
   itself, which keeps d(chrome)/d(vw) ≤ 1 and stops content ever stepping
   down. Two clamps, no media queries, no jolt. */
const ramp = (v, lo, hi, from, to) =>
    (v <= lo ? from : v >= hi ? to : from + ((v - lo) * (to - from)) / (hi - lo));

export const marginAt = (vw) => ramp(vw, LAW.marginRamp[0], LAW.marginRamp[1], M_MOB, M_DESK);
export const railAt = (vw) => ramp(vw, LAW.railRamp[0], LAW.railRamp[1], 0, RAIL);

/* ---------- 1. NAV ---------------------------------------------------------
   The hamburger exists at EVERY width. What it does depends on whether
   pushing is affordable here.

     vw >= push_min (1216)   PUSH     the grid recomputes, nothing is hidden
     vw <  push_min          OVERLAY  the grid is untouched, a scrim appears

   1216 is not chosen. It is SIDEBAR + 2·margin + 904, where 904 is the content
   width at the 1024 rail. Expanding may cost you cards per row; it may never
   cost you the grid. */
export function navDefault(vw, arch = 'terminal') {
    const s = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
    if (s.rail == null) return 'hidden';
    if (s.expanded && vw >= s.expanded) return 'expanded';
    return vw >= s.rail ? 'rail' : 'hidden';
}

export const navBehaviour = (vw) => (vw >= LAW.nav.push_min ? 'push' : 'overlay');
const drawerWidth = (vw) => Math.min(SIDEBAR, vw - LAW.nav.drawer_peek);
const contentFloor = (arch = 'terminal') => LAW.contentFloors[arch] ?? LAW.contentFloors.dashboard;

export function navTravel(vw, arch = 'terminal') {
    const m = marginAt(vw);
    const push = navBehaviour(vw) === 'push';
    const min = push ? railAt(vw) : 0;
    let max = push
        ? vw - 2 * m - contentFloor(arch)
        : LAW.nav.push_min - 2 * M_DESK - contentFloor(arch);
    max = Math.max(min, Math.min(max, vw - LAW.nav.drawer_peek));
    return { min, max, behaviour: push ? 'push' : 'overlay' };
}

/**
 * The complete shell state for a viewport, an archetype and the user's saved
 * preference. `intent` is what they last chose on a screen wide enough to
 * honour it, so shrinking the window demotes the nav and growing it back
 * restores their choice rather than forgetting it.
 */
export function shell(vw, arch = 'terminal', prefs = {}) {
    const def = navDefault(vw, arch);
    const beh = navBehaviour(vw);
    const sch = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
    let state = def;
    if (prefs.intent === 'expanded' && beh === 'push') state = 'expanded';
    if (prefs.intent === 'rail' && def === 'expanded') state = 'rail';
    // LOCAL EXTENSION to the ported engine. The register is the one archetype
    // where an operator may put the nav away entirely — a counter terminal is
    // often a single-purpose screen and 72px is a whole extra tile column. The
    // hamburger still exists at every width, so nothing becomes unreachable,
    // which is the only reason this is legal.
    if (prefs.intent === 'hidden') state = 'hidden';
    // `open` means "the drawer is showing", and a drawer only exists where the
    // nav overlays. On a push-capable screen there is no drawer, so a stale
    // `open` left over from a narrower width must not silently invert the nav.
    const open = !!prefs.open && beh === 'overlay';
    const subnav = arch === 'console' && sch.subnav_col != null && vw >= sch.subnav_col;
    return {
        vw,
        arch,
        nav: state,
        behaviour: beh,
        hamburger: true,
        overlayOpen: open && beh === 'overlay',
        overlayWidth: beh === 'overlay' ? drawerWidth(vw) : null,
        scrim: open && beh === 'overlay',
        subnav,
        subnavAs: subnav ? 'column' : 'tabstrip',
        navPx: state === 'expanded' ? SIDEBAR : state === 'rail' ? railAt(vw) : 0,
        canPush: beh === 'push',
    };
}

/* ---------- 2. GEOMETRY: viewport -> grid --------------------------------- */
export function geometry(vw, opts = {}) {
    const arch = opts.arch || 'dashboard';
    const sh = shell(vw, arch, opts.prefs || (opts.navOpen ? { open: true } : {}));
    // A user-dragged nav width overrides the state's nominal width — but only
    // where the nav actually pushes, and only inside its legal travel, so a
    // dragged sidebar can never starve the grid.
    let navW = sh.navPx;
    if (opts.navW != null && sh.behaviour === 'push' && sh.nav !== 'hidden') {
        const t = navTravel(vw, arch);
        navW = Math.max(t.min, Math.min(t.max, opts.navW));
    }
    const sub = (opts.subnav ?? sh.subnav) && vw >= LAW.nav.rail_min ? SUBNAV : 0;
    const margin = marginAt(vw);
    const avail = vw - navW - sub - 2 * margin;
    const legal = vw <= LAW.nav.mobile_max ? LAW.legalColumnCounts.mobile
        : vw < LAW.nav.rail_min ? LAW.legalColumnCounts.tablet
        : LAW.legalColumnCounts.desktop;
    let best = null;
    for (const n of legal) {
        const col = (avail - (n - 1) * G) / n;
        if (col <= 0) continue;
        const d = Math.abs(col - TARGET);
        if (!best || d < best.d) best = { n, col, d };
    }
    return {
        vw, arch, nav: sh.nav, navW, subnav: sub, margin, avail,
        cols: best ? best.n : 1, col: best ? best.col : avail, shell: sh,
    };
}

/* ---------- 3. HEIGHT ------------------------------------------------------ */
export function viewportHeight(vw) {
    const pts = LAW.viewports.map((v) => [v.vp, v.vh]).sort((a, b) => a[0] - b[0]);
    if (vw <= pts[0][0]) return pts[0][1];
    if (vw >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        if (vw >= x0 && vw <= x1) return y0 + ((vw - x0) / (x1 - x0)) * (y1 - y0);
    }
    return 800;
}

export function terminalHeight(vw, vh) {
    const T = LAW.terminal;
    return (vh ?? viewportHeight(vw)) - T.bar_h - 2 * marginAt(vw);
}

/* ---------- 4. THE TERMINAL COMPOSER ---------------------------------------
   v2.0 shipped six fixed POS variants. Wrong shape: a register is composed by
   the person standing at it, not chosen from a menu of six. So a terminal is a
   COMPOSITION — catalog mode/share/rows/density, the cart:tender split, how the
   tender appears, whether there is a floor plan — and the six variants survive
   as PRESETS, which are starting points rather than cages.

   Three laws keep any composition honest:

     1. THE FLOORS CLAMP THE FRACTIONS. A percentage is a wish; the measured
        floor is the law. 20% of a screen that is below the catalog's floor does
        not produce an unreadable catalog, it produces no catalog.
     2. THE CATALOG IS ALWAYS THE FIRST THING TO GO. Never the cart, never the
        tender. When it goes it becomes a full-screen overlay behind one button,
        which is what every shipping POS does at small sizes.
     3. NOTHING IS EVER UNREACHABLE. Panes scroll their bodies and PIN their
        actions, and anything not resident gets a real dock ROW — never a
        floating button over the panes, which is how v2.0 managed to cover the
        payment panel with a Browse-catalog button.                          */

export const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function paneFit(pane, px) {
    for (const f of LAW.pos.paneFits[pane]) if (px >= f.floor) return f.variant;
    return null;
}

export const presetComposition = (id) => {
    const p = LAW.pos.presets.find((x) => x.id === id);
    return p ? JSON.parse(JSON.stringify(p.comp)) : null;
};

export const presets = () => LAW.pos.presets;
export const composerControls = () => LAW.pos.controls;
export const capabilities = () => LAW.pos.capabilities;
export const keymap = () => LAW.pos.keymap;
export const knownFixes = () => LAW.pos.fixes;
export const ranks = () => LAW.ranks;

export function composeTerminal(comp, vw, vh, opts = {}) {
    const C_ = comp;
    const T = LAW.terminal;
    const F = LAW.measuredFloors;
    // `rail: false` is the operator having put the nav away — see shell()'s
    // local extension. Everything downstream simply sees a wider `avail`.
    const g = geometry(vw, {
        arch: 'terminal',
        prefs: opts.rail === false ? { intent: 'hidden' } : {},
    });
    const avail = g.avail;
    const H = terminalHeight(vw, vh);
    const catMode = C_.catalog.mode;
    const tenderMode = C_.tender;
    const floorMode = C_.floor;
    const dock = [];
    const overlays = [];
    const notes = [];

    const CART_MIN = F.cart_line_min;
    const TENDER_MIN = F.tender_min;
    const CAT_LIST = F.catalog_list;
    const RESIDENT_MIN = LAW.pos.catalogResidentMinAvail;

    /* ---- REGIME ---- */
    const twoColMin = CART_MIN + TENDER_MIN + G;
    const regime = (vw <= LAW.pos.phoneMax || avail < twoColMin) ? 'phone'
        : (avail < H) ? 'stacked'
        : 'columns';

    /* ---- RESIDENCY, SETTLED BEFORE ANYTHING IS MEASURED ----
       The dock is a layout row, so every vertical number depends on how tall it
       is. A demotion discovered late, after the dock height was already taken,
       is exactly how a button ends up overlapping the pane beneath it. */
    const allocateColumns = (wantCat, wantFloor, wantTender) => {
        const f = {};
        if (wantCat) f.catalog = clampN(C_.catalog.size, 0.12, 0.55);
        if (wantFloor) f.floor = 0.2;
        f.cart = Math.max(0.2, C_.split.cart);
        if (wantTender) f.tender = clampN(C_.split.tender, 0, 0.45);
        const tot = Object.values(f).reduce((a, b) => a + b, 0) || 1;
        for (const k in f) f[k] /= tot;
        const pool = avail - G * (Object.keys(f).length - 1);
        const px = {};
        for (const k in f) px[k] = pool * f[k];
        return { frac: f, pool, px };
    };

    let catRes = ['left', 'right', 'top', 'bottom'].includes(catMode) && regime !== 'phone';
    if (catRes && (catMode === 'left' || catMode === 'right') && avail < RESIDENT_MIN) catRes = false;
    let floorRes = floorMode === 'left' && regime === 'columns'
        && avail >= RESIDENT_MIN + CAT_LIST + G;
    let tenderRes = regime === 'columns' && tenderMode === 'column' && C_.split.tender > 0;

    let alloc = null;
    for (let i = 0; i < 4; i++) {
        const wantCatCol = catRes && (catMode === 'left' || catMode === 'right');
        alloc = allocateColumns(wantCatCol, floorRes, tenderRes);
        const px = alloc.px;
        if (wantCatCol && !paneFit('catalog', px.catalog)) { catRes = false; continue; }
        if (tenderRes && !paneFit('tender', px.tender)) { tenderRes = false; continue; }
        if (floorRes && !paneFit('floor', px.floor)) { floorRes = false; continue; }
        if (px.cart < CART_MIN && floorRes) { floorRes = false; continue; }
        if (px.cart < CART_MIN && wantCatCol) { catRes = false; continue; }
        break;
    }
    if (catRes && (catMode === 'top' || catMode === 'bottom')) {
        const probe = H - (T.tender_bar_h + G);
        catRes = T.tile_h + G + T.cart_min_h <= probe;
    }
    const tenderBar = tenderMode === 'bar'
        || (!tenderRes && tenderMode === 'column' && regime === 'stacked');

    if (!tenderRes) {
        dock.push({
            id: 'tender', label: tenderBar ? 'Pay' : 'Take payment',
            rank: 1, primary: true, shows: 'total', inline: tenderBar,
        });
    }
    if (catMode !== 'off' && !catRes) dock.push({ id: 'catalog', label: 'Catalog', rank: 2, shows: 'count' });
    if (floorMode !== 'off' && !floorRes) dock.push({ id: 'floor', label: 'Floor', rank: 2 });

    let dockH = !dock.length ? 0 : (dock.some((d) => d.inline) ? T.tender_bar_h : 72);
    let usableH = H - (dockH ? dockH + G : 0);
    const { frac, px } = allocateColumns(
        catRes && (catMode === 'left' || catMode === 'right'), floorRes, tenderRes,
    );

    /* ---- CATALOG ---- */
    let cat = null;
    if (catMode === 'off') {
        cat = null;
    } else if (!catRes || catMode === 'overlay') {
        cat = {
            mode: 'overlay',
            trigger: 'Catalog',
            reason: catMode === 'overlay' ? 'by design'
                : (catMode === 'left' || catMode === 'right')
                    ? 'this screen is too narrow for a catalog column'
                    : 'no room for a strip here',
        };
        if (catMode !== 'overlay') {
            notes.push(
                `catalog is one button away here: a resident catalog needs ${Math.round(RESIDENT_MIN)}px `
                + `of content width and this screen has ${Math.round(avail)}px, and taking it from the `
                + 'cart is the wrong trade',
            );
        }
    } else if (catMode === 'left' || catMode === 'right') {
        const w = px.catalog;
        cat = {
            mode: catMode,
            px: Math.round(w * 10) / 10,
            fit: paneFit('catalog', w) || 'list',
            tiles: C_.catalog.tiles
                || Math.max(1, Math.floor((w - 2 * C.card_pad + G) / (LAW.controlMetrics.tile_min + G))),
        };
    } else {
        const share = clampN(C_.catalog.size, 0, 0.55);
        // A band is always a WHOLE number of tile rows. A 40% share that only
        // buys one 152px row gives the other 144px back to the cart rather than
        // holding it as empty band.
        let want = C_.catalog.rows;
        if (share) want = Math.max(1, Math.floor((usableH * share + G) / (T.tile_h + G)));
        let rows = 0;
        for (let r = want; r >= 1; r--) {
            const need = r * T.tile_h + (r - 1) * G;
            if (need + T.cart_min_h + G <= usableH) { rows = r; break; }
        }
        if (!rows) {
            cat = { mode: 'overlay', reason: 'height', trigger: 'Catalog' };
            notes.push(
                `${Math.round(usableH)}px of usable height cannot carry a tile strip and a legible `
                + 'cart, so the catalog is one button away instead',
            );
            if (!dock.some((d) => d.id === 'catalog')) {
                dock.push({ id: 'catalog', label: 'Catalog', rank: 2, shows: 'count' });
                dockH = dockH || 72;
                usableH = H - (dockH + G);
            }
        } else {
            const per = C_.catalog.tiles
                || Math.max(2, Math.floor((avail + G) / (LAW.controlMetrics.tile_min + G)));
            cat = {
                mode: catMode,
                rows,
                demoted: rows < C_.catalog.rows,
                h: rows * T.tile_h + (rows - 1) * G,
                tiles: per,
                visible: per * rows,
            };
        }
    }

    /* ---- FLOOR ---- */
    let flr = null;
    if (floorMode !== 'off') {
        flr = floorRes
            ? { mode: 'left', px: Math.round(px.floor * 10) / 10, fit: paneFit('floor', px.floor) || 'list' }
            : { mode: 'overlay', trigger: 'Floor', reason: 'width' };
    }

    /* ---- TENDER ---- */
    let tender;
    if (tenderRes) {
        tender = { mode: 'column', px: Math.round(px.tender * 10) / 10, fit: paneFit('tender', px.tender) || 'bar' };
    } else if (tenderBar) {
        tender = { mode: 'bar', h: T.tender_bar_h, docked: true };
    } else {
        tender = {
            mode: 'sheet',
            trigger: 'Take payment',
            reason: tenderMode === 'sheet' ? 'by design' : 'no room for a column here',
        };
    }

    /* ---- CART: whatever is left, and it always gets it ---- */
    let taken = 0;
    if (cat && cat.px) taken += cat.px + G;
    if (flr && flr.px) taken += flr.px + G;
    if (tender.px) taken += tender.px + G;
    const cartPx = avail - taken;
    // Below the designed minimum the cart line does not break, it SCROLLS
    // inside its own pane — the same underflow rule the cards use.
    const cartFit = paneFit('cart', cartPx);
    const cart = {
        px: Math.round(cartPx * 10) / 10,
        fit: cartFit || 'minimal',
        belowFloor: !cartFit && vw >= LAW.minViewport,
        underflow: !cartFit,
        minWidth: CART_MIN,
    };

    for (const d of dock) overlays.push({ id: d.id, as: d.id === 'tender' ? 'sheet' : 'fullscreen' });

    const bandH = cat && cat.h ? cat.h + G : 0;
    const cartH = usableH - bandH;
    const lines = Math.max(0, Math.floor((cartH - T.cart_hdr - 2 * C.card_pad_sm) / T.cart_line));

    return {
        vw,
        vh: vh || viewportHeight(vw),
        avail: Math.round(avail * 10) / 10,
        H: Math.round(H),
        usableH: Math.round(usableH),
        regime,
        catalog: cat,
        floor: flr,
        tender,
        cart,
        dock,
        dockH,
        overlays,
        cartH: Math.round(cartH),
        cartLines: lines,
        cramped: lines < T.cart_min_lines,
        notes,
        fractions: frac,
        margin: g.margin,
        railW: g.navW,
        /* Reachability is a PROPERTY of the layout, asserted rather than hoped
           for. The total is ALWAYS on screen — in the tender column, in the bar,
           or printed inside the Pay button, which is Odoo's trick and a good
           one. */
        reachable: {
            cart: true,
            tender: tender.mode === 'column' || tender.mode === 'bar'
                || dock.some((d) => d.id === 'tender'),
            total: tender.mode === 'column' || tender.mode === 'bar'
                || dock.some((d) => d.shows === 'total'),
            catalog: !cat || cat.mode !== 'overlay' || dock.some((d) => d.id === 'catalog'),
            floor: !flr || flr.mode !== 'overlay' || dock.some((d) => d.id === 'floor'),
        },
    };
}

/* ---------- 5. FORMAT TO FIT -----------------------------------------------
   A number is never truncated with an ellipsis and never overflows its box.
   It steps down a ladder of ever-leaner forms until one measures inside the
   space it has, and the exact value stays available on hover. */
const UNITS = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];

export function formatToFit(value, availPx, fontPx, currency = '') {
    const pre = currency ? `${currency} ` : '';
    const r4v = Math.round(value * 1e4) / 1e4;
    const grp = (v, dp) => v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    const full = (dp) => pre + grp(r4v, dp);
    const compact = (dp) => {
        for (const [m, sfx] of UNITS) {
            const mant = value / m;
            if (Math.abs(value) >= m && Math.abs(mant) < 1000) return pre + grp(mant, dp) + sfx;
        }
        return Math.abs(value) < 1000 ? pre + grp(value, dp) : null;
    };
    const sci = (dp) => pre + value.toExponential(dp).replace('e+', 'E');
    // Decide the 4dp rung from a value rounded to 4dp, not from the raw float.
    // 30000 − 24886.20 is 5113.799999999999 in binary floating point, whose
    // decimal string has twelve digits — which reads as "this value carries
    // 4dp" and printed the change as 5,113.8000.
    const r4 = Math.round(value * 1e4) / 1e4;
    const dp4 = ((String(r4).split('.')[1]) || '').length > 2;
    const small = Math.abs(value) < 1000;
    const bare = (t) => (t ? t.replace(pre, '') : null);
    const rungs = [
        dp4 ? full(4) : null, full(2), bare(full(2)),
        small ? null : compact(2), small ? null : bare(compact(2)),
        small ? null : compact(1), small ? null : compact(0),
        small ? null : bare(compact(0)), sci(2), sci(1),
    ].filter(Boolean);
    const exact = full(2);
    for (const r of rungs) {
        if (measureNumber(r, fontPx) <= availPx) {
            return { text: r, exact, truncated: r !== exact, rung: rungs.indexOf(r) };
        }
    }
    const last = rungs[rungs.length - 1];
    return { text: last, exact, truncated: true, rung: rungs.length - 1 };
}

export default {
    LAW, geometry, shell, composeTerminal, presetComposition, formatToFit,
    marginAt, railAt, paneFit, terminalHeight, viewportHeight, measureNumber,
};
