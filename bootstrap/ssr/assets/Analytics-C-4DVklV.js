import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-CC-Yg7YN.js";
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
function SalesAnalytics({ revenue, counts, topProducts, chartData }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Sales Analytics", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales Analytics" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "analytics" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsx(DollarSign, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: "Today's Revenue" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: formatCurrency(revenue.today, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
              counts.today,
              " sales today"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400", children: /* @__PURE__ */ jsx(TrendingUp, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: "This Week" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: formatCurrency(revenue.week, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
              counts.week,
              " sales this week"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: "This Month" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: formatCurrency(revenue.month, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
              counts.month,
              " sales this month"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400", children: /* @__PURE__ */ jsx(Package, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: "Total Revenue" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: formatCurrency(revenue.total, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "Lifetime sales revenue" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-6", children: "Revenue Trend (Last 7 Days)" }),
            /* @__PURE__ */ jsx("div", { className: "h-64 flex items-end justify-between gap-2", children: chartData.map((data, index) => {
              const maxRevenue = Math.max(...chartData.map((d) => parseFloat(d.revenue)));
              const heightPercentage = maxRevenue > 0 ? parseFloat(data.revenue) / maxRevenue * 100 : 0;
              return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-2 group", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-full flex justify-center", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-full max-w-[40px] bg-indigo-500 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-600",
                      style: { height: `${Math.max(heightPercentage, 2)}%` }
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10", children: formatCurrency(data.revenue, store) })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-medium", children: data.date })
              ] }, index);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-6", children: "Top Selling Products" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              topProducts.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500", children: [
                  "#",
                  index + 1
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white truncate", children: item.product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                    item.total_qty,
                    " units sold"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency(item.total_revenue, store) }) })
              ] }, index)),
              topProducts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-slate-400 py-4", children: "No sales data yet." })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  SalesAnalytics as default
};
