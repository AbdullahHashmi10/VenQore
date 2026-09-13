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
function NewsletterUnsubscribe({ token }) {
  const { flash } = usePage().props;
  const { post, processing } = useForm({});
  const submit = (event) => {
    event.preventDefault();
    post(`/subscribe/unsubscribe/${token}`);
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Unsubscribe from the newsletter — VenQore",
      description: "Stop receiving VenQore newsletter emails.",
      children: [
        /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-center", style: { maxWidth: "560px", marginInline: "auto", padding: "clamp(32px, 5vw, 48px)" }, children: [
          /* @__PURE__ */ jsx("span", { className: "vq-mc-icon vq-mc-icon--lg vq-mc-icon--round", style: { "--tone": "var(--vq-text-2)" }, children: /* @__PURE__ */ jsx(MailX, { size: 30, "aria-hidden": "true" }) }),
          flash?.success ? /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6", style: { marginInline: "auto", color: "var(--vq-text)" }, children: flash.success }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h1", { className: "vq-h2 vq-mt-6", children: "Unsubscribe from VenQore" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: "You will stop receiving newsletter emails. This will not affect any VenQore account you have." }),
            /* @__PURE__ */ jsx("div", { className: "vq-mt-8", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: submit,
                disabled: processing,
                className: "vq-btn vq-btn--primary vq-btn--lg",
                style: { opacity: processing ? 0.6 : void 0 },
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
  NewsletterUnsubscribe as default
};
