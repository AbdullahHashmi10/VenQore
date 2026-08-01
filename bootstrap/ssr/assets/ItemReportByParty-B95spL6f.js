import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import { R as ReportsLayout } from "./ReportsLayout-DYtHXvvS.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "lucide-react";
import "recharts";
import "./OneGlanceLayout-KMWHwZqK.js";
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
function ItemReportByParty({ data = [], stats = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const columns = [
    {
      key: "party_name",
      label: "Customer",
      sortable: true
    },
    {
      key: "product_name",
      label: "Product",
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
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(row.total) })
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
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Item Report by Customer", children: [
    /* @__PURE__ */ jsx(Head, { title: "Item Report by Customer" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Item Report by Customer",
        subTitle: "Net revenue per product, grouped by customer — FIFO reconciled",
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
