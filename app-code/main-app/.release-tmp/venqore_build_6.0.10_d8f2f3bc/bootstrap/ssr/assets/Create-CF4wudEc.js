import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { Plus, Receipt, Paperclip } from "lucide-react";
import { S as Sheet, F as Field, V as VqSelect, d as documentType } from "./useDocumentChrome-BlLAD1Fq.js";
import { u as uid, t as today, M as MoneyDocument } from "./MoneyDocument-C30SGFXN.js";
import { u as useAlert } from "../ssr.js";
import "./AsyncProductCombobox-VR_zTDdV.js";
import "axios";
import "use-debounce";
import "./SmartCombobox-DjVsfUgw.js";
import "react-dom";
import "./format-Dor_DYzH.js";
import "./terms-BnWz3Igl.js";
import "./OneGlanceLayout-B_nL-Bzp.js";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "./Input-B_UmKR56.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./settings-DUqQ1JdE.js";
import "./AsyncPartyCombobox-Ctn_oV81.js";
import "./ProductModal-BzShwoXg.js";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-CyM9VGV1.js";
import "./QuickPartyModal-BZGpvX0o.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
const DOC = documentType("expense");
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
function CreateExpense({ categories = [], approval_correction = null }) {
  const { store } = usePage().props;
  const { showAlert } = useAlert();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [newCat, setNewCat] = useState(null);
  const posting = useRef(false);
  const [cats, setCats] = useState(categories);
  const blankCost = () => ({ id: uid(), category_id: "", desc: "", amount: 0 });
  const seed = useCallback(() => {
    if (approval_correction?.payload) {
      const p = approval_correction.payload;
      return {
        id: uid(),
        party: p.party || (p.payee ? { name: p.payee, id: p.party_id } : null),
        reference: p.reference || "",
        date: p.date || today(),
        notes: p.description || p.notes || "",
        discount: p.discount || 0,
        tax: p.tax || p.tax_amount || 0,
        paymentMethod: p.payment_method || "cash",
        amountPaid: p.amount_paid || p.amount || 0,
        paymentAccountId: p.bank_account_id || null,
        paymentAccountKey: null,
        items: p.items?.length ? p.items.map((it) => ({
          id: uid(),
          category_id: it.expense_category_id || it.category_id || p.expense_category_id || "",
          desc: it.description || it.desc || p.description || "",
          amount: it.amount || p.amount || 0
        })) : [{
          id: uid(),
          category_id: p.expense_category_id || "",
          desc: p.description || "",
          amount: p.amount || 0
        }]
      };
    }
    return {
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
    };
  }, [approval_correction]);
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
      saveLabel: approval_correction ? "Resubmit Corrected Expense" : "Record the expense",
      notice: approval_correction ? /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 text-amber-900 dark:text-amber-200", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 font-bold text-sm", children: /* @__PURE__ */ jsxs("span", { children: [
          "⚠️ Correction Mode — Returned for Correction (Revision #",
          approval_correction.version,
          ")"
        ] }) }),
        approval_correction.return_notes && /* @__PURE__ */ jsxs("p", { className: "text-xs mt-1 text-ink", children: [
          /* @__PURE__ */ jsx("strong", { children: "Reviewer Notes:" }),
          " ",
          approval_correction.return_notes
        ] }),
        approval_correction.return_reason_codes?.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-1.5 mt-2 flex-wrap", children: approval_correction.return_reason_codes.map((code, idx) => /* @__PURE__ */ jsx("span", { className: "text-2xs bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded font-mono", children: code }, idx)) })
      ] }) : null,
      settleDefault: (d, totals) => d.paymentMethod === "cash" ? totals.grandTotal : 0,
      url: () => approval_correction ? approval_correction.resubmit_url : route("store.expenses.store", { store_slug: store?.slug }),
      onSaved: () => {
        if (approval_correction) {
          router.visit(route("store.approvals.show", { store_slug: store?.slug || window.location.pathname.split("/")[2], id: approval_correction.document_id }));
        }
      },
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
        const basePayload = {
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
        if (approval_correction) {
          return {
            payload: basePayload,
            expected_version: approval_correction.expected_version,
            notes: "Resubmitted with corrections"
          };
        }
        return basePayload;
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
