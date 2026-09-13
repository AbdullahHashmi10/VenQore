import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { RefreshCcw, FileText } from "lucide-react";
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
function RefundReasons({ reasons = [] }) {
  const { props } = usePage();
  const store = props.store || {};
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Refund Reasons Report", activeMenu: "Reports", children: [
    /* @__PURE__ */ jsx(Head, { title: "Refund Reasons Report" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center bg-surface p-6 rounded-2xl border border-line shadow-sm", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(RefreshCcw, { className: "w-6 h-6 text-brand-500" }),
          "Refund Reasons Summary"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Breakdown of sales returns and refund reasons across your store." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl border border-line shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line text-xs text-ink-muted font-bold uppercase", children: [
          /* @__PURE__ */ jsx("th", { className: "p-4", children: "Refund Reason" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Total Returns" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Total Refunded" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: reasons.length > 0 ? reasons.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4 font-semibold text-ink", children: item.refund_reason || "Unspecified Reason" }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center font-bold text-ink-secondary", children: item.count }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-right font-bold text-rose-600 dark:text-rose-400", children: formatCurrency(item.total_amount || 0, store) })
        ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "p-12 text-center text-ink-muted", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 mb-2 text-neutral-300 dark:text-ink-secondary" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "No refund records found." })
        ] }) }) }) })
      ] }) })
    ] })
  ] });
}
export {
  RefundReasons as default
};
