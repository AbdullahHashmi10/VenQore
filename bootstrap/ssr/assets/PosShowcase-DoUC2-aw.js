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
function PosShowcase() {
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
      /* @__PURE__ */ jsx("title", { children: "The register — a POS that composes itself | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/pos" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "The register — a POS that composes itself | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/pos" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "The register — a POS that composes itself | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. A register you compose yourself." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grid" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The register" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "A till is composed by the person ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "standing" }),
              " at it."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Most point-of-sale software ships a fixed layout and hopes it suits you. VenQore ships seven starting points and eight controls, and the layout engine's only job is to stop your arrangement from breaking." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/features#selling", children: "Everything in Selling" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--wide", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-demo vq-reveal", "data-pos": true, children: [
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
                " www.venqore.com/pos"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "vq-demo__live", children: "Live · try it" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-demo__controls", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", style: { "flex": "none" }, children: "Starting point" }),
              /* @__PURE__ */ jsx("div", { className: "vq-demo__scroller", "data-pos-tabs": true, role: "tablist" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-demo__body vq-demo__body--flush", "data-pos-stage": true }),
            /* @__PURE__ */ jsx("div", { style: { "padding": "var(--vq-space-5)", "borderTop": "1px solid var(--vq-line)", "background": "var(--vq-surface-2)" }, "data-pos-why": true })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-center vq-mt-4", style: { "maxWidth": "none" }, children: "Seven presets, and the composition behind each one — from the product's own layout law. Tap a name to recompose the register." })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The point" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Nobody else in this category ships resizable panes." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "We checked. Toast lets you set rows and columns. Lightspeed sizes tiles. Loyverse toggles grid or list. Shopify and Square let you edit what is on a tile. The one product with free pane geometry authors it in an admin tool as XML — not at the register, and not by the person using it." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" }),
                /* @__PURE__ */ jsx("path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }),
                /* @__PURE__ */ jsx("path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A preset is a starting point, not a cage" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Pick the one closest to how you work, then drag a divider. The catalogue can take 20% or 40% of the screen, sit on top, sit on the left, or not exist at all." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }),
                /* @__PURE__ */ jsx("path", { d: "m9 12 2 2 4-4" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "The engine measures, it does not guess" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Every pane declares the width its text actually needs. Drag past that floor and the catalogue becomes a full-screen button rather than a broken column. Nothing is ever deleted to save space." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Proven, not eyeballed" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "35,000+ automated tests with zero disagreements. Every arrangement swept every 8 pixels from a 320px phone to a 3440px ultrawide. Zero controls covered, zero content stranded off screen." })
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
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The rule that keeps it usable" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "Seven controls on the surface. No more." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Seven is the working-memory span. Past it a cashier scans the screen instead of acting on it. So the register carries at most seven rank-one controls on a desktop and five on a phone; everything else is one gesture away, and monthly settings are not on the till at all." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3 vq-mt-10", style: { "gap": "var(--vq-space-6)" }, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)", "fontWeight": "600", "color": "#fff", "letterSpacing": "-.03em", "lineHeight": "1" }, children: "60" }),
                  /* @__PURE__ */ jsx("div", { className: "vq-caption vq-mt-1", style: { "color": "rgb(237 242 239 / .55)" }, children: "capabilities" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)", "fontWeight": "600", "color": "#fff", "letterSpacing": "-.03em", "lineHeight": "1" }, children: "15" }),
                  /* @__PURE__ */ jsx("div", { className: "vq-caption vq-mt-1", style: { "color": "rgb(237 242 239 / .55)" }, children: "on the surface" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)", "fontWeight": "600", "color": "#fff", "letterSpacing": "-.03em", "lineHeight": "1" }, children: "0" }),
                  /* @__PURE__ */ jsx("div", { className: "vq-caption vq-mt-1", style: { "color": "rgb(237 242 239 / .55)" }, children: "settings docked" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-stack vq-gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Same controls, three shapes" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "The payment panel is built once and used in three places — a resident column, a full-screen sheet, a 56px docked bar. Nothing a cashier learned in one arrangement is missing from another." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "The keypad lives in the sheet" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Never in the resident column. A keypad in a narrow column only pushes the things that matter into a scroll." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "The dock is a layout row" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Not a floating button. Its height is subtracted before anything else is measured, so Complete can never end up below the fold." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card", children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "A table is a held sale" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "On the Table preset, hold becomes automatic and back means back to the floor — because the unit of work is the table, not the sale." })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "At the counter" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Seventeen things that matter at 5pm on a Saturday." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Instant barcode scanner" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Wedge or camera. Unknown codes offer to create the item rather than beeping at you." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Serial & IMEI scanner" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "The serial follows the unit through sale, return and warranty." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Park & recall" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Hold a bill, serve the next customer, bring it back. Also how table service works." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Cart rescue" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Power cut, browser crash, accidental refresh — the cart is still there." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Typo-tolerant search" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: 'Finds "panadol" from "pandol", and the SKU from half of it.' })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Multi-account split payment" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Part cash, part card, part on account, in one sale." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Automatic cash rounding" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "To your smallest coin, posted to a rounding account so the ledger still ties." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Daily cash register audit" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Counted versus expected, per register, per shift, with the variance explained." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Negative stock alert & lock" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Choose whether selling what you do not have is a warning or a wall." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "In-flight product creation" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Create the item mid-sale without leaving the cart." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Auto-applying customer discounts" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "The tier follows the customer; nobody has to remember it." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Change calculator" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Tendered in, change out, printed on the receipt." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Keyboard-first checkout" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "24 shortcuts. A trained cashier never touches the screen." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Silent thermal printing" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "WebUSB, no print dialog, custom roll widths and cut-line padding." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Tax verification QR" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "On the receipt, where the regulator expects it." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Offline mode" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "The till keeps selling when the internet does not. It reconciles when it returns." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("b", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)" }, children: "Cashier PIN login" }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-1", style: { "maxWidth": "none" }, children: "Fast switching between staff, with an inactivity auto-logout behind it." })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow vq-center vq-reveal", children: [
          /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Every sale posts to the ledger. All of it." }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-5", style: { "marginInline": "auto" }, children: "Cash in, revenue, tax payable, cost of goods, inventory out — five postings from one barcode scan, with the cost taken from the batch that actually left the shelf." }),
          /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--secondary vq-btn--lg vq-mt-8", href: "/ledger", children: [
            "See the Core Ledger ",
            /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
              /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Around the counter" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/documents", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Thirteen document types, one editor" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Invoice to stock audit." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/solutions/grocery", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "A high-speed grocery till" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Weight, shrink and daily margins." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/compare/venqore-vs-square", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "How this compares to Square" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Fee maths and what is built in." }),
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
  PosShowcase as default
};
