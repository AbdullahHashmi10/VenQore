import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { usePage, Head } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { PieChart, Download, TrendingUp, TrendingDown } from "lucide-react";
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
          actions: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm", children: [
            /* @__PURE__ */ jsx(Download, { size: 18 }),
            " Export PDF"
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "overflow-y-auto custom-scrollbar flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: `mb-8 p-8 rounded-3xl border ${netProfit >= 0 ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" : "bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30"} flex flex-col md:flex-row justify-between items-center gap-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: `p-4 rounded-2xl ${netProfit >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"} shadow-lg`, children: netProfit >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { size: 32 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 32 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: `text-sm font-bold uppercase tracking-widest ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: "Net Profit" }),
              /* @__PURE__ */ jsxs("h3", { className: `text-4xl font-black ${netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`, children: [
                getCurrencySymbol(),
                " ",
                netProfit.toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-8 text-right", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Total Income" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-slate-700 dark:text-slate-300", children: [
                getCurrencySymbol(),
                " ",
                totalIncome.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-px h-10 bg-slate-200 dark:bg-slate-700" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Total Expenses" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-slate-700 dark:text-slate-300", children: [
                getCurrencySymbol(),
                " ",
                totalExpense.toLocaleString()
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/5", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 20 }),
              "Operating Income"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-slate-50 dark:divide-slate-800", children: [
              incomeAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: account.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-slate-900 dark:text-white", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(account.balance).toLocaleString()
                ] })
              ] }, account.id)),
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest", children: "Total Income" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-black text-emerald-600", children: [
                  getCurrencySymbol(),
                  " ",
                  totalIncome.toLocaleString()
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-900/5", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingDown, { size: 20 }),
              "Operating Expenses"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-slate-50 dark:divide-slate-800", children: [
              expenseAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: account.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-slate-900 dark:text-white", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(account.balance).toLocaleString()
                ] })
              ] }, account.id)),
              /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest", children: "Total Expenses" }),
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-black text-rose-600", children: [
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
