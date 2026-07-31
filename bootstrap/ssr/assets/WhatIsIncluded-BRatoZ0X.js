import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { Tag, Shield, Clock, Layers, ArrowRight, Check, X } from "lucide-react";
const Feature = ({ label, starter, growth, business }) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5 hover:bg-white/[0.02] transition-colors", children: [
  /* @__PURE__ */ jsx("td", { className: "py-3.5 pr-6 text-sm text-slate-300", children: label }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 text-center", children: starter === true ? /* @__PURE__ */ jsx(Check, { size: 15, className: "mx-auto text-emerald-400" }) : starter === false ? /* @__PURE__ */ jsx(X, { size: 15, className: "mx-auto text-slate-700" }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: starter }) }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 text-center", children: growth === true ? /* @__PURE__ */ jsx(Check, { size: 15, className: "mx-auto text-indigo-400" }) : growth === false ? /* @__PURE__ */ jsx(X, { size: 15, className: "mx-auto text-slate-700" }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-300", children: growth }) }),
  /* @__PURE__ */ jsx("td", { className: "py-3.5 text-center", children: business === true ? /* @__PURE__ */ jsx(Check, { size: 15, className: "mx-auto text-amber-400" }) : business === false ? /* @__PURE__ */ jsx(X, { size: 15, className: "mx-auto text-slate-700" }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-300", children: business }) })
] });
const Section = ({ title, children }) => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsx("tr", { className: "bg-white/[0.03]", children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "py-3 px-0 text-xs font-bold text-slate-500 uppercase tracking-widest pt-6", children: title }) }),
  children
] });
function WhatIsIncluded() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#020010] text-white font-sans", children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "What's Included — VenQore AppSumo LTD" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Full feature breakdown for VenQore's AppSumo Lifetime Deal. See exactly what's included in each tier." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/15 rounded-full blur-[120px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 mix-blend-overlay" })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-5 sm:py-6 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/", className: "flex items-center gap-2 sm:gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-8 sm:h-9 object-contain shrink-0" }),
        /* @__PURE__ */ jsxs("span", { className: "font-black text-base sm:text-lg text-white truncate", children: [
          "VenQore",
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4 shrink-0", children: /* @__PURE__ */ jsxs(Link, { href: route("redeem"), className: "flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs sm:text-sm font-bold hover:bg-orange-500/20 transition-colors", children: [
        /* @__PURE__ */ jsx(Tag, { size: 14, className: "shrink-0" }),
        " ",
        /* @__PURE__ */ jsx("span", { className: "hidden xs:inline", children: "Redeem AppSumo Code" }),
        /* @__PURE__ */ jsx("span", { className: "xs:hidden", children: "Redeem" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-bold mb-6", children: [
          /* @__PURE__ */ jsx(Tag, { size: 13 }),
          " AppSumo Lifetime Deal"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4", children: "What's Included" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-base sm:text-xl max-w-2xl mx-auto", children: "One-time purchase. No hidden fees. Lifetime access to the software. 2 years of hosting on venqore.com FREE (then $9 to $30/mo after 2 years depending on plan tier)." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-6", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", style: { WebkitOverflowScrolling: "touch" }, children: /* @__PURE__ */ jsxs("div", { className: "min-w-[640px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 border-b border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 sm:p-6" }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 text-center border-l border-white/10", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase tracking-widest mb-1", children: "1 Code" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-white", children: "Starter LTD" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white mt-1", children: "$79" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "one-time" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 text-center border-l border-indigo-500/30 bg-indigo-500/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-400 uppercase tracking-widest mb-1", children: "2 Codes Stacked" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-indigo-300", children: "Growth LTD" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white mt-1", children: "$199" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "one-time" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 text-center border-l border-amber-500/20 bg-amber-500/5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-400 uppercase tracking-widest mb-1", children: "3 Codes Stacked" }),
            /* @__PURE__ */ jsx("p", { className: "font-bold text-amber-300", children: "Business LTD" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white mt-1", children: "$399" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "one-time" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 sm:p-6", children: /* @__PURE__ */ jsx("table", { className: "w-full", children: /* @__PURE__ */ jsxs("tbody", { children: [
          /* @__PURE__ */ jsxs(Section, { title: "Limits", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Products (SKUs)", starter: "1,000", growth: "Unlimited", business: "Unlimited" }),
            /* @__PURE__ */ jsx(Feature, { label: "Staff Accounts", starter: "3", growth: "10", business: "Unlimited" }),
            /* @__PURE__ */ jsx(Feature, { label: "Warehouse Locations", starter: "1", growth: "3", business: "Unlimited" })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Point of Sale", children: [
            /* @__PURE__ */ jsx(Feature, { label: "POS Terminal", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Keyboard / Barcode Shortcuts", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Offline Mode", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Parked Sales", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Multi-Payment Methods", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Credit Sales", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "POS Receipts (Thermal/A4)", starter: true, growth: true, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Inventory", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Product Catalog", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Variants & Attributes", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "FIFO Costing Engine", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Stock Transfers", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Stock Take / Audit", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Batch & Serial Tracking", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Expiry Tracking", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Multi-Warehouse", starter: false, growth: true, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Sales & Purchasing", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Invoices & Quotations", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Purchase Orders", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Sales & Purchase Returns", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Party Ledgers (A/R & A/P)", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Discount Management", starter: true, growth: true, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Accounting", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Double-Entry Accounting", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Bank Accounts & Payments", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Expense Management", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Chart of Accounts", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Journal Entries", starter: true, growth: true, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Reports", children: [
            /* @__PURE__ */ jsx(Feature, { label: "P&L / Balance Sheet / Cash Flow", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Tax Report", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Stock Valuation", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Advanced Reports (38 total)", starter: "20", growth: "38+", business: "38+" }),
            /* @__PURE__ */ jsx(Feature, { label: "Sale Aging / Purchase Aging", starter: false, growth: true, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Intelligence & Growth", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Growth Engine (AI Retention)", starter: false, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "AI Customer Insights", starter: false, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "WooCommerce Sync", starter: false, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Public REST API", starter: false, growth: false, business: true })
          ] }),
          /* @__PURE__ */ jsxs(Section, { title: "Hosting & Support", children: [
            /* @__PURE__ */ jsx(Feature, { label: "Included Hosting", starter: "2 Years", growth: "2 Years", business: "2 Years" }),
            /* @__PURE__ */ jsx(Feature, { label: "After 2 Years", starter: "$9/mo", growth: "$18/mo", business: "$30/mo" }),
            /* @__PURE__ */ jsx(Feature, { label: "Self-Host Option", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Email Support", starter: true, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "Priority Support", starter: false, growth: true, business: true }),
            /* @__PURE__ */ jsx(Feature, { label: "SSO", starter: false, growth: false, business: true })
          ] })
        ] }) }) })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-14", children: [
        { icon: Shield, title: "60-Day Refund", body: "AppSumo's standard guarantee. Full refund within 60 days, no questions asked." },
        { icon: Clock, title: "2 Years Hosting", body: "Every code includes 2 years of hosting on venqore.com. After that, $9 to $30/mo depending on plan tier, or self-host." },
        { icon: Layers, title: "Stack Up to 3", body: "Buy a second or third code within 60 days to upgrade your plan tier instantly." }
      ].map((c, i) => /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/5 border border-white/10", children: [
        /* @__PURE__ */ jsx(c.icon, { size: 22, className: "text-indigo-400 mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-white mb-1", children: c.title }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm leading-relaxed", children: c.body })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("redeem"),
            className: "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25",
            children: [
              /* @__PURE__ */ jsx(Tag, { size: 16 }),
              " Redeem Your Code ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-xs mt-4 px-4", children: "Already bought on AppSumo? Click above to activate your license." })
      ] })
    ] })
  ] });
}
export {
  WhatIsIncluded as default
};
