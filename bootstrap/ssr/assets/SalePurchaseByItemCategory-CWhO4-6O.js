import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-kXIq83oc.js";
import { Tags } from "lucide-react";
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
function SalePurchaseByItemCategory({ categories }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Sale & Purchase by Category",
      subtitle: "Transaction summary grouped by product categories",
      icon: Tags,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Sales" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Purchases" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Net" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: categories.map((cat, idx) => {
          const sales = cat.products.reduce((sum, p) => sum + p.sale_items_sum_subtotal, 0);
          const purchases = cat.products.reduce((sum, p) => sum + p.purchase_items_sum_subtotal, 0);
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-slate-800 dark:text-white", children: cat.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400", children: formatCurrency(sales) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-red-600 dark:text-red-400", children: formatCurrency(purchases) }),
            /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right text-sm font-black ${sales - purchases >= 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(sales - purchases) })
          ] }, idx);
        }) })
      ] }) })
    }
  );
}
export {
  SalePurchaseByItemCategory as default
};
