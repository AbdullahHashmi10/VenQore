import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { MousePointerClick, X, ChevronDown } from "lucide-react";
import MarketingLayout, { SectionLabel } from "./MarketingLayout-cwTDSbNB.js";
import ToolsSidebar from "./ToolsSidebar-UoByrcvz.js";
import HousePromo from "./HousePromo-DidRidkH.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
const EDIT_HINT_DISMISSED_KEY = "venqore_tools_edit_hint_dismissed_v1";
function EditHintBanner() {
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(EDIT_HINT_DISMISSED_KEY) === "1");
    } catch (e) {
      setDismissed(false);
    }
  }, []);
  useEffect(() => {
    const dismiss2 = () => {
      setDismissed(true);
      try {
        localStorage.setItem(EDIT_HINT_DISMISSED_KEY, "1");
      } catch (e) {
      }
    };
    window.addEventListener("venqore-tool-edited", dismiss2);
    return () => window.removeEventListener("venqore-tool-edited", dismiss2);
  }, []);
  if (dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(EDIT_HINT_DISMISSED_KEY, "1");
    } catch (e) {
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "vq-tools__hint", role: "note", children: [
    /* @__PURE__ */ jsx(MousePointerClick, { size: 18, "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("span", { children: [
      /* @__PURE__ */ jsx("strong", { children: "This preview is the editor." }),
      " Click any text below — the business name, dates, line items, anything — to change it. What you see is exactly what downloads."
    ] }),
    /* @__PURE__ */ jsx("button", { type: "button", onClick: dismiss, "aria-label": "Dismiss", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
  ] });
}
function FAQItem({ q, a }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "vq-tools__faq-item", "data-open": isExpanded ? "true" : "false", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setIsExpanded(!isExpanded),
        "aria-expanded": isExpanded,
        className: "vq-tools__faq-q",
        children: [
          /* @__PURE__ */ jsx("span", { children: q }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 20, "aria-hidden": "true" })
        ]
      }
    ),
    isExpanded && /* @__PURE__ */ jsx("p", { className: "vq-tools__faq-a", children: a })
  ] });
}
function ToolShell({
  title,
  metaDescription,
  eyebrow,
  h1,
  answer,
  children,
  faqs = [],
  cta,
  related = [],
  toolGroups = [],
  currentSlug = null,
  showPromo = true,
  wide = false
}) {
  return /* @__PURE__ */ jsx(MarketingLayout, { title, description: metaDescription, children: /* @__PURE__ */ jsx("div", { className: `vq-tools ${wide ? "vq-tools--wide" : ""}`, children: /* @__PURE__ */ jsxs("div", { className: `vq-tools__layout ${showPromo ? "vq-tools__layout--promo" : ""}`, children: [
    /* @__PURE__ */ jsx(ToolsSidebar, { groups: toolGroups, currentSlug }),
    /* @__PURE__ */ jsxs("div", { className: "vq-tools__main", children: [
      /* @__PURE__ */ jsxs("header", { className: "vq-tools__head", children: [
        eyebrow && /* @__PURE__ */ jsx(SectionLabel, { children: eyebrow }),
        /* @__PURE__ */ jsx("h1", { className: "vq-h1", children: h1 }),
        answer && /* @__PURE__ */ jsx("p", { className: "vq-lede vq-tools__answer", children: answer })
      ] }),
      wide && currentSlug && /* @__PURE__ */ jsx(EditHintBanner, {}),
      /* @__PURE__ */ jsx("div", { className: "vq-tool-ui", children }),
      faqs.length > 0 && /* @__PURE__ */ jsxs("section", { className: "vq-tools__block", "aria-labelledby": "tool-faq", children: [
        /* @__PURE__ */ jsx("h2", { id: "tool-faq", className: "vq-h2", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "vq-tools__faq", children: faqs.map((qa) => /* @__PURE__ */ jsx(FAQItem, { q: qa.q, a: qa.a }, qa.q)) })
      ] }),
      cta && /* @__PURE__ */ jsxs("section", { className: "vq-tools__block vq-card vq-card--xl vq-tools__cta", children: [
        /* @__PURE__ */ jsx("h2", { className: "vq-h2", children: cta.headline }),
        cta.subtext && /* @__PURE__ */ jsx("p", { children: cta.subtext }),
        /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3 vq-wrap vq-tools__cta-actions", children: [
          /* @__PURE__ */ jsx(Link, { href: "/build-workspace", className: "vq-btn vq-btn--primary vq-btn--lg", children: "Build your system free" }),
          /* @__PURE__ */ jsx(Link, { href: "/demo", className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Try the live demo" })
        ] })
      ] }),
      related.length > 0 && /* @__PURE__ */ jsxs("section", { className: "vq-tools__block", "aria-labelledby": "tool-related", children: [
        /* @__PURE__ */ jsx("h2", { id: "tool-related", className: "vq-h3", children: "Related tools" }),
        /* @__PURE__ */ jsx("div", { className: "vq-row vq-gap-3 vq-wrap", children: related.map((tool) => /* @__PURE__ */ jsx(Link, { href: tool.href, className: "vq-chip", children: tool.label }, tool.href)) })
      ] })
    ] }),
    showPromo && /* @__PURE__ */ jsx(HousePromo, {})
  ] }) }) });
}
export {
  ToolShell as default
};
