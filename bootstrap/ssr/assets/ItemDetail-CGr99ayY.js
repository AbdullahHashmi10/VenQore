import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-CIfs9UJy.js";
import { Box } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
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
function ItemDetail({ products }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Item Detail Report",
      subtitle: "Comprehensive details of all products in inventory",
      icon: Box,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "SKU" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Avg FIFO Cost" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Sale Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center", children: "Stock" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: products.map((product) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800 dark:text-white", children: product.name }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-500", children: product.sku || "N/A" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase", children: product.category?.name || "Uncategorized" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400", children: formatCurrency(product.avg_unit_cost ?? product.cost_price) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency(product.price) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-lg text-xs font-bold ${(product.fifo_qty ?? product.stock_quantity) > 10 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`, children: formatNumber(product.fifo_qty ?? product.stock_quantity ?? 0) }) })
        ] }, product.id)) })
      ] }) })
    }
  );
}
export {
  ItemDetail as default
};
