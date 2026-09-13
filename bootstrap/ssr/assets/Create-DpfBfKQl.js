import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { Plus, Receipt, Paperclip } from "lucide-react";
import { d as documentType, S as Sheet, F as Field, V as VqSelect } from "./useDocumentChrome-DON8WQ-L.js";
import { u as uid, t as today, M as MoneyDocument } from "./MoneyDocument-DTHxEW3W.js";
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
const DOC = documentType("expense");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreateExpense({ categories = [] }) {
  const { store } = usePage().props;
  const { showAlert } = useAlert();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [newCat, setNewCat] = useState(null);
  const posting = useRef(false);
  const [cats, setCats] = useState(categories);
  const blankCost = () => ({ id: uid(), category_id: "", desc: "", amount: 0 });
  const seed = useCallback(() => ({
    id: uid(),
    party: null,
    reference: "",
    date: today(),
    notes: "",
    discount: 0,
    tax: 0,
    paymentMethod: "cash",
    amountPaid: 0,
    paymentAccountId: null,
    paymentAccountKey: null,
    items: [blankCost()]
  }), []);
  const createCategory = async (name) => {
    try {
      const res = await window.axios.post(route("store.expenses.category.store", { store_slug: store?.slug }), { name });
      const made = res.data?.category;
      if (made) {
        setCats((p) => [...p, made]);
        setNewCat(null);
        return made.id;
      }
    } catch (err) {
      showAlert({ title: "Could not add that", message: err?.response?.data?.message || "Try a different name.", type: "error" });
    }
    return null;
  };
  return /* @__PURE__ */ jsx(
    MoneyDocument,
    {
      doc: DOC,
      seed,
      categories: cats,
      transport: "axios",
      saveLabel: "Record the expense",
      settleDefault: (d, totals) => d.paymentMethod === "cash" ? totals.grandTotal : 0,
      url: () => route("store.expenses.store", { store_slug: store?.slug }),
      validate: ({ d, items }) => {
        if (d.paymentAccountKind === "cheque") {
          return { party: "Choose the bank account the cheque is drawn on." };
        }
        const priced = items.filter((i) => i.category_id || i.desc);
        if (!priced.length) return { items: "Say what the money was for." };
        if (priced.some((i) => !i.category_id)) return { items: "Every line needs a category." };
        if (!priced.some((i) => num(i.amount) > 0)) return { items: "Put an amount on at least one line." };
        return null;
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
              children: "Still owing"
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
        chrome.field("docno") && /* @__PURE__ */ jsx(Field, { label: "Voucher no.", span: 3, children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "vqdoc-in",
            value: d.reference,
            placeholder: "Their bill number, or your own",
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
        chrome.field("attachment") && /* @__PURE__ */ jsx(Field, { label: "Attachment", span: 4, hint: "A photograph of the bill, kept with the record.", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "var(--d-s2)", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", onClick: () => fileRef.current?.click(), children: [
            /* @__PURE__ */ jsx(Paperclip, { size: 15 }),
            " ",
            file ? "Change" : "Attach"
          ] }),
          /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)", fontSize: "var(--d-t-sm)", overflow: "hidden", textOverflow: "ellipsis" }, children: file ? file.name : "Nothing attached" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileRef,
              type: "file",
              accept: "image/*,.pdf",
              hidden: true,
              onChange: (e) => setFile(e.target.files?.[0] || null)
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(Field, { label: "New category", span: 4, hint: "Add one without leaving this voucher.", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "vqdoc-btn", onClick: () => setNewCat(""), children: [
          /* @__PURE__ */ jsx(Plus, { size: 15 }),
          " Add a category"
        ] }) }),
        chrome.field("notes") && /* @__PURE__ */ jsx(Field, { label: "Note", span: 12, children: /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "vqdoc-in",
            rows: 2,
            value: d.notes,
            placeholder: "Who was paid, what period it covers…",
            onChange: (e) => patch({ notes: e.target.value })
          }
        ) })
      ] }),
      buildPayload: ({ d, items, totals }) => {
        const lines = items.filter((i) => i.category_id && (num(i.amount) > 0 || i.desc)).map((i) => ({
          expense_category_id: i.category_id,
          description: i.desc || null,
          amount: num(i.amount)
        }));
        return {
          date: d.date,
          /* The row still carries one category, one amount and one
             tax figure so every existing list, filter and report
             keeps working; the lines sit underneath it. */
          expense_category_id: lines[0]?.expense_category_id,
          amount: lines.reduce((s, l) => s + l.amount, 0),
          /* Tax is asked for once, on the voucher, not line by line:
             there is no column for it on an expense and a figure
             that cannot be typed is a figure that is always zero. */
          tax_amount: totals.taxAmount,
          payment_method: acctIsBank(d) ? "bank" : "cash",
          bank_account_id: acctIsBank(d) ? d.bankReferenceId || d.paymentAccountId : null,
          payee: d.party?.name || null,
          party_id: d.party?.id || null,
          amount_paid: totals.settled,
          reference: d.reference || null,
          description: lines[0]?.description || d.notes || null,
          notes: d.notes || null,
          items: lines
        };
      },
      beforeSave: ({ d, items, totals, showAlert: alert }) => {
        if (!file) return true;
        if (posting.current) return false;
        posting.current = true;
        postWithFile({ d, items, totals, file, store, alert, router }).finally(() => {
          posting.current = false;
        });
        return false;
      },
      extraTools: /* @__PURE__ */ jsx("span", { className: "vqdoc-icon", title: "Money leaving the business", "aria-hidden": true, children: /* @__PURE__ */ jsx(Receipt, { size: 17 }) }),
      extraSheets: newCat !== null ? /* @__PURE__ */ jsx(
        Sheet,
        {
          title: "New expense category",
          hint: "It will be available on every voucher from now on.",
          icon: /* @__PURE__ */ jsx(Plus, { size: 18 }),
          width: 460,
          onClose: () => setNewCat(null),
          footer: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "vqdoc-btn", onClick: () => setNewCat(null), children: "Cancel" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vqdoc-btn pri",
                disabled: !newCat.trim(),
                onClick: () => createCategory(newCat.trim()),
                children: "Add it"
              }
            )
          ] }),
          children: /* @__PURE__ */ jsx("div", { className: "vqdoc-hdr", style: { padding: 0 }, children: /* @__PURE__ */ jsx(Field, { label: "Name", span: 12, children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "vqdoc-in",
              value: newCat,
              autoFocus: true,
              placeholder: "Shop rent, electricity, staff tea…",
              onChange: (e) => setNewCat(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && newCat.trim()) createCategory(newCat.trim());
              }
            }
          ) }) })
        }
      ) : null
    }
  );
}
const acctIsBank = (d) => d.paymentAccountKind === "bank" || d.paymentAccountKind === "wallet";
async function postWithFile({ d, items, totals, file, store, alert, router: nav }) {
  const form = new FormData();
  const lines = items.filter((i) => i.category_id && (parseFloat(i.amount) > 0 || i.desc)).map((i) => ({
    expense_category_id: i.category_id,
    description: i.desc || "",
    amount: parseFloat(i.amount) || 0
  }));
  form.append("date", d.date);
  form.append("expense_category_id", lines[0]?.expense_category_id || "");
  form.append("amount", String(lines.reduce((s, l) => s + l.amount, 0)));
  form.append("tax_amount", String(totals.taxAmount || 0));
  form.append("payment_method", acctIsBank(d) ? "bank" : "cash");
  if (acctIsBank(d) && (d.bankReferenceId || d.paymentAccountId)) {
    form.append("bank_account_id", d.bankReferenceId || d.paymentAccountId);
  }
  if (d.party?.name) form.append("payee", d.party.name);
  if (d.party?.id) form.append("party_id", d.party.id);
  form.append("amount_paid", String(totals.settled));
  if (d.reference) form.append("reference", d.reference);
  if (d.notes) form.append("notes", d.notes);
  form.append("description", lines[0]?.description || d.notes || "");
  lines.forEach((l, i) => {
    form.append(`items[${i}][expense_category_id]`, l.expense_category_id);
    form.append(`items[${i}][description]`, l.description);
    form.append(`items[${i}][amount]`, String(l.amount));
  });
  form.append("attachment", file);
  try {
    await window.axios.post(route("store.expenses.store", { store_slug: store?.slug }), form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    alert({ title: "Saved", message: "Expense recorded.", type: "success" });
    nav.visit(route("store.expenses.index", { store_slug: store?.slug }));
  } catch (err) {
    const errs = err?.response?.data?.errors;
    alert({
      title: "Could not save",
      message: (errs ? Object.values(errs)[0]?.[0] : null) || err?.response?.data?.message || "Something went wrong.",
      type: "error"
    });
  }
}
export {
  CreateExpense as default
};
