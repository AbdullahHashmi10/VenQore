import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Mail, Clock } from "lucide-react";
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
function RefundPolicy() {
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Refund Policy — VenQore",
      description: "How cancellations and refunds work for VenQore subscriptions, and what happens to your data after you cancel.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top vq-mc-top--flush", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Legal" }),
          /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-4", children: "Refund Policy" }),
          /* @__PURE__ */ jsx("div", { className: "vq-mc-meta vq-mt-4", children: /* @__PURE__ */ jsx("span", { className: "vq-mc-meta__item", children: "Last updated: April 2025" }) })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", style: { paddingTop: "var(--vq-space-8)" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-doc vq-mc-doc--toc", style: { borderTop: "1px solid var(--vq-line)", paddingTop: "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("nav", { className: "vq-mc-rail vq-mc-toc", "aria-label": "On this page", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-mc-rail__label vq-mc-toc__title", children: "On this page" }),
            [
              ["subscriptions", "1. Monthly & annual plans"],
              ["data-retention", "2. Your data after cancelling"],
              ["contact", "3. Contact"]
            ].map(([id, label]) => /* @__PURE__ */ jsx("a", { href: `#${id}`, className: "vq-mc-rail__link", children: label }, id))
          ] }),
          /* @__PURE__ */ jsxs("article", { className: "vq-read vq-mc-legal", children: [
            /* @__PURE__ */ jsxs("section", { id: "subscriptions", style: { scrollMarginTop: "112px" }, children: [
              /* @__PURE__ */ jsx("h2", { children: "1. Monthly & annual plans" }),
              /* @__PURE__ */ jsx("p", { children: "For paid monthly or annual subscriptions (Starter $49/mo, Core $99/mo, Scale $299/mo), you may cancel at any time. Cancellation takes effect at the end of the current billing period — you will not be charged for the following period." }),
              /* @__PURE__ */ jsx("p", { children: "We do not offer prorated refunds for the remaining days of a billing period. If you experience a technical issue that prevented you from using the service, contact support within 7 days and we will review your case." })
            ] }),
            /* @__PURE__ */ jsxs("section", { id: "data-retention", style: { scrollMarginTop: "112px" }, children: [
              /* @__PURE__ */ jsx("h2", { children: "2. Your data after cancelling" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "After account cancellation or expiry, your data is retained for ",
                /* @__PURE__ */ jsx("strong", { children: "30 days" }),
                " to allow for data export. After 30 days, all data is permanently deleted. You may request immediate deletion by emailing",
                " ",
                /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", children: "privacy@venqore.com" }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { id: "contact", style: { scrollMarginTop: "112px" }, children: [
              /* @__PURE__ */ jsx("h2", { children: "3. Contact" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
                /* @__PURE__ */ jsxs("a", { href: "mailto:support@venqore.com", className: "vq-card vq-card--interactive vq-row vq-gap-4", style: { textDecoration: "none" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-mc-icon", children: /* @__PURE__ */ jsx(Mail, { size: 20, "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-caption", style: { display: "block" }, children: "Email" }),
                    /* @__PURE__ */ jsx("span", { style: { display: "block", color: "var(--vq-text)", fontWeight: 600, fontSize: "var(--vq-fs-small)" }, children: "support@venqore.com" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-card vq-row vq-gap-4", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-mc-icon", style: { "--tone": "var(--vq-success)" }, children: /* @__PURE__ */ jsx(Clock, { size: 20, "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("span", { className: "vq-caption", style: { display: "block" }, children: "Response Time" }),
                    /* @__PURE__ */ jsx("span", { style: { display: "block", color: "var(--vq-text)", fontWeight: 600, fontSize: "var(--vq-fs-small)" }, children: "Within 12 hours" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("section", { id: "lifetime-licences", className: "vq-fineprint", "aria-label": "Lifetime licences", children: /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Lifetime licences." }),
              " If you bought a one-time lifetime licence through a partner marketplace rather than subscribing here, refunds for that purchase are handled by the marketplace you bought from, within the refund window it showed at checkout. Refunding one of several stacked codes moves the workspace down one tier; refunding every code closes it. Lifetime licences include two years of hosting from the date the code is redeemed; after that you can continue hosted at the plan rate shown to you at the time, or export your data. We email reminders 90 and 30 days before hosting ends."
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-related", children: [
              /* @__PURE__ */ jsxs("p", { children: [
                "Related: read our",
                " ",
                /* @__PURE__ */ jsx(Link, { href: "/terms", children: "Terms of Service" }),
                " ",
                "and",
                " ",
                /* @__PURE__ */ jsx(Link, { href: "/privacy", children: "Privacy Policy" }),
                "."
              ] }),
              /* @__PURE__ */ jsx(Link, { href: "/pricing", children: "See plans & pricing →" })
            ] })
          ] })
        ] }) }) })
      ]
    }
  );
}
export {
  RefundPolicy as default
};
