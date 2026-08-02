import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { ArrowLeft, Store, Sparkles, Clock, Pencil, Loader2, ArrowRight, CreditCard } from "lucide-react";
function FieldLabel({ children, required }) {
  return /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-300 mb-2", children: [
    children,
    " ",
    required && /* @__PURE__ */ jsx("span", { className: "text-red-400", children: "*" })
  ] });
}
function FieldError({ message }) {
  if (!message) return null;
  return /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1.5", children: message });
}
function InputBase({ className = "", hasError, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      ...props,
      className: `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-500
                focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors
                ${hasError ? "border-red-500 bg-red-500/5" : "border-white/10 hover:border-white/20"}
                ${className}`
    }
  );
}
function CreateStore({ available_license = null, selected_plan = null, trial_days = 14 }) {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    plan: selected_plan?.slug || "",
    interval: selected_plan?.interval || "monthly"
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.store"));
  };
  const fmtCharge = () => {
    if (!selected_plan) return null;
    const sym = selected_plan.symbol || "$";
    const amt = Number(selected_plan.amount || 0);
    const rounded = Number.isInteger(amt) ? amt : Math.round(amt);
    const money = sym === "Rs" ? `Rs ${rounded.toLocaleString()}` : `${sym}${rounded.toLocaleString()}`;
    return `${money}/${selected_plan.cadence === "year" ? "yr" : "mo"}`;
  };
  const backHref = available_license ? route("store.create-or-join") : route("store.create");
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans", children: [
    /* @__PURE__ */ jsx(Head, { title: "Create Store — VenQore" }),
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
          href: backHref,
          className: "flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            " ",
            available_license ? "Back" : "Change plan"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center justify-center p-6 min-h-[calc(100vh-65px)]", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-5", children: /* @__PURE__ */ jsx(Store, { size: 24, className: "text-indigo-400" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-black tracking-tight text-white mb-2", children: "Name your store" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: available_license ? `Your ${available_license.plan} license will be activated for this store.` : `Last step — your ${trial_days}-day free trial starts as soon as your store is created.` })
      ] }),
      selected_plan && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4 mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-indigo-300" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-white", children: [
              selected_plan.name,
              " plan",
              /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-medium", children: [
                " · ",
                selected_plan.interval === "annual" ? "Annual" : "Monthly"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-0.5 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Clock, { size: 11, className: "text-emerald-400" }),
              "Free for ",
              trial_days,
              " days, then ",
              fmtCharge()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.create"),
            className: "flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Pencil, { size: 11 }),
              " Change"
            ]
          }
        )
      ] }) }),
      available_license && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 mb-6", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-emerald-400 shrink-0" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-emerald-300", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold capitalize", children: [
            available_license.plan,
            " plan"
          ] }),
          " license will be activated for this store"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(FieldLabel, { required: true, children: "Store Name" }),
          /* @__PURE__ */ jsx(
            InputBase,
            {
              id: "store-name",
              type: "text",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              placeholder: "e.g. Ali Electronics, Green Mart...",
              hasError: !!errors.name,
              autoFocus: true,
              maxLength: 100
            }
          ),
          /* @__PURE__ */ jsx(FieldError, { message: errors.name }),
          /* @__PURE__ */ jsx(FieldError, { message: errors.plan })
        ] }),
        data.name && /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1", children: "Your store URL will be" }),
          /* @__PURE__ */ jsxs("span", { className: "text-white font-mono text-xs", children: [
            "venqore.com/s/",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-300", children: "[ID]" }),
            "/dashboard"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            id: "create-store-submit",
            type: "submit",
            disabled: processing || !data.name,
            className: "w-full flex items-center justify-center gap-3 py-4 rounded-xl\n                                bg-gradient-to-r from-indigo-500 to-purple-600\n                                hover:from-indigo-400 hover:to-purple-500\n                                text-white font-bold text-base transition-all\n                                hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/25\n                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed mt-2",
            children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
              " Creating store…"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Store, { size: 18 }),
              " ",
              available_license ? "Create Store" : "Start my free trial",
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ] })
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-500 flex items-center justify-center gap-1.5", children: available_license ? "You can rename your store and change settings at any time." : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(CreditCard, { size: 11 }),
          " No card charged today. You can cancel anytime before your trial ends."
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  CreateStore as default
};
