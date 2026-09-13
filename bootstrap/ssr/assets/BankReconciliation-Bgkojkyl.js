import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-7dqO8VCJ.js";
import { FileText, CheckCircle, Clock, DollarSign, Filter, Calendar, Upload, Download, ArrowUpDown, Link2, Scale } from "lucide-react";
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
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "reconciliation", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Txns" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: stats.totalTransactions })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Matched" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: stats.matched })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Unmatched" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: stats.unmatched })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${stats.difference === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`, children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Difference" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: `text-base font-bold ${stats.difference === 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(stats.difference)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Bank ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Reconciliation" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken rounded-lg p-0.5", children: ["unmatched", "matched", "all"].map((mode) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode(mode),
              className: `px-3 py-1 text-2xs font-bold uppercase rounded-md transition-all ${viewMode === mode ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted hover:text-ink-secondary"}`,
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
                className: "pl-3 pr-8 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink w-40 truncate appearance-none cursor-pointer hover:bg-interactive-hover",
                children: bankAccounts.length === 0 ? /* @__PURE__ */ jsx("option", { value: "", children: "No Accounts" }) : bankAccounts.map((acc) => /* @__PURE__ */ jsx("option", { value: acc.id, children: acc.name }, acc.id))
              }
            ),
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-app rounded-lg p-0.5", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 14, className: "text-ink-muted ml-2" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateRange.from,
                onChange: (e) => setDateRange({ ...dateRange, from: e.target.value }),
                className: "bg-transparent border-none text-xs font-bold text-ink-secondary p-1 w-24 focus:ring-0"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-300", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dateRange.to,
                onChange: (e) => setDateRange({ ...dateRange, to: e.target.value }),
                className: "bg-transparent border-none text-xs font-bold text-ink-secondary p-1 w-24 focus:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Import Statement", children: /* @__PURE__ */ jsx(Upload, { size: 16 }) }),
          /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Export Report", children: /* @__PURE__ */ jsx(Download, { size: 16 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-hidden", children: [
        viewMode === "unmatched" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-2 h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(FileText, { size: 16 }),
                " Unmatched (Bank)"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold bg-surface text-blue-600 px-2 py-0.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30", children: bankList.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: bankList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-ink-muted p-8", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 32, className: "mb-2 text-emerald-400 opacity-50" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "All bank records matched" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: bankList.map((item, idx) => /* @__PURE__ */ jsx("div", { className: "p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink text-sm truncate", children: item.description || "Transaction" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-mono mt-0.5", children: item.date })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) })
            ] }) }, idx)) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 bg-brand-50/50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-900/30 flex justify-between items-center shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(ArrowUpDown, { size: 16 }),
                " Unmatched (System)"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold bg-surface text-brand-600 px-2 py-0.5 rounded-md shadow-sm border border-brand-100 dark:border-brand-900/30", children: systemList.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: systemList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-ink-muted p-8", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 32, className: "mb-2 text-emerald-400 opacity-50" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "All system records matched" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: systemList.map((item, idx) => /* @__PURE__ */ jsx("div", { className: "p-3 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 cursor-pointer transition-colors group", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink text-sm truncate", children: item.description || item.reference || "Transaction" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-mono mt-0.5", children: item.date })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: `text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) }),
                /* @__PURE__ */ jsx("button", { className: "p-1 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded opacity-0 group-hover:opacity-100 transition-all", children: /* @__PURE__ */ jsx(Link2, { size: 14 }) })
              ] })
            ] }) }, idx)) }) })
          ] })
        ] }),
        viewMode !== "unmatched" && /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-app backdrop-blur z-10 border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase", children: "Description" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase", children: "Reference" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase text-right", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-xs font-bold text-ink-muted uppercase text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: transactionList.filter((t) => viewMode === "all" || viewMode === "matched" && t.is_reconciled).length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "6", className: "px-6 py-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx(Scale, { size: 32, className: "text-neutral-300 dark:text-ink-secondary mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-medium text-sm", children: "No transactions found" })
          ] }) }) }) : transactionList.filter((t) => viewMode === "all" || viewMode === "matched" && t.is_reconciled).map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-ink-secondary font-mono", children: new Date(item.date).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm font-medium text-ink", children: item.description }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-ink-muted", children: item.reference || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-right font-bold", children: /* @__PURE__ */ jsx("span", { className: parseFloat(item.amount) >= 0 ? "text-emerald-600" : "text-rose-600", children: formatCurrency(Math.abs(parseFloat(item.amount || 0))) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-2xs font-bold uppercase ${getStatusBadge(item.is_reconciled)}`, children: item.is_reconciled ? "Matched" : "Pending" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsx("button", { className: "p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all", children: /* @__PURE__ */ jsx(Link2, { size: 16 }) }) })
          ] }, item.id)) })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  BankReconciliationIndex as default
};
