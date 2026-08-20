/* ==========================================================================
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

export const LAW = {
 "version": "2.0.0",
 "constants": {
  "sidebar_expanded": 264,
  "sidebar_rail": 72,
  "header_h": 64,
  "subnav_w": 224,
  "margin_desktop": 24,
  "margin_tablet": 24,
  "margin_mobile": 16,
  "gutter": 24,
  "row": 64,
  "col_target": 112,
  "card_pad": 20,
  "card_pad_sm": 16,
  "pitch_row": 88,
  "push_min": 1216,
  "desk_col_floor": 92.0,
  "drawer_peek": 56
 },
 "nav": {
  "expanded_min": 1280,
  "rail_min": 1024,
  "mobile_max": 599,
  "push_min": 1216,
  "desk_col_floor": 92.0,
  "desk_min_avail": 904,
  "drawer_peek": 56,
  "scrim": "rgba(9,11,20,.56)",
  "anim_ms": 260
 },
 "navSchedule": {
  "dashboard": {
   "rail": 1024,
   "expanded": 1280,
   "subnav_col": null
  },
  "index": {
   "rail": 1024,
   "expanded": 1280,
   "subnav_col": null
  },
  "document": {
   "rail": 1024,
   "expanded": 1708,
   "subnav_col": null
  },
  "terminal": {
   "rail": 1024,
   "expanded": null,
   "subnav_col": null
  },
  "console": {
   "rail": 1024,
   "expanded": 1440,
   "subnav_col": 1248
  },
  "focus": {
   "rail": null,
   "expanded": null,
   "subnav_col": null
  }
 },
 "archNav": {
  "dashboard": {
   "rail_min": 1024,
   "expanded_min": 1280,
   "subnav_col_min": null
  },
  "index": {
   "rail_min": 1024,
   "expanded_min": 1280,
   "subnav_col_min": null
  },
  "document": {
   "rail_min": 0,
   "expanded_min": 1708,
   "subnav_col_min": null
  },
  "terminal": {
   "rail_min": 0,
   "expanded_min": null,
   "subnav_col_min": null
  },
  "console": {
   "rail_min": 0,
   "expanded_min": 1440,
   "subnav_col_min": 1248
  },
  "focus": {
   "rail_min": null,
   "expanded_min": null,
   "subnav_col_min": null
  }
 },
 "legalColumnCounts": {
  "desktop": [
   8,
   10,
   12,
   14,
   16,
   18,
   20,
   24
  ],
  "tablet": [
   6,
   8,
   10,
   12
  ],
  "mobile": [
   4
  ]
 },
 "categories": [
  {
   "id": "C1",
   "default": 0,
   "name": "Tile",
   "role": "Shortcut, quick action, custom button, single glyph stat",
   "example": "New sale - Open till - Scan barcode",
   "max": [
    3,
    2
   ],
   "fits": [
    {
     "cols": 2,
     "rows": 1,
     "variant": "icon+label",
     "floor": 124,
     "desc": "icon left, label right"
    },
    {
     "cols": 1,
     "rows": 1,
     "variant": "icon",
     "floor": 52,
     "desc": "icon only, label in tooltip"
    }
   ]
  },
  {
   "id": "C2",
   "default": 0,
   "name": "Strip",
   "role": "One KPI on one line - label left, value right",
   "example": "Today's sales",
   "max": [
    6,
    2
   ],
   "fits": [
    {
     "cols": 4,
     "rows": 1,
     "variant": "inline",
     "floor": 356,
     "desc": "label and value share one line"
    },
    {
     "cols": 3,
     "rows": 2,
     "variant": "stacked",
     "floor": 200,
     "desc": "label above value - gains a row"
    }
   ]
  },
  {
   "id": "C3",
   "default": 1,
   "name": "Metric",
   "role": "KPI with delta, sparkline or period comparison",
   "example": "Gross revenue",
   "max": [
    6,
    4
   ],
   "fits": [
    {
     "cols": 4,
     "rows": 3,
     "variant": "full",
     "floor": 386,
     "desc": "value + sparkline side by side"
    },
    {
     "cols": 3,
     "rows": 2,
     "variant": "standard",
     "floor": 274,
     "desc": "value, delta chip below"
    },
    {
     "cols": 2,
     "rows": 2,
     "variant": "compact",
     "floor": 200,
     "desc": "abbreviated value, no sparkline"
    },
    {
     "cols": 2,
     "rows": 3,
     "variant": "stacked",
     "floor": 163,
     "desc": "label / value / delta on three lines"
    }
   ]
  },
  {
   "id": "C4",
   "default": 1,
   "name": "Panel",
   "role": "Ranked list, breakdown, small chart, table excerpt",
   "example": "Sales by module",
   "max": [
    6,
    6
   ],
   "fits": [
    {
     "cols": 4,
     "rows": 4,
     "variant": "full",
     "floor": 492,
     "desc": "label + bar + value"
    },
    {
     "cols": 3,
     "rows": 4,
     "variant": "standard",
     "floor": 356,
     "desc": "label + value, no bar"
    },
    {
     "cols": 3,
     "rows": 5,
     "variant": "compact",
     "floor": 200,
     "desc": "label over value - gains a row"
    },
    {
     "cols": 2,
     "rows": 6,
     "variant": "list",
     "floor": 200,
     "desc": "narrow list, one item per row"
    }
   ]
  },
  {
   "id": "C5",
   "default": 0,
   "name": "Board",
   "role": "Full chart, multi-series, wide table",
   "example": "Cash flow & revenue",
   "max": [
    12,
    9
   ],
   "fits": [
    {
     "cols": 6,
     "rows": 6,
     "variant": "full",
     "floor": 593,
     "desc": "chart + right-hand legend"
    },
    {
     "cols": 5,
     "rows": 7,
     "variant": "narrow",
     "floor": 415,
     "desc": "legend moves below chart - gains a row"
    },
    {
     "cols": 4,
     "rows": 8,
     "variant": "min",
     "floor": 295,
     "desc": "chart only, table view behind a toggle"
    }
   ]
  },
  {
   "id": "C6",
   "default": 0,
   "name": "Canvas",
   "role": "Hero chart, P&L statement, cohort grid, map",
   "example": "Profit & loss statement",
   "max": [
    12,
    16
   ],
   "fits": [
    {
     "cols": 8,
     "rows": 8,
     "variant": "full",
     "floor": 733,
     "desc": "full canvas with controls rail"
    },
    {
     "cols": 6,
     "rows": 10,
     "variant": "narrow",
     "floor": 533,
     "desc": "controls move above - gains 2 rows"
    },
    {
     "cols": 4,
     "rows": 12,
     "variant": "min",
     "floor": 295,
     "desc": "vertical scroll inside the card"
    }
   ]
  }
 ],
 "typeScale": {
  "metric": 38,
  "value": 26,
  "body": 15,
  "small": 14,
  "micro": 12,
  "label": 11
 },
 "controlMetrics": {
  "btn_h": 40,
  "btn_min": 88,
  "icon_btn": 36,
  "stepper": 32,
  "field_h": 40,
  "row_h": 44,
  "tile_min": 132,
  "tile_img": 88,
  "avatar": 36,
  "chip_h": 28,
  "tab_h": 40,
  "gap": 12,
  "gap_sm": 8
 },
 "measuredFloors": {
  "cart_line_full": 559,
  "cart_line_relay": 359,
  "cart_line_min": 305,
  "tender_full": 367,
  "tender_mid": 264,
  "tender_min": 201,
  "catalog_grid3": 484,
  "catalog_grid2": 328,
  "catalog_list": 254,
  "doc_table_full": 933,
  "doc_table_std": 693,
  "doc_table_lean": 561,
  "doc_table_card": 305,
  "doc_summary_full": 384,
  "doc_summary_min": 249,
  "doc_header_2col": 584,
  "doc_header_1col": 300
 },
 "terminal": {
  "bar_h": 56,
  "cart_hdr": 44,
  "cart_line": 56,
  "cart_min_lines": 3,
  "tender_bar_h": 88,
  "tile_h": 152,
  "tab_h": 40,
  "cart_min_h": 244,
  "cart_good_lines": 5,
  "cart_good_h": 356
 },
 "viewports": [
  {
   "vp": 360,
   "vh": 560,
   "label": "Android baseline",
   "kind": "mobile"
  },
  {
   "vp": 390,
   "vh": 745,
   "label": "iPhone 12-15",
   "kind": "mobile"
  },
  {
   "vp": 414,
   "vh": 790,
   "label": "iPhone Plus / Max",
   "kind": "mobile"
  },
  {
   "vp": 768,
   "vh": 950,
   "label": "iPad 9.7 portrait",
   "kind": "tablet"
  },
  {
   "vp": 820,
   "vh": 1100,
   "label": "iPad Air portrait",
   "kind": "tablet"
  },
  {
   "vp": 1024,
   "vh": 695,
   "label": "iPad 9.7 landscape",
   "kind": "tablet"
  },
  {
   "vp": 1180,
   "vh": 750,
   "label": "iPad Air landscape",
   "kind": "tablet"
  },
  {
   "vp": 1265,
   "vh": 570,
   "label": "1280x720 laptop  *TIGHTEST*",
   "kind": "laptop"
  },
  {
   "vp": 1351,
   "vh": 620,
   "label": "1366x768 laptop",
   "kind": "laptop"
  },
  {
   "vp": 1425,
   "vh": 750,
   "label": "1440x900 MBP13",
   "kind": "laptop"
  },
  {
   "vp": 1521,
   "vh": 715,
   "label": "1536x864 (FHD @125%)",
   "kind": "laptop"
  },
  {
   "vp": 1585,
   "vh": 780,
   "label": "1600x900",
   "kind": "desktop"
  },
  {
   "vp": 1905,
   "vh": 940,
   "label": "1920x1080 FHD",
   "kind": "desktop"
  },
  {
   "vp": 2545,
   "vh": 1290,
   "label": "2560x1440 QHD",
   "kind": "desktop"
  },
  {
   "vp": 3425,
   "vh": 1290,
   "label": "3440x1440 ultrawide",
   "kind": "desktop"
  }
 ],
 "paneCaps": {
  "cart": 805,
  "tender": 551,
  "summary": 544
 },
 "absorbers": [
  "catalog",
  "floor",
  "lines"
 ],
 "residency": [
  "resident",
  "stacked",
  "sheet",
  "tab",
  "route"
 ],
 "ranks": [
  {
   "rank": 1,
   "name": "Act",
   "freq": "every transaction",
   "residency": "always visible on the working surface",
   "budget_desktop": 7,
   "budget_mobile": 5,
   "why": "7 is the working-memory span; past it the user scans instead of acting"
  },
  {
   "rank": 2,
   "name": "Adjust",
   "freq": "some transactions",
   "residency": "one gesture away, and contextual to the selected object",
   "budget_desktop": null,
   "budget_mobile": null,
   "why": "revealed by the thing it acts on, so it costs nothing until needed"
  },
  {
   "rank": 3,
   "name": "Configure",
   "freq": "once per setup, shift or month",
   "residency": "settings drawer only -- never on the working surface",
   "budget_desktop": 0,
   "budget_mobile": 0,
   "why": "a monthly control docked permanently is 30 days of noise for 1 day of use"
  }
 ],
 "archetypes": [
  {
   "id": "dashboard",
   "name": "Dashboard",
   "scroll": "page",
   "regions": [
    "nav",
    "header",
    "canvas"
   ],
   "rule": "cards on the grid; \u00a76 card law applies verbatim; edit mode available",
   "examples": [
    "Home",
    "Dashboard",
    "Workspace",
    "role dashboards"
   ]
  },
  {
   "id": "index",
   "name": "Index",
   "scroll": "page",
   "regions": [
    "nav",
    "header",
    "toolbar",
    "table",
    "pagination"
   ],
   "rule": "one sticky toolbar row; columns demote right-to-left by declared priority; below 600 rows become cards",
   "examples": [
    "Products",
    "Customers",
    "Sales list",
    "Purchases list",
    "Expenses"
   ]
  },
  {
   "id": "document",
   "name": "Document",
   "scroll": "page",
   "regions": [
    "nav",
    "header",
    "docheader",
    "lines",
    "summary",
    "actionbar"
   ],
   "rule": "three zones; summary is resident beside lines while it clears its floor, else it becomes a sticky action bar",
   "examples": [
    "Invoice",
    "Purchase",
    "Quotation",
    "Order",
    "Return",
    "Expense"
   ]
  },
  {
   "id": "terminal",
   "name": "Terminal",
   "scroll": "panes",
   "regions": [
    "nav",
    "header",
    "panes"
   ],
   "rule": "exactly one viewport tall; the page never scrolls; panes scroll internally; columns-vs-bands is an aspect question; the residency ladder applies",
   "examples": [
    "POS",
    "Kitchen display",
    "Table floor"
   ]
  },
  {
   "id": "console",
   "name": "Console",
   "scroll": "page",
   "regions": [
    "nav",
    "header",
    "subnav",
    "canvas"
   ],
   "rule": "the 224px subnav is a THIRD shell column from 1248 (where the canvas still clears 904px) and a horizontal tab strip below it; the nav itself waits until 1440",
   "examples": [
    "Settings",
    "Reports",
    "Accounting"
   ]
  },
  {
   "id": "focus",
   "name": "Focus",
   "scroll": "page",
   "regions": [
    "canvas"
   ],
   "rule": "no nav, no header; content capped at 6 columns and centred; the only archetype allowed to cap width",
   "examples": [
    "Login",
    "Onboarding wizard",
    "Print preview",
    "Checkout"
   ]
  }
 ],
 "numericLadder": [
  {
   "key": "full4",
   "sample": "PKR 99,999,999,999,999,999,999.9999",
   "note": "20 int + 4 dp - ledger & detail view only",
   "w20": 380.3,
   "w26": 494.4,
   "w38": 722.6
  },
  {
   "key": "full2",
   "sample": "PKR 9,999,999,999,999.99",
   "note": "13 int + 2 dp",
   "w20": 257.4,
   "w26": 334.6,
   "w38": 489.0
  },
  {
   "key": "full",
   "sample": "PKR 999,999,999.99",
   "note": "9 int + 2 dp - full precision",
   "w20": 196.4,
   "w26": 255.3,
   "w38": 373.2
  },
  {
   "key": "grouped",
   "sample": "PKR 9,999,999.99",
   "note": "7 int + 2 dp",
   "w20": 171.6,
   "w26": 223.1,
   "w38": 326.1
  },
  {
   "key": "abbr2",
   "sample": "PKR 999.99M",
   "note": "abbreviated, 2 dp",
   "w20": 123.3,
   "w26": 160.2,
   "w38": 234.2
  },
  {
   "key": "abbr1",
   "sample": "PKR 999.9M",
   "note": "abbreviated, 1 dp",
   "w20": 110.9,
   "w26": 144.1,
   "w38": 210.6
  },
  {
   "key": "abbr0",
   "sample": "PKR 999M",
   "note": "abbreviated, 0 dp",
   "w20": 92.7,
   "w26": 120.5,
   "w38": 176.2
  },
  {
   "key": "bare",
   "sample": "999M",
   "note": "no currency - chip / axis",
   "w20": 49.8,
   "w26": 64.7,
   "w38": 94.6
  }
 ],
 "fontMetrics": {
  "digit_em": 0.62,
  "comma_em": 0.284,
  "period_em": 0.287
 },
 "pos": {
  "presets": [
   {
    "id": "scan",
    "name": "Scan",
    "tagline": "No catalog. Scanner and keyboard only.",
    "for": "Large inventory (>2,000 SKUs), barcode-driven. Pharmacy, hardware, grocery, distribution.",
    "why": "A catalog nobody browses is 40% of the screen spent on nothing. Removing it is the single biggest calm-down available.",
    "comp": {
     "catalog": {
      "mode": "off",
      "size": 0.0,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 0.62,
      "tender": 0.38
     },
     "tender": "column",
     "floor": "off"
    }
   },
   {
    "id": "column",
    "name": "Column",
    "tagline": "A narrow catalog column, and a big cart.",
    "for": "Mixed inventory (200-2,000 SKUs) where staff both scan and browse. General retail.",
    "why": "The familiar shape with the proportions fixed: the catalog is a reference column, not a competitor. One tile wide is enough, and there is a full-screen button when it is not.",
    "comp": {
     "catalog": {
      "mode": "left",
      "size": 0.2,
      "rows": 1,
      "tiles": 1
     },
     "split": {
      "cart": 0.5,
      "tender": 0.3
     },
     "tender": "column",
     "floor": "off"
    }
   },
   {
    "id": "row",
    "name": "Row",
    "tagline": "A tile strip on top, cart underneath.",
    "for": "Small inventory (<200 SKUs), fast repeat items. Cafe, bakery, kiosk, pharmacy counter.",
    "why": "A strip is reachable by thumb and leaves the full width for the cart. One row by default -- a second only if the operator asks for it and the height can pay for it.",
    "comp": {
     "catalog": {
      "mode": "top",
      "size": 0.0,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 0.7,
      "tender": 0.3
     },
     "tender": "column",
     "floor": "off"
    }
   },
   {
    "id": "grid",
    "name": "Grid",
    "tagline": "Catalog and cart share the screen 40 / 60.",
    "for": "Visual products, walk-up counters, staff who point rather than type. Cafe, QSR, boutique.",
    "why": "When the product IS the interface the cart only has to confirm -- but the cart still gets the larger half, because that is the half the customer is reading.",
    "comp": {
     "catalog": {
      "mode": "left",
      "size": 0.4,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 0.6,
      "tender": 0.0
     },
     "tender": "sheet",
     "floor": "off"
    }
   },
   {
    "id": "stack",
    "name": "Stack",
    "tagline": "Catalog above, cart below, pay takes the screen.",
    "for": "Wide-but-short screens, and anyone who prefers to look down rather than across.",
    "why": "Rehan's own suggestion, and the best fit for a 1280x720 laptop: 40% of the height to the catalog, 60% to the cart, and Take payment opens the full tender.",
    "comp": {
     "catalog": {
      "mode": "top",
      "size": 0.4,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 1.0,
      "tender": 0.0
     },
     "tender": "sheet",
     "floor": "off"
    }
   },
   {
    "id": "counter",
    "name": "Counter",
    "tagline": "One column. Cart first, everything docked.",
    "for": "Phone and small tablet, market stalls, delivery riders, single-hand use.",
    "why": "The cart is the screen. The total lives inside the Pay button and the catalog is one tap away, full screen -- which is what every shipping POS does at this size.",
    "comp": {
     "catalog": {
      "mode": "overlay",
      "size": 0.0,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 1.0,
      "tender": 0.0
     },
     "tender": "bar",
     "floor": "off"
    }
   },
   {
    "id": "table",
    "name": "Table",
    "tagline": "Floor plan, then order.",
    "for": "Restaurants, cafes with table service, salons, any seat or slot business.",
    "why": "The unit of work is the table, not the sale -- so the floor is a STEP, not a fourth column competing for width. Pick a table, take the order, settle. Switch the floor to a column in the composer if the screen is wide enough to carry one for free.",
    "comp": {
     "catalog": {
      "mode": "top",
      "size": 0.0,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 0.7,
      "tender": 0.3
     },
     "tender": "column",
     "floor": "overlay"
    }
   }
  ],
  "controls": [
   {
    "id": "catalog.mode",
    "label": "Catalog",
    "options": [
     "off",
     "left",
     "right",
     "top",
     "bottom",
     "overlay"
    ],
    "note": "off = scanner only. left/right = a column. top/bottom = a tile strip. overlay = one button, full screen."
   },
   {
    "id": "catalog.size",
    "label": "Catalog share",
    "range": [
     0.12,
     0.55
    ],
    "note": "Of the width for a column, of the height for a strip. Clamped to the catalog's measured floor."
   },
   {
    "id": "catalog.rows",
    "label": "Strip rows",
    "options": [
     1,
     2,
     3
    ],
    "note": "Only for a top or bottom strip. Rows the height cannot pay for are not offered."
   },
   {
    "id": "catalog.tiles",
    "label": "Tiles per row",
    "range": [
     1,
     8
    ],
    "note": "The industry's real density control -- Toast ships rows x columns per device, default 8 x 5."
   },
   {
    "id": "split.cart",
    "label": "Cart share",
    "range": [
     0.3,
     1.0
    ],
    "note": "Clamped so the cart never drops below its own floor."
   },
   {
    "id": "split.tender",
    "label": "Tender share",
    "range": [
     0.0,
     0.45
    ],
    "note": "0 turns the tender into a sheet behind Take payment."
   },
   {
    "id": "tender",
    "label": "Tender",
    "options": [
     "column",
     "bar",
     "sheet"
    ],
    "note": "column = always visible. bar = a docked total + Pay. sheet = full screen on demand."
   },
   {
    "id": "floor",
    "label": "Floor plan",
    "options": [
     "off",
     "left",
     "overlay"
    ],
    "note": "Restaurants only. A column on a wide screen, a step on a narrow one."
   }
  ],
  "paneFits": {
   "cart": [
    {
     "variant": "table",
     "floor": 559
    },
    {
     "variant": "relay",
     "floor": 359
    },
    {
     "variant": "minimal",
     "floor": 305
    }
   ],
   "tender": [
    {
     "variant": "full",
     "floor": 367
    },
    {
     "variant": "compact",
     "floor": 264
    },
    {
     "variant": "bar",
     "floor": 201
    }
   ],
   "catalog": [
    {
     "variant": "grid-3up",
     "floor": 484
    },
    {
     "variant": "grid-2up",
     "floor": 328
    },
    {
     "variant": "list",
     "floor": 254
    }
   ],
   "floor": [
    {
     "variant": "map",
     "floor": 484
    },
    {
     "variant": "list",
     "floor": 254
    }
   ]
  },
  "phoneMax": 599,
  "catalogResidentMinAvail": 1062,
  "catalogResidentMinVw": 1182,
  "capabilities": [
   {
    "id": "scan",
    "label": "Scan / search item",
    "rank": 1,
    "home": "surface",
    "note": "barcode-first: exact SKU or barcode wins before fuzzy search",
    "src": "Pos.jsx:799"
   },
   {
    "id": "cart_lines",
    "label": "Cart lines",
    "rank": 1,
    "home": "surface",
    "note": "",
    "src": "Pos.jsx:2440"
   },
   {
    "id": "qty",
    "label": "Quantity + / -",
    "rank": 1,
    "home": "line-visible",
    "note": "visible on every line, not behind selection -- but it belongs to the cart-lines object and costs one unit of attention, not one per line",
    "src": "Pos.jsx:875"
   },
   {
    "id": "remove_line",
    "label": "Remove line",
    "rank": 1,
    "home": "line",
    "note": "",
    "src": "Pos.jsx:2572"
   },
   {
    "id": "total",
    "label": "Running total",
    "rank": 1,
    "home": "surface",
    "note": "formatToFit; exact value on hover",
    "src": "Pos.jsx:938"
   },
   {
    "id": "customer",
    "label": "Customer / walk-in",
    "rank": 1,
    "home": "surface",
    "note": "selecting a party with default_discount auto-applies it and says so",
    "src": "Pos.jsx:2638"
   },
   {
    "id": "tender",
    "label": "Amount tendered + change",
    "rank": 1,
    "home": "surface",
    "note": "",
    "src": "Pos.jsx:2908"
   },
   {
    "id": "complete",
    "label": "Complete sale",
    "rank": 1,
    "home": "surface",
    "note": "",
    "src": "Pos.jsx:3010"
   },
   {
    "id": "hold",
    "label": "Hold / park",
    "rank": 1,
    "home": "surface",
    "note": "",
    "src": "Pos.jsx:3031"
   },
   {
    "id": "line_disc",
    "label": "Line discount (amount or %)",
    "rank": 2,
    "home": "line",
    "note": "",
    "src": "Pos.jsx:3454"
   },
   {
    "id": "price_over",
    "label": "Price override",
    "rank": 2,
    "home": "line",
    "note": "",
    "src": "Pos.jsx:3599"
   },
   {
    "id": "free_qty",
    "label": "Free / bonus quantity",
    "rank": 2,
    "home": "line",
    "note": "was a global column toggle; now a per-line control on the line that needs it",
    "src": "Pos.jsx:2534"
   },
   {
    "id": "converter",
    "label": "Price / qty / total back-solve",
    "rank": 2,
    "home": "line",
    "note": "merged with line discount into ONE line editor -- the old pair of near-identical modals was a top overwhelm complaint",
    "src": "Pos.jsx:3563"
   },
   {
    "id": "variant",
    "label": "Variant picker",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:3102"
   },
   {
    "id": "global_disc",
    "label": "Document discount",
    "rank": 2,
    "home": "field",
    "note": "presets are long-pressable",
    "src": "Pos.jsx:3180"
   },
   {
    "id": "split_pay",
    "label": "Split tender",
    "rank": 2,
    "home": "field",
    "note": "cash / bank / card / UPI / credit; UPI existed only here, now everywhere",
    "src": "Pos/PaymentModal.jsx"
   },
   {
    "id": "pay_method",
    "label": "Payment method",
    "rank": 2,
    "home": "field",
    "note": "",
    "src": "Pos.jsx:2690"
   },
   {
    "id": "bank_acct",
    "label": "Deposit-to account",
    "rank": 2,
    "home": "field",
    "note": "",
    "src": "Pos.jsx:2739"
   },
   {
    "id": "tax_mode",
    "label": "Tax inclusive / exclusive",
    "rank": 2,
    "home": "field",
    "note": "",
    "src": "Pos.jsx:2809"
   },
   {
    "id": "tax_rate",
    "label": "Tax rate",
    "rank": 2,
    "home": "field",
    "note": "from settings.tax_rates",
    "src": "Pos.jsx:2821"
   },
   {
    "id": "fulfilment",
    "label": "Local stock / dropship",
    "rank": 2,
    "home": "field",
    "note": "",
    "src": "Pos.jsx:2867"
   },
   {
    "id": "warehouse",
    "label": "Location",
    "rank": 2,
    "home": "field",
    "note": "FIXED: warehouses were passed to the screen and had no UI at all -- a multi-branch store could not choose",
    "src": "Pos.jsx:190"
   },
   {
    "id": "parked",
    "label": "Parked sales",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:2088"
   },
   {
    "id": "recent",
    "label": "Recent invoices + reprint",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:2019"
   },
   {
    "id": "return_mode",
    "label": "Return mode",
    "rank": 2,
    "home": "bar",
    "note": "three policies: reference / customer-or-reference / open",
    "src": "Pos.jsx:1971"
   },
   {
    "id": "return_lookup",
    "label": "Load sale for return",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:1785"
   },
   {
    "id": "quick_prod",
    "label": "Create product inline",
    "rank": 2,
    "home": "sheet",
    "note": "opened the full 1,768-line six-tab editor; now a 5-field sheet with Full editor behind a link",
    "src": "Pos.jsx:3418"
   },
   {
    "id": "quick_party",
    "label": "Create / edit customer inline",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:3405"
   },
   {
    "id": "quick_bank",
    "label": "Create bank account inline",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:3305"
   },
   {
    "id": "overpay",
    "label": "Overpayment: change or ledger",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:3430"
   },
   {
    "id": "offline_hub",
    "label": "Offline sync hub",
    "rank": 2,
    "home": "sheet",
    "note": "per-sale retry, error, recall, delete",
    "src": "Pos.jsx:3646"
   },
   {
    "id": "tabs",
    "label": "Multiple sales open at once",
    "rank": 2,
    "home": "bar",
    "note": "",
    "src": "Pos.jsx:1933"
   },
   {
    "id": "breakup",
    "label": "Bill breakup",
    "rank": 2,
    "home": "field",
    "note": "was Ctrl+F only; now a tap on the total",
    "src": "Pos.jsx:1499"
   },
   {
    "id": "notes",
    "label": "Sale remarks",
    "rank": 2,
    "home": "field",
    "note": "FIXED: F12 collected remarks and the main checkout path threw them away",
    "src": "Pos.jsx:1484"
   },
   {
    "id": "charges",
    "label": "Additional charges",
    "rank": 2,
    "home": "field",
    "note": "FIXED: F8 stored a charge that no total ever read",
    "src": "Pos.jsx:1460"
   },
   {
    "id": "keys",
    "label": "Keyboard map",
    "rank": 2,
    "home": "sheet",
    "note": "the full map, not the 10 the old strip advertised",
    "src": "Pos.jsx:3052"
   },
   {
    "id": "reprint",
    "label": "Reprint last receipt",
    "rank": 2,
    "home": "sheet",
    "note": "",
    "src": "Pos.jsx:2050"
   },
   {
    "id": "drawer_open",
    "label": "Open cash drawer",
    "rank": 2,
    "home": "surface",
    "note": "ADDED: AMDStation.openDrawer() and thermal_open_drawer both existed with no button anywhere",
    "src": "Utils/AMDStation.js"
   },
   {
    "id": "back",
    "label": "Leave the register",
    "rank": 2,
    "home": "bar",
    "note": "Rehan asked for this explicitly: with the nav hidden there must still be a way back",
    "src": "Pos.jsx:584"
   },
   {
    "id": "senior",
    "label": "Large text mode",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "Pos.jsx:1954"
   },
   {
    "id": "autoprint",
    "label": "Auto-print on complete",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "Pos.jsx:2952"
   },
   {
    "id": "ui_scale",
    "label": "Interface scale",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "OneGlanceLayout.jsx:836"
   },
   {
    "id": "variant_pick",
    "label": "POS layout variant",
    "rank": 3,
    "home": "drawer",
    "note": "the six terminals; per user, per device",
    "src": ""
   },
   {
    "id": "cat_place",
    "label": "Catalog placement",
    "rank": 3,
    "home": "drawer",
    "note": "column / row / dominant / sheet / none",
    "src": ""
   },
   {
    "id": "def_tax",
    "label": "Default tax rate",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.default_tax_rate"
   },
   {
    "id": "ret_policy",
    "label": "Return policy",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.pos_return_mode"
   },
   {
    "id": "neg_stock",
    "label": "Allow overselling",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.stop_sale_negative_stock"
   },
   {
    "id": "roundoff",
    "label": "Round off totals",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.round_off_total"
   },
   {
    "id": "presets",
    "label": "Discount presets",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "localStorage pos_discount_presets"
   },
   {
    "id": "autofill",
    "label": "Auto-fill exact cash",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.pos_auto_fill_cash"
   },
   {
    "id": "margin_show",
    "label": "Show margin",
    "rank": 3,
    "home": "drawer",
    "note": "",
    "src": "settings.show_margin_percentage"
   },
   {
    "id": "online",
    "label": "Online / offline",
    "rank": 3,
    "home": "bar",
    "note": "read-out. shape must differ from a toggle",
    "src": "Pos.jsx:2068"
   },
   {
    "id": "hardware",
    "label": "Printer / drawer status",
    "rank": 3,
    "home": "bar",
    "note": "read-out",
    "src": "Pos.jsx:2074"
   },
   {
    "id": "pending",
    "label": "Queued offline sales",
    "rank": 3,
    "home": "bar",
    "note": "read-out, opens the sync hub",
    "src": "Pos.jsx:2081"
   },
   {
    "id": "cart_rescue",
    "label": "Cart rescue after a crash",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "Pos.jsx:555"
   },
   {
    "id": "offline_q",
    "label": "Offline queue + auto sync",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "Hooks/useOfflineSync.js"
   },
   {
    "id": "idempotency",
    "label": "Idempotency key",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "SaleController"
   },
   {
    "id": "wholesale",
    "label": "Wholesale price banding",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "Utils/settings.js"
   },
   {
    "id": "automfg",
    "label": "Auto-manufacture from recipe",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "Pos.jsx:2287"
   },
   {
    "id": "session",
    "label": "Multi-tab session persistence",
    "rank": 1,
    "home": "auto",
    "note": "",
    "src": "Contexts/WorkspaceContext.jsx"
   }
  ],
  "overrides": {
   "scan": {
    "scan": "surface, focused on load, always focused",
    "drawer_open": "surface"
   },
   "column": {
    "scan": "surface, above the catalog column"
   },
   "row": {
    "scan": "surface, above the tile strip"
   },
   "grid": {
    "scan": "bar",
    "tender": "sheet",
    "complete": "surface (cart rail)"
   },
   "counter": {
    "scan": "surface",
    "parked": "bar",
    "recent": "bar"
   },
   "table": {
    "back": "surface (back to floor)",
    "hold": "auto (a table IS a held sale)"
   }
  },
  "fixes": [
   [
    "errors_as_offline",
    "Any server error -- including a 422 validation error or a plan-limit rejection -- was caught and queued as an 'offline sale'.",
    "Only a genuine network failure queues. A 4xx surfaces as a validation error on the field that caused it."
   ],
   [
    "f8_charges",
    "F8 additional charges were stored on the session and never added to any total.",
    "Charges are a document field and part of the total, on every screen."
   ],
   [
    "f9_discount",
    "F9 bill discount wrote `discount`, which the total formula never read because `discountValue` was always defined.",
    "One discount value, one formula."
   ],
   [
    "f12_notes",
    "F12 remarks reached the server only on Ctrl+S/P/N; the normal Complete path sent notes:''.",
    "Notes are a resident field with one payload path."
   ],
   [
    "key_price",
    "item.key_price was read in the subtotal and never written anywhere.",
    "Removed."
   ],
   [
    "reserve_confirm",
    "The reserved-stock backorder confirm used `if (!window.confirm(...))` against a Promise-returning override, so it never blocked anything.",
    "Awaited confirm; the sale genuinely pauses."
   ],
   [
    "margin_dead",
    "Margin display required item.cost_price, which was never set on cart items.",
    "cost_price travels with the line; margin is a rank-2 peek."
   ],
   [
    "return_window",
    "pos_return_window and pos_return_window_behavior were parsed and discarded.",
    "Both enforced by the return policy."
   ],
   [
    "stub_keys",
    "F6 (change unit) and F10 (loyalty) advertised behaviour that only emitted a 'coming soon' toast.",
    "Either implemented or absent from the map. Never advertised and dead."
   ],
   [
    "cancel_undo",
    "Cancel wiped the cart with no confirmation and no undo.",
    "Cancel is undoable for 10 seconds; no dialog, no loss."
   ],
   [
    "key_guard",
    "The global keydown handler had no 'am I typing?' guard, so F-keys fired from inside modal inputs.",
    "The keymap is scoped to the surface and suspended inside a field or sheet."
   ],
   [
    "tab_labels",
    "Sale tabs were labelled with a raw Date.now() millisecond timestamp.",
    "Tabs carry the document number, or the party name until one exists."
   ],
   [
    "void_perms",
    "pos.void_item and pos.refund were defined in config/permissions.php and checked nowhere -- any cashier could run a return or delete a line.",
    "Both enforced at the control."
   ],
   [
    "no_drawer_ui",
    "AMDStation.openDrawer() and the thermal_open_drawer setting both existed with no button anywhere in the UI.",
    "Open drawer is a rank-2 control on the surface."
   ]
  ],
  "keymap": [
   [
    "F1",
    "Focus scan / search",
    "terminal document"
   ],
   [
    "F2",
    "Quantity on the active line",
    "terminal document"
   ],
   [
    "F3",
    "Discount on the active line",
    "terminal document"
   ],
   [
    "F4",
    "Remove the active line",
    "terminal document"
   ],
   [
    "F5",
    "Rate on the active line",
    "terminal document"
   ],
   [
    "F6",
    "Unit on the active line",
    "document"
   ],
   [
    "F7",
    "Document tax",
    "terminal document"
   ],
   [
    "F8",
    "Additional charges",
    "terminal document"
   ],
   [
    "F9",
    "Document discount",
    "terminal document"
   ],
   [
    "F11",
    "Party",
    "terminal document"
   ],
   [
    "F12",
    "Notes",
    "terminal document"
   ],
   [
    "Ctrl+S",
    "Save",
    "terminal document"
   ],
   [
    "Ctrl+P",
    "Save and print",
    "terminal document"
   ],
   [
    "Ctrl+N",
    "Save and start a new one",
    "terminal document"
   ],
   [
    "Ctrl+D",
    "New party",
    "terminal document"
   ],
   [
    "Ctrl+T",
    "New tab",
    "terminal document"
   ],
   [
    "Ctrl+W",
    "Close tab",
    "terminal document"
   ],
   [
    "Ctrl+Tab",
    "Next tab",
    "terminal document"
   ],
   [
    "Ctrl+F",
    "Breakdown",
    "terminal document"
   ],
   [
    "Ctrl+K",
    "Command palette",
    "everywhere"
   ],
   [
    "Ctrl+1..9",
    "Select line n",
    "terminal document"
   ],
   [
    "Alt+Z",
    "Fullscreen",
    "terminal"
   ],
   [
    "Esc",
    "Close the top layer",
    "everywhere"
   ],
   [
    "?",
    "Show this map",
    "everywhere"
   ]
  ]
 },
 "document": {
  "zones": [
   {
    "id": "docheader",
    "name": "Header",
    "fits": [
     {
      "cols": 8,
      "variant": "2col",
      "floor": 584,
      "desc": "two field columns"
     },
     {
      "cols": 4,
      "variant": "1col",
      "floor": 300,
      "desc": "one field column"
     }
    ],
    "weight": 1.0,
    "rank": 1,
    "priority": 4,
    "demote_to": "stacked",
    "intent": "resident",
    "hold": "fit",
    "floor": 584,
    "scroll": true,
    "note": "always full width; never a sheet"
   },
   {
    "id": "lines",
    "name": "Lines",
    "fits": [
     {
      "cols": 8,
      "variant": "full",
      "floor": 933,
      "desc": "10 columns"
     },
     {
      "cols": 7,
      "variant": "std",
      "floor": 693,
      "desc": "7 columns"
     },
     {
      "cols": 6,
      "variant": "lean",
      "floor": 561,
      "desc": "5 columns"
     },
     {
      "cols": 4,
      "variant": "cards",
      "floor": 305,
      "desc": "one card per line"
     }
    ],
    "weight": 0.72,
    "rank": 1,
    "priority": 1,
    "demote_to": "stacked",
    "intent": "resident",
    "hold": "fit",
    "floor": 933,
    "scroll": true,
    "note": ""
   },
   {
    "id": "summary",
    "name": "Summary",
    "fits": [
     {
      "cols": 4,
      "variant": "panel",
      "floor": 384,
      "desc": "resident right panel"
     },
     {
      "cols": 3,
      "variant": "tight",
      "floor": 249,
      "desc": "narrow panel"
     }
    ],
    "weight": 0.28,
    "rank": 1,
    "priority": 2,
    "demote_to": "stacked",
    "intent": "resident",
    "hold": "fit",
    "floor": 384,
    "scroll": true,
    "note": "demotes to a sticky action bar with an expandable breakdown"
   }
  ],
  "density": [
   {
    "id": "simple",
    "name": "Simple",
    "for": "first-time users, cashiers, single-product shops",
    "line_cols": [
     "item",
     "qty",
     "rate",
     "total",
     "del"
    ],
    "header": [
     "party",
     "date"
    ],
    "summary": [
     "total",
     "settled",
     "balance"
    ],
    "hidden_behind": "Show more"
   },
   {
    "id": "standard",
    "name": "Standard",
    "for": "the default for every type",
    "line_cols": [
     "idx",
     "item",
     "qty",
     "rate",
     "disc",
     "total",
     "del"
    ],
    "header": [
     "party",
     "docno",
     "date",
     "terms",
     "due",
     "method",
     "account"
    ],
    "summary": [
     "subtotal",
     "item_disc",
     "doc_disc",
     "tax",
     "total",
     "settled",
     "balance"
    ],
    "hidden_behind": "Advanced"
   },
   {
    "id": "pro",
    "name": "Pro",
    "for": "accountants, wholesalers, multi-warehouse, tax-heavy",
    "line_cols": [
     "idx",
     "item",
     "qty",
     "free",
     "uom",
     "rate",
     "disc",
     "tax",
     "total",
     "del"
    ],
    "header": [
     "party",
     "docno",
     "partyref",
     "date",
     "due",
     "terms",
     "method",
     "account",
     "location",
     "project",
     "currency",
     "fx"
    ],
    "summary": [
     "subtotal",
     "item_disc",
     "doc_disc",
     "tax_breakdown",
     "shipping",
     "extra",
     "roundoff",
     "total",
     "settled",
     "balance"
    ],
    "hidden_behind": null
   }
  ],
  "types": [
   {
    "id": "sales_invoice",
    "name": "Sales invoice",
    "prefix": "INV",
    "side": "sell",
    "density": "standard",
    "labels": {
     "party": "Customer",
     "docno": "Invoice #",
     "settled": "Amount paid",
     "rate": "Price",
     "save": "Complete sale"
    },
    "on": [
     "lines",
     "party_balance",
     "free_qty",
     "inline_party",
     "inline_product",
     "scan",
     "quick_entry",
     "overpayment",
     "tax_dropdown",
     "roundoff",
     "print",
     "convert_none",
     "posted_lock",
     "tabs"
    ],
    "off": []
   },
   {
    "id": "purchase_invoice",
    "name": "Purchase invoice",
    "prefix": "BILL",
    "side": "buy",
    "density": "pro",
    "labels": {
     "party": "Supplier",
     "docno": "Bill #",
     "partyref": "Supplier invoice #",
     "settled": "Amount paid",
     "rate": "Unit cost",
     "save": "Post purchase"
    },
    "on": [
     "lines",
     "landed_costs",
     "per_line_tax",
     "business_pct",
     "roundoff_input",
     "goods_status",
     "location",
     "notes",
     "zero_cost_ack",
     "payable_flip"
    ],
    "off": [
     "free_qty",
     "overpayment"
    ]
   },
   {
    "id": "quotation",
    "name": "Quotation",
    "prefix": "QT",
    "side": "sell",
    "density": "standard",
    "labels": {
     "party": "Customer",
     "docno": "Quote #",
     "settled": "Advance",
     "save": "Save quote"
    },
    "on": [
     "lines",
     "valid_until",
     "doc_status",
     "convert",
     "print",
     "inline_party",
     "inline_product",
     "free_qty"
    ],
    "off": [
     "overpayment",
     "posted_lock"
    ]
   },
   {
    "id": "sales_order",
    "name": "Sales order",
    "prefix": "SO",
    "side": "sell",
    "density": "standard",
    "labels": {
     "party": "Customer",
     "docno": "Order #",
     "settled": "Advance",
     "save": "Confirm order"
    },
    "on": [
     "lines",
     "reserve_stock",
     "expected_date",
     "convert",
     "location",
     "free_qty",
     "print"
    ],
    "off": [
     "overpayment"
    ]
   },
   {
    "id": "purchase_order",
    "name": "Purchase order",
    "prefix": "PO",
    "side": "buy",
    "density": "standard",
    "labels": {
     "party": "Supplier",
     "docno": "PO #",
     "settled": "Advance",
     "rate": "Unit cost",
     "save": "Place order"
    },
    "on": [
     "lines",
     "tax_inclusive_flag",
     "expected_date",
     "location",
     "goods_status",
     "print",
     "receive"
    ],
    "off": [
     "free_qty",
     "overpayment"
    ]
   },
   {
    "id": "sale_return",
    "name": "Sale return",
    "prefix": "SRET",
    "side": "sell",
    "density": "standard",
    "labels": {
     "party": "Customer",
     "docno": "Return #",
     "settled": "Amount refunded",
     "save": "Confirm return"
    },
    "on": [
     "lines",
     "source_doc",
     "qty_cap",
     "reason",
     "location",
     "refund_account",
     "print",
     "roundoff"
    ],
    "off": [
     "overpayment"
    ]
   },
   {
    "id": "purchase_return",
    "name": "Purchase return",
    "prefix": "PRET",
    "side": "buy",
    "density": "standard",
    "labels": {
     "party": "Supplier",
     "docno": "Return #",
     "settled": "Amount received",
     "rate": "Unit cost",
     "save": "Confirm return"
    },
    "on": [
     "lines",
     "source_doc",
     "qty_cap",
     "reason",
     "batch_pick",
     "location"
    ],
    "off": [
     "free_qty",
     "overpayment",
     "inline_product"
    ]
   },
   {
    "id": "debit_note",
    "name": "Debit note",
    "prefix": "DN",
    "side": "buy",
    "density": "standard",
    "labels": {
     "party": "Supplier",
     "docno": "Note #",
     "settled": "Refund received",
     "save": "Create debit note"
    },
    "on": [
     "lines",
     "reason",
     "location",
     "refund_account"
    ],
    "off": [
     "overpayment"
    ]
   },
   {
    "id": "goods_receipt",
    "name": "Goods receipt",
    "prefix": "GRN",
    "side": "buy",
    "density": "standard",
    "labels": {
     "party": "Supplier",
     "docno": "Receipt #",
     "save": "Receive goods"
    },
    "on": [
     "source_doc",
     "ordered_received_remaining",
     "qty_cap",
     "batch_entry",
     "expiry_entry",
     "notes",
     "location"
    ],
    "off": [
     "rate_edit",
     "disc",
     "free_qty",
     "summary_money",
     "inline_product",
     "overpayment"
    ]
   },
   {
    "id": "expense",
    "name": "Expense",
    "prefix": "EXP",
    "side": "buy",
    "density": "simple",
    "labels": {
     "party": "Payee",
     "docno": "Reference #",
     "settled": "Amount paid",
     "save": "Save record"
    },
    "on": [
     "no_lines",
     "category",
     "attachment",
     "tax_amount",
     "description",
     "method_cash_bank"
    ],
    "off": [
     "lines",
     "free_qty",
     "overpayment",
     "print",
     "convert"
    ]
   },
   {
    "id": "stock_transfer",
    "name": "Stock transfer",
    "prefix": "TRF",
    "side": "stock",
    "density": "simple",
    "labels": {
     "docno": "Transfer #",
     "save": "Create transfer"
    },
    "on": [
     "location_pair",
     "doc_status",
     "notes",
     "qty_only"
    ],
    "off": [
     "party",
     "rate",
     "disc",
     "tax",
     "summary_money",
     "free_qty",
     "overpayment",
     "print"
    ]
   },
   {
    "id": "stock_audit",
    "name": "Stock audit",
    "prefix": "AUD",
    "side": "stock",
    "density": "simple",
    "labels": {
     "docno": "Audit #",
     "save": "Save audit"
    },
    "on": [
     "location",
     "expected_counted_difference",
     "doc_status",
     "notes"
    ],
    "off": [
     "party",
     "rate",
     "disc",
     "tax",
     "summary_money",
     "free_qty",
     "overpayment",
     "print"
    ]
   },
   {
    "id": "recurring_invoice",
    "name": "Recurring invoice",
    "prefix": "REC",
    "side": "sell",
    "density": "standard",
    "labels": {
     "party": "Customer",
     "docno": "Template #",
     "save": "Save template"
    },
    "on": [
     "lines",
     "frequency",
     "next_run",
     "active_paused",
     "location",
     "free_qty",
     "roundoff"
    ],
    "off": [
     "docno_manual",
     "print",
     "overpayment",
     "convert"
    ]
   }
  ],
  "capabilities": {
   "lines": "line-item table",
   "no_lines": "document has no line items",
   "party_balance": "party card shows balance and address",
   "free_qty": "free / bonus quantity column",
   "inline_party": "create a party without leaving the document",
   "inline_product": "create a product without leaving the document",
   "scan": "barcode scan-to-add buffer",
   "quick_entry": "single-row rapid add (Alt+Q)",
   "overpayment": "give change vs credit to ledger decision",
   "tax_dropdown": "tax rate from settings.tax_rates, not free text",
   "roundoff": "round_off_total applied from settings",
   "roundoff_input": "explicit editable round-off",
   "print": "save and print",
   "convert": "convert to another document type",
   "convert_none": "no conversion target",
   "posted_lock": "posted document becomes read-only",
   "tabs": "multiple documents open at once",
   "landed_costs": "freight/duty allocation block",
   "per_line_tax": "tax rate per line",
   "business_pct": "business vs personal cost split",
   "goods_status": "received now vs not yet received",
   "location": "warehouse / location picker",
   "notes": "notes textarea",
   "zero_cost_ack": "zero unit cost acknowledgement",
   "payable_flip": "cash-to-pay vs payable label flip",
   "valid_until": "offer expiry date",
   "doc_status": "draft / sent / accepted lifecycle",
   "reserve_stock": "reserve without deducting",
   "expected_date": "expected delivery date",
   "tax_inclusive_flag": "prices include tax",
   "receive": "partial goods receipt",
   "source_doc": "linked to a parent document",
   "qty_cap": "quantity capped by the parent document",
   "reason": "mandatory structured reason",
   "refund_account": "which account the refund moves through",
   "batch_pick": "choose a batch",
   "batch_entry": "record a batch number",
   "expiry_entry": "record an expiry date",
   "ordered_received_remaining": "ordered / received / remaining columns",
   "rate_edit": "unit rate is editable",
   "disc": "discount column",
   "summary_money": "money summary panel",
   "category": "expense category",
   "attachment": "file attachment",
   "tax_amount": "tax as an amount, not a rate",
   "description": "required description",
   "method_cash_bank": "cash / bank settlement toggle",
   "location_pair": "source and destination location",
   "qty_only": "quantity only, no money",
   "expected_counted_difference": "expected / counted / difference columns",
   "frequency": "billing frequency",
   "next_run": "next run date",
   "active_paused": "active / paused",
   "docno_manual": "manually editable document number",
   "party": "party picker",
   "rate": "unit rate column",
   "tax": "tax"
  },
  "fixes": [
   [
    "notes",
    "Notes is in the payload of SI, QT, SO, SR and PO and in WorkspaceContext's default document, and NONE of the eight clone screens renders a textarea for it.",
    "A resident field on every type, in the one payload builder."
   ],
   [
    "terms",
    "The Net 7/15/30/60 select is never submitted on any screen; due_date is sent from a `dueDate` key that no input writes.",
    "Terms WRITES the due date. One control, not two, and the due date is editable."
   ],
   [
    "valid_until",
    "A quotation has no Valid Until input at all, though it is the defining field of a quote. The payload sends currentInvoice.dueDate, which is always null.",
    "Required on quotation, absent everywhere else."
   ],
   [
    "po_location",
    "Purchase order requires warehouse_id server-side and renders no input; it silently falls back to warehouses[0].",
    "Location is a resident field wherever the server needs one."
   ],
   [
    "qt_payload",
    "Quotation collects tax, delivery, extra charges, amount paid, free quantity, date and reference in the UI and drops all seven from the payload.",
    "One payload builder for all thirteen types \u2014 a field that renders is a field that posts."
   ],
   [
    "so_payload",
    "Sales order sends notes, reference, header discount, tax and per-line discount, and SalesOrderController::store ignores every one.",
    "Same builder, same contract, verified against the V3 endpoints."
   ],
   [
    "dn_warehouse",
    "Debit note never sends warehouse_id, so DebitNoteController::returnStock() never fires and returned stock is never restored.",
    "Location is resident, so the guard that skips the restock cannot be reached."
   ],
   [
    "sr_warehouse",
    "Sale return hard-codes warehouse_id to Warehouse::first() and forces tax and discount to 0 server-side while the UI collects both.",
    "Location resident; collected totals are the posted totals."
   ],
   [
    "tax_source",
    "Only the sales invoice reads settings.tax_rates. Every other screen makes the user type a raw percentage.",
    "Every type reads the same tax source."
   ],
   [
    "roundoff",
    "Only sales invoice and recurring invoice apply roundTotal(), so the same cart totals differently per document type.",
    "Round-off is a document property, applied once."
   ],
   [
    "free_qty",
    "Free quantity reaches the database from 2 of 7 sell-side types. On the other five it inflates the on-screen subtotal and is then dropped.",
    "A capability with one implementation \u2014 on or off, never half."
   ],
   [
    "party_type",
    "Every party picker except V3 Purchase uses type=all, so a purchase order will happily accept a customer.",
    "Party type is derived from the document's side."
   ],
   [
    "share",
    "No email, WhatsApp, PDF, duplicate or record-payment action exists on any editor; email and WhatsApp live only on Sales/Show.jsx.",
    "All of them are document actions, available from the editor."
   ],
   [
    "fkeys",
    "The documented F-key map exists only in Pos.jsx. KeyboardShortcutsModal.jsx advertises it to every user and no document screen implements any of it.",
    "One scoped keymap, shared by the terminal and the document."
   ],
   [
    "uom",
    "No UoM, batch, serial, HSN, per-line warehouse or per-line note anywhere on the sell side, though Product carries all of them and V3 StoreSaleRequest already REQUIRES items.*.sale_uom.",
    "Pro density exposes them; the V3 endpoints can finally be reached from a screen."
   ],
   [
    "currency",
    "No currency, exchange rate, salesperson, project or cost centre on any of the thirteen screens \u2014 zero occurrences.",
    "Pro density carries them."
   ],
   [
    "duplicate_file",
    "Sales/CreatePreSale.jsx (2,427 lines) is a live but stale duplicate of SalesOrders/CreatePreSale.jsx, reachable at store.presales.create.",
    "One editor. There is nothing left to duplicate."
   ]
  ],
  "presets": [
   {
    "id": "panel",
    "name": "Side panel",
    "comp": {
     "details": "open",
     "summary": "auto",
     "pin": "auto",
     "split": 0.3,
     "density": "standard",
     "lines": "auto"
    },
    "for": "the default \u2014 details open, summary resident on the right at 30%"
   },
   {
    "id": "wide",
    "name": "Wide lines",
    "comp": {
     "details": "collapsed",
     "summary": "auto",
     "pin": "auto",
     "split": 0.26,
     "density": "standard",
     "lines": "auto"
    },
    "for": "your own suggestion: collapse the customer block and give the items the width"
   },
   {
    "id": "focus",
    "name": "Focus",
    "comp": {
     "details": "collapsed",
     "summary": "off",
     "pin": "dock",
     "split": 0.3,
     "density": "standard",
     "lines": "auto"
    },
    "for": "nothing but the line table; the money lives in the dock"
   },
   {
    "id": "stack",
    "name": "Stacked",
    "comp": {
     "details": "open",
     "summary": "below",
     "pin": "dock",
     "split": 0.3,
     "density": "standard",
     "lines": "auto"
    },
    "for": "summary under the last line, dock carries Total and Complete"
   },
   {
    "id": "pro",
    "name": "Pro ledger",
    "comp": {
     "details": "open",
     "summary": "auto",
     "pin": "auto",
     "split": 0.32,
     "density": "pro",
     "lines": "auto"
    },
    "for": "ten line columns, twelve header fields, the full summary \u2014 and the docked total"
   },
   {
    "id": "touch",
    "name": "Touch",
    "comp": {
     "details": "collapsed",
     "summary": "off",
     "pin": "dock",
     "split": 0.3,
     "density": "simple",
     "lines": "auto"
    },
    "for": "a phone or a warehouse tablet: cards, one action, nothing else"
   }
  ],
  "controls": [
   {
    "id": "details",
    "label": "Customer & details",
    "kind": "seg",
    "options": [
     [
      "open",
      "Open"
     ],
     [
      "collapsed",
      "Collapsed"
     ]
    ],
    "note": "collapsed is one line \u2014 party, number, date, running total \u2014 and the items get the height"
   },
   {
    "id": "summary",
    "label": "Summary",
    "kind": "seg",
    "options": [
     [
      "auto",
      "Auto"
     ],
     [
      "right",
      "Right column"
     ],
     [
      "below",
      "Below the lines"
     ],
     [
      "off",
      "Off"
     ]
    ],
    "note": "auto keeps the column while it costs the line table nothing, and drops it below when it would"
   },
   {
    "id": "pin",
    "label": "While you scroll",
    "kind": "seg",
    "options": [
     [
      "auto",
      "Auto"
     ],
     [
      "sticky",
      "Hold it in place"
     ],
     [
      "dock",
      "Dock bottom-right"
     ],
     [
      "none",
      "Let it scroll"
     ]
    ],
    "note": "auto holds it where the whole column fits on screen and docks it where it does not"
   },
   {
    "id": "split",
    "label": "Summary width",
    "kind": "slider",
    "min": 0.12,
    "max": 0.55,
    "step": 0.01,
    "note": "clamped by the measured floors of both the summary and the line table"
   },
   {
    "id": "density",
    "label": "Density",
    "kind": "seg",
    "options": [
     [
      "simple",
      "Simple"
     ],
     [
      "standard",
      "Standard"
     ],
     [
      "pro",
      "Pro"
     ]
    ],
    "note": "the width can veto a density; it can never veto a capability"
   }
  ],
  "line_fits": [
   {
    "variant": "full",
    "floor": 933
   },
   {
    "variant": "std",
    "floor": 693
   },
   {
    "variant": "lean",
    "floor": 561
   },
   {
    "variant": "cards",
    "floor": 305
   }
  ],
  "summary_fits": [
   {
    "variant": "panel",
    "floor": 384
   },
   {
    "variant": "tight",
    "floor": 249
   }
  ],
  "summary_resident_min_avail": 834,
  "metrics": {
   "field_row": 72,
   "sum_row": 36,
   "sum_tot_row": 51,
   "zone_h": 44,
   "actions_h": 68,
   "strip": 593,
   "strip_h": 60,
   "dock_min": 356,
   "dock_h": 60,
   "line_h": 49,
   "lines_min_h": 147
  }
 },
 "edit": {
  "principle": "Edit mode changes what the user may CHANGE, never what the law ALLOWS. Every gesture is snapped to the law before it is committed, so a user cannot save a layout the law would reject.",
  "grants": [
   {
    "id": "move",
    "gesture": "drag the card header",
    "snap": "nearest column and row; reading order follows the DOM, never x/y"
   },
   {
    "id": "resize",
    "gesture": "drag the bottom-right corner",
    "snap": "integer columns and rows, clamped to the category min and max fits"
   },
   {
    "id": "add",
    "gesture": "+ in the band gutter",
    "snap": "inserts at that index with the category default fit"
   },
   {
    "id": "remove",
    "gesture": "x on the card header",
    "snap": "band re-flushes; no hole is ever left"
   },
   {
    "id": "swap",
    "gesture": "pick a different reading",
    "snap": "category may change; span re-resolves through \u00a76"
   },
   {
    "id": "resize_band",
    "gesture": "drag the band divider",
    "snap": "changes rows for every card in the band at once"
   }
  ],
  "invariants": [
   "A card can never be dragged below its category floor -- the resize handle stops.",
   "A card can never exceed its category max -- the resize handle stops.",
   "A band contains only cards of equal row-span, so no hole can be created by a move.",
   "Reading order is the DOM order on every screen; moving a card on a 24-column screen changes its order on a 4-column phone identically.",
   "A layout authored at any width is legal at every width, because spans are stored as AUTHORED FITS, never as pixels or as x/y.",
   "Undo is a stack of layout snapshots, not of gestures."
  ],
  "storage": {
   "table": "user_preferences",
   "why": "already exists (2026_08_08_000001), already does store-specific-then-account-wide fallback in one query via UserPreference::resolve(), and deliberately avoids the HasTenant global scope so null-tenant rows stay readable",
   "key": "shell",
   "shape": {
    "nav": {
     "desktop": "expanded|rail",
     "tablet": "rail|hidden",
     "intent": "expanded",
     "note": "intent is what the user last chose on a wide screen; it is restored when the window grows back"
    },
    "density": "simple|standard|pro",
    "pos_variant": "scan|column|row|grid|counter|table",
    "pos_catalog": "column|row|dominant|sheet|none",
    "dashboards": {
     "<surface>": [
      {
       "card": "id",
       "cat": "C3",
       "fit": "standard",
       "order": 0
      }
     ]
    }
   },
   "conflict": "surface layouts stay in layout_preferences (already migrated, already has a `surface` column for exactly this); user_preferences.shell holds only chrome choices. Two stores, two jobs, no overlap."
  },
  "reckoner": {
   "contract": "Reckoner emits a card DESCRIPTOR, never a layout. {reading, category, fit?, period?, chart?}. The engine turns descriptors into geometry. That separation is why an AI-authored dashboard cannot produce an illegal layout.",
   "guarantee": "validate() runs on every descriptor list before render. An illegal layout is rejected, not warned about."
  }
 },
 "placement": {
  "modes": [
   {
    "id": "flow",
    "name": "Flow",
    "stores": "{order, fit}",
    "packs": "bands, flushed left, no holes",
    "why": "nothing can be wrong because nothing is stored; the layout is re-derived at every width",
    "prior_art": "Gridstack compact / RGL verticalCompactor / Grafana 'Auto grid'"
   },
   {
    "id": "free",
    "name": "Free",
    "stores": "{col,row,w,h} @ column class N",
    "packs": "exactly where you put it; gaps preserved; collisions push DOWN only",
    "why": "you asked for the right side to stay empty if you leave it empty",
    "prior_art": "Gridstack float:true / RGL noCompactor / Grafana 'Custom layout'"
   }
  ],
  "projection": {
   "rule": "moveScale -- w and col scale by N'/N, row is absolute, then settle downward",
   "source": "always the nearest AUTHORED class, larger preferred; never a projection of a projection",
   "why": "round() is lossy; chaining projections drifts. One hop, always, so returning to the class you authored in restores it byte-for-byte."
  },
  "min_free_cols": 6,
  "mobile": "at 4 columns Free is not offered; the boxes are kept and sorted row-major into Flow, and restored when the grid can carry them again",
  "reading_order": "row-major (row, then col) in both modes -- so a Free layout still has one reading order on a phone and one for a screen reader"
 },
 "splitter": {
  "principle": "A splitter stops where the No-Regression Rule says the region beside it would lose a fit. It never lets go of an illegal width and snaps back -- it simply does not travel there.",
  "snap_px": 8,
  "step_px": 8,
  "aria": {
   "role": "separator",
   "props": [
    "aria-valuenow",
    "aria-valuemin",
    "aria-valuemax",
    "aria-controls",
    "aria-label",
    "aria-orientation"
   ],
   "keys": {
    "ArrowLeft/ArrowRight": "nudge 8px",
    "Enter": "toggle collapse / restore",
    "Home": "minimise the primary pane",
    "End": "maximise the primary pane",
    "Escape": "cancel the drag, restore the width it started at"
   },
   "source": "WAI-ARIA APG, Window Splitter pattern"
  },
  "double_click": "restore the archetype default",
  "where": [
   {
    "id": "shell.nav",
    "region": "primary navigation",
    "axis": "vertical",
    "min": "rail width at this viewport (0 while the nav overlays)",
    "max": "vw - 2*margin - 904, the No-Regression Rule made into a hard stop",
    "snaps": "rail, the 264 default, and every nav width that puts the content column at exactly 112px",
    "persists": "user_preferences.shell.nav.width"
   },
   {
    "id": "shell.subnav",
    "region": "secondary sidebar (Settings, Reports, Console)",
    "axis": "vertical",
    "min": "0 -- it collapses to a select in the header",
    "max": "nav max, less the primary nav",
    "snaps": "the 224 default",
    "persists": "user_preferences.shell.subnav.width"
   },
   {
    "id": "pos.cart|tender|catalog",
    "region": "register panes",
    "axis": "vertical",
    "min": "the measured floor of the pane's leanest fit",
    "max": "whatever leaves every other pane above its own floor",
    "snaps": "the preset's own fractions",
    "persists": "user_preferences.shell.pos"
   },
   {
    "id": "doc.summary",
    "region": "document summary column",
    "axis": "vertical",
    "min": "DOC_SUM_MIN",
    "max": "whatever leaves the line table above its lean floor",
    "snaps": "the density default",
    "persists": "user_preferences.shell.doc"
   }
  ]
 },
 "contentFloors": {
  "dashboard": 904,
  "document": 305,
  "terminal": 530
 },
 "underflow": {
  "min_viewport": 360,
  "behaviour": "the card keeps its leanest fit's floor as min-width and scrolls horizontally inside its own border",
  "affects": [
   "C5",
   "C6"
  ],
  "widths": "320-327 viewport (288-295px content)",
  "why_not_lower_the_floor": "295px is what a legible chart with an axis actually needs. Lowering it to 288 to make a table go green would move the failure from the validator into the user's screen."
 },
 "minViewport": 360,
 "envelopes": {
  "pos": {},
  "document": [
   {
    "from": 320,
    "mode": "bands",
    "idx": {
     "lines": 3,
     "summary": 1
    },
    "res": {
     "lines": "stacked",
     "summary": "stacked"
    }
   },
   {
    "from": 416,
    "mode": "bands",
    "idx": {
     "lines": 3,
     "summary": 0
    },
    "res": {
     "lines": "stacked",
     "summary": "stacked"
    }
   },
   {
    "from": 593,
    "mode": "bands",
    "idx": {
     "lines": 2,
     "summary": 0
    },
    "res": {
     "lines": "stacked",
     "summary": "stacked"
    }
   },
   {
    "from": 741,
    "mode": "bands",
    "idx": {
     "lines": 1,
     "summary": 0
    },
    "res": {
     "lines": "stacked",
     "summary": "stacked"
    }
   },
   {
    "from": 981,
    "mode": "bands",
    "idx": {
     "lines": 0,
     "summary": 0
    },
    "res": {
     "lines": "stacked",
     "summary": "stacked"
    }
   },
   {
    "from": 1461,
    "mode": "columns",
    "idx": {
     "lines": 0,
     "summary": 0
    },
    "res": {
     "lines": "resident",
     "summary": "resident"
    }
   }
  ]
 },
 "marginRamp": [
  600,
  648
 ],
 "railRamp": [
  1024,
  1096
 ]
};

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
