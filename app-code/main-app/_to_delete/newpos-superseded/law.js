/**
 * VenQore Layout Law v2.0 — the slice the terminal needs.
 *
 * GENERATED. Trimmed from extras/Layout Law/layout-law-v2.json by keeping only
 * the keys composeTerminal() and geometry() read. Do not hand-edit the numbers:
 * a hand edit is a number that silently disagrees with the solver.
 *
 * Dropped from the full law (dashboard + document concerns, not the register):
 *   categories, archNav, residency, archetypes, document, edit, placement,
 *   splitter, underflow, envelopes.
 */
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
  "desk_col_floor": 92,
  "drawer_peek": 56
 },
 "nav": {
  "expanded_min": 1280,
  "rail_min": 1024,
  "mobile_max": 599,
  "push_min": 1216,
  "desk_col_floor": 92,
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
   "w38": 489
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
      "size": 0,
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
      "size": 0,
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
      "tender": 0
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
      "cart": 1,
      "tender": 0
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
      "size": 0,
      "rows": 1,
      "tiles": null
     },
     "split": {
      "cart": 1,
      "tender": 0
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
      "size": 0,
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
     1
    ],
    "note": "Clamped so the cart never drops below its own floor."
   },
   {
    "id": "split.tender",
    "label": "Tender share",
    "range": [
     0,
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
 "contentFloors": {
  "dashboard": 904,
  "document": 305,
  "terminal": 530
 },
 "minViewport": 360,
 "marginRamp": [
  600,
  648
 ],
 "railRamp": [
  1024,
  1096
 ]
};

export default LAW;
