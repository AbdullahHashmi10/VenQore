import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-DVMZFL-a.js";
import { Sparkles, Clock, AlertCircle, AlertTriangle, Key, Zap, ShoppingCart, Plus, Database, FileText, Check } from "lucide-react";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-qlixTg74.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function AiUsageIndex({ recent_events = [], addon_catalogue = {}, free_scan_allowance = 10 }) {
  const { props } = usePage();
  const store = props.store;
  const planInfo = props.plan || {};
  const aiUsage = planInfo.usage?.ai || {};
  const [buyingTopup, setBuyingTopup] = useState(false);
  const [topupError, setTopupError] = useState(null);
  const isByok = aiUsage.status === "byok";
  const isNone = aiUsage.status === "none";
  const pagesUsed = aiUsage.pages_used ?? 0;
  const pagesLimit = isNone ? free_scan_allowance : aiUsage.pages_limit;
  const isUnlimited = isByok || pagesLimit === -1;
  const usedRatio = !isUnlimited && pagesLimit > 0 ? pagesUsed / pagesLimit : 0;
  const usedPercent = Math.min(100, Math.round(usedRatio * 100));
  const warningState = isUnlimited ? "ok" : aiUsage.warning_state ?? (usedRatio >= 1 ? "limit" : usedRatio >= 0.8 ? "warning" : "ok");
  const queriesUsed = aiUsage.queries_used ?? 0;
  const queriesLimit = aiUsage.queries_limit;
  const queriesRatio = queriesLimit > 0 ? queriesUsed / queriesLimit : 0;
  const queriesPercent = Math.min(100, Math.round(queriesRatio * 100));
  const descriptionsBalance = aiUsage.descriptions_balance ?? 0;
  const getBarColor = (state) => {
    if (state === "limit") return "bg-rose-500";
    if (state === "warning") return "bg-amber-500";
    return "bg-[#0BAA8F]";
  };
  const getTextColor = (state) => {
    if (state === "limit") return "text-rose-500 dark:text-rose-400";
    if (state === "warning") return "text-amber-500 dark:text-amber-400";
    return "text-[#0BAA8F]";
  };
  const handleBuyTopup = async () => {
    setBuyingTopup(true);
    setTopupError(null);
    try {
      const res = await window.axios.post(
        route("store.billing.checkout-addon", { store_slug: store?.slug || "default" }),
        { addon_type: "ai_topup" }
      );
      if (res.data?.url) {
        if (window.LemonSqueezy?.Url?.Open) {
          window.LemonSqueezy.Url.Open(res.data.url);
        } else {
          window.location.href = res.data.url;
        }
      } else {
        setTopupError("Unable to generate checkout session. Please try again.");
      }
    } catch (err) {
      setTopupError(err.response?.data?.error || "Checkout initialization failed. Please contact support.");
    } finally {
      setBuyingTopup(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "AI Usage & Quota", activeMenu: "AI Usage", children: [
    /* @__PURE__ */ jsx(Head, { title: "AI Usage & Metering — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-8 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2", children: [
            /* @__PURE__ */ jsx("span", { children: "Account Settings" }),
            /* @__PURE__ */ jsx("span", { children: "/" }),
            /* @__PURE__ */ jsx("span", { className: "text-[#0BAA8F]", children: "AI Quotas & Metering" })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "text-[#0BAA8F]", size: 28 }),
            /* @__PURE__ */ jsx("span", { children: "AI Quota & Metering" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl", children: "Track SmartCapture document scans, AI queries, and product copy generation included in your monthly store plan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300", children: [
            "Plan: ",
            planInfo.slug || store?.plan || "Standard"
          ] }),
          aiUsage.resets_on && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 text-[#0BAA8F]", children: [
            /* @__PURE__ */ jsx(Clock, { size: 12 }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Resets on ",
              aiUsage.resets_on
            ] })
          ] })
        ] })
      ] }),
      topupError && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 18, className: "shrink-0 text-rose-500 dark:text-rose-400" }),
        /* @__PURE__ */ jsx("span", { children: topupError })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-sm relative overflow-hidden transition-colors", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 w-64 h-64 bg-[#0BAA8F]/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { children: "AI Scans (SmartCapture OCR)" }),
                isUnlimited && /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", children: "Unlimited" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 mt-0.5", children: "Automated document, receipt, and invoice line-item extraction" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              isUnlimited ? /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold font-mono text-[#0BAA8F]", children: "∞ Unlimited" }) : /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold font-mono text-neutral-900 dark:text-white tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: getTextColor(warningState), children: pagesUsed }),
                /* @__PURE__ */ jsxs("span", { className: "text-neutral-400 dark:text-neutral-500 font-normal", children: [
                  " / ",
                  pagesLimit,
                  " scans"
                ] })
              ] }),
              !isUnlimited && /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 mt-0.5", children: [
                usedPercent,
                "% quota utilized"
              ] })
            ] })
          ] }),
          !isUnlimited ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-3.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10 p-0.5", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: `h-full rounded-full transition-all duration-500 ${getBarColor(warningState)}`,
                style: { width: `${Math.max(2, usedPercent)}%` }
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1", children: [
              /* @__PURE__ */ jsx("span", { children: "0 scans" }),
              warningState === "limit" && /* @__PURE__ */ jsxs("span", { className: "text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                " Monthly allowance exhausted. Feature locked until reset or top-up."
              ] }),
              warningState === "warning" && /* @__PURE__ */ jsxs("span", { className: "text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(AlertCircle, { size: 12 }),
                " Near limit (over 80% used)"
              ] }),
              warningState === "ok" && /* @__PURE__ */ jsxs("span", { className: "text-neutral-500 dark:text-neutral-400", children: [
                Math.max(0, pagesLimit - pagesUsed),
                " scans remaining"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                pagesLimit,
                " scans"
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Key, { className: "text-emerald-600 dark:text-emerald-400 shrink-0", size: 20 }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-emerald-800 dark:text-emerald-300", children: isByok ? "Bring-Your-Own-Key (BYOK) Active" : "Unlimited Plan Allowance" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5", children: "All scans and queries run without platform quota limits." })
              ] })
            ] }),
            store?.slug && /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.admin.settings", { store_slug: store.slug }),
                className: "px-3.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all shrink-0",
                children: "Manage Keys"
              }
            )
          ] }),
          isNone && !isByok && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Free Trial Allowance:" }),
              " You are currently on the free ",
              free_scan_allowance,
              "-scan preview. Upgrade your plan or purchase a top-up pack to unlock ongoing monthly allowances."
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleBuyTopup,
                disabled: buyingTopup,
                className: "px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all shrink-0",
                children: "Unlock Credits"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-4 transition-colors", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx(Zap, { className: "text-sky-500", size: 18 }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-neutral-900 dark:text-white text-base", children: "Assistant & OmniSearch" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-neutral-500 dark:text-neutral-400", children: [
              queriesUsed,
              " / ",
              queriesLimit ?? "∞",
              " queries"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed", children: "Voice commands, natural language queries for sales, stock lookups, and customer analytics." }),
          queriesLimit && queriesLimit > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-sky-500 rounded-full transition-all duration-300",
                style: { width: `${Math.max(2, queriesPercent)}%` }
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[11px] font-mono text-neutral-500", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                queriesPercent,
                "% used"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                Math.max(0, queriesLimit - queriesUsed),
                " remaining"
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "p-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl text-xs text-sky-800 dark:text-sky-300 font-medium", children: "Unlimited search queries included on your active store plan." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm flex flex-col justify-between space-y-4 transition-colors", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsx(ShoppingCart, { className: "text-[#0BAA8F]", size: 18 }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-neutral-900 dark:text-white text-base", children: "Instant AI Top-Up" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-[#0BAA8F] bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 px-2.5 py-0.5 rounded-full", children: "$10 / 1,000 Credits" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed", children: "Need extra capacity right away? Add 1,000 AI scan credits immediately to your store. Purchased credits never expire and rollover each month." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleBuyTopup,
                disabled: buyingTopup,
                className: "flex-1 py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  buyingTopup ? "Opening Checkout…" : "Buy 1,000 AI Credits ($10)"
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0", children: "LemonSqueezy" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm flex items-center justify-between opacity-80 transition-colors", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Database, { size: 16, className: "text-purple-500" }),
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-neutral-900 dark:text-white", children: "AI Structural Rebuilds" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30", children: "Coming Soon" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 mt-1", children: "Automated catalog reorganizations, batch categorization, and deep schema synthesis." })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl backdrop-blur-sm flex items-center justify-between transition-colors", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-[#0BAA8F]" }),
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-neutral-900 dark:text-white", children: "AI Product Descriptions" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30", children: descriptionsBalance > 0 ? `${descriptionsBalance} balance` : "Included" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 dark:text-neutral-400 mt-1", children: "One-click SEO and marketing copy generation directly from the product editor." })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-[#0D1322]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] p-6 shadow-sm dark:shadow-xl backdrop-blur-sm space-y-4 transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-neutral-200 dark:border-white/[0.08] pb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-neutral-400" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-neutral-900 dark:text-white text-base", children: "Recent AI Activity Log" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-neutral-500", children: [
            "Last ",
            recent_events.length,
            " events"
          ] })
        ] }),
        recent_events.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-10 space-y-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 28, className: "mx-auto text-neutral-400 dark:text-neutral-600" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: "No AI operations recorded yet for this store." }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500", children: "When you scan documents or use AI assistant features, your store's activity will appear here." })
        ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-neutral-200 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-left", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Feature" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Units" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Timestamp" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-100 dark:divide-white/[0.04]", children: recent_events.map((ev) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-semibold text-neutral-900 dark:text-white capitalize", children: ev.feature === "scan" ? "SmartCapture OCR Scan" : ev.feature }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-700 dark:text-neutral-300", children: ev.pages ? `${ev.pages} page${ev.pages > 1 ? "s" : ""}` : "1 query" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: ev.success ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400", children: [
              /* @__PURE__ */ jsx(Check, { size: 12 }),
              " Success"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
              " Failed"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-right font-mono text-neutral-500 text-[11px]", children: new Date(ev.created_at).toLocaleString() })
          ] }, ev.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  AiUsageIndex as default
};
