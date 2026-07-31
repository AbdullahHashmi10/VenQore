import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { Briefcase, ArrowDownCircle, TrendingUp, ArrowUpCircle, Search, Plus, FileText, Eye, BookOpen, PieChart } from "lucide-react";
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
function ChartOfAccounts({ accounts = [] }) {
  const { store } = usePage().props;
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "code", direction: "asc" });
  const stats = useMemo(() => {
    return {
      assets: accounts.filter((a) => a.type === "asset").reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
      liabilities: accounts.filter((a) => a.type === "liability").reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
      income: accounts.filter((a) => a.type === "income").reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
      expenses: accounts.filter((a) => a.type === "expense").reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0)
    };
  }, [accounts]);
  const processedAccounts = useMemo(() => {
    let result = accounts.filter(
      (item) => (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase())) && (typeFilter === "all" || item.type === typeFilter)
    );
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === "balance") {
        valA = parseFloat(a.balance || 0);
        valB = parseFloat(b.balance || 0);
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [accounts, searchTerm, typeFilter, sortConfig]);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  const getTypeConfig = (type) => {
    const configs = {
      asset: { label: "Asset", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Briefcase },
      liability: { label: "Liability", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: ArrowDownCircle },
      equity: { label: "Equity", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: PieChart },
      income: { label: "Income", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: TrendingUp },
      expense: { label: "Expense", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: ArrowUpCircle }
    };
    return configs[type] || { label: type, color: "bg-slate-100 text-slate-700", icon: BookOpen };
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Chart of Accounts", children: [
    /* @__PURE__ */ jsx(Head, { title: "COA" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Briefcase, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Assets" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-indigo-600", children: formatCurrency(stats.assets) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowDownCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Liabilities" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-rose-600", children: formatCurrency(stats.liabilities) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Income (YTD)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-emerald-600", children: formatCurrency(stats.income) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowUpCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Expense (YTD)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-amber-600", children: formatCurrency(stats.expenses) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-hide", children: ["all", "asset", "liability", "equity", "income", "expense"].map((type) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setTypeFilter(type),
            className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${typeFilter === type ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
            children: type
          },
          type
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search accounts...",
                className: "pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-48"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm", children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            " New Account"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx("th", { onClick: () => handleSort("code"), className: "p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800", children: "Code" }),
          /* @__PURE__ */ jsx("th", { onClick: () => handleSort("name"), className: "p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800", children: "Account Name" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Type" }),
          /* @__PURE__ */ jsx("th", { onClick: () => handleSort("balance"), className: "p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800", children: "Balance" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: processedAccounts.length > 0 ? processedAccounts.map((account) => {
          const typeConfig = getTypeConfig(account.type);
          const Icon = typeConfig.icon;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group", children: [
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded", children: account.code }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: account.name }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeConfig.color}`, children: [
              /* @__PURE__ */ jsx(Icon, { size: 10 }),
              typeConfig.label
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-bold text-slate-800 dark:text-white", children: formatCurrency(account.balance) }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600", title: "View Ledger", children: /* @__PURE__ */ jsx(FileText, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600", title: "Edit", children: /* @__PURE__ */ jsx(Eye, { size: 14 }) })
            ] }) })
          ] }, account.id);
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-12 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsx(BookOpen, { size: 24, className: "opacity-50" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "No accounts found" })
        ] }) }) }) })
      ] }) })
    ] })
  ] });
}
export {
  ChartOfAccounts as default
};
