import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useMemo, useEffect, useCallback, useLayoutEffect } from "react";
import { g as useTheme } from "../ssr.js";
import { usePage, Head } from "@inertiajs/react";
import { c as catalogue, b as SECTORS, S as SiteHeader, B as BUSINESS_TYPE_CLAIM, d as SECTOR_COUNT, a as SiteFooter, C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
import { createPortal } from "react-dom";
import { Sparkles, X, Search, Building2, ChevronDown, ShieldCheck, Check, ArrowRight, Gift, Briefcase, Layers, Boxes, Printer, Coffee, Hammer, Scissors, Factory, Globe, FlaskConical, FileSpreadsheet, Package, Truck, Cpu, Pill, Zap, PackageCheck, Wheat, Wine, Flame, ChefHat, Cake, IceCream, Pizza, Croissant, UtensilsCrossed, Utensils, Lightbulb, Trophy, Flower2, Glasses, BatteryCharging, Disc, Cat, Gamepad2, BookOpen, Armchair, Bath, Wrench, Heart, Gem, Footprints, Shirt, Tv, Smartphone, Syringe, ShoppingCart, ShoppingBasket, GraduationCap, Dumbbell, PartyPopper, Clock, ShieldAlert, Wind, Paintbrush, Droplets, Camera, Compass, Scale, Calculator, TrendingUp, Megaphone, Palette, Stethoscope, Bike, Car, Laptop, Store, Square, Mic } from "lucide-react";
import { B as BusinessTypes } from "./BusinessTypes-r4_4fFX7.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "motion/react";
const TYPE_ICON_MAP = {
  // Services
  phone_repair: Smartphone,
  computer_repair: Laptop,
  auto_repair: Car,
  appliance_repair: Wrench,
  bike_service: Bike,
  salon_barber: Scissors,
  nail_spa: Sparkles,
  pet_care: Stethoscope,
  freelance_creative: Palette,
  marketing_agency: Megaphone,
  consultant: TrendingUp,
  accounting_firm: Calculator,
  law_firm: Scale,
  architect_interior: Compass,
  photo_video: Camera,
  electrician: Zap,
  plumber: Droplets,
  carpenter: Hammer,
  painter_renovation: Paintbrush,
  cleaning: Sparkles,
  hvac: Wind,
  pest_control: ShieldAlert,
  equipment_rental: Clock,
  event_hire: PartyPopper,
  gym_fitness: Dumbbell,
  tuition_academy: GraduationCap,
  // Retail
  grocery: ShoppingBasket,
  supermarket: ShoppingCart,
  pharmacy: Pill,
  surgical_supplies: Syringe,
  mobile_retail: Smartphone,
  electronics: Tv,
  fashion: Shirt,
  footwear: Footprints,
  jewellery: Gem,
  cosmetics: Heart,
  hardware: Wrench,
  sanitary_supply: Bath,
  building_materials: Building2,
  furniture_store: Armchair,
  books_stationery: BookOpen,
  toys: Gamepad2,
  pet_supply: Cat,
  auto_parts: Disc,
  tyre_battery: BatteryCharging,
  optical: Glasses,
  gift_flower: Flower2,
  vape_tobacco: Flame,
  sports: Trophy,
  electrical_lighting: Lightbulb,
  kitchenware: Utensils,
  // Food & Hospitality
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  tea_shop: Coffee,
  bakery: Croissant,
  fast_food: Pizza,
  dessert: IceCream,
  juice_bar: GlassWaterFallback,
  food_truck: Truck,
  sweets: Cake,
  catering: ChefHat,
  cloud_kitchen: Flame,
  pub_lounge: Wine,
  // Wholesale
  fmcg_wholesale: Boxes,
  grain_commodities: Wheat,
  fabric_stockist: Layers,
  hardware_wholesale: PackageCheck,
  electrical_wholesale: Zap,
  pharma_wholesale: Pill,
  tech_distributor: Cpu,
  auto_parts_distributor: Truck,
  packaging: Package,
  office_supplies: FileSpreadsheet,
  chemicals: FlaskConical,
  import_export: Globe,
  // Manufacturing
  commercial_bakery: Factory,
  tailoring: Scissors,
  furniture_maker: Hammer,
  coffee_spice: Coffee,
  signage_print: Printer,
  soap_candle: Sparkles,
  kit_assembly: Boxes,
  aluminium_glass: Layers,
  leather_goods: Briefcase,
  custom_merch: Gift
};
function GlassWaterFallback(props) {
  return /* @__PURE__ */ jsx(Wine, { ...props });
}
function getBusinessIcon(key = "", sector = "") {
  if (TYPE_ICON_MAP[key]) return TYPE_ICON_MAP[key];
  const k = key.toLowerCase();
  if (k.includes("pharm") || k.includes("medic") || k.includes("clinic")) return Pill;
  if (k.includes("repair") || k.includes("mechanic")) return Wrench;
  if (k.includes("phone") || k.includes("gadget")) return Smartphone;
  if (k.includes("computer") || k.includes("laptop")) return Laptop;
  if (k.includes("auto") || k.includes("car")) return Car;
  if (k.includes("salon") || k.includes("barber")) return Scissors;
  if (k.includes("restaurant") || k.includes("dine")) return UtensilsCrossed;
  if (k.includes("cafe") || k.includes("coffee")) return Coffee;
  if (k.includes("bakery") || k.includes("cake")) return Croissant;
  if (k.includes("fashion") || k.includes("boutique")) return Shirt;
  if (k.includes("wholesale") || k.includes("distribut")) return Truck;
  if (k.includes("mfg") || k.includes("manufactur") || k.includes("factory")) return Factory;
  if (sector === "services") return Wrench;
  if (sector === "food") return UtensilsCrossed;
  if (sector === "wholesale") return Truck;
  if (sector === "manufacturing") return Factory;
  return Store;
}
function getPresetMeta(item) {
  const { sector, name, note } = item;
  let explanation = "";
  let modules = [];
  let prompt = "";
  if (sector === "retail") {
    modules = ["Barcode POS Till", "Live Inventory", "Cash Reconcile", "Customer Khata", "EOD Z-Report"];
    if (note) {
      explanation = `Pre-configured for retail with ${note}. Features instant barcode lookups, multi-unit pricing, automated reorder alerts, and daily register balancing.`;
      prompt = `I run a ${name} with ${note}. I need automated barcode POS checkout, inventory relief, and supplier accounting.`;
    } else {
      explanation = `Pre-configured with high-speed barcode checkout, automated inventory lot relief, customer khata credit tracking, cash-drawer reconciliation, and daily sales analytics.`;
      prompt = `I run a ${name}. I need a fast counter POS, real-time stock levels, supplier management, and automated sales reporting.`;
    }
  } else if (sector === "services") {
    modules = ["Job Cards", "Service Calendar", "Quotations & Invoicing", "Technician Dispatch", "Khata Ledger"];
    if (note) {
      explanation = `Configured for service & repair workflows with ${note}. Converts customer requests into technician job cards and itemised invoices with parts auto-deducted from stock.`;
      prompt = `I run a ${name} with ${note}. I need job card tracking, technician assignments, quotations, and customer invoicing.`;
    } else {
      explanation = `Configured for professional services with instant quotations, service job tracking, technician time logs, customer history, and automated milestone invoicing.`;
      prompt = `I run a ${name}. I need service job scheduling, customer invoices, technician time logs, and automated profit & loss tracking.`;
    }
  } else if (sector === "food") {
    modules = ["Table Floor Map", "KOT Kitchen Tickets", "Recipe Costing", "Park & Recall", "Shift Reconciliation"];
    if (note) {
      explanation = `Optimized for food service with ${note}. Links table or walk-in orders directly to kitchen tickets while automatically deducting ingredients via recipe bills of materials.`;
      prompt = `I run a ${name} with ${note}. I need table/counter ordering, kitchen ticket printing, recipe costing, and ingredient stock deduction.`;
    } else {
      explanation = `Pre-wired for hospitality with table management, park-and-recall orders, kitchen ticket printing, ingredient recipe deduction, and real-time food cost accounting.`;
      prompt = `I run a ${name}. I need fast order taking, table service, recipe ingredient deduction, and daily cash-up reports.`;
    }
  } else if (sector === "wholesale") {
    modules = ["Tiered Price Lists", "B2B Sales Orders", "Multi-Warehouse", "Khata Credit Ledger", "Tax Invoices"];
    if (note) {
      explanation = `Engineered for high-volume B2B distribution with ${note}. Supports customer price tiers, bulk sales orders, dispatch challans, credit limit enforcement, and statements.`;
      prompt = `I run a ${name} with ${note}. I need tiered customer pricing, bulk sales orders, khata credit accounts, and multi-location inventory.`;
    } else {
      explanation = `Set up with tiered wholesale pricing, B2B sales orders, multi-warehouse stock allocations, credit limits, and automated customer Khata statements.`;
      prompt = `I run a ${name}. I need wholesale B2B pricing, purchase order management, credit limits, and automated ledger statements.`;
    }
  } else if (sector === "manufacturing") {
    modules = ["BOM & Recipes", "Production Batches", "Landed Cost", "Raw Material FIFO", "Finished Goods Intake"];
    if (note) {
      explanation = `Assembled for light production with ${note}. Automatically tracks raw material consumption, labour overheads, landed cost allocation, and finished goods intake.`;
      prompt = `I run a ${name} with ${note}. I need bill of materials (BOM), production runs, raw material consumption, and landed cost tracking.`;
    } else {
      explanation = `Pre-configured with bill of materials (BOM), production batch tracking, landed cost calculation, raw material FIFO relief, and finished goods intake.`;
      prompt = `I run a ${name}. I need BOM recipes, production batch scheduling, material consumption tracking, and finished goods accounting.`;
    }
  }
  if (note) {
    const lower = note.toLowerCase();
    if (lower.includes("expiry") || lower.includes("batch")) modules.unshift("Batch & Expiry");
    if (lower.includes("matrix") || lower.includes("variant")) modules.unshift("Variant Matrix");
    if (lower.includes("imei")) modules.unshift("IMEI Intake");
    if (lower.includes("warranty")) modules.unshift("Warranty Tracking");
    if (lower.includes("sync") || lower.includes("woocommerce") || lower.includes("amazon")) modules.unshift("E-Commerce Sync");
  }
  return {
    explanation,
    modules: Array.from(new Set(modules)).slice(0, 5),
    promptText: prompt
  };
}
function BusinessPickerModal({ onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [activeSector, setActiveSector] = useState("all");
  const [expandedKey, setExpandedKey] = useState(null);
  const searchInputRef = useRef(null);
  const cardRef = useRef(null);
  const allTypes = useMemo(() => {
    const types = (catalogue.types || []).map((t) => {
      const sectorObj = SECTORS.find((s) => s.key === t.sector);
      const meta = getPresetMeta(t);
      return {
        ...t,
        sectorName: sectorObj?.short || t.sector,
        Icon: getBusinessIcon(t.key, t.sector),
        ...meta
      };
    });
    return types.sort((a, b) => a.name.localeCompare(b.name, void 0, { sensitivity: "base" }));
  }, []);
  const sectorCounts = useMemo(() => {
    const counts = { all: allTypes.length };
    SECTORS.forEach((s) => {
      counts[s.key] = allTypes.filter((t) => t.sector === s.key).length;
    });
    return counts;
  }, [allTypes]);
  const filteredTypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTypes.filter((t) => {
      const matchesSector = activeSector === "all" || t.sector === activeSector;
      if (!matchesSector) return false;
      if (!q) return true;
      const nameMatch = t.name.toLowerCase().includes(q);
      const noteMatch = (t.note || "").toLowerCase().includes(q);
      const sectorMatch = t.sectorName.toLowerCase().includes(q);
      const moduleMatch = t.modules.some((m) => m.toLowerCase().includes(q));
      return nameMatch || noteMatch || sectorMatch || moduleMatch;
    });
  }, [allTypes, activeSector, query]);
  useEffect(() => {
    searchInputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflowY;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowY = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflowY = prevHtml;
    };
  }, []);
  const handleSelect = (item) => {
    onPick({
      label: item.name,
      desc: item.note || item.explanation,
      text: item.promptText,
      key: item.key,
      sector: item.sector
    });
  };
  const toggleExpand = (key) => {
    setExpandedKey((curr) => curr === key ? null : key);
  };
  const modalContent = /* @__PURE__ */ jsxs("div", { className: "vq-bp-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "vq-bp-title", children: [
    /* @__PURE__ */ jsx("div", { className: "vq-bp-scrim", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { ref: cardRef, className: "vq-bp-card", tabIndex: -1, children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-bp-header", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-bp-header__meta", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-bp-badge", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "vq-bp-badge__icon" }),
            /* @__PURE__ */ jsx("span", { children: "85+ Curated Business Presets (A–Z)" })
          ] }),
          /* @__PURE__ */ jsx("h2", { id: "vq-bp-title", className: "vq-bp-title", children: "Choose Your Business Preset" }),
          /* @__PURE__ */ jsx("p", { className: "vq-bp-sub", children: "Pre-configured modules, POS tills, and automated accounting tailored to your exact industry." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vq-bp-close",
            onClick: onClose,
            "aria-label": "Close modal",
            title: "Close (Esc)",
            children: /* @__PURE__ */ jsx(X, { size: 18 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-bp-controls", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-bp-search-wrap", children: [
          /* @__PURE__ */ jsx(Search, { size: 16, className: "vq-bp-search-icon" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: searchInputRef,
              type: "search",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: "Search by name, workflow or keyword (e.g. pharmacy, bakery, tailor, wholesale)...",
              className: "vq-bp-search-input"
            }
          ),
          query && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setQuery(""),
              className: "vq-bp-search-clear",
              "aria-label": "Clear search",
              children: /* @__PURE__ */ jsx(X, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "vq-bp-search-count", children: [
            filteredTypes.length,
            " ",
            filteredTypes.length === 1 ? "preset" : "presets"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-bp-tabs", role: "tablist", "aria-label": "Filter by sector", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeSector === "all",
              className: `vq-bp-tab${activeSector === "all" ? " is-active" : ""}`,
              onClick: () => setActiveSector("all"),
              children: [
                /* @__PURE__ */ jsx("span", { children: "All (A–Z)" }),
                /* @__PURE__ */ jsx("span", { className: "vq-bp-tab__count", children: sectorCounts.all })
              ]
            }
          ),
          SECTORS.map((s) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeSector === s.key,
              className: `vq-bp-tab${activeSector === s.key ? " is-active" : ""}`,
              onClick: () => setActiveSector(s.key),
              children: [
                /* @__PURE__ */ jsx("span", { children: s.short }),
                /* @__PURE__ */ jsx("span", { className: "vq-bp-tab__count", children: sectorCounts[s.key] || 0 })
              ]
            },
            s.key
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-bp-scroll-pane", children: filteredTypes.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "vq-bp-empty", children: [
        /* @__PURE__ */ jsx("div", { className: "vq-bp-empty__icon", children: /* @__PURE__ */ jsx(Building2, { size: 28 }) }),
        /* @__PURE__ */ jsx("h3", { children: "No matching presets found" }),
        /* @__PURE__ */ jsx("p", { children: "Try searching with another keyword or describe your custom business trade directly." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vq-btn vq-btn--secondary",
            onClick: () => {
              setQuery("");
              setActiveSector("all");
            },
            children: "Reset filters"
          }
        )
      ] }) : /* @__PURE__ */ jsx("div", { className: "vq-bp-list", role: "list", children: filteredTypes.map((item) => {
        const isExpanded = expandedKey === item.key;
        const { Icon } = item;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: `vq-bp-item${isExpanded ? " is-expanded" : ""}`,
            role: "listitem",
            children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vq-bp-trigger",
                  onClick: () => toggleExpand(item.key),
                  onDoubleClick: () => handleSelect(item),
                  "aria-expanded": isExpanded,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-bp-trigger__left", children: [
                      /* @__PURE__ */ jsx("div", { className: "vq-bp-item__icon", children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-bp-trigger__info", children: [
                        /* @__PURE__ */ jsxs("div", { className: "vq-bp-trigger__title-row", children: [
                          /* @__PURE__ */ jsx("span", { className: "vq-bp-item__name", children: item.name }),
                          /* @__PURE__ */ jsx("span", { className: "vq-bp-item__sector-tag", children: item.sectorName })
                        ] }),
                        item.note && !isExpanded && /* @__PURE__ */ jsx("span", { className: "vq-bp-item__preview-note", children: item.note })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "vq-bp-trigger__right", children: /* @__PURE__ */ jsx("span", { className: `vq-bp-chevron${isExpanded ? " is-open" : ""}`, children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 }) }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "vq-bp-content", children: /* @__PURE__ */ jsxs("div", { className: "vq-bp-content__inner", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bp-explanation", children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-bp-explanation__label", children: [
                    /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                    /* @__PURE__ */ jsx("span", { children: "Preset Workflows:" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "vq-bp-explanation__text", children: item.explanation })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-bp-modules", children: /* @__PURE__ */ jsx("div", { className: "vq-bp-modules__tags", children: item.modules.map((mod) => /* @__PURE__ */ jsxs("span", { className: "vq-bp-mod-chip", children: [
                  /* @__PURE__ */ jsx(Check, { size: 12, className: "text-teal-600 dark:text-teal-400" }),
                  mod
                ] }, mod)) }) }),
                /* @__PURE__ */ jsx("div", { className: "vq-bp-item__actions", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "vq-bp-select-btn",
                    onClick: () => handleSelect(item),
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Use This Preset" }),
                      /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
                    ]
                  }
                ) })
              ] }) })
            ]
          },
          item.key
        );
      }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-bp-footer", children: [
        /* @__PURE__ */ jsx("p", { className: "vq-bp-footer__hint", children: "Click to view details · Double-click to load preset immediately" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--ghost", onClick: onClose, children: "Cancel" })
      ] })
    ] })
  ] });
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
const MAX = 600;
const MAX_ROWS = 6;
const EXAMPLES = [
  "A 3-branch pharmacy with batch expiry and 30-day distributor credit",
  "Wholesale auto parts, 10,000 SKUs, tiered prices and delivery routes",
  "Bakery with a central kitchen, recipe costing and four shop drops",
  "Hardware store with trade credit for contractors and unit conversions",
  "Fashion boutique with size/colour variants selling on Amazon too"
];
const CHIPS = [
  { key: "pharmacy", label: "Pharmacy", text: "I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms." },
  { key: "wholesale", label: "Wholesale distributor", text: "Auto parts wholesale with 10,000 SKUs, bulk discount tiers, and delivery to shops on credit." },
  { key: "cafe", label: "Restaurant & café", text: "Artisan bakery and central kitchen with recipe costing, ingredient batching, and 4 shop drops." },
  { key: "hardware", label: "Hardware & parts", text: "Hardware store with 9,000 SKUs, FIFO valuation, unit conversions and contractor trade credit." },
  { key: "multi", label: "Multi-branch", text: "Multi-branch retail with a size/colour variant matrix, synced to Amazon and WooCommerce." }
];
function HeroPrompt({ action = "/build-workspace" }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIx, setExampleIx] = useState(0);
  const [picker, setPicker] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const taRef = useRef(null);
  const recRef = useRef(null);
  const fit = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const cs = getComputedStyle(ta);
    const line = parseFloat(cs.lineHeight) || 30;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const max = line * MAX_ROWS + pad;
    const next = Math.min(ta.scrollHeight, max);
    ta.style.height = `${next}px`;
    ta.style.overflowY = ta.scrollHeight > max ? "auto" : "hidden";
  }, []);
  useLayoutEffect(fit, [value, fit]);
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);
  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) setValue("");
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  useEffect(() => {
    if (value || focused) return void 0;
    const t = window.setInterval(() => setExampleIx((i) => (i + 1) % EXAMPLES.length), 3600);
    return () => window.clearInterval(t);
  }, [value, focused]);
  useEffect(() => {
    setSpeechOk(typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => recRef.current?.abort?.();
  }, []);
  const submit = (e) => {
    e?.preventDefault();
    const v = value.trim();
    if (!v) {
      taRef.current?.focus();
      return;
    }
    window.location.href = `${action}?prompt=${encodeURIComponent(v.slice(0, MAX))}`;
  };
  const fill = (text) => {
    setValue(text.slice(0, MAX));
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  };
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = value ? `${value.trim()} ` : "";
    rec.onresult = (ev) => {
      const said = Array.from(ev.results).map((r) => r[0].transcript).join("");
      setValue((base + said).slice(0, MAX));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  const left = MAX - value.length;
  return /* @__PURE__ */ jsxs("div", { className: "vq-hp", children: [
    /* @__PURE__ */ jsxs("form", { className: `vq-hp__single-line${focused ? " is-focused" : ""}`, onSubmit: submit, autoComplete: "off", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "vq-hero-describe", className: "vq-sr-only", children: "Describe your business" }),
      /* @__PURE__ */ jsxs("div", { className: "vq-hp__field", children: [
        !value && /* @__PURE__ */ jsxs("span", { className: "vq-hp__placeholder", "aria-hidden": "true", children: [
          'Describe your business (e.g. "',
          EXAMPLES[exampleIx],
          '")…'
        ] }, exampleIx),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "vq-hero-describe",
            ref: taRef,
            rows: 1,
            value,
            maxLength: MAX,
            autoComplete: "off",
            autoCorrect: "on",
            spellCheck: true,
            enterKeyHint: "go",
            onChange: (e) => setValue(e.target.value),
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
            },
            className: "vq-hp__input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-hp__actions", children: [
        left <= 100 && /* @__PURE__ */ jsx("span", { className: "vq-hp__count", "aria-live": "polite", children: left }),
        speechOk && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `vq-hp__icon${listening ? " is-live" : ""}`,
            onClick: toggleVoice,
            "aria-pressed": listening,
            "aria-label": listening ? "Stop voice input" : "Describe it by voice",
            title: listening ? "Stop" : "Speak instead",
            children: listening ? /* @__PURE__ */ jsx(Square, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Mic, { size: 17, "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsxs("button", { type: "submit", className: "vq-hp__go", disabled: !value.trim(), children: [
          "Build my system ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true", className: "vq-btn__arrow" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-hp__chips-row", role: "group", "aria-label": "Examples", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-hp__pick-btn", onClick: () => setPicker(true), children: [
        /* @__PURE__ */ jsx(Building2, { size: 15, "aria-hidden": "true" }),
        " Select your business"
      ] }),
      CHIPS.map((c) => /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip vq-chip--onHero vq-hp__chip", onClick: () => fill(c.text), children: c.label }, c.key))
    ] }),
    /* @__PURE__ */ jsx("p", { className: "vq-caption vq-hero-caret vq-hp__hint", children: "Enter to build · Shift + Enter for a new line · nothing goes live until you approve it" }),
    picker && /* @__PURE__ */ jsx(
      BusinessPickerModal,
      {
        onClose: () => setPicker(false),
        onPick: (p) => {
          setPicker(false);
          fill(p.text);
        }
      }
    )
  ] });
}
function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { auth = {}, flash = {} } = usePage().props;
  useEffect(() => {
    document.documentElement.setAttribute("data-vq-shell", "marketing");
    document.documentElement.style.overflowY = "auto";
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflow = "visible";
    document.body.style.height = "auto";
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.style.height = "auto";
      appRoot.style.overflow = "visible";
    }
    let active = true;
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          existing.remove();
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };
    const initEngines = async () => {
      try {
        const canvas = document.getElementById("fluid-canvas");
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
        await loadScript("/v6/assets/fluid.js");
        await loadScript("/v6/assets/venqore.js");
        await loadScript("/v6/assets/venqore-landing.js");
        await loadScript("/v6/assets/venqore-forms.js");
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("scroll"));
      } catch (err) {
        console.warn("VenQore visual engines init notice:", err);
      }
    };
    const timer = setTimeout(() => {
      if (active) initEngines();
    }, 50);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "VenQore — The AI ERP Builder for POS, Stock & Accounting" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Describe your business in plain language. VenQore assembles the operating system that runs it — for 85+ kinds of business across retail, services, food, wholesale and light manufacturing — with double-entry accounting under every module." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "VenQore — The AI ERP Builder for POS, Stock & Accounting" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Describe your business in plain language. VenQore assembles the operating system that runs it, with double-entry accounting under every module." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "VenQore — The AI ERP Builder for POS, Stock & Accounting" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Describe your business in plain language. VenQore assembles the operating system that runs it, with double-entry accounting under every module." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx("canvas", { id: "fluid-canvas", className: "pointer-events-none fixed inset-0", style: { "position": "fixed", "inset": "0", "width": "100%", "height": "100%", "pointerEvents": "none", "zIndex": "2", "filter": "blur(1px)", "opacity": "0.9" } }),
      /* @__PURE__ */ jsx("div", { "data-prog": "1", style: { "position": "fixed", "top": "0", "left": "0", "height": "3px", "width": "0%", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)", "zIndex": "500", "boxShadow": "0 0 18px rgba(35, 196, 166, 0.6)" } }),
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { id: "top", "data-sec": "top", "data-tone": "dark", className: "vq-hero-section", style: { "position": "relative", "minHeight": "100svh", "width": "100%", "display": "flex", "flexDirection": "column", "paddingTop": "clamp(85px,10vw,120px)", "overflow": "hidden" }, children: [
          /* @__PURE__ */ jsx("div", { className: "hero-gradient-overlay", "aria-hidden": "true", style: { "position": "absolute", "inset": "0", "pointerEvents": "none", "zIndex": "0" } }),
          /* @__PURE__ */ jsxs("div", { className: "hero-floaters", style: { "position": "absolute", "inset": "0", "overflow": "hidden", "pointerEvents": "none", "zIndex": "5" }, children: [
            /* @__PURE__ */ jsxs("span", { className: "hero-pill-float", style: { "top": "20%", "left": "5%", "animationDuration": "7.2s" }, children: [
              /* @__PURE__ */ jsx("span", { className: "hero-pill-dot" }),
              "Batch & expiry"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "hero-pill-float", style: { "top": "58%", "left": "8%", "animationDuration": "8.4s" }, children: [
              /* @__PURE__ */ jsx("span", { className: "hero-pill-dot" }),
              "Core Ledger"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "hero-pill-float", style: { "top": "16%", "right": "9%", "animationDuration": "9.2s" }, children: [
              /* @__PURE__ */ jsx("span", { className: "hero-pill-dot" }),
              "Payables · 30 days"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "hero-pill-float", style: { "top": "42%", "right": "5%", "animationDuration": "7.8s" }, children: [
              /* @__PURE__ */ jsx("span", { className: "hero-pill-dot" }),
              "POS checkout"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "hero-pill-float", style: { "top": "72%", "right": "12%", "animationDuration": "6.6s" }, children: [
              /* @__PURE__ */ jsx("span", { className: "hero-pill-dot" }),
              "Branch transfers"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-hero-inner", style: { "position": "relative", "zIndex": "10", "marginBlock": "auto", "marginInline": "auto", "maxWidth": "64rem", "width": "100%", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "var(--vq-space-4)", "paddingInline": "var(--vq-space-6)", "textAlign": "center" }, children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-eyebrow vq-hero-eyebrow", style: { "display": "inline-flex", "alignItems": "center", "gap": "8px", "height": "30px", "padding": "0 14px", "borderRadius": "9999px", "background": "rgba(255, 255, 255, 0.12)", "border": "1px solid rgba(255, 255, 255, 0.22)", "backdropFilter": "blur(8px)", "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text)" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "9999px", "background": "var(--vq-accent)", "boxShadow": "0 0 8px var(--vq-accent)" } }),
              "THE AI ERP BUILDER"
            ] }),
            /* @__PURE__ */ jsxs("h1", { id: "main-heading", className: "vq-hero vq-hero-h1 fold-text-container", style: { "fontWeight": "600", "fontSize": "clamp(44px,7.2vw,84px)", "lineHeight": "1.0", "letterSpacing": "-0.04em", "maxWidth": "22ch", "textAlign": "center", "margin": "0" }, children: [
              "Tell us how you operate.",
              /* @__PURE__ */ jsx("br", {}),
              "We ",
              /* @__PURE__ */ jsxs("span", { style: { "position": "relative", "color": "var(--vq-accent-text)", "display": "inline-block" }, children: [
                "assemble",
                /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "left": "0", "right": "0", "bottom": "6px", "height": "6px", "borderRadius": "999px", "background": "rgba(35, 196, 166, 0.38)" } })
              ] }),
              " your system."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-hero-subhead", style: { "maxWidth": "44rem", "color": "var(--vq-text-2)", "fontSize": "clamp(1.05rem,1.4vw,1.25rem)", "lineHeight": "1.55", "marginTop": "var(--vq-space-2)" }, children: "VenQore takes your requirements and snaps together battle-tested modules into a custom platform that never breaks." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mt-6", style: { "width": "100%" }, children: [
              /* @__PURE__ */ jsx(HeroPrompt, {}),
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "gap": "18px", "flexWrap": "wrap", "justifyContent": "center", "marginTop": "16px", "font": "500 13px/1 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  BUSINESS_TYPE_CLAIM,
                  " business types, ",
                  SECTOR_COUNT,
                  " sectors"
                ] }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "140+ modules, only yours switched on" }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "58 readings, one definition each" }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "8 correctness laws on every post" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-hero-foot", style: { "marginInline": "auto", "width": "100%", "maxWidth": "58rem", "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "var(--vq-space-6)", "padding": "var(--vq-space-8) var(--vq-space-6) var(--vq-space-10)" }, children: [
            /* @__PURE__ */ jsx("p", { className: "vq-small", style: { "maxWidth": "26rem", "color": "var(--vq-text-2)" }, children: "Describe how you actually work. VenQore assembles the system that runs it — and every number it produces is backed by double-entry accounting." }),
            /* @__PURE__ */ jsx("a", { href: "#compiler", "aria-label": "How it works", children: /* @__PURE__ */ jsx("span", { className: "animate-bounce-slow", style: { "display": "block" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M12 5v14" }),
              /* @__PURE__ */ jsx("path", { d: "m19 12-7 7-7-7" })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "vq-ticker-strip", children: /* @__PURE__ */ jsxs("div", { className: "vq-ticker-track", children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsxs("b", { children: [
              BUSINESS_TYPE_CLAIM,
              " business types"
            ] }),
            " across ",
            SECTOR_COUNT,
            " sectors, built from one engine"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "140+ universal features" }),
            " ready to assemble for your business"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "Eight correctness laws" }),
            " run against every reading on every release"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "One Core Ledger" }),
            " under every module, so no two screens disagree"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "35,000+ tests" }),
            " verified on every commit"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "8 invariant rules" }),
            " run on every transaction post"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "0 balance drift" }),
            " with immutable double-entry ledger"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsxs("b", { children: [
              BUSINESS_TYPE_CLAIM,
              " business types"
            ] }),
            " across ",
            SECTOR_COUNT,
            " sectors, built from one engine"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "140+ universal features" }),
            " ready to assemble for your business"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "Eight correctness laws" }),
            " run against every reading on every release"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "One Core Ledger" }),
            " under every module, so no two screens disagree"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "35,000+ tests" }),
            " verified on every commit"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "8 invariant rules" }),
            " run on every transaction post"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "vq-ticker-item", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-ticker-dot" }),
            /* @__PURE__ */ jsx("b", { children: "0 balance drift" }),
            " with immutable double-entry ledger"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "vq-page", style: { "position": "relative", "zIndex": "10" }, children: [
          /* @__PURE__ */ jsxs("section", { id: "trust", "data-sec": "trust", className: "vq-trust", children: [
            /* @__PURE__ */ jsx("div", { "data-par": "-0.12", "aria-hidden": "true", style: { "position": "absolute", "left": "50%", "top": "-30%", "width": "min(980px,120vw)", "aspectRatio": "1", "transform": "translateX(-50%)", "pointerEvents": "none", "background": "radial-gradient(circle,var(--vq-accent-quiet),transparent 60%)" } }),
            /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "display": "flex", "flexWrap": "wrap", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "18px", "marginBottom": "24px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "WHAT WE CAN ACTUALLY PROVE" }),
                /* @__PURE__ */ jsxs("span", { className: "vq-seal", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  "AMAZON SP-API APPROVED"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-trust__row vq-reveal", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-trust__cell", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__n", "data-count": "140", "data-count-suf": "+", "data-count-dur": "900", children: "0" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__l", children: "FEATURES & MODULES" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__s", children: "Universal business building blocks ready to assemble for your exact workflow." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-trust__cell", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__n", "data-count": "35000", "data-count-suf": "+", children: "0" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__l", children: "AUTOMATED TESTS" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__s", children: "Run against every reading, ledger invariant, and release build." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-trust__cell", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__n", "data-count": "8", "data-count-suf": " / 8", "data-count-dur": "900", children: "0" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__l", children: "CORRECTNESS LAWS ENFORCED" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__s", children: "Every post is verified against 8 strict accounting laws before the ledger accepts it." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-trust__cell", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__n", "data-count": "100", "data-count-suf": "%", children: "0" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__l", children: "DOUBLE-ENTRY GENERAL LEDGER" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-trust__s", children: "One immutable posting path under every screen so no two reports can ever disagree." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "vq-trust__note vq-reveal", children: [
                "No vanity metrics or fake logos. What you can inspect and verify is our test suite, the correctness audit, and the immutable ledger architecture that runs underneath every module.",
                /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/ledger", children: "Read the latest correctness report" }),
                "."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("section", { id: "extremes", "data-sec": "extremes", className: "vq-sec vq-sec--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "THE PROBLEM" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "Rigid software, or hallucinated software." }),
              /* @__PURE__ */ jsx("p", { children: "For thirty years those were the only two options. One asks your business to change shape. The other invents your numbers." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "marginTop": "34px", "display": "flex", "flexWrap": "wrap", "gap": "8px", "alignItems": "center" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)", "marginRight": "6px" }, children: "MEANWHILE YOU RUN ON" }),
              /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "A POS that can't see stock" }),
              /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "A spreadsheet for credit" }),
              /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "WhatsApp for orders" }),
              /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "A book for the counter" }),
              /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "An accountant who sees it in March" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { "marginTop": "44px", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(300px,1fr))", "gap": "20px", "alignItems": "stretch" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-reveal", "data-par": "0.05", style: { "padding": "28px", "borderRadius": "var(--vq-r-lg)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "display": "flex", "flexDirection": "column", "gap": "14px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "LEGACY ERP / POS" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h3)", "color": "var(--vq-text)" }, children: "Clunky and inflexible" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Five hundred pre-built menus and rigid settings. A bakery gets buried in wholesale manufacturing screens. A pharmacy finds batch expiry was never part of checkout." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "flex", "flexDirection": "column", "gap": "8px", "paddingTop": "16px", "borderTop": "1px solid var(--vq-line-soft)" }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "fontFamily": "var(--vq-font-numeric)" }, children: "−" }),
                    " 3 to 6 months of implementation"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "fontFamily": "var(--vq-font-numeric)" }, children: "−" }),
                    " Hundreds of menus you will never use"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-reveal", "data-par": "0.11", style: { "padding": "28px", "borderRadius": "var(--vq-r-lg)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "display": "flex", "flexDirection": "column", "gap": "14px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "GENERIC AI APP BUILDERS" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h3)", "color": "var(--vq-text)" }, children: "Hallucinated books" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "A prompt generates raw code from scratch. Raw code breaks accounting rules, invents totals, and cracks under real transaction load. You cannot run real money on it." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "flex", "flexDirection": "column", "gap": "8px", "paddingTop": "16px", "borderTop": "1px solid var(--vq-line-soft)" }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "fontFamily": "var(--vq-font-numeric)" }, children: "−" }),
                    " No double-entry ledger invariants"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "fontFamily": "var(--vq-font-numeric)" }, children: "−" }),
                    " Brittle code that cracks under changes"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-reveal", "data-par": "0.17", style: { "position": "relative", "overflow": "hidden", "padding": "28px", "borderRadius": "var(--vq-r-lg)", "background": "linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)", "boxShadow": "var(--vq-glow-accent-strong)", "color": "#fff", "display": "flex", "flexDirection": "column", "gap": "14px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "position": "relative", "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "rgba(255,255,255,.78)" }, children: "VENQORE · THE AI COMPILER" }),
                /* @__PURE__ */ jsx("h3", { style: { "position": "relative", "margin": "0", "font": "600 var(--vq-fs-h3)/var(--vq-lh-h3) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h3)" }, children: "Both, without the trade" }),
                /* @__PURE__ */ jsx("p", { style: { "position": "relative", "margin": "0", "font": "400 15px/1.6 var(--vq-font-sans)", "color": "rgba(255,255,255,.9)" }, children: "AI compiles your intent into parameterized, battle-tested financial modules. The agility of natural language, the arithmetic of hardened double-entry accounting." }),
                /* @__PURE__ */ jsxs("div", { style: { "position": "relative", "marginTop": "auto", "display": "flex", "flexDirection": "column", "gap": "8px", "paddingTop": "16px", "borderTop": "1px solid rgba(255,255,255,.24)" }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "rgba(255,255,255,.92)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    " 100% custom, 0% hallucinated"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "rgba(255,255,255,.92)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    " Live in minutes, not quarters"
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "value", "data-sec": "value", className: "vq-sec vq-sec--base", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-head--center vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "THE CORE VALUE" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "Flexible where it should be. Rigid where it must be." }),
              /* @__PURE__ */ jsx("p", { children: "The AI decides what your system looks like. It never decides what your numbers say. Those are two different jobs, and VenQore is the only one that keeps them apart." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-balance vq-reveal", style: { "marginTop": "44px" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px", "textAlign": "right" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-balance__l", children: "TOTAL DEBITS" }),
                /* @__PURE__ */ jsxs("span", { className: "vq-balance__v", children: [
                  "Rs ",
                  /* @__PURE__ */ jsx("span", { "data-count": "6636549.20", "data-count-dec": "2", children: "0" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-balance__eq", children: "=" }),
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-balance__l", children: "TOTAL CREDITS" }),
                /* @__PURE__ */ jsxs("span", { className: "vq-balance__v", children: [
                  "Rs ",
                  /* @__PURE__ */ jsx("span", { "data-count": "6636549.20", "data-count-dec": "2", children: "0" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-reveal", style: { "margin": "16px auto 0", "maxWidth": "60ch", "textAlign": "center", "font": "500 13.5px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: "Live from Core Ledger. Debits equal credits or the transaction is refused — that rule lives in the engine, not in a prompt." })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "tenx", "data-sec": "tenx", "data-track": "1", style: { "position": "relative", "height": "380vh", "background": "var(--vq-bg-alt)" }, children: /* @__PURE__ */ jsxs("div", { style: { "position": "sticky", "top": "0", "height": "100vh", "overflow": "hidden", "display": "flex", "flexDirection": "column", "justifyContent": "center" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "1240px", "width": "100%", "margin": "0 auto", "padding": "0 24px 26px", "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px", "flexWrap": "wrap" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "12px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "WHAT CHANGES ON MONDAY" }),
                /* @__PURE__ */ jsx("h2", { style: { "margin": "0", "maxWidth": "22ch", "font": "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)", "fontSize": "clamp(27px,4.2vw,var(--vq-fs-h1))", "letterSpacing": "var(--vq-ls-h1)", "color": "var(--vq-text)" }, children: "Four things a compiler does that software cannot." })
              ] }),
              /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "10px", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)", "paddingBottom": "6px" }, children: [
                "KEEP SCROLLING",
                /* @__PURE__ */ jsx("span", { style: { "width": "54px", "height": "3px", "background": "var(--vq-line-strong)", "position": "relative", "overflow": "hidden", "borderRadius": "999px" }, children: /* @__PURE__ */ jsx("span", { "data-trackbar": "1", style: { "position": "absolute", "inset": "0", "width": "0%", "background": "var(--vq-accent)", "borderRadius": "999px" } }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { "data-trackrow": "1", style: { "display": "flex", "gap": "24px", "padding": "0 clamp(24px,8vw,120px)", "willChange": "transform" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tile", style: { "flex": "0 0 auto", "width": "clamp(300px,38vw,520px)", "padding": "30px", "borderRadius": "var(--vq-r-xl)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "boxShadow": "var(--vq-elev-1)", "display": "flex", "flexDirection": "column", "gap": "16px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "600 44px/1 var(--vq-font-numeric)", "letterSpacing": "-.03em", "color": "var(--vq-accent-text)" }, children: "01" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h2)", "color": "var(--vq-text)", "textWrap": "balance" }, children: "Minutes instead of months" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15.5px/1.62 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "No implementers, no custom-field mapping, no database chart to draw. You write how you operate and the system exists." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "8px 12px", "paddingTop": "18px", "borderTop": "1px solid var(--vq-line-soft)", "font": "500 13px/1.5 var(--vq-font-sans)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)" }, children: "BEFORE" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)" }, children: "3–6 months of implementation" }),
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-accent-text)" }, children: "AFTER" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "Scanning barcodes on day one" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tile", style: { "flex": "0 0 auto", "width": "clamp(300px,38vw,520px)", "padding": "30px", "borderRadius": "var(--vq-r-xl)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "boxShadow": "var(--vq-elev-1)", "display": "flex", "flexDirection": "column", "gap": "16px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "600 44px/1 var(--vq-font-numeric)", "letterSpacing": "-.03em", "color": "var(--vq-accent-text)" }, children: "02" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h2)", "color": "var(--vq-text)", "textWrap": "balance" }, children: "Only the software you use" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15.5px/1.62 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "A boutique gets variant matrixes and fast checkout. A wholesaler gets container logistics and credit aging. Neither sees the other's screens." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "8px 12px", "paddingTop": "18px", "borderTop": "1px solid var(--vq-line-soft)", "font": "500 13px/1.5 var(--vq-font-sans)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)" }, children: "BEFORE" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)" }, children: "500 menus, 40 of them yours" }),
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-accent-text)" }, children: "AFTER" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "Every screen earns its place" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tile", style: { "flex": "0 0 auto", "width": "clamp(300px,38vw,520px)", "padding": "30px", "borderRadius": "var(--vq-r-xl)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "boxShadow": "var(--vq-elev-1)", "display": "flex", "flexDirection": "column", "gap": "16px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "600 44px/1 var(--vq-font-numeric)", "letterSpacing": "-.03em", "color": "var(--vq-accent-text)" }, children: "03" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h2)", "color": "var(--vq-text)", "textWrap": "balance" }, children: "The books cannot drift" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15.5px/1.62 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "The interface is generated. The ledger underneath is immutable double-entry, checked seven ways before anything posts." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "8px 12px", "paddingTop": "18px", "borderTop": "1px solid var(--vq-line-soft)", "font": "500 13px/1.5 var(--vq-font-sans)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)" }, children: "BEFORE" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)" }, children: "Reconciliation is archaeology" }),
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-accent-text)" }, children: "AFTER" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "Debits equal credits, always" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tile", style: { "flex": "0 0 auto", "width": "clamp(300px,38vw,520px)", "padding": "30px", "borderRadius": "var(--vq-r-xl)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "boxShadow": "var(--vq-elev-1)", "display": "flex", "flexDirection": "column", "gap": "16px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "600 44px/1 var(--vq-font-numeric)", "letterSpacing": "-.03em", "color": "var(--vq-accent-text)" }, children: "04" }),
                /* @__PURE__ */ jsx("h3", { style: { "margin": "0", "font": "600 var(--vq-fs-h2)/var(--vq-lh-h2) var(--vq-font-display)", "letterSpacing": "var(--vq-ls-h2)", "color": "var(--vq-text)", "textWrap": "balance" }, children: "Growth is a sentence" }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "font": "400 15.5px/1.62 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "“Add wholesale distribution with warehouse transfer workflows.” The compiler re-wires your topology without downtime." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "grid", "gridTemplateColumns": "auto 1fr", "gap": "8px 12px", "paddingTop": "18px", "borderTop": "1px solid var(--vq-line-soft)", "font": "500 13px/1.5 var(--vq-font-sans)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)" }, children: "BEFORE" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)" }, children: "A new project, a new quote" }),
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 10px/1.5 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-accent-text)" }, children: "AFTER" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "A new module, same afternoon" })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "compiler", "data-sec": "compiler", "data-theater": "1", style: { "position": "relative", "height": "600vh", "background": "var(--vq-bg)", "zIndex": "10" }, children: /* @__PURE__ */ jsxs("div", { style: { "position": "sticky", "top": "0", "height": "100vh", "overflow": "hidden", "display": "flex", "flexDirection": "column" }, children: [
            /* @__PURE__ */ jsx("div", { style: { "position": "absolute", "inset": "0", "background": "radial-gradient(70% 60% at 50% 0%, rgba(11, 170, 143, 0.16), transparent 70%)" } }),
            /* @__PURE__ */ jsxs("div", { "data-thgrid": "1", style: { "position": "relative", "flex": "1", "maxWidth": "1240px", "width": "100%", "margin": "0 auto", "padding": "96px 28px 40px", "display": "grid", "gridTemplateColumns": "250px 1fr", "gap": "40px", "alignItems": "start", "minHeight": "0" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "4px", "paddingTop": "4px" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-accent-text)", "marginBottom": "16px" }, children: "COMPILATION PASS" }),
                /* @__PURE__ */ jsxs("div", { "data-stagerow": "0", style: { "display": "grid", "gridTemplateColumns": "34px 1fr", "gap": "12px", "padding": "10px 0", "opacity": "1", "transition": "opacity var(--vq-dur-3) var(--vq-ease-out)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1.6 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "01" }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 15px/1.2 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Intent" }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 12.5px/1.45 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "You describe how you operate" }),
                    /* @__PURE__ */ jsx("span", { "data-stagebar": "0", style: { "height": "2px", "width": "0%", "marginTop": "5px", "borderRadius": "999px", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)" } })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { "data-stagerow": "1", style: { "display": "grid", "gridTemplateColumns": "34px 1fr", "gap": "12px", "padding": "10px 0", "opacity": ".34", "transition": "opacity var(--vq-dur-3) var(--vq-ease-out)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1.6 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "02" }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 15px/1.2 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Parse" }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 12.5px/1.45 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Entities, workflows, financial routes" }),
                    /* @__PURE__ */ jsx("span", { "data-stagebar": "1", style: { "height": "2px", "width": "0%", "marginTop": "5px", "borderRadius": "999px", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)" } })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { "data-stagerow": "2", style: { "display": "grid", "gridTemplateColumns": "34px 1fr", "gap": "12px", "padding": "10px 0", "opacity": ".34", "transition": "opacity var(--vq-dur-3) var(--vq-ease-out)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1.6 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "03" }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 15px/1.2 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Select" }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 12.5px/1.45 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Proven engines, parameterized" }),
                    /* @__PURE__ */ jsx("span", { "data-stagebar": "2", style: { "height": "2px", "width": "0%", "marginTop": "5px", "borderRadius": "999px", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)" } })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { "data-stagerow": "3", style: { "display": "grid", "gridTemplateColumns": "34px 1fr", "gap": "12px", "padding": "10px 0", "opacity": ".34", "transition": "opacity var(--vq-dur-3) var(--vq-ease-out)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1.6 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "04" }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 15px/1.2 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Wire" }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 12.5px/1.45 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Routes bound to the double-entry core" }),
                    /* @__PURE__ */ jsx("span", { "data-stagebar": "3", style: { "height": "2px", "width": "0%", "marginTop": "5px", "borderRadius": "999px", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)" } })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { "data-stagerow": "4", style: { "display": "grid", "gridTemplateColumns": "34px 1fr", "gap": "12px", "padding": "10px 0", "opacity": ".34", "transition": "opacity var(--vq-dur-3) var(--vq-ease-out)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1.6 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "05" }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 15px/1.2 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Live" }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 12.5px/1.45 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Your system, running" }),
                    /* @__PURE__ */ jsx("span", { "data-stagebar": "4", style: { "height": "2px", "width": "0%", "marginTop": "5px", "borderRadius": "999px", "background": "linear-gradient(90deg, #0BAA8F, #59DBC0)" } })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { "position": "relative", "height": "min(620px, 66vh)", "borderRadius": "var(--vq-r-2xl, 24px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-surface)", "boxShadow": "var(--vq-elev-3)", "overflow": "hidden" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "padding": "14px 18px", "borderBottom": "1px solid var(--vq-line-soft)" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "width": "9px", "height": "9px", "borderRadius": "999px", "background": "#FF8A6B" } }),
                  /* @__PURE__ */ jsx("span", { style: { "width": "9px", "height": "9px", "borderRadius": "999px", "background": "#FFCD5B" } }),
                  /* @__PURE__ */ jsx("span", { style: { "width": "9px", "height": "9px", "borderRadius": "999px", "background": "#A9E34B" } }),
                  /* @__PURE__ */ jsx("span", { "data-frametitle": "1", style: { "marginLeft": "12px", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".12em", "color": "var(--vq-text-3)" }, children: "BLUEPRINT · READING INTENT" }),
                  /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "LIVE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { style: { "position": "relative", "height": "calc(100% - 45px)" }, children: [
                  /* @__PURE__ */ jsxs("div", { "data-layer": "0", style: { "position": "absolute", "inset": "0", "padding": "44px 48px", "display": "flex", "flexDirection": "column", "justifyContent": "center", "gap": "24px", "opacity": "1" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "THE OWNER TYPES" }),
                    /* @__PURE__ */ jsxs("p", { style: { "margin": "0", "font": "600 clamp(22px, 2.5vw, 34px)/1.32 var(--vq-font-display)", "letterSpacing": "-.028em", "color": "var(--vq-text)", "maxWidth": "30ch" }, children: [
                      /* @__PURE__ */ jsx("span", { "data-typed": "1" }),
                      /* @__PURE__ */ jsx("span", { style: { "display": "inline-block", "width": "3px", "height": "1em", "marginLeft": "4px", "verticalAlign": "-0.12em", "background": "var(--vq-accent)", "animation": "vqBlink 1s steps(1) infinite" } })
                    ] }),
                    /* @__PURE__ */ jsx("span", { style: { "font": "500 14px/1.5 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "No forms. No implementation consultant. One paragraph in your own words." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { "data-layer": "1", style: { "position": "absolute", "inset": "0", "padding": "40px 48px", "display": "flex", "flexDirection": "column", "justifyContent": "center", "gap": "20px", "opacity": "0" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "DOMAIN PARSE" }),
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "12px" }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "ENTITIES" }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexWrap": "wrap", "gap": "7px" }, children: [
                          /* @__PURE__ */ jsxs("span", { "data-token": "0", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "var(--vq-accent)" } }),
                            "Drugs & SKUs"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "1", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "var(--vq-accent)" } }),
                            "Batches"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "2", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "var(--vq-accent)" } }),
                            "Expiry dates"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "3", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "var(--vq-accent)" } }),
                            "Branches"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "4", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "var(--vq-accent)" } }),
                            "Distributors"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "WORKFLOWS" }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexWrap": "wrap", "gap": "7px" }, children: [
                          /* @__PURE__ */ jsxs("span", { "data-token": "5", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#55C4EC" } }),
                            "Counter checkout"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "6", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#55C4EC" } }),
                            "Batch-first picking"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "7", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#55C4EC" } }),
                            "Branch transfers"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "8", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#55C4EC" } }),
                            "Expiry write-off"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "FINANCIAL ROUTES" }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexWrap": "wrap", "gap": "7px" }, children: [
                          /* @__PURE__ */ jsxs("span", { "data-token": "9", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#FFCD5B" } }),
                            "Accounts payable · 30-day terms"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "10", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#FFCD5B" } }),
                            "Sales tax on invoice"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { "data-token": "11", style: { "display": "inline-flex", "alignItems": "center", "gap": "7px", "padding": "6px 12px", "borderRadius": "999px", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text)", "opacity": "0", "transform": "translateY(8px) scale(.96)", "transition": "all 320ms var(--vq-ease-spring)" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "width": "5px", "height": "5px", "borderRadius": "999px", "background": "#FFCD5B" } }),
                            "Inventory valuation"
                          ] })
                        ] })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { "data-layer": "2", style: { "position": "absolute", "inset": "0", "padding": "36px 44px", "display": "flex", "flexDirection": "column", "justifyContent": "center", "gap": "18px", "opacity": "0" }, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "16px" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "ENGINE SELECTION" }),
                      /* @__PURE__ */ jsxs("span", { style: { "font": "500 12px/1 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                        /* @__PURE__ */ jsx("span", { "data-selcount": "1", style: { "fontFamily": "var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "0" }),
                        " of 24 engines wired"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { "display": "grid", "gridTemplateColumns": "repeat(4, 1fr)", "gap": "10px" }, children: [
                      /* @__PURE__ */ jsxs("div", { "data-engine": "0", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "POS checkout" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "SELECTED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "1", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "Batch & expiry" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "SELECTED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "2", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "Stock ledger" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "SELECTED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "3", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Manufacturing BOM" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "4", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "Purchases & credit" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "SELECTED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "5", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "Branch transfers" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "SELECTED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "6", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Payroll" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "7", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Container logistics" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "8", "data-on": "1", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".28", "transition": "all 380ms var(--vq-ease-spring)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: "Core Ledger" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "ALWAYS ON" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "9", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Table service" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "10", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Tier pricing matrix" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { "data-engine": "11", "data-on": "0", style: { "padding": "12px 14px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "opacity": ".12" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text-3)" }, children: "Channel sync" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1.3 var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "not needed" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { "data-layer": "3", style: { "position": "absolute", "inset": "0", "padding": "34px 44px", "opacity": "0" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "TOPOLOGY · ROUTES BOUND TO CORE LEDGER" }),
                    /* @__PURE__ */ jsxs("div", { style: { "position": "relative", "height": "calc(100% - 26px)", "marginTop": "18px", "display": "grid", "gridTemplateColumns": "1fr 1fr 1.15fr", "gap": "40px", "alignItems": "center" }, children: [
                      /* @__PURE__ */ jsxs("svg", { "data-wires": "1", style: { "position": "absolute", "inset": "0", "width": "100%", "height": "100%", "pointerEvents": "none", "overflow": "visible" }, children: [
                        /* @__PURE__ */ jsx("path", { "data-wire": "1", fill: "none", stroke: "#0BAA8F", strokeWidth: "2.2", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { "data-wire": "1", fill: "none", stroke: "#0BAA8F", strokeWidth: "2.2", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { "data-wire": "1", fill: "none", stroke: "#0BAA8F", strokeWidth: "2.2", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { "data-wire": "1", fill: "none", stroke: "#59DBC0", strokeWidth: "2.6", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { "data-wire": "1", fill: "none", stroke: "#59DBC0", strokeWidth: "2.6", strokeLinecap: "round" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "14px", "position": "relative" }, children: [
                        /* @__PURE__ */ jsxs("div", { "data-node": "in", style: { "position": "relative", "padding": "13px 16px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: [
                          "POS terminals",
                          /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".08em", "color": "var(--vq-text-3)" }, children: "3 BRANCHES" }),
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "right": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "var(--vq-accent)", "border": "2px solid var(--vq-surface)", "boxShadow": "0 0 8px var(--vq-accent)" } })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { "data-node": "in", style: { "position": "relative", "padding": "13px 16px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: [
                          "Purchase receipts",
                          /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".08em", "color": "var(--vq-text-3)" }, children: "DISTRIBUTORS" }),
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "right": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "var(--vq-accent)", "border": "2px solid var(--vq-surface)", "boxShadow": "0 0 8px var(--vq-accent)" } })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { "data-node": "in", style: { "position": "relative", "padding": "13px 16px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: [
                          "SmartCapture",
                          /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".08em", "color": "var(--vq-text-3)" }, children: "PHOTO · VOICE" }),
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "right": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "var(--vq-accent)", "border": "2px solid var(--vq-surface)", "boxShadow": "0 0 8px var(--vq-accent)" } })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "18px", "position": "relative" }, children: [
                        /* @__PURE__ */ jsxs("div", { "data-node": "mid", style: { "position": "relative", "padding": "15px 18px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-accent-quiet-line)", "background": "var(--vq-accent-quiet)", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: [
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "left": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "var(--vq-accent)", "border": "2px solid var(--vq-surface)" } }),
                          "Stock & batch engine",
                          /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".08em", "color": "var(--vq-accent-text)" }, children: "FEFO · EXPIRY GUARD" }),
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "right": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "#59DBC0", "border": "2px solid var(--vq-surface)", "boxShadow": "0 0 8px #59DBC0" } })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { "data-node": "mid", style: { "position": "relative", "padding": "15px 18px", "borderRadius": "var(--vq-r-md, 12px)", "border": "1px solid var(--vq-accent-quiet-line)", "background": "var(--vq-accent-quiet)", "font": "600 13px/1.25 var(--vq-font-display)", "color": "var(--vq-text)" }, children: [
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "left": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "var(--vq-accent)", "border": "2px solid var(--vq-surface)" } }),
                          "Payables & terms",
                          /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "4px", "font": "500 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".08em", "color": "var(--vq-accent-text)" }, children: "30-DAY AGING" }),
                          /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "right": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "#59DBC0", "border": "2px solid var(--vq-surface)", "boxShadow": "0 0 8px #59DBC0" } })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { "data-node": "core", style: { "position": "relative", "padding": "22px 20px", "borderRadius": "var(--vq-r-lg, 16px)", "background": "linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)", "boxShadow": "var(--vq-glow-accent-strong)", "color": "#fff" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "position": "absolute", "left": "-5px", "top": "50%", "transform": "translateY(-50%)", "width": "8px", "height": "8px", "borderRadius": "999px", "background": "#fff", "border": "2px solid #088975", "boxShadow": "0 0 10px #fff" } }),
                        /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "rgba(255, 255, 255, 0.75)" }, children: "THE ENGINE" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "8px", "font": "600 20px/1.1 var(--vq-font-display)", "letterSpacing": "-.03em" }, children: "Core Ledger" }),
                        /* @__PURE__ */ jsx("span", { style: { "display": "block", "marginTop": "8px", "font": "500 12px/1.45 var(--vq-font-sans)", "color": "rgba(255, 255, 255, 0.84)" }, children: "Every module posts here. Debits equal credits or the post is refused." })
                      ] }) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { "data-layer": "4", style: { "position": "absolute", "inset": "0", "padding": "30px 34px", "opacity": "0" }, children: /* @__PURE__ */ jsxs("div", { style: { "height": "100%", "display": "grid", "gridTemplateColumns": "1.35fr 1fr", "gap": "16px" }, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "borderRadius": "var(--vq-r-lg, 16px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "padding": "18px", "display": "flex", "flexDirection": "column", "gap": "12px", "minHeight": "0" }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "justifyContent": "space-between" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Checkout · Branch 2" }),
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 10.5px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-success)" }, children: "BATCH EXPIRY ON" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px" }, children: [
                        /* @__PURE__ */ jsxs("div", { style: { "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "8px", "padding": "8px 0", "borderBottom": "1px solid var(--vq-line-soft)" }, children: [
                          /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 13px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Amoxicillin 500mg × 2" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 11px/1 var(--vq-font-numeric)", "letterSpacing": ".05em", "color": "var(--vq-text-3)" }, children: "BATCH A-2291 · EXP 03/2027" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text)", "alignSelf": "center" }, children: "Rs 1,240.00" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "8px", "padding": "8px 0", "borderBottom": "1px solid var(--vq-line-soft)" }, children: [
                          /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 13px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Insulin pen refill" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 11px/1 var(--vq-font-numeric)", "letterSpacing": ".05em", "color": "var(--vq-text-3)" }, children: "BATCH C-0417 · EXP 11/2026" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text)", "alignSelf": "center" }, children: "Rs 2,660.00" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "8px", "padding": "8px 0", "borderBottom": "1px solid var(--vq-line-soft)" }, children: [
                          /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "flexDirection": "column", "gap": "3px" }, children: [
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 13px/1 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Paracetamol strip × 4" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "500 11px/1 var(--vq-font-numeric)", "letterSpacing": ".05em", "color": "var(--vq-text-3)" }, children: "BATCH P-8802 · EXP 08/2028" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text)", "alignSelf": "center" }, children: "Rs 418.00" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "paddingTop": "12px", "borderTop": "1px solid var(--vq-line)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "TOTAL" }),
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 24px/1 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "letterSpacing": "-.03em", "color": "var(--vq-text)" }, children: "Rs 4,318.00" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "12px", "minHeight": "0" }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { "borderRadius": "var(--vq-r-lg, 16px)", "border": "1px solid var(--vq-success-line)", "background": "var(--vq-success-bg)", "padding": "14px 16px" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-success)" }, children: "POSTED · 7 CHECKS PASSED" }),
                        /* @__PURE__ */ jsxs("div", { style: { "marginTop": "10px", "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "6px 10px", "font": "500 12px/1.5 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text)" }, children: [
                          /* @__PURE__ */ jsx("span", { children: "Debits" }),
                          /* @__PURE__ */ jsx("span", { children: "Rs 4,318.00" }),
                          /* @__PURE__ */ jsx("span", { children: "Credits" }),
                          /* @__PURE__ */ jsx("span", { children: "Rs 4,318.00" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "flex": "1", "borderRadius": "var(--vq-r-lg, 16px)", "border": "1px solid var(--vq-line)", "background": "var(--vq-sunken)", "padding": "14px 16px", "display": "flex", "flexDirection": "column", "gap": "10px", "minHeight": "0" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "EXPIRING IN 45 DAYS" }),
                        /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px" }, children: [
                          /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "font": "500 12px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                            /* @__PURE__ */ jsx("span", { children: "Batch C-0417 · Insulin" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-numeric)", "color": "var(--vq-warning)" }, children: "18 DAYS" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "font": "500 12px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                            /* @__PURE__ */ jsx("span", { children: "Batch V-1120 · Vitamin D" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-numeric)", "color": "var(--vq-warning)" }, children: "31 DAYS" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "8px", "font": "500 12px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                            /* @__PURE__ */ jsx("span", { children: "Batch A-9043 · Syrup" }),
                            /* @__PURE__ */ jsx("span", { style: { "font": "600 12px/1 var(--vq-font-numeric)", "color": "var(--vq-warning)" }, children: "44 DAYS" })
                          ] })
                        ] })
                      ] })
                    ] })
                  ] }) })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "showcase", "data-sec": "showcase", "data-stack": "1", className: "vq-stackwrap", style: { "height": "520vh", "background": "var(--vq-bg)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-stackpin", children: [
            /* @__PURE__ */ jsx("div", { "aria-hidden": "true", "data-par": "-0.06", style: { "position": "absolute", "inset": "0", "background": "radial-gradient(62% 52% at 50% 8%,var(--vq-accent-quiet),transparent 68%)", "pointerEvents": "none" } }),
            /* @__PURE__ */ jsxs("div", { className: "vq-stackpin__in", children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px", "flexWrap": "wrap", "marginBottom": "26px" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "11px" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "THE SURFACES YOU ACTUALLY TOUCH" }),
                  /* @__PURE__ */ jsx("h2", { style: { "margin": "0", "maxWidth": "27ch", "font": "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)", "fontSize": "clamp(26px,4vw,var(--vq-fs-h1))", "letterSpacing": "var(--vq-ls-h1)", "color": "var(--vq-text)" }, children: "Five screens, and everything else is behind them." })
                ] }),
                /* @__PURE__ */ jsx("span", { "data-stackcount": true, style: { "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)", "paddingBottom": "6px" }, children: "01 / 05" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-stagebox", children: [
                /* @__PURE__ */ jsxs("article", { className: "vq-stackcard", "data-stackcard": true, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__bar", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__ttl", children: "THE REGISTER · BRANCH 2" }),
                    /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "LIVE" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__body", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__say", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-stackcard__n", children: "01 · THE REGISTER" }),
                      /* @__PURE__ */ jsx("h3", { children: "A till you compose yourself." }),
                      /* @__PURE__ */ jsx("p", { children: "Keyboard-first, barcode-first, and laid out the way your counter actually works. Split tender, held sales, returns against the original line — and a cashier PIN that switches staff in under a second." }),
                      /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/pos", children: "See the register →" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__see", children: [
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Amoxicillin 500mg × 2" }),
                          "BATCH A-2291 · EXP 03/2027"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "1,240.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Insulin pen refill" }),
                          "BATCH C-0417 · EXP 11/2026"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "2,660.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Paracetamol strip × 4" }),
                          "BATCH P-8802 · EXP 08/2028"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "418.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "paddingTop": "12px", "marginTop": "2px", "borderTop": "1px solid var(--vq-line)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "TOTAL" }),
                        /* @__PURE__ */ jsx("span", { style: { "font": "600 23px/1 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "letterSpacing": "-.03em", "color": "var(--vq-text)" }, children: "Rs 4,318.00" })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("article", { className: "vq-stackcard", "data-stackcard": true, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__bar", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__ttl", children: "DOCUMENTS · INVOICE 2026-0417" }),
                    /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "DRAFT" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__body", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__say", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-stackcard__n", children: "02 · DOCUMENTS" }),
                      /* @__PURE__ */ jsx("h3", { children: "Thirteen document types, one editor." }),
                      /* @__PURE__ */ jsx("p", { children: "Quote, sales order, delivery note, invoice, credit note, purchase order, GRN, supplier bill, statement — all the same editor, all posting through the same ledger. Change a template once and every document follows." }),
                      /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/documents", children: "See Documents →" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__see", children: [
                      /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexWrap": "wrap", "gap": "7px", "marginBottom": "4px" }, children: [
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Quote" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Sales order" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Delivery note" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Invoice" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Credit note" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Purchase order" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "GRN" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Supplier bill" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Statement" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Converted from Quote Q-0288" }),
                          "Same lines, same tax, same customer"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "LINKED" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Posted to Core Ledger" }),
                          "AR 4,318.00  /  Revenue 3,659.32  /  Tax 658.68"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "7/7" })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("article", { className: "vq-stackcard", "data-stackcard": true, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__bar", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__ttl", children: "BLUEPRINT · CHANGE REVIEW" }),
                    /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "AWAITING APPROVAL" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__body", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__say", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-stackcard__n", children: "03 · BLUEPRINT" }),
                      /* @__PURE__ */ jsx("h3", { children: "Describe the change. Read the diff. Approve it." }),
                      /* @__PURE__ */ jsx("p", { children: "Adding a branch, a channel or a whole product line is a sentence. Blueprint shows you exactly what it will add, what it will alter and what it will touch downstream — before a single row moves. Every applied change keeps a snapshot you can roll back." }),
                      /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/blueprint", children: "See Blueprint →" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__see", children: [
                      /* @__PURE__ */ jsx("div", { className: "vq-quotebox", style: { "fontSize": "13.5px" }, children: "“Add wholesale distribution with warehouse transfer workflows.”" }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "+ Tier pricing matrix" }),
                          "New module"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "ADD" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "+ Branch transfers" }),
                          "New module"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "ADD" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "~ Customer record" }),
                          "Gains credit terms & price tier"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-warning)" }, children: "ALTER" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Core Ledger" }),
                          "Chart of accounts unchanged"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-text-3)" }, children: "UNTOUCHED" })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("article", { className: "vq-stackcard", "data-stackcard": true, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__bar", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__ttl", children: "THE RECKONER · GROSS MARGIN" }),
                    /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "DEFINED ONCE" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__body", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__say", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-stackcard__n", children: "04 · THE RECKONER" }),
                      /* @__PURE__ */ jsx("h3", { children: "One place a number is defined." }),
                      /* @__PURE__ */ jsx("p", { children: "Every figure on every screen resolves to a single definition you can open and read. No two reports disagreeing about what “margin” means, because there is only one definition of it in the whole system." }),
                      /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/reckoner", children: "See the Reckoner →" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__see", children: [
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Gross margin" }),
                          "(Revenue − COGS) ÷ Revenue"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "32.9%" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Revenue" }),
                          "Posted sales, net of returns and tax"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "1,284,900.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "COGS" }),
                          "Weighted average at time of sale"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "861,883.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Used by" }),
                          "Dashboard · P&L · Signals · Vena"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-accent-text)" }, children: "4 SURFACES" })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("article", { className: "vq-stackcard", "data-stackcard": true, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__bar", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                    /* @__PURE__ */ jsx("span", { className: "vq-stackcard__ttl", children: "DASHBOARD · SELF-ASSEMBLING" }),
                    /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-accent-text)" }, children: "108 READINGS" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__body", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__say", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-stackcard__n", children: "05 · THE DASHBOARD" }),
                      /* @__PURE__ */ jsx("h3", { children: "It builds itself out of what you turned on." }),
                      /* @__PURE__ */ jsx("p", { children: "A pharmacy sees expiry exposure and distributor aging. A boutique sees variant sell-through and channel split. Same engine, same 58 readings underneath — only the ones your business has a use for ever reach the screen." }),
                      /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/dashboard-preview", children: "See the dashboard →" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-stackcard__see", children: [
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Cash position" }),
                          "Across 3 branches"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "2,118,400.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Expiring in 45 days" }),
                          "11 batches"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-warning)" }, children: "184,220.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Payables over 30 days" }),
                          "4 distributors"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "612,050.00" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("b", { children: "Gross margin · this week" }),
                          "vs 31.4% last week"
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "32.9%" })
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { "data-dark": "1", className: "vq-dark", style: { "position": "relative", "overflow": "hidden", "background": "#0C1211", "padding": "28px 0", "borderTop": "1px solid rgba(255, 255, 255, 0.08)", "borderBottom": "1px solid rgba(255, 255, 255, 0.08)" }, children: /* @__PURE__ */ jsxs("div", { "data-marquee": "1", style: { "display": "flex", "gap": "48px", "whiteSpace": "nowrap", "willChange": "transform" }, children: [
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "Blueprint",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "Core Ledger",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "SmartCapture",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "VenSynQ",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "Vena",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "Signals",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "Blueprint",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "Core Ledger",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "SmartCapture",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "VenSynQ",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "rgba(237, 242, 239, 0.5)" }, children: [
              "Vena",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] }),
            /* @__PURE__ */ jsxs("span", { style: { "display": "inline-flex", "alignItems": "center", "gap": "48px", "font": "600 clamp(20px, 2.4vw, 34px)/1 var(--vq-font-display)", "letterSpacing": "-.03em", "color": "#59DBC0" }, children: [
              "Signals",
              /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "#23C4A6" } })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(BusinessTypes, {}),
          /* @__PURE__ */ jsx("section", { id: "tailored", "data-sec": "tailored", className: "vq-sec vq-sec--base", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "WHAT’S INSIDE" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "Everything the business runs on. Nothing charged as a module." }),
              /* @__PURE__ */ jsx("p", { children: "Nine pillars, 46 engines, 240+ features in the box. Your Blueprint turns on the ones you operate — the rest are one sentence away, at no extra cost." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-bento vq-reveal", style: { "marginTop": "44px" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2" }),
                    /* @__PURE__ */ jsx("path", { d: "M16 3H8l-2 4h12z" }),
                    /* @__PURE__ */ jsx("path", { d: "M12 12v5" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Selling" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Point of sale" }),
                  /* @__PURE__ */ jsx("li", { children: "Quotes & invoices" }),
                  /* @__PURE__ */ jsx("li", { children: "Returns & exchanges" }),
                  /* @__PURE__ */ jsx("li", { children: "Layaway & credit sales" }),
                  /* @__PURE__ */ jsx("li", { children: "Multi-currency" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "m21 8-9-5-9 5v8l9 5 9-5z" }),
                    /* @__PURE__ */ jsx("path", { d: "m3 8 9 5 9-5" }),
                    /* @__PURE__ */ jsx("path", { d: "M12 13v8" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Stock" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Multi-location inventory" }),
                  /* @__PURE__ */ jsx("li", { children: "Batch, serial & expiry" }),
                  /* @__PURE__ */ jsx("li", { children: "Stock transfers" }),
                  /* @__PURE__ */ jsx("li", { children: "Adjustments & counts" }),
                  /* @__PURE__ */ jsx("li", { children: "Reorder points" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z" }),
                    /* @__PURE__ */ jsx("path", { d: "M9 7V5a3 3 0 0 1 6 0v2" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Buying" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Purchase orders" }),
                  /* @__PURE__ */ jsx("li", { children: "Supplier bills" }),
                  /* @__PURE__ */ jsx("li", { children: "Goods received notes" }),
                  /* @__PURE__ */ jsx("li", { children: "Landed cost" }),
                  /* @__PURE__ */ jsx("li", { children: "Supplier credit terms" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M12 2v20" }),
                    /* @__PURE__ */ jsx("path", { d: "M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Money" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Double-entry ledger" }),
                  /* @__PURE__ */ jsx("li", { children: "Chart of accounts" }),
                  /* @__PURE__ */ jsx("li", { children: "Bank & cash" }),
                  /* @__PURE__ */ jsx("li", { children: "Tax handling" }),
                  /* @__PURE__ */ jsx("li", { children: "Trial balance, P&L, balance sheet" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
                    /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "People & access" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "7 roles out of the box" }),
                  /* @__PURE__ */ jsx("li", { children: "Custom permissions" }),
                  /* @__PURE__ */ jsx("li", { children: "Approval chains" }),
                  /* @__PURE__ */ jsx("li", { children: "Shift & attendance" }),
                  /* @__PURE__ */ jsx("li", { children: "Commission" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
                    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "7", r: "4" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Customers & suppliers" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Customer accounts" }),
                  /* @__PURE__ */ jsx("li", { children: "Credit limits" }),
                  /* @__PURE__ */ jsx("li", { children: "Loyalty" }),
                  /* @__PURE__ */ jsx("li", { children: "Statements" }),
                  /* @__PURE__ */ jsx("li", { children: "Payment history" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M3 21h18" }),
                    /* @__PURE__ */ jsx("path", { d: "M5 21V7l7-4 7 4v14" }),
                    /* @__PURE__ */ jsx("path", { d: "M9 21v-6h6v6" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Branches" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Unlimited locations" }),
                  /* @__PURE__ */ jsx("li", { children: "Per-branch stock & pricing" }),
                  /* @__PURE__ */ jsx("li", { children: "Inter-branch transfers" }),
                  /* @__PURE__ */ jsx("li", { children: "Consolidated view" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M3 3v18h18" }),
                    /* @__PURE__ */ jsx("path", { d: "m7 15 4-5 3 3 5-7" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Intelligence" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "Dashboards" }),
                  /* @__PURE__ */ jsx("li", { children: "Custom reports" }),
                  /* @__PURE__ */ jsx("li", { children: "Signals (retention & risk)" }),
                  /* @__PURE__ */ jsx("li", { children: "Export to anything" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-bento__hd", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-bento__ic", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
                    /* @__PURE__ */ jsx("path", { d: "M2 12h20" }),
                    /* @__PURE__ */ jsx("path", { d: "M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" })
                  ] }) }),
                  /* @__PURE__ */ jsx("h3", { children: "Channels" })
                ] }),
                /* @__PURE__ */ jsxs("ul", { children: [
                  /* @__PURE__ */ jsx("li", { children: "VenSynQ multi-channel sync" }),
                  /* @__PURE__ */ jsx("li", { children: "WooCommerce" }),
                  /* @__PURE__ */ jsx("li", { children: "Amazon" }),
                  /* @__PURE__ */ jsx("li", { children: "eBay" }),
                  /* @__PURE__ */ jsx("li", { children: "TikTok Shop" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-reveal", style: { "marginTop": "18px" }, children: /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/features", children: "See all 240+ features →" }) }),
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", style: { "marginTop": "72px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "ZERO BLOAT" }),
              /* @__PURE__ */ jsx("h2", { style: { "fontSize": "clamp(26px,3.8vw,var(--vq-fs-h1))" }, children: "Same compiler. A different system every time." }),
              /* @__PURE__ */ jsx("p", { children: "Pick a business below and watch the engine set change. Everything that goes dim is software you never have to look at." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "marginTop": "34px", "display": "flex", "flexWrap": "wrap", "gap": "10px" }, "data-ind-chips": true, children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip is-active", "data-ind": "pharmacy", children: "3-branch pharmacy" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-ind": "bakery", children: "Bakery, central kitchen" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-ind": "wholesale", children: "Auto parts wholesale" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-ind": "boutique", children: "Boutique + online" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", "data-indgrid": "1", style: { "marginTop": "26px", "display": "grid", "gridTemplateColumns": "1.55fr 1fr", "gap": "20px", "alignItems": "start" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { "padding": "24px", "borderRadius": "var(--vq-r-xl, 20px)", "background": "var(--vq-surface)", "border": "1px solid var(--vq-line)", "boxShadow": "var(--vq-elev-1)" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "14px", "marginBottom": "18px" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "COMPILED ENGINE SET" }),
                  /* @__PURE__ */ jsx("span", { "data-ind-count": true, style: { "font": "600 12px/1 var(--vq-font-numeric)", "color": "var(--vq-accent-text)" }, children: "8 of 24 shipped" })
                ] }),
                /* @__PURE__ */ jsx("div", { "data-modules-grid": true, style: { "display": "grid", "gridTemplateColumns": "repeat(auto-fill, minmax(148px, 1fr))", "gap": "8px" } })
              ] }),
              /* @__PURE__ */ jsxs("div", { "data-ind-card": true, style: { "display": "flex", "flexDirection": "column", "gap": "16px", "padding": "24px", "borderRadius": "var(--vq-r-xl, 20px)", "background": "var(--vq-sunken)", "border": "1px solid var(--vq-line)", "color": "var(--vq-text)" }, children: [
                /* @__PURE__ */ jsx("span", { "data-ind-eyebrow": true, style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-accent-text)" }, children: "PHARMACY · 3 BRANCHES" }),
                /* @__PURE__ */ jsx("h3", { "data-ind-title": true, style: { "margin": "0", "font": "600 21px/1.25 var(--vq-font-display)", "letterSpacing": "-.02em" }, children: "Batch expiry lives inside checkout" }),
                /* @__PURE__ */ jsx("p", { "data-ind-blurb": true, style: { "margin": "0", "font": "400 15px/1.62 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: "Not in a settings page, not in a separate module. The counter picks the nearest-expiry batch first, and the write-off posts itself." }),
                /* @__PURE__ */ jsxs("div", { "data-ind-points": true, style: { "display": "flex", "flexDirection": "column", "gap": "10px", "paddingTop": "16px", "borderTop": "1px solid var(--vq-line-soft)" }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "gap": "10px", "font": "500 13.5px/1.5 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)", "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    "Distributor invoices on 30-day terms, aged automatically"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "gap": "10px", "font": "500 13.5px/1.5 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)", "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    "Expiry watchlist at 45, 30 and 15 days"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "gap": "10px", "font": "500 13.5px/1.5 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)", "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    "Stock moves between branches without a spreadsheet"
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "day2", "data-sec": "day2", className: "vq-sec vq-sec--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "AI THAT DOES THE WORK" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "The AI isn't a chat box in the corner." }),
              /* @__PURE__ */ jsx("p", { children: "It compiled the system on day one. From day two it works inside it — drafting the purchase order, matching the bank feed, reading the voice note, and telling you which customer stopped ordering." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-ai vq-reveal", style: { "marginTop": "48px" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.04", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", children: "SMARTCAPTURE" }),
                /* @__PURE__ */ jsx("h3", { children: "A photo in, a posted transaction out" }),
                /* @__PURE__ */ jsx("p", { children: "The order arrived as a WhatsApp voice note, a photo of a handwritten list, or a screenshot. Point SmartCapture at it and it comes out the other side as a real sale — items matched, quantities set, customer attached, ledger posted." }),
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px", "marginTop": "2px" }, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("b", { children: "voice-note-1142.ogg" }),
                      "“Two boxes amoxicillin, one insulin, put it on Rafiq’s account”"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-text-3)" }, children: "READ" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("b", { children: "3 lines matched to SKUs" }),
                      "Customer: Rafiq Medical Store"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "DRAFTED" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("a", { className: "vq-link", style: { "marginTop": "auto", "paddingTop": "10px" }, href: "/smartcapture", children: "See SmartCapture →" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.09", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", children: "VENA · ASK IN PLAIN WORDS" }),
                /* @__PURE__ */ jsx("h3", { children: "Answers straight off the ledger" }),
                /* @__PURE__ */ jsx("p", { children: "Ask your business a question the way you'd ask your manager. Vena answers from your posted data — and shows you the definition and the journal entries behind every figure, so you can check its work." }),
                /* @__PURE__ */ jsx("div", { className: "vq-quotebox", children: "“What was our gross margin at branch 2 this weekend?”" }),
                /* @__PURE__ */ jsxs("div", { style: { "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "8px 14px", "font": "500 13px/1.6 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text-2)" }, children: [
                  /* @__PURE__ */ jsx("span", { children: "Revenue" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "Rs 1,284,900.00" }),
                  /* @__PURE__ */ jsx("span", { children: "Cost of goods" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text)" }, children: "Rs 861,883.00" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: "Gross margin" }),
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: "32.9%" })
                ] }),
                /* @__PURE__ */ jsx("span", { style: { "font": "500 12px/1.5 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: "Every figure traceable to the journal entries behind it." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.14", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", children: "SIGNALS · RETENTION & RISK" }),
                /* @__PURE__ */ jsx("h3", { children: "The customer who quietly stopped" }),
                /* @__PURE__ */ jsx("p", { children: "The account that used to order every two weeks hasn't ordered in six. You'd usually notice three months late. Signals tells you this week, while it's still a phone call and not a loss." }),
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px", "marginTop": "2px" }, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("b", { children: "Rafiq Medical Store" }),
                      "Ordered every 14 days · last order 41 days ago"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-danger)" }, children: "AT RISK" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("b", { children: "City Pharmacy (Model Town)" }),
                      "Order size down 38% over 3 months"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-warning)" }, children: "SLIPPING" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("b", { children: "Al-Shifa Chemist" }),
                      "Steady · 22 orders this quarter"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "HEALTHY" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.04", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", children: "PREDICTIVE REPLENISHMENT" }),
                /* @__PURE__ */ jsx("h3", { children: "Purchase orders before the stockout" }),
                /* @__PURE__ */ jsx("p", { children: "Sales velocity, supplier lead times and seasonality read together, then drafted into a purchase order you approve or edit. It never orders anything on its own." }),
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "10px", "marginTop": "2px" }, children: [
                  /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "justifyContent": "space-between", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Amoxicillin 500mg" }),
                      /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "reorder in 4 days" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { style: { "height": "6px", "borderRadius": "999px", "background": "var(--vq-chart-track)", "overflow": "hidden" }, children: /* @__PURE__ */ jsx("span", { style: { "display": "block", "height": "100%", "width": "82%", "borderRadius": "999px", "background": "var(--vq-grad-mint)" } }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "justifyContent": "space-between", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Insulin pen refill" }),
                      /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "reorder in 9 days" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { style: { "height": "6px", "borderRadius": "999px", "background": "var(--vq-chart-track)", "overflow": "hidden" }, children: /* @__PURE__ */ jsx("span", { style: { "display": "block", "height": "100%", "width": "58%", "borderRadius": "999px", "background": "var(--vq-grad-mint)" } }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "6px" }, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "justifyContent": "space-between", "font": "500 12.5px/1 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Vitamin D 60k" }),
                      /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)", "color": "var(--vq-text-3)" }, children: "reorder in 21 days" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { style: { "height": "6px", "borderRadius": "999px", "background": "var(--vq-chart-track)", "overflow": "hidden" }, children: /* @__PURE__ */ jsx("span", { style: { "display": "block", "height": "100%", "width": "31%", "borderRadius": "999px", "background": "var(--vq-grad-mint)" } }) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.09", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", children: "AUTONOMOUS RECONCILIATION" }),
                /* @__PURE__ */ jsx("h3", { children: "Bank feed, card receipts, POS logs" }),
                /* @__PURE__ */ jsx("p", { children: "Matched line by line against the ledger. What matches is closed. What doesn't is flagged with the reason, not just the difference — so the drawer short at branch 2 lands on someone's desk the same day." }),
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "8px", "marginTop": "2px" }, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "var(--vq-success)" } }),
                      "Bank feed · 142 lines"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "MATCHED" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "var(--vq-success)" } }),
                      "Card settlement · 38 lines"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "MATCHED" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                    /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "width": "6px", "height": "6px", "borderRadius": "999px", "background": "var(--vq-warning)" } }),
                      "POS drawer · branch 2"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-warning)" }, children: "SHORT 240.00" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot vq-ai__card", "data-par": "0.14", style: { "background": "linear-gradient(135deg, var(--vq-teal-600) 0%, var(--vq-teal-700) 55%, var(--vq-teal-900) 100%)", "borderColor": "transparent", "boxShadow": "var(--vq-glow-accent-strong)", "color": "#fff" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-ai__name", style: { "color": "rgba(255,255,255,.78)" }, children: "THE LINE THE AI DOES NOT CROSS" }),
                /* @__PURE__ */ jsx("h3", { style: { "color": "#fff" }, children: "It composes. It never posts a number it made up." }),
                /* @__PURE__ */ jsx("p", { style: { "color": "rgba(255,255,255,.9)" }, children: "Everything above drafts, matches, reads and flags. A human approves, and Core Ledger — hand-written, with seven correctness checks — decides whether the entry is allowed to exist at all." }),
                /* @__PURE__ */ jsxs("div", { style: { "marginTop": "auto", "paddingTop": "14px", "borderTop": "1px solid rgba(255,255,255,.24)", "display": "flex", "flexDirection": "column", "gap": "8px" }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "rgba(255,255,255,.92)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    " No AI-written accounting logic, ever"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 13px/1.4 var(--vq-font-sans)", "color": "rgba(255,255,255,.92)" }, children: [
                    /* @__PURE__ */ jsx("span", { style: { "fontFamily": "var(--vq-font-numeric)" }, children: "+" }),
                    " Debits equal credits or the post is refused"
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "offline", "data-sec": "offline", "data-offline": "1", className: "vq-off", style: { "height": "400vh" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-off__pin", children: [
            /* @__PURE__ */ jsx("div", { "aria-hidden": "true", "data-par": "-0.05", style: { "position": "absolute", "inset": "0", "background": "radial-gradient(66% 56% at 50% 100%,var(--vq-accent-quiet),transparent 70%)", "pointerEvents": "none" } }),
            /* @__PURE__ */ jsxs("div", { style: { "width": "100%", "maxWidth": "1180px", "margin": "0 auto 26px", "padding": "0 24px", "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px", "flexWrap": "wrap" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "11px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "OFFLINE & SYNC" }),
                /* @__PURE__ */ jsx("h2", { style: { "margin": "0", "maxWidth": "22ch", "font": "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)", "fontSize": "clamp(26px,4vw,var(--vq-fs-h1))", "letterSpacing": "var(--vq-ls-h1)", "color": "var(--vq-text)" }, children: "The internet goes down. The queue does not." })
              ] }),
              /* @__PURE__ */ jsx("p", { style: { "margin": "0", "maxWidth": "38ch", "font": "400 15px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-2)", "paddingBottom": "4px" }, children: "Scroll through a real outage: the line keeps moving, the sales hold, and the ledger takes them the moment the connection returns." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-off__grid", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-off__steps", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-off__step", "data-offstep": true, "data-on": "1", children: [
                  /* @__PURE__ */ jsx("i", { children: "01" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Selling normally" }),
                    /* @__PURE__ */ jsx("s", { children: "Every sale posts to Core Ledger as it happens" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-off__track", children: /* @__PURE__ */ jsx("span", { className: "vq-off__bar", "data-offbar": true }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-off__step", "data-offstep": true, children: [
                  /* @__PURE__ */ jsx("i", { children: "02" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "The line drops" }),
                    /* @__PURE__ */ jsx("s", { children: "The till notices in under a second and keeps going" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-off__track", children: /* @__PURE__ */ jsx("span", { className: "vq-off__bar", "data-offbar": true }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-off__step", "data-offstep": true, children: [
                  /* @__PURE__ */ jsx("i", { children: "03" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "The queue holds" }),
                    /* @__PURE__ */ jsx("s", { children: "Sales, stock moves and tenders written locally, in order" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-off__track", children: /* @__PURE__ */ jsx("span", { className: "vq-off__bar", "data-offbar": true }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-off__step", "data-offstep": true, children: [
                  /* @__PURE__ */ jsx("i", { children: "04" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Reconnect & drain" }),
                    /* @__PURE__ */ jsx("s", { children: "Replayed in sequence, checked seven ways, posted" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-off__track", children: /* @__PURE__ */ jsx("span", { className: "vq-off__bar", "data-offbar": true }) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-till", "data-till": true, "data-net": "up", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-till__bar", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                  /* @__PURE__ */ jsx("span", { style: { "marginLeft": "8px", "color": "var(--vq-text-3)" }, children: "TILL 2 · MODEL TOWN" }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-till__sig", children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-till__led" }),
                    /* @__PURE__ */ jsx("span", { "data-netlabel": true, style: { "color": "var(--vq-text-2)" }, children: "ONLINE" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-till__body", children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-till__left", children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "center", "justifyContent": "space-between" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Held for sync" }),
                      /* @__PURE__ */ jsxs("span", { style: { "font": "600 12px/1 var(--vq-font-numeric)", "letterSpacing": ".1em", "color": "var(--vq-text-3)" }, children: [
                        /* @__PURE__ */ jsx("span", { "data-qcount": true, style: { "color": "var(--vq-accent-text)" }, children: "0" }),
                        " IN QUEUE"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-q", "data-qrow": true, "data-in": "0", "data-state": "queued", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        /* @__PURE__ */ jsx("b", { style: { "display": "block", "font": "600 12.5px/1.3 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Sale #4471 · Cash" }),
                        "3 lines · Rs 4,318.00"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-q__st", children: "QUEUED" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-q", "data-qrow": true, "data-in": "0", "data-state": "queued", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        /* @__PURE__ */ jsx("b", { style: { "display": "block", "font": "600 12.5px/1.3 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Sale #4472 · Card" }),
                        "1 line · Rs 980.00"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-q__st", children: "QUEUED" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-q", "data-qrow": true, "data-in": "0", "data-state": "queued", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        /* @__PURE__ */ jsx("b", { style: { "display": "block", "font": "600 12.5px/1.3 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Return #R-118" }),
                        "Against invoice 2026-0388 · Rs 1,240.00"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-q__st", children: "QUEUED" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-q", "data-qrow": true, "data-in": "0", "data-state": "queued", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        /* @__PURE__ */ jsx("b", { style: { "display": "block", "font": "600 12.5px/1.3 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Sale #4473 · Split tender" }),
                        "Cash 2,000 + Card 1,660"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-q__st", children: "QUEUED" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-q", "data-qrow": true, "data-in": "0", "data-state": "queued", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        /* @__PURE__ */ jsx("b", { style: { "display": "block", "font": "600 12.5px/1.3 var(--vq-font-sans)", "color": "var(--vq-text)" }, children: "Stock move · Branch 2 → 3" }),
                        "14 units · batch A-2291"
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "vq-q__st", children: "QUEUED" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-till__right", children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-text-3)" }, children: "WHAT KEEPS WORKING" }),
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "7px" }, children: [
                      /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 12.5px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                        "Barcode scanning & price lookup"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 12.5px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                        "Cash, card and split tender"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 12.5px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                        "Batch picking & expiry guard"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 12.5px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-2)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-success)" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                        "Receipt printing & cash drawer"
                      ] }),
                      /* @__PURE__ */ jsxs("span", { style: { "display": "flex", "alignItems": "center", "gap": "8px", "font": "500 12.5px/1.4 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: [
                        /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-warning)", "fontFamily": "var(--vq-font-numeric)" }, children: "−" }),
                        "Channel sync waits for the line"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { "data-posted": true, style: { "marginTop": "auto", "padding": "13px 15px", "borderRadius": "var(--vq-r-md)", "border": "1px solid var(--vq-success-line, var(--vq-line))", "background": "var(--vq-success-bg, var(--vq-accent-quiet))", "opacity": "0", "transform": "translateY(10px)", "transition": "opacity 320ms var(--vq-ease-out),transform 320ms var(--vq-ease-out)" }, children: [
                      /* @__PURE__ */ jsxs("span", { style: { "font": "700 12px/1 var(--vq-font-numeric)", "letterSpacing": ".14em", "color": "var(--vq-success)" }, children: [
                        "DRAINED · ",
                        /* @__PURE__ */ jsx("span", { "data-drained": true, children: "0" }),
                        " OF 5 POSTED"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { style: { "marginTop": "9px", "display": "grid", "gridTemplateColumns": "1fr auto", "gap": "5px 10px", "font": "500 12px/1.5 var(--vq-font-numeric)", "fontVariantNumeric": "tabular-nums", "color": "var(--vq-text)" }, children: [
                        /* @__PURE__ */ jsx("span", { children: "Debits" }),
                        /* @__PURE__ */ jsx("span", { children: "Rs 9,478.00" }),
                        /* @__PURE__ */ jsx("span", { children: "Credits" }),
                        /* @__PURE__ */ jsx("span", { children: "Rs 9,478.00" })
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { style: { "width": "100%", "maxWidth": "1180px", "margin": "22px auto 0", "padding": "0 24px", "font": "500 13.5px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-3)" }, children: "Nothing is posted twice. Each queued entry carries its own idempotency key, and replay is refused if the ledger has already seen it." })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "industries", "data-sec": "industries", className: "vq-sec vq-sec--base", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "PRESETS" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "Or start from a system that already fits." }),
              /* @__PURE__ */ jsx("p", { children: "Not everyone wants to describe their business from scratch. Pick the closest preset, change what's different, go live. You still get the Blueprint — you just start it further along." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-presets vq-reveal", style: { "marginTop": "46px" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.04", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "RETAIL SHOP" }),
                /* @__PURE__ */ jsx("h3", { children: "Fast checkout, real margins" }),
                /* @__PURE__ */ jsx("p", { children: "Stock that's right at closing time, because every sale moved it. Barcode-first till, day-close that balances, and a margin figure that means one thing." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Retail preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.08", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "WHOLESALE & DISTRIBUTION" }),
                /* @__PURE__ */ jsx("h3", { children: "Credit terms and price tiers" }),
                /* @__PURE__ */ jsx("p", { children: "Per-customer tiers, 30- and 60-day terms aged automatically, dispatch notes that draw from real stock — and Signals telling you which account stopped ordering." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Wholesale preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.12", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "PHARMACY" }),
                /* @__PURE__ */ jsx("h3", { children: "Batch and expiry inside checkout" }),
                /* @__PURE__ */ jsx("p", { children: "Not a settings page and not a separate module. The counter picks nearest-expiry first, an expired item cannot ring up, and the write-off posts itself." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Pharmacy preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.04", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "RESTAURANT & CAFÉ" }),
                /* @__PURE__ */ jsx("h3", { children: "Recipes that draw down ingredients" }),
                /* @__PURE__ */ jsx("p", { children: "Not just plates sold. A cappuccino takes milk, beans and a cup out of stock, the central kitchen transfers at cost, and the food-cost percentage is a real number." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Restaurant preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.08", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "SERVICES & REPAIR" }),
                /* @__PURE__ */ jsx("h3", { children: "Jobs, parts, labour, one invoice" }),
                /* @__PURE__ */ jsx("p", { children: "A job card that collects the parts issued and the hours booked, then becomes the invoice that ties them together — with the parts already off the shelf." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Services preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.12", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-presets__k", children: "MULTI-BRANCH" }),
                /* @__PURE__ */ jsx("h3", { children: "One truth across every location" }),
                /* @__PURE__ */ jsx("p", { children: "Without a nightly sync. Per-branch stock and pricing, transfers that post both sides at once, and a consolidated view that adds up because it is the same ledger." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-presets__go", children: [
                  "Multi-branch preset ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-reveal", style: { "marginTop": "26px" }, children: /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/onboarding", children: "Watch a preset go live in four minutes →" }) })
          ] }) }),
          /* @__PURE__ */ jsxs("section", { id: "integrations", "data-sec": "integrations", className: "vq-sec vq-sec--alt", style: { "overflow": "hidden" }, children: [
            /* @__PURE__ */ jsx("div", { className: "vq-sec__in", children: /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "INTEGRATIONS" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "The other places your stock is already sold." }),
              /* @__PURE__ */ jsx("p", { children: "Channels, hardware and files. Where something is live it says live; where it isn't, it says so. We'd rather list four working integrations than forty logos." })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "vq-loop vq-reveal", "data-loop": "1", "data-loop-speed": "38", style: { "marginTop": "44px" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-loop__track", "data-looptrack": true, children: [
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "WooCommerce ",
                /* @__PURE__ */ jsx("span", { children: "LIVE" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Amazon ",
                /* @__PURE__ */ jsx("span", { children: "SP-API APPROVED" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "eBay ",
                /* @__PURE__ */ jsx("span", { children: "LIVE" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", "data-soon": "1", children: [
                "TikTok Shop ",
                /* @__PURE__ */ jsx("span", { children: "IN ROLLOUT" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Barcode scanners ",
                /* @__PURE__ */ jsx("span", { children: "USB & BLUETOOTH" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Thermal receipt printers ",
                /* @__PURE__ */ jsx("span", { children: "ESC/POS" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Cash drawers ",
                /* @__PURE__ */ jsx("span", { children: "RJ11 KICK" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Label printers ",
                /* @__PURE__ */ jsx("span", { children: "ZPL" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "vq-loop vq-reveal", "data-loop": "-1", "data-loop-speed": "30", style: { "marginTop": "14px" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-loop__track", "data-looptrack": true, children: [
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "CSV & Excel import ",
                /* @__PURE__ */ jsx("span", { children: "ANY SYSTEM" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Full data export ",
                /* @__PURE__ */ jsx("span", { children: "ANY TIME, FREE" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "REST API ",
                /* @__PURE__ */ jsx("span", { children: "SCALE PLAN" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Webhooks ",
                /* @__PURE__ */ jsx("span", { children: "SCALE PLAN" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "Bank statement import ",
                /* @__PURE__ */ jsx("span", { children: "CSV / OFX" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", children: [
                "WhatsApp voice notes ",
                /* @__PURE__ */ jsx("span", { children: "VIA SMARTCAPTURE" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", "data-soon": "1", children: [
                "Shopify ",
                /* @__PURE__ */ jsx("span", { children: "ON THE ROADMAP" })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-loop__item", "data-soon": "1", children: [
                "Payment gateways ",
                /* @__PURE__ */ jsx("span", { children: "ON THE ROADMAP" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "vq-sec__in", children: /* @__PURE__ */ jsxs("div", { className: "vq-synq vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "14px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "VENSYNQ" }),
                /* @__PURE__ */ jsx("h3", { children: "Sell in five places. Count your stock once." }),
                /* @__PURE__ */ jsx("p", { children: "List on WooCommerce, Amazon, eBay and TikTok Shop from the same inventory that runs your counter. One unit sells anywhere, it comes off everywhere — in seconds, not on tonight's sync. Overselling is an account-health problem before it is a customer-service problem, and this is the fix." }),
                /* @__PURE__ */ jsxs("span", { className: "vq-seal", style: { "alignSelf": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  "AMAZON SP-API APPROVED · UK LIVE"
                ] }),
                /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/vensynq", children: "See VenSynQ →" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-synq__viz", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Counter · Model Town" }),
                    "1 sold · 14:02:11"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-mocknum", children: "−1" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", style: { "borderColor": "var(--vq-accent-quiet-line)", "background": "var(--vq-accent-quiet)" }, children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Stock on hand · SKU 44-2291" }),
                    "Single source of truth"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-accent-text)" }, children: "37 → 36" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "WooCommerce" }),
                    "Updated 14:02:11"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "36" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Amazon" }),
                    "Updated 14:02:12"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "36" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-mockrow", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "eBay" }),
                    "Updated 14:02:12"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-mocknum", style: { "color": "var(--vq-success)" }, children: "36" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("section", { id: "analytics", "data-sec": "analytics", "data-analytics": "1", className: "vq-an", style: { "height": "300vh" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-an__pin", children: [
            /* @__PURE__ */ jsx("div", { "aria-hidden": "true", "data-par": "-0.08", style: { "position": "absolute", "inset": "0", "background": "radial-gradient(60% 50% at 78% 12%,var(--vq-accent-quiet),transparent 66%)", "pointerEvents": "none" } }),
            /* @__PURE__ */ jsxs("div", { className: "vq-an__in", children: [
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px", "flexWrap": "wrap", "marginBottom": "22px" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexDirection": "column", "gap": "11px" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "DASHBOARD & ANALYTICS" }),
                  /* @__PURE__ */ jsx("h2", { style: { "margin": "0", "maxWidth": "24ch", "font": "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)", "fontSize": "clamp(26px,4vw,var(--vq-fs-h1))", "letterSpacing": "var(--vq-ls-h1)", "color": "var(--vq-text)" }, children: "58 readings. Only the ones your business has a use for." })
                ] }),
                /* @__PURE__ */ jsx("p", { style: { "margin": "0", "maxWidth": "36ch", "font": "400 15px/1.6 var(--vq-font-sans)", "color": "var(--vq-text-2)", "paddingBottom": "4px" }, children: "Every tile resolves to a Reckoner definition, and every definition resolves to journal entries. Click any number and you can read your way down to the posting." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-board", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-board__bar", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FF8A6B" } }),
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#FFCD5B" } }),
                  /* @__PURE__ */ jsx("span", { className: "vq-stackcard__dot", style: { "background": "#A9E34B" } }),
                  /* @__PURE__ */ jsx("span", { style: { "marginLeft": "8px" }, children: "DASHBOARD · ALL BRANCHES · THIS WEEK" }),
                  /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto", "color": "var(--vq-accent-text)" }, children: "LIVE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-board__grid", children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-kpi", "data-anrise": true, children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__l", children: "REVENUE" }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-kpi__v", children: [
                      "Rs ",
                      /* @__PURE__ */ jsx("span", { "data-count": "1284900", "data-count-dur": "1700", children: "0" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__d", children: "↑ 8.4% vs last week" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-kpi", "data-anrise": true, children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__l", children: "GROSS MARGIN" }),
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__v", children: /* @__PURE__ */ jsx("span", { "data-count": "32.9", "data-count-dec": "1", "data-count-suf": "%", "data-count-dur": "1700", children: "0" }) }),
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__d", children: "↑ 1.5 pts vs last week" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-kpi", "data-anrise": true, children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__l", children: "CASH POSITION" }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-kpi__v", children: [
                      "Rs ",
                      /* @__PURE__ */ jsx("span", { "data-count": "2118400", "data-count-dur": "1700", children: "0" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__d", children: "3 branches reconciled" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-kpi", "data-anrise": true, children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__l", children: "PAYABLES > 30 DAYS" }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-kpi__v", children: [
                      "Rs ",
                      /* @__PURE__ */ jsx("span", { "data-count": "612050", "data-count-dur": "1700", children: "0" })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "vq-kpi__d", "data-dir": "down", children: "↓ 4 distributors" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-chartbox vq-board__wide", "data-anrise": true, children: [
                    /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "12px" }, children: [
                      /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Revenue vs cost of goods · 12 weeks" }),
                      /* @__PURE__ */ jsxs("span", { className: "vq-legend", children: [
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("i", { style: { "background": "var(--vq-series-1,#0BAA8F)" } }),
                          "Revenue"
                        ] }),
                        /* @__PURE__ */ jsxs("span", { children: [
                          /* @__PURE__ */ jsx("i", { style: { "background": "var(--vq-series-2,#F26A47)" } }),
                          "Cost of goods"
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("svg", { className: "vq-spark", "data-spark": true, viewBox: "0 0 640 160", preserveAspectRatio: "none", role: "img", "aria-label": "Revenue rising ahead of cost of goods over twelve weeks", children: [
                      /* @__PURE__ */ jsx(
                        "path",
                        {
                          d: "M0 122 L58 116 L116 108 L174 112 L232 96 L290 88 L348 92 L406 74 L464 66 L522 58 L580 44 L640 30",
                          fill: "none",
                          stroke: "var(--vq-series-1,#0BAA8F)",
                          strokeWidth: "3",
                          strokeLinecap: "round",
                          strokeLinejoin: "round"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "path",
                        {
                          d: "M0 140 L58 138 L116 134 L174 136 L232 128 L290 126 L348 130 L406 120 L464 118 L522 114 L580 110 L640 104",
                          fill: "none",
                          stroke: "var(--vq-series-2,#F26A47)",
                          strokeWidth: "2.4",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeDasharray: "0",
                          opacity: ".85"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-chartbox vq-board__side", "data-anrise": true, children: [
                    /* @__PURE__ */ jsx("span", { style: { "font": "600 13px/1 var(--vq-font-display)", "letterSpacing": "-.02em", "color": "var(--vq-text)" }, children: "Sales by day" }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-bars", "data-bars": true, children: [
                      /* @__PURE__ */ jsx("i", { "data-h": "46" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "58" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "41" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "69" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "84" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "97" }),
                      /* @__PURE__ */ jsx("i", { "data-h": "62" })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-legend", children: [
                      /* @__PURE__ */ jsx("span", { children: "Mon" }),
                      /* @__PURE__ */ jsx("span", { style: { "marginLeft": "auto" }, children: "Sun" })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { "display": "flex", "flexWrap": "wrap", "gap": "10px", "marginTop": "18px" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Expiry exposure" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Distributor aging" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Branch comparison" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Variant sell-through" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Channel split" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", children: "Cashier variance" }),
                /* @__PURE__ */ jsx("span", { className: "vq-mocktag", style: { "borderColor": "var(--vq-accent-quiet-line)", "background": "var(--vq-accent-quiet)", "color": "var(--vq-accent-text)" }, children: "+ 102 more readings" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "ledger", "data-sec": "ledger", className: "vq-sec vq-sec--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-sec__in", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "PROOF" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "We'd rather show you the tests than a wall of logos." }),
              /* @__PURE__ */ jsx("p", { children: "VenQore is new. Here is exactly what that means, and what it doesn't. Every number on this page is one you can ask us to demonstrate." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-proof vq-reveal", style: { "marginTop": "46px" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.03", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-proof__n", "data-count": "140", "data-count-suf": "+", "data-count-dur": "900", children: "0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__l", children: "MODULAR ERP FEATURES" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__s", children: "Universal business modules assembled specifically for your business model with zero extraneous clutter." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.07", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-proof__n", "data-count": "35000", "data-count-suf": "+", children: "0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__l", children: "AUTOMATED TESTS RUN EVERY RELEASE" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__s", children: "Automated tests guarding every calculation, balance sheet integrity check, and ledger posting invariant." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.11", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-proof__n", "data-count": "8", "data-count-suf": " / 8", "data-count-dur": "900", children: "0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__l", children: "INVIOLABLE ACCOUNTING LAWS" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__s", children: "Run on every post before it is allowed into the immutable ledger. One failure and nothing is written." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-spot", "data-par": "0.15", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-proof__n", "data-count": "100", "data-count-suf": "%", children: "0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__l", children: "DOUBLE-ENTRY LEDGER BACKED" }),
                /* @__PURE__ */ jsx("span", { className: "vq-proof__s", children: "Every transaction writes balanced debits and credits. Zero balance drift, zero unverified estimates." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-founder vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", children: "ENGINEERED FOR MATHEMETICAL CERTAINTY" }),
              /* @__PURE__ */ jsx("p", { children: "VenQore was built on a single core principle: accounting and inventory software should never lose a single cent, mismatch a receipt, or hallucinate a ledger balance." }),
              /* @__PURE__ */ jsx("p", { children: "Every transaction posts through an immutable double-entry ledger verified against 8 strict accounting laws and 35,000+ automated tests before anything is committed to your books." }),
              /* @__PURE__ */ jsx("b", { children: "— The VenQore Engineering Team" }),
              /* @__PURE__ */ jsx("a", { className: "vq-link", href: "/about", children: "Read our technical architecture →" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("section", { id: "faq", "data-sec": "faq", className: "vq-section", style: { "padding": "100px 24px", "background": "var(--vq-bg-alt)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "textAlign": "center", "marginInline": "auto" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker", style: { "display": "block", "marginBottom": "12px" }, children: "FAQ" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Questions people actually ask." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                  "Is my accounting safe if an AI configured it?",
                  /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "The AI composes your system — which modules run, what your fields are called, who approves what. It never touches the accounting engine. Debits equal credits or the transaction does not post, and that rule is in the engine, not in a prompt." }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                  "What if the Blueprint gets it wrong?",
                  /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "You see it before anything is real. Every line is editable, nothing posts to your books until you approve it, and every applied configuration keeps a version snapshot you can roll back." }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                  "Can I change my system later?",
                  /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Describe the change. Blueprint shows you a diff — what is added, what changes, what is affected — and you approve it or you don't. Adding a branch is a sentence, not a change request." }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                  "Do you charge to import my data, or to leave?",
                  /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No, and no. Import is included. Export everything, any time, in a format your next system can read." }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                  "How is support and engineering handled?",
                  /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "VenQore is built and maintained by dedicated systems and accounting engineers. You get direct support from product specialists who deploy weekly improvements and verify every release against 35,000+ automated tests." }) }) })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("section", { id: "cta", "data-sec": "cta", className: "vq-finale", children: [
            /* @__PURE__ */ jsx("div", { className: "vq-finale__glow", "data-par": "-0.14", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxs("div", { className: "vq-finale__in", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-kicker vq-reveal", children: "WHAT THE NEXT FOUR MINUTES LOOK LIKE" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-sfloat", children: "No demo call. No sales pipeline. Just the thing." }),
              /* @__PURE__ */ jsx("p", { className: "vq-reveal", children: "You type a paragraph and watch your system compile. Nothing is charged, nothing goes live, and nothing touches your books until you have read the plan and said yes." }),
              /* @__PURE__ */ jsxs("ol", { className: "vq-steps4 vq-reveal", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-steps4__n", children: "01" }),
                  /* @__PURE__ */ jsx("b", { children: "Describe it" }),
                  /* @__PURE__ */ jsx("s", { children: "One paragraph, in your own words. About forty seconds." })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-steps4__n", children: "02" }),
                  /* @__PURE__ */ jsx("b", { children: "Read the Blueprint" }),
                  /* @__PURE__ */ jsx("s", { children: "Modules, documents, chart of accounts, roles. Every line editable." })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-steps4__n", children: "03" }),
                  /* @__PURE__ */ jsx("b", { children: "Approve it" }),
                  /* @__PURE__ */ jsx("s", { children: "Or change it and look again. Nothing is real until this click." })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-steps4__n", children: "04" }),
                  /* @__PURE__ */ jsx("b", { children: "Sell something" }),
                  /* @__PURE__ */ jsx("s", { children: "Scan a barcode. Watch it post. Free on Solo, upgrade anytime." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-finale__acts vq-reveal", children: [
                /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--xl", href: "/build-workspace", children: [
                  "Start building ",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--xl", href: "/onboarding", children: "Watch someone else's build first" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-finale__meta vq-reveal", children: [
                /* @__PURE__ */ jsx("span", { children: "Free to try" }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "Cancel anytime" }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "Export everything, any time" }),
                /* @__PURE__ */ jsx("span", { style: { "opacity": ".4" }, children: "·" }),
                /* @__PURE__ */ jsx("span", { children: "A person answers your email" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SiteFooter, {}),
      /* @__PURE__ */ jsx(CookieConsent, {})
    ] })
  ] });
}
export {
  LandingPage as default
};
