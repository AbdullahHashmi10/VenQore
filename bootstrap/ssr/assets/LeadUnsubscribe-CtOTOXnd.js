import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import { usePage, useForm } from "@inertiajs/react";
import { MailX } from "lucide-react";
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
function LeadUnsubscribe({ token }) {
  const { flash } = usePage().props;
  const { post, processing } = useForm({});
  const submit = (e) => {
    e.preventDefault();
    post(`/tools/lead/unsubscribe/${token}`);
  };
  return /* @__PURE__ */ jsx(MarketingLayout, { title: "Unsubscribe — VenQore", children: /* @__PURE__ */ jsx("section", { className: "pt-36 md:pt-44 pb-24 px-6 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx(MailX, { size: 48, className: "text-slate-400 dark:text-slate-500 mx-auto mb-6" }),
    flash?.success ? /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300", children: flash.success }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black mb-3 text-slate-900 dark:text-white", children: "Unsubscribe from VenQore emails" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400 mb-8", children: "You'll stop receiving marketing emails from VenQore. This won't affect any account you have." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: submit,
          disabled: processing,
          className: "px-7 py-3 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-full text-sm font-black uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-50",
          children: processing ? "Unsubscribing…" : "Confirm unsubscribe"
        }
      )
    ] })
  ] }) }) });
}
export {
  LeadUnsubscribe as default
};
