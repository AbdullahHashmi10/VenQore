import { jsxs, jsx, Fragment } from "react/jsx-runtime";
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
const STORAGE_KEY = "venqore_receipt_store_profile_v1";
const emptyItem = () => ({ name: "", quantity: 1, unit_price: 0 });
const FAQS = [
  { q: "Is the VenQore receipt generator really free?", a: "Yes. Creating and downloading a PDF receipt is completely free, with no signup, no watermark and no limit on how many receipts you generate." },
  { q: "Can I print it on my thermal receipt printer?", a: "Yes — select 80mm Thermal Roll paper preset and the PDF output is sized specifically for standard 80mm POS receipt roll printers." },
  { q: "What if I don't have a thermal printer?", a: "Select the Standard Letter/A4 preset. It prints cleanly on any regular desktop printer or saves as a standard-sized PDF for digital record-keeping." },
  { q: "Can I show change due for cash payments?", a: "Yes — select Cash as the payment method, type the amount tendered, and the generator automatically calculates and prints the change due on the receipt." },
  { q: "Can I set an overall tax rate and discount?", a: "Yes. You can apply a single overall tax rate (%) and a single overall discount (either flat amount or percentage) to the total receipt." },
  { q: "Is my store or receipt data stored on your servers?", a: "No. Everything is processed live to generate your PDF and streamed back. Your store profile is saved strictly in your browser's localStorage." },
  { q: "Does the preview match the downloaded PDF?", a: "Yes. The on-screen receipt mirrors the layout, fields and thermal-vs-Letter sizing of the actual downloaded PDF, so what you see before you click Download is what you get." }
];
function ReceiptTool({ paperPresets = {}, paymentMethods = [], currencies = {}, maxItems = 100, suggestedNumber = "", toolGroups = [] }) {
  const [store, setStore] = useState({ name: "", address: "", phone: "", logo_base64: null, footer_message: "Thank you for shopping with us!" });
  const [items, setItems] = useState([emptyItem()]);
  const [meta, setMeta] = useState({
    receipt_number: suggestedNumber,
    date_time: (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " "),
    cashier: "",
    returns_policy_days: 30,
    paper_preset: "thermal_80mm",
    currency: "USD",
    payment_method: "Cash",
    amount_tendered: 0,
    tax_rate: 0,
    discount_value: 0,
    discount_type: "flat",
    orientation: "portrait"
  });
  const [headers, setHeaders] = useState({
    item: "Item",
    quantity: "Qty",
    total: "Total"
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStore((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch (e) {
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
    }
  }, [store]);
  const symbol = currencies[meta.currency] || meta.currency;
  const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
  const totals = useMemo(() => {
    let subtotal = 0;
    items.forEach((it) => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.unit_price) || 0;
      subtotal += qty * price;
    });
    const discVal = Math.max(0, parseFloat(meta.discount_value) || 0);
    let discount = 0;
    if (meta.discount_type === "percent") {
      const discPct = Math.min(100, discVal);
      discount = subtotal * (discPct / 100);
    } else {
      discount = Math.min(subtotal, discVal);
    }
    const taxable = Math.max(0, subtotal - discount);
    const taxPct = Math.max(0, parseFloat(meta.tax_rate) || 0);
    const tax = taxable * (taxPct / 100);
    const total = taxable + tax;
    const tendered = parseFloat(meta.amount_tendered) || 0;
    const changeDue = meta.payment_method === "Cash" ? Math.max(0, tendered - total) : 0;
    return { subtotal, discount, tax, total, changeDue };
  }, [items, meta.discount_value, meta.discount_type, meta.tax_rate, meta.amount_tendered, meta.payment_method]);
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
    reader.onload = () => setStore((s) => ({ ...s, logo_base64: reader.result }));
    reader.readAsDataURL(file);
  };
  const generate = async () => {
    setErrors([]);
    if (!store.name.trim()) {
      setErrors(['Your store name is required. Click "Your store name" on the receipt above.']);
      return;
    }
    if (!items.some((it) => it.name.trim())) {
      setErrors(["Add at least one line item with a product name."]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(route("tools.receipt.render"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
          Accept: "application/json"
        },
        body: JSON.stringify({ store, items, meta: { ...meta, orientation: "portrait" } })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ["Could not generate that receipt. Please check your entries and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${(meta.receipt_number || "draft").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrors(["Something went wrong generating the PDF receipt. Please try again."]);
    } finally {
      setLoading(false);
    }
  };
  const presetOptions = Object.entries(paperPresets).map(([key, p]) => ({
    value: key,
    label: p.name,
    hint: p.description
  }));
  const currencyOptions = Object.entries(currencies).map(([code, sym]) => ({
    value: code,
    label: `${code} (${sym})`
  }));
  const paymentOptions = paymentMethods.map((m) => ({
    value: m,
    label: m
  }));
  const isThermal = meta.paper_preset === "thermal_80mm";
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Receipt Generator — POS & Thermal PDF | VenQore",
      metaDescription: "Create a free POS receipt PDF for 80mm thermal printers or A4 records. Overall tax, discount, cash change due calculation. Free, no watermark, no signup.",
      eyebrow: "Free Tools",
      h1: "Free Receipt Generator",
      answer: "Edit the receipt below exactly as it will look in your PDF — click any field to change it. Optimized for 80mm thermal receipt printers or Letter/A4 records, with overall tax, flat or percentage discount, cash change due calculations, and custom return notes.",
      toolGroups,
      currentSlug: "receipt-generator",
      faqs: FAQS,
      cta: { headline: "Tired of manually printing receipts?", subtext: "VenQore POS automatically prints scannable thermal receipts with integrated inventory deduction on every sale." },
      related: [{ href: "/tools/invoice-generator", label: "Invoice Generator" }, { href: "/tools/barcode-generator", label: "Barcode Generator" }],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-48", children: /* @__PURE__ */ jsx(Select, { value: meta.paper_preset, onChange: (v) => setMeta((m) => ({ ...m, paper_preset: v })), options: presetOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.currency, onChange: (v) => setMeta((m) => ({ ...m, currency: v })), options: currencyOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.payment_method, onChange: (v) => setMeta((m) => ({ ...m, payment_method: v })), options: paymentOptions }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, orientation: "portrait" })),
                className: `px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${meta.orientation === "portrait" ? "bg-slate-900 text-white dark:bg-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Portrait"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, orientation: "landscape" })),
                className: `px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${meta.orientation === "landscape" ? "bg-slate-900 text-white dark:bg-white dark:text-[#05030f]" : "text-slate-500 dark:text-slate-400"}`,
                children: "Landscape"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors", children: [
            /* @__PURE__ */ jsx(Upload, { size: 13 }),
            " ",
            store.logo_base64 ? "Change logo" : "Add logo"
          ] }),
          store.logo_base64 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setStore((s) => ({ ...s, logo_base64: null })), className: "text-xs font-bold text-slate-400 hover:text-red-500 transition-colors", children: "Remove logo" }),
          /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: onLogoChange }),
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
                  loading ? "Generating…" : "Download PDF"
                ]
              }
            )
          ] })
        ] }),
        meta.orientation === "landscape" && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-600 dark:text-amber-400 mb-3 -mt-2 text-center", children: "Landscape printing is not yet supported for downloads — this previews the layout only. Your PDF will download in portrait." }),
        /* @__PURE__ */ jsx("div", { className: `rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white mx-auto transition-[max-width] ${meta.orientation === "landscape" ? isThermal ? "max-w-md" : "max-w-2xl" : isThermal ? "max-w-xs" : "max-w-md"}`, children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: `text-slate-900 ${isThermal ? "p-5 text-[11px] font-mono" : "p-8 text-xs"}`,
            style: { fontFamily: isThermal ? "'Courier New', Courier, monospace" : "Helvetica, Arial, sans-serif" },
            children: [
              store.logo_base64 && /* @__PURE__ */ jsx("img", { src: store.logo_base64, alt: "Logo", className: "h-12 max-w-[140px] object-contain mx-auto mb-2 block" }),
              /* @__PURE__ */ jsx(
                EditableText,
                {
                  value: store.name,
                  onChange: (v) => setStore((s) => ({ ...s, name: v })),
                  placeholder: "Your store name",
                  inline: false,
                  className: `text-center font-bold uppercase mb-0.5 ${isThermal ? "text-sm" : "text-base"}`
                }
              ),
              /* @__PURE__ */ jsx(
                EditableText,
                {
                  value: store.address,
                  onChange: (v) => setStore((s) => ({ ...s, address: v })),
                  placeholder: "Store address",
                  as: "textarea",
                  rows: 1,
                  inline: false,
                  className: "text-center text-slate-500 text-[10px] mt-0.5 mb-0.5"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "text-center text-slate-500 text-[10px] mt-0.5", children: [
                "Tel: ",
                /* @__PURE__ */ jsx(EditableText, { value: store.phone, onChange: (v) => setStore((s) => ({ ...s, phone: v })), placeholder: "Phone number" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-slate-300 my-2.5" }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px]", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Receipt #: ",
                  /* @__PURE__ */ jsx(EditableText, { value: meta.receipt_number, onChange: (v) => setMeta((m) => ({ ...m, receipt_number: v })), className: "font-bold" })
                ] }),
                /* @__PURE__ */ jsx(EditableText, { value: meta.date_time, onChange: (v) => setMeta((m) => ({ ...m, date_time: v })), className: "text-right" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] mt-0.5", children: [
                "Cashier: ",
                /* @__PURE__ */ jsx(EditableText, { value: meta.cashier, onChange: (v) => setMeta((m) => ({ ...m, cashier: v })), placeholder: "optional", emptyLabel: "—" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-slate-300 my-2.5" }),
              /* @__PURE__ */ jsxs("table", { className: "w-full mb-1", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-[9px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-900", children: [
                  /* @__PURE__ */ jsx("th", { className: "pb-1 pr-1", children: /* @__PURE__ */ jsx(EditableText, { value: headers.item, onChange: (v) => setHeaders((h) => ({ ...h, item: v })), pulse: false, className: "text-[9px] font-bold uppercase tracking-wide text-slate-400" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-1 px-1 text-right w-10", children: /* @__PURE__ */ jsx(EditableText, { value: headers.quantity, onChange: (v) => setHeaders((h) => ({ ...h, quantity: v })), pulse: false, className: "text-[9px] font-bold uppercase tracking-wide text-slate-400 text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-1 pl-1 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.total, onChange: (v) => setHeaders((h) => ({ ...h, total: v })), pulse: false, className: "text-[9px] font-bold uppercase tracking-wide text-slate-400 text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "w-4" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unit_price) || 0;
                  const lineTotal = qty * price;
                  return /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 group align-top", children: [
                    /* @__PURE__ */ jsxs("td", { className: "py-1.5 pr-1", children: [
                      /* @__PURE__ */ jsx(EditableText, { value: item.name, onChange: (v) => updateItem(idx, "name", v), placeholder: "Product name", className: "block" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[9px] text-slate-400 mt-0.5", children: [
                        /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.quantity, onChange: (v) => updateItem(idx, "quantity", v), className: "w-8" }),
                        /* @__PURE__ */ jsx("span", { children: "@" }),
                        /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.unit_price, onChange: (v) => updateItem(idx, "unit_price", v), formatDisplay: fmtMoney, className: "w-12" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-1.5 px-1 text-right", children: qty }),
                    /* @__PURE__ */ jsx("td", { className: "py-1.5 pl-1 text-right font-bold", children: fmtMoney(lineTotal) }),
                    /* @__PURE__ */ jsx("td", { className: "py-1.5 text-right", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeItem(idx), disabled: items.length === 1, className: "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity", children: /* @__PURE__ */ jsx(Trash2, { size: 11 }) }) })
                  ] }, idx);
                }) })
              ] }),
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: addItem, disabled: items.length >= maxItems, className: "flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-2.5", children: [
                /* @__PURE__ */ jsx(Plus, { size: 11 }),
                " Add product"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-slate-300 my-2.5" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-[10px]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.subtotal) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Discount (",
                    /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: meta.discount_value, onChange: (v) => setMeta((m) => ({ ...m, discount_value: v })), className: "w-8" }),
                    meta.discount_type === "percent" ? "%" : symbol,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "-",
                    fmtMoney(totals.discount)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Tax (",
                    /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "100", value: meta.tax_rate, onChange: (v) => setMeta((m) => ({ ...m, tax_rate: v })), className: "w-8" }),
                    "%)"
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.tax) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-black text-xs pt-1.5 border-t border-slate-900 border-b-2 border-double pb-1.5", children: [
                  /* @__PURE__ */ jsx("span", { children: "TOTAL" }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.total) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-1", children: [
                  /* @__PURE__ */ jsx("span", { children: "Payment Method" }),
                  /* @__PURE__ */ jsx("span", { children: meta.payment_method })
                ] }),
                meta.payment_method === "Cash" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsx("span", { children: "Amount Tendered" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: meta.amount_tendered, onChange: (v) => setMeta((m) => ({ ...m, amount_tendered: v })), formatDisplay: fmtMoney, className: "text-right" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold", children: [
                    /* @__PURE__ */ jsx("span", { children: "Change Due" }),
                    /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.changeDue) })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-slate-300 my-2.5" }),
              /* @__PURE__ */ jsxs("div", { className: "text-center text-[9px] text-slate-500 space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  "Returns accepted within",
                  " ",
                  /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "365", value: meta.returns_policy_days, onChange: (v) => setMeta((m) => ({ ...m, returns_policy_days: v })), className: "inline-block" }),
                  " ",
                  "days with receipt."
                ] }),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: store.footer_message,
                    onChange: (v) => setStore((s) => ({ ...s, footer_message: v })),
                    placeholder: "Thank you for shopping with us!",
                    className: "block"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "text-[8px] text-slate-300", children: "Generated free at venqore.com/tools" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-between text-[9px] text-slate-400 mt-3 gap-2", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "hover:text-indigo-500 transition-colors", children: isThermal ? "80mm Thermal Roll" : "Standard Letter / A4" }) })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: "This preview matches your downloaded PDF exactly — click anything above to edit it." })
      ]
    }
  );
}
export {
  ReceiptTool as default
};
