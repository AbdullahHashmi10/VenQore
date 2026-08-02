import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Shield, Clock, Mail } from "lucide-react";
import { a as MarketingLayout } from "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function RefundPolicy() {
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "Refund Policy — VenQore",
      description: "VenQore's refund policy for AppSumo Lifetime Deal purchases. 60-day money-back guarantee.",
      children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-3xl mx-auto px-6 pt-32 md:pt-36 pb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { size: 26, className: "text-emerald-600 dark:text-emerald-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black tracking-tight text-slate-900 dark:text-white", children: "Refund Policy" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Last updated: April 2025" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx(Clock, { size: 22, className: "text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-orange-700 dark:text-orange-300 mb-1", children: "AppSumo Lifetime Deal — 60-Day Guarantee" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 text-sm leading-relaxed", children: "All AppSumo purchases of VenQore are covered by AppSumo's standard 60-day money-back guarantee. You may request a full refund within 60 days of your purchase through AppSumo's platform — no questions asked." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed", children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3", children: "1. AppSumo Purchases" }),
            /* @__PURE__ */ jsxs("p", { children: [
              "VenQore participates in AppSumo's standard refund policy. For any AppSumo Lifetime Deal (LTD) purchase, you are entitled to a full refund within ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-900 dark:text-white", children: "60 calendar days" }),
              " of your original purchase date. To request a refund for an AppSumo purchase, visit your AppSumo dashboard or contact AppSumo support directly at",
              " ",
              /* @__PURE__ */ jsx("a", { href: "mailto:hello@appsumo.com", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "hello@appsumo.com" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3", children: "If you have stacked multiple codes and request a refund, the refund applies per code. Refunding a code will result in a plan downgrade to the next lower tier. Refunding all codes will deactivate your account." })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3", children: "2. Monthly / Annual Subscriptions" }),
            /* @__PURE__ */ jsx("p", { children: "For paid monthly or annual subscriptions (Starter $19/mo, Growth $39/mo, Business $79/mo), you may cancel at any time. Cancellation takes effect at the end of the current billing period — you will not be charged for the following period." }),
            /* @__PURE__ */ jsx("p", { className: "mt-3", children: "We do not offer prorated refunds for the remaining days of a billing period. If you experience a technical issue that prevented you from using the service, contact support within 7 days and we will review your case." })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3", children: "3. Hosting After LTD Period" }),
            /* @__PURE__ */ jsxs("p", { children: [
              "AppSumo LTD codes include ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-900 dark:text-white", children: "2 years of hosting" }),
              " on venqore.com. After this period, you have two options:"
            ] }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside mt-3 space-y-2 text-slate-500 dark:text-slate-400", children: [
              /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsx("strong", { className: "text-slate-900 dark:text-white", children: "Continue hosted:" }),
                " $9/month to $30/month depending on plan tier (no feature limitations based on LTD tier)"
              ] }),
              /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsx("strong", { className: "text-slate-900 dark:text-white", children: "Self-host:" }),
                " Export your data and run VenQore on your own server at no cost"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-3", children: "The 2-year hosting clock starts at the time of code redemption, not purchase. We will send reminder emails at 90 days and 30 days before hosting expiry." })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3", children: "4. Data Retention After Cancellation" }),
            /* @__PURE__ */ jsxs("p", { children: [
              "After account cancellation or expiry, your data is retained for ",
              /* @__PURE__ */ jsx("strong", { className: "text-slate-900 dark:text-white", children: "30 days" }),
              " to allow for data export. After 30 days, all data is permanently deleted. You may request immediate deletion by emailing",
              " ",
              /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "privacy@venqore.com" }),
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3", children: "5. Contact" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mt-2", children: [
              /* @__PURE__ */ jsxs("a", { href: "mailto:support@venqore.com", className: "flex items-center gap-3 p-4 rounded-xl bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/[0.08] dark:border-white/10 hover:border-indigo-500/30 transition-colors", children: [
                /* @__PURE__ */ jsx(Mail, { size: 18, className: "text-indigo-600 dark:text-indigo-400" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase tracking-widest", children: "Email" }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-900 dark:text-white text-sm font-medium", children: "support@venqore.com" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 rounded-xl bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/[0.08] dark:border-white/10", children: [
                /* @__PURE__ */ jsx(Clock, { size: 18, className: "text-emerald-600 dark:text-emerald-400" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase tracking-widest", children: "Response Time" }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-900 dark:text-white text-sm font-medium", children: "Within 12 hours" })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-8 border-t border-slate-900/[0.06] dark:border-white/5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "Related: read our",
            " ",
            /* @__PURE__ */ jsx(Link, { href: "/terms", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "Terms of Service" }),
            " ",
            "and",
            " ",
            /* @__PURE__ */ jsx(Link, { href: "/privacy", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "Privacy Policy" }),
            "."
          ] }),
          /* @__PURE__ */ jsx(Link, { href: "/pricing", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "See plans & pricing →" })
        ] })
      ] })
    }
  );
}
export {
  RefundPolicy as default
};
