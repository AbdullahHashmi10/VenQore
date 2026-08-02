import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { DollarSign, Archive, Hourglass, RefreshCw, Package } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DIa1NNvN.js";
import { R as ReportsLayout } from "./ReportsLayout-Dg4OWYWu.js";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-DYgr6x02.js";
import "recharts";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function StockAging({ batches = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const stats = useMemo(() => {
    let totalValue = 0;
    let deadStockValue = 0;
    let slowMovingValue = 0;
    let freshStockValue = 0;
    batches.forEach((b) => {
      const val = parseFloat(b.cost_value) || 0;
      const days = parseInt(b.days) || 0;
      totalValue += val;
      if (days > 180) deadStockValue += val;
      else if (days > 90) slowMovingValue += val;
      else freshStockValue += val;
    });
    return {
      totalValue,
      deadStockValue,
      slowMovingValue,
      freshStockValue,
      deadStockPercent: totalValue > 0 ? deadStockValue / totalValue * 100 : 0
    };
  }, [batches]);
  [
    { name: "Fresh (0-90 Days)", value: stats.freshStockValue, fill: vq.emerald[500] },
    { name: "Slow (90-180 Days)", value: stats.slowMovingValue, fill: vq.amber[500] },
    { name: "Dead (180+ Days)", value: stats.deadStockValue, fill: vq.red[500] }
  ];
  const barChartData = [
    { name: "Fresh", Value: stats.freshStockValue, fill: vq.emerald[500] },
    { name: "Slow", Value: stats.slowMovingValue, fill: vq.amber[500] },
    { name: "Dead", Value: stats.deadStockValue, fill: vq.red[500] }
  ];
  const barChartConfig = {
    type: "bar",
    bars: [{ dataKey: "Value", name: "Stock Value" }],
    xAxisKey: "name"
  };
  const reportStats = [
    {
      label: "Total Inventory Value",
      value: formatCurrency(stats.totalValue),
      subValue: "Across all batches",
      icon: /* @__PURE__ */ jsx(DollarSign, { size: 20, className: "text-slate-500" }),
      type: "neutral"
    },
    {
      label: "Capital in Dead Stock",
      value: formatCurrency(stats.deadStockValue),
      subValue: "> 180 Days Old",
      icon: /* @__PURE__ */ jsx(Archive, { size: 20, className: "text-red-500" }),
      type: "down"
    },
    {
      label: "Slow Moving Capital",
      value: formatCurrency(stats.slowMovingValue),
      subValue: "90-180 Days Old",
      icon: /* @__PURE__ */ jsx(Hourglass, { size: 20, className: "text-orange-500" }),
      type: "neutral"
    },
    {
      label: "Inventory Health",
      value: `${(100 - stats.deadStockPercent).toFixed(1)}%`,
      subValue: "Fresh Stock Ratio",
      icon: /* @__PURE__ */ jsx(RefreshCw, { size: 20, className: "text-emerald-500" }),
      type: "up"
    }
  ];
  const getStatus = (days) => {
    if (days > 180) return { label: "Dead Stock", class: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900" };
    if (days > 90) return { label: "Slow Moving", class: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900" };
    if (days > 30) return { label: "Stable", class: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900" };
    return { label: "Fresh", class: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900" };
  };
  const columns = [
    {
      key: "product",
      label: "Inventory Item",
      sortable: true,
      width: "300px",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden", children: /* @__PURE__ */ jsx(Package, { size: 16, className: "text-slate-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1", children: row.product }),
          /* @__PURE__ */ jsxs("div", { className: "text-2xs font-mono text-slate-500", children: [
            "Batch: ",
            row.batch || "N/A"
          ] })
        ] })
      ] })
    },
    {
      key: "days",
      label: "Age",
      sortable: true,
      width: "180px",
      render: (row) => {
        const days = parseInt(row.days) || 0;
        const percentage = Math.min(100, days / 365 * 100);
        const color = days > 180 ? "bg-red-500" : days > 90 ? "bg-orange-500" : "bg-emerald-500";
        return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[140px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-1xs mb-1 font-bold", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-slate-700 dark:text-slate-300", children: [
              days,
              " days"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Target: 90" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full ${color} transition-all duration-500`, style: { width: `${percentage}%` } }) })
        ] });
      }
    },
    {
      key: "category",
      label: "Status",
      sortable: true,
      render: (row) => {
        const status = getStatus(parseInt(row.days));
        return /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-2xs font-bold border ${status.class} uppercase tracking-wide`, children: status.label });
      }
    },
    {
      key: "quantity",
      label: "Qty On Hand",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-bold text-slate-700 dark:text-slate-300", children: formatNumber(row.quantity) })
    },
    {
      key: "cost_value",
      label: "Asset Value (FIFO)",
      align: "right",
      sortable: true,
      render: (row) => {
        const val = parseFloat(row.cost_value) || 0;
        return /* @__PURE__ */ jsx("div", { className: "font-mono font-bold text-sm text-slate-800 dark:text-white", children: formatCurrency(val) });
      }
    }
  ];
  const filterDefs = [
    {
      key: "category",
      // Using existing backend key 'category' which likely maps to age bucket
      type: "select",
      label: "Age Group",
      options: [
        { value: "0-30", label: "0-30 Days (Fresh)" },
        { value: "30-90", label: "30-90 Days (Stable)" },
        { value: "90-180", label: "90-180 Days (Slow)" },
        { value: "180+", label: "180+ Days (Dead)" }
      ]
    }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.stock-aging", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Stock Aging Analysis", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Aging Report" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Stock Aging Report",
        subTitle: "Identify liquidity risks and dead stock capital",
        stats: reportStats,
        columns,
        data: batches,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        chartData: barChartData,
        chartConfig: barChartConfig,
        onExport: () => alert("Exporting Stock Aging Report...")
      }
    )
  ] });
}
export {
  StockAging as default
};
