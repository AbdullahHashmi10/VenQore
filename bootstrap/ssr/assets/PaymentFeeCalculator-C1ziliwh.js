import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { AlertTriangle, CreditCard, Info } from "lucide-react";
import ToolShell from "./ToolShell-BE5CpfRw.js";
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
const DEFAULT_PROCESSORS = [
  { id: "stripe", name: "Stripe", pct: "2.9", fixed: "0.30", monthly: "0", note: "Standard US online rate" },
  { id: "square", name: "Square", pct: "2.6", fixed: "0.10", monthly: "0", note: "Standard in-person card rate" },
  { id: "paypal", name: "PayPal", pct: "2.9", fixed: "0.30", monthly: "0", note: "Standard online checkout rate" },
  { id: "clover", name: "Clover", pct: "2.6", fixed: "0.10", monthly: "0", note: "Commonly cited card-present rate" },
  { id: "shopify", name: "Shopify Payments", pct: "2.9", fixed: "0.30", monthly: "0", note: "Standard online plan rate" }
];
function round2(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}
function feeForTransaction(amount, pct, fixed) {
  if (!Number.isFinite(amount)) return null;
  const p = Number.isFinite(pct) ? pct : 0;
  const f = Number.isFinite(fixed) ? fixed : 0;
  return amount * (p / 100) + f;
}
const FAQS = [
  {
    q: "Why is my effective payment processing rate higher than the advertised rate?",
    a: 'Advertised rates usually quote only the percentage component (e.g. "2.9%") and leave out the fixed per-transaction fee, monthly/plan fees, and often a higher rate for card-not-present (online/keyed-in) transactions versus card-present (in-person, chip/tap). Your true effective rate is total fees paid divided by total volume processed — which is always higher than the headline percentage once fixed fees and any monthly costs are included, especially on smaller transactions.'
  },
  {
    q: "Does transaction size affect which payment processor is cheapest?",
    a: "Yes, significantly. Every processor charges a percentage PLUS a small fixed fee per transaction. On a small ticket (say $5), a $0.30 fixed fee is 6% of the sale on top of the percentage — it dominates the cost. On a large ticket (say $500), that same $0.30 is just 0.06% of the sale and barely matters, so the percentage rate alone decides the winner. This is why a processor with a lower percentage but higher fixed fee can lose at small ticket sizes and win at large ones, or vice versa — always compare using your own average ticket size, not the advertised percentage alone."
  },
  {
    q: "What's the difference between card-present and online processing fees?",
    a: "Card-present transactions (physically tapping, dipping or swiping a card at a terminal) are lower risk for the processor because the card and often the cardholder are physically verified, so rates are typically lower. Card-not-present transactions (online checkout, phone/mail orders, manually keyed-in numbers) carry more fraud risk since there is no physical card verification, so processors typically charge a higher percentage for those. If you take both in-person and online payments, expect two different effective rates from the same processor."
  }
];
function PaymentFeeCalculator({ toolGroups = [] }) {
  const [mode, setMode] = useState("single");
  const [processors, setProcessors] = useState(DEFAULT_PROCESSORS.map((p) => ({ ...p })));
  const [txAmount, setTxAmount] = useState("50");
  const [avgTicket, setAvgTicket] = useState("35");
  const [txCount, setTxCount] = useState("400");
  const updateProcessor = (id, field, value) => {
    setProcessors((list) => list.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-400/60 transition-colors";
  const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const fmtMoney = (v) => v === null || v === void 0 || Number.isNaN(v) || !Number.isFinite(v) ? "—" : `$${round2(v).toFixed(2)}`;
  const singleResults = useMemo(() => {
    const amount = parseFloat(txAmount);
    return processors.map((p) => {
      const pct = parseFloat(p.pct);
      const fixed = parseFloat(p.fixed);
      const fee = feeForTransaction(amount, pct, fixed);
      const net = fee !== null ? amount - fee : null;
      return { ...p, fee, net };
    });
  }, [txAmount, processors]);
  const cheapestSingle = useMemo(() => {
    const valid = singleResults.filter((r) => r.fee !== null);
    if (!valid.length) return null;
    return valid.reduce((min, r) => r.fee < min.fee ? r : min, valid[0]);
  }, [singleResults]);
  const monthlyResults = useMemo(() => {
    const avg = parseFloat(avgTicket);
    const count = parseFloat(txCount);
    const grossVolume = Number.isFinite(avg) && Number.isFinite(count) ? avg * count : null;
    return processors.map((p) => {
      const pct = parseFloat(p.pct);
      const fixed = parseFloat(p.fixed);
      const monthly = parseFloat(p.monthly) || 0;
      if (!Number.isFinite(avg) || !Number.isFinite(count)) {
        return { ...p, totalFees: null, netRevenue: null, effectiveRate: null };
      }
      const perTxFee = feeForTransaction(avg, pct, fixed) || 0;
      const totalFees = count * perTxFee + monthly;
      const netRevenue = grossVolume - totalFees;
      const effectiveRate = grossVolume > 0 ? totalFees / grossVolume * 100 : null;
      return { ...p, totalFees, netRevenue, effectiveRate };
    });
  }, [avgTicket, txCount, processors]);
  const cheapestMonthly = useMemo(() => {
    const valid = monthlyResults.filter((r) => r.totalFees !== null);
    if (!valid.length) return null;
    return valid.reduce((min, r) => r.totalFees < min.totalFees ? r : min, valid[0]);
  }, [monthlyResults]);
  const results = mode === "single" ? singleResults : monthlyResults;
  const cheapest = mode === "single" ? cheapestSingle : cheapestMonthly;
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Payment Processing Fee Calculator | VenQore",
      metaDescription: "Compare Stripe, Square, PayPal, Clover and Shopify Payments processing fees side by side for a single transaction or your monthly volume. Every rate is editable. Free, no signup.",
      eyebrow: "Free Tool",
      h1: "Payment Processing Fee Calculator",
      answer: "Compare the effective cost of Stripe, Square, PayPal, Clover and Shopify Payments for a single transaction or your monthly volume. Pre-filled with well-known, long-stable illustrative baseline rates — every percentage, fixed fee and monthly fee is fully editable so you can plug in your actual rate sheet. Entirely client-side, free, no signup.",
      faqs: FAQS,
      toolGroups,
      currentSlug: "payment-fee-calculator",
      cta: {
        headline: "Reconciling processor statements by hand doesn't scale.",
        subtext: "VenQore records the exact fee on every sale automatically and reports net revenue per payment method — no spreadsheet required."
      },
      related: [{ label: "Profit Margin & Markup Calculator", href: "/tools/margin-calculator" }, { label: "POS ROI Calculator", href: "/tools/pos-roi-calculator" }],
      children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 mb-6 flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 20, className: "text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-800 dark:text-amber-200 leading-relaxed", children: [
            /* @__PURE__ */ jsx("strong", { children: "These default rates are approximate and illustrative only — verify current rates directly with each processor before making a decision." }),
            " ",
            "Payment processor pricing changes over time and varies by plan tier, card-present vs. online transactions, business type and country. Every rate field below is editable — replace these defaults with your actual rate sheet for an accurate comparison."
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2 mb-6", children: [
          ["single", "Single Transaction"],
          ["monthly", "Monthly Volume"]
        ].map(([key, label]) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setMode(key),
            className: `px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${mode === key ? "bg-slate-900 dark:bg-white text-white dark:text-[#05030f]" : "bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300"}`,
            children: label
          },
          key
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10 p-5 sm:p-7", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(CreditCard, { size: 17, className: "text-indigo-500 dark:text-indigo-300" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-900 dark:text-white", children: "Processor rates" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Illustrative defaults — edit any field to match your actual rate sheet." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-2xl border border-slate-900/10 dark:border-white/10 mb-6", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm min-w-[640px]", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-900/[0.03] dark:bg-white/[0.04] text-left", children: ["Processor", "Rate %", "Fixed fee", "Monthly fee"].map((h) => /* @__PURE__ */ jsx("th", { className: "px-3 py-2.5 font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: processors.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-900/[0.06] dark:border-white/[0.06]", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white", children: p.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400 dark:text-slate-500", children: [
                  p.note,
                  " — illustrative, verify current rates"
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-28", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: p.pct, onChange: (e) => updateProcessor(p.id, "pct", e.target.value), className: `${inputCls} pr-7 py-1.5` }),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs", children: "%" })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-28", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs", children: "$" }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: p.fixed, onChange: (e) => updateProcessor(p.id, "fixed", e.target.value), className: `${inputCls} pl-6 py-1.5` })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 w-32", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs", children: "$" }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: p.monthly, onChange: (e) => updateProcessor(p.id, "monthly", e.target.value), className: `${inputCls} pl-6 py-1.5`, placeholder: "0" })
              ] }) })
            ] }, p.id)) })
          ] }) }),
          mode === "single" ? /* @__PURE__ */ jsxs("div", { className: "max-w-xs mb-6", children: [
            /* @__PURE__ */ jsx("label", { className: labelCls, children: "Transaction amount" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "$" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: txAmount, onChange: (e) => setTxAmount(e.target.value), className: `${inputCls} pl-8`, placeholder: "0.00" })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-5 max-w-xl mb-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Average transaction amount" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm", children: "$" }),
                /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: avgTicket, onChange: (e) => setAvgTicket(e.target.value), className: `${inputCls} pl-8`, placeholder: "0.00" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelCls, children: "Transactions per month" }),
              /* @__PURE__ */ jsx("input", { type: "number", step: "1", value: txCount, onChange: (e) => setTxCount(e.target.value), className: inputCls, placeholder: "0" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-2xl border border-slate-900/10 dark:border-white/10", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm min-w-[640px]", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-900/[0.03] dark:bg-white/[0.04] text-left", children: (mode === "single" ? ["Processor", "Fee", "You receive"] : ["Processor", "Effective rate", "Total monthly fees", "Net revenue"]).map((h) => /* @__PURE__ */ jsx("th", { className: "px-3 py-2.5 font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: results.map((r) => {
              const isCheapest = cheapest && r.id === cheapest.id;
              return /* @__PURE__ */ jsxs("tr", { className: `border-t border-slate-900/[0.06] dark:border-white/[0.06] ${isCheapest ? "bg-emerald-500/[0.06]" : ""}`, children: [
                /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-900 dark:text-white", children: r.name }),
                  isCheapest && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300", children: "Cheapest" })
                ] }) }),
                mode === "single" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: fmtMoney(r.fee) }),
                  /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap", children: fmtMoney(r.net) })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: r.effectiveRate !== null ? `${round2(r.effectiveRate).toFixed(2)}%` : "—" }),
                  /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap", children: fmtMoney(r.totalFees) }),
                  /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap", children: fmtMoney(r.netRevenue) })
                ] })
              ] }, r.id);
            }) })
          ] }) }),
          mode === "monthly" && cheapest && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-start gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20", children: [
            /* @__PURE__ */ jsx(Info, { size: 16, className: "text-indigo-500 dark:text-indigo-300 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-indigo-700 dark:text-indigo-300", children: [
              "At a ",
              /* @__PURE__ */ jsxs("strong", { children: [
                "$",
                avgTicket || "0"
              ] }),
              " average ticket and ",
              /* @__PURE__ */ jsx("strong", { children: txCount || "0" }),
              " transactions/month,",
              " ",
              /* @__PURE__ */ jsx("strong", { children: cheapest.name }),
              " comes out cheapest for this specific volume and ticket-size profile. This can flip at a different average ticket size — see the worked example below."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: 'Why comparing "just the percentage" is misleading' }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4", children: [
            "Every processor charges two components per transaction: a ",
            /* @__PURE__ */ jsx("strong", { children: "percentage of the sale" }),
            " and a small",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "fixed fee" }),
            ". The percentage scales with the sale amount, but the fixed fee doesn't — it's the same $0.10–$0.30 whether you sell a $5 coffee or a $500 appliance. That means the fixed fee is a much bigger relative burden on small tickets than on large ones, so the processor that looks cheapest on paper (lowest percentage) isn't always the cheapest one for your actual business."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/10 border border-indigo-500/20 mb-6", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-2", children: 'Worked example — the "cheapest" processor flips with ticket size' }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3", children: "Compare Processor A (2.6% + $0.10) against Processor B (2.9% + $0.30), 100 transactions per month:" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2", children: [
              /* @__PURE__ */ jsx("strong", { children: "Small average ticket — $10:" }),
              " A = 100 × (10 × 0.026 + 0.10) = 100 × $0.36 = ",
              /* @__PURE__ */ jsx("strong", { children: "$36.00" }),
              ". B = 100 × (10 × 0.029 + 0.30) = 100 × $0.59 = ",
              /* @__PURE__ */ jsx("strong", { children: "$59.00" }),
              ". A wins by $23.00 — the fixed fee gap ($0.10 vs $0.30) is proportionally huge on a $10 sale."
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300 leading-relaxed", children: [
              /* @__PURE__ */ jsx("strong", { children: "Large average ticket — $200:" }),
              " A = 100 × (200 × 0.026 + 0.10) = 100 × $5.30 = ",
              /* @__PURE__ */ jsx("strong", { children: "$530.00" }),
              ". B = 100 × (200 × 0.029 + 0.30) = 100 × $6.10 = ",
              /* @__PURE__ */ jsx("strong", { children: "$610.00" }),
              `. A still wins here, but by a smaller share of total volume — as ticket size grows, the percentage rate (2.6% vs 2.9%) does more of the work and the fixed-fee gap fades into the background. Swap in rate pairs where the lower-percentage processor also has a noticeably higher fixed fee (common with some in-person vs. online plans) and you'll see the ranking invert entirely at small ticket sizes — which is exactly why this calculator lets you plug in your own numbers and your own average ticket size rather than trusting a single "cheapest" label from a rate card.`
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "Card-present vs. card-not-present rates" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4", children: 'Tapping, dipping or swiping a physical card at a terminal ("card-present") is lower risk for the processor — the card and often the cardholder are physically verified, so fraud is less likely. Online checkout, phone orders, or manually keyed-in card numbers ("card-not-present") carry more fraud risk, so processors typically charge a higher percentage for those. If your business takes payments both in-person and online, expect two different effective rates from the same processor — model each channel separately using this calculator rather than one blended number.' }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-4 text-slate-900 dark:text-white", children: "Monthly and plan fees can shift the winner too" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: "Some processors charge a flat monthly or plan fee on top of per-transaction pricing, often in exchange for a lower percentage rate. That fee is fixed regardless of volume, so it matters much less at high monthly volume than at low volume — a plan with a $30/month fee and a lower percentage can be the cheapest option once you're processing enough transactions to spread that fixed cost thin, even if it looks worse for an occasional user. Use the monthly fee field above alongside your real average ticket and transaction count to see whether that trade-off is worth it for your specific volume." })
        ] })
      ]
    }
  );
}
export {
  PaymentFeeCalculator as default
};
