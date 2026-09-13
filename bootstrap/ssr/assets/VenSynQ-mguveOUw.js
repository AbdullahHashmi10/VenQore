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
function VenSynQ() {
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
      /* @__PURE__ */ jsx("title", { children: "VenSynQ — sell in five places, count stock once | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/vensynq" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "VenSynQ — sell in five places, count stock once | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/vensynq" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "VenSynQ — sell in five places, count stock once | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks and a channel margin that is the real one." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "VenSynQ" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Sell in five places. Count your stock ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "once" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "VenSynQ is VenQore's multi-channel inventory sync. One product catalogue and one ledger stay in step across your counter, your web store, WooCommerce, Amazon, eBay and TikTok Shop, so selling the last unit in one place removes it everywhere. Sold as an add-on at $10 per connected account per month." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/pricing", children: "Channel pricing" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-10)", "alignItems": "center" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "The failure this prevents" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-3", children: "Overselling is a refund, a bad review and a customer you do not get back." }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-4", children: "The last unit sells at the counter and on your website in the same minute, because the two systems reconcile overnight. VenSynQ has one stock number and every channel reads it — so the second sale is refused, not apologised for." })
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "vq-chart", style: { "height": "110px" }, children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 340 110", preserveAspectRatio: "none", role: "img", "aria-label": "Trend, last 12 periods", children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "vqFade", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--vq-series-1-ink)", stopOpacity: ".22" }),
              /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--vq-series-1-ink)", stopOpacity: "0" })
            ] }) }),
            /* @__PURE__ */ jsx("path", { className: "area", d: "M0.0 107.0 L30.9 95.9 L61.8 101.4 L92.7 81.0 L123.6 86.6 L154.5 66.1 L185.5 71.7 L216.4 45.7 L247.3 51.3 L278.2 25.3 L309.1 30.9 L340.0 3.0 L340 110 L0 110 Z" }),
            /* @__PURE__ */ jsx("path", { className: "line", d: "M0.0 107.0 L30.9 95.9 L61.8 101.4 L92.7 81.0 L123.6 86.6 L154.5 66.1 L185.5 71.7 L216.4 45.7 L247.3 51.3 L278.2 25.3 L309.1 30.9 L340.0 3.0" })
          ] }) }) })
        ] }) }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "What is connected" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Five channels, one catalogue." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" }),
                  /* @__PURE__ */ jsx("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }),
                  /* @__PURE__ */ jsx("path", { d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" }),
                  /* @__PURE__ */ jsx("path", { d: "M2 7h20" }),
                  /* @__PURE__ */ jsx("path", { d: "M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" })
                ] }) }),
                /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--success", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Live"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Your counter" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "The register is a channel like any other. A sale at the till moves the same stock number a website order does." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsx("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
                  /* @__PURE__ */ jsx("path", { d: "M2 12h20" })
                ] }) }),
                /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--success", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Live"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Your web store" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Catalogue controls, per-channel pricing, and a QR menu for anyone who wants to browse before they buy." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M12 22v-5" }),
                  /* @__PURE__ */ jsx("path", { d: "M9 8V2" }),
                  /* @__PURE__ */ jsx("path", { d: "M15 8V2" }),
                  /* @__PURE__ */ jsx("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
                ] }) }),
                /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--success", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Live"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "WooCommerce" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Three-click OAuth, real-time webhooks, two-way stock, and customers registered into your book automatically." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "m7.5 4.27 9 5.15" }),
                  /* @__PURE__ */ jsx("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
                  /* @__PURE__ */ jsx("path", { d: "m3.3 7 8.7 5 8.7-5" }),
                  /* @__PURE__ */ jsx("path", { d: "M12 22V12" })
                ] }) }),
                /* @__PURE__ */ jsxs("span", { className: "vq-badge vq-badge--success", children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  " Live"
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Amazon" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "SP-API approved. Orders in as sales, bulk tracking IDs out, commission isolated from your margin." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("circle", { cx: "8", cy: "21", r: "1" }),
                  /* @__PURE__ */ jsx("circle", { cx: "19", cy: "21", r: "1" }),
                  /* @__PURE__ */ jsx("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
                ] }) }),
                /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--soon", children: "Coming" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "eBay" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Listing and order sync, on the same catalogue and the same stock number." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row", style: { "justifyContent": "space-between" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M12 6V2H8" }),
                  /* @__PURE__ */ jsx("rect", { width: "16", height: "12", x: "4", y: "6", rx: "2" }),
                  /* @__PURE__ */ jsx("path", { d: "M2 12h2" }),
                  /* @__PURE__ */ jsx("path", { d: "M20 12h2" }),
                  /* @__PURE__ */ jsx("path", { d: "M15 11v2" }),
                  /* @__PURE__ */ jsx("path", { d: "M9 11v2" })
                ] }) }),
                /* @__PURE__ */ jsx("span", { className: "vq-badge vq-badge--soon", children: "Coming" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "TikTok Shop" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Same model again — one catalogue, one stock number, isolated commission." })
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
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "800px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The number that actually matters" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Your marketplace margin is not your shop margin." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "A 15% commission, a referral fee, a fulfilment charge and a returned unit are the difference between a channel you should grow and a channel you should close. Most systems book the gross and let you find out at the end of the quarter." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Commission is isolated, per channel" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "It posts to its own account, not into cost of goods. Your item margin stays the item margin, and your channel cost is a line you can look at on its own." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Fees follow the order that caused them" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Referral, fulfilment, storage and return handling attach to the sale they came from — so channel profitability is a real figure, not an allocation." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Just-in-time purchase orders" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "A channel order for something you do not hold raises the purchase order against the supplier who stocks it, with the lead time already known." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "One place to look" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Sales by channel, spend by channel and margin by channel, over any of the eighteen period windows, against the right comparison." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Setup" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Three clicks, then it runs." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-steps-big", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-bigstep vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Connect" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "OAuth into the channel. No API keys to copy, no plugin to install on your store, no developer to hire for an afternoon." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-bigstep vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Map once" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Match your catalogue to the listings you already have. Anything unmatched is shown, never guessed — you decide whether it is a new product or the same one under another name." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-bigstep vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Sell" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Stock, prices and orders move both ways from that moment. A webhook, not a nightly job, so the gap where overselling happens does not exist." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mt-12 vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-6", style: { "justifyContent": "space-between", "alignItems": "center" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Priced per channel" }),
              /* @__PURE__ */ jsx("p", { className: "vq-h3 vq-mt-2", children: "$10 a month per connected store. Nothing for the one you already have." }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "Your counter and your own web store are included in every plan. You pay for a marketplace only while you are selling on it." })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/pricing", children: [
              "See pricing ",
              /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
              ] }) })
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Selling in more than one place" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pricing", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What channel sync costs" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "$10 per connected account, at every tier." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/solutions/multi-store", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Running more than one branch" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "One truth across every location." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/documents", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Orders become documents" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Same editor, same ledger." }),
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
  VenSynQ as default
};
