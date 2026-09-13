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
function Security() {
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
      /* @__PURE__ */ jsx("title", { children: "Security — isolation, roles and an unedited record | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/security" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "Security — isolation, roles and an unedited record | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/security" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "Security — isolation, roles and an unedited record | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "How one business's data is kept from another's: a tenant scope on 116 models, 49 permissions across 7 roles, and postings that are reversed rather than edited." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Security" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Your books are yours. ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "Structurally." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "This page explains how VenQore keeps one business's accounting data separate from another's in a multi-tenant system: a tenant scope applied to 116 models rather than to individual queries, 49 permissions across 7 roles, two-factor authentication, and a ledger where a correction is a reversal plus a new entry rather than an edit." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)" }, children: "116" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "models carry the tenant scope. Not a filter a query has to remember — a global scope applied at the model, so a query that forgets is still scoped." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)" }, children: "49" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "permissions across 7 roles — owner, admin, manager, cashier, accountant, purchasing officer and viewer. A role is a set of these, not a label." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-num", style: { "fontSize": "var(--vq-fs-metric)" }, children: "8" }),
            /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "correctness laws run on every release. The first one exists purely to try to read one tenant's numbers from another's session." })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "760px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Isolation" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "A query cannot forget which business it belongs to." }),
            /* @__PURE__ */ jsxs("p", { className: "vq-lede", children: [
              "The usual way to separate tenants is to add ",
              /* @__PURE__ */ jsx("code", { children: "where tenant_id = ?" }),
              " to every query and hope nobody forgets. Forgetting once is a breach. VenQore does it the other way round."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Scoped at the model, not the query" }),
              /* @__PURE__ */ jsxs("p", { className: "vq-tile__body vq-mt-3", children: [
                "Every tenant-owned model applies a global scope that adds the tenant condition to ",
                /* @__PURE__ */ jsx("b", { children: "every" }),
                " query it builds — reads, writes, counts, joins. A developer who writes a query and forgets the tenant still gets a scoped query. Bypassing it takes an explicit, greppable call that exists for console commands and platform administration."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Assigned on write, too" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The same layer stamps the owning business onto every new record at creation. A row cannot be written without an owner, so there is no orphaned data to leak later and no import path that quietly creates unowned rows." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Proved, not asserted" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The first of the eight correctness laws sets up two businesses and tries to read one's figures while authenticated as the other, across the whole metric registry. It runs on every release. If isolation regresses, that release does not ship." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Modules you switched off are actually off" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Turning a module off removes it from the navigation and closes its URLs. The gate is middleware on the route, not a hidden menu item — typing the address of a disabled module gets you nothing." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "760px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The record" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Nothing is edited in place." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "The strongest security property in an accounting system is not who can log in. It is whether a posted number can be quietly changed afterwards." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "A correction is a reversal plus a new entry" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Both are visible, both are dated, and the original stays where it was. There is no version of a transaction that only the last person to touch it can see, because there is no second version." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Every posting traces to a document, a user and a timestamp" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Your accountant can follow the trail from a figure in a report to the document that produced it and the person who entered it, without asking anyone a question." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "A closed period is closed" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Postings dated into a closed period are refused rather than absorbed, and the closing entries reconcile against the balances that existed before the close." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Export is a right, not a retention lever" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Your data is exportable at any time, in a format your next system can read, on every plan including Solo. We do not charge to leave." }),
              /* @__PURE__ */ jsxs("a", { className: "vq-link vq-mt-4", href: "/ledger", children: [
                "How the ledger proves itself",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "maxWidth": "760px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Access" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Who can do what, and who did it." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { "width": "34%" }, children: "Control" }),
              /* @__PURE__ */ jsx("th", { children: "What it means in practice" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Seven roles" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Owner, admin, manager, cashier, accountant, purchasing officer, viewer — each a defined set of the 49 permissions, not a name on a dropdown." })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Permission-gated routes" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Permissions are checked on the route, so a screen a role cannot use is a URL that role cannot open." })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Two-factor authentication" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Available on every account, and enforceable so that a user without it confirmed cannot proceed." })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Cashier PIN login" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "A till can be handed between staff without sharing a password, and each sale still carries who made it." })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Security activity log" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Included on Scale. Who signed in, from where, and what changed." })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Support access is bounded" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Platform administration is a separate role behind its own gate, and impersonation runs through a guard rather than a shared login." })
              ] })
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-section-head vq-reveal", children: /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Straight answers." }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-faq vq-reveal", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Do you have SOC 2 or ISO 27001?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No, and we are not going to imply otherwise on a marketing page. Those are audits of a company, and VenQore is a small, self-funded one. What we can show you is the architecture on this page and the checks the ledger runs against itself, which you can read about on the Core Ledger page. If a certification is a hard requirement for you, tell us and we will say plainly where we are rather than waste your evaluation cycle." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Can VenQore staff see my numbers?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Platform administration is a separate role behind its own gate, and support access to a workspace runs through an impersonation guard rather than a shared login. We do not browse tenant data casually, and we do not pool your figures into anything. The shared product catalogue — the one feature that draws on what tenants type — uses product names only, never your pricing, and it is opt-in with an unticked box at signup." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Where does my data live?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "On our hosting, in one database, separated by the tenant scope described above rather than by one database per customer. If you need a dedicated or regional deployment, that is a conversation rather than a checkbox — ask us." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "What happens to a photo I send to SmartCapture?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "It is sent to a model provider to be read, and what comes back is a draft transaction you approve or discard. You can also connect your own provider key, in which case you are dealing with that provider directly and we do not sit in the middle of it." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "Does the AI decide what my numbers say?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "No. The AI configures the system — which modules you have, what things are called, how a screen is laid out. Every figure is computed by the ledger and the calculation core, which are ordinary deterministic code. A model never writes a number into your books." }) }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-faq__item", children: [
              /* @__PURE__ */ jsxs("button", { className: "vq-faq__q", type: "button", "aria-expanded": "false", children: [
                "How do I report a vulnerability?",
                /* @__PURE__ */ jsx("span", { className: "vq-faq__sign" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-faq__a", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { children: "Use the contact form and say it is a security report — it reaches a person, not a queue. We would rather hear it from you than from a customer. Tell us what you found and how you found it, and we will confirm receipt and tell you what we are doing about it." }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "vq-center vq-small vq-text-2 vq-mt-8 vq-reveal", style: { "maxWidth": "none" }, children: [
            "Something here that does not answer your question? ",
            /* @__PURE__ */ jsx("a", { href: "/contact", children: "Ask us directly →" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Related" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/ledger", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "How the ledger proves itself" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Seven independent correctness checks." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/pricing", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What each plan includes" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Every plan carries the whole system." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/docs", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "Setting up roles and access" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Guides, screen by screen." }),
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
  Security as default
};
