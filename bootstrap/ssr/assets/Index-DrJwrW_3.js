import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
function PurchaseIndex({ purchases }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Purchases" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: route("store.v3.purchases.create", { store_slug: store.slug }),
          className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
          children: "+ New Purchase"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Invoice #" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Supplier" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Total" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-center", children: "Method" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-center", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: purchases.data?.map((p) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 font-mono text-sm", children: p.invoice_number }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2", children: p.supplier_name }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2", children: p.purchase_date }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-right", children: formatCurrency(p.total, store) }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center text-sm capitalize", children: p.payment_method }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded ${p.payment_status === "paid" ? "bg-green-100 text-green-700" : p.payment_status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`, children: p.payment_status }) }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.show", { store_slug: store.slug, purchase: p.id }),
            className: "text-blue-600 hover:underline text-sm",
            children: "View"
          }
        ) })
      ] }, p.id)) })
    ] })
  ] });
}
export {
  PurchaseIndex as default
};
