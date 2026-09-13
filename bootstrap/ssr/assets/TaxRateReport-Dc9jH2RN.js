import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { Hash } from "lucide-react";
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
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Tax Rate (%)" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Invoice Count" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Total Tax Collected" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Share" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: taxRates.map((tr, idx) => {
          const share = totalTax > 0 ? tr.total_tax / totalTax * 100 : 0;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-bold text-ink", children: [
              tr.tax_rate,
              "%"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center text-sm text-ink-muted", children: tr.count }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(tr.total_tax) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-24 bg-sunken h-1.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-brand-500 h-full", style: { width: `${share}%` } }) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted", children: [
                share.toFixed(1),
                "%"
              ] })
            ] }) })
          ] }, idx);
        }) }),
        /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app font-bold", children: [
          /* @__PURE__ */ jsx("td", { colSpan: "2", className: "px-6 py-4 text-sm text-ink uppercase tracking-wider", children: "Total Tax" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-brand-600 dark:text-brand-400", children: formatCurrency(totalTax) }),
          /* @__PURE__ */ jsx("td", {})
        ] }) })
      ] }) })
    }
  );
}
export {
  TaxRateReport as default
};
