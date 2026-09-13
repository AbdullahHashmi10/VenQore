import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import MarketingLayout, { InlineLink, RelatedPages } from "./MarketingLayout-cwTDSbNB.js";
import { B as BusinessTypes } from "./BusinessTypes-r4_4fFX7.js";
import { B as BUSINESS_TYPE_CLAIM } from "./CookieConsent-DgIWvNoO.js";
import { s as solutionsHubList } from "./solutions-iwYK5Alp.js";
import { Building2, Shirt, Truck, ShoppingCart, Smartphone, Pill, Layers, ArrowRight, ShieldCheck } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./SiteChrome-CBP-bGRL.js";
import "motion/react";
const iconMap = {
  Pill,
  Smartphone,
  ShoppingCart,
  Truck,
  Shirt,
  Building2
};
function Index() {
  return /* @__PURE__ */ jsxs(MarketingLayout, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "Industry Solutions — Industry-Specific Business Operating Systems | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "VenQore assembles business software for 85+ kinds of business in five sectors — services and repairs, retail, food and hospitality, wholesale and light manufacturing — on one double-entry ledger." })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0 }, children: [
      /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Industry operating systems" }),
      /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
        "Software built for your specific trade — ",
        BUSINESS_TYPE_CLAIM,
        " of them."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
        "Generic POS systems force your business into a standard cash register box. VenQore delivers trade-specific controls — from ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/solutions/pharmacy", children: "pharmacy expiry tracking" }),
        " to",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/solutions/electronics-store", children: "smartphone IMEI logs" }),
        " — backed by",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/accounting", children: "auditor-grade accounting" }),
        " and",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/inventory-management", children: "FIFO inventory" }),
        "."
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: 0 }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3", children: solutionsHubList.map((sol) => {
      const Icon = iconMap[sol.iconName] || Layers;
      const badge = sol.badgeColor === "emerald" ? "vq-badge--success" : sol.badgeColor === "indigo" ? "vq-badge--accent" : "";
      return /* @__PURE__ */ jsxs(Link, { href: sol.href, className: "vq-card vq-card--xl vq-card--interactive vq-mkt-card", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { marginBottom: 0 }, children: /* @__PURE__ */ jsx(Icon, { "aria-hidden": "true" }) }),
          sol.badge && /* @__PURE__ */ jsx("span", { className: `vq-badge ${badge}`, children: sol.badge })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "vq-tile__title vq-mt-6", children: sol.name }),
        /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: sol.desc }),
        /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mkt-card__cta", children: [
          "Explore ",
          sol.name,
          " ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
        ] })
      ] }, sol.slug);
    }) }) }) }),
    /* @__PURE__ */ jsx(BusinessTypes, { variant: "directory", className: "vq-section--alt" }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0 }, children: [
      /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { margin: "0 auto var(--vq-space-5)" }, children: /* @__PURE__ */ jsx(ShieldCheck, { "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsx("h2", { className: "vq-h1", children: "One ledger core. Every industry capability." }),
      /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
        "No matter your trade, every transaction updates the same verified double-entry General Ledger — the engine behind ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/accounting", children: "VenQore's accounting" }),
        " and",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/inventory-management", children: "FIFO inventory" }),
        ". Guarded by eight correctness laws that run against every reading, your reports match your money down to the cent."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", style: { justifyContent: "center" }, children: [
        /* @__PURE__ */ jsxs(Link, { href: "/demo", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
          "Try the live demo — no signup ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/pricing", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "View pricing" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "vq-mt-16", children: /* @__PURE__ */ jsx(
      RelatedPages,
      {
        title: "Explore the platform",
        items: [
          { eyebrow: "Feature", label: "Point of Sale", href: "/features/point-of-sale", desc: "The terminal every industry setup is built on." },
          { eyebrow: "Feature", label: "FIFO Inventory", href: "/features/inventory-management", desc: "Batches, serials, variants and real costing." },
          { eyebrow: "Compare", label: "How VenQore compares", href: "/compare", desc: "Side by side with Square and Vyapar." },
          { eyebrow: "Free tools", label: "Try a tool first", href: "/tools", desc: "Invoices, barcodes and calculators, no signup." }
        ]
      }
    ) })
  ] });
}
export {
  Index as default
};
