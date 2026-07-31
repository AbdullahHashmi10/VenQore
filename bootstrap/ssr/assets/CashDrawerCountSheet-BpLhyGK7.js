import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { AlertCircle, Minus, Plus, Upload, Loader2, Download, Layers } from "lucide-react";
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
const STORAGE_KEY = "venqore_cashdrawer_profile_v1";
const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "CAD", label: "CAD — Canadian Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar ($)" }
];
const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$" };
const DENOMINATIONS = {
  USD: [
    { label: "Pennies", value: 0.01 },
    { label: "Nickels", value: 0.05 },
    { label: "Dimes", value: 0.1 },
    { label: "Quarters", value: 0.25 },
    { label: "$1 Coin", value: 1 },
    { label: "$1 Bill", value: 1 },
    { label: "$5 Bill", value: 5 },
    { label: "$10 Bill", value: 10 },
    { label: "$20 Bill", value: 20 },
    { label: "$50 Bill", value: 50 },
    { label: "$100 Bill", value: 100 }
  ],
  CAD: [
    { label: "Pennies (legacy, if used)", value: 0.01 },
    { label: "Nickels", value: 0.05 },
    { label: "Dimes", value: 0.1 },
    { label: "Quarters", value: 0.25 },
    { label: "$1 Coin (Loonie)", value: 1 },
    { label: "$2 Coin (Toonie)", value: 2 },
    { label: "$5 Bill", value: 5 },
    { label: "$10 Bill", value: 10 },
    { label: "$20 Bill", value: 20 },
    { label: "$50 Bill", value: 50 },
    { label: "$100 Bill", value: 100 }
  ],
  EUR: [
    { label: "1 Cent", value: 0.01 },
    { label: "2 Cent", value: 0.02 },
    { label: "5 Cent", value: 0.05 },
    { label: "10 Cent", value: 0.1 },
    { label: "20 Cent", value: 0.2 },
    { label: "50 Cent", value: 0.5 },
    { label: "€1 Coin", value: 1 },
    { label: "€2 Coin", value: 2 },
    { label: "€5 Note", value: 5 },
    { label: "€10 Note", value: 10 },
    { label: "€20 Note", value: 20 },
    { label: "€50 Note", value: 50 },
    { label: "€100 Note", value: 100 },
    { label: "€200 Note", value: 200 },
    { label: "€500 Note (rare, being phased out)", value: 500 }
  ],
  GBP: [
    { label: "1p", value: 0.01 },
    { label: "2p", value: 0.02 },
    { label: "5p", value: 0.05 },
    { label: "10p", value: 0.1 },
    { label: "20p", value: 0.2 },
    { label: "50p", value: 0.5 },
    { label: "£1 Coin", value: 1 },
    { label: "£2 Coin", value: 2 },
    { label: "£5 Note", value: 5 },
    { label: "£10 Note", value: 10 },
    { label: "£20 Note", value: 20 },
    { label: "£50 Note", value: 50 }
  ],
  // AUD: generic fallback (matches backend) — no verified denomination list.
  AUD: null
};
const emptyRegister = (idx) => ({
  name: `Register ${idx + 1}`,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  shift: "Morning",
  counted_by: "",
  verified_by: ""
});
const fmtValue = (symbol, v) => `${symbol}${(Math.round(v * 100) / 100).toString().replace(/\.?0+$/, "") || "0"}`;
const FAQS = [
  { q: "What is a cash drawer count sheet?", a: "A cash drawer count sheet is a printable form used to physically count the cash in a till or register at the end of a shift, broken down by denomination (bills and coins). Staff write in how many of each denomination they counted, then compare the total against the amount the POS expected." },
  { q: "How do I calculate over/short?", a: 'Over/Short = Total Counted − Expected Amount. If the result is positive, the drawer has more cash than expected ("over"). If negative, it has less ("short"). This sheet leaves both figures blank for staff to fill in by hand after counting, with the formula printed as a reminder.' },
  { q: "Should I count the drawer before or after the shift?", a: "Both, ideally. Count and record the starting float before the shift begins, then count again at the end of the shift and compare against expected sales plus the starting float. At minimum, count at every shift change so variances are caught early and tied to a specific shift and cashier." },
  { q: "Why does till reconciliation matter?", a: "Regular till counts catch cashier errors (wrong change given), till float mistakes, and theft early — before small discrepancies compound into large, hard-to-trace losses. It also creates accountability: each count is signed by the person who counted and, ideally, verified by a manager." },
  { q: "What counts as an acceptable variance?", a: "This varies by business, but most retailers set an internal threshold (for example, a dollar or two) below which a variance is treated as normal human error and simply logged. Larger or repeated variances usually trigger a review. Set a policy that fits your risk tolerance and cash volume — this is general guidance, not a legal or accounting standard." },
  { q: "Does the preview match the printed sheet?", a: "The layout, header, denomination table and sign-off sections match the downloaded PDF exactly. The denomination Count and Subtotal cells, and the Expected/Counted/Over-Short lines, are intentionally left blank in both the preview and the PDF — they are meant to be filled in by hand during an actual till count, not typed in ahead of time." },
  { q: "Is this tool free?", a: "Yes. Generating and downloading the PDF is completely free, with no signup and no watermark." }
];
function BlankCell({ className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `border-b border-dotted border-slate-300 h-5 ${className}`, "aria-hidden": "true" });
}
function CashDrawerCountSheetTool({ minRegisters = 1, maxRegisters = 10, currencies = ["USD", "EUR", "GBP", "CAD", "AUD"], toolGroups = [] }) {
  const [store, setStore] = useState({ name: "", logo_base64: null });
  const [currency, setCurrency] = useState("USD");
  const [registers, setRegisters] = useState([emptyRegister(0)]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.store) setStore((s) => ({ ...s, ...parsed.store }));
        if (parsed.currency) setCurrency(parsed.currency);
      }
    } catch (e) {
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ store, currency }));
    } catch (e) {
    }
  }, [store, currency]);
  const updateRegister = (idx, field, val) => {
    setRegisters((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };
  const setRegisterCount = (count) => {
    count = Math.max(minRegisters, Math.min(maxRegisters, count));
    setRegisters((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(emptyRegister(next.length));
      while (next.length > count) next.pop();
      return next;
    });
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setErrors(["Logo file must be smaller than 1.5MB."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setStore((s) => ({ ...s, logo_base64: reader.result }));
    reader.readAsDataURL(file);
  };
  const handleGenerate = async () => {
    setErrors([]);
    if (!store.name.trim()) {
      setErrors(['Store name is required. Click "Your store name" on the sheet above.']);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/tools/cash-drawer-count-sheet/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/pdf, application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || ""
        },
        body: JSON.stringify({
          store,
          meta: {
            currency,
            register_count: registers.length,
            registers,
            notes
          }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors(data.errors || ["Failed to generate Cash Drawer Count Sheet. Check fields and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cash-drawer-count-sheet-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrors(["Network error. Please try again."]);
    } finally {
      setLoading(false);
    }
  };
  const currencyOptions = CURRENCY_OPTIONS.filter((o) => currencies.includes(o.value));
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const denominations = DENOMINATIONS[currency] || null;
  const extraCount = registers.length - 1;
  const primary = registers[0];
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Cash Drawer Count Sheet Generator — PDF, No Watermark | VenQore",
      metaDescription: "Generate a printable end-of-shift till reconciliation sheet with denomination rows for physical cash counts, plus an Expected vs Counted over/short section. Free, no signup, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Cash Drawer Count Sheet Generator",
      answer: "Edit the header fields directly on the sheet below exactly as they'll appear in your PDF. Denomination Count/Subtotal cells and the Expected/Counted/Over-Short lines stay blank on purpose — they're filled in by hand during the real till count.",
      toolGroups,
      currentSlug: "cash-drawer-count-sheet",
      faqs: FAQS,
      cta: { headline: "Till counts are one piece of running a store.", subtext: "VenQore ties every register close to real inventory and accounting — automatically, every shift." },
      related: [{ href: "/tools/stock-count-sheet", label: "Stock Count Sheet" }],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-44", children: /* @__PURE__ */ jsx(Select, { value: currency, onChange: setCurrency, options: currencyOptions }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400", children: "Registers" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setRegisterCount(registers.length - 1),
                disabled: registers.length <= minRegisters,
                className: "w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-indigo-400/40 transition-colors",
                children: /* @__PURE__ */ jsx(Minus, { size: 13 })
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400 w-14 text-center", children: [
              registers.length,
              " of ",
              maxRegisters
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setRegisterCount(registers.length + 1),
                disabled: registers.length >= maxRegisters,
                className: "w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-indigo-400/40 transition-colors",
                children: /* @__PURE__ */ jsx(Plus, { size: 13 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => logoInputRef.current?.click(), className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors", children: [
            /* @__PURE__ */ jsx(Upload, { size: 13 }),
            " ",
            store.logo_base64 ? "Change logo" : "Add logo"
          ] }),
          store.logo_base64 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setStore((s) => ({ ...s, logo_base64: null })), className: "text-xs font-bold text-slate-400 hover:text-red-500 transition-colors", children: "Remove logo" }),
          /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleLogoUpload }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline", children: "Saved in your browser — nothing sent until you download" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleGenerate,
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
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-10 text-slate-900 text-sm", style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between gap-6 mb-8 border-b-2 border-slate-900 pb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              store.logo_base64 && /* @__PURE__ */ jsx("img", { src: store.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
              /* @__PURE__ */ jsx(
                EditableText,
                {
                  value: store.name,
                  onChange: (v) => setStore((s) => ({ ...s, name: v })),
                  placeholder: "Your store name",
                  className: "block text-lg font-bold"
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                "Currency: ",
                currency,
                " (",
                symbol,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-black tracking-tight text-slate-900", children: "CASH DRAWER COUNT SHEET" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "End-of-Shift Till Reconciliation" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            RegisterSection,
            {
              register: primary,
              onChange: (field, val) => updateRegister(0, field, val),
              symbol,
              denominations,
              first: true
            }
          ),
          extraCount > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-slate-600", children: [
              /* @__PURE__ */ jsx(Layers, { size: 15 }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold uppercase tracking-wide", children: [
                extraCount,
                " more identical register section",
                extraCount === 1 ? "" : "s",
                " will be included in the PDF"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 mb-3", children: [
              "Each repeats the same ",
              currency,
              " denomination table and blank Expected/Counted/Over-Short lines shown above, with its own header fields. Edit each register's name, date, shift, counted-by and verified-by below — the full denomination table isn't repeated here to keep this preview readable."
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: registers.slice(1).map((r, i) => {
              const idx = i + 1;
              return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2 items-center bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs", children: [
                /* @__PURE__ */ jsx(EditableText, { value: r.name, onChange: (v) => updateRegister(idx, "name", v), placeholder: `Register ${idx + 1}`, className: "font-bold" }),
                /* @__PURE__ */ jsx(EditableText, { as: "date", value: r.date, onChange: (v) => updateRegister(idx, "date", v) }),
                /* @__PURE__ */ jsx(EditableText, { value: r.shift, onChange: (v) => updateRegister(idx, "shift", v), placeholder: "Shift" }),
                /* @__PURE__ */ jsx(EditableText, { value: r.counted_by, onChange: (v) => updateRegister(idx, "counted_by", v), placeholder: "Counted by", emptyLabel: "Counted by" }),
                /* @__PURE__ */ jsx(EditableText, { value: r.verified_by, onChange: (v) => updateRegister(idx, "verified_by", v), placeholder: "Verified by", emptyLabel: "Verified by" })
              ] }, idx);
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-700 mb-1", children: "Notes / Discrepancy Explanation" }),
            /* @__PURE__ */ jsx(EditableText, { value: notes, onChange: setNotes, placeholder: "Add a note (optional — the printed sheet always includes blank lines here too)", as: "textarea", rows: 2, className: "block text-xs text-slate-500" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-2", children: [
              /* @__PURE__ */ jsx(BlankCell, {}),
              /* @__PURE__ */ jsx(BlankCell, {})
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] text-slate-300 mt-10", children: "Generated free at venqore.com/tools — no signup, no watermark, no expiry." })
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: "Denomination Count/Subtotal and Expected/Counted/Over-Short cells stay blank by design — click any other field above to edit it." })
      ]
    }
  );
}
function RegisterSection({ register, onChange, symbol, denominations, first }) {
  return /* @__PURE__ */ jsxs("div", { className: first ? "" : "mt-8 pt-6 border-t border-slate-200", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-slate-100 border border-slate-300 px-3 py-2 mb-2", children: /* @__PURE__ */ jsx(EditableText, { value: register.name, onChange: (v) => onChange("name", v), placeholder: "Register 1", className: "text-sm font-bold" }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border border-slate-200 px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 w-24 shrink-0", children: "Date" }),
        /* @__PURE__ */ jsx(EditableText, { as: "date", value: register.date, onChange: (v) => onChange("date", v), className: "flex-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border border-slate-200 px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 w-24 shrink-0", children: "Shift" }),
        /* @__PURE__ */ jsx(EditableText, { value: register.shift, onChange: (v) => onChange("shift", v), placeholder: "Morning", className: "flex-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border border-slate-200 px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 w-24 shrink-0", children: "Counted By" }),
        /* @__PURE__ */ jsx(EditableText, { value: register.counted_by, onChange: (v) => onChange("counted_by", v), placeholder: "Cashier name", className: "flex-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border border-slate-200 px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-400 w-24 shrink-0", children: "Verified By" }),
        /* @__PURE__ */ jsx(EditableText, { value: register.verified_by, onChange: (v) => onChange("verified_by", v), placeholder: "Manager name", className: "flex-1" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("table", { className: "w-full mb-4 border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100", children: [
        /* @__PURE__ */ jsx("th", { className: "border border-slate-300 px-2 py-1.5 w-[34%]", children: "Denomination" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-300 px-2 py-1.5 w-[16%] text-right", children: "Value" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-300 px-2 py-1.5 w-[20%] text-center", children: "Count" }),
        /* @__PURE__ */ jsx("th", { className: "border border-slate-300 px-2 py-1.5 w-[30%] text-center", children: "Subtotal (Value × Count)" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        denominations ? denominations.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs", children: row.label }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs text-right text-slate-500", children: fmtValue(symbol, row.value) }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) })
        ] }, row.label)) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs", children: "Coins (all denominations)" }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs text-right text-slate-400", children: "—" }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) })
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs", children: "Notes / Bills (all denominations)" }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2 text-xs text-right text-slate-400", children: "—" }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) }),
            /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 font-bold", children: [
          /* @__PURE__ */ jsx("td", { colSpan: 3, className: "border border-slate-200 px-2 py-2 text-xs", children: "Grand Total Counted" }),
          /* @__PURE__ */ jsx("td", { className: "border border-slate-200 px-2 py-2", children: /* @__PURE__ */ jsx(BlankCell, {}) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-xs mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 items-center border border-slate-200 px-2 py-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Expected Amount (from POS / register)" }),
        /* @__PURE__ */ jsx(BlankCell, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 items-center border border-slate-200 px-2 py-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "Total Counted (carried from above)" }),
        /* @__PURE__ */ jsx(BlankCell, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 items-center border border-slate-200 px-2 py-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600 block", children: "Over / Short" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400", children: "Formula: Total Counted − Expected Amount. Positive = over, negative = short." })
        ] }),
        /* @__PURE__ */ jsx(BlankCell, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6 text-xs text-slate-500 mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-900 pt-1.5", children: [
        "Counted By Signature",
        /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: "Time: ____________________" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-900 pt-1.5 text-right", children: [
        "Verified By Signature (Manager)",
        /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: "Time: ____________________" })
      ] })
    ] })
  ] });
}
export {
  CashDrawerCountSheetTool as default
};
