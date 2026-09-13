import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { AlertCircle, Upload, Loader2, Download, Trash2, Plus } from "lucide-react";
import ToolShell from "./ToolShell-zAP3LLHC.js";
import Select from "./Select-BvHKwZfu.js";
import EditableText from "./EditableText-CAR9rgbH.js";
import SmartCaptureNudge from "./SmartCaptureNudge-VrUccUol.js";
import "@inertiajs/react";
import "./MarketingLayout-cwTDSbNB.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
import "./ToolsSidebar-UoByrcvz.js";
import "./HousePromo-DidRidkH.js";
const STORAGE_KEY = "venqore_invoice_company_profile_v1";
const ACCENT_PRESETS = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed"];
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });
const FAQS = [
  { q: "Is the VenQore invoice generator really free?", a: "Yes. Creating and downloading a PDF invoice is completely free, with no signup, no watermark and no limit on how many invoices you generate." },
  { q: "Can I save my company details for next time?", a: "Yes — your company name, address, logo and tax ID are saved in your browser so you do not have to retype them next time. Nothing is sent to or stored on our servers until you click Download." },
  { q: "Does it support multiple currencies?", a: "Yes — USD, EUR, GBP, CAD, AUD, PKR, INR, AED, SAR and JPY." },
  { q: "Can I add tax and discounts per line item?", a: "Yes. Each line item has its own quantity, unit price, discount percentage and tax rate, so you can mix taxed and untaxed items or discount a single line only." },
  { q: "What invoice templates are available?", a: "Four: Clean (minimal), Modern (accent color band), Classic (bordered table) and Compact (dense layout for invoices with many line items)." },
  { q: "Is my invoice data stored anywhere?", a: "No. The PDF is generated on request and streamed back to you immediately. Nothing about the invoice — company, client or line items — is saved on our servers." },
  { q: "Does the preview look exactly like the PDF I download?", a: "Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing — there are no surprises after download." }
];
function InvoiceTool({ templates = {}, currencies = {}, maxItems = 100, suggestedNumber = "", toolGroups = [] }) {
  const [company, setCompany] = useState({ name: "", address: "", email: "", phone: "", tax_id: "", logo_base64: null });
  const [client, setClient] = useState({ name: "", address: "", email: "" });
  const [items, setItems] = useState([
    { description: "Website design & development", quantity: 1, unit_price: 1200, tax_rate: 0, discount_pct: 0 },
    { description: "Monthly hosting (3 months)", quantity: 3, unit_price: 25, tax_rate: 8, discount_pct: 0 }
  ]);
  const [meta, setMeta] = useState({
    invoice_number: suggestedNumber,
    issue_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    due_date: "",
    currency: "USD",
    notes: "",
    terms: "Payment due within 14 days.",
    template: "clean",
    accent_color: "rgb(var(--vq-indigo-600))",
    orientation: "portrait"
  });
  const [headers, setHeaders] = useState({
    description: "Description",
    quantity: "Qty",
    unit_price: "Unit Price",
    discount: "Disc.",
    tax: "Tax",
    amount: "Amount"
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
  const updateItem = (idx, field, val) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const addItem = () => {
    if (items.length < maxItems) setItems((prev) => [...prev, emptyItem()]);
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
      setErrors(['Your company name is required. Click "Your business name" on the invoice above.']);
      return;
    }
    if (!client.name.trim()) {
      setErrors(['A client name is required. Click "Client name" on the invoice above.']);
      return;
    }
    if (!items.some((it) => it.description.trim())) {
      setErrors(["Add at least one line item with a description."]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(route("tools.invoice.render"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
          Accept: "application/json"
        },
        body: JSON.stringify({ company, client, items, meta: { ...meta, orientation: "portrait" } })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ["Could not generate that invoice. Please check your entries and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${(meta.invoice_number || "draft").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
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
  const templateOptions = Object.entries(templates).map(([key, t]) => ({ value: key, label: t.name, hint: t.description }));
  const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }));
  const accent = meta.template === "modern" ? meta.accent_color : "#0f172a";
  const isModern = meta.template === "modern";
  const isClassic = meta.template === "classic";
  const isCompact = meta.template === "compact";
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Invoice Generator — PDF, No Watermark | VenQore",
      metaDescription: "Create a professional PDF invoice free online. Multiple templates, multi-currency, per-line tax and discounts. No signup, no watermark, unlimited invoices.",
      eyebrow: "Free Tools",
      h1: "Free Invoice Generator",
      answer: "Edit the invoice below exactly as it will look in your PDF — click any field to change it. Four templates, ten currencies, per-line tax and discounts, no signup, no limit on how many you generate.",
      toolGroups,
      currentSlug: "invoice-generator",
      faqs: FAQS,
      cta: {
        headline: "Invoicing is one piece of running a store.",
        subtext: "Describe your business and VenQore builds a system where issuing an invoice is one step of a posting that already balances."
      },
      related: [{ href: "/tools/barcode-generator", label: "Barcode Generator" }],
      wide: true,
      children: [
        /* @__PURE__ */ jsx(SmartCaptureNudge, { documentType: "invoice" }),
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 vq-tool-panel", children: [
          /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(Select, { value: meta.template, onChange: (v) => setMeta((m) => ({ ...m, template: v })), options: templateOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.currency, onChange: (v) => setMeta((m) => ({ ...m, currency: v })), options: currencyOptions }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-1 rounded-xl vq-tool-inset", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, orientation: "portrait" })),
                className: `px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === "portrait" ? "bg-accent-fill text-accent-on" : "text-ink-muted"}`,
                children: "Portrait"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, orientation: "landscape" })),
                className: `px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === "landscape" ? "bg-accent-fill text-accent-on" : "text-ink-muted"}`,
                children: "Landscape"
              }
            )
          ] }),
          isModern && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: ACCENT_PRESETS.map((c) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setMeta((m) => ({ ...m, accent_color: c })),
              className: `w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? "scale-110 border-neutral-900 dark:border-white" : "border-transparent"}`,
              style: { background: c },
              "aria-label": c
            },
            c
          )) }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "flex items-center gap-1.5 px-3 py-2 rounded-xl vq-tool-inset text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors", children: [
            /* @__PURE__ */ jsx(Upload, { size: 13 }),
            " ",
            company.logo_base64 ? "Change logo" : "Add logo"
          ] }),
          company.logo_base64 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCompany((c) => ({ ...c, logo_base64: null })), className: "text-xs font-bold text-ink-muted hover:text-red-500 transition-colors", children: "Remove logo" }),
          /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: onLogoChange }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-1xs text-ink-muted hidden sm:inline", children: "Saved in your browser — nothing sent until you download" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: generate,
                disabled: loading,
                className: "vq-btn vq-btn--primary",
                children: [
                  loading ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Download, { size: 14 }),
                  loading ? "Generating…" : "Download PDF"
                ]
              }
            )
          ] })
        ] }),
        meta.orientation === "landscape" && /* @__PURE__ */ jsx("p", { className: "text-1xs text-amber-600 dark:text-amber-400 mb-3 -mt-2", children: "Landscape printing is not yet supported for downloads — this previews the layout only. Your PDF will download in portrait." }),
        /* @__PURE__ */ jsxs("div", { className: `vq-paper rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line bg-white mx-auto transition-[max-width] ${meta.orientation === "landscape" ? "max-w-4xl" : "max-w-2xl"}`, children: [
          isModern && /* @__PURE__ */ jsx("div", { className: "h-3 w-full", style: { background: accent } }),
          /* @__PURE__ */ jsxs("div", { className: `p-6 sm:p-10 text-ink ${isCompact ? "text-[13px]" : "text-sm"}`, style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? "border-b-2 border-neutral-900 pb-4" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                company.logo_base64 && /* @__PURE__ */ jsx("img", { src: company.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: company.name,
                    onChange: (v) => setCompany((c) => ({ ...c, name: v })),
                    placeholder: "Your business name",
                    inline: false,
                    className: "text-lg font-bold mb-0.5"
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
                    inline: false,
                    className: "text-ink-muted text-xs mt-1 mb-0.5 max-w-xs"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 text-xs text-ink-muted mt-1", children: [
                  /* @__PURE__ */ jsx(EditableText, { value: company.email, onChange: (v) => setCompany((c) => ({ ...c, email: v })), placeholder: "email@business.com" }),
                  /* @__PURE__ */ jsx(EditableText, { value: company.phone, onChange: (v) => setCompany((c) => ({ ...c, phone: v })), placeholder: "Phone number" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted mt-0.5", children: [
                  "Tax ID: ",
                  /* @__PURE__ */ jsx(EditableText, { value: company.tax_id, onChange: (v) => setCompany((c) => ({ ...c, tax_id: v })), placeholder: "optional" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tracking-tight", style: { color: isModern ? accent : "rgb(var(--vq-slate-900))" }, children: "INVOICE" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs space-y-0.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Invoice #" }),
                    /* @__PURE__ */ jsx(EditableText, { value: meta.invoice_number, onChange: (v) => setMeta((m) => ({ ...m, invoice_number: v })), className: "font-bold" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Issue date" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.issue_date, onChange: (v) => setMeta((m) => ({ ...m, issue_date: v })) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Due date" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.due_date, onChange: (v) => setMeta((m) => ({ ...m, due_date: v })), emptyLabel: "—" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1", children: "Bill To" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.name, onChange: (v) => setClient((c) => ({ ...c, name: v })), placeholder: "Client name", inline: false, className: "font-bold mb-0.5" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.address, onChange: (v) => setClient((c) => ({ ...c, address: v })), placeholder: "Client address", as: "textarea", rows: 2, inline: false, className: "text-ink-muted text-xs mb-0.5" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.email, onChange: (v) => setClient((c) => ({ ...c, email: v })), placeholder: "Client email (optional)", inline: false, className: "text-ink-muted text-xs" })
            ] }),
            /* @__PURE__ */ jsxs("table", { className: "w-full mb-2", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: `text-left text-2xs font-bold uppercase tracking-wide text-ink-muted ${isClassic ? "border-b-2 border-neutral-900" : "border-b border-neutral-900"}`, children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: headers.description, onChange: (v) => setHeaders((h) => ({ ...h, description: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted" }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.quantity, onChange: (v) => setHeaders((h) => ({ ...h, quantity: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.unit_price, onChange: (v) => setHeaders((h) => ({ ...h, unit_price: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.discount, onChange: (v) => setHeaders((h) => ({ ...h, discount: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.tax, onChange: (v) => setHeaders((h) => ({ ...h, tax: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.amount, onChange: (v) => setHeaders((h) => ({ ...h, amount: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                /* @__PURE__ */ jsx("th", { className: "w-8" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-line group", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.description, onChange: (v) => updateItem(idx, "description", v), placeholder: "Item description", className: "block" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.quantity, onChange: (v) => updateItem(idx, "quantity", v), className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.unit_price, onChange: (v) => updateItem(idx, "unit_price", v), formatDisplay: fmtMoney, className: "text-right w-16" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "100", value: item.discount_pct, onChange: (v) => updateItem(idx, "discount_pct", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.tax_rate, onChange: (v) => updateItem(idx, "tax_rate", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-right font-bold", children: fmtMoney(lineTotals[idx]?.lineTotal) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-1 text-right", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeItem(idx), disabled: items.length === 1, className: "opacity-0 group-hover:opacity-100 text-ink-secondary hover:text-red-500 disabled:opacity-0 transition-opacity", children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) }) })
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: addItem, disabled: items.length >= maxItems, className: "flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-brand-500 disabled:opacity-40 transition-colors mb-6", children: [
              /* @__PURE__ */ jsx(Plus, { size: 12 }),
              " Add line item"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-8", children: /* @__PURE__ */ jsxs("div", { className: "w-56 space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.subtotal) })
              ] }),
              totals.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "-",
                  fmtMoney(totals.discount)
                ] })
              ] }),
              totals.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.tax) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-base pt-1.5 border-t-2 border-neutral-900", style: { color: isModern ? accent : "rgb(var(--vq-slate-900))" }, children: [
                /* @__PURE__ */ jsx("span", { children: "Total Due" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(grandTotal) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6 text-xs text-ink-muted", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary mb-1", children: "Notes" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.notes, onChange: (v) => setMeta((m) => ({ ...m, notes: v })), placeholder: "Add a note (optional)", as: "textarea", rows: 2, className: "block" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary mb-1", children: "Payment Terms" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.terms, onChange: (v) => setMeta((m) => ({ ...m, terms: v })), placeholder: "e.g. Net 14", as: "textarea", rows: 2, className: "block" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-center text-2xs text-ink-secondary mt-10", children: "Generated free at venqore.com/tools — no signup, no watermark, no expiry." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-ink-muted mt-4", children: "This preview matches your downloaded PDF exactly — click anything above to edit it." })
      ]
    }
  );
}
export {
  InvoiceTool as default
};
