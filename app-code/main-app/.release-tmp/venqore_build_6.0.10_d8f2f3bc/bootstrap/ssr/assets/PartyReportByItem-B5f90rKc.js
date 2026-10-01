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
function PartyReportByItem({ data = [], stats = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
  const columns = [
    {
      key: "product_name",
      label: tt("Product"),
      sortable: true
    },
    {
      key: "party_name",
      label: tt("Customer"),
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
    router.get(route("store.reports.party-report-by-item", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: tt("Customer Report by Item"), children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Customer Report by Item") }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: tt("Customer Report by Item"),
        subTitle: tt("Net revenue per customer, grouped by product — FIFO reconciled"),
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
  PartyReportByItem as default
};
