import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { Scale, Calendar, Download, CheckCircle2, AlertTriangle, ShieldCheck, Landmark, TrendingUp } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./OneGlanceLayout-C-94hBqK.js";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function SectionCard({ title, icon: Icon, accounts = [], total, colorClass, totalColorClass }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
    /* @__PURE__ */ jsx("div", { className: `p-6 border-b border-slate-100 dark:border-slate-800 ${colorClass}`, children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Icon, { size: 20 }),
      title
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "divide-y divide-slate-50 dark:divide-slate-800/60", children: [
      accounts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "p-6 text-sm text-slate-400 italic text-center", children: "No activity as of this date." }) : accounts.map((account) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-400 w-12 shrink-0", children: account.code }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: account.name })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-white tabular-nums", children: formatCurrency(account.balance) })
          ]
        },
        account.id
      )),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest", children: [
          "Total ",
          title
        ] }),
        /* @__PURE__ */ jsx("span", { className: `text-lg font-black tabular-nums ${totalColorClass}`, children: formatCurrency(total) })
      ] })
    ] })
  ] });
}
function BalanceSheet({
  assets = { accounts: [], total: 0 },
  liabilities = { accounts: [], total: 0 },
  equity = { accounts: [], total: 0 },
  total_assets = 0,
  total_liabilities = 0,
  total_equity = 0,
  is_balanced = true,
  as_of = ""
}) {
  const { store } = usePage().props;
  const [dateInput, setDateInput] = useState(as_of);
  const equationDiff = Math.abs(total_assets - (total_liabilities + total_equity));
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Balance Sheet", children: [
    /* @__PURE__ */ jsx(Head, { title: "Balance Sheet" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-5 p-6 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Balance Sheet",
          subtitle: `Financial position as of ${as_of}`,
          icon: Scale,
          breadcrumbs: [
            { label: "Money" },
            { label: "Accounting" },
            { label: "Balance Sheet" }
          ],
          actions: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800\n                                            border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-slate-400 shrink-0" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: dateInput,
                  max: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                  onChange: (e) => setDateInput(e.target.value),
                  onBlur: () => router.get(route("store.accounting.balance-sheet", { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true }),
                  onKeyDown: (e) => e.key === "Enter" && router.get(route("store.accounting.balance-sheet", { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true }),
                  title: "As-of date — all balances computed up to and including this date",
                  className: "text-sm bg-transparent text-slate-800 dark:text-slate-200\n                                               outline-none cursor-pointer"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800\n                                               border border-slate-200 dark:border-slate-700 rounded-xl font-bold\n                                               text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm", children: [
              /* @__PURE__ */ jsx(Download, { size: 18 }),
              " Export PDF"
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-6", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `flex items-start gap-3 px-5 py-4 rounded-2xl border
                        ${is_balanced ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"}`,
            children: [
              is_balanced ? /* @__PURE__ */ jsx(CheckCircle2, { size: 20, className: "shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 20, className: "shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold", children: is_balanced ? "Books are Balanced — Assets = Liabilities + Equity" : `BOOKS ARE UNBALANCED — difference of ${formatCurrency(equationDiff)}` }),
                /* @__PURE__ */ jsx("p", { className: "text-sm opacity-75 mt-0.5", children: is_balanced ? `All journal entries are correctly double-posted. As of ${as_of}.` : `One or more journal entries have a DR/CR mismatch. Immediate investigation required. As of ${as_of}.` })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20\n                                    flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "text-center md:text-left relative z-10", children: [
            /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2", children: "Total Assets" }),
            /* @__PURE__ */ jsx("h3", { className: "text-4xl font-black tabular-nums", children: formatCurrency(total_assets) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-light text-indigo-300 hidden md:block", children: "=" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-10 text-center md:text-right relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2", children: "Liabilities" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tabular-nums", children: formatCurrency(total_liabilities) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-light text-indigo-300 self-end pb-1", children: "+" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2", children: "Equity" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tabular-nums", children: formatCurrency(total_equity) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsx(
            SectionCard,
            {
              title: "Assets",
              icon: ShieldCheck,
              accounts: assets.accounts,
              total: total_assets,
              colorClass: "bg-blue-50/40 dark:bg-blue-900/5 text-blue-700 dark:text-blue-400",
              totalColorClass: "text-blue-600 dark:text-blue-400"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx(
              SectionCard,
              {
                title: "Liabilities",
                icon: Landmark,
                accounts: liabilities.accounts,
                total: total_liabilities,
                colorClass: "bg-rose-50/40 dark:bg-rose-900/5 text-rose-700 dark:text-rose-400",
                totalColorClass: "text-rose-600 dark:text-rose-400"
              }
            ),
            /* @__PURE__ */ jsx(
              SectionCard,
              {
                title: "Equity",
                icon: TrendingUp,
                accounts: equity.accounts,
                total: total_equity,
                colorClass: "bg-indigo-50/40 dark:bg-indigo-900/5 text-indigo-700 dark:text-indigo-400",
                totalColorClass: "text-indigo-600 dark:text-indigo-400"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  BalanceSheet as default
};
