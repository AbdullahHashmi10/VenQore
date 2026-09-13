import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { Trash2, Plus, Truck, AlertTriangle } from "lucide-react";
import { d as documentType, S as Sheet, F as Field, V as VqSelect, j as Scrim, l as linePayload } from "./useDocumentChrome-DON8WQ-L.js";
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
const DOC = documentType("purchase-invoice");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;
function PurchaseForm({
  mode = "create",
  purchase,
  items: existingItems,
  landedCosts,
  suppliers,
  products,
  warehouses,
  expenseCategories
}) {
  const tt = useTermText();
  const { store, settings } = usePage().props;
  const isEdit = mode === "edit";
  const [showLanded, setShowLanded] = useState(false);
  const [zeroCostAsk, setZeroCostAsk] = useState(null);
  const saveAgain = useRef(null);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    purchase_date: today(),
    due_date: "",
    supplier_invoice: "",
    reference: "",
    warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || "",
    notes: "",
    discount: 0,
    tax: 0,
    delivery_charge: 0,
    extra_charge_value: 0,
    extra_charge_label: "",
    paymentMethod: "cash",
    amountPaid: 0,
    paymentAccountId: null,
    paymentAccountKey: null,
    terms: "net30",
    workflow_status: "received",
    items: [blankLine({ business_pct: 100 })],
    extras: []
  }), [warehouses]);
  const editSeed = useCallback(() => ({
    ...seed(),
    id: purchase?.id || uid(),
    party: purchase ? { id: purchase.party_id, name: purchase.supplier_name || "", current_balance: purchase.supplier_balance } : null,
    purchase_date: purchase?.purchase_date?.slice(0, 10) || today(),
    due_date: purchase?.due_date?.slice(0, 10) || "",
    supplier_invoice: purchase?.invoice_number || "",
    reference: purchase?.reference || "",
    warehouse_id: purchase?.warehouse_id || "",
    notes: purchase?.notes || "",
    discount: num(purchase?.discount),
    paymentMethod: purchase?.payment_method || "cash",
    /* Hydrated from what the purchase actually settled. Starting at 0 meant
       re-saving a paid cash purchase with no changes posted the whole bill
       to the supplier's payable and marked it unpaid. */
    /* A purchase whose goods have not arrived has no journal, so the
       server has nothing to derive a counter payment from and hands back
       the whole bill. Reading that as "settled in full" meant receiving it
       later credited Cash for money that never left the drawer. */
    amountPaid: purchase?.workflow_status === "pending" ? 0 : purchase?.payment_status === "paid" ? num(purchase?.total) : num(purchase?.amount_paid ?? 0),
    workflow_status: purchase?.workflow_status || "received",
    extras: (landedCosts || []).map((x) => ({
      id: uid(),
      category_id: x.category_id || "",
      amount: num(x.amount),
      method: x.method || "value",
      description: x.description || ""
    })),
    items: existingItems?.length ? existingItems.map((i) => ({
      id: uid(),
      product: { id: i.product_id, name: i.product_name, tax_rate: i.tax_rate, unit: i.base_unit },
      variant: i.variant_id ? { id: i.variant_id } : null,
      quantity: num(i.qty),
      price: num(i.unit_cost),
      discount: num(i.discount_amount),
      discountType: "fixed",
      /* Carried through an edit rather than silently reset to 100,
         which turned non-reclaimable tax into claimable input tax. */
      business_pct: i.business_pct === void 0 || i.business_pct === null ? 100 : num(i.business_pct),
      tax_rate: i.tax_rate === void 0 || i.tax_rate === null ? null : num(i.tax_rate),
      cost: num(i.unit_cost)
    })) : [blankLine({ business_pct: 100 })]
  }), [seed, purchase, existingItems, landedCosts]);
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      editSeed,
      isEdit,
      products,
      parties: suppliers,
      transport: "axios",
      saveLabel: isEdit ? "Update purchase" : "Record purchase",
      priceOf: (pr) => num(pr.cost ?? pr.cost_price ?? pr.price),
      afterUrl: route("store.v3.purchases.index", { store_slug: store?.slug }),
      url: ({ d }) => isEdit ? route("store.v3.purchases.update", { store_slug: store?.slug, purchase: d.id }) : route("store.v3.purchases.store", { store_slug: store?.slug }),
      validate: ({ d, totals }) => {
        if (isEdit && totals.settled > 5e-3 && !d.paymentAccountKey) {
          return { party: "Say which account this purchase was paid from." };
        }
        return null;
      },
      notice: isEdit ? /* @__PURE__ */ jsxs("div", { className: "vqdoc-note", "data-tone": "warn", children: [
        /* @__PURE__ */ jsx("span", { className: "eyebrow", children: "Editing a posted purchase" }),
        /* @__PURE__ */ jsx("span", { children: "Saving reverses this purchase’s journal entries and posts them again from what is on the screen now. Stock movements and costs are recalculated with it." })
      ] }) : null,
      beforeSave: ({ items, opts }) => {
        if (opts.zeroCostAcknowledged) return true;
        const free = items.filter((i) => i.product && num(i.price) === 0);
        if (!free.length) return true;
        setZeroCostAsk({ count: free.length, opts });
        return false;
      },
      buildPayload: ({ d, items, totals, acct, opts }) => {
        const priced = items.filter((i) => i.product);
        return {
          supplier_id: d.party?.id,
          warehouse_id: d.warehouse_id || null,
          purchase_date: d.purchase_date,
          due_date: d.due_date || null,
          supplier_invoice: d.supplier_invoice || null,
          reference: d.reference || null,
          notes: d.notes || null,
          payment_method: d.paymentMethod,
          workflow_status: d.workflow_status,
          /* The shop's rounding is applied by the SERVER, from this
             figure. Rounding on the screen and not sending the
             difference is how the bill came to show one total and the
             ledger another. */
          /* Measured from the same base the screen totalled: the
             shared arithmetic rounds to the paisa first and THEN
             applies the shop's rounding, so measuring against the
             unrounded raw put the two a rupee apart on any bill whose
             total landed on a half-paisa. */
          round_off: round2(totals.grandTotal - round2(totals.rawGrandTotal)),
          items: linePayload({ doc: DOC, items, totals }).map((line, i) => {
            const src = priced[i];
            return {
              ...line,
              variant_id: src?.variant?.id || null,
              business_pct: src?.business_pct === void 0 ? 100 : num(src.business_pct),
              /* The rate the supplier actually billed. Falls back
                 to the product's own, which is what it was
                 before, and is always sent — the server treats an
                 absent rate as its own default. */
              tax_rate: src?.tax_rate === null || src?.tax_rate === void 0 ? num(src?.product?.tax_rate) : num(src.tax_rate)
            };
          }),
          extras: (d.extras || []).filter((x) => num(x.amount) > 0).map((x) => ({
            amount: num(x.amount),
            method: x.method || "value",
            category_id: x.category_id || null,
            description: x.description || null
          })),
          /* Only ever true because the operator was asked and said
             yes. Sending `|| !zeroCost` made it true on every ordinary
             save, which permanently disarmed the server's guard. */
          zero_cost_acknowledged: !!opts.zeroCostAcknowledged,
          payment_account_id: d.paymentAccountId || acct.fallbackAccountId,
          bank_account_id: d.bankReferenceId || null,
          /* The server owns the tax on a purchase — it reads each
             line's own rate — so the document-level keys the shared
             payload adds would only be noise. Undefined is not
             serialised, so they are simply not sent. */
          tax: void 0,
          tax_rate: void 0,
          tax_inclusive: void 0,
          tax_exempt: void 0
        };
      },
      header: ({ d, patch, chrome, acct, setSettleMode }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Settlement", span: 4, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "cash",
              "aria-pressed": d.paymentMethod === "cash",
              onClick: () => setSettleMode("cash"),
              children: "Paid now"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "credit",
              "aria-pressed": d.paymentMethod === "credit",
              onClick: () => setSettleMode("credit"),
              children: "On account"
            }
          )
        ] }) }),
        chrome.field("accountOut") && /* @__PURE__ */ jsx(Field, { label: "Money comes from", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which account this is paid out of",
            value: d.paymentAccountKey ?? acct.defaultKey ?? "",
            onChange: (v) => {
              const p = acct.resolve(v);
              if (p) patch(p);
            },
            options: acct.options
          }
        ) }),
        chrome.field("supplierRef") && /* @__PURE__ */ jsx(
          Field,
          {
            label: tt("Supplier's bill no."),
            span: 3,
            hint: "The number on THEIR document, so you can find it when they call.",
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "vqdoc-in",
                value: d.supplier_invoice,
                placeholder: "The number on their document",
                onChange: (e) => patch({ supplier_invoice: e.target.value })
              }
            )
          }
        ),
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Our reference", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reference,
            placeholder: "Auto",
            onChange: (e) => patch({ reference: e.target.value })
          }
        ) }),
        chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Bill date", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.purchase_date,
            max: isEdit ? void 0 : today(),
            onChange: (e) => patch({ purchase_date: e.target.value })
          }
        ) }),
        chrome.field("terms") && /* @__PURE__ */ jsx(Field, { label: "Payment terms", span: 3, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Payment terms",
            value: d.terms,
            onChange: (v) => {
              const days = { immediate: 0, net7: 7, net15: 15, net30: 30, net60: 60 }[v] ?? 30;
              const base = d.purchase_date ? new Date(d.purchase_date) : /* @__PURE__ */ new Date();
              base.setDate(base.getDate() + days);
              patch({ terms: v, due_date: base.toISOString().split("T")[0] });
            },
            options: [
              { value: "immediate", label: "Due immediately" },
              { value: "net7", label: "Within 7 days" },
              { value: "net15", label: "Within 15 days" },
              { value: "net30", label: "Within 30 days" },
              { value: "net60", label: "Within 60 days" }
            ]
          }
        ) }),
        chrome.field("due") && /* @__PURE__ */ jsx(Field, { label: "Due date", span: 4, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.due_date,
            onChange: (e) => patch({ due_date: e.target.value })
          }
        ) }),
        /* @__PURE__ */ jsx(Field, { label: "Goods", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Whether the goods have arrived",
            value: d.workflow_status,
            onChange: (v) => patch({ workflow_status: v }),
            options: [
              { value: "received", label: "Received now", hint: "Goes on the shelf and into the books today" },
              { value: "pending", label: "Not yet arrived", hint: "Recorded, but no stock and no ledger entry until it lands" }
            ]
          }
        ) }),
        chrome.field("warehouse") && /* @__PURE__ */ jsx(Field, { label: "Goods land in", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which warehouse the goods land in",
            value: d.warehouse_id,
            onChange: (v) => patch({ warehouse_id: v }),
            options: (warehouses || []).map((w) => ({ value: w.id, label: w.name }))
          }
        ) }),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note on the purchase", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Anything worth remembering about this delivery",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      extraTools: ({ d }) => {
        const landed = (d.extras || []).reduce((s, x) => s + num(x.amount), 0);
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqdoc-icon",
            title: "Freight, duty and clearing",
            "aria-pressed": landed > 0,
            onClick: () => setShowLanded(true),
            children: [
              /* @__PURE__ */ jsx(Truck, { size: 17 }),
              landed > 0 && /* @__PURE__ */ jsx("span", { className: "dot" })
            ]
          }
        );
      },
      extraRows: ({ d, money }) => {
        const landed = (d.extras || []).reduce((s, x) => s + num(x.amount), 0);
        return landed > 0 ? /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
          /* @__PURE__ */ jsx("span", { className: "k", children: "Landed costs" }),
          /* @__PURE__ */ jsx("span", { className: "v", children: money(landed) })
        ] }) : null;
      },
      extraSheets: ({ d, patch, items, money }) => {
        const extras = d.extras || [];
        const setExtras = (next) => patch({ extras: typeof next === "function" ? next(extras) : next });
        const landed = extras.reduce((s, x) => s + num(x.amount), 0);
        const lines = items.filter((i) => i.product).length;
        return /* @__PURE__ */ jsxs(Fragment, { children: [
          showLanded && /* @__PURE__ */ jsx(
            Sheet,
            {
              title: "Landed costs",
              hint: "Freight, duty and clearing. These are added to what the stock is worth, not to the supplier's bill.",
              icon: /* @__PURE__ */ jsx(Truck, { size: 18 }),
              width: 760,
              onClose: () => setShowLanded(false),
              footer: /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { style: { marginRight: "auto", color: "var(--vq-text-2)", fontSize: "var(--d-t-sm)" }, children: landed > 0 ? `${money(landed)} across ${lines} line${lines === 1 ? "" : "s"}` : "Nothing added yet" }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    className: "vqdoc-btn",
                    onClick: () => setExtras((p) => [...p, { id: uid(), category_id: "", amount: 0, method: "value", description: "" }]),
                    children: [
                      /* @__PURE__ */ jsx(Plus, { size: 15 }),
                      " Add another"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn pri", onClick: () => setShowLanded(false), children: "Done" })
              ] }),
              children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-hdr", style: { padding: 0 }, children: [
                !extras.length && /* @__PURE__ */ jsx("div", { className: "vqdoc-f", "data-span": "12", children: /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: "Nothing added yet." }) }),
                extras.map((x) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
                  /* @__PURE__ */ jsx(Field, { label: "Cost", span: 3, children: /* @__PURE__ */ jsx(
                    VqSelect,
                    {
                      ariaLabel: "Landed cost category",
                      value: x.category_id || "",
                      placeholder: "Freight, duty, clearing…",
                      onChange: (v) => setExtras((p) => p.map((e) => e.id === x.id ? { ...e, category_id: v } : e)),
                      options: (expenseCategories || []).map((c) => ({ value: c.id, label: c.name }))
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Field, { label: "Amount", span: 2, children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      className: "vqdoc-in n",
                      value: x.amount,
                      onFocus: (e) => e.target.select(),
                      onChange: (e) => setExtras((p) => p.map((el) => el.id === x.id ? { ...el, amount: num(e.target.value) } : el))
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Field, { label: "What for", span: 3, children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      className: "vqdoc-in",
                      value: x.description,
                      placeholder: "Clearing agent, port charges…",
                      onChange: (e) => setExtras((p) => p.map((el) => el.id === x.id ? { ...el, description: e.target.value } : el))
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Field, { label: "Spread by", span: 3, children: /* @__PURE__ */ jsx(
                    VqSelect,
                    {
                      ariaLabel: "How the cost is spread",
                      value: x.method,
                      onChange: (v) => setExtras((p) => p.map((e) => e.id === x.id ? { ...e, method: v } : e)),
                      options: [
                        { value: "value", label: "By value", hint: "Dearer goods take more of it" },
                        { value: "quantity", label: "By quantity", hint: "Every unit takes the same" },
                        { value: "manual", label: "Leave it out", hint: "Recorded but not spread onto stock" }
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsx("div", { className: "vqdoc-f", "data-span": "1", "data-nolabel": "true", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "vqdoc-icon sm quiet danger",
                      title: "Remove this cost",
                      onClick: () => setExtras((p) => p.filter((e) => e.id !== x.id)),
                      children: /* @__PURE__ */ jsx(Trash2, { size: 15 })
                    }
                  ) })
                ] }, x.id))
              ] })
            }
          ),
          zeroCostAsk && /* @__PURE__ */ jsx(Scrim, { onClose: () => setZeroCostAsk(null), children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-modal", style: { width: "min(460px, 100%)" }, children: [
            /* @__PURE__ */ jsxs("header", { children: [
              /* @__PURE__ */ jsx("span", { className: "ico", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }) }),
              /* @__PURE__ */ jsx("span", { className: "t", children: /* @__PURE__ */ jsx("h3", { children: "An item costs nothing" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "body", style: { display: "grid", gap: "var(--d-s4)" }, children: [
              /* @__PURE__ */ jsxs("p", { style: { margin: 0, color: "var(--vq-text-2)" }, children: [
                zeroCostAsk.count,
                " line",
                zeroCostAsk.count === 1 ? " has" : "s have",
                " a unit cost of nothing. Those units will be valued at zero for as long as they are in stock, and every sale of them will look like pure profit."
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vqdoc-actions", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "vqdoc-btn pri",
                    onClick: () => {
                      const o = zeroCostAsk.opts;
                      setZeroCostAsk(null);
                      saveAgain.current?.({ ...o, zeroCostAcknowledged: true });
                    },
                    children: "They really were free"
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn", onClick: () => setZeroCostAsk(null), children: "Let me fix the cost" })
              ] })
            ] })
          ] }) })
        ] });
      },
      saveRef: saveAgain
    }
  );
}
export {
  PurchaseForm as default
};
