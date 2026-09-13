import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
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
function LeadConfirm({ found, confirmed }) {
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Confirm subscription — VenQore",
      description: "Confirm your email address to receive the file you generated.",
      children: [
        /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-lead", children: /* @__PURE__ */ jsx("div", { className: "vq-container vq-container--narrow", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-lead__card", children: [
          found ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-lead__icon vq-lead__icon--ok", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 28, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: "You're confirmed" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: confirmed ? "Thanks — you'll start getting occasional retail tips from VenQore. Unsubscribe anytime." : "This subscription was already confirmed." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-lead__icon vq-lead__icon--bad", children: /* @__PURE__ */ jsx(XCircle, { size: 28, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: "Link not found" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "This confirmation link is invalid or has expired." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-lead__actions", children: /* @__PURE__ */ jsxs(Link, { href: "/", className: "vq-btn vq-btn--secondary vq-btn--lg", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 16, "aria-hidden": "true" }),
            " Back to VenQore"
          ] }) })
        ] }) }) })
      ]
    }
  );
}
export {
  LeadConfirm as default
};
