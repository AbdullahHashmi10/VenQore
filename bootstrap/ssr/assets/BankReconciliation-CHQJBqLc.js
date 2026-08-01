import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { FileText, CheckCircle, Clock, DollarSign, Filter, Calendar, Upload, Download, ArrowUpDown, Link2, Scale } from "lucide-react";
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
function BankReconciliationIndex({
  bankAccounts = [],
  transactions = [],
  unmatchedBank = [],
  unmatchedSystem = []
}) {
  const [selectedAccount, setSelectedAccount] = useState(bankAccounts[0]?.id || "");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [viewMode, setViewMode] = useState("unmatched");
  const transactionList = useMemo(() => Array.isArray(transactions) ? transactions : transactions?.data || [], [transactions]);
  const bankList = useMemo(() => Array.isArray(unmatchedBank) ? unmatchedBank : unmatchedBank?.data || [], [unmatchedBank]);
  const systemList = useMemo(() => Array.isArray(unmatchedSystem) ? unmatchedSystem : unmatchedSystem?.data || [], [unmatchedSystem]);
  const stats = useMemo(() => {
    return {
      totalTransactions: transactionList.length,
      matched: transactionList.filter((t) => t.is_reconciled).length,
      unmatched: transactionList.filter((t) => !t.is_reconciled).length,
      difference: bankList.reduce((s, t) => s + parseFloat(t.amount || 0), 0) - systemList.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    };
  }, [transactionList, bankList, systemList]);
  const getStatusBadge = (isReconciled) => {
    if (isReconciled) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Bank Reconciliation", activeMenu: "Banking", children: [
    /* @__PURE__ */ jsx(Head, { title: "Bank Reconciliation" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "reconciliation", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Txns" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.totalTransactions })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Matched" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats.matched })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Unmatched" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats.unmatched })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${stats.difference === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`, children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Difference" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: `text-base font-black ${stats.difference === 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(stats.difference)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Bank ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Reconciliation" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5", children: ["unmatched", "matched", "all"].map((mode) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode(mode),
              className: `px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === mode ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`,
              children: mode
            },
            mode
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "select",
              {
                value: selectedAccount,
                onChange: (e) => setSelectedAccount(e.target.value),
                className: "pl-3 pr-8 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 w-40 truncate appearance-none cursor-pointer hover:bg-slate-100",
                children: bankAccounts.length === 0 ? /* @__PURE__ */ jsx("option", { value: "", children: "No Accounts" }) : bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              }
            ),
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 14, className: "text-slate-400 ml-2" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateRange.from,
                onChange: (e) => setDateRange({ ...dateRange, from: e.target.value }),
                className: "bg-transparent border-none text-xs font-bold text-slate-600 p-1 w-24 focus:ring-0"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateRange.to,
                onChange: (e) => setDateRange({ ...dateRange, to: e.target.value }),
                className: "bg-transparent border-none text-xs font-bold text-slate-600 p-1 w-24 focus:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Import Statement", children: /* @__PURE__ */ jsx(Upload, { size: 16 }) }),
          /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Export Report", children: /* @__PURE__ */ jsx(Download, { size: 16 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-hidden", children: [
        viewMode === "unmatched" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-2 h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(FileText, { size: 16 }),
                " Unmatched (Bank)"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold bg-white dark:bg-slate-800 text-blue-600 px-2 py-0.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30", children: bankList.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: bankList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-400 p-8", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 32, className: "mb-2 text-emerald-400 opacity-50" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "All bank records matched" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: bankList.map((item, idx) => /* @__PURE__ */ jsx("div", { className: "p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white text-sm truncate", children: item.description || "Transaction" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-0.5", children: item.date })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) })
            ] }) }, idx)) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(ArrowUpDown, { size: 16 }),
                " Unmatched (System)"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold bg-white dark:bg-slate-800 text-purple-600 px-2 py-0.5 rounded-md shadow-sm border border-purple-100 dark:border-purple-900/30", children: systemList.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: systemList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-400 p-8", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 32, className: "mb-2 text-emerald-400 opacity-50" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "All system records matched" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: systemList.map((item, idx) => /* @__PURE__ */ jsx("div", { className: "p-3 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer transition-colors group", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white text-sm truncate", children: item.description || item.reference || "Transaction" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-0.5", children: item.date })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: `text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) }),
                /* @__PURE__ */ jsx("button", { className: "p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded opacity-0 group-hover:opacity-100 transition-all", children: /* @__PURE__ */ jsx(Link2, { size: 14 }) })
              ] })
            ] }) }, idx)) }) })
          ] })
        ] }),
        viewMode !== "unmatched" && /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase", children: "Description" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase", children: "Reference" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: transactionList.filter((t) => viewMode === "all" || viewMode === "matched" && t.is_reconciled).length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "6", className: "px-6 py-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx(Scale, { size: 32, className: "text-slate-300 dark:text-slate-600 mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium text-sm", children: "No transactions found" })
          ] }) }) }) : transactionList.filter((t) => viewMode === "all" || viewMode === "matched" && t.is_reconciled).map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono", children: new Date(item.date).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm font-medium text-slate-800 dark:text-white", children: item.description }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-slate-500", children: item.reference || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-right font-bold", children: /* @__PURE__ */ jsx("span", { className: parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600", children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(item.is_reconciled)}`, children: item.is_reconciled ? "Matched" : "Pending" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx("button", { className: "p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all", children: /* @__PURE__ */ jsx(Link2, { size: 16 }) }) })
          ] }, item.id)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  BankReconciliationIndex as default
};
