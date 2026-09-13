import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { AlertTriangle, Calendar, Package, CheckCircle } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DM-pFLtH.js";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { b as formatNumber } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "recharts";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./OneGlanceLayout-D0x15wPs.js";
import "./plans-CxabWI_P.js";
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
function ExpiryReport({ batches = [], stats = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
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
      label: tt("Product"),
      sortable: true,
      render: (row) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-ink", children: row.product?.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
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
        let color = "text-ink-secondary";
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
