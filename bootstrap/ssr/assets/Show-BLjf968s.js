import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import MarketingLayout, { RelatedPages } from "./MarketingLayout-cwTDSbNB.js";
import { a as solutionsData } from "./solutions-iwYK5Alp.js";
import { ArrowRight, AlertTriangle, CheckCircle2, Scale, TrendingUp, Truck, Repeat, FileText, QrCode, Users, Scan, RotateCcw, Clock, Calendar, Smartphone, Pill, ShieldCheck, ChevronDown } from "lucide-react";
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
const iconMap = {
  Pill,
  Smartphone,
  Calendar,
  Clock,
  RotateCcw,
  Scan,
  Users,
  QrCode,
  FileText,
  Repeat,
  Truck,
  TrendingUp,
  Scale
};
const RELATED_BY_INDUSTRY = {
  pharmacy: [
    { eyebrow: "Feature", label: "Batch & Expiry Tracking", href: "/features/inventory-management", desc: "Never sell an expired pack again." },
    { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "Audit-ready books without a second system." },
    { eyebrow: "Solution", label: "Grocery", href: "/solutions/grocery", desc: "Same shelf-life problems, different aisle." },
    { eyebrow: "Free tool", label: "Label Sheet Generator", href: "/tools/label-sheet-generator", desc: "Print shelf labels on standard sheets." }
  ],
  grocery: [
    { eyebrow: "Feature", label: "Point of Sale", href: "/features/point-of-sale", desc: "Lane speed with weighed and loose items." },
    { eyebrow: "Feature", label: "FIFO Inventory", href: "/features/inventory-management", desc: "Real margins on fast-moving stock." },
    { eyebrow: "Free tool", label: "Price Tag Generator", href: "/tools/price-tag-generator", desc: "Clean shelf tags in a couple of clicks." },
    { eyebrow: "Free tool", label: "Margin Calculator", href: "/tools/margin-calculator", desc: "Check a price before you print it." }
  ],
  "electronics-store": [
    { eyebrow: "Feature", label: "Serial Tracking", href: "/features/inventory-management", desc: "Every unit traceable from purchase to warranty." },
    { eyebrow: "Feature", label: "Point of Sale", href: "/features/point-of-sale", desc: "High-value sales with proper controls." },
    { eyebrow: "Compare", label: "VenQore vs Square", href: "/compare/venqore-vs-square", desc: "What card fees cost on big-ticket items." },
    { eyebrow: "Free tool", label: "Barcode Generator", href: "/tools/barcode-generator", desc: "Create scannable codes for any product." }
  ],
  clothing: [
    { eyebrow: "Feature", label: "Variants & Attributes", href: "/features/inventory-management", desc: "Size and colour handled as one product." },
    { eyebrow: "Feature", label: "Growth Engine", href: "/features/growth-engine", desc: "Bring last season's buyers back." },
    { eyebrow: "Free tool", label: "Price Tag Generator", href: "/tools/price-tag-generator", desc: "Rail-ready tags with your branding." },
    { eyebrow: "Solution", label: "Multi-store", href: "/solutions/multi-store", desc: "Move stock between branches cleanly." }
  ],
  wholesale: [
    { eyebrow: "Feature", label: "FIFO Inventory", href: "/features/inventory-management", desc: "Bulk units, conversions and true cost." },
    { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "Credit terms and receivables that reconcile." },
    { eyebrow: "Free tool", label: "Purchase Order Generator", href: "/tools/purchase-order-generator", desc: "Send a proper PO to your supplier." },
    { eyebrow: "Free tool", label: "Quote Generator", href: "/tools/quote-generator", desc: "Quote a bulk order in minutes." }
  ],
  "multi-store": [
    { eyebrow: "Feature", label: "Offline POS", href: "/features/offline-pos", desc: "Branches keep selling through outages." },
    { eyebrow: "Feature", label: "Real Accounting", href: "/features/accounting", desc: "One consolidated ledger across locations." },
    { eyebrow: "Coming soon", label: "VenSynQ", href: "/vensynq", desc: "Add online channels to the same stock pool." },
    { eyebrow: "Free tool", label: "Stock Count Sheet", href: "/tools/stock-count-sheet", desc: "Run a coordinated count in every branch." }
  ]
};
function Show({ slug }) {
  const data = solutionsData[slug] || solutionsData["pharmacy"];
  const related = RELATED_BY_INDUSTRY[slug] || RELATED_BY_INDUSTRY["pharmacy"];
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
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0, maxWidth: 880 }, children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: data.heroBadge }),
        /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: data.headline }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: data.subhead }),
        /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", style: { justifyContent: "center" }, children: [
          /* @__PURE__ */ jsxs(Link, { href: "/demo", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
            "Try the live demo — no signup ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
          ] }),
          /* @__PURE__ */ jsx(Link, { href: "/register", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Start free 14-day trial" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--4 vq-mt-16 vq-mkt-stats", children: data.stats.map((stat, i) => /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: stat.label }),
        /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", children: stat.value })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Where the money leaks" }),
        /* @__PURE__ */ jsxs("h2", { className: "vq-h1 vq-mt-4", children: [
          "The silent profit leaks in ",
          data.name,
          " operations"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Generic POS systems hide operational losses behind manual spreadsheets. VenQore fixes the root cause directly at the till." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2", children: data.painPoints.map((item, i) => /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-mkt-pain", children: [
        /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: item.title }),
        /* @__PURE__ */ jsxs("div", { className: "vq-mkt-pain__row vq-mkt-pain__row--problem vq-mt-5", children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-mkt-pain__label", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, "aria-hidden": "true" }),
            " The problem"
          ] }),
          /* @__PURE__ */ jsx("p", { children: item.problem })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-mkt-pain__row vq-mkt-pain__row--fix vq-mt-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-mkt-pain__label", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 16, "aria-hidden": "true" }),
            " The VenQore fix"
          ] }),
          /* @__PURE__ */ jsx("p", { children: item.solution })
        ] })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Capabilities" }),
        /* @__PURE__ */ jsxs("h2", { className: "vq-h1 vq-mt-4", children: [
          "Purpose-built for ",
          data.name,
          " retailers"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Every feature is engineered to protect stock accuracy, eliminate repeated typing, and maintain auditor-grade books." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3", children: data.features.map((feat, i) => {
        const Icon = iconMap[feat.icon] || ShieldCheck;
        return /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-tile", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx(Icon, { "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: feat.title }),
          /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: feat.desc })
        ] }, i);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Ledger truth engine" }),
        /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: data.accountingImpact.title }),
        /* @__PURE__ */ jsx("p", { className: "vq-lede", children: data.accountingImpact.description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-mkt-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "vq-mkt-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "col", children: "Account name & code" }),
          /* @__PURE__ */ jsx("th", { scope: "col", children: "Debit ($)" }),
          /* @__PURE__ */ jsx("th", { scope: "col", children: "Credit ($)" }),
          /* @__PURE__ */ jsx("th", { scope: "col", children: "Automated impact" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: data.accountingImpact.entries.map((entry, i) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { scope: "row", children: entry.account }),
          /* @__PURE__ */ jsx("td", { className: "vq-num vq-mkt-dr", children: entry.debit }),
          /* @__PURE__ */ jsx("td", { className: "vq-num vq-mkt-cr", children: entry.credit }),
          /* @__PURE__ */ jsx("td", { children: entry.note })
        ] }, i)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Compare competitors" }),
        /* @__PURE__ */ jsx("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-5", children: data.compareCrossLinks.map((link, i) => /* @__PURE__ */ jsxs(Link, { href: link.href, className: "vq-chip", children: [
          link.name,
          " ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 14, "aria-hidden": "true" })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Platform capabilities" }),
        /* @__PURE__ */ jsx("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-5", children: data.featureCrossLinks.map((link, i) => /* @__PURE__ */ jsxs(Link, { href: link.href, className: "vq-chip", children: [
          link.name,
          " ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 14, "aria-hidden": "true" })
        ] }, i)) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: "var(--vq-space-8)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
        /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "FAQ" }),
        /* @__PURE__ */ jsxs("h2", { className: "vq-h1 vq-mt-4", children: [
          "Frequently asked questions — ",
          data.name,
          " POS"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
          "Everything you need to know about setting up VenQore for your ",
          data.name.toLowerCase(),
          " business."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "vq-tools__faq", children: data.faqs.map((faq, i) => /* @__PURE__ */ jsxs("div", { className: "vq-tools__faq-item", "data-open": openFaq === i ? "true" : "false", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => toggleFaq(i),
            "aria-expanded": openFaq === i,
            className: "vq-tools__faq-q",
            children: [
              /* @__PURE__ */ jsx("span", { children: faq.q }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 20, "aria-hidden": "true" })
            ]
          }
        ),
        openFaq === i && /* @__PURE__ */ jsx("p", { className: "vq-tools__faq-a", children: faq.a })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section", style: { paddingTop: 0 }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mkt-cta", children: [
      /* @__PURE__ */ jsxs("h2", { className: "vq-h1", children: [
        "Ready to upgrade your ",
        data.name,
        " operations?"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Describe your business and VenQore assembles the system for it — 14 days at Core level with full feature access. Or test drive the live demo with no signup at all." }),
      /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mkt-cta__actions", children: [
        /* @__PURE__ */ jsxs(Link, { href: "/build-workspace", className: "vq-btn vq-btn--primary vq-btn--lg", children: [
          "Start building ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16, className: "vq-btn__arrow", "aria-hidden": "true" })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Explore the live demo" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(RelatedPages, { title: "Related reading", items: related })
  ] });
}
export {
  Show as default
};
