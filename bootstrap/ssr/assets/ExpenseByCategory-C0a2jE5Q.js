import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { PieChart } from "lucide-react";
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
function ExpenseByCategory({ expenses }) {
  const { store } = usePage().props;
  const total = expenses.reduce((sum, exp) => sum + exp.total, 0);
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Expense by Category",
      subtitle: "Breakdown of expenses across different categories",
      icon: PieChart,
      children: /* @__PURE__ */ jsx("div", { className: "p-8 space-y-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink-muted uppercase tracking-widest", children: "Category Breakdown" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: expenses.map((exp, idx) => {
            const percentage = total > 0 ? exp.total / total * 100 : 0;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: exp.category || "Uncategorized" }),
                /* @__PURE__ */ jsxs("span", { className: "text-ink-muted", children: [
                  formatCurrency(exp.total, store),
                  " (",
                  percentage.toFixed(1),
                  "%)"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-sunken h-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bg-brand-500 h-full transition-all duration-slower",
                  style: { width: `${percentage}%` }
                }
              ) })
            ] }, idx);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-app rounded-2xl p-8 flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-4 shadow-xl ", children: /* @__PURE__ */ jsx(PieChart, { size: 40 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Total Expenses" }),
          /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold text-ink", children: formatCurrency(total, store) })
        ] })
      ] }) })
    }
  );
}
export {
  ExpenseByCategory as default
};
