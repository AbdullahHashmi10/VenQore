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
function Features() {
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
      /* @__PURE__ */ jsx("title", { children: "Features — 140+ modules, nothing charged extra | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Everything VenQore ships today: 140+ modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/features" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Features — 140+ modules, nothing charged extra | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Everything VenQore ships today: 140+ modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/features" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Features — 140+ modules, nothing charged extra | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Everything VenQore ships today: 140+ modules, 58 dashboard readings, 13 document types and 40 reports. Every plan includes the whole system." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__dots" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "What's inside" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Everything the business actually runs on. Nothing charged as a ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "module" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Everything VenQore ships today, across ten groups: point of sale with offline mode, FIFO inventory with batch and expiry tracking, purchasing, invoicing, customer credit, expenses, staff and permissions, multi-channel sync, AI capture, and double-entry accounting. 140+ modules, 13 document types, 40 reports and 58 dashboard readings — all of it on every plan." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/pricing", children: "See pricing" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal vq-card--accent", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Modules to compose" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: /* @__PURE__ */ jsx("span", { "data-count": "46", children: "46" }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Turned on by your Blueprint, not bought one at a time" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Dashboard readings" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: /* @__PURE__ */ jsx("span", { "data-count": "108", children: "108" }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Across 18 period windows — 1,944 distinct figures" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Document types" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: /* @__PURE__ */ jsx("span", { "data-count": "13", children: "13" }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "One editor, one payload builder, one ledger path" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Passing tests" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: /* @__PURE__ */ jsx("span", { "data-count": "1610", children: "1610" }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Run against every reading, on every release" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "vq-row vq-wrap vq-gap-2 vq-mt-10 vq-reveal", "aria-label": "Jump to a group", children: [
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#selling", children: "Selling" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#stock", children: "Stock" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#buying", children: "Buying" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#money", children: "Money" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#parties", children: "Customers & suppliers" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#reports", children: "Reports" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#people", children: "People & access" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#channels", children: "Channels" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#ai", children: "AI & intelligence" }),
            /* @__PURE__ */ jsx("a", { className: "vq-chip", href: "#platform", children: "Platform" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "See them working" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h1", children: "Six live demos, not six screenshots." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/pos", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
                /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
                /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "The register" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Seven starting points and eight controls. Recompose the till and watch the panes re-derive." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "7",
                  /* @__PURE__ */ jsx("small", { children: "layouts" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/documents", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
                /* @__PURE__ */ jsx("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Documents" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Switch between all thirteen types and watch the same editor reconfigure itself." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "13",
                  /* @__PURE__ */ jsx("small", { children: "types" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/dashboard-preview", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
                /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
                /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
                /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "The dashboard" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Tap a reading and the card lands, already sized to what it needs." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "58",
                  /* @__PURE__ */ jsx("small", { children: "readings" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/smartcapture", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }),
                /* @__PURE__ */ jsx("path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }),
                /* @__PURE__ */ jsx("path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }),
                /* @__PURE__ */ jsx("path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }),
                /* @__PURE__ */ jsx("path", { d: "M7 12h10" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "SmartCapture" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Point it at a bill, a screenshot or a voice note and watch a transaction come back." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "11",
                  /* @__PURE__ */ jsx("small", { children: "seconds" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/reckoner", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }),
                /* @__PURE__ */ jsx("path", { d: "M9 7h6" }),
                /* @__PURE__ */ jsx("path", { d: "M9 11h4" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "The Reckoner" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "One definition per figure, eighteen windows, and a history that survives every rename." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "18",
                  /* @__PURE__ */ jsx("small", { children: "windows" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--xl vq-fcard vq-reveal", href: "/vensynq", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M12 22v-5" }),
                /* @__PURE__ */ jsx("path", { d: "M9 8V2" }),
                /* @__PURE__ */ jsx("path", { d: "M15 8V2" }),
                /* @__PURE__ */ jsx("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "VenSynQ" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "One catalogue behind five channels, with commission isolated from your margin." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-fcard__meta", children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-fcard__n", children: [
                  "5",
                  /* @__PURE__ */ jsx("small", { children: "channels" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "vq-link", children: [
                  "Open ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", id: "selling", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
              /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
              /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Selling" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The counter, and everything that happens at it." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "17 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Instant barcode scanner" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Serial & IMEI scanner" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Park & recall (hold bill)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Cart rescue & session protection" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Typo-tolerant search" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-account split payments" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Daily cash register audit" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Negative stock alert & lock" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Barcode pattern recognition" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Service fee & freight additions" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Automatic VAT / GST calculation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "A4 & letter invoice PDF" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Recurring invoicing" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sales return vouchers" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Pre-sales inventory reservation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Wholesale vs retail price tiers" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Barcode label print factory" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight vq-section--alt", id: "stock", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "m7.5 4.27 9 5.15" }),
              /* @__PURE__ */ jsx("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
              /* @__PURE__ */ jsx("path", { d: "m3.3 7 8.7 5 8.7-5" }),
              /* @__PURE__ */ jsx("path", { d: "M12 22V12" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Stock" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "What you have, what it cost, and where it is." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "14 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Product variant support" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Variant-aware FIFO costing" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Batch intake number tracking" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock take audit wizard" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Category management centre" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Low stock threshold alerts" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "IMEI & serial lifecycle tracking" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Unit of measure converter" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock reservation rules" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Disaster & asset claim manager" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-warehouse isolation (godown)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock transfer vouchers" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock valuation by location" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Inbound expiry date tracking" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", id: "buying", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
              /* @__PURE__ */ jsx("path", { d: "M15 18H9" }),
              /* @__PURE__ */ jsx("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
              /* @__PURE__ */ jsx("circle", { cx: "17", cy: "18", r: "2" }),
              /* @__PURE__ */ jsx("circle", { cx: "7", cy: "18", r: "2" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Buying" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Suppliers, terms, and what you actually paid." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "17 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase order tracker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Auto-generated purchase orders" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier debit notes" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase returns register" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier account registry (khata)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Delayed supplier payments" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier statement generator" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Aged payables directory" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Outstanding payables dashboard" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier lead time tracker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier SKU mapping" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Custom supplier payment terms" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Landing cost allocations" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Cost price increase alert" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Bulk supplier payments" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Tax-inclusive procurement toggle" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Supplier credit limit alerts" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight vq-section--alt", id: "money", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }),
              /* @__PURE__ */ jsx("path", { d: "M9 7h6" }),
              /* @__PURE__ */ jsx("path", { d: "M9 11h4" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Money" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The Core Ledger and everything that posts through it." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "14 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Double-entry journal engine" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Automated cash reconciliation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Fixed asset depreciation tracker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Business loan ledger" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Inter-register cash transfers" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Advance payment allocation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Fiscal year closing wizard" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Bank reconciliation checker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Tax summary engine" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Expense manager + receipt uploads" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Charity allocation engine" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Balanced reversal engine" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-currency configuration" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Custom tax rate configurator" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", id: "parties", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }),
              /* @__PURE__ */ jsx("path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }),
              /* @__PURE__ */ jsx("path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }),
              /* @__PURE__ */ jsx("path", { d: "M10 6h4" }),
              /* @__PURE__ */ jsx("path", { d: "M10 10h4" }),
              /* @__PURE__ */ jsx("path", { d: "M10 14h4" }),
              /* @__PURE__ */ jsx("path", { d: "M10 18h4" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Customers & suppliers" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Who owes what, and who is worth keeping." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "16 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer account registry (khata)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer payments log" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer statement generator" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Aged receivables report" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-payment invoices" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Outstanding balance dashboard" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Unified party ledger" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer address book" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Credit limit enforcement" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Credit limit breach alerts" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer milestone tracker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Anniversary & birthday tracker" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Tax-exempt customer flag" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Customer wallet credit" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Loyalty points system" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Digital gift cards" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight vq-section--alt", id: "reports", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }),
              /* @__PURE__ */ jsx("path", { d: "M18 17V9" }),
              /* @__PURE__ */ jsx("path", { d: "M13 17V5" }),
              /* @__PURE__ */ jsx("path", { d: "M8 17v-3" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Reports" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "40 built reports, all reading the same ledger." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "25 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Profit & loss statement" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Balance sheet" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Double-entry trial balance" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sales summary & daily trend" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Day book log" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Account ledger report" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Party statement (khata ledger)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock valuation report" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Low stock shortages" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock movement history" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Tax compliance summary" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Item-wise profit analysis" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Party-wise profitability" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Bill-wise profitability" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sales aging report" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Expense by category" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock summary & aging" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Loan repayment statement" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchases report" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Transactions history" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Bank statements log" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Expiring soon alert" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Category profit & loss" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Discount & tax rate breakdown" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sale orders report" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", id: "people", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
              /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
              /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
              /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "People & access" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Roles, limits, and a trail of who did what." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "9 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Granular multi-store roles" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Cashier PIN login" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Staff invitation codes" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Owner daily pulse" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Owner profit peek" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Security activity log" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Cashier inactivity auto-logout" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Passcode security standards" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Senior mode accessibility" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight vq-section--alt", id: "channels", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M12 22v-5" }),
              /* @__PURE__ */ jsx("path", { d: "M9 8V2" }),
              /* @__PURE__ */ jsx("path", { d: "M15 8V2" }),
              /* @__PURE__ */ jsx("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Channels" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Sell in five places. Count stock once." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "10 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "VenSynQ command centre" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "3-click OAuth store connection" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Automated commission isolation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Just-in-time purchase orders" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Bulk tracking ID sync" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "WooCommerce real-time webhook" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "WooCommerce stock sync" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "WooCommerce customer auto-registry" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Web store catalog controls" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-channel expense allocation" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight", id: "ai", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }) }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "AI & intelligence" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Deterministic where it can be, honest where it can't." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "9 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Smart capture (image & audio)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Floating AI assistant" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Reorder due alerts" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Evidence on every insight" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Self-scoring accuracy loop" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Self-tuning thresholds" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Learns your scale" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Runs without an AI key" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Daily business snapshots" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--tight vq-section--alt", id: "platform", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,280px) minmax(0,1fr)", "gap": "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", style: { "position": "sticky", "top": "120px", "alignSelf": "start" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }),
              /* @__PURE__ */ jsx("path", { d: "m9 12 2 2 4-4" })
            ] }) }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Platform" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The parts you only notice when they are missing." }),
            /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent vq-mt-4", style: { "display": "inline-flex" }, children: "13 shipped" })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "vq-grid vq-grid--2 vq-reveal", style: { "gap": "var(--vq-space-3) var(--vq-space-6)", "alignContent": "start" }, children: [
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Progressive web app (PWA)" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Multi-tenant store isolation" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Subscription plan enforcement" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Automated limit override manager" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Soft-delete trash management" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Backups & Google Drive sync" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Import / export tools" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Test data wipe" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Instant store creator" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Self-guiding setup tour" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Custom domain mapping" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "SSO / SAML authentication" })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Dark & light themes" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Being straight about it" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "What isn't here yet." }),
              /* @__PURE__ */ jsxs("p", { className: "vq-lede vq-mt-6", children: [
                "A site that admits one real limitation is believed about everything else. So: these are named in our own catalogue and are ",
                /* @__PURE__ */ jsx("b", { style: { "color": "#fff" }, children: "not" }),
                " shipping. We will not sell you a feature that does not function."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-stack vq-gap-4 vq-reveal", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-card", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("b", { className: "vq-small", children: "SMS & WhatsApp reminders" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "The gateway is not built, so debt reminders do not send. Statements and PDFs do." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("b", { className: "vq-small", children: "Custom SMTP mail gateway" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Mail goes out on our infrastructure. You cannot yet point it at your own server." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("b", { className: "vq-small", children: "Appointments & scheduling" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Which is why we do not sell to salons, clinics, gyms or hotels yet. When scheduling ships, all four unlock at once." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "vq-card", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-text-3)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("b", { className: "vq-small", children: "A support organisation" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "One founder answers the email. That is a real trade-off, and it is better you know now." })
                ] })
              ] }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Go deeper" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/solutions", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Your trade, specifically" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Six industry configurations." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/compare", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "How this compares" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Against Square and Vyapar, with the maths." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/docs", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Guides and how-tos" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Setting it up, screen by screen." }),
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
  Features as default
};
