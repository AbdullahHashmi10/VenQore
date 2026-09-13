import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head } from "@inertiajs/react";
import MarketingLayout, { SectionLabel, RevealOnScroll, MagneticButton } from "./MarketingLayout-cwTDSbNB.js";
import { Clock, CheckCircle2, Sparkles, Zap, Bot, Globe, ArrowRight } from "lucide-react";
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
const PHASES = [
  {
    key: "now",
    badge: { className: "vq-badge vq-badge--success", icon: CheckCircle2, label: "Shipped & live" },
    title: "1. Now — One System for the Whole Business",
    text: "Everything you need to run your retail or wholesale business in one place — point of sale, inventory, purchasing, invoicing, customer credit khata, expenses, staff, and auditor-grade double-entry accounting.",
    itemIcon: CheckCircle2,
    items: [
      "Point of Sale (POS) with Touch & Barcode Checkout",
      "Auditor-Grade Double-Entry General Ledger & Balance Sheet",
      "FIFO Cost Batching & Inventory Lineage Tracking",
      "100% Offline-First PWA (Works without Internet)",
      "WooCommerce Synchronization (Stock out, Orders in)",
      "40+ Financial & Operational Reports from One Ledger",
      "Serial & IMEI Tracking + Batch Expiry Controls",
      "Eight correctness laws, run on every release"
    ]
  },
  {
    key: "next",
    badge: { className: "vq-badge vq-badge--accent", icon: Zap, label: "Rolling out now" },
    title: "2. Next — The System Fills Itself In",
    text: "Eliminating manual data entry. Information enters your business via paper, voice, WhatsApp, or marketplaces, and VenQore turns it into ready-made ledger entries automatically.",
    itemIcon: Sparkles,
    items: [
      "SmartCapture AI: Photos of invoices & paper bills to digital records",
      "SmartCapture Voice: Spoken voice notes drafted into editable sales",
      "VenSynQ Amazon Integration: Stock & order sync for Amazon Sellers",
      "VenSynQ TikTok Shop & eBay Integration: Multi-marketplace sync",
      "Automated Debt & Payment Reminders via WhatsApp",
      "AI Owner Insights: Restock recommendations & customer churn alerts"
    ]
  },
  {
    key: "later",
    badge: { className: "vq-badge vq-badge--soon", icon: Globe, label: "Building toward" },
    title: "3. Later — Zero-Typing Business Management",
    text: "Businesses on VenQore stop typing entirely. One company's invoice lands as another company's bill automatically across our secure B2B network.",
    itemIcon: Bot,
    items: [
      "VenQore B2B Trade Network: One-click supplier-to-buyer invoice posting",
      "Turnkey Hosted Online Storefronts for Every Business",
      "Vena Autonomous AI Business Advisor: Financial health & inventory tuning",
      "Cross-Border Automated Multi-Currency Tax Settlements"
    ]
  }
];
function Roadmap() {
  return /* @__PURE__ */ jsxs(MarketingLayout, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "Public Product Roadmap — VenQore (Now / Next / Later)" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Explore VenQore's public product roadmap. See what is shipped today, what is rolling out next, and how we are building toward zero-typing business management." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "vq-section vq-mc-top", children: [
      /* @__PURE__ */ jsx("div", { className: "vq-amb", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { opacity: 0.22 } }) }),
      /* @__PURE__ */ jsx("div", { className: "vq-container", style: { position: "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: Clock, text: "Public product roadmap" }),
        /* @__PURE__ */ jsxs("h1", { className: "vq-display", children: [
          "Where VenQore is ",
          /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "headed." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "First we put everything in one place. Now we are teaching it to fill itself in. Eventually nobody types anything." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsx("div", { className: "vq-stack vq-gap-6", children: PHASES.map((phase) => {
      const BadgeIcon = phase.badge.icon;
      const ItemIcon = phase.itemIcon;
      return /* @__PURE__ */ jsx(RevealOnScroll, { direction: "up", children: /* @__PURE__ */ jsxs("div", { className: `vq-card vq-card--xl vq-mc-phase vq-mc-phase--${phase.key}`, style: { padding: "clamp(28px, 4vw, 48px)" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-mc-phase__head", children: [
          /* @__PURE__ */ jsx("h2", { className: "vq-h2", children: phase.title }),
          /* @__PURE__ */ jsxs("span", { className: phase.badge.className, children: [
            /* @__PURE__ */ jsx(BadgeIcon, { size: 14, "aria-hidden": "true" }),
            " ",
            phase.badge.label
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-4", style: { maxWidth: "68ch" }, children: phase.text }),
        /* @__PURE__ */ jsx("div", { className: "vq-mc-items", children: phase.items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "vq-mc-item", children: [
          /* @__PURE__ */ jsx(ItemIcon, { size: 18, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, i)) })
      ] }) }, phase.key);
    }) }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0 }, children: [
      /* @__PURE__ */ jsx("h2", { className: "vq-h1", children: "Be Part of the Future of Business Software" }),
      /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Describe your business and watch it get built — 14 days at Core level with full feature access. Or explore the live demo without signing up." }),
      /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", style: { justifyContent: "center" }, children: [
        /* @__PURE__ */ jsxs(MagneticButton, { href: "/build-workspace", variant: "primary", className: "vq-btn--lg", children: [
          "Start building ",
          /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" }) })
        ] }),
        /* @__PURE__ */ jsx(MagneticButton, { href: "/demo", variant: "secondary", className: "vq-btn--lg", children: "Explore Live Interactive Demo" })
      ] })
    ] }) }) })
  ] });
}
export {
  Roadmap as default
};
