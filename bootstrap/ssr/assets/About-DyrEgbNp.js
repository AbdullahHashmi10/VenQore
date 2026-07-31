import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import MarketingLayout, { RevealOnScroll, SectionLabel, MagneticButton, GlassCard } from "./MarketingLayout-CMiC1Bik.js";
import { BookOpen, ArrowRight, Calculator, AlertTriangle, Fingerprint, Sparkles, Zap, Boxes, Lock, Eye, Search, ShieldCheck, Receipt, Wallet, Scale, RefreshCw, Gauge, CheckCircle2, Database, Activity, TrendingUp, Crosshair, Heart, Lightbulb, Quote, Building2 } from "lucide-react";
import "@inertiajs/react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
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
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setV(true);
        o.unobserve(el);
      }
    }, { threshold });
    o.observe(el);
    return () => o.disconnect();
  }, [threshold]);
  return [ref, v];
}
const grp = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const Num = ({ end, prefix = "", suffix = "", dur = 1800 }) => {
  const reduced = usePRM();
  const [val, setVal] = useState(0);
  const [ref, v] = useInView(0.5);
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
    grp(val),
    suffix
  ] });
};
const TRUTHS = [
  { ic: AlertTriangle, c: "rose", t: "Tax counted as revenue", d: "Most systems fold the VAT/GST you owe the government straight into your “revenue.” Your top line looks 10-20% bigger than it is." },
  { ic: Calculator, c: "amber", t: "Profit from a guessed cost", d: "Weighted-average costing overwrites what you actually paid. Every margin you read is built on a number that no longer exists." },
  { ic: Fingerprint, c: "indigo", t: "Books you can silently edit", d: "If a past sale can be changed with no reversal trail, that is not accounting — it is a spreadsheet pretending to be one." }
];
const DETAILS = [
  { ic: Zap, t: "Carts survive a power cut", d: "An active sale is saved to the device before the server even knows. Lights flicker, the bill is still there." },
  { ic: Boxes, t: "FIFO cost, per batch", d: "We track the real price of every batch you bought — never a blended average — so COGS is the truth." },
  { ic: Calculator, t: "Tax never inflates revenue", d: "Output tax is separated at the ledger level the instant a sale posts." },
  { ic: Lock, t: "Posted entries are immutable", d: "Corrections happen through balanced reversals, leaving a clean audit trail — not edits." },
  { ic: Eye, t: "Senior mode", d: "One toggle bumps every font 40% with high-contrast, traffic-light colors for tired eyes on long shifts." },
  { ic: Search, t: "Typo-tolerant search", d: "Cashiers find the product even when they misspell it. Queues do not wait for spelling." },
  { ic: ShieldCheck, t: "Negative-stock lock", d: "Optionally hard-block a sale when the shelf is empty, so your counts never silently go negative." },
  { ic: Receipt, t: "Receipts that cut clean", d: "Padding lines so totals always clear the thermal cutter — a tiny thing you would only notice if it were wrong." },
  { ic: Wallet, t: "Change-due, instantly", d: "The exact cash to hand back appears the moment payment is entered. No mental math at the counter." },
  { ic: Scale, t: "Reconciled to the cent", d: "Dashboard summaries are verified against the general ledger — if they ever disagreed, the build would fail." },
  { ic: RefreshCw, t: "Live across every terminal", d: "Sell on one register and every screen in the store updates instantly — no refresh, no drift." },
  { ic: Gauge, t: "Live in 15 minutes", d: "Type your store name and we seed units, taxes and categories for your industry. That is the whole setup." }
];
const TONE = {
  rose: { c: "text-rose-400", b: "bg-rose-500/[0.06] border-rose-500/15" },
  amber: { c: "text-amber-400", b: "bg-amber-500/[0.06] border-amber-500/15" },
  indigo: { c: "text-indigo-400", b: "bg-indigo-500/[0.06] border-indigo-500/15" }
};
const TIMELINE = [
  { k: "The frustration", d: "Owners ringing up a thousand sales a day still could not answer one question: did I actually make money this month?" },
  { k: "The decision", d: "Instead of bolting reports onto a cash register, we chose to rebuild retail software on a real double-entry foundation." },
  { k: "The engine", d: "A DECIMAL(20,4) ledger with a FIFO cost core — wrapped in 665+ automated tests so the math can never quietly drift." },
  { k: "The platform", d: "226+ features grew on top of that engine: POS, inventory, manufacturing, AI and 40+ reports — one connected system." },
  { k: "Today", d: "From a single counter to multi-store operations, VenQore gives owners one number they can finally trust." }
];
const PRINCIPLES = [
  { ic: Scale, t: "Accuracy over approximation", d: "If a number is not provably correct, it does not ship. The ledger is the source of truth, always." },
  { ic: Zap, t: "Speed without lies", d: "Fast checkout and correct books are not a trade-off. You get both, or we have not finished." },
  { ic: Crosshair, t: "Every feature earns its place", d: "Each capability traces back to a real problem a real operator hit on a real shop floor." },
  { ic: Heart, t: "The operator comes first", d: "We design for the person at the counter at closing time — not for a slide in a sales deck." },
  { ic: Fingerprint, t: "Trust is non-negotiable", d: "Immutable records, isolated stores, your data exportable any time. We never hold it hostage." },
  { ic: Lightbulb, t: "Sweat the small things", d: "The details nobody markets are the ones that break — or save — a real business day." }
];
const INDUSTRIES = ["Retail", "Grocery", "Food & Beverage", "Fashion", "Electronics", "Wholesale", "Pharmacy", "Hardware", "Manufacturing"];
const TimelineItem = ({ item, i, last }) => {
  const [ref, v] = useInView(0.5);
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative pl-14 pb-10", children: [
    !last && /* @__PURE__ */ jsx("span", { className: "absolute left-[18px] top-9 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" }),
    /* @__PURE__ */ jsx(
      "span",
      {
        className: `absolute left-0 top-1 w-9 h-9 rounded-full border flex items-center justify-center text-[12px] font-black transition-all duration-700 ${v ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-200 scale-100" : "bg-white/[0.02] border-white/10 text-slate-600 scale-90"}`,
        style: { transitionDelay: `${i * 0.05}s` },
        children: i + 1
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { opacity: v ? 1 : 0, transform: v ? "none" : "translateY(16px)", transition: "opacity .7s cubic-bezier(0.22,1,0.36,1), transform .7s cubic-bezier(0.22,1,0.36,1)" }, children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl md:text-2xl font-black text-white tracking-tight font-display mb-2", children: item.k }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-400 leading-relaxed max-w-2xl", children: item.d })
    ] })
  ] });
};
function About() {
  return /* @__PURE__ */ jsxs(MarketingLayout, { title: "About — VenQore", description: "We were tired of software that lies about your money — so we rebuilt retail on real accounting and obsessed over every detail in between. This is the VenQore story.", children: [
    /* @__PURE__ */ jsx("section", { className: "relative pt-40 md:pt-48 pb-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsx(SectionLabel, { icon: BookOpen, children: "Our story" }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.08, children: /* @__PURE__ */ jsxs("h1", { className: "text-[2.5rem] xs:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] sm:leading-[0.9] mb-8 font-display", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent", children: "Most software guesses." }),
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "vq-headline-grad vq-text-glow", children: "We refused to." })
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.16, children: /* @__PURE__ */ jsxs("p", { className: "text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium", children: [
        "VenQore began with one maddening problem: a shop could ring up a thousand sales a day and still not answer — ",
        /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: "did I actually make money?" }),
        " So we rebuilt retail software on real accounting, and obsessed over every tiny detail in between."
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.24, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mt-10", children: [
        /* @__PURE__ */ jsxs(MagneticButton, { href: "/demo", variant: "primary", children: [
          "See it live ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
        ] }),
        /* @__PURE__ */ jsx(MagneticButton, { href: "/features", variant: "ghost", children: "Explore the platform" })
      ] }) }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.3, children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16 border-t border-white/[0.06] pt-10", children: [{ e: 226, s: "+", l: "Features" }, { e: 665, s: "+", l: "Tests Passed" }, { e: 40, s: "+", l: "Reports" }, { e: 5, s: "", l: "Audit Layers" }].map((x, i) => /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl md:text-4xl font-black text-white tracking-tighter font-display", children: /* @__PURE__ */ jsx(Num, { end: x.e, suffix: x.s }) }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-600 font-black uppercase tracking-[0.22em] mt-1", children: x.l })
      ] }, i)) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs(GlassCard, { hover: false, padding: "p-8 md:p-16", className: "overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-10 text-white/[0.025] pointer-events-none", children: /* @__PURE__ */ jsx(Calculator, { size: 240, strokeWidth: 0.3 }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-4xl", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: AlertTriangle, children: "The uncomfortable truth" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black tracking-tighter text-white mb-8 leading-[0.9] font-display", children: [
          "Your software has been",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent italic", children: "lying to you." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mb-12", children: "Not on purpose — structurally. We lived these three lies for years before we decided to end them. They are the reason VenQore exists." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: TRUTHS.map((c, i) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1 + i * 0.1, children: /* @__PURE__ */ jsxs("div", { className: `h-full p-7 rounded-3xl border ${TONE[c.c].b} transition-all duration-500 hover:-translate-y-1`, children: [
          /* @__PURE__ */ jsx(c.ic, { className: `${TONE[c.c].c} mb-5`, size: 26 }),
          /* @__PURE__ */ jsx("h4", { className: "text-white font-bold mb-2.5 tracking-tight text-lg font-display", children: c.t }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed", children: c.d })
        ] }) }, i)) })
      ] })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-14 max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: Sparkles, children: "Attention to detail" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.92] font-display", children: [
          "We sweat the small stuff —",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "because you live in it." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-base md:text-lg mt-5", children: "A real business day is a thousand tiny frictions. Most software ignores them. We treat each one as a feature worth building. Here are a few we obsess over." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: DETAILS.map((d, i) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: i % 3 * 0.07, children: /* @__PURE__ */ jsxs("div", { className: "group h-full p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/25 transition-all duration-500 hover:-translate-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-indigo-500/12 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", children: /* @__PURE__ */ jsx(d.ic, { size: 20 }) }),
        /* @__PURE__ */ jsx("h4", { className: "text-white font-bold text-[15px] tracking-tight mb-1.5 font-display", children: d.t }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[13px] leading-relaxed", children: d.d })
      ] }) }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6 border-y border-white/5", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center", children: [
      /* @__PURE__ */ jsxs(RevealOnScroll, { direction: "right", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: ShieldCheck, children: "Proof, not promises" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.92] mb-6 font-display", children: [
          "Built like financial",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: "infrastructure." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-lg leading-relaxed mb-8 max-w-xl", children: "Anyone can claim accuracy. We make it verifiable. The accounting core is guarded by five layers of automated checks, and the whole system is re-tested on every release — because trust you cannot measure is just marketing." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
          ["One controlled gateway", "All financial writes pass a single audited path — no back-door edits."],
          ["Live balances, never cached", "Every figure is computed from raw entries, so it cannot drift."],
          ["One reporting engine", "Dashboard, P&L and balance sheet read the same source and always agree."]
        ].map((r, i) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: i * 0.08, direction: "right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02]", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 18, className: "text-emerald-400 mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-white font-bold text-[14px]", children: r[0] }),
            /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-[13px] leading-snug", children: r[1] })
          ] })
        ] }) }, i)) })
      ] }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.12, direction: "left", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: [
        { e: 665, s: "+", l: "Tests Passed", ic: CheckCircle2, c: "text-emerald-300" },
        { e: 4e3, s: "+", l: "Integrity Checks", ic: Database, c: "text-indigo-300" },
        { e: 13, s: "", l: "E2E Scenarios", ic: Activity, c: "text-cyan-300" },
        { e: 0, s: "", disp: "DECIMAL(20,4)", l: "Ledger Precision", ic: Scale, c: "text-violet-300" }
      ].map((x, i) => /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl border border-white/[0.07] bg-white/[0.02] hover:border-indigo-400/20 transition-colors duration-500", children: [
        /* @__PURE__ */ jsx(x.ic, { size: 22, className: `${x.c} mb-4` }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl md:text-3xl font-black text-white tracking-tighter font-display mb-1", children: x.disp ? /* @__PURE__ */ jsx("span", { className: "text-lg md:text-xl", children: x.disp }) : /* @__PURE__ */ jsx(Num, { end: x.e, suffix: x.s }) }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]", children: x.l })
      ] }, i)) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: TrendingUp, children: "The journey" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-5xl font-black text-white tracking-tighter font-display leading-[0.95]", children: [
          "From frustration",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "to financial truth." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { children: TIMELINE.map((t, i) => /* @__PURE__ */ jsx(TimelineItem, { item: t, i, last: i === TIMELINE.length - 1 }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-14 max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: Crosshair, children: "What we believe" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.92] font-display", children: [
          "Six principles we",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "refuse to bend." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: PRINCIPLES.map((p, i) => /* @__PURE__ */ jsx(RevealOnScroll, { delay: i % 3 * 0.07, children: /* @__PURE__ */ jsxs(GlassCard, { className: "h-full", padding: "p-7", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-indigo-500/12 text-indigo-300 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500", children: /* @__PURE__ */ jsx(p.ic, { size: 22 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-white tracking-tight mb-2 font-display", children: p.t }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed", children: p.d })
      ] }) }, i)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 md:py-28 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs(GlassCard, { hover: false, padding: "p-10 md:p-16", className: "text-center overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 vq-dot-pattern opacity-30 pointer-events-none" }),
      /* @__PURE__ */ jsx(Quote, { size: 36, className: "text-indigo-400/50 mx-auto mb-6 relative z-10" }),
      /* @__PURE__ */ jsx("p", { className: "relative z-10 text-2xl md:text-4xl font-black text-white tracking-tight leading-[1.15] font-display", children: "“We are not trying to be the biggest POS. We are trying to be the one whose numbers you never have to question.”" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]", children: "— The VenQore Team" })
    ] }) }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 md:py-20 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto text-center", children: [
      /* @__PURE__ */ jsxs(RevealOnScroll, { children: [
        /* @__PURE__ */ jsx(SectionLabel, { icon: Building2, children: "Built for real businesses" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-5xl font-black text-white tracking-tighter font-display mb-10 leading-[0.95]", children: [
          "If you sell something,",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "we built this for you." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-3", children: INDUSTRIES.map((x) => /* @__PURE__ */ jsx("span", { className: "px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.025] text-sm font-bold text-slate-300 hover:border-indigo-400/30 hover:text-white transition-colors", children: x }, x)) }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-28 md:py-36 px-6 text-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" }),
      /* @__PURE__ */ jsxs(RevealOnScroll, { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.95] relative z-10 font-display", children: [
          "Run your business on",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "vq-headline-grad", children: "numbers you trust." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed relative z-10", children: "14-day free trial · full access · no credit card · live in 15 minutes." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10", children: [
          /* @__PURE__ */ jsxs(MagneticButton, { href: "/register", variant: "primary", children: [
            "Start Free Trial ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
          ] }),
          /* @__PURE__ */ jsx(MagneticButton, { href: "/contact", variant: "ghost", children: "Talk to us" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  About as default
};
