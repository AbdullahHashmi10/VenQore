import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
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
function Pricing() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { auth = {}, flash = {}, ...props } = usePage().props;
  const [billingPeriod, setBillingPeriod] = useState("year");
  const isAnnual = billingPeriod === "year";
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
      /* @__PURE__ */ jsx("title", { children: "Pricing — from $41/month or free forever, no implementation fee | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/pricing" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Pricing — from $41/month or free forever, no implementation fee | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/pricing" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Pricing — from $41/month or free forever, no implementation fee | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month (billed annually) — or free. Every plan carries universal business modules and the complete double-entry ledger. Reports start at $49." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(40px,5vw,60px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "860px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Pricing" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Priced like software. Not like a ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "project" }),
              "."
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "vq-lede vq-mt-6", children: [
              /* @__PURE__ */ jsx("strong", { children: "Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $41 a month — or free." }),
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "vq-small vq-text-2", style: { "display": "inline-block", "marginTop": "8px" }, children: "* Published industry benchmarks put traditional ERP implementations in the tens of thousands of dollars per year. VenQore serves small and independent businesses; the comparison is to overall total cost of ownership." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-text-2 vq-mt-4", children: "Every paid plan carries universal business modules, the full double-entry ledger and tiered financial reports. Plans differ by operational scale: seats, locations, catalogue capacity, and advanced scale fences." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "clamp(24px,3vw,44px)", "paddingBottom": "clamp(64px,8vw,100px)" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-center vq-reveal", style: { "marginBottom": "clamp(40px,5vw,64px)", "paddingTop": "12px" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-seg", role: "tablist", "aria-label": "Billing period", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vq-seg__btn",
                role: "tab",
                "aria-selected": !isAnnual,
                onClick: () => setBillingPeriod("month"),
                children: "Monthly"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "vq-seg__btn",
                role: "tab",
                "aria-selected": isAnnual,
                onClick: () => setBillingPeriod("year"),
                children: "Annual — 2 months free"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-plan vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-plan__flag", style: { "background": "var(--vq-surface-2)", "color": "var(--vq-text-2)", "borderColor": "var(--vq-line)" }, children: "Free forever" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-plan__name", children: "Solo" }),
              /* @__PURE__ */ jsx("p", { className: "vq-plan__for", children: "One person, one register. Free forever with structural limits." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-plan__price", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-plan__amt", children: "$0" }),
                /* @__PURE__ */ jsx("span", { className: "vq-plan__per", children: "/forever" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-plan__billing-note", style: { fontSize: "12.5px", color: "var(--vq-text-3)", minHeight: "20px", marginTop: "2px", marginBottom: "8px" }, children: /* @__PURE__ */ jsx("span", { children: "Free forever · No credit card required" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-plan__list", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "500 products" }),
                    " (SKUs)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "1 location" }),
                    ", ",
                    /* @__PURE__ */ jsx("b", { children: "1 full seat" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "1 register" }),
                    " (2 cashier PIN logins)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "100 sales & 20 service jobs/month" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Core Ledger + ",
                    /* @__PURE__ */ jsx("b", { children: "9 live dashboard cards" }),
                    " (no report screens)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "30-day history visible" }),
                    " (older data safely kept)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "SmartCapture: 10 scans / 100 AI credits" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Help centre + Vena support" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("a", { href: "/build-workspace?plan=solo", className: "vq-btn vq-btn--secondary vq-btn--lg vq-btn--block", children: "Choose Solo" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-plan vq-reveal", children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-plan__name", children: "Starter" }),
              /* @__PURE__ */ jsx("p", { className: "vq-plan__for", children: "A shop with a couple of people on the till and full history." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-plan__price", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-plan__amt", children: isAnnual ? "$41" : "$49" }),
                /* @__PURE__ */ jsx("span", { className: "vq-plan__per", children: "/month" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-plan__billing-note", style: { fontSize: "12.5px", color: "var(--vq-text-3)", minHeight: "20px", marginTop: "2px", marginBottom: "8px" }, children: isAnnual ? /* @__PURE__ */ jsxs("span", { children: [
                "Billed annually ",
                /* @__PURE__ */ jsx("b", { style: { color: "var(--vq-text-2)", fontWeight: 600 }, children: "($490/yr)" }),
                " · ",
                /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-accent-text)", fontWeight: 600 }, children: "2 months free" })
              ] }) : /* @__PURE__ */ jsx("span", { children: "Billed monthly ($588/yr)" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-plan__list", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "5,000 products" }),
                    " (SKUs)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "1 location" }),
                    ", ",
                    /* @__PURE__ */ jsx("b", { children: "1 full seat" }),
                    " (+ $15/mo per extra seat)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "2 registers" }),
                    " (cashier PIN logins unlimited)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "20 Essential reports" }),
                    " (P&L, Sales, Cash & Tax)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "Full history retention" }),
                    " (unlimited days)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Google Drive backup included" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "500 AI credits/month + 1 rebuild / 90 days" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Email support (2 business days)" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("a", { href: isAnnual ? "/build-workspace?plan=starter&billing=annual" : "/build-workspace?plan=starter", className: "vq-btn vq-btn--secondary vq-btn--lg vq-btn--block", children: "Choose Starter" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-plan vq-plan--featured vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-plan__flag", children: "Most popular" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-plan__name", children: "Core" }),
              /* @__PURE__ */ jsx("p", { className: "vq-plan__for", children: "Multi-branch stock, API access, audit logs, custom roles and signals." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-plan__price", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-plan__amt", children: isAnnual ? "$83" : "$99" }),
                /* @__PURE__ */ jsx("span", { className: "vq-plan__per", children: "/month" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-plan__billing-note", style: { fontSize: "12.5px", color: "var(--vq-text-3)", minHeight: "20px", marginTop: "2px", marginBottom: "8px" }, children: isAnnual ? /* @__PURE__ */ jsxs("span", { children: [
                "Billed annually ",
                /* @__PURE__ */ jsx("b", { style: { color: "var(--vq-text-2)", fontWeight: 600 }, children: "($990/yr)" }),
                " · ",
                /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-accent-text)", fontWeight: 600 }, children: "2 months free" })
              ] }) : /* @__PURE__ */ jsx("span", { children: "Billed monthly ($1,188/yr)" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-plan__list", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "25,000 products" }),
                    " (SKUs)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "1 location" }),
                    ", ",
                    /* @__PURE__ */ jsx("b", { children: "5 full seats" }),
                    " (+ $15/mo per extra seat)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "6 registers" }),
                    " (cashier PIN logins unlimited)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "32 Core reports & analytics" }),
                    " (Profitability & Aging)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Multi-branch transfers (activates with 2nd location)" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx("b", { children: "Full API access & webhooks" }) })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Audit trail & custom granular roles" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "2,000 AI credits/month + 1 rebuild / 90 days" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("a", { href: isAnnual ? "/build-workspace?plan=core&billing=annual" : "/build-workspace?plan=core", className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block", children: "Start 14-day trial" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-plan vq-reveal", children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-plan__name", children: "Scale" }),
              /* @__PURE__ */ jsx("p", { className: "vq-plan__for", children: "Large operations, custom roles, white-label and channel sync." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-plan__price", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-plan__amt", children: isAnnual ? "$249" : "$299" }),
                /* @__PURE__ */ jsx("span", { className: "vq-plan__per", children: "/month" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-plan__billing-note", style: { fontSize: "12.5px", color: "var(--vq-text-3)", minHeight: "20px", marginTop: "2px", marginBottom: "8px" }, children: isAnnual ? /* @__PURE__ */ jsxs("span", { children: [
                "Billed annually ",
                /* @__PURE__ */ jsx("b", { style: { color: "var(--vq-text-2)", fontWeight: 600 }, children: "($2,990/yr)" }),
                " · ",
                /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-accent-text)", fontWeight: 600 }, children: "2 months free" })
              ] }) : /* @__PURE__ */ jsx("span", { children: "Billed monthly ($3,588/yr)" }) }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-plan__list", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "250,000 products" }),
                    " (SKUs)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "1 location" }),
                    ", ",
                    /* @__PURE__ */ jsx("b", { children: "25 full seats" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "Up to ",
                    /* @__PURE__ */ jsx("b", { children: "20 registers" }),
                    " (cashier PIN logins unlimited)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "All 40 reports" }),
                    " & Consolidated multi-entity"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Multi-branch & inter-branch transfers" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "White-label & custom domain" })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    /* @__PURE__ */ jsx("b", { children: "2 channel syncs included" }),
                    " (WooCommerce/Amazon)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
                  /* @__PURE__ */ jsx("span", { children: "Named contact (4 business hours SLA)" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("a", { href: isAnnual ? "/build-workspace?plan=scale&billing=annual" : "/build-workspace?plan=scale", className: "vq-btn vq-btn--secondary vq-btn--lg vq-btn--block", children: "Choose Scale" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "vq-center vq-small vq-text-2 vq-mt-8 vq-reveal", style: { "maxWidth": "none" }, children: [
            "Need more users, more branches, or custom SLA? ",
            /* @__PURE__ */ jsx("a", { href: "/contact", children: "Tell us what you need →" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "In every plan" }),
          /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Nothing important is withheld." }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3 vq-mt-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "The complete double-entry ledger" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Tiered financial reports (Starter and up)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Unlimited monthly transactions" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Your data exportable at any time" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Every new feature we ship, at no extra cost" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
              /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent)", "flex": "none", "marginTop": "3px" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }),
              /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Offline mode at the POS till" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-hr", style: { "marginBlock": "var(--vq-space-8)" } }),
          /* @__PURE__ */ jsx("p", { className: "vq-h3", children: "No implementation fee. No setup fee. No module fees. No consultant." })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Line by line" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Compare the plans." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table vq-table--compare", children: [
            /* @__PURE__ */ jsxs("colgroup", { children: [
              /* @__PURE__ */ jsx("col", { style: { "width": "34%" } }),
              /* @__PURE__ */ jsx("col", {}),
              /* @__PURE__ */ jsx("col", {}),
              /* @__PURE__ */ jsx("col", { className: "is-us" }),
              /* @__PURE__ */ jsx("col", {})
            ] }),
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", {}),
              /* @__PURE__ */ jsx("th", { children: "Solo (Free)" }),
              /* @__PURE__ */ jsx("th", { children: "Starter" }),
              /* @__PURE__ */ jsx("th", { style: { "color": "var(--vq-accent-text)" }, children: "Core" }),
              /* @__PURE__ */ jsx("th", { children: "Scale" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", style: { "padding": "22px 0 6px", "background": "var(--vq-surface-2)", "borderBottom": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", style: { "paddingLeft": "2px" }, children: "Operational limits" }) }) }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsxs("td", { className: "vq-table__row-head", children: [
                  "Monthly price (",
                  isAnnual ? "annual billing" : "monthly billing",
                  ")"
                ] }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$0" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: isAnnual ? "$41/mo ($490/yr)" : "$49/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: isAnnual ? "$83/mo ($990/yr)" : "$99/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: isAnnual ? "$249/mo ($2,990/yr)" : "$299/mo" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Product SKUs" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "500" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "5,000" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "25,000" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "250,000" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Full Staff seats" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "5" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "25" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Locations / Branches (included)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "POS Registers (devices)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "1" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "2" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "6" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "20" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Cashier PIN till logins" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "2" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Transactions per month" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "100" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Service jobs per month" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "20" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "History retention visible" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "30 days" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "Unlimited" }) })
              ] }),
              /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", style: { "padding": "22px 0 6px", "background": "var(--vq-surface-2)", "borderBottom": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", style: { "paddingLeft": "2px" }, children: "In every plan, at every price" }) }) }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Universal business modules" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Point of sale, offline mode, barcode, receipts" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "All 13 document types" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Dashboard cards (sales, expenses, cash, stock, low stock, expiry, receivables, payables, profit peek)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Financial & analytical reports" }),
                /* @__PURE__ */ jsxs("td", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "vq-text-3 vq-small", style: { marginLeft: "4px" }, children: "Dashboard cards only" })
                ] }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "20 Essential (P&L, Cash, Tax)" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "32 Core (Profitability, Aging)" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "All 40 & Consolidated" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Customer & supplier khata, party statements" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Purchases, orders, expenses & stock take" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Production, recipes, BOM & work orders" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Services, service jobs, contracts & calendar" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Serial, IMEI, batch & expiry tracking" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Loyalty points, gift cards & marketing" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Google Drive automated backup" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", style: { "padding": "22px 0 6px", "background": "var(--vq-surface-2)", "borderBottom": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", style: { "paddingLeft": "2px" }, children: "Scale Fences" }) }) }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "1. Multi-branch & inter-branch transfers" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "With 2nd location" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "With 2nd location" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "2. REST API & webhooks" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$29/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "3. Security audit trail & custom roles" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$39/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "4. White-label & custom domain" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$49/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "5. B2B Network — unlimited connections" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "Basic" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "6. Consolidated multi-entity reporting" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "7. Channel sync (WooCommerce, Amazon, eBay, TikTok)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-cross", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "2 included" }) })
              ] }),
              /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", style: { "padding": "22px 0 6px", "background": "var(--vq-surface-2)", "borderBottom": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", style: { "paddingLeft": "2px" }, children: "AI allowance & support" }) }) }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Monthly AI credits included" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "100 (10 scans)" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "500" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "2,000" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "10,000" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "AI system rebuilds" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "1 / 90 days" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "1 / 90 days" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "1 / month" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Vena conversational AI assistant" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-tick", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Support SLA" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "Vena + Help centre" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "Email (2 days)" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "Priority email (1 day)" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "Named contact (4 hours)" }) })
              ] }),
              /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", style: { "padding": "22px 0 6px", "background": "var(--vq-surface-2)", "borderBottom": "1px solid var(--vq-line)" }, children: /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", style: { "paddingLeft": "2px" }, children: "Add-ons" }) }) }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra store location" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$45/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$45/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$45/mo" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra full staff seat" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$15/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$15/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$15/mo" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra register (POS device)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$20/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$20/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$20/mo" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "+50,000 catalogue items" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$25/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$25/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$25/mo" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Channel sync (each)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19/mo" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "2 included (+ $19/mo)" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "1,000 AI credits top-up" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "5 AI rebuilds" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$10 once" }) })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Bring your own key (BYOK)" }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-text-2 vq-small", children: "—" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19 once" }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "vq-num vq-small", children: "$19 once" }) })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("p", { className: "vq-small vq-text-2 vq-mt-6 vq-reveal", style: { "maxWidth": "78ch" }, children: [
            /* @__PURE__ */ jsx("b", { children: "About data retention on Solo." }),
            " Solo displays the last 30 days of detail across lists and recent views. All account balances, khata ledgers, and cumulative totals continue to compute from your complete, all-time records. Nothing is ever deleted, and upgrading to any paid plan immediately opens your full historical detail."
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", id: "ai", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-amb", children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-amb__beams", children: [
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {})
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "760px" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "AI usage" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Models cost money to run. We'd rather show you the meter." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Blueprint, SmartCapture, Vena and Signals use AI models. Rather than hide that inside bloated retainers, we make it transparent. Your monthly plan allowance covers everyday use, and you can top up anytime." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Included Monthly" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Starter (500 credits), Core (2,000 credits), and Scale (10,000 credits) include generous allowances for captures, queries, and assistant actions." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Top up anytime" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "1,000 extra credits for $10, anytime. It is a one-off purchase, not a recurring subscription — and we never silently bill you past your cap." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Bring your own key" }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Connect your own OpenAI, Anthropic, or Gemini API key. One-time $19 unlock on paid plans, then managed AI is never metered or billed by VenQore again." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Add-ons" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Buy only the shape you need." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "Add-on" }),
              /* @__PURE__ */ jsx("th", { children: "What it is" }),
              /* @__PURE__ */ jsx("th", { className: "num", style: { "width": "150px" }, children: "Price" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra store location" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "One more branch with its own stock, pricing and reporting (Starter, Core, Scale)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$45 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra full staff seat" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "One more person with full management permissions (Starter, Core, Scale)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$15 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Extra register (POS device)" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Additional concurrent till device with offline mode (Starter, Core, Scale)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$20 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "+50,000 catalogue items" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Increase product catalogue capacity by 50,000 items (Starter, Core, Scale)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$25 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Channel sync (each)" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "WooCommerce, Amazon, eBay or TikTok shop integration (Starter, Core)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$19 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "API + webhooks" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Developer REST API access and webhook events (Starter)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$29 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Audit trail + custom roles" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Granular permission editor and security activity audit log (Starter)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$39 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "White-label" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Custom branding and custom domain (Core)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$49 / month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "1,000 AI credits top-up" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "1,000 additional credits, one-off and repeatable (Paid plans)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$10 once" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "5 AI rebuilds" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "5 additional AI blueprint rebuilds (Paid plans)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$10 once" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Bring your own key (BYOK)" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "One-time unlock for direct provider API keys (Paid plans)" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$19 once" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Setup & migration" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Full database onboarding & product catalog import service" }),
                /* @__PURE__ */ jsx("td", { className: "num", children: "$249 once" })
              ] })
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--narrow", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-section-head vq-reveal", children: /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Pricing questions." }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-faq vq-reveal", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Is there a free trial?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "14 days at Core level, no credit card required, cancel anytime. That includes multi-branch, API access, audit trail, Vena, Signals and all 40 reports — so you are trying the real thing, not a demo of it. We send a reminder on day 11 before the trial ends, not after." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "What happens after the trial?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "If you don't select a paid plan, your system drops smoothly to Solo — free forever. Your data is preserved and nothing is deleted or reset." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Can I change plans?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Any time, both directions, prorated. Downgrading never deletes anything: detail beyond 30 days on Solo is hidden from lists while totals stay complete, and full history immediately unlocks the moment you upgrade." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Do you charge to import my data?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No. Import is included, and so is the help getting it in." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Do you charge to leave?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No. Export everything, any time, in a format your next system can read." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Is there a contract?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Monthly is month-to-month. Annual is twelve months at two months off ($490, $990, or $2,990). There is no minimum term and no notice period." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Why does the cheapest plan include everything?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Because a feature you need should not be a negotiation. A one-person shop needs a correct trial balance exactly as much as a ten-branch one does — it just needs fewer seats. You pay for the size of your business, not for permission to run it properly." }) }) })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Before you decide" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/compare", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What you are comparing against" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Square and Vyapar, fee maths included." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/security", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Who can reach your data" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Isolation, roles and the record." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/onboarding", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "See it built first" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Four minutes, start to live." }),
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
  Pricing as default
};
