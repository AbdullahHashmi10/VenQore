import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { Printer, PackageCheck } from "lucide-react";
import { d as documentType, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { b as blankLine, t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "react-dom";
import "./format-131Nyq79.js";
import "./OneGlanceLayout-D0x15wPs.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./settings-DUqQ1JdE.js";
import "./AsyncPartyCombobox-C_xHT5vA.js";
import "./ProductModal-DTGv60aX.js";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-BaeCSgsA.js";
import "./QuickPartyModal-BjRmNiLb.js";
const DOC = documentType("purchase-order");
const DOC_EDIT = { ...DOC, money: { ...DOC.money, settle: "none" } };
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreatePurchaseOrder({ purchaseOrder, suppliers = [], warehouses = [], products = [] }) {
  const { store, settings } = usePage().props;
  const tt = useTermText();
  const isEdit = !!purchaseOrder?.id;
  const locked = isEdit && ["received", "partial"].includes(purchaseOrder?.status);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    reference: "",
    supplier_invoice: "",
    date: today(),
    expected_delivery_date: "",
    terms: "net30",
    warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || "",
    notes: "",
    is_tax_inclusive: false,
    received: false,
    discount: 0,
    tax: num(settings?.default_tax_rate),
    delivery_charge: 0,
    extra_charge_value: 0,
    extra_charge_label: "",
    paymentMethod: "credit",
    amountPaid: 0,
    paymentAccountId: null,
    paymentAccountKey: null,
    items: [blankLine()]
  }), [warehouses, settings]);
  const editSeed = useCallback(() => {
    const sup = (suppliers || []).find((s) => s.id === purchaseOrder.supplier_id);
    return {
      ...seed(),
      id: purchaseOrder.id,
      party: sup ? { id: sup.party_id || sup.id, name: sup.name } : null,
      reference: purchaseOrder.reference || "",
      date: (purchaseOrder.order_date || "").slice(0, 10) || today(),
      expected_delivery_date: (purchaseOrder.expected_delivery_date || "").slice(0, 10) || "",
      terms: purchaseOrder.payment_terms || "net30",
      warehouse_id: purchaseOrder.warehouse_id || "",
      notes: purchaseOrder.notes || "",
      is_tax_inclusive: !!purchaseOrder.is_tax_inclusive,
      received: purchaseOrder.status === "received",
      discount: num(purchaseOrder.discount),
      tax: num(purchaseOrder.tax_rate),
      delivery_charge: num(purchaseOrder.delivery_charge),
      extra_charge_value: num(purchaseOrder.extra_charge_value),
      extra_charge_label: purchaseOrder.extra_charge_label || "",
      amountPaid: num(purchaseOrder.amount_paid),
      paymentMethod: num(purchaseOrder.amount_paid) > 0 ? "cash" : "credit",
      items: (purchaseOrder.items || []).length ? purchaseOrder.items.map((i) => ({
        id: uid(),
        product: i.product || { id: i.product_id, name: i.product_name },
        quantity: num(i.quantity),
        freeQuantity: num(i.free_quantity),
        price: num(i.unit_cost),
        /* Read back as the money it was stored as. The old screen
           hardcoded `discount: 0` here, so editing an order to
           change one line's quantity wiped every line discount. */
        discount: num(i.discount),
        discountType: "fixed",
        tax_rate: i.tax_rate ?? null,
        cost: num(i.unit_cost)
      })) : [blankLine()]
    };
  }, [seed, purchaseOrder, suppliers]);
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: isEdit ? DOC_EDIT : DOC,
      seed,
      editSeed,
      isEdit,
      locked,
      lockNote: purchaseOrder?.status === "partial" ? "Some of these goods have already arrived. Receive the rest, or raise a purchase return — an order cannot be changed once any of it is in." : "These goods have been received. Raise a purchase return or a debit note rather than changing the order.",
      products,
      transport: "axios",
      saveLabel: isEdit ? tt("Update order") : tt("Place the order"),
      priceOf: (pr) => num(pr.cost_price ?? pr.cost ?? pr.price),
      settleDefault: (d, totals) => d.paymentMethod === "cash" ? totals.grandTotal : 0,
      url: ({ d }) => isEdit ? route("store.purchase-orders.update", { store_slug: store?.slug, purchase_order: d.id }) : route("store.purchase-orders.store", { store_slug: store?.slug }),
      validate: ({ d }) => d.warehouse_id ? null : { warehouse: "Choose which warehouse these goods are going into." },
      header: ({ d, patch, chrome, acct, errors, setSettleMode }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Goods", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Whether the goods have arrived",
            value: d.received ? "received" : "ordered",
            onChange: (v) => patch({ received: v === "received" }),
            options: [
              { value: "ordered", label: "On order", hint: "Nothing on the shelf and nothing in the books yet" },
              { value: "received", label: "Arrived with it", hint: "Receives the whole order now, at these costs" }
            ]
          }
        ) }),
        !isEdit && /* @__PURE__ */ jsx(Field, { label: "Advance", span: 4, hint: "Money paid to the supplier up front.", children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "cash",
              "aria-pressed": d.paymentMethod === "cash",
              onClick: () => setSettleMode("cash"),
              children: "Paying now"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "credit",
              "aria-pressed": d.paymentMethod === "credit",
              onClick: () => setSettleMode("credit"),
              children: "Nothing yet"
            }
          )
        ] }) }),
        !isEdit && chrome.field("accountOut") && d.paymentMethod === "cash" && /* @__PURE__ */ jsx(Field, { label: "Money comes from", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which account the advance is paid out of",
            value: d.paymentAccountKey ?? acct.defaultKey ?? "",
            onChange: (v) => {
              const p = acct.resolve(v);
              if (p) patch(p);
            },
            options: acct.options
          }
        ) }),
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Order no.", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reference,
            placeholder: "Auto",
            onChange: (e) => patch({ reference: e.target.value })
          }
        ) }),
        chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Order date", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.date,
            onChange: (e) => patch({ date: e.target.value })
          }
        ) }),
        chrome.field("expected") && /* @__PURE__ */ jsx(Field, { label: "Expected on", span: 3, hint: "When the supplier says it will arrive.", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.expected_delivery_date,
            min: d.date,
            onChange: (e) => patch({ expected_delivery_date: e.target.value })
          }
        ) }),
        chrome.field("terms") && /* @__PURE__ */ jsx(Field, { label: "Payment terms", span: 3, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Payment terms",
            value: d.terms,
            onChange: (v) => patch({ terms: v }),
            options: [
              { value: "immediate", label: "On delivery" },
              { value: "net7", label: "Within 7 days" },
              { value: "net15", label: "Within 15 days" },
              { value: "net30", label: "Within 30 days" },
              { value: "net60", label: "Within 60 days" }
            ]
          }
        ) }),
        chrome.field("warehouse") && /* @__PURE__ */ jsx(Field, { label: "Goods land in", span: 4, required: true, error: errors.warehouse, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which warehouse the goods land in",
            value: d.warehouse_id,
            onChange: (v) => patch({ warehouse_id: v }),
            options: (warehouses || []).map((w) => ({ value: w.id, label: w.name }))
          }
        ) }),
        /* @__PURE__ */ jsx(
          Field,
          {
            label: "Costs include tax",
            span: 4,
            hint: "On means the rates typed on each line already have tax in them.",
            children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-pressed": !d.is_tax_inclusive,
                  onClick: () => patch({ is_tax_inclusive: false }),
                  children: "Tax on top"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-pressed": !!d.is_tax_inclusive,
                  onClick: () => patch({ is_tax_inclusive: true }),
                  children: "Tax included"
                }
              )
            ] })
          }
        ),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note on the order", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Delivery window, gate instructions, packing requirements…",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, totals }) => ({
        supplier_id: d.party?.id,
        warehouse_id: d.warehouse_id,
        order_date: d.date,
        /* Both of these are read without a fallback on the server, so
           the key has to be present even when it is empty. */
        expected_delivery_date: d.expected_delivery_date || null,
        notes: d.notes || null,
        reference: d.reference || null,
        payment_terms: d.terms || null,
        is_tax_inclusive: !!d.is_tax_inclusive,
        status: d.received ? "received" : "ordered",
        ...isEdit ? {} : {
          amount_paid: totals.settled,
          payment_account_id: d.paymentAccountId || null
        }
      }),
      extraTools: isEdit ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vqdoc-icon",
            title: "Print this order",
            onClick: () => window.open(route(DOC.api.print, { store_slug: store?.slug, purchaseOrder: purchaseOrder.id }), "_blank"),
            children: /* @__PURE__ */ jsx(Printer, { size: 17 })
          }
        ),
        !locked && /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "Set Goods to 'Arrived with it' and save to receive", "aria-hidden": true, children: /* @__PURE__ */ jsx(PackageCheck, { size: 17 }) })
      ] }) : null
    }
  );
}
export {
  CreatePurchaseOrder as default
};
