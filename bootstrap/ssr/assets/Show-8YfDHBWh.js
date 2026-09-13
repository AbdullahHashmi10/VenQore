import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, a as formatDate } from "./format-131Nyq79.js";
import { ArrowLeft, Printer, Receipt, Wallet, CreditCard, Landmark, Banknote } from "lucide-react";
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
          }, className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
            "Payment #",
            payment?.reference || payment?.id
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.print(),
            className: "flex items-center gap-2 bg-surface text-ink-secondary dark:text-ink border border-line px-4 py-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 font-medium",
            children: [
              /* @__PURE__ */ jsx(Printer, { size: 18 }),
              " Print Receipt"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Party" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: payment?.party?.name || "N/A" }),
            payment?.party?.type && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted capitalize", children: payment.party.type })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Amount" }),
            /* @__PURE__ */ jsxs("p", { className: `text-2xl font-bold ${isIn ? "text-emerald-600" : "text-red-600"}`, children: [
              isIn ? "+" : "-",
              " ",
              formatCurrency(payment?.amount, store)
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase text-ink-muted", children: isIn ? "Payment In" : "Payment Out" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatDate(payment?.date, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Payment Mode" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-ink capitalize flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(MethodIcon, { size: 14, className: "text-ink-muted" }),
              " ",
              payment?.method || "N/A"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Reference" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: payment?.reference || "—" })
          ] })
        ] }),
        payment?.notes && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Notes" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-secondary", children: payment.notes })
        ] }),
        payment?.bank_account && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-line", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Bank Account" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: payment.bank_account.name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Receipt, { size: 16 }),
          " Applied To"
        ] }),
        allocations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "This payment has not been allocated to any invoice yet — it is sitting as an unapplied credit/advance on the party's ledger." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx("th", { className: "py-2", children: "Invoice" }),
              /* @__PURE__ */ jsx("th", { className: "py-2", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Amount Allocated" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Link" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: allocations.map((alloc) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-ink", children: alloc.sale ? alloc.sale.reference_number || alloc.sale.id : alloc.purchase ? alloc.purchase.invoice_number || alloc.purchase.id : "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-sm text-ink-muted", children: alloc.sale_id ? "Sale" : alloc.purchase_id ? "Purchase" : "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-ink", children: formatCurrency(alloc.allocated_amount, store) }),
              /* @__PURE__ */ jsxs("td", { className: "py-3 text-right", children: [
                alloc.sale_id && /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("store.sales.show", { store_slug: store?.slug, sale: alloc.sale_id }),
                    className: "text-brand-600 hover:text-brand-500 text-sm font-medium",
                    children: "View Sale →"
                  }
                ),
                alloc.purchase_id && !alloc.sale_id && /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
                  "Purchase #",
                  alloc.purchase_id
                ] })
              ] })
            ] }, alloc.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-8 mt-4 pt-4 border-t border-line text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Total Allocated: " }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: formatCurrency(totalAllocated, store) })
            ] }),
            unallocated > 0.01 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Unapplied: " }),
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
