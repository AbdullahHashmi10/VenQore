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
function Reckoner() {
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
      /* @__PURE__ */ jsx("title", { children: "The Reckoner — one place a number can be defined | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "58 readings, 18 period windows, one definition each. The dashboard and the P&L cannot disagree, and your history survives every rename." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/reckoner" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "The Reckoner — one place a number can be defined | VenQore" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "58 readings, 18 period windows, one definition each. The dashboard and the P&L cannot disagree, and your history survives every rename." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/reckoner" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "The Reckoner — one place a number can be defined | VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "58 readings, 18 period windows, one definition each. The dashboard and the P&L cannot disagree, and your history survives every rename." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grid" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "820px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The Reckoner" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "One place a number can be ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "defined" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "The Reckoner is VenQore's metric layer: the single place any business number — revenue, margin, stock value, receivables — is defined. All 58 dashboard readings and every one of the 40 reports ask it rather than calculating their own. That is why your dashboard and your profit and loss cannot disagree." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/dashboard-preview", children: "See it on a dashboard" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--4", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-card--accent vq-stat vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Readings" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: /* @__PURE__ */ jsx("span", { "data-count": "108", children: "108" }) }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Every figure the product can show you, defined once" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Period windows" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: "18" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Each with a comparison window behind it" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Distinct figures" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: "1,944" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Before anyone picks a chart or a size" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-stat vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Places a number is defined" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__value", children: "1" }),
            /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "And a build that fails if a second one appears" })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)", "alignItems": "center" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "The problem it exists to kill" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: 'Six places computed "revenue". They disagreed.' }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "That is the state most business software is in, and nobody tells you. A sale reversed by a journal entry vanishes from one figure and not the other. The dashboard says one number and the P&L says another, and you cannot tell which is real." }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6 vq-text-2", children: "Once you cannot tell, you stop trusting all of them — and an ERP whose numbers you do not trust is a very expensive filing cabinet. So we made it structurally impossible: one registry, one definition per figure, and a check in the build that fails if a second definition appears anywhere in the codebase." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "One request, one answer" }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mt-4", style: { "fontFamily": "var(--vq-font-numeric)", "fontSize": "var(--vq-fs-caption)", "lineHeight": "1.9", "color": "var(--vq-text-2)", "wordSpacing": "normal" }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: { "color": "var(--vq-accent-text)" }, children: "reckoner" }),
                ".read(",
                /* @__PURE__ */ jsx("b", { style: { "color": "var(--vq-text)" }, children: "'finance.gross_profit'" }),
                ","
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { "paddingLeft": "22px" }, children: [
                "period: ",
                /* @__PURE__ */ jsx("b", { style: { "color": "var(--vq-text)" }, children: "'this_quarter'" }),
                ")"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "vq-mt-3", style: { "opacity": ".55" }, children: "→ value        842,610" }),
              /* @__PURE__ */ jsx("div", { style: { "opacity": ".55" }, children: "→ previous     731,400" }),
              /* @__PURE__ */ jsx("div", { style: { "opacity": ".55" }, children: "→ change_pct   +15.2" }),
              /* @__PURE__ */ jsx("div", { style: { "opacity": ".55" }, children: "→ compare      vs Q3 last year" }),
              /* @__PURE__ */ jsx("div", { style: { "opacity": ".55" }, children: "→ meta         cached · 4 min ago" }),
              /* @__PURE__ */ jsx("div", { style: { "opacity": ".55" }, children: "→ drill        /reports/profit-loss" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-hr", style: { "marginBlock": "var(--vq-space-5)" } }),
            /* @__PURE__ */ jsx("p", { className: "vq-caption", style: { "maxWidth": "none" }, children: "The dashboard card, the P&L report, the mobile app and the Windows app all ask this. They cannot disagree, because there is nothing for them to disagree about." })
          ] }) })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Eighteen windows" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Every figure, over any period, against the right comparison." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: 'The comparison is the hard part. "Up 15%" means nothing unless you know what it is up against — so every window carries its own, and the answer says which one it used.' })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { style: { "width": "200px" }, children: "Window" }),
              /* @__PURE__ */ jsx("th", { children: "Compared against" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "today" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "yesterday" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "yesterday" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the day before" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "this week" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the same span last week" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last week" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the week before" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "this month" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the same span last month" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last month" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the month before" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "this quarter" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the same quarter last year" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last quarter" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the quarter before" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "this year" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the same span last year" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last year" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the year before" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last 7 days" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the preceding 7" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last 30 days" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the preceding 30" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last 90 days" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the preceding 90" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "last 12 months" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "the preceding 12" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "all time" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "—" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "a custom range" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "an equal-length preceding window" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "as of a date" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "—" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "live" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "—" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-4", style: { "maxWidth": "74ch" }, children: "Quarters are calendar quarters and the year starts on 1 January — and every figure with a yearly window states that rule in its own help text, so nobody is guessing what they are looking at." })
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
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "You never start from zero" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Your history outlives every change you make." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Most systems lose your past the moment you tidy something up. Rename a category and its history splits in two. Change your business type and the labels move but the comparisons break. Neither happens here, and both are design decisions rather than luck." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)" }, children: [
              /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-timeline", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-timeline__item", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-timeline__when", children: "Day one" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-2", style: { "color": "rgb(237 242 239 / .78)", "maxWidth": "46ch" }, children: "Your ledger opens. Every transaction from here is recorded against a permanent key, not a display name." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-timeline__item", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-timeline__when", children: "Month three" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-2", style: { "color": "rgb(237 242 239 / .78)", "maxWidth": "46ch" }, children: 'You rename "Utilities" to "Electricity & gas". The label changes everywhere. The three months behind it stay attached — because the history is keyed to the account, not the word.' })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-timeline__item", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-timeline__when", children: "Month nine" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-2", style: { "color": "rgb(237 242 239 / .78)", "maxWidth": "46ch" }, children: "You switch business type from Retail to Wholesale. Every figure relabels itself. Not one stored number moves." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-timeline__item", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-timeline__when", children: "Year two" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-2", style: { "color": "rgb(237 242 239 / .78)", "maxWidth": "46ch" }, children: 'You add a second branch, and eight new cards. "This quarter versus the same quarter last year" answers immediately, because last year was never thrown away.' })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-timeline__item", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-timeline__when", children: "Year four" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-2", style: { "color": "rgb(237 242 239 / .78)", "maxWidth": "46ch" }, children: "You are still comparing against year one. Same keys, same definitions, same ledger." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "vq-stack vq-gap-4 vq-reveal", children: [
                /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "A key is permanent" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The identifier behind every figure is a public, immutable name. To change what you see, we change the label. To retire a figure, we point it at its replacement. We never rename a key — because your saved dashboards and your history are hanging off it." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "History groups by identity, not by text" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Expenses group by the account, displayed by the account name. Rename it and the past comes with it. This is a real bug we found and fixed in our own reports." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Business type is a label layer" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "It changes display names per industry and never touches the maths. Switching it relabels everything and moves no data." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
                  /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "Closed periods are sealed, not frozen" }),
                  /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Historical months are precomputed and served instantly — and a snapshot is dropped the moment anyone back-dates an entry into its window. Turning the whole optimisation off changes no number, only the speed." })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Questions a report cannot answer" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Six things we do differently, on purpose." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: 'We do not show zero when we mean "we do not know"' }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "A confident 0 where the truth is unknown is the most damaging thing a dashboard can display. Ours says not applicable, and explains why." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "A loss is called a loss" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Gross Profit becomes Gross Loss. Net Cash Inflow becomes Net Cash Outflow. Tax Payable becomes Tax Refundable. Seven figures flip their word rather than just going red." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Growth against nothing is not +100%" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "If last month was zero, this month's growth is null, not infinity dressed up as a triumph." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "What you bought and what you paid are two numbers" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: 'Purchases and Paid to Suppliers are kept apart and neither is ever labelled just "Purchases". A top spender with no receipts is not a data error — it is your biggest credit risk.' })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: '"Do my books balance" is a status, not a trend' }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "A discrepancy needs action, not a chart to watch it drift. It answers balanced or out of balance, with the amount as detail." })
            ] }),
            /* @__PURE__ */ jsxs("article", { className: "vq-card vq-card--xl vq-tile vq-reveal", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-tile__title", children: "Thresholds are yours, and they say so" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body", children: "Heavy discount, dormant customer, overstock, expiry warning — eight thresholds you set, and every figure that uses one names it in its own help text." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", style: { "gap": "var(--vq-space-16)", "alignItems": "center" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Speed" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "Nobody waits at the till so a dashboard can stay warm." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "The obvious way to make a dashboard fast is to recompute everything whenever anything changes. Post a sale, recalculate every figure over every window — thousands of numbers, inside the checkout request, with a customer standing at the counter. Adding a chart would make the till slower. That is backwards." }),
            /* @__PURE__ */ jsxs("p", { className: "vq-body vq-mt-6 vq-text-2", children: [
              "So we compute when asked, remember the answer, and forget it the moment the underlying data changes. The number is always there and always right. The only difference is ",
              /* @__PURE__ */ jsx("b", { style: { "color": "var(--vq-text)" }, children: "when" }),
              "the work happens: while someone is looking, not while someone is selling."
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-reveal", children: /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "What invalidates what" }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mt-5 vq-stack vq-gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Sale posted, voided or returned" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "sales · finance · inventory" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Purchase or goods receipt" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "purchasing · inventory · finance" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Journal entry" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "finance" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Stock movement or adjustment" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "inventory" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Expense recorded" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "finance" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Production run completed" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "inventory · finance" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Payment received or made" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "finance · party" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", style: { "justifyContent": "space-between", "alignItems": "baseline" }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-small", children: "Staff clock in or out" }),
                /* @__PURE__ */ jsx("span", { className: "vq-caption vq-num", style: { "color": "var(--vq-accent-text)", "whiteSpace": "nowrap" }, children: "operations" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-5", style: { "maxWidth": "none" }, children: "Eight write events, invalidating by domain. Everything else stays warm — so a stock adjustment never makes your P&L recompute for no reason." })
          ] }) })
        ] }) }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container vq-container--narrow", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Being straight about it" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "We audited ourselves and found twelve cards lying." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "In August we ran a line-by-line audit of our own metrics against the code on disk. Twelve of them were returning invented data — a customer called Ali Raza who did not exist in anyone's database, a payment split of 60/40 cash to card pulled from nothing and applied to a real total." }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6", style: { "color": "rgb(237 242 239 / .74)" }, children: "We withdrew all twelve the same week, told the users who had them on their dashboards exactly which figures were affected, and wrote the rule that stops it happening again: a source may only return a value it read from the data. Not a sample, not a placeholder, not a realistic-looking default. There is no flag that makes it acceptable." }),
            /* @__PURE__ */ jsx("div", { className: "vq-quote vq-mt-8", children: /* @__PURE__ */ jsx("p", { style: { "color": "#fff" }, children: "The deeper failure was not the twelve. It was that 112 green tests and a clean build reported success while the product returned invented data. Every check we had was structural." }) }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-8", style: { "color": "rgb(237 242 239 / .74)" }, children: "What replaced them: a test that seeds two different datasets, asks the same figure of each, and fails if the answers match. A grep that fails the build if a sample value appears in a data source. And a rule that an implemented figure executing zero queries is fabricated by definition." }),
            /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--lg vq-btn--onDark vq-mt-8", href: "/ledger", children: [
              "The seven correctness checks ",
              /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
              ] }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "Where the numbers surface" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/dashboard-preview", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The dashboard that assembles itself" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "58 readings, cards that size themselves." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/ledger", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The engine underneath" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "One posting path for every module." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/features", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "All 140+ modules and what each does" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The full capability map." }),
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
  Reckoner as default
};
