import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { Tag, Check, Shield, Zap, AlertCircle, EyeOff, Eye, Sparkles, ArrowRight } from "lucide-react";
function Redeem({ app_name = "VenQore" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, setData, post, processing, errors } = useForm({
    code: "",
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("redeem.submit"));
  };
  const planTiers = [
    { codes: 1, plan: "Starter", color: "text-slate-300", bg: "bg-slate-800/60", features: ["1,000 products", "3 staff", "1 warehouse", "Full POS & Invoicing"] },
    { codes: 2, plan: "Growth", color: "text-indigo-300", bg: "bg-indigo-900/20", features: ["Unlimited products", "10 staff", "3 warehouses", "WooCommerce + AI Engine"] },
    { codes: 3, plan: "Business", color: "text-amber-300", bg: "bg-amber-900/20", features: ["Everything unlimited", "Unlimited staff", "API access", "White-label ready"] }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#020010] text-white font-sans", children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: `Redeem Your AppSumo Code — ${app_name}` }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Redeem your AppSumo lifetime deal code and get instant access to VenQore." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[100px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 min-h-screen flex flex-col lg:flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:w-[45%] p-10 lg:p-16 flex flex-col justify-center border-r border-white/5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-12", children: [
          /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-10 object-contain" }),
          /* @__PURE__ */ jsxs("span", { className: "font-black text-xl text-white", children: [
            "VenQore",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-bold mb-8 w-fit", children: [
          /* @__PURE__ */ jsx(Tag, { size: 14 }),
          "AppSumo Lifetime Deal"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight", children: [
          "Activate Your",
          /* @__PURE__ */ jsx("span", { className: "block bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent", children: "Lifetime License" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 leading-relaxed mb-10", children: "Stack up to 3 codes to unlock higher tiers. One code is all you need to get started — add more later from your account." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: planTiers.map((tier) => /* @__PURE__ */ jsxs("div", { className: `rounded-2xl p-5 border border-white/10 ${tier.bg}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-white", children: tier.codes }),
            /* @__PURE__ */ jsxs("span", { className: `font-bold text-sm ${tier.color}`, children: [
              tier.codes === 1 ? "1 Code" : `${tier.codes} Codes (Stacked)`,
              " — ",
              tier.plan
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1.5", children: tier.features.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-slate-400", children: [
            /* @__PURE__ */ jsx(Check, { size: 10, className: "text-emerald-400 shrink-0" }),
            " ",
            f
          ] }, i)) })
        ] }, tier.codes)) }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-600 text-xs mt-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { size: 12, className: "text-emerald-500" }),
          "60-day money-back guarantee per AppSumo policy."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:w-[55%] p-10 lg:p-16 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Enter Your Code" }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-sm mb-8", children: [
          "Already have an account?",
          " ",
          /* @__PURE__ */ jsx(Link, { href: route("login"), className: "text-indigo-400 hover:text-indigo-300 underline", children: "Sign in to stack codes" })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-indigo-400" }),
              "AppSumo Code"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "appsumo-code",
                type: "text",
                value: data.code,
                onChange: (e) => setData("code", e.target.value.toUpperCase()),
                placeholder: "e.g. VENQ-AB1C-D2EF",
                className: `w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder-slate-600 font-mono text-lg tracking-widest focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${errors.code ? "border-red-500 bg-red-500/5" : "border-white/10 hover:border-white/20"}`,
                autoFocus: true
              }
            ),
            errors.code && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 mt-2 text-red-400 text-xs", children: [
              /* @__PURE__ */ jsx(AlertCircle, { size: 13, className: "shrink-0 mt-0.5" }),
              errors.code
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-white/5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-400 mb-2 block", children: "Full Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "redeem-name",
                type: "text",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                placeholder: "Your name",
                className: `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${errors.name ? "border-red-500" : "border-white/10 hover:border-white/20"}`
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-400 mb-2 block", children: "Email Address" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "redeem-email",
                type: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                placeholder: "your@email.com",
                className: `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${errors.email ? "border-red-500" : "border-white/10 hover:border-white/20"}`
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-400 mb-2 block", children: "Password" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "redeem-password",
                    type: showPassword ? "text" : "password",
                    value: data.password,
                    onChange: (e) => setData("password", e.target.value),
                    placeholder: "Min 8 characters",
                    className: `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors pr-10 ${errors.password ? "border-red-500" : "border-white/10 hover:border-white/20"}`
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 15 }) : /* @__PURE__ */ jsx(Eye, { size: 15 }) })
              ] }),
              errors.password && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.password })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-400 mb-2 block", children: "Confirm" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "redeem-password-confirm",
                    type: showConfirm ? "text" : "password",
                    value: data.password_confirmation,
                    onChange: (e) => setData("password_confirmation", e.target.value),
                    placeholder: "Repeat password",
                    className: "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors pr-10"
                  }
                ),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowConfirm(!showConfirm), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300", children: showConfirm ? /* @__PURE__ */ jsx(EyeOff, { size: 15 }) : /* @__PURE__ */ jsx(Eye, { size: 15 }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              id: "redeem-submit",
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:scale-100 mt-2",
              children: processing ? /* @__PURE__ */ jsxs("svg", { className: "animate-spin h-5 w-5", fill: "none", viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                /* @__PURE__ */ jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
                "Activate My Lifetime License",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-slate-600 text-xs mt-6 text-center leading-relaxed", children: [
          "By activating, you agree to VenQore's",
          " ",
          /* @__PURE__ */ jsx(Link, { href: "/refund-policy", className: "text-slate-500 hover:text-slate-300 underline", children: "Refund Policy" }),
          ". AppSumo's 60-day guarantee applies."
        ] })
      ] })
    ] })
  ] });
}
export {
  Redeem as default
};
