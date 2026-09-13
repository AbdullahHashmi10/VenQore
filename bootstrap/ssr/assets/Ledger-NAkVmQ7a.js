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
function Ledger() {
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
      /* @__PURE__ */ jsx("title", { children: "Core Ledger — double-entry under every module | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/ledger" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Core Ledger — double-entry under every module | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/ledger" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Core Ledger — double-entry under every module | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "One double-entry engine under sales, purchases, stock and expenses, with seven correctness checks on every release. The AI never decides your numbers." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grid" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Core Ledger" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "The one part of VenQore the AI can't ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "touch" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Core Ledger is VenQore's double-entry accounting engine. Every sale, purchase, return, payment and expense writes a balanced journal entry automatically, so the trial balance, profit and loss and balance sheet come from the same postings your POS produced. The AI configures the system around it; it never decides what your numbers say." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/features#money", children: "See the money modules" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "var(--vq-space-8)" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-card--accent vq-stat vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Correctness checks" }),
            /* @__PURE__ */ jsxs("span", { className: "vq-stat__value", children: [
              "7",
              /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "/ 7 passing" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Run on every release, not once at launch" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }),
              /* @__PURE__ */ jsx("path", { d: "M9 7h6" }),
              /* @__PURE__ */ jsx("path", { d: "M9 11h4" })
            ] }) }),
            /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "One engine, every module" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "There is no second version of the truth to reconcile, because there is no second version." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
              /* @__PURE__ */ jsx("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" })
            ] }) }),
            /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Auditable by design" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Every posting traces to the document, the user and the timestamp. Your accountant can follow the trail without asking you a single question." })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The seven checks" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "We'd rather publish the check than ask you to trust it." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "These are the seven independent correctness tests the ledger runs against itself. All seven currently pass. When one fails, the release does not ship." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { "width": "220px" }, children: "Check" }),
              /* @__PURE__ */ jsx("th", { children: "What it proves" }),
              /* @__PURE__ */ jsx("th", { style: { "width": "120px" }, children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Balance integrity" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Every journal entry nets to zero. Debits equal credits or the transaction does not post — there is no partial write and no override." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Cost of goods" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "FIFO costing follows the batch, variant and location it actually came from. A margin that is right on the invoice is right in the P&L." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Tax handling" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Inclusive and exclusive rates, per-item overrides, exemptions and the reverse case all resolve to the same figure the return expects." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Multi-currency" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "The rate at the transaction, the rate at settlement and the difference between them all land somewhere explicit." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Inter-branch movement" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Stock leaving one location and arriving at another is one movement with two sides, not two adjustments that happen to agree." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Period closing" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A closed period is closed. Postings dated into it are refused, and the closing entries reconcile against the pre-close balances." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Reversal integrity" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Nothing is edited in place. A correction is a reversal plus a new entry, and both are visible." }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Passing"
                ] }) })
              ] })
            ] })
          ] }) })
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
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "In practice" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "What that actually means on a Tuesday." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Your P&L is not a report someone generated." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "It is the same data your till produced, read from the other end. Nobody assembles it and nobody can quietly adjust it." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsxs("h3", { className: "vq-h3", style: { "color": "#fff" }, children: [
                  "A stock adjustment moves inventory ",
                  /* @__PURE__ */ jsx("em", { children: "and" }),
                  " posts the cost."
                ] }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "You cannot do half of it. There is no state where the shelf is right and the books are not." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Month-end isn't a reconstruction. It's a date range." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Because everything posted when it happened, closing a month is selecting two dates, not rebuilding six weeks of history." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Your accountant gets a trial balance that ties, first time." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "And a day book, an account ledger and a party statement that agree with it, because they are all the same rows read differently." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "alignItems": "center", "gap": "var(--vq-space-16)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The line" }),
            /* @__PURE__ */ jsxs("h2", { className: "vq-display vq-mt-4", children: [
              "Flexible where it should be.",
              /* @__PURE__ */ jsx("br", {}),
              "Rigid where it must be."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "A system that will bend anywhere is a system you cannot trust with money. A system that bends nowhere is one you spend six months forcing your business into. The whole design of VenQore is the placement of that line." }),
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg vq-mt-8", href: "/blueprint", children: [
              "See what does bend ",
              /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "A single sale, both sides" }),
            /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-mt-4", style: { "border": "0" }, children: /* @__PURE__ */ jsxs("table", { className: "vq-table", style: { "minWidth": "0" }, children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "Account" }),
                /* @__PURE__ */ jsx("th", { className: "num", children: "Debit" }),
                /* @__PURE__ */ jsx("th", { className: "num", children: "Credit" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { children: [
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: "Cash" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "4,850" }),
                  /* @__PURE__ */ jsx("td", { className: "num vq-text-3", children: "—" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: "Sales revenue" }),
                  /* @__PURE__ */ jsx("td", { className: "num vq-text-3", children: "—" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "4,220" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: "Tax payable" }),
                  /* @__PURE__ */ jsx("td", { className: "num vq-text-3", children: "—" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "630" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: "Cost of goods sold" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "2,905" }),
                  /* @__PURE__ */ jsx("td", { className: "num vq-text-3", children: "—" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: "Inventory" }),
                  /* @__PURE__ */ jsx("td", { className: "num vq-text-3", children: "—" }),
                  /* @__PURE__ */ jsx("td", { className: "num", children: "2,905" })
                ] }),
                /* @__PURE__ */ jsxs("tr", { style: { "borderTop": "1px solid var(--vq-line)" }, children: [
                  /* @__PURE__ */ jsx("td", { style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Total" }),
                  /* @__PURE__ */ jsx("td", { className: "num", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "7,755" }),
                  /* @__PURE__ */ jsx("td", { className: "num", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "7,755" })
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-4", style: { "maxWidth": "none" }, children: "One barcode scan at the counter. Five postings, balanced, with the cost taken from the batch that actually left the shelf." })
          ] }) })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "The rest of the argument" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/reckoner", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Where a number is defined" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "One definition per reading, 18 period windows." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/security", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Who can reach your books" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Tenant isolation, roles, and an unedited record." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/features/accounting", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Double-entry accounting in detail" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Journals, trial balance, balance sheet." }),
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
  Ledger as default
};
