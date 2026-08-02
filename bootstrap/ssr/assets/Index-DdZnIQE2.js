import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { P as PlatformShell } from "./PlatformShell-VlY6tyr6.js";
import { Head } from "@inertiajs/react";
import { Layout, Database, Mail, Search, RefreshCw, User } from "lucide-react";
import axios from "axios";
import "./PlatformLayout-Bffb0vmW.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-Bi1AXgyR.js";
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
      /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white mb-2", children: "Newsletter Subscription Lists" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm max-w-xl", children: "Track the growth of your cloud platform insights and offline digital marketplace standalone packages update lists." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 self-stretch md:self-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-slate-500 uppercase tracking-widest mb-1", children: "Cloud List" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-white", children: stats.cloud_count })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-slate-500 uppercase tracking-widest mb-1", children: "Digital List" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-indigo-400", children: stats.digital_count })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-slate-500 uppercase tracking-widest mb-1", children: "Gross Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-emerald-400", children: stats.total_count })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-slate-800 gap-6", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveList("cloud"),
            className: `pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "cloud" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
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
            className: `pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "digital" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
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
            className: `pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeList === "all" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
            children: [
              /* @__PURE__ */ jsx(Mail, { size: 16 }),
              "All Roster list"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative max-w-md w-full", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3 text-slate-500", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "Search by name or email...",
                className: "w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: loadSubscribers,
              disabled: loading,
              className: "p-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white",
              children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: loading ? "animate-spin" : "" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs divide-y divide-slate-800", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-950 text-slate-400 font-bold uppercase tracking-wider", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Subscriber Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Email Address" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Preference Interest" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Subscribed At" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-800/40 text-slate-200", children: loading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-8 text-center text-slate-500", children: "Loading subscribers list..." }) }) : filteredData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "px-6 py-8 text-center text-slate-500", children: "No subscribers in this list query." }) }) : filteredData.map((sub) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-800/20", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(User, { size: 14, className: "text-slate-500" }),
              /* @__PURE__ */ jsx("span", { children: sub.name || "—" })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: sub.email }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${sub.interest === "digital" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : sub.interest === "cloud" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`, children: sub.interest === "both" ? "Both updates" : sub.interest === "digital" ? "Digital products" : "Cloud website" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-3xs", children: sub.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-500", children: new Date(sub.created_at).toLocaleString() })
          ] }, sub.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Index as default
};
