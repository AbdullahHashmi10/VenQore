import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import axios from "axios";
import { LayoutGrid, Hash, Users, ExternalLink, Loader2, Check, X, Monitor, UtensilsCrossed, ChefHat, AlertTriangle, Type, Coffee, Zap, Store, ShoppingBag, Bike, ArrowLeft, ArrowRight } from "lucide-react";
import { g as presetComposition, L as LAW } from "./engine-CI2MYANb.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
function buildProfiles(tt = (s) => s) {
  return [
    {
      id: "scan",
      name: "Scanner-driven",
      note: "Large inventory, barcode-first. Pharmacy, hardware, distribution.",
      family: { desk: "scan", short: "scan", tablet: "scan", phone: "counter" }
    },
    {
      id: "retail",
      name: "General retail",
      note: "Staff both scan and browse. 200–2,000 SKUs.",
      family: { desk: "column", short: "stack", tablet: "row", phone: "counter" }
    },
    {
      id: "visual",
      name: "Browse-led",
      note: "The product is the interface. Café, QSR, boutique.",
      family: { desk: "grid", short: "stack", tablet: "row", phone: "counter" }
    },
    {
      id: "table",
      name: tt("Table service"),
      note: tt("The unit of work is the table, not the sale."),
      family: { desk: "table", short: "table", tablet: "table", phone: "counter" }
    }
  ];
}
const PROFILES = buildProfiles();
function buildReturnPolicies(tt = (s) => s) {
  return [
    { id: "reference", label: "Reference required", note: "A return must load an original invoice." },
    { id: "party_or_ref", label: tt("Customer or reference"), note: "Either identifies the original sale." },
    { id: "open", label: "Open returns", note: "Any item may be returned without a reference." }
  ];
}
const RETURN_POLICIES = buildReturnPolicies();
const DEFAULT_OPS = {
  senior: false,
  // large text mode
  uiScale: 1,
  // interface scale
  autoPrint: true,
  // auto-print on complete
  openDrawerOnCash: true,
  // hardware
  defaultTax: 1,
  // TAX_RATES index
  taxMode: "exclusive",
  // inclusive | exclusive
  returnPolicy: "reference",
  returnWindowDays: 14,
  // enforced by the policy — was parsed and discarded
  allowOversell: false,
  // stop_sale_negative_stock, inverted
  roundOff: true,
  discountPresets: [5, 10, 15, 20],
  autoFillCash: true,
  showMargin: false,
  confirmBackorder: true,
  warehouse: 1,
  bank: 1
};
const DEFAULT_PERMS = {
  "pos.checkout": true,
  "pos.void_item": true,
  "pos.refund": true,
  "pos.price_override": true,
  "pos.discount": true,
  "pos.open_drawer": true
};
const BUSINESS_SUGGESTIONS = [
  {
    id: "retail",
    title: "General Retail & Mart",
    tag: "Standard",
    icon: "🛍️",
    desc: "Product catalog on side, fast cart, instant payment. Best for general retail, grocery, mini-marts, apparel.",
    profile: "retail",
    preset: "column",
    ops: { senior: false, autoPrint: true }
  },
  {
    id: "scan",
    title: "Barcode / High-Speed Counter",
    tag: "High Speed",
    icon: "⚡",
    desc: "No catalog clutter. 100% focused on barcode scanning and keyboard speed. Best for pharmacy, busy checkout, wholesale.",
    profile: "scan",
    preset: "scan",
    ops: { senior: false, autoPrint: true, autoFillCash: true }
  },
  {
    id: "visual",
    title: "Cafe, Bakery & Food",
    tag: "Visual Touch",
    icon: "☕",
    desc: "Touch grid with prominent categories and item tiles. Built for touchscreens, cafes, bakeries, fast food.",
    profile: "visual",
    preset: "grid",
    ops: { senior: false, autoPrint: true }
  },
  {
    id: "simple",
    title: "Simple / Non-Techie Counter",
    tag: "Easy & Clear",
    icon: "✨",
    desc: "Large text, extra clear buttons, simple 2-step checkout without complex data. Perfect for single counters or non-technical staff.",
    profile: "retail",
    preset: "column",
    ops: { senior: true, autoPrint: true, autoFillCash: true }
  },
  {
    id: "table",
    title: "Restaurant & Table Service",
    tag: "Dine-In",
    icon: "🍽️",
    desc: "Table floor plan management, hold/recall orders by table, and bill splitting. Best for dine-in restaurants & salons.",
    profile: "table",
    preset: "table",
    ops: { senior: false, autoPrint: true }
  }
];
const DEFAULTS = {
  auto: true,
  profile: "retail",
  preset: "column",
  comp: presetComposition("column"),
  ops: { ...DEFAULT_OPS },
  perms: { ...DEFAULT_PERMS },
  rail: true,
  wizardCompleted: false
};
function screenBand(vw, vh) {
  if (vw <= LAW.pos.phoneMax) return "phone";
  if (vw < LAW.pos.catalogResidentMinVw) return "tablet";
  return vh < 760 ? "short" : "desk";
}
function autoPreset(profileId, vw, vh) {
  const p = PROFILES.find((x) => x.id === profileId) || PROFILES[1];
  return p.family[screenBand(vw, vh)];
}
function autoComposition(profileId, vw, vh) {
  const id = autoPreset(profileId, vw, vh);
  const comp = presetComposition(id);
  if (profileId === "table") comp.floor = vw >= 1900 ? "left" : "overlay";
  else comp.floor = "off";
  return { preset: id, comp };
}
const KEY = "venqore.newpos.prefs.v1";
function currentTenantScope() {
  try {
    if (typeof window !== "undefined") {
      const appEl = document.getElementById("app");
      if (appEl?.dataset?.page) {
        const pd = JSON.parse(appEl.dataset.page);
        const slug = pd?.props?.store?.slug || pd?.props?.currentTenant?.slug;
        if (slug) return slug;
      }
      const parts = window.location.pathname.split("/");
      const sIdx = parts.indexOf("s");
      if (sIdx !== -1 && parts[sIdx + 1]) {
        return parts[sIdx + 1];
      }
    }
  } catch (_) {
  }
  return "default";
}
const scopedKey = (userId, deviceId2, tenantScope = currentTenantScope()) => `${KEY}.${tenantScope}.${userId ?? "anon"}.${deviceId2 ?? "this"}`;
function deviceId() {
  try {
    let d = localStorage.getItem("venqore.device.id");
    if (!d) {
      d = `dev-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("venqore.device.id", d);
    }
    return d;
  } catch {
    return "this";
  }
}
function loadPrefs(userId, tenantScope = currentTenantScope(), serverSettings = {}) {
  const serverOps = {};
  if (serverSettings.pos_return_mode) {
    serverOps.returnPolicy = serverSettings.pos_return_mode;
  }
  if (serverSettings.pos_return_window !== void 0 && serverSettings.pos_return_window !== "") {
    const win = parseInt(serverSettings.pos_return_window, 10);
    if (!isNaN(win)) serverOps.returnWindowDays = win;
  }
  if (serverSettings.round_off_total !== void 0) {
    serverOps.roundOff = serverSettings.round_off_total !== "none";
  }
  if (serverSettings.stop_sale_negative_stock !== void 0) {
    serverOps.allowOversell = serverSettings.stop_sale_negative_stock === "0" || serverSettings.stop_sale_negative_stock === false;
  }
  if (serverSettings.senior_mode !== void 0) {
    serverOps.senior = serverSettings.senior_mode === "1" || serverSettings.senior_mode === true;
  }
  if (serverSettings.show_margin_percentage !== void 0) {
    serverOps.showMargin = serverSettings.show_margin_percentage === "1" || serverSettings.show_margin_percentage === true;
  }
  if (serverSettings.pos_auto_fill_cash !== void 0) {
    serverOps.autoFillCash = serverSettings.pos_auto_fill_cash === "1" || serverSettings.pos_auto_fill_cash === true;
  }
  const base = { ...DEFAULTS, comp: presetComposition("column"), ops: { ...DEFAULT_OPS, ...serverOps }, perms: { ...DEFAULT_PERMS } };
  try {
    const key = scopedKey(userId, deviceId(), tenantScope);
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacyRaw = localStorage.getItem(`${KEY}.${userId ?? "anon"}.${deviceId() ?? "this"}`);
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          if (legacy?.comp) {
            return { ...base, comp: { ...base.comp, ...legacy.comp } };
          }
        } catch (_) {
        }
      }
      return base;
    }
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      comp: saved.comp ? { ...base.comp, ...saved.comp } : base.comp,
      ops: { ...base.ops, ...saved.ops || {}, ...serverOps },
      perms: { ...base.perms, ...saved.perms || {} }
    };
  } catch {
    return base;
  }
}
function savePrefs(userId, prefs, tenantScope = currentTenantScope()) {
  try {
    localStorage.setItem(scopedKey(userId, deviceId(), tenantScope), JSON.stringify(prefs));
  } catch {
  }
}
const CART_KEY = "venqore.newpos.rescue.v1";
const rescueKey = (userId, tenantScope = currentTenantScope()) => `${CART_KEY}.${tenantScope}.${userId ?? "anon"}.${deviceId()}`;
function saveRescue(userId, tabs, tenantScope = currentTenantScope()) {
  try {
    localStorage.setItem(rescueKey(userId, tenantScope), JSON.stringify({ at: Date.now(), tabs }));
  } catch {
  }
}
function loadRescue(userId, tenantScope = currentTenantScope()) {
  try {
    const raw = localStorage.getItem(rescueKey(userId, tenantScope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.at > 12 * 3600 * 1e3) return null;
    return parsed;
  } catch {
    return null;
  }
}
function clearRescue(userId, tenantScope = currentTenantScope()) {
  try {
    localStorage.removeItem(rescueKey(userId, tenantScope));
  } catch {
  }
}
function LayoutPreviewShell({
  preset = "column",
  rail = true,
  senior = false,
  className = "",
  style = {}
}) {
  const tt = useTermText();
  const isScan = preset === "scan";
  const isColumn = preset === "column";
  const isRow = preset === "row";
  const isGrid = preset === "grid";
  const isStack = preset === "stack";
  const isCounter = preset === "counter";
  const isTable = preset === "table";
  return /* @__PURE__ */ jsxs("div", { className: `nqp-preview-shell ${className}`, style, children: [
    /* @__PURE__ */ jsxs("div", { className: "nqp-prev-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "nqp-prev-dots", children: [
        /* @__PURE__ */ jsx("span", { className: "dot dot-red" }),
        /* @__PURE__ */ jsx("span", { className: "dot dot-amber" }),
        /* @__PURE__ */ jsx("span", { className: "dot dot-green" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqp-prev-title", children: [
        /* @__PURE__ */ jsx("span", { className: "nqp-prev-brand", children: "VenQore POS" }),
        /* @__PURE__ */ jsxs("span", { className: "nqp-prev-badge", children: [
          preset.toUpperCase(),
          " LAYOUT"
        ] }),
        senior ? /* @__PURE__ */ jsx("span", { className: "nqp-prev-badge badge-accent", children: "LARGE TEXT" }) : null,
        rail ? /* @__PURE__ */ jsx("span", { className: "nqp-prev-badge badge-muted", children: "NAV RAIL ON" }) : null
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "nqp-prev-status", children: [
        /* @__PURE__ */ jsx("span", { className: "status-indicator" }),
        " Live Register Preview"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-prev-body", children: [
      rail && !isCounter ? /* @__PURE__ */ jsxs("div", { className: "nqp-prev-rail", children: [
        /* @__PURE__ */ jsx("div", { className: "nqp-prev-rail-item active", children: "🛍️" }),
        /* @__PURE__ */ jsx("div", { className: "nqp-prev-rail-item", children: "📦" }),
        /* @__PURE__ */ jsx("div", { className: "nqp-prev-rail-item", children: "🧾" }),
        /* @__PURE__ */ jsx("div", { className: "nqp-prev-rail-item", children: "📊" }),
        /* @__PURE__ */ jsx("div", { style: { marginTop: "auto" }, className: "nqp-prev-rail-item", children: "⚙️" })
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "nqp-prev-content", children: [
        /* @__PURE__ */ jsxs("div", { className: "nqp-prev-topbar", children: [
          /* @__PURE__ */ jsxs("div", { className: "nqp-prev-search", children: [
            /* @__PURE__ */ jsx("span", { children: "🔍" }),
            " ",
            isScan ? "Hero Barcode Scanner (Focus Active)..." : "Scan barcode or search products..."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "nqp-prev-tab-badge", children: "Tab 1 (Walk-in)" }),
          /* @__PURE__ */ jsx("div", { className: "nqp-prev-time", children: "12:00 PM" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "nqp-prev-stage", children: [
          isTable ? /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane pane-floor", children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane-hdr", children: [
              "🍽️ ",
              tt("Table Floor Plan")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-floor-grid", children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-table-card seated", children: [
                /* @__PURE__ */ jsx("b", { children: "T-1" }),
                /* @__PURE__ */ jsx("span", { children: "2 Guests · ₹1,450" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-table-card free", children: [
                /* @__PURE__ */ jsx("b", { children: "T-2" }),
                /* @__PURE__ */ jsx("span", { children: "Available" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-table-card billed", children: [
                /* @__PURE__ */ jsx("b", { children: "T-3" }),
                /* @__PURE__ */ jsx("span", { children: "Billed · ₹3,200" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-table-card free", children: [
                /* @__PURE__ */ jsx("b", { children: "T-4" }),
                /* @__PURE__ */ jsx("span", { children: "Available" })
              ] })
            ] })
          ] }) : null,
          isRow || isStack ? /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane pane-catalog-top", children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane-hdr", children: [
              /* @__PURE__ */ jsx("span", { children: "📦 Quick Menu / Category Strip" }),
              /* @__PURE__ */ jsx("span", { className: "tag-pill", children: "32 items" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tile-strip", children: [
              /* @__PURE__ */ jsx("div", { className: "nqp-prev-tile", children: "☕ Hot Coffee" }),
              /* @__PURE__ */ jsx("div", { className: "nqp-prev-tile", children: "🥐 Croissant" }),
              /* @__PURE__ */ jsx("div", { className: "nqp-prev-tile", children: "🍰 Cheesecake" }),
              /* @__PURE__ */ jsx("div", { className: "nqp-prev-tile", children: "🥤 Iced Latte" }),
              /* @__PURE__ */ jsx("div", { className: "nqp-prev-tile", children: "🥪 Club Sandwich" })
            ] })
          ] }) : null,
          isColumn || isGrid ? /* @__PURE__ */ jsxs("div", { className: `nqp-prev-pane pane-catalog ${isGrid ? "pane-grid-dominant" : ""}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane-hdr", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "📦 ",
                tt("Product Catalog")
              ] }),
              /* @__PURE__ */ jsx("span", { className: "tag-pill", children: isGrid ? "Touch Grid 40%" : "Reference 20%" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-cats", children: [
              /* @__PURE__ */ jsx("span", { className: "active", children: "All" }),
              /* @__PURE__ */ jsx("span", { children: "Bakery" }),
              /* @__PURE__ */ jsx("span", { children: "Drinks" }),
              /* @__PURE__ */ jsx("span", { children: "Snacks" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `nqp-prev-tile-grid ${isGrid ? "grid-2col" : "grid-1col"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tile-card", children: [
                /* @__PURE__ */ jsx("div", { className: "tile-img" }),
                /* @__PURE__ */ jsx("b", { children: "Mineral Water 1.5L" }),
                /* @__PURE__ */ jsx("span", { className: "price", children: "₹90" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tile-card", children: [
                /* @__PURE__ */ jsx("div", { className: "tile-img" }),
                /* @__PURE__ */ jsx("b", { children: "Fresh Milk 1L" }),
                /* @__PURE__ */ jsx("span", { className: "price", children: "₹240" })
              ] }),
              isGrid ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tile-card", children: [
                  /* @__PURE__ */ jsx("div", { className: "tile-img" }),
                  /* @__PURE__ */ jsx("b", { children: "Brown Bread" }),
                  /* @__PURE__ */ jsx("span", { className: "price", children: "₹160" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tile-card", children: [
                  /* @__PURE__ */ jsx("div", { className: "tile-img" }),
                  /* @__PURE__ */ jsx("b", { children: "Butter Cookies" }),
                  /* @__PURE__ */ jsx("span", { className: "price", children: "₹350" })
                ] })
              ] }) : null
            ] })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: `nqp-prev-pane pane-cart ${isScan ? "pane-cart-max" : ""} ${isCounter ? "pane-counter" : ""}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane-hdr", children: [
              /* @__PURE__ */ jsx("span", { children: "🛒 Active Cart" }),
              /* @__PURE__ */ jsx("span", { className: "cart-counter", children: "3 Items" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-cart-list", children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-cart-row", children: [
                /* @__PURE__ */ jsxs("div", { className: "cart-item-name", children: [
                  /* @__PURE__ */ jsx("b", { children: "Cement 50kg Bag" }),
                  /* @__PURE__ */ jsx("span", { className: "cart-sku", children: "SKU: CEM-01 · 12 in stock" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "cart-qty-stepper", children: [
                  /* @__PURE__ */ jsx("span", { children: "−" }),
                  " ",
                  /* @__PURE__ */ jsx("b", { children: "2" }),
                  " ",
                  /* @__PURE__ */ jsx("span", { children: "+" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "cart-item-total", children: "₹2,500" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-cart-row", children: [
                /* @__PURE__ */ jsxs("div", { className: "cart-item-name", children: [
                  /* @__PURE__ */ jsx("b", { children: "Steel Rod 12mm" }),
                  /* @__PURE__ */ jsx("span", { className: "cart-sku", children: "SKU: STL-12 · 40 in stock" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "cart-qty-stepper", children: [
                  /* @__PURE__ */ jsx("span", { children: "−" }),
                  " ",
                  /* @__PURE__ */ jsx("b", { children: "5" }),
                  " ",
                  /* @__PURE__ */ jsx("span", { children: "+" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "cart-item-total", children: "₹4,900" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-cart-row", children: [
                /* @__PURE__ */ jsxs("div", { className: "cart-item-name", children: [
                  /* @__PURE__ */ jsx("b", { children: "Paint 4L Ivory White" }),
                  /* @__PURE__ */ jsx("span", { className: "cart-sku", children: "SKU: PNT-IV · 3 in stock" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "cart-qty-stepper", children: [
                  /* @__PURE__ */ jsx("span", { children: "−" }),
                  " ",
                  /* @__PURE__ */ jsx("b", { children: "1" }),
                  " ",
                  /* @__PURE__ */ jsx("span", { children: "+" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "cart-item-total", children: "₹3,400" })
              ] })
            ] }),
            isGrid || isStack || isCounter ? /* @__PURE__ */ jsxs("div", { className: "nqp-prev-docked-pay", children: [
              /* @__PURE__ */ jsxs("div", { className: "docked-total", children: [
                /* @__PURE__ */ jsx("span", { children: "Net Payable" }),
                /* @__PURE__ */ jsx("b", { children: "₹10,800" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-prev-pay-btn", children: "Take Payment (₹10,800)" })
            ] }) : null
          ] }),
          isColumn || isScan || isRow || isTable ? /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane pane-tender", children: [
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-pane-hdr", children: [
              /* @__PURE__ */ jsx("span", { children: "💳 Payment & Tender" }),
              /* @__PURE__ */ jsx("span", { className: "tag-pill", children: "Resident" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "nqp-prev-tender-body", children: [
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-kv", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { children: "₹10,800" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-kv", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax (GST 18%)" }),
                /* @__PURE__ */ jsx("span", { children: "₹1,944" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-kv", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount" }),
                /* @__PURE__ */ jsx("span", { className: "text-accent", children: "− ₹500" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-kv total-row", children: [
                /* @__PURE__ */ jsx("b", { children: "Net Total" }),
                /* @__PURE__ */ jsx("b", { className: "total-amount", children: "₹12,244" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "nqp-prev-methods", children: [
                /* @__PURE__ */ jsx("span", { className: "method-pill active", children: "Cash" }),
                /* @__PURE__ */ jsx("span", { className: "method-pill", children: "Card" }),
                /* @__PURE__ */ jsx("span", { className: "method-pill", children: "UPI" })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "nqp-prev-pay-btn green", children: "Complete Sale" })
            ] })
          ] }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "nqp-prev-footer-legend", children: [
      /* @__PURE__ */ jsxs("div", { className: "legend-item", children: [
        /* @__PURE__ */ jsx("span", { className: "legend-dot dot-teal" }),
        " ",
        /* @__PURE__ */ jsx("b", { children: "Cart & Items" }),
        " (",
        isScan ? "Full Width" : "Center focus",
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "legend-item", children: [
        /* @__PURE__ */ jsx("span", { className: "legend-dot dot-sky" }),
        " ",
        /* @__PURE__ */ jsx("b", { children: "Catalog" }),
        " (",
        isScan ? "Off (Scanner-first)" : isRow || isStack ? "Top Strip" : isGrid ? "40% Touch Grid" : isTable ? "Touch" : "20% Column",
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "legend-item", children: [
        /* @__PURE__ */ jsx("span", { className: "legend-dot dot-purple" }),
        " ",
        /* @__PURE__ */ jsx("b", { children: "Payment" }),
        " (",
        isGrid || isStack || isCounter ? "Docked Pay Bar" : "Resident Column",
        ")"
      ] }),
      isTable ? /* @__PURE__ */ jsxs("div", { className: "legend-item", children: [
        /* @__PURE__ */ jsx("span", { className: "legend-dot dot-amber" }),
        " ",
        /* @__PURE__ */ jsx("b", { children: tt("Table Management") }),
        " (Dine-in Floor)"
      ] }) : null
    ] })
  ] });
}
const ZONE_SUGGESTIONS = ["Main Dining", "Patio", "Bar", "Private Room"];
const DEFAULT_FLOOR = {
  zone: "Main Dining",
  count: 12,
  prefix: "T",
  start: 1,
  capacity: 4
};
function previewCodes(v, max = 8) {
  const n = Math.max(0, Math.min(200, Number(v.count) || 0));
  const start = Math.max(0, Number(v.start) || 0);
  const out = [];
  for (let i = 0; i < Math.min(n, max); i++) out.push(`${v.prefix}${start + i}`);
  return { codes: out, more: Math.max(0, n - out.length), total: n };
}
async function applyQuickFloor(storeSlug, v) {
  const r = (name) => route(name, { store_slug: storeSlug });
  const zone = (v.zone || "").trim() || DEFAULT_FLOOR.zone;
  try {
    await axios.post(r("store.tables.plan.zone.add"), { name: zone });
  } catch (e) {
    if (e?.response?.status !== 422) throw e;
  }
  const { data } = await axios.post(r("store.tables.plan.tables.bulk"), {
    zone,
    count: Math.max(1, Math.min(200, Number(v.count) || 1)),
    prefix: (v.prefix || "T").trim() || "T",
    start: Math.max(0, Number(v.start) || 0),
    capacity: Math.max(1, Math.min(99, Number(v.capacity) || 4))
  });
  return data;
}
function Stepper({ label, icon: Icon, value, onChange, min, max, step = 1, suffix }) {
  const clamp = (n) => Math.max(min, Math.min(max, n));
  return /* @__PURE__ */ jsxs("label", { className: "vqf-step", children: [
    /* @__PURE__ */ jsxs("span", { className: "vqf-step-l", children: [
      /* @__PURE__ */ jsx(Icon, { size: 12, "aria-hidden": "true" }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "vqf-step-c", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onChange(clamp((Number(value) || 0) - step)),
          "aria-label": `Fewer ${label.toLowerCase()}`,
          children: "−"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "vq-num",
          value,
          inputMode: "numeric",
          onChange: (e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            onChange(raw === "" ? "" : clamp(Number(raw)));
          },
          onBlur: (e) => {
            if (e.target.value === "") onChange(min);
          },
          "aria-label": label
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onChange(clamp((Number(value) || 0) + step)),
          "aria-label": `More ${label.toLowerCase()}`,
          children: "+"
        }
      )
    ] }),
    suffix && /* @__PURE__ */ jsx("span", { className: "vqf-step-s", children: suffix })
  ] });
}
function QuickFloorSetup({ value, onChange, storeSlug, compact = false }) {
  const v = value;
  const set = (k, val) => onChange({ ...v, [k]: val });
  const pv = useMemo(() => previewCodes(v, compact ? 6 : 10), [v, compact]);
  return /* @__PURE__ */ jsxs("div", { className: "vqf", children: [
    /* @__PURE__ */ jsxs("div", { className: "vqf-zone", children: [
      /* @__PURE__ */ jsxs("label", { className: "vqt-field vqt-field-stacked", children: [
        /* @__PURE__ */ jsxs("span", { className: "vqt-field-l", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 12, "aria-hidden": "true" }),
          " What is this area called?"
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "vqt-input",
            value: v.zone,
            onChange: (e) => set("zone", e.target.value),
            placeholder: "Main Dining",
            maxLength: 48
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vqf-chips", children: ZONE_SUGGESTIONS.map((z) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "vqf-chip",
          "data-on": z === v.zone ? "1" : "0",
          onClick: () => set("zone", z),
          children: z
        },
        z
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqf-nums", children: [
      /* @__PURE__ */ jsx(Stepper, { label: "Tables", icon: Hash, value: v.count, onChange: (n) => set("count", n), min: 1, max: 200 }),
      /* @__PURE__ */ jsx(Stepper, { label: "Seats each", icon: Users, value: v.capacity, onChange: (n) => set("capacity", n), min: 1, max: 99 }),
      /* @__PURE__ */ jsxs("label", { className: "vqf-step", children: [
        /* @__PURE__ */ jsxs("span", { className: "vqf-step-l", children: [
          /* @__PURE__ */ jsx(Hash, { size: 12, "aria-hidden": "true" }),
          " Prefix"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vqf-step-c vqf-step-c-plain", children: /* @__PURE__ */ jsx(
          "input",
          {
            value: v.prefix,
            maxLength: 8,
            onChange: (e) => set("prefix", e.target.value.replace(/\s/g, "")),
            "aria-label": "Table code prefix"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vqf-preview", "aria-live": "polite", children: [
      /* @__PURE__ */ jsxs("span", { className: "vqf-preview-l", children: [
        "Creates ",
        /* @__PURE__ */ jsx("b", { className: "vq-num", children: pv.total }),
        " table",
        pv.total === 1 ? "" : "s",
        " in",
        " ",
        /* @__PURE__ */ jsx("b", { children: (v.zone || "").trim() || "Main Dining" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "vqf-preview-codes", children: [
        pv.codes.map((c) => /* @__PURE__ */ jsx("span", { className: "vqf-tag vq-num", children: c }, c)),
        pv.more > 0 && /* @__PURE__ */ jsxs("span", { className: "vqf-tag vqf-tag-more vq-num", children: [
          "+",
          pv.more
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "vqf-note", children: [
      "Rename, resize or rearrange any of this later in the Floor Plan — nothing here is locked in, and running this again only adds the tables that are missing.",
      storeSlug && /* @__PURE__ */ jsxs(Fragment, { children: [
        " ",
        /* @__PURE__ */ jsxs(
          "a",
          {
            className: "vqf-link",
            href: route("store.tables.plan", { store_slug: storeSlug }),
            children: [
              "Open the full Floor Plan ",
              /* @__PURE__ */ jsx(ExternalLink, { size: 11, "aria-hidden": "true" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
function QuickFloorModal({ storeSlug, onClose, onDone, onError }) {
  const [v, setV] = useState(DEFAULT_FLOOR);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      await applyQuickFloor(storeSlug, v);
      onDone?.(v);
    } catch (e) {
      onError?.(e?.response?.data?.message || "The floor could not be set up.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "vqt-modal-scrim", onMouseDown: onClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vqt-modal vqt-modal-wide bg-surface border border-line",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Set up the floor",
      onMouseDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "vqt-modal-h", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 16, className: "text-brand-600", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink", style: { fontSize: "var(--vq-t-lg)" }, children: "Set up the floor" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vqt-modal-note", children: "Three answers and this room can take an order. Everything is editable afterwards." }),
        /* @__PURE__ */ jsx("div", { className: "vqt-modal-b", children: /* @__PURE__ */ jsx(QuickFloorSetup, { value: v, onChange: setV, storeSlug }) }),
        /* @__PURE__ */ jsxs("footer", { className: "vqt-modal-f", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "vqt-btn", onClick: onClose, children: "Not now" }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "vqt-btn vqt-btn-go", disabled: busy, onClick: go, children: [
            busy ? /* @__PURE__ */ jsx(Loader2, { size: 15, className: "vqf-spin" }) : /* @__PURE__ */ jsx(Check, { size: 15 }),
            "Create tables"
          ] })
        ] })
      ]
    }
  ) });
}
const ICONS = {
  retail: Store,
  scan: Zap,
  visual: Coffee,
  simple: Type,
  table: UtensilsCrossed
};
const SERVICE_OPTIONS = [
  {
    id: "counter",
    icon: Monitor,
    title: "Counter service",
    desc: "One queue, one till. The customer orders and pays in the same moment, and nothing is held open.",
    fits: "Retail, pharmacy, grocery, takeaway counters"
  },
  {
    id: "tables",
    icon: UtensilsCrossed,
    title: "Table service",
    desc: "The table is the unit of work, not the sale. Orders stay open, get added to, move, split, and settle at the end.",
    fits: "Dine-in restaurants, salons, clinics, workshops"
  },
  {
    id: "both",
    icon: LayoutGrid,
    title: "Both",
    desc: "A floor for the people sitting down and a counter for everyone else, on the same register.",
    fits: "Cafés, casual dining, anywhere with a pickup counter"
  }
];
function recommendFor(store) {
  const raw = `${store?.business_type || ""} ${store?.industry || ""} ${store?.name || ""}`.toLowerCase();
  if (/restaurant|dine.?in|dhaba|eatery|diner|steakhouse|buffet|salon|barber|spa|clinic/.test(raw)) {
    return { service: "tables", takeaway: true, delivery: false, counter: "table" };
  }
  if (/cafe|café|coffee|tea.?shop|chai|bistro|lounge/.test(raw)) {
    return { service: "both", takeaway: true, delivery: false, counter: "visual" };
  }
  if (/fast.?food|burger|pizza|shawarma|broast|fried.?chicken|biryani|food.?truck|kiosk|juice|dessert|ice.?cream|bakery|sweets|catering/.test(raw)) {
    return { service: "counter", takeaway: true, delivery: true, counter: "visual" };
  }
  if (/pharmac|medical|chemist|hardware|wholesal|distribut/.test(raw)) {
    return { service: "counter", takeaway: false, delivery: false, counter: "scan" };
  }
  return { service: "counter", takeaway: false, delivery: false, counter: "retail" };
}
function Toggle({ checked, onChange, label, disabled }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": !!checked,
      "aria-label": label,
      disabled,
      onClick: () => onChange(!checked),
      className: `relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        disabled:opacity-50 disabled:cursor-default
                        ${checked ? "bg-brand-600" : "bg-line-strong"}`,
      children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                              transition-[left,right] duration-fast ${checked ? "right-0.5" : "left-0.5"}` })
    }
  );
}
function PickCard({ icon: Icon, title, desc, meta, selected, recommended, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      "aria-pressed": selected,
      className: `text-left p-4 rounded-2xl border transition-all cursor-pointer
                        flex flex-col gap-2.5 h-full
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        ${selected ? "border-brand-500/50 bg-brand-50/60 dark:bg-brand-950/30 shadow-xs" : "border-line/80 bg-surface hover:border-line-strong hover:shadow-xs"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                                  ${selected ? "bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border-brand-300/60" : "bg-sunken/70 text-ink-secondary border-line/70"}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
          recommended && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wide px-2 py-1 rounded-lg\n                                     bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400\n                                     border border-emerald-200/70 dark:border-emerald-900/60", children: "Suggested" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-snug", children: title }),
        /* @__PURE__ */ jsx("span", { className: "block text-2xs text-ink-muted leading-relaxed flex-1", children: desc }),
        /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-between gap-2 pt-1 border-t border-line/60", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase tracking-wide truncate", children: meta }),
          selected && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-3xs font-bold text-brand-700 dark:text-brand-300 shrink-0", children: [
            /* @__PURE__ */ jsx(Check, { size: 12 }),
            " Selected"
          ] })
        ] })
      ]
    }
  );
}
function SetupWizardModal({
  open,
  onClose,
  onApply,
  currentPrefs = DEFAULTS,
  store = null,
  settings = null,
  /* Service style, lanes and the floor are store-wide and gated on
     `admin.settings_manage`. Without it those steps are not shown at all —
     offering a cashier a floor builder that 403s on submit is worse than
     not offering it. */
  canManageStore = false,
  onDone
}) {
  const suggestion = useMemo(() => recommendFor(store), [store]);
  const [service, setService] = useState(
    () => settings?.service_mode || suggestion.service
  );
  const [preparesOrders, setPreparesOrders] = useState(() => {
    if (settings?.prepares_orders !== void 0) {
      return String(settings.prepares_orders) === "1";
    }
    return ["restaurant", "cafe", "bakery", "food_counter", "catering"].includes(store?.business_type) || suggestion.service !== "counter";
  });
  const [selectedOptionId, setSelectedOptionId] = useState(() => {
    const match = BUSINESS_SUGGESTIONS.find((b) => b.id === currentPrefs?.profile);
    return match ? match.id : suggestion.counter;
  });
  const [lanes, setLanes] = useState(() => ({
    takeaway: settings?.lane_takeaway !== void 0 ? String(settings.lane_takeaway) === "1" : suggestion.takeaway,
    delivery: settings?.lane_delivery !== void 0 ? String(settings.lane_delivery) === "1" : suggestion.delivery
  }));
  const [floor, setFloor] = useState(DEFAULT_FLOOR);
  const [makeFloor, setMakeFloor] = useState(true);
  const [seniorMode, setSeniorMode] = useState(Boolean(currentPrefs?.ops?.senior));
  const [autoPrint, setAutoPrint] = useState(currentPrefs?.ops?.autoPrint ?? true);
  const [navRail, setNavRail] = useState(currentPrefs?.rail ?? false);
  const [autoFillCash, setAutoFillCash] = useState(currentPrefs?.ops?.autoFillCash ?? true);
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState([]);
  const steps = useMemo(() => {
    const out = ["service", "counter"];
    if (service !== "counter" && canManageStore) out.push("lanes", "floor");
    else if (service !== "counter") out.push("lanes");
    out.push("prefs");
    return out;
  }, [service, canManageStore]);
  if (!open) return null;
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const isLast = stepIdx >= steps.length - 1;
  const tableish = service !== "counter";
  const activeSuggestion = BUSINESS_SUGGESTIONS.find((b) => b.id === selectedOptionId) || BUSINESS_SUGGESTIONS[0];
  const activePreset = activeSuggestion.preset || "column";
  const handleSelectOption = (optId) => {
    setSelectedOptionId(optId);
    if (optId === "simple") {
      setSeniorMode(true);
      setAutoFillCash(true);
    }
  };
  const handleSelectService = (id) => {
    setService(id);
    if (id !== "counter" && selectedOptionId !== "table") setSelectedOptionId("table");
    if (id === "counter" && selectedOptionId === "table") setSelectedOptionId(suggestion.counter);
    if (id !== "counter") setPreparesOrders(true);
  };
  const finish = async () => {
    setSaving(true);
    setProblems([]);
    const failed = [];
    const slug = store?.slug;
    const r = (name) => route(name, { store_slug: slug });
    if (canManageStore && slug) {
      try {
        await axios.post(r("store.tables.service-mode"), { mode: service });
      } catch (e) {
        failed.push(e?.response?.status === 403 ? "Service style needs permission to change store settings." : "The service style could not be saved.");
      }
      try {
        await axios.post(r("store.tables.prepares-orders"), {
          prepares_orders: preparesOrders ? "1" : "0"
        });
      } catch (_) {
        failed.push("Kitchen preparation setting could not be saved.");
      }
      if (tableish) {
        try {
          await axios.post(r("store.tables.plan.lanes"), {
            takeaway: Boolean(lanes.takeaway),
            delivery: Boolean(lanes.delivery)
          });
        } catch (_) {
          failed.push("Takeaway and delivery lanes could not be saved.");
        }
        if (makeFloor) {
          try {
            await applyQuickFloor(slug, floor);
          } catch (e) {
            failed.push(e?.response?.data?.message || "The tables could not be created.");
          }
        }
      }
    }
    onApply?.({
      ...currentPrefs,
      wizardCompleted: true,
      auto: activeSuggestion.id !== "table",
      profile: activeSuggestion.profile || "retail",
      preset: activePreset,
      comp: presetComposition(activePreset),
      rail: navRail,
      ops: {
        ...currentPrefs?.ops || DEFAULT_OPS,
        ...activeSuggestion.ops || {},
        senior: seniorMode,
        autoPrint,
        autoFillCash
      }
    });
    setSaving(false);
    if (failed.length) {
      setProblems(failed);
      return;
    }
    onDone?.({ service, lanes, floor: makeFloor ? floor : null });
    onClose?.();
  };
  const HEADINGS = {
    service: {
      t: "How does this place serve people?",
      s: "This is the one answer that changes the shape of the register. Everything after it follows from here, and all of it can be changed later."
    },
    counter: {
      t: tableish ? "And what should the till itself look like?" : "What kind of counter is this?",
      s: "This picks a starting layout. Every part of it can be changed afterwards, and none of it is locked in."
    },
    lanes: {
      t: "Besides sitting down, how else do orders arrive?",
      s: "Each one you turn on becomes a tab on the floor screen. A dine-in-only room never sees a Takeaway tab."
    },
    floor: {
      t: "How many tables are in the room?",
      s: "Enough to take an order today. The full Floor Plan is where the room gets its real shape — zones, seat maps, table shapes — whenever you want it."
    },
    prefs: {
      t: "Four things worth setting now",
      s: "A preview of the register you are about to get, and the settings most counters change first."
    }
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-modal flex items-center justify-center p-4 bg-ink/50 backdrop-blur-md",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Set up this register",
      children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-[860px] border border-line/80\n                            flex flex-col max-h-[92vh] overflow-hidden", children: [
        /* @__PURE__ */ jsxs("header", { className: "shrink-0 px-6 pt-5 pb-4 border-b border-line bg-surface", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300", children: [
                "Step ",
                stepIdx + 1,
                " of ",
                steps.length
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "mt-1 text-lg font-bold text-ink leading-tight", children: HEADINGS[step].t }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted leading-relaxed max-w-[62ch]", children: HEADINGS[step].s })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                className: "w-10 h-10 rounded-xl border border-line bg-surface text-ink-muted\n                                       hover:bg-interactive-hover hover:text-ink flex items-center justify-center\n                                       transition-colors shrink-0 cursor-pointer\n                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
                "aria-label": "Skip setup",
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-1.5", "aria-hidden": "true", children: steps.map((s, n) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `h-1 flex-1 rounded-full transition-colors
                                            ${n <= stepIdx ? "bg-brand-600" : "bg-line"}`
            },
            s
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto overscroll-contain p-6", children: [
          step === "service" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-3 gap-3", children: SERVICE_OPTIONS.map((o) => /* @__PURE__ */ jsx(
              PickCard,
              {
                icon: o.icon,
                title: o.title,
                desc: o.desc,
                meta: o.fits,
                selected: o.id === service,
                recommended: o.id === suggestion.service,
                onClick: () => handleSelectService(o.id)
              },
              o.id
            )) }),
            canManageStore && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3.5 rounded-xl border border-line bg-surface flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-ink flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(ChefHat, { size: 14, className: "text-amber-600 shrink-0" }),
                  /* @__PURE__ */ jsx("span", { children: "Kitchen preparation" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: "This shop prepares orders before handing them over (enables kitchen order tickets and KDS queue)." })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  role: "switch",
                  "aria-checked": preparesOrders,
                  onClick: () => setPreparesOrders(!preparesOrders),
                  className: `w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${preparesOrders ? "bg-amber-600" : "bg-line"}`,
                  children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-xs ${preparesOrders ? "left-6" : "left-1"}`
                    }
                  )
                }
              )
            ] }),
            !canManageStore && service !== "counter" && /* @__PURE__ */ jsxs("p", { className: "mt-4 rounded-xl border border-amber-200/70 dark:border-amber-900/60\n                                              bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3\n                                              text-2xs text-amber-800 dark:text-amber-300 leading-relaxed", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 13, className: "inline -mt-0.5 mr-1.5" }),
              "Service style is a store-wide setting, and this account cannot change store settings. The layout below will still be set for this device — ask an owner or manager to switch the store to table service."
            ] })
          ] }),
          step === "counter" && /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: BUSINESS_SUGGESTIONS.filter((sug) => tableish || sug.id !== "table").map((sug) => /* @__PURE__ */ jsx(
            PickCard,
            {
              icon: ICONS[sug.id] || Store,
              title: sug.title,
              desc: sug.desc,
              meta: `${sug.preset} layout`,
              selected: sug.id === selectedOptionId,
              recommended: sug.id === (tableish ? "table" : suggestion.counter),
              onClick: () => handleSelectOption(sug.id)
            },
            sug.id
          )) }),
          step === "lanes" && /* @__PURE__ */ jsx("div", { className: "space-y-2.5 max-w-[560px]", children: [
            {
              key: "dine",
              icon: UtensilsCrossed,
              title: "Dine-in",
              hint: "Always on for table service — it is what the floor plan is.",
              value: true,
              locked: true
            },
            {
              key: "takeaway",
              icon: ShoppingBag,
              title: "Takeaway",
              hint: "A bag on the counter: an open bill with a ticket number and no table.",
              value: lanes.takeaway,
              set: (v) => setLanes((l) => ({ ...l, takeaway: v }))
            },
            {
              key: "delivery",
              icon: Bike,
              title: "Delivery",
              hint: "Adds the address, the instructions, the fare, the rider and the on-the-way clock.",
              value: lanes.delivery,
              set: (v) => setLanes((l) => ({ ...l, delivery: v }))
            }
          ].map((l) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-xl border border-line/80 bg-surface shadow-xs p-3.5\n                                                flex items-start justify-between gap-3",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-9 h-9 rounded-xl bg-sunken/70 border border-line/70\n                                                         text-ink-secondary flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(l.icon, { size: 16 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-tight", children: l.title }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: l.hint })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Toggle,
                  {
                    checked: l.value,
                    onChange: l.set || (() => {
                    }),
                    label: l.title,
                    disabled: l.locked
                  }
                )
              ]
            },
            l.key
          )) }),
          step === "floor" && /* @__PURE__ */ jsxs("div", { className: "max-w-[620px] space-y-4", children: [
            /* @__PURE__ */ jsxs("label", { className: "rounded-xl border border-line/80 bg-surface shadow-xs p-3.5\n                                              flex items-start justify-between gap-3 cursor-pointer", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
                /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-tight", children: "Create tables now" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: "Off if the floor is already built, or if you would rather lay it out properly in the Floor Plan first." })
              ] }),
              /* @__PURE__ */ jsx(Toggle, { checked: makeFloor, onChange: setMakeFloor, label: "Create tables now" })
            ] }),
            makeFloor && /* @__PURE__ */ jsx(
              QuickFloorSetup,
              {
                value: floor,
                onChange: setFloor,
                storeSlug: store?.slug
              }
            )
          ] }),
          step === "prefs" && /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-2.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted", children: "Preview" }),
              /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-line/80 bg-sunken/40 p-3 overflow-hidden", children: /* @__PURE__ */ jsx(
                LayoutPreviewShell,
                {
                  preset: activePreset,
                  rail: navRail,
                  senior: seniorMode,
                  className: "w-full"
                }
              ) }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted leading-relaxed", children: [
                activeSuggestion.title,
                " · ",
                /* @__PURE__ */ jsx("b", { className: "text-ink-secondary", children: activePreset }),
                " layout. The real register re-measures itself against this screen, so what you get adapts where this sketch cannot."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-2.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-[0.12em] text-ink-muted", children: "Preferences" }),
              [
                {
                  key: "senior",
                  title: "Large text mode",
                  hint: "Raises every type ramp and touch target for a counter read at arm’s length.",
                  value: seniorMode,
                  set: setSeniorMode
                },
                {
                  key: "rail",
                  title: "Navigation rail",
                  hint: "Keeps the app’s side navigation on screen. Off gives the register 72px more.",
                  value: navRail,
                  set: setNavRail
                },
                {
                  key: "print",
                  title: "Auto-print receipt",
                  hint: "Prints the moment a sale completes, without a second confirmation.",
                  value: autoPrint,
                  set: setAutoPrint
                },
                {
                  key: "cash",
                  title: "Auto-fill exact cash",
                  hint: "Pre-fills the tendered amount, so an exact-cash or card sale is one tap.",
                  value: autoFillCash,
                  set: setAutoFillCash
                }
              ].map((pf) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "rounded-xl border border-line/80 bg-surface shadow-xs p-3.5\n                                                    flex items-start justify-between gap-3",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-tight", children: pf.title }),
                      /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted leading-relaxed", children: pf.hint })
                    ] }),
                    /* @__PURE__ */ jsx(Toggle, { checked: pf.value, onChange: pf.set, label: pf.title })
                  ]
                },
                pf.key
              )),
              /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line/70 bg-sunken/60 px-3.5 py-3", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-secondary leading-relaxed", children: [
                "All of this, and everything else, lives behind the settings button in the register’s top bar — or ",
                /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold", children: "Alt" }),
                " + ",
                /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 rounded-md bg-surface border border-line text-3xs font-mono font-bold", children: "L" }),
                "."
              ] }) })
            ] })
          ] }),
          problems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-3", role: "alert", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-danger mb-1", children: "The register is set up, but some store-wide settings did not save:" }),
            /* @__PURE__ */ jsx("ul", { className: "text-2xs text-danger/90 leading-relaxed list-disc pl-4", children: problems.map((p, i) => /* @__PURE__ */ jsx("li", { children: p }, i)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("footer", { className: "shrink-0 px-6 py-4 border-t border-line bg-sunken/40 flex items-center gap-2", children: [
          stepIdx === 0 ? /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "h-11 px-4 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink\n                                       hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer\n                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: "Skip for now"
            }
          ) : /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setStepIdx((i) => Math.max(0, i - 1)),
              className: "h-11 px-4 rounded-xl border border-line bg-surface text-ink\n                                       hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer\n                                       flex items-center gap-2\n                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 15 }),
                " Back"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              disabled: saving,
              onClick: () => isLast ? finish() : setStepIdx((i) => i + 1),
              className: "ml-auto h-11 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white\n                                   text-xs font-bold transition-colors cursor-pointer flex items-center gap-2\n                                   disabled:opacity-60 disabled:cursor-default\n                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: [
                saving && /* @__PURE__ */ jsx(Loader2, { size: 15, className: "animate-spin" }),
                isLast ? "Start selling" : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "Continue ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
                ] })
              ]
            }
          )
        ] })
      ] })
    }
  );
}
const APPROVAL_REQUIRED = "approval_required";
function parseApprovalRequired(error) {
  const res = error?.response;
  if (!res || res.status !== 422) return null;
  const d = res.data || {};
  if (d.code !== APPROVAL_REQUIRED) return null;
  const reasons = Array.isArray(d.reasons) && d.reasons.length ? d.reasons : d.reason && d.reason !== "invalid_approval" ? [d.reason] : [];
  return {
    reason: d.reason || null,
    reasons,
    message: d.message || "Manager approval is required.",
    approvalError: d.approval_error || null,
    lines: Array.isArray(d.lines) ? d.lines : []
  };
}
function requiredDiscountPercent(info) {
  return (info?.lines || []).filter((l) => l.reason === "discount_limit").reduce((max, l) => Math.max(max, Number(l.discount_percent) || 0), 0);
}
function approverOptions(approvers, info) {
  const needPct = requiredDiscountPercent(info);
  return (approvers || []).map((a) => {
    const limit = a.discount_limit === null || a.discount_limit === void 0 ? null : Number(a.discount_limit);
    let disabled = null;
    if (!a.is_self && !a.has_pin) disabled = "No PIN set";
    else if (limit !== null && needPct > limit) disabled = `Own limit ${limit}%`;
    return { ...a, needsPin: !a.is_self, disabled };
  });
}
function describeApprovalLines(info, money = (n) => String(n)) {
  return (info?.lines || []).map((l) => {
    const name = l.name || "Item";
    if (l.reason === "below_cost") {
      return `${name}: sells for ${money(l.revenue)}, below its cost of ${money(l.cost)}`;
    }
    if (l.reason === "discount_limit") {
      const own = l.approver_limit !== null && l.approver_limit !== void 0 ? ` (approver's own limit ${l.approver_limit}%)` : ` (your limit ${l.limit}%)`;
      return `${name}: ${l.discount_percent}% discount${own}`;
    }
    return name;
  });
}
function withApproval(payload, approval) {
  if (!approval || approval.approvedBy === void 0 || approval.approvedBy === null || approval.approvedBy === "") {
    return payload;
  }
  const out = { ...payload, approved_by: String(approval.approvedBy) };
  if (approval.pin) out.approval_pin = String(approval.pin);
  return out;
}
export {
  DEFAULTS as D,
  LayoutPreviewShell as L,
  PROFILES as P,
  QuickFloorModal as Q,
  RETURN_POLICIES as R,
  SetupWizardModal as S,
  DEFAULT_PERMS as a,
  DEFAULT_OPS as b,
  approverOptions as c,
  describeApprovalLines as d,
  autoComposition as e,
  loadRescue as f,
  saveRescue as g,
  clearRescue as h,
  loadPrefs as l,
  parseApprovalRequired as p,
  savePrefs as s,
  withApproval as w
};
