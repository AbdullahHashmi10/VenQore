const LAW = {
  "constants": {
    "sidebar_expanded": 264,
    "sidebar_rail": 72,
    "header_h": 64,
    "subnav_w": 224,
    "margin_desktop": 24,
    "margin_mobile": 16,
    "gutter": 24,
    "col_target": 112,
    "card_pad": 20,
    "card_pad_sm": 16
  },
  "nav": {
    "rail_min": 1024,
    "mobile_max": 599,
    "push_min": 1216,
    "drawer_peek": 56
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
    "small": 14
  },
  "controlMetrics": {
    "btn_min": 88,
    "icon_btn": 36,
    "tile_min": 132,
    "gap": 12,
    "gap_sm": 8
  },
  "measuredFloors": {
    "cart_line_min": 305,
    "tender_min": 201,
    "catalog_list": 254,
    "doc_table_full": 933,
    "doc_table_lean": 561,
    "doc_table_card": 305,
    "doc_summary_min": 249,
    "doc_header_2col": 584
  },
  "terminal": {
    "bar_h": 56,
    "cart_hdr": 44,
    "cart_line": 56,
    "cart_min_lines": 3,
    "tender_bar_h": 88,
    "tile_h": 152,
    "cart_min_h": 244
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
            "size": 0,
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
        "for": "the default — details open, summary resident on the right at 30%"
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
        "for": "ten line columns, twelve header fields, the full summary — and the docked total"
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
const C = LAW.constants;
const G = C.gutter;
const TARGET = C.col_target;
const SIDEBAR = C.sidebar_expanded;
const RAIL = C.sidebar_rail;
const SUBNAV = C.subnav_w;
const M_DESK = C.margin_desktop;
const M_MOB = C.margin_mobile;
const FM = LAW.fontMetrics;
function measureNumber(str, px) {
  let em = 0;
  for (const ch of String(str)) {
    em += /\d/.test(ch) ? FM.digit_em : ch === "," ? FM.comma_em : ch === "." ? FM.period_em : ch === " " ? 0.255 : 0.63;
  }
  return em * px;
}
const ramp = (v, lo, hi, from, to) => v <= lo ? from : v >= hi ? to : from + (v - lo) * (to - from) / (hi - lo);
const marginAt = (vw) => ramp(vw, LAW.marginRamp[0], LAW.marginRamp[1], M_MOB, M_DESK);
const railAt = (vw) => ramp(vw, LAW.railRamp[0], LAW.railRamp[1], 0, RAIL);
function navDefault(vw, arch = "terminal") {
  const s = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  if (s.rail == null) return "hidden";
  if (s.expanded && vw >= s.expanded) return "expanded";
  return vw >= s.rail ? "rail" : "hidden";
}
const navBehaviour = (vw) => vw >= LAW.nav.push_min ? "push" : "overlay";
const drawerWidth = (vw) => Math.min(SIDEBAR, vw - LAW.nav.drawer_peek);
const contentFloor = (arch = "terminal") => LAW.contentFloors[arch] ?? LAW.contentFloors.dashboard;
function navTravel(vw, arch = "terminal") {
  const m = marginAt(vw);
  const push = navBehaviour(vw) === "push";
  const min = push ? railAt(vw) : 0;
  let max = push ? vw - 2 * m - contentFloor(arch) : LAW.nav.push_min - 2 * M_DESK - contentFloor(arch);
  max = Math.max(min, Math.min(max, vw - LAW.nav.drawer_peek));
  return { min, max, behaviour: push ? "push" : "overlay" };
}
function shell(vw, arch = "terminal", prefs = {}) {
  const def = navDefault(vw, arch);
  const beh = navBehaviour(vw);
  const sch = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  let state = def;
  if (prefs.intent === "expanded" && beh === "push") state = "expanded";
  if (prefs.intent === "rail" && def === "expanded") state = "rail";
  if (prefs.intent === "hidden") state = "hidden";
  const open = !!prefs.open && beh === "overlay";
  const subnav = arch === "console" && sch.subnav_col != null && vw >= sch.subnav_col;
  return {
    vw,
    arch,
    nav: state,
    behaviour: beh,
    hamburger: true,
    overlayOpen: open && beh === "overlay",
    overlayWidth: beh === "overlay" ? drawerWidth(vw) : null,
    scrim: open && beh === "overlay",
    subnav,
    subnavAs: subnav ? "column" : "tabstrip",
    navPx: state === "expanded" ? SIDEBAR : state === "rail" ? railAt(vw) : 0,
    canPush: beh === "push"
  };
}
function geometry(vw, opts = {}) {
  const arch = opts.arch || "dashboard";
  const sh = shell(vw, arch, opts.prefs || (opts.navOpen ? { open: true } : {}));
  let navW = sh.navPx;
  if (opts.navW != null && sh.behaviour === "push" && sh.nav !== "hidden") {
    const t = navTravel(vw, arch);
    navW = Math.max(t.min, Math.min(t.max, opts.navW));
  }
  const sub = (opts.subnav ?? sh.subnav) && vw >= LAW.nav.rail_min ? SUBNAV : 0;
  const margin = marginAt(vw);
  const avail = vw - navW - sub - 2 * margin;
  const legal = vw <= LAW.nav.mobile_max ? LAW.legalColumnCounts.mobile : vw < LAW.nav.rail_min ? LAW.legalColumnCounts.tablet : LAW.legalColumnCounts.desktop;
  let best = null;
  for (const n of legal) {
    const col = (avail - (n - 1) * G) / n;
    if (col <= 0) continue;
    const d = Math.abs(col - TARGET);
    if (!best || d < best.d) best = { n, col, d };
  }
  return {
    vw,
    arch,
    nav: sh.nav,
    navW,
    subnav: sub,
    margin,
    avail,
    cols: best ? best.n : 1,
    col: best ? best.col : avail,
    shell: sh
  };
}
function viewportHeight(vw) {
  const pts = LAW.viewports.map((v) => [v.vp, v.vh]).sort((a, b) => a[0] - b[0]);
  if (vw <= pts[0][0]) return pts[0][1];
  if (vw >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (vw >= x0 && vw <= x1) return y0 + (vw - x0) / (x1 - x0) * (y1 - y0);
  }
  return 800;
}
function terminalHeight(vw, vh) {
  const T = LAW.terminal;
  return (vh ?? viewportHeight(vw)) - T.bar_h - 2 * marginAt(vw);
}
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function paneFit(pane, px) {
  for (const f of LAW.pos.paneFits[pane]) if (px >= f.floor) return f.variant;
  return null;
}
const presetComposition = (id) => {
  const p = LAW.pos.presets.find((x) => x.id === id);
  return p ? JSON.parse(JSON.stringify(p.comp)) : null;
};
const presets = () => LAW.pos.presets;
const keymap = () => LAW.pos.keymap;
function composeTerminal(comp, vw, vh, opts = {}) {
  const C_ = comp;
  const T = LAW.terminal;
  const F = LAW.measuredFloors;
  const g = geometry(vw, {
    arch: "terminal",
    prefs: opts.rail === false ? { intent: "hidden" } : {}
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
  const twoColMin = CART_MIN + TENDER_MIN + G;
  const regime = vw <= LAW.pos.phoneMax || avail < twoColMin ? "phone" : avail < H ? "stacked" : "columns";
  const CAPS = LAW.paneCaps || {};
  const ABSORB = new Set(LAW.absorbers || ["catalog", "floor", "lines"]);
  const FLOOR_MIN = LAW.pos.paneFits.floor[LAW.pos.paneFits.floor.length - 1].floor;
  const allocateColumns = (wantCat, wantFloor, wantTender) => {
    const f = {};
    if (wantCat) f.catalog = clampN(C_.catalog.size, 0.12, 0.55);
    f.cart = Math.max(0.2, C_.split.cart);
    if (wantTender) f.tender = clampN(C_.split.tender, 0, 0.45);
    const tracks = Object.keys(f).length + (wantFloor ? 1 : 0);
    const pool = avail - G * Math.max(0, tracks - 1);
    const reserved = wantFloor ? Math.min(FLOOR_MIN, Math.max(0, pool)) : 0;
    const share = Math.max(0, pool - reserved);
    const tot = Object.values(f).reduce((a, b) => a + b, 0) || 1;
    const frac2 = {};
    const px2 = {};
    for (const k in f) {
      frac2[k] = f[k] / tot;
      px2[k] = share * frac2[k];
    }
    if (wantFloor) {
      px2.floor = reserved;
      frac2.floor = pool ? reserved / pool : 0;
    }
    let surplus = 0;
    for (const k of ["cart", "tender"]) {
      const cap = CAPS[k];
      if (cap && px2[k] > cap) {
        surplus += px2[k] - cap;
        px2[k] = cap;
      }
    }
    if (surplus > 0) {
      const takers = Object.keys(px2).filter((k) => ABSORB.has(k));
      if (takers.length) {
        const each = surplus / takers.length;
        for (const k of takers) px2[k] += each;
      } else {
        px2.cart += surplus;
      }
    }
    if (px2.tender !== void 0) {
      const TEND_OK = LAW.pos.paneFits.tender[1].floor;
      const CART_OK = LAW.pos.paneFits.cart[1].floor;
      if (px2.tender < TEND_OK && px2.cart > CART_OK) {
        const move = Math.min(TEND_OK - px2.tender, px2.cart - CART_OK);
        px2.cart -= move;
        px2.tender += move;
      }
    }
    return { frac: frac2, pool, px: px2 };
  };
  let catRes = ["left", "right", "top", "bottom"].includes(catMode) && regime !== "phone";
  if (catRes && (catMode === "left" || catMode === "right") && avail < RESIDENT_MIN) catRes = false;
  const floorNeeds = FLOOR_MIN + G + CART_MIN + (tenderMode === "column" ? TENDER_MIN + G : 0) + (catMode === "left" || catMode === "right" ? CAT_LIST + G : 0);
  let floorRes = floorMode === "left" && regime === "columns" && avail >= floorNeeds;
  let tenderRes = regime === "columns" && tenderMode === "column" && C_.split.tender > 0;
  let alloc = null;
  for (let i = 0; i < 4; i++) {
    const wantCatCol = catRes && (catMode === "left" || catMode === "right");
    alloc = allocateColumns(wantCatCol, floorRes, tenderRes);
    const px2 = alloc.px;
    if (wantCatCol && !paneFit("catalog", px2.catalog)) {
      catRes = false;
      continue;
    }
    if (tenderRes && !paneFit("tender", px2.tender)) {
      tenderRes = false;
      continue;
    }
    if (floorRes && !paneFit("floor", px2.floor)) {
      floorRes = false;
      continue;
    }
    if (px2.cart < CART_MIN && floorRes) {
      floorRes = false;
      continue;
    }
    if (px2.cart < CART_MIN && wantCatCol) {
      catRes = false;
      continue;
    }
    break;
  }
  if (catRes && (catMode === "top" || catMode === "bottom")) {
    const probe = H - (T.tender_bar_h + G);
    catRes = T.tile_h + G + T.cart_min_h <= probe;
  }
  const tenderBar = tenderMode === "bar" || !tenderRes && tenderMode === "column" && regime === "stacked";
  if (!tenderRes) {
    dock.push({
      id: "tender",
      label: tenderBar ? "Pay" : "Take payment",
      rank: 1,
      primary: true,
      shows: "total",
      inline: tenderBar
    });
  }
  if (catMode !== "off" && !catRes) dock.push({ id: "catalog", label: "Catalog", rank: 2, shows: "count" });
  if (floorMode !== "off" && !floorRes) dock.push({ id: "floor", label: "Floor", rank: 2 });
  const dockNeedsRow = dock.some((d) => d.id === "tender");
  let dockH = !dockNeedsRow ? 0 : dock.some((d) => d.inline) ? T.tender_bar_h : 72;
  let usableH = H - (dockH ? dockH + G : 0);
  const { frac, px } = allocateColumns(
    catRes && (catMode === "left" || catMode === "right"),
    floorRes,
    tenderRes
  );
  let cat = null;
  if (catMode === "off") {
    cat = null;
  } else if (!catRes || catMode === "overlay") {
    cat = {
      mode: "overlay",
      trigger: "Catalog",
      reason: catMode === "overlay" ? "by design" : catMode === "left" || catMode === "right" ? "this screen is too narrow for a catalog column" : "no room for a strip here"
    };
    if (catMode !== "overlay") {
      notes.push(
        `catalog is one button away here: a resident catalog needs ${Math.round(RESIDENT_MIN)}px of content width and this screen has ${Math.round(avail)}px, and taking it from the cart is the wrong trade`
      );
    }
  } else if (catMode === "left" || catMode === "right") {
    const w = px.catalog;
    cat = {
      mode: catMode,
      px: Math.round(w * 10) / 10,
      fit: paneFit("catalog", w) || "list",
      tiles: C_.catalog.tiles || Math.max(1, Math.floor((w - 2 * C.card_pad + G) / (LAW.controlMetrics.tile_min + G)))
    };
  } else {
    const share = clampN(C_.catalog.size, 0, 0.55);
    let want = C_.catalog.rows;
    if (share) want = Math.max(1, Math.floor((usableH * share + G) / (T.tile_h + G)));
    let rows = 0;
    for (let r = want; r >= 1; r--) {
      const need = r * T.tile_h + (r - 1) * G;
      if (need + T.cart_min_h + G <= usableH) {
        rows = r;
        break;
      }
    }
    if (!rows) {
      cat = { mode: "overlay", reason: "height", trigger: "Catalog" };
      notes.push(
        `${Math.round(usableH)}px of usable height cannot carry a tile strip and a legible cart, so the catalog is one button away instead`
      );
      if (!dock.some((d) => d.id === "catalog")) {
        dock.push({ id: "catalog", label: "Catalog", rank: 2, shows: "count" });
      }
    } else {
      const per = C_.catalog.tiles || Math.max(2, Math.floor((avail + G) / (LAW.controlMetrics.tile_min + G)));
      cat = {
        mode: catMode,
        rows,
        demoted: rows < C_.catalog.rows,
        h: rows * T.tile_h + (rows - 1) * G,
        tiles: per,
        visible: per * rows
      };
    }
  }
  let flr = null;
  if (floorMode !== "off") {
    flr = floorRes ? { mode: "left", px: Math.round(px.floor * 10) / 10, fit: paneFit("floor", px.floor) || "list" } : { mode: "overlay", trigger: "Floor", reason: "width" };
  }
  let tender;
  if (tenderRes) {
    tender = { mode: "column", px: Math.round(px.tender * 10) / 10, fit: paneFit("tender", px.tender) || "bar" };
  } else if (tenderBar) {
    tender = { mode: "bar", h: T.tender_bar_h, docked: true };
  } else {
    tender = {
      mode: "sheet",
      trigger: "Take payment",
      reason: tenderMode === "sheet" ? "by design" : "no room for a column here"
    };
  }
  let taken = 0;
  if (cat && cat.px) taken += cat.px + G;
  if (flr && flr.px) taken += flr.px + G;
  if (tender.px) taken += tender.px + G;
  const cartPx = avail - taken;
  const cartFit = paneFit("cart", cartPx);
  const cart = {
    px: Math.round(cartPx * 10) / 10,
    fit: cartFit || "minimal",
    belowFloor: !cartFit && vw >= LAW.minViewport,
    underflow: !cartFit,
    minWidth: CART_MIN
  };
  for (const d of dock) overlays.push({ id: d.id, as: d.id === "tender" ? "sheet" : "fullscreen" });
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
      tender: tender.mode === "column" || tender.mode === "bar" || dock.some((d) => d.id === "tender"),
      total: tender.mode === "column" || tender.mode === "bar" || dock.some((d) => d.shows === "total"),
      catalog: !cat || cat.mode !== "overlay" || dock.some((d) => d.id === "catalog"),
      floor: !flr || flr.mode !== "overlay" || dock.some((d) => d.id === "floor")
    }
  };
}
const D_ = LAW.document;
const DM = D_.metrics;
const dfit = (fits, px) => fits.find((f) => px >= f.floor) || null;
const LINE_RANK = Object.fromEntries(D_.line_fits.map((f, i) => [f.variant, i]));
const dRank = (px) => {
  const f = dfit(D_.line_fits, px);
  return LINE_RANK[f ? f.variant : "cards"];
};
const DOC_COLW = {
  idx: 28,
  item: 180,
  qty: 72,
  free: 64,
  uom: 80,
  rate: Math.ceil(measureNumber("999,999.99", LAW.typeScale.small)) + 16,
  disc: 88,
  tax: 72,
  total: Math.ceil(measureNumber("9,999,999.99", LAW.typeScale.small)) + 16,
  del: LAW.controlMetrics.icon_btn
};
const docTableWidth = (cols) => cols.reduce((a, c) => a + (DOC_COLW[c] || 0), 0) + LAW.controlMetrics.gap_sm * (cols.length - 1) + 2 * C.card_pad;
const summaryHeight = (id) => {
  const d = D_.density.find((x) => x.id === id) || D_.density[1];
  return DM.zone_h + (d.summary.length - 1) * DM.sum_row + DM.sum_tot_row;
};
const detailsHeight = (id, twoCol) => {
  const d = D_.density.find((x) => x.id === id) || D_.density[1];
  const n = d.header.length + 1;
  const rows = twoCol ? Math.ceil(n / 2) : n;
  return DM.zone_h + rows * DM.field_row + 2 * 14 - LAW.controlMetrics.gap;
};
const presetDocument = (id) => JSON.parse(
  JSON.stringify((D_.presets.find((p) => p.id === id) || D_.presets[0]).comp)
);
const docPresets = () => D_.presets;
const docDensities = () => D_.density;
const docMetrics = () => DM;
function docWidths(comp, avail, mobile) {
  const want = comp.summary;
  const inner = avail - G;
  let mode = want;
  let sumPx = 0;
  let why = null;
  if (want === "right" || want === "auto") {
    const f = want === "auto" ? LAW.measuredFloors.doc_table_lean : LAW.measuredFloors.doc_table_card;
    const s = Math.max(
      LAW.measuredFloors.doc_summary_min,
      Math.min(
        Math.max(LAW.measuredFloors.doc_summary_min, inner - f),
        inner * Math.max(0.12, Math.min(0.55, comp.split))
      )
    );
    const lp = inner - s;
    if (mobile || lp < f) {
      mode = "below";
      why = `a ${LAW.measuredFloors.doc_summary_min}px column would leave the lines ${Math.round(Math.max(lp, 0))}px, under the ${f}px they need to stay a ` + (want === "auto" ? "table" : "list");
    } else {
      mode = "right";
      sumPx = s;
      const a = dfit(D_.line_fits, avail);
      const b = dfit(D_.line_fits, lp);
      if (a && b && a.variant !== b.variant) {
        why = `your choice — the column costs the table ${a.variant} → ${b.variant}`;
      }
    }
  }
  if (mode === "below" && mobile) {
    mode = "off";
    why = `${why || ""}; on a phone the money lives in the dock`;
  }
  const linesPx = avail - (mode === "right" ? G + sumPx : 0);
  return { mode, sumPx, linesPx, why };
}
function composeDocument(comp, vw, vh, opts = {}) {
  const m = marginAt(vw);
  const height = vh || viewportHeight(vw);
  const usable = height - C.header_h - 2 * m;
  const mobile = vw <= LAW.pos.phoneMax;
  let navState = navDefault(vw, "document");
  const navPx = navState === "expanded" ? SIDEBAR : navState === "rail" ? railAt(vw) : 0;
  let avail = opts.navW != null ? vw - opts.navW - 2 * m : vw - navPx - 2 * m;
  let navHeld = false;
  if (opts.navW == null && navState === "expanded") {
    const alt = vw - railAt(vw) - 2 * m;
    if (dRank(docWidths(comp, alt, mobile).linesPx) < dRank(docWidths(comp, avail, mobile).linesPx)) {
      navState = "rail";
      avail = alt;
      navHeld = true;
    }
  }
  const w = docWidths(comp, avail, mobile);
  const lineFit = dfit(D_.line_fits, w.linesPx) || D_.line_fits[D_.line_fits.length - 1];
  const sumFit = w.mode === "right" ? dfit(D_.summary_fits, w.sumPx) : null;
  let capD = "simple";
  for (const d of D_.density) if (docTableWidth(d.line_cols) <= w.linesPx) capD = d.id;
  const order = D_.density.map((d) => d.id);
  const density = order.indexOf(comp.density) <= order.indexOf(capD) ? comp.density : capD;
  const twoCol = avail >= LAW.measuredFloors.doc_header_2col && !mobile;
  let det = comp.details;
  let detH = 0;
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
  const dock = pin === "dock" || w.mode === "below" || w.mode === "off" || mobile ? [{ id: "total" }, { id: "complete", w: LAW.controlMetrics.btn_min }] : [];
  const dockH = dock.length ? DM.dock_h : 0;
  const linesH = usable - detH - dockH - (detH ? G : 0);
  return {
    vw,
    vh: height,
    avail,
    usable,
    margin: m,
    nav: navState,
    navHeld,
    mobile,
    details: { mode: det, twoCol, h: detH },
    lines: {
      px: w.linesPx,
      fit: lineFit.variant,
      floor: lineFit.floor,
      h: linesH,
      rowsVisible: Math.max(0, Math.floor(linesH / DM.line_h) - 1)
    },
    summary: {
      mode: w.mode,
      px: w.sumPx,
      fit: sumFit ? sumFit.variant : null,
      h: sumH,
      pin,
      canStick
    },
    density,
    capped: density !== comp.density,
    wantedDensity: comp.density,
    dock,
    dockH,
    reserve: dockH ? dockH + G : 0,
    demoted: w.why,
    columns: (D_.density.find((d) => d.id === density) || D_.density[1]).line_cols,
    headerFields: (D_.density.find((d) => d.id === density) || D_.density[1]).header,
    summaryRows: (D_.density.find((d) => d.id === density) || D_.density[1]).summary,
    reachable: {
      lines: w.linesPx >= LAW.measuredFloors.doc_table_card || vw < LAW.minViewport,
      details: true,
      summary: w.mode !== "off" || dock.length > 0,
      total: dock.length > 0 || w.mode !== "off",
      complete: dock.length > 0 || w.mode === "right" || w.mode === "below",
      add_line: true
    }
  };
}
const UNITS = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
function formatToFit(value, availPx, fontPx, currency = "") {
  const pre = currency ? `${currency} ` : "";
  const r4v = Math.round(value * 1e4) / 1e4;
  const grp = (v, dp) => v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const full = (dp) => pre + grp(r4v, dp);
  const compact = (dp) => {
    for (const [m, sfx] of UNITS) {
      const mant = value / m;
      if (Math.abs(value) >= m && Math.abs(mant) < 1e3) return pre + grp(mant, dp) + sfx;
    }
    return Math.abs(value) < 1e3 ? pre + grp(value, dp) : null;
  };
  const sci = (dp) => pre + value.toExponential(dp).replace("e+", "E");
  const r4 = Math.round(value * 1e4) / 1e4;
  const dp4 = (String(r4).split(".")[1] || "").length > 2;
  const small = Math.abs(value) < 1e3;
  const bare = (t) => t ? t.replace(pre, "") : null;
  const rungs = [
    dp4 ? full(4) : null,
    full(2),
    bare(full(2)),
    small ? null : compact(2),
    small ? null : bare(compact(2)),
    small ? null : compact(1),
    small ? null : compact(0),
    small ? null : bare(compact(0)),
    sci(2),
    sci(1)
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
export {
  DOC_COLW as D,
  LAW as L,
  docPresets as a,
  docTableWidth as b,
  composeDocument as c,
  docDensities as d,
  docMetrics as e,
  formatToFit as f,
  presetComposition as g,
  presets as h,
  composeTerminal as i,
  keymap as k,
  marginAt as m,
  presetDocument as p
};
