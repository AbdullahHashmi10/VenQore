import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-CIfs9UJy.js";
import { PieChart } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-CCBXGMSb.js";
import "./OneGlanceLayout-BqRkhJQJ.js";
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
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-BxGIbnsP.js";
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
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-500 uppercase tracking-widest", children: "Category Breakdown" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: expenses.map((exp, idx) => {
            const percentage = total > 0 ? exp.total / total * 100 : 0;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: exp.category || "Uncategorized" }),
                /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
                  formatCurrency(exp.total, store),
                  " (",
                  percentage.toFixed(1),
                  "%)"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bg-indigo-500 h-full transition-all duration-500",
                  style: { width: `${percentage}%` }
                }
              ) })
            ] }, idx);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20", children: /* @__PURE__ */ jsx(PieChart, { size: 40 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Total Expenses" }),
          /* @__PURE__ */ jsx("p", { className: "text-4xl font-black text-slate-900 dark:text-white", children: formatCurrency(total, store) })
        ] })
      ] }) })
    }
  );
}
export {
  ExpenseByCategory as default
};
