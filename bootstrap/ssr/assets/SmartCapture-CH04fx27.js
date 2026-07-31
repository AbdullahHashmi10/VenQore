import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { Sparkles, Camera, ScanLine, Mic, CheckCircle2, Mail, ArrowRight } from "lucide-react";
function SmartCapture() {
  const { flash } = usePage().props;
  const { data, setData, post, processing, errors, wasSuccessful } = useForm({
    email: "",
    interest: "cloud"
  });
  const submit = (e) => {
    e.preventDefault();
    post("/subscribe", { preserveScroll: true });
  };
  const steps = [
    { icon: Camera, title: "1 · Snap or speak", desc: 'Photograph any paper invoice or receipt — or just say it: "sold 5 bags of rice to Ali on credit".' },
    { icon: ScanLine, title: "2 · VenQore reads it", desc: "Line items are extracted and matched to YOUR product catalog with confidence scores — not just a stored image." },
    { icon: Sparkles, title: "3 · Review & post", desc: "You confirm the draft. One tap posts it to the verified double-entry ledger with correct FIFO costing." }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#050510] text-white", style: { fontFamily: "'Figtree', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsx(Head, { title: "SmartCapture — Turn Paper Invoices & Voice Notes into Digital Records" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto px-6 py-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-14 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Link, { href: "/", className: "text-sm font-bold text-slate-400 hover:text-white transition-colors", children: "← VenQore" }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors", children: "Try the live demo →" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-black tracking-[0.3em] uppercase mb-8", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-amber-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "AI Input Layer · Coming Soon" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-black tracking-tighter mb-6", children: [
          "From Paper or Voice",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400", children: "to Posted Books." })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed", children: [
          "SmartCapture turns a photo of any supplier bill — or a spoken voice note — into a structured digital transaction in VenQore.",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-white font-semibold", children: "No more evening data entry." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-4 mb-16", children: steps.map((s) => /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center", children: [
        /* @__PURE__ */ jsx(s.icon, { size: 24, className: "mx-auto text-indigo-300 mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "font-black mb-2 text-sm tracking-wide", children: s.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 leading-relaxed", children: s.desc })
      ] }, s.title)) }),
      /* @__PURE__ */ jsxs("div", { className: "mb-16 p-8 rounded-3xl bg-white/[0.02] border border-white/10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-black mb-6 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Mic, { size: 20, className: "text-rose-400" }),
          " Built for how shops actually work"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
          "Supplier bills and purchase receipts — scanned into editable line items with quantities and costs.",
          "Voice memos in plain language become drafted sales, purchases or expenses for your review.",
          "Every capture is matched against your real catalog and cost history before anything posts.",
          "Nothing skips the engine: confirmed captures post as balanced journal entries, like everything in VenQore."
        ].map((t, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-slate-300 text-sm leading-relaxed", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-400 mt-0.5 shrink-0" }),
          " ",
          t
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20 text-center", children: [
        /* @__PURE__ */ jsx(Mail, { size: 28, className: "mx-auto text-amber-300 mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-black mb-3", children: "Be first in line when SmartCapture ships." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed", children: "It's in final testing now. Join the waitlist and you'll get one email at launch — plus early-access pricing. No spam, ever." }),
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
              className: "flex-1 px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-black text-sm tracking-wide transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2",
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
        /* @__PURE__ */ jsx(Link, { href: "/vensynq", className: "hover:text-white transition-colors", children: "VenSynQ" }),
        /* @__PURE__ */ jsx(Link, { href: "/demo", className: "hover:text-white transition-colors", children: "Live Demo" })
      ] })
    ] })
  ] });
}
export {
  SmartCapture as default
};
