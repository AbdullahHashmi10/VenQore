import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { v as vq } from "./runtime-DwSFgQZq.js";
import { Lock, TrendingUp, Package, Receipt, Wallet, Sparkles, Loader2, Brain, CheckCircle2, AlertTriangle, Search, Check, Minus, Plus, Trash2, Mic, Upload, RefreshCw, ChevronRight, Users, Truck, Boxes, BarChart3, Percent, ShieldCheck, Target, Factory } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
function usePRM() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return r;
}
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => setV(e.isIntersecting), { threshold });
    o.observe(el);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, v];
}
const group = (n, d = 0) => {
  const v = d > 0 ? Number(n).toFixed(d) : String(Math.round(n));
  const [i, dec] = v.split(".");
  const gi = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${gi}.${dec}` : gi;
};
const Num = ({ end, prefix = "", suffix = "", d = 0, dur = 1600 }) => {
  const reduced = usePRM();
  const [val, setVal] = useState(0);
  const [ref, v] = useInView(0.4);
  const ran = useRef(false);
  useEffect(() => {
    if (!v || ran.current) return;
    ran.current = true;
    if (reduced) {
      setVal(end);
      return;
    }
    const s = performance.now();
    const tick = (now) => {
      const p = Math.min((now - s) / dur, 1);
      setVal((1 - Math.pow(1 - p, 4)) * end);
      if (p < 1) requestAnimationFrame(tick);
      else setVal(end);
    };
    requestAnimationFrame(tick);
  }, [v, reduced, end, dur]);
  return /* @__PURE__ */ jsxs("span", { ref, children: [
    prefix,
    group(val, d),
    suffix
  ] });
};
const ACCENTS = {
  indigo: "text-brand-300",
  emerald: "text-emerald-300",
  violet: "text-brand-300",
  blue: "text-blue-300",
  amber: "text-amber-300",
  cyan: "text-cyan-300"
};
function DemoFrame({ title, url, badge = "LIVE DEMO", accent = "indigo", children }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "dark vq-dark vq-demo-frame relative rounded-lg border border-white/[0.08] bg-neutral-950/85 backdrop-blur-2xl shadow-[0_40px_140px_-50px_rgba(99,102,241,0.55)] overflow-hidden",
      style: { color: "var(--vq-text)" },
      children: [
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-white/[0.06]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-rose-400/70" }),
            /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-amber-400/70" }),
            /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-emerald-400/70" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]", children: [
            /* @__PURE__ */ jsx(Lock, { size: 10, className: "text-ink-muted" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-mono text-ink-muted", children: url })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 vqf-blink" }),
            /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold uppercase tracking-[0.2em] ${ACCENTS[accent] || ACCENTS.indigo}`, children: badge })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 sm:p-6", children })
      ]
    }
  );
}
const PillTabs = ({ tabs, value, onChange, size = "sm" }) => /* @__PURE__ */ jsx("div", { className: "inline-flex bg-white/[0.04] p-0.5 rounded-lg", children: tabs.map((t) => /* @__PURE__ */ jsx(
  "button",
  {
    onClick: () => onChange(t),
    className: `${size === "sm" ? "px-2.5 py-0.5 text-2xs" : "px-3 py-1 text-1xs"} font-bold rounded-md transition-all ${value === t ? "bg-white/10 text-brand-300" : "text-ink-muted hover:text-neutral-300"}`,
    children: t
  },
  t
)) });
const PL_SETS = {
  "This Month": { rev: 1245670, cogs: 473355, exp: 287400 },
  "Last Month": { rev: 1086400, cogs: 423700, exp: 271500 },
  "This Year": { rev: 13980500, cogs: 5312e3, exp: 314e4 }
};
const Donut = ({ segments, size = 132 }) => {
  const reduced = usePRM();
  const [ref, v] = useInView(0.4);
  const r = (size - 16) / 2, C = 2 * Math.PI * r, total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative inline-flex items-center justify-center", style: { width: size, height: size }, children: [
    /* @__PURE__ */ jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [
      /* @__PURE__ */ jsx("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: "12" }),
      segments.map((s, i) => {
        const frac = s.value / total, len = frac * C, off = acc;
        acc += len;
        return /* @__PURE__ */ jsx(
          "circle",
          {
            cx: size / 2,
            cy: size / 2,
            r,
            fill: "none",
            stroke: s.color,
            strokeWidth: "12",
            strokeDasharray: `${reduced || v ? len : 0} ${C}`,
            strokeDashoffset: -off,
            style: { transition: reduced ? "none" : `stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.18}s` }
          },
          i
        );
      })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-widest text-ink-muted", children: "Net Margin" }),
      /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-emerald-600 dark:text-emerald-400", children: [
        (segments[2].value / total * 100).toFixed(0),
        "%"
      ] })
    ] })
  ] });
};
const ProfitLossDemo = () => {
  const [range, setRange] = useState("This Month");
  const [phase, setPhase] = useState("idle");
  const s = PL_SETS[range];
  const gross = s.rev - s.cogs, net = gross - s.exp;
  const gm = (gross / s.rev * 100).toFixed(1), nm = (net / s.rev * 100).toFixed(1);
  const analyze = () => {
    setPhase("analyzing");
    setTimeout(() => setPhase("done"), 1700);
  };
  useEffect(() => {
    setPhase("idle");
  }, [range]);
  const kpis = [
    { l: "Revenue", v: s.rev, c: "text-white", ic: TrendingUp, tone: "text-brand-300 bg-brand-500/15" },
    { l: "COGS (FIFO)", v: s.cogs, c: "text-amber-300", ic: Package, tone: "text-amber-300 bg-amber-500/15" },
    { l: "Expenses", v: s.exp, c: "text-rose-300", ic: Receipt, tone: "text-rose-300 bg-rose-500/15" },
    { l: "Net Profit", v: net, c: "text-emerald-300", ic: Wallet, tone: "text-emerald-300 bg-emerald-500/15" }
  ];
  return /* @__PURE__ */ jsxs(DemoFrame, { title: "Profit & Loss", url: "www.venqore.com/reports/profit-loss", accent: "emerald", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-5 rounded-full bg-emerald-500" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink tracking-tight", children: "Profit & Loss Statement" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Verified from the double-entry ledger" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PillTabs, { tabs: ["This Month", "Last Month", "This Year"], value: range, onChange: setRange, size: "md" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4", children: kpis.map((k) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${k.tone}`, children: /* @__PURE__ */ jsx(k.ic, { size: 13 }) }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wide text-ink-muted", children: k.l })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `text-base sm:text-lg font-bold tabular-nums ${k.c}`, children: [
        "$",
        /* @__PURE__ */ jsx(Num, { end: k.v })
      ] })
    ] }, k.l)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Donut, { segments: [
          { name: "COGS", value: s.cogs, color: vq.amber[500] },
          { name: "Expenses", value: s.exp, color: vq.red[500] },
          { name: "Net", value: Math.max(0, net), color: vq.emerald[500] }
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-1xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-sm bg-amber-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "COGS" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-ink-secondary font-bold", children: [
              (s.cogs / s.rev * 100).toFixed(0),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-sm bg-rose-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Expenses" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-ink-secondary font-bold", children: [
              (s.exp / s.rev * 100).toFixed(0),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-sm bg-emerald-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Net Profit" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-emerald-300 font-bold", children: [
              nm,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-1 mt-1 border-t border-line dark:border-white/5 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Gross margin" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-ink font-bold", children: [
              gm,
              "%"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 14, className: "text-brand-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-ink", children: "AI Analysis" })
          ] }),
          phase !== "done" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: analyze,
              disabled: phase === "analyzing",
              className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 border border-brand-400/30 text-brand-200 text-1xs font-bold hover:bg-brand-500/25 transition-colors disabled:opacity-60",
              children: phase === "analyzing" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin" }),
                " Analyzing…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Brain, { size: 12 }),
                " Analyze with AI"
              ] })
            }
          )
        ] }),
        phase === "idle" && /* @__PURE__ */ jsxs("p", { className: "text-ink-muted text-[12px] leading-relaxed", children: [
          "Click ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-300 font-semibold", children: "Analyze with AI" }),
          " — VenQore reads this statement and returns plain-English insights and a health score."
        ] }),
        phase === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 animate-pulse", children: [
          /* @__PURE__ */ jsx("div", { className: "h-3 w-3/4 bg-sunken dark:bg-white/5 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 w-2/3 bg-sunken dark:bg-white/5 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-3 w-1/2 bg-sunken dark:bg-white/5 rounded" })
        ] }),
        phase === "done" && /* @__PURE__ */ jsxs("div", { className: "vqf-in space-y-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: [
              Math.round(parseFloat(nm) + 50),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-muted", children: "/100" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full", children: "Financially Healthy" })
          ] }),
          [
            { ic: CheckCircle2, c: "text-emerald-400", t: "Strong gross margin", d: `At ${gm}%, your product pricing leaves healthy room for overheads.` },
            { ic: AlertTriangle, c: "text-amber-400", t: "Watch overheads", d: `Expenses are ${(s.exp / s.rev * 100).toFixed(0)}% of revenue — trim toward the 30% benchmark.` },
            { ic: TrendingUp, c: "text-brand-400", t: "Reinvest to grow", d: "You are profitable — consider routing 20% of net profit into marketing." }
          ].map((x, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-line dark:border-white/5", children: [
            /* @__PURE__ */ jsx(x.ic, { size: 15, className: `${x.c} mt-0.5 shrink-0` }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-neutral-200", children: x.t }),
              /* @__PURE__ */ jsx("div", { className: "text-1xs text-ink-muted leading-snug", children: x.d })
            ] })
          ] }, i))
        ] })
      ] })
    ] })
  ] });
};
const POS_PRODUCTS = [
  { id: 1, e: "🥤", n: "Cola 500ml", p: 80 },
  { id: 2, e: "🍫", n: "Dark Choco", p: 120 },
  { id: 3, e: "🧴", n: "Hand Wash", p: 210 },
  { id: 4, e: "🍞", n: "Bread Loaf", p: 95 },
  { id: 5, e: "🥛", n: "Milk 1L", p: 160 },
  { id: 6, e: "🧃", n: "Mango Juice", p: 140 },
  { id: 7, e: "☕", n: "Coffee Jar", p: 540 },
  { id: 8, e: "🍪", n: "Cookies", p: 110 }
];
const PosInvoiceDemo = () => {
  const [cart, setCart] = useState([{ ...POS_PRODUCTS[0], q: 2 }, { ...POS_PRODUCTS[3], q: 1 }]);
  const [pay, setPay] = useState("Cash");
  const [done, setDone] = useState(false);
  const add = (p) => setCart((c) => {
    const f = c.find((x) => x.id === p.id);
    return f ? c.map((x) => x.id === p.id ? { ...x, q: x.q + 1 } : x) : [...c, { ...p, q: 1 }];
  });
  const dec = (id) => setCart((c) => c.flatMap((x) => x.id === id ? x.q > 1 ? [{ ...x, q: x.q - 1 }] : [] : [x]));
  const del = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const sub = cart.reduce((s, x) => s + x.p * x.q, 0);
  const tax = Math.round(sub * 0.05), total = sub + tax;
  return /* @__PURE__ */ jsx(DemoFrame, { title: "POS", url: "www.venqore.com/pos", accent: "indigo", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-xs", children: [
          /* @__PURE__ */ jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
          /* @__PURE__ */ jsx("div", { className: "w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-1xs text-ink-muted", children: "Scan barcode or search…" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-widest text-ink-secondary ml-3 hidden sm:block", children: "F1 Search · F4 Pay" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: POS_PRODUCTS.map((p) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => add(p),
          className: "group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:border-brand-400/40 hover:bg-brand-500/10 transition-all active:scale-95",
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-xl mb-1.5 transition-transform", children: p.e }),
            /* @__PURE__ */ jsx("div", { className: "text-1xs font-bold text-neutral-200 truncate", children: p.n }),
            /* @__PURE__ */ jsxs("div", { className: "text-1xs font-bold text-brand-300", children: [
              "Rs ",
              p.p
            ] })
          ]
        },
        p.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 rounded-xl border border-white/[0.06] bg-void-800 p-3 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold uppercase tracking-wider text-ink-muted", children: "Cart" }),
        /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted", children: [
          cart.reduce((s, x) => s + x.q, 0),
          " items"
        ] })
      ] }),
      done ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center py-8 vqf-in", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Check, { size: 28, className: "text-emerald-600 dark:text-emerald-400" }) }),
        /* @__PURE__ */ jsx("div", { className: "text-ink font-bold", children: "Sale completed" }),
        /* @__PURE__ */ jsx("div", { className: "text-1xs text-ink-muted mb-1", children: "Journal posted · stock deducted (FIFO)" }),
        /* @__PURE__ */ jsxs("div", { className: "text-1xs text-emerald-600 dark:text-emerald-400 font-mono", children: [
          "Rs ",
          group(total),
          " · ",
          pay
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          setDone(false);
          setCart([{ ...POS_PRODUCTS[0], q: 2 }]);
        }, className: "mt-4 text-1xs font-bold text-brand-300 hover:underline", children: "New sale" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5 min-h-[120px] max-h-[180px] overflow-y-auto pr-1", children: [
          cart.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-1xs text-ink-secondary py-10", children: "Tap a product to add" }),
          cart.map((x) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-line dark:border-white/5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-base", children: x.e }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "text-1xs font-bold text-neutral-200 truncate", children: x.n }),
              /* @__PURE__ */ jsxs("div", { className: "text-2xs text-ink-muted", children: [
                "Rs ",
                x.p
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => dec(x.id), className: "w-5 h-5 rounded bg-sunken dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-secondary", children: /* @__PURE__ */ jsx(Minus, { size: 11 }) }),
              /* @__PURE__ */ jsx("span", { className: "w-5 text-center text-1xs font-bold text-ink tabular-nums", children: x.q }),
              /* @__PURE__ */ jsx("button", { onClick: () => add(x), className: "w-5 h-5 rounded bg-sunken dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-secondary", children: /* @__PURE__ */ jsx(Plus, { size: 11 }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => del(x.id), className: "w-5 h-5 rounded bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 ml-0.5", children: /* @__PURE__ */ jsx(Trash2, { size: 11 }) })
            ] })
          ] }, x.id))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-line dark:border-white/5 space-y-1 text-1xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
            /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
            /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
              "Rs ",
              group(sub)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
            /* @__PURE__ */ jsx("span", { children: "VAT 5%" }),
            /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
              "Rs ",
              group(tax)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink font-bold text-sm pt-0.5", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
              "Rs ",
              group(total)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-1.5 mt-2.5", children: ["Cash", "Card", "Split"].map((m) => /* @__PURE__ */ jsx("button", { onClick: () => setPay(m), className: `py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wide border transition-all ${pay === m ? "bg-brand-500/20 border-brand-400/50 text-brand-200" : "bg-white/[0.03] border-line dark:border-white/10 text-ink-muted"}`, children: m }, m)) }),
        /* @__PURE__ */ jsxs("button", { onClick: () => cart.length && setDone(true), className: "mt-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink font-bold text-[12px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50", disabled: !cart.length, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
          " Complete Sale"
        ] })
      ] })
    ] })
  ] }) });
};
const SC_IMAGE = {
  action: "Purchase",
  supplier: "Khan Distributors",
  items: [
    { n: "Cola 500ml (×24 case)", sku: "BEV-COLA-500", qty: 5, price: 1680 },
    { n: "Dark Choco Bar", sku: "SNK-CHOCO-01", qty: 40, price: 78 },
    { n: "Mango Juice 1L", sku: "BEV-MNGO-1L", qty: 12, price: 132 }
  ]
};
const SC_AUDIO = {
  action: "Sale",
  party: "Bilal General Store (Credit)",
  transcript: "“Sold three Cola, two Hand Wash and one Coffee jar to Bilal on credit.”",
  items: [
    { n: "Cola 500ml", sku: "BEV-COLA-500", qty: 3, price: 80 },
    { n: "Hand Wash", sku: "CARE-HW-01", qty: 2, price: 210 },
    { n: "Coffee Jar", sku: "BEV-COFF-JR", qty: 1, price: 540 }
  ]
};
const Waveform = ({ active }) => /* @__PURE__ */ jsx("div", { className: "flex items-end gap-1 h-10", children: Array.from({ length: 28 }).map((_, i) => /* @__PURE__ */ jsx(
  "span",
  {
    className: `w-1 rounded-full ${active ? "bg-brand-400 vqf-wave" : "bg-white/15"}`,
    style: { height: active ? void 0 : "20%", animationDelay: `${i % 7 * 0.09}s` }
  },
  i
)) });
const SmartCaptureDemo = () => {
  const reduced = usePRM();
  const [tab, setTab] = useState("Image");
  const [phase, setPhase] = useState("idle");
  const [t, setT] = useState(0);
  const data = tab === "Image" ? SC_IMAGE : SC_AUDIO;
  useEffect(() => {
    setPhase("idle");
    setT(0);
  }, [tab]);
  useEffect(() => {
    if (phase !== "working") return;
    if (tab === "Audio") {
      const iv = setInterval(() => setT((x) => x + 1), 900);
      return () => clearInterval(iv);
    }
  }, [phase, tab]);
  const run = () => {
    setPhase("working");
    setTimeout(() => setPhase("extracted"), reduced ? 0 : 1900);
  };
  const total = data.items.reduce((s, x) => s + x.qty * x.price, 0);
  return /* @__PURE__ */ jsxs(DemoFrame, { title: "Smart Capture", url: "www.venqore.com/capture", badge: "AI · BYOK", accent: "violet", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-5 rounded-full bg-brand-500" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink tracking-tight", children: "Smart Capture" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Snap a bill or speak — AI turns it into a transaction" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PillTabs, { tabs: ["Image", "Audio"], value: tab, onChange: setTab, size: "md" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsx("div", { className: "relative rounded-xl border border-dashed border-white/15 bg-white/[0.02] h-[208px] flex flex-col items-center justify-center overflow-hidden", children: tab === "Image" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "w-28 rounded-md bg-white/90 p-2 shadow-xl rotate-[-3deg]", children: [
            /* @__PURE__ */ jsx("div", { className: "h-1.5 w-10 bg-neutral-800 rounded mb-1.5" }),
            Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-1 bg-sunken rounded mb-1", style: { width: `${90 - i * 9}%` } }, i)),
            /* @__PURE__ */ jsx("div", { className: "h-1.5 w-12 bg-emerald-500 rounded mt-1.5 ml-auto" })
          ] }),
          phase === "working" && !reduced && /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 h-0.5 bg-brand-400 shadow-[0_0_14px_2px_rgba(167,139,250,0.9)] vqf-scan" }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 text-2xs text-ink-muted", children: "Sample supplier invoice" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: `w-16 h-16 rounded-full flex items-center justify-center mb-3 ${phase === "working" ? "bg-brand-500/20 vqf-pulse" : "bg-white/[0.04]"}`, children: /* @__PURE__ */ jsx(Mic, { size: 26, className: phase === "working" ? "text-brand-300" : "text-ink-muted" }) }),
          /* @__PURE__ */ jsx(Waveform, { active: phase === "working" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-1xs font-mono text-ink-muted", children: phase === "working" ? `00:0${t}` : "00:00" })
        ] }) }),
        phase === "idle" && /* @__PURE__ */ jsx("button", { onClick: run, className: "mt-3 w-full py-2.5 rounded-xl bg-brand-500/15 border border-brand-400/30 text-brand-200 font-bold text-[12px] hover:bg-brand-500/25 transition-colors flex items-center justify-center gap-2", children: tab === "Image" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Upload, { size: 14 }),
          " Scan sample invoice"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Mic, { size: 14 }),
          " Record sample voice note"
        ] }) }),
        phase === "working" && /* @__PURE__ */ jsxs("div", { className: "mt-3 w-full py-2.5 rounded-xl bg-white/[0.03] border border-line dark:border-white/10 text-ink-muted font-bold text-[12px] flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }),
          " ",
          tab === "Image" ? "Reading invoice…" : "Transcribing…"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 min-h-[208px]", children: phase === "idle" || phase === "working" ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 22, className: "text-brand-300 mb-2" }),
        /* @__PURE__ */ jsx("div", { className: "text-[13px] font-bold text-ink mb-1", children: "AI extraction" }),
        /* @__PURE__ */ jsxs("p", { className: "text-1xs text-ink-muted max-w-xs", children: [
          "Your own AI key reads the ",
          tab === "Image" ? "photo" : "audio",
          ", detects whether it’s a sale, purchase or expense, and matches every line to a product in your catalog."
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "vqf-in", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Detected" }),
            /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-bold ${data.action === "Sale" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`, children: data.action }),
            /* @__PURE__ */ jsxs("span", { className: "text-1xs text-ink-muted", children: [
              "→ ",
              data.supplier || data.party
            ] })
          ] }),
          phase === "confirmed" && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-2xs font-bold text-emerald-300", children: [
            /* @__PURE__ */ jsx(Check, { size: 12 }),
            " Draft created"
          ] })
        ] }),
        data.transcript && /* @__PURE__ */ jsx("div", { className: "mb-2 text-1xs italic text-brand-200/80", children: data.transcript }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5 mb-3", children: data.items.map((it, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-line dark:border-white/5 vqf-in", style: { animationDelay: `${i * 0.1}s` }, children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-600 dark:text-emerald-400 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-neutral-200 truncate", children: it.n }),
            /* @__PURE__ */ jsxs("div", { className: "text-3xs font-mono text-ink-muted", children: [
              "matched · ",
              it.sku
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-1xs text-ink-muted tabular-nums", children: [
            it.qty,
            " × ",
            it.price
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-1xs font-bold text-ink tabular-nums w-16 text-right", children: [
            "Rs ",
            group(it.qty * it.price)
          ] })
        ] }, i)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-line dark:border-white/5", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[12px] font-bold text-ink", children: [
            "Total ",
            /* @__PURE__ */ jsxs("span", { className: "text-ink-muted font-normal", children: [
              "(",
              data.items.length,
              " lines)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[13px] font-bold text-ink tabular-nums", children: [
              "Rs ",
              group(total)
            ] }),
            phase === "extracted" && /* @__PURE__ */ jsxs("button", { onClick: () => setPhase("confirmed"), className: "px-3 py-1.5 rounded-lg bg-emerald-500 text-ink text-1xs font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Check, { size: 12 }),
              " Confirm & Record"
            ] }),
            phase === "confirmed" && /* @__PURE__ */ jsx("button", { onClick: () => setPhase("idle"), className: "text-1xs font-bold text-brand-300 hover:underline", children: "Try again" })
          ] })
        ] })
      ] }) })
    ] })
  ] });
};
const VQ_CHANNELS = [
  { k: "Amazon", c: "#FF9900", rev: 482300, units: 1240, comm: 15, net: 96400, stock: "In sync", tone: "ok", fulfil: "FBA" },
  { k: "eBay", c: "#0968f6", rev: 213900, units: 540, comm: 11, net: 41200, stock: "In sync", tone: "ok", fulfil: "FBM" },
  { k: "TikTok Shop", c: "#69C9D0", rev: 168400, units: 690, comm: 8, net: 52800, stock: "Low (4 SKU)", tone: "warn", fulfil: "JIT" },
  { k: "Etsy", c: "#f1641e", rev: 74200, units: 210, comm: 6.5, net: 18900, stock: "In sync", tone: "ok", fulfil: "FBM" },
  { k: "WooCommerce", c: "#7f54b3", rev: 156e3, units: 430, comm: 0, net: 61500, stock: "Oversold (1)", tone: "bad", fulfil: "FBM" }
];
const STOCK_TONE = { ok: "text-emerald-300 bg-emerald-500/10", warn: "text-amber-300 bg-amber-500/10", bad: "text-rose-300 bg-rose-500/10" };
const VenSynQDemo = () => {
  const [syncing, setSyncing] = useState(false);
  const totalRev = VQ_CHANNELS.reduce((s, c) => s + c.rev, 0);
  const totalNet = VQ_CHANNELS.reduce((s, c) => s + c.net, 0);
  const best = VQ_CHANNELS.reduce((a, b) => b.net / b.rev > a.net / a.rev ? b : a);
  const maxNet = Math.max(...VQ_CHANNELS.map((c) => c.net));
  return /* @__PURE__ */ jsxs(DemoFrame, { title: "VenSynQ", url: "www.venqore.com/vensynq", badge: "MULTI-CHANNEL", accent: "blue", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-5 rounded-full bg-blue-500" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink tracking-tight", children: "VenSynQ — Channel Command Center" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "One inventory, every marketplace, true net margin" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setSyncing(true);
            setTimeout(() => setSyncing(false), 1400);
          },
          className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 text-1xs font-bold hover:bg-blue-500/25 transition-colors",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { size: 12, className: syncing ? "animate-spin" : "" }),
            " ",
            syncing ? "Syncing…" : "Sync now"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-wide text-ink-muted mb-1", children: "Gross Revenue" }),
        /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-ink tabular-nums", children: [
          "Rs ",
          /* @__PURE__ */ jsx(Num, { end: totalRev })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-wide text-ink-muted mb-1", children: "Net Profit" }),
        /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-emerald-300 tabular-nums", children: [
          "Rs ",
          /* @__PURE__ */ jsx(Num, { end: totalNet })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-wide text-ink-muted mb-1", children: "Channels" }),
        /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-ink", children: [
          VQ_CHANNELS.length,
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-bold", children: "connected" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-wide text-emerald-300/80 mb-1", children: "Most profitable" }),
        /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-emerald-300", children: best.k })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: VQ_CHANNELS.map((c) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 items-center gap-2 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-colors", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0", children: [
        /* @__PURE__ */ jsx("span", { className: "w-7 h-7 rounded-lg flex items-center justify-center text-1xs font-bold shrink-0", style: { background: c.c + "22", color: c.c }, children: c.k[0] }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-ink truncate", children: c.k }),
          /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted", children: [
            c.units,
            " units · ",
            c.fulfil
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:block col-span-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/[0.06] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full", style: { width: `${c.net / maxNet * 100}%`, background: c.c } }) }),
        /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted mt-1", children: [
          "net margin ",
          (c.net / c.rev * 100).toFixed(0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-4 sm:col-span-2 text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xs text-ink-muted", children: "Revenue" }),
        /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-bold text-ink tabular-nums", children: [
          "Rs ",
          group(c.rev)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-4 sm:col-span-2 text-right", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted", children: [
          "Net · ",
          c.comm,
          "% fee"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-bold text-emerald-300 tabular-nums", children: [
          "Rs ",
          group(c.net)
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "col-span-12 sm:col-span-2 flex sm:justify-end", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-3xs font-bold ${STOCK_TONE[c.tone]}`, children: c.stock }) })
    ] }, c.k)) })
  ] });
};
const BRAINS = [
  {
    key: "Customers",
    ic: Users,
    tone: "indigo",
    blurb: "Reads each customer’s own buying rhythm — not an average of everyone else’s.",
    signals: [
      {
        tag: "Running late",
        title: "Ali Traders",
        conf: 84,
        worth: 46800,
        urgency: "high",
        text: "Orders every 12 days, give or take 2. It has now been 21 — that is 4.4 standard deviations past their own pattern, not just past an average.",
        why: [
          ["Their normal gap", "12 days (± 2)"],
          ["Days since last order", "21"],
          ["How unusual", "4.4 standard deviations"],
          ["Average order", "Rs 46,800"],
          ["Lifetime profit", "Rs 312,400"]
        ],
        act: "Message on WhatsApp",
        actIc: Sparkles
      },
      {
        tag: "Spending down 41%",
        title: "Khan Kirana Store",
        conf: 71,
        worth: 128e3,
        urgency: "high",
        text: "Still buying — which is why nothing else has flagged them — but spend has fallen 41%. A quiet decline like this usually means orders are being split with someone else.",
        why: [
          ["Spend last 90 days", "Rs 184,000"],
          ["Spend previous 90 days", "Rs 312,000"],
          ["Change", "−41%"],
          ["Orders last 90 days", "7"],
          ["Products they buy", "4 (was 11)"]
        ],
        act: "Open customer",
        actIc: ChevronRight
      },
      {
        tag: "Growing fast",
        title: "Noor Distributors",
        conf: 78,
        worth: 96500,
        urgency: "low",
        text: "Increased spend 64% over 90 days across 9 orders. This is the moment to secure them — better terms, priority stock, a direct line to you.",
        why: [
          ["Spend last 90 days", "Rs 96,500"],
          ["Growth", "+64%"],
          ["Profit contributed", "Rs 21,300"],
          ["Different products bought", "14"]
        ],
        act: "Open customer",
        actIc: ChevronRight
      }
    ]
  },
  {
    key: "Stock",
    ic: Boxes,
    tone: "amber",
    blurb: "Models demand as a rate from every sale, then times alerts to your real supplier lead time.",
    signals: [
      {
        tag: "Running out in 5 days",
        title: "Alpha 12 · SKU-492",
        conf: 88,
        worth: 74200,
        urgency: "high",
        text: "You have 16 pcs left and it is selling 3.2 pcs/day. Your suppliers typically take 9 days, so this needs ordering today to avoid an empty shelf.",
        why: [
          ["Stock on hand", "16 pcs"],
          ["Sales rate", "3.2 pcs/day"],
          ["Days of cover", "5"],
          ["Your typical lead time", "9 days"],
          ["Suggested order", "96 pcs"],
          ["Trend", "+18% vs last month"]
        ],
        act: "Draft purchase order",
        actIc: Truck
      },
      {
        tag: "Dead stock",
        title: "Winter Throw · SKU-118",
        conf: 91,
        worth: 213e3,
        urgency: "high",
        text: "Rs 213,000 is sitting in this line and it has not sold in 147 days, with the oldest units bought 302 days ago. That is cash you already spent, locked in a shelf.",
        why: [
          ["Money tied up", "Rs 213,000"],
          ["Units held", "284 pcs"],
          ["Last sold", "147 days ago"],
          ["Oldest stock", "302 days old"],
          ["Sales last 90 days", "0 pcs"]
        ],
        act: "Open product",
        actIc: ChevronRight
      },
      {
        tag: "Demand jumped 71%",
        title: "Cold Brew 250ml",
        conf: 74,
        worth: 38900,
        urgency: "medium",
        text: "Now selling 11.4 units/day versus 6.7 over the past month. At the new rate your stock lasts only 12 days — order deeper than usual next time.",
        why: [
          ["Last 7 days", "11.4 units/day"],
          ["Last 30 days", "6.7 units/day"],
          ["Change", "+71%"],
          ["Days of cover", "12"],
          ["Buyers (90 days)", "186"]
        ],
        act: "Draft purchase order",
        actIc: Truck
      }
    ]
  },
  {
    key: "Profit",
    ic: Percent,
    tone: "emerald",
    blurb: "Uses real FIFO cost per line, so it sees the margin problems a revenue report cannot.",
    signals: [
      {
        tag: "Selling at a loss",
        title: "Basmati 5kg",
        conf: 92,
        worth: 18400,
        urgency: "high",
        text: "Brought in Rs 246,000 over 30 days but cost Rs 264,400 to buy — a loss of Rs 18,400. The more you sell, the more you lose.",
        why: [
          ["Revenue (30 days)", "Rs 246,000"],
          ["FIFO cost (30 days)", "Rs 264,400"],
          ["Loss", "Rs 18,400"],
          ["Current sell price", "Rs 1,640"],
          ["Last purchase cost", "Rs 1,762"],
          ["Units sold (30 days)", "150"]
        ],
        act: "Open product",
        actIc: ChevronRight
      },
      {
        tag: "Margin down 6.2 pts",
        title: "Cooking Oil 5L",
        conf: 82,
        worth: 214e3,
        urgency: "high",
        text: "Earned 11.3% margin this month against 17.5% last month, on Rs 288,000 of sales. Revenue looks fine, which is exactly why this is easy to miss.",
        why: [
          ["Margin this month", "11.3%"],
          ["Margin last month", "17.5%"],
          ["Change", "−6.2 points"],
          ["Revenue (30 days)", "Rs 288,000"],
          ["Profit lost vs last month", "Rs 17,856"]
        ],
        act: "Open product",
        actIc: ChevronRight
      },
      {
        tag: "Discounts eating profit",
        title: "Store-wide",
        conf: 80,
        worth: 386e3,
        urgency: "medium",
        text: "You gave away Rs 91,800 in discounts over 30 days — 7.4% of gross sales, up from 4.9%. Discounts come straight off profit, not off revenue.",
        why: [
          ["Discounts (30 days)", "Rs 91,800"],
          ["As % of gross sales", "7.4%"],
          ["Previously", "4.9%"],
          ["Annualised", "Rs 1,101,600"]
        ],
        act: "Open report",
        actIc: BarChart3
      }
    ]
  },
  {
    key: "Cash & Ops",
    ic: Wallet,
    tone: "cyan",
    blurb: "Watches money actually arriving, and compares this week against your own weekday history.",
    signals: [
      {
        tag: "Overdue payment",
        title: "Sadiq Enterprises",
        conf: 89,
        worth: 342e3,
        urgency: "high",
        text: "Owes Rs 342,000 across 4 unpaid invoices. The oldest (SAL-2291) is 74 days old — 59 days past your normal 15-day terms, in the 31–60 day bucket.",
        why: [
          ["Total outstanding", "Rs 342,000"],
          ["Unpaid invoices", "4"],
          ["Oldest invoice", "SAL-2291 (74 days)"],
          ["Your payment terms", "15 days"],
          ["Ageing bucket", "31–60 day"]
        ],
        act: "Send reminder",
        actIc: Sparkles
      },
      {
        tag: "Collections slowing",
        title: "Store-wide",
        conf: 77,
        worth: 264e3,
        urgency: "high",
        text: "You collected 61% of sales as cash this month, versus 83% over the previous two. Sales are not the problem; collection is.",
        why: [
          ["Collected (30 days)", "Rs 734,000"],
          ["Sales (30 days)", "Rs 1,203,000"],
          ["Conversion now", "61%"],
          ["Conversion before", "83%"],
          ["Cash not collected", "Rs 264,000"]
        ],
        act: "Open report",
        actIc: BarChart3
      },
      {
        tag: "Sales below your normal",
        title: "This week",
        conf: 73,
        worth: 187e3,
        urgency: "medium",
        text: "The last 7 days brought Rs 612,000 against the Rs 799,000 these same weekdays normally produce for you. Measured against your own history, so it is not seasonal.",
        why: [
          ["Last 7 days", "Rs 612,000"],
          ["Typical", "Rs 799,000"],
          ["Difference", "−23.4%"],
          ["Your normal week-to-week swing", "±9%"],
          ["Tue 22 Jul", "Rs 71,400 (typical Rs 118,900)"]
        ],
        act: "Open report",
        actIc: BarChart3
      }
    ]
  }
];
const GTONE = {
  indigo: { c: "text-brand-300", b: "bg-brand-500/15", bar: "bg-brand-400", br: "border-brand-400/40" },
  amber: { c: "text-amber-300", b: "bg-amber-500/15", bar: "bg-amber-400", br: "border-amber-400/40" },
  emerald: { c: "text-emerald-300", b: "bg-emerald-500/15", bar: "bg-emerald-400", br: "border-emerald-400/40" },
  cyan: { c: "text-cyan-300", b: "bg-cyan-500/15", bar: "bg-cyan-400", br: "border-cyan-400/40" }
};
const URG = {
  high: "bg-rose-500/15 text-rose-300",
  medium: "bg-amber-500/15 text-amber-300",
  low: "bg-emerald-500/15 text-emerald-300"
};
const TRACK_RECORD = [
  { l: "Stock run-out warnings", graded: 34, hit: 29 },
  { l: "Late-customer warnings", graded: 41, hit: 27 },
  { l: "Overdue payment flags", graded: 22, hit: 19 },
  { l: "Margin erosion", graded: 12, hit: 10 }
];
const GrowthEngineDemo = () => {
  const reduced = usePRM();
  const [ref, v] = useInView(0.3);
  const [brainIdx, setBrainIdx] = useState(0);
  const [sigIdx, setSigIdx] = useState(0);
  const [showProof, setShowProof] = useState(false);
  const brain = BRAINS[brainIdx];
  const sig = brain.signals[sigIdx];
  const t = GTONE[brain.tone];
  const pickBrain = (i) => {
    setBrainIdx(i);
    setSigIdx(0);
  };
  const totalGraded = TRACK_RECORD.reduce((s, r) => s + r.graded, 0);
  const totalHit = TRACK_RECORD.reduce((s, r) => s + r.hit, 0);
  const overall = Math.round(totalHit / totalGraded * 100);
  return /* @__PURE__ */ jsxs(DemoFrame, { title: "Intelligence Engine", url: "www.venqore.com/growth-engine", badge: "LIVE DEMO", accent: "violet", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 mb-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-5 rounded-full bg-brand-500" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink tracking-tight", children: "Intelligence Engine" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Four brains reading your ledger — every insight tracked and scored afterwards" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowProof((p) => !p),
          className: `px-3 py-1.5 rounded-lg border text-2xs font-bold flex items-center gap-1.5 transition-all ${showProof ? "bg-brand-500/15 text-brand-300 border-brand-400/40" : "bg-white/[0.04] text-ink-muted border-line dark:border-white/10 hover:text-neutral-200"}`,
          children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 12 }),
            " ",
            overall,
            "% accurate"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { ref, className: "grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4", children: BRAINS.map((b, i) => {
      const bt = GTONE[b.tone], on = i === brainIdx;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => pickBrain(i),
          className: `text-left p-2.5 rounded-xl border transition-all ${on ? `${bt.b} ${bt.br}` : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
              /* @__PURE__ */ jsx(b.ic, { size: 13, className: on ? bt.c : "text-ink-muted" }),
              /* @__PURE__ */ jsx("span", { className: `text-2xs font-bold uppercase tracking-wide ${on ? bt.c : "text-ink-muted"}`, children: b.key })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-1xs text-ink-muted leading-snug line-clamp-2", children: [
              b.signals.length,
              " live insights"
            ] })
          ]
        },
        b.key
      );
    }) }),
    showProof ? (
      /* ── THE LEARNING LOOP ─────────────────────────────────── */
      /* @__PURE__ */ jsxs("div", { className: "vqf-in rounded-xl border border-white/[0.06] bg-white/[0.02] p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(Target, { size: 14, className: "text-brand-300" }),
          /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-ink", children: "It scores itself" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-1xs text-ink-muted leading-relaxed mb-4", children: "Every prediction is checked afterwards against what actually happened. Types that prove accurate get more sensitive; types that keep missing get quieter, and eventually mute themselves. Observations like “this stock hasn’t sold in 90 days” are facts, not forecasts — they’re excluded rather than used to pad the score." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2.5 mb-4", children: TRACK_RECORD.map((r, i) => {
          const pct = Math.round(r.hit / r.graded * 100);
          const tone = pct >= 70 ? "bg-emerald-400" : pct >= 45 ? "bg-amber-400" : "bg-rose-400";
          return /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-1xs mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: r.l }),
              /* @__PURE__ */ jsxs("span", { className: "text-ink-muted", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-ink font-bold", children: [
                  pct,
                  "%"
                ] }),
                " · ",
                r.hit,
                "/",
                r.graded,
                " checked"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/[0.06] overflow-hidden", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: `h-full rounded-full ${tone}`,
                style: { width: reduced || v ? `${pct}%` : 0, transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s` }
              }
            ) })
          ] }, i);
        }) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: [["Insights given", 412], ["Checked", totalGraded], ["Recovered", "Rs 1.4M"]].map(([l, val], i) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white/[0.03] border border-line dark:border-white/5 p-2.5 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-widest text-ink-secondary", children: l }),
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink mt-0.5 tabular-nums", children: val })
        ] }, i)) })
      ] })
    ) : (
      /* ── SIGNAL LIST + EVIDENCE ────────────────────────────── */
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs text-ink-muted leading-snug mb-2.5", children: brain.blurb }),
          brain.signals.map((s, i) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSigIdx(i),
              className: `w-full text-left p-3 rounded-xl border transition-all ${i === sigIdx ? `${t.b} ${t.br}` : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: `text-3xs font-bold uppercase tracking-widest ${i === sigIdx ? t.c : "text-ink-muted"}`, children: s.tag }),
                  /* @__PURE__ */ jsx("span", { className: `px-1.5 py-0.5 rounded text-3xs font-bold uppercase ${URG[s.urgency]}`, children: s.urgency })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-[13px] font-bold text-ink mb-1", children: s.title }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-3xs text-ink-muted", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-emerald-300 font-bold tabular-nums", children: [
                    "Rs ",
                    group(s.worth)
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: "·" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    s.conf,
                    "% confidence"
                  ] })
                ] })
              ]
            },
            i
          ))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: `p-1.5 rounded-lg ${t.b} ${t.c}`, children: /* @__PURE__ */ jsx(brain.ic, { size: 14 }) }),
            /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-ink", children: sig.title })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ink-secondary leading-relaxed mb-3", children: sig.text }),
          /* @__PURE__ */ jsx("div", { className: "text-3xs font-bold uppercase tracking-widest text-ink-secondary mb-1.5", children: "Why we’re telling you this" }),
          /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-white/[0.06] divide-y divide-white/[0.05] mb-3", children: sig.why.map(([k, val], i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 px-3 py-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-1xs text-ink-muted", children: k }),
            /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-neutral-200 text-right tabular-nums", children: val })
          ] }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-3xs text-ink-muted mb-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Confidence" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
              sig.conf,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: `h-full rounded-full ${t.bar}`,
              style: { width: reduced || v ? `${sig.conf}%` : 0, transition: "width 1.1s cubic-bezier(0.22,1,0.36,1)" }
            }
          ) }),
          /* @__PURE__ */ jsxs("button", { className: `mt-auto w-full py-2 rounded-lg ${t.b} ${t.c} text-2xs font-bold flex items-center justify-center gap-1.5 hover:brightness-125 transition-all`, children: [
            /* @__PURE__ */ jsx(sig.actIc, { size: 12 }),
            " ",
            sig.act
          ] })
        ] })
      ] })
    )
  ] });
};
const RECIPE = {
  out: "Garam Masala 100g",
  outStock: 0,
  raw: [
    { n: "Coriander", per: 40, unit: "g", stock: 4e3 },
    { n: "Cumin", per: 30, unit: "g", stock: 3e3 },
    { n: "Red Chili", per: 20, unit: "g", stock: 2200 },
    { n: "Salt", per: 10, unit: "g", stock: 5e3 }
  ]
};
const CookbookDemo = () => {
  usePRM();
  const [mode, setMode] = useState("Make now");
  const [qty, setQty] = useState(20);
  const [ran, setRan] = useState(false);
  const cost = { Coriander: 0.9, Cumin: 1.4, "Red Chili": 1.1, Salt: 0.2 };
  const batchCost = RECIPE.raw.reduce((s, r) => s + r.per * qty * (cost[r.n] || 1), 0);
  const run = () => {
    setRan(true);
    setTimeout(() => setRan(false), 2600);
  };
  return /* @__PURE__ */ jsxs(DemoFrame, { title: "Cookbook", url: "www.venqore.com/cookbook", badge: "MANUFACTURING", accent: "amber", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-5 rounded-full bg-amber-500" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-ink tracking-tight", children: "Cookbook — Auto-Assembly" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Build composite items from a recipe — raw stock deducts automatically" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PillTabs, { tabs: ["Make now", "Auto on sale"], value: mode, onChange: setMode, size: "md" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold uppercase tracking-widest text-ink-muted", children: "Bill of Materials" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "per 1 unit" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: RECIPE.raw.map((r, i) => {
          const used = r.per * qty;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-line dark:border-white/5", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Boxes, { size: 14, className: "text-amber-300" }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-neutral-200", children: r.n }),
              /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted", children: [
                r.per,
                r.unit,
                " / unit · stock ",
                group(ran ? r.stock - used : r.stock),
                r.unit
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `text-1xs font-bold tabular-nums ${ran ? "text-rose-300 vqf-in" : "text-ink-muted"}`, children: [
              "−",
              group(used),
              r.unit
            ] })
          ] }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 rounded-xl border border-white/[0.06] bg-void-800 p-4 flex flex-col", children: [
        /* @__PURE__ */ jsx("div", { className: "text-1xs font-bold uppercase tracking-widest text-ink-muted mb-2", children: "Output" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-lg", children: "🧂" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[13px] font-bold text-ink", children: RECIPE.out }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xs text-ink-muted", children: [
              "finished good · stock ",
              ran ? qty : RECIPE.outStock
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-1xs text-ink-muted", children: "Quantity" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 ml-auto", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setQty((q) => Math.max(5, q - 5)), className: "w-6 h-6 rounded bg-sunken dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-secondary", children: /* @__PURE__ */ jsx(Minus, { size: 12 }) }),
            /* @__PURE__ */ jsx("span", { className: "w-8 text-center text-[13px] font-bold text-ink tabular-nums", children: qty }),
            /* @__PURE__ */ jsx("button", { onClick: () => setQty((q) => q + 5), className: "w-6 h-6 rounded bg-sunken dark:bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-secondary", children: /* @__PURE__ */ jsx(Plus, { size: 12 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white/[0.03] border border-line dark:border-white/5 p-2.5 mb-3 text-1xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
            /* @__PURE__ */ jsx("span", { children: "Batch cost (FIFO)" }),
            /* @__PURE__ */ jsxs("span", { className: "text-ink font-bold tabular-nums", children: [
              "Rs ",
              group(batchCost)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted mt-1", children: [
            /* @__PURE__ */ jsx("span", { children: "Cost / unit" }),
            /* @__PURE__ */ jsxs("span", { className: "text-amber-300 font-bold tabular-nums", children: [
              "Rs ",
              group(batchCost / qty, 1)
            ] })
          ] })
        ] }),
        ran ? /* @__PURE__ */ jsxs("div", { className: "mt-auto vqf-in rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center", children: [
          /* @__PURE__ */ jsx(Check, { size: 18, className: "text-emerald-600 dark:text-emerald-400 mx-auto mb-1" }),
          /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-ink", children: mode === "Make now" ? `${qty} units produced` : "Auto-assembled on sale" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Raw stock deducted · journal posted" })
        ] }) : /* @__PURE__ */ jsxs("button", { onClick: run, className: "mt-auto w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1a1200] font-bold text-[12px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Factory, { size: 15 }),
          " ",
          mode === "Make now" ? "Produce batch" : "Simulate a sale"
        ] })
      ] })
    ] })
  ] });
};
const DemoStyles = () => /* @__PURE__ */ jsx("style", { children: `
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        @keyframes vqf-blink { 0%,100%{opacity:1;} 50%{opacity:.25;} }
        .vqf-blink { animation: vqf-blink 1.6s ease-in-out infinite; }
        @keyframes vqf-in { 0%{opacity:0;transform:translateY(8px);} 100%{opacity:1;transform:none;} }
        .vqf-in { animation: vqf-in .45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes vqf-scan { 0%{top:6%;} 50%{top:86%;} 100%{top:6%;} }
        .vqf-scan { animation: vqf-scan 1.5s ease-in-out infinite; }
        @keyframes vqf-wave { 0%,100%{transform:scaleY(.3);} 50%{transform:scaleY(1);} }
        .vqf-wave { transform-origin:bottom; animation: vqf-wave .9s ease-in-out infinite; }
        @keyframes vqf-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:.85;} }
        .vqf-pulse { animation: vqf-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .vqf-blink,.vqf-scan,.vqf-wave,.vqf-pulse{animation:none!important;} }
` });
export {
  CookbookDemo,
  DemoFrame,
  DemoStyles,
  GrowthEngineDemo,
  Num,
  PillTabs,
  PosInvoiceDemo,
  ProfitLossDemo,
  SmartCaptureDemo,
  VenSynQDemo,
  useInView,
  usePRM
};
