import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { AlertCircle, Loader2, Download, Upload, Trash2, Plus } from "lucide-react";
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
const CURRENCIES = [
  { value: "$", label: "$ (USD, CAD, AUD)" },
  { value: "€", label: "€ (EUR)" },
  { value: "£", label: "£ (GBP)" },
  { value: "Rs", label: "Rs (PKR, INR)" },
  { value: "AED", label: "AED (Dirham)" },
  { value: "SAR", label: "SAR (Riyal)" },
  { value: "¥", label: "¥ (JPY, CNY)" }
];
const FAQS = [
  { q: "Is the VenQore price tag generator really free?", a: "Yes. Building and downloading a print-ready PDF of shelf-edge price tags is completely free, with no signup and no watermark, for any number of products within the rate limit." },
  { q: "Can I print tags for many different products at once?", a: "Yes — that is the whole point of this tool. Add as many tag cards as you like in the grid below, each with its own name and price, and every card becomes one distinct tag on the sheet. This is different from a barcode print-sheet, which repeats a single value." },
  { q: "What is the fastest way to enter a lot of products?", a: "Switch to bulk paste. Paste one product per line as name,price or name,price,was_price,sku,badge — the tool parses it straight into the tag grid, so you can build a 100-tag sheet from a spreadsheet in seconds." },
  { q: 'Can I show a "was" price with a strikethrough for sale items?', a: 'Yes. Click the "was" price on any tag card and the tag prints the old price with a strikethrough next to a larger, bolder current price, with an optional SALE/CLEARANCE badge in the corner.' },
  { q: "Does the price tag include a barcode?", a: "Optionally. Turn on the barcode toggle and give each tag a SKU — the tag embeds a small Code128 barcode alongside the price so it can double as a scannable shelf label." },
  { q: "What label sizes are supported?", a: "Small thermal shelf-tag sizes (40×30 mm, 50×25 mm, 50×30 mm, 60×40 mm) for direct label printers, plus Avery-compatible A4 and Letter sheet grids (21, 24 or 65 tags per sheet) for a standard printer." },
  { q: "Can I print multiple copies of the same batch?", a: "Yes — set the copies multiplier to print the whole batch of tags more than once, useful for stocking the same product range on two shelves or two store locations." },
  { q: "Does the preview match the printed sheet?", a: "Yes. The grid of tag cards on screen mirrors the exact layout, badge styling and sale-price formatting used in the downloaded PDF sheet, so there are no surprises after you print." }
];
const QUICK_BADGES = ["SALE", "NEW", "CLEARANCE", "HOT DEAL"];
const emptyTag = () => ({ id: Date.now() + Math.random(), name: "", price: "", was_price: "", sku: "", badge: "" });
function PriceTagTool({
  sheetPresets = [],
  maxRows = 500,
  maxCopies = 50,
  barcodeFormats = [],
  toolGroups = []
}) {
  const [mode, setMode] = useState("manual");
  const [rows, setRows] = useState([
    { id: 1, name: "Cotton Crew T-Shirt", price: "19.99", was_price: "29.99", sku: "TSH-001", badge: "SALE" },
    { id: 2, name: "Slim Fit Denim Jeans", price: "49.99", was_price: "", sku: "JNS-002", badge: "NEW" },
    { id: 3, name: "Classic Leather Belt", price: "15.00", was_price: "", sku: "BLT-003", badge: "" }
  ]);
  const [bulkText, setBulkText] = useState(
    "Cotton Crew T-Shirt,19.99,29.99,TSH-001,SALE\nSlim Fit Denim Jeans,49.99,,JNS-002,NEW\nClassic Leather Belt,15.00,,BLT-003,"
  );
  const [preset, setPreset] = useState(sheetPresets[0]?.key || "thermal-50x25");
  const [copies, setCopies] = useState(1);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcodeFormat, setBarcodeFormat] = useState("code128");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState([]);
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || "";
  const addTag = () => {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, emptyTag()]);
  };
  const updateTag = (id, field, value) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeTag = (id) => {
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  };
  const parseBulk = () => {
    if (!bulkText.trim()) return;
    setParsing(true);
    fetch(route("tools.price-tag.parse"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrf() },
      body: JSON.stringify({ csv_text: bulkText })
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors || ["Could not parse CSV text."]);
        return;
      }
      if (json.items && json.items.length > 0) {
        setRows(json.items.map((item, idx) => ({ ...item, id: Date.now() + idx })));
        setMode("manual");
        setErrors([]);
      } else {
        setErrors(["No valid rows found in the pasted text."]);
      }
    }).catch(() => setErrors(["Network error during CSV parsing."])).finally(() => setParsing(false));
  };
  const buildPdf = () => {
    const validItems = rows.filter((r) => r.name.trim() !== "" && String(r.price).trim() !== "");
    if (validItems.length === 0) {
      setErrors(["Please fill in product name and price for at least one tag."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    fetch(route("tools.price-tag.sheet"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/pdf", "X-CSRF-TOKEN": csrf() },
      body: JSON.stringify({
        items: validItems.map((item) => ({
          name: item.name.trim(),
          price: String(item.price).trim(),
          was_price: item.was_price ? String(item.was_price).trim() : null,
          sku: item.sku ? item.sku.trim() : null,
          badge: item.badge ? item.badge.trim() : null
        })),
        preset,
        copies: Number(copies) || 1,
        currency_symbol: currencySymbol,
        show_barcode: showBarcode,
        barcode_format: barcodeFormat
      })
    }).then(async (res) => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors(json.errors || ["Could not build the price tag PDF."]);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `price-tags-${preset}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => setErrors(["Network error — please try again."])).finally(() => setLoading(false));
  };
  const presetOptions = sheetPresets.map((p) => ({
    value: p.key,
    label: p.label,
    group: p.group,
    badge: p.per_sheet > 1 ? `${p.per_sheet}/sheet` : "Roll"
  }));
  const formatOptions = barcodeFormats.map((f) => ({
    value: f.slug,
    label: f.name
  }));
  const fmtMoney = (v) => `${currencySymbol}${v}`;
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Price Tag Generator — Shelf Edge Labels PDF | VenQore",
      metaDescription: "Generate printable shelf-edge price tags for multiple products free. Thermal roll & A4 label sheets, sale pricing, badges & optional barcodes. No signup.",
      eyebrow: "Free Tool",
      h1: "Free Price Tag Generator",
      answer: "The VenQore Price Tag Generator creates print-ready PDF sheets of shelf-edge price tags for retail stores. Edit the tag grid below exactly as it will print — click any name, price, or badge to change it — choose thermal or A4 label sizes, and download a ready-to-print PDF. Free, no signup, no watermark.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "price-tag-generator",
      cta: {
        headline: "Tired of typing prices product by product?",
        subtext: "VenQore POS automatically manages your inventory prices, prints shelf tags in bulk, and writes balanced double-entry accounting records."
      },
      related: [
        { label: "Barcode Generator", href: "/tools/barcode-generator" },
        { label: "Barcode Validator", href: "/tools/barcode-validator" }
      ],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-56", children: /* @__PURE__ */ jsx(Select, { value: preset, onChange: setPreset, options: presetOptions }) }),
          /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(Select, { value: currencySymbol, onChange: setCurrencySymbol, options: CURRENCIES }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Copies" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                max: maxCopies,
                value: copies,
                onChange: (e) => setCopies(Math.max(1, Math.min(maxCopies, Number(e.target.value) || 1))),
                className: "w-16 px-2 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-400/60 transition-colors"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: showBarcode,
                onChange: (e) => setShowBarcode(e.target.checked),
                className: "w-4 h-4 rounded accent-indigo-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-600 dark:text-slate-300 font-medium", children: "Barcode" })
          ] }),
          showBarcode && /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: barcodeFormat, onChange: setBarcodeFormat, options: formatOptions }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-900/[0.06] dark:bg-white/[0.06] p-1 rounded-xl shrink-0", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setMode("manual"),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === "manual" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
                children: [
                  "Grid (",
                  rows.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMode("bulk"),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === "bulk" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
                children: "Bulk Paste"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline", children: "Nothing sent until you download" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: buildPdf,
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
        mode === "bulk" ? (
          /* Bulk paste — alternate input method, populates the grid on parse */
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2", children: [
                "Paste CSV Lines (Format: ",
                /* @__PURE__ */ jsx("code", { className: "font-mono text-indigo-500", children: "name,price,was_price,sku,badge" }),
                ")"
              ] }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  rows: 8,
                  value: bulkText,
                  onChange: (e) => setBulkText(e.target.value),
                  placeholder: "Cotton Crew T-Shirt,19.99,29.99,TSH-001,SALE\nSlim Fit Denim Jeans,49.99,,JNS-002,NEW",
                  className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-400/60 transition-colors"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Lines starting with 'name,price' headers are auto-skipped. Parsing loads the grid below." }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: parseBulk,
                  disabled: parsing || !bulkText.trim(),
                  className: "inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.01] transition-transform disabled:opacity-40",
                  children: [
                    parsing ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Upload, { size: 14 }),
                    "Parse & Load Grid"
                  ]
                }
              )
            ] })
          ] })
        ) : (
          /* THE TAG SHEET — this grid of cards is the editor */
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white p-4 sm:p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: [
              rows.map((row) => {
                const onSale = !!row.was_price;
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "group relative rounded-lg border border-dashed border-slate-200 p-2.5 bg-white text-slate-900 min-h-[92px]",
                    style: { fontFamily: "Helvetica, Arial, sans-serif" },
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute top-1 right-1", children: /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          value: row.badge,
                          onChange: (v) => updateTag(row.id, "badge", v),
                          placeholder: "badge",
                          emptyLabel: "",
                          className: `text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${row.badge ? "bg-red-500 text-white" : "text-transparent"}`
                        }
                      ) }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => removeTag(row.id),
                          disabled: rows.length <= 1,
                          className: "absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 disabled:opacity-0 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-red-500 shadow-sm transition-opacity z-10",
                          title: "Remove tag",
                          children: /* @__PURE__ */ jsx(Trash2, { size: 11 })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          value: row.name,
                          onChange: (v) => updateTag(row.id, "name", v),
                          placeholder: "Product name",
                          className: "block text-[11px] font-bold leading-tight pr-8"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          value: row.sku,
                          onChange: (v) => updateTag(row.id, "sku", v),
                          placeholder: "SKU",
                          emptyLabel: "SKU",
                          className: "block text-[9px] text-slate-400 font-mono mt-0.5"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5 flex-wrap", children: [
                        onSale && /* @__PURE__ */ jsx(
                          EditableText,
                          {
                            as: "number",
                            min: "0",
                            step: "0.01",
                            value: row.was_price,
                            onChange: (v) => updateTag(row.id, "was_price", v),
                            formatDisplay: fmtMoney,
                            className: "text-[10px] text-slate-400 line-through"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          EditableText,
                          {
                            as: "number",
                            min: "0",
                            step: "0.01",
                            value: row.price,
                            onChange: (v) => updateTag(row.id, "price", v),
                            placeholder: "0.00",
                            formatDisplay: fmtMoney,
                            className: `text-base font-black ${onSale ? "text-red-600" : "text-slate-900"}`
                          }
                        )
                      ] }),
                      !onSale && /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => updateTag(row.id, "was_price", row.price || "0.00"),
                          className: "mt-0.5 text-[9px] text-slate-300 hover:text-indigo-500 underline",
                          children: "+ was price"
                        }
                      ),
                      /* @__PURE__ */ jsx("div", { className: "mt-1.5 flex items-center gap-1 flex-wrap", children: QUICK_BADGES.map((b) => /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => updateTag(row.id, "badge", row.badge === b ? "" : b),
                          className: `text-[8px] font-bold px-1 py-0.5 rounded transition-colors ${row.badge === b ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`,
                          children: b
                        },
                        b
                      )) }),
                      showBarcode && /* @__PURE__ */ jsx("div", { className: "mt-1.5 h-4 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-full h-3 bg-[repeating-linear-gradient(90deg,#0f172a_0,#0f172a_1px,transparent_1px,transparent_3px)] opacity-70" }) })
                    ]
                  },
                  row.id
                );
              }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: addTag,
                  disabled: rows.length >= maxRows,
                  className: "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 min-h-[92px] text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors disabled:opacity-40",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 18 }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wide", children: "Add tag" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 text-center mt-4", children: [
              rows.length,
              " / ",
              maxRows,
              " tags — click any field on a tag to edit it"
            ] })
          ] })
        ),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: 'This preview matches your downloaded PDF sheet layout — click anything above to edit it. Print at 100% / "Actual size".' })
      ]
    }
  );
}
export {
  PriceTagTool as default
};
