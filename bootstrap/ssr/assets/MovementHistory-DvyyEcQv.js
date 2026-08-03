import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { ArrowDownLeft, ArrowUpRight, Activity, Package, FileText, TrendingDown, TrendingUp, ArrowRightLeft } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DW_Px1Kd.js";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { a as formatNumber } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import "recharts";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function MovementHistory({ movements = [], filters = {}, products = [], warehouses = [] }) {
  const {
    store
  } = usePage().props;
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let mostActiveItemMap = {};
    movements.forEach((m) => {
      const qty = Math.abs(parseFloat(m.quantity) || 0);
      const type = m.type || "unknown";
      const isIn = ["purchase", "received", "return", "adjustment_in", "production", "transfer_in", "in"].includes(type);
      if (isIn) totalIn += qty;
      else totalOut += qty;
      const prodId = m.product_id || m.product?.id;
      if (prodId) {
        mostActiveItemMap[prodId] = (mostActiveItemMap[prodId] || 0) + 1;
      }
    });
    let mostActiveId = Object.keys(mostActiveItemMap).sort((a, b) => mostActiveItemMap[b] - mostActiveItemMap[a])[0];
    const mostActiveProduct = products.find((p) => p.id == mostActiveId);
    return {
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      mostActive: mostActiveProduct ? mostActiveProduct.name : "N/A"
    };
  }, [movements]);
  const chartData = useMemo(() => {
    const grouped = {};
    movements.slice().reverse().forEach((m) => {
      const date = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!grouped[date]) grouped[date] = { name: date, In: 0, Out: 0 };
      const qty = Math.abs(parseFloat(m.quantity) || 0);
      const isIn = ["purchase", "received", "return", "adjustment_in", "production", "transfer_in", "in"].includes(m.type);
      if (isIn) grouped[date].In += qty;
      else grouped[date].Out += qty;
    });
    return Object.values(grouped);
  }, [movements]);
  const chartConfig = {
    type: "bar",
    // or 'area'
    bars: [
      { dataKey: "In", fill: vq.emerald[500], name: "Inbound" },
      { dataKey: "Out", fill: vq.red[500], name: "Outbound" }
    ],
    xAxisKey: "name"
  };
  const reportStats = [
    {
      label: "Total Inbound",
      value: formatNumber(stats.totalIn),
      subValue: "Units Received",
      icon: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 20, className: "text-emerald-500" }),
      type: "up"
    },
    {
      label: "Total Outbound",
      value: formatNumber(stats.totalOut),
      subValue: "Units Dispatched",
      icon: /* @__PURE__ */ jsx(ArrowUpRight, { size: 20, className: "text-red-500" }),
      type: "down"
    },
    {
      label: "Net Flow",
      value: stats.netChange > 0 ? `+${formatNumber(stats.netChange)}` : formatNumber(stats.netChange),
      subValue: "Inventory Impact",
      icon: /* @__PURE__ */ jsx(Activity, { size: 20, className: "text-blue-500" }),
      type: "neutral"
    },
    {
      label: "Most Active Item",
      value: stats.mostActive.substring(0, 15) + (stats.mostActive.length > 15 ? "..." : ""),
      subValue: "Highest Frequency",
      icon: /* @__PURE__ */ jsx(Package, { size: 20, className: "text-orange-500" }),
      type: "neutral"
    }
  ];
  const getTypeStyle = (type) => {
    switch (type) {
      case "sale":
        return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }), label: "Sale" };
      case "purchase":
        return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 14 }), label: "Purchase" };
      case "return":
        return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: /* @__PURE__ */ jsx(ArrowRightLeft, { size: 14 }), label: "Return" };
      case "adjustment_in":
        return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }), label: "Adjustment (+)" };
      case "adjustment_out":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: /* @__PURE__ */ jsx(TrendingDown, { size: 14 }), label: "Adjustment (-)" };
      case "damage":
        return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-500", icon: /* @__PURE__ */ jsx(Activity, { size: 14 }), label: "Damage" };
      default:
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", icon: /* @__PURE__ */ jsx(Activity, { size: 14 }), label: type?.replace("_", " ") || "Unknown" };
    }
  };
  const columns = [
    {
      key: "created_at",
      label: "Timeline",
      sortable: true,
      width: "180px",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-200 text-sm", children: new Date(row.created_at).toLocaleDateString() }),
        /* @__PURE__ */ jsx("span", { className: "text-1xs text-slate-400 font-mono", children: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
      ] })
    },
    {
      key: "product",
      label: "Product Info",
      sortable: true,
      width: "280px",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden", children: row.product?.image ? /* @__PURE__ */ jsx("img", { src: `/storage/${row.product.image}`, className: "w-full h-full object-cover", alt: "", onError: (e) => e.target.style.display = "none" }) : /* @__PURE__ */ jsx(Package, { size: 16, className: "text-slate-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1", title: row.product?.name, children: row.product?.name || "Unknown Item" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs font-mono text-slate-500", children: row.product?.sku || "NO-SKU" })
        ] })
      ] })
    },
    {
      key: "type",
      label: "Movement Type",
      sortable: true,
      render: (row) => {
        const style = getTypeStyle(row.type);
        return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-transparent ${style.bg} ${style.text} w-fit`, children: [
          style.icon,
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold capitalize", children: style.label })
        ] });
      }
    },
    {
      key: "quantity",
      label: "Volume",
      align: "right",
      sortable: true,
      render: (row) => {
        const isIn = ["purchase", "received", "return", "adjustment_in", "production", "transfer_in", "in"].includes(row.type);
        const val = Math.abs(parseFloat(row.quantity) || 0);
        return /* @__PURE__ */ jsxs("div", { className: `font-mono font-bold text-sm ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`, children: [
          isIn ? "+" : "-",
          formatNumber(val)
        ] });
      }
    },
    {
      key: "reference",
      label: "Reference",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [
        /* @__PURE__ */ jsx(FileText, { size: 14 }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono font-medium", children: [
          row.reference_type ? row.reference_type.substring(0, 3).toUpperCase() : "SYS",
          " #",
          row.reference_id
        ] })
      ] })
    },
    {
      key: "warehouse",
      label: "Location",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded", children: row.warehouse?.name || "Main" })
    },
    {
      key: "user",
      label: "Authorized By",
      align: "right",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-slate-700 dark:text-slate-300", children: row.user?.name || "System" }),
        /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xs font-bold text-slate-500", children: row.user?.name ? row.user.name.charAt(0) : "S" })
      ] })
    }
  ];
  const filterDefs = [
    {
      key: "product_id",
      type: "select",
      label: "Product",
      options: products.map((p) => ({ value: p.id, label: p.name }))
    },
    {
      key: "warehouse_id",
      type: "select",
      label: "Warehouse",
      options: warehouses.map((w) => ({ value: w.id, label: w.name }))
    },
    {
      key: "type",
      type: "select",
      label: "Type",
      options: [
        { value: "sale", label: "Sale" },
        { value: "purchase", label: "Purchase" },
        { value: "return", label: "Return" },
        { value: "adjustment_in", label: "Adjustment (+)" },
        { value: "adjustment_out", label: "Adjustment (-)" }
      ]
    },
    {
      key: "start_date",
      type: "date",
      label: "Start Date"
    },
    {
      key: "end_date",
      type: "date",
      label: "End Date"
    }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.movement-history", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Stock Movement", children: [
    /* @__PURE__ */ jsx(Head, { title: "Movement History" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Stock Movement Log",
        subTitle: "Audit trail of all inventory transactions",
        stats: reportStats,
        columns,
        data: movements,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        chartData,
        chartConfig,
        onExport: () => alert("Exporting Movement History...")
      }
    )
  ] });
}
export {
  MovementHistory as default
};
