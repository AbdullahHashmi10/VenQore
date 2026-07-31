import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { AlertCircle, ClipboardPaste, Loader2, Download, Upload, Trash2, AlignLeft, AlignCenter, Bold, Plus } from "lucide-react";
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
const FAQS = [
  { q: "Is the VenQore label sheet generator really free?", a: "Yes. Building and downloading a print-ready PDF of text labels is completely free, with no signup and no watermark, for any number of labels within the rate limit." },
  { q: "What kind of labels can I make with this tool?", a: 'Any plain-text label: mailing and return-address labels, "Fragile" or "This Side Up" warning labels, folder and binder tabs, name badges, and jar or container labels. It is general-purpose — not tied to a barcode or a price.' },
  { q: "Can I print the same label multiple times?", a: "Yes, two ways. Set a quantity on a single card to repeat just that label — handy for a return-address label you need fifty of — or use the whole-sheet copies multiplier to repeat the entire batch." },
  { q: "Does every label have to say the same thing?", a: "No — the default model is the opposite. Each card you add or paste is its own distinct label with up to three lines of text, so a batch of completely different folder tabs or name badges prints in one PDF, or you can repeat one label many times using the per-card quantity, or mix both." },
  { q: "What is the bulk-paste format?", a: 'Separate each label with a blank line. Within a block, the first line becomes line 1, the second becomes line 2, and the third becomes line 3. Add a line like "x10" at the end of a block to repeat that label 10 times.' },
  { q: "What label sizes are supported?", a: "Thermal label sizes (40×30 mm up to 100×50 mm shipping labels) for direct label printers, plus Avery-compatible A4 and Letter sheet grids, including a 5160-equivalent address label size (66.7 × 25.4 mm, 30 per sheet)." },
  { q: "How do I avoid label misalignment when printing?", a: `Always print at 100% / "Actual size" in your PDF viewer — never "Fit to page", which rescales the PDF and throws off alignment with pre-cut label sheets. Confirm your printer's paper size matches the preset you picked (A4 vs Letter) too.` },
  { q: "Does the preview match the printed sheet?", a: "Yes. The grid of cards on screen mirrors the same layout, line sizing, bold and alignment rules used to build the downloaded PDF, so what you see before you click Download is what prints." }
];
const BULK_PLACEHOLDER = `Jane Doe
123 Main St
Springfield, IL 62704

FRAGILE
This Side Up
x10

Return To:
Acme Co, 45 Elm St
x50`;
let nextId = 4;
function LabelSheetTool({
  sheetPresets = [],
  maxRows = 200,
  maxCopies = 20,
  maxRowQty = 200,
  toolGroups = []
}) {
  const [mode, setMode] = useState("grid");
  const [rows, setRows] = useState([
    { id: 1, line1: "Jane Doe", line2: "123 Main St", line3: "Springfield, IL 62704", align: "left", bold_first: true, qty: 1 },
    { id: 2, line1: "FRAGILE", line2: "This Side Up", line3: "", align: "center", bold_first: true, qty: 5 },
    { id: 3, line1: "Warehouse — Bin A3", line2: "", line3: "", align: "left", bold_first: false, qty: 1 }
  ]);
  const [bulkText, setBulkText] = useState(BULK_PLACEHOLDER);
  const [preset, setPreset] = useState(sheetPresets[0]?.key || "letter-3x10-address");
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState([]);
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || "";
  const addRow = () => {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, { id: nextId++, line1: "", line2: "", line3: "", align: "left", bold_first: false, qty: 1 }]);
  };
  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeRow = (id) => {
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  };
  const parseBulk = () => {
    if (!bulkText.trim()) return;
    setParsing(true);
    fetch(route("tools.label-sheet.parse"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrf() },
      body: JSON.stringify({ bulk_text: bulkText })
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors || ["Could not parse the pasted text."]);
        return;
      }
      if (json.items && json.items.length > 0) {
        setRows(json.items.map((item) => ({
          id: nextId++,
          line1: item.line1 || "",
          line2: item.line2 || "",
          line3: item.line3 || "",
          align: "left",
          bold_first: false,
          qty: item.qty || 1
        })));
        setMode("grid");
        setErrors([]);
      } else {
        setErrors(["No valid label blocks found in the pasted text."]);
      }
    }).catch(() => setErrors(["Network error while parsing."])).finally(() => setParsing(false));
  };
  const buildPdf = () => {
    const validItems = rows.filter((r) => r.line1.trim() !== "" || r.line2.trim() !== "" || r.line3.trim() !== "");
    if (validItems.length === 0) {
      setErrors(["Please fill in at least one line of text for at least one label."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    fetch(route("tools.label-sheet.sheet"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/pdf", "X-CSRF-TOKEN": csrf() },
      body: JSON.stringify({
        items: validItems.map((item) => ({
          line1: item.line1.trim(),
          line2: item.line2.trim(),
          line3: item.line3.trim(),
          align: item.align,
          bold_first: item.bold_first,
          qty: Number(item.qty) || 1
        })),
        preset,
        copies: Number(copies) || 1
      })
    }).then(async (res) => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors(json.errors || ["Could not build the label sheet PDF."]);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `label-sheet-${preset}.pdf`;
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
  const totalLabelsPreview = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.qty) || 1), 0) * (Number(copies) || 1),
    [rows, copies]
  );
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Label Sheet Generator — Printable Text Labels PDF | VenQore",
      metaDescription: "Generate printable text labels free — addresses, warning labels, folder tabs, name badges. Avery-compatible A4/Letter sheets and thermal sizes. No signup.",
      eyebrow: "Free Tool",
      h1: "Free Label Sheet Generator",
      answer: "The VenQore Label Sheet Generator creates print-ready PDF sheets of general-purpose text labels — mailing addresses, warning labels, folder tabs, name badges, jar labels, and more. Edit labels directly on the grid below exactly as they will print, with up to three lines of text each, repeat any label as many times as you need, choose a thermal or Avery-compatible A4/Letter size, and download a ready-to-print PDF. Free, no signup, no watermark.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "label-sheet-generator",
      cta: {
        headline: "Managing labels product-by-product gets old fast.",
        subtext: "VenQore POS automatically manages your inventory, prints shelf tags and shipping labels in bulk, and writes balanced double-entry accounting records."
      },
      related: [
        { label: "Price Tag Generator", href: "/tools/price-tag-generator" },
        { label: "Barcode Generator", href: "/tools/barcode-generator" }
      ],
      wide: true,
      children: [
        errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-56", children: [
            /* @__PURE__ */ jsx(Select, { value: preset, onChange: setPreset, options: presetOptions }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-snug", children: "Prints portrait, sized to the label grid you choose above." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 dark:text-slate-400", htmlFor: "ls-copies", children: "Copies" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "ls-copies",
                type: "number",
                min: "1",
                max: maxCopies,
                value: copies,
                onChange: (e) => setCopies(Math.max(1, Math.min(maxCopies, Number(e.target.value) || 1))),
                className: "w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-400/60 transition-colors"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-900/[0.06] dark:bg-white/[0.06] p-1 rounded-xl shrink-0", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setMode("grid"),
                className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === "grid" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
                children: [
                  "Grid (",
                  rows.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setMode("bulk"),
                className: `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 ${mode === "bulk" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`,
                children: [
                  /* @__PURE__ */ jsx(ClipboardPaste, { size: 12 }),
                  " Bulk Paste"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-slate-400 dark:text-slate-600 hidden sm:inline", children: [
              totalLabelsPreview,
              " labels total"
            ] }),
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
        mode === "bulk" ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7 mb-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2", children: [
            "Paste Labels — separate each label with a ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-500", children: "blank line" })
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 10,
              value: bulkText,
              onChange: (e) => setBulkText(e.target.value),
              placeholder: BULK_PLACEHOLDER,
              className: "w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-400/60 transition-colors"
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 dark:text-slate-500 mt-2", children: [
            "Within a block: line 1, line 2, line 3 (up to 3 lines become one label). Add a trailing ",
            /* @__PURE__ */ jsx("code", { className: "font-mono text-indigo-500", children: "x10" }),
            " line to repeat that label 10 times."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end mt-3", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: parseBulk,
              disabled: parsing || !bulkText.trim(),
              className: "inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.01] transition-transform disabled:opacity-40",
              children: [
                parsing ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Upload, { size: 14 }),
                "Parse & Load Into Grid"
              ]
            }
          ) })
        ] }) : (
          /* THE LABEL SHEET GRID — this is the editor, styled to mirror
             resources/views/tools/pdf/label-sheet.blade.php exactly */
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-900/10 dark:border-white/10 bg-white p-4 sm:p-6 mb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3", style: { gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }, children: [
              rows.map((row) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "group relative rounded-lg border border-dashed border-slate-300 bg-white p-2.5 min-h-[92px] flex flex-col",
                  children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => removeRow(row.id),
                        disabled: rows.length <= 1,
                        title: "Remove label",
                        className: "absolute top-1 right-1 p-1 rounded-md bg-white/90 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity shadow-sm",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: `flex-1 flex flex-col justify-center ${row.align === "center" ? "items-center text-center" : "items-start text-left"}`, children: [
                      /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          inline: false,
                          value: row.line1,
                          onChange: (v) => updateRow(row.id, "line1", v),
                          placeholder: "Line 1",
                          className: `block w-full text-[13px] leading-tight ${row.bold_first ? "font-black" : "font-semibold"} text-slate-800 mb-1`
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          inline: false,
                          value: row.line2,
                          onChange: (v) => updateRow(row.id, "line2", v),
                          placeholder: "Line 2 (optional)",
                          className: "block w-full text-[11px] leading-tight text-slate-700 mt-1 mb-1"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        EditableText,
                        {
                          inline: false,
                          value: row.line3,
                          onChange: (v) => updateRow(row.id, "line3", v),
                          placeholder: "Line 3 (optional)",
                          className: "block w-full text-[10px] leading-tight text-slate-500 mt-1"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-100", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => updateRow(row.id, "align", "left"),
                            title: "Left align",
                            className: `p-1 rounded transition-colors ${row.align === "left" ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-slate-500"}`,
                            children: /* @__PURE__ */ jsx(AlignLeft, { size: 11 })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => updateRow(row.id, "align", "center"),
                            title: "Center align",
                            className: `p-1 rounded transition-colors ${row.align === "center" ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-slate-500"}`,
                            children: /* @__PURE__ */ jsx(AlignCenter, { size: 11 })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => updateRow(row.id, "bold_first", !row.bold_first),
                            title: "Bold first line",
                            className: `p-1 rounded transition-colors ${row.bold_first ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-slate-500"}`,
                            children: /* @__PURE__ */ jsx(Bold, { size: 11 })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", title: "Repeat this label N times", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase text-slate-300", children: "Qty" }),
                        /* @__PURE__ */ jsx(
                          EditableText,
                          {
                            as: "number",
                            min: "1",
                            max: maxRowQty,
                            value: row.qty,
                            onChange: (v) => updateRow(row.id, "qty", Math.max(1, Math.min(maxRowQty, Number(v) || 1))),
                            className: "text-[10px] font-mono w-7 text-right text-slate-500"
                          }
                        )
                      ] })
                    ] })
                  ]
                },
                row.id
              )),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: addRow,
                  disabled: rows.length >= maxRows,
                  className: "min-h-[92px] rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 16 }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold", children: "Add label" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 text-center mt-4", children: [
              rows.length,
              " / ",
              maxRows,
              " labels · ",
              totalLabelsPreview,
              " total with quantity & copies · click any line to edit"
            ] })
          ] })
        ),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 dark:text-slate-600 mt-4", children: 'This preview matches your downloaded PDF layout — click any label above to edit it. Print at 100% / "Actual size".' })
      ]
    }
  );
}
export {
  LabelSheetTool as default
};
