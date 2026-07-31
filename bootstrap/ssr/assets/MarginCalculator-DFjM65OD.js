import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef } from "react";
import { Calculator, AlertTriangle, TrendingUp, Table, ClipboardPaste, Trash2, Plus, Download } from "lucide-react";
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
const CURRENCIES = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "AU$",
  PKR: "Rs",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
  JPY: "¥"
};
function round2(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}
function marginFromCostPrice(cost, price) {
  if (!Number.isFinite(price) || price === 0) return null;
  return (price - cost) / price * 100;
}
function markupFromCostPrice(cost, price) {
  if (!Number.isFinite(cost) || cost === 0) return null;
  return (price - cost) / cost * 100;
}
function priceFromCostMargin(cost, margin) {
  if (margin === null || margin === void 0 || margin === "" || Number.isNaN(margin)) return null;
  const denom = 1 - margin / 100;
  if (denom === 0) return null;
  return cost / denom;
}
function priceFromCostMarkup(cost, markup) {
  if (markup === null || markup === void 0 || markup === "" || Number.isNaN(markup)) return null;
  return cost * (1 + markup / 100);
}
function costFromPriceMargin(price, margin) {
  if (margin === null || margin === void 0 || margin === "" || Number.isNaN(margin)) return null;
  return price * (1 - margin / 100);
}
function costFromPriceMarkup(price, markup) {
  if (markup === null || markup === void 0 || markup === "" || Number.isNaN(markup)) return null;
  const denom = 1 + markup / 100;
  if (denom === 0) return null;
  return price / denom;
}
const FAQS = [
  { q: "What's the difference between margin and markup?", a: "Margin is profit as a percentage of the selling price: (price − cost) ÷ price. Markup is profit as a percentage of the cost: (price − cost) ÷ cost. They use the same profit dollar amount but divide by a different base, so markup is always a bigger number than margin for the same sale (except at 0%). A 50% margin equals a 100% markup — not a 50% markup." },
  { q: "How do I calculate my profit margin?", a: "Subtract your cost from your selling price to get gross profit, then divide that by the selling price and multiply by 100. Example: sell price $100, cost $40 → profit $60 → margin = 60 ÷ 100 × 100 = 60%." },
  { q: "What's a good profit margin for retail?", a: 'It varies widely by category. General retail often runs 20–50% gross margin, grocery is much thinner (often single digits to ~15%), and specialty/apparel/jewelry can run 50–70%+. There is no universal "good" number — compare against your specific category and your fixed costs, not a rule of thumb.' },
  { q: "How do I price a product to hit a target margin?", a: "Use price = cost ÷ (1 − target margin ÷ 100). For a $40 cost and a 60% target margin: 40 ÷ (1 − 0.60) = 40 ÷ 0.40 = $100." },
  { q: "How do I price a product to hit a target markup?", a: "Use price = cost × (1 + target markup ÷ 100). For a $40 cost and a 150% target markup: 40 × (1 + 1.50) = 40 × 2.50 = $100." },
  { q: "Why can margin never reach 100%?", a: "Margin is profit divided by selling price. As cost approaches zero, margin approaches 100% but never gets there while price stays finite — and a 100% margin would mean the product had zero cost. Markup, by contrast, has no upper bound." }
];
function MarginCalculator({ toolGroups = [] }) {
  const [currency, setCurrency] = useState("USD");
  const [cost, setCost] = useState("40");
  const [price, setPrice] = useState("100");
  const [margin, setMargin] = useState("");
  const [markup, setMarkup] = useState("");
  const [lastEdited, setLastEdited] = useState(["cost", "price"]);
  const sym = CURRENCIES[currency] || currency;
  const setField = (field, raw) => {
    const next = [field, ...lastEdited.filter((f) => f !== field)].slice(0, 2);
    setLastEdited(next);
    if (field === "cost") setCost(raw);
    if (field === "price") setPrice(raw);
    if (field === "margin") setMargin(raw);
    if (field === "markup") setMarkup(raw);
  };
  const solved = useMemo(() => {
    const c = cost === "" ? null : parseFloat(cost);
    const p = price === "" ? null : parseFloat(price);
    const m = margin === "" ? null : parseFloat(margin);
    const mk = markup === "" ? null : parseFloat(markup);
    const has = (v) => v !== null && !Number.isNaN(v);
    const values = { cost: c, price: p, margin: m, markup: mk };
    const candidates = [...lastEdited, "cost", "price", "margin", "markup"];
    const drivers = [];
    for (const f of candidates) {
      if (has(values[f]) && !drivers.includes(f)) drivers.push(f);
      if (drivers.length === 2) break;
    }
    if (drivers.length < 2) {
      return { cost: c, price: p, margin: m, markup: mk, error: "Enter any two of cost, price, margin % or markup %." };
    }
    const pair = drivers.slice().sort().join("+");
    let outCost = c, outPrice = p, outMargin = m, outMarkup = mk, error = null;
    try {
      switch (pair) {
        case "cost+price": {
          if (p === 0) {
            error = "Selling price cannot be $0 — margin is undefined.";
            break;
          }
          outMargin = marginFromCostPrice(c, p);
          outMarkup = c === 0 ? null : markupFromCostPrice(c, p);
          if (c === 0) error = "Cost is $0 — markup is undefined (division by zero), margin shown assumes 100% profit.";
          break;
        }
        case "cost+margin": {
          if (m >= 100) {
            error = "Margin must be below 100% — at 100% the implied price is infinite.";
            break;
          }
          outPrice = priceFromCostMargin(c, m);
          outMarkup = outPrice != null && c !== 0 ? markupFromCostPrice(c, outPrice) : c === 0 ? null : outMarkup;
          if (c === 0) {
            outMarkup = null;
          }
          break;
        }
        case "cost+markup": {
          if (mk <= -100) {
            error = "Markup must be above -100%.";
            break;
          }
          outPrice = priceFromCostMarkup(c, mk);
          outMargin = outPrice != null ? marginFromCostPrice(c, outPrice) : outMargin;
          break;
        }
        case "margin+price": {
          if (m >= 100) {
            error = "Margin must be below 100%.";
            break;
          }
          outCost = costFromPriceMargin(p, m);
          outMarkup = outCost != null && outCost !== 0 ? markupFromCostPrice(outCost, p) : null;
          break;
        }
        case "markup+price": {
          outCost = costFromPriceMarkup(p, mk);
          outMargin = outCost != null ? marginFromCostPrice(outCost, p) : outMargin;
          break;
        }
        case "margin+markup": {
          error = "Margin % and markup % alone can't determine a dollar price — enter a cost or price too.";
          break;
        }
        default:
          error = "Enter any two of cost, price, margin % or markup %.";
      }
    } catch (e) {
      error = "Could not solve with those values.";
    }
    return { cost: outCost, price: outPrice, margin: outMargin, markup: outMarkup, error, drivers };
  }, [cost, price, margin, markup, lastEdited]);
  const fmtMoney = (v) => v === null || v === void 0 || Number.isNaN(v) || !Number.isFinite(v) ? "—" : `${sym}${round2(v).toFixed(2)}`;
  const fmtPct = (v) => v === null || v === void 0 || Number.isNaN(v) || !Number.isFinite(v) ? "—" : `${round2(v).toFixed(2)}%`;
  const [tCost, setTCost] = useState("40");
  const [tMarginTarget, setTMarginTarget] = useState("50");
  const [tMarkupTarget, setTMarkupTarget] = useState("100");
  const targetByMargin = useMemo(() => {
    const c = parseFloat(tCost);
    const m = parseFloat(tMarginTarget);
    if (!Number.isFinite(c) || !Number.isFinite(m)) return { error: "Enter a cost and target margin %." };
    if (m >= 100) return { error: "Margin must be below 100%." };
    const p = priceFromCostMargin(c, m);
    return { price: p, profit: p !== null ? p - c : null };
  }, [tCost, tMarginTarget]);
  const targetByMarkup = useMemo(() => {
    const c = parseFloat(tCost);
    const mk = parseFloat(tMarkupTarget);
    if (!Number.isFinite(c) || !Number.isFinite(mk)) return { error: "Enter a cost and target markup %." };
    if (mk <= -100) return { error: "Markup must be above -100%." };
    const p = priceFromCostMarkup(c, mk);
    return { price: p, profit: p !== null ? p - c : null };
  }, [tCost, tMarkupTarget]);
  const [rows, setRows] = useState([
    { name: "Product A", cost: "40", price: "100" },
    { name: "Product B", cost: "12.50", price: "19.99" }
  ]);
  const [bulkPaste, setBulkPaste] = useState("");
  const pasteRef = useRef(null);
  const updateRow = (i, field, val) => {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  };
  const addRow = () => setRows((r) => [...r, { name: "", cost: "", price: "" }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const parseBulk = () => {
    const lines = bulkPaste.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { name: parts[0] || "", cost: parts[1] || "", price: parts[2] || "" };
    }).filter((r) => r.name);
    if (parsed.length) {
      setRows((r) => [...r, ...parsed]);
      setBulkPaste("");
    }
  };
  const bulkResults = useMemo(() => {
    return rows.map((row) => {
      const c = parseFloat(row.cost);
      const p = parseFloat(row.price);
      const validCost = Number.isFinite(c);
      const validPrice = Number.isFinite(p) && p !== 0;
      const m = validCost && validPrice ? marginFromCostPrice(c, p) : null;
      const mk = validCost && c !== 0 && validPrice ? markupFromCostPrice(c, p) : null;
      const profit = validCost && Number.isFinite(p) ? p - c : null;
      let note = null;
      if (!validCost || !Number.isFinite(p)) note = "Enter cost and price";
      else if (p === 0) note = "Price is $0 — margin undefined";
      else if (c === 0) note = "Cost is $0 — markup undefined";
      return { ...row, marginPct: m, markupPct: mk, profit, note };
    });
  }, [rows]);
  const exportCsv = () => {
    const header = ["Product", "Cost", "Price", "Profit", "Margin %", "Markup %"];
    const lines = [header.join(",")];
    bulkResults.forEach((r) => {
      lines.push([
        `"${(r.name || "").replace(/"/g, '""')}"`,
        r.cost || "",
        r.price || "",
        r.profit !== null ? round2(r.profit) : "",
        r.marginPct !== null ? round2(r.marginPct) : "",
        r.markupPct !== null ? round2(r.markupPct) : ""
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "margin-markup-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-400/60 transition-colors";
  const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const currencyOptions = Object.entries(CURRENCIES).map(([code, symbol]) => ({
    value: code,
    label: `${code} (${symbol})`
  }));
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Profit Margin & Markup Calculator | VenQore",
      metaDescription: "Solve cost, price, margin % and markup % instantly — enter any two and the rest are calculated live. Plus bulk CSV mode and CSV export. Free, no signup.",
      eyebrow: "Free Tool",
      h1: "Profit Margin & Markup Calculator",
      answer: "Enter any two of cost, selling price, margin % or markup % and the calculator solves the other two instantly, using the standard retail formulas: margin = (price − cost) ÷ price, markup = (price − cost) ÷ cost. Includes target-price modes, a bulk table for pricing a whole product list, and CSV export — all entirely in your browser, free, no signup.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "margin-calculator",
      cta: {
        headline: "Pricing a whole catalogue by hand doesn't scale.",
        subtext: "VenQore tracks landed cost per unit automatically and reports margin on every sale — no spreadsheet required."
      },
      related: [{ label: "Barcode Generator", href: "/tools/barcode-generator" }, { label: "Invoice Generator", href: "/tools/invoice-generator" }],
      children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Calculator, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Solve any two" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Type into any two fields — cost, price, margin % or markup % — and the other two update live." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5 max-w-[220px]", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Currency" }),
            /* @__PURE__ */ jsx(Select, { value: currency, onChange: setCurrency, options: currencyOptions })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Cost" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: cost, onChange: (e) => setField("cost", e.target.value), className: `${inputCls} pl-8`, placeholder: "0.00" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Selling price" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: price, onChange: (e) => setField("price", e.target.value), className: `${inputCls} pl-8`, placeholder: "0.00" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Margin %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: margin, onChange: (e) => setField("margin", e.target.value), className: `${inputCls} pr-8`, placeholder: "—" }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Markup %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: markup, onChange: (e) => setField("markup", e.target.value), className: `${inputCls} pr-8`, placeholder: "—" }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "%" })
              ] })
            ] })
          ] }),
          solved.error && /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-700 dark:text-amber-300", children: solved.error })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
            ["Cost", fmtMoney(solved.cost)],
            ["Price", fmtMoney(solved.price)],
            ["Margin", fmtPct(solved.margin)],
            ["Markup", fmtPct(solved.markup)]
          ].map(([label, val]) => /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: label }),
            /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: val })
          ] }, label)) }),
          Number.isFinite(parseFloat(solved.cost)) && Number.isFinite(parseFloat(solved.price)) && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: [
            "Profit per unit: ",
            /* @__PURE__ */ jsx("strong", { className: "text-slate-600 dark:text-slate-300", children: fmtMoney(parseFloat(solved.price) - parseFloat(solved.cost)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Price to hit a target" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Give a cost and a goal, get the price that hits it exactly." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5 max-w-xs", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Cost" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: tCost, onChange: (e) => setTCost(e.target.value), className: `${inputCls} pl-8` })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Target margin %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mb-3", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: tMarginTarget, onChange: (e) => setTMarginTarget(e.target.value), className: `${inputCls} pr-8` }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "%" })
              ] }),
              targetByMargin.error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 dark:text-amber-400", children: targetByMargin.error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Suggested price" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: fmtMoney(targetByMargin.price) }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 dark:text-slate-500 mt-1", children: [
                  "Profit per unit: ",
                  fmtMoney(targetByMargin.profit)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Target markup %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative mb-3", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: tMarkupTarget, onChange: (e) => setTMarkupTarget(e.target.value), className: `${inputCls} pr-8` }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "%" })
              ] }),
              targetByMarkup.error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 dark:text-amber-400", children: targetByMarkup.error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Suggested price" }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: fmtMoney(targetByMarkup.price) }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 dark:text-slate-500 mt-1", children: [
                  "Profit per unit: ",
                  fmtMoney(targetByMarkup.profit)
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Table, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Bulk mode" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Price a whole product list at once, then export the results as CSV." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Paste rows (name,cost,price — one per line)" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  ref: pasteRef,
                  value: bulkPaste,
                  onChange: (e) => setBulkPaste(e.target.value),
                  rows: 2,
                  placeholder: "Blue T-Shirt,8.00,19.99\nCoffee Mug,3.50,9.99",
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
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-900/[0.03] dark:bg-white/[0.04] text-left", children: ["Product", "Cost", "Price", "Profit", "Margin %", "Markup %", ""].map((h) => /* @__PURE__ */ jsx("th", { className: "px-3 py-2.5 font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: bulkResults.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-900/[0.06] dark:border-white/[0.06]", children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("input", { value: r.name, onChange: (e) => updateRow(i, "name", e.target.value), className: `${inputCls} py-1.5`, placeholder: "Product name" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-28", children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: r.cost, onChange: (e) => updateRow(i, "cost", e.target.value), className: `${inputCls} py-1.5` }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-28", children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: r.price, onChange: (e) => updateRow(i, "price", e.target.value), className: `${inputCls} py-1.5` }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: fmtMoney(r.profit) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: r.note ? /* @__PURE__ */ jsx("span", { className: "text-amber-600 dark:text-amber-400 text-xs", children: r.note }) : fmtPct(r.marginPct) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: r.note ? "—" : fmtPct(r.markupPct) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("button", { onClick: () => removeRow(i), className: "text-slate-400 hover:text-red-500 transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }) })
            ] }, i)) })
          ] }) }),
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
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "Margin vs. markup — what's the difference?" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4", children: [
            "Both describe the same profit in dollars, but they divide it by a different number. ",
            /* @__PURE__ */ jsx("strong", { children: "Margin" }),
            " divides profit by the ",
            /* @__PURE__ */ jsx("em", { children: "selling price" }),
            ": it tells you what share of each sales dollar is profit. ",
            /* @__PURE__ */ jsx("strong", { children: "Markup" }),
            " ",
            "divides profit by the ",
            /* @__PURE__ */ jsx("em", { children: "cost" }),
            ": it tells you how much you added on top of what you paid. Because the selling price is always higher than the cost (assuming you're profitable), markup is always the larger percentage of the two."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4 mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Margin formula" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-sm text-indigo-600 dark:text-indigo-300", children: "margin % = (price − cost) ÷ price × 100" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Markup formula" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-sm text-indigo-600 dark:text-indigo-300", children: "markup % = (price − cost) ÷ cost × 100" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/10 border border-indigo-500/20 mb-6", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-2", children: "Worked example" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed", children: [
              "Say a product costs you ",
              /* @__PURE__ */ jsx("strong", { children: "$40" }),
              " and you sell it for ",
              /* @__PURE__ */ jsx("strong", { children: "$100" }),
              ". Your gross profit is",
              " ",
              /* @__PURE__ */ jsx("strong", { children: "$60" }),
              " either way. As a ",
              /* @__PURE__ */ jsx("strong", { children: "margin" }),
              ", that's $60 ÷ $100 = ",
              /* @__PURE__ */ jsx("strong", { children: "60%" }),
              " — 60% of every sales dollar is profit. As a ",
              /* @__PURE__ */ jsx("strong", { children: "markup" }),
              ", that's $60 ÷ $40 = ",
              /* @__PURE__ */ jsx("strong", { children: "150%" }),
              " — you sold it for 150% more than you paid for it. Same sale, same $60 profit, two very different-looking percentages: 60% margin equals 150% markup, not the same number."
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: `A common mix-up: pricing off a "50% markup" when you actually meant a 50% margin. A 50% markup on a $40 cost gives a $60 price (50% margin instead would need a $80 price). Mixing the two up systematically under-prices inventory — always double check which one you're quoting before you set shelf prices.` })
        ] })
      ]
    }
  );
}
export {
  MarginCalculator as default
};
