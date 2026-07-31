import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Sparkles, Crown, TrendingUp, Zap, Check, ArrowRight, ShieldCheck, Clock, CreditCard } from "lucide-react";
const TIER_STYLES = {
  starter: {
    icon: Zap,
    iconBg: "bg-blue-500/10 text-blue-400",
    accentFrom: "from-blue-500/[0.10]",
    accentBorder: "border-blue-500/40",
    glow: "shadow-blue-900/30",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    dot: "text-blue-400"
  },
  growth: {
    icon: TrendingUp,
    iconBg: "bg-indigo-500/10 text-indigo-400",
    accentFrom: "from-indigo-500/[0.12]",
    accentBorder: "border-indigo-500/50",
    glow: "shadow-indigo-900/40",
    badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    dot: "text-indigo-400"
  },
  business: {
    icon: Crown,
    iconBg: "bg-purple-500/10 text-purple-400",
    accentFrom: "from-purple-500/[0.10]",
    accentBorder: "border-purple-500/40",
    glow: "shadow-purple-900/30",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    dot: "text-purple-400"
  }
};
const INTERVALS = [
  { key: "monthly", label: "Monthly" },
  { key: "annual", label: "Annual", badge: "Save 20%" }
];
function SelectPlan({ plans = [], currency = { code: "USD", symbol: "$" }, trial_days = 14 }) {
  const { geo } = usePage().props;
  const symbol = currency?.symbol || geo?.symbol || "$";
  const [interval, setInterval] = useState("monthly");
  const [selected, setSelected] = useState(
    plans.find((p) => p.popular)?.slug || plans[0]?.slug || "growth"
  );
  const fmt = (n) => {
    const val = Number(n || 0);
    const rounded = Number.isInteger(val) ? val : Math.round(val);
    return symbol === "Rs" ? `Rs ${rounded.toLocaleString()}` : `${symbol}${rounded.toLocaleString()}`;
  };
  const perMonth = (plan) => interval === "annual" ? plan.price_annual : plan.price_monthly;
  const proceed = (slug) => {
    router.visit(route("store.create", { plan: slug, interval }));
  };
  const selectedPlan = plans.find((p) => p.slug === selected);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#02000f] text-white font-sans", children: [
    /* @__PURE__ */ jsx(Head, { title: "Choose your plan — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[140px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px]" })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-8 w-8 object-contain" }),
        /* @__PURE__ */ jsxs("span", { className: "font-black text-lg text-white", children: [
          "VenQore",
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("hub"),
          className: "flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            " Back"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-6xl mx-auto px-6 py-10 sm:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-9", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-5", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
          trial_days,
          "-day free trial · No card required"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl sm:text-4xl font-black tracking-tight text-white mb-3", children: "Choose a plan to start your trial" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-base max-w-xl mx-auto", children: [
          "Pick the plan that fits your store. You won't be charged today — we'll only bill you when your ",
          trial_days,
          "-day trial ends, and you can cancel anytime."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mt-7", children: /* @__PURE__ */ jsx("div", { className: "inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]", children: INTERVALS.map((opt) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setInterval(opt.key),
            className: `relative px-5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 ${interval === opt.key ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`,
            children: [
              opt.label,
              opt.badge && /* @__PURE__ */ jsx("span", { className: "absolute -top-2.5 -right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-black rounded-full whitespace-nowrap", children: opt.badge })
            ]
          },
          opt.key
        )) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5 mb-8", children: plans.map((plan) => {
        const style = TIER_STYLES[plan.slug] || TIER_STYLES.starter;
        const PlanIcon = style.icon;
        const isSelected = selected === plan.slug;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            id: `plan-${plan.slug}`,
            onClick: () => setSelected(plan.slug),
            className: `relative rounded-[1.75rem] border cursor-pointer overflow-hidden transition-all duration-300 flex flex-col
                                    ${isSelected ? `bg-gradient-to-b ${style.accentFrom} to-transparent ${style.accentBorder} shadow-2xl ${style.glow} scale-[1.015]` : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15"}`,
            children: [
              plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500" }),
              plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute top-3 right-4", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[9px] font-black tracking-widest uppercase", children: "Most Popular" }) }),
              /* @__PURE__ */ jsxs("div", { className: "p-6 sm:p-7", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-5", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`, children: /* @__PURE__ */ jsx(PlanIcon, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-white font-black text-base tracking-tight", children: plan.name }),
                    isSelected && /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border ${style.badge}`, children: "Selected" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-4xl font-black text-white tracking-tight", children: fmt(perMonth(plan)) }),
                    /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-sm font-semibold", children: "/mo" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-semibold mt-1 block", children: interval === "annual" ? `billed annually — ${fmt(plan.annual_total)}/yr` : "billed monthly" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 leading-relaxed mb-5", children: plan.tagline }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: plan.features.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                  /* @__PURE__ */ jsx(Check, { size: 12, className: `${style.dot} flex-shrink-0` }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-300", children: f })
                ] }, i)) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "px-6 sm:px-7 pb-6 pt-2 mt-auto", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    proceed(plan.slug);
                  },
                  className: `w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 ${isSelected ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]"}`,
                  children: [
                    "Start ",
                    plan.name,
                    " trial ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
                  ]
                }
              ) })
            ]
          },
          plan.slug
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: "text-emerald-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-white", children: selectedPlan ? `${selectedPlan.name} · ${interval === "annual" ? "Annual" : "Monthly"}` : "Select a plan" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-0.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 11, className: "text-slate-500" }),
                "Free for ",
                selectedPlan?.trial_days ?? trial_days,
                " days, then",
                " ",
                selectedPlan ? `${fmt(interval === "annual" ? selectedPlan.annual_total : selectedPlan.price_monthly)}/${interval === "annual" ? "yr" : "mo"}` : "—"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              id: "select-plan-continue",
              onClick: () => selected && proceed(selected),
              disabled: !selected,
              className: "flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 whitespace-nowrap",
              children: [
                "Continue ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-center sm:text-left text-[11px] text-slate-500 mt-4 flex items-center gap-1.5 justify-center sm:justify-start", children: [
          /* @__PURE__ */ jsx(CreditCard, { size: 11 }),
          " No credit card required to start. Cancel anytime before your trial ends."
        ] })
      ] })
    ] })
  ] });
}
export {
  SelectPlan as default
};
