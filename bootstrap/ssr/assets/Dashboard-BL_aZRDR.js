import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { DollarSign, Calendar, TrendingUp, Users, Trophy, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BQ5hjMmA.js";
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
function SalesDashboard({ stats, recentSales, salesByMethod, topSelling }) {
  const { store } = usePage().props;
  const tt = useTermText();
  if (!stats) {
    return /* @__PURE__ */ jsx(OneGlanceLayout, { title: "Sell Command Center", activeMenu: "Sell", children: /* @__PURE__ */ jsx("div", { className: "p-10 text-center text-ink-muted", children: "Loading stats..." }) });
  }
  const StatCard = ({ title, value, icon: Icon, color, subValue, trend }) => {
    return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-5 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-sunken rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-slower" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: `p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20`, children: /* @__PURE__ */ jsx(Icon, { className: `w-6 h-6 ${color.replace("bg-", "text-")}` }) }),
          trend !== void 0 && trend !== 0 && /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1 text-2xs font-bold px-2 py-1 rounded-lg ${trend > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`, children: [
            trend > 0 ? /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 }) : /* @__PURE__ */ jsx(ArrowDownRight, { size: 12 }),
            Math.abs(trend),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-ink-muted text-xs font-bold uppercase tracking-wider mb-1", children: title }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: value }),
          subValue && /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted font-medium ml-1", children: subValue })
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Sell Command Center", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales Hub" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col xl:h-full gap-4 pb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "shrink-0 space-y-4", children: [
        /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "overview" }),
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1 h-6 bg-brand-600 rounded-full" }),
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold uppercase tracking-widest text-ink-muted", children: "Performance Pulse" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsx(
              StatCard,
              {
                title: "Revenue Today",
                value: formatCurrency(Number(stats.sales_today || 0), store),
                icon: DollarSign,
                color: "bg-emerald-500",
                subValue: `${stats.orders_today || 0} ${tt("Orders")}`,
                trend: stats.sales_today_growth
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                title: "Monthly Revenue",
                value: formatCurrency(Number(stats.sales_month || 0), store),
                icon: Calendar,
                color: "bg-brand-500",
                subValue: `${stats.orders_month || 0} ${tt("Orders")}`,
                trend: stats.sales_month_growth
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                title: tt("Avg. Order Value"),
                value: formatCurrency(Number(stats.avg_order_value || 0), store),
                icon: TrendingUp,
                color: "bg-blue-500",
                trend: stats.avg_order_growth
              }
            ),
            /* @__PURE__ */ jsx(
              StatCard,
              {
                title: tt("Active Customers"),
                value: (stats.active_customers || 0).toLocaleString(),
                icon: Users,
                color: "bg-brand-500",
                subValue: "Last 30 Days"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col xl:grid xl:grid-rows-2 gap-4 min-h-0", children: [
        /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4 xl:h-full min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 flex flex-col xl:h-full xl:min-h-0 min-h-[300px]", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between shrink-0 mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1 h-6 bg-amber-500 rounded-full" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold uppercase tracking-widest text-ink-muted", children: "Top Selling Today" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl border border-line shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col", children: /* @__PURE__ */ jsx("div", { className: "p-4 overflow-y-auto custom-scrollbar flex-1", children: topSelling && topSelling.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: topSelling.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-colors", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30`, children: [
                  "#",
                  idx + 1
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink truncate max-w-[150px]", children: item.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
                    item.qty,
                    " units"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink", children: formatCurrency(Number(item.revenue || 0), store) }) })
            ] }, idx)) }) : /* @__PURE__ */ jsxs("div", { className: "text-center h-full flex flex-col justify-center items-center text-ink-muted", children: [
              /* @__PURE__ */ jsx(Trophy, { size: 40, className: "mb-2 opacity-20" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs", children: "No sales yet." })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col xl:h-full xl:min-h-0 min-h-[250px]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0 mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1 h-6 bg-blue-600 rounded-full" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold uppercase tracking-widest text-ink-muted", children: "Payment Breakdown" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm p-4 flex-1 min-h-0 flex flex-col justify-between overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "space-y-4 overflow-y-auto custom-scrollbar pr-1", children: salesByMethod && salesByMethod.length > 0 ? salesByMethod.map((method, idx) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-2xs font-bold uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: method.payment_method }),
                  /* @__PURE__ */ jsx("span", { className: "text-ink", children: formatCurrency(Number(method.total || 0), store) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-sunken rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `h-full rounded-full ${["bg-brand-500", "bg-emerald-500", "bg-amber-500"][idx % 3]}`,
                    style: { width: `${stats.sales_month > 0 ? method.total / stats.sales_month * 100 : 0}%` }
                  }
                ) })
              ] }, idx)) : /* @__PURE__ */ jsx("div", { className: "text-center text-ink-muted text-xs py-8", children: "No data" }) }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 pt-2 border-t border-line shrink-0", children: /* @__PURE__ */ jsx(MidnightNebula, { className: "rounded-xl p-3", primaryColor: "indigo", secondaryColor: "purple", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-white/20 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { className: "text-white", size: 16 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-brand-100 uppercase", children: "Tip" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-white font-medium leading-tight", children: "Digital payments bump AOV by 15%." })
                ] })
              ] }) }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "flex flex-col xl:h-full min-h-[350px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1 h-6 bg-emerald-600 rounded-full" }),
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold uppercase tracking-widest text-ink-muted", children: "Live Sales Feed" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm min-w-[600px] xl:min-w-0", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Reference" }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: tt("Customer") }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Amount" }),
                /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
                recentSales && recentSales.map((sale) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
                  /* @__PURE__ */ jsx("td", { className: "px-6 py-3 font-bold text-brand-600 dark:text-brand-400 text-xs", children: /* @__PURE__ */ jsx(Link, { href: route("store.sales.show", { store_slug: store?.slug, sale: sale.id }), className: "flex items-center gap-2", children: sale.reference_number }) }),
                  /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-ink-secondary font-medium text-xs", children: sale.party ? sale.party.name : tt("Walk-in Customer") }),
                  /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right font-bold text-ink text-xs", children: formatCurrency(Number(sale.total), store) }),
                  /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-tighter
                                                        ${sale.payment_status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : sale.payment_status === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}
`, children: sale.payment_status }) })
                ] }, sale.id)),
                (!recentSales || recentSales.length === 0) && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-6 py-8 text-center text-ink-muted text-xs", children: "No recent sales found." }) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-line flex justify-center shrink-0 bg-surface", children: /* @__PURE__ */ jsxs(Link, { href: route("store.sales.index", { store_slug: store?.slug }), className: "text-2xs font-bold text-brand-600 hover:text-brand-500 hover:underline flex items-center gap-1 transition-colors", children: [
              "View Full History ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 10 })
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  SalesDashboard as default
};
