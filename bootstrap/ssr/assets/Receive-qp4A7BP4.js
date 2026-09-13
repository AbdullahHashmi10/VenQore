import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { PackageCheck } from "lucide-react";
import { d as documentType, F as Field } from "./useDocumentChrome-DON8WQ-L.js";
import { t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
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
const DOC = documentType("goods-receipt");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function ReceivePurchase({ purchase, items = [] }) {
  const { store, settings } = usePage().props;
  const money = (n) => formatCurrency(n, store || settings);
  const remainingOf = (i) => Math.max(0, num(i.qty ?? i.quantity) - num(i.received_qty));
  const seed = useCallback(() => ({
    id: purchase?.id || uid(),
    party: { id: purchase?.party_id, name: purchase?.supplier_name || "Supplier" },
    reference: purchase?.reference_number || purchase?.invoice_number || "",
    date: today(),
    notes: "",
    items: (items || []).map((i) => ({
      id: uid(),
      product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit },
      source_line_id: i.id,
      ordered_quantity: num(i.qty ?? i.quantity),
      max_quantity: remainingOf(i),
      /* Everything outstanding, because that is what a delivery usually
         is. A short one is a number the operator changes, not a form
         they have to fill in from scratch. */
      quantity: remainingOf(i),
      price: num(i.unit_cost),
      cost: num(i.unit_cost),
      batch: "",
      expiry: ""
    }))
  }), [purchase, items]);
  const valueOf = (lines) => lines.reduce((s, i) => s + num(i.quantity) * num(i.price), 0);
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      transport: "inertia",
      method: "post",
      saveLabel: "Receive these goods",
      partyLocked: true,
      lockItems: true,
      canAddLines: false,
      qtyFloor: 0,
      url: () => route("store.v3.purchases.receive.store", { store_slug: store?.slug, purchase: purchase?.id }),
      afterUrl: route("store.v3.purchases.show", { store_slug: store?.slug, purchase: purchase?.id }),
      validate: ({ items: lines }) => {
        if (!lines.some((i) => num(i.quantity) > 0)) {
          return { items: "Nothing is being received — put a quantity against at least one line." };
        }
        const over = lines.find((i) => num(i.quantity) > num(i.max_quantity) + 1e-4);
        if (over) return { items: `Only ${over.max_quantity} of ${over.product?.name} is still outstanding.` };
        const dated = lines.find((i) => i.expiry && i.expiry < today());
        if (dated) return { items: `${dated.product?.name} has an expiry date in the past.` };
        return null;
      },
      header: ({ d, patch, chrome }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Against purchase", span: 4, children: /* @__PURE__ */ jsx("div", { className: "vqdoc-in", style: { display: "flex", alignItems: "center" }, children: purchase?.reference_number || purchase?.invoice_number || "This purchase" }) }),
        chrome.field("notes") && /* @__PURE__ */ jsx(
          Field,
          {
            label: "Condition on arrival",
            span: 5,
            hint: "Kept with the purchase — it is the one thing nobody can reconstruct later.",
            children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "vqdoc-in",
                value: d.notes,
                placeholder: "Two cartons crushed, driver noted it…",
                onChange: (e) => patch({ notes: e.target.value })
              }
            )
          }
        )
      ] }),
      dockTotal: ({ items: lines }) => money(valueOf(lines)),
      dockLabel: "Value arriving",
      extraRows: ({ items: lines }) => /* @__PURE__ */ jsxs("div", { className: "vqdoc-sum-row", children: [
        /* @__PURE__ */ jsx("span", { className: "k", children: "Value arriving" }),
        /* @__PURE__ */ jsx("span", { className: "v", children: money(valueOf(lines)) })
      ] }),
      buildPayload: ({ d, items: lines }) => ({
        notes: d.notes || null,
        items: lines.filter((i) => num(i.quantity) > 0).map((i) => ({
          purchase_item_id: i.source_line_id,
          receiving_qty: num(i.quantity),
          batch_number: i.batch || null,
          expiry_date: i.expiry || null
        }))
      }),
      extraTools: /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "Goods arriving onto the shelf", "aria-hidden": true, children: /* @__PURE__ */ jsx(PackageCheck, { size: 17 }) })
    }
  );
}
export {
  ReceivePurchase as default
};
