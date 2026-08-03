import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, b as formatDate } from "./format-B_ph0Qec.js";
import { ArrowLeft, Printer, PackageCheck, Receipt } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ReturnShow({ return: returnData, restockMovements = [] }) {
  const { store } = usePage().props;
  const creditNotePayment = (returnData?.payments || []).find((p) => p.method === "store_credit");
  const cashRefundPayment = (returnData?.payments || []).find((p) => p.method === "cash");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Return #${returnData?.reference_number || returnData?.id || ""}`, activeMenu: "Sales", children: [
    /* @__PURE__ */ jsx(Head, { title: `Return #${returnData?.reference_number || returnData?.id || ""}` }),
    /* @__PURE__ */ jsx("style", { children: `
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                    nav, aside, header, .no-print { display: none !important; }
                    main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                }
            ` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between no-print", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: "#", onClick: (e) => {
            e.preventDefault();
            window.history.back();
          }, className: "p-2 text-slate-400 hover:text-slate-600 rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: [
            "Return #",
            returnData?.reference_number || returnData?.id
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.print(),
            className: "flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium",
            children: [
              /* @__PURE__ */ jsx(Printer, { size: 18 }),
              " Print"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Customer" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white", children: returnData?.customer?.name || "Walk-in Customer" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Net Amount" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-red-600", children: formatCurrency(Math.abs(returnData?.total || 0), store) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: formatDate(returnData?.created_at, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Processed By" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: returnData?.user?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Refund Method" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white capitalize", children: returnData?.payment_method || "N/A" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4", children: "Items Returned" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Item" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Amount" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: (returnData?.items || []).map((item, index) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "py-3", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: item.product?.name || "Unknown Product" }),
              item.variant && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                "Variant: ",
                item.variant.sku
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center text-slate-600 dark:text-slate-300", children: Math.abs(item.quantity) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-slate-600 dark:text-slate-300", children: formatCurrency(item.unit_price, store) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-slate-800 dark:text-white", children: formatCurrency(Math.abs(item.subtotal || item.net_amount || 0), store) })
          ] }, item.id || index)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PackageCheck, { size: 16 }),
          " Stock Restocked"
        ] }),
        restockMovements.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No stock movement records found for this return." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Warehouse" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Qty Restocked" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: restockMovements.map((mv) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-slate-800 dark:text-white", children: mv.product?.name || `Product #${mv.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-sm text-slate-500", children: mv.warehouse_id || "—" }),
            /* @__PURE__ */ jsxs("td", { className: "py-3 text-right font-medium text-emerald-600", children: [
              "+",
              mv.quantity
            ] })
          ] }, mv.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Receipt, { size: 16 }),
          " Refund"
        ] }),
        creditNotePayment ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Store Credit Issued" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
              creditNotePayment.reference || "Credit note",
              " — ",
              formatDate(creditNotePayment.date, store)
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-bold text-blue-600", children: formatCurrency(Math.abs(creditNotePayment.amount), store) })
        ] }) : cashRefundPayment ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-800 dark:text-white", children: "Cash Refund" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
              cashRefundPayment.reference || "Cash refund",
              " — ",
              formatDate(cashRefundPayment.date, store)
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: formatCurrency(Math.abs(cashRefundPayment.amount), store) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No refund payment record found for this return." })
      ] })
    ] })
  ] });
}
export {
  ReturnShow as default
};
