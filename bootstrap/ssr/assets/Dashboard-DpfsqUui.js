import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { S as StockModuleTabs } from "./StockModuleTabs-CzdhnRlp.js";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import { Package, AlertTriangle, DollarSign, Warehouse, TrendingUp, ArrowRight } from "lucide-react";
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
function InventoryDashboard({ stats, topMoving }) {
  const { props } = usePage();
  const store = props.store || {};
  const StatCard = ({ title, value, icon: Icon, color, subValue }) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`, children: /* @__PURE__ */ jsx(Icon, { className: `w-5 h-5 md:w-6 md:h-6 ${color.replace("bg-", "text-")}` }) }),
        subValue && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg", children: subValue })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1", children: title })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-lg md:text-2xl font-black text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left", children: value })
  ] });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Inventory Dashboard", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Inventory Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-2 overflow-y-auto md:overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "overview" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 md:space-y-6 overflow-y-auto pb-24 md:pb-6 pr-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6", children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Total Products",
              value: stats.total_products,
              icon: Package,
              color: "bg-indigo-500"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Low Stock Items",
              value: stats.low_stock_count,
              icon: AlertTriangle,
              color: "bg-amber-500",
              subValue: stats.low_stock_count > 0 ? "Action Needed" : "Healthy"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Inventory Value",
              value: formatCurrency(stats.inventory_value || 0, store),
              icon: DollarSign,
              color: "bg-emerald-500"
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              title: "Warehouses",
              value: stats.total_warehouses,
              icon: Warehouse,
              color: "bg-purple-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-extrabold text-sm md:text-lg text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 md:w-5 md:h-5 text-indigo-500" }),
                "Top Moving Items"
              ] }),
              /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store?.slug }), className: "text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-bold uppercase", children: "View Reports" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs md:text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px]", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 md:px-6 md:py-4 font-bold", children: "Product Name" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 md:px-6 md:py-4 font-bold text-right", children: "Total Sold" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 md:px-6 md:py-4 font-bold text-right", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700 font-medium", children: topMoving.length > 0 ? topMoving.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800 dark:text-white", children: item.name }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 md:px-6 md:py-4 text-right text-slate-600 dark:text-slate-300 font-black", children: item.total_sold }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 md:px-6 md:py-4 text-right", children: /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", children: "Popular" }) })
              ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "px-6 py-8 text-center text-slate-400 font-semibold", children: "No sales data available yet." }) }) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(MidnightNebula, { className: "rounded-2xl p-4 md:p-6 shadow-xl h-full", primaryColor: "indigo", secondaryColor: "purple", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-black text-lg md:text-xl mb-1 text-white uppercase tracking-wider", children: "Quick Actions" }),
            /* @__PURE__ */ jsx("p", { className: "text-indigo-100 mb-4 md:mb-6 text-xs font-semibold", children: "Manage your inventory efficiently." }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:space-y-3", children: [
              /* @__PURE__ */ jsxs(Link, { href: route("store.inventory.index", { store_slug: store?.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold", children: [
                /* @__PURE__ */ jsx("span", { children: "View All Products" }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] }),
              /* @__PURE__ */ jsxs(Link, { href: route("store.stock-operations", { store_slug: store?.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold", children: [
                /* @__PURE__ */ jsx("span", { children: "Stock Operations" }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] }),
              /* @__PURE__ */ jsxs(Link, { href: route("store.purchase-orders.create", { store_slug: store?.slug }), className: "flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold", children: [
                /* @__PURE__ */ jsx("span", { children: "Create Purchase Order" }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  InventoryDashboard as default
};
