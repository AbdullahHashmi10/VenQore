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
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Your Trial Has Ended" }),
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mb-8", children: "Your 14-day free trial has expired. Upgrade to a plan to continue using VenQore." }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/3 p-6 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-5 text-left", children: [
          /* @__PURE__ */ jsx(PlanCard, { plan: "Starter", price: "$49", color: "slate", features: ["1 location, 1 seat", "5,000 SKUs", "Full history"] }),
          /* @__PURE__ */ jsx(PlanCard, { plan: "Core", price: "$99", color: "indigo", features: ["5 seats, API access", "25,000 SKUs", "Multi-branch"], badge: "Popular" }),
          /* @__PURE__ */ jsx(PlanCard, { plan: "Scale", price: "$299", color: "purple", features: ["25 seats, white-label", "250,000 SKUs", "2 channel syncs"] })
        ] }),
        store && /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.billing", { store_slug: store.slug }),
            className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl\n bg-gradient-brand\n \n text-white font-bold transition-all",
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
        /* @__PURE__ */ jsx(Link, { href: route("hub"), className: "text-sm text-ink-muted hover:text-neutral-300 transition-colors", children: "Switch store" }),
        /* @__PURE__ */ jsx(Link, { href: route("logout"), method: "post", as: "button", className: "text-sm text-ink-muted hover:text-neutral-300 transition-colors", children: "Sign out" })
      ] })
    ] })
  ] });
}
function PlanCard({ plan, price, color, features, badge }) {
  const colors = {
    slate: { header: "bg-neutral-500/10 border-line-strong text-neutral-300", dot: "bg-neutral-400" },
    indigo: { header: "bg-brand-500/10 border-brand-500/20 text-brand-300", dot: "bg-brand-400" },
    purple: { header: "bg-brand-500/10 border-brand-500/20 text-brand-300", dot: "bg-brand-400" }
  };
  const cfg = colors[color];
  return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-3 relative ${cfg.header}`, children: [
    badge && /* @__PURE__ */ jsx("div", { className: "absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-500 text-2xs font-bold text-white whitespace-nowrap", children: badge }),
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold mb-0.5", children: plan }),
    /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold mb-2", children: [
      price,
      /* @__PURE__ */ jsx("span", { className: "text-xs font-normal opacity-60", children: "/mo" })
    ] }),
    features.map((f) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-2xs text-ink-muted mb-1", children: [
      /* @__PURE__ */ jsx("div", { className: `w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}` }),
      f
    ] }, f))
  ] });
}
export {
  TrialExpired as default
};
