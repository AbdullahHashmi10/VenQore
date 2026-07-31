import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { CheckCircle2, XCircle } from "lucide-react";
import MarketingLayout from "./MarketingLayout-CMiC1Bik.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function LeadConfirm({ found, confirmed }) {
  return /* @__PURE__ */ jsx(MarketingLayout, { title: "Confirm subscription — VenQore", children: /* @__PURE__ */ jsx("section", { className: "pt-36 md:pt-44 pb-24 px-6 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    found ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(CheckCircle2, { size: 48, className: "text-emerald-500 dark:text-emerald-400 mx-auto mb-6" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black mb-3 text-slate-900 dark:text-white", children: "You're confirmed" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400 mb-8", children: confirmed ? "Thanks — you'll start getting occasional retail tips from VenQore. Unsubscribe anytime." : "This subscription was already confirmed." })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(XCircle, { size: 48, className: "text-red-500 dark:text-red-400 mx-auto mb-6" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black mb-3 text-slate-900 dark:text-white", children: "Link not found" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400 mb-8", children: "This confirmation link is invalid or has expired." })
    ] }),
    /* @__PURE__ */ jsx(Link, { href: "/", className: "text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300", children: "← Back to VenQore" })
  ] }) }) });
}
export {
  LeadConfirm as default
};
