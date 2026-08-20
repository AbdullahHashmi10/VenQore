#!/usr/bin/env python3
"""Emit venqore-layout-engine.js v2.0 — the executable Layout Law."""
import json
from pathlib import Path

OUT = Path(__file__).parent / "out"
LAW = json.loads((OUT / "layout-law-v2.json").read_text())

# Only the parts the runtime needs. Solved tables stay in the JSON for the
# rule book and the proofs; the engine recomputes them, and the test asserts
# the two agree.
RUNTIME = {
    "version": LAW["version"],
    "constants": LAW["constants"],
    "nav": LAW["nav"],
    "navSchedule": {k: v for k, v in
                    __import__("importlib").import_module("law_v2").NAV_SCHEDULE.items()},
    "archNav": {k: {kk: vv for kk, vv in v.items() if kk != "why"}
                for k, v in LAW["arch_nav"].items()},
    "legalColumnCounts": LAW["legal_column_counts"],
    "categories": LAW["categories"],
    "typeScale": LAW["type_scale"],
    "controlMetrics": LAW["control_metrics"],
    "measuredFloors": {k: v for k, v in LAW["measured_floors"].items() if not k.startswith("_")},
    "terminal": LAW["terminal"],
    "viewports": LAW["viewports"],
    "paneCaps": LAW["pane_caps"],
    "absorbers": LAW["absorbers"],
    "residency": LAW["residency"],
    "ranks": LAW["ranks"],
    "archetypes": LAW["archetypes"],
    "numericLadder": LAW["numeric_ladder"],
    "fontMetrics": LAW["font_metrics"],
    "pos": {"presets": LAW["pos"]["presets"],
            "controls": LAW["pos"]["controls"],
            "paneFits": LAW["pos"]["pane_fits"],
            "phoneMax": LAW["pos"]["phone_max"],
            "catalogResidentMinAvail": LAW["pos"]["catalog_resident_min_avail"],
            "catalogResidentMinVw": LAW["pos"]["catalog_resident_min_vw"],
            "capabilities": LAW["pos"]["capabilities"],
            "overrides": LAW["pos"]["overrides"],
            "fixes": LAW["pos"]["fixes"],
            "keymap": LAW["pos"]["keymap"]},
    "document": {"zones": LAW["document"]["zones"],
                 "density": LAW["document"]["density"],
                 "types": LAW["document"]["types"],
                 "capabilities": LAW["document"]["capabilities"],
                 "fixes": LAW["document"]["fixes"],
                 "presets": LAW["document"]["presets"],
                 "controls": LAW["document"]["controls"],
                 "line_fits": LAW["document"]["line_fits"],
                 "summary_fits": LAW["document"]["summary_fits"],
                 "summary_resident_min_avail": LAW["document"]["summary_resident_min_avail"],
                 "metrics": LAW["document"]["metrics"]},
    "edit": LAW["edit"],
    "placement": {k: v for k, v in LAW["placement"].items() if k != "box_limits"},
    "splitter": {k: v for k, v in LAW["splitter"].items() if k != "travel"},
    "contentFloors": (lambda t: {a: t[a]["content_floor"]
                                 for a in ("dashboard", "document", "terminal")}
                      )(LAW["splitter"]["travel"][sorted(LAW["splitter"]["travel"],
                                                         key=int)[-1]]),
    "underflow": LAW["underflow"],
    "minViewport": LAW["min_viewport"],
    "envelopes": LAW["envelopes"],
    "marginRamp": [600, 648],
    "railRamp": [1024, 1096],
}

JS = '''/* ==========================================================================
   VenQore Layout Engine v2.0
   ==========================================================================
   v1.0 answered ONE question: how does a CARD survive every screen?
   v2.0 answers the whole of it: how does a SCREEN survive every screen?

   The engine is the law in executable form. Nothing in the product decides
   layout for itself -- components declare WHAT they are and the engine
   decides what they BECOME at the current size. That separation is the only
   reason an AI-authored screen cannot produce an illegal layout.

   Every number below is generated from layout-law.json. Do not hand-edit
   them: a hand edit is a number that silently disagrees with the solver.

   API
     geometry(vw, {arch, navOpen, subnav})  viewport  -> grid
     navBehaviour(vw)                       what the hamburger does here
     shell(vw, arch, prefs)                 the complete shell state
     resolveCard(catId, geo, variant)       category -> concrete span
     packCards(resolved, cols)              cards    -> bands, no holes
     composeTerminal(comp, vw, vh)          POS      -> a composed terminal
     presetComposition(id)                  one of the six starting points
     layoutDocument(vw, typeId, density)    document -> zones + columns
     formatToFit(value, px, fontPx, ccy)    number   -> the richest form that fits
     validate(cards, vw, opts)              reject illegal layouts before render
   ========================================================================== */

export const LAW = __LAW__;

const C = LAW.constants;
const G = C.gutter, ROW = C.row, TARGET = C.col_target;
const SIDEBAR = C.sidebar_expanded, RAIL = C.sidebar_rail, SUBNAV = C.subnav_w;
const M_DESK = C.margin_desktop, M_MOB = C.margin_mobile;

/* ---------- MEASUREMENT ------------------------------------------------
   Advance widths read out of the Space Grotesk binary in v1.0: a tabular
   digit at 600 weight is 0.620em, a comma 0.284em, a period 0.287em. Every
   pixel floor in this file traces back to these three numbers.           */
const FM = LAW.fontMetrics;
export function measureNumber(str, px) {
  let em = 0;
  for (const ch of String(str))
    em += /\d/.test(ch) ? FM.digit_em : ch === "," ? FM.comma_em
        : ch === "." ? FM.period_em : ch === " " ? 0.255 : 0.63;
  return em * px;
}

/* ---------- THE ONE LAW, BOTH AXES ------------------------------------- */
export const span   = (n, unit, gap = G) => n * unit + (n - 1) * gap;
export const height = rows       => span(rows, ROW);
export const width  = (cols, col) => span(cols, col);

/* ---------- RAMPS ------------------------------------------------------
   A step of pushing chrome can never be free: by the time the viewport has
   grown by the chrome's width, the no-chrome baseline has grown by the same
   amount. So chrome that must not cost content RAMPS instead -- its width is
   a clamp over a band at least as long as its own width, which makes
   d(nav)/d(vw) <= 1 and stops the content ever stepping down.            */
const ramp = (v, lo, hi, from, to) =>
  v <= lo ? from : v >= hi ? to : from + (v - lo) * (to - from) / (hi - lo);

export const marginAt = vw => ramp(vw, LAW.marginRamp[0], LAW.marginRamp[1], M_MOB, M_DESK);
export const railAt   = vw => ramp(vw, LAW.railRamp[0],   LAW.railRamp[1],   0,     RAIL);

/* ---------- 1. NAV ------------------------------------------------------
   The hamburger exists at EVERY width. What it does depends on whether
   pushing is affordable here.

     vw >= push_min (1216)   PUSH    the grid recomputes, nothing is hidden
     vw <  push_min          OVERLAY the grid is untouched, a scrim appears

   1216 is not chosen. It is SIDEBAR + 2*margin + 904, where 904 is the
   content width at the 1024 rail -- the narrowest desktop the law already
   ships. Expanding may cost you cards per row; it may never cost you the
   grid.                                                                   */
export function navDefault(vw, arch = "dashboard") {
  const s = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  if (s.rail == null) return "hidden";
  if (s.expanded && vw >= s.expanded) return "expanded";
  return vw >= s.rail ? "rail" : "hidden";
}
export const navBehaviour = vw => vw >= LAW.nav.push_min ? "push" : "overlay";
export const drawerWidth  = vw => Math.min(SIDEBAR, vw - LAW.nav.drawer_peek);

/* The complete shell state for a viewport, an archetype and the user's saved
   preference. `intent` is what they last chose on a screen wide enough to
   honour it, so shrinking the window demotes the nav and growing it back
   restores their choice rather than forgetting it. */
export function shell(vw, arch = "dashboard", prefs = {}) {
  const def = navDefault(vw, arch);
  const beh = navBehaviour(vw);
  const sch = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  let state = def;
  if (prefs.intent === "expanded" && beh === "push") state = "expanded";
  if (prefs.intent === "rail" && def === "expanded")  state = "rail";
  // `open` means "the drawer is showing", and a drawer only exists where the
  // nav overlays. On a push-capable screen there is no drawer, so a stale
  // `open` left over from a narrower width must not silently invert the nav —
  // which it did, and which made a 1920 dashboard show a rail after the user
  // had opened the drawer at 1024 and then widened the window.
  const open = !!prefs.open && beh === "overlay";
  const subnav = arch === "console" && sch.subnav_col != null && vw >= sch.subnav_col;
  return {
    vw, arch, nav: state, behaviour: beh, hamburger: true,
    overlayOpen: open && beh === "overlay",
    overlayWidth: beh === "overlay" ? drawerWidth(vw) : null,
    scrim: open && beh === "overlay",
    subnav, subnavAs: subnav ? "column" : "tabstrip",
    navPx: state === "expanded" ? SIDEBAR : state === "rail" ? railAt(vw) : 0,
    canPush: beh === "push",
  };
}

/* ---------- 2. GEOMETRY: viewport -> grid ------------------------------ */
export function geometry(vw, opts = {}) {
  const arch = opts.arch || "dashboard";
  const sh   = shell(vw, arch, opts.prefs || (opts.navOpen ? { open: true } : {}));
  // A user-dragged splitter width overrides the state's nominal width -- but
  // only where the nav actually pushes, and only inside its legal travel, so
  // a dragged sidebar can never starve the grid.
  let navW = sh.navPx;
  if (opts.navW != null && sh.behaviour === "push" && sh.nav !== "hidden") {
    const t = navTravel(vw, arch);
    navW = Math.max(t.min, Math.min(t.max, opts.navW));
  }
  const sub  = (opts.subnav ?? sh.subnav) && vw >= LAW.nav.rail_min ? SUBNAV : 0;
  const margin = marginAt(vw);
  const avail  = vw - navW - sub - 2 * margin;
  const legal  = vw <= LAW.nav.mobile_max ? LAW.legalColumnCounts.mobile
               : vw <  LAW.nav.rail_min   ? LAW.legalColumnCounts.tablet
               :                            LAW.legalColumnCounts.desktop;
  let best = null;
  for (const n of legal) {
    const col = (avail - (n - 1) * G) / n;
    if (col <= 0) continue;
    const d = Math.abs(col - TARGET);
    if (!best || d < best.d) best = { n, col, d };
  }
  return { vw, arch, nav: sh.nav, navW, subnav: sub, margin, avail,
           cols: best.n, col: best.col, shell: sh };
}

/* ---------- 3. RESOLVE: a region -> a concrete span ---------------------
   Start at the fit the author designed. Keep it by WIDENING when the column
   is narrow here. Only DEGRADE to a leaner fit -- trading a column for a row
   and re-laying the inside -- when widening is exhausted. A card that cannot
   get wider gets taller; that is the mechanism that guarantees nobody loses
   data to their screen size.                                              */
export function resolveCard(catId, geo, authoredVariant) {
  const cat = LAW.categories.find(c => c.id === catId);
  if (!cat) throw new Error(`unknown category ${catId}`);
  let start = cat.default;
  if (authoredVariant) {
    const i = cat.fits.findIndex(f => f.variant === authoredVariant);
    if (i >= 0) start = i;
  }
  const N = geo.cols, col = geo.col;
  const cap = Math.min(N, cat.max[0]);
  const mobile = N <= 4;
  for (let i = start; i < cat.fits.length; i++) {
    const f = cat.fits[i];
    if (f.cols > cap) continue;
    let c = (mobile && cat.id !== "C1") ? N : f.cols;
    while (c < cap && width(c, col) < f.floor) c++;
    if (width(c, col) >= f.floor)
      return { catId, cols: c, rows: f.rows, variant: f.variant, floor: f.floor,
               px: width(c, col), h: height(f.rows), promoted: c > f.cols,
               degraded: i > start, fullWidth: c >= N, ok: true };
  }
  // UNDERFLOW: below the designed 360px minimum a card does not break, it
  // scrolls. It keeps its leanest fit's floor as a min-width and scrolls
  // horizontally inside its own border, so the content stays reachable and
  // the PAGE still never scrolls sideways -- only the one card that could
  // not fit does. Affects C5 and C6 between a 320 and 327px viewport.
  const lean = cat.fits[cat.fits.length - 1];
  const px = width(N, col);
  return { catId, cols: N, rows: lean.rows, variant: lean.variant, floor: lean.floor,
           px, h: height(lean.rows), promoted: true, degraded: true,
           fullWidth: true, ok: px >= lean.floor,
           underflow: px < lean.floor, minWidth: lean.floor };
}

/* ---------- 4. PACK: bands, then flush ---------------------------------
   A band contains only cards of equal row-span. A card taller than its
   neighbours starts a new band rather than sitting beside them and leaving a
   hole underneath. Leftover columns go back to cards that have not reached
   their category maximum, one at a time, round-robin, until the band is
   flush. Cards never reorder: the author's sequence is the reading order on
   every screen, which is what makes a layout authored at any width legal at
   every width.                                                            */
export function packCards(resolved, N) {
  const bands = []; let cur = null;
  for (const c of resolved) {
    const card = { ...c };
    if (!cur || cur.rows !== card.rows || cur.used + card.cols > N) {
      cur = { rows: card.rows, cards: [], used: 0 }; bands.push(cur);
    }
    cur.cards.push(card); cur.used += card.cols;
  }
  for (const band of bands) {
    let slack = N - band.used;
    while (slack > 0) {
      let grew = false;
      for (const c of band.cards) {
        if (slack <= 0) break;
        const max = LAW.categories.find(x => x.id === c.catId)?.max[0] ?? c.cols;
        if (c.cols < max) { c.cols++; slack--; grew = true; }
      }
      if (!grew) break;
    }
    band.used = N - slack; band.slack = slack;
  }
  return bands;
}

export function layoutDashboard(cards, vw, opts = {}) {
  const g = geometry(vw, { ...opts, arch: "dashboard" });
  const res = cards.map(c => ({ ...c, ...resolveCard(c.catId, g, c.variant) }));
  return { geometry: g, bands: packCards(res, g.cols), cards: res };
}

/* ---------- 5. THE TERMINAL --------------------------------------------
   A dashboard has unlimited height, so v1.0 only had to defend the width.
   A terminal is exactly one viewport tall and never scrolls the page, so
   here height is the scarcer resource -- and the worst case is not a phone,
   it is a 1280x720 laptop, where a maximised browser leaves ~570px.

   Columns-vs-bands is therefore an ASPECT question, not a width question,
   and it is decided once per composition rather than emerging from a score.
   Within a layout, a pane relays its inside down its own fit ladder before
   anything changes residency -- exactly like a card.                      */
const bestFit = (fits, w) => {
  for (let k = 0; k < fits.length; k++) if (w >= fits[k].floor) return [k, fits[k]];
  return [null, null];
};

export function terminalHeight(vw, vh) {
  const T = LAW.terminal;
  return (vh ?? viewportHeight(vw)) - T.bar_h - 2 * marginAt(vw);
}
export function viewportHeight(vw) {
  const pts = LAW.viewports.map(v => [v.vp, v.vh]).sort((a, b) => a[0] - b[0]);
  if (vw <= pts[0][0]) return pts[0][1];
  if (vw >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (vw >= x0 && vw <= x1) return y0 + (vw - x0) / (x1 - x0) * (y1 - y0);
  }
  return 800;
}

function allocate(res, avail, minIdx) {
  const n = res.length;
  if (!n) return null;
  const w = avail - G * (n - 1);
  const got = {}, idx = {};
  for (const p of res) {
    const k0 = Math.min(minIdx[p.id] ?? p.fits.length - 1, p.fits.length - 1);
    idx[p.id] = k0; got[p.id] = p.fits[k0].floor;
  }
  const sum = () => Object.values(got).reduce((a, b) => a + b, 0);
  if (sum() > w) return null;
  // rank, then WHAT THE PANE DEFENDS, then weight. A presence-holder must not
  // buy itself a richer fit while a fit-holder is still short of its own step.
  const order = [...res].sort((a, b) =>
    a.rank - b.rank || ((a.hold === "fit" ? 0 : 1) - (b.hold === "fit" ? 0 : 1))
    || b.weight - a.weight);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of order) {
      const k = idx[p.id]; if (k === 0) continue;
      const cost = p.fits[k - 1].floor - got[p.id];
      if (sum() + cost <= w) { got[p.id] = p.fits[k - 1].floor; idx[p.id]--; changed = true; break; }
    }
  }
  let left = w - sum(), slack = 0;
  if (left > 0) {
    const tw = res.reduce((a, p) => a + p.weight, 0) || 1;
    for (const p of res) got[p.id] += left * p.weight / tw;
    let surplus = 0;
    for (const p of res) {
      const cap = LAW.paneCaps[p.id];
      if (cap && got[p.id] > cap) { surplus += got[p.id] - cap; got[p.id] = cap; }
    }
    const abs = res.filter(p => LAW.absorbers.includes(p.id));
    if (surplus > 0 && abs.length) {
      const aw = abs.reduce((a, p) => a + got[p.id], 0) || 1;
      for (const p of abs) got[p.id] += surplus * got[p.id] / aw;
      surplus = 0;
    }
    slack = surplus;
    for (const p of res) { const [k] = bestFit(p.fits, got[p.id]); if (k != null) idx[p.id] = k; }
  }
  return { got, idx, slack };
}

const envAt = (rows, vw) => {
  let cur = rows[0];
  for (const r of rows) if (vw >= r.from) cur = r; else break;
  return cur;
};

/* ---------- 5b. THE TERMINAL COMPOSER ----------------------------------
   v2.0 shipped six fixed POS variants. Wrong shape: a register is composed by
   the person standing at it, not chosen from a menu of six. So a terminal is a
   COMPOSITION -- catalog mode/share/rows/density, the cart:tender split, how the
   tender appears, whether there is a floor plan -- and the six variants survive
   as PRESETS, which are starting points rather than cages.

   Three laws keep any composition honest:

     1. THE FLOORS CLAMP THE FRACTIONS. A percentage is a wish; the measured
        floor is the law. 20% of a screen that is below the catalog's floor does
        not produce an unreadable catalog, it produces no catalog.
     2. THE CATALOG IS ALWAYS THE FIRST THING TO GO. Never the cart, never the
        tender. When it goes it becomes a full-screen overlay behind one button,
        which is what every shipping POS does at small sizes.
     3. NOTHING IS EVER UNREACHABLE. Panes scroll their bodies and PIN their
        actions, and anything not resident gets a real dock row -- never a
        floating button over the panes, which is how v2.0 managed to cover the
        payment panel with a Browse-catalog button.                          */

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function paneFit(pane, px) {
  for (const f of LAW.pos.paneFits[pane]) if (px >= f.floor) return f.variant;
  return null;
}
export const presetComposition = id => {
  const p = LAW.pos.presets.find(x => x.id === id);
  return p ? JSON.parse(JSON.stringify(p.comp)) : null;
};

export function composeTerminal(comp, vw, vh) {
  const C_ = comp, T = LAW.terminal, F = LAW.measuredFloors;
  const g = geometry(vw, { arch: "terminal" });
  const avail = g.avail;
  const H = terminalHeight(vw, vh);
  const catMode = C_.catalog.mode, tenderMode = C_.tender, floorMode = C_.floor;
  const dock = [], overlays = [], notes = [];

  const CART_MIN = F.cart_line_min, TENDER_MIN = F.tender_min, CAT_LIST = F.catalog_list;
  const RESIDENT_MIN = LAW.pos.catalogResidentMinAvail;

  /* ---- REGIME ---- */
  const twoColMin = CART_MIN + TENDER_MIN + G;
  const regime = (vw <= LAW.pos.phoneMax || avail < twoColMin) ? "phone"
               : (avail < H) ? "stacked" : "columns";

  /* ---- RESIDENCY, SETTLED BEFORE ANYTHING IS MEASURED ----
     The dock is a layout row, so every vertical number depends on how tall it
     is. A demotion discovered late, after the dock height was already taken, is
     exactly how a button ends up overlapping the pane beneath it. */
  const allocateColumns = (wantCat, wantFloor, wantTender) => {
    const f = {};
    if (wantCat) f.catalog = clampN(C_.catalog.size, .12, .55);
    if (wantFloor) f.floor = .20;
    f.cart = Math.max(.20, C_.split.cart);
    if (wantTender) f.tender = clampN(C_.split.tender, 0, .45);
    const tot = Object.values(f).reduce((a, b) => a + b, 0) || 1;
    for (const k in f) f[k] /= tot;
    const pool = avail - G * (Object.keys(f).length - 1);
    const px = {};
    for (const k in f) px[k] = pool * f[k];
    return { frac: f, pool, px };
  };

  let catRes = ["left", "right", "top", "bottom"].includes(catMode) && regime !== "phone";
  if (catRes && (catMode === "left" || catMode === "right") && avail < RESIDENT_MIN) catRes = false;
  let floorRes = floorMode === "left" && regime === "columns"
                 && avail >= RESIDENT_MIN + CAT_LIST + G;
  let tenderRes = regime === "columns" && tenderMode === "column" && C_.split.tender > 0;

  let alloc = null;
  for (let i = 0; i < 4; i++) {
    const wantCatCol = catRes && (catMode === "left" || catMode === "right");
    alloc = allocateColumns(wantCatCol, floorRes, tenderRes);
    const px = alloc.px;
    if (wantCatCol && !paneFit("catalog", px.catalog)) { catRes = false; continue; }
    if (tenderRes && !paneFit("tender", px.tender)) { tenderRes = false; continue; }
    if (floorRes && !paneFit("floor", px.floor)) { floorRes = false; continue; }
    if (px.cart < CART_MIN && floorRes) { floorRes = false; continue; }
    if (px.cart < CART_MIN && wantCatCol) { catRes = false; continue; }
    break;
  }
  if (catRes && (catMode === "top" || catMode === "bottom")) {
    const probe = H - (T.tender_bar_h + G);
    catRes = T.tile_h + G + T.cart_min_h <= probe;
  }
  const tenderBar = tenderMode === "bar"
                 || (!tenderRes && tenderMode === "column" && regime === "stacked");

  if (!tenderRes) dock.push({ id: "tender", label: tenderBar ? "Pay" : "Take payment",
                              rank: 1, primary: true, shows: "total", inline: tenderBar });
  if (catMode !== "off" && !catRes) dock.push({ id: "catalog", label: "Catalog",
                                                rank: 2, shows: "count" });
  if (floorMode !== "off" && !floorRes) dock.push({ id: "floor", label: "Floor", rank: 2 });
  let dockH = !dock.length ? 0 : (dock.some(d => d.inline) ? T.tender_bar_h : 72);
  let usableH = H - (dockH ? dockH + G : 0);
  const { frac, px } = allocateColumns(catRes && (catMode === "left" || catMode === "right"),
                                       floorRes, tenderRes);

  /* ---- CATALOG ---- */
  let cat = null;
  if (catMode === "off") cat = null;
  else if (!catRes || catMode === "overlay") {
    cat = { mode: "overlay", trigger: "Catalog",
            reason: catMode === "overlay" ? "by design"
                  : (catMode === "left" || catMode === "right")
                    ? "this screen is too narrow for a catalog column"
                    : "no room for a strip here" };
    if (catMode !== "overlay")
      notes.push(`catalog is one button away here: a resident catalog needs ${Math.round(RESIDENT_MIN)}px `
               + `of content width and this screen has ${Math.round(avail)}px, and taking it from the `
               + `cart is the wrong trade`);
  } else if (catMode === "left" || catMode === "right") {
    const w = px.catalog;
    cat = { mode: catMode, px: Math.round(w * 10) / 10, fit: paneFit("catalog", w) || "list",
            tiles: C_.catalog.tiles
                   || Math.max(1, Math.floor((w - 2 * C.card_pad + G) / (LAW.controlMetrics.tile_min + G))) };
  } else {
    const share = clampN(C_.catalog.size, 0, .55);
    // A band is always a WHOLE number of tile rows. A 40% share that only buys
    // one 152px row gives the other 144px back to the cart rather than holding
    // it as empty band.
    let want = C_.catalog.rows;
    if (share) want = Math.max(1, Math.floor((usableH * share + G) / (T.tile_h + G)));
    let rows = 0;
    for (let r = want; r >= 1; r--) {
      const need = r * T.tile_h + (r - 1) * G;
      if (need + T.cart_min_h + G <= usableH) { rows = r; break; }
    }
    if (!rows) {
      cat = { mode: "overlay", reason: "height", trigger: "Catalog" };
      notes.push(`${Math.round(usableH)}px of usable height cannot carry a tile strip and a legible `
               + `cart, so the catalog is one button away instead`);
      if (!dock.some(d => d.id === "catalog")) {
        dock.push({ id: "catalog", label: "Catalog", rank: 2, shows: "count" });
        dockH = dockH || 72;
        usableH = H - (dockH + G);
      }
    } else {
      const per = C_.catalog.tiles
                || Math.max(2, Math.floor((avail + G) / (LAW.controlMetrics.tile_min + G)));
      cat = { mode: catMode, rows, demoted: rows < C_.catalog.rows,
              h: rows * T.tile_h + (rows - 1) * G, tiles: per, visible: per * rows };
    }
  }

  /* ---- FLOOR ---- */
  let flr = null;
  if (floorMode !== "off") {
    flr = floorRes
      ? { mode: "left", px: Math.round(px.floor * 10) / 10, fit: paneFit("floor", px.floor) || "list" }
      : { mode: "overlay", trigger: "Floor", reason: "width" };
  }

  /* ---- TENDER ---- */
  let tender;
  if (tenderRes) tender = { mode: "column", px: Math.round(px.tender * 10) / 10,
                            fit: paneFit("tender", px.tender) || "bar" };
  else if (tenderBar) tender = { mode: "bar", h: T.tender_bar_h, docked: true };
  else tender = { mode: "sheet", trigger: "Take payment",
                  reason: tenderMode === "sheet" ? "by design" : "no room for a column here" };

  /* ---- CART: whatever is left, and it always gets it ---- */
  let taken = 0;
  if (cat && cat.px) taken += cat.px + G;
  if (flr && flr.px) taken += flr.px + G;
  if (tender.px) taken += tender.px + G;
  const cartPx = avail - taken;
  // Below the designed 360px minimum the cart line does not break, it SCROLLS
  // inside its own pane -- the same underflow rule the cards use. A 320px
  // viewport leaves 288px of content and the leanest cart line needs 305.
  const cartFit = paneFit("cart", cartPx);
  const cart = { px: Math.round(cartPx * 10) / 10, fit: cartFit || "minimal",
                 belowFloor: !cartFit && vw >= LAW.minViewport,
                 underflow: !cartFit, minWidth: CART_MIN };

  for (const d of dock)
    overlays.push({ id: d.id, as: d.id === "tender" ? "sheet" : "fullscreen" });

  const bandH = cat && cat.h ? cat.h + G : 0;
  const cartH = usableH - bandH;
  const lines = Math.max(0, Math.floor((cartH - T.cart_hdr - 2 * C.card_pad_sm) / T.cart_line));

  return {
    vw, vh: vh || viewportHeight(vw), avail: Math.round(avail * 10) / 10, H: Math.round(H),
    usableH: Math.round(usableH), regime, catalog: cat, floor: flr, tender, cart,
    dock, dockH, overlays, cartH: Math.round(cartH), cartLines: lines,
    cramped: lines < T.cart_min_lines, notes, fractions: frac,
    /* Reachability is a PROPERTY of the layout, asserted rather than hoped for.
       The total is ALWAYS on screen -- in the tender column, in the bar, or
       printed inside the Pay button, which is Odoo's trick and a good one. */
    reachable: {
      cart: true,
      tender: tender.mode === "column" || tender.mode === "bar"
              || dock.some(d => d.id === "tender"),
      total: tender.mode === "column" || tender.mode === "bar"
             || dock.some(d => d.shows === "total"),
      catalog: !cat || cat.mode !== "overlay" || dock.some(d => d.id === "catalog"),
      floor: !flr || flr.mode !== "overlay" || dock.some(d => d.id === "floor"),
    },
  };
}

/* ---------- 6. THE DOCUMENT --------------------------------------------
   One editor, thirteen document types. A type is a CONFIGURATION -- a set of
   capability switches and label overrides -- never a different screen. That
   is the difference between one editor and the eight copy-pasted clones the
   codebase has today, where the same bug had to be fixed eight times and
   usually was not.                                                        */
export function layoutDocument(vw, typeId = "sales_invoice", wantDensity) {
  const g = geometry(vw, { arch: "document" });
  const zones = LAW.document.zones.filter(z => z.id !== "docheader");
  const env = envAt(LAW.envelopes.document, vw);
  const cfg = zones.map(z => ({ ...z, residency: env.res[z.id] }));
  const res = cfg.filter(c => c.residency === "resident");
  const a = res.length ? allocate(res, g.avail, env.idx) : { got: {}, idx: {}, slack: 0 };
  for (const c of cfg) {
    if (c.residency === "resident" && a) { c.width = a.got[c.id]; c.fitIdx = a.idx[c.id]; }
    else {
      c.width = c.residency === "stacked" ? g.avail : 0;
      const [k] = bestFit(c.fits, c.width);
      c.fitIdx = Math.min(k ?? c.fits.length - 1, env.idx[c.id] ?? c.fits.length - 1);
    }
    c.fit = c.fits[c.fitIdx].variant;
  }
  const lines = cfg.find(c => c.id === "lines");
  const type  = LAW.document.types.find(t => t.id === typeId) || LAW.document.types[0];
  const order = ["simple", "standard", "pro"];
  let density = "simple";
  for (const d of [...LAW.document.density].reverse())
    if (docTableWidth(d.line_cols) <= lines.width) { density = d.id; break; }
  const ceiling = order.indexOf(density);
  const asked   = order.indexOf(wantDensity || type.density);
  const eff     = order[Math.min(ceiling, asked < 0 ? 1 : asked)];
  return { geometry: g, zones: cfg, type,
           header: g.avail >= LAW.measuredFloors.doc_header_2col ? "2col" : "1col",
           lines: { width: lines.width, variant: lines.fit },
           summary: cfg.find(c => c.id === "summary").residency,
           maxDensity: density, density: eff,
           columns: LAW.document.density.find(d => d.id === eff).line_cols };
}

const DOC_COLW = {
  idx: 28, item: 180, qty: 72, free: 64, uom: 80,
  rate: Math.ceil(measureNumber("999,999.99", LAW.typeScale.small)) + 16,
  disc: 88, tax: 72,
  total: Math.ceil(measureNumber("9,999,999.99", LAW.typeScale.small)) + 16,
  del: LAW.controlMetrics.icon_btn,
};
export const docTableWidth = cols =>
  cols.reduce((a, c) => a + (DOC_COLW[c] || 0), 0)
  + LAW.controlMetrics.gap_sm * (cols.length - 1) + 2 * C.card_pad;

/* ---------- 6b. THE DOCUMENT COMPOSER ----------------------------------
   The same move as the terminal, on the other work surface: the document is
   no longer one arrangement with breakpoints, it is a COMPOSITION.

     {details, summary, pin, split, density}

   Two things here are derived rather than chosen, and both came out of the
   sweep:

   * "specially for the Pro density" is a HEIGHT rule, not a preference.
     Sticky only works when the whole column fits on screen, and the summary
     is exactly as tall as its density's row list -- 3 rows Simple, 7
     Standard, 10 Pro. So Pro is the first density that stops being stickable
     on a laptop, and the law names it on its own.

   * The nav now knows what you composed. Section I derived the document's
     expanded_min (1708) from the DEFAULT zone weights; a wider summary
     changes that arithmetic and the sweep caught it -- at 1708 a Pro ledger
     with a 32% summary lost its tenth line column the moment the nav
     expanded. So the nav HOLDS THE RAIL wherever expanding would cost this
     composition a fit.                                                    */
const D = LAW.document, DM = D.metrics;
const dfit = (fits, px) => fits.find(f => px >= f.floor) || null;
const LINE_RANK = Object.fromEntries(D.line_fits.map((f, i) => [f.variant, i]));
const dRank = px => { const f = dfit(D.line_fits, px); return LINE_RANK[f ? f.variant : "cards"]; };

export const summaryHeight = id => {
  const n = D.density.find(x => x.id === id).summary.length;
  return DM.zone_h + (n - 1) * DM.sum_row + DM.sum_tot_row;
};
export const detailsHeight = (id, twoCol) => {
  const n = D.density.find(x => x.id === id).header.length + 1;   // + resident Notes
  const rows = twoCol ? Math.ceil(n / 2) : n;
  return DM.zone_h + rows * DM.field_row + 2 * 14 - LAW.controlMetrics.gap;
};
export const presetDocument = id =>
  JSON.parse(JSON.stringify((D.presets.find(p => p.id === id) || D.presets[0]).comp));

function docWidths(comp, avail, mobile) {
  const want = comp.summary, inner = avail - G;
  let mode = want, sumPx = 0, why = null;
  if (want === "right" || want === "auto") {
    // auto keeps the column while the lines can still hold a real TABLE;
    // an explicit `right` keeps it wherever it is physically possible.
    const f = want === "auto" ? LAW.measuredFloors.doc_table_lean
                              : LAW.measuredFloors.doc_table_card;
    const s = Math.max(LAW.measuredFloors.doc_summary_min,
              Math.min(Math.max(LAW.measuredFloors.doc_summary_min, inner - f),
                       inner * Math.max(.12, Math.min(.55, comp.split))));
    const lp = inner - s;
    if (mobile || lp < f) {
      mode = "below";
      why = `a ${LAW.measuredFloors.doc_summary_min}px column would leave the lines `
          + `${Math.round(Math.max(lp, 0))}px, under the ${f}px they need to stay a `
          + (want === "auto" ? "table" : "list");
    } else {
      mode = "right"; sumPx = s;
      const a = dfit(D.line_fits, avail), b = dfit(D.line_fits, lp);
      if (a && b && a.variant !== b.variant)
        why = `your choice — the column costs the table ${a.variant} → ${b.variant}`;
    }
  }
  if (mode === "below" && mobile) {
    mode = "off"; why = (why || "") + "; on a phone the money lives in the dock";
  }
  const linesPx = avail - (mode === "right" ? G + sumPx : 0);
  return { mode, sumPx, linesPx, why };
}

export function composeDocument(comp, vw, vh, opts = {}) {
  const m = marginAt(vw);
  vh = vh || viewportHeight(vw);
  const usable = vh - C.header_h - 2 * m;
  const mobile = vw <= LAW.pos.phoneMax;

  let navState = navDefault(vw, "document");
  const navPx = navState === "expanded" ? SIDEBAR : navState === "rail" ? railAt(vw) : 0;
  let avail = opts.navW != null ? vw - opts.navW - 2 * m : vw - navPx - 2 * m;
  let navHeld = false;
  if (opts.navW == null && navState === "expanded") {
    const alt = vw - railAt(vw) - 2 * m;
    if (dRank(docWidths(comp, alt, mobile).linesPx) < dRank(docWidths(comp, avail, mobile).linesPx)) {
      navState = "rail"; avail = alt; navHeld = true;
    }
  }

  const w = docWidths(comp, avail, mobile);
  const lineFit = dfit(D.line_fits, w.linesPx) || D.line_fits[D.line_fits.length - 1];
  const sumFit  = w.mode === "right" ? dfit(D.summary_fits, w.sumPx) : null;

  let capD = "simple";
  for (const d of D.density) if (docTableWidth(d.line_cols) <= w.linesPx) capD = d.id;
  const order = D.density.map(d => d.id);
  const density = order.indexOf(comp.density) <= order.indexOf(capD) ? comp.density : capD;

  const twoCol = avail >= LAW.measuredFloors.doc_header_2col && !mobile;
  let det = comp.details, detH = 0;
  if (det === "open") {
    detH = detailsHeight(density, twoCol);
    if (usable - detH - DM.dock_h - G < DM.lines_min_h) det = "collapsed";
  }
  if (det === "collapsed") detH = DM.strip_h;

  const sumH = summaryHeight(density);
  const colH = sumH + DM.actions_h;
  const room = usable - (w.mode === "right" ? detH : 0);
  const canStick = w.mode === "right" && colH <= room;
  let pin = comp.pin;
  if (pin === "auto") pin = canStick ? "sticky" : "dock";
  if (pin === "sticky" && !canStick) pin = "dock";
  if (w.mode === "off") pin = "dock";

  const dock = (pin === "dock" || w.mode === "below" || w.mode === "off" || mobile)
    ? [{ id: "total" }, { id: "complete", w: LAW.controlMetrics.btn_min }] : [];
  const dockH = dock.length ? DM.dock_h : 0;
  const linesH = usable - detH - dockH - (detH ? G : 0);

  return {
    vw, vh, avail, usable, nav: navState, navHeld, mobile,
    details: { mode: det, twoCol, h: detH },
    lines: { px: w.linesPx, fit: lineFit.variant, floor: lineFit.floor, h: linesH,
             rowsVisible: Math.max(0, Math.floor(linesH / DM.line_h) - 1) },
    summary: { mode: w.mode, px: w.sumPx, fit: sumFit ? sumFit.variant : null,
               h: sumH, pin, canStick },
    density, capped: density !== comp.density, wantedDensity: comp.density,
    dock, dockH, reserve: dockH ? dockH + G : 0, demoted: w.why,
    columns: D.density.find(d => d.id === density).line_cols,
    reachable: { lines: w.linesPx >= LAW.measuredFloors.doc_table_card || vw < LAW.minViewport,
                 details: true, summary: w.mode !== "off" || dock.length > 0,
                 total: dock.length > 0 || w.mode !== "off",
                 complete: dock.length > 0 || w.mode === "right" || w.mode === "below",
                 add_line: true },
  };
}

/* ---------- 7. FORMAT-TO-FIT -------------------------------------------
   A card never sizes to its worst-case number. The number formats down to
   the card and the exact value stays one hover away. This is the rule that
   makes a 20-digit + 4-decimal ledger value survivable on a 360px phone --
   at metric size that value is 723px wide and the widest card the law can
   produce is 1593px, so no card can ever be sized to it.                  */
const UNITS = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
export function formatToFit(value, availPx, fontPx, currency = "") {
  const pre = currency ? currency + " " : "";
  const r4v = Math.round(value * 1e4) / 1e4;
  const grp = (v, dp) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const full = dp => pre + grp(r4v, dp);
  const compact = dp => {
    for (const [m, sfx] of UNITS) {
      const mant = value / m;
      if (Math.abs(value) >= m && Math.abs(mant) < 1000) return pre + grp(mant, dp) + sfx;
    }
    return Math.abs(value) < 1000 ? pre + grp(value, dp) : null;
  };
  const sci = dp => pre + value.toExponential(dp).replace("e+", "E");
  // Decide the 4dp rung from a value rounded to 4dp, not from the raw float.
  // 30000 - 24886.20 is 5113.799999999999 in binary floating point, whose
  // decimal string has twelve digits — which read as "this value carries 4dp"
  // and printed the change as 5,113.8000.
  const r4 = Math.round(value * 1e4) / 1e4;
  const dp4 = ((String(r4).split(".")[1]) || "").length > 2;
  const small = Math.abs(value) < 1000;
  const bare = t => (t ? t.replace(pre, "") : null);
  const rungs = [dp4 ? full(4) : null, full(2), bare(full(2)),
    small ? null : compact(2), small ? null : bare(compact(2)),
    small ? null : compact(1), small ? null : compact(0),
    small ? null : bare(compact(0)), sci(2), sci(1)].filter(Boolean);
  const exact = full(2);
  for (const r of rungs)
    if (measureNumber(r, fontPx) <= availPx)
      return { text: r, exact, truncated: r !== exact, rung: rungs.indexOf(r) };
  const last = rungs[rungs.length - 1];
  return { text: last, exact, truncated: true, rung: rungs.length - 1 };
}

/* ---------- 8. VALIDATE -------------------------------------------------
   An illegal layout is REJECTED before render, not warned about after.
   This is the contract that lets Reckoner author dashboards: it emits card
   descriptors, the engine turns them into geometry, and a descriptor list
   that would produce an illegal layout never reaches the DOM.            */
export function validate(cards, vw, opts = {}) {
  const g = geometry(vw, opts);
  const res = cards.map(c => resolveCard(c.catId, g, c.variant));
  const errors = [];
  res.forEach((c, i) => {
    const cat = LAW.categories.find(x => x.id === c.catId);
    if (!cat) return errors.push({ i, code: "UNKNOWN_CATEGORY", catId: c.catId });
    if (c.cols > g.cols)     errors.push({ i, code: "OVERFLOW_GRID", cols: c.cols, of: g.cols });
    if (c.cols > cat.max[0]) errors.push({ i, code: "ABOVE_MAX_COLS", cols: c.cols, max: cat.max[0] });
    if (c.rows > cat.max[1]) errors.push({ i, code: "ABOVE_MAX_ROWS", rows: c.rows, max: cat.max[1] });
    if (!c.ok)               errors.push({ i, code: "BELOW_FLOOR", px: Math.round(c.px), floor: c.floor });
  });
  return { valid: errors.length === 0, errors, geometry: g };
}

/* ---------- 9. EDIT MODE ------------------------------------------------
   Edit mode changes what the USER may change, never what the LAW allows.
   Every gesture is snapped to the law before it is committed, so a user
   cannot save a layout the law would reject -- the resize handle simply
   stops at the category floor and at the category maximum.               */
export const editGrants = () => LAW.edit.grants;
export function snapResize(catId, cols, rows) {
  const cat = LAW.categories.find(c => c.id === catId);
  const minC = Math.min(...cat.fits.map(f => f.cols));
  const minR = Math.min(...cat.fits.map(f => f.rows));
  return { cols: Math.max(minC, Math.min(cat.max[0], Math.round(cols))),
           rows: Math.max(minR, Math.min(cat.max[1], Math.round(rows))) };
}

/* ---------- 9b. PLACEMENT: Flow vs Free --------------------------------
   Flow stores {order, fit} and no position, so no position can be wrong.
   Free stores a BOX {col,row,w,h} plus the COLUMN CLASS it was authored in,
   and gaps are preserved: nothing is pulled left and nothing is pulled up.

   Between classes the box scales by the ratio -- Gridstack's `moveScale`,
   "scale and move items by the ratio of newColumnCount / oldColumnCount" --
   then collisions settle DOWNWARD ONLY. Down-only is the whole reason the
   right side stays empty if you left it empty.

   round() is lossy, so the one rule that keeps a layout from drifting as the
   window is resized is: ALWAYS PROJECT FROM AN AUTHORED CLASS, NEVER FROM A
   PROJECTION. One hop, ever.                                              */

/* The richest fit that fits INSIDE a w x h box. This is resolveCard() read
   backwards: resolveCard asks "how wide must the box be for this fit", a
   resize handle asks "what is the best thing I can put in this box". Same
   ordered fits, same floors, so they can never disagree.                  */
export function fitInBox(catId, w, h, col) {
  const cat = typeof catId === "string" ? LAW.categories.find(c => c.id === catId) : catId;
  const px = width(w, col);
  for (const f of cat.fits)
    if (f.cols <= w && (f.rows || 1) <= h && px >= f.floor) return f;
  return null;
}

/* Where the resize handle STOPS. It does not warn and it does not snap back
   from an illegal box -- it simply does not travel there.                 */
export function boxLimits(catId, geo) {
  const cat = typeof catId === "string" ? LAW.categories.find(c => c.id === catId) : catId;
  const wmax = Math.min(cat.max[0], geo.cols), hmax = cat.max[1];
  let wmin = null;
  for (let w = 1; w <= wmax; w++) if (fitInBox(cat, w, hmax, geo.col)) { wmin = w; break; }
  const underflow = wmin == null;
  if (underflow) wmin = wmax;
  const hmin = {};
  for (let w = wmin; w <= wmax; w++) {
    hmin[w] = hmax;
    for (let h = 1; h <= hmax; h++) if (fitInBox(cat, w, h, geo.col)) { hmin[w] = h; break; }
  }
  return { wmin, wmax, hmax, hmin, underflow };
}

const hits = (a, b) => a.col < b.col + b.w && b.col < a.col + a.w &&
                       a.row < b.row + b.h && b.row < a.row + a.h;

export function projectBox(b, fromN, toN) {
  const r = toN / fromN;
  const w = Math.max(1, Math.min(toN, Math.round(b.w * r)));
  const c = Math.max(0, Math.min(toN - w, Math.round(b.col * r)));
  return { ...b, col: c, w, row: b.row, h: b.h };
}

/* Push DOWN only, in row-major order. Never left, never up. */
export function settle(boxes) {
  const placed = [];
  for (const src of [...boxes].sort((a, b) => a.row - b.row || a.col - b.col)) {
    const b = { ...src };
    for (let moved = true; moved; ) {
      moved = false;
      for (const p of placed) if (hits(p, b)) { b.row = p.row + p.h; moved = true; }
    }
    placed.push(b);
  }
  return placed;
}

/* The ratio rule is pure arithmetic and does not know what is IN the box. A
   C3 metric scaled 24 -> 8 lands 1 column wide, and 1 column holds no fit at
   all. So every projected box is clamped back into its category's own travel
   before it settles -- the same travel the resize handle uses.            */
export function clampBox(b, geo) {
  if (!b.catId) return { ...b };
  const lim = boxLimits(b.catId, geo);
  const w = Math.max(lim.wmin, Math.min(lim.wmax, b.w));
  const h = Math.max(lim.hmin[w] ?? 1, Math.min(lim.hmax, b.h));
  return { ...b, col: Math.max(0, Math.min(geo.cols - w, b.col)), w, h };
}

export function projectLayout(boxes, fromN, toN, geo) {
  if (fromN === toN && !geo) return boxes.map(b => ({ ...b }));
  let out = boxes.map(b => projectBox(b, fromN, toN));
  if (geo) out = out.map(b => clampBox(b, geo));
  return settle(out);
}

/* store = { <N>: [box,...] } of AUTHORED classes only. */
export function layoutFor(store, n, geo) {
  const keys = Object.keys(store).map(Number).sort((a, b) => a - b);
  if (!keys.length) return [];
  if (store[n]) return geo ? settle(store[n].map(b => clampBox(b, geo)))
                           : store[n].map(b => ({ ...b }));
  const above = keys.filter(k => k > n), below = keys.filter(k => k < n);
  const src = above.length ? above[0] : below[below.length - 1];
  return projectLayout(store[src], src, n, geo);
}

/* Row-major. One reading order in both modes, so a Free layout still stacks
   sensibly on a phone and still makes sense to a screen reader.           */
export const readingOrder = boxes =>
  [...boxes].sort((a, b) => a.row - b.row || a.col - b.col).map(b => b.id);

export const freeAllowed = geo => geo.cols >= LAW.placement.min_free_cols;

/* Flow -> Free: hand the packer's own answer back as boxes, so switching
   modes never moves anything on the screen it was switched on.            */
export function boxesFromBands(bands) {
  const out = []; let row = 0;
  for (const band of bands) {
    let col = 0;
    for (const c of band.cards) { out.push({ id: c.id, col, row, w: c.cols, h: c.rows });
                                  col += c.cols; }
    row += band.rows;
  }
  return out;
}

/* ---------- 9c. SPLITTER -----------------------------------------------
   A splitter stops where the No-Regression Rule says the region beside it
   would lose a fit. Pushing: vw - 2*margin - contentFloor. Overlaying: the
   nav costs the content nothing, so the stop is instead the widest sidebar
   the narrowest PUSHING screen can carry -- 1216 - 48 - 904 = 264.       */
export function contentFloor(arch = "dashboard") {
  return LAW.contentFloors[arch] ?? LAW.contentFloors.dashboard;
}
export function navTravel(vw, arch = "dashboard") {
  const m = marginAt(vw), push = navBehaviour(vw) === "push";
  const min = push ? railAt(vw) : 0;
  let max = push ? vw - 2 * m - contentFloor(arch)
                 : LAW.nav.push_min - 2 * M_DESK - contentFloor(arch);
  max = Math.max(min, Math.min(max, vw - LAW.nav.drawer_peek));
  return { min, max, behaviour: push ? "push" : "overlay" };
}
export function navSnaps(vw, arch = "dashboard") {
  const { min, max } = navTravel(vw, arch), m = marginAt(vw), out = new Map();
  const r = Math.round(railAt(vw));
  if (r > 0 && r >= min && r <= max) out.set(r, "rail");
  if (SIDEBAR >= min && SIDEBAR <= max) out.set(SIDEBAR, "default");
  const legal = vw >= LAW.nav.rail_min ? LAW.legalColumnCounts.desktop
                                       : LAW.legalColumnCounts.tablet;
  for (const n of legal) {
    const w = Math.round(vw - 2 * m - span(n, TARGET));
    if (w >= min && w <= max && w >= RAIL && !out.has(w))
      out.set(w, `${n} columns at exactly ${TARGET}px`);
  }
  const kept = [];
  for (const px of [...out.keys()].sort((a, b) => a - b))
    if (!kept.length || px - kept[kept.length - 1].px > LAW.splitter.snap_px)
      kept.push({ px, why: out.get(px) });
  return kept;
}
export function snapNav(px, vw, arch = "dashboard") {
  const { min, max } = navTravel(vw, arch);
  const v = Math.max(min, Math.min(max, px));
  let best = null;
  for (const s of navSnaps(vw, arch))
    if (!best || Math.abs(s.px - v) < Math.abs(best.px - v)) best = s;
  if (best && Math.abs(best.px - v) <= LAW.splitter.snap_px)
    return { px: best.px, snapped: best.why };
  return { px: Math.round(v), snapped: null };
}

/* ---------- 10. APPLY ---------------------------------------------------
   The engine writes three custom properties and one data attribute. Every
   other layout decision in the product reads from those, which is why there
   is exactly one place to change any of this.                            */
export function apply(el, vw, opts = {}) {
  const g = geometry(vw, opts);
  el.style.setProperty("--vq-cols", g.cols);
  el.style.setProperty("--vq-margin-now", g.margin + "px");
  const sh = el.closest("[data-nav]") || document.querySelector(".vq-shell");
  if (sh) {
    sh.dataset.nav = g.nav;
    sh.dataset.behaviour = g.shell.behaviour;
    sh.style.setProperty("--vq-nav-w", g.navW + "px");
  }
  return g;
}

export default { LAW, geometry, shell, navDefault, navBehaviour, drawerWidth,
                 resolveCard, packCards, layoutDashboard, composeTerminal,
                 presetComposition, paneFit,
                 layoutDocument, formatToFit, measureNumber, validate,
                 snapResize, apply, span, height, width, marginAt, railAt,
                 terminalHeight, viewportHeight, docTableWidth,
                 composeDocument, presetDocument, summaryHeight, detailsHeight,
                 fitInBox, boxLimits, projectBox, projectLayout, settle,
                 layoutFor, readingOrder, freeAllowed, boxesFromBands, clampBox,
                 contentFloor, navTravel, navSnaps, snapNav };
'''

(OUT / "venqore-layout-engine.js").write_text(
    JS.replace("__LAW__", json.dumps(RUNTIME, indent=1)))
print("engine:", (OUT / "venqore-layout-engine.js").stat().st_size, "bytes")
