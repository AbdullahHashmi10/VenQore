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
function Blueprint() {
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
      /* @__PURE__ */ jsx("title", { children: "Blueprint — the AI that builds your ERP | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/blueprint" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Blueprint — the AI that builds your ERP | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/blueprint" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Blueprint — the AI that builds your ERP | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Blueprint" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Describe your business. ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "Approve" }),
              " the plan. It exists."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Blueprint is the part of VenQore that turns a description of your business into a working ERP and POS configuration: which of the 140+ modules you get, what each thing is called, who can see what, which tax rules apply and which of the 13 document types you issue. You review every line before anything becomes real, and you can rebuild it at any time." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/onboarding", children: [
                /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("polygon", { points: "6 3 20 12 6 21 6 3" }) }),
                " See a build"
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-bp", "data-bp": true, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-bp__bar", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", style: { "flex": "none" }, children: "Try one" }),
            /* @__PURE__ */ jsxs("div", { className: "vq-bp__tabs", role: "tablist", children: [
              /* @__PURE__ */ jsx("button", { className: "vq-bp__tab", role: "tab", "data-bp-key": "pharmacy", "aria-selected": "true", children: "Pharmacy" }),
              /* @__PURE__ */ jsx("button", { className: "vq-bp__tab", role: "tab", "data-bp-key": "wholesale", "aria-selected": "false", children: "Wholesale" }),
              /* @__PURE__ */ jsx("button", { className: "vq-bp__tab", role: "tab", "data-bp-key": "cafe", "aria-selected": "false", children: "Café" }),
              /* @__PURE__ */ jsx("button", { className: "vq-bp__tab", role: "tab", "data-bp-key": "hardware", "aria-selected": "false", children: "Hardware store" }),
              /* @__PURE__ */ jsx("button", { className: "vq-bp__tab", role: "tab", "data-bp-key": "multi", "aria-selected": "false", children: "Multi-branch" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-bp__body", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-bp__in", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "What the owner typed" }),
              /* @__PURE__ */ jsx("div", { className: "vq-bp__prompt vq-mt-3", "data-bp-prompt": true }),
              /* @__PURE__ */ jsx("div", { className: "vq-steps", "data-bp-steps": true }),
              /* @__PURE__ */ jsxs("p", { className: "vq-caption", style: { "marginTop": "auto", "paddingTop": "var(--vq-space-6)", "maxWidth": "none" }, children: [
                "Blueprint cannot post a transaction. It cannot alter the accounting engine. It cannot change historical data. ",
                /* @__PURE__ */ jsx("b", { style: { "color": "var(--vq-text-2)" }, children: "It builds the room; it doesn't touch the safe." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-bp__out", children: /* @__PURE__ */ jsx("div", { className: "vq-bp__result", "data-bp-result": true }) })
          ] })
        ] }) }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "What's in a Blueprint" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Six things, and you can edit all six." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" }),
                /* @__PURE__ */ jsx("path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }),
                /* @__PURE__ */ jsx("path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Modules" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Tools you did not pick stay completely out of your way until you choose to add them, while features included in higher plans are shown with a clear lock." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M12 6V2H8" }),
                /* @__PURE__ */ jsx("rect", { width: "16", height: "12", x: "4", y: "6", rx: "2" }),
                /* @__PURE__ */ jsx("path", { d: "M2 12h2" }),
                /* @__PURE__ */ jsx("path", { d: "M20 12h2" }),
                /* @__PURE__ */ jsx("path", { d: "M15 11v2" }),
                /* @__PURE__ */ jsx("path", { d: "M9 11v2" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Your vocabulary" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "If you call them jobs and not orders, the system says jobs. If your customers are patients, the menu says patients. It is one table, and it is yours to edit." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                /* @__PURE__ */ jsx("circle", { cx: "9", cy: "7", r: "4" }),
                /* @__PURE__ */ jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
                /* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Roles & approvals" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Who can discount, who can write off stock, what needs a second pair of eyes. Seven roles out of the box, and an approval chain shaped like your actual business." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("line", { x1: "19", x2: "5", y1: "5", y2: "19" }),
                /* @__PURE__ */ jsx("circle", { cx: "6.5", cy: "6.5", r: "2.5" }),
                /* @__PURE__ */ jsx("circle", { cx: "17.5", cy: "17.5", r: "2.5" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Tax & compliance" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Set for how and where you actually sell. Inclusive or exclusive, per-item rates, the QR verification your receipts need." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }),
                /* @__PURE__ */ jsx("path", { d: "M18 17V9" }),
                /* @__PURE__ */ jsx("path", { d: "M13 17V5" }),
                /* @__PURE__ */ jsx("path", { d: "M8 17v-3" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Reports" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "The ones your business is judged by, on the dashboard, not buried five levels into a menu you never open." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }),
                /* @__PURE__ */ jsx("path", { d: "M9 7h6" }),
                /* @__PURE__ */ jsx("path", { d: "M9 11h4" })
              ] }) }),
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "The ledger mapping" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Which accounts each kind of transaction posts to. Editable, and never bypassable — that is the one line the AI is not allowed to cross." })
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
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "alignItems": "center", "gap": "var(--vq-space-16)" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Guardrails" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "What the AI cannot do." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: `The single biggest objection to AI touching business software is "I don't trust it with my money." That objection deserves an answer made of architecture, not reassurance.` }),
              /* @__PURE__ */ jsxs("ul", { className: "vq-stack vq-gap-4 vq-mt-8", children: [
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                    /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                  ] }) }),
                  /* @__PURE__ */ jsx("span", { className: "vq-body", children: "Blueprint cannot post a transaction." })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                    /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                  ] }) }),
                  /* @__PURE__ */ jsx("span", { className: "vq-body", children: "It cannot alter the accounting engine." })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                    /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                  ] }) }),
                  /* @__PURE__ */ jsx("span", { className: "vq-body", children: "It cannot change historical data." })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "vq-row vq-gap-3", style: { "alignItems": "flex-start" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-danger)", "flex": "none", "marginTop": "2px" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                    /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
                  ] }) }),
                  /* @__PURE__ */ jsx("span", { className: "vq-body", children: "It cannot bypass an approval chain it configured." })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "vq-h3 vq-mt-8", style: { "color": "#fff" }, children: "It builds the room; it doesn't touch the safe." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The proposal it writes" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-mt-4", style: { "fontFamily": "var(--vq-font-numeric)", "fontSize": "var(--vq-fs-caption)", "lineHeight": "1.9", "color": "rgb(237 242 239 / .82)", "wordSpacing": "normal" }, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)" }, children: "+" }),
                  " enable  ",
                  /* @__PURE__ */ jsx("b", { children: "batch_expiry" }),
                  "          ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: '// "batch and expiry"' })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)" }, children: "+" }),
                  " enable  ",
                  /* @__PURE__ */ jsx("b", { children: "multi_branch" }),
                  "          ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: '// "two branches"' })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)" }, children: "+" }),
                  " enable  ",
                  /* @__PURE__ */ jsx("b", { children: "supplier_credit" }),
                  "       ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: '// "30-day credit"' })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-teal-300)" }, children: "+" }),
                  " enable  ",
                  /* @__PURE__ */ jsx("b", { children: "products" }),
                  "              ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: "// required by batch_expiry" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-coral-400)" }, children: "−" }),
                  " disable ",
                  /* @__PURE__ */ jsx("b", { children: "recipes_bom" }),
                  "           ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: "// not a kitchen" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-coral-400)" }, children: "−" }),
                  " disable ",
                  /* @__PURE__ */ jsx("b", { children: "table_service" }),
                  "         ",
                  /* @__PURE__ */ jsx("span", { style: { "opacity": ".5" }, children: "// not a kitchen" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "vq-mt-3", style: { "opacity": ".5" }, children: 'rename  customers → "Patients"' }),
                /* @__PURE__ */ jsx("div", { style: { "opacity": ".5" }, children: 'rename  suppliers → "Distributors"' }),
                /* @__PURE__ */ jsx("div", { className: "vq-mt-3", style: { "color": "var(--vq-teal-300)" }, children: "✓ dependencies satisfied · 0 conflicts · within plan" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-hr", style: { "marginBlock": "var(--vq-space-5)" } }),
              /* @__PURE__ */ jsx("p", { className: "vq-caption", style: { "maxWidth": "none", "color": "rgb(237 242 239 / .6)" }, children: "Every proposal is validated before you see it, applied only on approval, and snapshotted so it can be rolled back. Enabling one thing enables what it requires — Cookbook requires Products, Khata requires Parties." })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "alignItems": "center", "gap": "var(--vq-space-16)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Change it later" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "A change request is a sentence." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Businesses change faster than implementations. Describe what's different and Blueprint shows you a diff — what's added, what changes, what's affected. Approve it or don't." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "The old way" }),
              /* @__PURE__ */ jsx("th", { children: "With Blueprint" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-text-3", children: "Discovery call" }),
                /* @__PURE__ */ jsx("td", { className: "vq-table__win", children: "A text box" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-text-3", children: "Statement of work" }),
                /* @__PURE__ */ jsx("td", { className: "vq-table__win", children: "A plan you can read in two minutes" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-text-3", children: "Configuration phase" }),
                /* @__PURE__ */ jsx("td", { className: "vq-table__win", children: "Editing a line" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-text-3", children: "Change request" }),
                /* @__PURE__ */ jsx("td", { className: "vq-table__win", children: "A sentence" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-text-3", children: "Go-live date" }),
                /* @__PURE__ */ jsx("td", { className: "vq-table__win", children: "Today" })
              ] })
            ] })
          ] }) })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container vq-container--wide", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "And then" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "You approve, and the system exists." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Not a demo. Your live system, with your data model, ready for your first transaction." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-app", children: [
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
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Once it is built" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/onboarding", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "See a build end to end" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Four minutes, description to live system." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/solutions", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The six industry starting points" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Retail, wholesale, pharmacy, grocery, apparel, multi-branch." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pricing", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What it costs to run" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "From $49/month or free, every module included." }),
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
  Blueprint as default
};
