import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
function ProductEdit({ product, uomConversions, priceTiers }) {
  const { store } = usePage().props;
  const { data, setData, put, processing, errors } = useForm({
    name: product.name,
    sku: product.sku,
    base_unit: product.base_unit ?? product.unit ?? "PCS",
    sale_price: product.price ?? product.sale_price ?? 0,
    tax_rate: product.tax_rate ?? 0,
    price_includes_tax: Boolean(product.price_includes_tax),
    reorder_level: product.reorder_level ?? 0,
    is_manufactured: Boolean(product.is_manufactured)
  });
  const submit = (e) => {
    e.preventDefault();
    put(route("store.v3.products.update", { store_slug: store?.slug, product: product.id }));
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(Link, { href: route("store.v3.products.index", { store_slug: store?.slug }), className: "text-gray-500 hover:text-gray-700", children: "← Products" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
        "Edit: ",
        product.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Product Name *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "SKU *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.sku,
              onChange: (e) => setData("sku", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          ),
          errors.sku && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.sku })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Base Unit *" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: data.base_unit,
              onChange: (e) => setData("base_unit", e.target.value),
              className: "w-full border rounded px-3 py-2",
              children: ["PCS", "KG", "LTR", "MTR", "BOX", "DOZ", "GM", "ML"].map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Sale Price *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: data.sale_price,
              onChange: (e) => setData("sale_price", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Tax Rate %" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: data.tax_rate,
              onChange: (e) => setData("tax_rate", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.price_includes_tax,
              onChange: (e) => setData("price_includes_tax", e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Price includes tax" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.is_manufactured,
              onChange: (e) => setData("is_manufactured", e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Has BOM (manufactured product)" })
        ] })
      ] }),
      uomConversions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border rounded p-4 bg-gray-50", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium mb-2", children: "UOM Conversions" }),
        uomConversions.map((c) => /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          "1 ",
          data.base_unit,
          " = ",
          c.conversion_factor,
          " ",
          c.sale_uom
        ] }, c.id)),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.products.uom.index", { store_slug: store?.slug, productId: product.id }),
            className: "text-blue-600 text-sm hover:underline mt-2 inline-block",
            children: "Manage UOM conversions →"
          }
        )
      ] }),
      priceTiers.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border rounded p-4 bg-gray-50", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium mb-2", children: "Price Tiers" }),
        priceTiers.map((t) => /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          t.min_qty,
          "–",
          t.max_qty ?? "∞",
          " units: ",
          formatCurrency(t.unit_price, store)
        ] }, t.id)),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.products.tiers.index", { store_slug: store?.slug, productId: product.id }),
            className: "text-blue-600 text-sm hover:underline mt-2 inline-block",
            children: "Manage price tiers →"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4 pt-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50",
            children: processing ? "Saving..." : "Save Changes"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.products.index", { store_slug: store?.slug }),
            className: "border px-6 py-2 rounded hover:bg-gray-50",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] });
}
export {
  ProductEdit as default
};
