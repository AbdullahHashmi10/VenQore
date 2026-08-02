import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { PauseCircle, CreditCard, ArrowRight, LogOut } from "lucide-react";
function StoreSuspended({ store_name, plan, billing_url }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex items-center justify-center p-6", children: [
    /* @__PURE__ */ jsx(Head, { title: "Store Suspended — VenQore" }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[140px]" }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6", children: /* @__PURE__ */ jsx(PauseCircle, { size: 28, className: "text-red-400" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black text-white mb-2", children: "Store Suspended" }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-sm mb-2", children: [
        /* @__PURE__ */ jsx("strong", { className: "text-white", children: store_name }),
        " has been suspended."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs mb-8", children: "This usually happens when a trial expires or a payment fails. Please update your billing to restore access." }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        billing_url && /* @__PURE__ */ jsxs(
          "a",
          {
            href: billing_url,
            className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-all hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsx(CreditCard, { size: 16 }),
              "Update Billing",
              /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("hub"),
            className: "flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-all",
            children: [
              /* @__PURE__ */ jsx(ArrowRight, { size: 15 }),
              "Go to My Stores"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("logout"),
            method: "delete",
            as: "button",
            className: "flex items-center justify-center gap-2 w-full py-3 text-slate-600 hover:text-slate-400 text-sm transition-colors",
            children: [
              /* @__PURE__ */ jsx(LogOut, { size: 14 }),
              "Sign out"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  StoreSuspended as default
};
