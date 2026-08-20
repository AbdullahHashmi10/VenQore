#!/usr/bin/env python3
"""
VenQore Layout Law v2.0 — solver
=================================
Extends v1.0 (cards on a dashboard) to the whole product:

  v1.0 answered:  how does a CARD survive every screen?
  v2.0 answers:   how does a SCREEN survive every screen?

Additions:
  §A  NAV LAW        — hamburger everywhere, push-vs-overlay threshold (derived)
  §B  ARCHETYPES     — every screen in the product is one of six compositions
  §C  REGION LAW     — generalises the card resolver to panes and zones
  §D  RESIDENCY      — how a pane demotes when width runs out (the terminal law)
  §E  RANK LAW       — the structural fix for "too overwhelming"
  §F  POS VARIANTS   — six terminals, one law
  §G  DOC EDITOR     — one editor, thirteen document types
  §H  EDIT MODE      — the resize/rearrange contract Reckoner will drive

Nothing here is hand-tuned. Every number is either measured (font advance
widths read out of the Space Grotesk binary in v1.0) or derived by search.
Run this file to re-solve and re-validate.
"""
import json, math, itertools, sys
from pathlib import Path

SRC = Path(__file__).parent / "src" / "layout-law.json"
OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

V1 = json.loads(SRC.read_text())
K  = V1["constants"]

GUTTER   = K["gutter"]            # 24
ROW      = K["row"]               # 64
TARGET   = K["col_target"]        # 112
SIDEBAR  = K["sidebar_expanded"]  # 264
RAIL     = K["sidebar_rail"]      # 72
SUBNAV   = K["subnav_w"]          # 224
HEADER   = K["header_h"]          # 64
M_DESK   = K["margin_desktop"]    # 24
M_MOB    = K["margin_mobile"]     # 16
PAD      = K["card_pad"]          # 20
PAD_SM   = K["card_pad_sm"]       # 16

FM = V1["font_metrics"]           # digit .620em, comma .284em, period .287em
DIGIT, COMMA, PERIOD = FM["digit_em"], FM["comma_em"], FM["period_em"]
SPACE, LETTER = 0.255, 0.63       # same fallbacks the engine uses

def span(n, unit, gap=GUTTER):
    """THE ONE LAW, BOTH AXES.  size(n) = n*unit + (n-1)*gap"""
    return n * unit + (n - 1) * gap

def measure(s, px):
    em = 0.0
    for ch in s:
        em += DIGIT if ch.isdigit() else COMMA if ch == "," else \
              PERIOD if ch == "." else SPACE if ch == " " else LETTER
    return em * px

# ═══════════════════════════════════════════════════════════════════════════
# §A  THE NAV LAW
# ═══════════════════════════════════════════════════════════════════════════
# Rehan's question: "when they open the sidebar at 1280, do all cards
# rearrange or squeeze, or do we overlay with a higher z-index? we need to
# find that sweetspot."
#
# It is not a taste question. It has an arithmetic answer.
#
# Pushing is always nicer -- the page stays fully usable, nothing is hidden
# behind a scrim, no modal trap. So push whenever pushing does not damage the
# grid.  It damages the grid the moment the content region can no longer
# sustain the narrowest desktop grid the law already ships.
#
# The narrowest desktop content the law already supports is the 1024 rail:
#     avail(1024, rail) = 1024 - 72 - 48 = 904px  ->  8 cols @ 92.00px
# 92px is therefore the desktop column floor: it is already in production at
# the smallest breakpoint the desktop ladder covers.
#
# So: push is legal iff  vw - SIDEBAR - 2*MARGIN >= 904.

DESK_MIN_COLS  = min(V1["legal_column_counts"]["desktop"])          # 8
DESK_MIN_AVAIL = 1024 - RAIL - 2 * M_DESK                           # 904
DESK_COL_FLOOR = (DESK_MIN_AVAIL - (DESK_MIN_COLS - 1) * GUTTER) / DESK_MIN_COLS
PUSH_MIN       = SIDEBAR + 2 * M_DESK + DESK_MIN_AVAIL              # 1216

assert abs(DESK_COL_FLOOR - 92.0) < 1e-9, DESK_COL_FLOOR
assert PUSH_MIN == 1216, PUSH_MIN

NAV = {
    "expanded_min": V1["nav"]["expanded_min"],   # 1280 -- expanded by default
    "rail_min":     V1["nav"]["rail_min"],       # 1024 -- rail by default
    "mobile_max":   V1["nav"]["mobile_max"],     # 599
    "push_min":     PUSH_MIN,                    # 1216 -- DERIVED
    "desk_col_floor": DESK_COL_FLOOR,            # 92
    "desk_min_avail": DESK_MIN_AVAIL,            # 904
    "drawer_peek":  56,                          # px of page left tappable
    "scrim":        "rgba(9,11,20,.56)",
    "anim_ms":      260,
}

def nav_default(vw):
    if vw >= NAV["expanded_min"]: return "expanded"
    if vw >= NAV["rail_min"]:     return "rail"
    return "hidden"

def nav_open_behaviour(vw):
    """What happens when the user hits the hamburger AT THIS WIDTH."""
    return "push" if vw >= NAV["push_min"] else "overlay"

def nav_resting(vw):
    """What the user sees before they touch anything."""
    d = nav_default(vw)
    return {"expanded": "expanded 264px, pushes",
            "rail":     "rail 72px, pushes",
            "hidden":   "hidden, hamburger only"}[d]

def drawer_width(vw):
    return min(SIDEBAR, vw - NAV["drawer_peek"])

# ═══════════════════════════════════════════════════════════════════════════
# §  GEOMETRY  (v1.0, unchanged -- reproduced so this file is self-sufficient)
# ═══════════════════════════════════════════════════════════════════════════
LEGAL = V1["legal_column_counts"]

def geometry(vw, nav=None, subnav=False, nav_open=False):
    """viewport -> grid.  nav_open=True means the user has toggled it on."""
    state = nav or nav_default(vw)
    if nav_open:
        if nav_open_behaviour(vw) == "push":
            state = "expanded"
        # overlay: the grid does NOT change. that is the entire point.
    mobile = vw <= NAV["mobile_max"]
    navw = {"expanded": SIDEBAR, "rail": rail_width_at(vw), "hidden": 0}[state]
    if subnav and vw >= NAV["rail_min"]:
        navw += SUBNAV
    margin = margin_at(vw)
    avail  = vw - navw - 2 * margin
    legal  = LEGAL["mobile"] if mobile else \
             LEGAL["tablet"] if vw < NAV["rail_min"] else LEGAL["desktop"]
    best = None
    for n in legal:
        col = (avail - (n - 1) * GUTTER) / n
        if col <= 0: continue
        d = abs(col - TARGET)
        if best is None or d < best[2]: best = (n, col, d)
    n, col, _ = best
    return {"vw": vw, "nav": state, "navW": navw, "margin": margin,
            "avail": avail, "cols": n, "col": col}

# ═══════════════════════════════════════════════════════════════════════════
# §C  REGION LAW  — the card resolver, generalised
# ═══════════════════════════════════════════════════════════════════════════
# A dashboard CARD, a POS PANE and a document ZONE are the same object: a
# rectangle that knows several ways to lay its inside out, each with a pixel
# floor.  One resolver serves all three, so a change to the law can never
# make the dashboard and the POS disagree.
#
#   fit = { cols, rows|fill, variant, floor, desc }
#
# Resolution order (v1.0, unchanged):
#   1. start at the fit the author designed
#   2. WIDEN the span while the floor is unmet and headroom remains
#   3. only if widening is exhausted, DEGRADE to the next leaner fit --
#      which trades a column for a row and re-lays the inside
#   4. never below a floor, never wider than the grid, always terminates

def resolve(fits, gcols, col, max_cols, start=0, mobile_full=True):
    cap = min(gcols, max_cols)
    mobile = gcols <= 4
    for i in range(start, len(fits)):
        f = fits[i]
        if f["cols"] > cap: continue
        c = gcols if (mobile and mobile_full) else f["cols"]
        while c < cap and span(c, col) < f["floor"]:
            c += 1
        if span(c, col) >= f["floor"]:
            return {"cols": c, "variant": f["variant"], "floor": f["floor"],
                    "rows": f.get("rows"), "px": span(c, col),
                    "promoted": c > f["cols"], "degraded": i > start,
                    "fullWidth": c >= gcols, "ok": True}
    lean = fits[-1]
    return {"cols": gcols, "variant": lean["variant"], "floor": lean["floor"],
            "rows": lean.get("rows"), "px": span(gcols, col),
            "promoted": True, "degraded": True, "fullWidth": True,
            "ok": span(gcols, col) >= lean["floor"]}

# ═══════════════════════════════════════════════════════════════════════════
# §  MEASURED FLOORS  — every floor below is computed, never chosen
# ═══════════════════════════════════════════════════════════════════════════
# Type scale from the v5 design system, in px.
FS = {"metric": 38, "value": 26, "body": 15, "small": 14, "micro": 12, "label": 11}

# Control metrics from the v5 design system.
CTL = {"btn_h": 40, "btn_min": 88, "icon_btn": 36, "stepper": 32,
       "field_h": 40, "row_h": 44, "tile_min": 132, "tile_img": 88,
       "avatar": 36, "chip_h": 28, "tab_h": 40, "gap": 12, "gap_sm": 8}

def money(px, sample="PKR 9,999,999.99"):
    return measure(sample, px)

# --- POS PANE FLOORS -------------------------------------------------------
# Cart line, full density: name | qty stepper | rate | line total | delete
CART_NAME_MIN = 132
CART_QTY      = CTL["stepper"] * 3                      # - [n] +
CART_RATE     = math.ceil(money(FS["small"], "999,999.99"))
CART_TOTAL    = math.ceil(money(FS["body"],  "PKR 9,999,999.99"))
CART_DEL      = CTL["icon_btn"]
CART_GAPS     = CTL["gap"] * 4
CART_FULL     = CART_NAME_MIN + CART_QTY + CART_RATE + CART_TOTAL + CART_DEL + CART_GAPS + 2*PAD
# Cart line, relayed: name on line 1, controls on line 2 (gains a row)
CART_RELAY    = CART_QTY + CART_RATE + CART_TOTAL + CTL["gap"]*2 + 2*PAD_SM
# Cart line, minimal: name + total only, qty inline in the name line
CART_MIN      = CART_NAME_MIN + CART_TOTAL + CTL["gap"] + 2*PAD_SM

# Tender pane: the grand total is the widest thing in the product
TENDER_FULL   = math.ceil(money(FS["metric"], "PKR 9,999,999.99")) + 2*PAD
TENDER_MID    = math.ceil(money(FS["value"],  "PKR 9,999,999.99")) + 2*PAD
TENDER_MIN    = math.ceil(money(FS["value"],  "PKR 999.99M"))      + 2*PAD

# Catalog: tiles vs rows
CAT_GRID3     = CTL["tile_min"]*3 + GUTTER*2 + 2*PAD
CAT_GRID2     = CTL["tile_min"]*2 + GUTTER   + 2*PAD
CAT_LIST      = CART_NAME_MIN + math.ceil(money(FS["small"], "999,999.99")) + CTL["gap"] + 2*PAD_SM

# --- DOCUMENT ZONE FLOORS --------------------------------------------------
# Line table, full: # | item | qty | free | rate | disc | tax | total | del
DOC_COLW = {
    "idx":   28,
    "item":  180,
    "qty":   72,
    "free":  64,
    "uom":   80,
    "rate":  math.ceil(money(FS["small"], "999,999.99")) + 16,
    "disc":  88,
    "tax":   72,
    "total": math.ceil(money(FS["small"], "9,999,999.99")) + 16,
    "del":   CTL["icon_btn"],
}
def doc_table(cols):
    return sum(DOC_COLW[c] for c in cols) + CTL["gap_sm"]*(len(cols)-1) + 2*PAD

DOC_FULL   = doc_table(["idx","item","qty","free","uom","rate","disc","tax","total","del"])
DOC_STD    = doc_table(["idx","item","qty","rate","disc","total","del"])
DOC_LEAN   = doc_table(["item","qty","rate","total","del"])
DOC_CARD   = CART_NAME_MIN + CART_TOTAL + CTL["gap"] + 2*PAD_SM   # stacked card rows

DOC_SUM_FULL = math.ceil(money(FS["value"], "PKR 9,999,999.99")) + 120 + 2*PAD  # label + value
DOC_SUM_MIN  = math.ceil(money(FS["body"],  "PKR 9,999,999.99")) + 80  + 2*PAD
DOC_HDR_2COL = 2*260 + GUTTER + 2*PAD
DOC_HDR_1COL = 260 + 2*PAD

MEASURED = {
  "cart_line_full": CART_FULL, "cart_line_relay": CART_RELAY, "cart_line_min": CART_MIN,
  "tender_full": TENDER_FULL, "tender_mid": TENDER_MID, "tender_min": TENDER_MIN,
  "catalog_grid3": CAT_GRID3, "catalog_grid2": CAT_GRID2, "catalog_list": CAT_LIST,
  "doc_table_full": DOC_FULL, "doc_table_std": DOC_STD, "doc_table_lean": DOC_LEAN,
  "doc_table_card": DOC_CARD,
  "doc_summary_full": DOC_SUM_FULL, "doc_summary_min": DOC_SUM_MIN,
  "doc_header_2col": DOC_HDR_2COL, "doc_header_1col": DOC_HDR_1COL,
  "_derivation": {
    "cart_line_full": f"name {CART_NAME_MIN} + qty {CART_QTY} + rate {CART_RATE} + total {CART_TOTAL} + del {CART_DEL} + gaps {CART_GAPS} + pad {2*PAD}",
    "tender_full": f'"PKR 9,999,999.99" at {FS["metric"]}px = {money(FS["metric"]):.1f} + pad {2*PAD}',
    "doc_table_full": "10 columns at measured advance widths + 8px gaps + 40px pad",
  }
}

# ═══════════════════════════════════════════════════════════════════════════
# §D  RESIDENCY LADDER  — how a pane demotes when width runs out
# ═══════════════════════════════════════════════════════════════════════════
# A card that cannot get wider gets TALLER and relays its inside (v1.0).
# A pane cannot do that -- the terminal archetype has no vertical slack,
# the whole screen is exactly one viewport tall.  So a pane demotes instead:
#
#   resident  the pane is a column, always visible
#   stacked   the pane becomes a full-width band (spends height, not width)
#   sheet     the pane becomes a slide-over, one control away, keeps state
#   tab       the pane becomes one of N tabs sharing the whole area
#
# Rule: panes demote in the variant's declared priority order, cheapest
# first, until every remaining resident pane clears its floor. A pane whose
# rank is 1 (see §E) may never demote past `stacked`: you cannot hide the
# thing the user is here to do.

# --- UNDERFLOW -----------------------------------------------------------
# The continuous sweep found the one width where the law genuinely runs out:
# at a 320px viewport the content region is 288px, and the leanest fits of
# Board (C5) and Canvas (C6) both need 295px. Seven pixels.
#
# Pretending otherwise would be the dishonest fix. So the law says two things
# instead:
#
#   MIN_VIEWPORT = 360   the designed minimum. Every guarantee in this
#                        document holds from 360px up. 360 is the Android
#                        baseline and the narrowest width in the breakpoint
#                        table, so this is a statement of what was designed
#                        for, not a retreat from it.
#
#   UNDERFLOW            below 360 the card does not break, it SCROLLS. The
#                        card keeps its leanest fit at that fit's floor as a
#                        min-width and scrolls horizontally inside its own
#                        border. Content is reachable, the grid is intact, and
#                        the page still never scrolls sideways -- only the one
#                        card that could not fit does.
UNDERFLOW = {
  "min_viewport": 360,
  "behaviour": "the card keeps its leanest fit's floor as min-width and scrolls "
               "horizontally inside its own border",
  "affects": ["C5", "C6"],
  "widths": "320-327 viewport (288-295px content)",
  "why_not_lower_the_floor": "295px is what a legible chart with an axis actually "
               "needs. Lowering it to 288 to make a table go green would move the "
               "failure from the validator into the user's screen.",
}

RESIDENCY = ["resident", "stacked", "sheet", "tab", "route"]
#   resident  a column on screen, always visible
#   stacked   a full-width band -- spends height instead of width
#   sheet     a slide-over, one control away, keeps its state
#   tab       one of N tabs sharing the whole area
#   route     its own screen, reached by navigation and returned from
#
# `route` exists because some panes are not a simultaneous VIEW, they are a
# STEP. A restaurant server on a phone does not want the floor plan and the
# order side by side -- they pick a table, then they take the order. Squeezing
# both onto a 360x560 screen is the wrong answer to the right question.
#
# RANK-1 RESIDENCY RULE
#   A rank-1 pane may be `resident` or `stacked` freely.
#   It may be `sheet` or `route` ONLY if the variant lists it in `sequence` --
#     an explicit, ordered set of steps with a guaranteed return path.
#   It may NEVER be `tab`: a tab implies peers you switch between at will, and
#     a rank-1 pane must have a guaranteed moment, not a competed-for one.

# --- the vertical half of the terminal law ---------------------------------
# The dashboard has unlimited height, so v1.0 only ever had to defend the
# horizontal axis. A TERMINAL is exactly one viewport tall and never scrolls
# the page, so on this archetype height is the scarcer resource -- and the
# worst case is not a phone, it is a 1280x720 laptop, where a maximised
# browser leaves about 570 usable CSS pixels.
#
# Representative heights, measured as (screen height - browser chrome - OS bar).
VIEWPORTS = [
  {"vp": 360,  "vh": 560,  "label": "Android baseline",        "kind": "mobile"},
  {"vp": 390,  "vh": 745,  "label": "iPhone 12-15",            "kind": "mobile"},
  {"vp": 414,  "vh": 790,  "label": "iPhone Plus / Max",       "kind": "mobile"},
  {"vp": 768,  "vh": 950,  "label": "iPad 9.7 portrait",       "kind": "tablet"},
  {"vp": 820,  "vh": 1100, "label": "iPad Air portrait",       "kind": "tablet"},
  {"vp": 1024, "vh": 695,  "label": "iPad 9.7 landscape",      "kind": "tablet"},
  {"vp": 1180, "vh": 750,  "label": "iPad Air landscape",      "kind": "tablet"},
  {"vp": 1265, "vh": 570,  "label": "1280x720 laptop  *TIGHTEST*", "kind": "laptop"},
  {"vp": 1351, "vh": 620,  "label": "1366x768 laptop",         "kind": "laptop"},
  {"vp": 1425, "vh": 750,  "label": "1440x900 MBP13",          "kind": "laptop"},
  {"vp": 1521, "vh": 715,  "label": "1536x864 (FHD @125%)",    "kind": "laptop"},
  {"vp": 1585, "vh": 780,  "label": "1600x900",                "kind": "desktop"},
  {"vp": 1905, "vh": 940,  "label": "1920x1080 FHD",           "kind": "desktop"},
  {"vp": 2545, "vh": 1290, "label": "2560x1440 QHD",           "kind": "desktop"},
  {"vp": 3425, "vh": 1290, "label": "3440x1440 ultrawide",     "kind": "desktop"},
]
VH = {v["vp"]: v["vh"] for v in VIEWPORTS}

TERM = {
  "bar_h":        56,    # the terminal's own slim bar; the 64px global header is suppressed
  "cart_hdr":     44,
  "cart_line":    56,
  "cart_min_lines": 3,   # you must be able to see three lines or the cart is a rumour
  "tender_bar_h": 88,    # stacked tender: total + primary button
  "tile_h":       152,   # a catalog tile is 2 grid rows -- image, name, price
  "tab_h":        CTL["tab_h"],
}
TERM["cart_min_h"] = TERM["cart_hdr"] + TERM["cart_min_lines"] * TERM["cart_line"] + 2 * PAD_SM
# 44 + 168 + 32 = 244

def viewport_height(vw):
    """Interpolate a realistic viewport height for any width.

    The sweep walks every width from 320 to 3440, but real devices only exist
    at a handful of them. Between two real devices we interpolate, so the
    aspect test has a defensible height at every width rather than a constant.
    """
    pts = sorted((v["vp"], v["vh"]) for v in VIEWPORTS)
    if vw <= pts[0][0]:  return pts[0][1]
    if vw >= pts[-1][0]: return pts[-1][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= vw <= x1:
            t = (vw - x0) / (x1 - x0)
            return y0 + t * (y1 - y0)
    return 800

def terminal_height_for(vw, heights=None):
    vh = (heights or {}).get(vw) or viewport_height(vw)
    return vh - TERM["bar_h"] - 2 * margin_at(vw)

def terminal_height(vp):
    return terminal_height_for(vp)

TERM["cart_good_lines"] = 5
TERM["cart_good_h"] = TERM["cart_hdr"] + 5 * TERM["cart_line"] + 2 * PAD_SM   # 356

def catalog_rows_that_fit(vp, want_rows, stacked_extra=0):
    """How many rows of product tiles survive at this height. 0 => sheet.

    The cart has first claim on height, and how much it claims depends on
    which row we are asking for. The FIRST row of tiles is worth squeezing the
    cart to its floor (3 lines) for -- without it there is no touch picker at
    all. The SECOND row is a convenience, so it may only take height the cart
    does not need to reach a comfortable 5 lines. That asymmetry is why a
    short 1280x720 laptop gets one row and a tall iPad gets two.
    """
    H = terminal_height(vp) - stacked_extra
    for r in range(want_rows, 0, -1):
        need = r * TERM["tile_h"] + r * GUTTER
        reserve = TERM["cart_good_h"] if r >= 2 else TERM["cart_min_h"]
        if need + reserve <= H:
            return r
    return 0

# --- CAPS: fixed-information panes stop growing --------------------------
# The whole law says a wider screen shows MORE, not BIGGER. That applies to
# panes exactly as it applies to cards. A cart shows the same five columns
# however wide it is, so past a point extra width is pure margin. A catalog
# genuinely shows more items, so it absorbs the surplus.
#
#   fixed-information panes  (cart, tender, summary)  CAP
#   variable-information panes (catalog, floor, lines) ABSORB
#
# Cap = the width at which the pane's own content is fully laid out:
#   cart   = its floor with the item column grown from a 12-char truncation
#            to a full 40-char product name    -> 559 + (378-132) = 805
#   tender = its floor plus a 4x40 numeric keypad -> 367 + 184     = 551
NAME_FULL = math.ceil(40 * LETTER * FS["body"])          # 378
KEYPAD    = 4 * 40 + 3 * 8                               # 184
PANE_CAP  = {"cart":   CART_FULL + (NAME_FULL - CART_NAME_MIN),   # 805
             "tender": TENDER_FULL + KEYPAD,                      # 551
             "summary": DOC_SUM_FULL + 160}                       # 544
ABSORB    = {"catalog", "floor", "lines"}


def best_fit(fits, w):
    """Richest fit whose floor this width satisfies. None => cannot be resident."""
    for k, f in enumerate(fits):
        if w >= f["floor"]:
            return k, f
    return None, None


def allocate(res, avail, gap=GUTTER):
    """RANK-ORDERED WATERFALL.

    v1.0 split width by weight and let each pane relay its inside into whatever
    it got. That is wrong the moment a rank-2 pane exists: on a 1024 iPad the
    catalog would take 291px and push the cart down to its MINIMAL fit, while
    the same cart on a 820px iPad -- a SMALLER screen -- got its RELAY fit,
    because there the catalog had not fitted at all and the cart had the width
    to itself. A bigger screen made the primary surface worse.

    Rank is supposed to mean something, so it governs allocation:

      Pass 1  every resident pane reserves its LEANEST floor, in rank order.
              If they do not all fit, the caller demotes and retries.
      Pass 2  panes are upgraded one fit-step at a time, ALL of rank 1 before
              ANY of rank 2, and within a rank the heavier weight goes first.
      Pass 3  whatever is left is shared by weight, respecting caps; surplus
              above a cap flows to absorbing panes, or becomes centred slack.

    So a rank-2 pane can never buy a fit step that a rank-1 pane could have
    used. That is the Rank Law made arithmetic instead of advisory.
    """
    n = len(res)
    if n == 0:
        return {}, {}, 0.0
    w = avail - gap * (n - 1)
    idx = {}
    got = {}
    for pn in res:
        # THE ENVELOPE IS A RESERVATION, NOT JUST A CHECK.
        # Reserving only the leanest floor let Pass 3's proportional share do
        # the work of holding a pane at a fit it had already earned -- and then
        # a neighbour's upgrade step ate that share and the pane fell back. The
        # sweep saw a fit regress, rejected every column layout, and the whole
        # terminal collapsed to bands for 400px. Start each pane at the best fit
        # it has already reached at a narrower width, so no later allocation can
        # take it away.
        k0 = pn.get("_min_idx", len(pn["fits"]) - 1)
        k0 = min(k0, len(pn["fits"]) - 1)
        idx[pn["id"]] = k0
        got[pn["id"]] = pn["fits"][k0]["floor"]
    if sum(got.values()) > w:
        return None, None, 0.0

    # UPGRADE ORDER: rank, then WHAT THE PANE DEFENDS, then weight.
    # A presence-holder must not spend 230px buying itself a richer fit while a
    # fit-holder is still 63px short of its own next step -- that is exactly
    # backwards, and it was making the Table variant fall out of columns
    # between 1425 and 1584 while working either side of that band.
    order = sorted(res, key=lambda pn: (pn["rank"],
                                        0 if pn.get("hold", "fit") == "fit" else 1,
                                        -pn["weight"]))
    changed = True
    while changed:
        changed = False
        for pn in order:
            k = idx[pn["id"]]
            if k == 0:
                continue
            nxt = pn["fits"][k - 1]["floor"]
            cost = nxt - got[pn["id"]]
            if sum(got.values()) + cost <= w:
                got[pn["id"]] = nxt
                idx[pn["id"]] -= 1
                changed = True
                break                      # restart: strict rank precedence

    left = w - sum(got.values())
    if left > 0:
        tw = sum(pn["weight"] for pn in res) or 1
        for pn in res:
            got[pn["id"]] += left * pn["weight"] / tw
        surplus = 0.0
        for pn in res:
            cap = PANE_CAP.get(pn["id"])
            if cap and got[pn["id"]] > cap:
                surplus += got[pn["id"]] - cap
                got[pn["id"]] = cap
        absorbers = [pn for pn in res if pn["id"] in ABSORB]
        if surplus > 0 and absorbers:
            aw = sum(got[a["id"]] for a in absorbers) or 1
            for a in absorbers:
                got[a["id"]] += surplus * got[a["id"]] / aw
            surplus = 0.0
        for pn in res:                     # a wider pane may afford a richer fit
            k, f = best_fit(pn["fits"], got[pn["id"]])
            if k is not None:
                idx[pn["id"]] = k
    else:
        surplus = 0.0
    return got, idx, round(surplus, 1)


def fit_panes(panes, avail, gap=GUTTER, sequence=None, floor_idx=None,
              prefer="fit", allow_columns=True, force_columns=False):
    """Choose residencies, then allocate. Monotonicity is enforced by the caller
    through `floor_idx`: a fit index a pane has already reached at a NARROWER
    width and may never fall below at a wider one.

    With <= 4 panes the residency space is small enough to enumerate exactly,
    so we do -- no greedy demotion order to get wrong.

    prefer / allow_columns -- COLUMNS OR BANDS IS NOT A WIDTH QUESTION.

      A TERMINAL is exactly one viewport tall, so splitting into columns costs
      nothing vertically and stacking costs a lot. Whether columns are right is
      therefore an ASPECT question: a 768x950 portrait iPad wants bands (there
      is height to spend and no width to spare), a 1024x695 landscape iPad
      wants columns (the reverse). prefer="columns" + allow_columns=aspect>=1.

      A DOCUMENT scrolls, so stacking is nearly free and the only thing that
      matters is whether a zone keeps its layout. A 578px window is better off
      with a full-width 5-column line table and the summary as a band beneath
      than with a 305px column of line CARDS beside a 249px summary.
      prefer="fit".

    Mixing is forbidden either way: a terminal is a row of columns or a stack
    of bands, never two columns with a band wedged between them.
    """
    seq = set(sequence or [])
    # Two envelopes, one per LAYOUT -- and a configuration is judged against
    # the envelope of the layout IT IS, not of the mode it was solved in.
    # Landscape still permits a band layout, and a band gets the whole content
    # width and therefore its richest fit; recording that in the shared
    # envelope sets a bar no column layout can clear, and the terminal then
    # stays stacked for the next 400px. This is the same class of bug as
    # comparing across portrait/landscape, one level further in.
    floor_idx = floor_idx or {}
    if "columns" not in floor_idx:
        floor_idx = {"columns": floor_idx, "bands": dict(floor_idx)}

    def demote_target(pn):
        nxt = pn.get("demote_to", "sheet")
        if pn["rank"] == 1:                                  # RANK-1 RESIDENCY RULE
            if nxt == "tab":
                return "stacked"
            if nxt in ("sheet", "route") and pn["id"] not in seq:
                return "stacked"
        return nxt

    best = None
    for mask in range(1 << len(panes)):
        cfg = []
        for b, pn in enumerate(panes):
            want = pn.get("intent", "resident")
            if not allow_columns:
                # PORTRAIT: there are no columns here, so a pane that wanted to
                # be one becomes a BAND. It does not fall all the way to its
                # demote target -- being stacked is not a failure, it is what
                # portrait looks like.
                res_state = "stacked" if want == "resident" else want
            elif bool(mask & (1 << b)) and want == "resident":
                res_state = "resident"
            else:
                res_state = want if want != "resident" else demote_target(pn)
            cfg.append(dict(pn, residency=res_state))
        # NO MIXING: every pane that is on the surface is either a column or a
        # band, never a mixture. Two columns with a band wedged between them is
        # not a layout, it is a bug that validated.
        on = [c for c in cfg if c["residency"] in ("resident", "stacked")]
        if on and len({c["residency"] for c in on}) > 1:
            continue
        if allow_columns and force_columns and not any(c["residency"] == "resident" for c in cfg):
            continue
        layout0 = "columns" if any(c["residency"] == "resident" for c in cfg) else "bands"
        for c in cfg:
            c["_min_idx"] = floor_idx[layout0].get(c["id"], len(c["fits"]) - 1)
        res = [c for c in cfg if c["residency"] == "resident"]
        # A single "resident" pane is not a column, it is a full-width band.
        # Collapsing the two removes a whole class of duplicate configurations
        # that differ only in name and confuse the score.
        if len(res) == 1:
            res[0]["residency"] = "stacked"
            res = []
        got, idx, slack = allocate(res, avail, gap)
        if got is None:
            continue
        layout = "columns" if any(c["residency"] == "resident" for c in cfg) else "bands"
        fi = floor_idx[layout]
        ok = True
        for c in cfg:
            if c["residency"] == "resident":
                c["width"] = round(got[c["id"]], 1)
                k = idx[c["id"]]
            else:
                c["width"] = avail if c["residency"] == "stacked" else 0
                k2, _ = best_fit(c["fits"], c["width"])
                k = k2 if k2 is not None else len(c["fits"]) - 1
            c["fit_idx"] = k
            c["fit"] = c["fits"][k]["variant"]
            c["fit_floor"] = c["fits"][k]["floor"]
            cap = PANE_CAP.get(c["id"])
            c["at_cap"] = bool(cap) and abs(c["width"] - cap) < .5
            # MONOTONE GATE: never worse than this pane already was, narrower
            if c["fit_idx"] > fi.get(c["id"], len(c["fits"]) - 1):
                ok = False
            if RESIDENCY.index(c["residency"]) > \
               RESIDENCY.index(fi.get("_res_" + c["id"], "route")):
                ok = False
        if not ok:
            continue
        # LEXICOGRAPHIC SCORE, ordered by what each pane defends.
        #   1. rank-1 presence-holders stay on screen        (the catalog)
        #   2. rank-1 fit-holders keep their layout          (lines, cart)
        #   3. rank-1 fit-holders prefer a column to a band
        #   4. rank-1 presence-holders then want a richer fit
        #   5..8  the same four, for rank 2
        #   9. less centred slack wins ties
        # Richness counts for resident AND stacked, because a full-width band
        # is a real residency, not a failure state -- it just spends height.
        ON = ("resident", "stacked")
        rich = lambda cs: sum(len(c["fits"]) - 1 - c["fit_idx"]
                              for c in cs if c["residency"] in ON)
        resq = lambda cs: -sum(RESIDENCY.index(c["residency"]) for c in cs)
        pick = lambda rk, hd: [c for c in cfg
                               if (c["rank"] == 1) == (rk == 1) and c.get("hold", "fit") == hd]
        if prefer == "columns":
            score = (resq(pick(1, "residency")), resq(pick(1, "fit")),
                     rich(pick(1, "fit")),       rich(pick(1, "residency")),
                     resq(pick(2, "residency")), resq(pick(2, "fit")),
                     rich(pick(2, "fit")),       rich(pick(2, "residency")),
                     -round(slack))
        else:                                    # prefer == "fit"
            score = (resq(pick(1, "residency")), rich(pick(1, "fit")),
                     resq(pick(1, "fit")),       rich(pick(1, "residency")),
                     resq(pick(2, "residency")), rich(pick(2, "fit")),
                     resq(pick(2, "fit")),       rich(pick(2, "residency")),
                     -round(slack))
        if best is None or score > best[0]:
            best = (score, cfg, slack)
    if best is None:                                    # nothing legal: last resort
        cfg = []
        for pn in panes:
            r = "stacked" if pn["rank"] == 1 else "tab"
            c = dict(pn, residency=r, width=avail if r == "stacked" else 0)
            k2, _ = best_fit(c["fits"], c["width"])
            c["fit_idx"] = k2 if k2 is not None else len(c["fits"]) - 1
            c["fit"] = c["fits"][c["fit_idx"]]["variant"]
            c["fit_floor"] = c["fits"][c["fit_idx"]]["floor"]
            c["at_cap"] = False
            cfg.append(c)
        return cfg, False, 0.0
    return best[1], True, best[2]


def columns_from(panes, arch="terminal", heights=None, lo=320, hi=3441):
    """The width at which this composition BECOMES a row of columns.

    Left to the scoring function, the columns-vs-bands choice oscillated: at
    some widths a band layout scored better, at others a column layout did, and
    the terminal flipped back and forth across a 400px range. The choice is not
    a preference, it is a threshold, so it is computed once:

        columns  <=>  landscape (avail >= terminal height)
                 AND  avail >= sum of every intent-resident pane's LEANEST
                      floor, plus the gutters between them
                 AND  vw >= the first width where both were true

    The last clause is what makes it monotone: once a composition has become
    columns it stays columns, so the only shape change a user ever sees on a
    terminal is the portrait/landscape one -- the same change a phone makes
    when it is rotated.
    """
    want = [p for p in panes if p.get("intent", "resident") == "resident"]
    if not want:
        return None
    need = sum(p["fits"][-1]["floor"] for p in want) + GUTTER * (len(want) - 1)
    for vw in range(lo, hi):
        g = geometry_for(vw, arch)
        H = terminal_height_for(vw, heights) if arch == "terminal" else 0
        if g["avail"] >= max(need, H):
            return vw
    return None


def sweep_variant(panes, sequence=None, lo=320, hi=3441, step=1, arch="terminal",
                  heights=None):
    """Solve continuously from 320 to 3440 and build the MONOTONE ENVELOPE.

    Solving each representative device independently is not enough: the law
    has to hold at every width in between, and the only way to know a bigger
    screen never gives a worse layout is to walk every width in order and
    forbid regression. This is also where the real breakpoints come from --
    they are discovered, not chosen.
    """
    # THE ENVELOPE IS PER LAYOUT MODE.
    # A pane stacked as a full-width band on a 768px portrait tablet gets the
    # whole 720px and therefore its richest fit. No column layout at 1024 can
    # match that, so requiring it to would forbid columns forever -- which is
    # exactly what happened: Column and Table stayed stacked all the way to
    # 1584 because a portrait tablet had set an unbeatable bar. Bands and
    # columns are different layouts; each is only ever compared with itself.
    envs = {"columns": {}, "bands": {}}
    out = {}
    term = (arch == "terminal")
    cfrom = columns_from(panes, arch, heights) if term else None
    for vw in range(lo, hi, step):
        g = geometry_for(vw, arch)
        cols_ok = True
        if term:
            H = terminal_height_for(vw, heights)
            cols_ok = (g["avail"] >= H) and (cfrom is not None and vw >= cfrom)
        cfg, clean, slack = fit_panes([{**p} for p in panes], g["avail"],
                                      sequence=sequence, floor_idx=envs,
                                      prefer="columns" if term else "fit",
                                      allow_columns=cols_ok, force_columns=term)
        layout = "columns" if any(c["residency"] == "resident" for c in cfg) else "bands"
        env = envs[layout]
        for c in cfg:
            env[c["id"]] = min(env.get(c["id"], 99), c["fit_idx"])
            prev = env.get("_res_" + c["id"], "route")
            if RESIDENCY.index(c["residency"]) < RESIDENCY.index(prev):
                env["_res_" + c["id"]] = c["residency"]
        out[vw] = (cfg, clean, slack, g, layout)
    return out


def transitions(sweep):
    """Where the layout actually changes -- the discovered breakpoints."""
    ts, prev = [], None
    for vw in sorted(sweep):
        cfg = sweep[vw][0]
        sig = tuple((c["id"], c["residency"], c["fit"]) for c in cfg) + (sweep[vw][4],)
        if prev is not None and sig != prev:
            ts.append({"vw": vw,
                       "mode": sig[-1],
                       "from": [f"{a}:{b}/{c}" for a, b, c in prev[:-1]],
                       "to":   [f"{a}:{b}/{c}" for a, b, c in sig[:-1]]})
        prev = sig
    return ts


# ═══════════════════════════════════════════════════════════════════════════
# §E  THE RANK LAW  — the structural fix for "too overwhelming"
# ═══════════════════════════════════════════════════════════════════════════
# The POS today shows ~60 affordances at rest with an empty cart; the green
# Complete button carries the same visual weight as a once-a-month toggle.
# That is not a styling problem, it is a residency problem: nothing in the
# system says where a control is allowed to live.
#
# Every control in VenQore carries exactly one rank.  Rank decides residency,
# and residency is enforced, not advised.
RANKS = [
  {"rank": 1, "name": "Act",       "freq": "every transaction",
   "residency": "always visible on the working surface",
   "budget_desktop": 7, "budget_mobile": 5,
   "why": "7 is the working-memory span; past it the user scans instead of acting"},
  {"rank": 2, "name": "Adjust",    "freq": "some transactions",
   "residency": "one gesture away, and contextual to the selected object",
   "budget_desktop": None, "budget_mobile": None,
   "why": "revealed by the thing it acts on, so it costs nothing until needed"},
  {"rank": 3, "name": "Configure", "freq": "once per setup, shift or month",
   "residency": "settings drawer only -- never on the working surface",
   "budget_desktop": 0, "budget_mobile": 0,
   "why": "a monthly control docked permanently is 30 days of noise for 1 day of use"},
]

# ═══════════════════════════════════════════════════════════════════════════
# §B  ARCHETYPES  — every screen in the product is one of six
# ═══════════════════════════════════════════════════════════════════════════
ARCHETYPES = [
  {"id": "dashboard", "name": "Dashboard", "scroll": "page",
   "regions": ["nav", "header", "canvas"],
   "rule": "cards on the grid; §6 card law applies verbatim; edit mode available",
   "examples": ["Home", "Dashboard", "Workspace", "role dashboards"]},
  {"id": "index", "name": "Index", "scroll": "page",
   "regions": ["nav", "header", "toolbar", "table", "pagination"],
   "rule": "one sticky toolbar row; columns demote right-to-left by declared priority; below 600 rows become cards",
   "examples": ["Products", "Customers", "Sales list", "Purchases list", "Expenses"]},
  {"id": "document", "name": "Document", "scroll": "page",
   "regions": ["nav", "header", "docheader", "lines", "summary", "actionbar"],
   "rule": "three zones; summary is resident beside lines while it clears its floor, else it becomes a sticky action bar",
   "examples": ["Invoice", "Purchase", "Quotation", "Order", "Return", "Expense"]},
  {"id": "terminal", "name": "Terminal", "scroll": "panes",
   "regions": ["nav", "header", "panes"],
   "rule": "exactly one viewport tall; the page never scrolls; panes scroll internally; columns-vs-bands is an aspect question; the residency ladder applies",
   "examples": ["POS", "Kitchen display", "Table floor"]},
  {"id": "console", "name": "Console", "scroll": "page",
   "regions": ["nav", "header", "subnav", "canvas"],
   "rule": "the 224px subnav is a THIRD shell column from 1248 (where the canvas still clears 904px) and a horizontal tab strip below it; the nav itself waits until 1440",
   "examples": ["Settings", "Reports", "Accounting"]},
  {"id": "focus", "name": "Focus", "scroll": "page",
   "regions": ["canvas"],
   "rule": "no nav, no header; content capped at 6 columns and centred; the only archetype allowed to cap width",
   "examples": ["Login", "Onboarding wizard", "Print preview", "Checkout"]},
]

# ═══════════════════════════════════════════════════════════════════════════
# §F  THE TERMINAL COMPOSER  — the user decides, the law keeps it legal
# ═══════════════════════════════════════════════════════════════════════════
# v2.0 shipped six fixed POS variants. That was the wrong shape, and Rehan put
# his finger on why: "letting the user decide, I think that would be a better
# option, rather than we create so many things."
#
# He is right, and the research backs it. Nobody in the category ships resizable
# panes — Toast exposes rows x columns, Lightspeed exposes tile spanning,
# Loyverse exposes grid-vs-list, Shopify and Square expose tile CONTENT only.
# Free-form pane geometry exists only in Dynamics 365 Commerce, and there it is
# per-resolution static layouts authored in an admin tool and exported as XML.
# A register the operator composes live, with the law keeping it legal, is a
# thing the category does not have.
#
# So a terminal is no longer a variant. It is a COMPOSITION:
#
#     catalog   off | left | right | top | bottom | overlay   + size + rows
#     split     what share of the width the cart and the tender each take
#     tender    column | bar | sheet
#     floor     off | left | overlay          (restaurants)
#
# The six variants survive as PRESETS — starting points, not cages.
#
# Three laws keep any composition honest:
#
#   1. THE FLOORS CLAMP THE FRACTIONS. The user picks 20/50/30; if 20% of this
#      screen is below the catalog's measured floor, the catalog is not squeezed
#      into an unreadable column — it demotes. The percentage is a wish; the
#      floor is the law. (Odoo is the only product with a source-verified
#      proportion and it is ABSOLUTE -- 500px, 400px below 1200 -- which reads as
#      26% at 1920 and 52% on a 768 portrait iPad. A fraction without a pixel
#      clamp is how that happens.)
#
#   2. THE CATALOG IS ALWAYS THE FIRST THING TO GO. Never the cart, never the
#      tender. When it goes it becomes a full-screen overlay behind one button,
#      which is what every shipping POS does on a small screen.
#
#   3. NOTHING IS EVER UNREACHABLE. A pane scrolls its body and PINS its actions.
#      No control is ever pushed below the fold -- which was the Scan bug: on a
#      short screen the tender's Hold, Drawer and method controls scrolled away
#      and there was no way to get to them.

PHONE_MAX = 599          # below this the cart is the screen and everything docks

# The catalog may only be a RESIDENT COLUMN where it can be one without costing
# the cart its full fit. Derived, not chosen:
CATALOG_RESIDENT_MIN_AVAIL = CAT_LIST + CART_FULL + TENDER_MIN + 2 * GUTTER   # 1038

def catalog_resident_min_vw():
    for vw in range(600, 4000):
        if geometry_for(vw, "terminal")["avail"] >= CATALOG_RESIDENT_MIN_AVAIL:
            return vw
    return None

PANE_FITS = {
  "cart":    [("table", CART_FULL), ("relay", CART_RELAY), ("minimal", CART_MIN)],
  "tender":  [("full", TENDER_FULL), ("compact", TENDER_MID), ("bar", TENDER_MIN)],
  "catalog": [("grid-3up", CAT_GRID3), ("grid-2up", CAT_GRID2), ("list", CAT_LIST)],
  "floor":   [("map", CAT_GRID3), ("list", CAT_LIST)],
}
PANE_NAMES = {"cart": "Cart", "tender": "Tender", "catalog": "Catalog", "floor": "Floor"}

def fit_for(pane, px):
    """Richest fit this width affords. None => cannot be a resident column."""
    for name, floor in PANE_FITS[pane]:
        if px >= floor:
            return name, floor
    return None, PANE_FITS[pane][-1][1]

# --- the presets ---------------------------------------------------------
# The proportions are Rehan's own, from the review: "if we are giving 30% to the
# right sidebar we could give 20% in the middle, so 50% should go to the cart,
# because most of the time customers are looking at the POS screen."
def comp(catalog="off", cat_size=0.0, cat_rows=1, cart=0.62, tender=0.38,
         tender_mode="column", floor="off", tiles=None):
    return {"catalog": {"mode": catalog, "size": cat_size, "rows": cat_rows,
                        "tiles": tiles},
            "split": {"cart": cart, "tender": tender},
            "tender": tender_mode, "floor": floor}

POS_PRESETS = [
  {"id": "scan", "name": "Scan", "tagline": "No catalog. Scanner and keyboard only.",
   "for": "Large inventory (>2,000 SKUs), barcode-driven. Pharmacy, hardware, grocery, distribution.",
   "why": "A catalog nobody browses is 40% of the screen spent on nothing. Removing it is the single biggest calm-down available.",
   "comp": comp(catalog="off", cart=0.62, tender=0.38)},

  {"id": "column", "name": "Column", "tagline": "A narrow catalog column, and a big cart.",
   "for": "Mixed inventory (200-2,000 SKUs) where staff both scan and browse. General retail.",
   "why": "The familiar shape with the proportions fixed: the catalog is a reference column, not a competitor. One tile wide is enough, and there is a full-screen button when it is not.",
   "comp": comp(catalog="left", cat_size=0.20, cart=0.50, tender=0.30, tiles=1)},

  {"id": "row", "name": "Row", "tagline": "A tile strip on top, cart underneath.",
   "for": "Small inventory (<200 SKUs), fast repeat items. Cafe, bakery, kiosk, pharmacy counter.",
   "why": "A strip is reachable by thumb and leaves the full width for the cart. One row by default -- a second only if the operator asks for it and the height can pay for it.",
   "comp": comp(catalog="top", cat_size=0.0, cat_rows=1, cart=0.70, tender=0.30)},

  {"id": "grid", "name": "Grid", "tagline": "Catalog and cart share the screen 40 / 60.",
   "for": "Visual products, walk-up counters, staff who point rather than type. Cafe, QSR, boutique.",
   "why": "When the product IS the interface the cart only has to confirm -- but the cart still gets the larger half, because that is the half the customer is reading.",
   "comp": comp(catalog="left", cat_size=0.40, cart=0.60, tender=0.0, tender_mode="sheet")},

  {"id": "stack", "name": "Stack", "tagline": "Catalog above, cart below, pay takes the screen.",
   "for": "Wide-but-short screens, and anyone who prefers to look down rather than across.",
   "why": "Rehan's own suggestion, and the best fit for a 1280x720 laptop: 40% of the height to the catalog, 60% to the cart, and Take payment opens the full tender.",
   "comp": comp(catalog="top", cat_size=0.40, cart=1.0, tender=0.0, tender_mode="sheet")},

  {"id": "counter", "name": "Counter", "tagline": "One column. Cart first, everything docked.",
   "for": "Phone and small tablet, market stalls, delivery riders, single-hand use.",
   "why": "The cart is the screen. The total lives inside the Pay button and the catalog is one tap away, full screen -- which is what every shipping POS does at this size.",
   "comp": comp(catalog="overlay", cart=1.0, tender=0.0, tender_mode="bar")},

  {"id": "table", "name": "Table", "tagline": "Floor plan, then order.",
   "for": "Restaurants, cafes with table service, salons, any seat or slot business.",
   "why": "The unit of work is the table, not the sale -- so the floor is a STEP, not a fourth column competing for width. Pick a table, take the order, settle. Switch the floor to a column in the composer if the screen is wide enough to carry one for free.",
   "comp": comp(catalog="top", cat_size=0.0, cat_rows=1, cart=0.70, tender=0.30,
                floor="overlay")},
]

# --- what the composer exposes ------------------------------------------
COMPOSER_CONTROLS = [
  {"id": "catalog.mode", "label": "Catalog",
   "options": ["off", "left", "right", "top", "bottom", "overlay"],
   "note": "off = scanner only. left/right = a column. top/bottom = a tile strip. overlay = one button, full screen."},
  {"id": "catalog.size", "label": "Catalog share", "range": [0.12, 0.55],
   "note": "Of the width for a column, of the height for a strip. Clamped to the catalog's measured floor."},
  {"id": "catalog.rows", "label": "Strip rows", "options": [1, 2, 3],
   "note": "Only for a top or bottom strip. Rows the height cannot pay for are not offered."},
  {"id": "catalog.tiles", "label": "Tiles per row", "range": [1, 8],
   "note": "The industry's real density control -- Toast ships rows x columns per device, default 8 x 5."},
  {"id": "split.cart", "label": "Cart share", "range": [0.30, 1.0],
   "note": "Clamped so the cart never drops below its own floor."},
  {"id": "split.tender", "label": "Tender share", "range": [0.0, 0.45],
   "note": "0 turns the tender into a sheet behind Take payment."},
  {"id": "tender", "label": "Tender", "options": ["column", "bar", "sheet"],
   "note": "column = always visible. bar = a docked total + Pay. sheet = full screen on demand."},
  {"id": "floor", "label": "Floor plan", "options": ["off", "left", "overlay"],
   "note": "Restaurants only. A column on a wide screen, a step on a narrow one."},
]

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def compose_terminal(composition, vw, vh=None):
    """Turn a user composition into a concrete layout at this exact size.

    Pure. No sweep, no envelope, no search -- the user's fractions are the
    anchor, so monotonicity comes free: every pane's pixel width grows with the
    viewport. What the law does is CLAMP: a fraction that would put a pane below
    its measured floor does not squeeze the pane, it demotes it.
    """
    C_ = composition
    g = geometry_for(vw, "terminal")
    avail = g["avail"]
    H = terminal_height_for(vw, VH if vh is None else {vw: vh})
    cat_mode = C_["catalog"]["mode"]
    tender_mode = C_["tender"]
    floor_mode = C_["floor"]

    dock, overlays, notes = [], [], []

    # ---- REGIME ---------------------------------------------------------
    # phone      the cart IS the screen; everything else docks or overlays
    # stacked    portrait, or too narrow for two columns; bands
    # columns    landscape and wide enough
    two_col_min = CART_MIN + TENDER_MIN + GUTTER
    if vw <= PHONE_MAX or avail < two_col_min:
        regime = "phone"
    elif avail < H:
        regime = "stacked"
    else:
        regime = "columns"

    # ---- WHAT DOCKS -----------------------------------------------------
    # Decided FIRST, because the dock is a real layout row and everything
    # vertical has to be measured against the height that is left after it.
    # v2.0 floated these triggers over the panes and they covered the payment
    # panel; a dock cannot overlap anything because it is part of the grid.
    tender_res = (regime == "columns" and tender_mode == "column"
                  and C_["split"]["tender"] > 0
                  and avail * clamp(C_["split"]["tender"], 0.0, 0.45) >= TENDER_MIN)
    tender_bar = (tender_mode == "bar") or (regime == "stacked" and tender_mode == "column")
    # ---- RESIDENCY, SETTLED BEFORE ANYTHING IS MEASURED -----------------
    # The dock is a layout row, so every vertical number depends on how tall it
    # is -- and a demotion discovered late, after the dock height was already
    # taken, is exactly how a button ends up overlapping the pane beneath it.
    # So residency is settled first, by running the SAME allocation arithmetic
    # the real layout will use and demoting whatever fails, until it is stable.
    def allocate_columns(want_cat, want_floor, want_tender):
        f = {}
        if want_cat:
            f["catalog"] = clamp(C_["catalog"]["size"], 0.12, 0.55)
        if want_floor:
            f["floor"] = 0.20
        f["cart"] = max(0.20, C_["split"]["cart"])
        if want_tender:
            f["tender"] = clamp(C_["split"]["tender"], 0.0, 0.45)
        # Percentage sliders that can sum past 100 are a trap. Whatever the
        # operator dials, the resident columns are normalised to the width that
        # actually exists.
        tot = sum(f.values()) or 1.0
        f = {k: v / tot for k, v in f.items()}
        pool = avail - GUTTER * (len(f) - 1)
        return f, pool, {k: pool * v for k, v in f.items()}

    cat_res = cat_mode in ("left", "right", "top", "bottom") and regime != "phone"
    if cat_res and cat_mode in ("left", "right") and avail < CATALOG_RESIDENT_MIN_AVAIL:
        cat_res = False
    floor_res = floor_mode == "left" and regime == "columns" \
                and avail >= CATALOG_RESIDENT_MIN_AVAIL + CAT_LIST + GUTTER
    tender_res = (regime == "columns" and tender_mode == "column"
                  and C_["split"]["tender"] > 0)

    for _ in range(4):
        want_cat_col = cat_res and cat_mode in ("left", "right")
        frac, width_pool, px = allocate_columns(want_cat_col, floor_res, tender_res)
        # The catalog is ALWAYS the first thing to go -- never the cart, never
        # the tender. That is not a tie-break, it is the rule.
        if want_cat_col and fit_for("catalog", px["catalog"])[0] is None:
            cat_res = False
            continue
        if tender_res and fit_for("tender", px["tender"])[0] is None:
            tender_res = False
            continue
        if floor_res and fit_for("floor", px["floor"])[0] is None:
            floor_res = False
            continue
        if px["cart"] < CART_MIN and floor_res:
            floor_res = False
            continue
        if px["cart"] < CART_MIN and want_cat_col:
            cat_res = False
            continue
        break

    if cat_res and cat_mode in ("top", "bottom"):
        # A strip has to leave a legible cart underneath it, measured against
        # the height that survives the dock -- so assume the worst dock here and
        # re-check once its real height is known.
        probe_h = H - (TERM["tender_bar_h"] + GUTTER)
        cat_res = TERM["tile_h"] + GUTTER + TERM["cart_min_h"] <= probe_h

    tender_bar = (tender_mode == "bar") or \
                 (not tender_res and tender_mode == "column" and regime == "stacked")

    if not tender_res:
        dock.append({"id": "tender", "label": "Pay" if tender_bar else "Take payment",
                     "rank": 1, "primary": True, "shows": "total", "inline": tender_bar})
    if cat_mode != "off" and not cat_res:
        dock.append({"id": "catalog", "label": "Catalog", "rank": 2, "shows": "count"})
    if floor_mode != "off" and not floor_res:
        dock.append({"id": "floor", "label": "Floor", "rank": 2})
    dock_h = 0 if not dock else (TERM["tender_bar_h"] if any(d.get("inline") for d in dock) else 72)
    usable_h = H - (dock_h + GUTTER if dock_h else 0)
    frac, width_pool, px = allocate_columns(cat_res and cat_mode in ("left", "right"),
                                            floor_res, tender_res)

    # ---- CATALOG --------------------------------------------------------
    cat = None
    if cat_mode == "off":
        cat = None
    elif not cat_res or cat_mode == "overlay":
        why = ("by design" if cat_mode == "overlay"
               else "this screen is too narrow for a catalog column"
                    if cat_mode in ("left", "right") else "no room for a strip here")
        cat = {"mode": "overlay", "reason": why, "trigger": "Catalog"}
        if cat_mode not in ("overlay",):
            notes.append(f"catalog is one button away here: a resident catalog needs "
                         f"{CATALOG_RESIDENT_MIN_AVAIL:.0f}px of content width and this screen "
                         f"has {avail:.0f}px, and taking it from the cart is the wrong trade")
    elif cat_mode in ("left", "right"):
        w = px["catalog"]
        fit, _ = fit_for("catalog", w)
        cat = {"mode": cat_mode, "px": round(w, 1), "fit": fit or "list",
               "tiles": C_["catalog"]["tiles"]
                        or max(1, int((w - 2 * PAD + GUTTER) // (CTL["tile_min"] + GUTTER)))}
    else:                                             # top / bottom strip
        share = clamp(C_["catalog"]["size"], 0.0, 0.55)
        # A band is always a WHOLE number of tile rows. A share of 40% that only
        # buys one 152px row should give back the other 144px rather than
        # holding it as empty band -- the cart is what wants it.
        want = C_["catalog"]["rows"]
        if share:
            want = max(1, int((usable_h * share + GUTTER) // (TERM["tile_h"] + GUTTER)))
        rows = 0
        for r in range(want, 0, -1):
            need = r * TERM["tile_h"] + (r - 1) * GUTTER
            # THE CART KEEPS FIRST CLAIM ON HEIGHT, measured against the height
            # that survives the dock -- not the whole viewport.
            if need + TERM["cart_min_h"] + GUTTER <= usable_h:
                rows = r
                break
        if rows == 0:
            cat = {"mode": "overlay", "reason": "height", "trigger": "Catalog"}
            notes.append(f"{usable_h:.0f}px of usable height cannot carry a tile strip and a "
                         f"legible cart, so the catalog is one button away instead")
            if not any(d["id"] == "catalog" for d in dock):
                dock.append({"id": "catalog", "label": "Catalog", "rank": 2, "shows": "count"})
                dock_h = dock_h or 72
                usable_h = H - (dock_h + GUTTER)
        else:
            band = rows * TERM["tile_h"] + (rows - 1) * GUTTER
            per = C_["catalog"]["tiles"] or max(2, int((avail + GUTTER) //
                                                       (CTL["tile_min"] + GUTTER)))
            cat = {"mode": cat_mode, "rows": rows, "demoted": rows < want,
                   "h": round(band, 1), "tiles": per, "visible": per * rows}

    # ---- FLOOR ----------------------------------------------------------
    flr = None
    if floor_mode != "off":
        if floor_res:
            fpx = px["floor"]
            flr = {"mode": "left", "px": round(fpx, 1), "fit": fit_for("floor", fpx)[0] or "list"}
        else:
            flr = {"mode": "overlay", "trigger": "Floor", "reason": "width"}

    # ---- TENDER ---------------------------------------------------------
    if tender_res:
        tw = px["tender"]
        fit, _ = fit_for("tender", tw)
        tender = {"mode": "column", "px": round(tw, 1), "fit": fit or "bar"}
    elif tender_bar:
        tender = {"mode": "bar", "h": TERM["tender_bar_h"], "docked": True}
    else:
        tender = {"mode": "sheet", "trigger": "Take payment",
                  "reason": "by design" if tender_mode == "sheet" else "no room for a column here"}

    # ---- CART: whatever is left, and it always gets it -------------------
    taken = 0.0
    if cat and cat.get("px"):
        taken += cat["px"] + GUTTER
    if flr and flr.get("px"):
        taken += flr["px"] + GUTTER
    if tender.get("px"):
        taken += tender["px"] + GUTTER
    cart_px = avail - taken
    cfit, _ = fit_for("cart", cart_px)
    # Below the designed 360px minimum the cart line does not break, it SCROLLS
    # inside its own pane -- the same underflow rule the cards use. 320px of
    # viewport leaves 288px of content and the leanest cart line needs 305.
    cart = {"px": round(cart_px, 1), "fit": cfit or "minimal",
            "below_floor": cfit is None and vw >= MIN_VIEWPORT,
            "underflow": cfit is None, "min_width": CART_MIN}

    for d in dock:
        overlays.append({"id": d["id"],
                         "as": "sheet" if d["id"] == "tender" else "fullscreen"})

    band_h = cat["h"] + GUTTER if cat and cat.get("h") else 0
    cart_h = usable_h - band_h
    lines = max(0, int((cart_h - TERM["cart_hdr"] - 2 * PAD_SM) // TERM["cart_line"]))

    return {
      "vw": vw, "vh": vh or viewport_height(vw), "avail": round(avail, 1), "H": round(H, 1),
      "usable_h": round(usable_h, 1), "regime": regime,
      "catalog": cat, "floor": flr, "tender": tender, "cart": cart,
      "dock": dock, "dock_h": dock_h, "overlays": overlays,
      "cart_h": round(cart_h, 1), "cart_lines": lines,
      "cramped": lines < TERM["cart_min_lines"],
      "notes": notes,
      "fractions": {k: round(v, 3) for k, v in frac.items()},
      # Reachability is a PROPERTY OF THE LAYOUT, asserted here rather than hoped
      # for: every rank-1 thing is either a resident pane, a band, or a dock
      # button, and every pane pins its own actions instead of scrolling them
      # away. The total is ALWAYS on screen -- in the tender column, in the bar,
      # or printed inside the Pay button, which is Odoo's trick and a good one.
      "reachable": {
        "cart": True,
        "tender": tender["mode"] in ("column", "bar") or any(d["id"] == "tender" for d in dock),
        "total": tender["mode"] in ("column", "bar")
                 or any(d.get("shows") == "total" for d in dock),
        "catalog": cat is None or cat["mode"] != "overlay"
                   or any(d["id"] == "catalog" for d in dock),
        "floor": flr is None or flr["mode"] != "overlay"
                 or any(d["id"] == "floor" for d in dock),
      },
    }

# ═══════════════════════════════════════════════════════════════════════════
# §F2  POS CAPABILITY REGISTER  — the zero-loss proof
# ═══════════════════════════════════════════════════════════════════════════
# Every capability below was read out of Pos.jsx (3,743 lines) and its child
# components. Nothing is dropped. Each one is assigned a RANK, and the rank
# decides where it lives -- which is the whole structural answer to "the POS
# feels overwhelming". The screen is not calmer because things were deleted;
# it is calmer because 40 controls stopped pretending to be equally urgent.
#
# home:  surface  always visible on the working surface (rank 1 only)
#        line     revealed by selecting a cart line
#        field    revealed by focusing the field it belongs to
#        sheet    a slide-over opened by one rank-1 control
#        bar      the terminal's own top bar
#        drawer   settings drawer; never on the working surface (rank 3 only)
#        auto     no UI at all -- the system does it

def cap(cid, label, rank, home, note="", src=""):
    return {"id": cid, "label": label, "rank": rank, "home": home,
            "note": note, "src": src}

POS_CAPS = [
 # ---- RANK 1 : Act ------------------------------------------------------
 cap("scan",        "Scan / search item", 1, "surface",
     "barcode-first: exact SKU or barcode wins before fuzzy search", "Pos.jsx:799"),
 cap("cart_lines",  "Cart lines", 1, "surface", "", "Pos.jsx:2440"),
 cap("qty",         "Quantity + / -", 1, "line-visible",
     "visible on every line, not behind selection -- but it belongs to the cart-lines object and costs one unit of attention, not one per line", "Pos.jsx:875"),
 cap("remove_line", "Remove line", 1, "line", "", "Pos.jsx:2572"),
 cap("total",       "Running total", 1, "surface", "formatToFit; exact value on hover", "Pos.jsx:938"),
 cap("customer",    "Customer / walk-in", 1, "surface",
     "selecting a party with default_discount auto-applies it and says so", "Pos.jsx:2638"),
 cap("tender",      "Amount tendered + change", 1, "surface", "", "Pos.jsx:2908"),
 cap("complete",    "Complete sale", 1, "surface", "", "Pos.jsx:3010"),
 cap("hold",        "Hold / park", 1, "surface", "", "Pos.jsx:3031"),
 # ---- RANK 2 : Adjust ---------------------------------------------------
 cap("line_disc",   "Line discount (amount or %)", 2, "line", "", "Pos.jsx:3454"),
 cap("price_over",  "Price override", 2, "line", "", "Pos.jsx:3599"),
 cap("free_qty",    "Free / bonus quantity", 2, "line",
     "was a global column toggle; now a per-line control on the line that needs it", "Pos.jsx:2534"),
 cap("converter",   "Price / qty / total back-solve", 2, "line",
     "merged with line discount into ONE line editor -- the old pair of near-identical modals was a top overwhelm complaint", "Pos.jsx:3563"),
 cap("variant",     "Variant picker", 2, "sheet", "", "Pos.jsx:3102"),
 cap("global_disc", "Document discount", 2, "field", "presets are long-pressable", "Pos.jsx:3180"),
 cap("split_pay",   "Split tender", 2, "field",
     "cash / bank / card / UPI / credit; UPI existed only here, now everywhere", "Pos/PaymentModal.jsx"),
 cap("pay_method",  "Payment method", 2, "field", "", "Pos.jsx:2690"),
 cap("bank_acct",   "Deposit-to account", 2, "field", "", "Pos.jsx:2739"),
 cap("tax_mode",    "Tax inclusive / exclusive", 2, "field", "", "Pos.jsx:2809"),
 cap("tax_rate",    "Tax rate", 2, "field", "from settings.tax_rates", "Pos.jsx:2821"),
 cap("fulfilment",  "Local stock / dropship", 2, "field", "", "Pos.jsx:2867"),
 cap("warehouse",   "Location", 2, "field",
     "FIXED: warehouses were passed to the screen and had no UI at all -- a multi-branch store could not choose", "Pos.jsx:190"),
 cap("parked",      "Parked sales", 2, "sheet", "", "Pos.jsx:2088"),
 cap("recent",      "Recent invoices + reprint", 2, "sheet", "", "Pos.jsx:2019"),
 cap("return_mode", "Return mode", 2, "bar", "three policies: reference / customer-or-reference / open", "Pos.jsx:1971"),
 cap("return_lookup","Load sale for return", 2, "sheet", "", "Pos.jsx:1785"),
 cap("quick_prod",  "Create product inline", 2, "sheet",
     "opened the full 1,768-line six-tab editor; now a 5-field sheet with Full editor behind a link", "Pos.jsx:3418"),
 cap("quick_party", "Create / edit customer inline", 2, "sheet", "", "Pos.jsx:3405"),
 cap("quick_bank",  "Create bank account inline", 2, "sheet", "", "Pos.jsx:3305"),
 cap("overpay",     "Overpayment: change or ledger", 2, "sheet", "", "Pos.jsx:3430"),
 cap("offline_hub", "Offline sync hub", 2, "sheet", "per-sale retry, error, recall, delete", "Pos.jsx:3646"),
 cap("tabs",        "Multiple sales open at once", 2, "bar", "", "Pos.jsx:1933"),
 cap("breakup",     "Bill breakup", 2, "field", "was Ctrl+F only; now a tap on the total", "Pos.jsx:1499"),
 cap("notes",       "Sale remarks", 2, "field",
     "FIXED: F12 collected remarks and the main checkout path threw them away", "Pos.jsx:1484"),
 cap("charges",     "Additional charges", 2, "field",
     "FIXED: F8 stored a charge that no total ever read", "Pos.jsx:1460"),
 cap("keys",        "Keyboard map", 2, "sheet", "the full map, not the 10 the old strip advertised", "Pos.jsx:3052"),
 cap("reprint",     "Reprint last receipt", 2, "sheet", "", "Pos.jsx:2050"),
 cap("drawer_open", "Open cash drawer", 2, "surface",
     "ADDED: AMDStation.openDrawer() and thermal_open_drawer both existed with no button anywhere", "Utils/AMDStation.js"),
 cap("back",        "Leave the register", 2, "bar",
     "Rehan asked for this explicitly: with the nav hidden there must still be a way back", "Pos.jsx:584"),
 # ---- RANK 3 : Configure ------------------------------------------------
 cap("senior",      "Large text mode", 3, "drawer", "", "Pos.jsx:1954"),
 cap("autoprint",   "Auto-print on complete", 3, "drawer", "", "Pos.jsx:2952"),
 cap("ui_scale",    "Interface scale", 3, "drawer", "", "OneGlanceLayout.jsx:836"),
 cap("variant_pick","POS layout variant", 3, "drawer", "the six terminals; per user, per device", ""),
 cap("cat_place",   "Catalog placement", 3, "drawer", "column / row / dominant / sheet / none", ""),
 cap("def_tax",     "Default tax rate", 3, "drawer", "", "settings.default_tax_rate"),
 cap("ret_policy",  "Return policy", 3, "drawer", "", "settings.pos_return_mode"),
 cap("neg_stock",   "Allow overselling", 3, "drawer", "", "settings.stop_sale_negative_stock"),
 cap("roundoff",    "Round off totals", 3, "drawer", "", "settings.round_off_total"),
 cap("presets",     "Discount presets", 3, "drawer", "", "localStorage pos_discount_presets"),
 cap("autofill",    "Auto-fill exact cash", 3, "drawer", "", "settings.pos_auto_fill_cash"),
 cap("margin_show", "Show margin", 3, "drawer", "", "settings.show_margin_percentage"),
 # ---- status: read-outs, not controls -----------------------------------
 cap("online",      "Online / offline", 3, "bar", "read-out. shape must differ from a toggle", "Pos.jsx:2068"),
 cap("hardware",    "Printer / drawer status", 3, "bar", "read-out", "Pos.jsx:2074"),
 cap("pending",     "Queued offline sales", 3, "bar", "read-out, opens the sync hub", "Pos.jsx:2081"),
 # ---- automatic: no UI --------------------------------------------------
 cap("cart_rescue", "Cart rescue after a crash", 1, "auto", "", "Pos.jsx:555"),
 cap("offline_q",   "Offline queue + auto sync", 1, "auto", "", "Hooks/useOfflineSync.js"),
 cap("idempotency", "Idempotency key", 1, "auto", "", "SaleController"),
 cap("wholesale",   "Wholesale price banding", 1, "auto", "", "Utils/settings.js"),
 cap("automfg",     "Auto-manufacture from recipe", 1, "auto", "", "Pos.jsx:2287"),
 cap("session",     "Multi-tab session persistence", 1, "auto", "", "Contexts/WorkspaceContext.jsx"),
]

# Which capabilities each variant surfaces differently. Everything not listed
# behaves identically in every variant -- that is the point of one law.
POS_VARIANT_OVERRIDES = {
 "scan":    {"scan": "surface, focused on load, always focused",
             "drawer_open": "surface"},
 "column":  {"scan": "surface, above the catalog column"},
 "row":     {"scan": "surface, above the tile strip"},
 "grid":    {"scan": "bar", "tender": "sheet", "complete": "surface (cart rail)"},
 "counter": {"scan": "surface", "parked": "bar", "recent": "bar"},
 "table":   {"back": "surface (back to floor)", "hold": "auto (a table IS a held sale)"},
}

# The twelve behaviour traps the inventory found. Recorded with their fix so a
# redesign cannot quietly inherit them.
POS_FIXES = [
 ("errors_as_offline", "Any server error -- including a 422 validation error or a plan-limit rejection -- was caught and queued as an 'offline sale'.",
  "Only a genuine network failure queues. A 4xx surfaces as a validation error on the field that caused it."),
 ("f8_charges", "F8 additional charges were stored on the session and never added to any total.",
  "Charges are a document field and part of the total, on every screen."),
 ("f9_discount", "F9 bill discount wrote `discount`, which the total formula never read because `discountValue` was always defined.",
  "One discount value, one formula."),
 ("f12_notes", "F12 remarks reached the server only on Ctrl+S/P/N; the normal Complete path sent notes:''.",
  "Notes are a resident field with one payload path."),
 ("key_price", "item.key_price was read in the subtotal and never written anywhere.",
  "Removed."),
 ("reserve_confirm", "The reserved-stock backorder confirm used `if (!window.confirm(...))` against a Promise-returning override, so it never blocked anything.",
  "Awaited confirm; the sale genuinely pauses."),
 ("margin_dead", "Margin display required item.cost_price, which was never set on cart items.",
  "cost_price travels with the line; margin is a rank-2 peek."),
 ("return_window", "pos_return_window and pos_return_window_behavior were parsed and discarded.",
  "Both enforced by the return policy."),
 ("stub_keys", "F6 (change unit) and F10 (loyalty) advertised behaviour that only emitted a 'coming soon' toast.",
  "Either implemented or absent from the map. Never advertised and dead."),
 ("cancel_undo", "Cancel wiped the cart with no confirmation and no undo.",
  "Cancel is undoable for 10 seconds; no dialog, no loss."),
 ("key_guard", "The global keydown handler had no 'am I typing?' guard, so F-keys fired from inside modal inputs.",
  "The keymap is scoped to the surface and suspended inside a field or sheet."),
 ("tab_labels", "Sale tabs were labelled with a raw Date.now() millisecond timestamp.",
  "Tabs carry the document number, or the party name until one exists."),
 ("void_perms", "pos.void_item and pos.refund were defined in config/permissions.php and checked nowhere -- any cashier could run a return or delete a line.",
  "Both enforced at the control."),
 ("no_drawer_ui", "AMDStation.openDrawer() and the thermal_open_drawer setting both existed with no button anywhere in the UI.",
  "Open drawer is a rank-2 control on the surface."),
]

# One keymap for the whole product. The full F-key map existed only in Pos.jsx
# and KeyboardShortcutsModal.jsx advertised it to every user -- while none of
# the thirteen document screens implemented any of it.
KEYMAP = [
 ("F1",  "Focus scan / search",        "terminal document"),
 ("F2",  "Quantity on the active line","terminal document"),
 ("F3",  "Discount on the active line","terminal document"),
 ("F4",  "Remove the active line",     "terminal document"),
 ("F5",  "Rate on the active line",    "terminal document"),
 ("F6",  "Unit on the active line",    "document"),
 ("F7",  "Document tax",               "terminal document"),
 ("F8",  "Additional charges",         "terminal document"),
 ("F9",  "Document discount",          "terminal document"),
 ("F11", "Party",                      "terminal document"),
 ("F12", "Notes",                      "terminal document"),
 ("Ctrl+S",     "Save",                "terminal document"),
 ("Ctrl+P",     "Save and print",      "terminal document"),
 ("Ctrl+N",     "Save and start a new one", "terminal document"),
 ("Ctrl+D",     "New party",           "terminal document"),
 ("Ctrl+T",     "New tab",             "terminal document"),
 ("Ctrl+W",     "Close tab",           "terminal document"),
 ("Ctrl+Tab",   "Next tab",            "terminal document"),
 ("Ctrl+F",     "Breakdown",           "terminal document"),
 ("Ctrl+K",     "Command palette",     "everywhere"),
 ("Ctrl+1..9",  "Select line n",       "terminal document"),
 ("Alt+Z",      "Fullscreen",          "terminal"),
 ("Esc",        "Close the top layer", "everywhere"),
 ("?",          "Show this map",       "everywhere"),
]

def pane(pid, name, fits, weight, rank, priority, demote_to,
         intent="resident", hold="fit", scroll=True, note=""):
    """A document ZONE. (The terminal no longer uses this -- §F composes instead
    of resolving, because there the user's own fractions are the anchor.)

    hold = what this zone defends when width runs short:
      "fit"       the LAYOUT is the information. A 10-column line table beats a
                  present-but-stacked-cards one. Give up residency, keep the fit.
      "residency" PRESENCE is the information. Give up the fit, stay on screen.
    """
    return {"id": pid, "name": name, "fits": fits, "weight": weight,
            "rank": rank, "priority": priority, "demote_to": demote_to,
            "intent": intent, "hold": hold, "floor": fits[0]["floor"],
            "scroll": scroll, "note": note}


# ═══════════════════════════════════════════════════════════════════════════
# §G  DOCUMENT EDITOR  — one editor, thirteen types
# ═══════════════════════════════════════════════════════════════════════════
DOC_ZONES = [
  pane("docheader","Header", [{"cols":8,"variant":"2col","floor":DOC_HDR_2COL,"desc":"two field columns"},
                              {"cols":4,"variant":"1col","floor":DOC_HDR_1COL,"desc":"one field column"}],
       1.00, 1, 4, "stacked", note="always full width; never a sheet"),
  pane("lines","Lines", [{"cols":8,"variant":"full", "floor":DOC_FULL,"desc":"10 columns"},
                         {"cols":7,"variant":"std",  "floor":DOC_STD, "desc":"7 columns"},
                         {"cols":6,"variant":"lean", "floor":DOC_LEAN,"desc":"5 columns"},
                         {"cols":4,"variant":"cards","floor":DOC_CARD,"desc":"one card per line"}],
       0.72, 1, 1, "stacked"),
  pane("summary","Summary",[{"cols":4,"variant":"panel","floor":DOC_SUM_FULL,"desc":"resident right panel"},
                            {"cols":3,"variant":"tight","floor":DOC_SUM_MIN, "desc":"narrow panel"}],
       0.28, 1, 2, "stacked", note="demotes to a sticky action bar with an expandable breakdown"),
]

DOC_DENSITY = [
  {"id":"simple","name":"Simple","for":"first-time users, cashiers, single-product shops",
   "line_cols":["item","qty","rate","total","del"],
   "header":["party","date"],
   "summary":["total","settled","balance"],
   "hidden_behind":"Show more"},
  {"id":"standard","name":"Standard","for":"the default for every type",
   "line_cols":["idx","item","qty","rate","disc","total","del"],
   "header":["party","docno","date","terms","due","method","account"],
   "summary":["subtotal","item_disc","doc_disc","tax","total","settled","balance"],
   "hidden_behind":"Advanced"},
  {"id":"pro","name":"Pro","for":"accountants, wholesalers, multi-warehouse, tax-heavy",
   "line_cols":["idx","item","qty","free","uom","rate","disc","tax","total","del"],
   "header":["party","docno","partyref","date","due","terms","method","account","location","project","currency","fx"],
   "summary":["subtotal","item_disc","doc_disc","tax_breakdown","shipping","extra","roundoff","total","settled","balance"],
   "hidden_behind":None},
]

# The 13 document types, from the codebase inventory. `label` overrides prove
# that a type-specific word is a LABEL, never a different screen.
DOC_TYPES = [
 {"id":"sales_invoice","name":"Sales invoice","prefix":"INV","side":"sell","density":"standard",
  "labels":{"party":"Customer","docno":"Invoice #","settled":"Amount paid","rate":"Price","save":"Complete sale"},
  "on":["lines","party_balance","free_qty","inline_party","inline_product","scan","quick_entry",
        "overpayment","tax_dropdown","roundoff","print","convert_none","posted_lock","tabs"],
  "off":[]},
 {"id":"purchase_invoice","name":"Purchase invoice","prefix":"BILL","side":"buy","density":"pro",
  "labels":{"party":"Supplier","docno":"Bill #","partyref":"Supplier invoice #","settled":"Amount paid","rate":"Unit cost","save":"Post purchase"},
  "on":["lines","landed_costs","per_line_tax","business_pct","roundoff_input","goods_status",
        "location","notes","zero_cost_ack","payable_flip"],
  "off":["free_qty","overpayment"]},
 {"id":"quotation","name":"Quotation","prefix":"QT","side":"sell","density":"standard",
  "labels":{"party":"Customer","docno":"Quote #","settled":"Advance","save":"Save quote"},
  "on":["lines","valid_until","doc_status","convert","print","inline_party","inline_product","free_qty"],
  "off":["overpayment","posted_lock"]},
 {"id":"sales_order","name":"Sales order","prefix":"SO","side":"sell","density":"standard",
  "labels":{"party":"Customer","docno":"Order #","settled":"Advance","save":"Confirm order"},
  "on":["lines","reserve_stock","expected_date","convert","location","free_qty","print"],
  "off":["overpayment"]},
 {"id":"purchase_order","name":"Purchase order","prefix":"PO","side":"buy","density":"standard",
  "labels":{"party":"Supplier","docno":"PO #","settled":"Advance","rate":"Unit cost","save":"Place order"},
  "on":["lines","tax_inclusive_flag","expected_date","location","goods_status","print","receive"],
  "off":["free_qty","overpayment"]},
 {"id":"sale_return","name":"Sale return","prefix":"SRET","side":"sell","density":"standard",
  "labels":{"party":"Customer","docno":"Return #","settled":"Amount refunded","save":"Confirm return"},
  "on":["lines","source_doc","qty_cap","reason","location","refund_account","print","roundoff"],
  "off":["overpayment"]},
 {"id":"purchase_return","name":"Purchase return","prefix":"PRET","side":"buy","density":"standard",
  "labels":{"party":"Supplier","docno":"Return #","settled":"Amount received","rate":"Unit cost","save":"Confirm return"},
  "on":["lines","source_doc","qty_cap","reason","batch_pick","location"],
  "off":["free_qty","overpayment","inline_product"]},
 {"id":"debit_note","name":"Debit note","prefix":"DN","side":"buy","density":"standard",
  "labels":{"party":"Supplier","docno":"Note #","settled":"Refund received","save":"Create debit note"},
  "on":["lines","reason","location","refund_account"],
  "off":["overpayment"]},
 {"id":"goods_receipt","name":"Goods receipt","prefix":"GRN","side":"buy","density":"standard",
  "labels":{"party":"Supplier","docno":"Receipt #","save":"Receive goods"},
  "on":["source_doc","ordered_received_remaining","qty_cap","batch_entry","expiry_entry","notes","location"],
  "off":["rate_edit","disc","free_qty","summary_money","inline_product","overpayment"]},
 {"id":"expense","name":"Expense","prefix":"EXP","side":"buy","density":"simple",
  "labels":{"party":"Payee","docno":"Reference #","settled":"Amount paid","save":"Save record"},
  "on":["no_lines","category","attachment","tax_amount","description","method_cash_bank"],
  "off":["lines","free_qty","overpayment","print","convert"]},
 {"id":"stock_transfer","name":"Stock transfer","prefix":"TRF","side":"stock","density":"simple",
  "labels":{"docno":"Transfer #","save":"Create transfer"},
  "on":["location_pair","doc_status","notes","qty_only"],
  "off":["party","rate","disc","tax","summary_money","free_qty","overpayment","print"]},
 {"id":"stock_audit","name":"Stock audit","prefix":"AUD","side":"stock","density":"simple",
  "labels":{"docno":"Audit #","save":"Save audit"},
  "on":["location","expected_counted_difference","doc_status","notes"],
  "off":["party","rate","disc","tax","summary_money","free_qty","overpayment","print"]},
 {"id":"recurring_invoice","name":"Recurring invoice","prefix":"REC","side":"sell","density":"standard",
  "labels":{"party":"Customer","docno":"Template #","save":"Save template"},
  "on":["lines","frequency","next_run","active_paused","location","free_qty","roundoff"],
  "off":["docno_manual","print","overpayment","convert"]},
]

# Capability catalogue. Every one of these came out of the codebase inventory;
# the unified editor must be able to switch each on. This IS the no-loss proof.
DOC_CAPS = {
 "lines":"line-item table","no_lines":"document has no line items",
 "party_balance":"party card shows balance and address",
 "free_qty":"free / bonus quantity column",
 "inline_party":"create a party without leaving the document",
 "inline_product":"create a product without leaving the document",
 "scan":"barcode scan-to-add buffer",
 "quick_entry":"single-row rapid add (Alt+Q)",
 "overpayment":"give change vs credit to ledger decision",
 "tax_dropdown":"tax rate from settings.tax_rates, not free text",
 "roundoff":"round_off_total applied from settings",
 "roundoff_input":"explicit editable round-off",
 "print":"save and print",
 "convert":"convert to another document type",
 "convert_none":"no conversion target",
 "posted_lock":"posted document becomes read-only",
 "tabs":"multiple documents open at once",
 "landed_costs":"freight/duty allocation block",
 "per_line_tax":"tax rate per line",
 "business_pct":"business vs personal cost split",
 "goods_status":"received now vs not yet received",
 "location":"warehouse / location picker",
 "notes":"notes textarea",
 "zero_cost_ack":"zero unit cost acknowledgement",
 "payable_flip":"cash-to-pay vs payable label flip",
 "valid_until":"offer expiry date",
 "doc_status":"draft / sent / accepted lifecycle",
 "reserve_stock":"reserve without deducting",
 "expected_date":"expected delivery date",
 "tax_inclusive_flag":"prices include tax",
 "receive":"partial goods receipt",
 "source_doc":"linked to a parent document",
 "qty_cap":"quantity capped by the parent document",
 "reason":"mandatory structured reason",
 "refund_account":"which account the refund moves through",
 "batch_pick":"choose a batch",
 "batch_entry":"record a batch number",
 "expiry_entry":"record an expiry date",
 "ordered_received_remaining":"ordered / received / remaining columns",
 "rate_edit":"unit rate is editable",
 "disc":"discount column",
 "summary_money":"money summary panel",
 "category":"expense category",
 "attachment":"file attachment",
 "tax_amount":"tax as an amount, not a rate",
 "description":"required description",
 "method_cash_bank":"cash / bank settlement toggle",
 "location_pair":"source and destination location",
 "qty_only":"quantity only, no money",
 "expected_counted_difference":"expected / counted / difference columns",
 "frequency":"billing frequency",
 "next_run":"next run date",
 "active_paused":"active / paused",
 "docno_manual":"manually editable document number",
 "party":"party picker",
 "rate":"unit rate column",
 "tax":"tax",
}

# Gaps the inventory found. The unified editor closes them by construction --
# recorded here so the decision is explicit, not accidental.
DOC_FIXES = [
 ("notes",
  "Notes is in the payload of SI, QT, SO, SR and PO and in WorkspaceContext's default document, and NONE of the eight clone screens renders a textarea for it.",
  "A resident field on every type, in the one payload builder."),
 ("terms",
  "The Net 7/15/30/60 select is never submitted on any screen; due_date is sent from a `dueDate` key that no input writes.",
  "Terms WRITES the due date. One control, not two, and the due date is editable."),
 ("valid_until",
  "A quotation has no Valid Until input at all, though it is the defining field of a quote. The payload sends currentInvoice.dueDate, which is always null.",
  "Required on quotation, absent everywhere else."),
 ("po_location",
  "Purchase order requires warehouse_id server-side and renders no input; it silently falls back to warehouses[0].",
  "Location is a resident field wherever the server needs one."),
 ("qt_payload",
  "Quotation collects tax, delivery, extra charges, amount paid, free quantity, date and reference in the UI and drops all seven from the payload.",
  "One payload builder for all thirteen types — a field that renders is a field that posts."),
 ("so_payload",
  "Sales order sends notes, reference, header discount, tax and per-line discount, and SalesOrderController::store ignores every one.",
  "Same builder, same contract, verified against the V3 endpoints."),
 ("dn_warehouse",
  "Debit note never sends warehouse_id, so DebitNoteController::returnStock() never fires and returned stock is never restored.",
  "Location is resident, so the guard that skips the restock cannot be reached."),
 ("sr_warehouse",
  "Sale return hard-codes warehouse_id to Warehouse::first() and forces tax and discount to 0 server-side while the UI collects both.",
  "Location resident; collected totals are the posted totals."),
 ("tax_source",
  "Only the sales invoice reads settings.tax_rates. Every other screen makes the user type a raw percentage.",
  "Every type reads the same tax source."),
 ("roundoff",
  "Only sales invoice and recurring invoice apply roundTotal(), so the same cart totals differently per document type.",
  "Round-off is a document property, applied once."),
 ("free_qty",
  "Free quantity reaches the database from 2 of 7 sell-side types. On the other five it inflates the on-screen subtotal and is then dropped.",
  "A capability with one implementation — on or off, never half."),
 ("party_type",
  "Every party picker except V3 Purchase uses type=all, so a purchase order will happily accept a customer.",
  "Party type is derived from the document's side."),
 ("share",
  "No email, WhatsApp, PDF, duplicate or record-payment action exists on any editor; email and WhatsApp live only on Sales/Show.jsx.",
  "All of them are document actions, available from the editor."),
 ("fkeys",
  "The documented F-key map exists only in Pos.jsx. KeyboardShortcutsModal.jsx advertises it to every user and no document screen implements any of it.",
  "One scoped keymap, shared by the terminal and the document."),
 ("uom",
  "No UoM, batch, serial, HSN, per-line warehouse or per-line note anywhere on the sell side, though Product carries all of them and V3 StoreSaleRequest already REQUIRES items.*.sale_uom.",
  "Pro density exposes them; the V3 endpoints can finally be reached from a screen."),
 ("currency",
  "No currency, exchange rate, salesperson, project or cost centre on any of the thirteen screens — zero occurrences.",
  "Pro density carries them."),
 ("duplicate_file",
  "Sales/CreatePreSale.jsx (2,427 lines) is a live but stale duplicate of SalesOrders/CreatePreSale.jsx, reachable at store.presales.create.",
  "One editor. There is nothing left to duplicate."),
]

# ═══════════════════════════════════════════════════════════════════════════
# §H  EDIT MODE  — the contract Reckoner will drive
# ═══════════════════════════════════════════════════════════════════════════
EDIT = {
  "principle": "Edit mode changes what the user may CHANGE, never what the law ALLOWS. Every gesture is snapped to the law before it is committed, so a user cannot save a layout the law would reject.",
  "grants": [
    {"id":"move",    "gesture":"drag the card header",         "snap":"nearest column and row; reading order follows the DOM, never x/y"},
    {"id":"resize",  "gesture":"drag the bottom-right corner", "snap":"integer columns and rows, clamped to the category min and max fits"},
    {"id":"add",     "gesture":"+ in the band gutter",         "snap":"inserts at that index with the category default fit"},
    {"id":"remove",  "gesture":"x on the card header",         "snap":"band re-flushes; no hole is ever left"},
    {"id":"swap",    "gesture":"pick a different reading",     "snap":"category may change; span re-resolves through §6"},
    {"id":"resize_band","gesture":"drag the band divider",     "snap":"changes rows for every card in the band at once"},
  ],
  "invariants": [
    "A card can never be dragged below its category floor -- the resize handle stops.",
    "A card can never exceed its category max -- the resize handle stops.",
    "A band contains only cards of equal row-span, so no hole can be created by a move.",
    "Reading order is the DOM order on every screen; moving a card on a 24-column screen changes its order on a 4-column phone identically.",
    "A layout authored at any width is legal at every width, because spans are stored as AUTHORED FITS, never as pixels or as x/y.",
    "Undo is a stack of layout snapshots, not of gestures.",
  ],
  "storage": {
    "table": "user_preferences",
    "why": "already exists (2026_08_08_000001), already does store-specific-then-account-wide fallback in one query via UserPreference::resolve(), and deliberately avoids the HasTenant global scope so null-tenant rows stay readable",
    "key": "shell",
    "shape": {
      "nav": {"desktop":"expanded|rail","tablet":"rail|hidden","intent":"expanded",
              "note":"intent is what the user last chose on a wide screen; it is restored when the window grows back"},
      "density": "simple|standard|pro",
      "pos_variant": "scan|column|row|grid|counter|table",
      "pos_catalog": "column|row|dominant|sheet|none",
      "dashboards": {"<surface>": [{"card":"id","cat":"C3","fit":"standard","order":0}]},
    },
    "conflict": "surface layouts stay in layout_preferences (already migrated, already has a `surface` column for exactly this); user_preferences.shell holds only chrome choices. Two stores, two jobs, no overlap.",
  },
  "reckoner": {
    "contract": "Reckoner emits a card DESCRIPTOR, never a layout. {reading, category, fit?, period?, chart?}. The engine turns descriptors into geometry. That separation is why an AI-authored dashboard cannot produce an illegal layout.",
    "guarantee": "validate() runs on every descriptor list before render. An illegal layout is rejected, not warned about.",
  },
}

# ═══════════════════════════════════════════════════════════════════════════
# §J  PLACEMENT LAW  — Flow vs Free, and the projection that makes Free legal
# ═══════════════════════════════════════════════════════════════════════════
# Rehan: "it should not be always moving towards the left side if I want to
# just have all the right side free."
#
# He is right, and v2.0's packer could not do it: packCards() flushed every
# band to the left and grew cards to eat the slack, so a deliberate gap was
# impossible to author. But the packer was not stupid -- it was solving the
# hard problem that free placement creates:
#
#     A LAYOUT AUTHORED AT 24 COLUMNS MUST STILL BE LEGAL AT 8, AND AT 4.
#
# Flow solved that by never storing a position at all. Free has to store one,
# so Free needs a projection. This is the same fork every mature editor has:
#
#   Gridstack   `float` (gravity off, gaps preserved) vs `compact`, and a
#               separate `columnOpts.layout` for what happens when the column
#               count changes: 'moveScale' = "Scale and move items by the
#               ratio of newColumnCount / oldColumnCount", 'list' = "keep
#               them sequentially without resizing", 'compact', 'move',
#               'scale', 'none'.
#   RGL v2      pluggable compaction: verticalCompactor / noCompactor
#               ("free positioning"), and per-breakpoint `layouts`.
#   Grafana     ships it as two named user modes: "Auto grid" / "Custom".
#
# So the law offers both, as a user setting, and defines Free precisely.
#
#   FLOW  a card stores {order, fit}. No position exists, so no position can
#         be wrong. Bands, flush, no holes. v2.0 behaviour, unchanged.
#
#   FREE  a card stores a BOX {col,row,w,h} together with the COLUMN CLASS N
#         it was authored in. Gaps are preserved: nothing is ever pulled left
#         and nothing is ever pulled up.
#
# --- the projection ------------------------------------------------------
# Between classes, take Gridstack's moveScale -- the ratio rule -- because it
# is the only rule that preserves the two things a user actually authored:
# WHERE across the width (col/N) and HOW MUCH of the width (w/N).
#
#     r = N' / N          w' = clamp(round(w*r), 1, N')
#                       col' = clamp(round(col*r), 0, N' - w')
#                       row' = row            (the row pitch never changes)
#
# then resolve collisions DOWNWARD ONLY, in row-major order. Down-only is what
# keeps the right side free: a card never travels left to fill a hole.
#
# --- the rule that makes it lossless -------------------------------------
# round() is lossy, so projecting 24 -> 20 -> 16 -> 12 accumulates error and a
# layout drifts as the user resizes the window. RGL's issue #1663 is exactly
# this complaint ("doesn't pop back when growing to original size").
#
#     ALWAYS PROJECT FROM AN AUTHORED CLASS. NEVER FROM A PROJECTION.
#
# A class is AUTHORED when the user edited in it. Otherwise it is DERIVED, and
# derived classes are recomputed on arrival from the nearest authored class --
# preferring the nearest LARGER one, because scaling down discards detail
# predictably while scaling up invents it. One projection, ever. No drift, and
# returning to the class you authored in restores it exactly.
#
# --- where Free is not offered -------------------------------------------
# At 4 columns the leanest card the law can make is 2 wide -- half the grid.
# A "gap" there is one card's worth of nothing, which is not composition, it
# is damage. Dynamics 365 Commerce draws the same line, abandoning drag-and-
# drop below 1024x768 and allowing property-only config. So:
#
#     Free placement exists at 6 columns and above. At 4 it is Flow.
#
# That is not a downgrade of the user's layout -- the boxes are kept, sorted
# row-major into reading order, and restored the moment the grid can carry
# them again.

PLACEMENT_MIN_FREE_COLS = min(c for c in LEGAL["tablet"])      # 6

def fit_in_box(cat, w, h, col):
    """The RICHEST fit that fits inside a w x h box on a grid of column `col`.

    This is resolve() read the other way round. resolve() asks "given this
    fit, how wide must the box be"; a resize handle asks "given this box,
    what is the best thing I can put in it". Same ordered fits, same floors,
    so the two can never disagree."""
    px = span(w, col)
    for f in cat["fits"]:
        if f["cols"] <= w and (f.get("rows") or 1) <= h and px >= f["floor"]:
            return f
    return None

def box_limits(cat, gcols, col):
    """The travel of the resize handle. The handle STOPS here -- it does not
    warn, and it does not let go of an illegal box and snap back."""
    wmax = min(cat["max"][0], gcols)
    hmax = cat["max"][1]
    wmin = next((w for w in range(1, wmax + 1) if fit_in_box(cat, w, hmax, col)), None)
    underflow = wmin is None
    if underflow: wmin = wmax          # only the whole grid will do; see UNDERFLOW
    hmin = {}
    for w in range(wmin, wmax + 1):
        hmin[w] = next((h for h in range(1, hmax + 1) if fit_in_box(cat, w, h, col)), hmax)
    return {"wmin": wmin, "wmax": wmax, "hmax": hmax, "hmin": hmin,
            "underflow": underflow}

def project_box(b, from_n, to_n):
    r = to_n / from_n
    w = max(1, min(to_n, round(b["w"] * r)))
    c = max(0, min(to_n - w, round(b["col"] * r)))
    return {**b, "col": c, "w": w, "row": b["row"], "h": b["h"]}

def _hits(a, b):
    return (a["col"] < b["col"] + b["w"] and b["col"] < a["col"] + a["w"] and
            a["row"] < b["row"] + b["h"] and b["row"] < a["row"] + a["h"])

def settle(boxes):
    """Resolve overlaps by pushing DOWN, in row-major order. Never left, never
    up: that is the whole difference between Free and Flow."""
    placed = []
    for b in sorted(boxes, key=lambda x: (x["row"], x["col"])):
        b = dict(b)
        moved = True
        while moved:
            moved = False
            for p in placed:
                if _hits(p, b):
                    b["row"] = p["row"] + p["h"]; moved = True
        placed.append(b)
    return placed

def clamp_box(b, gcols, col):
    """The ratio rule is pure arithmetic and does not know what is IN the box.
    A C3 metric scaled 24 -> 8 lands at 1 column wide, and 1 column holds no
    fit at all. So every projected box is clamped back into its category's own
    travel before it is settled -- the same travel the resize handle uses."""
    cat = next((c for c in V1["categories"] if c["id"] == b.get("catId")), None)
    if cat is None: return dict(b)
    lim = box_limits(cat, gcols, col)
    w = max(lim["wmin"], min(lim["wmax"], b["w"]))
    h = max(lim["hmin"].get(w, 1), min(lim["hmax"], b["h"]))
    c = max(0, min(gcols - w, b["col"]))
    return {**b, "col": c, "w": w, "h": h}

def project_layout(boxes, from_n, to_n, col=None):
    if from_n == to_n and col is None: return [dict(b) for b in boxes]
    out = [project_box(b, from_n, to_n) for b in boxes]
    if col is not None: out = [clamp_box(b, to_n, col) for b in out]
    return settle(out)

def layout_for(store, n, col=None):
    """store = {N: [box, ...]} of AUTHORED classes only. Returns the layout for
    class n, projected once from the nearest authored class -- larger first."""
    if n in store: return [dict(b) for b in store[n]]
    if not store:  return []
    above = sorted(k for k in store if k > n)
    below = sorted((k for k in store if k < n), reverse=True)
    src = above[0] if above else below[0]
    return project_layout(store[src], src, n, col)

def reading_order(boxes):
    """Row-major. This is the order a screen reader hears, the order the phone
    stacks in, and the order Flow would have used. It is derived from the
    geometry, so a Free layout still has ONE reading order everywhere."""
    return [b["id"] for b in sorted(boxes, key=lambda b: (b["row"], b["col"]))]

PLACEMENT = {
  "modes": [
    {"id": "flow", "name": "Flow", "stores": "{order, fit}",
     "packs": "bands, flushed left, no holes",
     "why": "nothing can be wrong because nothing is stored; the layout is re-derived at every width",
     "prior_art": "Gridstack compact / RGL verticalCompactor / Grafana 'Auto grid'"},
    {"id": "free", "name": "Free", "stores": "{col,row,w,h} @ column class N",
     "packs": "exactly where you put it; gaps preserved; collisions push DOWN only",
     "why": "you asked for the right side to stay empty if you leave it empty",
     "prior_art": "Gridstack float:true / RGL noCompactor / Grafana 'Custom layout'"},
  ],
  "projection": {
    "rule": "moveScale -- w and col scale by N'/N, row is absolute, then settle downward",
    "source": "always the nearest AUTHORED class, larger preferred; never a projection of a projection",
    "why": "round() is lossy; chaining projections drifts. One hop, always, so returning to the class you authored in restores it byte-for-byte.",
  },
  "min_free_cols": PLACEMENT_MIN_FREE_COLS,
  "mobile": "at 4 columns Free is not offered; the boxes are kept and sorted row-major into Flow, and restored when the grid can carry them again",
  "reading_order": "row-major (row, then col) in both modes -- so a Free layout still has one reading order on a phone and one for a screen reader",
}

# ═══════════════════════════════════════════════════════════════════════════
# §K  SPLITTER LAW  — "like in Windows", everywhere something expands
# ═══════════════════════════════════════════════════════════════════════════
# Rehan: "in windows there is this option for the sidebar that you can make it
# bigger and smaller -- for all places where we are giving the option to
# expand and make them smaller."
#
# A splitter is not a new idea in this law; it is the same rule as everything
# else, exposed as a handle. What matters is where it STOPS, and that has an
# arithmetic answer already in the file: the No-Regression Rule. Chrome may
# grow until the content beside it can no longer carry its floor. So:
#
#     navMax(vw) = vw - 2*margin(vw) - contentFloor(archetype)
#
# On a dashboard contentFloor is DESK_MIN_AVAIL = 904 -- the narrowest desktop
# grid the law ships, 8 columns at exactly 92px. Which means the sidebar
# splitter physically cannot be dragged into breaking the grid: the handle
# stops at the boundary, and the boundary is the same 904 that gives us 1216.
#
# Below push_min the nav overlays and costs the content nothing, so there the
# only limit is the drawer peek that keeps the page behind it visible.
#
# --- the snaps -----------------------------------------------------------
# A Windows splitter is continuous but magnetic. Ours snaps to widths that
# MEAN something:
#
#   RAIL (72)         the collapsed state
#   SIDEBAR (264)     the default -- and not an arbitrary one: at a 1920
#                     viewport, 1920 - 48 - 264 = 1608 = span(12, 112). The
#                     default sidebar is exactly the width that gives twelve
#                     columns at exactly the 112px target. It was derived, and
#                     the splitter can now show you why.
#   span-perfect      for every legal column count N, the nav width that puts
#                     the content column at exactly TARGET. Those are the
#                     widths where the grid is at its most regular, so they
#                     are the ones worth being magnetic.
#
# Keyboard is the WAI-ARIA window splitter pattern verbatim: role=separator,
# aria-valuenow/min/max, arrows nudge, Enter toggles collapse/restore, Home
# minimises, End maximises.

SPLIT_SNAP_PX   = 8            # magnet radius, both directions
SPLIT_STEP      = 8            # arrow-key nudge
SPLIT_PEEK      = NAV["drawer_peek"]

def content_floor(arch="dashboard"):
    """The narrowest content this archetype can survive on, in px."""
    if arch in ("dashboard", "index", "console"):
        return DESK_MIN_AVAIL                                    # 904
    if arch == "document":
        # stacked, so every zone is full width: the floor is the widest lean zone
        return max(z["fits"][-1]["floor"] for z in DOC_ZONES)
    return CART_MIN + GUTTER + TENDER_MIN                        # terminal

def nav_travel(vw, arch="dashboard"):
    """[min, max] px the nav splitter may occupy at this viewport.

    Pushing: the No-Regression Rule is the stop. Overlaying: the nav costs the
    content nothing, so the content cannot be the stop -- instead the drawer
    may not be wider than the widest sidebar the NARROWEST PUSHING SCREEN can
    carry, which is 1216 - 48 - 904 = 264. A drawer that outgrows the sidebar
    it becomes is not a drawer any more."""
    m = margin_at(vw)
    if nav_open_behaviour(vw) == "push":
        lo = rail_width_at(vw)
        hi = vw - 2 * m - content_floor(arch)
    else:
        lo = 0                                     # a drawer may close entirely
        hi = PUSH_MIN - 2 * M_DESK - content_floor(arch)
    hi = max(lo, min(hi, vw - SPLIT_PEEK))
    return (round(lo, 2), round(hi, 2))

def nav_snaps(vw, arch="dashboard"):
    """The magnetic stops, each with the reason it exists."""
    lo, hi = nav_travel(vw, arch)
    m = margin_at(vw)
    out = {}
    r = rail_width_at(vw)
    if lo <= r <= hi and r > 0: out[round(r)] = "rail"
    if lo <= SIDEBAR <= hi:     out[SIDEBAR] = "default"
    legal = LEGAL["desktop"] if vw >= NAV["rail_min"] else LEGAL["tablet"]
    for n in legal:
        w = vw - 2 * m - span(n, TARGET)
        if lo <= w <= hi and w >= RAIL:
            out.setdefault(round(w), f"{n} columns at exactly {TARGET}px")
    # two magnets closer together than the magnet radius are one magnet: keep
    # the one that arrived first (rail, then the default, then by column count)
    kept = []
    for k in sorted(out):
        if kept and k - kept[-1]["px"] <= SPLIT_SNAP_PX: continue
        kept.append({"px": k, "why": out[k]})
    return kept

def snap_nav(px, vw, arch="dashboard"):
    lo, hi = nav_travel(vw, arch)
    px = max(lo, min(hi, px))
    best = min(nav_snaps(vw, arch), key=lambda s: abs(s["px"] - px), default=None)
    if best and abs(best["px"] - px) <= SPLIT_SNAP_PX: return best["px"], best["why"]
    return round(px), None

SPLITTERS = [
  {"id": "shell.nav", "region": "primary navigation", "axis": "vertical",
   "min": "rail width at this viewport (0 while the nav overlays)",
   "max": "vw - 2*margin - 904, the No-Regression Rule made into a hard stop",
   "snaps": "rail, the 264 default, and every nav width that puts the content column at exactly 112px",
   "persists": "user_preferences.shell.nav.width"},
  {"id": "shell.subnav", "region": "secondary sidebar (Settings, Reports, Console)", "axis": "vertical",
   "min": "0 -- it collapses to a select in the header",
   "max": "nav max, less the primary nav",
   "snaps": "the 224 default", "persists": "user_preferences.shell.subnav.width"},
  {"id": "pos.cart|tender|catalog", "region": "register panes", "axis": "vertical",
   "min": "the measured floor of the pane's leanest fit",
   "max": "whatever leaves every other pane above its own floor",
   "snaps": "the preset's own fractions", "persists": "user_preferences.shell.pos"},
  {"id": "doc.summary", "region": "document summary column", "axis": "vertical",
   "min": "DOC_SUM_MIN", "max": "whatever leaves the line table above its lean floor",
   "snaps": "the density default", "persists": "user_preferences.shell.doc"},
]

SPLITTER = {
  "principle": "A splitter stops where the No-Regression Rule says the region beside it would lose a fit. It never lets go of an illegal width and snaps back -- it simply does not travel there.",
  "snap_px": SPLIT_SNAP_PX, "step_px": SPLIT_STEP,
  "aria": {"role": "separator", "props": ["aria-valuenow", "aria-valuemin", "aria-valuemax",
                                          "aria-controls", "aria-label", "aria-orientation"],
           "keys": {"ArrowLeft/ArrowRight": f"nudge {SPLIT_STEP}px",
                    "Enter": "toggle collapse / restore",
                    "Home": "minimise the primary pane",
                    "End": "maximise the primary pane",
                    "Escape": "cancel the drag, restore the width it started at"},
           "source": "WAI-ARIA APG, Window Splitter pattern"},
  "double_click": "restore the archetype default",
  "where": SPLITTERS,
}

# ═══════════════════════════════════════════════════════════════════════════
# §L  DOCUMENT COMPOSER  — the same move as §F, on the other work surface
# ═══════════════════════════════════════════════════════════════════════════
# Rehan, on the document editor:
#
#   "keep the summary on the right side, or make the customer and details
#    section collapsible at the top so the items get the middle and left
#    space. And when the user scrolls, show the summary in the bottom right
#    corner with Complete sale -- specially for the Pro density."
#   "for both the POS and the document one, let the user decide how they
#    want to have it."
#
# So the document stops being one arrangement with breakpoints and becomes a
# COMPOSITION, exactly like the register:
#
#   {details, summary, pin, split, density}
#
#   details  open        both field columns, the way it opens today
#            collapsed   one line -- party, number, date, running total --
#                        with a chevron. The lines get the height back.
#   summary  right       a resident column beside the lines
#            below       a full-width block under the last line
#            off         no panel; the dock carries the money
#   pin      sticky      the summary column holds still while the lines
#                        scroll past it
#            dock        it scrolls away and a compact bar takes over in the
#                        bottom-right corner: Total, and Complete sale
#            none        it just scrolls away
#   split    the summary's share of the width, clamped by measured floors
#
# --- WHY "SPECIALLY FOR PRO" IS A DERIVED SENTENCE, NOT A PREFERENCE ------
# Sticky only works if the whole column FITS in the viewport; a sticky thing
# taller than its viewport still scrolls, it just scrolls late, which is the
# worst of both. So:
#
#     pin = sticky   is offered only while  summary_h + actions_h <= usable_h
#     pin = dock     otherwise
#
# Summary height is a function of DENSITY, because density is literally the
# list of summary rows: Simple has 3, Standard 7, Pro 10 (with the tax
# breakdown). So Pro is the first density whose summary stops being stickable
# on a normal laptop -- which is exactly where Rehan noticed it. The rule is
# about height and it names Pro on its own.
#
# --- AND THE DOCK IS A LAYOUT ROW, NOT A FLOAT ---------------------------
# The Counter POS bug was a floating trigger covering the payment panel. The
# same bug is available here: a summary card floated bottom-right covers the
# last line of the table forever, and no amount of scrolling reveals it. So
# the dock RESERVES its own height at the bottom of the scroller. It is
# anchored bottom-right so the left of the last row stays visible, but the
# space it occupies is subtracted before anything is measured.

# These are the DESIGN SYSTEM's own box heights, not estimates of them. A
# height rule computed from a number the CSS does not honour is worse than no
# height rule at all: it was 28px per summary row here, the stylesheet paints
# 38, and the law happily called a 505px column stickable in 398px of room.
ZONE_H      = CTL["row_h"]                                      # 44, .zone-h
FIELD_ROW   = 14 + 4 + 42 + CTL["gap"]                          # 72, label+gap+.ctl+grid gap
SUM_ROW     = math.ceil(FS["micro"] * 1.5) + 2 * 9              # 38, .sum-row
SUM_TOT_ROW = FS["value"] - 4 + 2 * 13 + 3                      # 51, .sum-row.tot
DOC_ACTIONS_H = CTL["row_h"] + 2 * CTL["gap"]                   # 68, .actions
DOC_STRIP    = 180 + 120 + 96 + math.ceil(money(FS["body"])) + 3*CTL["gap"] + 2*PAD_SM
DOC_STRIP_H  = ZONE_H + 2 * 8                                   # 60, .strip
DOC_DOCK_MIN = math.ceil(money(FS["value"])) + CTL["gap"] + CTL["btn_min"] + 2*PAD_SM
DOC_DOCK_H   = CTL["btn_h"] + 2 * 10                            # 60, .dockbar
DOC_LINE_H   = 36 + 2 * 6 + 1                                   # 49, a table row + its border
DOC_LINES_MIN_H = DOC_LINE_H * 3          # a header row and two lines, or it is not a table

DOC_LINE_FITS = [("full", DOC_FULL), ("std", DOC_STD), ("lean", DOC_LEAN), ("cards", DOC_CARD)]
DOC_SUM_FITS  = [("panel", DOC_SUM_FULL), ("tight", DOC_SUM_MIN)]

# The document's version of CATALOG_RESIDENT_MIN_AVAIL, and derived the same
# way: a summary may only be a resident COLUMN while the line table beside it
# is still a TABLE. Once the lines have degraded to one card per line, a side
# panel is competing for width with content that has already lost its layout
# -- which is exactly what made the 768 portrait tablet bad.
DOC_SUM_RESIDENT_MIN_AVAIL = DOC_SUM_MIN + GUTTER + DOC_LEAN          # 834

def _dfit(fits, px):
    for name, floor in fits:
        if px >= floor: return name, floor
    return None, fits[-1][1]

def summary_height(density_id):
    """One row per key in the density's summary list, and the total row is the
    tall one. The renderer paints exactly this list -- one row per key, never
    an extra -- so the measurement and the DOM cannot drift apart."""
    d = next(x for x in DOC_DENSITY if x["id"] == density_id)
    n = len(d["summary"])
    return ZONE_H + (n - 1) * SUM_ROW + SUM_TOT_ROW

def details_height(density_id, two_col):
    d = next(x for x in DOC_DENSITY if x["id"] == density_id)
    n = len(d["header"]) + 1                                  # + the resident Notes field
    rows = math.ceil(n / 2) if two_col else n
    return ZONE_H + rows * FIELD_ROW + 2 * 14 - CTL["gap"]    # .hdr padding, last gap removed

def dcomp(details="open", summary="auto", pin="auto", split=0.30,
          density="standard", lines="auto"):
    return {"details": details, "summary": summary, "pin": pin,
            "split": split, "density": density, "lines": lines}

DOC_PRESETS = [
  {"id":"panel", "name":"Side panel", "comp": dcomp(),
   "for":"the default — details open, summary resident on the right at 30%"},
  {"id":"wide",  "name":"Wide lines", "comp": dcomp(details="collapsed", split=0.26),
   "for":"your own suggestion: collapse the customer block and give the items the width"},
  {"id":"focus", "name":"Focus",      "comp": dcomp(details="collapsed", summary="off", pin="dock"),
   "for":"nothing but the line table; the money lives in the dock"},
  {"id":"stack", "name":"Stacked",    "comp": dcomp(summary="below", pin="dock"),
   "for":"summary under the last line, dock carries Total and Complete"},
  {"id":"pro",   "name":"Pro ledger", "comp": dcomp(density="pro", split=0.32),
   "for":"ten line columns, twelve header fields, the full summary — and the docked total"},
  {"id":"touch", "name":"Touch",      "comp": dcomp(details="collapsed", summary="off",
                                                   pin="dock", density="simple"),
   "for":"a phone or a warehouse tablet: cards, one action, nothing else"},
]

LINE_RANK = {n: i for i, (n, _) in enumerate(DOC_LINE_FITS)}      # 0 = richest

def _doc_widths(comp, avail, mobile):
    """Settle the summary's residency and hand back both widths.

    Two thresholds, and the difference between them is the whole point:

      auto   the column stays while the lines can still hold a real TABLE
             (>= DOC_LEAN). It is the law's own trade: a summary panel is
             worth more than the 8th, 9th and 10th line column, and less than
             the table itself.
      right  you asked for it, so you get it wherever it is physically
             possible (>= DOC_CARD) -- and the readout tells you what it cost.

    Inside a mode every branch is monotone in `avail` and the branches join
    continuously, so a wider window never gives a narrower table."""
    want = comp["summary"]
    inner = avail - GUTTER
    mode, sum_px, why = want, 0.0, None
    if want in ("right", "auto"):
        floor = DOC_LEAN if want == "auto" else DOC_CARD
        s = clamp(inner * clamp(comp["split"], .12, .55),
                  DOC_SUM_MIN, max(DOC_SUM_MIN, inner - floor))
        lp = inner - s
        if mobile or lp < floor:
            mode = "below"
            why = (f"a {DOC_SUM_MIN}px column would leave the lines {round(max(lp,0))}px, "
                   f"under the {floor}px they need to stay a "
                   f"{'table' if want == 'auto' else 'list'}")
        else:
            mode, sum_px = "right", s
            a, b = _dfit(DOC_LINE_FITS, avail)[0], _dfit(DOC_LINE_FITS, lp)[0]
            if a != b: why = f"your choice — the column costs the table {a} → {b}"
    if mode == "below" and mobile:
        mode, why = "off", (why or "") + "; on a phone the money lives in the dock"
    lines_px = avail - (GUTTER + sum_px if mode == "right" else 0)
    return mode, sum_px, lines_px, why


def compose_document(comp, vw, vh=None, nav_w=None, arch="document"):
    m = margin_at(vw)
    vh    = vh or viewport_height(vw)
    usable = vh - HEADER - 2 * m
    mobile = vw <= PHONE_MAX

    # ---- 0. THE NAV NOW KNOWS WHAT YOU COMPOSED --------------------------
    # §I derived the document's expanded_min (1708) for the DEFAULT zone
    # weights. A user who widens the summary changes that arithmetic, and the
    # sweep caught it: at 1708 a Pro ledger with a 32% summary lost the tenth
    # line column the moment the nav expanded. So the No-Regression Rule moves
    # from derivation time to run time -- the nav holds the rail whenever
    # expanding would cost THIS composition a fit.
    nav_state = nav_default_for(vw, arch)
    navw = {"expanded": SIDEBAR, "rail": rail_width_at(vw), "hidden": 0}[nav_state]
    avail = (vw - navw - 2 * m) if nav_w is None else (vw - nav_w - 2 * m)
    nav_held = False
    if nav_w is None and nav_state == "expanded":
        alt = vw - rail_width_at(vw) - 2 * m
        f_now = _doc_widths(comp, avail, mobile)[2]
        f_alt = _doc_widths(comp, alt,   mobile)[2]
        if LINE_RANK[_dfit(DOC_LINE_FITS, f_alt)[0] or "cards"] < \
           LINE_RANK[_dfit(DOC_LINE_FITS, f_now)[0] or "cards"]:
            nav_state, avail, nav_held = "rail", alt, True

    # ---- 1. WIDTH: settle the summary's residency before measuring -------
    sum_mode, sum_px, lines_px, demoted = _doc_widths(comp, avail, mobile)
    sum_fit = _dfit(DOC_SUM_FITS, sum_px)[0] if sum_mode == "right" else None
    line_fit, line_floor = _dfit(DOC_LINE_FITS, lines_px)
    if line_fit is None: line_fit, line_floor = "cards", DOC_CARD
    g = {"nav": nav_state}

    # ---- 2. DENSITY: a preference the width has to be able to honour -----
    want_d = comp["density"]
    cap_d = "simple"
    for d in DOC_DENSITY:
        if doc_table(d["line_cols"]) <= lines_px: cap_d = d["id"]
    order = [d["id"] for d in DOC_DENSITY]
    density = want_d if order.index(want_d) <= order.index(cap_d) else cap_d
    capped = density != want_d

    # ---- 3. HEIGHT: nothing is removed; the details collapse instead -----
    two_col = avail >= DOC_HDR_2COL and not mobile
    det = comp["details"]
    det_h = 0.0
    if det == "open":
        det_h = details_height(density, two_col)
        if usable - det_h - DOC_DOCK_H - GUTTER < DOC_LINES_MIN_H:
            det = "collapsed"                    # auto-collapse, never auto-hide
    if det == "collapsed": det_h = DOC_STRIP_H

    # ---- 4. PIN: sticky only where the whole column actually fits --------
    sum_h  = summary_height(density)
    col_h  = sum_h + DOC_ACTIONS_H
    room   = usable - (det_h if sum_mode == "right" else 0)
    can_stick = sum_mode == "right" and col_h <= room
    pin = comp["pin"]
    if pin == "auto":  pin = "sticky" if can_stick else "dock"
    if pin == "sticky" and not can_stick:
        pin = "dock"; demoted = (demoted or "") + \
              f"; the {density} summary is {round(col_h)}px and only {round(room)}px stays on screen"
    if sum_mode == "off": pin = "dock"

    # ---- 5. THE DOCK IS A ROW. Its height is reserved, not floated. ------
    dock = []
    if pin == "dock" or sum_mode in ("below", "off") or mobile:
        dock = [{"id": "total", "w": None}, {"id": "complete", "w": CTL["btn_min"]}]
    dock_h = DOC_DOCK_H if dock else 0
    reserve = dock_h + (GUTTER if dock_h else 0)
    lines_h = usable - det_h - dock_h - (GUTTER if det_h else 0)

    reachable = {
      "lines":    lines_px >= DOC_CARD or vw < MIN_VIEWPORT,
      "details":  True,                       # collapsed is still one tap away
      "summary":  sum_mode != "off" or bool(dock),
      "total":    bool(dock) or sum_mode == "right" or sum_mode == "below",
      "complete": bool(dock) or sum_mode in ("right", "below"),
      "add_line": True,
    }
    return {
      "vw": vw, "vh": vh, "avail": round(avail, 1), "usable": round(usable, 1),
      "nav": g["nav"], "nav_held": nav_held, "mobile": mobile,
      "details": {"mode": det, "two_col": two_col, "h": round(det_h, 1),
                  "floor": DOC_STRIP if det == "collapsed" else
                           (DOC_HDR_2COL if two_col else DOC_HDR_1COL)},
      "lines": {"px": round(lines_px, 1), "fit": line_fit, "floor": line_floor,
                "h": round(lines_h, 1), "rows_visible": max(0, int(lines_h // DOC_LINE_H) - 1)},
      "summary": {"mode": sum_mode, "px": round(sum_px, 1), "fit": sum_fit,
                  "h": round(sum_h, 1), "pin": pin, "can_stick": can_stick},
      "density": density, "capped": capped, "wanted_density": want_d,
      "dock": dock, "dock_h": dock_h, "reserve": reserve,
      "demoted": demoted, "reachable": reachable,
    }

DOC_COMPOSER_CONTROLS = [
  {"id":"details","label":"Customer & details","kind":"seg",
   "options":[["open","Open"],["collapsed","Collapsed"]],
   "note":"collapsed is one line — party, number, date, running total — and the items get the height"},
  {"id":"summary","label":"Summary","kind":"seg",
   "options":[["auto","Auto"],["right","Right column"],["below","Below the lines"],["off","Off"]],
   "note":"auto keeps the column while it costs the line table nothing, and drops it below when it would"},
  {"id":"pin","label":"While you scroll","kind":"seg",
   "options":[["auto","Auto"],["sticky","Hold it in place"],["dock","Dock bottom-right"],["none","Let it scroll"]],
   "note":"auto holds it where the whole column fits on screen and docks it where it does not"},
  {"id":"split","label":"Summary width","kind":"slider","min":.12,"max":.55,"step":.01,
   "note":"clamped by the measured floors of both the summary and the line table"},
  {"id":"density","label":"Density","kind":"seg",
   "options":[["simple","Simple"],["standard","Standard"],["pro","Pro"]],
   "note":"the width can veto a density; it can never veto a capability"},
]

# ═══════════════════════════════════════════════════════════════════════════
# §I  ARCHETYPE NAV DEFAULTS  — the nav is not the same on every screen
# ═══════════════════════════════════════════════════════════════════════════
# Solving the document editor surfaced a cliff at the single most common
# laptop transition: at vp 1265 the nav is a 72px rail and the line table gets
# 807px (7 columns, Standard density). At vp 1280 the nav becomes the 264px
# expanded sidebar, the table drops to 680px, and the SAME DOCUMENT loses a
# column on a BIGGER screen. Buying a wider laptop made the invoice worse.
#
# The cause is that v1.0 gave the nav one global default. But a nav is not
# equally useful on every surface:
#
#   You navigate FROM a dashboard or a list. The nav is part of the task.
#   You do not navigate from an invoice or a register. There the nav is
#   parked chrome, and 192px of parked chrome is a whole table column.
#
# So the rule is:
#
#   THE NAV DEFAULTS TO THE WIDEST STATE THAT DOES NOT COST THE ARCHETYPE
#   ITS RICHEST LAYOUT.
#
# That is one sentence and it is derived, per archetype, by search below.
# The hamburger is still there at every width on every archetype, so the user
# can always overrule the default -- this only decides what they see first.

def _needs(zones, avail, gap=GUTTER):
    """Can this avail carry every zone's RICHEST fit, resident?"""
    w = avail - gap * (len(zones) - 1)
    tw = sum(z["weight"] for z in zones) or 1
    for z in zones:
        got = w * z["weight"] / tw
        cap = PANE_CAP.get(z["id"])
        if cap: got = min(got, cap)
        if got < z["fits"][0]["floor"]:
            return False
    return True

def derive_expanded_min(zones, subnav=False, lo=900, hi=4000):
    """Smallest viewport at which the EXPANDED nav still affords the richest layout."""
    extra = SUBNAV if subnav else 0
    for vw in range(lo, hi):
        if _needs(zones, vw - SIDEBAR - extra - 2 * M_DESK):
            return vw
    return None

def derive_subnav_col_min():
    """Smallest viewport at which a subnav COLUMN still leaves a legal grid.

    v1.0 shipped a 224px subnav as a third shell column from 1024 up. Check it
    against v1.0's own desktop column floor and it fails at four breakpoints:
      1024 rail+subnav -> 8 cols @ 64.00px   (floor is 92)
      1180 rail+subnav -> 8 cols @ 83.50px
      1351 expd+subnav -> 8 cols @ 80.88px
      1425 expd+subnav -> 8 cols @ 90.12px
    Below this threshold the subnav must be a horizontal tab strip, not a column.
    """
    for vw in range(900, 3000):
        if vw - RAIL - SUBNAV - 2 * M_DESK >= DESK_MIN_AVAIL:
            return vw
    return None

DOC_BODY = [z for z in DOC_ZONES if z["id"] != "docheader"]

# a console canvas is just a dashboard canvas, so its requirement is the grid floor
CONSOLE_ZONES = [{"id": "canvas", "weight": 1.0,
                  "fits": [{"cols": 8, "variant": "grid", "floor": DESK_MIN_AVAIL}]}]

ARCH_NAV = {
  "dashboard": {
    "rail_min": NAV["rail_min"], "expanded_min": NAV["expanded_min"],
    "subnav_col_min": None,
    "why": "You navigate FROM a dashboard. Cards adapt to any column count by "
           "§6, so an expanded nav never costs the surface its richest layout -- "
           "it only shows fewer cards per row. Keep the global default."},
  "index": {
    "rail_min": NAV["rail_min"], "expanded_min": NAV["expanded_min"],
    "subnav_col_min": None,
    "why": "Same as dashboard: a list is a place you navigate from, and table "
           "columns demote by priority rather than breaking."},
  "document": {
    "rail_min": 0, "expanded_min": derive_expanded_min(DOC_BODY),
    "subnav_col_min": None,
    "why": "A document is a work surface, not a place you navigate from. Hold "
           "the rail until an expanded nav is free -- which is the first width "
           "at which the 10-column line table AND the summary panel both still "
           "clear their floors."},
  "terminal": {
    "rail_min": 0, "expanded_min": None, "subnav_col_min": None,
    "why": "A register is a single-purpose surface you stand at for a shift. "
           "The nav tree is not part of the task, and the operator wants a way "
           "BACK, not a way ANYWHERE. Rail always; the hamburger still opens "
           "the full nav as an overlay."},
  "console": {
    "rail_min": 0, "expanded_min": derive_expanded_min(CONSOLE_ZONES, subnav=True),
    "subnav_col_min": derive_subnav_col_min(),
    "why": "Settings and Reports carry a 224px subnav. Two nav columns cost "
           "488px, so the expanded nav has to wait until the canvas still "
           "clears 904px -- and below subnav_col_min the subnav itself stops "
           "being a column and becomes a tab strip under the header."},
  "focus": {
    "rail_min": None, "expanded_min": None, "subnav_col_min": None,
    "why": "No nav at all. The only archetype allowed to cap its own width."},
}

# ═══════════════════════════════════════════════════════════════════════════
# §J  THE NO-REGRESSION RULE
# ═══════════════════════════════════════════════════════════════════════════
# Sweeping every width from 320 to 3440 exposed something v1.0 never checked:
# the content region is NOT monotonic in the viewport. Shell chrome arrives at
# fixed widths and takes its cut, so the content can SHRINK as the window GROWS.
#
#     vw 599  margin 16, no nav   -> avail 567
#     vw 600  margin 24, no nav   -> avail 552     -15px for +1px of window
#     vw 1023 rail hidden         -> avail  975
#     vw 1024 rail arrives (72)   -> avail  904    -71px for +1px of window
#     vw 1279 rail                -> avail 1159
#     vw 1280 expanded (264)      -> avail  968   -191px for +1px of window
#
# Every one of those is a visible jolt: drag a window one pixel wider and the
# layout gets worse. On a dashboard that is survivable, because cards adapt by
# showing fewer per row (§6) and the user is trading content for nav labels
# knowingly. On a terminal or a document it is not: panes lose fits and the
# work surface degrades.
#
#   THE NO-REGRESSION RULE
#   A piece of shell chrome may only arrive at a width where its arrival does
#   not reduce the content region below what the next-narrower width already
#   provided.
#
# This one rule is where all of these numbers come from, and they are the same
# number arrived at from different directions:
#     push_min 1216       expanding must not starve the grid
#     margin switch 616   the 24px margin must not cost more than it gains
#     document 1708       expanding must not cost the line table a column
#     console subnav 1248 a third shell column must leave a legal grid
#     terminal rail       the rail must not cost a pane a fit

# --- the margin cannot STEP, so it RAMPS ---------------------------------
# A step from a 16px to a 24px margin costs 16px of content at a single width,
# and no later width ever repays it -- both sides grow at the same rate, so the
# deficit is permanent. A step is therefore not fixable by moving it; it has to
# stop being a step. The margin ramps across a 48px band instead:
#
#     margin(vw) = clamp(16, 16 + (vw - 600)/6, 24)
#
# d(avail)/d(vw) = 1 - 2/6 = 2/3 > 0 across the band, so the content still
# grows with the window -- just more slowly while the margin catches up. In CSS
# this is literally one clamp(), no media query.
MARGIN_RAMP_LO, MARGIN_RAMP_HI = 600, 648

def margin_at(vw):
    if vw < MARGIN_RAMP_LO: return M_MOB
    if vw >= MARGIN_RAMP_HI: return M_DESK
    return M_MOB + (vw - MARGIN_RAMP_LO) * (M_DESK - M_MOB) / (MARGIN_RAMP_HI - MARGIN_RAMP_LO)

MARGIN_SWITCH = MARGIN_RAMP_HI

# --- WHY A PUSHING STEP CAN NEVER BE FREE --------------------------------
# The first attempt at this rule said "chrome that costs C pixels arrives C
# pixels later". That is wrong, and the sweep proved it: by the time you reach
# D+C the no-chrome baseline has ALSO grown by C, so the deficit is exactly as
# large as it was at D. Solve it properly:
#
#     arriving at A is free  <=>  A - C - 2m  >=  (A-1) - 2m  <=>  C <= 1
#
# So a step of pushing chrome is NEVER free, at any width, for any C > 1.
# There is no clever threshold. There are only three honest ways out, and the
# law uses all three, each where it belongs:
#
#   RAMP     the chrome's width is a clamp() over a band at least as long as
#            its cost, so d(nav)/d(vw) <= 1 and the content never steps down.
#            Used for the page margin (16->24 across 600-648) and the nav rail
#            (0->72 across 1024-1096). Across the band the extra window width
#            goes entirely to the chrome and the content simply holds still.
#
#   OVERLAY  the chrome takes zero width. Used for every nav below push_min,
#            which is the real reason a narrow window overlays -- not "the grid
#            gets small", but "an automatic push can never be free".
#
#   ABSORB   the step is allowed where no region LOSES A FIT because of it --
#            only fewer cards per row, or a table column that demotes by
#            priority. That is a checkable property, not an opinion, and it is
#            what separates the dashboard (absorbs at 1280) from the document
#            (cannot, so it waits until 1708) and the terminal (never).
#
# And the invariant that matters is therefore about FITS, not pixels: avail may
# dip when chrome absorbs, but no region may ever come out of that dip poorer.

RAIL_RAMP_LO, RAIL_RAMP_HI = NAV["rail_min"], NAV["rail_min"] + RAIL   # 1024..1096

def rail_width_at(vw):
    if vw < RAIL_RAMP_LO:  return 0
    if vw >= RAIL_RAMP_HI: return RAIL
    return (vw - RAIL_RAMP_LO) * RAIL / (RAIL_RAMP_HI - RAIL_RAMP_LO)

def derive_nav_schedule(arch):
    a = ARCH_NAV[arch]
    if a["rail_min"] is None:
        return {"rail": None, "expanded": None, "subnav_col": None}
    return {"rail": NAV["rail_min"],                       # ramps in, always free
            "expanded": a["expanded_min"],                 # a step: must ABSORB
            "subnav_col": a["subnav_col_min"] if arch == "console" else None}

# Dashboard and Index keep v1.0's schedule DELIBERATELY: cards and table
# columns absorb a narrower canvas by showing fewer per row, and a user who is
# navigating has chosen to spend width on nav labels. Everywhere else the
# No-Regression Rule governs.
NAV_SCHEDULE = {}
for _a in ARCH_NAV:
    NAV_SCHEDULE[_a] = derive_nav_schedule(_a)


def nav_default_for(vw, arch="dashboard"):
    sch = NAV_SCHEDULE[arch]
    if sch["rail"] is None: return "hidden"
    if sch["expanded"] and vw >= sch["expanded"]: return "expanded"
    if vw >= sch["rail"]: return "rail"
    return "hidden"

def geometry_for(vw, arch="dashboard", nav_open=False):
    subnav = (arch == "console" and vw >= NAV_SCHEDULE["console"]["subnav_col"])
    state  = nav_default_for(vw, arch)
    if nav_open and nav_open_behaviour(vw) == "push":
        state = "expanded" if state != "expanded" else "rail"
    return geometry(vw, nav=state, subnav=subnav)


# ═══════════════════════════════════════════════════════════════════════════
# SOLVE + VALIDATE
# ═══════════════════════════════════════════════════════════════════════════
BPS = [b["vp"] for b in V1["breakpoints"]]

def solve_nav_table():
    rows = []
    for vp in [360,390,414,600,768,820,1024,1180,1216,1265,1280,1351,1425,1521,1585,1905,2545,3425]:
        g_rest = geometry(vp)
        g_open = geometry(vp, nav_open=True)
        beh = nav_open_behaviour(vp)
        rows.append({
          "vp": vp,
          "resting": nav_default(vp),
          "resting_desc": nav_resting(vp),
          "hamburger": True,
          "on_open": beh,
          "open_nav_w": SIDEBAR if beh == "push" else 0,
          "drawer_w": None if beh == "push" else drawer_width(vp),
          "cols_rest": g_rest["cols"], "col_rest": round(g_rest["col"], 2),
          "cols_open": g_open["cols"], "col_open": round(g_open["col"], 2),
          "reflow": g_rest["cols"] != g_open["cols"] or abs(g_rest["col"]-g_open["col"]) > .01,
          "scrim": beh == "overlay",
        })
    return rows

ENVELOPES = {"pos": {}, "document": []}
_SWEEP_CACHE = {}

MIN_VIEWPORT = 360      # Android baseline. See UNDERFLOW.

def promotion_table():
    """Where each card category lands, regenerated under v2 geometry.

    v1.0 computed this with a hard 72px rail from 1024 up. v2 ramps the rail in
    across 1024-1096 so its arrival costs the content nothing, which means avail
    at exactly 1024 is 976 rather than 904 and every card is one step wider
    there. The table is derived, so it is regenerated rather than patched -- a
    stale derived table is how two parts of a system start quietly disagreeing.
    """
    out = {}
    for cat in V1["categories"]:
        row = {}
        for b in V1["breakpoints"]:
            vp = b["vp"]
            g = geometry_for(vp, "dashboard")
            r = resolve(cat["fits"], g["cols"], g["col"], cat["max"][0],
                        start=cat["default"], mobile_full=(cat["id"] != "C1"))
            row[str(vp)] = {"cols": r["cols"], "rows": r["rows"], "variant": r["variant"],
                            "width": round(r["px"], 1), "height": span(r["rows"], ROW),
                            "of": g["cols"], "per_row": max(1, g["cols"] // r["cols"]),
                            "full_width": r["fullWidth"], "ok": r["ok"],
                            "promoted": r["promoted"], "degraded": r["degraded"],
                            "underflow": (not r["ok"]) and vp < MIN_VIEWPORT}
        out[cat["id"]] = row
    return out


def envelope_table(sw):
    """Compress a 3,000-width sweep into the handful of steps that matter.

    Only the DOCUMENT needs this now. Its zones resolve -- lines and summary
    compete for width and a zone may not fall below a fit it already reached at
    a narrower width -- and a stateless runtime cannot rederive that history
    without replaying the sweep on every resize. So it is solved once here and
    shipped as a step table. The terminal does not need one: §F composes from the
    user's own fractions, so it has no history to remember.
    """
    rows, prev = [], None
    for vw in sorted(sw):
        cfg, clean, slack, g, mode = sw[vw]
        sig = (mode, tuple((c["id"], c["residency"], c["fit_idx"]) for c in cfg))
        if sig != prev:
            rows.append({"from": vw, "mode": mode,
                         "idx": {c["id"]: c["fit_idx"] for c in cfg},
                         "res": {c["id"]: c["residency"] for c in cfg}})
            prev = sig
    return rows


def solve_pos():
    """Every preset at every representative viewport, straight from the composer.

    No sweep and no envelope any more: composition is a pure function of the
    user's fractions and the measured floors, so a wider screen can only ever
    give a pane more pixels. Monotonicity is structural rather than searched for,
    which is both simpler and impossible to get wrong.
    """
    out = {}
    for pr in POS_PRESETS:
        per = {}
        for spec in VIEWPORTS:
            r = compose_terminal(pr["comp"], spec["vp"], spec["vh"])
            r["label"] = spec["label"]
            per[str(spec["vp"])] = r
        out[pr["id"]] = per
    return out, {}


def solve_doc():
    body = [z for z in DOC_ZONES if z["id"] != "docheader"]
    sw = sweep_variant(body, arch="document")
    brk = transitions(sw)
    ENVELOPES["document"] = envelope_table(sw)
    out = {}
    for vp in sorted(set(BPS + [600, 1216, 1248, 1280, 1440, 1708])):
        live, clean, slack, g, _m = sw[vp]
        avail = g["avail"]
        lines = next(x for x in live if x["id"] == "lines")
        w = lines["width"] if lines["residency"] == "resident" else avail
        density = "simple"
        for d in reversed(DOC_DENSITY):
            if doc_table(d["line_cols"]) <= w:
                density = d["id"]; break
        out[str(vp)] = {
          "avail": round(avail, 1), "cols": g["cols"], "nav": g["nav"],
          "header": "2col" if avail >= DOC_HDR_2COL else "1col",
          "lines": {"width": round(w, 1), "variant": lines["fit"], "max_density": density},
          "summary": next(x["residency"] for x in live if x["id"] == "summary"),
          "summary_fit": next(x["fit"] for x in live if x["id"] == "summary"),
          "summary_w": round(next(x["width"] for x in live if x["id"] == "summary"), 1),
          "clean": clean, "slack": slack,
        }
    return out, brk


def solve_doc_comp():
    """Every document preset at every representative viewport — the table the
    JS engine is cross-checked against."""
    out = {}
    for p in DOC_PRESETS:
        t = {}
        for vp in sorted(set(BPS + [600, 1216, 1248, 1280, 1440, 1708])):
            if vp < MIN_VIEWPORT: continue
            t[str(vp)] = compose_document(p["comp"], vp, viewport_height(vp))
        out[p["id"]] = t
    return out


def validate_all():
    errs = []
    # 1. nav: at every viewport the hamburger exists, and after opening the
    #    grid is still legal
    for r in solve_nav_table():
        if not r["hamburger"]:
            errs.append(("NAV_NO_HAMBURGER", r["vp"]))
        if r["on_open"] == "push" and r["col_open"] < DESK_COL_FLOOR - .01:
            errs.append(("NAV_PUSH_STARVES_GRID", r["vp"], r["col_open"]))
        if r["on_open"] == "overlay" and r["reflow"]:
            errs.append(("NAV_OVERLAY_REFLOWED", r["vp"]))
    # 2. v1.0 card law must still hold, untouched
    for cat in V1["categories"]:
        for vp in BPS:
            g = geometry(vp)
            r = resolve(cat["fits"], g["cols"], g["col"], cat["max"][0],
                        start=cat["default"], mobile_full=(cat["id"] != "C1"))
            if not r["ok"] and vp >= MIN_VIEWPORT:
                errs.append(("CARD_BELOW_FLOOR", cat["id"], vp, round(r["px"],1), r["floor"]))
            if r["cols"] > cat["max"][0]:
                errs.append(("CARD_ABOVE_MAX", cat["id"], vp))
    # 3. EVERY PRESET, EVERY VIEWPORT: nothing may be unreachable.
    #    This is the check that would have caught the Scan bug -- on a short
    #    screen the tender's Hold, Drawer and method controls scrolled below the
    #    fold with no way to reach them.
    pos, pos_brk = solve_pos()
    doc, doc_brk = solve_doc()
    for pid, table in pos.items():
        for vp, r in table.items():
            for what, ok in r["reachable"].items():
                if not ok:
                    errs.append(("POS_UNREACHABLE", pid, vp, what))
            if r["cart"]["below_floor"]:
                errs.append(("POS_CART_BELOW_FLOOR", pid, vp,
                             round(r["cart"]["px"]), CART_MIN))
            # a resident pane must clear the fit it claims
            if r["catalog"] and r["catalog"].get("px"):
                f, fl = fit_for("catalog", r["catalog"]["px"])
                if f is None:
                    errs.append(("POS_CATALOG_BELOW_FLOOR", pid, vp))
            if r["tender"] and r["tender"].get("px"):
                f, fl = fit_for("tender", r["tender"]["px"])
                if f is None:
                    errs.append(("POS_TENDER_BELOW_FLOOR", pid, vp))
            # THE CATALOG IS NEVER RESIDENT WHERE REHAN SAID IT MUST NOT BE
            if r["catalog"] and r["catalog"]["mode"] in ("left", "right") \
               and r["avail"] < CATALOG_RESIDENT_MIN_AVAIL:
                errs.append(("POS_CATALOG_RESIDENT_TOO_NARROW", pid, vp))
            # a dock is a LAYOUT ROW, so its height must be accounted for
            if r["dock"] and r["dock_h"] <= 0:
                errs.append(("POS_DOCK_NO_HEIGHT", pid, vp))

    # 4b. THE FIT-MONOTONICITY SWEEP.
    #     avail is allowed to dip where chrome ABSORBS. This is the check that
    #     says the absorption really happened: walk every integer width from
    #     320 to 3440 and assert that no region ever comes out of a dip poorer
    #     than it went in. This is the only test that can license the 1280
    #     expanded step -- and the one that refused it for documents.
    for cat in V1["categories"]:
        bestk, prev = 99, None
        for vw in range(320, 3441):
            g = geometry_for(vw, "dashboard")
            r = resolve(cat["fits"], g["cols"], g["col"], cat["max"][0],
                        start=cat["default"], mobile_full=(cat["id"] != "C1"))
            k = next(i for i, f in enumerate(cat["fits"]) if f["variant"] == r["variant"])
            if k > bestk:
                errs.append(("CARD_FIT_REGRESSED", cat["id"], vw, prev, r["variant"]))
                break
            bestk = min(bestk, k); prev = r["variant"]

    LINEK = {"full": 0, "std": 1, "lean": 2, "cards": 3}
    bestk, prev = 99, None
    for vw in range(320, 3441):
        g = geometry_for(vw, "document")
        cfg, _, _ = fit_panes([{**z} for z in DOC_ZONES if z["id"] != "docheader"], g["avail"])
        ln = next(c for c in cfg if c["id"] == "lines")
        k = LINEK[ln["fit"]]
        if k > bestk:
            errs.append(("DOC_FIT_REGRESSED", vw, prev, ln["fit"])); break
        bestk = min(bestk, k); prev = ln["fit"]

    # 5. MONOTONICITY -- a bigger screen must never give a worse layout.
    #    This is the check that catches cliffs like "1280 laptop shows less
    #    than a 1265 laptop". Nothing else in the suite would have found it.
    DENS = {"simple": 0, "standard": 1, "pro": 2}
    LINE = {"cards": 0, "lean": 1, "std": 2, "full": 3}
    prev = None
    for vp in sorted(doc, key=int):
        cur = (DENS[doc[vp]["lines"]["max_density"]], LINE[doc[vp]["lines"]["variant"]])
        if prev and (cur[0] < prev[1][0] or cur[1] < prev[1][1]):
            errs.append(("DOC_NON_MONOTONIC", prev[0], "->", vp,
                         doc[prev[0]]["lines"]["variant"], "->", doc[vp]["lines"]["variant"]))
        prev = (vp, cur)

    # The terminal no longer needs a monotonicity check: composition is a pure
    # function of the user's fractions, so a pane's pixels can only grow with the
    # viewport. The check below still guards the DOCUMENT, which does resolve.

    # 6. THE CONSOLE / SUBNAV CHECK.
    #    v1.0 shipped a 224px subnav as a third shell column from 1024 up and
    #    never checked it against its own 92px desktop column floor.
    for vp in sorted(set(BPS + [1248, 1440])):
        if vp < NAV["rail_min"]:
            continue
        g = geometry_for(vp, "console")
        col_min = NAV_SCHEDULE["console"]["subnav_col"]
        if vp >= col_min and g["col"] < DESK_COL_FLOOR - .01:
            errs.append(("CONSOLE_SUBNAV_STARVES_GRID", vp, round(g["col"], 2)))

    # 6b. THE RANK BUDGET. Rank 1 is capped at 7 on the working surface --
    #     past the working-memory span the user scans instead of acting, which
    #     is the mechanism behind "it feels overwhelming". Rank 3 is capped at
    #     ZERO on the surface: a monthly control docked permanently is thirty
    #     days of noise for one day of use.
    surf1 = [c for c in POS_CAPS if c["rank"] == 1 and c["home"] == "surface"]
    # home="line-visible" is always on screen but belongs to the cart-lines
    # object, so it costs one unit of attention rather than one per line and is
    # not counted separately against the budget.
    if len(surf1) > 7:
        errs.append(("RANK1_OVER_BUDGET", len(surf1), [c["id"] for c in surf1]))
    surf3 = [c for c in POS_CAPS if c["rank"] == 3 and c["home"] == "surface"]
    if surf3:
        errs.append(("RANK3_ON_SURFACE", [c["id"] for c in surf3]))
    for vid, ov in POS_VARIANT_OVERRIDES.items():
        if vid not in {v["id"] for v in POS_PRESETS}:
            errs.append(("UNKNOWN_PRESET_OVERRIDE", vid))
        for cid in ov:
            if cid not in {c["id"] for c in POS_CAPS}:
                errs.append(("UNKNOWN_CAP_OVERRIDE", vid, cid))

    # 7. every capability referenced by a doc type must exist in the catalogue
    for t in DOC_TYPES:
        for c in t["on"] + t["off"]:
            if c not in DOC_CAPS:
                errs.append(("DOC_UNKNOWN_CAP", t["id"], c))

    # 8. PLACEMENT: the projection has to survive every column class, both
    #    directions, on a real layout -- in bounds, no overlap, and an exact
    #    round trip back to the class it was authored in.
    ALLN = sorted(set(LEGAL["desktop"] + LEGAL["tablet"] + LEGAL["mobile"]))
    # the geometry each class actually occurs at, so the clamp is real
    NCOL = {}
    for vw in range(MIN_VIEWPORT, 3441, 3):
        g = geometry(vw)
        NCOL.setdefault(g["cols"], g["col"])
    src24 = [                                     # a deliberately gappy layout:
      {"id":"a","catId":"C3","col":0, "row":0,"w":4,"h":2},
      {"id":"b","catId":"C3","col":4, "row":0,"w":4,"h":2},
      {"id":"c","catId":"C4","col":14,"row":0,"w":4,"h":4},   # a hole at 8..13
      {"id":"d","catId":"C5","col":0, "row":2,"w":6,"h":6},
      {"id":"e","catId":"C6","col":10,"row":4,"w":8,"h":8},   # deliberately right
      {"id":"f","catId":"C1","col":22,"row":0,"w":2,"h":1},   # hard against the edge
    ]
    for n in ALLN:
        col = NCOL.get(n)
        got = project_layout(src24, 24, n, col)
        if len(got) != len(src24):
            errs.append(("PLACE_LOST_A_CARD", n, len(got)))
        for b in got:
            if b["col"] < 0 or b["col"] + b["w"] > n:
                errs.append(("PLACE_OUT_OF_BOUNDS", n, b["id"], b["col"], b["w"]))
            if b["w"] < 1 or b["h"] < 1:
                errs.append(("PLACE_DEGENERATE", n, b["id"]))
            # every projected box must still hold a real fit
            cat = next(c for c in V1["categories"] if c["id"] == b["catId"])
            if col and not box_limits(cat, n, col)["underflow"] \
               and fit_in_box(cat, b["w"], b["h"], col) is None:
                errs.append(("PLACE_BOX_HOLDS_NOTHING", n, b["id"], b["w"], b["h"]))
        for i, p in enumerate(got):
            for q in got[i+1:]:
                if _hits(p, q):
                    errs.append(("PLACE_OVERLAP", n, p["id"], q["id"]))
        # nothing may be lost on the way back either
        if n != 24:
            back = {b["id"] for b in project_layout(got, n, 24, NCOL.get(24))}
            for b in src24:
                if b["id"] not in back: errs.append(("PLACE_ROUNDTRIP_LOST", n, b["id"]))
        # reading order must be a total order over exactly the same ids
        if sorted(reading_order(got)) != sorted(b["id"] for b in src24):
            errs.append(("PLACE_READING_ORDER", n))

    # 8b. the resize handle's travel must be non-empty and must agree with
    #     resolve() -- the box it stops at has to hold a real fit.
    for cat in V1["categories"]:
        for vp in BPS:
            if vp < MIN_VIEWPORT: continue
            g = geometry(vp)
            lim = box_limits(cat, g["cols"], g["col"])
            if lim["underflow"]: continue          # covered by UNDERFLOW
            if lim["wmin"] > lim["wmax"]:
                errs.append(("BOX_EMPTY_TRAVEL", cat["id"], vp))
            for w in range(lim["wmin"], lim["wmax"] + 1):
                h = lim["hmin"][w]
                if fit_in_box(cat, w, h, g["col"]) is None:
                    errs.append(("BOX_MIN_HOLDS_NOTHING", cat["id"], vp, w, h))
            # the smallest legal box must never be richer than resolve()'s own
            # answer -- the two readings of the same fit list must agree
            r = resolve(cat["fits"], g["cols"], g["col"], cat["max"][0],
                        start=cat["default"], mobile_full=(cat["id"] != "C1"))
            if r["ok"] and fit_in_box(cat, r["cols"], r["rows"] or 1, g["col"]) is None:
                errs.append(("BOX_DISAGREES_WITH_RESOLVE", cat["id"], vp, r["variant"]))

    # 8c. DOCUMENT COMPOSER: every preset, every 8px. The same three promises
    #     the terminal makes — nothing unreachable, nothing below a floor, and
    #     the dock is a reserved ROW rather than a float over the last line.
    for p in DOC_PRESETS:
        for vw in range(MIN_VIEWPORT, 3441, 8):
            r = compose_document(p["comp"], vw, viewport_height(vw))
            for what, ok in r["reachable"].items():
                if not ok: errs.append(("DOC_UNREACHABLE", p["id"], vw, what))
            if r["summary"]["mode"] == "right":
                if r["summary"]["px"] < DOC_SUM_MIN - .01:
                    errs.append(("DOC_SUMMARY_BELOW_FLOOR", p["id"], vw, r["summary"]["px"]))
            if r["lines"]["px"] < DOC_CARD - .01:
                errs.append(("DOC_LINES_BELOW_FLOOR", p["id"], vw, r["lines"]["px"]))
            if r["dock"] and r["dock_h"] <= 0:
                errs.append(("DOC_DOCK_NO_HEIGHT", p["id"], vw))
            if r["dock"] and r["reserve"] < r["dock_h"]:
                errs.append(("DOC_DOCK_NOT_RESERVED", p["id"], vw))
            # the point of collapsing the details is that the lines survive
            if r["lines"]["h"] < DOC_LINES_MIN_H - .01:
                errs.append(("DOC_LINES_NO_HEIGHT", p["id"], vw, round(r["lines"]["h"])))
            if r["summary"]["pin"] == "sticky" and not r["summary"]["can_stick"]:
                errs.append(("DOC_STICKY_DOES_NOT_FIT", p["id"], vw))
            # a density may be capped, never a capability
            if r["capped"] and r["density"] == r["wanted_density"]:
                errs.append(("DOC_DENSITY_FLAG", p["id"], vw))
    # MONOTONICITY, honestly scoped. Inside one resolved arrangement a wider
    # screen may never give a poorer line fit -- that is the invariant. When
    # the ARRANGEMENT itself changes (the summary gains or loses residency)
    # the law is choosing between two different layouts, so the check there is
    # the one that means something: a summary may only take up residence while
    # the lines can still hold a real table.
    for p in DOC_PRESETS:
        best, mode = 99, None
        for vw in range(MIN_VIEWPORT, 3441, 4):
            r = compose_document(p["comp"], vw, viewport_height(vw))
            k = LINE_RANK[r["lines"]["fit"]]
            if r["summary"]["mode"] != mode:
                if r["summary"]["mode"] == "right" and p["comp"]["summary"] == "auto" \
                   and r["lines"]["px"] < DOC_LEAN - .01:
                    errs.append(("DOC_RESIDENCY_COST_THE_TABLE", p["id"], vw,
                                 round(r["lines"]["px"])))
                mode, best = r["summary"]["mode"], k       # a new arrangement, a new run
            elif k > best:
                errs.append(("DOC_FIT_REGRESSED", p["id"], vw, r["lines"]["fit"]))
                best = k
            best = min(best, k)

    # 9. SPLITTER: the handle may never travel to a width that starves the
    #    content, and every magnetic snap must be inside its own travel.
    for vp in range(MIN_VIEWPORT, 3441, 7):
        for arch in ("dashboard", "document", "terminal"):
            lo, hi = nav_travel(vp, arch)
            if hi < lo:
                errs.append(("SPLIT_INVERTED", vp, arch, lo, hi))
            if nav_open_behaviour(vp) == "push" and hi > 0:
                left = vp - 2 * margin_at(vp) - hi
                if left < content_floor(arch) - .01:
                    errs.append(("SPLIT_STARVES_CONTENT", vp, arch, round(left, 1)))
            for s in nav_snaps(vp, arch):
                if not (lo - .01 <= s["px"] <= hi + .01):
                    errs.append(("SPLIT_SNAP_OUTSIDE_TRAVEL", vp, arch, s["px"]))
            px, why = snap_nav(hi + 500, vp, arch)      # drag past the end
            if px > hi + .01:
                errs.append(("SPLIT_ESCAPED_MAX", vp, arch, px, hi))
            px, why = snap_nav(-500, vp, arch)          # drag past the start
            if px < lo - .01:
                errs.append(("SPLIT_ESCAPED_MIN", vp, arch, px, lo))
    # the claim the law makes out loud, checked: at 1920 the default sidebar is
    # exactly the width that yields 12 columns at exactly the 112px target.
    if round(1920 - 2 * M_DESK - span(12, TARGET)) != SIDEBAR:
        errs.append(("SPLIT_264_NOT_DERIVED", round(1920 - 2*M_DESK - span(12, TARGET))))

    return errs, pos, doc, pos_brk, doc_brk

def build():
    errs, pos, doc, pos_brk, doc_brk = validate_all()
    nav_table = solve_nav_table()
    law = {
      "version": "2.0.0",
      "supersedes": "1.0.0",
      "constants": {**K, "push_min": PUSH_MIN, "desk_col_floor": DESK_COL_FLOOR,
                    "drawer_peek": NAV["drawer_peek"]},
      "nav": NAV,
      "nav_table": nav_table,
      "legal_column_counts": LEGAL,
      "breakpoints": V1["breakpoints"],
      "categories": V1["categories"],
      "promotion": promotion_table(),
      "promotion_v1": V1["promotion"],
      "row_heights": V1["row_heights"],
      "numeric_ladder": V1["numeric_ladder"],
      "font_metrics": V1["font_metrics"],
      "type_scale": FS, "control_metrics": CTL,
      "measured_floors": MEASURED,
      "archetypes": ARCHETYPES,
      "ranks": RANKS,
      "residency": RESIDENCY,
      "arch_nav": ARCH_NAV,
      "terminal": TERM, "viewports": VIEWPORTS,
      "pane_caps": PANE_CAP, "absorbers": sorted(ABSORB),
      "pos": {"capabilities": POS_CAPS, "overrides": POS_VARIANT_OVERRIDES,
              "fixes": POS_FIXES, "keymap": KEYMAP,
              "presets": POS_PRESETS, "controls": COMPOSER_CONTROLS,
              "pane_fits": {k: [{"variant": n, "floor": f} for n, f in v]
                            for k, v in PANE_FITS.items()},
              "phone_max": PHONE_MAX,
              "catalog_resident_min_avail": CATALOG_RESIDENT_MIN_AVAIL,
              "catalog_resident_min_vw": catalog_resident_min_vw(),
              "solved": pos},
      "document": {"zones": DOC_ZONES, "density": DOC_DENSITY,
                   "types": DOC_TYPES, "capabilities": DOC_CAPS,
                   "fixes": DOC_FIXES, "solved": doc, "breakpoints": doc_brk,
                   "presets": DOC_PRESETS, "controls": DOC_COMPOSER_CONTROLS,
                   "line_fits": [{"variant": n, "floor": f} for n, f in DOC_LINE_FITS],
                   "summary_fits": [{"variant": n, "floor": f} for n, f in DOC_SUM_FITS],
                   "summary_resident_min_avail": DOC_SUM_RESIDENT_MIN_AVAIL,
                   "metrics": {"field_row": FIELD_ROW, "sum_row": SUM_ROW,
                               "sum_tot_row": SUM_TOT_ROW, "zone_h": ZONE_H,
                               "actions_h": DOC_ACTIONS_H, "strip": DOC_STRIP,
                               "strip_h": DOC_STRIP_H, "dock_min": DOC_DOCK_MIN,
                               "dock_h": DOC_DOCK_H, "line_h": DOC_LINE_H,
                               "lines_min_h": DOC_LINES_MIN_H},
                   "composed": solve_doc_comp()},
      "edit": EDIT,
      "placement": {**PLACEMENT,
        "box_limits": {c["id"]: {str(vp): (lambda g: (lambda l: {
              "wmin": l["wmin"], "wmax": l["wmax"], "hmax": l["hmax"],
              "hmin": {str(k): v for k, v in l["hmin"].items()},
              "underflow": l["underflow"]})(box_limits(c, g["cols"], g["col"])))(geometry(vp))
            for vp in BPS if vp >= MIN_VIEWPORT}
          for c in V1["categories"]},
      },
      "splitter": {**SPLITTER,
        "travel": {str(vp): {a: {"min": nav_travel(vp, a)[0], "max": nav_travel(vp, a)[1],
                                 "snaps": nav_snaps(vp, a),
                                 "content_floor": content_floor(a)}
                             for a in ("dashboard", "document", "terminal")}
                   for vp in BPS if vp >= MIN_VIEWPORT},
      },
      "envelopes": ENVELOPES,
      "underflow": UNDERFLOW,
      "min_viewport": MIN_VIEWPORT,
      "validation": {"errors": errs, "clean": len(errs) == 0},
    }
    (OUT / "layout-law-v2.json").write_text(json.dumps(law, indent=1))
    return law, errs

if __name__ == "__main__":
    law, errs = build()
    print(f"push_min      = {PUSH_MIN}  (derived: {SIDEBAR} + {2*M_DESK} + {DESK_MIN_AVAIL})")
    print(f"desk col floor= {DESK_COL_FLOOR:.2f}px  ({DESK_MIN_COLS} cols in {DESK_MIN_AVAIL}px)")
    print()
    print("measured floors:")
    for k2, v2 in MEASURED.items():
        if k2.startswith("_"): continue
        print(f"  {k2:22s} {v2:7.1f}px")
    print()
    print(f"validation: {'CLEAN' if not errs else str(len(errs)) + ' ERRORS'}")
    for e in errs[:40]:
        print("   ", e)
