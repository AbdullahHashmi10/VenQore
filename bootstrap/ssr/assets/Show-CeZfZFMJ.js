import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Link } from "@inertiajs/react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
function PurchaseShow({ purchase, items, journalEntry, journalLines }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-4xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { href: route("store.v3.purchases.index", { store_slug: store.slug }), className: "text-gray-500 hover:text-gray-700", children: "← Purchases" }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
          "Purchase — ",
          purchase.invoice_number
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: route("store.v3.purchases.return.create", { store_slug: store.slug, purchaseId: purchase.id }),
          className: "bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 font-medium",
          children: "Return Purchase"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded border", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Supplier" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.supplier_name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Date" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: purchase.purchase_date })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Total" }),
        /* @__PURE__ */ jsx("p", { className: "font-bold text-lg", children: formatCurrency(purchase.total, store) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Payment Method" }),
        /* @__PURE__ */ jsx("p", { className: "capitalize", children: purchase.payment_method })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Status" }),
        /* @__PURE__ */ jsx("span", { className: `text-sm px-2 py-1 rounded ${purchase.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`, children: purchase.payment_status })
      ] })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Line Items" }),
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200 mb-6", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Product" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Qty" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Unit Cost" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Tax" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Line Total" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2", children: [
          item.product_name,
          /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-xs ml-2", children: item.sku })
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2 text-right", children: [
          item.qty,
          " ",
          item.base_unit
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2 text-right", children: [
          getCurrencySymbol(store),
          " ",
          parseFloat(item.unit_cost).toFixed(4)
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2 text-right text-sm", children: [
          item.tax_rate,
          "%"
        ] }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-right font-medium", children: formatCurrency(item.line_total, store) })
      ] }, item.id)) })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Journal Entry" }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 px-4 py-2 text-sm text-gray-500 border-b", children: [
        journalEntry?.description,
        " — ",
        journalEntry?.entry_date
      ] }),
      /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gray-50 text-sm", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left", children: "Account" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Debit" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Credit" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: journalLines.map((line, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-400 mr-2", children: line.code }),
            line.account_name
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right text-sm", children: parseFloat(line.debit) > 0 ? `${getCurrencySymbol(store)} ${parseFloat(line.debit).toFixed(2)}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right text-sm", children: parseFloat(line.credit) > 0 ? `${getCurrencySymbol(store)} ${parseFloat(line.credit).toFixed(2)}` : "—" })
        ] }, i)) })
      ] })
    ] })
  ] });
}
export {
  PurchaseShow as default
};
