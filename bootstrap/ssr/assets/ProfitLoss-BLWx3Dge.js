import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { g as getCurrencySymbol } from "./format-131Nyq79.js";
import { usePage, Head } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { PieChart, Download, TrendingUp, TrendingDown } from "lucide-react";
import "./OneGlanceLayout-D0x15wPs.js";
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
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function ProfitLoss({ incomeAccounts, expenseAccounts, totalIncome, totalExpense, netProfit }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Profit & Loss Statement", children: [
    /* @__PURE__ */ jsx(Head, { title: "Profit & Loss" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 p-6 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Profit & Loss",
          subtitle: "Income and expenses summary",
          icon: PieChart,
          breadcrumbs: [
            { label: "Money" },
            { label: "Accounting" },
            { label: "Profit & Loss" }
          ],
          actions: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-xl font-bold text-ink-secondary hover:bg-interactive-hover transition-all shadow-sm", children: [
            /* @__PURE__ */ jsx(Download, { size: 18 }),
            " Export PDF"
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "overflow-y-auto custom-scrollbar flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: `mb-8 p-8 rounded-2xl border ${netProfit >= 0 ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" : "bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30"} flex flex-col md:flex-row justify-between items-center gap-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: `p-4 rounded-2xl ${netProfit >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"} shadow-lg`, children: netProfit >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { size: 32 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 32 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: `text-sm font-bold uppercase tracking-widest ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: "Net Profit" }),
              /* @__PURE__ */ jsxs("h3", { className: `text-4xl font-bold ${netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`, children: [
                getCurrencySymbol(),
                " ",
                netProfit.toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-8 text-right", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Total Income" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-ink-secondary", children: [
                getCurrencySymbol(),
                " ",
                totalIncome.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-px h-10 bg-sunken" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Total Expenses" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-ink-secondary", children: [
                getCurrencySymbol(),
                " ",
                totalExpense.toLocaleString()
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line bg-emerald-50/30 dark:bg-emerald-900/5", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 20 }),
              "Operating Income"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
              incomeAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex justify-between items-center hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-secondary", children: account.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-ink", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(account.balance).toLocaleString()
                ] })
              ] }, account.id)),
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-app flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink uppercase tracking-widest", children: "Total Income" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-emerald-600", children: [
                  getCurrencySymbol(),
                  " ",
                  totalIncome.toLocaleString()
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line bg-rose-50/30 dark:bg-rose-900/5", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingDown, { size: 20 }),
              "Operating Expenses"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
              expenseAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex justify-between items-center hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-secondary", children: account.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-ink", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(account.balance).toLocaleString()
                ] })
              ] }, account.id)),
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-app flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink uppercase tracking-widest", children: "Total Expenses" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-rose-600", children: [
                  getCurrencySymbol(),
                  " ",
                  totalExpense.toLocaleString()
                ] })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ProfitLoss as default
};
