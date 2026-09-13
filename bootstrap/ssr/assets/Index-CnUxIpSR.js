import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import ToolShell from "./ToolShell-zAP3LLHC.js";
import { InlineLink } from "./MarketingLayout-cwTDSbNB.js";
import "./ToolsSidebar-UoByrcvz.js";
import "./HousePromo-DidRidkH.js";
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
function ToolsIndex({ toolGroups = [] }) {
  const liveCount = toolGroups.flatMap((g) => g.tools).filter((t) => t.status === "live").length;
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Retail Tools — Barcode Generator & More | VenQore",
      metaDescription: "Free tools for retail and small business: barcode generator, label sheets, invoice templates and more. No signup required, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Retail Tools",
      answer: "Free, practical tools for retail and small business owners — no signup, no watermark, no ads. They come from VenQore, the AI ERP builder: describe your business in a sentence and it assembles a working system — till, stock, purchasing and a real double-entry ledger — that issues these documents for you.",
      toolGroups,
      cta: {
        headline: "Every document here is one a built system would have issued for you.",
        subtext: "Describe your business once. VenQore assembles it from 46 modules — you keep the ones you use — and every invoice, label and count sheet comes out of live data instead of a blank form."
      },
      wide: true,
      children: [
        /* @__PURE__ */ jsx("div", { className: "vq-tools-hub", children: toolGroups.map((group) => /* @__PURE__ */ jsxs("section", { className: "vq-tools-hub__group", "aria-labelledby": `tools-${group.key}`, children: [
          /* @__PURE__ */ jsx("h2", { id: `tools-${group.key}`, className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: group.label }),
          /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2 vq-mt-5", children: group.tools.map((tool) => {
            const isLive = tool.status === "live" && tool.href;
            const inner = /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { justifyContent: "space-between", alignItems: "flex-start" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-tools-hub__name", children: tool.name }),
                isLive ? /* @__PURE__ */ jsx(ArrowRight, { size: 18, className: "vq-tools-hub__arrow", "aria-hidden": "true" }) : /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--soon", children: "Soon" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tools-hub__desc", children: tool.description })
            ] });
            return isLive ? /* @__PURE__ */ jsx(Link, { href: tool.href, className: "vq-card vq-card--interactive vq-tools-hub__card", children: inner }, tool.slug) : /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--flat vq-tools-hub__card vq-tools-hub__card--soon", children: inner }, tool.slug);
          }) })
        ] }, group.key)) }),
        /* @__PURE__ */ jsxs("p", { className: "vq-small vq-text-2 vq-mt-12", children: [
          liveCount,
          " ",
          liveCount === 1 ? "tool is" : "tools are",
          " live now — the rest are on the way. No ads, no trackers beyond basic analytics."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mt-8 vq-tools-hub__links", children: [
          "Doing this by hand every day? These tools are the manual version of what a built system does on its own. Describe your business to",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/blueprint", children: "Blueprint" }),
          " and it proposes the modules you need —",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/features/point-of-sale", children: "a till" }),
          ",",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/features/inventory-management", children: "FIFO stock" }),
          " and",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/features/accounting", children: "a real double-entry ledger" }),
          " — then issues these same documents from live data. See how it lands in your trade:",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/solutions/pharmacy", children: "pharmacy" }),
          ",",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/solutions/grocery", children: "grocery" }),
          ",",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/solutions/wholesale", children: "wholesale" }),
          " — or",
          " ",
          /* @__PURE__ */ jsx(InlineLink, { href: "/compare", children: "compare it against what you use now" }),
          "."
        ] })
      ]
    }
  );
}
export {
  ToolsIndex as default
};
