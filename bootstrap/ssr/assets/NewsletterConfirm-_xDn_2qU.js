import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle2, XCircle } from "lucide-react";
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
function NewsletterConfirm({ found, confirmed }) {
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Confirm newsletter subscription — VenQore",
      description: "Confirm your VenQore newsletter subscription.",
      children: [
        /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-center", style: { maxWidth: "560px", marginInline: "auto", padding: "clamp(32px, 5vw, 48px)" }, children: [
          found && confirmed ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-mc-icon vq-mc-icon--lg vq-mc-icon--round", style: { "--tone": "var(--vq-success)" }, children: /* @__PURE__ */ jsx(CheckCircle2, { size: 30, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h2 vq-mt-6", children: "Subscription confirmed" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: "Thanks — your address is confirmed. Every newsletter will include an unsubscribe link." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-mc-icon vq-mc-icon--lg vq-mc-icon--round", style: { "--tone": "var(--vq-danger)" }, children: /* @__PURE__ */ jsx(XCircle, { size: 30, "aria-hidden": "true" }) }),
            /* @__PURE__ */ jsx("h1", { className: "vq-h2 vq-mt-6", children: "Link not found" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: "This confirmation link is invalid or no longer available." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-mt-8", children: /* @__PURE__ */ jsx(Link, { href: "/", className: "vq-btn vq-btn--secondary", children: "← Back to VenQore" }) })
        ] }) }) })
      ]
    }
  );
}
export {
  NewsletterConfirm as default
};
