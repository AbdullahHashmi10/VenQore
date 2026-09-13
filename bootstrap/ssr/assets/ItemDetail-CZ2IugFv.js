import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { Box } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency, b as formatNumber } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./PageHeader-qaWJfzfS.js";
function ItemDetail({ products }) {
  const { store } = usePage().props;
  const tt = useTermText();
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Item Detail Report",
      subtitle: tt("Comprehensive details of all products in inventory"),
      icon: Box,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: tt("Product") }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "SKU" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Avg FIFO Cost" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Sale Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Stock" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: products.map((product) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "font-bold text-ink", children: product.name }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-ink-muted", children: product.sku || "N/A" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-lg bg-sunken text-2xs font-bold text-ink-secondary uppercase", children: product.category?.name || "Uncategorized" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-ink-secondary", children: formatCurrency(product.avg_unit_cost ?? product.cost_price) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-brand-600 dark:text-brand-400", children: formatCurrency(product.price) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-lg text-xs font-bold ${(product.fifo_qty ?? product.stock_quantity) > 10 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`, children: formatNumber(product.fifo_qty ?? product.stock_quantity ?? 0) }) })
        ] }, product.id)) })
      ] }) })
    }
  );
}
export {
  ItemDetail as default
};
