import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { AlertCircle, ClipboardPaste, Upload, Loader2, Download, FileText, Trash2, Plus } from "lucide-react";
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
const STORAGE_KEY = "venqore_stock_count_store_v1";
const emptyItem = () => ({ sku: "", name: "", category: "General", unit: "pcs" });
const SAMPLE_CSV = `SKU-1001, Organic Green Tea 250g, Beverages, pcs
SKU-1002, Almond Milk 1L, Beverages, pcs
SKU-2001, Dark Chocolate Bar 85%, Snacks, pcs
SKU-2002, Sea Salt Potato Chips 150g, Snacks, pcs
SKU-3001, Stainless Water Bottle 750ml, Merchandise, pcs`;
const FAQS = [
  { q: "Is the VenQore stock count sheet generator free?", a: "Yes. Creating and downloading a PDF stock count sheet is completely free, with no signup and no watermark." },
  { q: "Can I import items via bulk paste?", a: "Yes — switch to paste mode and paste lines formatted as SKU, Name, Category, Unit. They will populate the table instantly." },
  { q: "How does category grouping work?", a: "Items sharing the same category are automatically clustered under a category sub-header, both in the live preview and on the printed PDF, so audit teams can walk aisle by aisle." },
  { q: "Does the preview match the printed sheet?", a: "The layout matches exactly, but the Counted Qty and Variance cells are intentionally left blank in the preview, just as they are on the printed page — those are hand-written in during the physical count, not typed into the tool." }
];
function StockCountSheetTool({ maxItems = 500, suggestedReference = "", toolGroups = [] }) {
  const [store, setStore] = useState({
    name: "",
    location: "Main Warehouse / Shop Floor",
    auditor_name: "",
    audit_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    reference_no: suggestedReference,
    logo_base64: null
  });
  const [items, setItems] = useState([
    { sku: "SKU-101", name: "Premium Coffee Beans 1kg", category: "Beverages", unit: "bags" },
    { sku: "SKU-102", name: "Earl Grey Tea Boxes", category: "Beverages", unit: "boxes" },
    { sku: "SKU-201", name: "Oat Milk 1L", category: "Dairy/Alt", unit: "cartons" }
  ]);
  const [meta, setMeta] = useState({
    show_sku: true,
    group_by: "category",
    orientation: "portrait",
    notes: ""
  });
  const [csvInput, setCsvInput] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
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
  const updateItem = (idx, field, val) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };
  const addItem = () => {
    if (items.length >= maxItems) return;
    setItems((prev) => [...prev, emptyItem()]);
  };
  const removeItem = (idx) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const handleParseCsv = async () => {
    if (!csvInput.trim()) return;
    try {
      const res = await fetch("/tools/stock-count-sheet/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || ""
        },
        body: JSON.stringify({ csv_text: csvInput })
      });
      const data = await res.json();
      if (data.success && data.items?.length > 0) {
        setItems(data.items);
        setPasteMode(false);
        setCsvInput("");
      } else {
        setErrors(["Failed to parse pasted lines. Double-check format."]);
      }
    } catch (e) {
      setErrors(["Failed to process bulk import."]);
    }
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
      setErrors(["Store / business name is required. Click the store name on the sheet above."]);
      return;
    }
    if (!items.some((it) => it.name.trim())) {
      setErrors(["Add at least one product with a name."]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/tools/stock-count-sheet/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/pdf, application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || ""
        },
        body: JSON.stringify({ store, items, meta })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors(data.errors || ["Failed to generate Stock Count Sheet. Check fields and try again."]);
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-count-sheet-${store.reference_no || "audit"}.pdf`;
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
  const groups = useMemo(() => {
    if (meta.group_by !== "category") {
      return [{ name: null, rows: items.map((it, idx) => ({ ...it, idx })) }];
    }
    const map = /* @__PURE__ */ new Map();
    items.forEach((it, idx) => {
      const key = (it.category || "").trim() || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...it, idx });
    });
    return Array.from(map.entries()).map(([name, rows]) => ({ name, rows }));
  }, [items, meta.group_by]);
  const isLandscape = meta.orientation === "landscape";
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Stock Count Sheet Generator — Printable PDF | VenQore",
      metaDescription: "Create a printable physical inventory count sheet free online. Group by category, toggle SKU column, portrait or landscape, no signup, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Stock Count Sheet Generator",
      answer: "Edit the sheet below exactly as it will print — click any header field or product row to change it. The Counted Qty and Variance columns stay blank by design: they're filled in by hand during the physical count, exactly as they'll appear on paper.",
      toolGroups,
      currentSlug: "stock-count-sheet",
      faqs: FAQS,
      cta: { headline: "Manual counts are one piece of running inventory.", subtext: "VenQore tracks FIFO stock, batches and variances automatically — no clipboard required." },
      related: [{ href: "/tools/invoice-generator", label: "Invoice Generator" }],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(
            Select,
            {
              value: meta.orientation,
              onChange: (v) => setMeta((m) => ({ ...m, orientation: v })),
              options: [
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" }
              ]
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "w-44", children: /* @__PURE__ */ jsx(
            Select,
            {
              value: meta.group_by,
              onChange: (v) => setMeta((m) => ({ ...m, group_by: v })),
              options: [
                { value: "category", label: "Group by category" },
                { value: "none", label: "Flat list (no grouping)" }
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: meta.show_sku,
                onChange: (e) => setMeta((m) => ({ ...m, show_sku: e.target.checked })),
                className: "rounded"
              }
            ),
            "Show SKU column"
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setPasteMode((p) => !p),
              className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-400/40 transition-colors",
              children: [
                /* @__PURE__ */ jsx(ClipboardPaste, { size: 13 }),
                " ",
                pasteMode ? "Back to table" : "Bulk paste"
              ]
            }
          ),
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
        pasteMode ? (
          /* Bulk paste — alternate input method, populates the table on import */
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white p-6 sm:p-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-indigo-500" }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Bulk paste items" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mb-3", children: [
              "Paste one item per line, formatted as ",
              /* @__PURE__ */ jsx("code", { className: "bg-slate-100 px-1 rounded", children: "SKU, Name, Category, Unit" }),
              "."
            ] }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: csvInput,
                onChange: (e) => setCsvInput(e.target.value),
                placeholder: SAMPLE_CSV,
                rows: 10,
                className: "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-400 resize-none"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-3", children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCsvInput(SAMPLE_CSV), className: "text-xs text-indigo-500 hover:underline font-bold", children: "Load sample data" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setPasteMode(false), className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg", children: "Cancel" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: handleParseCsv, className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg", children: "Import Items" })
              ] })
            ] })
          ] })
        ) : (
          /* THE DOCUMENT — this is the editor. Orientation visually widens/narrows the container. */
          /* @__PURE__ */ jsx("div", { className: `mx-auto transition-all ${isLandscape ? "max-w-none" : "max-w-3xl"}`, children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-10 text-slate-900 text-sm", style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between gap-6 mb-6 pb-4 border-b-2 border-slate-900", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                store.logo_base64 && /* @__PURE__ */ jsx("img", { src: store.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: store.name,
                    onChange: (v) => setStore((s) => ({ ...s, name: v })),
                    placeholder: "Store / business name",
                    className: "block text-lg font-bold"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [
                  "Location / Section: ",
                  /* @__PURE__ */ jsx(EditableText, { value: store.location, onChange: (v) => setStore((s) => ({ ...s, location: v })), placeholder: "e.g. Aisle 4 - Dry Goods" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-black tracking-tight", children: "STOCK COUNT SHEET" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs space-y-0.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Ref #" }),
                    /* @__PURE__ */ jsx(EditableText, { value: store.reference_no, onChange: (v) => setStore((s) => ({ ...s, reference_no: v })), className: "font-bold" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Audit date" }),
                    /* @__PURE__ */ jsx(EditableText, { as: "date", value: store.audit_date, onChange: (v) => setStore((s) => ({ ...s, audit_date: v })) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Auditor" }),
                    /* @__PURE__ */ jsx(EditableText, { value: store.auditor_name, onChange: (v) => setStore((s) => ({ ...s, auditor_name: v })), placeholder: "Auditor name" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("table", { className: "w-full mb-2 border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b-2 border-slate-900", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 pr-2 w-8", children: "#" }),
                meta.show_sku && /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 w-32", children: "SKU" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2", children: "Item Description" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 w-20", children: "Unit" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-center w-28", children: "Counted Qty" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2 text-center w-28", children: "Variance" }),
                /* @__PURE__ */ jsx("th", { className: "w-8" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: (() => {
                let counter = 0;
                return groups.map((group) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
                  group.name && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: meta.show_sku ? 7 : 6, className: "bg-slate-100 font-bold text-xs py-1.5 px-2 border border-slate-200", children: [
                    group.name,
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-normal", children: [
                      "(",
                      group.rows.length,
                      " items)"
                    ] })
                  ] }) }),
                  group.rows.map((item) => {
                    counter += 1;
                    const idx = item.idx;
                    return /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 group", children: [
                      /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 text-slate-400 text-xs", children: counter }),
                      meta.show_sku && /* @__PURE__ */ jsx("td", { className: "py-2 px-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.sku, onChange: (v) => updateItem(idx, "sku", v), placeholder: "SKU-100", className: "block font-mono text-xs" }) }),
                      /* @__PURE__ */ jsxs("td", { className: "py-2 px-2", children: [
                        /* @__PURE__ */ jsx(EditableText, { value: item.name, onChange: (v) => updateItem(idx, "name", v), placeholder: "Product name", className: "block" }),
                        meta.group_by === "category" && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-400 mt-0.5", children: [
                          "Category: ",
                          /* @__PURE__ */ jsx(EditableText, { value: item.category, onChange: (v) => updateItem(idx, "category", v), placeholder: "Uncategorized", className: "text-[10px]" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.unit, onChange: (v) => updateItem(idx, "unit", v), placeholder: "pcs", className: "block w-16" }) }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "inline-block w-full border-b border-dotted border-slate-300 h-4", "aria-hidden": "true" }) }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "inline-block w-full border-b border-dotted border-slate-300 h-4", "aria-hidden": "true" }) }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 pl-1 text-right", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeItem(idx), disabled: items.length === 1, className: "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-opacity", children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) }) })
                    ] }, idx);
                  })
                ] }, group.name ?? "flat"));
              })() })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", onClick: addItem, disabled: items.length >= maxItems, className: "flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-500 disabled:opacity-40 transition-colors mb-6", children: [
              /* @__PURE__ */ jsx(Plus, { size: 12 }),
              " Add product"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mb-8", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 mb-1", children: "Notes / Discrepancy" }),
              /* @__PURE__ */ jsx(EditableText, { value: meta.notes, onChange: (v) => setMeta((m) => ({ ...m, notes: v })), placeholder: "Add a note for the audit team (optional)", as: "textarea", rows: 2, className: "block" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between gap-8 mt-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-full sm:w-56", children: /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-900 pt-1.5 text-[11px] text-slate-500", children: [
                "Auditor Signature",
                /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: "Date: ____________________" })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "w-full sm:w-56", children: /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-900 pt-1.5 text-[11px] text-slate-500", children: [
                "Manager Sign-off / Verification",
                /* @__PURE__ */ jsx("div", { className: "text-slate-400", children: "Date: ____________________" })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-center text-[10px] text-slate-300 mt-10", children: [
              "Generated free at venqore.com/tools — Stock Count Sheet (",
              items.length,
              " items)."
            ] })
          ] }) }) })
        ),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: "Counted Qty and Variance stay blank on purpose — they're filled in by hand during the physical count, just like on the printed sheet." })
      ]
    }
  );
}
export {
  StockCountSheetTool as default
};
