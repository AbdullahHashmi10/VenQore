import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import ToolShell from "./ToolShell-BE5CpfRw.js";
import "./MarketingLayout-CMiC1Bik.js";
import "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ToolsSidebar-BvvbAU_Q.js";
import "./HousePromo-CAVKWeBy.js";
function ToolsIndex({ toolGroups = [] }) {
  const liveCount = toolGroups.flatMap((g) => g.tools).filter((t) => t.status === "live").length;
  return /* @__PURE__ */ jsxs(
    ToolShell,
    {
      title: "Free Retail Tools — Barcode Generator & More | VenQore",
      metaDescription: "Free tools for retail and small business: barcode generator, label sheets, invoice templates and more. No signup required, no watermark.",
      eyebrow: "Free Tools",
      h1: "Free Retail Tools",
      answer: "Free, practical tools for retail and small business owners — no signup, no watermark, no ads. Built by the team behind VenQore, an offline-first POS and ERP with verified double-entry accounting.",
      toolGroups,
      cta: {
        headline: "Stop doing this manually.",
        subtext: "VenQore automates the busywork on every sale and keeps a balanced set of books while it does."
      },
      children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-10", children: toolGroups.map((group) => /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4", children: group.label }),
          /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: group.tools.map((tool) => {
            const isLive = tool.status === "live" && tool.href;
            const inner = /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("h3", { className: `text-base font-black ${isLive ? "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300" : "text-slate-400 dark:text-slate-600"} transition-colors`, children: tool.name }),
                !isLive && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5", children: "Soon" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: `text-sm leading-relaxed ${isLive ? "text-slate-600 dark:text-slate-400" : "text-slate-400 dark:text-slate-600"}`, children: tool.description })
            ] });
            const base = "p-5 rounded-2xl border transition-all group";
            return isLive ? /* @__PURE__ */ jsx(
              Link,
              {
                href: tool.href,
                className: `${base} bg-slate-900/[0.02] dark:bg-white/[0.03] border-slate-900/[0.06] dark:border-white/10 hover:border-indigo-400/40 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]`,
                children: inner
              },
              tool.slug
            ) : /* @__PURE__ */ jsx(
              "div",
              {
                className: `${base} bg-slate-900/[0.01] dark:bg-white/[0.015] border-slate-900/[0.04] dark:border-white/[0.06] cursor-default`,
                children: inner
              },
              tool.slug
            );
          }) })
        ] }, group.key)) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-10 text-sm text-slate-500 dark:text-slate-500", children: [
          liveCount,
          " ",
          liveCount === 1 ? "tool is" : "tools are",
          " live now — the rest are on the way. No ads, no trackers beyond basic analytics."
        ] })
      ]
    }
  );
}
export {
  ToolsIndex as default
};
