import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { Tags } from "lucide-react";
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
function SalePurchaseByItemCategory({ categories }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Sale & Purchase by Category",
      subtitle: "Transaction summary grouped by product categories",
      icon: Tags,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Sales" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Purchases" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Net" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: categories.map((cat, idx) => {
          const sales = cat.products.reduce((sum, p) => sum + p.sale_items_sum_subtotal, 0);
          const purchases = cat.products.reduce((sum, p) => sum + p.purchase_items_sum_subtotal, 0);
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: cat.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400", children: formatCurrency(sales) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-red-600 dark:text-red-400", children: formatCurrency(purchases) }),
            /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right text-sm font-bold ${sales - purchases >= 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(sales - purchases) })
          ] }, idx);
        }) })
      ] }) })
    }
  );
}
export {
  SalePurchaseByItemCategory as default
};
