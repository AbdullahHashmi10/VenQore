import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { F as FilterPanel } from "./FilterPanel-BxGIbnsP.js";
import { FileText, Download, Printer } from "lucide-react";
import "./OneGlanceLayout-C-94hBqK.js";
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
function ReportPage({
  title,
  subtitle,
  icon: Icon = FileText,
  breadcrumbs = [],
  filters = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  stats = null,
  children
}) {
  const {
    store
  } = usePage().props;
  const handlePrint = () => {
    window.print();
  };
  const handleExport = () => {
    alert("Export functionality coming soon");
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title, children: [
    /* @__PURE__ */ jsx(Head, { title }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-none print:hidden", children: [
        /* @__PURE__ */ jsx(
          PageHeader,
          {
            title,
            subtitle,
            icon: Icon,
            breadcrumbs: [
              { label: "Reports", href: route("store.reports.index", {
                store_slug: store.slug
              }) },
              ...breadcrumbs
            ],
            actions: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleExport,
                  className: "px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium",
                  children: [
                    /* @__PURE__ */ jsx(Download, { size: 16 }),
                    "Export"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handlePrint,
                  className: "px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-500/20",
                  children: [
                    /* @__PURE__ */ jsx(Printer, { size: 16 }),
                    "Print"
                  ]
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-4" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden print:block mb-8 text-center", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: subtitle }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400 mt-2", children: [
          "Generated on ",
          (/* @__PURE__ */ new Date()).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto min-h-0 pb-6", children: [
        filters.length > 0 && /* @__PURE__ */ jsx("div", { className: "print:hidden mb-4", children: /* @__PURE__ */ jsx(
          FilterPanel,
          {
            filters,
            values: filterValues,
            onChange: onFilterChange,
            onReset: onResetFilters,
            compact: true,
            defaultExpanded: false
          }
        ) }),
        stats && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 mb-6", children: stats }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:shadow-none print:border-none", children })
      ] })
    ] })
  ] });
}
export {
  ReportPage as default
};
