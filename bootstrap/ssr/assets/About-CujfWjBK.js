import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
const QUESTIONS_AND_ANSWERS = [
  {
    id: "01",
    title: "What is VenQore?",
    content: "VenQore is an AI ERP builder that replaces fragmented point-of-sale terminals, disconnected spreadsheets, and rigid enterprise software with one unified operating system. You describe your operational workflows in plain language, and VenQore automatically composes a tailor-made system backed by an immutable double-entry general ledger."
  },
  {
    id: "02",
    title: "Why did we build it?",
    content: "For decades, growing businesses were forced to choose between simplistic cash registers that blind them to true profit and bloated ERP consulting projects that cost thousands and take six months. We lived this reality behind live counters — where cash drawers mismatch, FIFO inventory costs drift, and reports conflict — so we wrote the software that should have existed from day one."
  },
  {
    id: "03",
    title: "How does the AI builder assemble your system?",
    content: "VenQore maintains an architectural library of 140+ battle-tested operational modules (POS, FIFO inventory, multi-branch dispatch, recipe costing, batch tracking, customer Khata, SP-API sync). The AI composer maps your plain-language description to the exact modules, fields, and approval tiers your business needs — turning on only what you use with zero extraneous clutter."
  },
  {
    id: "04",
    title: "Why is our accounting mathematical & immutable?",
    content: "While AI composes the interface and workflows, it never touches the financial math. Every transaction — checkout, purchase order, stock write-off, or supplier return — writes balanced debits and credits into Core Ledger. All writes pass through 8 inviolable accounting laws and DECIMAL(20,4) precision, guaranteeing that no two screens or reports can ever disagree."
  },
  {
    id: "05",
    title: "What industries does VenQore run?",
    content: "VenQore powers 85+ business categories across retail, food & beverage, wholesale, services, and light manufacturing. Whether you need batch-expiry controls for pharmacy, IMEI tracking for electronics, recipe costing for central kitchens, or tier-pricing dispatch for wholesale, the underlying ledger engine adapts seamlessly."
  },
  {
    id: "06",
    title: "How do we verify system accuracy?",
    content: "We believe buyers of financial software deserve proof over marketing claims. Every build is validated against 35,000+ automated correctness checks guarding ledger balances, inventory lot relief, and tax separation before any code ships to production."
  },
  {
    id: "07",
    title: "Who supports and builds VenQore?",
    content: "VenQore is built and supported by dedicated systems engineers and domain specialists with shop-floor experience. We ship weekly improvements, respond directly to customer requests, and never trap your data with export barriers."
  }
];
function EditorialAccordion() {
  const [openId, setOpenId] = useState("01");
  const toggle = (id) => {
    setOpenId((prev) => prev === id ? null : id);
  };
  return /* @__PURE__ */ jsx("div", { className: "w-full max-w-4xl mx-auto divide-y divide-white/10 dark:divide-white/10 border-y border-white/10", children: QUESTIONS_AND_ANSWERS.map((item) => {
    const isOpen = openId === item.id;
    return /* @__PURE__ */ jsxs("div", { className: "group transition-colors duration-200", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => toggle(item.id),
          className: `w-full text-left py-6 sm:py-8 px-2 sm:px-4 flex items-start justify-between gap-6 cursor-pointer transition-all duration-300 ${isOpen ? "text-[var(--vq-accent-text,#0BAA8F)]" : "text-white/40 hover:text-white/90"}`,
          "aria-expanded": isOpen,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 sm:gap-6 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm font-mono font-bold tracking-widest pt-1.5 opacity-60", children: item.id }),
              /* @__PURE__ */ jsx("h3", { className: "font-display font-black uppercase text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05]", children: item.title })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "flex-shrink-0 pt-1.5 opacity-70 group-hover:opacity-100 transition-transform duration-300", children: /* @__PURE__ */ jsxs(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                width: "22",
                height: "22",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: `transition-transform duration-300 ${isOpen ? "rotate-45 text-[var(--vq-accent-text,#0BAA8F)]" : "rotate-0"}`,
                children: [
                  /* @__PURE__ */ jsx("path", { d: "M12 5v14" }),
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" })
                ]
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `grid transition-all duration-300 ease-out px-2 sm:px-4 ${isOpen ? "grid-rows-[1fr] opacity-100 pb-8" : "grid-rows-[0fr] opacity-0 pb-0 pointer-events-none"}`,
          children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "pl-8 sm:pl-12 md:pl-16 pr-4 sm:pr-8 text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed font-normal", children: /* @__PURE__ */ jsx("p", { children: item.content }) }) })
        }
      )
    ] }, item.id);
  }) });
}
function About() {
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
      /* @__PURE__ */ jsx("title", { children: "About VenQore — Mission, Architecture & Origin" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: "https://venqore.com/about" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: "About VenQore — Mission, Architecture & Origin" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: "VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: "https://venqore.com/about" }),
      /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: "About VenQore — Mission, Architecture & Origin" }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: "VenQore is the AI ERP builder: describe your business and it assembles an operating system backed by verified double-entry accounting. Built by operators, engineered for truth." }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: "https://venqore.com/images/og/venqore-og.png" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-site vq-app-body", style: { background: "var(--vq-bg)", color: "var(--vq-text)", overflow: "visible", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxs("main", { id: "main", children: [
        /* @__PURE__ */ jsxs("section", { className: "vq-section", style: { "paddingTop": "clamp(140px,15vw,200px)", "paddingBottom": "clamp(48px,6vw,72px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".30" } }) }),
          /* @__PURE__ */ jsx("div", { className: "vq-container", style: { "position": "relative" }, children: /* @__PURE__ */ jsxs("div", { style: { "maxWidth": "860px" }, children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "About VenQore" }),
            /* @__PURE__ */ jsxs("h1", { className: "vq-display vq-mt-4", children: [
              "Built from the counter up. ",
              /* @__PURE__ */ jsx("em", { className: "vq-italic", children: "Engineered for truth." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "VenQore is an AI ERP builder created for businesses that have outgrown fragmented spreadsheets and disconnected tools, but refuse to endure bloated six-month consulting projects. We combine composable operational modules with an immutable double-entry general ledger — giving you an operating system that fits your business on day one." }),
            /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", children: [
              /* @__PURE__ */ jsxs("a", { className: "vq-btn vq-btn--primary vq-btn--lg", href: "/build-workspace", children: [
                "Start building ",
                /* @__PURE__ */ jsx("span", { className: "vq-btn__arrow", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsx("a", { className: "vq-btn vq-btn--secondary vq-btn--lg", href: "/ledger", children: "Explore Core Ledger" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", style: { "paddingTop": "0" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-grid", style: { "gridTemplateColumns": "minmax(0,1fr) minmax(0,400px)", "gap": "var(--vq-space-16)", "alignItems": "start" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "The Origin" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-3", children: "The three disconnected worlds." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-4", style: { "color": "var(--vq-text)" }, children: "For years, growing retail, wholesale, and service businesses have been forced to survive across three fractured tools: a till that only tallies daily cash, a notebook tracking customer credit and khata, and a spreadsheet desperately trying to hold inventory and margins together." }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6 vq-text-2", children: "None of them agree. The till says sales are strong, the bank account says payroll is tight, and real profitability is an unsolved riddle until someone loses an entire weekend to manually force the numbers to reconcile." }),
            /* @__PURE__ */ jsx("h3", { className: "vq-h3 vq-mt-10", children: "The consulting racket that solved nothing." }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-4 vq-text-2", children: "Every traditional enterprise ERP that offered to fix this followed the exact same playbook: a discovery call, an impenetrable statement of work, an expensive third-party implementation team, and four months of configuration delays with an extra digit on the invoice. By month four, exhausted by endless change requests, most operators give up and decide the spreadsheet was fine." }),
            /* @__PURE__ */ jsx("h3", { className: "vq-h3 vq-mt-10", children: "The architectural breakthrough." }),
            /* @__PURE__ */ jsxs("p", { className: "vq-body vq-mt-4 vq-text-2", children: [
              "We wrote the software that should have existed from day one. We started with the mathematical foundation: ",
              /* @__PURE__ */ jsx("strong", { children: "Core Ledger" }),
              ". Because a point of sale that cannot report your true FIFO margins is just a cash drawer with a screen, and an inventory system that doesn't post double-entry journals is just a guesswork list."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6 vq-text-2", children: "Then came the defining shift: every business operates with distinct workflows, but custom development does not scale. We turned configuration into the engine. Describe your business in plain language, and VenQore automatically composes your fields, registers, approval tiers, and reports from 46 battle-tested modules — all posting immutably through one general ledger." }),
            /* @__PURE__ */ jsx("div", { className: "vq-quote vq-mt-10", children: /* @__PURE__ */ jsx("p", { children: "“We are not building twenty disconnected tools and hoping they sync. We built one unified engine, proved it on live counters, and engineer it to assemble itself around any business model.”" }) })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "vq-stack vq-gap-4 vq-reveal", style: { "position": "sticky", "top": "120px" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--accent vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Trial balance drift" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", children: "0.00" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Debits equal credits, mathematically enforced" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Automated verification" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", children: "35,000+" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Automated correctness tests run on every release" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Universal ERP Modules" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", children: "140+" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "POS, FIFO Stock, Ledger, Documents, Sync" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-card vq-stat", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-stat__label", children: "Double-entry audit trail" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__value vq-stat__value--sm", children: "100%" }),
              /* @__PURE__ */ jsx("span", { className: "vq-stat__note", children: "Every journal entry immutable and traceable" })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", style: { "paddingTop": "clamp(80px,9vw,130px)", "paddingBottom": "clamp(80px,9vw,130px)" }, children: [
          /* @__PURE__ */ jsx("div", { className: "vq-amb", children: /* @__PURE__ */ jsx("span", { className: "vq-amb__aurora", style: { "opacity": ".22" } }) }),
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", style: { "textAlign": "center", "marginInline": "auto", "marginBottom": "clamp(36px,5vw,64px)" }, children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Architecture & Methodology" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "What we do, and how we do it." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", style: { "color": "rgb(255 255 255 / .75)", "maxWidth": "42rem", "marginInline": "auto" }, children: "The engineering, accounting principles, and operational design that make VenQore unlike any traditional ERP or simple cash register." })
            ] }),
            /* @__PURE__ */ jsx(EditorialAccordion, {})
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "vq-section vq-band-dark", style: { "borderTop": "1px solid rgba(255,255,255,0.06)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-amb", children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-amb__beams", children: [
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {}),
              /* @__PURE__ */ jsx("i", {})
            ] }),
            /* @__PURE__ */ jsx("span", { className: "vq-amb__grain" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { "position": "relative" }, children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-eyebrow", children: "Our Convictions" }),
              /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Four opinions, held on purpose." }),
              /* @__PURE__ */ jsx("p", { className: "vq-lede", style: { "color": "rgb(255 255 255 / .72)" }, children: "The architectural principles behind everything we engineer." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "1. Software should fit the business, not the reverse." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Every off-the-shelf ERP was built for a generic business that isn't yours. The industry's answer is an army of consultants to bend your workflows to their database. Ours is an AI builder that assembles the exact system you need." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "2. Money is not a place to be clever." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The AI composes your screens, fields, and workflows. It never touches the mathematical engine that decides what your numbers say. Flexible where it should be, strictly deterministic where it must be." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "3. Publish the proof, don't ask for trust." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Where conventional software websites show superficial logo walls, we publish automated reconciliation gates and double-entry mathematical proofs. Buyers of financial software deserve rigour over marketing." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-reveal", children: [
                /* @__PURE__ */ jsx("h3", { className: "vq-h3", style: { "color": "#fff" }, children: "4. Institutional clarity priced for real commerce." }),
                /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "The businesses that most need one honest set of numbers are exactly the ones priced out by predatory enterprise licenses. We deliver institutional-grade ERP capabilities at software prices, not project prices." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "vq-section", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Engineered for Commerce" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-display", children: "Deep native capabilities across industries." }),
            /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "VenQore is not a single vertical template. It is an engine of 46 interoperable modules assembled specifically for your operational model." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "vq-table-wrap vq-reveal", children: /* @__PURE__ */ jsxs("table", { className: "vq-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "Industry Vertical" }),
              /* @__PURE__ */ jsx("th", { style: { "width": "230px" }, children: "Operational Engine" }),
              /* @__PURE__ */ jsx("th", { children: "Native Capabilities" }),
              /* @__PURE__ */ jsx("th", { className: "num", style: { "width": "130px" }, children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Retail, Supermarket & Grocery" }),
                /* @__PURE__ */ jsx("td", { children: "High-velocity counter POS" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Barcode scanning, fast hold/recall, weight scale integration, cash drawer controls, real-time inventory decrement." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Wholesale & Distribution" }),
                /* @__PURE__ */ jsx("td", { children: "Trade credit & tier pricing" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Customer Khata balances, credit limits, automated aging, tiered price lists, bulk invoice dispatching." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Pharmacy & Health Supplies" }),
                /* @__PURE__ */ jsx("td", { children: "Batch & expiry controls" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Strict FIFO lot relief, manufacture/expiry tracking, batch quarantine alerts, unit of measure conversion." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Hardware, Auto Parts & Electronics" }),
                /* @__PURE__ */ jsx("td", { children: "Serialized & variant inventory" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Serial number / IMEI tracking, warranty records, deep multi-attribute catalogs, bin locations." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Manufacturing & Light Assembly" }),
                /* @__PURE__ */ jsx("td", { children: "Bill of materials & recipes" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Multi-stage component assembly, automatic raw material deduction, finished goods costing." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] }),
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "vq-table__row-head", children: "Multi-Branch Chains & Warehouses" }),
                /* @__PURE__ */ jsx("td", { children: "Consolidated general ledger" }),
                /* @__PURE__ */ jsx("td", { className: "vq-text-2", children: "Inter-branch inventory transfers with transit tracking, unified customer khata, central financial oversight." }),
                /* @__PURE__ */ jsx("td", { className: "num vq-table__win", children: "Live · Production" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "vq-caption vq-mt-4", style: { "maxWidth": "none" }, children: "Every vertical runs on the exact same core ledger engine. Every sale, purchase order, receipt, and stock transfer automatically posts balanced journal entries." })
        ] }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsx("div", { className: "vq-container vq-container--narrow", children: /* @__PURE__ */ jsxs("div", { className: "vq-reveal", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Direct Accountability" }),
          /* @__PURE__ */ jsx("h2", { className: "vq-display vq-mt-4", children: "Built by operators. Supported with conviction." }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "When you run mission-critical business software, the last thing you need is a bloated support queue where nobody has ever stood behind a cash counter. VenQore was conceived and tested in the daily realities of live commerce — where if a till lags or an inventory count drifts, real customers wait and real money is lost." }),
          /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6 vq-text-2", children: "Every feature in this platform exists because real operations demanded it: batch expiration alerts because an expired product was once delivered; offline POS caching because internet connections drop at peak hours; and immutable general ledgers because accounting errors destroy businesses." }),
          /* @__PURE__ */ jsx("p", { className: "vq-body vq-mt-6 vq-text-2", children: "We ship improvements every single week. When you reach out to VenQore, you get direct answers from the people who design and engineer your software." }),
          /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-4 vq-mt-8", style: { "alignItems": "center" }, children: [
            /* @__PURE__ */ jsx("div", { style: { "width": "52px", "height": "52px", "borderRadius": "var(--vq-r-full)", "background": "var(--vq-accent-quiet)", "border": "1px solid var(--vq-accent-quiet-line)", "display": "grid", "placeItems": "center", "color": "var(--vq-accent-text)", "fontFamily": "var(--vq-font-numeric)", "fontWeight": "700", "fontSize": "18px" }, children: "AH" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "vq-small", style: { "fontWeight": "var(--vq-fw-semi)", "fontSize": "16px" }, children: "Abdullah Hashmi" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-caption", style: { "marginTop": "2px" }, children: [
                "Founder & Chief Architect · ",
                /* @__PURE__ */ jsxs("a", { href: "/contact", className: "vq-link", style: { "display": "inline-flex", "alignItems": "center", "gap": "4px" }, children: [
                  "Get in touch ",
                  /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-section--alt", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
          /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-reveal", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Keep reading" }),
            /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-4", children: "What we built" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--3", children: [
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/ledger", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "The correctness argument" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Seven checks the ledger runs on itself." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/roadmap", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "What ships next" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Now, next and later, in public." }),
              /* @__PURE__ */ jsxs("span", { className: "vq-link vq-mt-4", children: [
                "Read on ",
                /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
                  /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "vq-card vq-card--interactive vq-reveal", href: "/blog", children: [
              /* @__PURE__ */ jsx("h3", { className: "vq-h3", children: "How we think about retail" }),
              /* @__PURE__ */ jsx("p", { className: "vq-tile__body vq-mt-3", children: "Operations and accounting playbooks." }),
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
  About as default
};
