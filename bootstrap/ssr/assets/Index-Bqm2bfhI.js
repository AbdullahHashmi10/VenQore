import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Link, router } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { b as useTerms } from "./terms-DwYjlWsV.js";
function ProductIndex({ products }) {
  const { store } = usePage().props;
  const { t, tp } = useTerms();
  const deactivate = (id) => {
    if (confirm(`Deactivate this ${t("product", "product").toLowerCase()}?`)) {
      router.delete(route("store.v3.products.destroy", { store_slug: store?.slug, product: id }));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: tp("product", "Products") }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.v3.products.create", { store_slug: store?.slug }),
          className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
          children: [
            "+ New ",
            t("product", "Product")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-line", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-sunken", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "SKU" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-left", children: "Unit" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Sale Price" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-right", children: "Tax %" }),
        /* @__PURE__ */ jsx("th", { className: "border border-line px-4 py-2 text-center", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: products.map((product) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 font-mono text-sm", children: product.sku }),
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2", children: product.name }),
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2", children: product.base_unit }),
        /* @__PURE__ */ jsx("td", { className: "border border-line px-4 py-2 text-right", children: formatCurrency(product.sale_price, store) }),
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2 text-right", children: [
          product.tax_rate,
          "%"
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "border border-line px-4 py-2 text-center space-x-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.v3.products.edit", { store_slug: store?.slug, product: product.id }),
              className: "text-blue-600 hover:underline",
              children: "Edit"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => deactivate(product.id),
              className: "text-red-600 hover:underline",
              children: "Deactivate"
            }
          )
        ] })
      ] }, product.id)) })
    ] }),
    products.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-ink-muted py-8", children: "No products yet. Create your first product." })
  ] });
}
export {
  ProductIndex as default
};
