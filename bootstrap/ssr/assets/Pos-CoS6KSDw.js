import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { useRef, useState, useEffect, useMemo, useCallback, useId } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { u as useTermText, b as useTerms } from "./terms-DwYjlWsV.js";
import { f as formatCurrency, g as getCurrencySymbol, b as formatNumber } from "./format-131Nyq79.js";
import { O as OneGlanceLayout, T as Toast } from "./OneGlanceLayout-D0x15wPs.js";
import { c as approverOptions, d as describeApprovalLines, S as SetupWizardModal, w as withApproval, p as parseApprovalRequired } from "./approval-COrxd3AL.js";
import { Info, AlertTriangle, XCircle, CheckCircle, Banknote, Smartphone, CreditCard, X, Plus, Trash2, Printer, ShieldCheck, Trophy, Sparkles, ArrowLeft, ArrowRight, Unlock, Pause, History, Undo2, Wifi, Keyboard, Maximize2, LayoutGrid, MousePointerClick, Monitor, Receipt, Utensils, Check, MoveHorizontal, RotateCcw, WifiOff, Minus, Users, Bike, ShoppingBag, Clock, Phone, CircleDot, ChevronLeft, Send, ReceiptText, Split, ArrowLeftRight, ListChecks, Hash, Loader2, Minimize2, Settings, RefreshCcw, Database, ShoppingCart, ScanBarcode, User, Search, Warehouse, ChevronDown, Truck, PackagePlus, ChevronRight, Archive, Package, MinusCircle, PlusCircle } from "lucide-react";
import axios from "axios";
import { j as db$1, M as Modal, f as useWorkspace, F as FormModal } from "../ssr.js";
import { u as useAMDStation, P as PrintService } from "./PrintService-L_d7O0gK.js";
import { r as roundTotal, g as getProductPrice, s as shouldStopNegativeStock } from "./settings-DUqQ1JdE.js";
import { C as ConfirmModal } from "./ConfirmModal-DaQlI6mj.js";
import { Q as QuickPartyModal } from "./QuickPartyModal-BjRmNiLb.js";
import { P as ProductModal } from "./ProductModal-DTGv60aX.js";
import "react-dom";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-C_xHT5vA.js";
import { i as composeTerminal$1 } from "./engine-Cd795qy4.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
import "react-dom/client";
import "./PrintPreview-CmXEPl-w.js";
import "qrcode.react";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-BaeCSgsA.js";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
const LAW = {
  "constants": {
    "sidebar_expanded": 264,
    "sidebar_rail": 72,
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
    "tile_min": 132
  },
  "measuredFloors": {
    "cart_line_min": 305,
    "tender_min": 201,
    "catalog_list": 254
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
    "catalogResidentMinAvail": 1062
  },
  "document": {
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
const C = LAW.constants;
const G = C.gutter, TARGET = C.col_target;
const SIDEBAR = C.sidebar_expanded, RAIL = C.sidebar_rail, SUBNAV = C.subnav_w;
const M_DESK = C.margin_desktop, M_MOB = C.margin_mobile;
const FM = LAW.fontMetrics;
function measureNumber(str, px) {
  let em = 0;
  for (const ch of String(str))
    em += /\d/.test(ch) ? FM.digit_em : ch === "," ? FM.comma_em : ch === "." ? FM.period_em : ch === " " ? 0.255 : 0.63;
  return em * px;
}
const ramp = (v, lo, hi, from, to) => v <= lo ? from : v >= hi ? to : from + (v - lo) * (to - from) / (hi - lo);
const marginAt = (vw) => ramp(vw, LAW.marginRamp[0], LAW.marginRamp[1], M_MOB, M_DESK);
const railAt = (vw) => ramp(vw, LAW.railRamp[0], LAW.railRamp[1], 0, RAIL);
function navDefault(vw, arch = "dashboard") {
  const s = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  if (s.rail == null) return "hidden";
  if (s.expanded && vw >= s.expanded) return "expanded";
  return vw >= s.rail ? "rail" : "hidden";
}
const navBehaviour = (vw) => vw >= LAW.nav.push_min ? "push" : "overlay";
const drawerWidth = (vw) => Math.min(SIDEBAR, vw - LAW.nav.drawer_peek);
function shell(vw, arch = "dashboard", prefs = {}) {
  const def = navDefault(vw, arch);
  const beh = navBehaviour(vw);
  const sch = LAW.navSchedule[arch] || LAW.navSchedule.dashboard;
  let state = def;
  if (prefs.intent === "expanded" && beh === "push") state = "expanded";
  if (prefs.intent === "rail" && def === "expanded") state = "rail";
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
    cols: best.n,
    col: best.col,
    shell: sh
  };
}
function terminalHeight(vw, vh) {
  const T = LAW.terminal;
  return (vh ?? viewportHeight(vw)) - T.bar_h - 2 * marginAt(vw);
}
function viewportHeight(vw) {
  const pts = LAW.viewports.map((v) => [v.vp, v.vh]).sort((a, b) => a[0] - b[0]);
  if (vw <= pts[0][0]) return pts[0][1];
  if (vw >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (vw >= x0 && vw <= x1) return y0 + (vw - x0) / (x1 - x0) * (y1 - y0);
  }
  return 800;
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
function composeTerminal(comp, vw, vh) {
  const C_ = comp, T = LAW.terminal, F = LAW.measuredFloors;
  const g = geometry(vw, { arch: "terminal" });
  const avail = g.avail;
  const H = terminalHeight(vw, vh);
  const catMode = C_.catalog.mode, tenderMode = C_.tender, floorMode = C_.floor;
  const dock = [], overlays = [], notes = [];
  const CART_MIN = F.cart_line_min, TENDER_MIN = F.tender_min, CAT_LIST = F.catalog_list;
  const RESIDENT_MIN = LAW.pos.catalogResidentMinAvail;
  const twoColMin = CART_MIN + TENDER_MIN + G;
  const regime = vw <= LAW.pos.phoneMax || avail < twoColMin ? "phone" : avail < H ? "stacked" : "columns";
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
    const frac2 = {}, px2 = {};
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
      const cap = LAW.paneCaps[k];
      if (cap && px2[k] > cap) {
        surplus += px2[k] - cap;
        px2[k] = cap;
      }
    }
    if (surplus > 0) {
      const abs = Object.keys(px2).filter((k) => LAW.absorbers.includes(k));
      if (abs.length) {
        const aw = abs.reduce((a, k) => a + px2[k], 0) || 1;
        for (const k of abs) px2[k] += surplus * px2[k] / aw;
      } else {
        px2.cart += surplus;
      }
    }
    const wantTender2 = px2.tender !== void 0;
    if (wantTender2) {
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
  if (!tenderRes) dock.push({
    id: "tender",
    label: tenderBar ? "Pay" : "Take payment",
    rank: 1,
    primary: true,
    shows: "total",
    inline: tenderBar
  });
  if (catMode !== "off" && !catRes) dock.push({
    id: "catalog",
    label: "Catalog",
    rank: 2,
    shows: "count"
  });
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
  if (catMode === "off") cat = null;
  else if (!catRes || catMode === "overlay") {
    cat = {
      mode: "overlay",
      trigger: "Catalog",
      reason: catMode === "overlay" ? "by design" : catMode === "left" || catMode === "right" ? "this screen is too narrow for a catalog column" : "no room for a strip here"
    };
    if (catMode !== "overlay")
      notes.push(`catalog is one button away here: a resident catalog needs ${Math.round(RESIDENT_MIN)}px of content width and this screen has ${Math.round(avail)}px, and taking it from the cart is the wrong trade`);
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
      notes.push(`${Math.round(usableH)}px of usable height cannot carry a tile strip and a legible cart, so the catalog is one button away instead`);
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
  if (tenderRes) tender = {
    mode: "column",
    px: Math.round(px.tender * 10) / 10,
    fit: paneFit("tender", px.tender) || "bar"
  };
  else if (tenderBar) tender = { mode: "bar", h: T.tender_bar_h, docked: true };
  else tender = {
    mode: "sheet",
    trigger: "Take payment",
    reason: tenderMode === "sheet" ? "by design" : "no room for a column here"
  };
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
  for (const d of dock)
    overlays.push({ id: d.id, as: d.id === "tender" ? "sheet" : "fullscreen" });
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
    /* Reachability is a PROPERTY of the layout, asserted rather than hoped for.
       The total is ALWAYS on screen -- in the tender column, in the bar, or
       printed inside the Pay button, which is Odoo's trick and a good one. */
    reachable: {
      cart: true,
      tender: tender.mode === "column" || tender.mode === "bar" || dock.some((d) => d.id === "tender"),
      total: tender.mode === "column" || tender.mode === "bar" || dock.some((d) => d.shows === "total"),
      catalog: !cat || cat.mode !== "overlay" || dock.some((d) => d.id === "catalog"),
      floor: !flr || flr.mode !== "overlay" || dock.some((d) => d.id === "floor")
    }
  };
}
({
  rate: Math.ceil(measureNumber("999,999.99", LAW.typeScale.small)) + 16,
  total: Math.ceil(measureNumber("9,999,999.99", LAW.typeScale.small)) + 16
});
const D = LAW.document;
Object.fromEntries(D.line_fits.map((f, i) => [f.variant, i]));
const UNITS = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
function formatToFit(value, availPx, fontPx, currency = "") {
  const pre = currency ? currency + " " : "";
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
  for (const r of rungs)
    if (measureNumber(r, fontPx) <= availPx)
      return { text: r, exact, truncated: r !== exact, rung: rungs.indexOf(r) };
  const last = rungs[rungs.length - 1];
  return { text: last, exact, truncated: true, rung: rungs.length - 1 };
}
function contentFloor(arch = "dashboard") {
  return LAW.contentFloors[arch] ?? LAW.contentFloors.dashboard;
}
function navTravel(vw, arch = "dashboard") {
  const m = marginAt(vw), push = navBehaviour(vw) === "push";
  const min = push ? railAt(vw) : 0;
  let max = push ? vw - 2 * m - contentFloor(arch) : LAW.nav.push_min - 2 * M_DESK - contentFloor(arch);
  max = Math.max(min, Math.min(max, vw - LAW.nav.drawer_peek));
  return { min, max, behaviour: push ? "push" : "overlay" };
}
const PRESETS = LAW.pos.presets.map((p) => ({
  id: p.id,
  name: p.name,
  /* `tagline` is the one-line "what this shape IS" and `for` is "who it is
     for". The settings drawer shows the first and falls back to the second;
     both were being dropped here, so every preset card in the picker was
     blank under its name. */
  tagline: p.tagline || "",
  for: p.for || p.note || "",
  why: p.why || "",
  comp: p.comp,
  terminal: p.comp && p.comp.floor && p.comp.floor !== "off" ? "table" : "counter"
}));
function matchPreset(comp) {
  if (!comp) return DEFAULT_PRESET;
  const same = (p) => p.comp.catalog.mode === comp.catalog?.mode && p.comp.tender === comp.tender && p.comp.floor === "off" === ((comp.floor || "off") === "off");
  const exact = PRESETS.find(same);
  if (exact) return exact.id;
  const near = PRESETS.find((p) => p.comp.catalog.mode === comp.catalog?.mode && p.comp.tender === comp.tender) || PRESETS.find((p) => p.comp.catalog.mode === comp.catalog?.mode);
  return near ? near.id : DEFAULT_PRESET;
}
const DEFAULT_PRESET = "column";
const STORE_KEY = "pos_composition_v2";
const STORE_KEY_TABLE = "pos_composition_table_v1";
const keyFor = (terminal) => terminal === "table" ? STORE_KEY_TABLE : STORE_KEY;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
function normaliseComposition(raw) {
  const base = presetComposition(DEFAULT_PRESET);
  if (!raw || typeof raw !== "object") return base;
  const catModes = ["left", "right", "top", "bottom", "overlay", "off"];
  const tenderModes = ["column", "bar", "sheet"];
  const floorModes = ["left", "overlay", "off"];
  const c = raw.catalog || {};
  const mode = catModes.includes(c.mode) ? c.mode : base.catalog.mode;
  const isBand = mode === "top" || mode === "bottom";
  return {
    catalog: {
      mode,
      size: isBand ? 0 : isNum(c.size) ? Math.max(0, Math.min(0.55, c.size)) : base.catalog.size,
      rows: isNum(c.rows) ? Math.max(1, Math.min(3, Math.round(c.rows))) : 1,
      tiles: isNum(c.tiles) ? Math.max(1, Math.min(12, Math.round(c.tiles))) : null
    },
    split: {
      cart: isNum(raw.split?.cart) ? Math.max(0.2, Math.min(1, raw.split.cart)) : base.split.cart,
      tender: isNum(raw.split?.tender) ? Math.max(0, Math.min(0.45, raw.split.tender)) : base.split.tender
    },
    tender: tenderModes.includes(raw.tender) ? raw.tender : base.tender,
    /* WHICH SIDE the payment panel lives on. The panel was hard-wired to the
       right in three separate places -- the column order, the sheet
       transform and the dock -- so a left-handed counter, or a till whose
       customer display sits on the left, had no say. One value, read by all
       three. `bottom` turns the column into a full-width row under the
       panes, which is the right shape on a wide, short screen. */
    tenderSide: ["right", "left", "bottom"].includes(raw.tenderSide) ? raw.tenderSide : base.tenderSide || "right",
    /* WHERE THE SCAN BAR LIVES. It was derived -- a resident catalog column
       swallowed it, anything else put it on the order pane -- so a shop that
       wanted a catalog AND a scan bar over the order list could not have
       one, and a scan-led shop could not move it into the catalog. 'auto'
       keeps the old derivation for anyone who liked it. */
    scanBar: ["auto", "order", "catalog"].includes(raw.scanBar) ? raw.scanBar : base.scanBar || "auto",
    /* A catalog-led shop with a handful of SKUs does not always want a
       standing order column: the tiles carry an in-cart badge and payment
       has the totals. Off puts the order behind a button. */
    showOrder: typeof raw.showOrder === "boolean" ? raw.showOrder : base.showOrder !== false,
    /* CARDS OR ROWS. The engine derives a shape from the width it can
       afford, which is the right default and the wrong answer for a shop
       that has an opinion: a grocer reading long names wants rows at every
       width, a cafe pointing at pictures wants cards even in a narrow
       column. 'auto' keeps the derivation. */
    catalogShape: ["auto", "cards", "rows", "pills"].includes(raw.catalogShape) ? raw.catalogShape : "auto",
    floor: floorModes.includes(raw.floor) ? raw.floor : base.floor
  };
}
function loadComposition(settings, terminal = "counter") {
  try {
    const local = localStorage.getItem(keyFor(terminal));
    if (local) return normaliseComposition(JSON.parse(local));
  } catch (e) {
  }
  const fromSettings = terminal === "table" ? settings?.pos_composition_table : settings?.pos_composition;
  if (fromSettings) {
    try {
      return normaliseComposition(
        typeof fromSettings === "string" ? JSON.parse(fromSettings) : fromSettings
      );
    } catch (e) {
    }
  }
  if (terminal === "table") return presetComposition("table");
  const legacy = settings?.pos_layout_variant || localStorage.getItem("pos_layout_variant");
  if (legacy && PRESETS.some((p) => p.id === legacy) && p_terminal(legacy) === "counter") {
    return presetComposition(legacy);
  }
  return presetComposition(DEFAULT_PRESET);
}
const p_terminal = (id) => {
  const p = PRESETS.find((x) => x.id === id);
  return p ? p.terminal : "counter";
};
function saveComposition(comp, terminal = "counter") {
  try {
    localStorage.setItem(keyFor(terminal), JSON.stringify(comp));
  } catch (e) {
  }
}
function usePosLayout({ settings, senior = false, scale = 1, terminal = "counter" } = {}) {
  const ref = useRef(null);
  const [box, setBox] = useState(() => ({
    /* A first paint before the observer has fired still has to be legal,
       so we seed from the window and correct on the very next frame. */
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900
  }));
  const [comp, setComp] = useState(() => loadComposition(settings, terminal));
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return void 0;
    let frame = 0;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const cb = e.contentBoxSize ? Array.isArray(e.contentBoxSize) ? e.contentBoxSize[0] : e.contentBoxSize : null;
      const w = Math.round(cb ? cb.inlineSize : e.contentRect.width);
      const h = Math.round(cb ? cb.blockSize : e.contentRect.height);
      if (!w || !h) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setBox((prev) => prev.w === w && prev.h === h ? prev : { w, h });
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);
  const SENIOR_FACTOR = 0.86;
  const layout = useMemo(() => {
    const w = Math.max(LAW.minViewport, box.w);
    const h = Math.max(320, box.h);
    const s = Math.max(0.9, Math.min(1.3, Number(scale) || 1));
    const factor = (senior ? SENIOR_FACTOR : 1) / s;
    const ew = w * factor;
    const eh = h * factor;
    const effective = terminal === "table" ? { ...comp, floor: comp.floor && comp.floor !== "off" ? comp.floor : "left" } : { ...comp, floor: "off" };
    const t = composeTerminal(effective, Math.round(ew + 2 * 12), Math.round(eh + LAW.terminal.bar_h + 2 * 12));
    return t;
  }, [comp, box.w, box.h, senior, scale, terminal]);
  const paneCols = useMemo(() => {
    if (layout.regime === "stacked" || layout.regime === "phone") {
      return "minmax(0, 1fr)";
    }
    const parts = [];
    const cat = layout.catalog;
    const side = comp.tenderSide || "right";
    const tenderIsColumn = layout.tender.mode === "column" && side !== "bottom";
    if (tenderIsColumn && side === "left") parts.push(`${Math.round(layout.tender.px)}px`);
    if (cat && cat.mode === "left") parts.push(`${Math.round(cat.px)}px`);
    if (layout.floor && layout.floor.mode === "left") parts.push(`${Math.round(layout.floor.px)}px`);
    if (comp.showOrder === false && cat && (cat.mode === "left" || cat.mode === "right")) {
      parts[parts.length - 1] = "minmax(0, 1fr)";
    } else {
      parts.push("minmax(0, 1fr)");
    }
    if (tenderIsColumn && side === "right") parts.push(`${Math.round(layout.tender.px)}px`);
    if (cat && cat.mode === "right") parts.push(`${Math.round(cat.px)}px`);
    return parts.join(" ");
  }, [layout, comp]);
  const update = useCallback((next) => {
    setComp((prev) => {
      const merged = normaliseComposition(typeof next === "function" ? next(prev) : next);
      saveComposition(merged, terminal);
      return merged;
    });
  }, [terminal]);
  const applyPreset = useCallback((id) => {
    const p = presetComposition(id);
    if (!p) return;
    saveComposition(p, terminal);
    setComp(p);
  }, [terminal]);
  const dragSplit = useCallback((key, px) => {
    const total = Math.max(1, box.w);
    update((prev) => {
      const share = Math.max(0, Math.min(0.55, px / total));
      if (key === "tender") return { ...prev, split: { ...prev.split, tender: share } };
      if (key === "catalog") return { ...prev, catalog: { ...prev.catalog, size: share } };
      return prev;
    });
  }, [box.w, update]);
  return {
    ref,
    box,
    comp,
    layout,
    paneCols,
    update,
    applyPreset,
    dragSplit,
    formatToFit
  };
}
const db = db$1;
const isOnline = () => navigator.onLine;
const useOfflineSync = () => {
  const { store } = usePage().props;
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncErrors, setSyncErrors] = useState({});
  const checkPending = async () => {
    const count = await db.sales_queue.where("status").equals("pending").count();
    setPendingCount(count);
  };
  const syncPendingSales = async () => {
    if (!isOnline() || isSyncing) return;
    const pendingSales = await db.sales_queue.where("status").equals("pending").toArray();
    if (pendingSales.length === 0) {
      await checkPending();
      return;
    }
    setIsSyncing(true);
    let syncedCount = 0;
    const newErrors = {};
    for (const sale of pendingSales) {
      try {
        await axios.post(route("store.sales.store", {
          store_slug: store.slug
        }), sale.data);
        await db.sales_queue.update(sale.id, { status: "synced", synced_at: /* @__PURE__ */ new Date() });
        syncedCount++;
      } catch (error) {
        console.error("Sync failed for sale:", sale.id, error);
        const serverMessage = error?.response?.data?.message || error?.response?.data?.error || (error?.response?.status ? `Server error ${error.response.status}` : null) || error?.message || "Unknown error";
        newErrors[sale.id] = serverMessage;
        const currentAttempts = sale.attempt_count || 0;
        await db.sales_queue.update(sale.id, {
          attempt_count: currentAttempts + 1,
          last_error: serverMessage,
          last_attempt_at: /* @__PURE__ */ new Date()
        });
      }
    }
    setSyncErrors((prev) => ({ ...prev, ...newErrors }));
    setIsSyncing(false);
    setLastSyncTime(/* @__PURE__ */ new Date());
    checkPending();
    return syncedCount;
  };
  useEffect(() => {
    checkPending();
    const handleOnline = () => syncPendingSales();
    window.addEventListener("online", handleOnline);
    const interval = setInterval(() => {
      if (isOnline()) syncPendingSales();
    }, 6e4);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);
  const saveOfflineSale = async (saleData) => {
    try {
      await db.sales_queue.add({
        data: saleData,
        created_at: /* @__PURE__ */ new Date(),
        status: "pending"
      });
      await checkPending();
      if (isOnline()) {
        syncPendingSales();
      }
      return true;
    } catch (error) {
      console.error("Failed to save offline sale:", error);
      return false;
    }
  };
  const getPendingSales = async () => {
    return await db.sales_queue.where("status").equals("pending").toArray();
  };
  const deletePendingSale = async (id) => {
    await db.sales_queue.delete(id);
    await checkPending();
  };
  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    checkPending,
    saveOfflineSale,
    syncPendingSales,
    getPendingSales,
    deletePendingSale
  };
};
function AlertModal({ show, onClose, type = "error", title, message, actionLabel = "Okay", onAction }) {
  const icons = {
    success: /* @__PURE__ */ jsx(CheckCircle, { className: "text-emerald-500 w-12 h-12" }),
    error: /* @__PURE__ */ jsx(XCircle, { className: "text-red-500 w-12 h-12" }),
    warning: /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-500 w-12 h-12" }),
    info: /* @__PURE__ */ jsx(Info, { className: "text-blue-500 w-12 h-12" })
  };
  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };
  const isSaleCompleted = title === "Sale Completed!";
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "sm", children: /* @__PURE__ */ jsxs("div", { className: `p-8 text-center rounded-2xl transition-all duration-slow ${isSaleCompleted ? "bg-neutral-900 text-white" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-5", children: /* @__PURE__ */ jsx("div", { className: `p-4 rounded-full bg-opacity-10 ${type === "error" ? "bg-red-500" : type === "success" ? "bg-emerald-500" : type === "warning" ? "bg-amber-500" : "bg-blue-500"}`, children: icons[type] }) }),
    /* @__PURE__ */ jsx("h2", { className: `text-2xl font-bold mb-4 tracking-tight ${isSaleCompleted ? "text-white" : "text-ink"}`, children: title }),
    typeof message === "string" ? /* @__PURE__ */ jsx("p", { className: `mb-6 whitespace-pre-line text-sm leading-relaxed ${isSaleCompleted ? "text-neutral-300 font-medium" : "text-ink-muted"}`, children: message }) : /* @__PURE__ */ jsx("div", { className: "mb-6", children: message }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleAction,
        className: `w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all text-base ${isSaleCompleted ? "bg-emerald-500 hover:bg-emerald-600 " : type === "error" ? "bg-red-500 hover:bg-red-600 " : type === "success" ? "bg-emerald-500 hover:bg-emerald-600 " : type === "warning" ? "bg-amber-500 hover:bg-amber-600 " : "bg-blue-500 hover:bg-blue-600 "}`,
        children: actionLabel
      }
    )
  ] }) });
}
function InputModal({ show, onClose, title, message, placeholder, initialValue = "", onSubmit, submitLabel = "Submit", zIndex = "z-50" }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (show) setValue(initialValue);
  }, [show, initialValue]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
    onClose();
  };
  return /* @__PURE__ */ jsx(Modal, { show, onClose, maxWidth: "sm", zIndex, children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink mb-2", children: title }),
    message && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-4", children: message }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value,
        onChange: (e) => setValue(e.target.value),
        placeholder,
        className: "w-full bg-app border border-line rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-500 mb-6 text-ink",
        autoFocus: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "flex-1 py-2.5 rounded-xl font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "flex-1 py-2.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg active:scale-95 transition-all",
          children: submitLabel
        }
      )
    ] })
  ] }) });
}
const PaymentModal = ({
  isOpen,
  onClose,
  totalAmount,
  onComplete,
  currency = "PKR",
  bankAccounts = [],
  customer = null,
  defaultPrintReceipt = true,
  /* A table splitting one bill between several people is not a different
     kind of sale -- it is this panel, which has always taken more than one
     tender. `seedSplit` only fills the amounts in, so "four ways" stops
     being arithmetic the waiter does on a napkin.
       { ways: n }    n equal rows
       { amount: x }  one row for x, the rest left to settle */
  seedSplit = null
}) => {
  if (!isOpen) return null;
  const [payments, setPayments] = useState([
    {
      method: "cash",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    },
    {
      method: "bank",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }
  ]);
  const [notes, setNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt);
  const [activeMethodDropdownIndex, setActiveMethodDropdownIndex] = useState(null);
  const [activeAccountDropdownIndex, setActiveAccountDropdownIndex] = useState(null);
  useEffect(() => {
    if (isOpen) {
      const acct = bankAccounts.length > 0 ? bankAccounts[0].id : null;
      const blank = [
        { method: "cash", amount: "", account_id: acct },
        { method: "bank", amount: "", account_id: acct }
      ];
      if (seedSplit && seedSplit.ways > 1) {
        const n = Math.min(8, Math.max(2, Math.round(seedSplit.ways)));
        const each = Math.floor(totalAmount / n * 100) / 100;
        const rows = Array.from({ length: n }, () => ({ method: "cash", amount: each.toFixed(2), account_id: acct }));
        const drift = Math.round((totalAmount - each * n) * 100) / 100;
        if (drift) rows[0].amount = (each + drift).toFixed(2);
        setPayments(rows);
      } else if (seedSplit && seedSplit.amount > 0) {
        const first = Math.min(Number(seedSplit.amount), totalAmount);
        setPayments([
          { method: "cash", amount: first.toFixed(2), account_id: acct },
          { method: "card", amount: Math.max(0, totalAmount - first).toFixed(2), account_id: acct }
        ]);
      } else {
        setPayments(blank);
      }
      setNotes("");
      setPrintReceipt(defaultPrintReceipt);
    }
  }, [isOpen, totalAmount, defaultPrintReceipt, seedSplit]);
  const paymentMethods = [
    { id: "cash", name: "Cash", icon: Banknote, color: "bg-emerald-500" },
    { id: "bank", name: "Bank Transfer", icon: Smartphone, color: "bg-brand-500" },
    { id: "card", name: "Card", icon: CreditCard, color: "bg-blue-500" },
    { id: "upi", name: "UPI / QR", icon: Smartphone, color: "bg-brand-500" },
    { id: "credit", name: "Credit (Udhaar)", icon: CheckCircle, color: "bg-amber-500" }
  ].filter((m) => m.id !== "credit" || customer !== null);
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balance = totalPaid - totalAmount;
  const isCreditSale = payments.some((p) => p.method === "credit");
  const addPaymentMethod = () => {
    const remaining = Math.max(0, totalAmount - totalPaid);
    setPayments([...payments, {
      method: "cash",
      amount: remaining > 0 ? remaining : "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }]);
  };
  const removePaymentMethod = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments.length ? newPayments : [{
      method: "cash",
      amount: "",
      account_id: bankAccounts.length > 0 ? bankAccounts[0].id : null
    }]);
  };
  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };
  const handleComplete = () => {
    if (totalPaid < totalAmount && !isCreditSale) {
      alert("Total payment must equal or exceed the bill amount. Add a 'Credit' payment line for the balance.");
      return;
    }
    onComplete({
      payments: payments.map((p) => ({ ...p, amount: parseFloat(p.amount) || 0 })),
      totalPaid,
      change: balance > 0 ? balance : 0,
      notes,
      printReceipt
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center bg-sunken/50 dark:bg-surface", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-ink", children: "Complete Sale" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Select payment methods and finalize" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-full transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-ink-muted" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 bg-brand-50 dark:bg-brand-900/20 p-6 rounded-2xl border border-brand-100 dark:border-brand-500/30", children: [
        /* @__PURE__ */ jsx("span", { className: "text-lg font-medium text-brand-900 dark:text-brand-300", children: "Total Payable" }),
        /* @__PURE__ */ jsx("span", { className: "text-4xl font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(totalAmount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink-secondary uppercase tracking-wider", children: "Payment Methods" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: addPaymentMethod,
              className: "text-xs flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Split Payment"
              ]
            }
          )
        ] }),
        payments.map((payment, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-start animate-in slide-in-from-left-2 duration-normal", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setActiveMethodDropdownIndex(activeMethodDropdownIndex === index ? null : index),
                className: "w-full h-12 pl-10 pr-8 bg-app border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 font-medium text-ink-secondary dark:text-ink flex items-center justify-between cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: paymentMethods.find((m) => m.id === payment.method)?.name || "Method" }),
                  /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-2xs", children: "▼" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", children: (() => {
              const Icon = paymentMethods.find((m) => m.id === payment.method)?.icon || Banknote;
              return /* @__PURE__ */ jsx(Icon, { size: 18 });
            })() }),
            activeMethodDropdownIndex === index && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1 bg-surface rounded-[14px] shadow-2xl border border-line overflow-hidden z-drawer animate-in slide-in-from-top-2 duration-normal max-h-48 overflow-y-auto", children: paymentMethods.map((method) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  updatePayment(index, "method", method.id);
                  setActiveMethodDropdownIndex(null);
                },
                className: `w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${payment.method === method.id ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-ink-secondary"}`,
                children: method.name
              },
              method.id
            )) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-[1.5]", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold text-sm", children: usePage().props.store?.currency_symbol || "Rs" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: payment.amount,
                  onChange: (e) => updatePayment(index, "amount", e.target.value),
                  placeholder: "0.00",
                  className: "w-full h-12 pl-10 pr-4 bg-surface border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 font-bold text-lg text-right text-ink",
                  autoFocus: index === payments.length - 1,
                  onFocus: (e) => e.target.select()
                }
              )
            ] }),
            ["bank", "card", "online", "upi"].includes(payment.method) && bankAccounts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1.5 animate-in slide-in-from-top-1 duration-normal relative", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveAccountDropdownIndex(activeAccountDropdownIndex === index ? null : index),
                  className: "w-full bg-sunken rounded-lg py-1.5 px-3 text-2xs font-bold text-ink-secondary focus:ring-1 focus:ring-brand-500/50 outline-none flex items-center justify-between cursor-pointer transition-all",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: bankAccounts.find((acc) => String(acc.id) === String(payment.account_id))?.name || bankAccounts[0]?.name || "Select Account" }),
                    /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-4xs ml-1", children: "▼" })
                  ]
                }
              ),
              activeAccountDropdownIndex === index && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-0.5 bg-surface rounded-[14px] shadow-xl border border-line overflow-hidden z-drawer animate-in slide-in-from-top-1 duration-fast max-h-32 overflow-y-auto", children: bankAccounts.map((acc) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    updatePayment(index, "account_id", acc.id);
                    setActiveAccountDropdownIndex(null);
                  },
                  className: `w-full text-left px-3 py-2 text-2xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${String(payment.account_id) === String(acc.id) ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-ink-secondary"}`,
                  children: acc.name
                },
                acc.id
              )) })
            ] })
          ] }),
          payments.length > 1 && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => removePaymentMethod(index),
              className: "h-12 w-12 flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
            }
          )
        ] }, index))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl border border-line", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-medium uppercase", children: "Total Paid" }),
          /* @__PURE__ */ jsx("div", { className: `text-xl font-bold ${totalPaid < totalAmount ? "text-amber-500" : "text-emerald-600"}`, children: formatCurrency(totalPaid) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl border border-line", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-medium uppercase", children: "Change Due" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-ink", children: formatCurrency(balance > 0 ? balance : 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink-secondary uppercase tracking-wider mb-2 block", children: "Sale Notes" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            placeholder: "Add notes for this sale...",
            className: "w-full p-3 bg-app border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 text-sm min-h-[80px] resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 cursor-pointer", onClick: () => setPrintReceipt(!printReceipt), children: [
        /* @__PURE__ */ jsx("div", { className: `w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${printReceipt ? "bg-brand-600 border-brand-600" : "border-line dark:border-line"}`, children: printReceipt && /* @__PURE__ */ jsx(CheckCircle, { size: 16, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-ink-secondary select-none flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Printer, { size: 16 }),
          " Print Receipt automatically"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-line bg-sunken/50 dark:bg-surface", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleComplete,
        disabled: totalPaid < totalAmount && !isCreditSale,
        className: `
                            w-full h-14 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${totalPaid < totalAmount && !isCreditSale ? "bg-sunken text-ink-muted cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]"}
`,
        children: [
          /* @__PURE__ */ jsx("span", { children: "Complete Sale" }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1.5 rounded-lg text-base font-bold bg-white/25 border border-white/20", children: formatCurrency(totalPaid > totalAmount ? totalAmount : totalPaid) })
        ]
      }
    ) })
  ] }) });
};
function ApprovalPinModal({ request, storeSlug, onSubmit, onClose, busy = false, money, zIndex = "z-50" }) {
  const show = !!request;
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pinState, setPinState] = useState({ req: request, value: "" });
  const pin = pinState.req === request ? pinState.value : "";
  const setPin = (value) => setPinState({ req: request, value });
  useEffect(() => {
    let cancelled = false;
    axios.get(`/s/${storeSlug}/sales/approvers`).then((res) => {
      if (!cancelled) setApprovers(res.data?.approvers || []);
    }).catch(() => {
      if (!cancelled) {
        setApprovers([]);
        setLoadError("Could not load approvers.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);
  const options = useMemo(() => approverOptions(approvers, request), [approvers, request]);
  const selected = options.find((o) => o.user_id === selectedId) || null;
  const lines = describeApprovalLines(request, money);
  const canSubmit = !!selected && !selected.disabled && (!selected.needsPin || pin.length > 0) && !busy;
  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ approvedBy: selected.user_id, pin: selected.needsPin ? pin : "" });
  };
  const title = request?.reasons?.includes("below_cost") && request?.reasons?.includes("discount_limit") ? "Below cost and over discount limit" : request?.reasons?.includes("below_cost") ? "Sale below cost" : request?.reasons?.includes("discount_limit") ? "Discount over your limit" : "Manager approval";
  return /* @__PURE__ */ jsx(Modal, { show, onClose: busy ? () => {
  } : onClose, maxWidth: "sm", zIndex, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "p-6", "data-testid": "pos-approval-modal", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 mb-4", children: [
      /* @__PURE__ */ jsx("div", { className: "shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 24 }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-1", children: "A manager must approve this sale." })
      ] })
    ] }),
    lines.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mb-4 space-y-1 text-sm text-ink-secondary", children: lines.map((text, i) => /* @__PURE__ */ jsx("li", { className: "px-3 py-2 rounded-xl bg-sunken", children: text }, i)) }),
    /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2", children: "Approved by" }),
    loading ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted py-2", children: "Loading approvers…" }) : options.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted py-2", children: loadError || "No owner, admin or manager in this store." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto mb-4", children: options.map((o) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        disabled: !!o.disabled || busy,
        onClick: () => {
          setSelectedId(o.user_id);
          setPin("");
        },
        className: `w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedId === o.user_id ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-line hover:border-brand-400"}`,
        children: [
          /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("span", { className: "block font-bold text-sm text-ink truncate", children: [
              o.name,
              o.is_self ? " (you)" : ""
            ] }),
            /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted capitalize", children: o.role })
          ] }),
          o.disabled && /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted shrink-0", children: o.disabled })
        ]
      },
      o.user_id
    )) }),
    selected?.needsPin && /* @__PURE__ */ jsx(
      "input",
      {
        type: "password",
        inputMode: "numeric",
        autoComplete: "off",
        maxLength: 20,
        value: pin,
        onChange: (e) => setPin(e.target.value.replace(/\s/g, "")),
        placeholder: `${selected.name}'s PIN`,
        "aria-label": "Approver PIN",
        className: "w-full bg-app border border-line rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-500 mb-4 text-ink tracking-widest",
        autoFocus: true
      }
    ),
    request?.approvalError && /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-red-500 mb-4", role: "alert", children: request.approvalError }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          disabled: busy,
          className: "flex-1 py-2.5 rounded-xl font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors disabled:opacity-50",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: !canSubmit,
          className: "flex-1 py-2.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          children: busy ? "Approving…" : "Approve & complete"
        }
      )
    ] })
  ] }) });
}
function PosTourGuide({ store }) {
  const tt = useTermText();
  const [hasCustomers, setHasCustomers] = useState(true);
  const [isCustomerCreationPath, setIsCustomerCreationPath] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const isVisible = store?.onboarding_step === "pos_tour" || store?.onboarding_step === "pos_congratulations";
  useEffect(() => {
    if (isVisible) {
      axios.get(route("store.parties.search", { store_slug: store?.slug }), { params: { query: "", type: "customer" } }).then((res) => {
        const list = res.data || [];
        const empty = list.length === 0;
        setHasCustomers(!empty);
        if (isCustomerCreationPath === null) {
          setIsCustomerCreationPath(empty);
        }
      }).catch((err) => console.error("Failed to search customers:", err));
    }
  }, [isVisible, store?.slug]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    if (isCustomerCreationPath) {
      switch (step) {
        case 0:
          return "tour-pos-customer";
        case 1:
          return "tour-add-new-party-btn";
        case 2:
          return "tour-party-name";
        case 3:
          return "tour-party-phone";
        case 4:
          return "tour-party-address";
        case 5:
          return "tour-party-submit";
        case 6:
          return "tour-pos-product";
        case 7:
          return "tour-pos-paid";
        case 8:
          return "tour-pos-checkout";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return "tour-pos-customer";
        case 1:
          return "tour-pos-product";
        case 2:
          return "tour-pos-paid";
        case 3:
          return "tour-pos-checkout";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isVisible || !isCustomerCreationPath) return;
    const interval = setInterval(() => {
      const activeId = document.activeElement?.id;
      if (currentStep === 0) {
        if (document.getElementById("tour-add-new-party-btn")) {
          setCurrentStep(1);
        }
      } else if (currentStep === 1) {
        if (document.getElementById("tour-party-name")) {
          setCurrentStep(2);
        }
      } else if (currentStep === 2) {
        if (activeId === "tour-party-phone") {
          setCurrentStep(3);
        }
      } else if (currentStep === 3) {
        if (activeId === "tour-party-address") {
          setCurrentStep(4);
        }
      } else if (currentStep === 4) {
        if (activeId === "tour-party-submit") {
          setCurrentStep(5);
        }
      } else if (currentStep === 5) {
        if (!document.getElementById("tour-party-name")) {
          setCurrentStep(6);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentStep, isVisible, isCustomerCreationPath]);
  useEffect(() => {
    if (!isVisible || store?.onboarding_step === "pos_congratulations") {
      setCoords(null);
      return;
    }
    const targetId = getTargetId(currentStep);
    if (!targetId) {
      setCoords(null);
      return;
    }
    const updateCoords = () => {
      const el2 = document.getElementById(targetId);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setCoords(null);
      }
    };
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(updateCoords, 80);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible, store?.onboarding_step, isCustomerCreationPath]);
  const handleStartInvoiceTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "invoice_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleStartExpenseTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "expense_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleSkipSetup = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  if (!isVisible) return null;
  if (store?.onboarding_step === "pos_congratulations") {
    const doneSteps = store?.onboarding_steps_done || [];
    const isInvoiceDone = doneSteps.includes("invoice");
    return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-drawer flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
      /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-drawer animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-glow mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Trophy, { className: "text-white w-8 h-8" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-white tracking-tight mb-3", children: "POS Checkout Completed! 🛒🎉" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-2", children: "Your retail sale transaction is completed successfully!" }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-sm mb-6", children: [
            "Outstanding! You've checked out a sale on the cashier terminal.",
            isInvoiceDone ? " Both sales routes are complete. Let's record store expenses next to track your cash flow!" : " Let's check out our detailed B2B Invoice creation next, or proceed to record expenses!"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5 w-full", children: [
            !isInvoiceDone && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartInvoiceTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-brand text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Try B2B Invoice" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartExpenseTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Record Expenses" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSkipSetup,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 hover:text-white font-bold rounded-xl border border-neutral-700/60 transition-all duration-normal active:scale-[0.99] cursor-pointer text-xs mt-1",
                children: /* @__PURE__ */ jsx("span", { children: "Skip & Finish Setup" })
              }
            )
          ] })
        ] })
      ] }) })
    ] });
  }
  const getTooltipStyle = () => {
    if (!coords) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    const spaceOnRight = window.innerWidth - (coords.left + coords.width);
    const spaceOnLeft = coords.left;
    if (spaceOnRight > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left + coords.width + 20,
        width: "320px",
        zIndex: 115
      };
    } else if (spaceOnLeft > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left - 340,
        width: "320px",
        zIndex: 115
      };
    } else {
      return {
        position: "fixed",
        top: coords.top + coords.height + 20,
        left: coords.left + coords.width / 2 - 160,
        width: "320px",
        zIndex: 115
      };
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-drawer overflow-hidden pointer-events-none", children: [
    coords && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed pointer-events-none transition-all duration-fast ease-out",
        style: {
          top: coords.top - 6,
          left: coords.left - 6,
          width: coords.width + 12,
          height: coords.height + 12,
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
          zIndex: 110
        }
      }
    ),
    !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/75 pointer-events-none z-drawer" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: getTooltipStyle(),
        className: "bg-neutral-900/95 dark:bg-app border border-brand-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-drawer animate-in fade-in duration-slow",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-500/10 rounded-lg text-brand-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "POS Checkout Tour" }),
              /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-brand-400", children: [
                "Step ",
                currentStep + 1,
                " of ",
                isCustomerCreationPath ? 9 : 4
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            isCustomerCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: tt("You don't have any customers yet! Click on the Customer block.") }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Now click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("+ Add New Customer") }),
                " in the search dropdown."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Put in the customer's ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Name" }),
                " inside the modal."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Phone Number" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Address" }),
                "."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Create Customer") }),
                " to save the customer."
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Great! Now move toward the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Search Product") }),
                " option and select the previously created product."
              ] }),
              currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Tendered" }),
                " (cash received from customer)."
              ] }),
              currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Checkout" }),
                " to record the transaction."
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "First, select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Customer") }),
                " for the POS transaction (default/walk-in customer is pre-selected)."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Search and select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: tt("Product") }),
                " to add to the shopping cart."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Tendered" }),
                " (cash received from customer)."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Checkout" }),
                " or Submit Payment to record the transaction and generate the receipt!"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 bg-neutral-800 text-ink-muted hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < (isCustomerCreationPath ? 8 : 3) && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Next" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
}
const PREVIEW_DEVICES = [
  { id: "phone", label: "Phone", vw: 390, vh: 745 },
  { id: "tablet", label: "Tablet", vw: 1024, vh: 695 },
  { id: "laptop", label: "Laptop", vw: 1280, vh: 720 },
  { id: "desktop", label: "Desktop", vw: 1920, vh: 1080 }
];
const TONES = {
  catalog: { fill: "bg-sky-100 dark:bg-sky-950/50", line: "border-sky-300 dark:border-sky-800", text: "text-sky-800 dark:text-sky-300" },
  floor: { fill: "bg-brand-100 dark:bg-brand-950/50", line: "border-brand-300 dark:border-brand-800", text: "text-brand-800 dark:text-brand-300" },
  cart: { fill: "bg-emerald-100 dark:bg-emerald-950/50", line: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-800 dark:text-emerald-300" },
  tender: { fill: "bg-amber-100 dark:bg-amber-950/50", line: "border-amber-300 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300" }
};
function Pane({ kind, label, sub, style, className = "" }) {
  const t = TONES[kind] || TONES.cart;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style,
      className: `${t.fill} ${t.line} border rounded-md min-w-0 min-h-0 overflow-hidden
                        flex flex-col items-center justify-center gap-0.5 px-1 ${className}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `text-[9px] font-bold uppercase tracking-wide ${t.text} truncate max-w-full`, children: label }),
        sub && /* @__PURE__ */ jsx("span", { className: `text-[8px] font-bold ${t.text} opacity-70 truncate max-w-full`, children: sub })
      ]
    }
  );
}
function RegisterPreview({
  comp,
  device = PREVIEW_DEVICES[3],
  senior = false,
  scale = 1,
  rail = false
}) {
  const layout = useMemo(() => {
    const f = (senior ? 0.86 : 1) / Math.max(0.9, Math.min(1.3, scale || 1));
    const railPx = rail ? 76 : 0;
    try {
      return composeTerminal$1(comp, Math.round((device.vw - railPx) * f), Math.round(device.vh * f));
    } catch (e) {
      return null;
    }
  }, [comp, device, senior, scale, rail]);
  if (!layout) {
    return /* @__PURE__ */ jsx("div", { className: "aspect-[16/10] w-full rounded-lg border border-line bg-sunken/50\n                            flex items-center justify-center text-2xs text-ink-muted", children: "Preview unavailable" });
  }
  const cat = layout.catalog;
  const flr = layout.floor;
  const stacked = layout.regime !== "columns";
  const avail = Math.max(1, layout.avail);
  const pct = (px) => `${Math.max(4, px / avail * 100)}%`;
  const cols = [];
  if (cat && cat.mode === "left") cols.push(["catalog", pct(cat.px)]);
  if (flr && flr.mode === "left") cols.push(["floor", pct(flr.px)]);
  cols.push(["cart", "minmax(0,1fr)"]);
  if (layout.tender.mode === "column") cols.push(["tender", pct(layout.tender.px)]);
  if (cat && cat.mode === "right") cols.push(["catalog", pct(cat.px)]);
  const bandRows = cat && cat.h ? Math.max(1, cat.rows || 1) : 0;
  const dockLabels = layout.dock.map((d) => d.label);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "w-full rounded-xl border-2 border-ink-faint/40 bg-app p-1.5 shadow-xs\n                           flex flex-col gap-1.5 select-none",
        style: { aspectRatio: `${device.vw} / ${device.vh}` },
        role: "img",
        "aria-label": `Register preview at ${device.vw} by ${device.vh}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "h-3 shrink-0 rounded bg-surface border border-line flex items-center gap-1 px-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-1 rounded-sm bg-ink-faint/40" }),
            /* @__PURE__ */ jsx("span", { className: "w-5 h-1 rounded-sm bg-ink-faint/25" }),
            /* @__PURE__ */ jsx("span", { className: "flex-1" }),
            /* @__PURE__ */ jsx("span", { className: "w-2 h-1 rounded-sm bg-brand-500/50" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 flex flex-col gap-1.5", children: [
            cat && cat.mode === "top" && /* @__PURE__ */ jsx(
              Pane,
              {
                kind: "catalog",
                label: "Catalog",
                sub: `${bandRows} row${bandRows === 1 ? "" : "s"}`,
                className: "shrink-0",
                style: { height: `${Math.min(38, bandRows * 16)}%` }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex-1 min-h-0 grid gap-1.5",
                style: stacked ? { gridTemplateRows: "repeat(auto-fit, minmax(0,1fr))" } : { gridTemplateColumns: cols.map((c) => c[1]).join(" ") },
                children: stacked ? /* @__PURE__ */ jsx(Pane, { kind: "cart", label: "Cart", sub: `${layout.cartLines} lines` }) : cols.map(([kind], i) => /* @__PURE__ */ jsx(
                  Pane,
                  {
                    kind,
                    label: kind === "cart" ? "Cart" : kind === "tender" ? "Payment" : kind === "floor" ? "Floor" : "Catalog",
                    sub: kind === "cart" ? `${layout.cartLines} lines` : kind === "tender" ? `${Math.round(layout.tender.px)}px` : kind === "floor" ? `${Math.round(flr.px)}px` : `${Math.round(cat.px)}px`
                  },
                  `${kind}-${i}`
                ))
              }
            ),
            cat && cat.mode === "bottom" && /* @__PURE__ */ jsx(
              Pane,
              {
                kind: "catalog",
                label: "Catalog",
                sub: `${bandRows} row${bandRows === 1 ? "" : "s"}`,
                className: "shrink-0",
                style: { height: `${Math.min(38, bandRows * 16)}%` }
              }
            )
          ] }),
          layout.tender.mode === "bar" ? /* @__PURE__ */ jsxs("div", { className: "h-5 shrink-0 rounded-md border border-amber-300 dark:border-amber-800\n                                    bg-amber-100 dark:bg-amber-950/50 flex items-center justify-between px-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-amber-800 dark:text-amber-300", children: "TOTAL" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white", children: "Pay" })
          ] }) : dockLabels.length > 0 && /* @__PURE__ */ jsx("div", { className: "h-4 shrink-0 flex items-center gap-1", children: layout.dock.map((d) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `text-[8px] font-bold px-1.5 py-0.5 rounded truncate
                                            ${d.primary ? "bg-emerald-600 text-white flex-1 text-center" : "bg-surface border border-line text-ink-secondary"}`,
              children: d.label
            },
            d.id
          )) })
        ]
      }
    ),
    layout.notes.length > 0 && /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: layout.notes.map((n, i) => /* @__PURE__ */ jsx(
      "li",
      {
        className: "text-3xs leading-relaxed text-amber-800 dark:text-amber-300\n                                       bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50\n                                       rounded-lg px-2.5 py-1.5",
        children: n
      },
      i
    )) })
  ] });
}
const POS_KEYMAP = [
  ["F1", "Focus scan / search"],
  ["F2", "Quantity on the active line"],
  ["F3", "Discount on the active line"],
  ["F4", "Remove the active line"],
  ["F5", "Rate on the active line"],
  ["F7", "Document tax"],
  ["F8", "Additional charges"],
  ["F9", "Document discount"],
  ["F11", "Customer / party"],
  ["F12", "Sale remarks"],
  ["Ctrl + S", "Hold the sale"],
  ["Ctrl + T", "New sale tab"],
  ["Ctrl + W", "Close this tab"],
  ["Ctrl + D", "Open cash drawer"],
  ["Ctrl + F", "Bill breakdown"],
  ["Ctrl + 1…9", "Select line n"],
  ["Alt + L", "Register settings"],
  ["Alt + Z", "Fullscreen"],
  ["Esc", "Close the top layer"],
  ["?", "Show this map"]
];
const SURFACE_BUTTONS = [
  {
    id: "drawer",
    label: "Open cash drawer",
    icon: Unlock,
    dflt: true,
    hint: "Pulses the drawer without a sale. Ctrl + D does the same thing."
  },
  {
    id: "parked",
    label: "Parked sales",
    icon: Pause,
    dflt: true,
    hint: "Held sales, ready to recall. Carries a count when any are waiting."
  },
  {
    id: "recent",
    label: "Recent invoices",
    icon: History,
    dflt: false,
    hint: "The last sales from this till, with reprint."
  },
  {
    id: "returns",
    label: "Return mode",
    icon: Undo2,
    dflt: false,
    hint: "Switches the register to refunds. Leave it off on a till that never takes them."
  },
  {
    id: "online",
    label: "Online status light",
    icon: Wifi,
    dflt: true,
    hint: "A bare dot: green when sales post immediately, red when they are queuing on this device. Deliberately not in a box — a status light inside a bordered pill reads as a button."
  },
  {
    id: "printer",
    label: "Printer status",
    icon: Printer,
    dflt: true,
    hint: "Reports what is actually attached: ready with a count, amber when the station is running but no printer answered, grey when there is no station at all. Tap it to open Hardware."
  },
  {
    id: "keys",
    label: "Keyboard shortcuts",
    icon: Keyboard,
    dflt: false,
    hint: "Opens the key map. “?” opens it whether or not the button is here."
  },
  {
    id: "fullscreen",
    label: "Fullscreen",
    icon: Maximize2,
    dflt: false,
    hint: "Hides the browser chrome. Alt + Z does the same thing."
  }
];
const DEFAULT_SURFACE = SURFACE_BUTTONS.reduce(
  (a, b) => {
    a[b.id] = b.dflt;
    return a;
  },
  {}
);
function Eyebrow({ children, className = "" }) {
  return /* @__PURE__ */ jsx("h4", { className: `text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted ${className}`, children });
}
function Field({ title, hint, badge, children, stacked = false }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line/80 bg-surface shadow-xs p-3.5", children: [
    /* @__PURE__ */ jsxs("div", { className: stacked ? "space-y-2.5" : "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink leading-tight", children: title }),
          badge
        ] }),
        hint && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed max-w-[46ch]", children: hint })
      ] }),
      !stacked && /* @__PURE__ */ jsx("div", { className: "shrink-0", children })
    ] }),
    stacked && children
  ] });
}
function Toggle({ checked, onChange, label, tone = "brand", disabled = false }) {
  const on = tone === "danger" ? "bg-danger-600" : tone === "success" ? "bg-emerald-600" : "bg-brand-600";
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": !!checked,
      "aria-label": label,
      disabled,
      onClick: () => !disabled && onChange(!checked),
      className: `relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        disabled:opacity-40 disabled:cursor-not-allowed ${checked ? on : "bg-line-strong"}`,
      children: /* @__PURE__ */ jsx(
        "span",
        {
          className: `absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                            transition-[left,right] duration-fast ${checked ? "right-0.5" : "left-0.5"}`
        }
      )
    }
  );
}
function Segmented({ value, options, onChange, label, disabled = false }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "radiogroup",
      "aria-label": label,
      className: `flex flex-wrap gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70
                        ${disabled ? "opacity-40 pointer-events-none" : ""}`,
      children: options.map((opt) => {
        const active = value === opt.value;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": active,
            title: opt.hint || opt.label,
            onClick: () => onChange(opt.value),
            className: `flex-1 min-w-[68px] h-9 px-2.5 rounded-lg text-2xs font-bold
                                    transition-all cursor-pointer whitespace-nowrap
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                    ${active ? "bg-surface text-brand-700 dark:text-brand-300 shadow-xs border border-brand-500/30" : "text-ink-muted hover:text-ink hover:bg-surface/70 border border-transparent"}`,
            children: opt.label
          },
          String(opt.value)
        );
      })
    }
  );
}
function Stepper({ value, min, max, step = 1, onChange, format, label, disabled = false }) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  const btn = "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer text-ink-secondary hover:bg-interactive-hover hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex items-center gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70 ${disabled ? "opacity-40 pointer-events-none" : ""}`,
      role: "group",
      "aria-label": label,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: btn,
            onClick: () => onChange(clamp(value - step)),
            disabled: value <= min,
            "aria-label": `Decrease ${label}`,
            children: /* @__PURE__ */ jsx(Minus, { size: 15, strokeWidth: 2.5 })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "vq-num min-w-[64px] text-center text-xs font-bold text-ink tabular-nums select-none", children: format ? format(value) : value }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: btn,
            onClick: () => onChange(clamp(value + step)),
            disabled: value >= max,
            "aria-label": `Increase ${label}`,
            children: /* @__PURE__ */ jsx(Plus, { size: 15, strokeWidth: 2.5 })
          }
        )
      ]
    }
  );
}
function Note({ tone = "info", icon: Icon = Info, children }) {
  const tones = {
    info: "bg-sunken/60 border-line/70 text-ink-secondary",
    warn: "bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
  };
  return /* @__PURE__ */ jsxs("div", { className: `flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${tones[tone]}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 14, className: "shrink-0 mt-[1px] opacity-80" }),
    /* @__PURE__ */ jsx("p", { className: "text-2xs leading-relaxed min-w-0", children })
  ] });
}
const TABS = [
  { id: "layout", label: "Layout", icon: LayoutGrid, blurb: "Where every pane goes" },
  { id: "counter", label: "Counter", icon: MousePointerClick, blurb: "Buttons on the register" },
  { id: "display", label: "Display", icon: Monitor, blurb: "Type size and scale" },
  { id: "selling", label: "Selling", icon: Receipt, blurb: "Fields, totals, returns" },
  { id: "service", label: "Service", icon: Utensils, blurb: "Counter or table service" },
  { id: "hardware", label: "Hardware", icon: Printer, blurb: "Printer, drawer, sync" },
  { id: "keys", label: "Keys", icon: Keyboard, blurb: "The keyboard map" }
];
function RegisterSettings({
  open,
  onClose,
  initialTab = "layout",
  /* geometry */
  presets = [],
  presetId,
  composition,
  layout,
  onApplyPreset,
  onUpdateComposition,
  onResetWidths,
  /* store-wide */
  serviceMode = "counter",
  setServiceMode,
  serviceCharge = 0,
  setServiceCharge,
  onOpenFloorPlan,
  /* which terminal this register currently IS. The composer describes the
     screen in front of the operator, so a counter till is never offered the
     restaurant's controls and a restaurant is never offered Hold. */
  terminal = "counter",
  /* which rank-2 buttons sit on the register's own bar */
  surface = DEFAULT_SURFACE,
  setSurface,
  /* display */
  seniorMode,
  setSeniorMode,
  showRail,
  setShowRail,
  uiScale,
  setUiScale,
  /* selling */
  enableTax,
  setEnableTax,
  enableFulfilment,
  setEnableFulfilment,
  enableFreeQty,
  setEnableFreeQty,
  roundOff,
  setRoundOff,
  autoFillCash,
  setAutoFillCash,
  returnMode,
  setReturnMode,
  returnPolicyLabel,
  discountPresets = [],
  setDiscountPresets,
  /* hardware */
  printOnComplete,
  setPrintOnComplete,
  openDrawerOnCash,
  setOpenDrawerOnCash,
  isStationConnected,
  isOnline: isOnline2,
  pendingCount = 0,
  onOpenCashDrawer,
  onOpenParked,
  parkedCount = 0,
  onOpenRecent,
  onOpenSyncHub,
  /* meta */
  onRunSetupWizard,
  onResetAll
}) {
  const [tab, setTab] = useState(initialTab);
  const [deviceId, setDeviceId] = useState("desktop");
  const panelRef = useRef(null);
  const titleId = useId();
  const tt = useTermText();
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  useEffect(() => {
    if (!open) return void 0;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
  useEffect(() => {
    if (open && panelRef.current) {
      const t = setTimeout(() => panelRef.current?.focus?.(), 40);
      return () => clearTimeout(t);
    }
    return void 0;
  }, [open]);
  const comp = composition || { catalog: {}, split: {}, tender: "column", floor: "off" };
  const catMode = comp.catalog?.mode ?? "left";
  const catIsStrip = catMode === "top" || catMode === "bottom";
  const catIsColumn = catMode === "left" || catMode === "right";
  const catResident = catIsStrip || catIsColumn;
  const device = PREVIEW_DEVICES.find((d) => d.id === deviceId) || PREVIEW_DEVICES[3];
  const resolved = useMemo(() => {
    if (!layout) return null;
    const rows = [];
    const cat = layout.catalog;
    rows.push(["Catalog", !cat ? "Off" : cat.mode === "overlay" ? "Full-screen button" : cat.mode === "left" ? `Column, left · ${Math.round(cat.px || 0)}px` : cat.mode === "right" ? `Column, right · ${Math.round(cat.px || 0)}px` : `Strip · ${cat.rows} row${cat.rows === 1 ? "" : "s"}`]);
    rows.push(["Cart", `${Math.round(layout.cart?.px || 0)}px · ${layout.cartLines || 0} lines visible`]);
    rows.push(["Tender", layout.tender?.mode === "column" ? `Column · ${Math.round(layout.tender.px || 0)}px` : layout.tender?.mode === "bar" ? "Docked bar" : "Full-screen sheet"]);
    if (layout.floor) rows.push(["Floor plan", layout.floor.mode === "left" ? `Column · ${Math.round(layout.floor.px || 0)}px` : "Step"]);
    rows.push(["Screen", `${Math.round(layout.avail || 0)}px usable · ${layout.regime}`]);
    return rows;
  }, [layout]);
  const notes = layout?.notes || [];
  const setCat = (patch) => onUpdateComposition?.((prev) => ({ ...prev, catalog: { ...prev.catalog, ...patch } }));
  const setBtn = (id, v) => setSurface?.({ ...surface, [id]: v });
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-modal bg-ink/60 backdrop-blur-sm p-0 sm:p-4 md:p-6\n                       flex items-stretch sm:items-center justify-center vq-anim-fade",
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) onClose?.();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: panelRef,
          tabIndex: -1,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          className: "bg-app w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-[1240px]\n                           sm:rounded-2xl border-0 sm:border border-line shadow-2xl\n                           flex flex-col overflow-hidden outline-none",
          children: [
            /* @__PURE__ */ jsxs("header", { className: "shrink-0 h-[60px] px-4 sm:px-5 border-b border-line bg-surface\n                                   flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("h2", { id: titleId, className: "vq-clip text-base font-bold text-ink leading-tight", children: "Register settings" }),
                /* @__PURE__ */ jsxs("p", { className: "vq-clip text-2xs font-semibold text-ink-muted", children: [
                  "Saved on this device · ",
                  tt(TABS.find((t) => t.id === tab)?.blurb || "")
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "w-10 h-10 rounded-xl border border-line bg-surface text-ink-muted\n                                   hover:bg-interactive-hover hover:text-ink flex items-center justify-center\n                                   transition-colors shrink-0 cursor-pointer\n                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  "aria-label": "Close settings",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 flex flex-col lg:flex-row", children: [
              /* @__PURE__ */ jsx(
                "nav",
                {
                  role: "tablist",
                  "aria-label": "Settings sections",
                  className: "shrink-0 lg:w-[188px] border-b lg:border-b-0 lg:border-r border-line\n                                   bg-surface flex lg:flex-col gap-1 p-2\n                                   overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto scrollbar-none",
                  children: TABS.map((t) => {
                    const active = tab === t.id;
                    const Icon = t.icon;
                    return /* @__PURE__ */ jsxs(
                      "button",
                      {
                        role: "tab",
                        type: "button",
                        "aria-selected": active,
                        onClick: () => setTab(t.id),
                        className: `shrink-0 lg:w-full h-10 px-3 rounded-xl flex items-center gap-2
                                                text-2xs font-bold transition-colors cursor-pointer whitespace-nowrap
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                ${active ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-500/30" : "text-ink-muted hover:text-ink hover:bg-interactive-hover border border-transparent"}`,
                        children: [
                          /* @__PURE__ */ jsx(Icon, { size: 15, className: "shrink-0" }),
                          /* @__PURE__ */ jsx("span", { children: tt(t.label) })
                        ]
                      },
                      t.id
                    );
                  })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5", children: [
                tab === "layout" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Start from" }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "Six starting points, not six fixed layouts. Pick the closest one, then change anything below — you are still inside the law." }),
                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: presets.filter((p) => (p.terminal || "counter") === terminal).map((p) => {
                      const active = presetId === p.id;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => onApplyPreset?.(p.id),
                          className: `text-left p-3 rounded-xl border transition-all cursor-pointer
                                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                            ${active ? "border-brand-500/50 bg-brand-50/70 dark:bg-brand-950/30 shadow-xs" : "border-line/80 bg-surface hover:border-line-strong hover:shadow-xs"}`,
                          "aria-pressed": active,
                          children: [
                            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink", children: p.name }),
                              active && /* @__PURE__ */ jsx(Check, { size: 13, className: "text-brand-600 dark:text-brand-400 shrink-0" })
                            ] }),
                            /* @__PURE__ */ jsx("span", { className: "mt-1 block text-3xs text-ink-muted leading-snug line-clamp-2", children: p.tagline || p.for })
                          ]
                        },
                        p.id
                      );
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Panes" }),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Catalog",
                        hint: "Off is scanner-only. Left or right is a column. Top or bottom is a tile strip. Button is one full-screen tap.",
                        stacked: true,
                        children: /* @__PURE__ */ jsx(
                          Segmented,
                          {
                            label: "Catalog placement",
                            value: catMode,
                            onChange: (v) => setCat({ mode: v }),
                            options: [
                              { value: "off", label: "Off" },
                              { value: "left", label: "Left" },
                              { value: "right", label: "Right" },
                              { value: "top", label: "Top" },
                              { value: "bottom", label: "Bottom" },
                              { value: "overlay", label: "Button" }
                            ]
                          }
                        )
                      }
                    ),
                    catIsStrip && /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Strip rows",
                        hint: "Rows the height cannot pay for are given back to the cart rather than held as empty band.",
                        children: /* @__PURE__ */ jsx(
                          Stepper,
                          {
                            label: "Strip rows",
                            value: comp.catalog?.rows ?? 1,
                            min: 1,
                            max: 3,
                            onChange: (v) => setCat({ rows: v }),
                            format: (v) => `${v} row${v === 1 ? "" : "s"}`
                          }
                        )
                      }
                    ),
                    catResident && /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Tiles per row",
                        hint: "The category's real density control. Auto fills the column with as many as fit.",
                        children: /* @__PURE__ */ jsx(
                          Stepper,
                          {
                            label: "Tiles per row",
                            value: comp.catalog?.tiles ?? 0,
                            min: 0,
                            max: 8,
                            onChange: (v) => setCat({ tiles: v === 0 ? null : v }),
                            format: (v) => v === 0 ? "Auto" : String(v)
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Tender",
                        hint: "Column keeps the money detail always visible. Bar docks a total and a Pay button. Button opens the same panel full screen.",
                        stacked: true,
                        children: /* @__PURE__ */ jsx(
                          Segmented,
                          {
                            label: "Tender placement",
                            value: comp.tender,
                            onChange: (v) => onUpdateComposition?.((prev) => ({
                              ...prev,
                              tender: v,
                              /* A tender column with a zero share is a column that
                                 cannot be drawn. Give it back its default third the
                                 moment it is asked to be a column again. */
                              split: { ...prev.split, tender: v === "column" ? Math.max(0.22, prev.split?.tender || 0) : 0 }
                            })),
                            options: [
                              { value: "column", label: "Column" },
                              { value: "bar", label: "Bar" },
                              { value: "sheet", label: "Button" }
                            ]
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Payment sits on the",
                        hint: "Right by default. Left suits a counter whose customer display is on the left, or a left-handed cashier. Bottom turns the column into a full-width row — the better shape on a wide, short screen.",
                        stacked: true,
                        children: /* @__PURE__ */ jsx(
                          Segmented,
                          {
                            label: "Payment side",
                            value: comp.tenderSide || "right",
                            onChange: (v) => onUpdateComposition?.((prev) => ({ ...prev, tenderSide: v })),
                            options: [
                              { value: "right", label: "Right" },
                              { value: "left", label: "Left" },
                              { value: "bottom", label: "Bottom" }
                            ]
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Scan bar and Add item",
                        hint: "Auto puts them wherever the catalog is not. Pin them to the order list to keep a catalog column beside a scan bar, or into the catalog for a browse-led counter.",
                        stacked: true,
                        children: /* @__PURE__ */ jsx(
                          Segmented,
                          {
                            label: "Scan bar placement",
                            value: comp.scanBar || "auto",
                            onChange: (v) => onUpdateComposition?.((prev) => ({ ...prev, scanBar: v })),
                            options: [
                              { value: "auto", label: "Auto" },
                              { value: "order", label: "On the order" },
                              { value: "catalog", label: "In the catalog" }
                            ]
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Current order column",
                        hint: "A catalog-led counter with a few SKUs can drop the standing order list: every tile carries its in-cart count and the payment panel carries the totals. It stays put when there is nowhere else for the sale to show.",
                        children: /* @__PURE__ */ jsx(
                          Toggle,
                          {
                            checked: comp.showOrder !== false,
                            onChange: (v) => onUpdateComposition?.((prev) => ({ ...prev, showOrder: v })),
                            label: "Current order column"
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Catalog items",
                        hint: "Auto lets the width decide. Cards show the picture, price and stock. Rows fit about twice as many and give the name its full length. Pills fit the most by far — name and price only — which is the right shape for a menu you point at rather than search.",
                        stacked: true,
                        children: /* @__PURE__ */ jsx(
                          Segmented,
                          {
                            label: "Catalog item shape",
                            value: comp.catalogShape || "auto",
                            onChange: (v) => onUpdateComposition?.((prev) => ({ ...prev, catalogShape: v })),
                            options: [
                              { value: "auto", label: "Auto" },
                              { value: "cards", label: "Cards" },
                              { value: "rows", label: "Rows" },
                              { value: "pills", label: "Pills" }
                            ]
                          }
                        )
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Column widths" }),
                    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-500/25 bg-brand-50/50 dark:bg-brand-950/20 p-3.5 space-y-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                        /* @__PURE__ */ jsx(MoveHorizontal, { size: 15, className: "shrink-0 mt-0.5 text-brand-600 dark:text-brand-400" }),
                        /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1.5", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink leading-snug", children: "Drag the divider between two columns." }),
                          /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-secondary leading-relaxed", children: [
                            "Grab the handle on a column edge and pull. Or focus it with",
                            " ",
                            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold", children: "Tab" }),
                            " ",
                            "and use",
                            " ",
                            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold", children: "←" }),
                            " ",
                            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold", children: "→" }),
                            " ",
                            "— hold Shift for larger steps. Double-click a handle to reset that one column."
                          ] }),
                          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "A divider stops where the pane beside it would stop fitting. It never travels somewhere illegal and never snaps back." })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: onResetWidths,
                          className: "w-full h-9 rounded-lg border border-line bg-surface text-ink\n                                                   hover:bg-interactive-hover text-2xs font-bold\n                                                   flex items-center justify-center gap-2 transition-colors cursor-pointer\n                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                          children: [
                            /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
                            " Reset every width to this preset"
                          ]
                        }
                      )
                    ] })
                  ] })
                ] }),
                tab === "counter" && /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { children: "Buttons on the register" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed max-w-[60ch]", children: "What appears in the register’s top bar. Everything switched off here is still reachable — from this panel, or from its keyboard shortcut. The bar has a budget, and a button nobody presses spends it." }),
                  SURFACE_BUTTONS.map((b) => {
                    const Icon = b.icon;
                    const on = !!surface[b.id];
                    return /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "rounded-xl border border-line/80 bg-surface shadow-xs p-3.5\n                                                   flex items-start justify-between gap-3",
                        children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
                            /* @__PURE__ */ jsx("span", { className: `w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border
                                                              ${on ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-300/60" : "bg-sunken/70 text-ink-faint border-line/70"}`, children: /* @__PURE__ */ jsx(Icon, { size: 16 }) }),
                            /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
                              /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-tight", children: b.label }),
                              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed max-w-[48ch]", children: b.hint })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx(Toggle, { checked: on, onChange: (v) => setBtn(b.id, v), label: b.label })
                        ]
                      },
                      b.id
                    );
                  }),
                  /* @__PURE__ */ jsx(Note, { children: "Queued offline sales are the one exception: that button appears on its own the moment there is something to sync and hides again when there is not. A count of zero is not worth a permanent control." })
                ] }),
                tab === "display" && /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { children: "Display" }),
                  /* @__PURE__ */ jsx(
                    Field,
                    {
                      title: "Large text mode",
                      hint: "Raises every type ramp and touch target. Panes that can no longer stay legible at the larger size become buttons rather than being crushed.",
                      children: /* @__PURE__ */ jsx(Toggle, { checked: seniorMode, onChange: setSeniorMode, label: "Large text mode" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Field,
                    {
                      title: "Navigation rail",
                      hint: "Off by default. A register is the one screen where the 72px is worth more than the navigation — Leave the register is always in the top left either way.",
                      children: /* @__PURE__ */ jsx(Toggle, { checked: showRail, onChange: setShowRail, label: "Navigation rail" })
                    }
                  ),
                  typeof uiScale === "number" && /* @__PURE__ */ jsx(
                    Field,
                    {
                      title: "Interface scale",
                      hint: "Scales the whole register. Distinct from large text: this moves everything, including the spacing between things.",
                      children: /* @__PURE__ */ jsx(
                        Stepper,
                        {
                          label: "Interface scale",
                          value: Math.round(uiScale * 100),
                          min: 90,
                          max: 130,
                          step: 5,
                          onChange: (v) => setUiScale?.(v / 100),
                          format: (v) => `${v}%`
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "pt-1", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: onRunSetupWizard,
                      className: "w-full h-10 rounded-xl border border-line bg-surface text-ink\n                                               hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer\n                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                      children: "Run the setup guide again"
                    }
                  ) })
                ] }),
                tab === "selling" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Fields on the sale" }),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Tax",
                        hint: "Turns on rates, the inclusive / exclusive switch and the tax line in the breakdown.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: enableTax, onChange: setEnableTax, label: "Tax" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Fulfilment",
                        hint: "Adds the local-stock / dropship choice to the sale.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: enableFulfilment, onChange: setEnableFulfilment, label: "Fulfilment" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Free / bonus quantity",
                        hint: "Adds a free-quantity control to the line that needs it, not a column to every line.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: enableFreeQty, onChange: setEnableFreeQty, label: "Free or bonus quantity" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Totals" }),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Round off totals",
                        hint: "Rounds the payable to the nearest whole unit and shows the adjustment in the breakdown.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: roundOff, onChange: setRoundOff, label: "Round off totals" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Auto-fill exact cash",
                        hint: "Pre-fills the tendered amount with the exact total, so a card or exact-cash sale is one tap.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: autoFillCash, onChange: setAutoFillCash, label: "Auto-fill exact cash" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Discount presets",
                        hint: "The quick percentages offered on the discount field. Tap one to remove it.",
                        stacked: true,
                        children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
                          discountPresets.map((p) => /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setDiscountPresets?.(discountPresets.filter((x) => x !== p)),
                              className: "h-8 px-3 rounded-lg border border-line bg-sunken/60 text-2xs font-bold\n                                                           text-ink hover:border-danger-400 hover:text-danger-600 transition-colors\n                                                           cursor-pointer flex items-center gap-1.5\n                                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                              title: `Remove ${p}%`,
                              children: [
                                /* @__PURE__ */ jsxs("span", { className: "vq-num", children: [
                                  p,
                                  "%"
                                ] }),
                                /* @__PURE__ */ jsx(X, { size: 11, className: "opacity-50" })
                              ]
                            },
                            p
                          )),
                          [5, 10, 15, 20, 25, 50].filter((v) => !discountPresets.includes(v)).map((v) => /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setDiscountPresets?.([...discountPresets, v].sort((a, b) => a - b)),
                              className: "h-8 px-3 rounded-lg border border-dashed border-line-strong text-2xs font-bold\n                                                           text-ink-muted hover:text-brand-600 hover:border-brand-400 transition-colors\n                                                           cursor-pointer flex items-center gap-1\n                                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                              title: `Add ${v}%`,
                              children: [
                                /* @__PURE__ */ jsx(Plus, { size: 11 }),
                                " ",
                                /* @__PURE__ */ jsx("span", { className: "vq-num", children: v })
                              ]
                            },
                            `add-${v}`
                          ))
                        ] })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Returns" }),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Return mode",
                        hint: "Switches this register to processing returns and refunds. The next completed document is a credit, not a sale.",
                        badge: /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold px-2 py-0.5 rounded-md bg-sunken text-ink-secondary uppercase tracking-wide", children: returnPolicyLabel }),
                        children: /* @__PURE__ */ jsx(Toggle, { checked: returnMode, onChange: setReturnMode, label: "Return mode", tone: "danger" })
                      }
                    ),
                    /* @__PURE__ */ jsx(Note, { children: "The policy itself is a store setting, not a register one — change it in Settings → Point of sale so every till agrees." })
                  ] })
                ] }),
                tab === "service" && /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { children: "How this business serves" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed max-w-[60ch]", children: tt("This is the one switch that changes what the register IS, rather than how it looks. A counter till sells to whoever is standing there. A table service register makes the TABLE the unit of work — the floor becomes the pane the shift starts from, an order belongs to a table rather than to a queue, and Hold disappears, because a table already is a held sale.") }),
                  /* @__PURE__ */ jsx(Field, { title: tt("Service style"), hint: tt("Both keeps the counter register and adds the floor beside it, for a cafe that does takeaway and tables."), stacked: true, children: /* @__PURE__ */ jsx(
                    Segmented,
                    {
                      label: tt("Service style"),
                      value: serviceMode,
                      onChange: setServiceMode,
                      options: [
                        { value: "counter", label: "Counter" },
                        { value: "tables", label: tt("Table service") },
                        { value: "both", label: "Both" }
                      ]
                    }
                  ) }),
                  serviceMode !== "counter" && /* @__PURE__ */ jsx(
                    Field,
                    {
                      title: tt("Service charge"),
                      hint: tt("Added to every table bill as a percentage of the food after discounts. It is the house's income and it is posted as such — a tip is not, and is typed per bill instead."),
                      children: /* @__PURE__ */ jsx(
                        Stepper,
                        {
                          label: tt("Service charge percent"),
                          value: Number(serviceCharge) || 0,
                          min: 0,
                          max: 25,
                          onChange: setServiceCharge,
                          format: (v) => v ? `${v}%` : "Off"
                        }
                      )
                    }
                  ),
                  serviceMode !== "counter" && /* @__PURE__ */ jsx(
                    Field,
                    {
                      title: "Your floor",
                      hint: tt("Areas and tables. Nothing appears on the floor screen until it exists here — this is the only place tables come from."),
                      children: /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: onOpenFloorPlan,
                          className: "inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-line\n                                                   bg-surface text-ink text-sm font-bold shadow-xs\n                                                   hover:border-brand-300 hover:text-brand-700 transition-colors cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsx(LayoutGrid, { size: 15 }),
                            "Set up the floor plan"
                          ]
                        }
                      )
                    }
                  ),
                  serviceMode !== "counter" && terminal === "counter" && /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted leading-relaxed max-w-[60ch] pt-1", children: [
                    tt("You are on the counter register. The floor is at"),
                    /* @__PURE__ */ jsxs("b", { className: "text-ink", children: [
                      " ",
                      tt("Tables")
                    ] }),
                    " ",
                    tt("in the sidebar.")
                  ] })
                ] }),
                tab === "hardware" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Status" }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line/80 bg-surface p-3 shadow-xs", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          isOnline2 ? /* @__PURE__ */ jsx(Wifi, { size: 14, className: "text-emerald-600 dark:text-emerald-400 shrink-0" }) : /* @__PURE__ */ jsx(WifiOff, { size: 14, className: "text-danger-600 shrink-0" }),
                          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink", children: isOnline2 ? "Online" : "Offline" })
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "mt-1 text-3xs text-ink-muted leading-snug", children: isOnline2 ? "Sales post immediately." : "Sales are queued on this device." })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line/80 bg-surface p-3 shadow-xs", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(Printer, { size: 14, className: isStationConnected ? "text-emerald-600 dark:text-emerald-400 shrink-0" : "text-ink-faint shrink-0" }),
                          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink", children: isStationConnected ? "Station ready" : "No station" })
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "mt-1 text-3xs text-ink-muted leading-snug", children: isStationConnected ? "Printer and drawer reachable." : "Receipts print through the browser." })
                      ] })
                    ] }),
                    pendingCount > 0 && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: onOpenSyncHub,
                        className: "w-full rounded-xl border border-amber-300 dark:border-amber-900/60\n                                                   bg-amber-50 dark:bg-amber-950/25 px-3.5 py-2.5 text-left\n                                                   hover:border-amber-400 transition-colors cursor-pointer\n                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        children: [
                          /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-amber-800 dark:text-amber-300", children: [
                            /* @__PURE__ */ jsx("span", { className: "vq-num", children: pendingCount }),
                            " sale",
                            pendingCount === 1 ? "" : "s",
                            " waiting to sync"
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "block text-3xs text-amber-700/80 dark:text-amber-400/70 mt-0.5", children: "Open the sync hub to retry, recall or discard them." })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Printing & drawer" }),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Auto-print receipt",
                        hint: "Prints the customer receipt the moment a sale completes, without a second confirmation.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: printOnComplete, onChange: setPrintOnComplete, label: "Auto-print receipt", tone: "success" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Field,
                      {
                        title: "Open drawer on a cash sale",
                        hint: "Pulses the cash drawer automatically when the tender is cash.",
                        children: /* @__PURE__ */ jsx(Toggle, { checked: openDrawerOnCash, onChange: setOpenDrawerOnCash, label: "Open drawer on a cash sale", tone: "success" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsx(Eyebrow, { children: "Run now" }),
                    [
                      { icon: Unlock, label: "Open cash drawer", sub: "Sends one pulse · Ctrl + D", on: onOpenCashDrawer },
                      { icon: Pause, label: "Parked sales", sub: `${parkedCount} on hold`, on: onOpenParked },
                      { icon: History, label: "Recent invoices", sub: "View and reprint", on: onOpenRecent }
                    ].map((a) => {
                      const Icon = a.icon;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: a.on,
                          className: "w-full rounded-xl border border-line/80 bg-surface p-3\n                                                       hover:border-line-strong hover:shadow-xs transition-all cursor-pointer\n                                                       flex items-center gap-3 text-left\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                          children: [
                            /* @__PURE__ */ jsx("span", { className: "w-9 h-9 rounded-lg bg-sunken/70 border border-line/70 text-ink-secondary\n                                                             flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Icon, { size: 15 }) }),
                            /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
                              /* @__PURE__ */ jsx("span", { className: "block vq-clip text-xs font-bold text-ink", children: a.label }),
                              /* @__PURE__ */ jsx("span", { className: "block vq-clip text-3xs text-ink-muted", children: a.sub })
                            ] })
                          ]
                        },
                        a.label
                      );
                    })
                  ] })
                ] }),
                tab === "keys" && /* @__PURE__ */ jsxs("section", { className: "space-y-2.5", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { children: "Keyboard" }),
                  /* @__PURE__ */ jsx(Note, { children: "The map is scoped to the working surface and suspends itself while you are typing in a field or a sheet, so an F-key never fires from inside an input." }),
                  /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line/80 bg-surface divide-y divide-line/60 overflow-hidden", children: POS_KEYMAP.map(([k, desc]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 px-3.5 py-2", children: [
                    /* @__PURE__ */ jsx("kbd", { className: "px-2 py-1 rounded-md bg-sunken border border-line text-3xs\n                                                        font-mono font-bold text-brand-700 dark:text-brand-300 shrink-0", children: k }),
                    /* @__PURE__ */ jsx("span", { className: "vq-clip text-2xs font-semibold text-ink-secondary text-right min-w-0", children: desc })
                  ] }, k)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("aside", { className: "shrink-0 lg:w-[356px] border-t lg:border-t-0 lg:border-l border-line\n                                      bg-surface overflow-y-auto overscroll-contain p-4 space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { children: "Preview" }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-num text-3xs font-bold text-ink-muted", children: [
                    device.vw,
                    "×",
                    device.vh
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 p-1 rounded-xl bg-sunken/70 border border-line/70", children: PREVIEW_DEVICES.map((d) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setDeviceId(d.id),
                    "aria-pressed": deviceId === d.id,
                    className: `flex-1 min-w-[64px] h-8 rounded-lg text-3xs font-bold transition-all
                                                cursor-pointer whitespace-nowrap
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                ${deviceId === d.id ? "bg-surface text-brand-700 dark:text-brand-300 shadow-xs border border-brand-500/30" : "text-ink-muted hover:text-ink border border-transparent"}`,
                    children: d.label
                  },
                  d.id
                )) }),
                /* @__PURE__ */ jsx(
                  RegisterPreview,
                  {
                    comp,
                    device,
                    senior: seniorMode,
                    scale: uiScale,
                    rail: showRail
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-x-3 gap-y-1", children: [
                  ["Catalog", "bg-sky-300 dark:bg-sky-700"],
                  ["Cart", "bg-emerald-300 dark:bg-emerald-700"],
                  ["Payment", "bg-amber-300 dark:bg-amber-700"],
                  ...terminal === "table" ? [["Floor", "bg-brand-300 dark:bg-brand-700"]] : []
                ].map(([l, c]) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-3xs font-bold text-ink-muted", children: [
                  /* @__PURE__ */ jsx("span", { className: `w-2.5 h-2.5 rounded-sm ${c}` }),
                  " ",
                  l
                ] }, l)) }),
                resolved && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Eyebrow, { className: "pt-1", children: "On this screen, right now" }),
                  /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line/80 bg-sunken/40 divide-y divide-line/60 overflow-hidden", children: resolved.map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3 px-3 py-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted shrink-0", children: k }),
                    /* @__PURE__ */ jsx("span", { className: "vq-num vq-clip text-3xs font-bold text-ink text-right", children: v })
                  ] }, k)) })
                ] }),
                notes.map((n, i) => /* @__PURE__ */ jsx(Note, { tone: "warn", icon: AlertTriangle, children: n }, i))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("footer", { className: "shrink-0 border-t border-line bg-surface px-4 sm:px-5 py-3\n                                   flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onResetAll,
                  className: "h-10 px-3.5 rounded-xl border border-line bg-surface text-ink-muted\n                                   hover:text-danger-600 hover:border-danger-300 text-2xs font-bold\n                                   transition-colors cursor-pointer shrink-0\n                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  children: "Reset all"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:block flex-1 text-3xs text-ink-muted", children: "Every change here applies immediately. Nothing waits for Done." }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "ml-auto sm:ml-0 h-10 px-8 rounded-xl bg-brand-600 hover:bg-brand-700 text-white\n                                   text-xs font-bold transition-colors cursor-pointer shrink-0\n                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                  children: "Done"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
const POLL_MS = 15e3;
const TICK_MS = 3e4;
const SAVE_MS = 500;
const STATES = {
  free: { label: "Free", tone: "free" },
  seated: { label: "Seated", tone: "seated", alertAfter: 8 * 6e4 },
  ordered: { label: "Ordered", tone: "ordered" },
  in_kitchen: { label: "In kitchen", tone: "kitchen" },
  served: { label: "Served", tone: "served" },
  check_dropped: { label: "Check", tone: "check", alertAfter: 12 * 6e4 },
  cleaning: { label: "Cleaning", tone: "cleaning" },
  reserved: { label: "Reserved", tone: "reserved" }
};
function alertAge(card, now = Date.now()) {
  const spec = STATES[card?.state];
  if (!spec || !spec.alertAfter || !card.state_since) return 0;
  const age = now - new Date(card.state_since).getTime();
  return age >= spec.alertAfter ? Math.floor(age / 6e4) : 0;
}
const ORDER_TYPES = [
  { value: "dine_in", label: "Dine-in" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" }
];
function serverLineToCart(l, i) {
  const mods = Array.isArray(l.mods) ? l.mods : [];
  const delta = mods.reduce((a, m) => a + (Number(m.price_delta) || 0), 0);
  const base = Number(l.base_price != null ? l.base_price : l.price) || 0;
  return {
    /* A stable key matters more here than anywhere else in the register:
       the poll replaces this array wholesale, and a key derived from
       Date.now() would remount every row and drop the caret out of the
       note the waiter is in the middle of typing. */
    cartItemId: l.line_id || `srv-${l.id}-${i}`,
    lineId: l.line_id || null,
    id: l.id,
    name: l.name,
    price: base + delta,
    original_price: base,
    basePrice: base,
    mods,
    qty: Number(l.qty) || 1,
    freeQuantity: 0,
    discount: 0,
    notes: l.notes || "",
    sent: !!l.sent,
    course: Number(l.course) || 1,
    paidSaleId: l.paid_sale_id || null,
    /* The kitchen has already committed the stock for a fired line, and a
       waiter cannot be blocked mid-service by a stock ceiling they have no
       way to clear. Stock is enforced when the sale posts. */
    stock: Number.MAX_SAFE_INTEGER,
    unit: l.unit || "pcs",
    tax_rate: Number(l.tax_rate) || 0
  };
}
function cartLineToServer(l) {
  return {
    line_id: l.lineId || l.cartItemId,
    id: l.id,
    name: l.name,
    price: Number(l.basePrice != null ? l.basePrice : l.original_price != null ? l.original_price : l.price) || 0,
    qty: Number(l.qty) || 0,
    notes: l.notes || "",
    sent: !!l.sent,
    course: Number(l.course) || 1,
    mods: Array.isArray(l.mods) ? l.mods.map((m) => ({
      id: m.id,
      name: m.name,
      price_delta: Number(m.price_delta) || 0
    })) : []
  };
}
const signature = (lines) => JSON.stringify((lines || []).map(cartLineToServer));
function useTableService({
  enabled = false,
  storeSlug,
  initialPositions = [],
  initialTickets = [],
  initialZones = [],
  initialKitchen = 0,
  lanes = { takeaway: false, delivery: false },
  onError,
  onNotice
} = {}) {
  const [positions, setPositions] = useState(initialPositions);
  const [tickets, setTickets] = useState(initialTickets);
  const [zones, setZones] = useState(initialZones);
  const [kitchen, setKitchen] = useState(initialKitchen);
  const [zone, setZone] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);
  const inFlight = useRef(false);
  const saveTimer = useRef(null);
  const lastPushed = useRef(null);
  const r = useCallback(
    (name, params = {}) => route(name, { store_slug: storeSlug, ...params }),
    [storeSlug]
  );
  const fail = useCallback((e, fallback) => {
    const msg = e?.response?.data?.message || fallback;
    if (onError) onError(msg);
    return null;
  }, [onError]);
  const applyState = useCallback((d) => {
    if (!d) return;
    if (Array.isArray(d.positions)) setPositions(d.positions);
    if (Array.isArray(d.tickets)) setTickets(d.tickets);
    if (Array.isArray(d.zones)) setZones(d.zones);
    if (typeof d.kitchen === "number") setKitchen(d.kitchen);
  }, []);
  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return;
    try {
      const { data } = await axios.get(r("store.tables.state"));
      applyState(data);
    } catch (_) {
    }
  }, [enabled, r, applyState]);
  useEffect(() => {
    if (!enabled) return void 0;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);
  useEffect(() => {
    if (!enabled) return void 0;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [enabled]);
  const post = useCallback(async (name, body, fallbackMsg) => {
    setBusy(true);
    inFlight.current = true;
    try {
      const { data } = await axios.post(r(name), body);
      if (data?.positions) setPositions(data.positions);
      if (data?.tickets) setTickets(data.tickets);
      if (data?.position) {
        setPositions((prev) => prev.map((p) => p.id === data.position.id ? data.position : p));
      }
      if (data?.ticket) {
        setTickets((prev) => {
          const i = prev.findIndex((t) => t.id === data.ticket.id);
          if (i === -1) return [...prev, data.ticket];
          const next = prev.slice();
          next[i] = data.ticket;
          return next;
        });
      }
      return data;
    } catch (e) {
      return fail(e, fallbackMsg);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [r, fail]);
  const selected = useMemo(
    () => positions.find((p) => p.id === selectedId) || tickets.find((t) => t.id === selectedId) || null,
    [positions, tickets, selectedId]
  );
  const visible = useMemo(() => {
    if (zone === "takeaway") return tickets.filter((t) => t.order_type === "takeaway");
    if (zone === "delivery") return tickets.filter((t) => t.order_type === "delivery");
    if (zone === "all") return [...positions, ...tickets];
    return positions.filter((p) => p.zone === zone);
  }, [positions, tickets, zone]);
  const tabs = useMemo(() => {
    const out = zones.map((z) => ({ id: z, label: z, kind: "zone" }));
    if (lanes.takeaway) {
      out.push({
        id: "takeaway",
        label: "Takeaway",
        kind: "lane",
        count: tickets.filter((t) => t.order_type === "takeaway").length
      });
    }
    if (lanes.delivery) {
      out.push({
        id: "delivery",
        label: "Delivery",
        kind: "lane",
        count: tickets.filter((t) => t.order_type === "delivery").length
      });
    }
    return out;
  }, [zones, lanes.takeaway, lanes.delivery, tickets]);
  const counts = useMemo(() => {
    const now = Date.now();
    const open = positions.filter((p) => p.occupancy_id);
    const billing = [...open, ...tickets];
    return {
      open: open.length,
      free: positions.filter((p) => !p.occupancy_id && p.status === "available").length,
      tickets: tickets.length,
      covers: open.reduce((a, p) => a + (Number(p.covers) || 0), 0),
      /* Money on the floor includes the bags on the pass. It is the
         answer to "what would we lose if the power went out", and a
         takeaway order is exactly as lost as a table's. */
      due: billing.reduce((a, p) => a + (Number(p.order_total) || 0), 0),
      unsent: billing.reduce((a, p) => a + (Number(p.unsent) || 0), 0),
      alerts: billing.filter((c) => alertAge(c, now) > 0).length
    };
  }, [positions, tickets]);
  const openTable = useCallback(async (positionId, opts = {}) => {
    const data = await post("store.tables.open", {
      position_id: positionId,
      covers: opts.covers ?? 2,
      order_type: opts.orderType ?? "dine_in",
      party_id: opts.partyId ?? null
    }, "That table could not be opened.");
    if (data?.position) setSelectedId(data.position.id);
    return data?.position || null;
  }, [post]);
  const pushOrder = useCallback((occupancyId, lines, meta = {}, immediate = false) => {
    if (!occupancyId) return;
    const sig = signature(lines);
    if (!immediate && sig === lastPushed.current) return;
    lastPushed.current = sig;
    const body = {
      occupancy_id: occupancyId,
      cart: (lines || []).map(cartLineToServer),
      covers: meta.covers,
      order_type: meta.orderType,
      note: meta.note ?? "",
      party_id: meta.partyId ?? null
    };
    clearTimeout(saveTimer.current);
    if (immediate) {
      return post("store.tables.order", body, "The order could not be saved.");
    }
    saveTimer.current = setTimeout(() => {
      post("store.tables.order", body, "The order could not be saved.");
    }, SAVE_MS);
    return void 0;
  }, [post]);
  const prime = useCallback((lines) => {
    lastPushed.current = signature(lines);
  }, []);
  const flushOrder = useCallback(async (occupancyId, lines, meta) => {
    clearTimeout(saveTimer.current);
    lastPushed.current = signature(lines);
    return post("store.tables.order", {
      occupancy_id: occupancyId,
      cart: (lines || []).map(cartLineToServer),
      covers: meta?.covers,
      order_type: meta?.orderType,
      note: meta?.note ?? "",
      party_id: meta?.partyId ?? null
    }, "The order could not be saved.");
  }, [post]);
  const sendToKitchen = useCallback(async (occupancyId) => {
    const data = await post(
      "store.tables.send",
      { occupancy_id: occupancyId },
      "Nothing was sent to the kitchen."
    );
    if (data && onNotice) {
      onNotice(`${data.sent} item${data.sent === 1 ? "" : "s"} fired to the kitchen`);
    }
    return data;
  }, [post, onNotice]);
  const transfer = useCallback((occupancyId, toPosition) => post(
    "store.tables.transfer",
    { occupancy_id: occupancyId, to_position: toPosition },
    "That table could not be moved."
  ), [post]);
  const merge = useCallback((fromOccupancy, intoOccupancy) => post(
    "store.tables.merge",
    { from_occupancy: fromOccupancy, into_occupancy: intoOccupancy },
    "Those tables could not be merged."
  ), [post]);
  const closeTable = useCallback(async (occupancyId, force = false) => {
    const data = await post(
      "store.tables.close",
      { occupancy_id: occupancyId, force },
      "That table could not be closed."
    );
    if (data) setSelectedId(null);
    return data;
  }, [post]);
  const openLane = useCallback(async (orderType, meta = {}) => {
    const data = await post("store.tables.lane.open", {
      order_type: orderType,
      customer_name: meta.customerName ?? null,
      phone: meta.phone ?? null,
      address: meta.address ?? null
    }, "That ticket could not be opened.");
    if (data?.ticket) setSelectedId(data.ticket.id);
    return data?.ticket || null;
  }, [post]);
  const dropCheck = useCallback((occupancyId, clear = false) => post(
    "store.tables.check",
    { occupancy_id: occupancyId, clear },
    "That could not be recorded."
  ), [post]);
  const setStatus = useCallback((positionId, status) => post(
    "store.tables.status",
    { position_id: positionId, status },
    "That table’s status could not be changed."
  ), [post]);
  const split = useCallback((occupancyId, spec) => post(
    "store.tables.split",
    { occupancy_id: occupancyId, ...spec },
    "That bill could not be split."
  ), [post]);
  const cancelSplit = useCallback((occupancyId) => post(
    "store.tables.split.cancel",
    { occupancy_id: occupancyId },
    "The split could not be cancelled."
  ), [post]);
  const markSettled = useCallback(async (occupancyId, saleId, partId = null) => {
    try {
      const { data } = await axios.post(r("store.tables.settled"), {
        occupancy_id: occupancyId,
        sale_id: saleId ?? null,
        part_id: partId
      });
      await refresh();
      return data;
    } catch (e) {
      if (onError) onError("Paid, but the table did not clear. Free it from the floor.");
      return null;
    }
  }, [r, refresh, onError]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  return {
    enabled,
    positions,
    tickets,
    visible,
    zones,
    tabs,
    zone,
    setZone,
    kitchen,
    counts,
    lanes,
    selected,
    selectedId,
    select: setSelectedId,
    busy,
    refresh,
    openTable,
    openLane,
    dropCheck,
    prime,
    pushOrder,
    flushOrder,
    sendToKitchen,
    transfer,
    merge,
    closeTable,
    setStatus,
    split,
    cancelSplit,
    markSettled
  };
}
function elapsed(iso) {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
function toneOf(card) {
  return STATES[card?.state]?.tone || (card?.occupancy_id ? "ordered" : "free");
}
const LANE_ICON = { takeaway: ShoppingBag, delivery: Bike };
function StateChip({ card, alert: alert2 }) {
  const spec = STATES[card.state] || STATES.free;
  return /* @__PURE__ */ jsxs("span", { className: "vqt-state", "data-tone": spec.tone, "data-alert": alert2 ? "1" : "0", children: [
    alert2 ? /* @__PURE__ */ jsx(AlertTriangle, { size: 10, "aria-hidden": "true" }) : null,
    spec.label
  ] });
}
function Server({ server }) {
  if (!server) return null;
  return /* @__PURE__ */ jsx("span", { className: "vqt-server", title: `Opened by ${server.name}`, "aria-label": `Server ${server.name}`, children: server.initials });
}
function TableCard({ p, selected, onPick, money, variant, now }) {
  const alert2 = alertAge(p, now);
  const due = Number(p.order_total) || 0;
  const unsent = Number(p.unsent) || 0;
  const isList = variant === "list";
  const open = !!p.occupancy_id;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => onPick(p),
      className: "vqt-table",
      "data-tone": toneOf(p),
      "data-selected": selected ? "1" : "0",
      "data-variant": variant,
      "data-alert": alert2 ? "1" : "0",
      "aria-pressed": selected,
      "aria-label": `${p.label || p.code}, ${(STATES[p.state] || {}).label || ""}${due ? `, ${money(due)} due` : ""}${alert2 ? `, waiting ${alert2} minutes` : ""}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: "vqt-table-code", children: p.code }),
        /* @__PURE__ */ jsxs("span", { className: "vqt-table-mid", children: [
          /* @__PURE__ */ jsx("span", { className: "vqt-table-name vq-clip", children: p.label || p.code }),
          /* @__PURE__ */ jsx("span", { className: "vqt-table-sub vq-clip", children: open ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Users, { size: 11, "aria-hidden": "true" }),
            p.covers || 0,
            /* @__PURE__ */ jsx("span", { className: "vqt-dot", "aria-hidden": "true", children: "·" }),
            /* @__PURE__ */ jsx(Clock, { size: 11, "aria-hidden": "true" }),
            elapsed(p.opened_at)
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Users, { size: 11, "aria-hidden": "true" }),
            `seats ${p.capacity || 0}`
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vqt-table-end", children: [
          /* @__PURE__ */ jsx(StateChip, { card: p, alert: alert2 }),
          open && due > 0 && /* @__PURE__ */ jsx("span", { className: "vq-num vqt-table-due", title: money(due), children: money(due) }),
          open && unsent > 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-table-unsent", title: `${unsent} not yet sent to the kitchen`, children: [
            /* @__PURE__ */ jsx(CircleDot, { size: 10, "aria-hidden": "true" }),
            unsent
          ] }),
          !isList && /* @__PURE__ */ jsx(Server, { server: p.server })
        ] }),
        alert2 > 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-alert-age vq-num", "aria-hidden": "true", children: [
          alert2,
          "m"
        ] })
      ]
    }
  );
}
function TicketCard({ t, selected, onPick, money, variant, now }) {
  const alert2 = alertAge(t, now);
  const due = Number(t.order_total) || 0;
  const unsent = Number(t.unsent) || 0;
  const Icon = LANE_ICON[t.order_type] || ShoppingBag;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => onPick(t),
      className: "vqt-table vqt-ticket",
      "data-tone": toneOf(t),
      "data-selected": selected ? "1" : "0",
      "data-variant": variant,
      "data-alert": alert2 ? "1" : "0",
      "aria-pressed": selected,
      "aria-label": `${t.order_type} ${t.code}${due ? `, ${money(due)} due` : ""}`,
      children: [
        /* @__PURE__ */ jsxs("span", { className: "vqt-table-code vqt-ticket-code", children: [
          /* @__PURE__ */ jsx(Icon, { size: 12, "aria-hidden": "true" }),
          t.code
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vqt-table-mid", children: [
          /* @__PURE__ */ jsx("span", { className: "vqt-table-name vq-clip", children: t.label || t.code }),
          /* @__PURE__ */ jsxs("span", { className: "vqt-table-sub vq-clip", children: [
            /* @__PURE__ */ jsx(Clock, { size: 11, "aria-hidden": "true" }),
            elapsed(t.opened_at),
            t.phone && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "vqt-dot", "aria-hidden": "true", children: "·" }),
              /* @__PURE__ */ jsx(Phone, { size: 11, "aria-hidden": "true" }),
              t.phone
            ] })
          ] }),
          t.order_type === "delivery" && t.address && /* @__PURE__ */ jsx("span", { className: "vqt-ticket-addr vq-clip", children: t.address })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vqt-table-end", children: [
          /* @__PURE__ */ jsx(StateChip, { card: t, alert: alert2 }),
          due > 0 && /* @__PURE__ */ jsx("span", { className: "vq-num vqt-table-due", title: money(due), children: money(due) }),
          unsent > 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-table-unsent", title: `${unsent} not yet sent to the kitchen`, children: [
            /* @__PURE__ */ jsx(CircleDot, { size: 10, "aria-hidden": "true" }),
            unsent
          ] }),
          variant !== "list" && /* @__PURE__ */ jsx(Server, { server: t.server })
        ] }),
        alert2 > 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-alert-age vq-num", "aria-hidden": "true", children: [
          alert2,
          "m"
        ] })
      ]
    }
  );
}
function FloorPane({
  positions = [],
  tabs = [],
  zone = "all",
  setZone,
  counts,
  selectedId,
  onPick,
  onNewTicket,
  onSetup,
  money,
  /* 'map' | 'list' — the engine's decision, never this component's */
  variant = "map",
  embedded = false,
  /* Passed in rather than read here so every card in one paint agrees on
     what time it is, and so a parent tick re-sorts the whole floor at once. */
  now = Date.now()
}) {
  const tt = useTermText();
  const ordered = useMemo(() => {
    const rank = (c) => {
      if (alertAge(c, now)) return 0;
      if (c.occupancy_id) return 1;
      if (c.state === "cleaning") return 2;
      if (c.state === "reserved") return 3;
      return 4;
    };
    return [...positions].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (ra === 0) return alertAge(b, now) - alertAge(a, now);
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.code).localeCompare(String(b.code), void 0, { numeric: true });
    });
  }, [positions, now]);
  const laneTab = tabs.find((t) => t.id === zone && t.kind === "lane");
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: embedded ? "vqt-floor vqt-floor-embedded" : "vq-pane vqt-floor bg-surface border border-line/80 shadow-md",
      "data-pane": "floor",
      children: [
        !embedded && /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
          /* @__PURE__ */ jsx(Users, { size: 15, className: "text-brand-500 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { children: "Floor" }),
          counts?.alerts > 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-h-alert", title: tt("Tables waiting on someone"), children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 11, "aria-hidden": "true" }),
            counts.alerts
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: counts ? `${counts.open} open · ${counts.free} free` : "" })
        ] }),
        tabs.length > 1 && /* @__PURE__ */ jsxs("div", { className: "vqt-zones vq-pane-fixed", role: "tablist", "aria-label": "Areas", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": zone === "all",
              className: "vqt-zone",
              "data-on": zone === "all" ? "1" : "0",
              onClick: () => setZone("all"),
              children: "All"
            }
          ),
          tabs.map((t) => {
            const Icon = t.kind === "lane" ? LANE_ICON[t.id] || ShoppingBag : null;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": zone === t.id,
                className: "vqt-zone",
                "data-on": zone === t.id ? "1" : "0",
                "data-kind": t.kind,
                onClick: () => setZone(t.id),
                children: [
                  Icon && /* @__PURE__ */ jsx(Icon, { size: 12, "aria-hidden": "true" }),
                  t.label,
                  t.kind === "lane" && t.count > 0 && /* @__PURE__ */ jsx("span", { className: "vqt-zone-n vq-num", children: t.count })
                ]
              },
              t.id
            );
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-pane-body vqt-floor-body", "data-variant": variant, children: [
          laneTab && /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-new-ticket", onClick: () => onNewTicket?.(zone), children: [
            /* @__PURE__ */ jsx(Plus, { size: 15, "aria-hidden": "true" }),
            "New ",
            laneTab.label.toLowerCase(),
            " ticket"
          ] }),
          ordered.map((c) => c.kind === "ticket" ? /* @__PURE__ */ jsx(
            TicketCard,
            {
              t: c,
              variant,
              now,
              selected: c.id === selectedId,
              onPick,
              money
            },
            c.id
          ) : /* @__PURE__ */ jsx(
            TableCard,
            {
              p: c,
              variant,
              now,
              selected: c.id === selectedId,
              onPick,
              money
            },
            c.id
          )),
          ordered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "vqt-floor-empty", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-sunken border border-line flex items-center justify-center text-ink-muted mb-3", children: /* @__PURE__ */ jsx(Plus, { size: 26, strokeWidth: 1.75 }) }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: laneTab ? `No ${laneTab.label.toLowerCase()} tickets open` : tt("No tables in this area") }),
            laneTab ? /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Start one above." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 mb-3", children: tt("Tables come from the floor plan. Build it once and this fills in.") }),
              /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-new-ticket", onClick: onSetup, children: [
                /* @__PURE__ */ jsx(Plus, { size: 15, "aria-hidden": "true" }),
                "Set up the floor plan"
              ] })
            ] })
          ] })
        ] }),
        counts && /* The floor's own footing. Covers and money owed are what a
        manager walking past actually wants off this screen, and
        they are read-outs -- so they are typeset, not buttoned. */
        /* @__PURE__ */ jsxs("footer", { className: "vqt-floor-foot", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: counts.covers }),
            " covers"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vqt-foot-sep", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: money(counts.due) }),
            " due"
          ] }),
          counts.unsent > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-foot-sep", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxs("span", { className: "vqt-foot-warn", children: [
              /* @__PURE__ */ jsx("b", { className: "vq-num", children: counts.unsent }),
              " unsent"
            ] })
          ] })
        ] })
      ]
    }
  );
}
const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };
const TYPE_LABEL = { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" };
function SeatDialog({ position, onCancel, onConfirm, busy }) {
  const tt = useTermText();
  const [covers, setCovers] = useState(Math.max(1, Number(position?.capacity) || 2));
  const [orderType, setOrderType] = useState("dine_in");
  if (!position) return null;
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onCancel, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": `Open ${position.label || position.code}`,
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: [
            "Open ",
            position.label || position.code
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "vqt-icon-btn", "aria-label": "Cancel", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqt-modal-b", children: [
          /* @__PURE__ */ jsxs("label", { className: "vqt-field", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: "Covers" }),
            /* @__PURE__ */ jsxs("span", { className: "vqt-stepper", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCovers((c) => Math.max(1, c - 1)), "aria-label": "One fewer cover", children: /* @__PURE__ */ jsx(Minus, { size: 16 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "vq-num",
                  value: covers,
                  min: 1,
                  max: 99,
                  onChange: (e) => setCovers(Math.max(1, Math.min(99, Number(e.target.value) || 1))),
                  "aria-label": "Covers"
                }
              ),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCovers((c) => Math.min(99, c + 1)), "aria-label": "One more cover", children: /* @__PURE__ */ jsx(Plus, { size: 16 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vqt-field vqt-field-stacked", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: tt("Order type") }),
            /* @__PURE__ */ jsx("div", { className: "vqt-seg", role: "radiogroup", "aria-label": tt("Order type"), children: ORDER_TYPES.map((t) => {
              const Icon = TYPE_ICON[t.value];
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": orderType === t.value,
                  "data-on": orderType === t.value ? "1" : "0",
                  onClick: () => setOrderType(t.value),
                  children: [
                    /* @__PURE__ */ jsx(Icon, { size: 14, "aria-hidden": "true" }),
                    t.label
                  ]
                },
                t.value
              );
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "vqt-modal-f", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: onCancel, children: "Cancel" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "vqt-btn vqt-btn-go",
              disabled: busy,
              onClick: () => onConfirm({ covers, orderType }),
              children: [
                /* @__PURE__ */ jsx(Check, { size: 16 }),
                tt("Open table")
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
function NewTicketDialog({ orderType, onCancel, onConfirm, busy }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const isDelivery = orderType === "delivery";
  const Icon = isDelivery ? Bike : ShoppingBag;
  const submit = () => onConfirm({
    customerName: customerName.trim() || null,
    phone: phone.trim() || null,
    address: address.trim() || null
  });
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onCancel, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": `New ${isDelivery ? "delivery" : "takeaway"} ticket`,
      onMouseDown: (e) => e.stopPropagation(),
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      },
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsx(Icon, { size: 16, className: "text-brand-600", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("h2", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: [
            "New ",
            isDelivery ? "delivery" : "takeaway"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "vqt-icon-btn", "aria-label": "Cancel", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vqt-modal-note", children: "All optional. The ticket gets a number either way — a name just makes it easier to call out." }),
        /* @__PURE__ */ jsxs("div", { className: "vqt-modal-b", children: [
          /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: "Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "vqt-input",
                value: customerName,
                onChange: (e) => setCustomerName(e.target.value),
                placeholder: "Who is collecting",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: "Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "vqt-input vq-num",
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                placeholder: "Optional",
                inputMode: "tel"
              }
            )
          ] }),
          isDelivery && /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: "Address" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "vqt-input vqt-textarea",
                value: address,
                onChange: (e) => setAddress(e.target.value),
                placeholder: "Where it is going",
                rows: 2
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "vqt-modal-f", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: onCancel, children: "Cancel" }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-btn vqt-btn-go", disabled: busy, onClick: submit, children: [
            /* @__PURE__ */ jsx(Check, { size: 16 }),
            "Open ticket"
          ] })
        ] })
      ]
    }
  ) });
}
function MoveSheet({ from, positions, onCancel, onTransfer, onMerge, busy }) {
  const tt = useTermText();
  if (!from) return null;
  const targets = positions.filter((p) => p.id !== from.id && p.status !== "cleaning");
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onCancel, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal vqt-modal-wide bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": `Move ${from.label || from.code}`,
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: [
            "Move ",
            from.label || from.code
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "vqt-icon-btn", "aria-label": "Cancel", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vqt-modal-note", children: tt("Pick where this order goes. An empty table moves the party across; an occupied one joins the two bills into one.") }),
        /* @__PURE__ */ jsxs("div", { className: "vqt-modal-b vqt-move-grid", children: [
          targets.map((p) => {
            const occupied = !!p.occupancy_id;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "vqt-move-target",
                "data-occupied": occupied ? "1" : "0",
                disabled: busy,
                onClick: () => occupied ? onMerge(p) : onTransfer(p),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "vqt-move-code", children: p.code }),
                  /* @__PURE__ */ jsx("span", { className: "vqt-move-verb", children: occupied ? "Merge into" : "Move here" }),
                  /* @__PURE__ */ jsx("span", { className: "vqt-move-sub vq-clip", children: occupied ? `${p.covers || 0} covers` : `seats ${p.capacity || 0}` })
                ]
              },
              p.id
            );
          }),
          targets.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted p-4", children: tt("There is nowhere else to put this order.") })
        ] })
      ]
    }
  ) });
}
function TableBar({
  table,
  covers,
  orderType,
  unsent,
  onBack,
  onCovers,
  onOrderType,
  onFire,
  onBill,
  onSplit,
  onMove,
  onClose,
  checkDropped,
  busy,
  compact = false,
  elapsedLabel
}) {
  const tt = useTermText();
  if (!table) return null;
  const Icon = TYPE_ICON[orderType] || Utensils;
  return /* @__PURE__ */ jsxs("div", { className: "vqt-strip", "data-compact": compact ? "1" : "0", children: [
    /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-back", onClick: onBack, title: "Back to the floor", children: [
      /* @__PURE__ */ jsx(ChevronLeft, { size: 16, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { className: "vqt-back-code", children: table.code })
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "vqt-strip-read", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqt-chip", title: "Covers", children: [
        /* @__PURE__ */ jsx(Users, { size: 12, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onCovers(Math.max(1, covers - 1)), "aria-label": "One fewer cover", children: /* @__PURE__ */ jsx(Minus, { size: 11 }) }),
        /* @__PURE__ */ jsx("b", { className: "vq-num", children: covers }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onCovers(Math.min(99, covers + 1)), "aria-label": "One more cover", children: /* @__PURE__ */ jsx(Plus, { size: 11 }) })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqt-chip vqt-chip-btn",
          onClick: () => {
            const i = ORDER_TYPES.findIndex((t) => t.value === orderType);
            onOrderType(ORDER_TYPES[(i + 1) % ORDER_TYPES.length].value);
          },
          title: tt("Change the order type"),
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 12, "aria-hidden": "true" }),
            TYPE_LABEL[orderType] || "Dine-in"
          ]
        }
      ),
      elapsedLabel && /* @__PURE__ */ jsxs("span", { className: "vqt-chip vqt-chip-quiet", title: "Seated", children: [
        /* @__PURE__ */ jsx(Clock, { size: 12, "aria-hidden": "true" }),
        elapsedLabel
      ] })
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "vqt-strip-acts", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqt-act",
          "data-primary": unsent > 0 ? "1" : "0",
          onClick: onFire,
          disabled: busy || unsent === 0,
          title: unsent ? `Send ${unsent} new item${unsent === 1 ? "" : "s"} to the kitchen` : "Everything has been sent",
          children: [
            /* @__PURE__ */ jsx(Send, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { className: "vqt-act-l", children: "Fire" }),
            unsent > 0 && /* @__PURE__ */ jsx("span", { className: "vqt-act-n vq-num", children: unsent })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vqt-act",
          "data-on": checkDropped ? "1" : "0",
          onClick: onBill,
          disabled: busy,
          title: checkDropped ? "Bill already dropped — tap to undo" : "Print the bill and start the pay clock",
          children: [
            /* @__PURE__ */ jsx(ReceiptText, { size: 14, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { className: "vqt-act-l", children: "Bill" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-act", onClick: onSplit, disabled: busy, title: "Split the bill", children: [
        /* @__PURE__ */ jsx(Split, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { className: "vqt-act-l", children: "Split" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-act", onClick: onMove, disabled: busy, title: "Move or merge this table", children: [
        /* @__PURE__ */ jsx(ArrowLeftRight, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { className: "vqt-act-l", children: "Move" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-act vqt-act-danger", onClick: onClose, disabled: busy, title: "Close this table", children: [
        /* @__PURE__ */ jsx(X, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { className: "vqt-act-l", children: "Close" })
      ] })
    ] })
  ] });
}
const MODES = [
  { id: "lines", label: "By item", icon: ListChecks, hint: "Pick the lines this person is paying for." },
  { id: "covers", label: "Evenly", icon: Users, hint: "Divide what is left into equal shares." },
  { id: "amount", label: "By amount", icon: Hash, hint: "Take a fixed amount off the bill now." }
];
function SplitSheet({ open, lines = [], remaining = 0, covers = 2, money, onCancel, onConfirm, busy }) {
  const [mode, setMode] = useState("lines");
  const [picked, setPicked] = useState(() => /* @__PURE__ */ new Set());
  const [parts, setParts] = useState(Math.max(2, Number(covers) || 2));
  const [amount, setAmount] = useState("");
  const payable = useMemo(() => lines.filter((l) => !l.paidSaleId), [lines]);
  const pickedTotal = useMemo(
    () => payable.reduce((a, l) => a + (picked.has(l.cartItemId) ? (Number(l.price) || 0) * (Number(l.qty) || 0) : 0), 0),
    [payable, picked]
  );
  const share = parts > 0 ? remaining / parts : 0;
  if (!open) return null;
  const toggle = (id) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const value = mode === "lines" ? pickedTotal : mode === "covers" ? share : Number(amount) || 0;
  const legal = mode === "lines" ? picked.size > 0 : mode === "covers" ? parts >= 2 && remaining > 0 : (Number(amount) || 0) > 0 && (Number(amount) || 0) <= remaining + 1e-3;
  const confirm = () => {
    if (!legal) return;
    if (mode === "lines") {
      onConfirm({ mode: "lines", line_ids: payable.filter((l) => picked.has(l.cartItemId)).map((l) => l.lineId || l.cartItemId) });
    } else if (mode === "covers") {
      onConfirm({ mode: "covers", parts });
    } else {
      onConfirm({ mode: "amount", amount: Number(amount) });
    }
  };
  const active = MODES.find((m) => m.id === mode);
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onCancel, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal vqt-modal-wide bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Split the bill",
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsx(Split, { size: 16, className: "text-brand-600", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: "Split the bill" }),
          /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-xs font-bold text-ink-muted", children: [
            money(remaining),
            " left"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "vqt-icon-btn", "aria-label": "Cancel", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vqt-seg vqt-seg-wide", role: "tablist", "aria-label": "How to split", children: MODES.map((m) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": mode === m.id,
            "data-on": mode === m.id ? "1" : "0",
            onClick: () => setMode(m.id),
            children: [
              /* @__PURE__ */ jsx(m.icon, { size: 14, "aria-hidden": "true" }),
              m.label
            ]
          },
          m.id
        )) }),
        /* @__PURE__ */ jsx("p", { className: "vqt-modal-note", children: active?.hint }),
        /* @__PURE__ */ jsxs("div", { className: "vqt-modal-b vqt-split-b", children: [
          mode === "lines" && /* @__PURE__ */ jsxs("ul", { className: "vqt-split-lines", children: [
            payable.map((l) => {
              const on = picked.has(l.cartItemId);
              return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vqt-split-line",
                  "data-on": on ? "1" : "0",
                  "aria-pressed": on,
                  onClick: () => toggle(l.cartItemId),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "vqt-split-check", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxs("span", { className: "vqt-split-name vq-clip", children: [
                      l.name,
                      (l.qty || 1) > 1 && /* @__PURE__ */ jsxs("b", { className: "vq-num", children: [
                        " ×",
                        l.qty
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-num vqt-split-amt", children: money((Number(l.price) || 0) * (Number(l.qty) || 0)) })
                  ]
                }
              ) }, l.cartItemId);
            }),
            payable.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-sm text-ink-muted p-4", children: "Every line on this table has been paid." })
          ] }),
          mode === "covers" && /* @__PURE__ */ jsxs("div", { className: "vqt-split-even", children: [
            /* @__PURE__ */ jsx("div", { className: "vqt-seg", role: "radiogroup", "aria-label": "Number of ways", children: [2, 3, 4, 5, 6, 8].map((n) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                role: "radio",
                "aria-checked": parts === n,
                "data-on": parts === n ? "1" : "0",
                onClick: () => setParts(n),
                className: "vq-num",
                children: n
              },
              n
            )) }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-3", children: [
              parts,
              " ways · ",
              /* @__PURE__ */ jsx("b", { className: "vq-num text-ink", children: money(share) }),
              " each. This takes one share now and leaves the rest on the table."
            ] })
          ] }),
          mode === "amount" && /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
            /* @__PURE__ */ jsx("span", { className: "vqt-field-l", children: "Amount to take now" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "vqt-input vq-num",
                value: amount,
                min: 0,
                max: remaining,
                step: "0.01",
                placeholder: "0.00",
                onChange: (e) => setAmount(e.target.value),
                autoFocus: true
              }
            ),
            (Number(amount) || 0) > remaining && /* @__PURE__ */ jsxs("span", { className: "vqt-field-err", children: [
              "That is more than the ",
              money(remaining),
              " still owed."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "vqt-modal-f", children: [
          /* @__PURE__ */ jsxs("span", { className: "vqt-split-total", children: [
            "This share ",
            /* @__PURE__ */ jsx("b", { className: "vq-num", children: money(value) })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: onCancel, children: "Cancel" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "vqt-btn vqt-btn-go",
              disabled: !legal || busy,
              onClick: confirm,
              children: "Take this share"
            }
          )
        ] })
      ]
    }
  ) });
}
function ModifierSheet({ open, product, groups = [], loading, money, onCancel, onConfirm }) {
  const [chosen, setChosen] = useState({});
  useEffect(() => {
    if (!open) return;
    const seed = {};
    groups.forEach((g) => {
      seed[g.id] = (g.modifiers || []).filter((m) => m.is_default).map((m) => m.id);
    });
    setChosen(seed);
  }, [open, groups]);
  const selected = useMemo(() => {
    const out = [];
    groups.forEach((g) => {
      (g.modifiers || []).forEach((m) => {
        if ((chosen[g.id] || []).includes(m.id)) {
          out.push({ id: m.id, name: m.name, price_delta: Number(m.price_delta) || 0 });
        }
      });
    });
    return out;
  }, [groups, chosen]);
  const delta = selected.reduce((a, m) => a + m.price_delta, 0);
  const unmet = groups.filter((g) => {
    const n = (chosen[g.id] || []).length;
    return g.required && n === 0 || n < (g.min_select || 0);
  });
  if (!open) return null;
  const pick = (g, m) => setChosen((prev) => {
    const cur = prev[g.id] || [];
    const max = g.max_select || 1;
    if (cur.includes(m.id)) return { ...prev, [g.id]: cur.filter((x) => x !== m.id) };
    if (max === 1) return { ...prev, [g.id]: [m.id] };
    if (cur.length >= max) return prev;
    return { ...prev, [g.id]: [...cur, m.id] };
  });
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onCancel, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal vqt-modal-wide bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": `Options for ${product?.name || "this item"}`,
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink vq-clip", style: { fontSize: "var(--vq-t-lg)" }, children: product?.name || "Options" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "vqt-icon-btn", "aria-label": "Cancel", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vqt-modal-b vqt-mod-b", children: [
          loading && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted p-4", children: [
            /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
            " Loading options…"
          ] }),
          !loading && groups.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted p-4", children: "This item has no options set up." }),
          groups.map((g) => {
            const cur = chosen[g.id] || [];
            const many = (g.max_select || 1) > 1;
            return /* @__PURE__ */ jsxs("section", { className: "vqt-mod-group", children: [
              /* @__PURE__ */ jsxs("h3", { className: "vqt-mod-h", children: [
                g.name,
                /* @__PURE__ */ jsxs("span", { className: "vqt-mod-rule", children: [
                  g.required ? "required" : "optional",
                  many ? ` · up to ${g.max_select}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vqt-mod-opts", children: (g.modifiers || []).map((m) => {
                const on = cur.includes(m.id);
                const d = Number(m.price_delta) || 0;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "vqt-mod-opt",
                    "data-on": on ? "1" : "0",
                    role: many ? "checkbox" : "radio",
                    "aria-checked": on,
                    onClick: () => pick(g, m),
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-clip", children: m.name }),
                      d !== 0 && /* @__PURE__ */ jsxs("span", { className: "vq-num vqt-mod-delta", children: [
                        d > 0 ? "+" : "−",
                        money(Math.abs(d))
                      ] })
                    ]
                  },
                  m.id
                );
              }) })
            ] }, g.id);
          })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "vqt-modal-f", children: [
          delta !== 0 && /* @__PURE__ */ jsxs("span", { className: "vqt-split-total", children: [
            "Options ",
            /* @__PURE__ */ jsxs("b", { className: "vq-num", children: [
              delta > 0 ? "+" : "−",
              money(Math.abs(delta))
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: onCancel, children: "Cancel" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "vqt-btn vqt-btn-go",
              disabled: unmet.length > 0,
              title: unmet.length ? `Choose ${unmet[0].name} first` : void 0,
              onClick: () => onConfirm(selected),
              children: [
                /* @__PURE__ */ jsx(Check, { size: 16 }),
                unmet.length ? `Choose ${unmet[0].name}` : "Add to order"
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
const POSInterface = ({
  settings,
  recalledSale,
  bankAccounts = [],
  warehouses = [],
  occupancy = null,
  /* WHICH TERMINAL THIS IS. Layout Law §10 defines six; five of them are
     shapes of a counter till and the sixth, Table, is a different unit of
     work -- "the unit of work is the table, not the sale". Same component,
     same cart, same tender, same offline queue; the terminal decides which
     panes exist and which controls make sense. */
  terminal = "counter",
  positions: initialPositions = [],
  tickets: initialTickets = [],
  zones: initialZones = [],
  kitchen: initialKitchen = 0
}) => {
  const tableMode = terminal === "table";
  const { auth, store, modules = [] } = usePage().props;
  const { t } = useTerms();
  const tt = useTermText();
  const modulesEnabled = new Set(Array.isArray(modules) ? modules : []);
  const userRole = auth.user?.role;
  const userPerms = auth.user?.permissions || [];
  const hasDiscountPerm = userRole === "owner" || userRole === "admin" || userRole === "manager" || userPerms.some((p) => p === "pos.discounts" || p.startsWith("pos.discounts."));
  const hasPriceOverridePerm = userRole === "owner" || userRole === "admin" || userRole === "manager" || userPerms.some((p) => p === "pos.price_override" || p.startsWith("pos.price_override."));
  const posReturnMode = settings?.pos_return_mode || "reference";
  settings?.pos_return_window ? parseInt(settings.pos_return_window) : null;
  settings?.pos_return_window_behavior || "warn";
  const {
    posSessions,
    currentPosId,
    setCurrentPosId,
    addPosSession,
    updatePosSession,
    removePosSession
  } = useWorkspace();
  const [toasts, setToasts] = useState([]);
  const { isConnected: isStationConnected, printers: stationPrinters = [] } = useAMDStation();
  const printerCount = Array.isArray(stationPrinters) ? stationPrinters.length : 0;
  const printerReady = isStationConnected && printerCount > 0;
  const printerState = !isStationConnected ? "no-station" : printerCount === 0 ? "no-printer" : "ready";
  const [alertState, setAlertState] = useState({ show: false, title: "", message: "", type: "info" });
  const [confirmState, setConfirmState] = useState({ show: false, title: "", message: "", onConfirm: () => {
  } });
  const [inputState, setInputState] = useState({ show: false, title: "", placeholder: "", onSubmit: () => {
  } });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("layout");
  const openSettings = (tab = "layout") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };
  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    try {
      const done = localStorage.getItem("pos_wizard_completed");
      return !done;
    } catch (_) {
      return false;
    }
  });
  const [lastClearedCart, setLastClearedCart] = useState(null);
  const [posAutoPrint, setPosAutoPrint] = useState(() => {
    return settings?.pos_auto_print === "1" || settings?.pos_auto_print === true || localStorage.getItem("pos_auto_print") === "true";
  });
  const [discountPresets, setDiscountPresets] = useState(() => {
    try {
      const stored = localStorage.getItem("pos_discount_presets");
      return stored ? JSON.parse(stored) : [5, 10, 15, 20];
    } catch (e) {
      return [5, 10, 15, 20];
    }
  });
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const showAlert = (title, message, type = "error") => setAlertState({ show: true, title, message, type });
  const showConfirm = (title, message, onConfirm, isDangerous = false) => setConfirmState({ show: true, title, message, onConfirm, isDangerous });
  const showInput = (title, placeholder, onSubmit) => setInputState({ show: true, title, placeholder, onSubmit });
  const handleOpenCashDrawer = () => {
    try {
      if (window.AMDStation && typeof window.AMDStation.openDrawer === "function") {
        window.AMDStation.openDrawer();
      }
      addToast("Cash drawer signal pulse sent", "success");
    } catch (e) {
      addToast("Cash drawer trigger failed: " + e.message, "error");
    }
  };
  const handleClearCartWithUndo = () => {
    if (!activeSale.cart || activeSale.cart.length === 0) return;
    const currentCart = [...activeSale.cart];
    updateActiveSale({ cart: [], cashReceived: "" });
    setLastClearedCart({ cart: currentCart, timestamp: Date.now() });
    addToast("Cart cleared. Undo available for 10 seconds.", "info");
    setTimeout(() => {
      setLastClearedCart((prev) => prev && Date.now() - prev.timestamp >= 9900 ? null : prev);
    }, 1e4);
  };
  const handleRestoreClearedCart = () => {
    if (lastClearedCart && lastClearedCart.cart.length > 0) {
      updateActiveSale({ cart: lastClearedCart.cart });
      setLastClearedCart(null);
      addToast("Cart restored successfully!", "success");
    }
  };
  const categoryScrollRef = useRef(null);
  const handleCategoryWheel = (e) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const offset = direction === "left" ? -180 : 180;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };
  const [sales, setSales] = useState(() => {
    const initial = posSessions.length > 0 ? posSessions : [{ id: Date.now(), type: "pos", cart: [], cashReceived: "", searchTerm: "", customer: null, discountType: "fixed", discountValue: 0 }];
    return initial.map((s) => ({
      ...s,
      cart: Array.isArray(s?.cart) ? s.cart : []
    }));
  });
  const [activeSaleId, setActiveSaleId] = useState(() => {
    return currentPosId || sales[0]?.id || Date.now();
  });
  const rawActiveSale = sales.find((s) => s.id === activeSaleId) || sales[0] || { id: activeSaleId, type: "pos", cart: [], cashReceived: "", searchTerm: "", customer: null, discountType: "fixed", discountValue: 0 };
  const activeSale = {
    ...rawActiveSale,
    cart: Array.isArray(rawActiveSale?.cart) ? rawActiveSale.cart : []
  };
  const updateActiveSale = (updates) => {
    setSales((prev) => prev.map(
      (sale) => sale.id === activeSaleId ? { ...sale, ...updates } : sale
    ));
    updatePosSession(activeSaleId, updates);
  };
  useEffect(() => {
    if (recalledSale) {
      const mappedCart = recalledSale.items.map((item) => {
        const itemDiscount = parseFloat(item.discount_amount || item.discount || 0);
        const unitPrice = parseFloat(item.unit_price || 0);
        return {
          cartItemId: `${item.product_id}-${item.product_variant_id || ""}`,
          id: item.product_id,
          variant_id: item.product_variant_id,
          name: item.product.name + (item.product_variant ? ` (${item.product_variant.sku})` : ""),
          price: unitPrice - itemDiscount,
          // Net price
          original_price: unitPrice,
          // Gross price
          discount: itemDiscount,
          // Row discount
          qty: parseFloat(item.quantity),
          freeQuantity: parseFloat(item.free_quantity || 0),
          stock: 9999,
          image: item.product.image_path,
          category: item.product.category?.name || "General"
        };
      });
      const saleSession = {
        id: `RECALL-${recalledSale.id}`,
        type: "pos",
        cart: mappedCart,
        cashReceived: "",
        searchTerm: "",
        customer: recalledSale.customer ? {
          id: recalledSale.customer.id,
          name: recalledSale.customer.name,
          phone: recalledSale.customer.phone
        } : null,
        discountValue: parseFloat(recalledSale.global_discount || 0),
        discountType: "fixed",
        is_recall: true,
        // Flag to indicate editing
        original_sale_id: recalledSale.id
      };
      addPosSession(saleSession);
      addToast(`Recalled Sale #${recalledSale.reference_number}`, "info");
    }
  }, [recalledSale]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState(null);
  const [lastSale, setLastSale] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showRecentInvoices, setShowRecentInvoices] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
  const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: "" });
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [showQuickPartyModal, setShowQuickPartyModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQueryForProduct, setSearchQueryForProduct] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(() => {
    const def = warehouses.find((w) => w.is_default) || warehouses[0];
    return def?.id || null;
  });
  const [parkedSales, setParkedSales] = useState([]);
  const [parkedDropdownOpen, setParkedDropdownOpen] = useState(false);
  const [parkingBill, setParkingBill] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [initialCustomers, setInitialCustomers] = useState([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts.length > 0 ? bankAccounts[0].id : null);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const warehouseDropdownRef = useRef(null);
  const [taxDropdownOpen, setTaxDropdownOpen] = useState(false);
  const [bankAccountDropdownOpen, setBankAccountDropdownOpen] = useState(false);
  const [showQuickAccountModal, setShowQuickAccountModal] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [printOnComplete, setPrintOnComplete] = useState(() => {
    const saved = localStorage.getItem("pos_print_on_complete");
    return saved ? JSON.parse(saved) : true;
  });
  const [seniorMode, setSeniorMode] = useState(() => {
    const sessionOverride = sessionStorage.getItem("pos_senior_mode");
    if (sessionOverride !== null) {
      return JSON.parse(sessionOverride);
    }
    return settings?.senior_mode === "1" || settings?.senior_mode === true;
  });
  const [returnMode, setReturnMode] = useState(false);
  const [returnSaleRef, setReturnSaleRef] = useState("");
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [returnSaleLoading, setReturnSaleLoading] = useState(false);
  const [returnProcessing, setReturnProcessing] = useState(false);
  const [enableTax, setEnableTax] = useState(() => {
    const saved = localStorage.getItem("pos_enable_tax");
    if (saved !== null) return saved === "true";
    return settings?.enable_tax !== "0" && settings?.enable_tax !== false && settings?.enable_tax !== 0;
  });
  const [enableFulfilment, setEnableFulfilment] = useState(() => {
    const saved = localStorage.getItem("pos_enable_fulfilment");
    if (saved !== null) return saved === "true";
    return false;
  });
  const [enableFreeQty, setEnableFreeQty] = useState(() => {
    const saved = localStorage.getItem("pos_enable_free_qty");
    if (saved !== null) return saved === "true";
    return false;
  });
  const [showFreeQty, setShowFreeQty] = useState(false);
  const [showTopTillBtn, setShowTopTillBtn] = useState(() => {
    return localStorage.getItem("pos_show_top_till") === "true";
  });
  const [showTopHardwareBadge, setShowTopHardwareBadge] = useState(() => {
    return localStorage.getItem("pos_show_top_hardware") === "true";
  });
  const readLocalBool = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === "true" || v === "1";
    } catch (_) {
      return fallback;
    }
  };
  const defaultRoundOff = !(settings?.round_off_total === void 0 || settings?.round_off_total === null || settings?.round_off_total === "" || settings?.round_off_total === "none");
  const [roundOff, setRoundOffState] = useState(() => readLocalBool("pos_round_off", defaultRoundOff));
  const setRoundOff = (v) => {
    setRoundOffState(v);
    try {
      localStorage.setItem("pos_round_off", String(v));
    } catch (_) {
    }
  };
  const [autoFillCash, setAutoFillCashState] = useState(() => readLocalBool(
    "pos_auto_fill_cash",
    settings?.pos_auto_fill_cash === "1" || settings?.pos_auto_fill_cash === true || settings?.pos_auto_fill_cash === 1
  ));
  const setAutoFillCash = (v) => {
    setAutoFillCashState(v);
    try {
      localStorage.setItem("pos_auto_fill_cash", String(v));
    } catch (_) {
    }
  };
  const [showMargin, setShowMarginState] = useState(() => readLocalBool(
    "pos_show_margin",
    settings?.show_margin_percentage === "1" || settings?.show_margin_percentage === true
  ));
  const setShowMargin = (v) => {
    setShowMarginState(v);
    try {
      localStorage.setItem("pos_show_margin", String(v));
    } catch (_) {
    }
  };
  const [openDrawerOnCash, setOpenDrawerOnCashState] = useState(() => readLocalBool(
    "pos_open_drawer_on_cash",
    settings?.thermal_open_drawer === "1" || settings?.thermal_open_drawer === true
  ));
  const setOpenDrawerOnCash = (v) => {
    setOpenDrawerOnCashState(v);
    try {
      localStorage.setItem("pos_open_drawer_on_cash", String(v));
    } catch (_) {
    }
  };
  const [uiScale, setUiScaleState] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem("pos_ui_scale"));
      return Number.isFinite(v) && v >= 0.9 && v <= 1.3 ? v : 1;
    } catch (_) {
      return 1;
    }
  });
  const setUiScale = (v) => {
    const next = Math.max(0.9, Math.min(1.3, Number(v) || 1));
    setUiScaleState(next);
    try {
      localStorage.setItem("pos_ui_scale", String(next));
    } catch (_) {
    }
  };
  const [surfaceButtons, setSurfaceButtonsState] = useState(() => {
    try {
      const raw = localStorage.getItem("pos_surface_buttons");
      return raw ? { ...DEFAULT_SURFACE, ...JSON.parse(raw) } : { ...DEFAULT_SURFACE };
    } catch (_) {
      return { ...DEFAULT_SURFACE };
    }
  });
  const setSurfaceButtons = (next) => {
    setSurfaceButtonsState(next);
    try {
      localStorage.setItem("pos_surface_buttons", JSON.stringify(next));
    } catch (_) {
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {
      });
      else document.exitFullscreen?.();
    } catch (_) {
    }
  };
  const [serviceMode, setServiceMode] = useState(settings?.service_mode || "counter");
  const [serviceChargeSetting, setServiceChargeState] = useState(
    () => parseFloat(settings?.service_charge_percent || 0) || 0
  );
  const saveServiceCharge = async (pct) => {
    const value = Math.max(0, Math.min(100, parseFloat(pct) || 0));
    const previous = serviceChargeSetting;
    setServiceChargeState(value);
    try {
      await axios.post(route("store.tables.service-charge", { store_slug: store?.slug }), { percent: value });
      addToast(value > 0 ? `Service charge set to ${value}%` : "Service charge switched off", "success");
    } catch (e) {
      setServiceChargeState(previous);
      addToast(e?.response?.status === 403 ? "You do not have permission to change the service charge." : "That service charge could not be saved.", "error");
    }
  };
  const saveServiceMode = async (mode) => {
    const previous = serviceMode;
    setServiceMode(mode);
    try {
      await axios.post(route("store.tables.service-mode", { store_slug: store?.slug }), { mode });
      addToast(mode === "counter" ? "Counter service" : mode === "tables" ? "Table service" : "Counter and table service", "success");
      router.reload({ only: ["settings"], preserveScroll: true, preserveState: true });
    } catch (e) {
      setServiceMode(previous);
      addToast(e?.response?.status === 403 ? "You do not have permission to change the service style." : "Could not save the service style.", "error");
    }
  };
  const [showRail, setShowRail] = useState(() => {
    const saved = localStorage.getItem("pos_show_rail");
    return saved ? JSON.parse(saved) : false;
  });
  const {
    ref: termRef,
    layout,
    comp: composition,
    paneCols,
    update: updateComposition,
    applyPreset
  } = usePosLayout({ settings, senior: seniorMode, scale: uiScale, terminal });
  const handleWizardApply = (newPrefs) => {
    try {
      localStorage.setItem("pos_wizard_completed", "true");
    } catch (_) {
    }
    if (newPrefs?.preset) {
      applyPreset(newPrefs.preset);
    }
    if (newPrefs?.ops?.senior !== void 0) {
      setSeniorMode(Boolean(newPrefs.ops.senior));
      try {
        localStorage.setItem("pos_senior_mode", JSON.stringify(newPrefs.ops.senior));
      } catch (_) {
      }
    }
    if (newPrefs?.ops?.autoPrint !== void 0) {
      setPrintOnComplete(Boolean(newPrefs.ops.autoPrint));
      try {
        localStorage.setItem("pos_auto_print", JSON.stringify(newPrefs.ops.autoPrint));
      } catch (_) {
      }
    }
    if (newPrefs?.ops?.autoFillCash !== void 0) {
      try {
        localStorage.setItem("pos_auto_fill_cash", JSON.stringify(newPrefs.ops.autoFillCash));
      } catch (_) {
      }
    }
    if (newPrefs?.rail !== void 0) {
      setShowRail(Boolean(newPrefs.rail));
      try {
        localStorage.setItem("pos_show_rail", JSON.stringify(newPrefs.rail));
      } catch (_) {
      }
    }
    addToast("Register configured. Change any of it from the settings button, or Alt+L.", "success");
  };
  const currentPresetId = matchPreset(composition);
  const wizardPrefs = {
    preset: currentPresetId,
    auto: true,
    profile: "retail",
    rail: showRail,
    ops: { senior: seniorMode, autoPrint: printOnComplete, autoFillCash }
  };
  const REGISTER_KEYS = [
    "pos_composition_v2",
    "pos_layout_variant",
    "pos_show_rail",
    "pos_print_on_complete",
    "pos_enable_tax",
    "pos_enable_fulfilment",
    "pos_enable_free_qty",
    "pos_discount_presets",
    "pos_auto_fill_cash",
    "pos_auto_print",
    "pos_round_off",
    "pos_show_margin",
    "pos_ui_scale",
    "pos_open_drawer_on_cash",
    "pos_show_top_till",
    "pos_show_top_hardware",
    "pos_surface_buttons"
  ];
  const handleResetRegister = () => {
    showConfirm(
      "Reset this register?",
      "Every layout and preference saved on this device goes back to its default. Your store settings, products and sales are not touched.",
      () => {
        try {
          REGISTER_KEYS.forEach((k) => localStorage.removeItem(k));
          sessionStorage.removeItem("pos_senior_mode");
        } catch (_) {
        }
        applyPreset(DEFAULT_PRESET);
        setShowRail(false);
        setSeniorMode(false);
        setUiScale(1);
        setShowMargin(false);
        setPrintOnComplete(true);
        setOpenDrawerOnCash(true);
        setAutoFillCash(true);
        setRoundOff(defaultRoundOff);
        setEnableTax(true);
        setEnableFulfilment(false);
        setEnableFreeQty(false);
        setDiscountPresets([5, 10, 15, 20]);
        setSurfaceButtonsState({ ...DEFAULT_SURFACE });
        setSettingsOpen(false);
        addToast("Register reset to defaults", "success");
      },
      true
    );
  };
  const [qtyDraft, setQtyDraft] = useState(null);
  const [priceDraft, setPriceDraft] = useState(null);
  const commitQty = (item) => {
    if (!qtyDraft || qtyDraft.id !== item.cartItemId) return;
    const n = parseFloat(qtyDraft.value);
    setQtyDraft(null);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n === Number(item.qty)) return;
    updateQty(item.cartItemId, n - Number(item.qty));
  };
  const commitPrice = (item) => {
    if (!priceDraft || priceDraft.id !== item.cartItemId) return;
    const n = parseFloat(priceDraft.value);
    setPriceDraft(null);
    if (!Number.isFinite(n) || n < 0) return;
    if (n === Number(item.price)) return;
    const base = Number(item.original_price ?? item.price);
    updateActiveSale({
      cart: activeSale.cart.map((l) => l.cartItemId === item.cartItemId ? { ...l, price: n, original_price: base, discount: Math.max(0, base - n) } : l)
    });
  };
  const [settlingOccupancy, setSettlingOccupancy] = useState(null);
  const occupancyLoaded = useRef(false);
  useEffect(() => {
    if (!occupancy || occupancyLoaded.current) return;
    occupancyLoaded.current = true;
    const lines = (occupancy.cart || []).map(serverLineToCart);
    if (!lines.length) {
      addToast(`${occupancy.label || "That table"} has nothing on it yet.`, "warning");
      return;
    }
    updateActiveSale({ cart: lines, notes: occupancy.note || "" });
    setSettlingOccupancy(occupancy);
    addToast(`${occupancy.label || "Table"} loaded — take the payment`, "info");
  }, [occupancy]);
  const releaseSettledTable = async (saleId) => {
    if (!settlingOccupancy) return;
    try {
      await axios.post(route("store.tables.settled", { store_slug: store?.slug }), {
        occupancy_id: settlingOccupancy.id,
        sale_id: saleId ?? null
      });
      addToast(`${settlingOccupancy.label || "Table"} is free`, "success");
    } catch (_) {
      addToast("Sale completed, but the table could not be released. Free it from the floor.", "warning");
    } finally {
      setSettlingOccupancy(null);
    }
  };
  const [openSheet, setOpenSheet] = useState(null);
  const lanes = {
    takeaway: String(settings?.lane_takeaway ?? "0") === "1",
    delivery: String(settings?.lane_delivery ?? "0") === "1"
  };
  const tables = useTableService({
    enabled: tableMode,
    storeSlug: store?.slug,
    initialPositions,
    initialTickets,
    initialZones,
    initialKitchen,
    lanes,
    onError: (m) => addToast(m, "error"),
    onNotice: (m) => addToast(m, "success")
  });
  const [floorNow, setFloorNow] = useState(() => Date.now());
  useEffect(() => {
    if (!tableMode) return void 0;
    const id = setInterval(() => setFloorNow(Date.now()), 2e4);
    return () => clearInterval(id);
  }, [tableMode]);
  const [newTicketFor, setNewTicketFor] = useState(null);
  const openFloorPlan = () => router.visit(route("store.tables.plan", { store_slug: store?.slug }));
  const [seatFor, setSeatFor] = useState(null);
  const [movingTable, setMovingTable] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitSeed, setSplitSeed] = useState(null);
  const [modifierFor, setModifierFor] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierLoading, setModifierLoading] = useState(false);
  const loadedOccupancy = useRef(null);
  const selectedTable = tables.selected;
  const tableCovers = Number(selectedTable?.covers) || 1;
  const tableOrderType = selectedTable?.order_type || "dine_in";
  useEffect(() => {
    if (!tableMode) return;
    const t2 = tables.selected;
    if (!t2 || !t2.occupancy_id) return;
    if (loadedOccupancy.current === t2.occupancy_id) return;
    loadedOccupancy.current = t2.occupancy_id;
    const lines = (t2.cart || []).map(serverLineToCart);
    tables.prime(lines);
    updateActiveSale({ cart: lines, notes: t2.note || "" });
  }, [tableMode, tables.selectedId, tables.selected?.occupancy_id]);
  useEffect(() => {
    if (!tableMode) return;
    const t2 = tables.selected;
    if (!t2 || !t2.occupancy_id) return;
    if (loadedOccupancy.current !== t2.occupancy_id) return;
    tables.pushOrder(t2.occupancy_id, activeSale.cart, {
      covers: t2.covers,
      orderType: t2.order_type,
      note: activeSale.remarks || activeSale.notes || ""
    });
  }, [tableMode, activeSale.cart]);
  const backToFloor = () => {
    loadedOccupancy.current = null;
    tables.select(null);
    updateActiveSale({ cart: [], cashReceived: "", customer: null, remarks: "" });
  };
  const pickTable = (t2) => {
    if (movingTable) return;
    if (t2.kind === "ticket") {
      if (tables.selectedId === t2.id) {
        setOpenSheet(null);
        return;
      }
      loadedOccupancy.current = null;
      tables.select(t2.id);
      setOpenSheet(null);
      return;
    }
    if (t2.occupancy_id) {
      if (tables.selectedId === t2.id) {
        setOpenSheet(null);
        return;
      }
      loadedOccupancy.current = null;
      tables.select(t2.id);
      setOpenSheet(null);
      return;
    }
    if (t2.status === "cleaning") {
      addToast(`${t2.label || t2.code} is being cleaned. Mark it free from the floor first.`, "warning");
      return;
    }
    setSeatFor(t2);
  };
  const confirmSeat = async ({ covers, orderType }) => {
    const pos = await tables.openTable(seatFor.id, { covers, orderType });
    setSeatFor(null);
    if (pos) {
      loadedOccupancy.current = pos.occupancy_id;
      tables.prime([]);
      updateActiveSale({ cart: [], cashReceived: "", customer: null, remarks: "" });
      setOpenSheet(null);
    }
  };
  const fireToKitchen = async () => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    await tables.flushOrder(t2.occupancy_id, activeSale.cart, {
      covers: t2.covers,
      orderType: t2.order_type,
      note: activeSale.remarks || activeSale.notes || ""
    });
    const res = await tables.sendToKitchen(t2.occupancy_id);
    if (res) {
      updateActiveSale({ cart: activeSale.cart.map((l) => ({ ...l, sent: true })) });
    }
  };
  const dropCheck = async () => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    const already = !!t2.check_dropped_at;
    const res = await tables.dropCheck(t2.occupancy_id, already);
    if (res) {
      addToast(already ? "Bill taken back" : "Bill dropped — the pay clock is running", "info");
      if (!already && printOnComplete) {
        try {
          PrintService.printBill?.({ sale: activeSale, total: cartTotal, table: t2 });
        } catch (_) {
        }
      }
    }
  };
  const setCovers = (n) => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    tables.flushOrder(t2.occupancy_id, activeSale.cart, {
      covers: n,
      orderType: t2.order_type,
      note: activeSale.remarks || activeSale.notes || ""
    });
  };
  const setOrderType = (v) => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    tables.flushOrder(t2.occupancy_id, activeSale.cart, {
      covers: t2.covers,
      orderType: v,
      note: activeSale.remarks || activeSale.notes || ""
    });
  };
  const closeSelectedTable = () => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    const due = Number(t2.order_total) || 0;
    const finish = async (force) => {
      const ok = await tables.closeTable(t2.occupancy_id, force);
      if (ok) {
        loadedOccupancy.current = null;
        updateActiveSale({ cart: [], cashReceived: "", customer: null, remarks: "" });
        addToast(`${t2.label || t2.code} is free`, "success");
      }
    };
    if (due > 0) {
      setConfirmState({
        show: true,
        title: `Close ${t2.label || t2.code} with ${money(due)} unpaid?`,
        message: "Nothing will be charged and the order will be discarded. Use Complete Sale instead if this table is paying.",
        onConfirm: () => {
          setConfirmState((s0) => ({ ...s0, show: false }));
          finish(true);
        }
      });
      return;
    }
    finish(false);
  };
  const confirmSplit = async (spec) => {
    const t2 = tables.selected;
    if (!t2?.occupancy_id) return;
    setSplitOpen(false);
    if (spec.mode === "lines") {
      await tables.flushOrder(t2.occupancy_id, activeSale.cart, {
        covers: t2.covers,
        orderType: t2.order_type,
        note: activeSale.remarks || activeSale.notes || ""
      });
      const res = await tables.split(t2.occupancy_id, spec);
      if (!res) return;
      const ids = new Set(spec.line_ids);
      const part = activeSale.cart.filter((l) => ids.has(l.lineId || l.cartItemId));
      updateActiveSale({ cart: part, cashReceived: "" });
      addToast(`${part.length} line${part.length === 1 ? "" : "s"} moved to this bill — take the payment`, "info");
      return;
    }
    setSplitSeed(spec.mode === "covers" ? { ways: spec.parts } : { amount: spec.amount });
    setPaymentModalOpen(true);
  };
  const modifierCache = useRef({});
  const fetchModifierGroups = async (product) => {
    const cached = modifierCache.current[product.id];
    if (cached) return cached;
    try {
      const { data } = await axios.get(route("store.pos.modifiers", { store_slug: store?.slug }), {
        params: { product_id: product.id }
      });
      const groups = Array.isArray(data?.groups) ? data.groups : [];
      modifierCache.current[product.id] = groups;
      return groups;
    } catch (_) {
      modifierCache.current[product.id] = [];
      return [];
    }
  };
  const addWithOptions = async (product, variant = null) => {
    const groups = await fetchModifierGroups(product);
    if (!groups.length) {
      addToCart(product, variant);
      return;
    }
    setModifierGroups(groups);
    setModifierLoading(false);
    setModifierFor(product);
  };
  const panesRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const shareOf = (key) => key === "catalog" ? composition?.catalog?.size ?? 0 : composition?.split?.tender ?? 0;
  const pxOf = (key) => key === "catalog" ? layout.catalog?.px ?? 0 : layout.tender?.px ?? 0;
  const SPLIT_BOUNDS = {
    catalog: { min: 0.12, max: 0.55 },
    tender: { min: 0.16, max: 0.45 }
  };
  const commitShare = (key, share) => {
    const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
    const clamped = Math.max(b.min, Math.min(b.max, share));
    updateComposition((prev) => key === "catalog" ? { ...prev, catalog: { ...prev.catalog, size: clamped } } : { ...prev, split: { ...prev.split, tender: clamped } });
    return { clamped, atFloor: clamped !== share };
  };
  const startSplitDrag = (key, edge) => (e) => {
    if (e.button !== void 0 && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const host = termRef.current;
    const grid = panesRef.current;
    if (!host || !grid) return;
    const rect = grid.getBoundingClientRect();
    const total = Math.max(1, rect.width);
    setDragging(key);
    host.setAttribute("data-resizing", "1");
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {
    }
    const onMove = (ev) => {
      const px = edge === "right" ? rect.right - ev.clientX : ev.clientX - rect.left;
      const wanted = px / total;
      const { clamped, atFloor } = commitShare(key, wanted);
      setDragInfo({ key, px: Math.round(clamped * total), pct: Math.round(clamped * 100), atFloor });
    };
    const onUp = () => {
      setDragging(null);
      setDragInfo(null);
      host.removeAttribute("data-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };
  const onSplitKeyDown = (key, edge) => (e) => {
    const grow = edge === "right" ? "ArrowLeft" : "ArrowRight";
    const shrink = edge === "right" ? "ArrowRight" : "ArrowLeft";
    const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
    const step = e.shiftKey ? 0.05 : 0.01;
    let next = null;
    if (e.key === grow) next = shareOf(key) + step;
    else if (e.key === shrink) next = shareOf(key) - step;
    else if (e.key === "Home") next = b.min;
    else if (e.key === "End") next = b.max;
    else if (e.key === "Enter" || e.key === " ") {
      resetSplit(key)();
      e.preventDefault();
      return;
    } else return;
    e.preventDefault();
    const { clamped } = commitShare(key, next);
    const total = Math.max(1, panesRef.current?.getBoundingClientRect().width || 1);
    setDragInfo({ key, px: Math.round(clamped * total), pct: Math.round(clamped * 100), atFloor: clamped !== next });
    clearTimeout(splitReadoutTimer.current);
    splitReadoutTimer.current = setTimeout(() => setDragInfo(null), 1400);
  };
  const splitReadoutTimer = useRef(null);
  useEffect(() => () => clearTimeout(splitReadoutTimer.current), []);
  const resetSplit = (key) => () => {
    const base = PRESETS.find((p) => p.id === currentPresetId)?.comp;
    if (!base) return;
    const share = key === "catalog" ? base.catalog?.size ?? 0.2 : base.split?.tender ?? 0.3;
    commitShare(key, share);
    addToast(`${key === "catalog" ? "Catalog" : "Payment"} width reset`, "info");
  };
  useEffect(() => {
    if (!openSheet) return void 0;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenSheet(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openSheet]);
  const [itemDiscountModal, setItemDiscountModal] = useState({ show: false, item: null, discType: "fixed", discValue: "" });
  const [converterModal, setConverterModal] = useState({ show: false, item: null, mode: "price", price: "", qty: "", total: "" });
  const [globalDiscountModal, setGlobalDiscountModal] = useState({ show: false, type: "fixed", value: "" });
  const openItemDiscountModal = (item) => {
    const currentOriginal = item.original_price || item.price;
    setItemDiscountModal({ show: true, item, discType: "fixed", discValue: item.discount > 0 ? String(item.discount) : "", originalPrice: currentOriginal });
  };
  useEffect(() => {
    const handleSync = () => {
      router.reload({
        only: ["products", "categories"],
        preserveState: true,
        preserveScroll: true
      });
      refreshCartItems();
    };
    window.addEventListener("amd:product-updated", handleSync);
    window.addEventListener("storage", (e) => {
      if (e.key === "amd_product_latest_change") handleSync();
    });
    return () => {
      window.removeEventListener("amd:product-updated", handleSync);
    };
  }, [activeSale?.cart]);
  const refreshCartItems = async () => {
    if (!activeSale?.cart?.length) return;
    const productsToRefresh = activeSale.cart.map((i) => i.id);
    try {
      const response = await axios.get(route("store.inventory.search", { store_slug: store?.slug }), {
        params: { ids: productsToRefresh }
      });
      const latestProducts = response.data || [];
      const newCart = activeSale.cart.map((item) => {
        const latest = latestProducts.find((p) => p.id === item.id);
        if (latest) {
          const shouldUpdatePrice = !activeSale.is_recall;
          const newPrice = shouldUpdatePrice ? parseFloat(latest.price || latest.selling_price || 0) : item.original_price || item.price;
          return {
            ...item,
            price: shouldUpdatePrice && item.discount > 0 ? newPrice - item.discount : shouldUpdatePrice ? newPrice : item.price,
            original_price: shouldUpdatePrice ? newPrice : item.original_price || item.price,
            stock: parseFloat(latest.stock_quantity || latest.stock || 0)
          };
        }
        return item;
      });
      updateActiveSale({ cart: newCart });
    } catch (error) {
      console.error("Failed to refresh cart items", error);
    }
  };
  const applyItemDiscount = () => {
    const { item, discType, discValue, originalPrice } = itemDiscountModal;
    const val = parseFloat(discValue);
    if (isNaN(val) || val < 0) {
      addToast("Enter a valid discount", "error");
      return;
    }
    const discountAmount = discType === "percentage" ? originalPrice * val / 100 : val;
    if (discountAmount > originalPrice) {
      addToast("Discount cannot exceed item price", "error");
      return;
    }
    const newCart = activeSale.cart.map(
      (i) => i.cartItemId === item.cartItemId ? { ...i, price: originalPrice - discountAmount, discount: discountAmount, original_price: originalPrice } : i
    );
    updateActiveSale({ cart: newCart });
    setItemDiscountModal({ show: false, item: null, discType: "fixed", discValue: "" });
    addToast(`Discount of ${discType === "percentage" ? val + "%" : formatCurrency(val, store || settings)} applied`, "success");
  };
  const openConverterModal = (item) => {
    const price = item.original_price || item.price;
    setConverterModal({ show: true, item, mode: "price", price: String(price), qty: String(item.qty), total: String(price * item.qty) });
  };
  const handleConverterChange = (field, rawValue) => {
    setConverterModal((prev) => {
      const val = parseFloat(rawValue) || 0;
      let next = { ...prev, [field]: rawValue };
      if (field === "total") {
        if (prev.mode === "price") {
          const qty = parseFloat(prev.qty) || 1;
          next.price = qty > 0 ? String(+(val / qty).toFixed(4)) : prev.price;
        } else {
          const price = parseFloat(prev.price) || 0;
          next.qty = price > 0 ? String(+(val / price).toFixed(4)) : prev.qty;
        }
      } else if (field === "price") {
        const qty = parseFloat(prev.qty) || 1;
        next.total = String(+(val * qty).toFixed(2));
      } else if (field === "qty") {
        const price = parseFloat(prev.price) || 0;
        next.total = String(+(val * price).toFixed(2));
      }
      return next;
    });
  };
  const applyConverter = () => {
    const { item, price, qty } = converterModal;
    const newPrice = parseFloat(price);
    const newQty = parseFloat(qty);
    if (isNaN(newPrice) || newPrice < 0 || isNaN(newQty) || newQty <= 0) {
      addToast("Invalid values", "error");
      return;
    }
    const allowNegative = !shouldStopNegativeStock(settings);
    if (newQty > item.stock && !item.has_manufacturing_rule && !allowNegative) {
      addToast("Not enough stock!", "error");
      return;
    }
    const newCart = activeSale.cart.map(
      (i) => i.cartItemId === item.cartItemId ? { ...i, price: newPrice, original_price: newPrice, qty: newQty, discount: 0 } : i
    );
    updateActiveSale({ cart: newCart });
    setConverterModal({ show: false, item: null, mode: "price", price: "", qty: "", total: "" });
    addToast("Item updated", "success");
  };
  const [isOnline2, setIsOnline] = useState(navigator.onLine);
  const [offlineSales, setOfflineSales] = useState([]);
  const [showSyncHub, setShowSyncHub] = useState(false);
  const {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    checkPending,
    saveOfflineSale,
    syncPendingSales,
    getPendingSales,
    deletePendingSale
  } = useOfflineSync();
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    const handleCsrfMismatch = () => {
      addToast("Security token refreshed. Please try saving again.", "warning");
    };
    window.addEventListener("amd:csrf-mismatch", handleCsrfMismatch);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
      window.removeEventListener("amd:csrf-mismatch", handleCsrfMismatch);
    };
  }, []);
  const handleRecallOfflineSale = async (offlineSale) => {
    try {
      const newId = Math.max(...sales.map((s) => s.id), 1e3) + 1;
      setSales((prev) => [...prev, {
        id: newId,
        cart: offlineSale.data.cart || [],
        cashReceived: "",
        searchTerm: "",
        customer: offlineSale.data.party_id ? { id: offlineSale.data.party_id, name: offlineSale.data.customer_name || "Walk-in" } : null,
        isFromOffline: true
      }]);
      setActiveSaleId(newId);
      await deletePendingSale(offlineSale.id);
      setOfflineSales((prev) => prev.filter((s) => s.id !== offlineSale.id));
      setShowSyncHub(false);
      addToast("Offline sale loaded back to cart", "success");
    } catch (error) {
      console.error("Error recalling offline sale:", error);
      addToast("Failed to recall offline sale", "error");
    }
  };
  const loadOfflineSales = async () => {
    const sales2 = await getPendingSales();
    setOfflineSales(sales2);
    await checkPending();
  };
  const searchInputRef = useRef(null);
  const parkedDropdownRef = useRef(null);
  const recentDropdownRef = useRef(null);
  useRef(null);
  const cartListRef = useRef(null);
  const cashReceivedInputRef = useRef(null);
  useEffect(() => {
    sales.forEach((sale) => {
      const existing = posSessions.find((s) => s.id === sale.id);
      if (existing) {
        updatePosSession(sale.id, sale);
      }
    });
  }, [sales]);
  useEffect(() => {
    if (currentPosId && currentPosId !== activeSaleId) {
      setActiveSaleId(currentPosId);
    }
  }, [currentPosId]);
  useEffect(() => {
    localStorage.setItem("pos_print_on_complete", JSON.stringify(printOnComplete));
  }, [printOnComplete]);
  useEffect(() => {
    sessionStorage.setItem("pos_senior_mode", JSON.stringify(seniorMode));
    window.dispatchEvent(new CustomEvent("vq:pos-senior-mode-changed", { detail: { seniorMode } }));
  }, [seniorMode]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchTerm.length >= 2) {
        searchCustomers(customerSearchTerm);
      } else {
        setCustomerResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchTerm]);
  const loadRecentInvoices = async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch("/api/pos/recent-sales", {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === "success") {
        setRecentInvoices(data.data);
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to fetch recent invoices", "error");
    } finally {
      setLoadingRecent(false);
    }
  };
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          if (activeSale && activeSale.cart && activeSale.cart.length === 0) {
            updateActiveSale({ cart: parsedCart });
            addToast("🛒 Cart Rescue activated! Previous items restored.", "success");
          }
        }
      } catch (e) {
        console.error("Cart Rescue parse failed", e);
      }
    }
  }, []);
  useEffect(() => {
    if (activeSale && activeSale.cart) {
      if (activeSale.cart.length > 0) {
        localStorage.setItem("pos_cart", JSON.stringify(activeSale.cart));
      } else {
        localStorage.setItem("pos_cart", JSON.stringify(activeSale.cart));
      }
    }
  }, [activeSale?.cart]);
  const createNewSale = () => {
    const newSession = addPosSession({ discountType: "fixed", discountValue: 0 });
    setSales((prev) => [...prev, newSession]);
    setActiveSaleId(newSession.id);
  };
  const closeSale = async (e, id) => {
    e.stopPropagation();
    if (sales.length === 1) {
      const s = sales.find((s2) => s2.id === id);
      if (s && s.cart.length > 0) {
        const confirmed = await window.confirm("Closing this last tab will discard current items and exit. Continue?");
        if (!confirmed) return;
      }
      removePosSession(id);
      router.visit(route("store.dashboard", { store_slug: store?.slug }));
      return;
    }
    const newSales = sales.filter((s) => s.id !== id);
    setSales(newSales);
    removePosSession(id);
    if (activeSaleId === id) {
      setActiveSaleId(newSales[newSales.length - 1].id);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSale.searchTerm.length >= 2) {
        performSearch(activeSale.searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSale.searchTerm]);
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.pos.search", { store_slug: store?.slug }), { params: { q: query } });
        setSearchResults(response.data.data || response.data || []);
      } else {
        const lowerQuery = query.toLowerCase();
        const results = await db.products.filter(
          (p) => p.name && p.name.toLowerCase().includes(lowerQuery) || p.sku && p.sku.toLowerCase().includes(lowerQuery) || p.barcode && p.barcode.includes(query)
        ).limit(50).toArray();
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error:", error);
      try {
        const lowerQuery = query.toLowerCase();
        const results = await db.products.filter(
          (p) => p.name && p.name.toLowerCase().includes(lowerQuery) || p.sku && p.sku.toLowerCase().includes(lowerQuery) || p.barcode && p.barcode.includes(query)
        ).limit(50).toArray();
        setSearchResults(results);
      } catch (localError) {
        console.error("Local search failed:", localError);
      }
    } finally {
      setIsSearching(false);
    }
  };
  const handleProductSelect = (product) => {
    if (tableMode && !selectedTable) {
      addToast("Pick a table first — an order has to belong to one.", "warning");
      return;
    }
    const isService = product.type === "service" || product.is_service || product.item_type === "service";
    const hasPreSales = !Array.isArray(modules) || modules.includes("pre_sales");
    if (hasPreSales && product.reserved_quantity > 0 && !isService && (product.available_stock ?? product.stock_quantity ?? 0) <= 0 && !product.has_manufacturing_rule) {
      if (!window.confirm(`Warning: ${product.reserved_quantity || 0} units are reserved for pre-orders. Available: ${product.available_stock || 0}. Selling this will put reservations into backorder. Continue?`)) {
        updateActiveSale({ searchTerm: "" });
        setSearchResults([]);
        if (searchInputRef.current) searchInputRef.current.focus();
        return;
      }
    }
    const hasVariants = !Array.isArray(modules) || modules.includes("variants");
    if (hasVariants && product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setVariantModalOpen(true);
    } else {
      addWithOptions(product);
    }
    updateActiveSale({ searchTerm: "" });
    setSearchResults([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };
  const addToCart = (product, variant = null, mods = null) => {
    const currentCart = activeSale.cart;
    const modKey = mods && mods.length ? "-" + mods.map((m) => m.id).sort().join(".") : "";
    const cartItemId = (variant ? `${product.id}-${variant.id}` : `${product.id}`) + modKey;
    const existing = currentCart.find((item) => item.cartItemId === cartItemId);
    let newCart;
    const price = variant ? getProductPrice(variant, 1, settings) : getProductPrice(product, 1, settings);
    const name = variant ? `${product.name} (${variant.sku})` : product.name;
    const isService = product.type === "service" || product.is_service || product.item_type === "service";
    const stock = isService ? 999999 : variant ? variant.stock_quantity : product.stock_quantity;
    if (existing) {
      const newQty = existing.qty + 1;
      const canAutoManufacture = product.has_manufacturing_rule === true;
      if (!isService && newQty > stock && !canAutoManufacture) {
        const allowNegative = !shouldStopNegativeStock(settings);
        if (!allowNegative) {
          showAlert(
            "Not Enough Stock",
            `Cannot add more "${name}" — available stock is ${stock} unit(s). Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
            "warning"
          );
          return;
        } else {
          addToast(`Warning: ${name} stock will be negative!`, "warning");
        }
      } else if (!isService && newQty > stock && canAutoManufacture) {
        addToast(`🏭 ${name} will be auto-manufactured`, "info");
      }
      newCart = currentCart.map((item) => item.cartItemId === cartItemId ? { ...item, qty: newQty } : item);
    } else {
      const canAutoManufacture = product.has_manufacturing_rule === true;
      if (!isService && stock < 1 && !canAutoManufacture) {
        const allowNegative = !shouldStopNegativeStock(settings);
        if (!allowNegative) {
          showAlert(
            "Out of Stock",
            `"${name}" has no remaining stock. Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
            "warning"
          );
          return;
        } else {
          addToast(`Warning: ${name} stock is out (Qty: ${stock})!`, "warning");
        }
      } else if (!isService && stock < 1 && canAutoManufacture) {
        addToast(`🏭 ${name} will be auto-manufactured from ingredients`, "info");
      }
      const modDelta = (mods || []).reduce((a, m) => a + (Number(m.price_delta) || 0), 0);
      newCart = [...currentCart, {
        cartItemId,
        lineId: cartItemId,
        id: product.id,
        variant_id: variant ? variant.id : null,
        name,
        type: product.type || "standard",
        service_pricing: product.service_pricing || null,
        default_duration: product.default_duration || null,
        requires_visit: !!product.requires_visit,
        skill_tag: product.skill_tag || null,
        price: price + modDelta,
        original_price: price,
        basePrice: price,
        mods: mods || [],
        sent: false,
        discount: 0,
        qty: 1,
        freeQuantity: 0,
        stock,
        has_manufacturing_rule: product.has_manufacturing_rule || false,
        // Store for updateQty checks
        image: product.image_url || product.image_path || null,
        // Robust image path mapping
        category: product.category?.name || (isService ? "Service" : "General"),
        wholesale_price: product.wholesale_price,
        wholesale_min_quantity: product.wholesale_min_quantity
      }];
    }
    updateActiveSale({ cart: newCart });
    setLastAddedItemId(cartItemId);
    setVariantModalOpen(false);
    setSelectedProductForVariant(null);
  };
  const handleSearchInputKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    const val = activeSale.searchTerm.trim();
    if (!val) return;
    if (val.length >= 4 && !/\s/.test(val)) {
      setIsSearching(true);
      try {
        if (isOnline2) {
          const response = await axios.get(route("store.pos.barcode", { store_slug: store?.slug, code: val }));
          if (response.data.found) {
            const product = response.data.product;
            const variantId = response.data.variant_id;
            if (variantId && product.variants) {
              const variant = product.variants.find((v) => v.id === variantId);
              addToCart(product, variant);
            } else {
              handleProductSelect(product);
            }
            updateActiveSale({ searchTerm: "" });
            setIsSearching(false);
            return;
          }
        } else {
          const exactMatch = await db.products.filter((p) => p.sku === val || p.barcode === val).first();
          if (exactMatch) {
            handleProductSelect(exactMatch);
            updateActiveSale({ searchTerm: "" });
            setIsSearching(false);
            return;
          }
        }
      } catch (err) {
        console.error("Barcode exact match lookup failed, falling back to general search:", err);
      } finally {
        setIsSearching(false);
      }
    }
    setIsSearching(true);
    try {
      let results = [];
      if (isOnline2) {
        const response = await axios.get(route("store.inventory.search", { store_slug: store?.slug }), { params: { query: val } });
        results = response.data;
      } else {
        results = await db.products.filter((p) => p.sku === val || p.barcode === val).toArray();
      }
      const exactMatch = results.find((p) => p.sku === val || p.barcode === val);
      if (exactMatch) {
        handleProductSelect(exactMatch);
      } else if (results.length === 1) {
        handleProductSelect(results[0]);
      } else {
        if (results.length > 0) {
          setSearchResults(results);
        } else {
          addToast("No product found", "warning");
        }
      }
    } catch (error) {
      console.error(error);
      try {
        const results = await db.products.filter((p) => p.sku === val || p.barcode === val).toArray();
        const exactMatch = results.find((p) => p.sku === val || p.barcode === val);
        if (exactMatch) {
          handleProductSelect(exactMatch);
        } else if (results.length === 1) {
          handleProductSelect(results[0]);
        } else {
          addToast("No product found (offline)", "warning");
        }
      } catch (err) {
        console.error("Local scan lookup failed:", err);
      }
    } finally {
      setIsSearching(false);
    }
  };
  const removeFromCart = (cartItemId) => {
    const newCart = activeSale.cart.filter((item) => item.cartItemId !== cartItemId);
    updateActiveSale({ cart: newCart });
  };
  const updateQty = (cartItemId, delta) => {
    const newCart = activeSale.cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.qty + delta);
        const canAutoManufacture = item.has_manufacturing_rule === true;
        if (newQty > item.stock && !canAutoManufacture) {
          const allowNegative = !shouldStopNegativeStock(settings);
          if (!allowNegative) {
            showAlert(
              "Not Enough Stock",
              `Cannot increase "${item.name}" quantity — only ${item.stock} unit(s) in stock. Negative stocking is currently disabled. To allow selling beyond available stock, enable "Allow Negative Stock" in Settings.`,
              "warning"
            );
            return item;
          } else {
            if (delta > 0) {
              addToast(`Warning: Selling ${item.name} beyond stock!`, "warning");
            }
          }
        }
        const newPrice = getProductPrice(item, newQty, settings);
        return { ...item, qty: newQty, price: newPrice };
      }
      return item;
    });
    updateActiveSale({ cart: newCart });
  };
  const updateFreeQty = (cartItemId, delta) => {
    const newCart = activeSale.cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(0, (item.freeQuantity || 0) + delta);
        return { ...item, freeQuantity: newQty };
      }
      return item;
    });
    updateActiveSale({ cart: newCart });
  };
  const parsedTaxRates = (() => {
    try {
      return settings?.tax_rates ? typeof settings.tax_rates === "string" ? JSON.parse(settings.tax_rates) : settings.tax_rates : [
        { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
        { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }
      ];
    } catch (e) {
      return [];
    }
  })();
  const taxRate = enableTax ? activeSale.taxRate !== void 0 ? activeSale.taxRate : parseFloat(settings?.default_tax_rate || 0) : 0;
  const taxInclusive = enableTax ? activeSale.taxInclusive !== void 0 ? activeSale.taxInclusive : false : false;
  const subtotal = activeSale.cart.reduce((acc, item) => acc + (item.key_price || item.price) * (item.qty + (enableFreeQty ? item.freeQuantity || 0 : 0)), 0);
  const freeItemDiscounts = enableFreeQty ? activeSale.cart.reduce((acc, item) => acc + (item.freeQuantity || 0) * (item.key_price || item.price), 0) : 0;
  const itemDiscounts = activeSale.cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  let globalDiscount = 0;
  if (activeSale.discountType === "percentage") {
    globalDiscount = subtotal * (activeSale.discountValue || 0) / 100;
  } else {
    globalDiscount = parseFloat(activeSale.discountValue !== void 0 ? activeSale.discountValue : activeSale.discount || 0);
  }
  const totalDiscounts = freeItemDiscounts + itemDiscounts + globalDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscounts);
  const taxAmount = enableTax ? taxInclusive ? taxableAmount - taxableAmount / (1 + taxRate / 100) : taxableAmount * taxRate / 100 : 0;
  const additionalCharges = parseFloat(activeSale.additionalCharges || 0);
  const serviceChargePct = tableMode ? parseFloat(serviceChargeSetting) || 0 : 0;
  const serviceCharge = serviceChargePct > 0 ? Math.round(taxableAmount * serviceChargePct / 100 * 100) / 100 : 0;
  const tipAmount = tableMode ? parseFloat(activeSale.tipAmount || 0) || 0 : 0;
  const rawCartTotal = (taxInclusive ? taxableAmount : taxableAmount + taxAmount) + additionalCharges + serviceCharge + tipAmount;
  const cartTotal = roundOff ? roundTotal(rawCartTotal, settings) : parseFloat(rawCartTotal || 0);
  const changeDue = activeSale.cashReceived ? parseFloat(activeSale.cashReceived) - cartTotal : 0;
  const handleCheckoutClick = () => {
    if (activeSale.cart.length === 0) return;
    const rawTendered = activeSale.cashReceived;
    if (!rawTendered || parseFloat(rawTendered) <= 0) {
      addToast("Please enter the Amount Tendered first", "warning");
      if (cashReceivedInputRef.current) {
        cashReceivedInputRef.current.focus();
        cashReceivedInputRef.current.select();
        const container = document.getElementById("tour-pos-paid");
        if (container) {
          container.classList.add("animate-shake", "ring-2", "ring-rose-500");
          setTimeout(() => {
            container.classList.remove("animate-shake", "ring-2", "ring-rose-500");
          }, 500);
        }
      }
      return;
    }
    const tendered = parseFloat(rawTendered);
    const paymentData = {
      totalPaid: tendered,
      change: Math.max(0, tendered - cartTotal),
      payments: [{
        method: paymentMethod || "cash",
        amount: tendered,
        account_id: ["bank", "card", "online"].includes(paymentMethod) ? selectedBankAccountId : null
      }],
      notes: "",
      printReceipt: printOnComplete
    };
    handlePaymentComplete(paymentData);
  };
  const handleTenderedKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const rawTendered = activeSale.cashReceived;
      if (!rawTendered || parseFloat(rawTendered) <= 0) {
        updateActiveSale({ cashReceived: cartTotal });
        setTimeout(() => {
          handleCheckoutClick();
        }, 50);
      } else {
        handleCheckoutClick();
      }
    }
  };
  const handlePaymentComplete = (paymentData) => {
    setPaymentModalOpen(false);
    const paid = paymentData.totalPaid;
    const total = cartTotal;
    const excess = paid - total;
    if (excess > 0 && activeSale.customer && activeSale.customer.id) {
      setOverpaymentDetails({ amount: excess, customerName: activeSale.customer.name });
      setPendingPaymentData(paymentData);
      setShowOverpaymentModal(true);
      return;
    }
    processCheckout(paymentData, false);
  };
  const processCheckout = async (paymentData, addToLedger = false, approval = null) => {
    setProcessingPayment(true);
    let remainingInvoiceTotal = cartTotal;
    const adjustedPayments = (paymentData.payments || []).map((p) => {
      const isCash = p.method === "cash";
      const originalAmount = parseFloat(p.amount) || 0;
      if (isCash) {
        const cashPortion = Math.min(originalAmount, remainingInvoiceTotal);
        remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - cashPortion);
        return { ...p, amount: cashPortion };
      } else {
        remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - originalAmount);
        return p;
      }
    });
    const basePayload = {
      items: activeSale.cart.map((item) => ({
        product_id: item.id,
        variant_id: item.variant_id,
        quantity: item.qty,
        free_quantity: item.freeQuantity || 0,
        price: item.original_price || item.price,
        discount: item.discount || 0,
        discount_type: item.discountType || "fixed"
      })),
      customer_id: activeSale.customer?.id || null,
      payment_method: "split",
      warehouse_id: selectedWarehouseId,
      payments: adjustedPayments,
      amount_paid: cartTotal,
      // Always count cartTotal as net paid internally
      tax: taxAmount,
      tax_rate: taxRate,
      tax_inclusive: taxInclusive,
      discount: globalDiscount,
      extra_charge_value: additionalCharges,
      extra_charge_label: additionalCharges > 0 ? activeSale.additionalChargesLabel || "Additional charge" : null,
      service_charge: serviceCharge,
      tip_amount: tipAmount,
      notes: activeSale.remarks || activeSale.notes || paymentData.notes || "",
      add_to_ledger: addToLedger,
      source: "pos",
      is_dropship: activeSale.is_dropship || false
    };
    const payload = withApproval(basePayload, approval);
    try {
      let responseData;
      if (isOnline2) {
        const response = await axios.post(route("store.sales.store", { store_slug: store?.slug }), payload);
        responseData = response.data;
      } else {
        throw new Error("Offline");
      }
      if (responseData.success) {
        setApprovalRequest(null);
        finalizeSale(responseData, paymentData);
        return true;
      }
      return false;
    } catch (error) {
      console.log("Checkout processing check:", error);
      const approvalInfo = parseApprovalRequired(error);
      if (approvalInfo) {
        setApprovalRequest({ info: approvalInfo, paymentData, addToLedger });
        setProcessingPayment(false);
        return false;
      }
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        const errMsg = error.response.data?.message || error.response.data?.error || "Validation or authorization error occurred.";
        setApprovalRequest(null);
        showAlert("Checkout Error", errMsg, "error");
        setProcessingPayment(false);
        return false;
      }
      setApprovalRequest(null);
      const offlineSaved = await saveOfflineSale(basePayload);
      if (offlineSaved) {
        const offlineResponse = {
          success: true,
          reference: "OFFLINE-" + Date.now(),
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          is_offline: true
        };
        finalizeSale(offlineResponse, paymentData);
        return true;
      }
      showAlert("Checkout Failed", "Could not save sale offline. Please check device storage.", "error");
      return false;
    } finally {
      setProcessingPayment(false);
      setShowOverpaymentModal(false);
    }
  };
  const finalizeSale = (data, paymentData) => {
    setLastSale({
      ...data,
      cart: activeSale.cart,
      total: cartTotal,
      cash: paymentData.totalPaid,
      change: paymentData.change
    });
    localStorage.removeItem("pos_cart");
    updateActiveSale({ cart: [], cashReceived: "", searchTerm: "", customer: null });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("amd:refresh-products"));
    }, 1e3);
    if (settlingOccupancy) releaseSettledTable(data.sale_id || data.id);
    if (tableMode && tables.selected?.occupancy_id) {
      const occ = tables.selected.occupancy_id;
      const part = tables.selected.pending_settle?.id || null;
      tables.markSettled(occ, data.sale_id || data.id, part).then((res) => {
        if (res && res.closed) {
          loadedOccupancy.current = null;
          tables.select(null);
          addToast("Table paid and free", "success");
        } else if (res) {
          loadedOccupancy.current = null;
          addToast(`Part paid — ${money(res.remaining_total || 0)} still on the table`, "info");
        }
      });
    }
    if (openDrawerOnCash && (paymentData.method === "cash" || paymentMethod === "cash")) {
      try {
        if (window.AMDStation && typeof window.AMDStation.openDrawer === "function") {
          window.AMDStation.openDrawer();
        }
      } catch (_) {
      }
    }
    if (paymentData.printReceipt) {
      const saleForPrint = {
        ...data,
        id: data.sale_id || data.id,
        // ← ensures quickPrint fetches fresh server data
        items: activeSale.cart,
        total: cartTotal,
        amount_paid: paymentData.totalPaid,
        change: paymentData.change,
        customer: activeSale.customer,
        tax: taxAmount
      };
      const printType = settings?.default_print_type || "thermal";
      setTimeout(() => PrintService.quickPrint(saleForPrint, printType, settings), 500);
    }
    if (data.is_offline) {
      "Reference: " + data.reference + "\n\n⚠️ Saved Offline. Will sync when online.";
      addToast("Sale saved offline", "warning");
    } else {
      const totalItemsCount = activeSale.cart.reduce((acc, item) => acc + (item.qty + (item.freeQuantity || 0)), 0);
      const messageElement = /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5 py-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-success-pop bg-neutral-950 p-6 rounded-2xl border-2 border-neutral-800 shadow-2xl flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-muted uppercase block tracking-widest mb-2", children: "Amount Paid" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "font-bold text-emerald-400 dark:text-emerald-400 block whitespace-nowrap",
              style: { fontSize: seniorMode ? "46px" : "38px" },
              children: formatCurrency(paymentData.totalPaid, store || settings)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5", children: "Change Due" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-brand-400 block whitespace-nowrap", style: { fontSize: seniorMode ? "30px" : "24px" }, children: formatCurrency(paymentData.change, store || settings) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-neutral-950 p-4 rounded-2xl border-2 border-neutral-800 text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-ink-muted uppercase block tracking-wider mb-1.5", children: "Total Items" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-white block", style: { fontSize: seniorMode ? "30px" : "24px" }, children: totalItemsCount })
          ] })
        ] }),
        data.manufacturing_notifications && data.manufacturing_notifications.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-left bg-amber-500/15 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-400 flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(Package, { size: 15, className: "shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Auto-Manufacturing:" }),
            " ",
            data.manufacturing_notifications.join("\n")
          ] })
        ] })
      ] });
      if (store?.onboarding_step === "pos_tour") {
        router.post(
          route("store.onboarding.step", { store_slug: store?.slug }),
          { step: "pos_congratulations" },
          { preserveScroll: true }
        );
      } else {
        showAlert("Sale Completed!", messageElement, "success");
        const handleEnterDismiss = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setAlertState((prev) => {
              if (prev.show && prev.title === "Sale Completed!") {
                return { ...prev, show: false };
              }
              return prev;
            });
            document.removeEventListener("keydown", handleEnterDismiss);
            if (searchInputRef.current) searchInputRef.current.focus();
          }
        };
        document.addEventListener("keydown", handleEnterDismiss);
        setTimeout(() => {
          setAlertState((prev) => {
            if (prev.show && prev.title === "Sale Completed!") {
              return { ...prev, show: false };
            }
            return prev;
          });
          document.removeEventListener("keydown", handleEnterDismiss);
          if (searchInputRef.current) searchInputRef.current.focus();
        }, 3e4);
      }
    }
  };
  const searchCustomers = async (query) => {
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.customers.search", { store_slug: store?.slug }), {
          params: { search: query }
        });
        setCustomerResults(response.data || []);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Customer search error, falling back locally:", error);
      try {
        const lowerQuery = query.toLowerCase();
        const localCustomers = await db.customers.filter(
          (c) => c.name && c.name.toLowerCase().includes(lowerQuery) || c.phone && c.phone.includes(query)
        ).toArray();
        setCustomerResults(localCustomers);
      } catch (localError) {
        console.error("Local customer search failed:", localError);
        setCustomerResults([]);
      }
    }
  };
  const selectCustomer = (customer) => {
    let updates = { customer };
    if (customer.default_discount && parseFloat(customer.default_discount) > 0) {
      updates.discountType = "percentage";
      updates.discountValue = parseFloat(customer.default_discount);
      addToast(`Applied ${customer.default_discount}% Customer Discount`, "success");
    } else {
      updates.discountType = "fixed";
      updates.discountValue = 0;
    }
    updateActiveSale(updates);
    setCustomerSearchTerm("");
    setCustomerResults([]);
    setCustomerDropdownOpen(false);
  };
  useEffect(() => {
    const loadInitialCustomers = async () => {
      try {
        if (isOnline2) {
          const response = await axios.get(route("store.customers.search", { store_slug: store?.slug }), { params: { search: "" } });
          setInitialCustomers((response.data || []).slice(0, 50));
        } else {
          throw new Error("Offline");
        }
      } catch (error) {
        console.error("Failed to load initial customers, falling back locally:", error);
        try {
          const localCustomers = await db.customers.limit(50).toArray();
          setInitialCustomers(localCustomers);
        } catch (localError) {
          console.error("Local initial customers load failed:", localError);
        }
      }
    };
    loadInitialCustomers();
  }, [isOnline2]);
  const printReceipt = (type = null) => {
    const printType = type || settings?.default_print_type || "thermal";
    if (lastSale) {
      PrintService.quickPrint(lastSale, printType, settings);
    } else {
      addToast("No recent sale to print!", "warning");
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      e.target === searchInputRef.current;
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        setCustomerDropdownOpen(true);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        createNewSale();
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        closeSale(e, activeSaleId);
        return;
      }
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        const currentIndex = sales.findIndex((s) => s.id === activeSaleId);
        let nextIndex;
        if (e.shiftKey) {
          nextIndex = (currentIndex - 1 + sales.length) % sales.length;
        } else {
          nextIndex = (currentIndex + 1) % sales.length;
        }
        setActiveSaleId(sales[nextIndex].id);
        return;
      }
      const targetItem = activeSale.cart.find((i) => i.cartItemId === lastAddedItemId) || activeSale.cart[activeSale.cart.length - 1];
      if (targetItem) {
        if (e.key === "F2") {
          e.preventDefault();
          showInput(`Qty: ${targetItem.name}`, "Enter new quantity", (val) => {
            const qty = parseFloat(val);
            if (!isNaN(qty) && qty > 0) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? { ...i, qty } : i
              );
              updateActiveSale({ cart: newCart });
              addToast(`Quantity updated to ${qty}`, "success");
            }
          });
        }
        if (e.key === "F3") {
          e.preventDefault();
          const currentOriginal = targetItem.original_price || targetItem.price;
          showInput(`Discount: ${targetItem.name}`, `Enter discount amount (Max: ${currentOriginal})`, (val) => {
            const discountAmount = parseFloat(val);
            if (!isNaN(discountAmount) && discountAmount >= 0 && discountAmount <= currentOriginal) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? {
                  ...i,
                  price: currentOriginal - discountAmount,
                  discount: discountAmount,
                  original_price: currentOriginal
                } : i
              );
              updateActiveSale({ cart: newCart });
            }
          });
        }
        if (e.key === "F4") {
          e.preventDefault();
          removeFromCart(targetItem.cartItemId);
          addToast(`Removed ${targetItem.name}`, "info");
        }
        if (e.key === "F5") {
          e.preventDefault();
          showInput(`Price: ${targetItem.name}`, "Enter new unit price", (val) => {
            const newPrice = parseFloat(val);
            if (!isNaN(newPrice) && newPrice >= 0) {
              const newCart = activeSale.cart.map(
                (i) => i.cartItemId === targetItem.cartItemId ? { ...i, price: newPrice, original_price: newPrice, discount: 0 } : i
              );
              updateActiveSale({ cart: newCart });
            }
          });
        }
        if (e.key === "F6") {
          e.preventDefault();
          addToast("Change Unit feature coming soon!", "info");
        }
      }
      if (e.key === "F7") {
        e.preventDefault();
        showInput("Override Tax (%)", "Enter tax percentage", (val) => {
          const rate = parseFloat(val);
          if (!isNaN(rate)) {
            updateActiveSale({ taxRate: rate });
            addToast(`Tax rate set to ${rate}%`, "success");
          }
        });
      }
      if (e.key === "F8") {
        e.preventDefault();
        showInput("Additional Charges", "Enter charge amount", (val) => {
          const charge = parseFloat(val);
          if (!isNaN(charge)) {
            updateActiveSale({ additionalCharges: charge });
            addToast(`Additional charge of ${formatCurrency(charge, store || settings)} added`, "success");
          }
        });
      }
      if (e.key === "F9") {
        e.preventDefault();
        showInput("Apply Bill Discount", "Enter discount amount", (val) => {
          const disc = parseFloat(val);
          if (!isNaN(disc)) {
            updateActiveSale({ discount: disc });
            addToast(`Bill discount of ${formatCurrency(disc, store || settings)} applied`, "success");
          }
        });
      }
      if (e.key === "F10") {
        e.preventDefault();
        addToast("Loyalty points system not configured.", "warning");
      }
      if (e.key === "F12") {
        e.preventDefault();
        showInput("Sale Remarks", "Enter internal notes for this sale", (val) => {
          updateActiveSale({ remarks: val });
        });
      }
      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        showConfirm("Reset Tab", "This will clear all items and customer data. Continue?", () => {
          updateActiveSale({ cart: [], customer: null, discount: 0, remarks: "", additionalCharges: 0, taxRate: null });
          addToast("Tab reset successfully.", "info");
        }, true);
      }
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        showAlert("Bill Breakup", `
                    Subtotal: ${formatCurrency(subtotal, store || settings)}
                    Discount: ${formatCurrency(totalDiscounts, store || settings)}
                    Taxable: ${formatCurrency(taxableAmount, store || settings)}
                    Tax: ${formatCurrency(taxAmount, store || settings)}
                    --------------------
                    Total: ${formatCurrency(cartTotal, store || settings)}
                `, "info");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: false
          };
          processCheckout(paymentData, false);
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: true
          };
          processCheckout(paymentData, false);
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const paymentData = {
            totalPaid: cartTotal,
            change: 0,
            payments: [{ method: paymentMethod || "cash", amount: cartTotal }],
            notes: activeSale.remarks || "",
            printReceipt: printOnComplete
          };
          processCheckout(paymentData, false).then((ok) => {
            if (ok) createNewSale();
          });
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setShowQuickPartyModal(true);
      }
      if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          setLastAddedItemId(activeSale.cart[0].cartItemId);
          addToast(`Selected ${activeSale.cart[0].name}`, "info");
        }
      }
      if (e.ctrlKey && e.key === "9") {
        e.preventDefault();
        if (activeSale.cart.length > 0) {
          const lastIdx = activeSale.cart.length - 1;
          setLastAddedItemId(activeSale.cart[lastIdx].cartItemId);
          addToast(`Selected ${activeSale.cart[lastIdx].name}`, "info");
        }
      }
      if (e.key === "Escape") {
        if (activeSale.searchTerm) {
          updateActiveSale({ searchTerm: "" });
        } else {
          setSearchResults([]);
          setCustomerDropdownOpen(false);
          setParkedDropdownOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSale, sales, lastSale, lastAddedItemId, paymentMethod]);
  const loadParkedSales = async () => {
    try {
      const response = await axios.get(route("store.sales.parked", { store_slug: store?.slug }));
      setParkedSales(response.data.parked_sales || []);
    } catch (error) {
      console.error("Error loading parked sales:", error);
    }
  };
  const handleParkBill = async () => {
    if (activeSale.cart.length === 0) {
      showAlert("Empty Cart", "Cart is empty! Nothing to park.", "warning");
      return;
    }
    const processPark = async (customerName) => {
      setParkingBill(true);
      try {
        const response = await axios.post(route("store.sales.park", { store_slug: store?.slug }), {
          cart_data: activeSale.cart,
          customer_name: customerName || "Walk-in Customer"
        });
        if (response.data.success) {
          closeSale({ stopPropagation: () => {
          } }, activeSaleId);
          await loadParkedSales();
          addToast("Bill parked successfully!", "success");
        }
      } catch (error) {
        console.error("Error parking bill:", error);
        addToast("Failed to park bill: " + (error.response?.data?.message || error.message), "error");
      } finally {
        setParkingBill(false);
      }
    };
    showInput("Park Bill", "Enter customer name (optional):", processPark);
  };
  const handleRecallSale = async (parkedSaleId) => {
    try {
      const response = await axios.get(route("store.sales.recall", { store_slug: store?.slug, id: parkedSaleId }));
      if (response.data.success) {
        const parkedData = response.data.parked_sale;
        const newId = Math.max(...sales.map((s) => s.id), 1e3) + 1;
        setSales((prev) => [...prev, {
          id: newId,
          cart: parkedData.cart_data,
          cashReceived: "",
          searchTerm: "",
          customer: parkedData.customer_name ? { name: parkedData.customer_name } : null,
          parkedSaleId: parkedData.id
          // Track which parked sale this is
        }]);
        setActiveSaleId(newId);
        setParkedDropdownOpen(false);
        addToast(`Loaded parked sale for ${parkedData.customer_name}`, "success");
      }
    } catch (error) {
      if (error.response?.status === 410) {
        showAlert("Expired", "This parked sale has expired!", "error");
        loadParkedSales();
      } else {
        console.error("Error recalling sale:", error);
        addToast("Failed to recall sale: " + (error.response?.data?.message || error.message), "error");
      }
    }
  };
  const handleDeleteParked = async (parkedSaleId, e) => {
    e.stopPropagation();
    showConfirm("Delete Parked Sale", "Are you sure you want to delete this parked sale?", async () => {
      try {
        await axios.delete(route("store.sales.parked.delete", { store_slug: store?.slug, id: parkedSaleId }));
        await loadParkedSales();
        addToast("Parked sale deleted", "success");
      } catch (error) {
        console.error("Error deleting parked sale:", error);
        addToast("Failed to delete: " + (error.response?.data?.message || error.message), "error");
      }
    }, true);
  };
  const loadCategories = async () => {
    try {
      if (isOnline2) {
        const response = await axios.get(route("store.pos.categories", { store_slug: store?.slug }));
        setCategories(response.data.data || response.data || []);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Error loading categories, extracting locally:", error);
      try {
        const localProducts = await db.products.toArray();
        const categoriesMap = {};
        localProducts.forEach((p) => {
          if (p.category) {
            const catId = p.category.id || p.category_id;
            const catName = p.category.name || p.category_name || "General";
            categoriesMap[catId] = {
              id: catId,
              name: catName,
              products_count: (categoriesMap[catId]?.products_count || 0) + 1,
              product_count: (categoriesMap[catId]?.product_count || 0) + 1
            };
          }
        });
        const sorted = Object.values(categoriesMap).sort((a, b) => {
          if (a.name === "Phones") return -1;
          if (b.name === "Phones") return 1;
          return a.name.localeCompare(b.name);
        });
        setCategories(sorted);
      } catch (localError) {
        console.error("Failed to load local categories:", localError);
        setCategories([]);
      }
    }
  };
  const fetchCategoryProducts = async (catId) => {
    setIsLoadingProducts(true);
    try {
      if (isOnline2) {
        let response;
        if (catId) {
          response = await axios.get(route("store.pos.search", { store_slug: store?.slug }), {
            params: { category_id: catId, q: "" }
          });
        } else {
          response = await axios.get(route("store.pos.featured", { store_slug: store?.slug }));
        }
        const productsArray = Array.isArray(response.data) ? response.data : response.data && Array.isArray(response.data.data) ? response.data.data : [];
        setCategoryProducts(productsArray);
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      console.error("Error loading category products, falling back locally:", error);
      try {
        let localProducts = [];
        if (catId) {
          localProducts = await db.products.filter((p) => p.category_id === catId || p.category && p.category.id === catId).toArray();
        } else {
          localProducts = await db.products.limit(50).toArray();
        }
        setCategoryProducts(localProducts);
      } catch (localError) {
        console.error("Failed to load local products:", localError);
        setCategoryProducts([]);
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };
  const lookupSaleForReturn = async () => {
    if (!returnSaleRef.trim()) return;
    setReturnSaleLoading(true);
    try {
      const response = await axios.get(route("store.sales.lookup", { store_slug: store?.slug }), {
        params: { ref: returnSaleRef.trim() },
        headers: { "Accept": "application/json" }
      });
      const sale = response.data;
      if (!sale || !sale.id) {
        addToast(`Sale "${returnSaleRef}" not found.`, "error");
        setReturnSaleId(null);
        return;
      }
      if (!sale.items || sale.items.length === 0) {
        addToast("Sale found but has no items.", "error");
        setReturnSaleId(null);
        return;
      }
      setReturnSaleId(sale.id);
      const mappedCart = sale.items.map((item) => ({
        cartItemId: Date.now() + Math.random(),
        id: item.product_id,
        sale_item_id: item.id,
        name: item.product?.name || "Unknown Product",
        price: parseFloat(item.unit_price),
        qty: parseFloat(item.quantity),
        freeQuantity: parseFloat(item.free_quantity || 0),
        unit: item.product?.unit || "pcs",
        tax_rate: parseFloat(item.tax_rate || 0),
        discount: parseFloat(item.discount || 0),
        original_price: parseFloat(item.unit_price)
      }));
      updateActiveSale({ cart: mappedCart, customer: sale.customer || null });
      addToast(`Sale #${returnSaleRef} loaded for return`, "info");
    } catch (err) {
      console.error("Return lookup error:", err?.response?.status, err?.response?.data, err?.message);
      addToast("Error looking up sale: " + (err?.response?.data?.message || err?.message || "Unknown error"), "error");
      setReturnSaleId(null);
    } finally {
      setReturnSaleLoading(false);
    }
  };
  useEffect(() => {
    fetchCategoryProducts(selectedCategory);
  }, [selectedCategory, isOnline2]);
  useEffect(() => {
    const handleRefresh = () => {
      fetchCategoryProducts(selectedCategory);
    };
    window.addEventListener("amd:refresh-products", handleRefresh);
    return () => window.removeEventListener("amd:refresh-products", handleRefresh);
  }, [selectedCategory]);
  useEffect(() => {
    loadParkedSales();
    loadCategories();
  }, []);
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable);
      if (e.key === "Escape") {
        setSettingsOpen(false);
        setShowSetupWizard(false);
        setPaymentModalOpen(false);
        setShowSyncHub(false);
        setParkedDropdownOpen(false);
        setShowRecentInvoices(false);
        return;
      }
      if (!isInputFocused && e.key === "?") {
        e.preventDefault();
        setSettingsTab("keys");
        setSettingsOpen(true);
        return;
      }
      if (!isInputFocused && (e.key === "l" || e.key === "L") && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSettingsTab("layout");
        setSettingsOpen(true);
        return;
      }
      if (isInputFocused) return;
      if (e.key === "F1" || e.key === "F2") {
        e.preventDefault();
        const searchInput = document.querySelector("#tour-pos-product input");
        if (searchInput) searchInput.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
        showInput("Additional Charges", "Enter extra charge amount (e.g. 150)", (val) => {
          const charge = parseFloat(val);
          if (!isNaN(charge)) {
            updateActiveSale({ additionalCharges: charge });
            addToast(`Additional charge of ${formatCurrency(charge, store || settings)} added`, "success");
          }
        });
      } else if (e.key === "F9") {
        e.preventDefault();
        showInput("Document Discount", "Enter fixed discount amount", (val) => {
          const disc = parseFloat(val);
          if (!isNaN(disc)) {
            updateActiveSale({ discountType: "fixed", discountValue: disc });
            addToast(`Document discount of ${formatCurrency(disc, store || settings)} applied`, "success");
          }
        });
      } else if (e.key === "F10") {
        e.preventDefault();
        if (activeSale.cart.length > 0 && !processingPayment) {
          handleCheckoutClick();
        }
      } else if (e.key === "F11") {
        e.preventDefault();
        setShowQuickPartyModal(true);
      } else if (e.key === "F12") {
        e.preventDefault();
        showInput("Sale Remarks / Notes", "Enter notes for this sale", (val) => {
          updateActiveSale({ remarks: val, notes: val });
          addToast("Sale remarks saved", "success");
        });
      } else if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeSale.cart.length > 0) handleParkBill();
      } else if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        createNewSale();
      } else if (e.ctrlKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (sales.length > 1) {
          setSales((prev) => prev.filter((s) => s.id !== activeSaleId));
        }
      } else if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const searchInput = document.querySelector("#tour-pos-product input");
        if (searchInput) searchInput.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeSale, activeSaleId, sales, store, settings]);
  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTo({
        top: cartListRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [activeSale.cart.length]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parkedDropdownRef.current && !parkedDropdownRef.current.contains(event.target)) {
        setParkedDropdownOpen(false);
      }
      if (recentDropdownRef.current && !recentDropdownRef.current.contains(event.target)) {
        setShowRecentInvoices(false);
      }
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target)) {
        setWarehouseDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const getTimeRemaining = (expiresAt) => {
    const now = /* @__PURE__ */ new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1e3 * 60 * 60));
    const minutes = Math.floor(diffMs % (1e3 * 60 * 60) / (1e3 * 60));
    return `${hours}h ${minutes}m`;
  };
  useEffect(() => {
    if (autoFillCash && paymentMethod === "cash" && activeSale.cart.length > 0) {
      updateActiveSale({ cashReceived: cartTotal });
    }
  }, [cartTotal, paymentMethod, autoFillCash]);
  const money = (v) => formatCurrency(v, store || settings);
  const scanBarPref = composition?.scanBar || "auto";
  const catalogIsColumnPane = !!(layout.catalog && (layout.catalog.mode === "left" || layout.catalog.mode === "right"));
  const catalogHostsScan = scanBarPref === "catalog" || scanBarPref === "auto" && catalogIsColumnPane;
  const cartQty = activeSale.cart.reduce((sum, item) => sum + item.qty + (item.freeQuantity || 0), 0);
  const renderScan = () => /* @__PURE__ */ jsxs("div", { className: "vq-pane-fixed flex items-center gap-2.5 px-4 py-3 border-b border-line/80 bg-surface shadow-xs", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          setSearchQueryForProduct(activeSale.searchTerm);
          setShowProductModal(true);
        },
        className: "h-11 px-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center gap-1.5 font-bold text-xs transition-all shadow-xs hover:shadow-sm hover:-translate-y-0.5 shrink-0 cursor-pointer",
        title: "Create a product without leaving the register",
        children: [
          /* @__PURE__ */ jsx(PackagePlus, { size: 17, className: "text-brand-600 dark:text-brand-400" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "+ Item" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { id: "tour-pos-product", className: "flex-1 relative min-w-0", children: [
      (() => {
        const hasBarcodes = !Array.isArray(modules) || modules.includes("barcodes_labels");
        return /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            AsyncProductCombobox,
            {
              defaultOptions: categoryProducts,
              value: activeSale.searchTerm,
              onQueryChange: (val) => updateActiveSale({ searchTerm: val }),
              onSelect: (product) => handleProductSelect(product),
              placeholder: hasBarcodes ? "Scan barcode or search item by name / SKU… [F2]" : "Search item by name / SKU… [F2]",
              onKeyDown: handleSearchInputKeyDown,
              inputClassName: `${hasBarcodes ? "!pl-12" : "!pl-4"} !pr-11 font-bold h-11 text-sm bg-sunken/60 focus:bg-surface rounded-xl border-line/90 focus:border-brand-500 shadow-none focus:ring-4 focus:ring-brand-500/15 transition-all`,
              onCreateNew: () => {
                setSearchQueryForProduct(activeSale.searchTerm);
                setShowProductModal(true);
              },
              hideCostAndMargin: true,
              hideSearchIcon: true
            }
          ),
          hasBarcodes && /* @__PURE__ */ jsx("div", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10 flex items-center gap-1", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 20, className: "text-brand-600 dark:text-brand-400" }) })
        ] });
      })(),
      /* @__PURE__ */ jsx("div", { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10 flex items-center", children: /* @__PURE__ */ jsx(Search, { size: 18 }) })
    ] })
  ] });
  const renderCategoryStrip = () => /* @__PURE__ */ jsxs("div", { className: "vq-pane-fixed flex items-center gap-2 px-3 py-2 border-b border-line bg-surface", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => scrollCategories("left"),
        className: "w-7 h-7 rounded-lg hover:bg-interactive-hover text-ink-muted hover:text-ink flex items-center justify-center shrink-0 border border-line/80 transition-all cursor-pointer",
        "aria-label": "Scroll categories left",
        children: /* @__PURE__ */ jsx(ChevronLeft, { size: 15 })
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: categoryScrollRef,
        onWheel: handleCategoryWheel,
        className: "flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-0.5 min-w-0",
        style: { msOverflowStyle: "none", scrollbarWidth: "none" },
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedCategory(null),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border cursor-pointer ${selectedCategory === null ? "bg-brand-600 text-white border-brand-600 shadow-sm" : "bg-app text-ink-secondary border-line hover:bg-interactive-hover hover:border-line-strong"}`,
              children: "All Items"
            }
          ),
          categories.filter((cat2) => cat2.products_count > 0 || cat2.product_count > 0).map((cat2) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSelectedCategory(cat2.id),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border flex items-center gap-2 max-w-[200px] cursor-pointer ${selectedCategory === cat2.id ? "bg-brand-600 text-white border-brand-600 shadow-sm" : "bg-app text-ink-secondary border-line hover:bg-interactive-hover hover:border-line-strong"}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "vq-clip min-w-0", children: cat2.name }),
                /* @__PURE__ */ jsx("span", { className: `vq-num text-2xs px-1.5 py-0.5 rounded-md font-bold shrink-0 leading-none ${selectedCategory === cat2.id ? "bg-white/25 text-white" : "bg-surface text-ink-muted border border-line/50"}`, children: cat2.products_count ?? cat2.product_count ?? 0 })
              ]
            },
            cat2.id
          ))
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => scrollCategories("right"),
        className: "w-7 h-7 rounded-lg hover:bg-interactive-hover text-ink-muted hover:text-ink flex items-center justify-center shrink-0 border border-line/80 transition-all cursor-pointer",
        "aria-label": "Scroll categories right",
        children: /* @__PURE__ */ jsx(ChevronRight, { size: 15 })
      }
    )
  ] });
  const pickProduct = (product) => {
    if (returnMode && posReturnMode !== "open") {
      addToast("In Return Mode, use the reference number to load items.", "error");
      return;
    }
    handleProductSelect(product);
  };
  const renderProductRow = (product) => /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => pickProduct(product),
      className: "w-full bg-surface rounded-xl border border-line hover:border-brand-500 transition-all shadow-sm text-left flex items-center justify-between p-2.5 gap-3 relative overflow-hidden cursor-pointer group",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-sunken flex items-center justify-center overflow-hidden shrink-0 border border-line/60", children: product.image_url || product.image_path ? /* @__PURE__ */ jsx("img", { src: product.image_url || product.image_path, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Package, { className: "text-ink-muted", size: 19 }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("h4", { className: "vq-clip-2 font-bold text-ink leading-snug text-xs sm:text-sm group-hover:text-brand-600 transition-colors", children: product.name }),
            /* @__PURE__ */ jsx("span", { className: "vq-clip text-3xs text-ink-muted font-bold uppercase tracking-wider block mt-0.5", children: product.category?.name || product.category_name || "General" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 flex items-center gap-3", children: [
          product.type === "service" || product.is_service || product.item_type === "service" ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5", children: "Type" }),
            /* @__PURE__ */ jsx("span", { className: "vq-num text-xs font-bold leading-none text-brand-600 dark:text-brand-400", children: tt("Service") })
          ] }) : /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5", children: "Stock" }),
            /* @__PURE__ */ jsx("span", { className: `vq-num text-xs font-bold leading-none ${product.stock_quantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`, children: formatNumber(product.stock_quantity || 0, 0) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-4xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-0.5", children: "Price" }),
            /* @__PURE__ */ jsx("span", { className: "vq-num font-bold text-brand-600 dark:text-brand-400 block leading-none text-xs sm:text-sm", children: money(product.price || product.selling_price || 0) })
          ] })
        ] }),
        product.variants && product.variants.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" })
      ]
    },
    product.id
  );
  const renderProductPill = (product) => {
    const inCart = inCartQty.get(product.id) || 0;
    const isService = product.type === "service" || product.is_service || product.item_type === "service";
    const stock = product.stock_quantity;
    const out = !isService && stock !== void 0 && Number(stock) <= 0;
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => pickProduct(product),
        "data-incart": inCart > 0 ? "1" : "0",
        "data-out": out ? "1" : "0",
        className: "vq-pill",
        title: `${product.name}${out ? " — out of stock" : ""}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "vq-pill-name vq-clip", children: product.name }),
          /* @__PURE__ */ jsx("span", { className: "vq-num vq-pill-price", children: money(product.price || product.selling_price || 0) }),
          inCart > 0 && /* @__PURE__ */ jsx("span", { className: "vq-pill-n vq-num", "aria-label": `${inCart} in the current order`, children: inCart })
        ]
      },
      product.id
    );
  };
  const inCartQty = React.useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const l of activeSale.cart || []) {
      m.set(l.id, (m.get(l.id) || 0) + Number(l.qty || 0));
    }
    return m;
  }, [activeSale.cart]);
  const renderProductTile = (product) => {
    const inCart = inCartQty.get(product.id) || 0;
    const isService = product.type === "service" || product.is_service || product.item_type === "service";
    const stock = product.stock_quantity;
    const out = !isService && stock !== void 0 && Number(stock) <= 0;
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => pickProduct(product),
        "data-incart": inCart > 0 ? "1" : "0",
        className: "vq-tile group",
        title: product.name,
        children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-tile-top", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile-thumb", children: product.image_url || product.image_path ? /* @__PURE__ */ jsx("img", { src: product.image_url || product.image_path, alt: "", loading: "lazy" }) : /* @__PURE__ */ jsx(Package, { size: 16, strokeWidth: 2 }) }),
            /* @__PURE__ */ jsxs("span", { className: "vq-tile-id", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile-name vq-clip-2", children: product.name }),
              /* @__PURE__ */ jsx("span", { className: "vq-tile-meta vq-clip", children: product.category?.name || product.category_name || product.sku || "" })
            ] }),
            product.variants && product.variants.length > 0 && /* @__PURE__ */ jsx("span", { className: "vq-tile-dot", title: "Has variants" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-tile-foot", children: [
            /* @__PURE__ */ jsx("span", { className: `vq-tile-stock${out ? " is-out" : ""}`, children: isService ? tt("Service") : stock !== void 0 ? `${formatNumber(stock || 0, 0)} left` : "" }),
            /* @__PURE__ */ jsx("span", { className: "vq-num vq-tile-price", children: money(product.price || product.selling_price || 0) })
          ] }),
          inCart > 0 && /* @__PURE__ */ jsx("span", { className: "vq-tile-badge vq-num", "aria-label": `${inCart} in the current order`, children: formatNumber(inCart, 0) })
        ]
      },
      product.id
    );
  };
  const renderCatalogBody = ({ variant = "list", tiles = 0 } = {}) => {
    const shape = composition?.catalogShape || "auto";
    const asPills = shape === "pills";
    const asTiles = shape === "cards" ? true : shape === "rows" || asPills ? false : variant !== "list" || tiles > 0;
    const cols = tiles || (variant === "grid-3up" ? 3 : 2);
    if (isLoadingProducts) {
      if (asTiles) {
        return /* @__PURE__ */ jsx("div", { className: "vq-tiles p-3", style: { "--vq-tiles": cols }, children: Array.from({ length: cols * 3 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-xl p-3 flex flex-col gap-2", style: { minHeight: 76 }, "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-sunken shrink-0 animate-pulse" }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1.5 pt-0.5", children: [
              /* @__PURE__ */ jsx("div", { className: "h-2.5 rounded-full bg-sunken animate-pulse", style: { width: "85%" } }),
              /* @__PURE__ */ jsx("div", { className: "h-2 rounded-full bg-sunken animate-pulse", style: { width: "55%" } })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-line/50", children: [
            /* @__PURE__ */ jsx("div", { className: "h-2 w-10 rounded-full bg-sunken animate-pulse" }),
            /* @__PURE__ */ jsx("div", { className: "h-4 w-12 rounded-md bg-sunken animate-pulse" })
          ] })
        ] }, i)) });
      }
      return /* @__PURE__ */ jsx("div", { className: "p-3 space-y-2", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-xl p-2.5 flex items-center gap-3", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-sunken shrink-0 animate-pulse" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "h-3 rounded-full bg-sunken animate-pulse", style: { width: `${62 - i % 3 * 8}%` } }),
          /* @__PURE__ */ jsx("div", { className: "h-2.5 rounded-full bg-sunken animate-pulse", style: { width: "30%" } })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-5 w-16 rounded-lg bg-sunken shrink-0 animate-pulse" })
      ] }, i)) });
    }
    if (selectedCategory && categoryProducts.length === 0) {
      return /* @__PURE__ */ jsxs("div", { className: "py-16 text-center", children: [
        /* @__PURE__ */ jsx(Archive, { className: "mx-auto text-ink-muted opacity-40 mb-4", size: 44 }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-bold", children: "No products in this category" })
      ] });
    }
    if (!selectedCategory && categoryProducts.length === 0) {
      return /* @__PURE__ */ jsxs("div", { className: "py-16 flex flex-col items-center justify-center text-ink-muted gap-4 opacity-60", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-lg bg-sunken flex items-center justify-center", children: /* @__PURE__ */ jsx(Search, { size: 28 }) }),
        /* @__PURE__ */ jsxs("div", { className: "text-center px-4", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary", style: { fontSize: "var(--vq-t-lg)" }, children: "Start selling" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Scan an item, or pick a category" })
        ] })
      ] });
    }
    if (asPills) {
      return /* @__PURE__ */ jsx("div", { className: "vq-pills p-3", children: (Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductPill) });
    }
    if (asTiles) {
      return /* @__PURE__ */ jsx("div", { className: "vq-tiles p-3", style: { "--vq-tiles": cols }, children: (Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductTile) });
    }
    return /* @__PURE__ */ jsx("div", { className: "p-3 space-y-2", children: (Array.isArray(categoryProducts) ? categoryProducts : []).map(renderProductRow) });
  };
  const renderSplit = (key, edge, offsetPx) => {
    const live = dragInfo && dragInfo.key === key;
    const b = SPLIT_BOUNDS[key] || { min: 0, max: 0.55 };
    const pct = Math.round(shareOf(key) * 100);
    const name = key === "catalog" ? "Catalog" : "Payment";
    return /* @__PURE__ */ jsx(
      "div",
      {
        role: "separator",
        tabIndex: 0,
        "aria-orientation": "vertical",
        "aria-label": `${name} column width`,
        "aria-valuemin": Math.round(b.min * 100),
        "aria-valuemax": Math.round(b.max * 100),
        "aria-valuenow": pct,
        "aria-valuetext": `${name} column ${pct} percent, ${Math.round(pxOf(key))} pixels`,
        className: "vq-split",
        "data-dragging": dragging === key ? "1" : "0",
        "data-atfloor": live && dragInfo.atFloor ? "1" : "0",
        onPointerDown: startSplitDrag(key, edge),
        onKeyDown: onSplitKeyDown(key, edge),
        onDoubleClick: resetSplit(key),
        title: `Drag, or focus and use ← →. Double-click to reset. Stops at this pane's floor.`,
        style: { [edge]: `${offsetPx - 7}px` },
        children: live && /* @__PURE__ */ jsxs("span", { className: "vq-split-readout", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxs("b", { children: [
            dragInfo.pct,
            "%"
          ] }),
          " · ",
          dragInfo.px,
          "px",
          dragInfo.atFloor ? " · at its floor" : ""
        ] })
      }
    );
  };
  const CAT_STRIP_H = 46;
  const BAND_MAX_ROWS = 3;
  const startBandDrag = (edge) => (e) => {
    if (e.button !== void 0 && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const host = termRef.current;
    if (!host) return;
    const startY = e.clientY;
    const startRows = Math.max(1, comp0Rows());
    setDragging("band");
    host.setAttribute("data-resizing-y", "1");
    const onMove = (ev) => {
      const dy = edge === "bottom" ? startY - ev.clientY : ev.clientY - startY;
      const next = Math.max(1, Math.min(BAND_MAX_ROWS, startRows + Math.round(dy / 152)));
      if (next !== (composition?.catalog?.rows ?? 1)) {
        updateComposition((prev) => ({ ...prev, catalog: { ...prev.catalog, rows: next } }));
      }
      setDragInfo({ key: "band", rows: next, atFloor: next === 1 || next === BAND_MAX_ROWS });
    };
    const onUp = () => {
      setDragging(null);
      setDragInfo(null);
      host.removeAttribute("data-resizing-y");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };
  const comp0Rows = () => composition?.catalog?.rows ?? 1;
  const setBandRows = (n) => updateComposition((prev) => ({
    ...prev,
    catalog: { ...prev.catalog, rows: Math.max(1, Math.min(BAND_MAX_ROWS, n)) }
  }));
  const onBandKeyDown = (edge) => (e) => {
    const grow = edge === "bottom" ? "ArrowUp" : "ArrowDown";
    const shrink = edge === "bottom" ? "ArrowDown" : "ArrowUp";
    let next = null;
    if (e.key === grow) next = comp0Rows() + 1;
    else if (e.key === shrink) next = comp0Rows() - 1;
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = BAND_MAX_ROWS;
    else return;
    e.preventDefault();
    setBandRows(next);
    const shown = Math.max(1, Math.min(BAND_MAX_ROWS, next));
    setDragInfo({ key: "band", rows: shown, atFloor: shown === 1 || shown === BAND_MAX_ROWS });
    clearTimeout(splitReadoutTimer.current);
    splitReadoutTimer.current = setTimeout(() => setDragInfo(null), 1400);
  };
  const renderBandGrip = (edge) => {
    const live = dragInfo && dragInfo.key === "band";
    const rows = comp0Rows();
    return /* @__PURE__ */ jsx(
      "div",
      {
        role: "separator",
        tabIndex: 0,
        "aria-orientation": "horizontal",
        "aria-label": "Catalog strip height, in tile rows",
        "aria-valuemin": 1,
        "aria-valuemax": BAND_MAX_ROWS,
        "aria-valuenow": rows,
        "aria-valuetext": `${rows} tile row${rows === 1 ? "" : "s"}`,
        className: "vq-split-y",
        "data-dragging": dragging === "band" ? "1" : "0",
        "data-atfloor": live && dragInfo.atFloor ? "1" : "0",
        onPointerDown: startBandDrag(edge),
        onKeyDown: onBandKeyDown(edge),
        onDoubleClick: () => {
          setBandRows(1);
          addToast("Catalog strip reset to one row", "info");
        },
        title: "Drag to add or remove a tile row. Double-click for one row.",
        style: { [edge === "bottom" ? "bottom" : "top"]: `${bandOuterH() + GUTTER / 2 - 7}px` },
        children: live && /* @__PURE__ */ jsxs("span", { className: "vq-split-readout", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx("b", { children: dragInfo.rows }),
          " row",
          dragInfo.rows === 1 ? "" : "s"
        ] })
      }
    );
  };
  const renderCatalogBand = () => {
    const rows = Math.max(1, cat?.rows || 1);
    const tilesH = rows * 152 + (rows - 1) * GUTTER;
    return /* @__PURE__ */ jsxs(
      "section",
      {
        className: "vq-pane vq-catband bg-surface border border-line shrink-0",
        "data-pane": "catalog-band",
        style: { height: tilesH + CAT_STRIP_H },
        children: [
          renderCategoryStrip(),
          /* @__PURE__ */ jsx("div", { className: "vq-pane-body", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: composition?.catalogShape === "pills" ? "vq-pills-band" : "vq-tiles-band",
              "data-rows": rows,
              children: (Array.isArray(categoryProducts) ? categoryProducts : []).map(composition?.catalogShape === "pills" ? renderProductPill : renderProductTile)
            }
          ) })
        ]
      }
    );
  };
  const bandOuterH = () => {
    const rows = Math.max(1, cat?.rows || 1);
    return rows * 152 + (rows - 1) * GUTTER + CAT_STRIP_H;
  };
  const renderCatalogPane = (fit, tiles) => /* @__PURE__ */ jsxs("section", { className: "vq-pane bg-surface border border-line", "data-pane": "catalog", children: [
    /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
      /* @__PURE__ */ jsx("span", { children: "Catalog" }),
      /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: [
        categoryProducts.length,
        " items"
      ] })
    ] }),
    catalogHostsScan && renderScan(),
    renderCategoryStrip(),
    /* @__PURE__ */ jsx("div", { className: "vq-pane-body bg-app", children: renderCatalogBody({ variant: fit, tiles: fit === "list" ? 0 : tiles }) })
  ] });
  const renderCartLine = (item, index) => /* @__PURE__ */ jsxs("div", { className: "vq-line bg-surface border border-line hover:border-brand-300 shadow-xs hover:shadow-md group transition-all py-3", children: [
    /* @__PURE__ */ jsx("span", { className: "vq-line-idx vq-num text-xs sm:text-sm font-bold text-brand-800 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/50 rounded-xl w-8 h-8 flex items-center justify-center shrink-0 border border-brand-200/60 font-mono", children: index + 1 }),
    /* @__PURE__ */ jsxs("div", { className: "vq-line-name-cell min-w-0 flex flex-col justify-center", children: [
      /* @__PURE__ */ jsxs("h4", { className: "vq-clip-2 font-bold text-ink text-sm sm:text-base leading-snug", children: [
        item.name,
        tableMode && item.sent && !item.paidSaleId && /* @__PURE__ */ jsx("span", { className: "vqt-line-sent", children: "sent" }),
        tableMode && item.paidSaleId && /* @__PURE__ */ jsx("span", { className: "vqt-line-sent vqt-line-paid", children: "paid" })
      ] }),
      tableMode && Array.isArray(item.mods) && item.mods.length > 0 && /* @__PURE__ */ jsx("span", { className: "vqt-line-mods", children: item.mods.map((m) => m.name).join(" · ") }),
      tableMode && item.notes && /* @__PURE__ */ jsx("span", { className: "vqt-line-mods", children: /* @__PURE__ */ jsxs("i", { children: [
        "“",
        item.notes,
        "”"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: item.category || "General" }),
        (item.barcode || item.sku) && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold bg-sunken/80 px-2 py-0.5 rounded-md text-ink-secondary border border-line/60", children: item.barcode || item.sku }),
        item.qty > item.stock && /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-red-600 bg-red-100 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 rounded-md inline-flex items-center", children: [
          "Over stock (",
          item.stock,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vq-line-price-inline vq-num text-xs font-bold text-brand-600 dark:text-brand-400", children: [
          money(item.price),
          " each"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-line-price flex flex-col items-end shrink-0 justify-center", children: [
      hasPriceOverridePerm ? (
        /* The unit price, edited in place. It used to be a button
            that opened a discount modal -- which meant overriding a
            rate, the single most common counter negotiation, cost
            two dialogs. Typing here writes the rate directly and
            the discount is derived from the original. */
        /* @__PURE__ */ jsxs("span", { className: "flex flex-col items-end", children: [
          item.discount > 0 && /* @__PURE__ */ jsx("span", { className: "line-through text-2xs text-ink-muted opacity-70", children: money(item.original_price) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputMode: "decimal",
              value: priceDraft?.id === item.cartItemId ? priceDraft.value : String(item.price),
              onFocus: (e) => {
                setPriceDraft({ id: item.cartItemId, value: String(item.price) });
                e.target.select();
              },
              onChange: (e) => setPriceDraft({ id: item.cartItemId, value: e.target.value.replace(/[^\d.]/g, "") }),
              onBlur: () => commitPrice(item),
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  setPriceDraft(null);
                  e.currentTarget.blur();
                }
              },
              "aria-label": `Unit price of ${item.name}`,
              title: "Type a new unit price",
              className: "vq-num vq-line-rate w-24 text-right text-xs sm:text-sm font-bold\n                                       text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40\n                                       border border-brand-200/80 dark:border-brand-800 px-2.5 py-1.5 rounded-xl\n                                       focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            }
          )
        ] })
      ) : hasDiscountPerm ? /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => openItemDiscountModal(item),
          title: "Click to edit line discount",
          className: "vq-num text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800 px-3 py-1.5 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-all flex flex-col items-end cursor-pointer shadow-xs",
          children: item.discount > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "line-through text-2xs text-ink-muted opacity-70", children: money(item.original_price) }),
            /* @__PURE__ */ jsx("span", { children: money(item.price) })
          ] }) : money(item.price)
        }
      ) : /* @__PURE__ */ jsx("span", { className: "vq-num text-xs sm:text-sm font-bold text-ink px-3 py-1.5 rounded-xl bg-sunken border border-line", children: money(item.price) }),
      item.discount > 0 && /* @__PURE__ */ jsxs("span", { className: "vq-num text-2xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5", children: [
        "−",
        money(item.discount)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-line-ctl flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => openConverterModal(item),
          title: "Edit price, quantity or rate",
          className: "w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 flex items-center justify-center transition-all cursor-pointer shadow-xs",
          children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 16, strokeWidth: 2.5 })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-sunken/80 rounded-xl border border-line/80 overflow-hidden p-0.5 shadow-xs", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateQty(item.cartItemId, -1),
            className: "w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface text-ink-secondary hover:text-ink transition-all cursor-pointer",
            "aria-label": "Decrease quantity",
            children: /* @__PURE__ */ jsx(MinusCircle, { size: 17 })
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            inputMode: "decimal",
            value: qtyDraft?.id === item.cartItemId ? qtyDraft.value : String(item.qty),
            onFocus: (e) => {
              setQtyDraft({ id: item.cartItemId, value: String(item.qty) });
              e.target.select();
            },
            onChange: (e) => setQtyDraft({ id: item.cartItemId, value: e.target.value.replace(/[^\d.]/g, "") }),
            onBlur: () => commitQty(item),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                setQtyDraft(null);
                e.currentTarget.blur();
              }
            },
            "aria-label": `Quantity of ${item.name}`,
            className: "vq-num vq-line-qty w-12 text-center font-bold text-ink text-sm sm:text-base\n                                   bg-transparent border-0 rounded-lg focus:outline-none\n                                   focus:bg-surface focus:ring-2 focus:ring-brand-500/40"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateQty(item.cartItemId, 1),
            className: "w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface text-ink-secondary hover:text-ink transition-all cursor-pointer",
            "aria-label": "Increase quantity",
            children: /* @__PURE__ */ jsx(PlusCircle, { size: 17 })
          }
        )
      ] }),
      hasDiscountPerm && enableFreeQty && showFreeQty && /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-emerald-50 dark:bg-emerald-900/20 p-0.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateFreeQty(item.cartItemId, -1),
            className: "w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer",
            "aria-label": "Decrease free quantity",
            children: /* @__PURE__ */ jsx(MinusCircle, { size: 15 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center w-10 leading-none shrink-0", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-num font-bold text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap", children: item.freeQuantity || 0 }),
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-emerald-500 uppercase whitespace-nowrap", children: "Free" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateFreeQty(item.cartItemId, 1),
            className: "w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer",
            "aria-label": "Increase free quantity",
            children: /* @__PURE__ */ jsx(PlusCircle, { size: 15 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-line-total text-right shrink-0 min-w-[85px]", children: [
      /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider block leading-none mb-1", children: "Total" }),
      /* @__PURE__ */ jsx("span", { className: "vq-num font-bold text-ink block leading-tight text-base sm:text-lg", children: money(item.price * item.qty) }),
      showMargin && item.cost_price > 0 && /* @__PURE__ */ jsxs("span", { className: "vq-num text-2xs font-bold text-emerald-600 dark:text-emerald-400 block leading-none mt-1", children: [
        "Margin ",
        Math.round((item.price - item.cost_price) / item.price * 100),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => removeFromCart(item.cartItemId),
        className: "vq-line-del w-9 h-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-ink-muted hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer",
        "aria-label": "Remove item",
        children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
      }
    )
  ] }, item.cartItemId);
  const renderReturnBanner = () => /* @__PURE__ */ jsxs("div", { className: "vq-pane-fixed mx-3 mt-2 mb-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-red-500 mb-2 uppercase tracking-wider", children: "Return mode active" }),
    /* @__PURE__ */ jsx("p", { className: "text-3xs text-red-400 mb-2", children: posReturnMode === "open" ? "Add items to return. A reference number is optional and links the refund to the original sale." : posReturnMode === "customer_or_reference" ? "Search by customer, or enter a reference number." : "Enter the original sale reference number to load its items." }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: returnSaleRef,
          onChange: (e) => setReturnSaleRef(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && (posReturnMode !== "open" || returnSaleRef.trim()) && lookupSaleForReturn(),
          placeholder: posReturnMode === "open" ? "Reference number (optional)…" : "Reference number…",
          className: "flex-1 min-w-0 px-3 text-xs bg-surface border border-line rounded-lg text-ink placeholder:text-ink-muted outline-none focus:border-red-400"
        }
      ),
      (posReturnMode !== "open" || returnSaleRef.trim()) && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: lookupSaleForReturn,
          disabled: returnSaleLoading,
          className: "px-4 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 shrink-0 cursor-pointer",
          children: returnSaleLoading ? "…" : "Load"
        }
      )
    ] })
  ] });
  const renderCartPane = () => /* @__PURE__ */ jsxs(
    "section",
    {
      className: "vq-pane bg-surface border border-line/80 shadow-md",
      "data-pane": "cart",
      "data-underflow": layout.cart.underflow ? "1" : "0",
      style: { "--vq-pane-min": `${Math.round(layout.cart.minWidth)}px` },
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
          /* @__PURE__ */ jsx(ShoppingCart, { size: 15, className: "text-brand-600" }),
          /* @__PURE__ */ jsx("span", { children: returnMode ? "Return" : "Current order" }),
          hasDiscountPerm && enableFreeQty && /* @__PURE__ */ jsxs("label", { className: "ml-3 flex items-center gap-1.5 cursor-pointer select-none normal-case tracking-normal", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: showFreeQty,
                onChange: (e) => setShowFreeQty(e.target.checked),
                className: "sr-only"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: `w-8 h-4 rounded-full transition-colors relative shrink-0 ${showFreeQty ? "bg-emerald-500" : "bg-line"}`, children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showFreeQty ? "left-4" : "left-0.5"}` }) }),
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold", children: "Free qty" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: [
            activeSale.cart.length,
            " lines · ",
            cartQty,
            " qty"
          ] }),
          renderPaneTriggers()
        ] }),
        tableMode && selectedTable && /* @__PURE__ */ jsx(
          TableBar,
          {
            table: selectedTable,
            covers: tableCovers,
            orderType: tableOrderType,
            unsent: activeSale.cart.filter((l) => !l.sent).length,
            elapsedLabel: elapsed(selectedTable.opened_at),
            onBack: backToFloor,
            onCovers: setCovers,
            onOrderType: setOrderType,
            onFire: fireToKitchen,
            onBill: dropCheck,
            checkDropped: !!selectedTable.check_dropped_at,
            onSplit: () => setSplitOpen(true),
            onMove: () => setMovingTable(true),
            onClose: closeSelectedTable,
            busy: tables.busy,
            compact: layout.cart && layout.cart.px < 460
          }
        ),
        !catalogHostsScan && renderScan(),
        returnMode && renderReturnBanner(),
        /* @__PURE__ */ jsxs("div", { ref: cartListRef, className: "vq-pane-body vq-cart-lines p-3 space-y-2", children: [
          activeSale.cart.map(renderCartLine),
          activeSale.cart.length === 0 && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center p-8 select-none", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 shadow-sm", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 32, strokeWidth: 1.75 }) }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-base sm:text-lg mb-1", children: tableMode && !selectedTable ? "Pick a table to start" : "Scan Barcode or Search Item" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted max-w-sm mb-6 leading-relaxed", children: "Point your handheld barcode scanner or type a product name, SKU, or batch number to start this order." }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2 max-w-md", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs", children: [
                /* @__PURE__ */ jsx("kbd", { className: "font-mono text-ink font-bold", children: "F2" }),
                " Focus Barcode"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs", children: [
                /* @__PURE__ */ jsx("kbd", { className: "font-mono text-ink font-bold", children: "Ctrl+T" }),
                " New Tab"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs", children: [
                /* @__PURE__ */ jsx("kbd", { className: "font-mono text-ink font-bold", children: "Ctrl+D" }),
                " Open Drawer"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-ink-muted bg-surface border border-line px-2.5 py-1 rounded-lg shadow-xs", children: [
                /* @__PURE__ */ jsx("kbd", { className: "font-mono text-ink font-bold", children: "Esc" }),
                " Cancel"
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
  const renderTenderFields = () => /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { id: "tour-pos-customer", className: "relative z-sticky", children: customerDropdownOpen ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(
        AsyncPartyCombobox,
        {
          defaultOptions: initialCustomers,
          selectedItem: activeSale.customer,
          onSelect: (customer) => {
            selectCustomer(customer);
            setCustomerDropdownOpen(false);
          },
          inputClassName: "bg-surface border-line text-ink shadow-sm !pl-10 !pr-10 rounded-xl font-bold text-sm h-12",
          placeholder: `Search ${t("customer", "customer").toLowerCase()} (name, phone)…`,
          onQueryChange: (val) => setCustomerSearchTerm(val),
          onCreateNew: () => setShowQuickPartyModal(true),
          addNewLabel: `Add new ${t("customer", "customer").toLowerCase()}`,
          type: "customer",
          onEdit: (customer) => {
            setEditingCustomer(customer);
            setShowQuickPartyModal(true);
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setCustomerDropdownOpen(false),
          className: "absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink w-8 h-8 flex items-center justify-center rounded-lg hover:bg-interactive-hover transition-colors cursor-pointer",
          "aria-label": `Close ${t("customer", "customer").toLowerCase()} search`,
          children: /* @__PURE__ */ jsx(X, { size: 18 })
        }
      )
    ] }) : /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setCustomerDropdownOpen(true),
        className: "w-full bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex items-center justify-between gap-3 group cursor-pointer",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-teal-50 dark:from-brand-950/60 dark:to-teal-950/40 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-base shadow-xs shrink-0", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs uppercase font-bold text-ink-muted block leading-none mb-1 tracking-wider", children: t("customer", "Customer") }),
              /* @__PURE__ */ jsx("span", { className: "vq-clip font-bold text-ink text-base sm:text-lg block", children: activeSale.customer?.name || `Walk-in ${t("customer", "customer").toLowerCase()}` })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Search, { size: 18, className: "text-ink-muted group-hover:text-brand-600 transition-colors shrink-0" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
      hasDiscountPerm && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setGlobalDiscountModal({
            show: true,
            type: activeSale.discountType || "fixed",
            value: activeSale.discountValue ? String(activeSale.discountValue) : ""
          }),
          className: "bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex flex-col justify-center cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs uppercase font-bold text-ink-muted block mb-1 tracking-wider", children: "Bill Discount" }),
            /* @__PURE__ */ jsx("span", { className: "vq-clip vq-num text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400", children: activeSale.discountType === "percentage" ? `${activeSale.discountValue}% (${money(globalDiscount)})` : money(globalDiscount) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setPaymentDropdownOpen(!paymentDropdownOpen),
            className: "w-full h-full bg-surface p-4 rounded-2xl text-left hover:border-brand-300 hover:shadow-sm transition-all border border-line/80 shadow-xs flex flex-col justify-center cursor-pointer",
            children: [
              /* @__PURE__ */ jsx("span", { className: "flex items-center justify-between gap-2 mb-1", children: /* @__PURE__ */ jsx("span", { className: "text-xs uppercase font-bold text-ink-muted tracking-wider", children: "Payment Method" }) }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 min-w-0", children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 16, className: "text-brand-600 dark:text-brand-400 shrink-0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-clip text-sm sm:text-base font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded-md uppercase", children: paymentMethod })
              ] })
            ]
          }
        ),
        paymentDropdownOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-1 w-48 bg-surface rounded-[14px] shadow-2xl border border-line overflow-hidden z-sticky py-1", children: [
          ["cash", "credit", "bank", "card", "online"].map((method) => {
            if (method === "credit" && (!activeSale.customer || !modulesEnabled.has("khata_credit"))) return null;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  setPaymentMethod(method);
                  setPaymentDropdownOpen(false);
                },
                className: `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold capitalize hover:bg-interactive-hover transition-colors cursor-pointer flex items-center justify-between ${paymentMethod === method ? "text-brand-600 bg-brand-50 dark:bg-brand-950/30" : "text-ink-secondary"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { children: method }),
                  paymentMethod === method && /* @__PURE__ */ jsx(Check, { size: 16 })
                ]
              },
              method
            );
          }),
          /* @__PURE__ */ jsx("div", { className: "my-1 border-t border-line/70" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                setPaymentDropdownOpen(false);
                setPaymentModalOpen(true);
              },
              className: "w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer flex items-center gap-2 text-brand-600 dark:text-brand-400",
              children: [
                /* @__PURE__ */ jsx(Split, { size: 15, className: "shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "Split payment" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    warehouses.length > 1 && /* @__PURE__ */ jsxs("div", { className: "relative", ref: warehouseDropdownRef, children: [
      /* @__PURE__ */ jsx(
        "label",
        {
          className: "text-xs uppercase font-bold text-ink-muted block mb-1 tracking-wider",
          children: "Location"
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setWarehouseDropdownOpen(!warehouseDropdownOpen),
          className: `w-full h-12 px-3.5 rounded-xl bg-surface border transition-all flex items-center justify-between shadow-xs ${warehouseDropdownOpen ? "border-brand-500 ring-2 ring-brand-500/20" : "border-line/80 hover:border-brand-300"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
              /* @__PURE__ */ jsx(
                Warehouse,
                {
                  size: 16,
                  className: "text-brand-600 dark:text-brand-400 shrink-0"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink truncate", children: warehouses.find((w) => String(w.id) === String(selectedWarehouseId))?.name || "Select Location" })
            ] }),
            /* @__PURE__ */ jsx(
              ChevronDown,
              {
                size: 15,
                className: `text-ink-muted shrink-0 transition-transform ${warehouseDropdownOpen ? "rotate-180 text-brand-600" : ""}`
              }
            )
          ]
        }
      ),
      warehouseDropdownOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 right-0 mt-1.5 bg-surface rounded-[14px] shadow-2xl border border-line overflow-hidden z-sticky py-1 animate-in fade-in zoom-in-95 duration-fast", children: warehouses.map((w) => {
        const isSelected = String(w.id) === String(selectedWarehouseId);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setSelectedWarehouseId(Number(w.id));
              setWarehouseDropdownOpen(false);
            },
            className: `w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-between ${isSelected ? "text-brand-600 bg-brand-50 dark:bg-brand-950/30" : "text-ink-secondary hover:bg-interactive-hover"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
                /* @__PURE__ */ jsx(Warehouse, { size: 15, className: isSelected ? "text-brand-600" : "text-ink-muted" }),
                /* @__PURE__ */ jsx("span", { className: "truncate", children: w.name })
              ] }),
              isSelected && /* @__PURE__ */ jsx(Check, { size: 16, className: "shrink-0 text-brand-600" })
            ]
          },
          w.id
        );
      }) })
    ] }),
    enableTax && (taxRate > 0 || taxAmount > 0) || totalDiscounts > 0 || enableFulfilment || additionalCharges > 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-[#062421] via-[#0A5049] to-[#076B5E] text-white rounded-2xl p-4 sm:p-5 border border-teal-700/50 shadow-lg space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
        /* @__PURE__ */ jsx("span", { className: "vq-num text-white font-bold text-base", children: money(subtotal) })
      ] }),
      totalDiscounts > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-emerald-300 text-sm font-bold", children: [
        /* @__PURE__ */ jsxs("span", { className: "vq-clip", children: [
          "Discount",
          activeSale.discountType === "percentage" ? ` (${activeSale.discountValue}%)` : ""
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "vq-num font-bold text-base", children: [
          "−",
          money(totalDiscounts)
        ] })
      ] }),
      enableTax && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx("span", { children: "Tax" }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => updateActiveSale({ taxInclusive: !taxInclusive }),
              className: `text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${taxInclusive ? "bg-teal-400/20 border-teal-300/40 text-teal-200" : "bg-white/10 border-white/20 text-white/80"}`,
              children: taxInclusive ? "Incl" : "Excl"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setTaxDropdownOpen(!taxDropdownOpen),
                className: "px-2.5 py-0.5 rounded-md text-white font-bold text-sm flex items-center gap-1 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer",
                children: /* @__PURE__ */ jsx("span", { className: "vq-clip max-w-[120px]", children: taxRate === 0 ? "0%" : `${taxRate}%` })
              }
            ),
            taxDropdownOpen && /* @__PURE__ */ jsxs("span", { className: "absolute right-0 bottom-full mb-1 w-48 bg-surface text-ink rounded-[14px] shadow-2xl border border-line overflow-hidden z-sticky block py-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    updateActiveSale({ taxRate: 0 });
                    setTaxDropdownOpen(false);
                  },
                  className: `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer ${taxRate === 0 ? "text-brand-600 bg-brand-50 dark:bg-brand-950/30" : "text-ink-secondary"}`,
                  children: "None (0%)"
                }
              ),
              parsedTaxRates.map((tax) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    updateActiveSale({ taxRate: parseFloat(tax.rate) || 0 });
                    setTaxDropdownOpen(false);
                  },
                  className: `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold hover:bg-interactive-hover transition-colors cursor-pointer ${parseFloat(taxRate) === parseFloat(tax.rate) ? "text-brand-600 bg-brand-50 dark:bg-brand-950/30" : "text-ink-secondary"}`,
                  children: /* @__PURE__ */ jsxs("span", { className: "vq-clip block", children: [
                    tax.name,
                    " (",
                    tax.rate,
                    "%)"
                  ] })
                },
                tax.id
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vq-num text-white font-bold text-base", children: money(taxAmount) })
        ] })
      ] }),
      enableFulfilment && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx("span", { children: "Fulfilment" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => updateActiveSale({ is_dropship: !(activeSale.is_dropship || false) }),
            className: `text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${activeSale.is_dropship ? "bg-amber-400/20 border-amber-300/40 text-amber-200" : "bg-white/10 border-white/20 text-white/80"}`,
            children: [
              /* @__PURE__ */ jsx(Truck, { size: 14 }),
              activeSale.is_dropship ? "Dropship" : "Direct"
            ]
          }
        )
      ] }),
      additionalCharges > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx("span", { children: "Additional Charges" }),
        /* @__PURE__ */ jsx("span", { className: "vq-num text-white font-bold text-base", children: money(additionalCharges) })
      ] }),
      serviceCharge > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Service charge ",
          /* @__PURE__ */ jsxs("b", { className: "vq-num opacity-80", children: [
            serviceChargePct,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-num text-white font-bold text-base", children: money(serviceCharge) })
      ] }),
      tableMode && /* The tip is typed on the bill, not chosen from three
      preset percentages: a percentage prompt is a nudge,
      and a till should not be nudging someone else's
      customer on someone else's behalf. */
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 text-teal-100 text-sm font-semibold", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "vq-tip", className: "cursor-pointer", children: "Tip" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "vq-tip",
            type: "number",
            min: "0",
            step: "0.01",
            inputMode: "decimal",
            value: activeSale.tipAmount ?? "",
            onChange: (e) => updateActiveSale({ tipAmount: e.target.value }),
            placeholder: "0.00",
            className: "vq-num w-28 text-right bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white font-bold text-base placeholder:text-white/40 outline-none focus:border-teal-300"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-px bg-teal-600/40 my-1" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2 pt-0.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm sm:text-base font-bold uppercase tracking-wider text-teal-200", children: "Total Payable" }),
        /* @__PURE__ */ jsx("span", { className: "vq-num font-bold text-white tracking-tight drop-shadow-sm", style: { fontSize: "var(--vq-t-total)" }, title: money(cartTotal), children: money(cartTotal) })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-[#062421] via-[#0A5049] to-[#076B5E] text-white rounded-2xl p-4 sm:p-5 border border-teal-700/50 shadow-lg flex justify-between items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm sm:text-base font-bold uppercase tracking-wider text-teal-200", children: "Total Payable" }),
      /* @__PURE__ */ jsx("span", { className: "vq-num font-bold text-white tracking-tight drop-shadow-sm", style: { fontSize: "var(--vq-t-total)" }, title: money(cartTotal), children: money(cartTotal) })
    ] }),
    /* @__PURE__ */ jsxs("div", { id: "tour-pos-paid", className: "bg-surface p-4 rounded-2xl border border-line/80 shadow-xs", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center gap-2 mb-2.5", children: /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm uppercase font-bold text-ink-muted tracking-wider", children: returnMode ? "Amount to refund" : "Amount tendered" }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-bold pointer-events-none text-base sm:text-lg", children: getCurrencySymbol(store || settings) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: cashReceivedInputRef,
            type: "number",
            value: activeSale.cashReceived,
            onChange: (e) => updateActiveSale({ cashReceived: e.target.value }),
            onKeyDown: handleTenderedKeyDown,
            placeholder: "0.00",
            className: "vq-num w-full bg-sunken/60 focus:bg-surface border border-line/90 rounded-xl pl-11 pr-24 font-bold text-ink focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all no-spinner h-14",
            style: { fontSize: "var(--vq-t-num)" },
            disabled: activeSale.cart.length === 0
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateActiveSale({ cashReceived: cartTotal }),
            className: "absolute right-2.5 top-1/2 -translate-y-1/2 bg-surface hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-xs sm:text-sm text-ink font-bold px-3.5 py-2 rounded-lg border border-line cursor-pointer transition-all shadow-xs",
            children: "Exact"
          }
        )
      ] }),
      paymentMethod === "cash" && cartTotal > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-3 flex-wrap", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Quick:" }),
        [
          Math.ceil(cartTotal / 100) * 100,
          Math.ceil(cartTotal / 500) * 500,
          Math.ceil(cartTotal / 1e3) * 1e3,
          Math.ceil(cartTotal / 5e3) * 5e3
        ].filter((v, i, a) => v > cartTotal && a.indexOf(v) === i).slice(0, 4).map((amt) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => updateActiveSale({ cashReceived: amt }),
            className: "vq-num text-sm font-bold px-3.5 py-1.5 bg-surface hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-ink border border-line/80 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-xs hover:-translate-y-0.5",
            children: money(amt)
          },
          amt
        ))
      ] })
    ] }),
    !returnMode && /* @__PURE__ */ jsx("div", { className: `p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${changeDue >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: `text-sm sm:text-base font-bold uppercase tracking-wider ${changeDue >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`, children: changeDue >= 0 ? "Change due" : "Shortage" }),
      /* @__PURE__ */ jsx("span", { className: `vq-num font-bold ${changeDue >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`, style: { fontSize: "var(--vq-t-num)" }, children: money(Math.abs(changeDue)) })
    ] }) })
  ] });
  const completeReturn = async () => {
    if (activeSale.cart.length === 0) {
      addToast("No items in cart", "error");
      return;
    }
    setReturnProcessing(true);
    try {
      if (posReturnMode === "open") {
        const response = await axios.post(route("store.pos.return.store", { store_slug: store?.slug }), {
          items: activeSale.cart.map((i) => ({ product_id: i.id, quantity: i.qty, price: i.price })),
          refund_method: "cash",
          reason: "POS Open Return"
        });
        addToast(`Return processed — Ref: ${response.data.reference}`, "success");
        setReturnMode(false);
        updateActiveSale({ cart: [], customer: null });
      } else {
        if (!returnSaleId) {
          addToast("Load the original sale by reference first", "error");
          setReturnProcessing(false);
          return;
        }
        await axios.post(route("store.sales.return", { store_slug: store?.slug, sale: returnSaleId }), {
          refund_method: "cash",
          refund_source: "cash_drawer",
          reason: "POS return",
          items: activeSale.cart.map((i) => ({ id: i.sale_item_id || i.id, quantity: i.qty }))
        });
        addToast("Return processed successfully", "success");
        setReturnMode(false);
        setReturnSaleId(null);
        setReturnSaleRef("");
        updateActiveSale({ cart: [], customer: null });
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Return failed", "error");
    } finally {
      setReturnProcessing(false);
    }
  };
  const renderTenderActions = () => /* @__PURE__ */ jsxs(Fragment, { children: [
    returnMode ? /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: completeReturn,
        disabled: returnProcessing || activeSale.cart.length === 0,
        className: "w-full rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-wider h-14 shadow-md cursor-pointer text-base sm:text-lg",
        children: returnProcessing ? "Processing…" : "↩ Complete return"
      }
    ) : /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        id: "tour-pos-checkout",
        onClick: handleCheckoutClick,
        disabled: processingPayment || activeSale.cart.length === 0,
        style: {
          boxShadow: "0 6px 24px -4px rgba(11, 170, 143, 0.45)"
        },
        className: `w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all h-14 cursor-pointer text-lg sm:text-xl ${processingPayment || activeSale.cart.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`,
        children: [
          processingPayment ? /* @__PURE__ */ jsx(Loader2, { size: 22, className: "shrink-0 animate-spin" }) : printOnComplete ? /* @__PURE__ */ jsx(Printer, { size: 22, className: "shrink-0" }) : /* @__PURE__ */ jsx(Check, { size: 22, className: "shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "vq-clip font-bold", children: processingPayment ? "Processing…" : printOnComplete ? "Complete & Print" : "Complete Sale" }),
          /* @__PURE__ */ jsx("span", { className: "vq-num px-3 py-1 rounded-xl font-bold bg-white/20 border border-white/20 shrink-0 text-base sm:text-lg backdrop-blur-sm", children: money(cartTotal) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2.5", children: [
      tableMode && !returnMode && selectedTable && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: backToFloor,
          className: "flex-1 bg-surface hover:bg-brand-50 text-ink-secondary hover:text-brand-700 border border-line hover:border-brand-300 active:scale-[0.98] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 17 }),
            " Floor"
          ]
        }
      ),
      !tableMode && !returnMode && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleParkBill,
          disabled: parkingBill || activeSale.cart.length === 0,
          className: `flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs ${parkingBill || activeSale.cart.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`,
          children: [
            /* @__PURE__ */ jsx(Pause, { size: 17 }),
            " ",
            parkingBill ? "Holding…" : "Hold"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleClearCartWithUndo,
          className: "flex-1 bg-surface hover:bg-rose-50 text-ink-secondary hover:text-rose-600 border border-line hover:border-rose-200 active:scale-[0.98] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all h-12 text-sm sm:text-base cursor-pointer shadow-xs",
          children: [
            /* @__PURE__ */ jsx(X, { size: 17 }),
            " Cancel"
          ]
        }
      )
    ] })
  ] });
  const renderTenderPane = () => /* @__PURE__ */ jsxs("section", { className: "vq-pane bg-surface border border-line/80 shadow-md", "data-pane": "tender", children: [
    /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
      /* @__PURE__ */ jsx(Receipt, { size: 15, className: "text-emerald-600 dark:text-emerald-400" }),
      /* @__PURE__ */ jsx("span", { children: "Payment" }),
      /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: [
        "#",
        activeSale.id
      ] }),
      !showOrderPane && renderPaneTriggers()
    ] }),
    /* @__PURE__ */ jsx("div", { className: "vq-pane-body p-3 space-y-2.5", children: renderTenderFields() }),
    /* @__PURE__ */ jsx("footer", { className: "vq-pane-actions bg-sunken/40 border-t border-line", children: renderTenderActions() })
  ] });
  const cat = layout.catalog;
  !!cat && (cat.mode === "left" || cat.mode === "right");
  const catIsBand = !!cat && (cat.mode === "top" || cat.mode === "bottom");
  const GUTTER = 12;
  const resizable = layout.regime === "columns";
  const tenderSide = composition?.tenderSide || "right";
  const tenderIsColumn = layout.tender.mode === "column" && tenderSide !== "bottom";
  const tenderIsRow = layout.tender.mode === "column" && tenderSide === "bottom" && resizable;
  const orderCanHide = layout.catalog && layout.catalog.mode !== "overlay" && layout.catalog.mode !== "off" && (tenderIsColumn || tenderIsRow);
  const showOrderPane = composition?.showOrder !== false || !orderCanHide;
  const floorIsStep = tableMode && !(layout.floor && layout.floor.mode === "left");
  const dockOf = (id) => layout.dock.find((d) => d.id === id);
  const tenderDock = dockOf("tender");
  const catalogDock = dockOf("catalog");
  const openTender = () => setOpenSheet("tender");
  const dockShowsSecondary = !!(tenderDock && tenderDock.inline);
  const renderPaneTriggers = () => {
    if (dockShowsSecondary) return null;
    if (!catalogDock) return null;
    return /* @__PURE__ */ jsx(Fragment, { children: catalogDock && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpenSheet("catalog"),
        className: "vq-pane-trigger",
        title: "Open the catalog",
        children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }),
          /* @__PURE__ */ jsx("span", { children: "Catalog" }),
          categoryProducts.length > 0 && /* @__PURE__ */ jsx("span", { className: "vq-pane-trigger-n vq-num", children: categoryProducts.length })
        ]
      }
    ) });
  };
  const renderDock = () => {
    if (!tenderDock) return null;
    if (tenderDock && tenderDock.inline) {
      return /* @__PURE__ */ jsxs("div", { className: "vq-dock", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-tender-bar flex-1 bg-surface border border-line shadow-sm min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-3xs uppercase font-bold text-ink-muted block", children: [
              activeSale.cart.length,
              " lines · ",
              cartQty,
              " qty"
            ] }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "vq-num font-bold text-emerald-600 dark:text-emerald-400 block leading-none",
                style: { fontSize: "var(--vq-t-total)" },
                title: money(cartTotal),
                children: money(cartTotal)
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: openTender,
              className: "vq-dock-btn bg-sunken text-ink-secondary border border-line shrink-0 cursor-pointer",
              "data-primary": "0",
              children: "Details"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCheckoutClick,
              disabled: processingPayment || activeSale.cart.length === 0,
              className: "vq-dock-btn bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shrink-0 cursor-pointer",
              "data-primary": "1",
              children: [
                processingPayment ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }) : printOnComplete ? /* @__PURE__ */ jsx(Printer, { size: 18 }) : /* @__PURE__ */ jsx(Check, { size: 18 }),
                /* @__PURE__ */ jsx("span", { className: "vq-clip", children: processingPayment ? "Processing…" : "Pay" })
              ]
            }
          )
        ] }),
        catalogDock && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setOpenSheet("catalog"),
            className: "vq-dock-btn bg-surface border border-line text-ink shrink-0 cursor-pointer",
            "data-primary": "0",
            children: [
              /* @__PURE__ */ jsx(LayoutGrid, { size: 18 }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Catalog" })
            ]
          }
        )
      ] });
    }
    return /* @__PURE__ */ jsx("div", { className: "vq-dock", children: tenderDock && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: openTender,
        className: "vq-dock-btn bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer",
        "data-primary": "1",
        children: [
          /* @__PURE__ */ jsx(Receipt, { size: 18 }),
          /* @__PURE__ */ jsx("span", { className: "vq-clip", children: "Take payment" }),
          /* @__PURE__ */ jsx("span", { className: "vq-num px-2 py-1 rounded-lg bg-white/20 border border-white/10 shrink-0", children: money(cartTotal) })
        ]
      }
    ) });
  };
  const sheetHeader = (title, subtitle) => /* @__PURE__ */ jsxs("header", { className: "vq-pane-fixed flex items-center gap-3 px-4 py-3 border-b border-line bg-sunken/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("h2", { className: "vq-clip font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "vq-clip text-xs text-ink-muted", children: subtitle })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setOpenSheet(null),
        className: "ml-auto w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted shrink-0",
        "aria-label": "Close",
        children: /* @__PURE__ */ jsx(X, { size: 20 })
      }
    )
  ] });
  return /* @__PURE__ */ jsx(
    OneGlanceLayout,
    {
      title: "Point of Sale",
      activeMenu: "Dashboard",
      defaultCollapsed: true,
      hideHeader: true,
      noPadding: true,
      hideSidebar: !showRail,
      children: /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsx(Head, { title: "POS" }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: termRef,
            className: "vq-term text-ink",
            "data-regime": layout.regime,
            "data-senior": seniorMode ? "1" : "0",
            style: {
              "--vq-pane-cols": paneCols,
              "--vq-dock-h": `${layout.dockH || 0}px`,
              /* Interface scale rides the type ramp only. Scaling the whole
                 element with transform would blur text and lie to every
                 measurement the engine makes; scaling the ramp lets the
                 engine see a genuinely smaller box and demote honestly. */
              "--vq-ui-scale": uiScale,
              "--vq-catband-h": cat && cat.h ? `${Math.round(cat.h)}px` : "0px"
            },
            children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-term-bar", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0", children: [
                  sales.map((sale, saleIndex) => /* @__PURE__ */ jsxs(
                    "div",
                    {
                      onClick: () => setActiveSaleId(sale.id),
                      className: `group relative min-w-[140px] max-w-[220px] h-11 px-3.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border shrink-0 ${activeSaleId === sale.id ? "bg-surface text-brand-700 dark:text-brand-300 font-bold border-brand-500/40 shadow-xs ring-2 ring-brand-500/10" : "bg-surface/60 hover:bg-surface text-ink-muted hover:text-ink border-line/60 hover:border-line shadow-xs"}`,
                      children: [
                        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 min-w-0", children: [
                          activeSaleId === sale.id && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-brand-500 ring-2 ring-brand-400/20 shrink-0" }),
                          /* @__PURE__ */ jsx("span", { className: "vq-clip text-xs font-bold", children: sale.customer?.name || (sale.reference_number ? `#${sale.reference_number}` : null) || `Sale ${saleIndex + 1}` })
                        ] }),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: (e) => closeSale(e, sale.id),
                            className: `shrink-0 flex items-center justify-center w-5 h-5 rounded-lg transition-all ${activeSaleId === sale.id ? "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "opacity-0 group-hover:opacity-100 text-ink-muted hover:bg-red-100 hover:text-red-600"}`,
                            style: { minHeight: 20 },
                            "aria-label": "Close tab",
                            children: /* @__PURE__ */ jsx(X, { size: 11, strokeWidth: 3 })
                          }
                        )
                      ]
                    },
                    sale.id
                  )),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: createNewSale,
                      className: "w-11 h-11 rounded-xl bg-surface hover:bg-brand-50 hover:text-brand-600 border border-line hover:border-brand-300 text-ink-muted shadow-xs flex items-center justify-center transition-all shrink-0 cursor-pointer",
                      title: "New sale (Ctrl+T)",
                      children: /* @__PURE__ */ jsx(Plus, { size: 17 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                  pendingCount > 0 && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        setShowSyncHub(true);
                        loadOfflineSales();
                      },
                      className: "vq-chip flex items-center gap-2 px-3.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 transition-colors shadow-xs",
                      style: { minHeight: 38 },
                      title: "Sales queued while offline",
                      children: [
                        /* @__PURE__ */ jsx(Clock, { size: 14 }),
                        /* @__PURE__ */ jsx("span", { className: "vq-num", children: pendingCount })
                      ]
                    }
                  ),
                  layout.regime !== "phone" && /* @__PURE__ */ jsxs(Fragment, { children: [
                    surfaceButtons.returns && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setReturnMode(!returnMode),
                        "aria-pressed": returnMode,
                        className: `w-11 h-11 rounded-xl flex items-center justify-center transition-all
                                                        border shadow-xs shrink-0 cursor-pointer
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${returnMode ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-400/50" : "bg-surface hover:bg-red-50 dark:hover:bg-red-950/30 text-ink-secondary hover:text-red-600 border-line hover:border-red-300"}`,
                        title: returnMode ? "Return mode is on — the next document is a credit" : "Switch to return mode",
                        children: /* @__PURE__ */ jsx(Undo2, { size: 17 })
                      }
                    ),
                    surfaceButtons.parked && modulesEnabled.has("park_recall") && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => {
                          loadParkedSales();
                          setParkedDropdownOpen(true);
                        },
                        className: "h-11 min-w-11 px-3 rounded-xl bg-surface hover:bg-amber-50 dark:hover:bg-amber-950/30\n                                                       text-ink-secondary hover:text-amber-700 dark:hover:text-amber-400\n                                                       flex items-center justify-center gap-1.5 transition-all\n                                                       border border-line hover:border-amber-300 shadow-xs shrink-0 cursor-pointer\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        title: "Parked sales",
                        children: [
                          /* @__PURE__ */ jsx(Pause, { size: 17 }),
                          parkedSales.length > 0 && /* @__PURE__ */ jsx("span", { className: "vq-num text-2xs font-bold", children: parkedSales.length })
                        ]
                      }
                    ),
                    surfaceButtons.recent && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          loadRecentInvoices();
                          setShowRecentInvoices(true);
                        },
                        className: "w-11 h-11 rounded-xl bg-surface hover:bg-brand-50 dark:hover:bg-brand-950/40\n                                                       text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400\n                                                       flex items-center justify-center transition-all\n                                                       border border-line hover:border-brand-300 shadow-xs shrink-0 cursor-pointer\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        title: "Recent invoices",
                        children: /* @__PURE__ */ jsx(History, { size: 17 })
                      }
                    ),
                    surfaceButtons.drawer && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: handleOpenCashDrawer,
                        className: "w-11 h-11 rounded-xl bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30\n                                                       text-ink-secondary hover:text-emerald-700 dark:hover:text-emerald-400\n                                                       flex items-center justify-center transition-all\n                                                       border border-line hover:border-emerald-300 shadow-xs shrink-0 cursor-pointer\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        title: "Open cash drawer (Ctrl+D)",
                        children: /* @__PURE__ */ jsx(Unlock, { size: 17 })
                      }
                    ),
                    surfaceButtons.keys && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => openSettings("keys"),
                        className: "w-11 h-11 rounded-xl bg-surface hover:bg-interactive-hover\n                                                       text-ink-secondary hover:text-ink flex items-center justify-center\n                                                       transition-all border border-line shadow-xs shrink-0 cursor-pointer\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        title: "Keyboard shortcuts (?)",
                        children: /* @__PURE__ */ jsx(Keyboard, { size: 17 })
                      }
                    ),
                    surfaceButtons.fullscreen && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: toggleFullscreen,
                        className: "w-11 h-11 rounded-xl bg-surface hover:bg-interactive-hover\n                                                       text-ink-secondary hover:text-ink flex items-center justify-center\n                                                       transition-all border border-line shadow-xs shrink-0 cursor-pointer\n                                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                        title: "Fullscreen (Alt+Z)",
                        children: isFullscreen ? /* @__PURE__ */ jsx(Minimize2, { size: 17 }) : /* @__PURE__ */ jsx(Maximize2, { size: 17 })
                      }
                    ),
                    surfaceButtons.online && /* @__PURE__ */ jsxs(
                      "span",
                      {
                        className: "relative flex h-2.5 w-2.5 shrink-0 mx-1.5 cursor-default",
                        role: "status",
                        "aria-label": isOnline2 ? "Online" : "Offline — sales are queued on this device",
                        title: isOnline2 ? "Online — sales post immediately" : "Offline — sales are queued on this device",
                        children: [
                          isOnline2 && /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" }),
                          /* @__PURE__ */ jsx("span", { className: `relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline2 ? "bg-emerald-500" : "bg-danger-500"}` })
                        ]
                      }
                    ),
                    surfaceButtons.printer && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => openSettings("hardware"),
                        className: `h-11 px-3 rounded-xl flex items-center gap-2 transition-all border shadow-xs shrink-0 cursor-pointer
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${printerReady ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" : "bg-surface hover:bg-interactive-hover border-line text-ink-muted hover:text-ink"}`,
                        title: printerReady ? `${printerCount} printer${printerCount === 1 ? "" : "s"} connected` : "Printer disconnected — click to configure",
                        "aria-label": printerReady ? `${printerCount} printer${printerCount === 1 ? "" : "s"} connected` : "Printer disconnected — click to configure",
                        children: [
                          printerReady ? /* @__PURE__ */ jsx(Printer, { size: 16, className: "text-emerald-600 dark:text-emerald-400 shrink-0" }) : /* @__PURE__ */ jsxs("span", { className: "relative inline-flex items-center justify-center shrink-0 w-4 h-4", children: [
                            /* @__PURE__ */ jsx(Printer, { size: 16, className: "text-ink-muted/50 dark:text-ink-muted/50 shrink-0" }),
                            /* @__PURE__ */ jsx(
                              "svg",
                              {
                                viewBox: "0 0 24 24",
                                width: "18",
                                height: "18",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2.5",
                                strokeLinecap: "round",
                                className: "absolute inset-0 -top-0.5 -left-0.5 text-red-500 pointer-events-none",
                                "aria-hidden": "true",
                                children: /* @__PURE__ */ jsx("line", { x1: "4", y1: "4", x2: "20", y2: "20" })
                              }
                            )
                          ] }),
                          printerReady && printerCount > 1 && /* @__PURE__ */ jsx("span", { className: "vq-num text-2xs font-bold text-emerald-700 dark:text-emerald-300", children: printerCount })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => openSettings("layout"),
                      "aria-expanded": settingsOpen,
                      "aria-haspopup": "dialog",
                      className: `w-11 h-11 rounded-xl flex items-center justify-center transition-all
                                            border shadow-xs shrink-0 cursor-pointer
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${settingsOpen ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border-brand-500/40" : "bg-surface hover:bg-brand-50 dark:hover:bg-brand-950/40 text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400 border-line hover:border-brand-300"}`,
                      title: "Register settings — layout, display, selling, hardware, keys (Alt+L)",
                      children: /* @__PURE__ */ jsx(Settings, { size: 17 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.dashboard", { store_slug: store?.slug }),
                      className: "w-11 h-11 rounded-xl bg-surface hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-secondary hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all border border-line hover:border-red-300 shadow-xs shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                      title: "Close register and return to dashboard",
                      "aria-label": "Close register and return to dashboard",
                      children: /* @__PURE__ */ jsx(X, { size: 18 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-term-body", children: [
                catIsBand && cat.mode === "top" && renderCatalogBand(),
                catIsBand && cat.mode === "top" && resizable && renderBandGrip("top"),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    ref: panesRef,
                    className: "vq-panes-grid",
                    style: {
                      gridTemplateColumns: layout.regime === "stacked" || layout.regime === "phone" ? "minmax(0, 1fr)" : paneCols
                    },
                    children: [
                      tenderIsColumn && tenderSide === "left" && renderTenderPane(),
                      cat && cat.mode === "left" && renderCatalogPane(cat.fit, cat.tiles),
                      tableMode && layout.floor && layout.floor.mode === "left" && /* @__PURE__ */ jsx(
                        FloorPane,
                        {
                          positions: tables.visible,
                          tabs: tables.tabs,
                          zone: tables.zone,
                          setZone: tables.setZone,
                          counts: tables.counts,
                          selectedId: tables.selectedId,
                          onPick: pickTable,
                          onNewTicket: (kind) => setNewTicketFor(kind),
                          onSetup: openFloorPlan,
                          money,
                          now: floorNow,
                          variant: layout.floor.fit === "map" ? "map" : "list"
                        }
                      ),
                      tableMode && floorIsStep && !selectedTable ? /* @__PURE__ */ jsxs("section", { className: "vq-pane bg-surface border border-line/80 shadow-md", "data-pane": "floor", children: [
                        /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
                          /* @__PURE__ */ jsx(Users, { size: 15, className: "text-brand-500 dark:text-brand-400" }),
                          /* @__PURE__ */ jsx("span", { children: "Pick a table" }),
                          /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: [
                            tables.counts.open,
                            " open · ",
                            tables.counts.free,
                            " free",
                            tables.counts.tickets > 0 ? ` · ${tables.counts.tickets} tickets` : ""
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx(
                          FloorPane,
                          {
                            embedded: true,
                            positions: tables.visible,
                            tabs: tables.tabs,
                            zone: tables.zone,
                            setZone: tables.setZone,
                            counts: tables.counts,
                            selectedId: tables.selectedId,
                            onPick: pickTable,
                            onNewTicket: (kind) => setNewTicketFor(kind),
                            onSetup: openFloorPlan,
                            money,
                            now: floorNow,
                            variant: layout.cart && layout.cart.px >= 484 ? "map" : "list"
                          }
                        )
                      ] }) : showOrderPane && renderCartPane(),
                      tenderIsColumn && tenderSide === "right" && renderTenderPane(),
                      cat && cat.mode === "right" && renderCatalogPane(cat.fit, cat.tiles),
                      resizable && cat && cat.mode === "left" && renderSplit(
                        "catalog",
                        "left",
                        Math.round(cat.px) + (tenderIsColumn && tenderSide === "left" ? Math.round(layout.tender.px) + GUTTER : 0) + GUTTER / 2
                      ),
                      resizable && cat && cat.mode === "right" && renderSplit("catalog", "right", Math.round(cat.px) + GUTTER / 2),
                      resizable && tenderIsColumn && tenderSide === "right" && renderSplit(
                        "tender",
                        "right",
                        Math.round(layout.tender.px) + (cat && cat.mode === "right" ? Math.round(cat.px) + GUTTER : 0) + GUTTER / 2
                      ),
                      resizable && tenderIsColumn && tenderSide === "left" && renderSplit("tender", "left", Math.round(layout.tender.px) + GUTTER / 2)
                    ]
                  }
                ),
                catIsBand && cat.mode === "bottom" && resizable && renderBandGrip("bottom"),
                catIsBand && cat.mode === "bottom" && renderCatalogBand(),
                tenderIsRow && /* @__PURE__ */ jsxs(
                  "section",
                  {
                    className: "vq-pane vq-tender-row bg-surface border border-line/80 shadow-md shrink-0",
                    "data-pane": "tender",
                    style: { height: Math.max(220, Math.round((layout.H || 700) * 0.34)) },
                    children: [
                      /* @__PURE__ */ jsxs("header", { className: "vq-pane-h bg-sunken/60 text-ink-muted border-b border-line", children: [
                        /* @__PURE__ */ jsx(Receipt, { size: 15, className: "text-emerald-600 dark:text-emerald-400" }),
                        /* @__PURE__ */ jsx("span", { children: "Payment" }),
                        /* @__PURE__ */ jsxs("span", { className: "vq-num ml-auto text-2xs opacity-80 font-bold", children: [
                          "#",
                          activeSale.id
                        ] }),
                        !showOrderPane && renderPaneTriggers()
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "vq-pane-body vq-tender-row-body p-3", children: renderTenderFields() }),
                      /* @__PURE__ */ jsx("footer", { className: "vq-pane-actions bg-sunken/40 border-t border-line", children: renderTenderActions() })
                    ]
                  }
                )
              ] }),
              renderDock()
            ]
          }
        ),
        openSheet && /* @__PURE__ */ jsx("div", { className: "vq-scrim", onClick: () => setOpenSheet(null) }),
        /* @__PURE__ */ jsxs(
          "aside",
          {
            className: "vq-sheet bg-surface border-l border-line shadow-2xl",
            "data-open": openSheet === "catalog" ? "true" : "false",
            "data-full": "1",
            "aria-hidden": openSheet !== "catalog",
            children: [
              sheetHeader("Catalog", `${categoryProducts.length} items`),
              renderScan(),
              renderCategoryStrip(),
              /* @__PURE__ */ jsx("div", { className: "vq-pane-body", children: renderCatalogBody({ variant: "grid-3up", tiles: layout.regime === "phone" ? 2 : 4 }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "aside",
          {
            className: "vq-sheet bg-surface border-line shadow-2xl",
            "data-open": openSheet === "tender" ? "true" : "false",
            "data-side": tenderSide,
            style: { "--vq-sheet-w": "480px" },
            "aria-hidden": openSheet !== "tender",
            children: [
              sheetHeader("Payment", `Sale #${activeSale.id}`),
              /* @__PURE__ */ jsx("div", { className: "vq-pane-body p-3 space-y-2.5", children: openSheet === "tender" && renderTenderFields() }),
              /* @__PURE__ */ jsx("footer", { className: "vq-pane-actions bg-sunken/40 border-t border-line", children: renderTenderActions() })
            ]
          }
        ),
        variantModalOpen && selectedProductForVariant && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Select Variant" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setVariantModalOpen(false), children: /* @__PURE__ */ jsx(X, { size: 20 }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 max-h-96 overflow-y-auto", children: selectedProductForVariant.variants.map((variant) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => addToCart(selectedProductForVariant, variant),
              className: "p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl cursor-pointer border border-line mb-2 flex justify-between items-center",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold", children: variant.sku }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: variant.attributes ? JSON.stringify(variant.attributes) : "Variant" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-600", children: formatCurrency(variant.price, store || settings) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                    "Stock: ",
                    variant.stock_quantity
                  ] })
                ] })
              ]
            },
            variant.id
          )) })
        ] }) }),
        approvalRequest && /* @__PURE__ */ jsx(
          ApprovalPinModal,
          {
            request: approvalRequest.info,
            storeSlug: store?.slug,
            busy: processingPayment,
            money,
            zIndex: "z-modal",
            onClose: () => setApprovalRequest(null),
            onSubmit: (approval) => processCheckout(approvalRequest.paymentData, approvalRequest.addToLedger, approval)
          }
        ),
        /* @__PURE__ */ jsx(Toast, { toasts, removeToast: (id) => setToasts((prev) => prev.filter((t2) => t2.id !== id)) }),
        /* @__PURE__ */ jsx(
          AlertModal,
          {
            show: alertState.show,
            onClose: () => setAlertState((prev) => ({ ...prev, show: false })),
            title: alertState.title,
            message: alertState.message,
            type: alertState.type
          }
        ),
        /* @__PURE__ */ jsx(
          ConfirmModal,
          {
            show: confirmState.show,
            onClose: () => setConfirmState((prev) => ({ ...prev, show: false })),
            title: confirmState.title,
            message: confirmState.message,
            onConfirm: confirmState.onConfirm,
            isDangerous: confirmState.isDangerous
          }
        ),
        /* @__PURE__ */ jsx(
          InputModal,
          {
            show: inputState.show,
            onClose: () => setInputState((prev) => ({ ...prev, show: false })),
            title: inputState.title,
            placeholder: inputState.placeholder,
            onSubmit: inputState.onSubmit,
            zIndex: "z-modal"
          }
        ),
        /* @__PURE__ */ jsx(
          PaymentModal,
          {
            isOpen: paymentModalOpen,
            onClose: () => {
              setPaymentModalOpen(false);
              setSplitSeed(null);
            },
            totalAmount: cartTotal,
            onComplete: handlePaymentComplete,
            currency: store?.currency_code || settings?.currency || "PKR",
            bankAccounts,
            customer: activeSale.customer,
            defaultPrintReceipt: printOnComplete,
            seedSplit: splitSeed
          }
        ),
        tableMode && newTicketFor && /* @__PURE__ */ jsx(
          NewTicketDialog,
          {
            orderType: newTicketFor,
            busy: tables.busy,
            onCancel: () => setNewTicketFor(null),
            onConfirm: async (meta) => {
              const t2 = await tables.openLane(newTicketFor, meta);
              setNewTicketFor(null);
              if (t2) {
                loadedOccupancy.current = t2.occupancy_id;
                tables.prime([]);
                updateActiveSale({ cart: [], cashReceived: "", customer: null, remarks: "" });
                addToast(`${t2.code} opened`, "success");
              }
            }
          }
        ),
        tableMode && seatFor && /* @__PURE__ */ jsx(
          SeatDialog,
          {
            position: seatFor,
            busy: tables.busy,
            onCancel: () => setSeatFor(null),
            onConfirm: confirmSeat
          }
        ),
        tableMode && movingTable && selectedTable && /* @__PURE__ */ jsx(
          MoveSheet,
          {
            from: selectedTable,
            positions: tables.positions,
            busy: tables.busy,
            onCancel: () => setMovingTable(false),
            onTransfer: async (to) => {
              setMovingTable(false);
              const res = await tables.transfer(selectedTable.occupancy_id, to.id);
              if (res) {
                loadedOccupancy.current = null;
                tables.select(to.id);
                addToast(`Moved to ${to.label || to.code}`, "success");
              }
            },
            onMerge: async (into) => {
              setMovingTable(false);
              const res = await tables.merge(selectedTable.occupancy_id, into.occupancy_id);
              if (res) {
                loadedOccupancy.current = null;
                tables.select(into.id);
                addToast(`Merged into ${into.label || into.code}`, "success");
              }
            }
          }
        ),
        tableMode && /* @__PURE__ */ jsx(
          SplitSheet,
          {
            open: splitOpen,
            lines: activeSale.cart,
            remaining: cartTotal,
            covers: tableCovers,
            money,
            busy: tables.busy,
            onCancel: () => setSplitOpen(false),
            onConfirm: confirmSplit
          }
        ),
        tableMode && /* @__PURE__ */ jsx(
          ModifierSheet,
          {
            open: !!modifierFor,
            product: modifierFor,
            groups: modifierGroups,
            loading: modifierLoading,
            money,
            onCancel: () => {
              setModifierFor(null);
              setModifierGroups([]);
            },
            onConfirm: (mods) => {
              const product = modifierFor;
              setModifierFor(null);
              setModifierGroups([]);
              addToCart(product, null, mods);
            }
          }
        ),
        globalDiscountModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm vq-anim-fade", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-white", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-white/5 flex justify-between items-center bg-white/5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold uppercase tracking-tight", children: [
                "Apply ",
                /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "Discount" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-ink-muted", children: "Select type and discount value" })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setGlobalDiscountModal({ show: false, type: "fixed", value: "" }), className: "p-1.5 hover:bg-white/10 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(X, { size: 18, className: "text-ink-muted hover:text-white" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex bg-neutral-800 p-1 rounded-xl", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setGlobalDiscountModal((prev) => ({ ...prev, type: "fixed" })),
                  className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === "fixed" ? "bg-emerald-600 text-white shadow-md" : "text-ink-muted hover:text-white"}`,
                  children: [
                    "Fixed Amount (",
                    getCurrencySymbol(store || settings),
                    ")"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setGlobalDiscountModal((prev) => ({ ...prev, type: "percentage" })),
                  className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${globalDiscountModal.type === "percentage" ? "bg-emerald-600 text-white shadow-md" : "text-ink-muted hover:text-white"}`,
                  children: "Percentage (%)"
                }
              )
            ] }),
            globalDiscountModal.type === "percentage" && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-ink-muted block", children: "Presets (Hold to Edit)" }) }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: discountPresets.map((val, idx) => {
                let holdTimer = null;
                const startHold = () => {
                  holdTimer = setTimeout(() => {
                    showInput(`Edit Preset #${idx + 1}`, `Enter new percentage value (current: ${val}%)`, (newVal) => {
                      const parsed = parseFloat(newVal);
                      if (!isNaN(parsed)) {
                        const newPresets = [...discountPresets];
                        newPresets[idx] = parsed;
                        setDiscountPresets(newPresets);
                        localStorage.setItem("pos_discount_presets", JSON.stringify(newPresets));
                        addToast(`Preset #${idx + 1} updated to ${parsed}%`, "success");
                      }
                    });
                    holdTimer = null;
                  }, 500);
                };
                const endHold = () => {
                  if (holdTimer) {
                    clearTimeout(holdTimer);
                    setGlobalDiscountModal((prev) => ({ ...prev, value: String(val) }));
                  }
                };
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onMouseDown: startHold,
                    onMouseUp: endHold,
                    onTouchStart: startHold,
                    onTouchEnd: endHold,
                    className: `py-2 text-xs font-bold rounded-lg border transition-all ${parseFloat(globalDiscountModal.value) === val ? "bg-emerald-600/20 border-emerald-500 text-emerald-400" : "bg-neutral-800/50 border-white/5 text-neutral-300 hover:bg-interactive-hover"}`,
                    children: [
                      val,
                      "%"
                    ]
                  },
                  idx
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-ink-muted block mb-1.5", children: globalDiscountModal.type === "percentage" ? "Discount Percentage (%)" : `Discount Value (${getCurrencySymbol(store || settings)})` }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: globalDiscountModal.value,
                  onChange: (e) => setGlobalDiscountModal((prev) => ({ ...prev, value: e.target.value })),
                  placeholder: "0.00",
                  className: "w-full bg-neutral-950 border border-white/5 rounded-xl py-3 px-4 text-lg font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 bg-white/5 border-t border-white/5 flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  updateActiveSale({ discountType: "fixed", discountValue: 0 });
                  setGlobalDiscountModal({ show: false, type: "fixed", value: "" });
                  addToast("Discount cleared", "info");
                },
                className: "flex-1 py-2.5 text-xs font-bold text-ink-muted hover:text-white bg-neutral-800 rounded-xl transition-all",
                children: "Clear"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  const parsedVal = parseFloat(globalDiscountModal.value) || 0;
                  updateActiveSale({ discountType: globalDiscountModal.type, discountValue: parsedVal });
                  setGlobalDiscountModal({ show: false, type: "fixed", value: "" });
                  addToast("Discount applied successfully", "success");
                },
                className: "flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg ",
                children: "Apply"
              }
            )
          ] })
        ] }) }),
        showQuickAccountModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer flex items-center justify-center bg-black/60 backdrop-blur-sm vq-anim-fade", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-white/5 flex justify-between items-center bg-white/5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-white uppercase tracking-tight", children: [
                "Create ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-400", children: "Bank Account" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Add a ledger to receive digital payments" })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setShowQuickAccountModal(false), className: "p-2 hover:bg-white/10 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-ink-muted" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-ink-muted block mb-1.5", children: "Account Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "quick-acc-name",
                  type: "text",
                  placeholder: "e.g. Meezan Bank, HBL Shop",
                  className: "w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none",
                  autoFocus: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-ink-muted block mb-1.5", children: "Type" }),
                /* @__PURE__ */ jsxs("select", { id: "quick-acc-type", className: "w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none", children: [
                  /* @__PURE__ */ jsx("option", { value: "checking", children: "Checking" }),
                  /* @__PURE__ */ jsx("option", { value: "savings", children: "Savings" }),
                  /* @__PURE__ */ jsx("option", { value: "cash", children: "Branch Cash" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-2xs uppercase font-bold text-ink-muted block mb-1.5", children: "Bank Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "quick-acc-bank",
                    type: "text",
                    placeholder: "Optional",
                    className: "w-full bg-neutral-800 border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-white/5 border-t border-white/5 flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowQuickAccountModal(false),
                className: "flex-1 py-3 rounded-xl font-bold text-xs text-ink-muted hover:bg-white/5 transition-colors",
                children: "CANCEL"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: async () => {
                  setCreatingAccount(true);
                  const name = document.getElementById("quick-acc-name").value;
                  const type = document.getElementById("quick-acc-type").value;
                  const bank = document.getElementById("quick-acc-bank").value;
                  if (!name) {
                    addToast("Account name is required", "error");
                    setCreatingAccount(false);
                    return;
                  }
                  try {
                    await axios.post(route("store.bank-accounts.store", { store_slug: store?.slug }), {
                      name,
                      account_type: type,
                      bank_name: bank,
                      opening_balance: 0
                    });
                    addToast("Account created successfully!", "success");
                    setShowQuickAccountModal(false);
                    router.reload({ only: ["bankAccounts"] });
                  } catch (e) {
                    addToast("Failed to create account", "error");
                  } finally {
                    setCreatingAccount(false);
                  }
                },
                disabled: creatingAccount,
                className: "flex-[2] py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-lg transition-all flex items-center justify-center gap-2",
                children: creatingAccount ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(RefreshCcw, { size: 14, className: "animate-spin" }),
                  /* @__PURE__ */ jsx("span", { children: "CREATING..." })
                ] }) : /* @__PURE__ */ jsx("span", { children: "CREATE ACCOUNT" })
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(
          QuickPartyModal,
          {
            isOpen: showQuickPartyModal,
            onClose: () => {
              setShowQuickPartyModal(false);
              setEditingCustomer(null);
            },
            editingParty: editingCustomer,
            onSuccess: (newCustomer) => {
              updateActiveSale({ customer: newCustomer });
              setShowQuickPartyModal(false);
              setEditingCustomer(null);
              addToast(`Customer ${newCustomer.name} ${editingCustomer ? "updated" : "created"}!`, "success");
            }
          }
        ),
        /* @__PURE__ */ jsx(
          ProductModal,
          {
            isOpen: showProductModal,
            onClose: () => setShowProductModal(false),
            initialName: searchQueryForProduct,
            onSuccess: (newProduct) => {
              addToCart(newProduct);
              setShowProductModal(false);
              addToast(`Product ${newProduct.name} added!`, "success");
            }
          }
        ),
        /* @__PURE__ */ jsx(
          FormModal,
          {
            isOpen: showOverpaymentModal,
            onClose: () => setShowOverpaymentModal(false),
            title: "Overpayment Detected",
            size: "sm",
            children: /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink mb-1", children: "Use Excess Amount" }),
                /* @__PURE__ */ jsx("div", { className: "font-bold text-emerald-500 my-2", style: { fontSize: seniorMode ? "34px" : "28px" }, children: formatCurrency(overpaymentDetails.amount, store || settings) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Customer paid extra. Choose action:") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => processCheckout(pendingPaymentData, false),
                    className: "w-full py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center justify-center gap-2",
                    children: "Return Change"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => processCheckout(pendingPaymentData, true),
                    className: "w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg transition-colors flex items-center justify-center gap-2",
                    children: "Add to Ledger"
                  }
                )
              ] })
            ] })
          }
        ),
        itemDiscountModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-command flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Apply Item Discount" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 truncate", children: itemDiscountModal.item?.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-sunken p-1 rounded-xl", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setItemDiscountModal((p) => ({ ...p, discType: "fixed" })),
                className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === "fixed" ? "bg-sunken shadow text-brand-600 dark:text-brand-400" : "text-ink-muted"}`,
                children: [
                  getCurrencySymbol(store || settings),
                  " Fixed"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setItemDiscountModal((p) => ({ ...p, discType: "percentage" })),
                className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${itemDiscountModal.discType === "percentage" ? "bg-sunken shadow text-brand-600 dark:text-brand-400" : "text-ink-muted"}`,
                children: "% Percent"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                autoFocus: true,
                type: "number",
                min: "0",
                max: itemDiscountModal.discType === "percentage" ? 100 : itemDiscountModal.originalPrice,
                value: itemDiscountModal.discValue,
                onChange: (e) => setItemDiscountModal((p) => ({ ...p, discValue: e.target.value })),
                onKeyDown: (e) => e.key === "Enter" && applyItemDiscount(),
                placeholder: itemDiscountModal.discType === "percentage" ? "Enter % (e.g. 10)" : `Max: ${formatCurrency(itemDiscountModal.originalPrice, store || settings)}`,
                className: "w-full px-4 py-3 pr-12 border border-line dark:border-line rounded-xl bg-sunken text-ink text-lg font-bold focus:ring-2 focus:ring-brand-400 outline-none"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted font-bold text-sm", children: itemDiscountModal.discType === "percentage" ? "%" : getCurrencySymbol(store || settings) })
          ] }),
          itemDiscountModal.discValue && !isNaN(parseFloat(itemDiscountModal.discValue)) && /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/30 rounded-xl p-3 text-sm flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Discounted price" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(
              itemDiscountModal.originalPrice - (itemDiscountModal.discType === "percentage" ? itemDiscountModal.originalPrice * parseFloat(itemDiscountModal.discValue) / 100 : parseFloat(itemDiscountModal.discValue)),
              store || settings
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setItemDiscountModal({ show: false, item: null, discType: "fixed", discValue: "" }),
                className: "flex-1 py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyItemDiscount,
                className: "flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg ",
                children: "Apply"
              }
            )
          ] })
        ] }) }),
        converterModal.show && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-command flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Edit Item Values" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 truncate", children: converterModal.item?.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-2", children: "When Total changes, recalculate:" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 bg-sunken p-1 rounded-xl", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setConverterModal((p) => ({ ...p, mode: "price" })),
                  className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === "price" ? "bg-sunken shadow text-amber-600 dark:text-amber-400" : "text-ink-muted"}`,
                  children: [
                    getCurrencySymbol(store || settings),
                    " Price"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setConverterModal((p) => ({ ...p, mode: "qty" })),
                  className: `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${converterModal.mode === "qty" ? "bg-sunken shadow text-amber-600 dark:text-amber-400" : "text-ink-muted"}`,
                  children: "# Qty"
                }
              )
            ] })
          ] }),
          [
            { label: "Unit Price", field: "price", icon: getCurrencySymbol(store || settings), color: "indigo" },
            { label: "Quantity", field: "qty", icon: "#", color: "emerald" },
            { label: "Total", field: "total", icon: getCurrencySymbol(store || settings), color: "amber" }
          ].map(({ label, field, icon, color }) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold text-ink-muted uppercase block mb-1", children: label }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: `absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-${color}-500`, children: icon }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  value: converterModal[field],
                  onChange: (e) => handleConverterChange(field, e.target.value),
                  onKeyDown: (e) => e.key === "Enter" && applyConverter(),
                  className: `w-full pl-8 pr-4 py-3 border border-line dark:border-line rounded-xl bg-sunken text-ink font-bold text-base focus:ring-2 focus:ring-${color}-400 outline-none`
                }
              )
            ] })
          ] }, field)),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setConverterModal({ show: false, item: null, mode: "price", price: "", qty: "", total: "" }),
                className: "flex-1 py-3 bg-sunken text-ink-secondary rounded-xl font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyConverter,
                className: "flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg ",
                children: "Apply"
              }
            )
          ] })
        ] }) }),
        showSyncHub && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-drawer flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm vq-anim-fade", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-line text-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg ", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-ink leading-tight", children: "Sync Hub" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted font-medium font-mono uppercase tracking-widest", children: [
                  pendingCount,
                  " Pending Sales"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setShowSyncHub(false), className: "w-10 h-10 rounded-full hover:bg-white dark:hover:bg-interactive-hover flex items-center justify-center text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(X, { size: 24 }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 max-h-[60vh] overflow-y-auto custom-scrollbar", children: [
            !isOnline2 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0", children: /* @__PURE__ */ jsx(WifiOff, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-red-800 dark:text-red-300", children: "Working Offline" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600/80 dark:text-red-400/80", children: "You are currently offline. Sales will be safely stored here until your connection returns." })
              ] })
            ] }),
            offlineSales.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-12 text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-app flex items-center justify-center text-neutral-300 mx-auto mb-4", children: /* @__PURE__ */ jsx(Check, { size: 40 }) }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-bold", children: "All sales are synced!" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: offlineSales.map((sale) => /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl border border-line hover:border-amber-200 dark:hover:border-amber-900/40 bg-surface/50 dark:bg-app transition-all group", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-surface border border-line text-2xs font-bold uppercase text-ink-muted tracking-tighter", children: "OFFLINE" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: sale.data.customer_name || "Walk-in Customer" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-xs font-bold text-ink-muted", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(ShoppingCart, { size: 14, className: "text-brand-400" }),
                    " ",
                    sale.data.cart?.length || 0,
                    " Items"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400", children: [
                    /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
                    " ",
                    formatCurrency(sale.data.total_amount || 0, store || settings)
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-ink-muted", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 14 }),
                    " ",
                    new Date(sale.created_at).toLocaleTimeString()
                  ] }),
                  sale.attempt_count > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-amber-500", children: [
                    "⚠ ",
                    sale.attempt_count,
                    " attempt",
                    sale.attempt_count !== 1 ? "s" : ""
                  ] })
                ] }),
                syncErrors[sale.id] && /* @__PURE__ */ jsx("div", { className: "mt-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-red-600 dark:text-red-400", children: [
                  "⚠ Sync Error: ",
                  syncErrors[sale.id]
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleRecallOfflineSale(sale),
                    className: "h-9 px-4 rounded-xl bg-surface border border-line text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-xs font-bold transition-all shadow-sm",
                    children: "Recall to Cart"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      showConfirm("Delete Offline Sale", "This will permanently erase this sale from local storage. Are you sure?", async () => {
                        await deletePendingSale(sale.id);
                        setOfflineSales((prev) => prev.filter((s) => s.id !== sale.id));
                      }, true);
                    },
                    className: "w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-line text-red-500 hover:bg-red-50 transition-all shadow-sm",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                  }
                )
              ] })
            ] }) }, sale.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-app border-t border-line flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted font-bold", children: lastSyncTime ? `Last checked: ${lastSyncTime.toLocaleTimeString()}` : "Syncing enabled" }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => syncPendingSales(),
                disabled: isSyncing || !isOnline2,
                className: `px-6 h-12 rounded-2xl flex items-center gap-2 font-bold transition-all ${isSyncing || !isOnline2 ? "bg-sunken text-ink-muted dark:bg-surface cursor-not-allowed" : "bg-brand-600 text-white shadow-lg  hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0"}`,
                children: [
                  /* @__PURE__ */ jsx(RefreshCcw, { size: 18, className: isSyncing ? "animate-spin" : "" }),
                  /* @__PURE__ */ jsx("span", { children: isSyncing ? "SYNCING..." : "FORCE SYNC NOW" })
                ]
              }
            ) })
          ] })
        ] }) }),
        lastClearedCart && /* @__PURE__ */ jsxs("div", { className: "fixed bottom-14 left-1/2 -translate-x-1/2 z-toast bg-overlay text-ink px-5 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-4 vq-anim-rise", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold", children: [
            "Cart cleared (",
            lastClearedCart.cart.length,
            " items removed)"
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleRestoreClearedCart,
              className: "px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Undo2, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: "Undo" })
              ]
            }
          )
        ] }),
        showRecentInvoices && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-line flex flex-col max-h-[86vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex items-center justify-between bg-sunken/40 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(History, { size: 19 }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-clip font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: "Recent invoices" }),
                /* @__PURE__ */ jsx("p", { className: "vq-clip text-xs text-ink-muted", children: "Reprint a receipt, or recall a sale to edit it" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowRecentInvoices(false),
                className: "w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted shrink-0",
                "aria-label": "Close",
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-2", children: [
            loadingRecent && /* @__PURE__ */ jsx("p", { className: "py-10 text-center text-ink-muted font-bold", children: "Loading…" }),
            !loadingRecent && recentInvoices.length === 0 && /* @__PURE__ */ jsx("p", { className: "py-10 text-center text-ink-muted font-bold", children: "No sales yet today." }),
            !loadingRecent && recentInvoices.map((inv) => /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg border border-line bg-app flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("p", { className: "vq-clip font-bold text-ink", children: [
                  inv.reference_number ? `#${inv.reference_number}` : `Sale ${inv.id}`,
                  /* @__PURE__ */ jsxs("span", { className: "text-ink-muted font-medium", children: [
                    " · ",
                    inv.customer?.name || inv.customer_name || "Walk-in"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "vq-num text-xs text-ink-muted", children: [
                  money(inv.total_amount || inv.total || 0),
                  inv.created_at ? ` · ${new Date(inv.created_at).toLocaleTimeString()}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setLastSale(inv);
                    printReceipt("reprint");
                  },
                  className: "px-4 rounded-lg bg-surface border border-line text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-xs font-bold shrink-0",
                  children: [
                    /* @__PURE__ */ jsx(Printer, { size: 14, className: "inline mr-1.5" }),
                    "Reprint"
                  ]
                }
              )
            ] }, inv.id))
          ] })
        ] }) }),
        parkedDropdownOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-line flex flex-col max-h-[80vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex items-center justify-between bg-sunken/40", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: "Parked sales" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setParkedDropdownOpen(false),
                className: "w-10 h-10 rounded-lg hover:bg-interactive-hover flex items-center justify-center text-ink-muted",
                "aria-label": "Close",
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: parkedSales.length === 0 ? /* @__PURE__ */ jsx("p", { className: "p-10 text-center text-ink-muted font-bold", children: "No parked sales." }) : parkedSales.map((parked) => /* @__PURE__ */ jsx(
            "div",
            {
              onClick: () => handleRecallSale(parked.id),
              className: "p-4 hover:bg-interactive-hover cursor-pointer border-b border-line last:border-0 transition-colors",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "vq-clip font-bold text-ink", children: parked.customer_name || "Walk-in customer" }),
                  /* @__PURE__ */ jsxs("p", { className: "vq-num text-xs text-ink-muted", children: [
                    parked.items_count,
                    " ",
                    parked.items_count === 1 ? "item" : "items",
                    " · ",
                    money(parked.total || 0)
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-xs mt-1", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 12, className: "text-amber-500 shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: `font-medium ${getTimeRemaining(parked.expires_at).includes("Expired") ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`, children: getTimeRemaining(parked.expires_at).includes("Expired") ? "Expired" : `Expires in ${getTimeRemaining(parked.expires_at)}` })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => handleDeleteParked(parked.id, e),
                    className: "w-10 h-10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-ink-muted hover:text-red-600 flex items-center justify-center transition-colors shrink-0",
                    "aria-label": "Delete parked sale",
                    children: /* @__PURE__ */ jsx(X, { size: 16 })
                  }
                )
              ] })
            },
            parked.id
          )) })
        ] }) }),
        /* @__PURE__ */ jsx(
          RegisterSettings,
          {
            open: settingsOpen,
            onClose: () => setSettingsOpen(false),
            initialTab: settingsTab,
            presets: PRESETS,
            presetId: currentPresetId,
            composition,
            layout,
            onApplyPreset: (id) => {
              applyPreset(id);
              addToast(`${id.charAt(0).toUpperCase()}${id.slice(1)} layout applied`, "success");
            },
            onUpdateComposition: updateComposition,
            serviceMode,
            setServiceMode: saveServiceMode,
            serviceCharge: serviceChargeSetting,
            onOpenFloorPlan: () => {
              setSettingsOpen(false);
              router.visit(route("store.tables.plan", { store_slug: store?.slug }));
            },
            setServiceCharge: saveServiceCharge,
            terminal,
            surface: surfaceButtons,
            setSurface: setSurfaceButtons,
            onResetWidths: () => {
              const base = PRESETS.find((p) => p.id === currentPresetId)?.comp;
              if (!base) return;
              updateComposition((prev) => ({
                ...prev,
                catalog: { ...prev.catalog, size: base.catalog.size, rows: base.catalog.rows },
                split: { cart: base.split.cart, tender: prev.tender === "column" ? base.split.tender : 0 }
              }));
              addToast("Column widths reset", "info");
            },
            seniorMode,
            setSeniorMode: (v) => {
              setSeniorMode(v);
              try {
                sessionStorage.setItem("pos_senior_mode", JSON.stringify(v));
              } catch (_) {
              }
            },
            showRail,
            setShowRail: (v) => {
              setShowRail(v);
              try {
                localStorage.setItem("pos_show_rail", JSON.stringify(v));
              } catch (_) {
              }
            },
            uiScale,
            setUiScale,
            enableTax,
            setEnableTax: (v) => {
              setEnableTax(v);
              try {
                localStorage.setItem("pos_enable_tax", String(v));
              } catch (_) {
              }
            },
            enableFulfilment,
            setEnableFulfilment: (v) => {
              setEnableFulfilment(v);
              try {
                localStorage.setItem("pos_enable_fulfilment", String(v));
              } catch (_) {
              }
            },
            enableFreeQty,
            setEnableFreeQty: (v) => {
              setEnableFreeQty(v);
              try {
                localStorage.setItem("pos_enable_free_qty", String(v));
              } catch (_) {
              }
              if (!v) setShowFreeQty(false);
            },
            roundOff,
            setRoundOff,
            autoFillCash,
            setAutoFillCash,
            returnMode,
            setReturnMode,
            returnPolicyLabel: posReturnMode === "open" ? "Open returns" : posReturnMode === "customer_or_reference" ? "Customer or reference" : "Reference required",
            discountPresets,
            setDiscountPresets: (v) => {
              setDiscountPresets(v);
              try {
                localStorage.setItem("pos_discount_presets", JSON.stringify(v));
              } catch (_) {
              }
            },
            printOnComplete,
            setPrintOnComplete: (v) => {
              setPrintOnComplete(v);
              try {
                localStorage.setItem("pos_print_on_complete", JSON.stringify(v));
              } catch (_) {
              }
            },
            openDrawerOnCash,
            setOpenDrawerOnCash,
            isStationConnected,
            printerState,
            printerCount,
            isOnline: isOnline2,
            pendingCount,
            onOpenCashDrawer: handleOpenCashDrawer,
            onOpenParked: () => {
              setSettingsOpen(false);
              loadParkedSales();
              setParkedDropdownOpen(true);
            },
            parkedCount: parkedSales.length,
            onOpenRecent: () => {
              setSettingsOpen(false);
              loadRecentInvoices();
              setShowRecentInvoices(true);
            },
            onOpenSyncHub: () => {
              setSettingsOpen(false);
              setShowSyncHub(true);
              loadOfflineSales();
            },
            onRunSetupWizard: () => {
              setSettingsOpen(false);
              setShowSetupWizard(true);
            },
            onResetAll: handleResetRegister
          }
        ),
        /* @__PURE__ */ jsx(
          SetupWizardModal,
          {
            open: showSetupWizard,
            onClose: () => setShowSetupWizard(false),
            onApply: handleWizardApply,
            currentPrefs: wizardPrefs,
            store
          }
        )
      ] })
    }
  );
};
function Pos({
  settings,
  bankAccounts,
  recalledSale,
  warehouses = [],
  occupancy = null,
  terminal = "counter",
  positions = [],
  tickets = [],
  zones = [],
  kitchen = 0
}) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      POSInterface,
      {
        settings,
        recalledSale,
        bankAccounts,
        warehouses,
        occupancy,
        terminal,
        positions,
        tickets,
        zones,
        kitchen
      }
    ),
    /* @__PURE__ */ jsx(PosTourGuide, { store })
  ] });
}
export {
  Pos as default
};
