import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { MousePointerClick, X } from "lucide-react";
import MarketingLayout, { SectionLabel } from "./MarketingLayout-CMiC1Bik.js";
import ToolsSidebar from "./ToolsSidebar-BvvbAU_Q.js";
import HousePromo from "./HousePromo-CAVKWeBy.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
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
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-400/20 text-sm text-indigo-700 dark:text-indigo-300", children: [
    /* @__PURE__ */ jsx(MousePointerClick, { size: 16, className: "shrink-0" }),
    /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("strong", { className: "font-bold", children: "This preview is the editor." }),
      " Click any text below — the business name, dates, line items, anything — to change it. What you see is exactly what downloads."
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: dismiss,
        "aria-label": "Dismiss",
        className: "shrink-0 p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors",
        children: /* @__PURE__ */ jsx(X, { size: 14 })
      }
    )
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
  return /* @__PURE__ */ jsx(MarketingLayout, { title, description: metaDescription, children: /* @__PURE__ */ jsx("div", { className: "pt-32 md:pt-36 pb-24 px-2 sm:px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-full mx-auto px-2 md:px-4 flex gap-4 md:gap-6", children: [
    /* @__PURE__ */ jsx(ToolsSidebar, { groups: toolGroups, currentSlug }),
    /* @__PURE__ */ jsxs("div", { className: `flex-1 min-w-0 ${wide ? "max-w-4xl" : "max-w-7xl"}`, children: [
      eyebrow && /* @__PURE__ */ jsx(SectionLabel, { children: eyebrow }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-black tracking-tight mb-6 text-slate-900 dark:text-white", children: h1 }),
      answer && /* @__PURE__ */ jsx("p", { className: "text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10", children: answer }),
      wide && /* @__PURE__ */ jsx(EditHintBanner, {}),
      /* @__PURE__ */ jsx("div", { className: "mb-16", children }),
      faqs.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black mb-6 text-slate-900 dark:text-white", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: faqs.map((qa) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-5 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10",
            children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white mb-2", children: qa.q }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed", children: qa.a })
            ]
          },
          qa.q
        )) })
      ] }),
      cta && /* @__PURE__ */ jsxs("section", { className: "mb-16 p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/20 dark:to-violet-600/10 border border-indigo-500/20 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-900 dark:text-white mb-2", children: cta.headline }),
        cta.subtext && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mb-6", children: cta.subtext }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/pricing",
              className: "px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-[#05030f] rounded-full text-sm font-black uppercase tracking-wide hover:scale-105 transition-transform",
              children: "Start your 14-day free trial"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/demo",
              className: "px-6 py-3 bg-slate-900/[0.05] dark:bg-white/[0.06] border border-slate-900/15 dark:border-white/15 text-slate-900 dark:text-white rounded-full text-sm font-black uppercase tracking-wide hover:bg-slate-900/[0.1] dark:hover:bg-white/[0.1] transition-colors",
              children: "Try the live demo"
            }
          )
        ] })
      ] }),
      related.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-slate-600 dark:text-slate-300 mb-4", children: "Related tools" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3", children: related.map((tool) => /* @__PURE__ */ jsx(
          Link,
          {
            href: tool.href,
            className: "px-5 py-2.5 rounded-full bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-indigo-400/40 transition-colors",
            children: tool.label
          },
          tool.href
        )) })
      ] })
    ] }),
    showPromo && /* @__PURE__ */ jsx(HousePromo, {})
  ] }) }) });
}
export {
  ToolShell as default
};
