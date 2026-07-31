import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Shield, Boxes, Package, PiggyBank, RefreshCw } from "lucide-react";
import ToolShell from "./ToolShell-BE5CpfRw.js";
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
const num = (v) => {
  if (v === "" || v === null || v === void 0) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const FAQS = [
  { q: "What is a good inventory turnover rate?", a: "It varies heavily by category — grocery and perishables often turn 15-25+ times a year, general retail is commonly in the 4-8 range, and slow-moving categories like furniture or jewelry may turn only 2-4 times a year. There is no single universal target: compare your turnover against your own category history and similar retailers, not an arbitrary number. Very high turnover can also signal you are understocked and losing sales to stockouts, so faster is not automatically better." },
  { q: "How do I calculate safety stock?", a: "The simple method is: Safety Stock = (Maximum Daily Sales × Maximum Lead Time Days) − (Average Daily Sales × Average Lead Time Days). It compares your worst-case demand-during-lead-time against your average case, and the gap is the buffer stock you should hold. More statistically rigorous methods exist that use the standard deviation of demand and lead time combined with a service-level Z-score, but the simple method is far easier to use with data most small retailers already have (max/average daily sales and lead times) and is a reasonable starting point." },
  { q: "What is GMROI and why does it matter?", a: 'GMROI (Gross Margin Return on Inventory Investment) measures how many dollars of gross margin you earn per dollar tied up in inventory: GMROI = Gross Margin ($) ÷ Average Inventory Cost Value ($). A GMROI above 1.0 generally means the inventory investment is being recovered with some profit on top; higher is generally better. What counts as "good" varies a lot by industry — a jeweler and a grocer will have very different healthy GMROI ranges — so use it to track your own trend over time and compare within your category, not against a universal benchmark.' },
  { q: "How do I calculate reorder point?", a: "Reorder Point = (Average Daily Sales × Supplier Lead Time in Days) + Safety Stock. It is the stock level at which you should place a new purchase order so the replenishment arrives before you run out. Example: 20 units/day average sales, a 7-day lead time, and 30 units of safety stock gives a reorder point of (20 × 7) + 30 = 170 units — reorder when on-hand stock reaches 170." }
];
function InventoryHealth({ toolGroups = [] }) {
  const [currency, setCurrency] = useState("USD");
  const sym = CURRENCIES[currency] || currency;
  const currencyOptions = Object.entries(CURRENCIES).map(([code, symbol]) => ({ value: code, label: `${code} (${symbol})` }));
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-400/60 transition-colors";
  const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const cardCls = "rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7";
  const resultCardCls = "p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10 text-center";
  const fmtNum = (v, digits = 0) => v === null || v === void 0 || !Number.isFinite(v) ? "—" : v.toLocaleString(void 0, { maximumFractionDigits: digits });
  const fmtMoney = (v) => v === null || v === void 0 || !Number.isFinite(v) ? "—" : `${sym}${round2(v).toFixed(2)}`;
  const [maxDailySales, setMaxDailySales] = useState("35");
  const [maxLeadTime, setMaxLeadTime] = useState("10");
  const [ssAvgDailySales, setSsAvgDailySales] = useState("20");
  const [ssAvgLeadTime, setSsAvgLeadTime] = useState("7");
  const safetyStock = useMemo(() => {
    const mds = num(maxDailySales), mlt = num(maxLeadTime), ads = num(ssAvgDailySales), alt = num(ssAvgLeadTime);
    if (mds === null || mlt === null || ads === null || alt === null) return { value: null, error: "Enter all four values." };
    const value = mds * mlt - ads * alt;
    return { value, error: value < 0 ? 'Result is negative — your "max" inputs are lower than your average inputs; safety stock cannot be below zero, so treat it as 0.' : null };
  }, [maxDailySales, maxLeadTime, ssAvgDailySales, ssAvgLeadTime]);
  const safetyStockClamped = safetyStock.value !== null ? Math.max(0, safetyStock.value) : null;
  const [avgDailySales, setAvgDailySales] = useState("20");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [safetyStockInput, setSafetyStockInput] = useState("30");
  const [useComputedSafetyStock, setUseComputedSafetyStock] = useState(false);
  const effectiveSafetyStock = useComputedSafetyStock ? safetyStockClamped : num(safetyStockInput);
  const reorderPoint = useMemo(() => {
    const ads = num(avgDailySales), lt = num(leadTimeDays);
    if (ads === null || lt === null || effectiveSafetyStock === null) return { value: null };
    return { value: ads * lt + effectiveSafetyStock };
  }, [avgDailySales, leadTimeDays, effectiveSafetyStock]);
  const [annualDemand, setAnnualDemand] = useState("5000");
  const [orderCost, setOrderCost] = useState("50");
  const [holdingCost, setHoldingCost] = useState("2");
  const eoq = useMemo(() => {
    const d = num(annualDemand), s = num(orderCost), h = num(holdingCost);
    if (d === null || s === null || h === null || h <= 0 || d < 0 || s < 0) return { value: null, error: h !== null && h <= 0 ? "Holding cost per unit must be greater than 0." : "Enter annual demand, order cost and holding cost." };
    return { value: Math.sqrt(2 * d * s / h), error: null };
  }, [annualDemand, orderCost, holdingCost]);
  const [gmroiMode, setGmroiMode] = useState("direct");
  const [grossMarginDirect, setGrossMarginDirect] = useState("45000");
  const [netSales, setNetSales] = useState("100000");
  const [cogsForGm, setCogsForGm] = useState("55000");
  const [avgInventoryCostGmroi, setAvgInventoryCostGmroi] = useState("18000");
  const gmroi = useMemo(() => {
    const inv = num(avgInventoryCostGmroi);
    if (inv === null || inv <= 0) return { value: null, grossMargin: null, error: "Enter average inventory cost value greater than 0." };
    let gm;
    if (gmroiMode === "direct") {
      gm = num(grossMarginDirect);
    } else {
      const ns = num(netSales), c = num(cogsForGm);
      gm = ns === null || c === null ? null : ns - c;
    }
    if (gm === null) return { value: null, grossMargin: null, error: "Enter gross margin (or net sales and COGS)." };
    return { value: gm / inv, grossMargin: gm, error: null };
  }, [gmroiMode, grossMarginDirect, netSales, cogsForGm, avgInventoryCostGmroi]);
  const [cogsTurnover, setCogsTurnover] = useState("120000");
  const [avgInventoryValueTurnover, setAvgInventoryValueTurnover] = useState("20000");
  const turnover = useMemo(() => {
    const c = num(cogsTurnover), inv = num(avgInventoryValueTurnover);
    if (c === null || inv === null || inv <= 0) return { turns: null, days: null, error: "Enter COGS and an average inventory value greater than 0." };
    const turns = c / inv;
    const days = turns > 0 ? 365 / turns : null;
    return { turns, days, error: null };
  }, [cogsTurnover, avgInventoryValueTurnover]);
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Inventory Health Toolkit | Reorder Point, Safety Stock, EOQ, GMROI, Turnover | VenQore",
      metaDescription: "Five standard retail inventory formulas in one free calculator: reorder point, safety stock, economic order quantity (EOQ), GMROI and inventory turnover. Live results, no signup.",
      eyebrow: "Free Tool",
      h1: "Inventory Health Toolkit",
      answer: "Five standard inventory-management calculations in one place — reorder point, safety stock, economic order quantity (EOQ), GMROI, and inventory turnover — each with live results as you type. Enter your own numbers and each calculator shows the formula result plus a plain-English explanation of what it means. Free, entirely in your browser, no signup.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "inventory-health",
      cta: {
        headline: "Reorder points and safety stock shouldn't live in a spreadsheet.",
        subtext: "VenQore tracks FIFO stock levels per warehouse and can alert you automatically when a product crosses its reorder point."
      },
      related: [{ label: "Stock Count Sheet", href: "/tools/stock-count-sheet" }, { label: "Margin Calculator", href: "/tools/margin-calculator" }],
      children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 max-w-[220px]", children: [
          /* @__PURE__ */ jsx("label", { className: labelCls, children: "Currency" }),
          /* @__PURE__ */ jsx(Select, { value: currency, onChange: setCurrency, options: currencyOptions })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: cardCls, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Shield, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Safety Stock" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Simple method: buffer stock = worst-case demand-during-lead-time minus average demand-during-lead-time." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Max daily sales (units)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: maxDailySales, onChange: (e) => setMaxDailySales(e.target.value), className: inputCls, placeholder: "35" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Max lead time (days)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: maxLeadTime, onChange: (e) => setMaxLeadTime(e.target.value), className: inputCls, placeholder: "10" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average daily sales (units)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: ssAvgDailySales, onChange: (e) => setSsAvgDailySales(e.target.value), className: inputCls, placeholder: "20" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average lead time (days)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: ssAvgLeadTime, onChange: (e) => setSsAvgLeadTime(e.target.value), className: inputCls, placeholder: "7" })
            ] })
          ] }),
          safetyStock.error && /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-amber-600 dark:text-amber-400", children: safetyStock.error }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Safety Stock" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: [
                fmtNum(safetyStockClamped),
                " units"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: "This is the buffer stock to hold on top of expected demand so a slower delivery or a sales spike doesn't cause a stockout." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-5 leading-relaxed", children: "Note: this simple method is easy to use with numbers most small retailers already track. A more statistically rigorous approach uses the standard deviation of daily demand and lead time combined with a service-level Z-score (e.g. 1.65 for 95% service level) — that method exists and is worth knowing about, but it needs more historical data than most small retailers have on hand, so this tool intentionally keeps to the simple method for usability." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `${cardCls} mt-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Boxes, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Reorder Point" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "The stock level that should trigger a new purchase order." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average daily sales (units)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: avgDailySales, onChange: (e) => setAvgDailySales(e.target.value), className: inputCls, placeholder: "20" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Supplier lead time (days)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: leadTimeDays, onChange: (e) => setLeadTimeDays(e.target.value), className: inputCls, placeholder: "7" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Safety stock (units)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  value: safetyStockInput,
                  onChange: (e) => setSafetyStockInput(e.target.value),
                  disabled: useComputedSafetyStock,
                  className: `${inputCls} ${useComputedSafetyStock ? "opacity-50 cursor-not-allowed" : ""}`,
                  placeholder: "30"
                }
              ),
              /* @__PURE__ */ jsxs("label", { className: "mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer", children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: useComputedSafetyStock, onChange: (e) => setUseComputedSafetyStock(e.target.checked), className: "rounded" }),
                "Use the safety stock computed above (",
                fmtNum(safetyStockClamped),
                " units) instead"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Reorder Point" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: [
                fmtNum(reorderPoint.value),
                " units"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: "Reorder when stock hits this level to avoid running out before the next delivery arrives." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `${cardCls} mt-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Package, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Economic Order Quantity (EOQ)" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "The order size that minimizes total ordering + holding cost." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Annual demand (units/year)" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "1", value: annualDemand, onChange: (e) => setAnnualDemand(e.target.value), className: inputCls, placeholder: "5000" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Cost per order" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: orderCost, onChange: (e) => setOrderCost(e.target.value), className: `${inputCls} pl-8`, placeholder: "50" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Annual holding cost / unit" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: holdingCost, onChange: (e) => setHoldingCost(e.target.value), className: `${inputCls} pl-8`, placeholder: "2" })
              ] })
            ] })
          ] }),
          eoq.error && /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-amber-600 dark:text-amber-400", children: eoq.error }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Optimal Order Quantity" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: [
                fmtNum(eoq.value),
                " units"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: "This is the order size that minimizes the combined total of ordering costs (placing more orders costs more in fixed fees) and holding costs (carrying more inventory costs more in storage, capital and shrinkage risk)." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `${cardCls} mt-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(PiggyBank, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "GMROI" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Gross Margin Return on Inventory Investment — dollars of margin per dollar tied up in stock." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-5 flex gap-2", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setGmroiMode("direct"), className: `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${gmroiMode === "direct" ? "bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300" : "bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400"}`, children: "Enter gross margin $" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setGmroiMode("salesCogs"), className: `px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${gmroiMode === "salesCogs" ? "bg-indigo-500/15 border border-indigo-400/40 text-indigo-600 dark:text-indigo-300" : "bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400"}`, children: "Compute from sales − COGS" })
          ] }),
          gmroiMode === "direct" ? /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Gross margin ($)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: grossMarginDirect, onChange: (e) => setGrossMarginDirect(e.target.value), className: `${inputCls} pl-8`, placeholder: "45000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average inventory cost value ($)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: avgInventoryCostGmroi, onChange: (e) => setAvgInventoryCostGmroi(e.target.value), className: `${inputCls} pl-8`, placeholder: "18000" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Net sales ($)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: netSales, onChange: (e) => setNetSales(e.target.value), className: `${inputCls} pl-8`, placeholder: "100000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "COGS ($)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: cogsForGm, onChange: (e) => setCogsForGm(e.target.value), className: `${inputCls} pl-8`, placeholder: "55000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average inventory cost value ($)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: avgInventoryCostGmroi, onChange: (e) => setAvgInventoryCostGmroi(e.target.value), className: `${inputCls} pl-8`, placeholder: "18000" })
              ] })
            ] })
          ] }),
          gmroi.error && /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-amber-600 dark:text-amber-400", children: gmroi.error }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Gross Margin" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: fmtMoney(gmroi.grossMargin) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "GMROI" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: gmroi.value !== null && Number.isFinite(gmroi.value) ? round2(gmroi.value).toFixed(2) : "—" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: 'A GMROI above 1.0 generally means the inventory investment is being recovered with some profit on top, and higher is generally better — but "good" varies a lot by industry, so track your own trend rather than chasing a universal number.' })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `${cardCls} mt-6`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(RefreshCw, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Inventory Turnover" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "How many times inventory is sold and replaced over a period, and the equivalent days of stock on hand." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Cost of goods sold (period)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: cogsTurnover, onChange: (e) => setCogsTurnover(e.target.value), className: `${inputCls} pl-8`, placeholder: "120000" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average inventory value (period)" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: sym }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: avgInventoryValueTurnover, onChange: (e) => setAvgInventoryValueTurnover(e.target.value), className: `${inputCls} pl-8`, placeholder: "20000" })
              ] })
            ] })
          ] }),
          turnover.error && /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-amber-600 dark:text-amber-400", children: turnover.error }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Turnover Ratio" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: turnover.turns !== null ? `${round2(turnover.turns).toFixed(2)}×` : "—" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: resultCardCls, children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1", children: "Days of Inventory" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-900 dark:text-white", children: [
                turnover.days !== null ? fmtNum(round2(turnover.days), 1) : "—",
                " days"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-600 mt-3 text-center", children: "These are two views of the same number: turnover says how many times stock cycles per year, days of inventory says how many days of sales you're carrying on the shelf right now — a lower days figure means cash is tied up for less time." })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "How these five numbers fit together" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4", children: [
            "These metrics are not independent — each one feeds into or explains another. ",
            /* @__PURE__ */ jsx("strong", { children: "Supplier lead time" }),
            " is the starting point: it tells you how long you'll be waiting for a new order to arrive, and it drives both",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "safety stock" }),
            " (the buffer against demand or delivery variability during that wait) and",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "reorder point" }),
            " (the stock level that should trigger the next order, combining expected sales during the lead time with that safety buffer). ",
            /* @__PURE__ */ jsx("strong", { children: "EOQ" }),
            " answers a different question — not *when* to reorder, but",
            " ",
            /* @__PURE__ */ jsx("em", { children: "how much" }),
            " to order each time to minimize the combined cost of placing orders and holding stock.",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "GMROI" }),
            " and ",
            /* @__PURE__ */ jsx("strong", { children: "inventory turnover" }),
            ' both look backward at how efficiently capital tied up in inventory is being used — turnover in units of "times sold through," GMROI in dollars of margin earned per dollar invested. A retailer with a healthy reorder-point and EOQ setup should, over time, see that reflected in stronger turnover and GMROI, because stock is neither sitting too long (tying up cash, risking spoilage or obsolescence) nor running out (losing sales and reputation).'
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4 mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Reorder Point" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-300", children: "ROP = (Avg Daily Sales × Lead Time Days) + Safety Stock" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Safety Stock (simple method)" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-300", children: "SS = (Max Daily Sales × Max Lead Time) − (Avg Daily Sales × Avg Lead Time)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Economic Order Quantity" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-300", children: "EOQ = √((2 × Annual Demand × Order Cost) ÷ Holding Cost per Unit)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "GMROI" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-300", children: "GMROI = Gross Margin ($) ÷ Average Inventory Cost Value ($)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 sm:col-span-2", children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-1", children: "Inventory Turnover & Days of Inventory" }),
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-300", children: "Turnover = COGS ÷ Average Inventory Value  ·  Days of Inventory = 365 ÷ Turnover" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/10 border border-indigo-500/20 mb-6", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-2", children: "Worked example — reorder point and safety stock together" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed", children: [
              "Suppose a product sells an average of ",
              /* @__PURE__ */ jsx("strong", { children: "20 units/day" }),
              ", but on its busiest days sells",
              " ",
              /* @__PURE__ */ jsx("strong", { children: "35 units/day" }),
              ". The supplier usually takes ",
              /* @__PURE__ */ jsx("strong", { children: "7 days" }),
              " to deliver, but can occasionally take up to ",
              /* @__PURE__ */ jsx("strong", { children: "10 days" }),
              ". Safety stock = (35 × 10) − (20 × 7) = 350 − 140 = ",
              /* @__PURE__ */ jsx("strong", { children: "210 units" }),
              ". Reorder point = (20 × 7) + 210 = 140 + 210 = ",
              /* @__PURE__ */ jsx("strong", { children: "350 units" }),
              " — reorder when on-hand stock reaches 350 to stay covered even if a delivery is slow and demand spikes at the same time."
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: "Why this matters for a small retailer: without a reorder point, restocking decisions become guesswork — either too reactive (stockouts, lost sales, unhappy customers) or too cautious (excess cash tied up in slow-moving stock, higher shrinkage and obsolescence risk). EOQ then refines *how much* to order once you've decided *when* to order, balancing the fixed cost of placing an order against the ongoing cost of holding inventory. Finally, GMROI and turnover are the scorecards — they tell you, after the fact, whether your reorder and order-quantity decisions actually turned into efficient use of the cash tied up on your shelves." })
        ] })
      ]
    }
  );
}
export {
  InventoryHealth as default
};
