import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { PackageCheck } from "lucide-react";
import { d as documentType, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { b as blankLine, t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import { u as useAlert } from "../ssr.js";
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
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
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
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
const DOC = documentType("sales-order");
const DOC_EDIT = { ...DOC, money: { ...DOC.money, settle: "none" } };
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreatePreSale({ sale, customers = [], products = [] }) {
  const { store, settings } = usePage().props;
  const { showAlert } = useAlert();
  const tt = useTermText();
  const isEdit = !!sale?.id;
  const [converting, setConverting] = useState(false);
  const locked = isEdit && ["completed", "converted", "cancelled"].includes(sale?.status);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    reference: "",
    date: today(),
    delivery_date: "",
    terms: "net30",
    notes: "",
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
  }), [settings]);
  const editSeed = useCallback(() => ({
    ...seed(),
    id: sale.id,
    party: sale.customer ? { id: sale.customer.id, name: sale.customer.name, current_balance: sale.customer.current_balance } : null,
    reference: sale.reference || "",
    date: (sale.order_date || "").slice(0, 10) || today(),
    delivery_date: (sale.delivery_date || "").slice(0, 10) || "",
    terms: sale.payment_terms || "net30",
    notes: sale.notes || "",
    discount: num(sale.discount),
    tax: num(sale.tax_rate),
    delivery_charge: num(sale.delivery_charge),
    extra_charge_value: num(sale.extra_charge_value),
    extra_charge_label: sale.extra_charge_label || "",
    amountPaid: num(sale.amount_paid),
    paymentMethod: num(sale.amount_paid) > 0 ? "cash" : "credit",
    items: (sale.items || []).length ? sale.items.map((i) => ({
      id: uid(),
      product: i.product || { id: i.product_id, name: i.product_name },
      quantity: num(i.quantity_requested ?? i.qty ?? i.quantity),
      freeQuantity: num(i.free_quantity),
      price: num(i.unit_price),
      discount: num(i.discount),
      discountType: "fixed",
      tax_rate: i.tax_rate ?? null,
      cost: num(i.product?.cost_price)
    })) : [blankLine()]
  }), [seed, sale]);
  const convert = async () => {
    if (!isEdit) {
      showAlert({ title: "Save it first", message: tt("An order has to be saved before it can become a sale."), type: "warning" });
      return;
    }
    setConverting(true);
    try {
      const res = await window.axios.post(route(DOC.api.convert, { store_slug: store?.slug, salesOrder: sale.id }));
      showAlert({ title: "Converted", message: tt("The order is now a sale and the reserved stock has left the shelf."), type: "success" });
      const madeId = res?.data?.sale_id;
      if (madeId) window.open(route("store.sales.print", { store_slug: store?.slug, sale: madeId }), "_blank");
      router.visit(route("store.sales.index", { store_slug: store?.slug }));
    } catch (err) {
      showAlert({ title: "Could not convert", message: err?.response?.data?.message || "Something went wrong.", type: "error" });
    } finally {
      setConverting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: isEdit ? DOC_EDIT : DOC,
      seed,
      editSeed,
      isEdit,
      locked,
      lockNote: tt("This order has been converted to a sale and can no longer be changed."),
      products,
      parties: customers,
      transport: "axios",
      saveLabel: isEdit ? tt("Update order") : tt("Take the order"),
      settleDefault: (d, totals) => d.paymentMethod === "cash" ? totals.grandTotal : 0,
      url: ({ d }) => isEdit ? route("store.sales.orders.update", { store_slug: store?.slug, order: d.id }) : route("store.pre-sales.store", { store_slug: store?.slug }),
      header: ({ d, patch, chrome, acct, setSettleMode }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        !isEdit && /* @__PURE__ */ jsx(Field, { label: "Deposit", span: 4, hint: "Money taken now against goods later.", children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "cash",
              "aria-pressed": d.paymentMethod === "cash",
              onClick: () => setSettleMode("cash"),
              children: "Taking money now"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "credit",
              "aria-pressed": d.paymentMethod === "credit",
              onClick: () => setSettleMode("credit"),
              children: "Nothing down"
            }
          )
        ] }) }),
        !isEdit && chrome.field("account") && d.paymentMethod === "cash" && /* @__PURE__ */ jsx(Field, { label: "Money goes to", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which account the deposit is banked into",
            value: d.paymentAccountKey ?? acct.defaultKey ?? "",
            onChange: (v) => {
              const p = acct.resolve(v);
              if (p) patch(p);
            },
            options: acct.options
          }
        ) }),
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: tt("Order no."), span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reference,
            placeholder: "Auto",
            onChange: (e) => patch({ reference: e.target.value })
          }
        ) }),
        chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: tt("Order date"), span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.date,
            onChange: (e) => patch({ date: e.target.value })
          }
        ) }),
        chrome.field("delivery") && /* @__PURE__ */ jsx(Field, { label: "Wanted by", span: 3, hint: "When the customer expects the goods.", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.delivery_date,
            min: d.date,
            onChange: (e) => patch({ delivery_date: e.target.value })
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
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: tt("Note on the order"), span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Delivery instructions, who to call on arrival…",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, totals }) => ({
        customer_id: d.party?.id || null,
        order_date: d.date,
        delivery_date: d.delivery_date || null,
        reference: d.reference || null,
        payment_terms: d.terms || null,
        notes: d.notes || null,
        /* Only on the way in: the update route does not take a deposit,
           because money already received is not re-decided by editing
           the paperwork. */
        ...isEdit ? {} : {
          amount_paid: totals.settled,
          payment_method: d.paymentMethod === "cash" ? "cash" : "credit",
          payment_account_id: d.paymentAccountId || null
        }
      }),
      extraActions: isEdit && !locked ? /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", disabled: converting, onClick: convert, children: [
        /* @__PURE__ */ jsx(PackageCheck, { size: 16 }),
        " Deliver & invoice"
      ] }) : null
    }
  );
}
export {
  CreatePreSale as default
};
