import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { M as MasterReport } from "./MasterReport-CViLlIu8.js";
import { R as ReportsLayout } from "./ReportsLayout-B6Be5tOZ.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { u as useTermText } from "./terms-BnWz3Igl.js";
import "lucide-react";
import "recharts";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./OneGlanceLayout-B_nL-Bzp.js";
import "./plans-Dp89V3MJ.js";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function ItemReportByParty({ data = [], stats = [], filters = {} }) {
  const tt = useTermText();
  const {
    store
  } = usePage().props;
  const columns = [
    {
      key: "party_name",
      label: tt("Customer"),
      sortable: true
    },
    {
      key: "product_name",
      label: tt("Product"),
      sortable: true
    },
    {
      key: "quantity",
      label: "Qty",
      align: "center",
      sortable: true
    },
    {
      key: "total",
      label: "Net Revenue",
      // ← was subtotal. Now reads net_amount from the waterfall.
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: formatCurrency(row.total) })
    }
  ];
  const filterDefs = [
    { key: "start_date", type: "date", label: "Start Date" },
    { key: "end_date", type: "date", label: "End Date" }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.item-report-by-party", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: tt("Item Report by Customer"), children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Item Report by Customer") }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: tt("Item Report by Customer"),
        subTitle: tt("Net revenue per product, grouped by customer — FIFO reconciled"),
        stats,
        columns,
        data,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange
      }
    )
  ] });
}
export {
  ItemReportByParty as default
};
