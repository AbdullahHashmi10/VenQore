import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Package, CheckCircle2, Database, Layers, Fingerprint, ArrowRight, Cpu, Hexagon, Lock, X, Rocket, ExternalLink } from "lucide-react";
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
function DigitalProducts({ products = [], stats = {} }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  useEffect(() => {
    if (!selectedProduct) return void 0;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProduct]);
  const activeProducts = products.filter((p) => p.status === "active");
  const devProducts = products.filter((p) => p.status === "dev");
  const soonProducts = products.filter((p) => p.status === "soon");
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "VenQore Digital Products catalog",
      description: "Explore our premium collection of offline POS modules, standalone platforms, and custom accounting extensions.",
      children: [
        /* @__PURE__ */ jsx(Head, { title: "Digital Products & Registry Catalog" }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: 0 }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "VenQore ecosystem" }),
            /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: "Digital registry" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "The definitive suite of double-entry ledger systems, point-of-sale registers, and analytics overlays. Built for zero-latency, offline-first operational dominance." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3 vq-mt-12 vq-dp-stats", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Total modules" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: stats.total })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Live & active" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-dp-live", children: stats.done })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "In pipeline" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-accent-text", children: stats.pending })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Core flagship modules" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Fully operational" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Tested, deployed, and production-ready accounting systems with fully operational double-entry ledger registers." })
          ] }),
          activeProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-center vq-dp-empty", children: [
            /* @__PURE__ */ jsx(Package, { size: 40, "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("p", { children: "No active flagship modules configured." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "vq-stack vq-gap-8", children: activeProducts.map((product) => /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-dp-flag", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-dp-flag__main", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--success", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 14, "aria-hidden": "true" }),
                  " Validated core"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-badge", children: [
                  "Build ",
                  product.version || "v1.0.0"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-h1 vq-mt-6", children: product.name }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-4", children: product.description }),
              /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2 vq-mt-8", style: { gap: "var(--vq-space-4)" }, children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-dp-point", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { marginBottom: 0 }, children: /* @__PURE__ */ jsx(Database, { "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { children: "Ledger integrity" }),
                    /* @__PURE__ */ jsx("p", { children: "Cryptographically secure double-entry transaction routing." })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-dp-point", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { marginBottom: 0 }, children: /* @__PURE__ */ jsx(Layers, { "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { children: "Component expansion" }),
                    /* @__PURE__ */ jsx("p", { children: "Hot-swappable UI layouts without touching core logic." })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-dp-flag__side", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx(Fingerprint, { "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsx("h4", { className: "vq-h3", children: "Acquisition portals" }),
              /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-2", children: "Select an authorized merchant provider to license this module." }),
              !product.platforms || product.platforms.length === 0 ? /* @__PURE__ */ jsx("div", { className: "vq-dp-none vq-mt-6", children: "No external checkout gateways configured yet." }) : /* @__PURE__ */ jsx("div", { className: "vq-stack vq-gap-3 vq-mt-6", children: product.platforms.map((platform, idx) => /* @__PURE__ */ jsxs(
                "a",
                {
                  href: platform.link,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: `vq-btn ${idx === 0 ? "vq-btn--primary" : "vq-btn--secondary"} vq-btn--lg vq-btn--block vq-dp-buy`,
                  children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Secure checkout · ",
                      platform.label || platform.name
                    ] }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18, className: "vq-btn__arrow", "aria-hidden": "true" })
                  ]
                },
                idx
              )) })
            ] })
          ] }, product.id)) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Active pipeline" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Under construction" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "High-priority modules currently in the engineering bay. Architecture defined, coding in progress." })
          ] }),
          devProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-center vq-dp-empty", children: /* @__PURE__ */ jsx("p", { children: "No pipeline modules in active assembly." }) }) : /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--2", children: devProducts.map((product) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSelectedProduct(product),
              className: "vq-card vq-card--xl vq-card--interactive vq-dp-dev",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { marginBottom: 0 }, children: /* @__PURE__ */ jsx(Cpu, { "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: "Engineering bay" })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "vq-tile__title vq-mt-6", children: product.name }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3 vq-dp-clamp", children: product.description }),
                /* @__PURE__ */ jsxs("div", { className: "vq-dp-dev__foot", children: [
                  /* @__PURE__ */ jsxs("span", { className: "vq-caption", children: [
                    "Build ",
                    product.version || "Beta Dev"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                    "Preview links ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
                  ] })
                ] })
              ]
            },
            product.id
          )) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--dot", children: "Future add-ons" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Conceptual roadmap" }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Blueprints generated. Engineering blocked until current pipeline clears." })
          ] }),
          soonProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-center vq-dp-empty", children: /* @__PURE__ */ jsx("p", { children: "No roadmap items cataloged." }) }) : /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--4", children: soonProducts.map((product) => /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--flat vq-dp-soon", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsx(Hexagon, { size: 22, "aria-hidden": "true" }),
              /* @__PURE__ */ jsx(Lock, { size: 16, "aria-hidden": "true" })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "vq-dp-soon__name", children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "vq-dp-clamp", children: product.description }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--soon vq-dp-soon__tag", children: "Pending core" })
          ] }, product.id)) })
        ] }) }),
        selectedProduct && /* @__PURE__ */ jsx("div", { className: "vq-gate", onClick: () => setSelectedProduct(null), children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "vq-gate__card vq-dp-modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "dp-modal-title",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedProduct(null), className: "vq-gate__close", "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "vq-center", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { margin: "0 auto var(--vq-space-5)" }, children: /* @__PURE__ */ jsx(Rocket, { "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Early access preview" }),
                /* @__PURE__ */ jsx("h2", { id: "dp-modal-title", className: "vq-h2 vq-mt-3", children: selectedProduct.name }),
                /* @__PURE__ */ jsx("p", { className: "vq-small vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: selectedProduct.description })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-label vq-mt-8", style: { display: "block", paddingBottom: 8, borderBottom: "1px solid var(--vq-line)" }, children: "Pre-order / testing portals" }),
              !selectedProduct.platforms || selectedProduct.platforms.length === 0 ? /* @__PURE__ */ jsx("div", { className: "vq-dp-none vq-mt-4", children: "Testing portals are currently closed." }) : /* @__PURE__ */ jsx("div", { className: "vq-stack vq-gap-3 vq-mt-4 custom-scrollbar", style: { maxHeight: 250, overflowY: "auto" }, children: selectedProduct.platforms.map((platform, idx) => /* @__PURE__ */ jsxs(
                "a",
                {
                  href: platform.link,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "vq-card vq-card--interactive vq-dp-portal",
                  children: [
                    /* @__PURE__ */ jsxs("span", { className: "vq-row vq-gap-3", children: [
                      /* @__PURE__ */ jsx(ExternalLink, { size: 18, "aria-hidden": "true" }),
                      /* @__PURE__ */ jsx("span", { className: "vq-dp-portal__name", children: platform.label || platform.name })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                      "Access ",
                      /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
                    ] })
                  ]
                },
                idx
              )) })
            ]
          }
        ) })
      ]
    }
  );
}
export {
  DigitalProducts as default
};
