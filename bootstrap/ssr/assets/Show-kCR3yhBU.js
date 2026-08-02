import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, b as formatDate } from "./format-B_ph0Qec.js";
import { ArrowLeft, Printer, PackageMinus, FileWarning } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function DebitNoteShow({ note, stockMovements = [] }) {
  const { store } = usePage().props;
  const statusColors = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Debit Note #${note?.reference_number || note?.id || ""}`, activeMenu: "Finance", children: [
    /* @__PURE__ */ jsx(Head, { title: `Debit Note #${note?.reference_number || note?.id || ""}` }),
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
            "Debit Note #",
            note?.reference_number || note?.id
          ] }),
          /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[note?.status] || "bg-slate-100 text-slate-600"}`, children: note?.status })
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
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Supplier" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white", children: note?.supplier?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Amount" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-red-600", children: formatCurrency(note?.amount, store) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: formatDate(note?.date, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Reason" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: note?.reason || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Linked Purchase Order" }),
            note?.purchase ? /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchase-orders.show", { store_slug: store?.slug, purchase_order: note.purchase_id }),
                className: "text-sm font-medium text-indigo-600 hover:text-indigo-500",
                children: [
                  note.purchase.reference_number || `PO #${note.purchase_id}`,
                  " →"
                ]
              }
            ) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Not linked to a purchase order" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4", children: "Items" }),
        (note?.items || []).length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No line items recorded — this note was created as a flat adjustment." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Subtotal" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: note.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-slate-800 dark:text-white", children: item.product?.name || `Product #${item.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center text-slate-600 dark:text-slate-300", children: item.quantity }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-slate-600 dark:text-slate-300", children: formatCurrency(item.unit_price, store) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-slate-800 dark:text-white", children: formatCurrency(item.subtotal, store) })
          ] }, item.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PackageMinus, { size: 16 }),
          " Stock Returned to Supplier"
        ] }),
        stockMovements.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No stock was deducted for this note (pending approval, or a flat financial adjustment with no inventory impact)." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Qty Removed" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: stockMovements.map((mv) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-slate-800 dark:text-white", children: mv.product?.name || `Product #${mv.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-red-600", children: mv.quantity })
          ] }, mv.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileWarning, { size: 16 }),
          " GL Posting"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400", children: "This debit note has not been posted to the general ledger — no journal entry exists for it yet. Only the inventory-side stock return (above) is currently recorded." })
      ] })
    ] })
  ] });
}
export {
  DebitNoteShow as default
};
