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
function Onboarding() {
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
      /* @__PURE__ */ jsx("title", { children: "See a build — a description to a live system | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/onboarding" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "See a build — a description to a live system | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/onboarding" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "See a build — a description to a live system | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Describe your business, review the Blueprint it composes, pick a plan, go live. Four minutes — and nothing is real until you approve it." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", className: "vq-onb-main", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-wiz", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-wiz__bar", children: [
            /* @__PURE__ */ jsx("div", { className: "vq-wiz__track", children: /* @__PURE__ */ jsx("div", { className: "vq-wiz__fill", "data-wiz-fill": true }) }),
            /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "height": "64px", "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "var(--vq-space-6)" }, children: /* @__PURE__ */ jsxs("ol", { className: "vq-row vq-gap-6", "data-wiz-steps": true, style: { "overflowX": "auto", "scrollbarWidth": "none" }, children: [
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "0", style: { "whiteSpace": "nowrap" }, children: "Business" }),
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "1", style: { "whiteSpace": "nowrap" }, children: "Describe" }),
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "2", style: { "whiteSpace": "nowrap" }, children: "Details" }),
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "3", style: { "whiteSpace": "nowrap" }, children: "Blueprint" }),
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "4", style: { "whiteSpace": "nowrap" }, children: "Plan" }),
              /* @__PURE__ */ jsx("li", { className: "vq-eyebrow", "data-step-label": "5", style: { "whiteSpace": "nowrap" }, children: "Account" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-wiz__stage", children: [
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel is-on", "data-panel": "0", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 1 of 6" }),
              /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-4", children: "What kind of business?" }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "Pick the closest — you can change everything later." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-pick vq-mt-8", children: [
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "0", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" }),
                    /* @__PURE__ */ jsx("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }),
                    /* @__PURE__ */ jsx("path", { d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" }),
                    /* @__PURE__ */ jsx("path", { d: "M2 7h20" }),
                    /* @__PURE__ */ jsx("path", { d: "M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Retail shop" }),
                  /* @__PURE__ */ jsx("span", { children: "General retail, one counter" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "1", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
                    /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
                    /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Grocery / karyana" }),
                  /* @__PURE__ */ jsx("span", { children: "High SKU count, fast checkout" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "2", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" }),
                    /* @__PURE__ */ jsx("path", { d: "m8.5 8.5 7 7" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Pharmacy" }),
                  /* @__PURE__ */ jsx("span", { children: "Batch, expiry, distributors" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "3", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M10 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M14 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" }),
                    /* @__PURE__ */ jsx("path", { d: "M6 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M17 9h1a3 3 0 0 1 0 6h-1" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Café" }),
                  /* @__PURE__ */ jsx("span", { children: "Counter service, own recipes" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "4", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M10 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M14 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" }),
                    /* @__PURE__ */ jsx("path", { d: "M6 2v2" }),
                    /* @__PURE__ */ jsx("path", { d: "M17 9h1a3 3 0 0 1 0 6h-1" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Restaurant" }),
                  /* @__PURE__ */ jsx("span", { children: "Tables, kitchen, ingredients" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "5", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M12 16h.01" }),
                    /* @__PURE__ */ jsx("path", { d: "M16 16h.01" }),
                    /* @__PURE__ */ jsx("path", { d: "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 9.5v-2a.5.5 0 0 0-.769-.422L9.77 9.922A.5.5 0 0 1 9 9.5V3.5a.5.5 0 0 0-.5-.5h-3a2 2 0 0 0-2 2Z" }),
                    /* @__PURE__ */ jsx("path", { d: "M8 16h.01" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Bakery" }),
                  /* @__PURE__ */ jsx("span", { children: "Production runs and wastage" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "6", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M12 22v-5" }),
                    /* @__PURE__ */ jsx("path", { d: "M9 8V2" }),
                    /* @__PURE__ */ jsx("path", { d: "M15 8V2" }),
                    /* @__PURE__ */ jsx("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Mobile & electronics" }),
                  /* @__PURE__ */ jsx("span", { children: "IMEI, serials, warranties" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "7", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" }),
                    /* @__PURE__ */ jsx("path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }),
                    /* @__PURE__ */ jsx("path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Clothing" }),
                  /* @__PURE__ */ jsx("span", { children: "Size and colour variants" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "8", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }) }),
                  /* @__PURE__ */ jsx("b", { children: "Hardware & tools" }),
                  /* @__PURE__ */ jsx("span", { children: "Deep catalogue, units" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "9", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
                    /* @__PURE__ */ jsx("path", { d: "M15 18H9" }),
                    /* @__PURE__ */ jsx("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
                    /* @__PURE__ */ jsx("circle", { cx: "17", cy: "18", r: "2" }),
                    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "18", r: "2" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Wholesale" }),
                  /* @__PURE__ */ jsx("span", { children: "Price tiers, credit terms" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "10", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("line", { x1: "6", x2: "6", y1: "3", y2: "15" }),
                    /* @__PURE__ */ jsx("circle", { cx: "18", cy: "6", r: "3" }),
                    /* @__PURE__ */ jsx("circle", { cx: "6", cy: "18", r: "3" }),
                    /* @__PURE__ */ jsx("path", { d: "M18 9a9 9 0 0 1-9 9" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "Multi-branch retail" }),
                  /* @__PURE__ */ jsx("span", { children: "More than one location" })
                ] }),
                /* @__PURE__ */ jsxs("button", { className: "vq-pick__card", type: "button", "data-type": "11", "aria-pressed": "false", children: [
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
                    /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
                  ] }),
                  /* @__PURE__ */ jsx("b", { children: "I'm not sure yet" }),
                  /* @__PURE__ */ jsx("span", { children: "Describe it and we'll work it out" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "1", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 2 of 6" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Now tell us how it actually works." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "Sentences, not a form. What you sell, how you buy, who works there, what your accountant asks for. The more you say, the less you have to fix afterwards." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mt-8", children: [
                /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "wiz-desc", children: "Your business, in your words" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    className: "vq-textarea vq-mt-2",
                    id: "wiz-desc",
                    "data-wiz-desc": true,
                    rows: "6",
                    placeholder: "I run two pharmacy branches. I buy on 30-day credit from four distributors, I need batch and expiry tracking, and my accountant wants a trial balance every month."
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-2 vq-mt-4", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-caption", children: "Or borrow one:" }),
                  /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-example": "pharmacy", children: "Pharmacy" }),
                  /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-example": "wholesale", children: "Wholesale" }),
                  /* @__PURE__ */ jsx("button", { type: "button", className: "vq-chip", "data-example": "cafe", children: "Café" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-6", children: [
                /* @__PURE__ */ jsx("button", { className: "vq-btn vq-btn--secondary vq-btn--lg", "data-back": true, children: "Back" }),
                /* @__PURE__ */ jsxs("button", { className: "vq-btn vq-btn--primary vq-btn--lg", "data-next": true, children: [
                  "Continue ",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "2", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 3 of 6" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Four things that change the build." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "Only questions whose answer changes your configuration. Nothing here is a marketing field." }),
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-8", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-5)" }, children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "w-biz", children: "Business name" }),
                  /* @__PURE__ */ jsx("input", { className: "vq-input", id: "w-biz", "data-wiz-name": true, placeholder: "Al-Madina Pharmacy" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "Appears on every receipt, invoice and statement." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", id: "w-cur-label", htmlFor: "w-cur-trigger", children: "Currency" }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-custom-select", "data-custom-select": true, children: [
                    /* @__PURE__ */ jsx("input", { type: "hidden", id: "w-cur", value: "PKR — Pakistani Rupee (Rs)" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-custom-select__trigger", id: "w-cur-trigger", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-labelledby": "w-cur-label w-cur-trigger", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-custom-select__value", children: "PKR — Pakistani Rupee (Rs)" }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__chevron", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("ul", { className: "vq-custom-select__menu", role: "listbox", "aria-labelledby": "w-cur-label", tabIndex: "-1", children: [
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item is-selected", role: "option", "aria-selected": "true", "data-value": "PKR — Pakistani Rupee (Rs)", children: [
                        /* @__PURE__ */ jsx("span", { children: "PKR — Pakistani Rupee (Rs)" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "AED — UAE Dirham (د.إ)", children: [
                        /* @__PURE__ */ jsx("span", { children: "AED — UAE Dirham (د.إ)" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "SAR — Saudi Riyal (﷼)", children: [
                        /* @__PURE__ */ jsx("span", { children: "SAR — Saudi Riyal (﷼)" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "USD — US Dollar ($)", children: [
                        /* @__PURE__ */ jsx("span", { children: "USD — US Dollar ($)" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "GBP — Pound Sterling (£)", children: [
                        /* @__PURE__ */ jsx("span", { children: "GBP — Pound Sterling (£)" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "Becomes the system default. Critical — it sets the ledger." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", id: "w-loc-label", htmlFor: "w-loc-trigger", children: "How many locations?" }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-custom-select", "data-custom-select": true, children: [
                    /* @__PURE__ */ jsx("input", { type: "hidden", id: "w-loc", "data-wiz-loc": true, value: "1" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-custom-select__trigger", id: "w-loc-trigger", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-labelledby": "w-loc-label w-loc-trigger", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-custom-select__value", children: "Just one" }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__chevron", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("ul", { className: "vq-custom-select__menu", role: "listbox", "aria-labelledby": "w-loc-label", tabIndex: "-1", children: [
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item is-selected", role: "option", "aria-selected": "true", "data-value": "1", children: [
                        /* @__PURE__ */ jsx("span", { children: "Just one" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "2", children: [
                        /* @__PURE__ */ jsx("span", { children: "2 to 3" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "5", children: [
                        /* @__PURE__ */ jsx("span", { children: "4 to 10" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "12", children: [
                        /* @__PURE__ */ jsx("span", { children: "More than 10" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", id: "w-team-label", htmlFor: "w-team-trigger", children: "How many people work there?" }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-custom-select", "data-custom-select": true, children: [
                    /* @__PURE__ */ jsx("input", { type: "hidden", id: "w-team", "data-wiz-team": true, value: "2" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-custom-select__trigger", id: "w-team-trigger", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-labelledby": "w-team-label w-team-trigger", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-custom-select__value", children: "Just me, or two of us" }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__chevron", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("ul", { className: "vq-custom-select__menu", role: "listbox", "aria-labelledby": "w-team-label", tabIndex: "-1", children: [
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item is-selected", role: "option", "aria-selected": "true", "data-value": "2", children: [
                        /* @__PURE__ */ jsx("span", { children: "Just me, or two of us" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "3", children: [
                        /* @__PURE__ */ jsx("span", { children: "3 to 5" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "10", children: [
                        /* @__PURE__ */ jsx("span", { children: "6 to 15" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "40", children: [
                        /* @__PURE__ */ jsx("span", { children: "More than 15" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "Sets your roles, approval chain and seat count." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-6", children: [
                /* @__PURE__ */ jsx("button", { className: "vq-btn vq-btn--secondary vq-btn--lg", "data-back": true, children: "Back" }),
                /* @__PURE__ */ jsxs("button", { className: "vq-btn vq-btn--primary vq-btn--lg", "data-next": true, children: [
                  "Build my system ",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "3", children: [
              /* @__PURE__ */ jsxs("div", { "data-wiz-building": true, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Working" }),
                /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Reading your business…" }),
                /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "This takes a few seconds. Nothing is created yet — you'll see the whole plan before anything is real." }),
                /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-8", children: /* @__PURE__ */ jsx("div", { className: "vq-steps", "data-wiz-steps-list": true }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { "data-wiz-plan": true, hidden: true, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 4 of 6" }),
                /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Your Blueprint" }),
                /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", "data-wiz-summary": true }),
                /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-8", "data-wiz-blueprint": true }),
                /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-6", children: [
                  /* @__PURE__ */ jsx("button", { className: "vq-btn vq-btn--secondary vq-btn--lg", "data-back": true, children: "Back" }),
                  /* @__PURE__ */ jsxs("button", { className: "vq-btn vq-btn--primary vq-btn--lg", "data-next": true, children: [
                    "Looks right ",
                    /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                      /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                      /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                    ] }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-4", style: { "maxWidth": "none" }, children: "Every line is editable, now and later. Nothing posts to your books until you approve it." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "4", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 5 of 6" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Pick a plan, or don't." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "The trial is 14 days on the full product either way. We've marked the one that fits what you just told us." }),
              /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--3 vq-mt-8", "data-wiz-plans": true }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-6", children: [
                /* @__PURE__ */ jsx("button", { className: "vq-btn vq-btn--secondary vq-btn--lg", "data-back": true, children: "Back" }),
                /* @__PURE__ */ jsxs("button", { className: "vq-btn vq-btn--primary vq-btn--lg", "data-next": true, children: [
                  "Continue ",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-4", style: { "maxWidth": "none" }, children: "Cancel anytime. We'll remind you before day 14." })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "5", style: { "maxWidth": "460px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Step 6 of 6" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-h1 vq-mt-4", children: "Last thing." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-3", children: "This is the account that owns your ledger." }),
              /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-8", children: /* @__PURE__ */ jsxs("form", { className: "vq-stack vq-gap-5", "data-demo": true, children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "w-email", children: "Work email" }),
                  /* @__PURE__ */ jsx("input", { className: "vq-input", id: "w-email", type: "email", required: true, autoComplete: "email", placeholder: "you@company.com" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "We'll email your sign-in code here." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "w-pass", children: "Password" }),
                  /* @__PURE__ */ jsx("input", { className: "vq-input", id: "w-pass", type: "password", required: true, autoComplete: "new-password", minLength: "10" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "At least 10 characters." })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "vq-check", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", required: true }),
                  /* @__PURE__ */ jsxs("span", { className: "vq-caption", style: { "maxWidth": "none" }, children: [
                    "I agree to the ",
                    /* @__PURE__ */ jsx("a", { href: "/terms", children: "Terms" }),
                    " and ",
                    /* @__PURE__ */ jsx("a", { href: "/privacy", children: "Privacy Policy" }),
                    "."
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-btn vq-btn--primary vq-btn--xl vq-btn--block", "data-next": true, children: [
                  "Create my system ",
                  /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] }) })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("button", { className: "vq-btn vq-btn--ghost vq-btn--lg vq-mt-4", "data-back": true, children: "Back" })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "vq-wiz__panel", "data-panel": "6", style: { "maxWidth": "1400px" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-center", style: { "maxWidth": "640px", "marginInline": "auto" }, children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Live"
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "Your system is live." }),
                /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-4", style: { "marginInline": "auto" }, children: "Ledger wired, chart of accounts seeded, your words applied. Nothing in it is a template — it is the composition you just approved." }),
                /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-mt-8", style: { "justifyContent": "center" }, children: [
                  /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "#", children: [
                    "Add your first product ",
                    /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                      /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                      /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/", children: "Back to the site" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-mt-12", children: /* @__PURE__ */ jsxs("div", { className: "vq-app", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-app__bar", children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-app__dots", children: [
                    /* @__PURE__ */ jsx("i", {}),
                    /* @__PURE__ */ jsx("i", {}),
                    /* @__PURE__ */ jsx("i", {})
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-app__omni", children: [
                    /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                      /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
                      /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
                    ] }),
                    " Ask your business a question…"
                  ] }),
                  /* @__PURE__ */ jsx("div", { style: { "marginLeft": "auto", "display": "flex", "alignItems": "center", "gap": "10px" }, children: /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--accent", children: "Pharmacy · 2 branches" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-app__body", children: [
                  /* @__PURE__ */ jsxs("nav", { className: "vq-app__rail", "aria-label": "Product navigation (illustration)", children: [
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", "aria-current": "true", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
                        /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
                        /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
                        /* @__PURE__ */ jsx("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
                      ] }),
                      " Dashboard"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
                        /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
                        /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
                      ] }),
                      " Sell"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "m7.5 4.27 9 5.15" }),
                        /* @__PURE__ */ jsx("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
                        /* @__PURE__ */ jsx("path", { d: "m3.3 7 8.7 5 8.7-5" }),
                        /* @__PURE__ */ jsx("path", { d: "M12 22V12" })
                      ] }),
                      " Stock"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
                        /* @__PURE__ */ jsx("path", { d: "M15 18H9" }),
                        /* @__PURE__ */ jsx("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
                        /* @__PURE__ */ jsx("circle", { cx: "17", cy: "18", r: "2" }),
                        /* @__PURE__ */ jsx("circle", { cx: "7", cy: "18", r: "2" })
                      ] }),
                      " Buy"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }),
                        /* @__PURE__ */ jsx("path", { d: "M9 7h6" }),
                        /* @__PURE__ */ jsx("path", { d: "M9 11h4" })
                      ] }),
                      " Money"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                        /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
                        /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
                        /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
                      ] }),
                      " People"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }),
                        /* @__PURE__ */ jsx("path", { d: "M18 17V9" }),
                        /* @__PURE__ */ jsx("path", { d: "M13 17V5" }),
                        /* @__PURE__ */ jsx("path", { d: "M8 17v-3" })
                      ] }),
                      " Reports"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "vq-app__nav", style: { "marginTop": "auto" }, children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2" }),
                        /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" })
                      ] }),
                      " Settings"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-app__main", children: [
                    /* @__PURE__ */ jsxs("div", { className: "vq-app__title", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "fontSize": "19px" }, children: "Today" }),
                        /* @__PURE__ */ jsx("span", { className: "vq-caption", children: "Wednesday, 4 September" })
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--ok", children: [
                        /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                        " Ledger balanced"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "vq-cards", children: [
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard vq-dcard--accent c5 r2", children: [
                        /* @__PURE__ */ jsxs("div", { className: "vq-stat", children: [
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Sales today" }),
                          /* @__PURE__ */ jsxs("span", { className: "vq-stat__value", children: [
                            "184.2",
                            /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "k PKR" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-2", children: [
                          /* @__PURE__ */ jsx("span", { className: "vq-delta", children: "▲ 8.2%" }),
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "vs last Wednesday" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c4 r2", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Gross margin" }) }),
                        /* @__PURE__ */ jsx("div", { className: "vq-stat", children: /* @__PURE__ */ jsxs("span", { className: "vq-stat__value vq-stat__value--sm", children: [
                          "31.4",
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "%" })
                        ] }) }),
                        /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-2", children: [
                          /* @__PURE__ */ jsx("span", { className: "vq-delta vq-delta--down", children: "▼ 1.1pt" }),
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "vs last month" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c3 r2", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Expiring ≤30 days" }) }),
                        /* @__PURE__ */ jsx("div", { className: "vq-stat", children: /* @__PURE__ */ jsxs("span", { className: "vq-stat__value vq-stat__value--sm", children: [
                          "27",
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "batches" })
                        ] }) }),
                        /* @__PURE__ */ jsxs("span", { className: "vq-status vq-status--warn", children: [
                          /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                            /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
                            /* @__PURE__ */ jsx("polyline", { points: "12 6 12 12 16 14" })
                          ] }),
                          " Review"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c7 r3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "vq-dcard__head", children: [
                          /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Sales, last 14 days" }),
                          /* @__PURE__ */ jsx("span", { className: "vq-badge", children: "Branch: all" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { style: { "marginTop": "auto" }, children: /* @__PURE__ */ jsx("div", { className: "vq-chart", style: { "height": "108px" }, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 320 108", preserveAspectRatio: "none", role: "img", "aria-label": "Trend, last 14 periods", children: [
                          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vqFade", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--vq-series-1-ink)", stopOpacity: ".22" }),
                            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--vq-series-1-ink)", stopOpacity: "0" })
                          ] }) }),
                          /* @__PURE__ */ jsx("path", { className: "area", d: "M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0 L320 108 L0 108 Z" }),
                          /* @__PURE__ */ jsx("path", { className: "line", d: "M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0" })
                        ] }) }) })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c5 r3", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Top lines by margin" }) }),
                        /* @__PURE__ */ jsx("div", { className: "vq-mt-4", children: /* @__PURE__ */ jsxs("div", { className: "vq-rank", children: [
                          /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Panadol 500mg" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "41.2%" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "92%" } }) })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Augmentin 625" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "33.8%" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "76%" } }) })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Surgical masks" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "28.1%" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "63%" } }) })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "vq-rank__row", children: [
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__name", children: "Glucose strips" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__val", children: "19.4%" }),
                            /* @__PURE__ */ jsx("span", { className: "vq-rank__track", children: /* @__PURE__ */ jsx("span", { className: "vq-rank__fill", style: { "--w": "44%" } }) })
                          ] })
                        ] }) })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c4 r2", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Cash vs card" }) }),
                        /* @__PURE__ */ jsx("div", { style: { "marginTop": "auto" }, children: /* @__PURE__ */ jsx("div", { className: "vq-chart", style: { "height": "78px" }, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 260 78", preserveAspectRatio: "none", role: "img", "aria-label": "Comparison by period", children: [
                          /* @__PURE__ */ jsx("line", { className: "grid", x1: "0", x2: "260", y1: "21.12", y2: "21.12" }),
                          /* @__PURE__ */ jsx("line", { className: "grid", x1: "0", x2: "260", y1: "42.24", y2: "42.24" }),
                          /* @__PURE__ */ jsx("line", { className: "grid", x1: "0", x2: "260", y1: "64", y2: "64" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "0.0", y: "27.1", width: "32.0", height: "36.9" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "38.0", y: "19.2", width: "32.0", height: "44.8" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "76.0", y: "30.6", width: "32.0", height: "33.4" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "114.0", y: "11.3", width: "32.0", height: "52.7" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "152.0", y: "22.7", width: "32.0", height: "41.3" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar is-on", x: "190.0", y: "6.0", width: "32.0", height: "58.0" }),
                          /* @__PURE__ */ jsx("rect", { className: "bar", x: "228.0", y: "13.0", width: "32.0", height: "51.0" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "16.0", y: "76", textAnchor: "middle", children: "M" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "54.0", y: "76", textAnchor: "middle", children: "T" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "92.0", y: "76", textAnchor: "middle", children: "W" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "130.0", y: "76", textAnchor: "middle", children: "T" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "168.0", y: "76", textAnchor: "middle", children: "F" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "206.0", y: "76", textAnchor: "middle", children: "S" }),
                          /* @__PURE__ */ jsx("text", { className: "lbl", x: "244.0", y: "76", textAnchor: "middle", children: "S" })
                        ] }) }) })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c4 r2", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "Owed to you" }) }),
                        /* @__PURE__ */ jsxs("div", { className: "vq-stat", children: [
                          /* @__PURE__ */ jsxs("span", { className: "vq-stat__value vq-stat__value--sm", children: [
                            "612",
                            /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "k" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Rs 84k over 60 days" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "vq-dcard c4 r2", children: [
                        /* @__PURE__ */ jsx("div", { className: "vq-dcard__head", children: /* @__PURE__ */ jsx("span", { className: "vq-dcard__title", children: "You owe" }) }),
                        /* @__PURE__ */ jsxs("div", { className: "vq-stat", children: [
                          /* @__PURE__ */ jsxs("span", { className: "vq-stat__value vq-stat__value--sm", children: [
                            "(438)",
                            /* @__PURE__ */ jsx("span", { className: "vq-stat__unit", children: "k" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "4 distributors · next due Fri" })
                        ] })
                      ] })
                    ] })
                  ] })
                ] })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "After the build" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pricing", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Pick a plan when you are ready" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "14 days at Core level, or start free on Solo." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/dashboard-preview", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The dashboard you will land on" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "58 readings, self-assembling." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/solutions", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Or start from your industry" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Six ready configurations." }),
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
  Onboarding as default
};
