import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-kXIq83oc.js";
import { Hash } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-SZbN0U_-.js";
import "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-CJpcDBXD.js";
function TaxRateReport({ taxRates }) {
  const { store } = usePage().props;
  const totalTax = taxRates.reduce((sum, tr) => sum + tr.total_tax, 0);
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Tax Rate Report",
      subtitle: "Breakdown of tax collected by different tax rates",
      icon: Hash,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Tax Rate (%)" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center", children: "Invoice Count" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Total Tax Collected" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Share" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: taxRates.map((tr, idx) => {
          const share = totalTax > 0 ? tr.total_tax / totalTax * 100 : 0;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-black text-slate-800 dark:text-white", children: [
              tr.tax_rate,
              "%"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center text-sm text-slate-500", children: tr.count }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency(tr.total_tax) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-indigo-500 h-full", style: { width: `${share}%` } }) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-500", children: [
                share.toFixed(1),
                "%"
              ] })
            ] }) })
          ] }, idx);
        }) }),
        /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 font-black", children: [
          /* @__PURE__ */ jsx("td", { colSpan: "2", className: "px-6 py-4 text-sm text-slate-800 dark:text-white uppercase tracking-wider", children: "Total Tax" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-indigo-600 dark:text-indigo-400", children: formatCurrency(totalTax) }),
          /* @__PURE__ */ jsx("td", {})
        ] }) })
      ] }) })
    }
  );
}
export {
  TaxRateReport as default
};
