import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-7dqO8VCJ.js";
import { ChevronDown, DollarSign, Users, TrendingUp, Search, Download, Printer, ChevronUp, Phone, Mail, MessageCircle, CreditCard, FileText } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function Receivables({ parties = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "balance", direction: "desc" });
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const stats = useMemo(() => {
    const totalReceivable = parties.reduce((sum, p) => sum + (parseFloat(p.balance ?? p.current_balance) || 0), 0);
    const totalParties = parties.length;
    const avgReceivable = totalParties > 0 ? totalReceivable / totalParties : 0;
    return {
      totalReceivable,
      totalParties,
      avgReceivable,
      largestDebtor: parties.reduce((max, p) => parseFloat(p.balance ?? p.current_balance ?? 0) > parseFloat(max.balance ?? max.current_balance ?? 0) ? p : max, {})
    };
  }, [parties]);
  const filteredParties = useMemo(() => {
    let result = parties.filter(
      (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone && p.phone.includes(searchTerm)
    );
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === "balance") {
        valA = parseFloat(a.balance ?? a.current_balance ?? 0);
        valB = parseFloat(b.balance ?? b.current_balance ?? 0);
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [parties, searchTerm, sortConfig]);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Accounts Receivable", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Receivables" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "receivables" }),
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
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-ink-muted truncate", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
            "Receivable: ",
            formatCurrency(stats.totalReceivable || 0, store)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "mx-1", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-brand-600", children: [
            "Debtors: ",
            stats.totalParties
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? "grid" : "hidden sm:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Receivable" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-emerald-600", children: formatCurrency(stats.totalReceivable, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(Users, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Active Debtors" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-brand-600", children: stats.totalParties })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Avg Balance" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-blue-600", children: formatCurrency(stats.avgReceivable, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Highest Balance" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end", children: [
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-red-600 leading-none", children: formatCurrency(parseFloat(stats.largestDebtor.balance ?? stats.largestDebtor.current_balance ?? 0), store) }),
            stats.largestDebtor.name && /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted truncate max-w-[100px] mt-0.5", children: stats.largestDebtor.name })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Accounts ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "Receivable" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Money In" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: tt("Search customers..."),
                className: "pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-56"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex flex-col bg-surface rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-xs font-bold text-ink uppercase tracking-tight", children: [
            "Accounts ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "Receivable" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setShowMobileSearch(!showMobileSearch),
                className: `p-1.5 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 14 })
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
              placeholder: tt("Search customers..."),
              className: "w-full pl-8 pr-3 py-1 text-xs bg-app border border-line rounded-lg outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { size: 12, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden sm:block flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx(
            "th",
            {
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              onClick: () => handleSort("name"),
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                tt("Customer"),
                " ",
                sortConfig.key === "name" && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 12 }))
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Contact" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Last Active" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              onClick: () => handleSort("balance"),
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                "Receivable ",
                sortConfig.key === "balance" && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 12 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 12 }))
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filteredParties.length > 0 ? filteredParties.map((party) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm", children: party.name.charAt(0) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink", children: party.name }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Customer") })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-ink-secondary text-xs", children: [
              /* @__PURE__ */ jsx(Phone, { size: 12 }),
              " ",
              party.phone || "-"
            ] }),
            party.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-ink-muted text-2xs", children: [
              /* @__PURE__ */ jsx(Mail, { size: 10 }),
              " ",
              party.email
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: new Date(party.updated_at || party.created_at).toLocaleDateString() }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx("p", { className: "font-mono font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) }) }),
          /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1 opacity-100 transition-opacity", children: [
            /* @__PURE__ */ jsx("a", { href: `https://wa.me/${party.phone}`, target: "_blank", rel: "noreferrer", className: "p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors", title: "WhatsApp", children: /* @__PURE__ */ jsx(MessageCircle, { size: 14 }) }),
            /* @__PURE__ */ jsx("a", { href: `tel:${party.phone}`, className: "p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors", title: "Call", children: /* @__PURE__ */ jsx(Phone, { size: 14 }) }),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.payments.in", { store_slug: store?.slug, party_id: party.id }),
                className: "p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center",
                title: "Record Payment",
                children: /* @__PURE__ */ jsx(CreditCard, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.parties.ledger", { store_slug: store?.slug, party: party.id }),
                className: "p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold",
                title: "View Ledger",
                children: [
                  /* @__PURE__ */ jsx(FileText, { size: 14 }),
                  " Ledger"
                ]
              }
            )
          ] }) })
        ] }, party.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-12 text-center text-ink-muted", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { size: 32, className: "opacity-20" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "No pending receivables found" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Good job! All customers are paid up.") })
        ] }) }) }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "block sm:hidden flex-1 overflow-auto space-y-1.5", children: filteredParties.length > 0 ? filteredParties.map((party) => /* @__PURE__ */ jsxs("div", { className: "bg-surface p-3 rounded-xl border border-line shadow-sm flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm", children: party.name.charAt(0) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink leading-tight", children: party.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted mt-0.5", children: [
                "Last Active: ",
                new Date(party.updated_at || party.created_at).toLocaleDateString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-line pt-2 mt-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-2xs text-ink-muted", children: [
            party.phone && /* @__PURE__ */ jsxs("span", { className: "font-medium text-ink-secondary", children: [
              "📞 ",
              party.phone
            ] }),
            party.email && /* @__PURE__ */ jsxs("span", { className: "truncate max-w-[150px]", children: [
              "✉️ ",
              party.email
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            party.phone && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("a", { href: `https://wa.me/${party.phone}`, target: "_blank", rel: "noreferrer", className: "p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors", title: "WhatsApp", children: /* @__PURE__ */ jsx(MessageCircle, { size: 14 }) }),
              /* @__PURE__ */ jsx("a", { href: `tel:${party.phone}`, className: "p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors", title: "Call", children: /* @__PURE__ */ jsx(Phone, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.payments.in", { store_slug: store?.slug, party_id: party.id }),
                className: "p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center",
                title: "Record Payment",
                children: /* @__PURE__ */ jsx(CreditCard, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.parties.ledger", { store_slug: store?.slug, party: party.id }),
                className: "p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold",
                title: "View Ledger",
                children: /* @__PURE__ */ jsx(FileText, { size: 14 })
              }
            )
          ] })
        ] })
      ] }, party.id)) : /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-ink-muted bg-surface rounded-xl border border-line shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
        /* @__PURE__ */ jsx(TrendingUp, { size: 32, className: "opacity-20" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "No pending receivables found" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Good job! All customers are paid up.") })
      ] }) }) })
    ] })
  ] });
}
export {
  Receivables as default
};
