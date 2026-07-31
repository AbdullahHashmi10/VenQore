import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import MarketingLayout, { RevealOnScroll, SectionLabel, GlassCard, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { Mail, CheckCircle2, Loader2, Send } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function Newsletter() {
  const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
    name: "",
    email: "",
    interest: "cloud"
  });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("marketing.newsletter.submit"), {
      onSuccess: () => {
        setSubmitted(true);
        reset();
      }
    });
  };
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "Newsletter Subscription — VenQore",
      description: "Subscribe to the VenQore Master Operation Suite newsletter to receive product updates, scaling strategies, and offline module blueprints.",
      children: /* @__PURE__ */ jsxs("section", { className: "relative pt-40 pb-24 px-6 min-h-[85vh] flex items-center justify-center", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-xl w-full mx-auto relative z-10", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
            /* @__PURE__ */ jsx(SectionLabel, { icon: Mail, children: "Stay Ahead" }),
            /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-black tracking-tighter leading-tight mt-4 mb-4 font-display", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent", children: "Subscribe to" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow", children: "VenQore Insights." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed", children: "Get direct notifications about standalone offline releases, exclusive Etsy coupon updates, and enterprise database schemas." })
          ] }) }),
          /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx(GlassCard, { className: "p-8 border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] shadow-2xl relative", children: submitted ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 32 }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: "You're on the list!" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm leading-relaxed mb-6", children: "We've registered your subscription. Keep an eye on your inbox for our upcoming releases." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSubmitted(false),
                className: "text-indigo-400 font-semibold text-xs tracking-wider uppercase hover:text-indigo-300 transition-colors",
                children: "Subscribe another email"
              }
            )
          ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: "Your Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  placeholder: "John Doe",
                  className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500"
                }
              ),
              errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: [
                "Email Address ",
                /* @__PURE__ */ jsx("span", { className: "text-indigo-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  required: true,
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  placeholder: "john@example.com",
                  className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500"
                }
              ),
              errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500", children: "Get updates for" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-3", children: [
                { id: "cloud", label: "Cloud Updates", desc: "New updates on the Cloud Website" },
                { id: "digital", label: "Digital Products", desc: "Digital products only (Offline standalones)" },
                { id: "both", label: "Both channels", desc: "Get updates on both systems" }
              ].map((opt) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setData("interest", opt.id),
                  className: `w-full p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-1 ${data.interest === opt.id ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg" : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"}`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: `text-xs font-black uppercase tracking-wider ${data.interest === opt.id ? "text-indigo-400" : "text-slate-200"}`, children: opt.label }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px] leading-relaxed opacity-85", children: opt.desc })
                  ]
                },
                opt.id
              )) }),
              errors.interest && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: errors.interest })
            ] }),
            /* @__PURE__ */ jsx(
              MagneticButton,
              {
                type: "submit",
                disabled: processing,
                variant: "indigo",
                className: "w-full h-14 rounded-2xl font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed group",
                children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
                  "Processing..."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "Subscribe Now",
                  /* @__PURE__ */ jsx(Send, { size: 16, className: "group-hover:translate-x-1 transition-transform" })
                ] })
              }
            )
          ] }) }) })
        ] })
      ] })
    }
  );
}
export {
  Newsletter as default
};
