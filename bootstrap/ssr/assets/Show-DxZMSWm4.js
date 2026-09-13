import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { f as formatCurrency, a as formatDate } from "./format-131Nyq79.js";
import { ArrowLeft, BadgeCheck, Printer, PackageMinus, FileWarning } from "lucide-react";
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
function DebitNoteShow({ note, stockMovements = [], bankAccounts = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState({
    refund_method: "cash",
    bank_account_id: bankAccounts[0]?.id || "",
    refund_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const [processingRefund, setProcessingRefund] = useState(false);
  const handleRefundSubmit = (e) => {
    e.preventDefault();
    setProcessingRefund(true);
    router.post(route("store.debit-notes.refund", { store_slug: store.slug, id: note.id }), refundData, {
      onSuccess: () => {
        setShowRefundForm(false);
        setProcessingRefund(false);
      },
      onError: () => {
        setProcessingRefund(false);
      }
    });
  };
  const statusColors = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    refunded: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    applied: "bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted"
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
          }, className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
            "Debit Note #",
            note?.reference_number || note?.id
          ] }),
          /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[note?.status] || "bg-sunken text-ink-secondary"}`, children: note?.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          note?.status === "approved" && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowRefundForm(!showRefundForm),
              className: "flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-all active:scale-95 font-medium",
              children: [
                /* @__PURE__ */ jsx(BadgeCheck, { size: 18 }),
                " Record Refund"
              ]
            }
          ),
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
        ] })
      ] }),
      showRefundForm && /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-brand-200 dark:border-brand-900 no-print", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink mb-4", children: tt("Record Cash/Bank Refund from Supplier") }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleRefundSubmit, className: "grid grid-cols-1 md:grid-cols-3 gap-4 items-end", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2", children: "Refund Method" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: refundData.refund_method,
                onChange: (e) => setRefundData({ ...refundData, refund_method: e.target.value }),
                className: "w-full rounded-xl border-line dark:bg-app text-ink text-sm",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "cash", children: "Cash" }),
                  /* @__PURE__ */ jsx("option", { value: "bank", children: "Bank Account" })
                ]
              }
            )
          ] }),
          refundData.refund_method === "bank" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2", children: "Bank Account" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: refundData.bank_account_id,
                onChange: (e) => setRefundData({ ...refundData, bank_account_id: e.target.value }),
                className: "w-full rounded-xl border-line dark:bg-app text-ink text-sm",
                children: bankAccounts.map((acc) => /* @__PURE__ */ jsxs("option", { value: acc.id, children: [
                  acc.name,
                  " (",
                  acc.account_number,
                  ")"
                ] }, acc.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2", children: "Refund Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: refundData.refund_date,
                onChange: (e) => setRefundData({ ...refundData, refund_date: e.target.value }),
                className: "w-full rounded-xl border-line dark:bg-app text-ink text-sm",
                max: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processingRefund,
                className: "flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-xl transition-all disabled:opacity-50 text-sm",
                children: processingRefund ? "Saving..." : "Record Refund"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setShowRefundForm(false),
                className: "bg-sunken hover:bg-interactive-hover text-ink-secondary font-medium py-2 px-4 rounded-xl transition-all text-sm",
                children: "Cancel"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: tt("Supplier") }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: note?.supplier?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Amount" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-600", children: formatCurrency(note?.amount, store) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatDate(note?.date, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Reason" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: note?.reason || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: tt("Linked Purchase Order") }),
            note?.purchase ? /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchase-orders.show", { store_slug: store?.slug, purchase_order: note.purchase_id }),
                className: "text-sm font-medium text-brand-600 hover:text-brand-500",
                children: [
                  note.purchase.reference_number || `PO #${note.purchase_id}`,
                  " →"
                ]
              }
            ) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: tt("Not linked to a purchase order") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4", children: "Items" }),
        (note?.items || []).length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No line items recorded — this note was created as a flat adjustment." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: tt("Product") }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Subtotal" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: note.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-ink", children: item.product?.name || `Product #${item.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-center text-ink-secondary", children: item.quantity }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-ink-secondary", children: formatCurrency(item.unit_price, store) }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-ink", children: formatCurrency(item.subtotal, store) })
          ] }, item.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PackageMinus, { size: 16 }),
          " ",
          tt("Stock Returned to Supplier")
        ] }),
        stockMovements.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No stock was deducted for this note (pending approval, or a flat financial adjustment with no inventory impact)." }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "py-2", children: tt("Product") }),
            /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Qty Removed" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: stockMovements.map((mv) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-ink", children: mv.product?.name || `Product #${mv.product_id}` }),
            /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-red-600", children: mv.quantity })
          ] }, mv.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
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
