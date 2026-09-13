import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { Sparkles, Store, ArrowRight, Key } from "lucide-react";
function CreateOrJoin({ has_license = false, license_plan = "trial" }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex flex-col", children: [
    /* @__PURE__ */ jsx(Head, { title: "Get Started — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-brand-900/15 rounded-full blur-[130px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-900/10 rounded-full blur-[100px]" })
    ] }),
    /* @__PURE__ */ jsxs("header", { className: "relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-8 w-8 object-contain" }),
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-lg text-white", children: [
          "VenQore",
          /* @__PURE__ */ jsx("span", { className: "text-brand-400", children: "." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: route("logout"),
          method: "post",
          as: "button",
          className: "text-sm text-ink-muted hover:text-neutral-200 transition-colors",
          children: "Sign out"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8 sm:mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-semibold mb-6", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
          has_license ? `${license_plan.charAt(0).toUpperCase() + license_plan.slice(1)} plan ready` : "Welcome to VenQore"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-white mb-3", children: "Let's get you started" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-lg", children: "Create your store or join an existing one with a code." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.create"),
            className: "group relative rounded-2xl border border-white/10 bg-white/3 hover:bg-brand-500/8 hover:border-brand-500/40 p-5 sm:p-8 flex flex-col transition-all duration-normal hover:shadow-2xl",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mb-6 group-hover:bg-brand-500/25 transition-colors", children: /* @__PURE__ */ jsx(Store, { size: 24, className: "text-brand-400" }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Create a Store" }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm leading-relaxed flex-1 mb-6", children: has_license ? `Use your ${license_plan} plan license to create your store. Full access from day one.` : "Choose a plan, then start your free 14-day trial. Full features unlocked from day one." }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2 mb-6", children: has_license ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Feature, { text: "License ready to use" }),
                /* @__PURE__ */ jsx(Feature, { text: "Full plan features unlocked" }),
                /* @__PURE__ */ jsx(Feature, { text: "Set up in 2 minutes" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Feature, { text: "14-day free trial" }),
                /* @__PURE__ */ jsx(Feature, { text: "Cancel anytime" }),
                /* @__PURE__ */ jsx(Feature, { text: "Set up in 2 minutes" })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-brand-400 font-bold text-sm group-hover:gap-3 transition-all", children: [
                "Create store ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.join"),
            className: "group relative rounded-2xl border border-white/10 bg-white/3 hover:bg-emerald-500/5 hover:border-emerald-500/30 p-5 sm:p-8 flex flex-col transition-all duration-normal hover:shadow-2xl",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors", children: /* @__PURE__ */ jsx(Key, { size: 24, className: "text-emerald-400" }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "Join a Store" }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm leading-relaxed flex-1 mb-6", children: "Enter the 7-character join code from your store owner to instantly join as a team member." }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-6", children: [
                /* @__PURE__ */ jsx(Feature, { text: "Instant access with join code", color: "emerald" }),
                /* @__PURE__ */ jsx(Feature, { text: "Role assigned by store owner", color: "emerald" }),
                /* @__PURE__ */ jsx(Feature, { text: "No license required", color: "emerald" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:gap-3 transition-all", children: [
                "Join with code ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            ]
          }
        )
      ] }),
      false
    ] }) })
  ] });
}
function Feature({ text, color = "indigo" }) {
  const colors = {
    indigo: "text-brand-400",
    emerald: "text-emerald-400"
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-ink-muted", children: [
    /* @__PURE__ */ jsx("div", { className: `w-4 h-4 rounded-full flex items-center justify-center bg-current/10 ${colors[color]}`, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 12 12", fill: "currentColor", className: "w-2.5 h-2.5", children: /* @__PURE__ */ jsx("path", { d: "M10 3L5 8.5 2 5.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }) }) }),
    text
  ] });
}
export {
  CreateOrJoin as default
};
