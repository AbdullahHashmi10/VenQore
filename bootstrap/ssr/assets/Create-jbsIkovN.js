import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { ArrowRightLeft, ShoppingCart, ClipboardList, Printer } from "lucide-react";
import { d as documentType, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { b as blankLine, t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import { u as useAlert } from "../ssr.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "react-dom";
import "./format-131Nyq79.js";
import "./terms-DwYjlWsV.js";
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
const DOC = documentType("quotation");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().split("T")[0];
function CreateQuotation({ existingProposal, customers = [], products = [] }) {
  const { store, settings } = usePage().props;
  const { showAlert } = useAlert();
  const isEdit = !!existingProposal?.id;
  const [converting, setConverting] = useState(false);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    reference: "",
    date: today(),
    /* A month is the ordinary answer, and an ordinary answer that can be
       changed beats an empty box that is left empty. */
    valid_until: inDays(30),
    terms: "net30",
    status: "draft",
    notes: "",
    discount: 0,
    tax: num(settings?.default_tax_rate),
    delivery_charge: 0,
    extra_charge_value: 0,
    extra_charge_label: "",
    items: [blankLine()]
  }), [settings]);
  const editSeed = useCallback(() => ({
    ...seed(),
    id: existingProposal.id,
    party: existingProposal.customer ? {
      id: existingProposal.customer.id,
      name: existingProposal.customer.name,
      current_balance: existingProposal.customer.current_balance
    } : null,
    reference: existingProposal.reference || "",
    date: (existingProposal.date || existingProposal.created_at || "").slice(0, 10) || today(),
    valid_until: (existingProposal.valid_until || "").slice(0, 10) || "",
    terms: existingProposal.payment_terms || "net30",
    status: existingProposal.status || "draft",
    notes: existingProposal.notes || "",
    discount: num(existingProposal.discount_amount ?? existingProposal.discount),
    tax: num(existingProposal.tax_rate),
    delivery_charge: num(existingProposal.delivery_charge),
    extra_charge_value: num(existingProposal.extra_charge_value),
    extra_charge_label: existingProposal.extra_charge_label || "",
    items: (existingProposal.items || []).length ? existingProposal.items.map((i) => ({
      id: uid(),
      product: i.product || { id: i.product_id, name: i.product_name },
      quantity: num(i.quantity),
      freeQuantity: num(i.free_quantity),
      price: num(i.unit_price ?? i.price),
      /* Stored as money, so it comes back as money. Reading it back
         as a percentage is what turned a 200 discount into 200%. */
      discount: num(i.discount),
      discountType: "fixed",
      tax_rate: i.tax_rate ?? null,
      cost: num(i.product?.cost_price)
    })) : [blankLine()]
  }), [seed, existingProposal]);
  const convert = async (kind) => {
    if (!isEdit) {
      showAlert({ title: "Save it first", message: "A quotation has to be saved before it can be turned into anything.", type: "warning" });
      return;
    }
    setConverting(true);
    try {
      const name = kind === "sale" ? "convertSale" : "convertOrder";
      const res = await window.axios.post(route(DOC.api[name], { store_slug: store?.slug, proposal: existingProposal.id }));
      showAlert({
        title: kind === "sale" ? "Sold" : "Ordered",
        message: kind === "sale" ? "The quotation is now a sale and the stock has left the shelf." : "The quotation is now an order and the stock is reserved.",
        type: "success"
      });
      const to = kind === "sale" ? "store.sales.index" : "store.pre-sales.index";
      router.visit(res?.data?.redirect || route(to, { store_slug: store?.slug }));
    } catch (err) {
      showAlert({ title: "Could not convert", message: err?.response?.data?.message || "Something went wrong.", type: "error" });
    } finally {
      setConverting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      editSeed,
      isEdit,
      products,
      parties: customers,
      saveLabel: isEdit ? "Update quotation" : "Save quotation",
      transport: "axios",
      url: ({ d }) => isEdit ? route("store.proposals.update", { store_slug: store?.slug, proposal: d.id }) : route("store.proposals.store", { store_slug: store?.slug }),
      header: ({ d, patch, chrome }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Quotation no.", span: 3, children: /* @__PURE__ */ jsx(
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
        chrome.field("validity") && /* @__PURE__ */ jsx(
          Field,
          {
            label: "Valid until",
            span: 3,
            hint: "After this date the prices on it no longer stand.",
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "vqdoc-in",
                value: d.valid_until,
                min: d.date,
                onChange: (e) => patch({ valid_until: e.target.value })
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(Field, { label: "Stage", span: 3, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Where this quotation has got to",
            value: d.status,
            onChange: (v) => patch({ status: v }),
            options: [
              { value: "draft", label: "Draft", hint: "Still being put together" },
              { value: "sent", label: "Sent", hint: "The customer has it" },
              { value: "accepted", label: "Accepted", hint: "They said yes — convert it" },
              { value: "declined", label: "Declined", hint: "Kept for the record" }
            ]
          }
        ) }),
        chrome.field("terms") && /* @__PURE__ */ jsx(Field, { label: "Payment terms", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Payment terms",
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
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note on the quotation", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Anything the customer should read with the prices",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, totals }) => ({
        customer_id: d.party?.id || null,
        customer_name: d.party?.name || null,
        date: d.date,
        valid_until: d.valid_until || null,
        status: d.status || "draft",
        notes: d.notes || null,
        reference: d.reference || null,
        payment_terms: d.terms || null,
        /* This controller reads the discount and the tax under their
           own names as well; sending only the shared spelling is how
           they came back as zero. */
        discount_amount: totals.invoiceDiscount,
        tax_amount: totals.taxAmount
      }),
      extraActions: isEdit ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqdoc-btn",
            disabled: converting,
            title: "Sell it now — stock leaves the shelf",
            onClick: () => convert("sale"),
            children: [
              /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }),
              " Turn into a sale"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqdoc-btn",
            disabled: converting,
            title: "Take it as an order — stock is reserved, not sold",
            onClick: () => convert("order"),
            children: [
              /* @__PURE__ */ jsx(ClipboardList, { size: 16 }),
              " Turn into an order"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vqdoc-btn",
            onClick: () => window.open(route(DOC.api.print, { store_slug: store?.slug, proposal: existingProposal.id }), "_blank"),
            children: [
              /* @__PURE__ */ jsx(Printer, { size: 16 }),
              " Print"
            ]
          }
        )
      ] }) : null,
      extraTools: isEdit ? /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "Saved quotation", "aria-hidden": true, children: /* @__PURE__ */ jsx(ArrowRightLeft, { size: 17 }) }) : null
    }
  );
}
export {
  CreateQuotation as default
};
