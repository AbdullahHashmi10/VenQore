import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { Filter, ChevronDown, X, RefreshCw, FileText, Download, Printer } from "lucide-react";
import "./OneGlanceLayout-D0x15wPs.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function FilterPanel({
  filters = [],
  values = {},
  onChange,
  onReset,
  onApply,
  collapsible = true,
  defaultExpanded = true,
  compact = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };
  const hasActiveFilters = Object.values(values).some((v) => v !== "" && v !== null && v !== void 0);
  const renderFilter = (filter) => {
    const inputBaseClass = `w-full ${compact ? "px-2 py-1 text-xs rounded-lg" : "px-3 py-2 text-sm rounded-xl"} bg-surface border border-line outline-none focus:ring-2 ring-brand-500/20`;
    switch (filter.type) {
      case "select":
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[150px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider", children: filter.label }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: values[filter.key] || "",
                onChange: (e) => handleChange(filter.key, e.target.value),
                className: `${inputBaseClass} appearance-none cursor-pointer`,
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "All" }),
                  filter.options?.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, children: opt.label }, opt.value))
                ]
              }
            ),
            /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" })
          ] })
        ] }, filter.key);
      case "date":
        const dateValue = values[filter.key] ? String(values[filter.key]).substring(0, 10) : "";
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[150px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider", children: filter.label }),
          /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: dateValue,
              onChange: (e) => handleChange(filter.key, e.target.value),
              className: `${inputBaseClass} pl-3`
            }
          ) })
        ] }, filter.key);
      case "dateRange":
        const fromValue = values[`${filter.key}_from`] ? String(values[`${filter.key}_from`]).substring(0, 10) : "";
        const toValue = values[`${filter.key}_to`] ? String(values[`${filter.key}_to`]).substring(0, 10) : "";
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[300px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider", children: filter.label }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "relative flex-1", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: fromValue,
                onChange: (e) => handleChange(`${filter.key}_from`, e.target.value),
                className: inputBaseClass
              }
            ) }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-sm", children: "to" }),
            /* @__PURE__ */ jsx("div", { className: "relative flex-1", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: toValue,
                onChange: (e) => handleChange(`${filter.key}_to`, e.target.value),
                className: inputBaseClass
              }
            ) })
          ] })
        ] }, filter.key);
      case "search":
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[200px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider", children: filter.label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: filter.placeholder || "Search...",
              value: values[filter.key] || "",
              onChange: (e) => handleChange(filter.key, e.target.value),
              className: inputBaseClass
            }
          )
        ] }, filter.key);
      case "number":
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[120px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-ink-muted mb-1.5 uppercase tracking-wider", children: filter.label }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              placeholder: filter.placeholder || "0",
              value: values[filter.key] || "",
              onChange: (e) => handleChange(filter.key, e.target.value),
              className: inputBaseClass
            }
          )
        ] }, filter.key);
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `bg-surface rounded-xl border border-line overflow-hidden ${compact ? "mb-2 shadow-sm" : "mb-6"}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex items-center justify-between ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-3"} ${collapsible ? "cursor-pointer" : ""} border-b border-line`,
        onClick: () => collapsible && setIsExpanded(!isExpanded),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { size: compact ? 14 : 16, className: "text-ink-muted" }),
            /* @__PURE__ */ jsx("span", { className: `font-semibold ${compact ? "text-xs uppercase tracking-wider" : "text-sm"} text-ink-secondary dark:text-ink`, children: "Filters" }),
            hasActiveFilters && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-2xs font-bold rounded", children: "Active" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            compact && isExpanded && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mr-2", children: [
              hasActiveFilters && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    onReset();
                  },
                  className: "px-2 py-0.5 text-2xs font-medium text-ink-muted hover:text-ink-secondary bg-sunken rounded hover:bg-interactive-hover transition-colors",
                  children: "Clear"
                }
              ),
              onApply && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    onApply();
                  },
                  className: "px-2 py-0.5 text-2xs font-medium text-white bg-brand-600 rounded hover:bg-brand-700 transition-colors",
                  children: "Apply"
                }
              )
            ] }),
            collapsible && /* @__PURE__ */ jsx(
              ChevronDown,
              {
                size: 16,
                className: `text-ink-muted transition-transform ${isExpanded ? "rotate-180" : ""}`
              }
            )
          ] })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ jsxs("div", { className: compact ? "p-2" : "p-4", children: [
      /* @__PURE__ */ jsx("div", { className: `flex flex-wrap ${compact ? "gap-2" : "gap-4"}`, children: filters.map(renderFilter) }),
      !compact && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 mt-4 pt-4 border-t border-line", children: [
        hasActiveFilters && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onReset,
            className: "px-3 py-1.5 text-sm text-ink-secondary hover:text-ink dark:hover:text-neutral-200 flex items-center gap-1.5 transition-colors",
            children: [
              /* @__PURE__ */ jsx(X, { size: 14 }),
              "Clear"
            ]
          }
        ),
        onApply && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onApply,
            className: "px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { size: 14 }),
              "Apply"
            ]
          }
        )
      ] })
    ] })
  ] });
}
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
                  className: "px-3 py-2 bg-surface border border-line rounded-lg text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-2 text-sm font-medium",
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
                  className: "px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg ",
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
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-ink", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: subtitle }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted mt-2", children: [
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
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 bg-surface rounded-2xl border border-line shadow-sm overflow-hidden print:shadow-none print:border-none", children })
      ] })
    ] })
  ] });
}
export {
  ReportPage as default
};
