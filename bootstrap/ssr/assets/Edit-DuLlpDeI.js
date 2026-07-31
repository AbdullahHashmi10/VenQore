import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link } from "@inertiajs/react";
function WarehouseEdit({ warehouse }) {
  const { store } = usePage().props;
  const { data, setData, put, processing, errors } = useForm({
    name: warehouse.name,
    address: warehouse.address ?? "",
    is_default: Boolean(warehouse.is_default),
    is_active: Boolean(warehouse.is_active)
  });
  const submit = (e) => {
    e.preventDefault();
    put(route("store.v3.warehouses.update", { store_slug: store?.slug, warehouse: warehouse.id }));
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(Link, { href: route("store.v3.warehouses.index", { store_slug: store?.slug }), className: "text-gray-500 hover:text-gray-700", children: "← Warehouses" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
        "Edit: ",
        warehouse.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Name *" }),
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
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Address" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: data.address,
            onChange: (e) => setData("address", e.target.value),
            className: "w-full border rounded px-3 py-2",
            rows: 3
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.is_default,
              onChange: (e) => setData("is_default", e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Default warehouse" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: data.is_active,
              onChange: (e) => setData("is_active", e.target.checked)
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Active" })
        ] })
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
            href: route("store.v3.warehouses.index", { store_slug: store?.slug }),
            className: "border px-6 py-2 rounded hover:bg-gray-50",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] });
}
export {
  WarehouseEdit as default
};
