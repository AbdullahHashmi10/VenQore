import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Calculator, DollarSign, Clock, ShieldCheck, TrendingUp, Download, FileText, CheckCircle2 } from "lucide-react";
import ToolShell from "./ToolShell-zAP3LLHC.js";
import Select from "./Select-BvHKwZfu.js";
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
const FAQS = [
  {
    q: "How do I calculate ROI on a POS system?",
    a: "Add up what the new system actually saves you each month — typically reduced inventory shrinkage/leakage from better stock tracking, plus staff or owner hours saved on manual checkout, stock counting, and reconciliation — then subtract the software subscription fee. Divide your upfront hardware/setup cost by that net monthly benefit to get your payback period in months."
  },
  {
    q: "What hidden costs does a POS system eliminate?",
    a: "The two biggest eliminated costs are inventory shrinkage (theft, spoilage, vendor short-ships, and unrecorded cashier mistakes) and wasted labor hours spent manually reconciling registers, taking physical stock counts with pencil and paper, and building spreadsheets."
  },
  {
    q: "How long does it take a POS system to pay for itself?",
    a: "Most retail and food businesses recover their hardware and software investment within 2 to 6 months. High-volume businesses with high inventory shrinkage often achieve full hardware payback in under 60 days."
  },
  {
    q: "Is this calculator biased toward showing a positive result?",
    a: "No — it is built with fully transparent, editable formulas. If your monthly revenue or staff hourly rate is set low, or your hardware cost is set high, the calculator will accurately show a negative ROI or a longer payback period."
  },
  {
    q: "Is this calculator free?",
    a: "Yes. Every calculation runs 100% in your browser. No registration, no email address, and no server roundtrips required."
  }
];
function fmtMoney(amount, sym) {
  if (!Number.isFinite(amount)) return `${sym}0.00`;
  const isNeg = amount < 0;
  const absVal = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNeg ? `-${sym}${absVal}` : `${sym}${absVal}`;
}
function PosRoiCalculator({ toolGroups = [] }) {
  const [currency, setCurrency] = useState("USD");
  const sym = CURRENCIES[currency] || "$";
  const [monthlyRevenue, setMonthlyRevenue] = useState("45000");
  const [checkoutHoursPerWeek, setCheckoutHoursPerWeek] = useState("25");
  const [stockCountHoursPerMonth, setStockCountHoursPerMonth] = useState("16");
  const [hourlyStaffRate, setHourlyStaffRate] = useState("18");
  const [hardwareCost, setHardwareCost] = useState("1200");
  const [softwareSubMonthly, setSoftwareSubMonthly] = useState("79");
  const [shrinkageRatePercent, setShrinkageRatePercent] = useState("2.5");
  const [shrinkageReductionPercent, setShrinkageReductionPercent] = useState("45");
  const [timeSavingsPercent, setTimeSavingsPercent] = useState("35");
  const numRev = parseFloat(monthlyRevenue) || 0;
  const numCheckoutHrs = parseFloat(checkoutHoursPerWeek) || 0;
  const numStockHrs = parseFloat(stockCountHoursPerMonth) || 0;
  const numHourlyRate = parseFloat(hourlyStaffRate) || 0;
  const numHwCost = parseFloat(hardwareCost) || 0;
  const numSwSub = parseFloat(softwareSubMonthly) || 0;
  const numShrinkPct = parseFloat(shrinkageRatePercent) || 0;
  const numShrinkRedPct = parseFloat(shrinkageReductionPercent) || 0;
  const numTimeSavePct = parseFloat(timeSavingsPercent) || 0;
  const metrics = useMemo(() => {
    const monthlyCheckoutHrs = numCheckoutHrs * 4.3333;
    const totalMonthlyManualHrs = monthlyCheckoutHrs + numStockHrs;
    const monthlyHrsSaved = totalMonthlyManualHrs * (numTimeSavePct / 100);
    const monthlyLaborSavings = monthlyHrsSaved * numHourlyRate;
    const currentMonthlyShrinkage = numRev * (numShrinkPct / 100);
    const monthlyShrinkageSavings = currentMonthlyShrinkage * (numShrinkRedPct / 100);
    const grossMonthlySavings = monthlyLaborSavings + monthlyShrinkageSavings;
    const netMonthlySavings = grossMonthlySavings - numSwSub;
    let paybackMonths = null;
    if (numHwCost <= 0) {
      paybackMonths = 0;
    } else if (netMonthlySavings > 0) {
      paybackMonths = numHwCost / netMonthlySavings;
    }
    const totalInvestmentY1 = numHwCost + numSwSub * 12;
    const grossSavingsY1 = grossMonthlySavings * 12;
    const netSavingsY1 = grossSavingsY1 - totalInvestmentY1;
    const roiPercentY1 = totalInvestmentY1 > 0 ? netSavingsY1 / totalInvestmentY1 * 100 : 0;
    const totalInvestmentY3 = numHwCost + numSwSub * 36;
    const grossSavingsY3 = grossMonthlySavings * 36;
    const netSavingsY3 = grossSavingsY3 - totalInvestmentY3;
    const roiPercentY3 = totalInvestmentY3 > 0 ? netSavingsY3 / totalInvestmentY3 * 100 : 0;
    return {
      totalMonthlyManualHrs,
      monthlyHrsSaved,
      monthlyLaborSavings,
      currentMonthlyShrinkage,
      monthlyShrinkageSavings,
      grossMonthlySavings,
      netMonthlySavings,
      paybackMonths,
      totalInvestmentY1,
      netSavingsY1,
      roiPercentY1,
      totalInvestmentY3,
      netSavingsY3,
      roiPercentY3
    };
  }, [numRev, numCheckoutHrs, numStockHrs, numHourlyRate, numHwCost, numSwSub, numShrinkPct, numShrinkRedPct, numTimeSavePct]);
  const handleDownloadCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Currency", currency],
      ["Monthly Revenue", `${sym}${numRev}`],
      ["Checkout & Register Hours / Week", numCheckoutHrs],
      ["Stock Count & Admin Hours / Month", numStockHrs],
      ["Hourly Staff / Owner Rate", `${sym}${numHourlyRate}`],
      ["Hardware & Setup Upfront Cost", `${sym}${numHwCost}`],
      ["Monthly Software Fee", `${sym}${numSwSub}`],
      ["Estimated Stock Shrinkage %", `${numShrinkPct}%`],
      ["Estimated Shrinkage Reduction %", `${numShrinkRedPct}%`],
      ["Estimated Time Savings %", `${numTimeSavePct}%`],
      ["--- OUTPUTS ---", "---"],
      ["Monthly Time Saved (Hours)", metrics.monthlyHrsSaved.toFixed(1)],
      ["Monthly Labor Savings ($)", metrics.monthlyLaborSavings.toFixed(2)],
      ["Monthly Stock Leakage Saved ($)", metrics.monthlyShrinkageSavings.toFixed(2)],
      ["Gross Monthly Savings ($)", metrics.grossMonthlySavings.toFixed(2)],
      ["Net Monthly Savings ($)", metrics.netMonthlySavings.toFixed(2)],
      ["Hardware Payback Period (Months)", metrics.paybackMonths === null ? "Never" : metrics.paybackMonths.toFixed(1)],
      ["1-Year Net ROI ($)", metrics.netSavingsY1.toFixed(2)],
      ["1-Year Net ROI (%)", `${metrics.roiPercentY1.toFixed(1)}%`],
      ["3-Year Total Savings ($)", metrics.netSavingsY3.toFixed(2)],
      ["3-Year Net ROI (%)", `${metrics.roiPercentY3.toFixed(1)}%`]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POS_ROI_Summary_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDownloadPdf = () => {
    window.print();
  };
  return /* @__PURE__ */ jsx(
    ToolShell,
    {
      metaDescription: "Work out what a POS system actually returns: labour saved, shrink avoided, payback period and three-year ROI from your own numbers. Free, no signup.",
      title: "POS ROI & Payback Period Calculator",
      eyebrow: "Free Tool",
      h1: "POS ROI & Payback Period Calculator",
      answer: "Calculate how quickly a smart Point-of-Sale system pays for itself through labor efficiency and stock leakage reduction.",
      currentSlug: "pos-roi-calculator",
      subtitle: "Calculate how quickly a smart Point-of-Sale system pays for itself through labor efficiency and stock leakage reduction.",
      slug: "pos-roi-calculator",
      groupKey: "calculators",
      toolGroups,
      faqs: FAQS,
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad flex flex-wrap items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-500/10 text-accent-text rounded-xl border border-emerald-500/20", children: /* @__PURE__ */ jsx(Calculator, { className: "w-6 h-6" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-ink", children: "POS ROI & Payback Calculator" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Interactive financial modeling for retail & food businesses" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-ink", children: "Currency" }),
            /* @__PURE__ */ jsx(
              Select,
              {
                value: currency,
                onChange: (v) => setCurrency(v),
                options: Object.keys(CURRENCIES).map((c) => ({ value: c, label: `${c} (${CURRENCIES[c]})` })),
                className: "w-44"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 vq-tool-panel vq-tool-panel--pad space-y-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-ink border-b border-line pb-3 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5 text-accent-text" }),
              " Business Inputs"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: [
                "Average Monthly Revenue (",
                sym,
                ")"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: monthlyRevenue,
                  onChange: (e) => setMonthlyRevenue(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "45000"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Manual Checkout & Register Hours / Week" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: checkoutHoursPerWeek,
                  onChange: (e) => setCheckoutHoursPerWeek(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "25"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Stock Count & Admin Hours / Month" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: stockCountHoursPerMonth,
                  onChange: (e) => setStockCountHoursPerMonth(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "16"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: [
                "Hourly Labor Cost / Owner Rate (",
                sym,
                ")"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: hourlyStaffRate,
                  onChange: (e) => setHourlyStaffRate(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "18"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-line", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: [
                "One-Time Hardware & Setup Cost (",
                sym,
                ")"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: hardwareCost,
                  onChange: (e) => setHardwareCost(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "1200"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: [
                "Monthly POS Software Subscription (",
                sym,
                ")"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: softwareSubMonthly,
                  onChange: (e) => setSoftwareSubMonthly(e.target.value),
                  className: "w-full rounded-[14px] px-4 text-ink outline-none",
                  placeholder: "79"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-line", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-ink-secondary", children: "Current Estimated Shrinkage / Loss %" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-amber-600 dark:text-amber-400", children: [
                  numShrinkPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "10",
                  step: "0.1",
                  value: shrinkageRatePercent,
                  onChange: (e) => setShrinkageRatePercent(e.target.value),
                  className: "w-full accent-emerald-600 h-2 cursor-pointer"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Retail average: 1.5% - 3.5% of gross revenue" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-ink-secondary", children: "Expected Shrinkage Reduction %" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-accent-text", children: [
                  numShrinkRedPct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "80",
                  step: "5",
                  value: shrinkageReductionPercent,
                  onChange: (e) => setShrinkageReductionPercent(e.target.value),
                  className: "w-full accent-emerald-600 h-2 cursor-pointer"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-ink-secondary", children: "Expected Staff Time Saved %" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-accent-text", children: [
                  numTimeSavePct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "70",
                  step: "5",
                  value: timeSavingsPercent,
                  onChange: (e) => setTimeSavingsPercent(e.target.value),
                  className: "w-full accent-emerald-600 h-2 cursor-pointer"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad relative overflow-hidden", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Hardware Payback" }),
                  /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-accent-text" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-ink", children: metrics.paybackMonths === null ? /* @__PURE__ */ jsx("span", { className: "text-rose-600 dark:text-rose-400", children: "No Breakeven" }) : /* @__PURE__ */ jsxs("span", { children: [
                  metrics.paybackMonths.toFixed(1),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-lg font-normal text-ink-muted", children: "Months" })
                ] }) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-2", children: metrics.paybackMonths !== null && metrics.paybackMonths <= 6 ? /* @__PURE__ */ jsx("span", { className: "text-accent-text font-medium", children: "★ Exceptional payback period" }) : "Time required to recover upfront hardware" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad relative overflow-hidden", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "Monthly Time Saved" }),
                  /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-sky-600 dark:text-sky-400" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-3xl font-bold text-ink", children: [
                  metrics.monthlyHrsSaved.toFixed(1),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-lg font-normal text-ink-muted", children: "hrs/mo" })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-accent-text font-medium mt-2", children: [
                  "Valued at ",
                  fmtMoney(metrics.monthlyLaborSavings, sym),
                  " / month"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad relative overflow-hidden", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "1-Year Net ROI" }),
                  /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-accent-text" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: `text-3xl font-bold ${metrics.netSavingsY1 >= 0 ? "text-accent-text" : "text-rose-600 dark:text-rose-400"}`, children: fmtMoney(metrics.netSavingsY1, sym) }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold mt-2 text-ink-secondary", children: [
                  metrics.roiPercentY1 >= 0 ? "+" : "",
                  metrics.roiPercentY1.toFixed(1),
                  "% return on investment"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad relative overflow-hidden", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-ink-muted", children: "3-Year Net Profit" }),
                  /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: `text-3xl font-bold ${metrics.netSavingsY3 >= 0 ? "text-accent-text" : "text-rose-600 dark:text-rose-400"}`, children: fmtMoney(metrics.netSavingsY3, sym) }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold mt-2 text-ink-secondary", children: [
                  metrics.roiPercentY3 >= 0 ? "+" : "",
                  metrics.roiPercentY3.toFixed(1),
                  "% total 36-month return"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad space-y-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-ink border-b border-line pb-3 flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Monthly Savings Breakdown" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-ink-muted", children: "Calculated per month" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-b border-line", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-ink-secondary", children: [
                    "Labor Time Savings (",
                    metrics.monthlyHrsSaved.toFixed(1),
                    " hrs @ ",
                    sym,
                    numHourlyRate,
                    "/hr)"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold text-accent-text", children: [
                    "+",
                    fmtMoney(metrics.monthlyLaborSavings, sym)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-b border-line", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-ink-secondary", children: [
                    "Stock Shrinkage Reduction (",
                    numShrinkRedPct,
                    "% of ",
                    fmtMoney(metrics.currentMonthlyShrinkage, sym),
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold text-accent-text", children: [
                    "+",
                    fmtMoney(metrics.monthlyShrinkageSavings, sym)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-b border-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-ink font-semibold", children: "Gross Monthly Financial Gain" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: fmtMoney(metrics.grossMonthlySavings, sym) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2 border-b border-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-ink-secondary", children: "Less POS Software Monthly Subscription" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold text-rose-600 dark:text-rose-400", children: [
                    "-",
                    fmtMoney(numSwSub, sym)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-2 text-base", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: "Net Monthly Benefit" }),
                  /* @__PURE__ */ jsxs("span", { className: `font-bold ${metrics.netMonthlySavings >= 0 ? "text-accent-text" : "text-rose-600 dark:text-rose-400"}`, children: [
                    fmtMoney(metrics.netMonthlySavings, sym),
                    " / mo"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 pt-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleDownloadCsv,
                  className: "vq-btn vq-btn--secondary vq-btn--lg flex-1",
                  children: [
                    /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                    " Export CSV Summary"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleDownloadPdf,
                  className: "vq-btn vq-btn--primary vq-btn--lg flex-1",
                  children: [
                    /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
                    " Print / Save PDF"
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-tool-panel vq-tool-panel--pad space-y-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: "Understanding Your POS Return on Investment" }),
          /* @__PURE__ */ jsxs("p", { className: "text-ink-secondary leading-relaxed", children: [
            "A modern Point-of-Sale system is not just an expense — it is an automated operational asset. While traditional legacy cash registers only record financial totals, an integrated POS like ",
            /* @__PURE__ */ jsx("strong", { children: "VenQore" }),
            " eliminates repetitive labor and protects inventory margins."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 pt-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-tool-well rounded-2xl p-5 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-accent-text font-bold flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }),
                " 1. Stock Leakage Prevention"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed", children: "Real-time FIFO batch tracking and barcode verification prevent theft, unrecorded cashier discounts, and undetected supplier shortages." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-tool-well rounded-2xl p-5 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-accent-text font-bold flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }),
                " 2. Automated Double-Entry"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed", children: "Every checkout auto-posts balanced journal entries and inventory updates. No more late nights re-keying end-of-day register tallies." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-tool-well rounded-2xl p-5 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-accent-text font-bold flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }),
                " 3. Offline Resilience"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed", children: "Offline-first architecture ensures internet outages never stop checkouts or lost sales during peak business hours." })
            ] })
          ] })
        ] })
      ] })
    }
  );
}
export {
  PosRoiCalculator as default
};
