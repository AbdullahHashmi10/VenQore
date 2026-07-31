import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Link, router } from "@inertiajs/react";
function WarehouseIndex({ warehouses, errors }) {
  const { store } = usePage().props;
  const deactivate = (id) => {
    if (confirm("Deactivate this warehouse?")) {
      router.delete(route("store.v3.warehouses.destroy", { store_slug: store?.slug, warehouse: id }));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-3xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Warehouses" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: route("store.v3.warehouses.create", { store_slug: store?.slug }),
          className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700",
          children: "+ New Warehouse"
        }
      )
    ] }),
    errors?.warehouse && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4", children: errors.warehouse }),
    /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-left", children: "Address" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-center", children: "Default" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-center", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-4 py-2 text-center", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: warehouses.map((w) => /* @__PURE__ */ jsxs("tr", { className: `hover:bg-gray-50 ${!w.is_active ? "opacity-50" : ""}`, children: [
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 font-medium", children: w.name }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-sm text-gray-500", children: w.address ?? "—" }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: w.is_default ? /* @__PURE__ */ jsx("span", { className: "bg-green-100 text-green-700 text-xs px-2 py-1 rounded", children: "DEFAULT" }) : "—" }),
        /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-4 py-2 text-center", children: /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded ${w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`, children: w.is_active ? "Active" : "Inactive" }) }),
        /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-4 py-2 text-center space-x-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.v3.warehouses.edit", { store_slug: store?.slug, warehouse: w.id }),
              className: "text-blue-600 hover:underline text-sm",
              children: "Edit"
            }
          ),
          w.is_active && !w.is_default && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => deactivate(w.id),
              className: "text-red-600 hover:underline text-sm",
              children: "Deactivate"
            }
          )
        ] })
      ] }, w.id)) })
    ] })
  ] });
}
export {
  WarehouseIndex as default
};
