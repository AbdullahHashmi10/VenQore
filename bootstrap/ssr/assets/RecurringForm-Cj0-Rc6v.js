import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { CalendarClock } from "lucide-react";
import { l as linePayload, d as documentType, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
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
const DOC = documentType("recurring-invoice");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().split("T")[0];
const round4 = (n) => Math.round(n * 1e4) / 1e4;
const nextAfter = (dateStr, frequency) => {
  const base = dateStr ? new Date(dateStr) : /* @__PURE__ */ new Date();
  if (frequency === "daily") base.setDate(base.getDate() + 1);
  else if (frequency === "weekly") base.setDate(base.getDate() + 7);
  else base.setMonth(base.getMonth() + 1);
  return base.toISOString().split("T")[0];
};
function RecurringForm({ invoice, customers = [], warehouses = [], products = [] }) {
  const { store, settings } = usePage().props;
  const isEdit = !!invoice?.id;
  const tt = useTermText();
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    name: "",
    reference: "",
    date: today(),
    warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || "",
    frequency: "monthly",
    next_run_date: inDays(30),
    status: "active",
    terms: "net30",
    notes: "",
    discount: 0,
    tax: num(settings?.default_tax_rate),
    delivery_charge: 0,
    extra_charge_value: 0,
    extra_charge_label: "",
    items: [blankLine()]
  }), [warehouses, settings]);
  const editSeed = useCallback(() => {
    const stored = Array.isArray(invoice?.items) ? invoice.items : [];
    return {
      ...seed(),
      id: invoice.id,
      party: invoice.customer_id ? customers.find((c) => c.id === invoice.customer_id) || { id: invoice.customer_id, name: invoice.customer_name || "Customer" } : null,
      name: invoice.name || "",
      warehouse_id: invoice.warehouse_id || "",
      frequency: invoice.frequency || "monthly",
      next_run_date: (invoice.next_run_date || "").slice(0, 10) || inDays(30),
      status: invoice.status || "active",
      terms: invoice.payment_terms || "net30",
      notes: invoice.notes || "",
      /* Hydrated, not hardcoded. The old editor set all five of these to
         zero on the way in and then never sent them, so the money on a
         template could only ever go down. */
      discount: num(invoice.discount),
      tax: num(invoice.tax_rate),
      delivery_charge: num(invoice.delivery_charge),
      extra_charge_value: num(invoice.extra_charge_value),
      extra_charge_label: invoice.extra_charge_label || "",
      items: stored.length ? stored.map((i) => {
        const p = products.find((x) => x.id === i.product_id);
        return {
          id: uid(),
          product: p || { id: i.product_id, name: i.name || "Item" },
          quantity: num(i.qty ?? i.quantity),
          freeQuantity: num(i.free_qty ?? i.freeQuantity),
          price: num(i.unit_price ?? i.price),
          discount: num(i.discount),
          discountType: "fixed",
          tax_rate: i.tax_rate ?? null,
          cost: num(p?.cost_price)
        };
      }) : [blankLine()]
    };
  }, [seed, invoice, customers, products]);
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      editSeed,
      isEdit,
      products,
      parties: customers,
      transport: "axios",
      saveLabel: isEdit ? "Update template" : "Save template",
      url: ({ d }) => isEdit ? route("store.recurring-invoices.update", { store_slug: store?.slug, id: d.id }) : route("store.recurring-invoices.store", { store_slug: store?.slug }),
      validate: ({ d }) => {
        if (!d.warehouse_id) return { warehouse: "Choose which warehouse these invoices come out of." };
        if (!d.next_run_date) return { next_run_date: "Say when the next invoice should be raised." };
        return null;
      },
      header: ({ d, patch, chrome, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Template name", span: 4, hint: "What this schedule is called in the list.", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.name,
            placeholder: tt("Monthly service charge"),
            onChange: (e) => patch({ name: e.target.value })
          }
        ) }),
        chrome.field("frequency") && /* @__PURE__ */ jsx(Field, { label: "Repeats", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "How often an invoice is raised",
            value: d.frequency,
            onChange: (v) => patch({ frequency: v, next_run_date: d.next_run_date || nextAfter(today(), v) }),
            options: [
              { value: "daily", label: "Every day" },
              { value: "weekly", label: "Every week" },
              { value: "monthly", label: "Every month" }
            ]
          }
        ) }),
        chrome.field("nextRun") && /* @__PURE__ */ jsx(
          Field,
          {
            label: "Next one on",
            span: 4,
            required: true,
            error: errors.next_run_date,
            hint: `After that: ${nextAfter(d.next_run_date, d.frequency)}`,
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "vqdoc-in",
                value: d.next_run_date,
                onChange: (e) => patch({ next_run_date: e.target.value })
              }
            )
          }
        ),
        chrome.field("status") && /* @__PURE__ */ jsx(Field, { label: "Status", span: 4, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "cash",
              "aria-pressed": d.status === "active",
              onClick: () => patch({ status: "active" }),
              children: "Running"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "credit",
              "aria-pressed": d.status !== "active",
              onClick: () => patch({ status: "paused" }),
              children: "Paused"
            }
          )
        ] }) }),
        chrome.field("warehouse") && /* @__PURE__ */ jsx(Field, { label: "Stock comes from", span: 4, required: true, error: errors.warehouse, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which warehouse these invoices come out of",
            value: d.warehouse_id,
            onChange: (v) => patch({ warehouse_id: v }),
            options: (warehouses || []).map((w) => ({ value: w.id, label: w.name }))
          }
        ) }),
        chrome.field("terms") && /* @__PURE__ */ jsx(Field, { label: "Payment terms", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Payment terms on the invoices this raises",
            value: d.terms,
            onChange: (v) => patch({ terms: v }),
            options: [
              { value: "immediate", label: "Due immediately" },
              { value: "net7", label: "Within 7 days" },
              { value: "net15", label: "Within 15 days" },
              { value: "net30", label: "Within 30 days" },
              { value: "net60", label: "Within 60 days" }
            ]
          }
        ) }),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note that prints on every invoice", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: tt("Service period, contract reference…"),
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, items, totals }) => ({
        customer_id: d.party?.id || null,
        warehouse_id: d.warehouse_id || null,
        frequency: d.frequency,
        next_run_date: d.next_run_date,
        status: d.status,
        name: d.name || null,
        payment_terms: d.terms || null,
        notes: d.notes || null,
        /* What each raised invoice will come to. Stored so the list can
           show it without re-deriving it from a blob. */
        total_amount: totals.grandTotal,
        /* The stored lines are a JSON blob validated key by key, so a
           key without a rule is dropped from the template silently.
           `name` is one of those, and it is what the invoice prints
           when a product is later renamed. */
        items: linePayload({ doc: DOC, items, totals }).map((line, i) => {
          const src = items.filter((x) => x.product)[i];
          const gross = num(src?.quantity) * num(src?.price);
          return {
            ...line,
            /* The generator builds each invoice with
               `discount_percent`, and falls back to `discount` —
               which is MONEY here — if it is missing. A 500 line
               discount then became 500% off. Sending the equivalent
               percentage makes the raised invoice come to exactly
               what the template shows. */
            discount_percent: gross > 0 ? round4(num(line.discount) / gross * 100) : 0,
            name: src?.product?.name || null
          };
        })
      }),
      extraTools: /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: `Raises an invoice ${DOC.name.toLowerCase()} on schedule`, "aria-hidden": true, children: /* @__PURE__ */ jsx(CalendarClock, { size: 17 }) })
    }
  );
}
export {
  RecurringForm as default
};
