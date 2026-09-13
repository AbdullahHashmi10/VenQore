import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { LifeBuoy, Search, ArrowRight } from "lucide-react";
import MarketingLayout, { SectionLabel, RevealOnScroll } from "./MarketingLayout-cwTDSbNB.js";
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
function Index({ articles = [], query: initialQuery }) {
  const [search, setSearch] = useState(initialQuery || "");
  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/help", { q: search }, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Help Centre — VenQore POS",
      description: "Search knowledge base articles for setup, POS hardware, inventory, accounting and plan limits.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
          /* @__PURE__ */ jsx(SectionLabel, { icon: LifeBuoy, text: "Help centre" }),
          /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: "VenQore Help Centre" }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-5", children: "Search knowledge base articles for setup, POS hardware, inventory, accounting and plan limits." }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "vq-mc-searchrow vq-mt-8", role: "search", style: { maxWidth: "600px" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-search", children: [
              /* @__PURE__ */ jsx(Search, { size: 18, "aria-hidden": "true" }),
              /* @__PURE__ */ jsx("label", { htmlFor: "help-search", className: "vq-sr", children: "Search articles" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "help-search",
                  type: "text",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  placeholder: "Search articles (e.g. barcode printer, stock transfer, plan limits)...",
                  className: "vq-input",
                  style: { fontSize: "var(--vq-fs-body)" }
                }
              )
            ] }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "vq-btn vq-btn--primary vq-btn--lg", children: "Search" })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: articles.length > 0 ? /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2", children: articles.map((article, i) => /* @__PURE__ */ jsx(RevealOnScroll, { direction: "up", delay: Math.min(i, 3) * 0.05, children: /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/help/articles/${article.slug}`,
            className: "vq-card vq-card--interactive vq-mc-lcard",
            children: [
              /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", style: { alignSelf: "flex-start" }, children: article.category }),
              /* @__PURE__ */ jsx("h2", { className: "vq-mc-lcard__title", style: { marginTop: "var(--vq-space-2)" }, children: article.title }),
              /* @__PURE__ */ jsx("p", { className: "vq-mc-lcard__text", children: article.summary }),
              /* @__PURE__ */ jsx("div", { className: "vq-mc-lcard__foot", children: /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta", children: [
                "Read Article ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15, "aria-hidden": "true" })
              ] }) })
            ]
          }
        ) }, article.slug)) }) : /* @__PURE__ */ jsxs("div", { className: "vq-card vq-mc-empty", children: [
          /* @__PURE__ */ jsx(LifeBuoy, { size: 32, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("h2", { className: "vq-h3 vq-mt-4", children: "No articles match that search" }),
          /* @__PURE__ */ jsxs("p", { className: "vq-body vq-text-2 vq-mt-2", style: { marginInline: "auto" }, children: [
            "Try a different keyword, or ",
            /* @__PURE__ */ jsx(Link, { href: "/help", children: "browse every article" }),
            "."
          ] })
        ] }) }) })
      ]
    }
  );
}
export {
  Index as default
};
