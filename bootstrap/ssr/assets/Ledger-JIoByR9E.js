import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-Xp8OjljE.js";
import { ChevronDown, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Search, Filter, Download, Printer, FileText, TrendingDown } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function PartyLedger({ party = {}, transactions = [], stats = {} }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [transactionType, setTransactionType] = useState("all");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { store } = usePage().props;
  const getTypeStyle = (type) => {
    const types = {
      sale: { label: "Sale", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: TrendingUp },
      purchase: { label: "Purchase", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingDown },
      payment_in: { label: "Received", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: ArrowDownCircle },
      payment_out: { label: "Paid", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpCircle },
      opening: { label: "Opening", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: Wallet },
      return: { label: "Return", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: ArrowUpCircle }
    };
    return types[type] || types.opening;
  };
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = !searchTerm || t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = transactionType === "all" || t.type === transactionType;
      const matchesDate = (!dateRange.start || t.date >= dateRange.start) && (!dateRange.end || t.date <= dateRange.end);
      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, transactionType, dateRange]);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Ledger - ${party.name}`, activeMenu: "Contacts", children: [
    /* @__PURE__ */ jsx(Head, { title: `Ledger - ${party.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "ledgers" }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1 text-2xs font-bold text-slate-500 uppercase shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-slate-500 truncate", children: /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
          "Net: ",
          formatCurrency(stats.final_balance || 0, store)
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? "grid" : "hidden sm:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Opening" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-slate-700 dark:text-slate-300 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.opening_balance, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(ArrowDownCircle, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Credits" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-emerald-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.total_credit, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(ArrowUpCircle, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Debits" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-red-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.total_debit, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Net Balance" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-left mt-1 sm:mt-0", children: /* @__PURE__ */ jsx("p", { className: `text-sm sm:text-base md:text-lg font-black leading-none ${stats.final_balance > 0 ? "text-emerald-600" : stats.final_balance < 0 ? "text-red-600" : "text-slate-500"}`, children: formatCurrency(Math.abs(stats.final_balance || 0), store) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[120px]", children: party.name }),
              /* @__PURE__ */ jsx("span", { className: `px-1.5 py-0.5 text-4xs font-bold uppercase rounded-full ${party.type === "customer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`, children: party.type })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs text-slate-400 font-mono mt-0.5", children: party.phone || "No Phone" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-1.5 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-1.5 rounded-lg transition-colors ${showMobileFilters ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Filter Type",
                children: /* @__PURE__ */ jsx(Filter, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-0.5 gap-0.5", children: [
              /* @__PURE__ */ jsx("button", { className: "p-1 text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "p-1 text-slate-500", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 14 }) })
            ] })
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: "Search Ref or Desc...",
              className: "w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 12 })
        ] }) }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase tracking-wider shrink-0", children: "Type:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: transactionType,
              onChange: (e) => {
                setTransactionType(e.target.value);
                setShowMobileFilters(false);
              },
              className: "flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1.5 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All Types" }),
                /* @__PURE__ */ jsx("option", { value: "sale", children: "Sales" }),
                /* @__PURE__ */ jsx("option", { value: "purchase", children: "Purchases" }),
                /* @__PURE__ */ jsx("option", { value: "payment_in", children: "Received" }),
                /* @__PURE__ */ jsx("option", { value: "payment_out", children: "Paid" })
              ]
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 flex-wrap", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight", children: [
              party.name,
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Ledger" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 text-2xs font-bold uppercase rounded-full ${party.type === "customer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`, children: party.type })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-500 font-medium", children: [
            party.phone || "No Phone",
            " • ",
            party.email || "No Email"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: transactionType,
              onChange: (e) => setTransactionType(e.target.value),
              className: "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-0 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All Types" }),
                /* @__PURE__ */ jsx("option", { value: "sale", children: "Sales" }),
                /* @__PURE__ */ jsx("option", { value: "purchase", children: "Purchases" }),
                /* @__PURE__ */ jsx("option", { value: "payment_in", children: "Received" }),
                /* @__PURE__ */ jsx("option", { value: "payment_out", children: "Paid" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Ref #",
                className: "pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-28"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Type" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Reference" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right", children: "You Gave" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right", children: "You Received" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right", children: "Balance" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredTransactions.length > 0 ? filteredTransactions.map((t, index) => {
            const typeStyle = getTypeStyle(t.type);
            const TypeIcon = typeStyle.icon;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap", children: new Date(t.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${typeStyle.color}`, children: [
                /* @__PURE__ */ jsx(TypeIcon, { size: 10 }),
                typeStyle.label
              ] }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-800 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer", children: t.reference || "-" }),
                t.description && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 truncate max-w-[200px]", children: t.description })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: t.debit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-red-600 dark:text-red-400", children: formatCurrency(t.debit, store) }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "-" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: t.credit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(t.credit, store) }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "-" }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-right", children: [
                /* @__PURE__ */ jsx("span", { className: `text-xs font-mono font-black ${t.balance > 0 ? "text-emerald-600 dark:text-emerald-400" : t.balance < 0 ? "text-red-600 dark:text-red-400" : "text-slate-500"}`, children: formatCurrency(Math.abs(t.balance), store) }),
                t.balance !== 0 && /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold ml-1 uppercase ${t.balance > 0 ? "text-emerald-600" : "text-red-600"}`, children: t.balance > 0 ? "To Receive" : "To Pay" })
              ] })
            ] }, index);
          }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { size: 24, className: "opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "No transactions found" })
          ] }) }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "block sm:hidden divide-y divide-slate-100 dark:divide-slate-800", children: filteredTransactions.length > 0 ? filteredTransactions.map((t, index) => {
          const typeStyle = getTypeStyle(t.type);
          const TypeIcon = typeStyle.icon;
          return /* @__PURE__ */ jsxs("div", { className: "p-3 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-500 font-medium font-mono", children: new Date(t.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) }),
              /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${typeStyle.color}`, children: [
                /* @__PURE__ */ jsx(TypeIcon, { size: 8 }),
                typeStyle.label
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-800 dark:text-white break-all", children: t.reference || "-" }),
              t.description && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-0.5", children: t.description })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-1xs pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800/60 mt-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                t.debit > 0 && /* @__PURE__ */ jsxs("span", { className: "text-red-600 dark:text-red-400 font-mono font-bold", children: [
                  "Gave: ",
                  formatCurrency(t.debit, store)
                ] }),
                t.credit > 0 && /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400 font-mono font-bold", children: [
                  "Rec: ",
                  formatCurrency(t.credit, store)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("span", { className: `font-black font-mono ${t.balance > 0 ? "text-emerald-600" : t.balance < 0 ? "text-red-600" : "text-slate-500"}`, children: formatCurrency(Math.abs(t.balance), store) }),
                t.balance !== 0 && /* @__PURE__ */ jsx("span", { className: `text-4xs font-bold ml-0.5 uppercase ${t.balance > 0 ? "text-emerald-600" : "text-red-600"}`, children: t.balance > 0 ? "Rec" : "Pay" })
              ] })
            ] })
          ] }, index);
        }) : /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-slate-400 text-xs", children: [
          /* @__PURE__ */ jsx(FileText, { size: 20, className: "mx-auto mb-1.5 opacity-50" }),
          "No transactions found"
        ] }) })
      ] })
    ] })
  ] });
}
export {
  PartyLedger as default
};
