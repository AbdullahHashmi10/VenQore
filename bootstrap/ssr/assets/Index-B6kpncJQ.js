import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import MarketingLayout, { InlineLink, RelatedPages } from "./MarketingLayout-cwTDSbNB.js";
import { ArrowRight, ShieldCheck, BarChart3, Zap, Layers } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
function CompareIndex({ competitors = [] }) {
  return /* @__PURE__ */ jsxs(MarketingLayout, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "VenQore POS & ERP Comparisons — See How VenQore Compares" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Compare VenQore with Square, Vyapar, Shopify POS, Lightspeed and Toast. Discover why growing businesses choose VenQore for zero transaction fees and built-in double-entry accounting." })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0, maxWidth: 880 }, children: [
      /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Honest competitor comparisons" }),
      /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: "How VenQore compares to legacy POS & billing systems" }),
      /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
        "Most POS software charges 2.6%+ on every sale or leaves your accounting incomplete. VenQore gives you a flat",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/pricing", children: "subscription" }),
        " with $0 processing markups and built-in",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/accounting", children: "double-entry bookkeeping" }),
        " on top of a",
        " ",
        /* @__PURE__ */ jsx(InlineLink, { href: "/features/point-of-sale", children: "full point of sale" }),
        "."
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: 0 }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2", children: competitors.map((item) => /* @__PURE__ */ jsxs(Link, { href: `/compare/${item.slug}`, className: "vq-card vq-card--xl vq-card--interactive vq-mkt-card", children: [
      /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", style: { alignSelf: "flex-start" }, children: item.tag }),
      /* @__PURE__ */ jsxs("h2", { className: "vq-h2 vq-mt-5", style: { color: "var(--vq-text)" }, children: [
        "VenQore vs ",
        item.name
      ] }),
      /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { lineHeight: 1.65 }, children: item.summary }),
      /* @__PURE__ */ jsx("div", { className: "vq-mkt-card__cta", children: /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
        "Detailed breakdown & pricing math ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
      ] }) })
    ] }, item.slug)) }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The standard" }),
        /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "The four VenQore guarantees" }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Every comparison page adheres to strict engineering and financial truth rules." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--4", children: [
        { icon: ShieldCheck, title: "Zero Processing Markup", text: "Pay flat subscription rates with $0 hidden transaction percentages." },
        { icon: BarChart3, title: "Auditor-Grade Books", text: "Every sale, purchase, and refund creates a balanced double-entry journal." },
        { icon: Zap, title: "100% Offline PWA", text: "Keep checking out customers even during complete internet blackouts." },
        { icon: Layers, title: "Eight Correctness Laws", text: "Financial precision verified by robust automated regression suites." }
      ].map((pillar, i) => /* @__PURE__ */ jsxs("div", { className: "vq-card vq-tile", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx(pillar.icon, { "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", style: { fontSize: 20 }, children: pillar.title }),
        /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: pillar.text })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mkt-cta", children: [
      /* @__PURE__ */ jsx("h2", { className: "vq-h1", children: "Ready to take control of your margins?" }),
      /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Start a 14-day free trial with full feature access — cancel anytime." }),
      /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions", children: [
        /* @__PURE__ */ jsxs(Link, { href: "/register", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
          "Start free trial ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Explore the interactive demo" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(
      RelatedPages,
      {
        title: "Before you decide",
        items: [
          { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "The double-entry ledger the comparisons hinge on." },
          { eyebrow: "Feature", label: "Offline POS", href: "/features/offline-pos", desc: "What happens to your till when the line drops." },
          { eyebrow: "Pricing", label: "Plans & pricing", href: "/pricing", desc: "Flat monthly cost with no per-sale markup." },
          { eyebrow: "Solutions", label: "Find your trade", href: "/solutions", desc: "Industry-specific setups, from pharmacy to wholesale." }
        ]
      }
    )
  ] });
}
export {
  CompareIndex as default
};
