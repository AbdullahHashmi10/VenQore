import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-jV-75rTJ.js";
import { ChevronDown, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Search, Filter, Download, Printer, FileText, TrendingDown } from "lucide-react";
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
function PartyLedger({ party = {}, transactions = [], stats = {} }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [transactionType, setTransactionType] = useState("all");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { store } = usePage().props;
  const isOverdue = party.type === "customer" && party.credit_limit && parseFloat(party.current_balance || 0) > parseFloat(party.credit_limit);
  const getTypeStyle = (type) => {
    const types = {
      sale: { label: "Sale", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: TrendingUp },
      purchase: { label: "Purchase", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingDown },
      payment_in: { label: "Received", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: ArrowDownCircle },
      payment_out: { label: "Paid", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpCircle },
      opening: { label: "Opening", color: "bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted", icon: Wallet },
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
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "ledgers" }),
      isOverdue && /* @__PURE__ */ jsx("div", { className: "bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 p-3 rounded-xl flex items-center justify-between shrink-0 mb-1", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-rose-800 dark:text-rose-400", children: [
        /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
          /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" }),
          /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-rose-500" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold uppercase", children: [
          "Credit Limit Exceeded: ",
          formatCurrency(party.current_balance, store),
          " / Limit: ",
          formatCurrency(party.credit_limit, store)
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1 text-2xs font-bold text-ink-muted uppercase shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-normal ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-ink-muted truncate", children: /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
          "Net: ",
          formatCurrency(stats.final_balance || 0, store)
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? "grid" : "hidden sm:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-sunken text-ink-secondary rounded-lg shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate", children: "Opening" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-bold text-ink-secondary leading-none mt-1 sm:mt-0", children: formatCurrency(stats.opening_balance, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(ArrowDownCircle, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate", children: "Credits" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-bold text-emerald-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.total_credit, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(ArrowUpCircle, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate", children: "Debits" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-bold text-red-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.total_debit, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate", children: "Net Balance" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-left mt-1 sm:mt-0", children: /* @__PURE__ */ jsx("p", { className: `text-sm sm:text-base md:text-lg font-bold leading-none ${stats.final_balance > 0 ? "text-emerald-600" : stats.final_balance < 0 ? "text-red-600" : "text-ink-muted"}`, children: formatCurrency(Math.abs(stats.final_balance || 0), store) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex flex-col bg-surface rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xs font-bold text-ink uppercase tracking-tight truncate max-w-[120px]", children: party.name }),
              /* @__PURE__ */ jsx("span", { className: `px-1.5 py-0.5 text-4xs font-bold uppercase rounded-full ${party.type === "customer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`, children: party.type })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-mono mt-0.5", children: party.phone || "No Phone" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-1.5 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
                className: `p-1.5 rounded-lg transition-colors ${showMobileFilters ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Filter Type",
                children: /* @__PURE__ */ jsx(Filter, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center border-l border-line pl-1.5 ml-0.5 gap-0.5", children: [
              /* @__PURE__ */ jsx("button", { className: "p-1 text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "p-1 text-ink-muted", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 14 }) })
            ] })
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: "Search Ref or Desc...",
              className: "w-full pl-8 pr-4 py-1.5 text-xs bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 12 })
        ] }) }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-ink-muted uppercase tracking-wider shrink-0", children: "Type:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: transactionType,
              onChange: (e) => {
                setTransactionType(e.target.value);
                setShowMobileFilters(false);
              },
              className: "flex-1 bg-app border border-line text-ink-secondary text-xs font-bold rounded-lg px-2 py-1.5 outline-none",
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
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-row items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 flex-wrap", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-base sm:text-lg font-bold text-ink uppercase tracking-tight", children: [
              party.name,
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Ledger" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 text-2xs font-bold uppercase rounded-full ${party.type === "customer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`, children: party.type })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted font-medium", children: [
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
              className: "bg-app border border-line text-ink-secondary text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-0 outline-none",
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
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Ref #",
                className: "pl-8 pr-2 py-1.5 text-xs bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-28"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Type" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Reference" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "You Gave" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "You Received" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Balance" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filteredTransactions.length > 0 ? filteredTransactions.map((t, index) => {
            const typeStyle = getTypeStyle(t.type);
            const TypeIcon = typeStyle.icon;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs font-medium text-ink-secondary whitespace-nowrap", children: new Date(t.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${typeStyle.color}`, children: [
                /* @__PURE__ */ jsx(TypeIcon, { size: 10 }),
                typeStyle.label
              ] }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink hover:text-brand-600 transition-colors cursor-pointer", children: t.reference || "-" }),
                t.description && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted truncate max-w-[200px]", children: t.description })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: t.debit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-red-600 dark:text-red-400", children: formatCurrency(t.debit, store) }) : /* @__PURE__ */ jsx("span", { className: "text-neutral-300", children: "-" }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: t.credit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(t.credit, store) }) : /* @__PURE__ */ jsx("span", { className: "text-neutral-300", children: "-" }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-right", children: [
                /* @__PURE__ */ jsx("span", { className: `text-xs font-mono font-bold ${t.balance > 0 ? "text-emerald-600 dark:text-emerald-400" : t.balance < 0 ? "text-red-600 dark:text-red-400" : "text-ink-muted"}`, children: formatCurrency(Math.abs(t.balance), store) }),
                t.balance !== 0 && /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold ml-1 uppercase ${t.balance > 0 ? "text-emerald-600" : "text-red-600"}`, children: t.balance > 0 ? "To Receive" : "To Pay" })
              ] })
            ] }, index);
          }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12 text-center text-ink-muted", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { size: 24, className: "opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "No transactions found" })
          ] }) }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "block sm:hidden divide-y divide-line", children: filteredTransactions.length > 0 ? filteredTransactions.map((t, index) => {
          const typeStyle = getTypeStyle(t.type);
          const TypeIcon = typeStyle.icon;
          return /* @__PURE__ */ jsxs("div", { className: "p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-medium font-mono", children: new Date(t.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) }),
              /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${typeStyle.color}`, children: [
                /* @__PURE__ */ jsx(TypeIcon, { size: 8 }),
                typeStyle.label
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink break-all", children: t.reference || "-" }),
              t.description && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: t.description })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-1xs pt-1.5 border-t border-dashed border-line mt-1", children: [
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
                /* @__PURE__ */ jsx("span", { className: `font-bold font-mono ${t.balance > 0 ? "text-emerald-600" : t.balance < 0 ? "text-red-600" : "text-ink-muted"}`, children: formatCurrency(Math.abs(t.balance), store) }),
                t.balance !== 0 && /* @__PURE__ */ jsx("span", { className: `text-4xs font-bold ml-0.5 uppercase ${t.balance > 0 ? "text-emerald-600" : "text-red-600"}`, children: t.balance > 0 ? "Rec" : "Pay" })
              ] })
            ] })
          ] }, index);
        }) : /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-ink-muted text-xs", children: [
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
