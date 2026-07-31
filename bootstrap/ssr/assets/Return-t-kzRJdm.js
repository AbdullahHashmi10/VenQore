import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link } from "@inertiajs/react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
function PurchaseReturn({ purchase, items }) {
  const { store } = usePage().props;
  const { data, setData, post, processing, errors } = useForm({
    return_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    reason: "",
    items: items.map((item) => ({
      purchase_item_id: item.id,
      product_id: item.product_id,
      inventory_batch_id: item.inventory_batch_id,
      product_name: item.product_name,
      sku: item.sku,
      base_unit: item.base_unit,
      unit_cost: parseFloat(item.unit_cost),
      return_qty: "",
      remaining_qty: parseFloat(item.remaining_qty)
    }))
  });
  const updateLine = (index, field, value) => {
    const updated = data.items.map(
      (item, i) => i === index ? { ...item, [field]: value } : item
    );
    setData("items", updated);
  };
  const removeLine = (index) => {
    setData("items", data.items.filter((_, i) => i !== index));
  };
  const grandTotal = data.items.reduce((sum, item) => {
    const qty = parseFloat(item.return_qty) || 0;
    return sum + qty * item.unit_cost;
  }, 0);
  const submit = (e) => {
    e.preventDefault();
    const itemsToReturn = data.items.filter((item) => parseFloat(item.return_qty) > 0);
    post(route("store.v3.purchases.return.store", purchase.id), {
      data: {
        ...data,
        items: itemsToReturn
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: route("store.v3.purchases.show", purchase.id), className: "text-gray-500 hover:text-gray-700", children: [
        "← Purchase ",
        purchase.invoice_number
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "New Purchase Return (B18)" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded mb-6", children: [
      /* @__PURE__ */ jsxs("p", { className: "mb-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Supplier:" }),
        " ",
        purchase.supplier_name
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Original Total:" }),
        " ",
        formatCurrency(purchase.total, store)
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Return Date *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: data.return_date,
              max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
              onChange: (e) => setData("return_date", e.target.value),
              className: "w-full border rounded px-3 py-2",
              required: true
            }
          ),
          errors.return_date && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.return_date })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Reason *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.reason,
              onChange: (e) => setData("reason", e.target.value),
              className: "w-full border rounded px-3 py-2",
              placeholder: "Reason for return",
              required: true
            }
          ),
          errors.reason && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.reason })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold mb-2", children: "Items Available for Return" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-left text-sm", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm", children: "Remaining Qty" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm", children: "Batch Unit Cost" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-32", children: "Return Qty" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm", children: "Return Value" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 w-10" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.items.map((item, index) => {
            const returnQty = parseFloat(item.return_qty) || 0;
            const returnValue = returnQty * item.unit_cost;
            return /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-3 py-2 text-sm", children: [
                item.product_name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-gray-400 text-xs", children: [
                  "(",
                  item.sku,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-3 py-2 text-sm text-right", children: [
                item.remaining_qty,
                " ",
                item.base_unit
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-3 py-2 text-sm text-right", children: [
                getCurrencySymbol(store),
                " ",
                item.unit_cost.toFixed(4)
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-2 py-1", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "0.0001",
                    min: "0",
                    max: item.remaining_qty,
                    value: item.return_qty,
                    onChange: (e) => updateLine(index, "return_qty", e.target.value),
                    className: `w-full text-right border outline-none py-1 px-2 ${errors[`items.${index}.return_qty`] ? "border-red-500" : "border-gray-200"}`,
                    placeholder: "0"
                  }
                ),
                errors[`items.${index}.return_qty`] && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-xs mt-1 text-right", children: errors[`items.${index}.return_qty`] })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-3 py-2 text-sm text-right font-medium", children: [
                getCurrencySymbol(store),
                " ",
                returnValue.toFixed(2)
              ] }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1 text-center", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeLine(index),
                  className: "text-red-400 hover:text-red-600 text-lg leading-none",
                  children: "×"
                }
              ) })
            ] }, item.purchase_item_id);
          }) }),
          /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-3 py-2 text-right font-medium", children: "Total Return Value:" }),
            /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-3 py-2 text-right font-bold text-lg", children: formatCurrency(grandTotal, store) }),
            /* @__PURE__ */ jsx("td", {})
          ] }) })
        ] })
      ] }),
      errors.items && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.items }),
      Object.values(errors).filter((e) => e.includes("exceeds")).map((err, i) => /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded", children: err }, i)),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing || grandTotal === 0,
            className: "bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium",
            children: processing ? "Processing..." : `Confirm Return — ${formatCurrency(grandTotal, store)}`
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.show", purchase.id),
            className: "border px-6 py-2 rounded hover:bg-gray-50",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] });
}
export {
  PurchaseReturn as default
};
