import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, useForm, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "react";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-ulkv479L.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-DMTeGwCg.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-D_cdCy9L.js";
import "lucide-react";
function PurchaseCreate({ suppliers, products, warehouses }) {
  const { store } = usePage().props;
  const defaultWarehouse = warehouses.find((w) => w.is_default) ?? warehouses[0];
  const { data, setData, post, processing, errors, clearErrors } = useForm({
    supplier_id: "",
    warehouse_id: defaultWarehouse?.id ?? "",
    payment_method: "cash",
    purchase_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    supplier_invoice: "",
    items: [{ product_id: "", qty: "", unit_cost: "", tax_rate: "0", business_pct: "100" }],
    zero_cost_acknowledged: false
  });
  const addLine = () => {
    setData("items", [...data.items, { product_id: "", qty: "", unit_cost: "", tax_rate: "0", business_pct: "100" }]);
  };
  const removeLine = (index) => {
    setData("items", data.items.filter((_, i) => i !== index));
  };
  const updateLine = (index, field, value) => {
    const updated = data.items.map(
      (item, i) => i === index ? { ...item, [field]: value } : item
    );
    setData("items", updated);
  };
  const onProductSelect = (index, productId) => {
    const product = products.find((p) => p.id === productId);
    updateLine(index, "product_id", productId);
    if (product) updateLine(index, "tax_rate", product.tax_rate ?? "0");
  };
  const lineTotal = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    const tax = parseFloat(item.tax_rate) || 0;
    const net = qty * cost;
    return { net, tax: net * tax / 100, gross: net + net * tax / 100 };
  };
  const grandTotal = data.items.reduce((sum, item) => sum + lineTotal(item).gross, 0);
  const submit = (e) => {
    e.preventDefault();
    post(route("store.v3.purchases.store", { store_slug: store.slug }));
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(Link, { href: route("store.v3.purchases.index", { store_slug: store.slug }), className: "text-gray-500 hover:text-gray-700", children: "← Purchases" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
        "New Purchase (",
        data.payment_method === "cash" ? "B3 Cash" : "B6 Credit",
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Supplier *" }),
          /* @__PURE__ */ jsx(
            AsyncPartyCombobox,
            {
              type: "supplier",
              value: data.supplier_id,
              onSelect: (s) => setData("supplier_id", s ? s.id : ""),
              defaultOptions: suppliers,
              placeholder: "Search supplier...",
              className: "w-full"
            }
          ),
          errors.supplier_id && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: errors.supplier_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Warehouse *" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: data.warehouse_id,
              onChange: (e) => setData("warehouse_id", e.target.value),
              className: "w-full border rounded px-3 py-2",
              children: warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, children: w.name }, w.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Purchase Date *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: data.purchase_date,
              max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
              onChange: (e) => setData("purchase_date", e.target.value),
              className: "w-full border rounded px-3 py-2"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Supplier Invoice #" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.supplier_invoice,
              onChange: (e) => setData("supplier_invoice", e.target.value),
              className: "w-full border rounded px-3 py-2",
              placeholder: "Optional"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Payment Method *" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: data.payment_method,
              onChange: (e) => setData("payment_method", e.target.value),
              className: "w-full border rounded px-3 py-2",
              children: [
                /* @__PURE__ */ jsx("option", { value: "cash", children: "Cash (Paid now)" }),
                /* @__PURE__ */ jsx("option", { value: "credit", children: "Credit (Pay later)" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full border-collapse border border-gray-200", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-left text-sm", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-24", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-32", children: "Unit Cost" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-20", children: "Tax %" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-24", children: "Business %" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 text-right text-sm w-32", children: "Line Total" }),
            /* @__PURE__ */ jsx("th", { className: "border border-gray-200 px-3 py-2 w-10" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.items.map((item, index) => {
            const totals = lineTotal(item);
            return /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1", children: /* @__PURE__ */ jsx(
                AsyncProductCombobox,
                {
                  value: item.product_id,
                  onSelect: (p) => onProductSelect(index, p ? p.id : ""),
                  defaultOptions: products,
                  placeholder: "Search product...",
                  className: "w-full"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.0001",
                  value: item.qty,
                  onChange: (e) => updateLine(index, "qty", e.target.value),
                  className: "w-full text-right border-0 outline-none py-1",
                  placeholder: "0"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  value: item.unit_cost,
                  onChange: (e) => updateLine(index, "unit_cost", e.target.value),
                  className: "w-full text-right border-0 outline-none py-1",
                  placeholder: "0.00"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  value: item.tax_rate,
                  onChange: (e) => updateLine(index, "tax_rate", e.target.value),
                  className: "w-full text-right border-0 outline-none py-1"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  value: item.business_pct,
                  onChange: (e) => updateLine(index, "business_pct", e.target.value),
                  className: "w-full text-right border-0 outline-none py-1",
                  placeholder: "100"
                }
              ) }),
              /* @__PURE__ */ jsxs("td", { className: "border border-gray-200 px-3 py-2 text-right text-sm", children: [
                /* @__PURE__ */ jsx("div", { children: formatCurrency(totals.gross, store) }),
                totals.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400", children: [
                  "tax: ",
                  totals.tax.toFixed(2)
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-2 py-1 text-center", children: data.items.length > 1 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeLine(index),
                  className: "text-red-400 hover:text-red-600 text-lg leading-none",
                  children: "×"
                }
              ) })
            ] }, index);
          }) }),
          /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { colSpan: 5, className: "px-3 py-2 text-right font-medium", children: [
              "Grand Total (",
              data.payment_method === "cash" ? "Cash to Pay" : "Payable",
              "):"
            ] }),
            /* @__PURE__ */ jsx("td", { className: "border border-gray-200 px-3 py-2 text-right font-bold", children: formatCurrency(grandTotal, store) }),
            /* @__PURE__ */ jsx("td", {})
          ] }) })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: addLine,
            className: "mt-2 text-blue-600 hover:underline text-sm",
            children: "+ Add line"
          }
        )
      ] }),
      Object.keys(errors).length > 0 && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700", children: Object.values(errors).map((err, i) => /* @__PURE__ */ jsx("div", { children: err }, i)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium",
            children: processing ? "Posting..." : `Post Purchase — ${formatCurrency(grandTotal, store)}`
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.v3.purchases.index", { store_slug: store.slug }),
            className: "border px-6 py-2 rounded hover:bg-gray-50",
            children: "Cancel"
          }
        )
      ] })
    ] }),
    errors.zero_cost_acknowledged && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded p-6 max-w-sm w-full shadow-xl", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-red-600 mb-2", children: "Zero Unit Cost Warning" }),
      /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm text-gray-700", children: errors.zero_cost_acknowledged }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => clearErrors("zero_cost_acknowledged"),
            className: "px-4 py-2 border rounded hover:bg-gray-50 text-sm",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setData("zero_cost_acknowledged", true);
              clearErrors("zero_cost_acknowledged");
            },
            className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm",
            children: "Confirm Zero Cost"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  PurchaseCreate as default
};
