import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, b as formatDate } from "./format-B_ph0Qec.js";
import { ArrowLeft, Printer, Receipt, Wallet, CreditCard, Landmark, Banknote } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const methodIcon = (method) => {
  switch (method) {
    case "cash":
      return Banknote;
    case "bank":
      return Landmark;
    case "card":
      return CreditCard;
    default:
      return Wallet;
  }
};
function PaymentShow({ payment, allocations = [] }) {
  const { store } = usePage().props;
  const isIn = payment?.type === "in" || payment?.type === "received";
  const MethodIcon = methodIcon(payment?.method);
  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);
  const unallocated = Math.max(0, parseFloat(payment?.amount || 0) - totalAllocated);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Payment #${payment?.id || ""}`, activeMenu: "Finance", children: [
    /* @__PURE__ */ jsx(Head, { title: `Payment #${payment?.id || ""}` }),
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
            "Payment #",
            payment?.reference || payment?.id
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.print(),
            className: "flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium",
            children: [
              /* @__PURE__ */ jsx(Printer, { size: 18 }),
              " Print Receipt"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Party" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white", children: payment?.party?.name || "N/A" }),
            payment?.party?.type && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 capitalize", children: payment.party.type })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Amount" }),
            /* @__PURE__ */ jsxs("p", { className: `text-2xl font-black ${isIn ? "text-emerald-600" : "text-red-600"}`, children: [
              isIn ? "+" : "-",
              " ",
              formatCurrency(payment?.amount, store)
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase text-slate-500", children: isIn ? "Payment In" : "Payment Out" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: formatDate(payment?.date, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Payment Mode" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-slate-800 dark:text-white capitalize flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MethodIcon, { size: 14, className: "text-slate-400" }),
              " ",
              payment?.method || "N/A"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Reference" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: payment?.reference || "—" })
          ] })
        ] }),
        payment?.notes && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: payment.notes })
        ] }),
        payment?.bank_account && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Bank Account" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-800 dark:text-white", children: payment.bank_account.name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Receipt, { size: 16 }),
          " Applied To"
        ] }),
        allocations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "This payment has not been allocated to any invoice yet — it is sitting as an unapplied credit/advance on the party's ledger." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx("th", { className: "py-2", children: "Invoice" }),
              /* @__PURE__ */ jsx("th", { className: "py-2", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Amount Allocated" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Link" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: allocations.map((alloc) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-slate-800 dark:text-white", children: alloc.sale ? alloc.sale.reference_number || alloc.sale.id : alloc.purchase ? alloc.purchase.invoice_number || alloc.purchase.id : "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-sm text-slate-500", children: alloc.sale_id ? "Sale" : alloc.purchase_id ? "Purchase" : "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-slate-800 dark:text-white", children: formatCurrency(alloc.allocated_amount, store) }),
              /* @__PURE__ */ jsxs("td", { className: "py-3 text-right", children: [
                alloc.sale_id && /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("store.sales.show", { store_slug: store?.slug, sale: alloc.sale_id }),
                    className: "text-indigo-600 hover:text-indigo-500 text-sm font-medium",
                    children: "View Sale →"
                  }
                ),
                alloc.purchase_id && !alloc.sale_id && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
                  "Purchase #",
                  alloc.purchase_id
                ] })
              ] })
            ] }, alloc.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-8 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "Total Allocated: " }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(totalAllocated, store) })
            ] }),
            unallocated > 0.01 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "Unapplied: " }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-amber-600", children: formatCurrency(unallocated, store) })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  PaymentShow as default
};
