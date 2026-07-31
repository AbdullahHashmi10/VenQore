import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { RefreshCw, Zap, CheckCircle2, Mail, ArrowRight } from "lucide-react";
function VenSynQ() {
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, wasSuccessful } = useForm({
    email: "",
    interest: "cloud"
  });
  const submit = (e) => {
    e.preventDefault();
    post("/subscribe", { preserveScroll: true });
  };
  const channels = [
    { name: "WooCommerce", status: "LIVE", desc: "Stock synced automatically; online orders become POS sales with correct COGS and a balanced journal entry." },
    { name: "Amazon", status: "COMING SOON", desc: "Marketplace listings, FBA-aware stock levels, settlement-ready accounting." },
    { name: "eBay", status: "COMING SOON", desc: "Listings and order import with SKU matching into the same single ledger." },
    { name: "TikTok Shop", status: "COMING SOON", desc: "Social commerce orders reconciled like any other sale — to the cent." }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#050510] text-white", style: { fontFamily: "'Figtree', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsx(Head, { title: "VenSynQ — Sync Your POS with WooCommerce, Amazon, eBay & TikTok Shop" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-6 py-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-14 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Link, { href: "/", className: "text-sm font-bold text-slate-400 hover:text-white transition-colors", children: "← VenQore" }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors", children: "Try the live demo →" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase mb-8", children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 12, className: "text-emerald-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "Multi-Channel Sync Engine" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-black tracking-tighter mb-6", children: [
          "One Inventory. One Ledger.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400", children: "Every Channel." })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed", children: [
          "VenSynQ connects your physical store's POS inventory and accounting to your online channels — so a sale anywhere updates stock and books everywhere.",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: "WooCommerce is live today." }),
          " ",
          "Amazon, eBay and TikTok Shop are on the way."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4 mb-16", children: channels.map((c) => /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.03] border border-white/10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-black", children: c.name }),
          /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full ${c.status === "LIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-indigo-500/15 text-indigo-300"}`, children: c.status })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 leading-relaxed", children: c.desc })
      ] }, c.name)) }),
      /* @__PURE__ */ jsxs("div", { className: "mb-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Zap, { size: 20, className: "text-amber-400" }),
          " Why VenSynQ is different"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
          "Not just a stock mirror — every online order posts a balanced double-entry journal with real FIFO cost of goods.",
          "SKU-based matching with conflict detection, so the counter and the website never disagree.",
          "Webhook signature verification on every inbound order — security first.",
          "One dashboard: physical tills and online channels reconciled in the same verified ledger."
        ].map((t, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-slate-300 text-sm leading-relaxed", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-400 mt-0.5 shrink-0" }),
          " ",
          t
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-10 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 text-center", children: [
        /* @__PURE__ */ jsx(Mail, { size: 28, className: "mx-auto text-indigo-300 mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-black mb-3", children: "Be first in when each channel opens." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed", children: "Join the VenSynQ waitlist — one email the moment Amazon, eBay or TikTok Shop sync goes live. No spam, ever." }),
        wasSuccessful || flash?.success ? /* @__PURE__ */ jsxs("p", { className: "inline-flex items-center gap-2 text-emerald-400 font-bold", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }),
          " You're on the list — we'll email you at launch."
        ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col sm:flex-row gap-3 max-w-md mx-auto", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              required: true,
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              placeholder: "you@yourstore.com",
              className: "flex-1 px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2",
              children: [
                "Join Waitlist ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
              ]
            }
          )
        ] }),
        errors.email && /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-rose-400 font-semibold", children: errors.email })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-16 text-center text-sm text-slate-500 space-x-4", children: [
        /* @__PURE__ */ jsx(Link, { href: "/features", className: "hover:text-white transition-colors", children: "Features" }),
        /* @__PURE__ */ jsx(Link, { href: "/pricing", className: "hover:text-white transition-colors", children: "Pricing" }),
        /* @__PURE__ */ jsx(Link, { href: "/smartcapture", className: "hover:text-white transition-colors", children: "SmartCapture" }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "hover:text-white transition-colors", children: "Live Demo" })
      ] })
    ] })
  ] });
}
export {
  VenSynQ as default
};
