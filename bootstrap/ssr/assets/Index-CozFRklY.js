import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-B1IWUXx4.js";
import { Cpu, Users, Layers, DollarSign, Calendar, TrendingUp, Shield, BarChart3, Search, ArrowUpRight } from "lucide-react";
import "./PlatformLayout-l0DusZka.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./ui-CY-levCx.js";
import "./runtime-DwSFgQZq.js";
import "./AiIsland-DlkwqCwv.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
function PlatformAiUsageIndex({
  kpis = {},
  daily_trend = [],
  tenant_breakdown = [],
  model_breakdown = []
}) {
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const filteredTenants = useMemo(() => {
    return (tenant_breakdown || []).filter((t) => {
      const matchesSearch = !tenantSearch.trim() || t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) || t.slug?.toLowerCase().includes(tenantSearch.toLowerCase()) || String(t.tenant_id).includes(tenantSearch);
      const matchesFilter = tenantFilter === "all" || tenantFilter === "byok" && t.ai_status === "byok" || tenantFilter === "managed" && t.ai_status !== "byok";
      return matchesSearch && matchesFilter;
    });
  }, [tenant_breakdown, tenantSearch, tenantFilter]);
  const maxDailyCost = useMemo(() => {
    const costs = (daily_trend || []).map((d) => parseFloat(d.cost_usd) || 0);
    return Math.max(1, ...costs);
  }, [daily_trend]);
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "AI Billing & Usage", mode: "admin", activeMenu: "Tenant Overrides", children: [
    /* @__PURE__ */ jsx(Head, { title: "Platform AI Cost & Consumption — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2", children: [
            /* @__PURE__ */ jsx("span", { children: "Platform HQ" }),
            /* @__PURE__ */ jsx("span", { children: "/" }),
            /* @__PURE__ */ jsx("span", { className: "text-[#0BAA8F]", children: "AI Operations" })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Cpu, { className: "text-[#0BAA8F]", size: 28 }),
            /* @__PURE__ */ jsx("span", { children: "AI Billing & Consumption" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed", children: "Monitor infrastructure spend across foundation models, reconcile provider invoices, and audit high-volume tenant usage." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("platform.tenants.overrides"),
              className: "px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-300 transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Users, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: "Tenant Overrides" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("platform.plans.index"),
              className: "px-4 py-2 rounded-xl bg-[#0BAA8F]/15 hover:bg-[#0BAA8F]/25 border border-[#0BAA8F]/30 text-xs font-bold text-[#0BAA8F] transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Layers, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: "Plan Matrix" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-neutral-400", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Today's Platform Spend" }),
            /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "text-[#0BAA8F]" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold font-mono tracking-tight text-white", children: [
            "$",
            (kpis.today_spend || 0).toFixed(4)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-neutral-400 flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              kpis.today_calls || 0,
              " API calls today"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-[#0BAA8F] font-bold", children: "Live" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-neutral-400", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Month-to-Date Spend" }),
            /* @__PURE__ */ jsx(Calendar, { size: 16, className: "text-sky-400" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold font-mono tracking-tight text-white", children: [
            "$",
            (kpis.month_spend || 0).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-neutral-400 flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              (kpis.month_calls || 0).toLocaleString(),
              " calls this month"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: (/* @__PURE__ */ new Date()).toLocaleDateString("default", { month: "short" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-neutral-400", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Projected Run-rate" }),
            /* @__PURE__ */ jsx(TrendingUp, { size: 16, className: "text-purple-400" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold font-mono tracking-tight text-purple-300", children: [
            "$",
            (kpis.projected_month_end || 0).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-neutral-400 flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "~$",
              (kpis.avg_daily_spend_7d || 0).toFixed(2),
              " / day avg"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-purple-400 font-bold", children: "Month-end" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-neutral-400", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Daily Platform Cap" }),
            /* @__PURE__ */ jsx(Shield, { size: 16, className: "text-amber-400" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold font-mono tracking-tight text-white", children: [
            "$",
            (kpis.daily_spend_cap || 25).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-neutral-400 flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Protection threshold" }),
            /* @__PURE__ */ jsx("span", { className: "text-amber-400 font-bold", children: "Active" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(BarChart3, { size: 18, className: "text-[#0BAA8F]" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "30-Day Cost & Call Trajectory" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400", children: "Daily platform provider expenditure (excluding BYOK)" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4 text-xs font-mono text-neutral-400", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-sm bg-[#0BAA8F]" }),
            /* @__PURE__ */ jsx("span", { children: "Platform Cost ($)" })
          ] }) })
        ] }),
        !daily_trend || daily_trend.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-10 text-neutral-500 text-xs italic", children: "No telemetry recorded over the last 30 days." }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-44 flex items-end gap-1.5 pt-4 pb-2", children: daily_trend.map((d) => {
            const cost = parseFloat(d.cost_usd) || 0;
            const heightPct = Math.max(4, Math.round(cost / maxDailyCost * 100));
            d.date ? d.date.substring(5) : "";
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex-1 flex flex-col items-center gap-1 h-full justify-end group relative",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-neutral-900 border border-white/20 p-2 rounded-xl text-[10px] font-mono z-20 whitespace-nowrap shadow-xl", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-bold", children: d.date }),
                    /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                      "$",
                      cost.toFixed(4)
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-neutral-500", children: [
                      d.total_calls,
                      " calls"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-full bg-[#0BAA8F]/70 hover:bg-[#0BAA8F] rounded-t-md transition-all duration-200",
                      style: { height: `${heightPct}%` }
                    }
                  )
                ]
              },
              d.date
            );
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-white/[0.05]", children: [
            /* @__PURE__ */ jsx("span", { children: daily_trend[0]?.date }),
            /* @__PURE__ */ jsx("span", { children: "30 Days Trailing" }),
            /* @__PURE__ */ jsx("span", { children: daily_trend[daily_trend.length - 1]?.date })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Users, { size: 18, className: "text-sky-400" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "Per-Tenant AI Consumption" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400", children: "Stores ranked by 30-day platform spend" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { size: 13, className: "absolute left-3 top-2.5 text-neutral-500" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: tenantSearch,
                  onChange: (e) => setTenantSearch(e.target.value),
                  placeholder: "Filter store or slug…",
                  className: "bg-neutral-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: tenantFilter,
                onChange: (e) => setTenantFilter(e.target.value),
                className: "bg-neutral-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Stores" }),
                  /* @__PURE__ */ jsx("option", { value: "managed", children: "Platform Paid" }),
                  /* @__PURE__ */ jsx("option", { value: "byok", children: "BYOK Stores" })
                ]
              }
            )
          ] })
        ] }),
        filteredTenants.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-neutral-500 text-xs italic", children: "No store consumption matching current filters." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider text-left", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Tenant / Store" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Plan / Mode" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Top Feature" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Total Calls" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Tokens Used" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Platform Cost" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/[0.04]", children: filteredTenants.map((t) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "py-3 px-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-white text-sm", children: t.name }),
              /* @__PURE__ */ jsxs("div", { className: "font-mono text-[10px] text-neutral-500", children: [
                "#",
                t.tenant_id,
                " · ",
                t.slug
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-neutral-300", children: t.plan }),
              t.ai_status === "byok" ? /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", children: "BYOK" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0BAA8F]/15 text-[#0BAA8F] border border-[#0BAA8F]/30", children: "Managed" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-300 capitalize", children: t.top_feature || "scan" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono font-semibold text-white", children: (t.total_calls || 0).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-400", children: (t.total_tokens || 0).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono font-bold", children: t.ai_status === "byok" ? /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "$0.00 (Self-funded)" }) : /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
              "$",
              (t.cost_usd || 0).toFixed(4)
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-right", children: /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("platform.tenants.overrides.show", { tenant: t.tenant_id }),
                className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0BAA8F]/15 hover:bg-[#0BAA8F]/25 border border-[#0BAA8F]/30 text-[#0BAA8F] text-[11px] font-bold transition-all",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Adjust Quota" }),
                  /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 })
                ]
              }
            ) })
          ] }, t.tenant_id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-white/[0.08] pb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Cpu, { size: 18, className: "text-purple-400" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "Model & Provider Reconciliation" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400", children: "Match against Google Cloud & OpenAI invoice line items" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-neutral-500", children: [
            model_breakdown.length,
            " models utilized"
          ] })
        ] }),
        !model_breakdown || model_breakdown.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-neutral-500 text-xs italic", children: "No model activity logged in the selected period." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider text-left", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Provider" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Model" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Calls" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Prompt Tokens" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Output Tokens" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Avg Latency" }),
            /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Estimated Cost (USD)" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/[0.04]", children: model_breakdown.map((m) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-bold text-white capitalize", children: m.provider }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-[#0BAA8F] font-bold", children: m.model }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-white", children: (m.total_calls || 0).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-400", children: (m.total_prompt_tokens || 0).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-400", children: (m.total_output_tokens || 0).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-neutral-400", children: m.avg_latency_ms ? `${m.avg_latency_ms} ms` : "—" }),
            /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-right font-mono font-bold text-white text-sm", children: [
              "$",
              (m.cost_usd || 0).toFixed(4)
            ] })
          ] }, `${m.provider}-${m.model}`)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  PlatformAiUsageIndex as default
};
