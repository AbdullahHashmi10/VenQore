import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef } from "react";
import { ListPlus, Trash2, Plus, Layers, GripVertical, ArrowUp, ArrowDown, AlertTriangle, Table, ClipboardPaste, Check, Copy, Download } from "lucide-react";
import ToolShell from "./ToolShell-BDFk9CqZ.js";
import Select from "./Select-BFX9Hz_h.js";
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
const SEGMENT_TYPES = [
  { value: "fixed", label: "Fixed text" },
  { value: "category", label: "Category code" },
  { value: "variant", label: "Size / variant code" },
  { value: "sequence", label: "Sequential number" },
  { value: "random", label: "Random alphanumeric" }
];
const SEPARATORS = [
  { value: "-", label: "Dash ( - )" },
  { value: "_", label: "Underscore ( _ )" },
  { value: "", label: "None" }
];
const RANDOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
  }
  return out;
}
function slugCode(str) {
  return (str || "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function lookupCode(map, name) {
  const found = map.find((m) => m.name.trim().toLowerCase() === (name || "").trim().toLowerCase());
  return found ? found.code : "";
}
let segId = 0;
const newSegment = (type) => ({ id: ++segId, type, text: "SKU", width: 4, start: 1, length: 4 });
const FAQS = [
  { q: "What makes a good SKU?", a: "A good SKU is short (typically 6–12 characters), consistent in structure across your whole catalogue, and encodes useful lookup information such as category and variant — without relying on characters that are easy to misread, like the letter O versus the digit 0, or the letter I versus the digit 1. It should be unique per sellable variant and stable over time." },
  { q: "Should a SKU include the price?", a: "No. Prices change with promotions, cost inflation, and repricing, but a SKU is meant to be a permanent identifier. Embedding a price means every price change either breaks the SKU or forces you to keep an outdated number in the code. Keep pricing in your POS or catalogue, not in the SKU string." },
  { q: "How long should a SKU be?", a: "Most retailers land on 6–12 characters — long enough to encode category, variant and a sequence number without collisions, short enough to type, scan, and read on a small shelf tag without wrapping. Very long SKUs (20+ characters) are harder to bar-code cleanly and slower to key in manually at the register." },
  { q: "SKU vs barcode vs UPC — what's the difference?", a: "A SKU is an internal code your business defines and controls. A UPC is a standardized, globally unique 12-digit number assigned through GS1, typically used by manufacturers so any store can recognize the same product. A barcode is just the scannable graphic representation of a code — it can encode either a SKU or a UPC. You can turn your own SKU into a scannable barcode with the free Barcode Generator." }
];
function SkuGenerator({ toolGroups = [] }) {
  const [categories, setCategories] = useState([
    { name: "Shoes", code: "SH" },
    { name: "Shirts", code: "SHT" }
  ]);
  const [variants, setVariants] = useState([
    { name: "Black", code: "BLK" },
    { name: "White", code: "WHT" }
  ]);
  const updateMap = (setter, i, field, val) => setter((list) => list.map((row, idx) => idx === i ? { ...row, [field]: field === "code" ? slugCode(val) : val } : row));
  const addMapRow = (setter) => setter((list) => [...list, { name: "", code: "" }]);
  const removeMapRow = (setter, i) => setter((list) => list.filter((_, idx) => idx !== i));
  const [separator, setSeparator] = useState("-");
  const [segments, setSegments] = useState([
    newSegment("category"),
    newSegment("variant"),
    { ...newSegment("sequence"), width: 4, start: 1 }
  ]);
  const addSegment = (type) => setSegments((s) => [...s, newSegment(type)]);
  const removeSegment = (id) => setSegments((s) => s.filter((seg) => seg.id !== id));
  const updateSegment = (id, field, val) => setSegments((s) => s.map((seg) => seg.id === id ? { ...seg, [field]: val } : seg));
  const moveSegment = (id, dir) => setSegments((s) => {
    const idx = s.findIndex((seg) => seg.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= s.length) return s;
    const next = [...s];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return next;
  });
  const buildSku = (segs, sep, ctx, seqValue) => {
    const parts = segs.map((seg) => {
      switch (seg.type) {
        case "fixed":
          return slugCode(seg.text) || "";
        case "category":
          return lookupCode(categories, ctx.category) || (ctx.category ? slugCode(ctx.category).slice(0, 3) : "CAT");
        case "variant":
          return lookupCode(variants, ctx.variant) || (ctx.variant ? slugCode(ctx.variant).slice(0, 3) : "");
        case "sequence": {
          const width = Math.max(1, parseInt(seg.width, 10) || 1);
          return String(seqValue).padStart(width, "0");
        }
        case "random":
          return ctx.randomValue || randomCode(Math.max(1, parseInt(seg.length, 10) || 4));
        default:
          return "";
      }
    });
    return parts.filter((p) => p !== "").join(sep);
  };
  const seqSeg = segments.find((s) => s.type === "sequence");
  const previewSku = useMemo(() => {
    const start = seqSeg ? Math.max(0, parseInt(seqSeg.start, 10) || 1) : 1;
    return buildSku(segments, separator, { category: categories[0]?.name || "Shoes", variant: variants[0]?.name || "Black" }, start) || "(configure a scheme above)";
  }, [segments, separator, categories, variants]);
  const [rows, setRows] = useState([
    { name: "Running Shoe", category: "Shoes", variant: "Black" },
    { name: "Running Shoe", category: "Shoes", variant: "White" }
  ]);
  const [bulkPaste, setBulkPaste] = useState("");
  const pasteRef = useRef(null);
  const updateRow = (i, field, val) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  const addRow = () => setRows((r) => [...r, { name: "", category: "", variant: "" }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const parseBulk = () => {
    const lines = bulkPaste.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { name: parts[0] || "", category: parts[1] || "", variant: parts[2] || "" };
    }).filter((r) => r.name);
    if (parsed.length) {
      setRows((r) => [...r, ...parsed]);
      setBulkPaste("");
    }
  };
  const results = useMemo(() => {
    const startNum = seqSeg ? Math.max(0, parseInt(seqSeg.start, 10) || 1) : 1;
    let counter = startNum;
    return rows.map((row) => {
      const randomSeg = segments.find((s) => s.type === "random");
      const randomValue = randomSeg ? randomCode(Math.max(1, parseInt(randomSeg.length, 10) || 4)) : null;
      const sku = buildSku(segments, separator, { category: row.category, variant: row.variant, randomValue }, counter);
      const hasSequence = !!seqSeg;
      if (hasSequence) counter += 1;
      return { ...row, sku };
    });
  }, [rows, segments, separator, categories, variants]);
  const duplicateSkus = useMemo(() => {
    const counts = {};
    results.forEach((r) => {
      if (r.sku) counts[r.sku] = (counts[r.sku] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
  }, [results]);
  const hasNoSequence = !segments.some((s) => s.type === "sequence" || s.type === "random");
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    const text = results.map((r) => r.sku).filter(Boolean).join("\n");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  const exportCsv = () => {
    const header = ["Product Name", "Category", "Variant", "SKU"];
    const lines = [header.join(",")];
    results.forEach((r) => {
      lines.push([
        `"${(r.name || "").replace(/"/g, '""')}"`,
        `"${(r.category || "").replace(/"/g, '""')}"`,
        `"${(r.variant || "").replace(/"/g, '""')}"`,
        r.sku
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-skus.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-400/60 transition-colors";
  const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const segmentTypeOptions = SEGMENT_TYPES;
  const separatorOptions = SEPARATORS;
  const categoryOptions = [{ value: "", label: "—" }, ...categories.filter((c) => c.name).map((c) => ({ value: c.name, label: `${c.name} (${c.code || "—"})` }))];
  const variantOptions = [{ value: "", label: "—" }, ...variants.filter((v) => v.name).map((v) => ({ value: v.name, label: `${v.name} (${v.code || "—"})` }))];
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Bulk SKU Generator | VenQore",
      metaDescription: "Design a structured SKU naming scheme with category, variant, sequence and random segments, then generate SKUs in bulk for a product list. Free CSV export, no signup.",
      eyebrow: "Free Tool",
      h1: "Bulk SKU Generator",
      answer: "Build a structured SKU scheme from segments — fixed text, category code, variant code, a zero-padded sequential number, and a random alphanumeric code — joined by a separator of your choice, with a live preview. Then add or paste a product list and generate one SKU per row, auto-incrementing the sequence, and export the results as CSV. Entirely in your browser, free, no signup.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "sku-generator",
      cta: {
        headline: "Generating SKUs in a spreadsheet doesn't scale past a few dozen products.",
        subtext: "VenQore assigns and tracks SKUs, multi-barcodes and FIFO stock automatically as you add products."
      },
      related: [{ label: "Barcode Generator", href: "/tools/barcode-generator" }, { label: "Product CSV Cleaner", href: "/tools/product-csv-cleaner" }],
      children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(ListPlus, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Category & variant codes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Map full names to short codes — these feed the scheme below." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: labelCls, children: "Categories" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: categories.map((c, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("input", { value: c.name, onChange: (e) => updateMap(setCategories, i, "name", e.target.value), placeholder: "Shoes", className: `${inputCls} flex-1` }),
                /* @__PURE__ */ jsx("input", { value: c.code, onChange: (e) => updateMap(setCategories, i, "code", e.target.value), placeholder: "SH", className: `${inputCls} w-24 font-mono uppercase`, maxLength: 8 }),
                /* @__PURE__ */ jsx("button", { onClick: () => removeMapRow(setCategories, i), className: "text-slate-400 hover:text-red-500 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
              ] }, i)) }),
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addMapRow(setCategories), className: "mt-3 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wide hover:border-indigo-400/40 transition-colors inline-flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Plus, { size: 13 }),
                " Add category"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: labelCls, children: "Sizes / variants" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: variants.map((v, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("input", { value: v.name, onChange: (e) => updateMap(setVariants, i, "name", e.target.value), placeholder: "Black", className: `${inputCls} flex-1` }),
                /* @__PURE__ */ jsx("input", { value: v.code, onChange: (e) => updateMap(setVariants, i, "code", e.target.value), placeholder: "BLK", className: `${inputCls} w-24 font-mono uppercase`, maxLength: 8 }),
                /* @__PURE__ */ jsx("button", { onClick: () => removeMapRow(setVariants, i), className: "text-slate-400 hover:text-red-500 transition-colors shrink-0", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
              ] }, i)) }),
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addMapRow(setVariants), className: "mt-3 px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wide hover:border-indigo-400/40 transition-colors inline-flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Plus, { size: 13 }),
                " Add variant"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Layers, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "SKU scheme" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Add, reorder and configure segments. The preview updates live." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5 max-w-xs", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Separator" }),
            /* @__PURE__ */ jsx(Select, { value: separator, onChange: setSeparator, options: separatorOptions })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: segments.map((seg, i) => /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsx(GripVertical, { size: 15, className: "text-slate-300 dark:text-slate-600 shrink-0" }),
            /* @__PURE__ */ jsx("div", { className: "w-full sm:w-48", children: /* @__PURE__ */ jsx(Select, { value: seg.type, onChange: (v) => updateSegment(seg.id, "type", v), options: segmentTypeOptions }) }),
            seg.type === "fixed" && /* @__PURE__ */ jsx("input", { value: seg.text, onChange: (e) => updateSegment(seg.id, "text", e.target.value), placeholder: "SHOE", className: `${inputCls} flex-1 min-w-[140px] font-mono uppercase` }),
            seg.type === "sequence" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Start" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "0", value: seg.start, onChange: (e) => updateSegment(seg.id, "start", e.target.value), className: `${inputCls} w-24` }),
              /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Digits" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "10", value: seg.width, onChange: (e) => updateSegment(seg.id, "width", e.target.value), className: `${inputCls} w-20` })
            ] }),
            seg.type === "random" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Length" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "16", value: seg.length, onChange: (e) => updateSegment(seg.id, "length", e.target.value), className: `${inputCls} w-20` }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-600", children: "no O/0 or I/1 ambiguity" })
            ] }),
            (seg.type === "category" || seg.type === "variant") && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 dark:text-slate-600", children: [
              "Looked up per-row from the ",
              seg.type,
              " map above."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1 shrink-0", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => moveSegment(seg.id, -1), disabled: i === 0, className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition-colors", children: /* @__PURE__ */ jsx(ArrowUp, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => moveSegment(seg.id, 1), disabled: i === segments.length - 1, className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition-colors", children: /* @__PURE__ */ jsx(ArrowDown, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeSegment(seg.id), className: "p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
            ] })
          ] }) }, seg.id)) }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: SEGMENT_TYPES.map((t) => /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => addSegment(t.value), className: "px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wide hover:border-indigo-400/40 transition-colors inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Plus, { size: 13 }),
            " ",
            t.label
          ] }, t.value)) }),
          hasNoSequence && /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-700 dark:text-amber-300", children: "No sequential or random segment in this scheme — rows with the same category and variant will produce identical SKUs." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 p-5 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/10 border border-indigo-500/20 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300 mb-1", children: "Live preview" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black font-mono text-slate-900 dark:text-white", children: previewSku })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Table, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Generate in bulk" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Add products, then export the generated SKUs as CSV." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Paste rows (name, or name,category,variant — one per line)" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  ref: pasteRef,
                  value: bulkPaste,
                  onChange: (e) => setBulkPaste(e.target.value),
                  rows: 2,
                  placeholder: "Running Shoe,Shoes,Black\nRunning Shoe,Shoes,White",
                  className: `${inputCls} font-mono flex-1`
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: parseBulk,
                  className: "px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-wide hover:bg-indigo-500/25 transition-colors inline-flex items-center gap-1.5 shrink-0",
                  children: [
                    /* @__PURE__ */ jsx(ClipboardPaste, { size: 14 }),
                    " Add rows"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-2xl border border-slate-900/10 dark:border-white/10", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm min-w-[720px]", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-900/[0.03] dark:bg-white/[0.04] text-left", children: ["Product Name", "Category", "Variant", "Generated SKU", ""].map((h) => /* @__PURE__ */ jsx("th", { className: "px-3 py-2.5 font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: results.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-900/[0.06] dark:border-white/[0.06]", children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("input", { value: r.name, onChange: (e) => updateRow(i, "name", e.target.value), className: `${inputCls} py-1.5`, placeholder: "Product name" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-40", children: /* @__PURE__ */ jsx(Select, { value: r.category, onChange: (v) => updateRow(i, "category", v), options: categoryOptions }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-40", children: /* @__PURE__ */ jsx(Select, { value: r.variant, onChange: (v) => updateRow(i, "variant", v), options: variantOptions }) }),
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("span", { className: `font-mono font-bold ${duplicateSkus.has(r.sku) ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`, children: r.sku || "—" }),
                duplicateSkus.has(r.sku) && /* @__PURE__ */ jsx(AlertTriangle, { size: 13, className: "inline-block ml-1.5 text-amber-500 dark:text-amber-400" })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("button", { onClick: () => removeRow(i), className: "text-slate-400 hover:text-red-500 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }) })
            ] }, i)) })
          ] }) }),
          duplicateSkus.size > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-300", children: [
              duplicateSkus.size,
              " duplicate SKU",
              duplicateSkus.size > 1 ? "s" : "",
              " detected — add a sequential or random segment, or vary category/variant, to keep every SKU unique."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-4", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addRow,
                className: "px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wide hover:border-indigo-400/40 transition-colors inline-flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Add row"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: copyToClipboard,
                className: "px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wide hover:border-indigo-400/40 transition-colors inline-flex items-center gap-1.5",
                children: [
                  copied ? /* @__PURE__ */ jsx(Check, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { size: 14 }),
                  copied ? "Copied SKUs!" : "Copy SKUs"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: exportCsv,
                className: "px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-[#05030f] text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform inline-flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Download, { size: 14 }),
                  " Export CSV"
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 dark:text-slate-600", children: "Downloads directly from your browser — nothing is sent to a server." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "What makes a good SKU scheme?" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4", children: [
            "A ",
            /* @__PURE__ */ jsx("strong", { children: "SKU" }),
            " (Stock Keeping Unit) is an internal code your business defines to identify a specific sellable variant of a product — a particular size, color, or configuration. A good scheme is ",
            /* @__PURE__ */ jsx("strong", { children: "short" }),
            " (most retailers land on 6–12 characters), ",
            /* @__PURE__ */ jsx("strong", { children: "consistent" }),
            " across the whole catalogue, and encodes",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "useful information" }),
            " like category and variant so staff can recognize a product from the code alone. Avoid characters that are easy to misread — the letter ",
            /* @__PURE__ */ jsx("strong", { children: "O" }),
            " versus the digit ",
            /* @__PURE__ */ jsx("strong", { children: "0" }),
            ", or the letter ",
            /* @__PURE__ */ jsx("strong", { children: "I" }),
            " versus the digit ",
            /* @__PURE__ */ jsx("strong", { children: "1" }),
            " — especially if the code will ever be handwritten or read off a small label. Never embed a ",
            /* @__PURE__ */ jsx("strong", { children: "price" }),
            " in a SKU: prices change with promotions and repricing, but a SKU is meant to stay fixed for the life of the product."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/10 border border-indigo-500/20 mb-6", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-2", children: "Worked example" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed", children: [
              'Scheme: category code + variant code + a 4-digit sequential number, joined with dashes. For "Running Shoe" in category ',
              /* @__PURE__ */ jsx("strong", { children: "Shoes" }),
              " (SH) and variant ",
              /* @__PURE__ */ jsx("strong", { children: "Black" }),
              " (BLK), starting the sequence at 1, the generator produces ",
              /* @__PURE__ */ jsx("strong", { className: "font-mono", children: "SH-BLK-0001" }),
              ". The next row in the same category and variant becomes ",
              /* @__PURE__ */ jsx("strong", { className: "font-mono", children: "SH-BLK-0002" }),
              " — the sequence guarantees no collision even when category and variant repeat."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "SKU vs. barcode vs. UPC" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: [
            "A ",
            /* @__PURE__ */ jsx("strong", { children: "SKU" }),
            " is internal and fully under your control — you choose its structure and meaning. A",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "UPC" }),
            " (Universal Product Code) is a standardized, globally unique 12-digit number assigned through GS1, typically used by manufacturers so any retailer can recognize the same product. A ",
            /* @__PURE__ */ jsx("strong", { children: "barcode" }),
            " is just the scannable graphic representation of a code — it can encode either a SKU or a UPC, or another symbology entirely. Once you've built a SKU scheme here, you can turn any SKU into a scannable barcode with the free",
            " ",
            /* @__PURE__ */ jsx("a", { href: "/tools/barcode-generator", className: "text-indigo-600 dark:text-indigo-300 font-bold hover:underline", children: "Barcode Generator" }),
            "."
          ] })
        ] })
      ]
    }
  );
}
export {
  SkuGenerator as default
};
