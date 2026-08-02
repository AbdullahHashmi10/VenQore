import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { PieChart, DollarSign, TrendingDown, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function AccountingDashboard({ stats, recentTransactions }) {
  const { store } = usePage().props;
  const StatCard = ({ title, value, icon: Icon, color, subValue, subLabel }) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`, children: /* @__PURE__ */ jsx(Icon, { className: `w-6 h-6 ${color.replace("bg-", "text-")}` }) }),
      subValue && /* @__PURE__ */ jsxs("span", { className: `text-xs font-medium px-2 py-1 rounded-lg ${Number(subValue) >= 0 ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-500 bg-red-50 dark:bg-red-900/20"}`, children: [
        subLabel,
        ": ",
        subValue
      ] })
    ] }),
    /* @__PURE__ */ jsx("h3", { className: "text-slate-500 dark:text-slate-400 text-sm font-medium mb-1", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left", children: formatCurrency(Number(value), store) })
  ] });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Accounting Dashboard", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Accounting Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "accounting" }),
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Accounting Dashboard",
          subtitle: "Financial overview and reports",
          icon: PieChart,
          breadcrumbs: [
            { label: "Money" },
            { label: "Accounting" }
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Assets",
            value: stats.total_assets,
            icon: DollarSign,
            color: "bg-emerald-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Liabilities",
            value: stats.total_liabilities,
            icon: TrendingDown,
            color: "bg-red-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Equity",
            value: stats.total_equity,
            icon: PieChart,
            color: "bg-blue-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Net Profit",
            value: stats.net_profit,
            icon: TrendingUp,
            color: "bg-indigo-500",
            subValue: stats.total_income,
            subLabel: "Income"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-indigo-500" }),
              "Recent Transactions"
            ] }),
            /* @__PURE__ */ jsx(Link, { href: route("store.accounting.index", { store_slug: store.slug }), className: "text-sm text-indigo-600 hover:text-indigo-700 font-medium", children: "View Chart of Accounts" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Date" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Description" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium", children: "Reference" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 font-medium text-right", children: "Amount" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: recentTransactions.length > 0 ? recentTransactions.map((entry) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-600 dark:text-slate-300", children: new Date(entry.date).toLocaleDateString() }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-medium text-slate-800 dark:text-white", children: entry.description }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-500 dark:text-slate-400", children: entry.reference || "-" }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency(Number(entry.items.reduce((sum, item) => sum + Number(item.debit), 0)), store) })
            ] }, entry.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-6 py-8 text-center text-slate-400", children: "No recent transactions found." }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(MidnightNebula, { className: "rounded-2xl p-6 shadow-xl h-full", primaryColor: "blue", secondaryColor: "indigo", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-xl mb-2 text-white", children: "Quick Actions" }),
          /* @__PURE__ */ jsx("p", { className: "text-blue-100 mb-6 text-sm", children: "Manage your finances." }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs(Link, { href: route("store.accounting.index", { store_slug: store.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Chart of Accounts" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] }),
            /* @__PURE__ */ jsxs(Link, { href: route("store.accounting.pnl", { store_slug: store.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Profit & Loss" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] }),
            /* @__PURE__ */ jsxs(Link, { href: route("store.accounting.balance-sheet", { store_slug: store.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Balance Sheet" }),
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  AccountingDashboard as default
};
