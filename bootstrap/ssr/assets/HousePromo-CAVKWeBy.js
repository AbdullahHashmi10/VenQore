import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Check, ArrowRight } from "lucide-react";
function HousePromo() {
  const points = [
    "Barcodes generated automatically on every product",
    "Offline-first POS that never stops selling",
    "Real double-entry books, always balanced",
    "Invoices, POs and receipts made from live inventory data",
    "FIFO stock costing and multi-store sync built in"
  ];
  const stats = [
    { value: "14", label: "day free trial" },
    { value: "0", label: "setup fees" }
  ];
  return /* @__PURE__ */ jsx("aside", { className: "hidden xl:block w-80 shrink-0 sticky top-36 self-start max-h-[calc(100vh-11rem)] overflow-y-auto space-y-4 pb-2", children: /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/20 dark:to-violet-600/10 border border-indigo-500/20", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-3", children: "From the makers of this tool" }),
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug", children: "Stop doing this by hand, one item at a time." }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5", children: "VenQore is an offline-first POS & ERP that generates barcodes, invoices, receipts and purchase orders automatically from the inventory you already have — no manual re-entry." }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-2.5 mb-5", children: points.map((p) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400", children: [
      /* @__PURE__ */ jsx(Check, { size: 13, className: "text-emerald-500 mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "leading-snug", children: p })
    ] }, p)) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 mb-5", children: stats.map((s) => /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-slate-900/[0.06] dark:border-white/10 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-slate-900 dark:text-white leading-none mb-1", children: s.value }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-500", children: s.label })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxs(
      Link,
      {
        href: "/pricing",
        className: "flex items-center justify-center gap-1.5 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-xl text-xs font-black uppercase tracking-wide hover:scale-[1.02] transition-transform",
        children: [
          "Start free trial ",
          /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      Link,
      {
        href: "/demo",
        className: "block text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-3 transition-colors",
        children: "Or try the live demo →"
      }
    )
  ] }) });
}
export {
  HousePromo as default
};
