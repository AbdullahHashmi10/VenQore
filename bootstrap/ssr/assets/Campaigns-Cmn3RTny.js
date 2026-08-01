import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { Megaphone, Plus, MessageCircle, Users, Mail } from "lucide-react";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function MarketingCampaignsIndex({ campaigns = [] }) {
  const [activeTab, setActiveTab] = useState("campaigns");
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Marketing & Campaigns", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "Marketing Campaigns" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Megaphone, { className: "text-pink-600 dark:text-pink-400", size: 24 }) }),
            "Marketing & Campaigns"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Engage customers via WhatsApp and Email campaigns" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "flex items-center gap-2 px-4 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors font-bold shadow-lg shadow-pink-500/20",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              "New Campaign"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Megaphone, { className: "text-pink-600 dark:text-pink-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Active Campaigns" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: (Array.isArray(campaigns) ? campaigns : campaigns?.data || []).filter((c) => c.status === "scheduled").length })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl", children: /* @__PURE__ */ jsx(MessageCircle, { className: "text-emerald-600 dark:text-emerald-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Messages Sent" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600", children: "0" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl", children: /* @__PURE__ */ jsx(Users, { className: "text-blue-600 dark:text-blue-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Audience Reach" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-blue-600", children: "0" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsx(Megaphone, { size: 64, className: "mx-auto text-slate-200 dark:text-slate-700 mb-6" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-800 dark:text-white mb-2", children: "No Campaigns Yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 max-w-md mx-auto mb-8", children: "Create your first marketing campaign to boost sales. Send offers, updates, and newsletters to your customers via WhatsApp or Email." }),
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
