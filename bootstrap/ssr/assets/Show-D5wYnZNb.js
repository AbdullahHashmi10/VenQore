import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import MarketingLayout, { RelatedPages } from "./MarketingLayout-cwTDSbNB.js";
import { Check, X, ChevronDown, ArrowRight } from "lucide-react";
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
const competitors = {
  "square": {
    name: "Square POS",
    slug: "square",
    title: "VenQore vs Square POS — Pricing Math, Accounting & Features Comparison",
    metaTitle: "VenQore vs Square POS (2026 Comparison & Pricing Math)",
    metaDescription: "Compare VenQore vs Square POS: see transaction fee math, built-in double-entry accounting vs QuickBooks add-ons, offline PWA stability, and real FIFO inventory.",
    headline: "Why Growing Retailers Switch from Square POS to VenQore",
    subtitle: "Square POS charges 2.6% + 10¢ on every sale and lacks built-in accounting. VenQore gives you $0 transaction fees and automated double-entry bookkeeping.",
    competitorPrice: "Free plan / $60+ Plus",
    competitorTxFee: "2.6% + 10¢ per tap/dip/swipe",
    competitorAccounting: "None (requires QuickBooks/Xero @ $30–$80/mo)",
    competitorOffline: "Basic (24h card buffer, decline risk)",
    venqorePrice: "From $18/mo ($180/yr billed annually)",
    venqoreTxFee: "$0 transaction markup",
    venqoreAccounting: "Automated double-entry general ledger & balance sheet built in",
    venqoreOffline: "100% offline-first PWA with local SQLite/IndexedDB & auto-sync",
    pricingMath: {
      monthlySales: "$25,000",
      squareFee: "$660/mo in processing fees + $50/mo QuickBooks = $710/mo total cost",
      venqoreFee: "From $18/mo total flat subscription",
      annualSavings: "Over $7,500 saved per year with VenQore"
    },
    honestVerdict: {
      chooseCompetitor: "Choose Square POS if your business processes very low volume (under $1,000/month), does not require double-entry financial statements, and wants an all-in-one proprietary card terminal out of the box.",
      chooseVenQore: "Choose VenQore if your retail or wholesale business processes over $5,000/month, needs real double-entry accounting (P&L, Balance Sheet, Trial Balance), requires offline reliability during internet drops, and wants to keep 100% of your hard-earned margins without per-transaction processing markups."
    },
    table: [
      { feature: "Monthly Software Starting Cost", venqore: "From $18 / month", competitor: "Free / $60+ Plus" },
      { feature: "Per-Transaction Processing Markup", venqore: "$0 (0%)", competitor: "2.6% + 10¢ per sale" },
      { feature: "Built-in Double-Entry Accounting", venqore: "Yes — every sale posts a balanced journal entry", competitor: "No — requires external accounting app" },
      { feature: "Automated Balance Sheet & P&L", venqore: "Yes — real-time all 40 reports", competitor: "No — requires manual reconciliation" },
      { feature: "Offline-First PWA Architecture", venqore: "Yes — full checkout, stock & ledger offline", competitor: "Limited — card payments cached max 24h" },
      { feature: "FIFO Cost Batch Tracking", venqore: "Yes — exact unit cost lineage per batch", competitor: "No — basic average cost only" },
      { feature: "Serial / IMEI Number Tracking", venqore: "Yes — built-in item tracking", competitor: "No — requires 3rd party add-on" },
      { feature: "Multi-Warehouse & Branch Support", venqore: "Yes — central management included", competitor: "Requires Square for Retail Plus ($60/mo)" },
      { feature: "Multi-Channel E-Commerce Sync", venqore: "Yes — VenSynQ for WooCommerce, Amazon & TikTok", competitor: "Square Online site only" },
      { feature: "AI Document Capture (SmartCapture)", venqore: "Yes — photo & voice invoice extraction", competitor: "No native document scanner" },
      { feature: "Customer Credit Khata Ledger", venqore: "Yes — built-in party balances & reminders", competitor: "Limited house accounts" },
      { feature: "WhatsApp & Digital Invoicing", venqore: "Yes — direct 1-tap WhatsApp sharing", competitor: "Email / SMS only" },
      { feature: "Thermal & WebUSB Printing", venqore: "Yes — works with standard ESC/POS hardware", competitor: "Proprietary Square hardware preferred" },
      { feature: "Data Export & Ownership", venqore: "Yes — full JSON, Excel & SQLite exports", competitor: "Export CSVs only" },
      { feature: "Automated Test Integrity Suite", venqore: "Eight correctness laws, run on every release", competitor: "Undisclosed" }
    ],
    faqs: [
      {
        q: "Why is VenQore significantly cheaper than Square POS for active stores?",
        a: "Square POS generates revenue by taking 2.6% + 10¢ from every transaction you process. For a retail store processing $25,000/month, Square fees exceed $660/month. VenQore flat plans start at $18/month or free forever on Solo tier with $0 processing markup, allowing you to use your existing merchant account or cash/bank payments directly."
      },
      {
        q: "Does VenQore replace QuickBooks when migrating from Square?",
        a: "Yes. VenQore includes a full auditor-grade double-entry accounting engine. Every sale, purchase, expense, and return automatically creates a balanced journal entry in your General Ledger, producing live Balance Sheets, Profit & Loss reports, and Trial Balances without needing a separate QuickBooks or Xero subscription."
      },
      {
        q: "Can VenQore operate when my internet goes down?",
        a: "Yes. VenQore is built as an offline-first Progressive Web App (PWA). You can process checkout sales, manage inventory, print receipts, and issue invoices without internet access. When your internet connection is restored, VenQore automatically synchronizes your local data with the cloud."
      },
      {
        q: "Can I import my existing product catalog from Square into VenQore?",
        a: "Yes. VenQore provides a 1-click CSV importer that reads exported Square inventory files, mapping your SKUs, product names, categories, and prices into VenQore in under 5 minutes."
      },
      {
        q: "What hardware do I need to run VenQore compared to Square?",
        a: "Square requires proprietary Square hardware (Square Stand, Square Terminal, or Square Register). VenQore runs on any standard web browser on PC, Mac, iPad, Android tablets, or smartphones, and connects with standard USB/Bluetooth barcode scanners and ESC/POS thermal printers."
      }
    ]
  },
  "vyapar": {
    name: "Vyapar",
    slug: "vyapar",
    title: "VenQore vs Vyapar — Double-Entry Accounting vs Billing App Comparison",
    metaTitle: "VenQore vs Vyapar (2026 Comparison & Feature Breakdown)",
    metaDescription: "Compare VenQore vs Vyapar: discover true double-entry accounting vs single-entry billing, cross-platform cloud PWA vs desktop-only apps, and 10-minute .vyb data import.",
    headline: "Graduate from Basic Billing to VenQore’s Auditor-Grade ERP",
    subtitle: "Vyapar provides simple single-entry billing for desktop, but fails as your business grows. VenQore gives you true double-entry accounting, real-time multi-store sync, and offline PWA performance.",
    competitorPrice: "Free desktop / ~$40–$70 per device",
    competitorTxFee: "None",
    competitorAccounting: "Single-entry billing & basic khata (not double-entry)",
    competitorOffline: "Desktop Windows app only (mobile sync issues)",
    venqorePrice: "From $18/mo ($180/yr billed annually)",
    venqoreTxFee: "$0 transaction markup",
    venqoreAccounting: "Auditor-grade double-entry general ledger, Trial Balance & Balance Sheet",
    venqoreOffline: "Offline-first PWA across Windows, Mac, iOS, Android & tablet",
    pricingMath: {
      monthlySales: "$15,000",
      vyaparFee: "Low upfront license, but requires hiring an accountant for year-end GST/tax reconciliation ($200+/mo)",
      venqoreFee: "From $18/mo total flat subscription with self-balancing ledger",
      annualSavings: "Save over $1,500/year in external accounting cleanup costs with VenQore"
    },
    honestVerdict: {
      chooseCompetitor: "Choose Vyapar if you are a micro single-shop owner looking for a simple, offline Windows desktop billing software for cash invoices and do not need real double-entry financial statements.",
      chooseVenQore: "Choose VenQore if you are a growing retail, wholesale, or multi-store business that needs verified double-entry accounting, FIFO batch cost tracking, multi-channel e-commerce sync, and real-time cloud multi-user collaboration across any device."
    },
    table: [
      { feature: "Accounting System Type", venqore: "True Double-Entry General Ledger", competitor: "Single-Entry Billing & Simple Khata" },
      { feature: "Financial Statement Integrity", venqore: "Live Balance Sheet, P&L, Trial Balance", competitor: "Basic cash flow & sales summary" },
      { feature: "Cross-Platform Availability", venqore: "Any device (Windows, Mac, iOS, Android)", competitor: "Primarily Windows desktop" },
      { feature: "Data Import from Vyapar", venqore: "10-minute .vyb & CSV automated importer", competitor: "N/A" },
      { feature: "Multi-Store & Branch Centralization", venqore: "Built-in multi-tenant real-time sync", competitor: "Difficult multi-device sync" },
      { feature: "Inventory Costing Method", venqore: "FIFO cost batching with precise lineage", competitor: "Simple average / last cost" },
      { feature: "E-Commerce Channel Sync (VenSynQ)", venqore: "WooCommerce, Amazon, TikTok Shop sync", competitor: "Basic online storefront link" },
      { feature: "AI Document Parsing (SmartCapture)", venqore: "Scan paper bills & voice notes to posted entries", competitor: "Manual entry only" },
      { feature: "Offline Operation Capability", venqore: "100% offline PWA on any device", competitor: "Offline on desktop only" },
      { feature: "Serial & IMEI Item Tracking", venqore: "Yes — full warranty & serial history", competitor: "Basic serial number text" },
      { feature: "Batch & Expiry Date Management", venqore: "Yes — FIFO consumption by expiry date", competitor: "Basic batch number entry" },
      { feature: "Custom Thermal & Label Printing", venqore: "Yes — WebUSB, Bluetooth & ESC/POS", competitor: "Windows printer drivers only" },
      { feature: "User Roles & Permission Control", venqore: "Granular cashier, manager, admin roles", competitor: "Basic passcode lock" },
      { feature: "Audit Trail & Change Logs", venqore: "Complete immutable action logging", competitor: "Limited event log" },
      { feature: "Automated Codebase Verification", venqore: "Eight correctness laws, run on every release", competitor: "Undisclosed" }
    ],
    faqs: [
      {
        q: "How does VenQore differ from Vyapar in accounting accuracy?",
        a: "Vyapar is a single-entry billing app: it records invoices and customer balances, but does not maintain a double-entry general ledger. VenQore is an auditor-grade ERP: every transaction automatically posts balanced debit and credit entries, giving you real-time Balance Sheets, Profit & Loss statements, and Trial Balances that accountants trust."
      },
      {
        q: "Can I import my data from Vyapar into VenQore?",
        a: "Yes. VenQore includes a dedicated Vyapar import tool. You can export your `.vyb` or CSV files from Vyapar and upload them to VenQore to transfer your products, customers, suppliers, and opening balances in under 10 minutes."
      },
      {
        q: "Does VenQore run on Apple Mac and mobile devices unlike Vyapar?",
        a: "Yes. While Vyapar relies heavily on its Windows desktop application, VenQore is an offline-first Progressive Web App (PWA) that runs seamlessly across Mac, Windows, iPad, iPhone, Android phones, and Android tablets."
      },
      {
        q: "Can VenQore manage multiple shop locations simultaneously?",
        a: "Yes. VenQore supports multi-store management natively. You can view consolidated sales, transfer stock between warehouses, manage staff permissions, and check real-time store performance from a single central Hub."
      },
      {
        q: "Is VenQore easy to learn for staff used to Vyapar?",
        a: "Yes. VenQore features an intuitive high-speed POS interface with touch shortcuts and barcode scanning designed for fast checkout, making it simple for cashiers to transition without training."
      }
    ]
  }
};
const RELATED_BY_COMPETITOR = {
  square: [
    { eyebrow: "Feature", label: "Point of Sale", href: "/features/point-of-sale", desc: "The terminal you would be switching to." },
    { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "Built in, not bolted on via QuickBooks." },
    { eyebrow: "Compare", label: "VenQore vs Vyapar", href: "/compare/venqore-vs-vyapar", desc: "The other comparison people run." },
    { eyebrow: "Pricing", label: "See what it costs", href: "/pricing", desc: "Flat plans, no per-transaction cut." }
  ],
  vyapar: [
    { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "Double-entry, not single-entry billing." },
    { eyebrow: "Feature", label: "FIFO Inventory", href: "/features/inventory-management", desc: "Costing that survives an audit." },
    { eyebrow: "Compare", label: "VenQore vs Square", href: "/compare/venqore-vs-square", desc: "The other comparison people run." },
    { eyebrow: "Solution", label: "Wholesale", href: "/solutions/wholesale", desc: "Where the ledger difference bites hardest." }
  ]
};
function CompareShow({ slug }) {
  const data = competitors[slug] || competitors["square"];
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  return /* @__PURE__ */ jsxs(MarketingLayout, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: data.metaTitle }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: data.metaDescription })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0, maxWidth: 900 }, children: [
        /* @__PURE__ */ jsxs("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: [
          "VenQore vs ",
          data.name
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: data.headline }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: data.subtitle })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2 vq-mt-16 vq-cmp-sum", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-cmp-sum__us", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "VenQore" }),
              /* @__PURE__ */ jsx("p", { className: "vq-small vq-accent-text vq-mt-2", style: { fontWeight: 600 }, children: "The AI ERP builder" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: "Recommended" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-mkt-list vq-mt-6", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(Check, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Price:" }),
                " ",
                data.venqorePrice
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(Check, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Processing fees:" }),
                " ",
                data.venqoreTxFee
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(Check, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Accounting:" }),
                " ",
                data.venqoreAccounting
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(Check, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Offline access:" }),
                " ",
                data.venqoreOffline
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-card--flat vq-cmp-sum__them", children: [
          /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: data.name }),
          /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-3 vq-mt-2", style: { fontWeight: 600 }, children: "Legacy system" }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-mkt-list vq-mkt-list--x vq-mt-6", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(X, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Price:" }),
                " ",
                data.competitorPrice
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(X, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Processing fees:" }),
                " ",
                data.competitorTxFee
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(X, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Accounting:" }),
                " ",
                data.competitorAccounting
              ] })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx(X, { "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Offline access:" }),
                " ",
                data.competitorOffline
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Real margin math" }),
        /* @__PURE__ */ jsxs("h2", { className: "vq-h1 vq-mt-4", children: [
          "The true cost comparison at ",
          data.pricingMath.monthlySales,
          " / month"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { maxWidth: 900, marginInline: "auto" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat", children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-stat__label", children: [
            data.name,
            " total cost"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm vq-cmp-them", children: data.pricingMath.squareFee || data.pricingMath.vyaparFee }),
          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Accumulates every month as processing fees scale with your revenue." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-cmp-sum__us", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "VenQore total cost" }),
          /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm vq-cmp-us", children: data.pricingMath.venqoreFee }),
          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Fixed monthly subscription with no transaction markups. Keep 100% of your earnings." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-center vq-mt-8", children: /* @__PURE__ */ jsx("span", { className: "vq-cmp-savings", children: data.pricingMath.annualSavings }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Side by side" }),
        /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Detailed feature-by-feature matrix" }),
        /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
          "Compare VenQore side-by-side with ",
          data.name,
          " across core business operations."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-mkt-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "vq-mkt-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "col", style: { width: "38%" }, children: "Feature / capability" }),
          /* @__PURE__ */ jsx("th", { scope: "col", className: "is-us", children: "VenQore" }),
          /* @__PURE__ */ jsx("th", { scope: "col", children: data.name })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: data.table.map((row, idx) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "row", children: row.feature }),
          /* @__PURE__ */ jsx("td", { className: "is-us", children: /* @__PURE__ */ jsxs("span", { className: "vq-row vq-gap-2", style: { alignItems: "flex-start" }, children: [
            /* @__PURE__ */ jsx(Check, { size: 16, className: "vq-cmp-tick", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("span", { children: row.venqore })
          ] }) }),
          /* @__PURE__ */ jsx("td", { children: row.competitor })
        ] }, idx)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Honest recommendation" }),
        /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Which should you choose?" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { maxWidth: 1e3, marginInline: "auto" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
          /* @__PURE__ */ jsxs("h3", { className: "vq-h3", children: [
            "When to choose ",
            data.name
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-3", style: { lineHeight: 1.65 }, children: data.honestVerdict.chooseCompetitor })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-cmp-sum__us", children: [
          /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "When to choose VenQore" }),
          /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-3", style: { lineHeight: 1.65 }, children: data.honestVerdict.chooseVenQore })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsxs("h2", { className: "vq-h1 vq-mt-4", children: [
          "Questions about switching from ",
          data.name,
          " to VenQore"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-tools__faq", children: data.faqs.map((faq, idx) => /* @__PURE__ */ jsxs("div", { className: "vq-tools__faq-item", "data-open": openFaq === idx ? "true" : "false", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => toggleFaq(idx), "aria-expanded": openFaq === idx, className: "vq-tools__faq-q", children: [
          /* @__PURE__ */ jsx("span", { children: faq.q }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 20, "aria-hidden": "true" })
        ] }),
        openFaq === idx && /* @__PURE__ */ jsx("p", { className: "vq-tools__faq-a", children: faq.a })
      ] }, idx)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: 0 }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mkt-cta", children: [
      /* @__PURE__ */ jsx("h2", { className: "vq-h1", children: "Switch to VenQore today" }),
      /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
        "Start a 14-day free trial. Our team assists with zero-downtime data migration from ",
        data.name,
        "."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions", children: [
        /* @__PURE__ */ jsxs(Link, { href: "/build-workspace", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
          "Start building ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Try the live interactive demo" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(
      RelatedPages,
      {
        title: "Related reading",
        items: RELATED_BY_COMPETITOR[slug] || RELATED_BY_COMPETITOR.square
      }
    )
  ] });
}
export {
  CompareShow as default
};
