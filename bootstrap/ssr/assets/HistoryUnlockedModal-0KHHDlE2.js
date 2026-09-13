import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { T as ThinkingOrb } from "./ThinkingOrb-DGYTy5s1.js";
import { Sparkles, Database, TrendingUp, Package, ShieldCheck, ArrowRight } from "lucide-react";
function HistoryUnlockedModal({ isOpen, onClose, moduleName = "Inventory", historyData }) {
  if (!isOpen) return null;
  const metrics = historyData || {
    months_tracked: 8,
    recorded_sales: 1420,
    recorded_products: 48,
    stock_value: 847300
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fadeIn", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-xl overflow-hidden bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl ", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 md:p-8 space-y-6 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2 bg-neutral-800/80 border border-neutral-700 rounded-2xl flex items-center justify-center shadow-inner", children: /* @__PURE__ */ jsx(ThinkingOrb, { state: "weaving", size: 48, theme: "dark" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-full text-brand-300 text-xs font-semibold mb-1", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "The Qore Ledger Advantage" })
          ] }),
          /* @__PURE__ */ jsxs("h2", { className: "text-xl md:text-2xl font-bold text-white tracking-tight", children: [
            "Welcome to ",
            moduleName
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl space-y-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-neutral-200 text-sm md:text-base font-medium", children: [
          "✨ ",
          /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-bold", children: "VenQore has been tracking this for you since March." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-xs md:text-sm leading-relaxed", children: "Because The Qore's double-entry ledger always records in the background, your new module is ready with verified historical data from day one." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted text-xs font-medium mb-1", children: [
            /* @__PURE__ */ jsx(Database, { size: 14, className: "text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Movement History" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg md:text-xl font-bold text-white", children: [
            metrics.months_tracked,
            " Months"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted text-xs font-medium mb-1", children: [
            /* @__PURE__ */ jsx(TrendingUp, { size: 14, className: "text-emerald-400" }),
            /* @__PURE__ */ jsx("span", { children: "Recorded Movements" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg md:text-xl font-bold text-emerald-400", children: [
            metrics.recorded_sales?.toLocaleString() || 1420,
            " Rows"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted text-xs font-medium mb-1", children: [
            /* @__PURE__ */ jsx(Package, { size: 14, className: "text-amber-400" }),
            /* @__PURE__ */ jsx("span", { children: "Tracked Items" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg md:text-xl font-bold text-white", children: [
            metrics.recorded_products || 48,
            " Products"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-muted text-xs font-medium mb-1", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 14, className: "text-brand-400" }),
            /* @__PURE__ */ jsx("span", { children: "Current Stock Value" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg md:text-xl font-bold text-brand-300", children: [
            "Rs. ",
            metrics.stock_value?.toLocaleString() || "847,300"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onClose,
          className: "w-full py-3.5 px-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-98",
          children: [
            /* @__PURE__ */ jsx("span", { children: "Explore Unlocked History" }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
          ]
        }
      ) })
    ] })
  ] }) });
}
export {
  HistoryUnlockedModal as default
};
