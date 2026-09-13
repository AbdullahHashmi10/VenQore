import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-C_2BbRa0.js";
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
function SalesAnalytics({ revenue, counts, topProducts, chartData }) {
  const { store } = usePage().props;
  const tt = useTermText();
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Sales Analytics", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales Analytics" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "analytics" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(DollarSign, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted font-medium", children: "Today's Revenue" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: formatCurrency(revenue.today, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
              counts.today,
              " sales today"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400", children: /* @__PURE__ */ jsx(TrendingUp, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted font-medium", children: "This Week" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: formatCurrency(revenue.week, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
              counts.week,
              " sales this week"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted font-medium", children: "This Month" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: formatCurrency(revenue.month, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
              counts.month,
              " sales this month"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(Package, { size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted font-medium", children: "Total Revenue" }),
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: formatCurrency(revenue.total, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-ink-muted", children: "Lifetime sales revenue" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-6", children: "Revenue Trend (Last 7 Days)" }),
            /* @__PURE__ */ jsx("div", { className: "h-64 flex items-end justify-between gap-2", children: chartData.map((data, index) => {
              const maxRevenue = Math.max(...chartData.map((d) => parseFloat(d.revenue)));
              const heightPercentage = maxRevenue > 0 ? parseFloat(data.revenue) / maxRevenue * 100 : 0;
              return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-2 group", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-full flex justify-center", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "w-full max-w-[40px] bg-brand-500 rounded-t-lg transition-all duration-slower group-hover:bg-brand-600",
                      style: { height: `${Math.max(heightPercentage, 2)}%` }
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10", children: formatCurrency(data.revenue, store) })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-medium", children: data.date })
              ] }, index);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-6", children: tt("Top Selling Products") }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              topProducts.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-colors", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-10 h-10 rounded-lg bg-sunken flex items-center justify-center text-lg font-bold text-ink-muted", children: [
                  "#",
                  index + 1
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink truncate", children: item.product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                    item.total_qty,
                    " units sold"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(item.total_revenue, store) }) })
              ] }, index)),
              topProducts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-ink-muted py-4", children: "No sales data yet." })
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
