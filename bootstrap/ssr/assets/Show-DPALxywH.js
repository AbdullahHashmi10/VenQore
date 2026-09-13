import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, a as formatDate } from "./format-131Nyq79.js";
import { ArrowLeft, Printer, PackageCheck, Receipt } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
function ReturnShow({ return: returnData, restockMovements = [] }) {
  const tt = useTermText();
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
          }, className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
            "Return #",
            returnData?.reference_number || returnData?.id
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.print(),
            className: "flex items-center gap-2 bg-surface text-ink-secondary dark:text-ink border border-line px-4 py-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 font-medium",
            children: [
              /* @__PURE__ */ jsx(Printer, { size: 18 }),
              " Print"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: tt("Customer") }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: returnData?.customer?.name || tt("Walk-in Customer") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Net Amount" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-600", children: formatCurrency(Math.abs(returnData?.total || 0), store) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatDate(returnData?.created_at, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Processed By" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: returnData?.user?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Refund Method" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink capitalize", children: returnData?.payment_method || "N/A" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4", children: "Items Returned" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Item" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Amount" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: (returnData?.items || []).map((item, index) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "py-3", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: item.product?.name || tt("Unknown Product") }),
              item.variant && /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
                "Variant: ",
                item.variant.sku
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center text-ink-secondary", children: Math.abs(item.quantity) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-ink-secondary", children: formatCurrency(item.unit_price, store) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-ink", children: formatCurrency(Math.abs(item.subtotal || item.net_amount || 0), store) })
          ] }, item.id || index)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PackageCheck, { size: 16 }),
          " Stock Restocked"
        ] }),
        restockMovements.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No stock movement records found for this return." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Warehouse" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Qty Restocked" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: restockMovements.map((mv) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-ink", children: mv.product?.name || `Product #${mv.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-sm text-ink-muted", children: mv.warehouse_id || "—" }),
            /* @__PURE__ */ jsxs("td", { className: "py-3 text-right font-medium text-emerald-600", children: [
              "+",
              mv.quantity
            ] })
          ] }, mv.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Receipt, { size: 16 }),
          " Refund"
        ] }),
        creditNotePayment ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: "Store Credit Issued" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
              creditNotePayment.reference || "Credit note",
              " — ",
              formatDate(creditNotePayment.date, store)
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-bold text-blue-600", children: formatCurrency(Math.abs(creditNotePayment.amount), store) })
        ] }) : cashRefundPayment ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: "Cash Refund" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
              cashRefundPayment.reference || "Cash refund",
              " — ",
              formatDate(cashRefundPayment.date, store)
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: formatCurrency(Math.abs(cashRefundPayment.amount), store) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No refund payment record found for this return." })
      ] })
    ] })
  ] });
}
export {
  ReturnShow as default
};
