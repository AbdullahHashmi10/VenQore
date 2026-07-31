import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-CIfs9UJy.js";
import { List } from "lucide-react";
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
function ExpenseByItem({ expenses }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Expense by Item",
      subtitle: "Detailed list of all individual expenses",
      icon: List,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: expenses.map((exp) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-500", children: new Date(exp.date).toLocaleDateString() }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm font-bold text-slate-800 dark:text-white", children: exp.reference || "N/A" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase", children: exp.category }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-400", children: exp.description || "No description" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-black text-red-600 dark:text-red-400", children: formatCurrency(exp.amount, store) })
        ] }, exp.id)) })
      ] }) })
    }
  );
}
export {
  ExpenseByItem as default
};
