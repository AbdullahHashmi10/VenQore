import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { v as vq, O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { ClipboardList, ArrowRight, TrendingUp, ArrowUpRight, Receipt, Users, Activity, Clock, Wallet, MoreHorizontal, FileText, TrendingDown, AlertCircle, Package, DollarSign, Plus, Minus, Settings, Shield } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from "recharts";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function AdminDashboard({
  stats = { net_profit: 0, total_revenue: 0, total_expenses: 0, active_staff: 0, total_staff: 0 },
  profitData = [],
  staffPerformance = [],
  recentActivity = [],
  inventoryHealth = { healthy: 0, lowStock: 0, outOfStock: 0, deadStock: 0 },
  topProducts = [],
  expenseData = [],
  paymentMethods = [],
  currencySymbol = "$"
}) {
  const {
    store
  } = usePage().props;
  if (!store?.slug) return null;
  const totalExpenseValue = expenseData.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
  const hasExpenses = totalExpenseValue > 0;
  const finalExpenseData = hasExpenses ? expenseData.map((item) => ({
    ...item,
    percentage: Math.round(item.value / totalExpenseValue * 100)
  })) : [
    { name: "No Data", value: 1, color: vq.slate[700], percentage: 0 }
    // Placeholder if empty
  ];
  const pieData = [
    { name: "Healthy", value: inventoryHealth.healthy ?? 0, color: vq.emerald[500] },
    { name: "Low", value: inventoryHealth.lowStock ?? 0, color: vq.amber[500] },
    { name: "Out", value: inventoryHealth.outOfStock ?? 0, color: vq.red[500] }
  ].filter((d) => d.value > 0);
  const activeInventoryStatus = inventoryHealth.outOfStock > 0 ? { label: "Action Needed", color: "text-red-500" } : inventoryHealth.lowStock > 0 ? { label: "Low Stock", color: "text-amber-500" } : { label: "Healthy", color: "text-emerald-500" };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Executive Dashboard", mode: "admin", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Executive Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full w-full px-4 md:px-8 pt-1 pb-4 overflow-hidden flex gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col h-full gap-4 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.low-stock", {
            store_slug: store.slug
          }), className: "block group", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 relative overflow-hidden group-hover:-translate-y-0.5 transition-all duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0 relative z-10", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(ClipboardList, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Pending Actions" }),
                inventoryHealth.lowStockCount > 0 && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full mt-1 w-max", children: "Action Needed" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end text-right min-w-0 relative z-10", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight", children: inventoryHealth.lowStockCount > 0 ? `${inventoryHealth.lowStockCount} Items` : "0 Items" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-600 transition-colors justify-end", children: [
                "Requires your attention ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0 relative z-10", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(TrendingUp, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Profit Margin" }),
                /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1 w-max", children: [
                  /* @__PURE__ */ jsx(ArrowUpRight, { size: 10 }),
                  " Healthy"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end text-right min-w-0 relative z-10", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: stats.total_revenue > 0 ? `${Math.round(stats.net_profit / stats.total_revenue * 100)}%` : "0%" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Net profit / Total revenue" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0 relative z-10", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Overdue Payments" }),
                /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1 w-max", children: [
                  /* @__PURE__ */ jsx(TrendingUp, { size: 10 }),
                  " On Track"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end text-right min-w-0 relative z-10", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: formatCurrency(stats.overdue_payments) }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: stats.overdue_payments > 0 ? "Outstanding receivables" : "No overdue invoices" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 grid grid-cols-9 grid-rows-2 gap-4 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-9 md:col-span-6 bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 dark:text-white tracking-tight", children: "Purchases Trend" }),
                /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-400", children: "Past 6 months spending" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: profitData, margin: { top: 5, right: 5, left: -25, bottom: 0 }, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorValue", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.indigo[500], stopOpacity: 0.3 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.indigo[500], stopOpacity: 0 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], opacity: 0.5 }),
              /* @__PURE__ */ jsx(
                XAxis,
                {
                  dataKey: "month",
                  axisLine: false,
                  tickLine: false,
                  tick: { fill: vq.slate[400], fontSize: 10 },
                  dy: 5
                }
              ),
              /* @__PURE__ */ jsx(
                YAxis,
                {
                  axisLine: false,
                  tickLine: false,
                  tick: { fill: vq.slate[400], fontSize: 10 },
                  tickFormatter: (value) => `${currencySymbol}${value}`
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { backgroundColor: vq.slate[800], borderColor: vq.slate[700], borderRadius: "12px", color: vq.slate[50], boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
                  itemStyle: { color: "#fff" },
                  cursor: { stroke: vq.indigo[500], strokeWidth: 1, strokeDasharray: "3 3" },
                  formatter: (value) => `${currencySymbol} ${value.toLocaleString()}`
                }
              ),
              /* @__PURE__ */ jsx(Area, { name: "Purchases", type: "monotone", dataKey: "purchases", stroke: vq.indigo[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorValue)", activeDot: { r: 6 } })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-9 md:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2 shrink-0", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 dark:text-white tracking-tight", children: "Inventory" }),
              /* @__PURE__ */ jsx("div", { className: `flex items-center gap-1.5 mt-0.5 ${activeInventoryStatus.color}`, children: /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase tracking-wider", children: activeInventoryStatus.label }) })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center gap-4 min-h-0 -mt-2", children: [
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2.5 shrink-0 justify-center", children: [
                { k: "Healthy", val: inventoryHealth.healthy ?? 0, c: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
                { k: "Low", val: inventoryHealth.lowStock ?? 0, c: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
                { k: "Out", val: inventoryHealth.outOfStock ?? 0, c: "bg-red-500", text: "text-red-600 dark:text-red-400" }
              ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full ${item.c}` }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase tracking-widest", children: item.k })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `text-base font-extrabold ml-3 ${item.text}`, children: [
                  item.val,
                  "%"
                ] })
              ] }, idx)) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 h-full min-h-0 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: pieData.length > 0 ? pieData : [{ name: "No Data", value: 1, color: vq.slate[700] }],
                    cx: "55%",
                    cy: "50%",
                    innerRadius: "50%",
                    outerRadius: "75%",
                    paddingAngle: 4,
                    dataKey: "value",
                    stroke: "none",
                    children: (pieData.length > 0 ? pieData : [{ name: "No Data", value: 1, color: vq.slate[700] }]).map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    contentStyle: { backgroundColor: vq.slate[800], borderColor: vq.slate[700], borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
                    itemStyle: { color: "#fff" }
                  }
                )
              ] }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-9 md:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2 shrink-0", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 dark:text-white tracking-tight", children: "Payments" }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-400", children: "Transaction types" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center gap-4 min-h-0 -mt-2", children: [
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2.5 shrink-0 justify-center", children: paymentMethods.length > 0 ? paymentMethods.map((method, idx) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: method.color } }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase tracking-widest", children: method.name })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-base font-extrabold ml-3 text-slate-700 dark:text-slate-300", children: method.value })
              ] }, idx)) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-slate-400 uppercase", children: "No Data" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 mt-1", children: "No sales recorded" })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 h-full min-h-0 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: paymentMethods.length > 0 ? paymentMethods : [{ name: "No Data", value: 1, color: vq.slate[700] }],
                    cx: "55%",
                    cy: "50%",
                    innerRadius: "50%",
                    outerRadius: "75%",
                    paddingAngle: 4,
                    dataKey: "value",
                    stroke: "none",
                    children: (paymentMethods.length > 0 ? paymentMethods : [{ name: "No Data", value: 1, color: vq.slate[700] }]).map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    contentStyle: { backgroundColor: vq.slate[800], borderColor: vq.slate[700], borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
                    itemStyle: { color: "#fff" },
                    formatter: (value, name) => [value, name]
                  }
                )
              ] }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-9 md:col-span-6 bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 dark:text-white tracking-tight", children: "Expenses" }),
                /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-400", children: "Monthly breakdown" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-3xs text-slate-400 font-bold uppercase tracking-wider", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white", children: formatCurrency(totalExpenseValue) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 w-full flex items-center gap-6", children: [
              /* @__PURE__ */ jsx("div", { className: "h-full w-[40%] relative", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 text-2xs", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: finalExpenseData,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: "55%",
                    outerRadius: "85%",
                    paddingAngle: 4,
                    dataKey: "value",
                    stroke: "none",
                    children: finalExpenseData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    contentStyle: { backgroundColor: vq.slate[800], borderColor: vq.slate[700], borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
                    itemStyle: { color: "#fff" },
                    formatter: (value) => `${currencySymbol} ${value.toLocaleString()}`
                  }
                )
              ] }) }) }) }),
              /* @__PURE__ */ jsx("div", { className: `flex-1 grid gap-2 content-center max-h-full overflow-y-auto ${finalExpenseData.length > 2 ? "grid-cols-2" : "grid-cols-1"}`, children: finalExpenseData.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-0.5", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: item.color } }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-500 uppercase truncate max-w-[70px]", children: item.name })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-black text-slate-800 dark:text-slate-200", children: [
                  item.percentage,
                  "%"
                ] })
              ] }, idx)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(Users, { size: 20 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Active Staff" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col items-end text-right min-w-0", children: /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: [
              stats.active_staff,
              " / ",
              stats.total_staff
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(Activity, { size: 20 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "System Status" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col items-end text-right min-w-0", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: "Operational" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-xl shadow-sm", children: /* @__PURE__ */ jsx(Clock, { size: 20 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Last Backup" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col items-end text-right min-w-0", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: stats.last_backup || "N/A" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block w-80 xl:w-96 shrink-0 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-white rounded-[2rem] p-6 h-full flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-white/10", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-30 flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10", children: /* @__PURE__ */ jsx(Wallet, { size: 18, className: "text-white" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 font-medium", children: "Net Balance" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold tracking-tight", children: formatCurrency(stats.net_balance) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm", children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 20, className: "text-slate-300" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative z-20 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 h-20", children: [
          /* @__PURE__ */ jsxs(Link, { href: route("store.admin.users", { store_slug: store.slug }), className: "col-span-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(Users, { size: 18 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "USERS" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "col-span-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(FileText, { size: 18 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "REPORTS" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: route("store.activity-log.index", { store_slug: store.slug }), className: "col-span-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(Activity, { size: 18 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold tracking-wider", children: "LOGS" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 mb-6 grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 18, className: "text-emerald-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold", children: "IN" })
            ] }),
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold tracking-tight group-hover:scale-105 transition-transform origin-left", children: formatCurrency(stats.today_in) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-1", children: "Today's In" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
              /* @__PURE__ */ jsx(TrendingDown, { size: 18, className: "text-red-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full font-bold", children: "OUT" })
            ] }),
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-bold tracking-tight group-hover:scale-105 transition-transform origin-left", children: formatCurrency(stats.today_out) }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-1", children: "Today's Out" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 mb-6 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-3", children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 14 }),
            " Alerts"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            inventoryHealth.lowStock > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20", children: [
              /* @__PURE__ */ jsx(Package, { size: 14, className: "text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-amber-200", children: [
                inventoryHealth.lowStock,
                "% inventory running low"
              ] })
            ] }),
            inventoryHealth.outOfStock > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-red-500/10 rounded-lg border border-red-500/20", children: [
              /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-red-400 shrink-0" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-red-200", children: [
                inventoryHealth.outOfStock,
                "% products out of stock"
              ] })
            ] }),
            inventoryHealth.lowStock === 0 && inventoryHealth.outOfStock === 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 14, className: "text-emerald-400 shrink-0" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-200", children: "All systems running smoothly" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20", children: [
              /* @__PURE__ */ jsx(DollarSign, { size: 14, className: "text-indigo-400 shrink-0" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-indigo-200", children: [
                "Profit: ",
                formatCurrency(stats.net_profit)
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5 flex flex-col min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3 shrink-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-xs text-slate-300 uppercase tracking-wider", children: "Business Activity" }),
            /* @__PURE__ */ jsx(Link, { href: route("store.funds.index", { store_slug: store.slug, view: "history" }), className: "text-2xs text-indigo-300 hover:text-white transition-colors font-semibold", children: "View All" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto space-y-2 custom-scrollbar", children: recentActivity.length > 0 ? recentActivity.map((act, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between group cursor-pointer px-2 py-2 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 pb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center text-2xs font-black ${act.is_plus ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`, children: act.is_plus ? /* @__PURE__ */ jsx(Plus, { size: 14 }) : /* @__PURE__ */ jsx(Minus, { size: 14 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0", children: [
                /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-white/90 truncate", children: act.title }),
                /* @__PURE__ */ jsxs("span", { className: "text-3xs text-slate-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 8 }),
                  " ",
                  act.time
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("span", { className: `text-1xs font-black ${act.is_plus ? "text-emerald-400" : "text-rose-400"}`, children: act.amount }) })
          ] }, idx)) : /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-slate-500 opacity-50", children: [
            /* @__PURE__ */ jsx(Activity, { size: 24, className: "mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-widest", children: "No Recent Activity" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative z-10 pt-4 mt-4 border-t border-white/5 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs(Link, { href: route("store.admin.settings", { store_slug: store.slug }), className: "flex items-center justify-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all", children: [
            /* @__PURE__ */ jsx(Settings, { size: 14 }),
            " Settings"
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all", children: [
            /* @__PURE__ */ jsx(Shield, { size: 14 }),
            " Security"
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
export {
  AdminDashboard as default
};
