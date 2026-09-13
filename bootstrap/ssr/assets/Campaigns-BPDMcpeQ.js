import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Megaphone, Plus, MessageCircle, Users, Mail } from "lucide-react";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function MarketingCampaignsIndex({ campaigns = [] }) {
  const [activeTab, setActiveTab] = useState("campaigns");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Marketing & Campaigns", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "Marketing Campaigns" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-100 dark:bg-brand-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Megaphone, { className: "text-brand-600 dark:text-brand-400", size: 24 }) }),
            "Marketing & Campaigns"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: "Engage customers via WhatsApp and Email campaigns" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-ink rounded-xl hover:bg-brand-700 transition-colors font-bold shadow-lg shadow-brand-500/20",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              "New Campaign"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl p-5 border border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Megaphone, { className: "text-brand-600 dark:text-brand-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted uppercase font-bold", children: "Active Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: (Array.isArray(campaigns) ? campaigns : campaigns?.data || []).filter((c) => c.status === "scheduled").length })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl p-5 border border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl", children: /* @__PURE__ */ jsx(MessageCircle, { className: "text-emerald-600 dark:text-emerald-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted uppercase font-bold", children: "Messages Sent" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600", children: "0" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl p-5 border border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Users, { className: "text-blue-600 dark:text-blue-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted uppercase font-bold", children: "Audience Reach" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-blue-600", children: "0" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl border border-line min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsx(Megaphone, { size: 64, className: "mx-auto text-neutral-200 dark:text-ink-secondary mb-6" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink mb-2", children: "No Campaigns Yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted max-w-md mx-auto mb-8", children: "Create your first marketing campaign to boost sales. Send offers, updates, and newsletters to your customers via WhatsApp or Email." }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-4", children: [
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-bold border border-emerald-200 dark:border-emerald-800", children: [
            /* @__PURE__ */ jsx(MessageCircle, { size: 20 }),
            "WhatsApp Campaign"
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-bold border border-blue-200 dark:border-blue-800", children: [
            /* @__PURE__ */ jsx(Mail, { size: 20 }),
            "Email Campaign"
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  MarketingCampaignsIndex as default
};
