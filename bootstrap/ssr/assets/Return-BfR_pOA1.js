import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { Undo2 } from "lucide-react";
import { d as documentType, F as Field } from "./useDocumentChrome-DON8WQ-L.js";
import { t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
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
const DOC = documentType("purchase-return");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function PurchaseReturn({ purchase, items = [] }) {
  const { store } = usePage().props;
  const seed = useCallback(() => ({
    id: purchase?.id || uid(),
    party: { id: purchase?.party_id, name: purchase?.supplier_name || "Supplier" },
    reference: purchase?.reference_number || purchase?.invoice_number || "",
    date: today(),
    reason: "",
    notes: "",
    discount: 0,
    tax: 0,
    amountPaid: 0,
    paymentMethod: "credit",
    items: (items || []).map((i) => ({
      id: uid(),
      product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit },
      source_line_id: i.id,
      inventory_batch_id: i.inventory_batch_id,
      ordered_quantity: num(i.original_qty),
      /* What is left in THIS batch, which is not the same as what was
         bought on the line — some of it may already be sold or already
         returned. */
      max_quantity: Math.max(0, num(i.remaining_qty)),
      quantity: 0,
      price: num(i.unit_cost),
      discount: 0,
      discountType: "fixed",
      cost: num(i.unit_cost)
    }))
  }), [purchase, items]);
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      transport: "inertia",
      method: "post",
      saveLabel: "Send these back",
      partyLocked: true,
      lockItems: true,
      canAddLines: false,
      qtyFloor: 0,
      readOnlyCells: { rate: true, disc: true, total: true },
      url: () => route("store.v3.purchases.return.store", { store_slug: store?.slug, purchaseId: purchase?.id }),
      afterUrl: route("store.v3.purchases.show", { store_slug: store?.slug, purchase: purchase?.id }),
      validate: ({ d, items: lines }) => {
        if (!d.reason?.trim()) return { reason: "Say why these are going back — the supplier will ask." };
        if (!lines.some((i) => num(i.quantity) > 0)) {
          return { items: "Put a quantity against at least one line." };
        }
        const over = lines.find((i) => num(i.quantity) > num(i.max_quantity) + 1e-4);
        if (over) return { items: `Only ${over.max_quantity} of ${over.product?.name} is left to send back.` };
        return null;
      },
      header: ({ d, patch, chrome, errors }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Against purchase", span: 4, children: /* @__PURE__ */ jsx("div", { className: "vqdoc-in", style: { display: "flex", alignItems: "center" }, children: purchase?.reference_number || purchase?.invoice_number || "This purchase" }) }),
        chrome.field("date") && /* @__PURE__ */ jsx(Field, { label: "Return date", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "vqdoc-in",
            value: d.date,
            max: today(),
            onChange: (e) => patch({ date: e.target.value })
          }
        ) }),
        /* @__PURE__ */ jsx(Field, { label: "Reason", span: 5, required: true, error: errors.reason, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reason,
            placeholder: "Damaged on arrival, wrong item sent, short shipment…",
            onChange: (e) => patch({ reason: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, items: lines }) => ({
        return_date: d.date,
        reason: d.reason,
        /* Only the lines actually going back, each naming its batch.
           The old screen computed this filter and then threw it away —
           `useForm().post(url, { data })` takes visit options, not a
           payload — so every empty row was posted too. */
        items: lines.filter((i) => num(i.quantity) > 0).map((i) => ({
          purchase_item_id: i.source_line_id,
          inventory_batch_id: i.inventory_batch_id,
          return_qty: num(i.quantity)
        }))
      }),
      extraTools: /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "Goods leaving the shelf, back to the supplier", "aria-hidden": true, children: /* @__PURE__ */ jsx(Undo2, { size: 17 }) })
    }
  );
}
export {
  PurchaseReturn as default
};
