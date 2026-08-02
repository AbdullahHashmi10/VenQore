import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Filter, ChevronDown, X, RefreshCw } from "lucide-react";
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
    const inputBaseClass = `w-full ${compact ? "px-2 py-1 text-xs rounded-lg" : "px-3 py-2 text-sm rounded-xl"} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500/20`;
    switch (filter.type) {
      case "select":
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[150px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider", children: filter.label }),
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
            /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" })
          ] })
        ] }, filter.key);
      case "date":
        const dateValue = values[filter.key] ? String(values[filter.key]).substring(0, 10) : "";
        return /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[150px]", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider", children: filter.label }),
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
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider", children: filter.label }),
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
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-sm", children: "to" }),
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
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider", children: filter.label }),
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
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider", children: filter.label }),
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
  return /* @__PURE__ */ jsxs("div", { className: `bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden ${compact ? "mb-2 shadow-sm" : "mb-6"}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex items-center justify-between ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-3"} ${collapsible ? "cursor-pointer" : ""} border-b border-slate-100 dark:border-slate-800`,
        onClick: () => collapsible && setIsExpanded(!isExpanded),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { size: compact ? 14 : 16, className: "text-slate-400" }),
            /* @__PURE__ */ jsx("span", { className: `font-semibold ${compact ? "text-xs uppercase tracking-wider" : "text-sm"} text-slate-700 dark:text-slate-200`, children: "Filters" }),
            hasActiveFilters && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xs font-bold rounded", children: "Active" })
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
                  className: "px-2 py-0.5 text-2xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 transition-colors",
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
                  className: "px-2 py-0.5 text-2xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors",
                  children: "Apply"
                }
              )
            ] }),
            collapsible && /* @__PURE__ */ jsx(
              ChevronDown,
              {
                size: 16,
                className: `text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`
              }
            )
          ] })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ jsxs("div", { className: compact ? "p-2" : "p-4", children: [
      /* @__PURE__ */ jsx("div", { className: `flex flex-wrap ${compact ? "gap-2" : "gap-4"}`, children: filters.map(renderFilter) }),
      !compact && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800", children: [
        hasActiveFilters && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onReset,
            className: "px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors",
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
            className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors",
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
export {
  FilterPanel as F
};
