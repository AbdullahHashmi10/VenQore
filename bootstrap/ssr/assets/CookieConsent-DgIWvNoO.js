import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { ChevronDown, ArrowRight, Menu, X, Sun, Moon, MessageCircle, Mail, ShieldCheck, BarChart3, Megaphone, Cookie } from "lucide-react";
import { g as useTheme } from "../ssr.js";
import { AnimatePresence, motion } from "motion/react";
const DARK_THRESHOLD = 0.36;
function parseColor(str) {
  if (!str) return null;
  const s = str.trim();
  let m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
  if (m) {
    let a = m[4] === void 0 ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a };
  }
  return null;
}
function luminance({ r, g, b }) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function gradientLuminance(bgImage) {
  if (!bgImage || bgImage === "none" || !bgImage.includes("gradient")) return null;
  const stops = bgImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/gi) || [];
  const cols = stops.map(parseColor).filter((c) => c && c.a > 0.35);
  if (!cols.length) return null;
  return cols.reduce((sum, c) => sum + luminance(c), 0) / cols.length;
}
function declaredTone(el, isDark) {
  const ds = el.dataset || {};
  const themed = isDark ? ds.toneDark : ds.toneLight;
  const t = themed || ds.tone;
  if (t === "dark") return 0.02;
  if (t === "light") return 0.95;
  return null;
}
function luminanceBehind(x, y, header, isDark) {
  const stack = document.elementsFromPoint(x, y);
  const top = stack.find(
    (n) => !header.contains(n) && !(n.closest && n.closest("[data-tone-ignore]"))
  );
  let el = top || document.body;
  while (el && el.nodeType === 1) {
    const declared = declaredTone(el, isDark);
    if (declared !== null) return declared;
    const cs = getComputedStyle(el);
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a >= 0.55) return luminance(bg);
    const grad = gradientLuminance(cs.backgroundImage);
    if (grad !== null) return grad;
    const known = cs.getPropertyValue("--vq-known-bg").trim();
    if (known && known !== "skip") {
      const parent = el.parentElement;
      const inherited = parent ? getComputedStyle(parent).getPropertyValue("--vq-known-bg").trim() : "";
      if (known !== inherited) {
        const k = parseColor(known);
        if (k) return luminance(k);
      }
    }
    el = el.parentElement;
  }
  const rootBg = parseColor(getComputedStyle(document.body).backgroundColor);
  return rootBg && rootBg.a > 0.5 ? luminance(rootBg) : null;
}
function useHeaderTone(ref) {
  const [tone, setTone] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return void 0;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const header = ref.current;
      if (!header || typeof document.elementsFromPoint !== "function") return;
      const isDark = document.documentElement.classList.contains("dark");
      const rect = header.getBoundingClientRect();
      const y = Math.max(1, Math.round(rect.top + rect.height / 2));
      const w = window.innerWidth;
      let dark = 0;
      let seen = 0;
      [0.1, 0.5, 0.9].forEach((f) => {
        const L = luminanceBehind(Math.round(w * f), y, header, isDark);
        if (L === null) return;
        seen += 1;
        if (L < DARK_THRESHOLD) dark += 1;
      });
      if (!seen) return;
      const next = dark * 2 > seen ? "dark" : "light";
      setTone((prev) => prev === next ? prev : next);
    };
    let fallback = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        window.clearTimeout(fallback);
        measure();
      });
      fallback = window.setTimeout(() => {
        if (raf) {
          window.cancelAnimationFrame(raf);
          measure();
        }
      }, 160);
    };
    measure();
    const timers = [120, 450, 1200, 2500].map((ms) => window.setTimeout(schedule, ms));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("theme-changed", schedule);
    window.addEventListener("load", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("theme-changed", schedule);
      window.removeEventListener("load", schedule);
      mo.disconnect();
    };
  }, [ref]);
  return tone;
}
const types = [{ "key": "phone_repair", "sector": "services", "name": "Gadget & phone repair shops", "note": "Job cards, IMEI intake, parts deduction, repair warranty" }, { "key": "computer_repair", "sector": "services", "name": "Computer & laptop repair centres" }, { "key": "auto_repair", "sector": "services", "name": "Auto repair & mechanic garages", "note": "Parts and technician labour on one invoice" }, { "key": "appliance_repair", "sector": "services", "name": "Appliance repair (AC, fridges, washers)" }, { "key": "bike_service", "sector": "services", "name": "Bicycle & motorcycle service centres" }, { "key": "salon_barber", "sector": "services", "name": "Hair salons & barber shops", "note": "Staff commission, appointments, repeat-client khata" }, { "key": "nail_spa", "sector": "services", "name": "Nail salons & spas" }, { "key": "pet_care", "sector": "services", "name": "Pet grooming & veterinary clinics" }, { "key": "freelance_creative", "sector": "services", "name": "Freelance designers & developers", "note": "Milestone invoices, zero-inventory ledger" }, { "key": "marketing_agency", "sector": "services", "name": "Digital marketing & SEO agencies", "note": "Monthly retainers on recurring invoices" }, { "key": "consultant", "sector": "services", "name": "Consultants & business coaches", "note": "Hourly and session billing" }, { "key": "accounting_firm", "sector": "services", "name": "Accountants, tax consultants & auditors" }, { "key": "law_firm", "sector": "services", "name": "Lawyers & legal practices" }, { "key": "architect_interior", "sector": "services", "name": "Architects & interior designers", "note": "Quotation to final bill" }, { "key": "photo_video", "sector": "services", "name": "Photographers & videographers", "note": "Equipment hire and shoot booking" }, { "key": "electrician", "sector": "services", "name": "Electricians & electrical contractors", "note": "Tool management and technician dispatch" }, { "key": "plumber", "sector": "services", "name": "Plumbing & sanitary contractors" }, { "key": "carpenter", "sector": "services", "name": "Carpentry & woodwork services" }, { "key": "painter_renovation", "sector": "services", "name": "Painters & renovation contractors" }, { "key": "cleaning", "sector": "services", "name": "Cleaning & janitorial companies" }, { "key": "hvac", "sector": "services", "name": "HVAC installation & maintenance" }, { "key": "pest_control", "sector": "services", "name": "Pest control services" }, { "key": "equipment_rental", "sector": "services", "name": "Equipment & tool rental", "note": "Tool check-out and check-in" }, { "key": "event_hire", "sector": "services", "name": "Event decorators & sound hire" }, { "key": "gym_fitness", "sector": "services", "name": "Gyms, fitness studios & trainers", "note": "Recurring memberships" }, { "key": "tuition_academy", "sector": "services", "name": "Tuition centres & music/art academies" }, { "key": "grocery", "sector": "retail", "name": "Grocery & kiryana stores", "note": "Loose weights, pack units, quick-pick" }, { "key": "supermarket", "sector": "retail", "name": "Supermarkets & minimarts", "note": "High-speed scanning, scale barcodes" }, { "key": "pharmacy", "sector": "retail", "name": "Pharmacies & medical stores", "note": "Batches, expiry alerts, FEFO, drug registers" }, { "key": "surgical_supplies", "sector": "retail", "name": "Surgical & medical equipment suppliers" }, { "key": "mobile_retail", "sector": "retail", "name": "Mobile phone & gadget retailers", "note": "IMEI serials, instant warranty cards" }, { "key": "electronics", "sector": "retail", "name": "Consumer electronics & home appliances" }, { "key": "fashion", "sector": "retail", "name": "Fashion & garment boutiques", "note": "Size/colour matrix, WooCommerce sync" }, { "key": "footwear", "sector": "retail", "name": "Shoe & footwear stores" }, { "key": "jewellery", "sector": "retail", "name": "Jewellery & watch shops" }, { "key": "cosmetics", "sector": "retail", "name": "Cosmetics & perfume stores" }, { "key": "hardware", "sector": "retail", "name": "Hardware & paint stores", "note": "Sold by length, weight or piece" }, { "key": "sanitary_supply", "sector": "retail", "name": "Sanitary & plumbing supply stores" }, { "key": "building_materials", "sector": "retail", "name": "Building materials, cement & steel" }, { "key": "furniture_store", "sector": "retail", "name": "Furniture & home décor stores" }, { "key": "books_stationery", "sector": "retail", "name": "Bookstores & stationery shops" }, { "key": "toys", "sector": "retail", "name": "Toy & hobby stores" }, { "key": "pet_supply", "sector": "retail", "name": "Pet supply stores" }, { "key": "auto_parts", "sector": "retail", "name": "Auto spare parts & accessories" }, { "key": "tyre_battery", "sector": "retail", "name": "Tyre & battery dealers", "note": "Serial and warranty tracking" }, { "key": "optical", "sector": "retail", "name": "Eyewear & optical boutiques" }, { "key": "gift_flower", "sector": "retail", "name": "Gift, flower & craft shops" }, { "key": "vape_tobacco", "sector": "retail", "name": "Vape & tobacco stores" }, { "key": "sports", "sector": "retail", "name": "Sports & outdoor equipment" }, { "key": "electrical_lighting", "sector": "retail", "name": "Electrical & lighting stores" }, { "key": "kitchenware", "sector": "retail", "name": "Kitchenware & crockery stores" }, { "key": "restaurant", "sector": "food", "name": "Dine-in restaurants", "note": "Floor plan, table service, split bills, kitchen tickets" }, { "key": "cafe", "sector": "food", "name": "Cafés & coffee houses", "note": "Rapid counter POS, ingredient deduction" }, { "key": "tea_shop", "sector": "food", "name": "Chai & tea shops" }, { "key": "bakery", "sector": "food", "name": "Artisan bakeries & cake shops", "note": "Advance orders, batch recipes" }, { "key": "fast_food", "sector": "food", "name": "Fast food, burger & pizza outlets" }, { "key": "dessert", "sector": "food", "name": "Ice cream & dessert parlours" }, { "key": "juice_bar", "sector": "food", "name": "Juice, shake & smoothie bars" }, { "key": "food_truck", "sector": "food", "name": "Food trucks & kiosks", "note": "Offline-first operation" }, { "key": "sweets", "sector": "food", "name": "Sweet & mithai shops", "note": "Weighing scale and box packs" }, { "key": "catering", "sector": "food", "name": "Catering businesses", "note": "Event quotes, bulk recipes" }, { "key": "cloud_kitchen", "sector": "food", "name": "Cloud & dark kitchens" }, { "key": "pub_lounge", "sector": "food", "name": "Pubs, bistros & lounges" }, { "key": "fmcg_wholesale", "sector": "wholesale", "name": "FMCG & packaged-goods wholesalers", "note": "Tiered prices, cartons to pieces" }, { "key": "grain_commodities", "sector": "wholesale", "name": "Grain, flour & bulk commodities" }, { "key": "fabric_stockist", "sector": "wholesale", "name": "Garment & fabric stockists" }, { "key": "hardware_wholesale", "sector": "wholesale", "name": "Hardware & tools wholesalers" }, { "key": "electrical_wholesale", "sector": "wholesale", "name": "Electrical supplies wholesalers" }, { "key": "pharma_wholesale", "sector": "wholesale", "name": "Pharmaceutical wholesalers & stockists" }, { "key": "tech_distributor", "sector": "wholesale", "name": "Mobile & tech distributors" }, { "key": "auto_parts_distributor", "sector": "wholesale", "name": "Auto parts distributors" }, { "key": "packaging", "sector": "wholesale", "name": "Packaging & box suppliers" }, { "key": "office_supplies", "sector": "wholesale", "name": "Stationery & office supplies" }, { "key": "chemicals", "sector": "wholesale", "name": "Chemical & industrial cleaning" }, { "key": "import_export", "sector": "wholesale", "name": "Import / export trading firms" }, { "key": "commercial_bakery", "sector": "manufacturing", "name": "Commercial bakeries & confectioneries", "note": "Flour and sugar to bread, deducted automatically" }, { "key": "tailoring", "sector": "manufacturing", "name": "Tailoring & custom stitching workshops" }, { "key": "furniture_maker", "sector": "manufacturing", "name": "Furniture makers & woodworking", "note": "Wood and hardware into a finished table" }, { "key": "coffee_spice", "sector": "manufacturing", "name": "Coffee roasters, spice blenders & craft drinks" }, { "key": "signage_print", "sector": "manufacturing", "name": "Signage & custom print shops" }, { "key": "soap_candle", "sector": "manufacturing", "name": "Soap & candle makers" }, { "key": "kit_assembly", "sector": "manufacturing", "name": "Hardware assembly & kit packing" }, { "key": "aluminium_glass", "sector": "manufacturing", "name": "Aluminium & glass fabrication" }, { "key": "leather_goods", "sector": "manufacturing", "name": "Leather goods & bag makers" }, { "key": "custom_merch", "sector": "manufacturing", "name": "Custom gift & merchandise assembly" }];
const catalogue = {
  types
};
const typesFor = (sector) => catalogue.types.filter((t) => t.sector === sector).map((t) => t.note ? { key: t.key, name: t.name, note: t.note } : { key: t.key, name: t.name });
const SECTORS = [
  {
    key: "services",
    name: "Services, repairs & field trades",
    short: "Services & trades",
    pitch: "Job cards, quotations, recurring invoices, staff time and tool checkout — for businesses that sell hours and expertise, with or without stock.",
    modules: ["services", "invoicing", "quotations", "recurring_invoices", "staff_attendance", "service jobs & calendar", "tool checkout"],
    types: typesFor("services")
  },
  {
    key: "retail",
    name: "Retail & merchandising",
    short: "Retail",
    pitch: "A fast barcode till with variants, batches and expiry, serials, units of measure and marketplace sync — counted properly at closing time.",
    modules: ["pos", "inventory", "barcodes & labels", "variants", "batches & expiry", "serials", "units of measure", "marketplace sync"],
    types: typesFor("retail")
  },
  {
    key: "food",
    name: "Food, beverage & hospitality",
    short: "Food & hospitality",
    pitch: "Table service, park-and-recall orders, kitchen tickets and recipes that draw ingredients out of stock, so food cost is a real number.",
    modules: ["pos", "table service", "park & recall", "cookbook (recipes)", "production runs"],
    types: typesFor("food")
  },
  {
    key: "wholesale",
    name: "Wholesale, trade & B2B distribution",
    short: "Wholesale & B2B",
    pitch: "Sales orders, proposals, price tiers, khata credit and multi-location stock with transfers — for businesses that sell to other businesses on terms.",
    modules: ["sales orders", "B2B proposals", "pricing tiers", "khata credit", "multi-location", "stock transfers", "accounting workspace"],
    types: typesFor("wholesale")
  },
  {
    key: "manufacturing",
    name: "Light manufacturing & assembly",
    short: "Light manufacturing",
    pitch: "Recipes and bills of materials, production runs, composite items, landed cost and purchase orders — raw material in, finished goods out, at real cost.",
    modules: ["cookbook", "production runs", "composite items", "landed cost", "purchase orders"],
    types: typesFor("manufacturing")
  }
];
const BUSINESS_TYPE_COUNT = SECTORS.reduce((n, s) => n + s.types.length, 0);
const SECTOR_COUNT = SECTORS.length;
const BUSINESS_TYPE_CLAIM = `${Math.floor(BUSINESS_TYPE_COUNT / 5) * 5}+`;
const NAV_PRODUCT = [
  {
    heading: "Build",
    links: [
      { label: "Blueprint", href: "/blueprint", desc: "Describe it. Approve the plan." },
      { label: "See a build", href: "/onboarding", desc: "Four minutes, start to live." },
      { label: "Watch it assemble", href: "/features", desc: "Only the modules you use, switched on." }
    ]
  },
  {
    heading: "Run",
    links: [
      { label: "The register", href: "/pos", desc: "A till you compose yourself." },
      { label: "Documents", href: "/documents", desc: "Thirteen types, one editor." },
      { label: "VenSynQ", href: "/vensynq", desc: "Sell in five places, count once." }
    ]
  },
  {
    heading: "Know",
    links: [
      { label: "The dashboard", href: "/dashboard-preview", desc: "58 readings, self-assembling." },
      { label: "The Reckoner", href: "/reckoner", desc: "One place a number is defined." },
      { label: "Core Ledger", href: "/ledger", desc: "One engine. Every number." }
    ]
  }
];
const NAV_PRODUCT_FOOT = {
  label: "SmartCapture — a photo in, a posted transaction out",
  href: "/smartcapture"
};
const SOLUTIONS = [
  { label: "Grocery & supermarket", href: "/solutions/grocery", desc: "Fast checkout, real margins." },
  { label: "Wholesale & distribution", href: "/solutions/wholesale", desc: "Credit terms and price tiers." },
  { label: "Pharmacy", href: "/solutions/pharmacy", desc: "Batch and expiry that hold the line." },
  { label: "Apparel & fashion", href: "/solutions/clothing", desc: "Size and colour, counted properly." },
  { label: "Electronics & hardware", href: "/solutions/electronics-store", desc: "Serial and IMEI, tracked to the unit." },
  { label: "Multi-branch chains", href: "/solutions/multi-store", desc: "One truth across every location." }
];
const COMPARE = [
  { label: "VenQore vs Square", href: "/compare/venqore-vs-square" },
  { label: "VenQore vs Vyapar", href: "/compare/venqore-vs-vyapar" },
  { label: "All comparisons", href: "/compare" }
];
const RESOURCES = [
  { label: "Free tools", href: "/tools", desc: "Invoices, barcodes, calculators — free." },
  { label: "Documentation", href: "/docs", desc: "Guides and technical references." },
  { label: "Help centre", href: "/help", desc: "Step-by-step feature workflows." },
  { label: "Blog", href: "/blog", desc: "Retail and accounting playbooks." },
  { label: "Live demo", href: "/demo", desc: "Try it with sample data." },
  { label: "Roadmap", href: "/roadmap", desc: "What ships next, in public." }
];
const COMPANY = [
  { label: "About", href: "/about", desc: "Mission, architecture and principles." },
  { label: "Security", href: "/security", desc: "Isolation, roles and the record." },
  { label: "Contact", href: "/contact", desc: "A person answers this one." },
  { label: "Partners", href: "/partners", desc: "Resell and implement VenQore." },
  { label: "Newsletter", href: "/subscribe", desc: "What changed, monthly." }
];
const HEADER_NAV = [
  { key: "product", label: "Product", href: "/blueprint", menu: "product" },
  { key: "solutions", label: "Solutions", href: "/solutions", menu: "solutions" },
  { key: "features", label: "Features", href: "/features" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "resources", label: "Resources", href: "/tools", menu: "resources" },
  { key: "company", label: "Company", href: "/about", menu: "company" }
];
const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Blueprint", href: "/blueprint" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "The register", href: "/pos" },
      { label: "Documents", href: "/documents" },
      { label: "Dashboard", href: "/dashboard-preview" },
      { label: "SmartCapture", href: "/smartcapture" },
      { label: "The Reckoner", href: "/reckoner" },
      { label: "Core Ledger", href: "/ledger" },
      { label: "VenSynQ", href: "/vensynq" }
    ]
  },
  {
    heading: "Solutions",
    links: [
      ...SOLUTIONS.map(({ label, href }) => ({ label, href })),
      { label: `All ${BUSINESS_TYPE_CLAIM} business types`, href: "/solutions#business-types" },
      { label: "Compare VenQore", href: "/compare" }
    ]
  },
  {
    heading: "Resources",
    links: [
      { label: "Free tools", href: "/tools" },
      { label: "Documentation", href: "/docs" },
      { label: "Help centre", href: "/help" },
      { label: "Blog", href: "/blog" },
      { label: "Live demo", href: "/demo" },
      { label: "See a build", href: "/onboarding" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Known issues", href: "/known-issues" }
    ]
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
      { label: "Partners", href: "/partners" },
      { label: "Newsletter", href: "/subscribe" },
      { label: "Digital products", href: "/digital-products" },
      { label: "Sign in", href: "/login" }
    ]
  }
];
const LEGAL = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/privacy#cookies" },
  { label: "Refund policy", href: "/refund-policy" }
];
const CONTACT = {
  whatsapp: { href: "https://wa.me/923091999489", label: "WhatsApp +92 309 1999489" },
  email: { href: "mailto:hello@venqore.com", label: "hello@venqore.com" }
};
const PRIMARY_CTA = { label: "Start building", href: "/build-workspace" };
[
  ...NAV_PRODUCT.flatMap((g) => g.links),
  NAV_PRODUCT_FOOT,
  ...SOLUTIONS,
  ...COMPARE,
  ...RESOURCES,
  ...COMPANY,
  ...FOOTER_COLUMNS.flatMap((c) => c.links),
  ...LEGAL
];
function isCurrent(href, path) {
  if (!href || !path) return false;
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const target = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (target === "/") return clean === "/";
  return clean === target || clean.startsWith(`${target}/`);
}
function activeTopKey(path) {
  const inGroup = (links) => links.some((l) => isCurrent(l.href, path));
  if (inGroup(NAV_PRODUCT.flatMap((g) => g.links)) || isCurrent(NAV_PRODUCT_FOOT.href, path)) return "product";
  if (isCurrent("/solutions", path) || isCurrent("/compare", path)) return "solutions";
  if (isCurrent("/features", path)) return "features";
  if (isCurrent("/pricing", path)) return "pricing";
  if (inGroup(RESOURCES) || isCurrent("/known-issues", path)) return "resources";
  if (inGroup(COMPANY) || isCurrent("/digital-products", path) || isCurrent("/partner-support", path)) return "company";
  return null;
}
function MegaLink({ link, path }) {
  const current = isCurrent(link.href, path);
  return /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sh-mega__link", href: link.href, "aria-current": current ? "page" : void 0, children: [
    /* @__PURE__ */ jsx("b", { children: link.label }),
    link.desc && /* @__PURE__ */ jsx("span", { children: link.desc })
  ] });
}
function MegaPanel({ menu, path }) {
  if (menu === "product") {
    return /* @__PURE__ */ jsxs("div", { className: "vq-sh-mega__inner vq-sh-mega__inner--3", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-sh-mega__grid vq-sh-mega__grid--3", children: NAV_PRODUCT.map((group) => /* @__PURE__ */ jsxs("div", { className: "vq-sh-mega__col", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-sh-mega__eyebrow", children: group.heading }),
        group.links.map((l) => /* @__PURE__ */ jsx(MegaLink, { link: l, path }, l.href))
      ] }, group.heading)) }),
      /* @__PURE__ */ jsx("div", { className: "vq-sh-mega__foot", children: /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sh-mega__more", href: NAV_PRODUCT_FOOT.href, children: [
        NAV_PRODUCT_FOOT.label,
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
      ] }) })
    ] });
  }
  if (menu === "solutions") {
    return /* @__PURE__ */ jsxs("div", { className: "vq-sh-mega__inner vq-sh-mega__inner--2", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-sh-mega__grid vq-sh-mega__grid--2", children: SOLUTIONS.map((l) => /* @__PURE__ */ jsx(MegaLink, { link: l, path }, l.href)) }),
      /* @__PURE__ */ jsxs("div", { className: "vq-sh-mega__foot vq-sh-mega__foot--split", children: [
        /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sh-mega__more", href: "/solutions#business-types", children: [
          "All ",
          BUSINESS_TYPE_CLAIM,
          " business types ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-sh-mega__quiet", children: COMPARE.slice(0, 2).map((c, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
          i > 0 && /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: " · " }),
          /* @__PURE__ */ jsx("a", { className: "vq-btn-plain", href: c.href, children: c.label })
        ] }, c.href)) })
      ] })
    ] });
  }
  const list = menu === "resources" ? RESOURCES : COMPANY;
  return /* @__PURE__ */ jsx("div", { className: "vq-sh-mega__inner vq-sh-mega__inner--2", children: /* @__PURE__ */ jsx("div", { className: "vq-sh-mega__grid vq-sh-mega__grid--2", children: list.map((l) => /* @__PURE__ */ jsx(MegaLink, { link: l, path }, l.href)) }) });
}
function ThemeButton({ className = "" }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: `vq-sh-icon ${className}`,
      onClick: toggleTheme,
      "aria-label": isDarkMode ? "Switch to light mode" : "Switch to dark mode",
      title: isDarkMode ? "Light mode" : "Dark mode",
      children: isDarkMode ? /* @__PURE__ */ jsx(Sun, { size: 17, "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Moon, { size: 17, "aria-hidden": "true" })
    }
  );
}
function SiteHeader() {
  const page = usePage();
  const path = (page?.url || (typeof window !== "undefined" ? window.location.pathname : "/")).split("?")[0];
  const user = page?.props?.auth?.user || null;
  const headerRef = useRef(null);
  const tone = useHeaderTone(headerRef);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(null);
  const closeTimer = useRef(0);
  const baseId = useId();
  const activeKey = activeTopKey(path);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const openMenu = useCallback((key) => {
    window.clearTimeout(closeTimer.current);
    setOpen(key);
  }, []);
  const closeSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      setMobile(false);
    };
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);
  useEffect(() => {
    if (!mobile) return void 0;
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflowY;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowY = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflowY = prevHtml;
    };
  }, [mobile]);
  const toneAttr = tone || "auto";
  const accountLink = user ? { label: "Dashboard", href: "/dashboard" } : { label: "Sign in", href: "/login" };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("a", { className: "vq-skip", href: "#main", children: "Skip to content" }),
    /* @__PURE__ */ jsxs(
      "header",
      {
        ref: headerRef,
        className: `vq-sh${scrolled ? " is-scrolled" : ""}${open ? " has-open" : ""}`,
        "data-tone": toneAttr,
        "data-site-header": "",
        children: [
          /* @__PURE__ */ jsx("div", { className: "vq-sh__glass", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("div", { className: "vq-sh__inner", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sh__brand", href: "/", "aria-label": "VenQore home", children: [
              /* @__PURE__ */ jsx("img", { src: "/v6/assets/logo.png", alt: "", width: "30", height: "30" }),
              /* @__PURE__ */ jsx("span", { children: "VenQore" })
            ] }),
            /* @__PURE__ */ jsx("nav", { className: "vq-sh__nav", "aria-label": "Main", children: /* @__PURE__ */ jsx("ul", { className: "vq-sh__list", children: HEADER_NAV.map((item) => {
              const panelId = `${baseId}-${item.key}`;
              const isActive = activeKey === item.key;
              if (!item.menu) {
                return /* @__PURE__ */ jsx("li", { className: "vq-sh__item", children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    className: "vq-btn-plain vq-sh__link",
                    href: item.href,
                    "aria-current": isActive ? "page" : void 0,
                    children: item.label
                  }
                ) }, item.key);
              }
              const isOpen = open === item.key;
              return /* @__PURE__ */ jsxs(
                "li",
                {
                  className: `vq-sh__item${isOpen ? " is-open" : ""}`,
                  onMouseEnter: () => openMenu(item.key),
                  onMouseLeave: closeSoon,
                  onBlur: (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) closeSoon();
                  },
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        className: "vq-sh__link",
                        "aria-expanded": isOpen,
                        "aria-controls": panelId,
                        "data-active": isActive ? "true" : void 0,
                        onClick: () => isOpen ? setOpen(null) : openMenu(item.key),
                        children: [
                          item.label,
                          /* @__PURE__ */ jsx(ChevronDown, { size: 13, "aria-hidden": "true", className: "vq-sh__chev" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { id: panelId, className: "vq-sh-mega", role: "region", "aria-label": item.label, "aria-hidden": !isOpen, children: /* @__PURE__ */ jsx(MegaPanel, { menu: item.menu, path }) })
                  ]
                },
                item.key
              );
            }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "vq-sh__actions", children: [
              /* @__PURE__ */ jsx(ThemeButton, {}),
              /* @__PURE__ */ jsx("a", { className: "vq-btn-plain vq-sh__link vq-sh__signin", href: accountLink.href, children: accountLink.label }),
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-sh__cta", href: PRIMARY_CTA.href, children: [
                PRIMARY_CTA.label,
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-sh__mobile-actions", children: [
              /* @__PURE__ */ jsx(ThemeButton, {}),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "vq-sh-icon",
                  "aria-label": "Open menu",
                  "aria-expanded": mobile,
                  "aria-controls": `${baseId}-sheet`,
                  onClick: () => setMobile(true),
                  children: /* @__PURE__ */ jsx(Menu, { size: 22, "aria-hidden": "true" })
                }
              )
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        id: `${baseId}-sheet`,
        className: `vq-sh-sheet${mobile ? " is-open" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Menu",
        "aria-hidden": !mobile,
        "data-tone-ignore": "",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-sh-sheet__top", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sh__brand", href: "/", "aria-label": "VenQore home", children: [
              /* @__PURE__ */ jsx("img", { src: "/v6/assets/logo.png", alt: "", width: "28", height: "28" }),
              /* @__PURE__ */ jsx("span", { children: "VenQore" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-sh-icon", "aria-label": "Close menu", onClick: () => setMobile(false), children: /* @__PURE__ */ jsx(X, { size: 22, "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-sh-sheet__body", children: [
            [
              { key: "product", label: "Product", links: [...NAV_PRODUCT.flatMap((g) => g.links), NAV_PRODUCT_FOOT] },
              { key: "solutions", label: "Solutions", links: [...SOLUTIONS, ...COMPARE] },
              { key: "resources", label: "Resources", links: RESOURCES },
              { key: "company", label: "Company", links: COMPANY }
            ].map((group) => {
              const expanded = mobileGroup === group.key;
              return /* @__PURE__ */ jsxs("div", { className: `vq-sh-sheet__group${expanded ? " is-open" : ""}`, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "vq-sh-sheet__head",
                    "aria-expanded": expanded,
                    onClick: () => setMobileGroup(expanded ? null : group.key),
                    children: [
                      group.label,
                      /* @__PURE__ */ jsx(ChevronDown, { size: 18, "aria-hidden": "true" })
                    ]
                  }
                ),
                expanded && /* @__PURE__ */ jsx("div", { className: "vq-sh-sheet__links", children: group.links.map((l) => /* @__PURE__ */ jsx("a", { className: "vq-btn-plain", href: l.href, "aria-current": isCurrent(l.href, path) ? "page" : void 0, children: l.label.replace(/ — .*/, "") }, l.href)) })
              ] }, group.key);
            }),
            /* @__PURE__ */ jsx("a", { className: "vq-btn-plain vq-sh-sheet__plain", href: "/features", children: "Features" }),
            /* @__PURE__ */ jsx("a", { className: "vq-btn-plain vq-sh-sheet__plain", href: "/pricing", children: "Pricing" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-sh-sheet__actions", children: [
            /* @__PURE__ */ jsx("a", { href: accountLink.href, className: "vq-btn vq-btn--secondary vq-btn--lg vq-btn--block", children: accountLink.label }),
            /* @__PURE__ */ jsxs("a", { href: PRIMARY_CTA.href, className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block", children: [
              PRIMARY_CTA.label,
              /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" }) })
            ] })
          ] })
        ]
      }
    )
  ] });
}
function SiteFooter({ showCta = true }) {
  const page = usePage();
  const path = (page?.url || "/").split("?")[0];
  const [email, setEmail] = useState("");
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const start = (e) => {
    e.preventDefault();
    const v = email.trim();
    window.location.href = v ? `${PRIMARY_CTA.href}?email=${encodeURIComponent(v)}` : PRIMARY_CTA.href;
  };
  return /* @__PURE__ */ jsxs("footer", { className: "vq-sf", "data-tone": "dark", "data-site-footer": "", children: [
    /* @__PURE__ */ jsx("div", { className: "vq-sf__floor", "aria-hidden": "true" }),
    showCta && /* @__PURE__ */ jsx("div", { className: "vq-sf__wrap vq-sf__cta-wrap", children: /* @__PURE__ */ jsxs("div", { className: "vq-sf__cta", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-sf__cta-copy", children: [
        /* @__PURE__ */ jsx("h2", { className: "vq-sf__cta-title", children: "Describe your business. See what it becomes." }),
        /* @__PURE__ */ jsx("p", { className: "vq-sf__cta-lede", children: "14-day free trial. Full access. You see your whole system before you decide anything." })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "vq-sf__cta-form", onSubmit: start, children: [
        /* @__PURE__ */ jsx("label", { className: "vq-sr-only", htmlFor: "vq-sf-email", children: "Work email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "vq-sf-email",
            type: "email",
            inputMode: "email",
            autoComplete: "email",
            className: "vq-sf__input",
            placeholder: "you@company.com",
            value: email,
            onChange: (e) => setEmail(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxs("button", { type: "submit", className: "vq-btn vq-btn--lg vq-btn--light", children: [
          PRIMARY_CTA.label,
          /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vq-sf__fine", children: "Takes about four minutes. Nothing goes live until you approve it." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "vq-sf__wrap vq-sf__main", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-sf__brandcol", children: [
        /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain vq-sf__brand", href: "/", "aria-label": "VenQore home", children: [
          /* @__PURE__ */ jsx("img", { src: "/v6/assets/logo.png", alt: "", width: "30", height: "30" }),
          /* @__PURE__ */ jsx("span", { children: "VenQore" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "vq-sf__about", children: [
          "The AI ERP builder for ",
          BUSINESS_TYPE_CLAIM,
          " kinds of business. Describe how you operate; VenQore assembles the system — point of sale, stock, jobs, purchasing, invoicing — on one double-entry ledger."
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "vq-sf__contact", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain", href: CONTACT.whatsapp.href, target: "_blank", rel: "noopener noreferrer", children: [
            /* @__PURE__ */ jsx(MessageCircle, { size: 16, "aria-hidden": "true" }),
            " ",
            CONTACT.whatsapp.label
          ] }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { className: "vq-btn-plain", href: CONTACT.email.href, children: [
            /* @__PURE__ */ jsx(Mail, { size: 16, "aria-hidden": "true" }),
            " ",
            CONTACT.email.label
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "vq-sf__cols", "aria-label": "Footer", children: FOOTER_COLUMNS.map((col) => /* @__PURE__ */ jsxs("div", { className: "vq-sf__col", children: [
        /* @__PURE__ */ jsx("h3", { className: "vq-sf__head", children: col.heading }),
        /* @__PURE__ */ jsx("ul", { children: col.links.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "vq-btn-plain", href: l.href, "aria-current": isCurrent(l.href, path) ? "page" : void 0, children: l.label }) }, l.href)) })
      ] }, col.heading)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-sf__wrap vq-sf__base", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "© ",
        year,
        " VenQore. The AI ERP builder."
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "vq-sf__legal", children: [
        LEGAL.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { className: "vq-btn-plain", href: l.href, children: l.label }) }, l.href)),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("button", { type: "button", className: "vq-sf__linkbtn", onClick: () => window.dispatchEvent(new Event("open-cookie-preferences")), children: "Cookie settings" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "vq-sf__mark", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { children: "VenQore" }) })
  ] });
}
const STORAGE_KEY = "venqore_cookie_preferences_v1";
const CONSENT_KEY = "venqore_cookie_consent_v1";
const DEFAULT_COOKIE_CATEGORIES = [
  {
    id: "essential",
    name: "Essential",
    description: "Sign-in, security, and keeping your workspace and choices working. Always on.",
    icon: ShieldCheck,
    isEssential: true
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Anonymous measurements of which pages load slowly and which features get used. No personal profile.",
    icon: BarChart3
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Lets us show relevant VenQore updates on other sites you visit.",
    icon: Megaphone
  }
];
const readStored = (count) => {
  try {
    if (localStorage.getItem(CONSENT_KEY) !== "true") return null;
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(parsed) && parsed.length === count ? parsed : null;
  } catch (e) {
    return null;
  }
};
function Switch({ id, checked, disabled, onChange, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      id,
      role: "switch",
      "aria-checked": checked,
      "aria-label": label,
      disabled,
      className: "vq-switch",
      onClick: () => !disabled && onChange(!checked)
    }
  );
}
function PreferencesDialog({ categories, prefs, onToggle, onSave, onRejectAll, onAcceptAll, onClose }) {
  const cardRef = useRef(null);
  useEffect(() => {
    const prevFocus = document.activeElement;
    cardRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [onClose]);
  return /* @__PURE__ */ jsxs("div", { className: "vq-cookie-dialog", "data-tone-ignore": "", children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "vq-cookie-dialog__scrim",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        ref: cardRef,
        tabIndex: -1,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "vq-cookie-title",
        className: "vq-cookie-dialog__card",
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 16, scale: 0.98 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-cookie-dialog__head", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { id: "vq-cookie-title", children: "Cookie preferences" }),
              /* @__PURE__ */ jsx("p", { children: "Choose what VenQore may store in this browser. You can change this any time from the footer." })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-sh-icon", onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 18, "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-cookie-dialog__body", children: categories.map((cat, i) => {
            const Icon = cat.icon || Cookie;
            const on = !!prefs[i];
            return /* @__PURE__ */ jsxs("div", { className: `vq-cookie-cat${on ? " is-on" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-cookie-cat__top", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-row vq-gap-3", style: { alignItems: "center" }, children: [
                  /* @__PURE__ */ jsx(Icon, { size: 18, "aria-hidden": "true" }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-cookie-cat__name", children: [
                    cat.name,
                    cat.isEssential && /* @__PURE__ */ jsx("span", { className: "vq-cookie-cat__req", children: "Required" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Switch,
                  {
                    id: `vq-cookie-${cat.id}`,
                    label: cat.name,
                    checked: on,
                    disabled: cat.isEssential,
                    onChange: (v) => onToggle(i, v)
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("p", { children: cat.description })
            ] }, cat.id);
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-cookie-dialog__foot", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--secondary", onClick: onRejectAll, children: "Reject non-essential" }),
            /* @__PURE__ */ jsxs("span", { className: "vq-row vq-gap-2", children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--quiet", onClick: onAcceptAll, children: "Accept all" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--primary", onClick: onSave, children: "Save choices" })
            ] })
          ] })
        ]
      }
    )
  ] });
}
function CookieConsent({
  categories = DEFAULT_COOKIE_CATEGORIES,
  cookiePolicyUrl = "/privacy#cookies",
  onAccept,
  onDecline
}) {
  const [mounted, setMounted] = useState(false);
  const [banner, setBanner] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [prefs, setPrefs] = useState(() => categories.map((c) => !!c.isEssential));
  useEffect(() => {
    setMounted(true);
    const stored = readStored(categories.length);
    if (stored) {
      setPrefs(stored);
      onAccept?.(stored);
    } else {
      setBanner(true);
    }
  }, [categories.length]);
  useEffect(() => {
    const open = () => {
      const stored = readStored(categories.length);
      if (stored) setPrefs(stored);
      setDialog(true);
    };
    window.addEventListener("open-cookie-preferences", open);
    return () => window.removeEventListener("open-cookie-preferences", open);
  }, [categories.length]);
  const save = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(CONSENT_KEY, "true");
    } catch (e) {
    }
    setPrefs(next);
    setBanner(false);
    setDialog(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: next }));
    onAccept?.(next);
  }, [onAccept]);
  const acceptAll = useCallback(() => save(categories.map(() => true)), [categories, save]);
  const rejectAll = useCallback(() => {
    save(categories.map((c) => !!c.isEssential));
    onDecline?.();
  }, [categories, save, onDecline]);
  const toggle = useCallback((i, v) => {
    if (categories[i]?.isEssential) return;
    setPrefs((p) => p.map((x, j) => j === i ? v : x));
  }, [categories]);
  const closeDialog = useCallback(() => setDialog(false), []);
  if (!mounted) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(AnimatePresence, { children: banner && !dialog && /* @__PURE__ */ jsxs(
      motion.aside,
      {
        className: "vq-cookie",
        role: "region",
        "aria-label": "Cookie consent",
        "data-tone-ignore": "",
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 40 },
        transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-cookie__row", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-cookie__icon", children: /* @__PURE__ */ jsx(Cookie, { size: 20, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "vq-cookie__title", children: "We use a few cookies" }),
              /* @__PURE__ */ jsxs("p", { className: "vq-cookie__text", children: [
                "Essential ones keep you signed in and secure. Optional analytics help us fix slow pages — only if you allow it.",
                " ",
                /* @__PURE__ */ jsx("a", { href: cookiePolicyUrl, children: "Cookie policy" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-cookie__actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--secondary", onClick: rejectAll, children: "Reject non-essential" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--primary", onClick: acceptAll, children: "Accept all" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "vq-cookie__more", onClick: () => setDialog(true), children: "Choose what to allow" })
          ] })
        ]
      },
      "banner"
    ) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: dialog && /* @__PURE__ */ jsx(
      PreferencesDialog,
      {
        categories,
        prefs,
        onToggle: toggle,
        onSave: () => save(prefs),
        onRejectAll: rejectAll,
        onAcceptAll: acceptAll,
        onClose: closeDialog
      },
      "dialog"
    ) })
  ] });
}
export {
  BUSINESS_TYPE_CLAIM as B,
  CookieConsent as C,
  SiteHeader as S,
  SiteFooter as a,
  SECTORS as b,
  catalogue as c,
  SECTOR_COUNT as d
};
