import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Landmark, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { M as MasterReport } from "./MasterReport-DW_Px1Kd.js";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "recharts";
import "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function TaxReport({ tax_records = [], stats = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const reportStats = [
    {
      label: "Net Tax Payable",
      value: formatCurrency(stats.net_tax),
      subValue: stats.net_tax >= 0 ? "Payable" : "Refundable",
      icon: /* @__PURE__ */ jsx(Landmark, { size: 18 }),
      type: stats.net_tax >= 0 ? "down" : "up"
      // Payable is bad (red/down), Refundable is good (green/up)
    },
    {
      label: "Output Tax",
      value: formatCurrency(stats.total_output_tax),
      icon: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }),
      type: "up"
    },
    {
      label: "Input Tax",
      value: formatCurrency(stats.total_input_tax),
      icon: /* @__PURE__ */ jsx(TrendingDown, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Taxable",
      value: formatCurrency(stats.total_taxable),
      icon: /* @__PURE__ */ jsx(Percent, { size: 18 }),
      type: "neutral"
    }
  ];
  const columns = [
    {
      key: "date",
      label: "Date",
      type: "date",
      sortable: true
    },
    {
      key: "invoice_number",
      label: "Invoice #",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-500", children: row.invoice_number })
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${row.type === "sale" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"}`, children: row.type === "sale" ? "Output Tax (Sales)" : "Input Tax (Purchase)" })
    },
    {
      key: "taxable_amount",
      label: "Taxable Amt",
      align: "right",
      sortable: true,
      render: (row) => formatCurrency(row.taxable_amount)
    },
    {
      key: "tax_amount",
      label: "Tax Amount",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: `font-bold ${row.type === "sale" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`, children: formatCurrency(row.tax_amount) })
    }
  ];
  const filterDefs = [
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
    router.get(route("store.reports.tax", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Tax Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Tax Report" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Tax Report",
        stats: reportStats,
        columns,
        data: tax_records,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: () => alert("Export feature coming soon")
      }
    )
  ] });
}
export {
  TaxReport as default
};
