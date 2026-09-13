import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import MarketingLayout, { RevealOnScroll } from "./MarketingLayout-cwTDSbNB.js";
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
function Show({ article }) {
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: `${article.title} — VenQore Help Centre`,
      description: article.summary,
      children: /* @__PURE__ */ jsxs("article", { children: [
        /* @__PURE__ */ jsx("header", { className: "vq-section vq-mc-top vq-mc-top--flush", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-mc-back", children: /* @__PURE__ */ jsxs(Link, { href: "/help", className: "vq-link", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 16, "aria-hidden": "true" }),
            " Back to Help Centre"
          ] }) }),
          /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: article.category }),
          /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-5", children: article.title }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-5", style: { paddingBottom: "var(--vq-space-8)", borderBottom: "1px solid var(--vq-line)", maxWidth: "none" }, children: article.summary })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "vq-section vq-mc-body", style: { paddingTop: "var(--vq-space-4)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { direction: "up", children: /* @__PURE__ */ jsx("div", { className: "vq-read", children: /* @__PURE__ */ jsx("p", { children: article.content }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-row vq-wrap vq-gap-4", style: { marginTop: "var(--vq-space-16)", justifyContent: "space-between", padding: "var(--vq-space-8)" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-h3", style: { fontSize: "20px" }, children: "Still stuck?" }),
              /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-2", children: "Send the team a note from the contact page." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3", children: [
              /* @__PURE__ */ jsx(Link, { href: "/help", className: "vq-btn vq-btn--quiet", children: "All articles" }),
              /* @__PURE__ */ jsx(Link, { href: "/contact", className: "vq-btn vq-btn--secondary", children: "Contact support" })
            ] })
          ] })
        ] }) })
      ] })
    }
  );
}
export {
  Show as default
};
