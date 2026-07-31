import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link, router } from "@inertiajs/react";
function UomConversions({ product, conversions }) {
  const { store } = usePage().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    sale_uom: "",
    conversion_factor: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("store.v3.products.uom.store", { store_slug: store.slug, productId: product.id }), {
      onSuccess: () => reset()
    });
  };
  const remove = (id) => {
    if (confirm("Remove this UOM conversion?")) {
      router.delete(route("store.v3.products.uom.destroy", { store_slug: store.slug, productId: product.id, id }));
    }
  };
  const baseUnit = product.base_unit ?? product.unit ?? "PCS";
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
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "UOM Conversions" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium mb-1", children: "How conversions work" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Base unit for this product is ",
        /* @__PURE__ */ jsx("strong", { children: baseUnit }),
        ". Set a conversion factor so the POS can sell in alternate units."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
        "Formula: ",
        /* @__PURE__ */ jsx("code", { children: "base_qty = sale_qty ÷ factor" }),
        " — e.g. factor 1000 means 500 GRAMS deducts 0.5 ",
        baseUnit,
        " from stock."
      ] })
    ] }),
    conversions.length > 0 ? /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200 mb-6", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Sale UOM" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Factor" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Example" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: conversions.map((c) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 font-mono", children: c.sale_uom }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2", children: c.conversion_factor }),
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2 text-gray-500 text-sm", children: [
          "1000 ",
          c.sale_uom,
          " = ",
          (1e3 / c.conversion_factor).toFixed(4),
          " ",
          baseUnit
        ] }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => remove(c.id),
            className: "text-red-600 hover:underline text-sm",
            children: "Remove"
          }
        ) })
      ] }, c.id)) })
    ] }) : /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-sm mb-6", children: [
      "No UOM conversions configured. Product sells in ",
      baseUnit,
      " only."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border rounded p-4 bg-gray-50", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-medium mb-4", children: "Add UOM Conversion" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex gap-4 items-end", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Sale UOM" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. GRAMS",
              value: data.sale_uom,
              onChange: (e) => setData("sale_uom", e.target.value.toUpperCase()),
              className: "w-full border rounded px-3 py-2"
            }
          ),
          errors.sale_uom && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.sale_uom })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium mb-1", children: [
            "Factor (1 ",
            baseUnit,
            " = ? sale units)"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.000001",
              placeholder: "e.g. 1000",
              value: data.conversion_factor,
              onChange: (e) => setData("conversion_factor", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          ),
          errors.conversion_factor && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.conversion_factor })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50",
            children: "Add"
          }
        )
      ] })
    ] })
  ] });
}
export {
  UomConversions as default
};
