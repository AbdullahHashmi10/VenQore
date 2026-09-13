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
function SmartCapture() {
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
      /* @__PURE__ */ jsx("title", { children: "SmartCapture — a photo in, a posted transaction out | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/smartcapture" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "SmartCapture — a photo in, a posted transaction out | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/smartcapture" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "SmartCapture — a photo in, a posted transaction out | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Photograph a supplier bill or send a voice note. SmartCapture reads it, matches each line to your catalogue, and hands you a transaction to approve." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "SmartCapture" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "The order came in as a voice note. It ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "leaves" }),
              " as a sale."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "SmartCapture is VenQore's AI document scanner. Photograph a supplier invoice, forward a WhatsApp screenshot or send a voice note, and it extracts the line items, matches each one to your product catalogue, flags what it cannot match, and hands you a draft purchase or sale to approve. Nothing posts to your accounts until you say so." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Try it free ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/pricing#ai", children: "What it costs" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-demo vq-reveal", "data-capture": true, children: [
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
              " www.venqore.com/capture"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-demo__live", children: "Live · try it" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-demo__controls", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", style: { "flex": "none" }, children: "Point it at" }),
            /* @__PURE__ */ jsx("div", { className: "vq-demo__scroller", "data-capture-tabs": true, role: "tablist" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-cap", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-cap__in", children: [
              /* @__PURE__ */ jsx("div", { className: "vq-cap__stage", "data-capture-stage": true }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block vq-mt-4", "data-capture-run": true, children: "Read it" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-cap__out", "data-capture-out": true })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The arithmetic" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Where the day actually goes." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Nobody opens a business to type. A forty-line supplier bill is twenty minutes of entry and one transposed digit away from a stock count that will not tie for a month." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-card--accent vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "A 40-line bill" }),
              /* @__PURE__ */ jsxs("span", { className: "vq-stat__value", children: [
                "11",
                /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "seconds" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Photograph, read, match, review, post" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "By hand" }),
              /* @__PURE__ */ jsxs("span", { className: "vq-stat__value", children: [
                "20",
                /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "minutes" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Item, quantity, rate, tax, line by line" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Bills a week" }),
              /* @__PURE__ */ jsxs("span", { className: "vq-stat__value", children: [
                "30",
                /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "+" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "For a shop with four regular distributors" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Hours a month" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: "38" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Spent typing what a camera can read" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-5 vq-reveal", style: { "maxWidth": "74ch" }, children: "Those are our own timings on our own bills, on a shop with four distributors — not an industry study. Yours will differ. The point is not the number; it is that the work is a photograph rather than an afternoon." })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "What it will read" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Whatever the day hands you." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }),
                /* @__PURE__ */ jsx("path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }),
                /* @__PURE__ */ jsx("path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }),
                /* @__PURE__ */ jsx("path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }),
                /* @__PURE__ */ jsx("path", { d: "M7 12h10" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A photograph of a bill" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Crumpled, angled, thermal, handwritten totals. It reads the lines, not the layout — so a distributor changing their template does not break anything." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
                /* @__PURE__ */ jsx("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A PDF or a screenshot" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "The order that arrived as a WhatsApp picture of a list. The statement your supplier emailed. Forward it in and it comes back structured." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M12 19v3" }),
                /* @__PURE__ */ jsx("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
                /* @__PURE__ */ jsx("rect", { x: "9", y: "2", width: "6", height: "13", rx: "3" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A voice note" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "In Urdu, in English, or in the mix people actually speak. Say what you sold and to whom; it comes back as a sale with the customer attached." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "m7.5 4.27 9 5.15" }),
                /* @__PURE__ */ jsx("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
                /* @__PURE__ */ jsx("path", { d: "m3.3 7 8.7 5 8.7-5" }),
                /* @__PURE__ */ jsx("path", { d: "M12 22V12" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A packing list" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Against the purchase order you already raised, so the goods receipt shows ordered, received and remaining side by side." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("line", { x1: "19", x2: "5", y1: "5", y2: "19" }),
                /* @__PURE__ */ jsx("circle", { cx: "6.5", cy: "6.5", r: "2.5" }),
                /* @__PURE__ */ jsx("circle", { cx: "17.5", cy: "17.5", r: "2.5" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A price list" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Bulk-update cost prices from the sheet your distributor sent, with every change shown before anything is applied." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
                /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
                /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A stack of business cards" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Straight into your customer book, deduplicated against the numbers you already have." })
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
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "820px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The part that matters" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "It matches. It does not guess." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Reading a bill is the easy half. The half that decides whether this saves you time or costs you a weekend is what happens to a line the system has never seen before." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Matched against your catalogue, not a dictionary" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Every line resolves to an item you actually stock — by SKU, by barcode, by the name your distributor uses, or by the name you use. The mapping is remembered, so the second bill from that supplier is cleaner than the first." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "A line it cannot match is flagged, never invented" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: 'It says "new item" and stops. You decide whether to create it. There is no threshold at which the system quietly makes something up, because a plausible wrong line is far more expensive than an obvious blank one.' })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "It checks the rate against what you last paid" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "A cost that jumped 40% since the last delivery is surfaced before you post, not discovered at month end when the margin looks wrong." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Nothing posts until you approve it" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The extraction is a proposal. You see every line, every match, every quantity and every rate, and the ledger is untouched until you press post." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-8 vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-6", style: { "justifyContent": "space-between", "alignItems": "center" }, children: [
              /* @__PURE__ */ jsx("p", { className: "vq-h3", style: { "color": "#fff", "maxWidth": "52ch" }, children: "The rule the whole system is built on: a source may only return a value it read from the data. Never a sample, never a placeholder, never a realistic-looking default." }),
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--lg vq-btn--onDark", href: "/reckoner", children: [
                "Why we are strict about this ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)", "alignItems": "center" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "What it costs" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "One page in, one credit out. Visible before you spend it." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Models cost money to run. Rather than bury that in the plan price and quietly raise it later, we show you the meter. A fourteen-page PDF will use fourteen pages, and the screen says so and asks once." }),
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg vq-mt-8", href: "/pricing#ai", children: [
              "See the AI pricing ",
              /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-stack vq-gap-4 vq-reveal", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
              /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Included every month" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Solo 10 scans · Starter 500 credits · Core 2,000 · Scale 10,000. Enough for everyday capture and queries without thinking about it." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
              /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Top up when you need to" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "1,000 more credits for $10. A one-off purchase, not a change to your subscription — and we stop at your cap rather than billing past it." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
              /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Or bring your own key" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Connect your own model provider and pay them directly. We do not mark up a key you supply. One unlock, then free for as long as you use VenQore." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
              /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "We never silently truncate" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "And we never silently charge. If a document is too long for your remaining allowance, you are told before it runs, not after." })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-section-head vq-reveal", children: /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "The questions people ask." }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-faq vq-reveal", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "What happens to my photographs?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "They go to the model provider to be read, and then they are yours. We do not train anything on your bills, we do not sell them, and you can delete a capture and its source image together." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "How accurate is it, honestly?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "On clean printed bills from a distributor you buy from regularly, near enough that reviewing is faster than typing. On a crumpled handwritten note it will get most of it and flag the rest. It is designed to be reviewed, which is why every line shows its match." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Does it work in Urdu?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Voice notes, yes — including the English-Urdu mix people actually speak. Handwritten Urdu on a bill is harder and you should expect to correct lines." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "What if my distributor changes their invoice layout?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Nothing breaks. It reads the lines, not the template — there is no per-supplier setup to maintain and nothing to re-map when a format changes." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Can it post straight through without me looking?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No, and that is deliberate. The extraction is a proposal. Anything that writes to your ledger without a human approving it is one bad read away from a month of reconciliation." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Do I need an AI key?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No. Every plan includes a monthly allowance on our infrastructure. Bringing your own key is an option for heavy use, not a requirement." }) }) })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "What it feeds" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/documents", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The documents it creates" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "A photo in, a posted transaction out." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/ledger", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Where the posting lands" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Reviewed by you, posted by the engine." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/tools/smart-capture", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Try it on your own bill" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "No signup, no watermark." }),
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
  SmartCapture as default
};
