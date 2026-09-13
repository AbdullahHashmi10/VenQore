import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Head, Link, router } from "@inertiajs/react";
import { Search, FileText, X, Menu, ChevronRight, ArrowRight, Info, HelpCircle } from "lucide-react";
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
function DocFAQItem({ qa, index }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `faq-${qa.slug}-${index}-answer`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      id: `faq-${qa.slug}-${index}`,
      itemScope: true,
      itemType: "https://schema.org/Question",
      className: `vq-faq__item ${isOpen ? "is-open" : ""}`,
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setIsOpen(!isOpen),
            className: "vq-faq__q",
            "aria-expanded": isOpen,
            "aria-controls": panelId,
            style: { fontSize: "19px", lineHeight: 1.35 },
            children: [
              /* @__PURE__ */ jsx("span", { itemProp: "name", children: qa.question }),
              /* @__PURE__ */ jsx("span", { className: "vq-faq__sign", "aria-hidden": "true" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "vq-faq__a", id: panelId, children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { itemProp: "acceptedAnswer", itemScope: true, itemType: "https://schema.org/Answer", style: { paddingBottom: "var(--vq-space-6)" }, children: /* @__PURE__ */ jsx(
          "div",
          {
            itemProp: "text",
            className: "vq-read vq-read--raw vq-read--sm",
            dangerouslySetInnerHTML: { __html: qa.answer_html }
          }
        ) }) }) })
      ]
    }
  );
}
function DocsShow({
  navigation = {},
  currentDoc = {},
  searchQuery = "",
  searchResults = []
}) {
  const [search, setSearch] = useState(searchQuery || "");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.get("/docs", { search: search.trim() });
    } else {
      router.get("/docs");
    }
  };
  const clearSearch = () => {
    setSearch("");
    router.get("/docs");
  };
  const docTitle = currentDoc?.title ? `${currentDoc.title} — VenQore Documentation` : "Documentation — VenQore";
  const docDescription = currentDoc?.description || "Guides and how-tos for VenQore — setting up your system, the point of sale, inventory, purchasing, documents and the double-entry ledger behind them.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: currentDoc?.title || "VenQore Documentation",
    description: docDescription,
    publisher: {
      "@type": "Organization",
      name: "VenQore",
      url: "https://venqore.com"
    }
  };
  const pageTitle = searchQuery ? /* @__PURE__ */ jsxs(Fragment, { children: [
    "Search results for “",
    searchQuery,
    "”"
  ] }) : currentDoc?.title || "Knowledge Base & Help Center";
  const pageLede = !searchQuery && currentDoc?.description ? currentDoc.description : "Everything you need to know about setting up your retail operating system, hardware integration, inventory management, and profit analytics.";
  return /* @__PURE__ */ jsxs(MarketingLayout, { title: docTitle, description: docDescription, children: [
    /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top vq-mc-top--flush", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
      /* @__PURE__ */ jsxs("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: [
        "Documentation",
        currentDoc?.category ? ` · ${currentDoc.category}` : ""
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-4", children: pageTitle }),
      /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-5", children: pageLede })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", style: { paddingTop: "var(--vq-space-8)" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-doc", style: { borderTop: "1px solid var(--vq-line)", paddingTop: "var(--vq-space-10)" }, children: [
      /* @__PURE__ */ jsxs("aside", { className: "vq-mc-rail", "data-open": mobileSidebarOpen ? "true" : "false", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSearchSubmit, className: "vq-mc-search", role: "search", children: [
          /* @__PURE__ */ jsx(Search, { size: 18, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("label", { htmlFor: "docs-search", className: "vq-sr", children: "Search Q&A and docs" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "docs-search",
              type: "text",
              className: "vq-input",
              placeholder: "Search Q&A / docs…",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              style: { paddingRight: search ? "64px" : void 0 }
            }
          ),
          search && /* @__PURE__ */ jsx("button", { type: "button", onClick: clearSearch, className: "vq-mc-search__clear", children: "Clear" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setMobileSidebarOpen(!mobileSidebarOpen),
            className: "vq-card vq-card--flat vq-mc-railtoggle vq-mt-4",
            "aria-expanded": mobileSidebarOpen,
            children: [
              /* @__PURE__ */ jsxs("span", { className: "vq-row vq-gap-3", children: [
                /* @__PURE__ */ jsx(FileText, { size: 18, "aria-hidden": "true", style: { color: "var(--vq-accent-text)" } }),
                currentDoc.title || "Table of Contents"
              ] }),
              mobileSidebarOpen ? /* @__PURE__ */ jsx(X, { size: 20, "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Menu, { size: 20, "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("span", { className: "vq-sr", children: [
                mobileSidebarOpen ? "Close" : "Open",
                " documentation menu"
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("nav", { className: "vq-mc-rail__nav vq-mt-8", "aria-label": "Documentation", children: Object.keys(navigation).map((category, idx) => /* @__PURE__ */ jsxs("div", { className: "vq-mc-rail__group", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-mc-rail__label", children: category }),
          navigation[category].map((item, keyIdx) => /* @__PURE__ */ jsxs(
            Link,
            {
              href: `/docs/${item.slug}`,
              onClick: () => setMobileSidebarOpen(false),
              className: `vq-mc-rail__link ${item.active ? "is-active" : ""}`,
              "aria-current": item.active ? "page" : void 0,
              children: [
                /* @__PURE__ */ jsx("span", { children: item.title }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 14, "aria-hidden": "true", style: { flex: "none", opacity: item.active ? 1 : 0.45 } })
              ]
            },
            keyIdx
          ))
        ] }, idx)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
        searchQuery && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-mc-rowhead", style: { marginBottom: "var(--vq-space-6)" }, children: [
            /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "Matching questions" }),
            /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--accent", children: [
              searchResults.length,
              " ",
              searchResults.length === 1 ? "match" : "matches"
            ] })
          ] }),
          searchResults.length > 0 ? /* @__PURE__ */ jsx("div", { className: "vq-stack vq-gap-4", children: searchResults.map((qa, i) => /* @__PURE__ */ jsxs("div", { id: `search-result-${i}`, className: "vq-card", style: { padding: "var(--vq-space-8)" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-meta", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: qa.category }),
              /* @__PURE__ */ jsxs("span", { className: "vq-mc-meta__item", children: [
                "Found in “",
                qa.slug,
                "”"
              ] })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "vq-h3 vq-mt-4", style: { fontSize: "20px" }, children: qa.question }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "vq-read vq-read--raw vq-read--sm vq-mt-3",
                dangerouslySetInnerHTML: { __html: qa.answer_html }
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "vq-mc-lcard__foot", style: { justifyContent: "flex-end", marginTop: "var(--vq-space-6)" }, children: /* @__PURE__ */ jsxs(Link, { href: `/docs/${qa.slug}`, className: "vq-link", children: [
              "Go to full guide ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
            ] }) })
          ] }, i)) }) : /* @__PURE__ */ jsxs("div", { className: "vq-card vq-mc-empty", children: [
            /* @__PURE__ */ jsx(Info, { size: 32, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("h3", { className: "vq-h3 vq-mt-4", children: "No Q&A matches found" }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2 vq-mt-2", style: { marginInline: "auto" }, children: 'Try searching different keywords like "POS", "printer", "WooCommerce", or "FBR".' })
          ] })
        ] }),
        !searchQuery && /* @__PURE__ */ jsxs("article", { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "vq-read vq-read--raw",
              dangerouslySetInnerHTML: { __html: currentDoc.body_html }
            }
          ),
          currentDoc.qas && currentDoc.qas.length > 0 && /* @__PURE__ */ jsxs("div", { style: { marginTop: "var(--vq-space-16)", maxWidth: "72ch" }, children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-eyebrow vq-eyebrow--accent", children: [
              /* @__PURE__ */ jsx(HelpCircle, { size: 14, "aria-hidden": "true", style: { display: "inline", verticalAlign: "-2px", marginRight: 8 } }),
              "Quick answers"
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-3", style: { marginBottom: "var(--vq-space-6)" }, children: "Related Questions & Answers" }),
            /* @__PURE__ */ jsx("div", { className: "vq-faq", children: currentDoc.qas.map((qa, i) => /* @__PURE__ */ jsx(DocFAQItem, { qa, index: i }, i)) })
          ] })
        ] })
      ] })
    ] }) }) })
  ] });
}
export {
  DocsShow as default
};
