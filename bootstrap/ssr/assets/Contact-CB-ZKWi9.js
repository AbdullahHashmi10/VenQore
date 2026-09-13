import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { g as useTheme } from "../ssr.js";
import { usePage, Head } from "@inertiajs/react";
import { S as SiteHeader, a as SiteFooter, C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
import { u as useTurnstile } from "./useTurnstile-4WiJ80s8.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "lucide-react";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "motion/react";
function Contact() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { auth = {}, flash = {}, ...props } = usePage().props;
  const getTurnstileToken = useTurnstile();
  useEffect(() => {
    window.__vqTurnstile = getTurnstileToken;
    return () => {
      if (window.__vqTurnstile === getTurnstileToken) delete window.__vqTurnstile;
    };
  }, [getTurnstileToken]);
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
      /* @__PURE__ */ jsx("title", { children: "Contact — a person answers this one | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/contact" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Contact — a person answers this one | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/contact" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Contact — a person answers this one | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Tell us what your business does and what is currently painful. No ticket queue and no chatbot — a reply from someone who built the thing." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".26" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,1fr) minmax(0,520px)", "gap": "var(--vq-space-16)", "alignItems": "start" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Contact" }),
              /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
                "A ",
                /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "person" }),
                " answers this one."
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "There is no ticket queue and no chatbot in front of it. Tell us what you are trying to do and you will get a reply from someone who can actually change the product." }),
              /* @__PURE__ */ jsxs("div", { className: "vq-stack vq-gap-4 vq-mt-10", children: [
                /* @__PURE__ */ jsx("div", { className: "vq-card vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-4", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { "marginBottom": "0" }, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }) }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "Trying VenQore" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "You do not need to talk to anyone to start. Describe your business, review the Blueprint, and go live the same day." }),
                    /* @__PURE__ */ jsxs("a", { className: "vq-link vq-mt-3", href: "/build-workspace", children: [
                      "Start building ",
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                        /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                      ] })
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "vq-card vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-4", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { "marginBottom": "0" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }),
                    /* @__PURE__ */ jsx("path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }),
                    /* @__PURE__ */ jsx("path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }),
                    /* @__PURE__ */ jsx("path", { d: "M10 6h4" }),
                    /* @__PURE__ */ jsx("path", { d: "M10 10h4" }),
                    /* @__PURE__ */ jsx("path", { d: "M10 14h4" }),
                    /* @__PURE__ */ jsx("path", { d: "M10 18h4" })
                  ] }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "More than 10 branches, or something specific" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "Multi-entity, an unusual tax regime, a migration off something large — say so in the form and we will scope it properly." }),
                    /* @__PURE__ */ jsxs("a", { className: "vq-link vq-mt-3", href: "/pricing", children: [
                      "See pricing ",
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                        /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                      ] })
                    ] })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "vq-card vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-4", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { "marginBottom": "0" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M12 22v-5" }),
                    /* @__PURE__ */ jsx("path", { d: "M9 8V2" }),
                    /* @__PURE__ */ jsx("path", { d: "M15 8V2" }),
                    /* @__PURE__ */ jsx("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
                  ] }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "Partnerships & integrations" }),
                    /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-2", children: "If you run a channel, a payment rail or an accounting practice, there is probably something worth building." }),
                    /* @__PURE__ */ jsxs("a", { className: "vq-link vq-mt-3", href: "/features", children: [
                      "Read the feature list ",
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                        /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                      ] })
                    ] })
                  ] })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-hr" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-8", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Email" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-2", children: /* @__PURE__ */ jsx("a", { href: "mailto:hello@venqore.com", children: "hello@venqore.com" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Where we are" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-2", children: "Okara, Punjab, Pakistan · UTC+5" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Typical reply" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-small vq-mt-2", children: "Within one working day" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", style: { "position": "sticky", "top": "120px" }, children: [
              /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: "Tell us what you need" }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-2", style: { "maxWidth": "none" }, children: "The more specific you are, the more useful the reply." }),
              /* @__PURE__ */ jsxs("form", { className: "vq-stack vq-gap-5 vq-mt-6", "data-demo": true, children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "16px" }, children: [
                  /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                    /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "c-name", children: "Your name" }),
                    /* @__PURE__ */ jsx("input", { className: "vq-input", id: "c-name", name: "name", required: true, autoComplete: "name", placeholder: "John Doe" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                    /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "c-biz", children: "Business name" }),
                    /* @__PURE__ */ jsx("input", { className: "vq-input", id: "c-biz", name: "business", autoComplete: "organization", placeholder: "Acme Retail" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "c-email", children: "Work email" }),
                  /* @__PURE__ */ jsx("input", { className: "vq-input", id: "c-email", name: "email", type: "email", required: true, autoComplete: "email", placeholder: "you@company.com" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-help", children: "We reply here. No list, no sequence." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", id: "c-topic-label", htmlFor: "c-topic-trigger", children: "What is this about?" }),
                  /* @__PURE__ */ jsxs("div", { className: "vq-custom-select", "data-custom-select": true, children: [
                    /* @__PURE__ */ jsx("input", { type: "hidden", id: "c-topic", name: "topic", value: "Getting started" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-custom-select__trigger", id: "c-topic-trigger", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-labelledby": "c-topic-label c-topic-trigger", children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-custom-select__value", children: "Getting started" }),
                      /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__chevron", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("ul", { className: "vq-custom-select__menu", role: "listbox", "aria-labelledby": "c-topic-label", tabIndex: "-1", children: [
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item is-selected", role: "option", "aria-selected": "true", "data-value": "Getting started", children: [
                        /* @__PURE__ */ jsx("span", { children: "Getting started" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "Something specific my business needs", children: [
                        /* @__PURE__ */ jsx("span", { children: "Something specific my business needs" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "Migrating from another system", children: [
                        /* @__PURE__ */ jsx("span", { children: "Migrating from another system" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "Pricing for more than 10 branches", children: [
                        /* @__PURE__ */ jsx("span", { children: "Pricing for more than 10 branches" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "Partnership or integration", children: [
                        /* @__PURE__ */ jsx("span", { children: "Partnership or integration" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "vq-custom-select__item", role: "option", "aria-selected": "false", "data-value": "Something is broken", children: [
                        /* @__PURE__ */ jsx("span", { children: "Something is broken" }),
                        /* @__PURE__ */ jsx("svg", { className: "vq-custom-select__check", xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("polyline", { points: "20 6 9 17 4 12" }) })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
                  /* @__PURE__ */ jsx("label", { className: "vq-label", htmlFor: "c-msg", children: "How does your business work?" }),
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      className: "vq-textarea",
                      id: "c-msg",
                      name: "message",
                      required: true,
                      placeholder: "What you sell, how you buy, how many people, how many locations — and the thing that is currently painful."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "vq-check", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", name: "updates" }),
                  /* @__PURE__ */ jsx("span", { className: "vq-caption", style: { "maxWidth": "none" }, children: "Send me product updates, roughly monthly. No marketing." })
                ] }),
                /* @__PURE__ */ jsx("button", { type: "submit", className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block", children: "Send it" }),
                /* @__PURE__ */ jsxs("p", { className: "vq-caption vq-center", style: { "maxWidth": "none" }, children: [
                  "You do not need to do this to try VenQore. ",
                  /* @__PURE__ */ jsx("a", { href: "/build-workspace", children: "Start building →" })
                ] })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Answers you may not need to ask for" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/help", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The help centre" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Answers organised by screen." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/docs", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Documentation" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Guides and how-tos." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pricing", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Plans and limits" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "From $49/month or free." }),
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
  Contact as default
};
