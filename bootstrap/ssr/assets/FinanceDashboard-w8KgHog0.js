import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { Wallet, Building2, ArrowDownLeft, ArrowUpRight, ChevronRight, History } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function FinanceIndex({ stats, topReceivables, topPayables, recentEntries }) {
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
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-100 dark:border-indigo-800",
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
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: statCards.map((card, i) => /* @__PURE__ */ jsxs("div", { className: `bg-white dark:bg-slate-900 p-6 rounded-3xl border ${card.border} shadow-sm hover:shadow-md transition-all group`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: `p-3 rounded-2xl ${card.bg} ${card.color}`, children: /* @__PURE__ */ jsx(card.icon, { size: 24 }) }),
          card.link && /* @__PURE__ */ jsx(Link, { href: card.link, className: "text-slate-400 hover:text-indigo-500 transition-colors", children: /* @__PURE__ */ jsx(ChevronRight, { size: 20 }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-500 dark:text-slate-400 mb-1", children: card.title }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: formatCurrency(card.value, store) })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(History, { size: 20, className: "text-indigo-500" }),
              "Recent Transactions"
            ] }),
            /* @__PURE__ */ jsx(Link, { href: route("store.accounting.index", { store_slug: store?.slug }), className: "text-sm font-bold text-indigo-600 hover:text-indigo-700", children: "View Ledger" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-50 dark:divide-slate-800", children: recentEntries.length > 0 ? recentEntries.map((entry) => /* @__PURE__ */ jsxs("div", { className: "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white", children: entry.description || "No description" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: new Date(entry.date).toLocaleDateString() })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white", children: formatCurrency(entry.items.reduce((sum, item) => sum + parseFloat(item.debit), 0), store) }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider text-slate-400 font-bold", children: "Total Amount" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: entry.items.map((item, idx) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-2xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700", children: [
              item.account.name,
              ": ",
              parseFloat(item.debit) > 0 ? `Dr ${formatCurrency(parseFloat(item.debit), store)}` : `Cr ${formatCurrency(parseFloat(item.credit), store)}`
            ] }, idx)) })
          ] }, entry.id)) : /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-slate-400", children: "No recent transactions found." }) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ArrowDownLeft, { size: 20, className: "text-indigo-500" }),
              "Top Receivables"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
              topReceivables.length > 0 ? topReceivables.map((party) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold", children: party.name.charAt(0) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors", children: party.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Customer" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-indigo-600", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) })
              ] }, party.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-4", children: "No pending receivables." }),
              /* @__PURE__ */ jsx(Link, { href: route("store.finance.receivables", { store_slug: store?.slug }), className: "block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors border-t border-slate-50 dark:border-slate-800 mt-2 pt-4", children: "View All Receivables" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ArrowUpRight, { size: 20, className: "text-rose-500" }),
              "Top Payables"
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
              topPayables.length > 0 ? topPayables.map((party) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 font-bold", children: party.name.charAt(0) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors", children: party.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Supplier" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-rose-600", children: formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store) })
              ] }, party.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-4", children: "No pending payables." }),
              /* @__PURE__ */ jsx(Link, { href: route("store.finance.payables", { store_slug: store?.slug }), className: "block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors border-t border-slate-50 dark:border-slate-800 mt-2 pt-4", children: "View All Payables" })
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
