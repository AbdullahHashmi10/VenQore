import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import ReportPage from "./ReportPage-DIT-Hv4K.js";
import { RefreshCw, Calendar } from "lucide-react";
import { usePage, router } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-Dg4OWYWu.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-CJpcDBXD.js";
function CashFlow({ operating, investing, financing, filters = {} }) {
  const { store } = usePage().props;
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const netCashFlow = operating + investing + financing;
  const applyDateFilter = () => {
    router.get(route("store.reports.cash-flow", {
      store_slug: store.slug
    }), {
      start_date: startDate,
      end_date: endDate
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(
    ReportPage,
    {
      title: "Cash Flow Statement",
      subtitle: `Analysis of cash movement in the business from ${filters.start_date || ""} to ${filters.end_date || ""}`,
      icon: RefreshCw,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row justify-between items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest", children: "Filter Cash Flow Period" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-sm", children: [
              /* @__PURE__ */ jsx(Calendar, { size: 14, className: "text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: startDate,
                  onChange: (e) => setStartDate(e.target.value),
                  className: "bg-transparent text-xs border-none outline-none text-slate-700 dark:text-slate-200"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold px-1", children: "TO" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: endDate,
                  onChange: (e) => setEndDate(e.target.value),
                  className: "bg-transparent text-xs border-none outline-none text-slate-700 dark:text-slate-200"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyDateFilter,
                className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-sm shadow-indigo-500/10 active:scale-95",
                children: "Apply Filter"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2", children: "Operating Activities" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-900 dark:text-white", children: formatCurrency(operating, store) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2", children: "Investing Activities" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-blue-900 dark:text-white", children: formatCurrency(investing, store) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2", children: "Financing Activities" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-purple-900 dark:text-white", children: formatCurrency(financing, store) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center shadow-lg", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-400 uppercase tracking-widest mb-1", children: "Net Cash Flow" }),
              /* @__PURE__ */ jsx("p", { className: "text-4xl font-black text-white", children: formatCurrency(netCashFlow, store) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: `w-16 h-16 rounded-2xl flex items-center justify-center ${netCashFlow >= 0 ? "bg-emerald-500" : "bg-red-500"} shadow-lg`, children: /* @__PURE__ */ jsx(RefreshCw, { size: 32, className: "text-white" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-500 uppercase tracking-widest", children: "Summary Breakdown" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Cash at Beginning of Period" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(0, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Net Increase/Decrease in Cash" }),
                /* @__PURE__ */ jsx("span", { className: `font-bold ${netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(netCashFlow, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between p-4 bg-indigo-600 text-white rounded-xl font-bold shadow-md", children: [
                /* @__PURE__ */ jsx("span", { children: "Cash at End of Period" }),
                /* @__PURE__ */ jsx("span", { children: formatCurrency(netCashFlow, store) })
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  CashFlow as default
};
