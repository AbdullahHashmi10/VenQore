import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import axios from "axios";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { ArrowLeft, FileText, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function BankAccountTransactions({ bankAccount, transactions }) {
  const { store } = usePage().props;
  const [allTransactions, setAllTransactions] = useState(transactions.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  const loadMore = useCallback(async () => {
    if (!nextPageUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axios.get(nextPageUrl, { headers: { Accept: "application/json" } });
      setAllTransactions((prev) => [...prev, ...res.data.data]);
      setNextPageUrl(res.data.next_page_url);
    } catch (e) {
      console.error("Failed to load more transactions", e);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageUrl, loadingMore]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageUrl && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [nextPageUrl, loadMore, loadingMore]);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  const getTypeConfig = (type) => {
    const configs = {
      credit: { label: "Credit", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", icon: ArrowDownCircle },
      debit: { label: "Debit", color: "text-red-600 bg-red-50 dark:bg-red-900/20", icon: ArrowUpCircle }
    };
    return configs[type] || { label: type, color: "text-slate-600", icon: FileText };
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Bank Transactions", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: `${bankAccount?.name || "Bank"} Transactions` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "bank-accounts" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.bank-accounts.index", { store_slug: store.slug }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18, className: "text-slate-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight", children: bankAccount?.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-500 uppercase", children: [
              bankAccount?.bank_name,
              " • ",
              bankAccount?.account_number
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Current Balance" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-indigo-600", children: formatCurrency(bankAccount?.current_balance) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
          allTransactions.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-12 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { size: 32, className: "opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No transactions found for this account" })
          ] }) }) }) : allTransactions.map((row) => {
            const config = getTypeConfig(row.type);
            const Icon = config.icon;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap", children: formatDate(row.date) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-600 dark:text-slate-400 font-medium", children: row.description }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-mono font-bold text-slate-500", children: row.ref || "-" }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold uppercase ${config.color}`, children: [
                /* @__PURE__ */ jsx(Icon, { size: 12 }),
                config.label
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("span", { className: `text-sm font-black font-mono ${row.type === "credit" ? "text-emerald-600" : "text-red-600"}`, children: [
                row.type === "credit" ? "+" : "-",
                formatCurrency(row.amount)
              ] }) })
            ] }, `${row.source}-${row.id}`);
          }),
          /* @__PURE__ */ jsx("tr", { ref: observerTarget, children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-4 p-0" }) }),
          loadingMore && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-slate-400", children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Loading more..." })
          ] }) }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  BankAccountTransactions as default
};
