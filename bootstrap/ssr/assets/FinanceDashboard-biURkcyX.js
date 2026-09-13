import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Wallet, Building2, ArrowDownLeft, ArrowUpRight, ChevronRight, History } from "lucide-react";
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
function FinanceIndex({ stats, topReceivables, topPayables, recentEntries }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const statCards = [
    {
      title: "Cash on Hand",
      value: stats.cash,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-800"
    },
    {
      title: "Bank Balance",
      value: stats.bank,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-800"
    },
    {
      title: "Total Receivables",
      value: stats.receivables,
      icon: ArrowDownLeft,
      color: "text-brand-600",
      bg: "bg-brand-50 dark:bg-brand-900/20",
      border: "border-brand-100 dark:border-brand-800",
      link: route("store.finance.receivables", { store_slug: store?.slug })
    },
    {
      title: "Total Payables",
      value: stats.payables,
      icon: ArrowUpRight,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-100 dark:border-rose-800",
      link: route("store.finance.payables", { store_slug: store?.slug })
    }
  ];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Finance Overview", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Finance Overview" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 h-full overflow-y-auto custom-scrollbar", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: statCards.map((card, i) => /* @__PURE__ */ jsxs("div", { className: `bg-surface p-6 rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-all group`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: `p-3 rounded-2xl ${card.bg} ${card.color}`, children: /* @__PURE__ */ jsx(card.icon, { size: 24 }) }),
          card.link && /* @__PURE__ */ jsx(Link, { href: card.link, className: "text-ink-muted hover:text-brand-500 transition-colors", children: /* @__PURE__ */ jsx(ChevronRight, { size: 20 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink-muted mb-1", children: card.title }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: formatCurrency(card.value, store) })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line overflow-hidden shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(History, { size: 20, className: "text-brand-500" }),
              "Recent Transactions"
            ] }),
            /* @__PURE__ */ jsx(Link, { href: route("store.accounting.index", { store_slug: store?.slug }), className: "text-sm font-bold text-brand-600 hover:text-brand-700", children: "View Ledger" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: recentEntries.length > 0 ? recentEntries.map((entry) => /* @__PURE__ */ jsxs("div", { className: "p-4 hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: entry.description || "No description" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: new Date(entry.date).toLocaleDateString() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: formatCurrency(entry.items.reduce((sum, item) => sum + parseFloat(item.debit), 0), store) }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider text-ink-muted font-bold", children: "Total Amount" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: entry.items.map((item, idx) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md bg-sunken text-2xs font-bold text-ink-secondary border border-line", children: [
              item.account.name,
              ": ",
              parseFloat(item.debit) > 0 ? `Dr ${formatCurrency(parseFloat(item.debit), store)}` : `Cr ${formatCurrency(parseFloat(item.credit), store)}`
            ] }, idx)) })
          ] }, entry.id)) : /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-ink-muted", children: "No recent transactions found." }) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ArrowDownLeft, { size: 20, className: "text-brand-500" }),
              "Top Receivables"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
              topReceivables.length > 0 ? topReceivables.map((party) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 font-bold", children: party.name.charAt(0) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink group-hover:text-brand-600 transition-colors", children: party.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Customer") })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-brand-600", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) })
              ] }, party.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted text-center py-4", children: "No pending receivables." }),
              /* @__PURE__ */ jsx(Link, { href: route("store.finance.receivables", { store_slug: store?.slug }), className: "block w-full text-center py-2 text-xs font-bold text-ink-muted hover:text-brand-600 transition-colors border-t border-line mt-2 pt-4", children: "View All Receivables" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ArrowUpRight, { size: 20, className: "text-rose-500" }),
              "Top Payables"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
              topPayables.length > 0 ? topPayables.map((party) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 font-bold", children: party.name.charAt(0) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink group-hover:text-rose-600 transition-colors", children: party.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Supplier") })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-rose-600", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) })
              ] }, party.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted text-center py-4", children: "No pending payables." }),
              /* @__PURE__ */ jsx(Link, { href: route("store.finance.payables", { store_slug: store?.slug }), className: "block w-full text-center py-2 text-xs font-bold text-ink-muted hover:text-rose-600 transition-colors border-t border-line mt-2 pt-4", children: "View All Payables" })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  FinanceIndex as default
};
