import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { AlertCircle, Upload, Loader2, Download, Trash2, Plus } from "lucide-react";
import ToolShell from "./ToolShell-BE5CpfRw.js";
import Select from "./Select-BFX9Hz_h.js";
import EditableText from "./EditableText-C1JAkTTV.js";
import "@inertiajs/react";
import "./MarketingLayout-CMiC1Bik.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ToolsSidebar-BvvbAU_Q.js";
import "./HousePromo-CAVKWeBy.js";
const STORAGE_KEY = "venqore_credit_note_company_profile_v1";
const ACCENT_PRESETS = ["#dc2626", "#4f46e5", "#0ea5e9", "#059669", "#d97706", "#7c3aed"];
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });
const FAQS = [
  { q: "Is the VenQore credit note generator really free?", a: "Yes. Creating and downloading a PDF credit note is completely free, with no signup, no watermark and no limit on how many you generate." },
  { q: "What is the difference between a credit note and a refund?", a: "A credit note is a document — it records that you owe the customer an amount and states why. A refund is the actual money movement. A single credit note can result in a cash refund, store credit, or an offset against a future invoice." },
  { q: "Do I need a credit note for every return?", a: "It is best practice whenever a return, refund, or price correction affects an invoice you already issued, since it creates a paper trail for both sides." },
  { q: "Is a credit note the same as a negative invoice?", a: "Conceptually similar but not the same document. A proper credit note explicitly references the original invoice it is correcting or reversing and states a reason." },
  { q: "Why does this tool require the original invoice number?", a: "A credit note with no reference to what it is crediting is not auditable. Requiring the original invoice number keeps every credit note usable as a real accounting record." },
  { q: "Is my credit note data stored anywhere?", a: "No. The PDF is generated on request and streamed back to you immediately. Nothing about the credit note — company, client, or line items — is saved on our servers." },
  { q: "Does the preview match the downloaded PDF?", a: 'Yes. The document you edit on screen is built to match the downloaded PDF layout, fonts and spacing exactly — including the "Total Credit" figure — so there are no surprises after download.' }
];
function CreditNoteTool({
  templates = {},
  currencies = {},
  reasons = {},
  refundMethods = {},
  maxItems = 100,
  suggestedNumber = "",
  toolGroups = []
}) {
  const [company, setCompany] = useState({ name: "", address: "", email: "", phone: "", tax_id: "", logo_base64: null });
  const [client, setClient] = useState({ name: "", address: "", email: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [meta, setMeta] = useState({
    credit_note_number: suggestedNumber,
    original_invoice_number: "",
    original_invoice_date: "",
    reason: "return",
    custom_reason: "",
    refund_method: "store_credit",
    issue_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    currency: "USD",
    notes: "",
    terms: "Credit will be applied according to selected refund method upon approval.",
    template: "clean",
    accent_color: "#dc2626"
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompany((c) => ({ ...c, ...JSON.parse(raw) }));
    } catch (e) {
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    } catch (e) {
    }
  }, [company]);
  const symbol = currencies[meta.currency] || meta.currency;
  const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
  const lineTotals = useMemo(() => items.map((it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unit_price) || 0;
    const discPct = Math.min(100, Math.max(0, parseFloat(it.discount_pct) || 0));
    const taxPct = Math.max(0, parseFloat(it.tax_rate) || 0);
    const gross = qty * price;
    const discAmt = gross * (discPct / 100);
    const net = gross - discAmt;
    const taxAmt = net * (taxPct / 100);
    return { net, taxAmt, discAmt, lineTotal: net + taxAmt };
  }), [items]);
  const totals = useMemo(() => lineTotals.reduce((acc, l) => ({
    subtotal: acc.subtotal + l.net,
    tax: acc.tax + l.taxAmt,
    discount: acc.discount + l.discAmt
  }), { subtotal: 0, tax: 0, discount: 0 }), [lineTotals]);
  const grandTotal = totals.subtotal + totals.tax;
  const updateItem = (idx, field, val) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };
  const addItem = () => {
    if (items.length >= maxItems) return;
    setItems((prev) => [...prev, emptyItem()]);
  };
  const removeItem = (idx) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15e5) {
      setErrors(["Logo image is too large — please use a file under 1.5MB."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCompany((c) => ({ ...c, logo_base64: reader.result }));
    reader.readAsDataURL(file);
  };
  const generate = async () => {
    setErrors([]);
    if (!company.name.trim()) {
      setErrors(['Your company name is required. Click "Your business name" on the credit note above.']);
      return;
    }
    if (!client.name.trim()) {
      setErrors(['A client name is required. Click "Client name" under Credited To on the credit note above.']);
      return;
    }
    if (!meta.original_invoice_number.trim()) {
      setErrors(['Original invoice number is required for reference. Click "Original Invoice #" on the credit note above.']);
      return;
    }
    if (!meta.reason) {
      setErrors(["A reason for credit is required. Choose one in the Reason for Credit dropdown on the credit note above."]);
      return;
    }
    if (meta.reason === "other" && !meta.custom_reason.trim()) {
      setErrors(['Please specify the custom reason for credit — the "Specify Custom Reason" field on the credit note above is required when Reason is set to Other.']);
      return;
    }
    if (!items.some((it) => it.description.trim())) {
      setErrors(["Add at least one credit line item with a description."]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(route("tools.credit-note.render"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
          Accept: "application/json"
        },
        body: JSON.stringify({ company, client, items, meta })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ["Could not generate that credit note. Please check your entries and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credit-note-${(meta.credit_note_number || "draft").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrors(["Something went wrong generating the PDF. Please try again."]);
    } finally {
      setLoading(false);
    }
  };
  const templateOptions = Object.entries(templates).map(([key, t]) => ({
    value: key,
    label: t.name,
    hint: t.description
  }));
  const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({
    value: code,
    label: `${code} (${sym})`
  }));
  const reasonOptions = Object.entries(reasons).map(([key, label]) => ({
    value: key,
    label
  }));
  const refundMethodOptions = Object.entries(refundMethods).map(([key, label]) => ({
    value: key,
    label
  }));
  const accent = meta.template === "modern" ? meta.accent_color : "#dc2626";
  const isModern = meta.template === "modern";
  const isClassic = meta.template === "classic";
  const isCompact = meta.template === "compact";
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Credit Note Generator — PDF, No Watermark | VenQore",
      metaDescription: "Create a professional PDF credit note free online. References the original invoice, records the reason for credit, multiple templates and currencies. No signup, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Credit Note Generator",
      answer: "Edit the credit note below exactly as it will look in your PDF — click any field to change it. References the original invoice, records the reason for credit, four templates, no signup, no watermark.",
      toolGroups,
      currentSlug: "credit-note-generator",
      faqs: FAQS,
      cta: { headline: "Returns and credit notes made simple.", subtext: "VenQore links sales, returns, and inventory adjustments automatically in real time." },
      related: [{ href: "/tools/invoice-generator", label: "Invoice Generator" }],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(Select, { value: meta.template, onChange: (v) => setMeta((m) => ({ ...m, template: v })), options: templateOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.currency, onChange: (v) => setMeta((m) => ({ ...m, currency: v })), options: currencyOptions }) }),
          isModern && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: ACCENT_PRESETS.map((c) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setMeta((m) => ({ ...m, accent_color: c })),
              className: `w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? "scale-110 border-slate-900 dark:border-white" : "border-transparent"}`,
              style: { background: c },
              "aria-label": c
            },
            c
          )) }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-red-400/40 transition-colors", children: [
            /* @__PURE__ */ jsx(Upload, { size: 13 }),
            " ",
            company.logo_base64 ? "Change logo" : "Add logo"
          ] }),
          company.logo_base64 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCompany((c) => ({ ...c, logo_base64: null })), className: "text-xs font-bold text-slate-400 hover:text-red-500 transition-colors", children: "Remove logo" }),
          /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: onLogoChange }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline", children: "Saved in your browser — nothing sent until you download" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: generate,
                disabled: loading,
                className: "flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100",
                children: [
                  loading ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Download, { size: 14 }),
                  loading ? "Generating…" : "Download PDF"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white", children: [
          isModern && /* @__PURE__ */ jsx("div", { className: "h-3 w-full", style: { background: accent } }),
          /* @__PURE__ */ jsxs("div", { className: `p-6 sm:p-10 text-slate-900 ${isCompact ? "text-[13px]" : "text-sm"}`, style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row justify-between gap-6 mb-6 ${isClassic ? "border-b-2 border-slate-900 pb-4" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                company.logo_base64 && /* @__PURE__ */ jsx("img", { src: company.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: company.name,
                    onChange: (v) => setCompany((c) => ({ ...c, name: v })),
                    placeholder: "Your business name",
                    className: "block text-lg font-bold"
                  }
                ),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: company.address,
                    onChange: (v) => setCompany((c) => ({ ...c, address: v })),
                    placeholder: "Business address",
                    as: "textarea",
                    rows: 2,
                    className: "block text-slate-500 text-xs mt-1 max-w-xs"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 text-xs text-slate-500 mt-1", children: [
                  /* @__PURE__ */ jsx(EditableText, { value: company.email, onChange: (v) => setCompany((c) => ({ ...c, email: v })), placeholder: "email@business.com" }),
                  /* @__PURE__ */ jsx(EditableText, { value: company.phone, onChange: (v) => setCompany((c) => ({ ...c, phone: v })), placeholder: "Phone number" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-0.5", children: [
                  "Tax ID: ",
                  /* @__PURE__ */ jsx(EditableText, { value: company.tax_id, onChange: (v) => setCompany((c) => ({ ...c, tax_id: v })), placeholder: "optional" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-black tracking-tight", style: { color: accent }, children: "CREDIT NOTE" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs space-y-0.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Credit Note #" }),
                    /* @__PURE__ */ jsx(EditableText, { value: meta.credit_note_number, onChange: (v) => setMeta((m) => ({ ...m, credit_note_number: v })), className: "font-bold" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Issue date" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.issue_date, onChange: (v) => setMeta((m) => ({ ...m, issue_date: v })) })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 rounded-xl bg-red-50 border border-red-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3 mb-3 text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-baseline", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-slate-500 shrink-0", children: [
                    "Original Invoice # ",
                    /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(EditableText, { value: meta.original_invoice_number, onChange: (v) => setMeta((m) => ({ ...m, original_invoice_number: v })), placeholder: "e.g. INV-2026-0042", className: "font-bold" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-baseline sm:justify-end", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 shrink-0", children: "Original Invoice Date" }),
                  /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.original_invoice_date, onChange: (v) => setMeta((m) => ({ ...m, original_invoice_date: v })), emptyLabel: "optional" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1", children: [
                    "Reason for Credit ",
                    /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
                  ] }),
                  /* @__PURE__ */ jsx(Select, { value: meta.reason, onChange: (v) => setMeta((m) => ({ ...m, reason: v })), options: reasonOptions }),
                  meta.reason === "other" && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
                    EditableText,
                    {
                      value: meta.custom_reason,
                      onChange: (v) => setMeta((m) => ({ ...m, custom_reason: v })),
                      placeholder: "Describe the reason for credit",
                      className: "block text-xs bg-white rounded px-2 py-1 border border-red-200 w-full"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1", children: "Refund / Settlement Method" }),
                  /* @__PURE__ */ jsx(Select, { value: meta.refund_method, onChange: (v) => setMeta((m) => ({ ...m, refund_method: v })), options: refundMethodOptions })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1", children: "Credited To" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.name, onChange: (v) => setClient((c) => ({ ...c, name: v })), placeholder: "Client name", className: "block font-bold" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.address, onChange: (v) => setClient((c) => ({ ...c, address: v })), placeholder: "Client address", as: "textarea", rows: 2, className: "block text-slate-500 text-xs" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.email, onChange: (v) => setClient((c) => ({ ...c, email: v })), placeholder: "Client email (optional)", className: "block text-slate-500 text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("table", { className: "w-full mb-2", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: `text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 ${isClassic ? "border-b-2 border-slate-900" : "border-b border-slate-900"}`, children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 pr-2", children: "Credit Description" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-24", children: "Unit Price" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: "Disc." }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-20", children: "Tax Refund" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2 text-right w-24", children: "Credit Amount" }),
                /* @__PURE__ */ jsx("th", { className: "w-8" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 group", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.description, onChange: (v) => updateItem(idx, "description", v), placeholder: "Item description / reason detail", className: "block" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.quantity, onChange: (v) => updateItem(idx, "quantity", v), className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.unit_price, onChange: (v) => updateItem(idx, "unit_price", v), formatDisplay: fmtMoney, className: "text-right w-16" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "100", value: item.discount_pct, onChange: (v) => updateItem(idx, "discount_pct", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.tax_rate, onChange: (v) => updateItem(idx, "tax_rate", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-right font-bold", children: fmtMoney(lineTotals[idx]?.lineTotal) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-1 text-right", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeItem(idx), disabled: items.length === 1, className: "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity", children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) }) })
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: addItem, disabled: items.length >= maxItems, className: "flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors mb-6", children: [
              /* @__PURE__ */ jsx(Plus, { size: 12 }),
              " Add credit item"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-8", children: /* @__PURE__ */ jsxs("div", { className: "w-56 space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal Credit" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.subtotal) })
              ] }),
              totals.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount Adjustment" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "-",
                  fmtMoney(totals.discount)
                ] })
              ] }),
              totals.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax Refunded" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.tax) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-black text-base pt-1.5 border-t-2 border-slate-900", style: { color: accent }, children: [
                /* @__PURE__ */ jsx("span", { children: "Total Credit" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(grandTotal) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6 text-xs text-slate-500", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Notes" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.notes, onChange: (v) => setMeta((m) => ({ ...m, notes: v })), placeholder: "Add a note (optional)", as: "textarea", rows: 2, className: "block" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Settlement / Credit Terms" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.terms, onChange: (v) => setMeta((m) => ({ ...m, terms: v })), placeholder: "e.g. Credit applied on approval", as: "textarea", rows: 2, className: "block" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] text-slate-300 mt-10", children: "Generated free at venqore.com/tools — no signup, no watermark, no expiry." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: "This preview matches your downloaded PDF exactly — click anything above to edit it." })
      ]
    }
  );
}
export {
  CreditNoteTool as default
};
