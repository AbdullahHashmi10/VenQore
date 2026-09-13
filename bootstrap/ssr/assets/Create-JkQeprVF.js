import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { FileSearch, PackageX } from "lucide-react";
import { d as documentType, S as Sheet, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { b as blankLine, t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "react-dom";
import "./terms-DwYjlWsV.js";
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
const DOC = documentType("debit-note");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreateDebitNote({ note, suppliers = [], products = [], warehouses = [] }) {
  const { store, settings } = usePage().props;
  const isEdit = !!note?.id;
  const locked = isEdit && note?.status !== "pending";
  const [picking, setPicking] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const money = (n) => formatCurrency(n, store || settings);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    source: null,
    reference: "",
    date: today(),
    status: "pending",
    reason: "",
    notes: "",
    returns_stock: false,
    warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || "",
    discount: 0,
    tax: num(settings?.default_tax_rate),
    items: [blankLine()]
  }), [warehouses, settings]);
  const editSeed = useCallback(() => ({
    ...seed(),
    id: note.id,
    party: note.supplier ? { id: note.supplier.id, name: note.supplier.name } : null,
    source: note.purchase_id ? { id: note.purchase_id, reference: note.purchase_reference || "the purchase" } : null,
    reference: note.reference_number || "",
    date: (note.date || "").slice(0, 10) || today(),
    status: note.status || "pending",
    reason: note.reason || "",
    notes: note.notes || "",
    returns_stock: !!note.returns_stock,
    warehouse_id: note.warehouse_id || "",
    discount: num(note.discount),
    tax: num(note.tax_rate),
    items: (note.items || []).length ? note.items.map((i) => ({
      id: uid(),
      product: i.product || { id: i.product_id, name: i.product_name },
      quantity: num(i.quantity),
      price: num(i.unit_price),
      discount: 0,
      discountType: "fixed"
    })) : [blankLine()]
  }), [seed, note]);
  const findBills = async (partyId) => {
    if (!partyId) {
      setBills([]);
      return;
    }
    setLoading(true);
    try {
      const res = await window.axios.get(route("store.api.purchases.for-party", { store_slug: store?.slug, party: partyId }));
      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setBills([]);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      editSeed,
      isEdit,
      locked,
      lockNote: "This note has been approved. It has moved the ledger, so correcting it means raising another one.",
      products,
      parties: suppliers,
      transport: "axios",
      saveLabel: isEdit ? "Update note" : "Raise the note",
      url: ({ d }) => isEdit ? route("store.debit-notes.update", { store_slug: store?.slug, id: d.id }) : route("store.debit-notes.store", { store_slug: store?.slug }),
      validate: ({ d }) => {
        if (d.returns_stock && !d.warehouse_id) {
          return { warehouse: "Say which warehouse the goods are going back off." };
        }
        return null;
      },
      header: ({ d, patch, chrome, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        chrome.field("source") && /* @__PURE__ */ jsx(
          Field,
          {
            label: "Against purchase",
            span: 4,
            hint: "Optional, but it is what lets somebody find this note from the bill.",
            children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vqdoc-in",
                style: { textAlign: "left", cursor: d.party?.id ? "pointer" : "not-allowed" },
                disabled: !d.party?.id,
                onClick: () => {
                  setPicking(true);
                  findBills(d.party?.id);
                },
                children: d.source ? d.source.reference : d.party?.id ? "Pick the bill this is about…" : "Choose the supplier first"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          Field,
          {
            label: "Goods",
            span: 4,
            hint: DOC.stock.optionHint,
            children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "data-tone": "credit",
                  "aria-pressed": !d.returns_stock,
                  onClick: () => patch({ returns_stock: false }),
                  children: "Billing only"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "data-tone": "cash",
                  "aria-pressed": !!d.returns_stock,
                  onClick: () => patch({ returns_stock: true }),
                  children: "Going back too"
                }
              )
            ] })
          }
        ),
        d.returns_stock && /* @__PURE__ */ jsx(Field, { label: "Goods leave from", span: 4, required: true, error: errors.warehouse, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which warehouse the goods go back off",
            value: d.warehouse_id,
            onChange: (v) => patch({ warehouse_id: v }),
            options: (warehouses || []).map((w) => ({ value: w.id, label: w.name }))
          }
        ) }),
        /* @__PURE__ */ jsx(
          Field,
          {
            label: "Stage",
            span: 4,
            hint: "A pending note changes nothing until it is approved.",
            children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "data-tone": "credit",
                  "aria-pressed": d.status === "pending",
                  onClick: () => patch({ status: "pending" }),
                  children: "Pending"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "data-tone": "cash",
                  "aria-pressed": d.status === "approved",
                  onClick: () => patch({ status: "approved" }),
                  children: "Approve now"
                }
              )
            ] })
          }
        ),
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Note no.", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reference,
            placeholder: "Auto",
            onChange: (e) => patch({ reference: e.target.value })
          }
        ) }),
        chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Date", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.date,
            onChange: (e) => patch({ date: e.target.value })
          }
        ) }),
        chrome.field("reason") && /* @__PURE__ */ jsx(
          Field,
          {
            label: "Reason",
            span: 6,
            required: true,
            hint: "It prints on the note the supplier receives.",
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "vqdoc-in",
                value: d.reason,
                placeholder: "Short delivery, damaged in transit, price differs from the quote…",
                onChange: (e) => patch({ reason: e.target.value })
              }
            )
          }
        ),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Who agreed it, when they were told…",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, totals }) => ({
        supplier_id: d.party?.id,
        purchase_id: d.source?.id || null,
        date: d.date,
        /* Sent only where the server takes it: an approved note is
           history and its update route refuses one. */
        ...isEdit ? {} : { status: d.status || "pending" },
        reason: d.reason || null,
        notes: d.notes || null,
        returns_stock: !!d.returns_stock,
        warehouse_id: d.returns_stock ? d.warehouse_id || null : null,
        discount: totals.invoiceDiscount,
        tax: totals.taxAmount,
        tax_rate: totals.taxRate
      }),
      extraTools: /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "A debit note reduces what you owe this supplier", "aria-hidden": true, children: /* @__PURE__ */ jsx(PackageX, { size: 17 }) }),
      extraSheets: ({ patch }) => picking ? /* @__PURE__ */ jsx(
        Sheet,
        {
          title: "Which bill is this about?",
          hint: "Their recent purchases. Picking one files the note against it so the two can be found together later.",
          icon: /* @__PURE__ */ jsx(FileSearch, { size: 18 }),
          width: 700,
          onClose: () => setPicking(false),
          children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: "var(--d-s2)" }, children: [
            loading && /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: "Looking…" }),
            !loading && !bills.length && /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: "Nothing bought from them yet." }),
            bills.map((b) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "vqdoc-strip",
                style: { width: "100%" },
                onClick: () => {
                  patch({ source: { id: b.id, reference: b.reference } });
                  setPicking(false);
                },
                children: [
                  /* @__PURE__ */ jsx("span", { className: "who", children: b.reference }),
                  /* @__PURE__ */ jsxs("span", { className: "meta", children: [
                    (b.date || "").slice(0, 10),
                    b.invoice_number ? ` · their no. ${b.invoice_number}` : ""
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "amt", children: money(b.total) })
                ]
              },
              b.id
            )),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vqdoc-btn",
                onClick: () => {
                  patch({ source: null });
                  setPicking(false);
                },
                children: "Not against a particular bill"
              }
            )
          ] })
        }
      ) : null
    }
  );
}
export {
  CreateDebitNote as default
};
