import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { AlertTriangle, Calendar, Package, CheckCircle } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DIa1NNvN.js";
import { R as ReportsLayout } from "./ReportsLayout-Dg4OWYWu.js";
import { a as formatNumber } from "./format-B_ph0Qec.js";
import "recharts";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ExpiryReport({ batches = [], stats = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const reportStats = [
    {
      label: "Expired Items",
      value: stats.expired_count,
      icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }),
      type: "down"
    },
    {
      label: "Expiring Soon (30 Days)",
      value: stats.expiring_soon_count,
      icon: /* @__PURE__ */ jsx(Calendar, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Batches",
      value: stats.total_batches,
      icon: /* @__PURE__ */ jsx(Package, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Quantity",
      value: formatNumber(stats.total_quantity),
      icon: /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
      type: "neutral"
    }
  ];
  const columns = [
    {
      key: "product_name",
      label: "Product",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-slate-900 dark:text-white", children: row.product?.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500", children: [
          "Batch: ",
          row.batch_number
        ] })
      ] })
    },
    {
      key: "expiry_date",
      label: "Expiry Date",
      sortable: true,
      render: (row) => {
        const date = new Date(row.expiry_date);
        const today = /* @__PURE__ */ new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        let color = "text-slate-600 dark:text-slate-400";
        if (diffDays < 0) color = "text-red-600 dark:text-red-400 font-bold";
        else if (diffDays <= 30) color = "text-amber-600 dark:text-amber-400 font-bold";
        else if (diffDays <= 90) color = "text-blue-600 dark:text-blue-400";
        return /* @__PURE__ */ jsxs("span", { className: color, children: [
          date.toLocaleDateString("en-PK"),
          " (",
          diffDays,
          " days)"
        ] });
      }
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatNumber(row.quantity) })
    },
    {
      key: "warehouse",
      label: "Warehouse",
      render: (row) => row.warehouse?.name || "-"
    }
  ];
  const filterDefs = [
    {
      key: "days_threshold",
      type: "select",
      label: "Expires Within",
      options: [
        { value: "30", label: "30 Days" },
        { value: "60", label: "60 Days" },
        { value: "90", label: "90 Days" },
        { value: "180", label: "6 Months" },
        { value: "365", label: "1 Year" }
      ]
    }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.expiry", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Expiry Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Expiry Report" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Expiry Report",
        stats: reportStats,
        columns,
        data: batches,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  ExpiryReport as default
};
