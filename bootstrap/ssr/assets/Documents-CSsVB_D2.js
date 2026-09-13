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
function Documents() {
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
      /* @__PURE__ */ jsx("title", { children: "Documents — thirteen types, one editor | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/documents" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Documents — thirteen types, one editor | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/documents" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Documents — thirteen types, one editor | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Thirteen document types on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__dots" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Documents" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Thirteen documents. ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "One" }),
              " editor."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "An invoice, a purchase return, a goods receipt and a stock audit are not four screens. They are one screen with different switches on — which is why a field that renders is always a field that posts." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/ledger", children: "How they post" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--wide", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-demo vq-reveal", "data-doc": true, children: [
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
                " www.venqore.com/documents"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-demo__live", children: "Live · try it" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-demo__controls", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", style: { "flex": "none" }, children: "Document type" }),
              /* @__PURE__ */ jsx("div", { className: "vq-demo__scroller", "data-doc-tabs": true, role: "tablist" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,1fr) 300px", "gap": "1px", "background": "var(--vq-line)" }, children: [
              /* @__PURE__ */ jsx("div", { "data-doc-stage": true, style: { "background": "var(--vq-surface)" } }),
              /* @__PURE__ */ jsx("div", { "data-doc-meta": true, style: { "background": "var(--vq-surface-2)", "padding": "var(--vq-space-5)" } })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-center vq-mt-4", style: { "maxWidth": "none" }, children: "Same editor every time. The type changes the labels, the columns, the totals block and which capabilities are switched on." })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "All thirteen" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Everything a trading business actually issues." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Sell side · 5" }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-stack vq-gap-3 vq-mt-5", children: [
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sales invoice" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "INV" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Quotation" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "QT" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sales order" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "SO" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sale return" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "SRET" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Recurring invoice" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "REC" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Buy side · 6" }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-stack vq-gap-3 vq-mt-5", children: [
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase invoice" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "BILL" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase order" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "PO" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Goods receipt" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "GRN" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase return" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "PRET" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Debit note" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "DN" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Expense" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "EXP" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Stock side · 2" }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-stack vq-gap-3 vq-mt-5", children: [
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock transfer" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "TRF" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock audit" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "AUD" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-6 vq-reveal", style: { "maxWidth": "70ch" }, children: "Sale return plays the credit-note role on the sell side; Debit note is its counterpart on the buy side. Which side a document is on is not cosmetic — it decides whether the party picker offers customers or suppliers, whether the rate column says Price or Unit cost, and whether shipping appears in the totals at all." })
        ] }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "820px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Why one editor matters" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Copy-pasted screens are where the money leaks." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "In most systems these are separate files, copied and edited. When they drift, they drift silently — and the drift is always in the direction of a number being wrong. Here are four real ones we found and closed when we collapsed thirteen screens into one." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                  /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "A debit note that never restored stock" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "It did not send a warehouse ID. The credit hit the supplier account, the goods never came back into inventory, and stock and ledger disagreed from that moment on." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                  /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "A sale return that zeroed tax and discount" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "The screen collected both. The server threw both away and picked the first warehouse it found. The refund was wrong, quietly, every time." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                  /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "One tax source, then five" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "Only the sales invoice read the tax settings. Every other document carried its own copy, and the copies aged apart." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                  /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                ] }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "The same cart, totalled differently" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "Round-off was implemented per screen. The same basket produced two different totals depending on which document you raised it as." })
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-6 vq-mt-12 vq-reveal", style: { "justifyContent": "space-between", "alignItems": "center" }, children: [
              /* @__PURE__ */ jsx("p", { className: "vq-h3", style: { "color": "#fff", "maxWidth": "48ch" }, children: "One payload builder for all thirteen. A field that renders is a field that posts." }),
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--lg vq-btn--onDark", href: "/ledger", children: [
                "See where they post ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)", "alignItems": "center" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Density" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "Three densities, because a receipt is not a bill." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "A stock transfer needs two fields and four columns. A purchase invoice with landed cost, per-line tax and foreign currency needs twelve and nine. The editor carries all three and each document type declares which it wants — and you can override it." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-table-wrap vq-reveal", children: [
            /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "Density" }),
                /* @__PURE__ */ jsx("th", { className: "num", children: "Header fields" }),
                /* @__PURE__ */ jsx("th", { className: "num", children: "Line columns" }),
                /* @__PURE__ */ jsx("th", { className: "num", children: "Total rows" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { children: [
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Simple" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "2" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "5" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "3" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Standard" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "7" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "7" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "7" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Pro" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "12" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "10" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "10" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { "padding": "var(--vq-space-4)", "borderTop": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("p", { className: "vq-caption", style: { "maxWidth": "none" }, children: "Below the width a line needs, the table wraps to cards rather than clipping a column. Collapsing the customer block is worth five to ten more visible item rows on a laptop." }) })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-section-head vq-section-head--center vq-reveal", children: /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Shared by all thirteen." }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One numbering scheme" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "INV-000148, PO-000148, AUD-000148. Same shape, one sequence per type, never reused." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One tax source" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Change a rate in settings and every document type follows it in the same instant." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One round-off rule" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "A document property applied once, not thirteen implementations that drift." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One ledger path" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Every type posts through the Core Ledger. There is no document that skips the books." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One keymap" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "24 shortcuts, identical at the register and in the editor." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One layout law" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Header, lines, summary. Three zones, measured floors, nothing pushed off the edge." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One set of actions" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Save, print, email, WhatsApp, PDF, duplicate, record payment — wherever they make sense." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "One audit trail" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Who raised it, when, what changed, and the reversal if it was corrected." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Where documents come from" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pos", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The register that issues them" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "A till you compose yourself." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/ledger", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What each one posts" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Every document lands in the same ledger." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/tools", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Free document generators" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Invoices, quotes, receipts and purchase orders, no signup." }),
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
  Documents as default
};
