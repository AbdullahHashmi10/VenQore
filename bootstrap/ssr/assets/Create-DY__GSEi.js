import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Search, FileSearch } from "lucide-react";
import { l as linePayload, d as documentType, S as Sheet, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { b as blankLine, t as today, u as uid, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useAlert } from "../ssr.js";
import "./AsyncProductCombobox-BMa0miLw.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "react-dom";
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
const DOC = documentType("sale-return");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreateReturn({ aiPrefill }) {
  const { store, settings } = usePage().props;
  const { showAlert } = useAlert();
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const money = (n) => formatCurrency(n, store || settings);
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    source: null,
    /* the sale this answers to */
    reference: "",
    date: today(),
    reason: "",
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
    items: [blankLine()],
    ...aiPrefill && typeof aiPrefill === "object" ? aiPrefill : {}
  }), [aiPrefill]);
  const search = useCallback(async (term, partyId) => {
    setLoading(true);
    try {
      const res = await window.axios.get(route("store.api.sales.returnable", { store_slug: store?.slug }), {
        params: { query: term || void 0, party: partyId || void 0 }
      });
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [store]);
  useEffect(() => {
    if (picking) search(query, null);
  }, [picking]);
  const load = async (saleId, patch) => {
    setLoading(true);
    try {
      const res = await window.axios.get(route("store.api.sales.returnable.show", { store_slug: store?.slug, sale: saleId }));
      const { sale, items, fully_returned: done } = res.data;
      if (done) {
        showAlert({
          title: "Nothing left to return",
          message: `Everything on ${sale.reference} has already come back.`,
          type: "warning"
        });
        return;
      }
      patch({
        source: sale,
        party: { id: sale.party_id, name: sale.party_name },
        /* The lines, as they were sold, capped at what is left. A line
           with nothing returnable is still shown — greyed by its own
           zero cap — so the operator can see it was already done
           rather than wondering where it went. */
        items: items.map((i) => ({
          id: uid(),
          product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit, tax_rate: i.tax_rate },
          source_line_id: i.original_sale_item_id,
          ordered_quantity: i.sold_qty,
          max_quantity: i.returnable_qty,
          quantity: i.returnable_qty,
          freeQuantity: 0,
          price: i.unit_price,
          discount: 0,
          discountType: "fixed",
          tax_rate: i.tax_rate,
          cost: i.cost_price
        }))
      });
      setPicking(false);
    } catch (err) {
      showAlert({ title: "Could not load that sale", message: err?.response?.data?.message || "Try another one.", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      transport: "axios",
      saveLabel: "Take the return",
      lockItems: true,
      canAddLines: false,
      settleDefault: (d, totals) => d.paymentMethod === "cash" ? totals.grandTotal : 0,
      url: () => route("store.returns.store", { store_slug: store?.slug }),
      validate: ({ d, items }) => {
        if (!d.source?.id) return { source: "Choose the invoice this is being returned against." };
        if (!items.some((i) => i.product && num(i.quantity) > 0)) {
          return { items: "Put a quantity against at least one line." };
        }
        const over = items.find((i) => i.max_quantity !== void 0 && num(i.quantity) > num(i.max_quantity) + 1e-4);
        if (over) {
          return { items: `Only ${over.max_quantity} of ${over.product?.name} is still returnable on that invoice.` };
        }
        return null;
      },
      header: ({ d, patch, chrome, acct, errors, setSettleMode }) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Field, { label: "Against invoice", span: 4, required: true, error: errors.source, children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vqdoc-in",
            style: { textAlign: "left", cursor: "pointer" },
            onClick: () => setPicking(true),
            children: d.source ? `${d.source.reference} · ${money(d.source.total)}` : "Find the sale being returned…"
          }
        ) }),
        /* @__PURE__ */ jsx(Field, { label: "Refund", span: 4, children: /* @__PURE__ */ jsxs("div", { className: "vqdoc-seg", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "cash",
              "aria-pressed": d.paymentMethod === "cash",
              onClick: () => setSettleMode("cash"),
              children: "Money back now"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "data-tone": "credit",
              "aria-pressed": d.paymentMethod === "credit",
              onClick: () => setSettleMode("credit"),
              children: "Credit their account"
            }
          )
        ] }) }),
        chrome.field("refund") && d.paymentMethod === "cash" && /* @__PURE__ */ jsx(Field, { label: "Refund from", span: 4, children: /* @__PURE__ */ jsx(
          VqSelect,
          {
            ariaLabel: "Which account the refund is paid out of",
            value: d.paymentAccountKey ?? acct.defaultKey ?? "",
            onChange: (v) => {
              const p = acct.resolve(v);
              if (p) patch(p);
            },
            options: acct.options
          }
        ) }),
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Return no.", span: 3, children: /* @__PURE__ */ jsx(
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
            max: today(),
            onChange: (e) => patch({ date: e.target.value })
          }
        ) }),
        chrome.field("reason") && /* @__PURE__ */ jsx(Field, { label: "Reason", span: 6, hint: "It prints on the credit note and shows in the ledger.", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reason,
            placeholder: "Damaged, wrong size, changed their mind…",
            onChange: (e) => patch({ reason: e.target.value })
          }
        ) }),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Condition the goods came back in, who authorised it…",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, items, totals }) => ({
        customer_id: d.party?.id,
        original_sale_id: d.source?.id,
        return_reason: d.reason || null,
        notes: d.notes || null,
        date: d.date,
        payment_method: d.paymentMethod === "cash" ? "cash" : "credit",
        /* What actually went back over the counter. Anything short of
           the return's value becomes credit on their account rather
           than quietly disappearing. */
        amount_refunded: totals.settled,
        payment_account_id: d.paymentMethod === "cash" ? d.paymentAccountId || null : null,
        /* Lines nobody is returning are not part of the return. */
        items: linePayload({
          doc: DOC,
          items: items.filter((i) => i.product && num(i.quantity) > 0),
          totals
        })
      }),
      extraSheets: ({ patch }) => picking ? /* @__PURE__ */ jsxs(
        Sheet,
        {
          title: "Which sale is coming back?",
          hint: "Only posted sales can be returned against. Picking one loads its lines and caps each of them at what is still returnable.",
          icon: /* @__PURE__ */ jsx(FileSearch, { size: 18 }),
          width: 760,
          onClose: () => setPicking(false),
          children: [
            /* @__PURE__ */ jsx("div", { className: "vqdoc-hdr", style: { padding: 0 }, children: /* @__PURE__ */ jsx(Field, { label: "Search", span: 12, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "var(--d-s3)" }, children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: "vqdoc-in",
                  value: query,
                  autoFocus: true,
                  placeholder: "Invoice number or customer name",
                  onChange: (e) => setQuery(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") search(query, null);
                  }
                }
              ),
              /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", onClick: () => search(query, null), children: [
                /* @__PURE__ */ jsx(Search, { size: 15 }),
                " Find"
              ] })
            ] }) }) }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gap: "var(--d-s2)", marginTop: "var(--d-s4)" }, children: [
              loading && /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: "Looking…" }),
              !loading && !sales.length && /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)" }, children: "No posted sales match that." }),
              sales.map((s) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "vqdoc-strip",
                  style: { width: "100%" },
                  onClick: () => load(s.id, patch),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "who", children: s.party_name || "Walk-in" }),
                    /* @__PURE__ */ jsxs("span", { className: "meta", children: [
                      s.reference_number,
                      " · ",
                      (s.posted_at || "").slice(0, 10)
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "amt", children: money(s.total) })
                  ]
                },
                s.id
              ))
            ] })
          ]
        }
      ) : null
    }
  );
}
export {
  CreateReturn as default
};
