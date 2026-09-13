import { jsxs, jsx } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import "../ssr.js";
import { S as SiteHeader, a as SiteFooter, C as CookieConsent } from "./CookieConsent-DgIWvNoO.js";
import { u as useMarketingShell } from "./SiteChrome-CBP-bGRL.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "motion/react";
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold !== void 0 ? options.threshold : 0,
        rootMargin: options.rootMargin || "0px 0px -50px 0px"
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
}
const RevealOnScroll = ({ children, delay = 0, direction = "up", className = "", as: Tag = "div" }) => {
  const [ref, isVisible] = useScrollReveal();
  const transforms = {
    up: "translateY(32px)",
    down: "translateY(-32px)",
    left: "translateX(32px)",
    right: "translateX(-32px)",
    scale: "scale(0.96)",
    none: "none"
  };
  return /* @__PURE__ */ jsx(
    Tag,
    {
      ref,
      className,
      style: {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : transforms[direction],
        transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: "opacity, transform"
      },
      children
    }
  );
};
const AnimatedCounter = ({ end, suffix = "", prefix = "", duration = 1800 }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);
  return /* @__PURE__ */ jsxs("span", { ref, className: "vq-num", children: [
    prefix,
    count.toLocaleString(),
    suffix
  ] });
};
const MagneticButton = ({ children, href, className = "", variant = "primary", ...props }) => {
  const btnRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (btnRef.current) btnRef.current.style.transform = "";
  }, []);
  const variantClass = variant === "primary" || variant === "accent" ? "vq-btn vq-btn--primary" : variant === "secondary" ? "vq-btn vq-btn--secondary" : variant === "ghost" ? "vq-btn vq-btn--ghost" : "vq-btn vq-btn--quiet";
  const Tag = href ? Link : "button";
  return /* @__PURE__ */ jsx(
    Tag,
    {
      ref: btnRef,
      href,
      className: `${variantClass} ${className}`,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      ...props,
      children
    }
  );
};
const SectionLabel = ({ children, text, icon: Icon }) => /* @__PURE__ */ jsx(
  "span",
  {
    className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot",
    style: { marginBottom: "var(--vq-space-4)" },
    children: children ?? text
  }
);
const GlassCard = ({
  children,
  className = "",
  hover = true,
  padding = "p-6 sm:p-8",
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: `vq-card ${hover ? "vq-card--interactive" : ""} ${className}`,
    style: {
      borderRadius: "var(--vq-r-lg)",
      background: "var(--vq-surface)",
      border: "1px solid var(--vq-line)"
    },
    ...props,
    children
  }
);
const InlineLink = ({ href, children, className = "" }) => /* @__PURE__ */ jsx(Link, { href, className: `vq-mc-inline ${className}`, children });
const RelatedPages = ({
  title = "Keep exploring",
  items = [],
  className = ""
}) => {
  if (!items || !items.length) return null;
  return /* @__PURE__ */ jsx("section", { className: `vq-mc-relatedpages ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "vq-container", children: [
    /* @__PURE__ */ jsx("div", { className: "vq-mc-rowhead", children: /* @__PURE__ */ jsx("h2", { className: "vq-h3", children: title }) }),
    /* @__PURE__ */ jsx("div", { className: "vq-grid vq-grid--4", children: items.map((item) => /* @__PURE__ */ jsxs(
      Link,
      {
        href: item.href,
        className: "vq-card vq-card--interactive vq-mc-lcard",
        children: [
          item.eyebrow && /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: item.eyebrow }),
          /* @__PURE__ */ jsx("span", { className: "vq-mc-lcard__title", children: item.label }),
          item.desc && /* @__PURE__ */ jsx("span", { className: "vq-mc-lcard__text", children: item.desc }),
          /* @__PURE__ */ jsxs("span", { className: "vq-mc-lcard__cta", style: { marginTop: "auto", paddingTop: "var(--vq-space-3)" }, children: [
            "Explore ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 14, "aria-hidden": "true" })
          ] })
        ]
      },
      item.href
    )) })
  ] }) });
};
const SITE = {
  build: [
    { label: "Blueprint", href: "/blueprint", desc: "Describe it. Approve the plan." },
    { label: "See a build", href: "/onboarding", desc: "Four minutes, start to live." },
    { label: "Watch it assemble", href: "/features", desc: "140+ modules in, only yours out." }
  ],
  run: [
    { label: "The register", href: "/pos", desc: "A till you compose yourself." },
    { label: "Documents", href: "/documents", desc: "Thirteen types, one editor." },
    { label: "VenSynQ", href: "/vensynq", desc: "Sell in five places, count once." }
  ],
  know: [
    { label: "The dashboard", href: "/dashboard-preview", desc: "58 readings, self-assembling." },
    { label: "The Reckoner", href: "/reckoner", desc: "One place a number is defined." },
    { label: "Core Ledger", href: "/ledger", desc: "One engine. Every number." }
  ],
  solutions: [
    { label: "Grocery & supermarket", href: "/solutions/grocery", desc: "Fast checkout, real margins." },
    { label: "Wholesale & distribution", href: "/solutions/wholesale", desc: "Credit terms and price tiers." },
    { label: "Pharmacy", href: "/solutions/pharmacy", desc: "Batch and expiry that hold the line." },
    { label: "Apparel & fashion", href: "/solutions/clothing", desc: "Size and colour, counted properly." },
    { label: "Electronics & hardware", href: "/solutions/electronics-store", desc: "Serial and IMEI, tracked to the unit." },
    { label: "Multi-branch chains", href: "/solutions/multi-store", desc: "One truth across every location." }
  ],
  compare: [
    { label: "VenQore vs Square", href: "/compare/venqore-vs-square" },
    { label: "VenQore vs Vyapar", href: "/compare/venqore-vs-vyapar" },
    { label: "All comparisons", href: "/compare" }
  ],
  resources: [
    { label: "Free tools", href: "/tools", desc: "Invoices, barcodes, calculators." },
    { label: "Documentation", href: "/docs", desc: "Guides and technical references." },
    { label: "Help centre", href: "/help", desc: "Step-by-step feature workflows." },
    { label: "Security", href: "/security", desc: "Isolation, roles and the record." },
    { label: "Blog", href: "/blog", desc: "Retail and accounting playbooks." },
    { label: "Roadmap", href: "/roadmap", desc: "What ships next." },
    { label: "Live demo", href: "/demo", desc: "Try it with sample data." }
  ],
  company: [
    { label: "About", href: "/about", desc: "Our mission, architecture, and principles." },
    { label: "How we prove it", href: "/ledger", desc: "The checks we publish." },
    { label: "Contact", href: "/contact", desc: "A person answers this one." },
    { label: "Partners", href: "/partners", desc: "Resell and implement." },
    { label: "Newsletter", href: "/subscribe", desc: "What changed, monthly." }
  ],
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Cookies", href: "/privacy#cookies" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Known Issues", href: "/known-issues" }
  ]
};
function MarketingLayout({ children, title, description, activeNav = "", canonical }) {
  useMarketingShell();
  const fullTitle = title ? /venqore/i.test(title) ? title : `${title} | VenQore` : "VenQore — The AI ERP Builder for POS, Stock & Accounting";
  const canonicalUrl = canonical || (typeof window !== "undefined" ? `https://venqore.com${window.location.pathname}` : "https://venqore.com");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "vq-site vq-app-body",
      style: {
        background: "var(--vq-bg)",
        color: "var(--vq-text)",
        minHeight: "100vh",
        overflow: "visible",
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsxs(Head, { children: [
          /* @__PURE__ */ jsx("title", { children: fullTitle }),
          description && /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
          /* @__PURE__ */ jsx("link", { rel: "canonical", href: canonicalUrl }),
          /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
          description && /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
          /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
          /* @__PURE__ */ jsx("meta", { property: "og:url", content: canonicalUrl }),
          /* @__PURE__ */ jsx("meta", { property: "og:image", content: "https://venqore.com/images/og/venqore-og.png" }),
          /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" })
        ] }),
        /* @__PURE__ */ jsx(SiteHeader, {}),
        /* @__PURE__ */ jsx("main", { id: "main", className: "vq-page vq-mkt-main", children }),
        /* @__PURE__ */ jsx(SiteFooter, {}),
        /* @__PURE__ */ jsx(CookieConsent, {})
      ]
    }
  );
}
export {
  AnimatedCounter,
  GlassCard,
  InlineLink,
  MagneticButton,
  RelatedPages,
  RevealOnScroll,
  SITE,
  SectionLabel,
  MarketingLayout as default,
  useScrollReveal
};
