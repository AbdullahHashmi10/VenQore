import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { P as PlatformShell } from "./PlatformShell-Cgr7ZgUy.js";
import { Head } from "@inertiajs/react";
import { Layout, Database, Mail, Search, RefreshCw, User } from "lucide-react";
import axios from "axios";
import "./PlatformLayout-By7HlVQA.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./ui-CcDUonPh.js";
import "./runtime-DwSFgQZq.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
function Index({ stats }) {
  const [subscribers, setSubscribers] = useState({ cloud: [], digital: [], all: [] });
  const [loading, setLoading] = useState(false);
  const [activeList, setActiveList] = useState("cloud");
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    loadSubscribers();
  }, []);
  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/VenQore/newsletter-hub/subscribers");
      if (res.data.success) {
        setSubscribers({
          cloud: res.data.cloud,
          digital: res.data.digital,
          all: res.data.all
        });
      }
    } catch (err) {
      console.error("Failed to load subscribers", err);
    } finally {
      setLoading(false);
    }
  };
  const getActiveData = () => {
    if (activeList === "cloud") return subscribers.cloud;
    if (activeList === "digital") return subscribers.digital;
    return subscribers.all;
  };
  const filteredData = getActiveData().filter(
    (s) => s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return /* @__PURE__ */ jsxs(PlatformShell, { mode: "admin", activeMenu: "Newsletter Hub", title: "Newsletter & Subscribers Hub", children: [
    /* @__PURE__ */ jsx(Head, { title: "Newsletter Hub" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Newsletter Subscription Lists" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm max-w-xl", children: "Track the growth of your cloud platform insights and offline digital marketplace standalone packages update lists." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 self-stretch md:self-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Cloud List" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-white", children: stats.cloud_count })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Digital List" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-brand-400", children: stats.digital_count })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1", children: "Gross Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-emerald-400", children: stats.total_count })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-neutral-800 gap-6", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveList("cloud"),
            className: `pb-4 text-sm font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "cloud" ? "border-brand-500 text-white" : "border-transparent text-ink-muted hover:text-neutral-300"}`,
            children: [
              /* @__PURE__ */ jsx(Layout, { size: 16 }),
              "Cloud Website Subscribers"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveList("digital"),
            className: `pb-4 text-sm font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "digital" ? "border-brand-500 text-white" : "border-transparent text-ink-muted hover:text-neutral-300"}`,
            children: [
              /* @__PURE__ */ jsx(Database, { size: 16 }),
              "Digital Products Subscribers"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveList("all"),
            className: `pb-4 text-sm font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "all" ? "border-brand-500 text-white" : "border-transparent text-ink-muted hover:text-neutral-300"}`,
            children: [
              /* @__PURE__ */ jsx(Mail, { size: 16 }),
              "All Roster list"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative max-w-md w-full", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 text-ink-muted", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "Search by name or email...",
                className: "w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-ink-secondary outline-none focus:border-brand-500/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: loadSubscribers,
              disabled: loading,
              className: "p-3 bg-sunken border border-neutral-800 hover:bg-interactive-hover rounded-xl transition-colors text-ink-muted hover:text-white",
              children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: loading ? "animate-spin" : "" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border border-neutral-800 rounded-2xl overflow-hidden bg-sunken", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs divide-y divide-neutral-800", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-sunken text-ink-muted font-bold uppercase tracking-wider", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Subscriber Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Email Address" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Preference Interest" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Subscribed At" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-800/40 text-neutral-200", children: loading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-8 text-center text-ink-muted", children: "Loading subscribers list..." }) }) : filteredData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-8 text-center text-ink-muted", children: "No subscribers in this list query." }) }) : filteredData.map((sub) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(User, { size: 14, className: "text-ink-muted" }),
              /* @__PURE__ */ jsx("span", { children: sub.name || "—" })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: sub.email }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${sub.interest === "digital" ? "bg-brand-500/10 border-brand-500/20 text-brand-400" : sub.interest === "cloud" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`, children: sub.interest === "both" ? "Both updates" : sub.interest === "digital" ? "Digital products" : "Cloud website" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-3xs", children: sub.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-ink-muted", children: new Date(sub.created_at).toLocaleString() })
          ] }, sub.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Index as default
};
