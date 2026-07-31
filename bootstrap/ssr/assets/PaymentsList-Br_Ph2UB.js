import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import axios from "axios";
import { Head, router, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Calendar, Search, Plus, RefreshCw, ChevronUp, ChevronDown, Building2, CreditCard, Banknote } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
const formatCurrency = (val, store) => getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val || 0));
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const MethodIcon = ({ method }) => {
  const m = (method || "").toLowerCase();
  if (m === "bank") return /* @__PURE__ */ jsx(Building2, { size: 12 });
  if (m === "card") return /* @__PURE__ */ jsx(CreditCard, { size: 12 });
  return /* @__PURE__ */ jsx(Banknote, { size: 12 });
};
const SortBtn = ({ label, sortKey, current, onSort }) => /* @__PURE__ */ jsxs(
  "button",
  {
    onClick: () => onSort(sortKey),
    className: "flex items-center gap-1 text-xs font-bold text-slate-500 uppercase hover:text-slate-800 dark:hover:text-white transition-colors",
    children: [
      label,
      current.key === sortKey ? current.dir === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 11 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 11 }) : /* @__PURE__ */ jsx("span", { className: "w-3" })
    ]
  }
);
function PaymentRow({ item, type, store }) {
  const isIn = type === "in";
  return /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0", children: [
    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs font-semibold text-slate-500 tabular-nums whitespace-nowrap", children: formatDate(item.date || item.created_at) }),
    /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isIn ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"}`, children: (item.party?.name || "G")[0].toUpperCase() }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white truncate", children: item.party?.name || /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic", children: "No party" }) }),
        item.reference && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded", children: item.reference })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase", children: [
      /* @__PURE__ */ jsx(MethodIcon, { method: item.method }),
      item.method || "—"
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate", children: item.notes || "—" }),
    /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsxs("span", { className: `text-sm font-black tabular-nums ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`, children: [
      isIn ? "+" : "−",
      " ",
      formatCurrency(item.amount)
    ] }) })
  ] });
}
function PaymentPanel({ type, payments, sort, onSort, loading, observerRef, stats, store }) {
  const isIn = type === "in";
  const accent = isIn ? { bg: "bg-emerald-600", light: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/40" } : { bg: "bg-rose-600", light: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800/40" };
  const sorted = [...payments].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "amount") return (parseFloat(a.amount) - parseFloat(b.amount)) * dir;
    if (sort.key === "date") return ((a.date || "") > (b.date || "") ? 1 : -1) * dir;
    return ((a.party?.name || "") > (b.party?.name || "") ? 1 : -1) * dir;
  });
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-0 flex-1", children: [
    /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between px-4 py-3 border-b ${accent.border} ${accent.light}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${accent.bg} text-white`, children: isIn ? /* @__PURE__ */ jsx(ArrowDownCircle, { size: 14 }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 14 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white", children: isIn ? "Payment In" : "Payment Out" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500", children: isIn ? "Money received" : "Money sent" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("p", { className: `text-lg font-black tabular-nums ${accent.text}`, children: formatCurrency(stats?.total || 0) }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
          payments.length,
          " records · Today: ",
          formatCurrency(stats?.today || 0)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsxs(
      Link,
      {
        href: isIn ? route("store.payments.in", { store_slug: store.slug }) : route("store.payments.out", { store_slug: store.slug }),
        className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 ${accent.bg}`,
        children: [
          /* @__PURE__ */ jsx(Plus, { size: 13 }),
          "Record ",
          isIn ? "Payment In" : "Payment Out"
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-auto flex-1 min-h-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
      /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsx(SortBtn, { label: "Date", sortKey: "date", current: sort, onSort }) }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsx(SortBtn, { label: "Party", sortKey: "party", current: sort, onSort }) }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-xs font-bold text-slate-500 uppercase", children: "Method" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-xs font-bold text-slate-500 uppercase", children: "Notes" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-right", children: /* @__PURE__ */ jsx(SortBtn, { label: "Amount", sortKey: "amount", current: sort, onSort }) })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        sorted.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 5, className: "py-16 text-center text-slate-400", children: [
          /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-full ${accent.light} flex items-center justify-center mx-auto mb-3`, children: isIn ? /* @__PURE__ */ jsx(ArrowDownCircle, { size: 22, className: accent.text }) : /* @__PURE__ */ jsx(ArrowUpCircle, { size: 22, className: accent.text }) }),
          /* @__PURE__ */ jsxs("p", { className: "font-bold text-slate-500 dark:text-slate-400 text-sm", children: [
            "No ",
            isIn ? "incoming" : "outgoing",
            " payments yet"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Use the button above to record one" })
        ] }) }) : sorted.map((item) => /* @__PURE__ */ jsx(PaymentRow, { item, type, store }, item.id)),
        /* @__PURE__ */ jsx("tr", { ref: observerRef, className: "h-1", children: /* @__PURE__ */ jsx("td", { colSpan: 5, children: loading && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-2", children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: "text-slate-400 animate-spin" }) }) }) })
      ] })
    ] }) })
  ] });
}
function PaymentsIndex({ payments = {}, stats = {}, filters = {}, store }) {
  const allData = payments.data || [];
  allData.filter((p) => p.type === "in");
  allData.filter((p) => p.type === "out");
  const [search, setSearch] = useState(filters.search || "");
  const [period, setPeriod] = useState(filters.filter || "all");
  const [dateRange, setDateRange] = useState({ from: filters.from_date || "", to: filters.to_date || "" });
  const [allPayments, setAllPayments] = useState(allData);
  const [nextUrl, setNextUrl] = useState(payments.next_page_url);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerInRef = useRef(null);
  const observerOutRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [sortIn, setSortIn] = useState({ key: "date", dir: "desc" });
  const [sortOut, setSortOut] = useState({ key: "date", dir: "desc" });
  useEffect(() => {
    if (payments.data && payments.current_page === 1) {
      setAllPayments(payments.data);
      setNextUrl(payments.next_page_url);
    }
  }, [payments]);
  const fetchMore = useCallback(async () => {
    if (!nextUrl || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await axios.get(nextUrl, { headers: { Accept: "application/json" } });
      setAllPayments((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...res.data.data.filter((p) => !ids.has(p.id))];
      });
      setNextUrl(res.data.next_page_url);
    } finally {
      isLoadingRef.current = false;
      setLoadingMore(false);
    }
  }, [nextUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMore();
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    [observerInRef, observerOutRef].forEach((r) => {
      if (r.current) observer.observe(r.current);
    });
    return () => observer.disconnect();
  }, [fetchMore]);
  const applyFilters = (extra = {}) => {
    router.get(route("store.payments.index", { store_slug: store.slug }), {
      search,
      filter: period,
      from_date: dateRange.from,
      to_date: dateRange.to,
      ...extra
    }, { preserveState: true, preserveScroll: true });
  };
  const handlePeriod = (val) => {
    setPeriod(val);
    applyFilters({ filter: val });
  };
  const handleDate = (e) => {
    const newRange = { ...dateRange, [e.target.name]: e.target.value };
    setDateRange(newRange);
    if (newRange.from && newRange.to) applyFilters({ from_date: newRange.from, to_date: newRange.to, filter: "custom" });
  };
  const filteredIn = allPayments.filter((p) => p.type === "in");
  const filteredOut = allPayments.filter((p) => p.type === "out");
  const makeSort = (setter) => (key) => setter((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  const totalIn = filteredIn.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalOut = filteredOut.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const netFlow = totalIn - totalOut;
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const todayIn = filteredIn.filter((p) => (p.date || "").startsWith(today)).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const todayOut = filteredOut.filter((p) => (p.date || "").startsWith(today)).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const periods = [
    { val: "all", label: "All Time" },
    { val: "today", label: "Today" },
    { val: "month", label: "This Month" },
    { val: "custom", label: "Custom" }
  ];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Payments", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Payments — In & Out" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-2 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "payments" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600", children: /* @__PURE__ */ jsx(ArrowDownCircle, { size: 15 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Total Received" }),
              /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: formatCurrency(totalIn) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            "Today: ",
            /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-500", children: formatCurrency(todayIn) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600", children: /* @__PURE__ */ jsx(ArrowUpCircle, { size: 15 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Total Paid Out" }),
              /* @__PURE__ */ jsx("p", { className: "text-base font-black text-rose-600", children: formatCurrency(totalOut) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            "Today: ",
            /* @__PURE__ */ jsx("span", { className: "font-bold text-rose-500", children: formatCurrency(todayOut) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `px-4 py-2.5 rounded-xl border shadow-sm flex items-center justify-between ${netFlow >= 0 ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/40" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40"}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${netFlow >= 0 ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600" : "bg-amber-100 dark:bg-amber-900/50 text-amber-600"}`, children: netFlow >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { size: 15 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 15 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Net Cash Flow" }),
              /* @__PURE__ */ jsxs("p", { className: `text-base font-black tabular-nums ${netFlow >= 0 ? "text-indigo-600" : "text-amber-600"}`, children: [
                netFlow >= 0 ? "+" : "−",
                " ",
                formatCurrency(Math.abs(netFlow))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            filteredIn.length + filteredOut.length,
            " transactions"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: periods.map((p) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handlePeriod(p.val),
            className: `px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${period === p.val ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
            children: p.label
          },
          p.val
        )) }),
        period === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 animate-in fade-in", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 13, className: "text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              name: "from",
              value: dateRange.from,
              onChange: handleDate,
              className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "→" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              name: "to",
              value: dateRange.to,
              onChange: handleDate,
              className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative ml-auto", children: [
          /* @__PURE__ */ jsx(Search, { size: 13, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && applyFilters({ search }),
              placeholder: "Search party, reference...",
              className: "pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 w-52 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden", children: [
        /* @__PURE__ */ jsx(
          PaymentPanel,
          {
            type: "in",
            payments: filteredIn,
            sort: sortIn,
            onSort: makeSort(setSortIn),
            loading: loadingMore,
            observerRef: observerInRef,
            stats: { total: totalIn, today: todayIn },
            store
          }
        ),
        /* @__PURE__ */ jsx(
          PaymentPanel,
          {
            type: "out",
            payments: filteredOut,
            sort: sortOut,
            onSort: makeSort(setSortOut),
            loading: loadingMore,
            observerRef: observerOutRef,
            stats: { total: totalOut, today: todayOut },
            store
          }
        )
      ] })
    ] })
  ] });
}
export {
  PaymentsIndex as default
};
