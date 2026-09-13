import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { BarChart3 } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import "./ReportsLayout-C08V7Mxf.js";
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
import "./PageHeader-qaWJfzfS.js";
function ItemCategoryWiseProfitLoss({ categories }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Category-wise Profit & Loss",
      subtitle: "Profitability analysis grouped by product categories",
      icon: BarChart3,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Revenue" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Cost" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Profit" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Margin" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: categories.map((cat, idx) => {
          const margin = cat.revenue > 0 ? cat.profit / cat.revenue * 100 : 0;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: cat.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-ink-secondary", children: formatCurrency(cat.revenue) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-ink-secondary", children: formatCurrency(cat.cost) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(cat.profit) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("span", { className: `px-2 py-1 rounded-lg text-xs font-bold ${margin > 20 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`, children: [
              margin.toFixed(1),
              "%"
            ] }) })
          ] }, idx);
        }) })
      ] }) })
    }
  );
}
export {
  ItemCategoryWiseProfitLoss as default
};
