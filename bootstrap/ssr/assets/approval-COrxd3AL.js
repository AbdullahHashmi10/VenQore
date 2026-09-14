import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { X, UtensilsCrossed, Type, Coffee, Zap, Store, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { g as presetComposition, L as LAW } from "./engine-Cd795qy4.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
const scopedKey = (userId, deviceId2) => `${KEY}.${userId ?? "anon"}.${deviceId2 ?? "this"}`;
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
function loadPrefs(userId) {
  const base = { ...DEFAULTS, comp: presetComposition("column"), ops: { ...DEFAULT_OPS }, perms: { ...DEFAULT_PERMS } };
  try {
    const raw = localStorage.getItem(scopedKey(userId, deviceId()));
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base,
      ...saved,
      comp: saved.comp ? { ...base.comp, ...saved.comp } : base.comp,
      ops: { ...base.ops, ...saved.ops || {} },
      perms: { ...base.perms, ...saved.perms || {} }
    };
  } catch {
    return base;
  }
}
function savePrefs(userId, prefs) {
  try {
    localStorage.setItem(scopedKey(userId, deviceId()), JSON.stringify(prefs));
  } catch {
  }
}
const CART_KEY = "venqore.newpos.rescue.v1";
const rescueKey = (userId) => `${CART_KEY}.${userId ?? "anon"}.${deviceId()}`;
function saveRescue(userId, tabs) {
  try {
    localStorage.setItem(rescueKey(userId), JSON.stringify({ at: Date.now(), tabs }));
  } catch {
  }
}
function loadRescue(userId) {
  try {
    const raw = localStorage.getItem(rescueKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.at > 12 * 3600 * 1e3) return null;
    return parsed;
  } catch {
    return null;
  }
}
function clearRescue(userId) {
  try {
    localStorage.removeItem(rescueKey(userId));
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
const ICONS = {
  retail: Store,
  scan: Zap,
  visual: Coffee,
  simple: Type,
  table: UtensilsCrossed
};
function Toggle({ checked, onChange, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": !!checked,
      "aria-label": label,
      onClick: () => onChange(!checked),
      className: `relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                        ${checked ? "bg-brand-600" : "bg-line-strong"}`,
      children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs
                              transition-[left,right] duration-fast ${checked ? "right-0.5" : "left-0.5"}` })
    }
  );
}
function SetupWizardModal({
  open,
  onClose,
  onApply,
  currentPrefs = DEFAULTS,
  store = null
}) {
  const detectedType = useMemo(() => {
    const raw = (store?.business_type || store?.industry || store?.name || "").toLowerCase();
    if (/pharmac|medical|drug|chemist|hardware|wholesal|distribut/.test(raw)) return "scan";
    if (/cafe|coffee|rest|baker|food|dine|burger|pizza/.test(raw)) return "visual";
    return "retail";
  }, [store]);
  const [selectedOptionId, setSelectedOptionId] = useState(() => {
    const match = BUSINESS_SUGGESTIONS.find((b) => b.id === currentPrefs?.profile);
    return match ? match.id : detectedType;
  });
  const [step, setStep] = useState(1);
  const [seniorMode, setSeniorMode] = useState(Boolean(currentPrefs?.ops?.senior));
  const [autoPrint, setAutoPrint] = useState(currentPrefs?.ops?.autoPrint ?? true);
  const [navRail, setNavRail] = useState(currentPrefs?.rail ?? false);
  const [autoFillCash, setAutoFillCash] = useState(currentPrefs?.ops?.autoFillCash ?? true);
  if (!open) return null;
  const activeSuggestion = BUSINESS_SUGGESTIONS.find((b) => b.id === selectedOptionId) || BUSINESS_SUGGESTIONS[0];
  const activePreset = activeSuggestion.preset || "column";
  const handleSelectOption = (optId) => {
    setSelectedOptionId(optId);
    if (optId === "simple") {
      setSeniorMode(true);
      setAutoFillCash(true);
    }
  };
  const handleComplete = () => {
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
    onClose?.();
  };
  const PREFS = [
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
  ];
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
                step,
                " of 2"
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "mt-1 text-lg font-bold text-ink leading-tight", children: step === 1 ? "What kind of counter is this?" : "Four things worth setting now" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-muted leading-relaxed max-w-[62ch]", children: step === 1 ? "This picks a starting layout. Every part of it can be changed afterwards, and none of it is locked in." : "A preview of the register you are about to get, and the settings most counters change first." })
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
          /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-1.5", "aria-hidden": "true", children: [1, 2].map((n) => /* @__PURE__ */ jsx(
            "span",
            {
              className: `h-1 flex-1 rounded-full transition-colors
                                            ${step >= n ? "bg-brand-600" : "bg-line"}`
            },
            n
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-y-auto overscroll-contain p-6", children: step === 1 ? /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: BUSINESS_SUGGESTIONS.map((sug) => {
          const selected = sug.id === selectedOptionId;
          const recommended = sug.id === detectedType;
          const Icon = ICONS[sug.id] || Store;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => handleSelectOption(sug.id),
              "aria-pressed": selected,
              className: `text-left p-4 rounded-2xl border transition-all cursor-pointer
                                                    flex flex-col gap-2.5 h-full
                                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
                                                    ${selected ? "border-brand-500/50 bg-brand-50/60 dark:bg-brand-950/30 shadow-xs" : "border-line/80 bg-surface hover:border-line-strong hover:shadow-xs"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                                                              ${selected ? "bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border-brand-300/60" : "bg-sunken/70 text-ink-secondary border-line/70"}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
                  recommended && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wide px-2 py-1 rounded-lg\n                                                                 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400\n                                                                 border border-emerald-200/70 dark:border-emerald-900/60", children: "Suggested" })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink leading-snug", children: sug.title }),
                /* @__PURE__ */ jsx("span", { className: "block text-2xs text-ink-muted leading-relaxed flex-1", children: sug.desc }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-between gap-2 pt-1 border-t border-line/60", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-3xs font-bold text-ink-muted uppercase tracking-wide", children: [
                    sug.preset,
                    " layout"
                  ] }),
                  selected && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-3xs font-bold text-brand-700 dark:text-brand-300", children: [
                    /* @__PURE__ */ jsx(Check, { size: 12 }),
                    " Selected"
                  ] })
                ] })
              ]
            },
            sug.id
          );
        }) }) : /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5", children: [
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
            PREFS.map((pf) => /* @__PURE__ */ jsxs(
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
        ] }) }),
        /* @__PURE__ */ jsx("footer", { className: "shrink-0 px-6 py-4 border-t border-line bg-sunken/40 flex items-center gap-2", children: step === 1 ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "h-11 px-4 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink\n                                           hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer\n                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: "Skip for now"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setStep(2),
              className: "ml-auto h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white\n                                           text-xs font-bold transition-colors cursor-pointer\n                                           flex items-center gap-2\n                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: [
                "Continue ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setStep(1),
              className: "h-11 px-4 rounded-xl border border-line bg-surface text-ink\n                                           hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer\n                                           flex items-center gap-2\n                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 15 }),
                " Back"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleComplete,
              className: "ml-auto h-11 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white\n                                           text-xs font-bold transition-colors cursor-pointer\n                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              children: "Start selling"
            }
          )
        ] }) })
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
