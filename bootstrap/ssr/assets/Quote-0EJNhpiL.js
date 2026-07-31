import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { AlertCircle, Upload, Loader2, Download, Trash2, Plus } from "lucide-react";
import ToolShell from "./ToolShell-BDFk9CqZ.js";
import Select from "./Select-BFX9Hz_h.js";
import EditableText from "./EditableText-nKR5JR6h.js";
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
const STORAGE_KEY = "venqore_quote_business_profile_v1";
const ACCENT_PRESETS = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed"];
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });
const addDays = (dateStr, days) => {
  const d = dateStr ? new Date(dateStr) : /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + (parseInt(days, 10) || 0));
  return d.toISOString().slice(0, 10);
};
const FAQS = [
  { q: "Is the VenQore quotation generator really free?", a: "Yes. Creating and downloading a PDF quotation or estimate is completely free, with no signup, no watermark and no limit on how many you generate." },
  { q: "Is a quote legally binding?", a: 'Generally no, not on its own — a quotation is an offer, not a contract. It typically only becomes binding once the client formally accepts it (signature, purchase order, or written confirmation) and, in many jurisdictions, work begins or a deposit is paid. That is exactly why this tool includes a "Valid Until" date and an acceptance/signature section — it makes clear when the offer expires and gives the client a place to confirm.' },
  { q: "How long should a quote be valid?", a: "Most small businesses use 14–30 days. Material and labor costs can shift, so an open-ended quote exposes you to honoring old pricing indefinitely. This tool defaults to 30 days from the issue date but you can set any validity period per quote." },
  { q: "What is the difference between a quote, an estimate, and an invoice?", a: "A quote is a fixed, firm price offered before work starts. An estimate is a rough, non-binding approximation that may change once the full scope is known. An invoice is issued after (or during) the work to request payment for what was actually delivered. This tool lets you label the same document as either QUOTATION or ESTIMATE depending on how firm your pricing is." },
  { q: "Can I show a discount to help win the deal?", a: "Yes — each line item has its own discount percentage in addition to quantity, unit price and tax rate, so you can show a client exactly how much you knocked off to win their business." },
  { q: "Can I list what is included and excluded?", a: "Yes — optional Scope of Work / Inclusions and Exclusions sections let you set expectations up front, which is especially useful for service businesses (contractors, agencies, consultants) where scope creep is a real risk." },
  { q: "Is my quotation data stored anywhere?", a: "No. The PDF is generated on request and streamed back to you immediately. Nothing about the quotation — company, client, or line items — is saved on our servers." },
  { q: "Does the preview match the downloaded PDF?", a: "Yes. What you see on screen is built to match the downloaded PDF layout, font and spacing exactly — including the valid-until date, scope/exclusions sections and the acceptance block — so there are no surprises after download." }
];
function QuotationTool({ templates = {}, currencies = {}, maxItems = 100, defaultValidityDays = 30, suggestedNumber = "", toolGroups = [] }) {
  const [company, setCompany] = useState({ name: "", address: "", email: "", phone: "", tax_id: "", logo_base64: null });
  const [client, setClient] = useState({ name: "", address: "", email: "" });
  const [items, setItems] = useState([
    { description: "Design & consultation", quantity: 1, unit_price: 450, tax_rate: 0, discount_pct: 0 },
    { description: "Installation (per unit)", quantity: 4, unit_price: 120, tax_rate: 8, discount_pct: 0 }
  ]);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [meta, setMeta] = useState({
    quote_number: suggestedNumber,
    document_label: "QUOTATION",
    issue_date: todayStr,
    validity_days: defaultValidityDays,
    valid_until: addDays(todayStr, defaultValidityDays),
    currency: "USD",
    notes: "",
    scope_of_work: "",
    exclusions: "",
    template: "clean",
    accent_color: "#4f46e5"
  });
  const [validUntilTouched, setValidUntilTouched] = useState(false);
  const [headers, setHeaders] = useState({
    description: "Description",
    qty: "Qty",
    unit_price: "Unit Price",
    discount: "Disc.",
    tax: "Tax",
    amount: "Amount"
  });
  const [orientation, setOrientation] = useState("portrait");
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
  useEffect(() => {
    if (validUntilTouched) return;
    setMeta((m) => ({ ...m, valid_until: addDays(m.issue_date, m.validity_days) }));
  }, [meta.issue_date, meta.validity_days, validUntilTouched]);
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
      setErrors(['Your company name is required. Click "Your business name" on the quote above.']);
      return;
    }
    if (!client.name.trim()) {
      setErrors(['A client name is required. Click "Client name" on the quote above.']);
      return;
    }
    if (!items.some((it) => it.description.trim())) {
      setErrors(["Add at least one line item with a description."]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(route("tools.quote.render"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
          Accept: "application/json"
        },
        body: JSON.stringify({ company, client, items, meta, headers, orientation })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ["Could not generate that quotation. Please check your entries and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${(meta.quote_number || "draft").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
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
  const isEstimate = meta.document_label === "ESTIMATE";
  const docWord = isEstimate ? "Estimate" : "Quote";
  const accent = meta.template === "modern" ? meta.accent_color : "#0f172a";
  const isModern = meta.template === "modern";
  const isClassic = meta.template === "classic";
  const isCompact = meta.template === "compact";
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Quotation Generator — PDF Quotes & Estimates, No Watermark | VenQore",
      metaDescription: "Create a professional PDF quotation or estimate free online. Valid-until expiry dates, scope of work, exclusions, per-line tax and discounts. No signup, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Quotation Generator",
      answer: "Edit the quote below exactly as it will look in your PDF — click any field to change it. Automatic valid-until expiry, optional scope-of-work and exclusions sections, and a client acceptance/signature block. No signup, no limit on how many you generate.",
      toolGroups,
      currentSlug: "quote-generator",
      faqs: FAQS,
      cta: { headline: "Winning the quote is only step one.", subtext: "VenQore turns an accepted quote straight into a sale, with inventory and double-entry accounting handled automatically." },
      related: [{ href: "/tools/invoice-generator", label: "Invoice Generator" }, { href: "/tools/purchase-order-generator", label: "Purchase Order Generator" }],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 p-0.5 text-xs font-bold", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, document_label: "QUOTATION" })),
                className: `px-3 py-1.5 rounded-lg transition-colors ${!isEstimate ? "bg-slate-900 dark:bg-white text-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Quotation"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, document_label: "ESTIMATE" })),
                className: `px-3 py-1.5 rounded-lg transition-colors ${isEstimate ? "bg-slate-900 dark:bg-white text-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Estimate"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(Select, { value: meta.template, onChange: (v) => setMeta((m) => ({ ...m, template: v })), options: templateOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.currency, onChange: (v) => setMeta((m) => ({ ...m, currency: v })), options: currencyOptions }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 dark:text-slate-400", children: "Valid for" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                max: "3650",
                value: meta.validity_days,
                onChange: (e) => {
                  setValidUntilTouched(false);
                  setMeta((m) => ({ ...m, validity_days: e.target.value }));
                },
                className: "w-16 px-2 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-400/60 transition-colors"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 dark:text-slate-600", children: "days" })
          ] }),
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
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors", children: [
            /* @__PURE__ */ jsx(Upload, { size: 13 }),
            " ",
            company.logo_base64 ? "Change logo" : "Add logo"
          ] }),
          company.logo_base64 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCompany((c) => ({ ...c, logo_base64: null })), className: "text-xs font-bold text-slate-400 hover:text-red-500 transition-colors", children: "Remove logo" }),
          /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: onLogoChange }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 p-0.5 text-xs font-bold", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setOrientation("portrait"),
                className: `px-3 py-1.5 rounded-lg transition-colors ${orientation === "portrait" ? "bg-slate-900 dark:bg-white text-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Portrait"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setOrientation("landscape"),
                className: `px-3 py-1.5 rounded-lg transition-colors ${orientation === "landscape" ? "bg-slate-900 dark:bg-white text-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Landscape"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline", children: "Saved in your browser — nothing sent until you download" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: generate,
                disabled: loading,
                className: "flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100",
                children: [
                  loading ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Download, { size: 14 }),
                  loading ? "Generating…" : `Download PDF`
                ]
              }
            )
          ] })
        ] }),
        orientation === "landscape" && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 dark:text-amber-400 mb-2", children: "Landscape printing is not yet supported for downloads — this previews the layout only." }),
        /* @__PURE__ */ jsxs("div", { className: `rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white transition-all ${orientation === "landscape" ? "max-w-none" : ""}`, children: [
          isModern && /* @__PURE__ */ jsx("div", { className: "h-3 w-full", style: { background: accent } }),
          /* @__PURE__ */ jsxs("div", { className: `p-6 sm:p-10 text-slate-900 ${isCompact ? "text-[13px]" : "text-sm"}`, style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? "border-b-2 border-slate-900 pb-4" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                company.logo_base64 && /* @__PURE__ */ jsx("img", { src: company.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: company.name,
                    onChange: (v) => setCompany((c) => ({ ...c, name: v })),
                    placeholder: "Your business name",
                    className: "block text-lg font-bold",
                    inline: false
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
                    className: "block text-slate-500 text-xs mt-1 max-w-xs",
                    inline: false
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-0.5 text-xs text-slate-500 mt-1", children: [
                  /* @__PURE__ */ jsx(EditableText, { value: company.email, onChange: (v) => setCompany((c) => ({ ...c, email: v })), placeholder: "email@business.com", inline: false }),
                  /* @__PURE__ */ jsx(EditableText, { value: company.phone, onChange: (v) => setCompany((c) => ({ ...c, phone: v })), placeholder: "Phone number", inline: false })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-0.5", children: [
                  "Tax ID: ",
                  /* @__PURE__ */ jsx(EditableText, { value: company.tax_id, onChange: (v) => setCompany((c) => ({ ...c, tax_id: v })), placeholder: "optional" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-black tracking-tight", style: { color: isModern ? accent : "#0f172a" }, children: meta.document_label }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs space-y-0.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                      docWord,
                      " #"
                    ] }),
                    /* @__PURE__ */ jsx(EditableText, { value: meta.quote_number, onChange: (v) => setMeta((m) => ({ ...m, quote_number: v })), className: "font-bold" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Issue date" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.issue_date, onChange: (v) => setMeta((m) => ({ ...m, issue_date: v })) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Valid until" }),
                    /* @__PURE__ */ jsx(
                      EditableText,
                      {
                        as: "date",
                        value: meta.valid_until,
                        onChange: (v) => {
                          setValidUntilTouched(true);
                          setMeta((m) => ({ ...m, valid_until: v }));
                        },
                        className: "font-bold",
                        formatDisplay: (v) => v
                      }
                    )
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1", children: "Prepared For" }),
              /* @__PURE__ */ jsx(EditableText, { value: client.name, onChange: (v) => setClient((c) => ({ ...c, name: v })), placeholder: "Client name", className: "block font-bold", inline: false }),
              /* @__PURE__ */ jsx(EditableText, { value: client.address, onChange: (v) => setClient((c) => ({ ...c, address: v })), placeholder: "Client address", as: "textarea", rows: 2, className: "block text-slate-500 text-xs mt-0.5", inline: false }),
              /* @__PURE__ */ jsx(EditableText, { value: client.email, onChange: (v) => setClient((c) => ({ ...c, email: v })), placeholder: "Client email (optional)", className: "block text-slate-500 text-xs mt-0.5", inline: false })
            ] }),
            /* @__PURE__ */ jsxs("table", { className: "w-full mb-2", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: `text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 ${isClassic ? "border-b-2 border-slate-900" : "border-b border-slate-900"}`, children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: headers.description, onChange: (v) => setHeaders((h) => ({ ...h, description: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.qty, onChange: (v) => setHeaders((h) => ({ ...h, qty: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.unit_price, onChange: (v) => setHeaders((h) => ({ ...h, unit_price: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.discount, onChange: (v) => setHeaders((h) => ({ ...h, discount: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.tax, onChange: (v) => setHeaders((h) => ({ ...h, tax: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.amount, onChange: (v) => setHeaders((h) => ({ ...h, amount: v })), className: "text-[10px] font-bold uppercase tracking-wide text-slate-400 text-right", pulse: false }) }),
                /* @__PURE__ */ jsx("th", { className: "w-8" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 group", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.description, onChange: (v) => updateItem(idx, "description", v), placeholder: "Item description", className: "block" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.quantity, onChange: (v) => updateItem(idx, "quantity", v), className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.unit_price, onChange: (v) => updateItem(idx, "unit_price", v), formatDisplay: fmtMoney, className: "text-right w-16" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "100", value: item.discount_pct, onChange: (v) => updateItem(idx, "discount_pct", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.tax_rate, onChange: (v) => updateItem(idx, "tax_rate", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-right font-bold", children: fmtMoney(lineTotals[idx]?.lineTotal) }),
                /* @__PURE__ */ jsx("td", { className: "py-2 pl-1 text-right", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeItem(idx), disabled: items.length === 1, className: "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity", children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) }) })
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: addItem, disabled: items.length >= maxItems, className: "flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-6", children: [
              /* @__PURE__ */ jsx(Plus, { size: 12 }),
              " Add line item"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-8", children: /* @__PURE__ */ jsxs("div", { className: "w-56 space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.subtotal) })
              ] }),
              totals.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Discount" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "-",
                  fmtMoney(totals.discount)
                ] })
              ] }),
              totals.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Tax" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.tax) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-black text-base pt-1.5 border-t-2 border-slate-900", style: { color: isModern ? accent : "#0f172a" }, children: [
                /* @__PURE__ */ jsx("span", { children: "Total" }),
                /* @__PURE__ */ jsx("span", { children: fmtMoney(grandTotal) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6 text-xs text-slate-500 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Scope of Work / Inclusions" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.scope_of_work, onChange: (v) => setMeta((m) => ({ ...m, scope_of_work: v })), placeholder: "Add scope of work (optional)", as: "textarea", rows: 3, className: "block" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Exclusions" }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.exclusions, onChange: (v) => setMeta((m) => ({ ...m, exclusions: v })), placeholder: "Add exclusions (optional)", as: "textarea", rows: 3, className: "block" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mb-6", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Notes" }),
              /* @__PURE__ */ jsx(EditableText, { value: meta.notes, onChange: (v) => setMeta((m) => ({ ...m, notes: v })), placeholder: "Add a note (optional)", as: "textarea", rows: 2, className: "block" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-10 pt-5 border-t border-slate-200", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-500 mb-8", children: [
                "To accept this ",
                isEstimate ? "estimate" : "quotation",
                ", please sign below or reply confirming acceptance. This ",
                isEstimate ? "estimate" : "quotation",
                " is valid until ",
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700", children: meta.valid_until || "—" }),
                "."
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsx("div", { className: "pt-10 border-t border-slate-900 text-[11px] text-slate-500", children: "Signature" }),
                /* @__PURE__ */ jsx("div", { className: "pt-10 border-t border-slate-900 text-[11px] text-slate-500", children: "Date" })
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
  QuotationTool as default
};
