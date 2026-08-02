import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { Clock, CreditCard, ArrowRight } from "lucide-react";
function TrialExpired() {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex items-center justify-center p-6", children: [
    /* @__PURE__ */ jsx(Head, { title: "Trial Expired — VenQore" }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[140px]" }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-lg text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6", children: /* @__PURE__ */ jsx(Clock, { size: 28, className: "text-amber-400" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-white mb-2", children: "Your Trial Has Ended" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mb-8", children: "Your 14-day free trial has expired. Upgrade to a plan to continue using VenQore." }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/3 p-6 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-5 text-left", children: [
          /* @__PURE__ */ jsx(PlanCard, { plan: "Starter", price: "$12", color: "slate", features: ["Everything in trial", "3 staff", "1 warehouse"] }),
          /* @__PURE__ */ jsx(PlanCard, { plan: "Growth", price: "$24", color: "indigo", features: ["10 staff", "3 warehouses", "AI Engine"], badge: "Popular" }),
          /* @__PURE__ */ jsx(PlanCard, { plan: "Business", price: "$49", color: "purple", features: ["Unlimited staff", "API access", "White-label"] })
        ] }),
        store && /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.billing", { store_slug: store.slug }),
            className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl\n                                bg-gradient-to-r from-indigo-500 to-purple-600\n                                hover:from-indigo-400 hover:to-purple-500\n                                text-white font-bold transition-all hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsx(CreditCard, { size: 16 }),
              " Upgrade Now ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
            ]
          }
        )
      ] }),
      false,
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-4 mt-6", children: [
        /* @__PURE__ */ jsx(Link, { href: route("hub"), className: "text-sm text-slate-500 hover:text-slate-300 transition-colors", children: "Switch store" }),
        /* @__PURE__ */ jsx(Link, { href: route("logout"), method: "post", as: "button", className: "text-sm text-slate-500 hover:text-slate-300 transition-colors", children: "Sign out" })
      ] })
    ] })
  ] });
}
function PlanCard({ plan, price, color, features, badge }) {
  const colors = {
    slate: { header: "bg-slate-500/10 border-slate-500/20 text-slate-300", dot: "bg-slate-400" },
    indigo: { header: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300", dot: "bg-indigo-400" },
    purple: { header: "bg-purple-500/10 border-purple-500/20 text-purple-300", dot: "bg-purple-400" }
  };
  const cfg = colors[color];
  return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-3 relative ${cfg.header}`, children: [
    badge && /* @__PURE__ */ jsx("div", { className: "absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-500 text-2xs font-bold text-white whitespace-nowrap", children: badge }),
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold mb-0.5", children: plan }),
    /* @__PURE__ */ jsxs("p", { className: "text-lg font-black mb-2", children: [
      price,
      /* @__PURE__ */ jsx("span", { className: "text-xs font-normal opacity-60", children: "/mo" })
    ] }),
    features.map((f) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-2xs text-slate-400 mb-1", children: [
      /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}` }),
      f
    ] }, f))
  ] });
}
export {
  TrialExpired as default
};
