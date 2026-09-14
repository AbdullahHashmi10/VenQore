import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { usePage, Link, router } from "@inertiajs/react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
function purchaseStanding({ purchase = {}, settlement = null, paidAmount = 0 } = {}) {
  const total = num(settlement?.total ?? purchase?.total);
  if (settlement && settlement.outstanding !== void 0 && settlement.outstanding !== null) {
    return {
      total,
      paid: round2(Math.min(num(settlement.paid), total)),
      returned: round2(num(settlement.returned)),
      outstanding: round2(Math.max(0, num(settlement.outstanding)))
    };
  }
  const paid = num(paidAmount);
  return {
    total,
    paid: round2(Math.min(paid, total)),
    returned: 0,
    outstanding: round2(Math.max(0, total - paid))
  };
}
const paymentBadge = (status) => ({
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700"
})[status] ?? "bg-red-100 text-red-700";
const workflowBadge = (status) => ({
  received: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  pending: "bg-neutral-100 text-ink-secondary",
  cancelled: "bg-neutral-200 text-ink-muted"
})[status] ?? "bg-neutral-100 text-ink-secondary";
function PurchaseShow({
  purchase,
  items,
  journalEntries = [],
  journalLines = [],
  landedCosts = [],
  returns = [],
  paidAmount = 0,
  settlement = null
}) {
  const { store } = usePage().props;
  const tt = useTermText();
  const isCancelled = purchase.workflow_status === "cancelled";
  const canReceive = ["pending", "partial"].includes(purchase.workflow_status);
  const standing = purchaseStanding({ purchase, settlement, paidAmount });
  const outstanding = standing.outstanding;
  const linesFor = (entryId) => journalLines.filter((l) => l.journal_entry_id === entryId);
  const voidPurchase = () => {
    const reason = window.prompt(
      "Voiding reverses this purchase's journal entries and releases its stock batches.\n\nThe record is kept, never deleted. Reason (optional):"
    );
    if (reason === null) return;
    router.delete(
      route("store.v3.purchases.destroy", { store_slug: store.slug, purchase: purchase.id }),
      { data: { reason } }
    );
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6 flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.index", { store_slug: store.slug }),
            className: "text-ink-muted hover:text-ink",
            children: "← Purchases"
          }
        ),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
          "Purchase — ",
          purchase.invoice_number
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        canReceive && !isCancelled && /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.receive", { store_slug: store.slug, purchase: purchase.id }),
            className: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium",
            children: "Receive Goods"
          }
        ),
        !isCancelled && /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.edit", { store_slug: store.slug, purchase: purchase.id }),
            className: "border px-4 py-2 rounded hover:bg-interactive-hover font-medium",
            children: "Edit"
          }
        ),
        !isCancelled && /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.return.create", { store_slug: store.slug, purchaseId: purchase.id }),
            className: "bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 font-medium",
            children: "Return"
          }
        ),
        !isCancelled && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: voidPurchase,
            className: "border border-line text-ink-secondary px-4 py-2 rounded hover:bg-interactive-hover font-medium",
            children: "Void"
          }
        )
      ] })
    ] }),
    isCancelled && /* @__PURE__ */ jsxs("div", { className: "mb-6 bg-sunken border border-line rounded p-3 text-sm text-ink-secondary", children: [
      /* @__PURE__ */ jsx("strong", { children: "This purchase is voided." }),
      " Its journal entries have been reversed and its stock batches released. The record is retained for the audit trail."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-sunken rounded border", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: tt("Supplier") }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.supplier_name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Date" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.purchase_date })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Due" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.due_date ?? "—" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Reference" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.reference ?? "—" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Total" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-lg", children: formatCurrency(purchase.total, store) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
          "Paid ",
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "(from ledger)" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: formatCurrency(standing.paid, store) }),
        standing.returned > 5e-3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted", children: [
          "Returned ",
          formatCurrency(standing.returned, store)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Outstanding" }),
        /* @__PURE__ */ jsx("p", { className: `font-medium ${outstanding > 0.01 ? "text-red-600" : "text-green-600"}`, children: formatCurrency(outstanding, store) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Status" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-wrap", children: [
          /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded ${workflowBadge(purchase.workflow_status)}`, children: purchase.workflow_status }),
          /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded ${paymentBadge(purchase.payment_status)}`, children: purchase.payment_status })
        ] })
      ] })
    ] }),
    purchase.notes && /* @__PURE__ */ jsxs("div", { className: "mb-6 text-sm", children: [
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted mb-1", children: "Notes" }),
      /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap border rounded p-3 bg-white", children: purchase.notes })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Line Items" }),
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-line mb-6", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-sunken", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: tt("Product") }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Qty" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Received" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Unit Cost" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Tax" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Line Total" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2", children: [
          item.product_name,
          /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs ml-2", children: item.sku })
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2 text-right", children: [
          item.qty,
          " ",
          item.base_unit
        ] }),
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-right text-sm", children: item.received_qty ?? 0 }),
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2 text-right", children: [
          getCurrencySymbol(store),
          " ",
          parseFloat(item.unit_cost).toFixed(4)
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2 text-right text-sm", children: [
          item.tax_rate,
          "%"
        ] }),
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-right font-medium", children: formatCurrency(item.line_total, store) })
      ] }, item.id)) }),
      /* @__PURE__ */ jsxs("tfoot", { className: "bg-sunken text-sm", children: [
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: 5, className: "border border-line px-4 py-1 text-right", children: "Subtotal" }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-1 text-right", children: formatCurrency(purchase.subtotal, store) })
        ] }),
        Number(purchase.discount) > 0 && /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: 5, className: "border border-line px-4 py-1 text-right", children: "Discount" }),
          /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-1 text-right", children: [
            "−",
            formatCurrency(purchase.discount, store)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: 5, className: "border border-line px-4 py-1 text-right", children: "Tax" }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-1 text-right", children: formatCurrency(purchase.tax, store) })
        ] }),
        Number(purchase.round_off) !== 0 && /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: 5, className: "border border-line px-4 py-1 text-right", children: "Round off" }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-1 text-right", children: formatCurrency(purchase.round_off, store) })
        ] })
      ] })
    ] }),
    landedCosts.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Landed Costs" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mb-2", children: "Capitalised into the unit cost of the goods above, so they reach COGS through FIFO." }),
      /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-line mb-6 text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-sunken", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Allocation" }),
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: landedCosts.map((cost) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2", children: cost.category }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-ink-muted", children: cost.description }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 capitalize", children: cost.allocation_method }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-right", children: formatCurrency(cost.amount, store) })
        ] }, cost.id)) })
      ] })
    ] }),
    returns.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Returns" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-line mb-6 text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-sunken", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Reason" }),
          /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: returns.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2", children: r.return_date }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2", children: r.reason }),
          /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-right", children: formatCurrency(r.total_amount, store) })
        ] }, r.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Journal History" }),
    journalEntries.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted border rounded p-4", children: "No journal entries yet. This purchase posts to the ledger when the goods are received." }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: journalEntries.map((entry) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `border rounded overflow-hidden ${Number(entry.is_reversed) === 1 ? "opacity-60" : ""}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-sunken px-4 py-2 text-sm text-ink-secondary border-b flex justify-between items-center gap-3", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              entry.description,
              " — ",
              entry.entry_date
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex gap-2 shrink-0", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 rounded bg-white border capitalize", children: String(entry.reference_type).replace("_", " ") }),
              Number(entry.is_reversed) === 1 && /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 rounded bg-sunken text-ink-secondary", children: "reversed" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-sunken text-sm", children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left", children: "Account" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Debit" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Credit" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: linesFor(entry.id).map((line, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-ink-muted mr-2", children: line.code }),
                line.account_name
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right text-sm", children: parseFloat(line.debit) > 0 ? `${getCurrencySymbol(store)} ${parseFloat(line.debit).toFixed(2)}` : "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right text-sm", children: parseFloat(line.credit) > 0 ? `${getCurrencySymbol(store)} ${parseFloat(line.credit).toFixed(2)}` : "—" })
            ] }, i)) })
          ] })
        ]
      },
      entry.id
    )) })
  ] });
}
export {
  PurchaseShow as default
};
