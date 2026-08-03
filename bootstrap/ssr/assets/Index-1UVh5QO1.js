import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-CbpSfCJ6.js";
import { Ticket, Plus, Upload, Download, Trash2, Search, Filter, CheckCircle, AlertCircle, ExternalLink, RefreshCcw } from "lucide-react";
import "./PlatformLayout-CFRlnfbA.js";
import "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-CLtSftB2.js";
function AppSumoIndex({ codes, filters, stats }) {
  const { data, setData, post, delete: destroy, processing, reset } = useForm({
    count: 100,
    tier: "Tier 1",
    codes: ""
    // for import
  });
  const [showGenerate, setShowGenerate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const handleGenerate = (e) => {
    e.preventDefault();
    post(route("platform.appsumo.generate"), {
      onSuccess: () => {
        setShowGenerate(false);
        reset("count");
      }
    });
  };
  const handleImport = (e) => {
    e.preventDefault();
    post(route("platform.appsumo.import"), {
      onSuccess: () => {
        setShowImport(false);
        reset("codes");
      }
    });
  };
  const handlePurge = () => {
    const passcode = prompt("Enter your action passcode to confirm purging unredeemed codes:");
    if (passcode) {
      destroy(route("platform.appsumo.purge"), {
        data: { passcode }
      });
    }
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "AppSumo Code Bank", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "AppSumo Code Bank" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Ticket, { className: "text-indigo-400" }),
            "AppSumo Code Bank"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1", children: "Manage one-time redemption codes for the AppSumo LTD campaign." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowGenerate(true),
              className: "bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 16 }),
                " Bulk Generate"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowImport(true),
              className: "bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-300 dark:border-white/10 flex items-center gap-2 transition-all",
              children: [
                /* @__PURE__ */ jsx(Upload, { size: 16 }),
                " Import CSV"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: route("platform.appsumo.export"),
              className: "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/20 flex items-center gap-2 transition-all",
              children: [
                /* @__PURE__ */ jsx(Download, { size: 16 }),
                " Export CSV"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handlePurge,
              className: "bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 flex items-center gap-2 transition-all",
              children: [
                /* @__PURE__ */ jsx(Trash2, { size: 16 }),
                " Clear Unused"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs font-bold uppercase tracking-widest mb-1", children: "Total Codes" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-slate-900 dark:text-white", children: stats.total.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-emerald-500/60 text-xs font-bold uppercase tracking-widest mb-1", children: "Available" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-emerald-400", children: stats.available.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-indigo-500/60 text-xs font-bold uppercase tracking-widest mb-1", children: "Redeemed" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-indigo-400", children: stats.redeemed.toLocaleString() })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-white/10 flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search by code or email...",
                className: "w-full bg-white/5 border-white/10 rounded-xl pl-10 text-sm text-white focus:ring-indigo-500",
                onKeyUp: (e) => {
                  if (e.key === "Enter") {
                    window.location.href = route("platform.appsumo.index", { search: e.target.value });
                  }
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { size: 16, className: "text-slate-500" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                className: "bg-white/5 border-white/10 rounded-xl text-sm text-white focus:ring-indigo-500 py-1.5",
                onChange: (e) => window.location.href = route("platform.appsumo.index", { status: e.target.value }),
                defaultValue: filters.status || "",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "All Statuses" }),
                  /* @__PURE__ */ jsx("option", { value: "available", children: "Available" }),
                  /* @__PURE__ */ jsx("option", { value: "redeemed", children: "Redeemed" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-white/5 text-2xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Redemption Code" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Plan Tier" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Store Link" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Added" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-white/5", children: codes.data.length > 0 ? codes.data.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("code", { className: "text-slate-900 dark:text-white font-mono font-bold bg-slate-200 dark:bg-white/10 px-2 py-1 rounded text-sm", children: item.code }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300 text-sm", children: item.plan_tier }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: item.is_redeemed ? /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-emerald-400 text-xs font-bold", children: [
                /* @__PURE__ */ jsx(CheckCircle, { size: 12 }),
                " Redeemed"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 break-all", children: item.redeemed_by_email })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-slate-500 text-xs font-bold", children: [
              /* @__PURE__ */ jsx(AlertCircle, { size: 12 }),
              " Available"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: item.tenant ? /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.dashboard", { store_slug: item.tenant.slug }),
                className: "text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1",
                children: [
                  item.tenant.name,
                  /* @__PURE__ */ jsx(ExternalLink, { size: 12 })
                ]
              }
            ) : "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-500 text-right", children: new Date(item.created_at).toLocaleDateString() })
          ] }, item.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-slate-500", children: [
            /* @__PURE__ */ jsx(Ticket, { size: 48, className: "opacity-20" }),
            /* @__PURE__ */ jsx("p", { children: "No codes found. Generate some above!" })
          ] }) }) }) })
        ] }) })
      ] }),
      showGenerate && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/60 dark:bg-void-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Plus, { className: "text-indigo-400" }),
          "Bulk Generate Codes"
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleGenerate, className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-widest text-slate-500 mb-2", children: "Count (Max 1,000)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: data.count,
                onChange: (e) => setData("count", e.target.value),
                className: "w-full bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-5 py-3 focus:ring-indigo-500",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-widest text-slate-500 mb-2", children: "Plan Tier" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.tier,
                onChange: (e) => setData("tier", e.target.value),
                className: "w-full bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-5 py-3 focus:ring-indigo-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "Tier 1", children: "Tier 1 (Single Store)" }),
                  /* @__PURE__ */ jsx("option", { value: "Tier 2", children: "Tier 2 (3 Stores)" }),
                  /* @__PURE__ */ jsx("option", { value: "Tier 3", children: "Tier 3 (10 Stores)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-4", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowGenerate(false),
                className: "flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2",
                children: processing ? /* @__PURE__ */ jsx(RefreshCcw, { className: "animate-spin", size: 16 }) : "Generate Now"
              }
            )
          ] })
        ] })
      ] }) }),
      showImport && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-void-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black text-white mb-6 flex items-center gap-3 text-glow", children: [
          /* @__PURE__ */ jsx(Upload, { className: "text-emerald-400" }),
          "Import External Codes"
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleImport, className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-widest text-slate-500 mb-2", children: "Codes (Paste comma or newline separated)" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: "8",
                placeholder: "CODE-123, CODE-456...",
                value: data.codes,
                onChange: (e) => setData("codes", e.target.value),
                className: "w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500 font-mono text-sm",
                autoFocus: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-widest text-slate-500 mb-2", children: "Assign to Plan Tier" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.tier,
                onChange: (e) => setData("tier", e.target.value),
                className: "w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "Tier 1", children: "Tier 1 (Single Store)" }),
                  /* @__PURE__ */ jsx("option", { value: "Tier 2", children: "Tier 2 (3 Stores)" }),
                  /* @__PURE__ */ jsx("option", { value: "Tier 3", children: "Tier 3 (10 Stores)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-4", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowImport(false),
                className: "flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2",
                children: processing ? /* @__PURE__ */ jsx(RefreshCcw, { className: "animate-spin", size: 16 }) : "Start Import"
              }
            )
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AppSumoIndex as default
};
