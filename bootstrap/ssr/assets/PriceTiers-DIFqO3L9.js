import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link, router } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
function PriceTiers({ product, tiers }) {
  const { store } = usePage().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    min_qty: "",
    max_qty: "",
    unit_price: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("store.v3.products.tiers.store", { store_slug: store.slug, productId: product.id }), {
      onSuccess: () => reset()
    });
  };
  const remove = (id) => {
    if (confirm("Remove this price tier?")) {
      router.delete(route("store.v3.products.tiers.destroy", { store_slug: store.slug, productId: product.id, id }));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.v3.products.edit", { store_slug: store.slug, product: product.id }),
          className: "text-gray-500 hover:text-gray-700",
          children: [
            "← ",
            product.name
          ]
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Price Tiers" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium mb-1", children: "How tiered pricing works (S-042)" }),
      /* @__PURE__ */ jsx("p", { children: "When a sale spans multiple tiers, the POS calculates a blended average unit price. Each tier covers a quantity range. Ranges must not overlap. Leave Max Qty blank for an open-ended top tier." })
    ] }),
    tiers.length > 0 ? /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200 mb-6", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Min Qty" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Max Qty" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-right", children: "Unit Price" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: tiers.map((t) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2", children: t.min_qty }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2", children: t.max_qty ?? /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "∞ (no limit)" }) }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-right", children: formatCurrency(t.unit_price, store) }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => remove(t.id),
            className: "text-red-600 hover:underline text-sm",
            children: "Remove"
          }
        ) })
      ] }, t.id)) })
    ] }) : /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mb-6", children: "No price tiers configured. Product uses flat sale price." }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded p-4 bg-gray-50", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-medium mb-4", children: "Add Price Tier" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Min Qty *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.0001",
                placeholder: "e.g. 1",
                value: data.min_qty,
                onChange: (e) => setData("min_qty", e.target.value),
                className: "w-full border rounded px-3 py-2"
              }
            ),
            errors.min_qty && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.min_qty })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium mb-1", children: [
              "Max Qty ",
              /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "(blank = no limit)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.0001",
                placeholder: "e.g. 50",
                value: data.max_qty,
                onChange: (e) => setData("max_qty", e.target.value),
                className: "w-full border rounded px-3 py-2"
              }
            ),
            errors.max_qty && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.max_qty })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Unit Price *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                placeholder: "e.g. 95.00",
                value: data.unit_price,
                onChange: (e) => setData("unit_price", e.target.value),
                className: "w-full border rounded px-3 py-2"
              }
            ),
            errors.unit_price && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.unit_price })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50",
            children: processing ? "Adding..." : "Add Tier"
          }
        )
      ] })
    ] })
  ] });
}
export {
  PriceTiers as default
};
