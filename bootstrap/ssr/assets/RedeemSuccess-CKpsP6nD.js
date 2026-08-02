import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head } from "@inertiajs/react";
import { Sparkles, ArrowRight, ExternalLink } from "lucide-react";
function RedeemSuccess({ type, plan, description, codes_used, subdomain, login_url }) {
  const planColor = {
    ltd_1: "from-slate-400 to-slate-600",
    ltd_2: "from-indigo-400 to-purple-500",
    ltd_3: "from-amber-400 to-orange-500"
  }[plan] || "from-indigo-400 to-purple-500";
  const planEmoji = { ltd_1: "⚡", ltd_2: "🚀", ltd_3: "👑" }[plan] || "✨";
  const nextTierMessage = codes_used < 3 ? `Stack ${3 - codes_used} more code${3 - codes_used > 1 ? "s" : ""} to upgrade to ${codes_used + 1 === 2 ? "Growth" : "Business"} plan.` : "You have the maximum 3 codes stacked — Business plan unlocked. 🎉";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex items-center justify-center p-8", children: [
    /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("title", { children: "License Activated — VenQore" }) }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" }) }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-xl w-full text-center", children: [
      /* @__PURE__ */ jsx("div", { className: `w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br ${planColor} flex items-center justify-center text-4xl mb-8 shadow-2xl animate-bounce`, children: planEmoji }),
      /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx("span", { className: "px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest", children: type === "stacked" ? "Plan Upgraded" : "License Activated" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black mt-4 mb-3 tracking-tight", children: type === "stacked" ? "Code Stacked Successfully!" : "Welcome to VenQore!" }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-lg mb-8 leading-relaxed", children: [
        "Your lifetime license is active.",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: `font-bold bg-gradient-to-r ${planColor} bg-clip-text text-transparent`, children: description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-3 mb-6", children: [1, 2, 3].map((n) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all ${n <= codes_used ? `bg-gradient-to-br ${planColor} border-transparent text-white shadow-lg` : "bg-white/5 border-white/10 text-slate-600"}`,
          children: n
        },
        n
      )) }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs mb-10", children: nextTierMessage }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: login_url,
            id: "success-goto-dashboard",
            className: "flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
              type === "new" ? "Set Up My Store" : "Go to Dashboard",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400", children: [
          /* @__PURE__ */ jsx(ExternalLink, { size: 13, className: "shrink-0 text-slate-500" }),
          /* @__PURE__ */ jsx("span", { className: "truncate text-slate-500", children: login_url })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-700 text-xs mt-8", children: [
        "Bookmark your store URL. Your store lives at",
        " ",
        /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
          subdomain,
          ".venqore.com"
        ] })
      ] })
    ] })
  ] });
}
export {
  RedeemSuccess as default
};
