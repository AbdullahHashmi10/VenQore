import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { g as useTheme } from "../ssr.js";
import { usePage, Head } from "@inertiajs/react";
import { S as SiteHeader, a as SiteFooter, C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "lucide-react";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "motion/react";
function DashboardPreview() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { auth = {}, flash = {}, ...props } = usePage().props;
  useEffect(() => {
    document.documentElement.setAttribute("data-vq-shell", "marketing");
    document.documentElement.style.overflowY = "auto";
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflow = "visible";
    document.body.style.height = "auto";
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.style.height = "auto";
      appRoot.style.overflow = "visible";
    }
    let active = true;
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          existing.remove();
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };
    const initEngines = async () => {
      try {
        await loadScript("/v6/assets/venqore.js");
        await loadScript("/v6/assets/demos.js");
        await loadScript("/v6/assets/venqore-forms.js");
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("scroll"));
      } catch (err) {
        console.warn("VenQore visual engines init notice:", err);
      }
    };
    const timer = setTimeout(() => {
      if (active) initEngines();
    }, 50);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "The dashboard — 58 readings that assemble themselves | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/dashboard-preview" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "The dashboard — 58 readings that assemble themselves | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/dashboard-preview" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "The dashboard — 58 readings that assemble themselves | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Pick what you want to know; the card sizes itself. 58 readings across five areas, 21 chart types, and three server-side gates on every card." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The dashboard" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Your dashboard is ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "assembled" }),
              ", not chosen."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "58 readings, five areas, twenty-one chart types and eighteen size fits. You pick what you want to know — never what shape it should be — and the card works out the smallest size it can be read at." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/reckoner", children: "Where the numbers come from" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--wide", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-demo vq-reveal", "data-builder": true, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-demo__bar", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-demo__dots", children: [
                /* @__PURE__ */ jsx("i", {}),
                /* @__PURE__ */ jsx("i", {}),
                /* @__PURE__ */ jsx("i", {})
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-demo__url", children: [
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }),
                  /* @__PURE__ */ jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
                ] }),
                " www.venqore.com/dashboard"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-demo__live", children: "Live · try it" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-build", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-build__board", "data-builder-board": true }),
              /* @__PURE__ */ jsxs("div", { className: "vq-build__lib", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "marginBottom": "var(--vq-space-3)" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Add a reading" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", "data-builder-count": true })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-build__search", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
                    /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
                  ] }),
                  " Search 58 readings…"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-build__list", "data-builder-list": true })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-center vq-mt-4", style: { "maxWidth": "none" }, children: "A sample of the registry. Tap a reading to put it on the board — the card picks its own size, and the headline metric takes the accent fill." })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "58 readings" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Everything a trading business is judged by." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Grouped by the part of the business it belongs to, not by which screen it happens to live on." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal vq-card--accent", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Sales" }),
                /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", style: { "fontSize": "26px" }, children: "32" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Revenue, payment split, top products, top customers, basket size, discount given, return rate, funnel, by hour and day, by channel, by region, live feed…" })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Finance" }),
                /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", style: { "fontSize": "26px" }, children: "28" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Profit trend, cash in vs out, receivables ageing, books balanced, cash runway, days sales outstanding, days payable outstanding, quick ratio, expense ratio, tax liability…" })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Inventory" }),
                /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", style: { "fontSize": "26px" }, children: "26" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Stock value, low stock, out of stock, turnover, days of cover, sell-through, dead stock, expiring in 30 days, batch tracking, serial lifecycle, stock by warehouse…" })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Purchasing" }),
                /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", style: { "fontSize": "26px" }, children: "11" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Spend trend, spend by supplier, supplier concentration, average lead time, on-time delivery, purchase orders pending and received, debit notes and open credits." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Operations" }),
                /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", style: { "fontSize": "26px" }, children: "11" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Staff present and absent, hours today, attendance rate, sales per staff member, new vs returning, customer retention, open tickets, plan usage." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "And the multiplier" }),
              /* @__PURE__ */ jsxs("p", { className: "vq-tile__body vq-mt-3", children: [
                "Every reading resolves over eighteen period windows, most with a comparison window behind it. That is ",
                /* @__PURE__ */ jsx("b", { style: { "color": "var(--vq-text)" }, children: "1,944 distinct figures" }),
                " before anyone picks a chart type or a size."
              ] }),
              /* @__PURE__ */ jsxs("a", { className: "vq-link vq-mt-4", href: "/reckoner", children: [
                "How the periods work ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The rule that makes it work" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "No card can clip its own content." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Every card declares the smallest size it can still be read at. Sizes below that floor are not offered — they render disabled with the reason. A bar chart cannot be placed in a tile, and a tile is not allowed to pretend it is a chart." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { "width": "90px" }, children: "Category" }),
              /* @__PURE__ */ jsx("th", { style: { "width": "120px" }, children: "Name" }),
              /* @__PURE__ */ jsx("th", { children: "Holds" }),
              /* @__PURE__ */ jsx("th", { children: "Legal fits (columns × rows)" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C1" }),
                /* @__PURE__ */ jsx("td", { children: "Tile" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A single glyph and a number. No chart host at all." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "2×1 · 1×1" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C2" }),
                /* @__PURE__ */ jsx("td", { children: "Strip" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "One KPI on one line — label left, value right." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "4×1 · 3×2" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C3" }),
                /* @__PURE__ */ jsx("td", { children: "Metric" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A KPI with a delta, a sparkline or a comparison." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "4×3 · 3×2 · 2×2 · 2×3" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C4" }),
                /* @__PURE__ */ jsx("td", { children: "Panel" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A ranked list, a breakdown, a small chart, a table excerpt." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "4×4 · 3×4 · 3×5 · 2×6" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C5" }),
                /* @__PURE__ */ jsx("td", { children: "Board" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A full chart, multi-series, a wide table." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "6×6 · 5×7 · 4×8" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head vq-num", children: "C6" }),
                /* @__PURE__ */ jsx("td", { children: "Canvas" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A hero chart, a P&L, a cohort grid, a map." }),
                /* @__PURE__ */ jsx("td", { className: "vq-num vq-text-2", children: "8×8 · 6×10 · 4×12" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4 vq-mt-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "18 fits, all verified" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "18 of 18 render at exact geometry, with zero ladder mismatches across 292 catalogue cards and all ten roles." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "A card widens before it degrades" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "It only drops to a leaner fit when widening is exhausted — and then it re-lays its inside rather than shrinking the type." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Numbers step down, never clip" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Currency drops first, then decimals, then magnitude. The exact value is always one hover away." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Exactly one filled card" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "One card on the board carries the accent fill, and it is the headline metric. Two is a fail. Zero is a fail." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-amb", children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-amb__beams", children: [
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {})
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Who sees what" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "A cashier is never offered the P&L." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Three independent gates decide whether a card is even in the picker, and all three are enforced on the server. A card you are not entitled to does not render blank — it is not there." }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-stack vq-gap-5 vq-mt-8", children: [
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("b", { className: "vq-body", style: { "color": "#fff", "fontWeight": "var(--vq-fw-semi)" }, children: "Permission" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-1", style: { "maxWidth": "none" }, children: "Your role. A cashier sees eight cards; a store owner sees eighty-five." })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("b", { className: "vq-body", style: { "color": "#fff", "fontWeight": "var(--vq-fw-semi)" }, children: "Plan feature" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-1", style: { "maxWidth": "none" }, children: "Production, stock valuation and channel cards appear when your plan includes them." })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("b", { className: "vq-body", style: { "color": "#fff", "fontWeight": "var(--vq-fw-semi)" }, children: "Capability" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-1", style: { "maxWidth": "none" }, children: "A cached probe of what your business actually records. No products yet means no stock cards — not empty ones." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-8", style: { "maxWidth": "52ch" }, children: 'A metric that fails any gate executes zero database queries. And a card the platform knows cannot work is never offered at all — an option that always renders "not available" is worse than an option that does not exist.' })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Cards visible, by role" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-rank vq-mt-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Store owner" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "85" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "100%", "width": "100%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "General manager" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "78" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "92%", "width": "92%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Internal accountant" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "36" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "42%", "width": "42%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Inventory manager" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "26" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "31%", "width": "31%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "External auditor" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "25" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "29%", "width": "29%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Shift manager" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "19" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "22%", "width": "22%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Cashier" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "8" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "9%", "width": "9%" } }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Purchasing agent" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "7" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "8%", "width": "8%" } }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-6", style: { "maxWidth": "none" }, children: "Ten roles ship out of the box. 292 card placements across all of them, and every one of those placements is checked before it renders." })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Behind the cards" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/reckoner", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "One place a number can be defined" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "So the dashboard and the P&L cannot disagree." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/blueprint", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "How your card set was chosen" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Describe the business; the modules follow." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/features", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Everything that ships today" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "140+ modules, 13 document types, 40 reports." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(SiteFooter, {}),
      /* @__PURE__ */ jsx(CookieConsent, {})
    ] })
  ] });
}
export {
  DashboardPreview as default
};
