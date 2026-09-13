import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { usePage, useForm, Head } from "@inertiajs/react";
import { MailX } from "lucide-react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
function LeadUnsubscribe({ token }) {
  const { flash } = usePage().props;
  const { post, processing } = useForm({});
  const submit = (e) => {
    e.preventDefault();
    post(`/tools/lead/unsubscribe/${token}`);
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Unsubscribe — VenQore",
      description: "Unsubscribe from VenQore tool emails.",
      children: [
        /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-lead", children: /* @__PURE__ */ jsx("div", { className: "vq-container vq-container--narrow", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-lead__card", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-lead__icon", children: /* @__PURE__ */ jsx(MailX, { size: 28, "aria-hidden": "true" }) }),
          flash?.success ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: "You're unsubscribed" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: flash.success })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: "Unsubscribe from VenQore emails" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "You'll stop receiving marketing emails from VenQore. This won't affect any account you have." }),
            /* @__PURE__ */ jsx("div", { className: "vq-lead__actions", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: submit,
                disabled: processing,
                className: "vq-btn vq-btn--primary vq-btn--lg",
                children: processing ? "Unsubscribing…" : "Confirm unsubscribe"
              }
            ) })
          ] })
        ] }) }) })
      ]
    }
  );
}
export {
  LeadUnsubscribe as default
};
