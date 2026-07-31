import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { ArrowLeft, Printer, Search, Filter, MoreVertical } from "lucide-react";
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
function CashHistory({ balance, ledger, store }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const filteredLedger = useMemo(() => {
    let data = [...ledger];
    if (filterType === "in") data = data.filter((item) => item.mode === "in");
    if (filterType === "out") data = data.filter((item) => item.mode === "out");
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      data = data.filter(
        (item) => item.name.toLowerCase().includes(low) || item.type.toLowerCase().includes(low) || item.description.toLowerCase().includes(low)
      );
    }
    return data;
  }, [ledger, filterType, searchTerm]);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Cash Ledger", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Cash In Hand" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-[#f8f9fa] dark:bg-slate-950 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.funds.index", { store_slug: store.slug }), className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Cash In Hand" }),
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm", children: [
              getCurrencySymbol(),
              " ",
              balance.toLocaleString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { className: "p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg", children: /* @__PURE__ */ jsx(Printer, { size: 18 }) }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-[#d11124] text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition-colors", children: "Adjust Cash" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-slate-500 uppercase tracking-wider", children: "Transactions" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 md:w-80", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search Transactions",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setFilterType("all"), className: `px-3 py-1 text-xs font-bold rounded ${filterType === "all" ? "bg-slate-100 dark:bg-slate-800 text-indigo-600" : "text-slate-500"}`, children: "All" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setFilterType("in"), className: `px-3 py-1 text-xs font-bold rounded ${filterType === "in" ? "bg-emerald-50 text-emerald-600" : "text-slate-500"}`, children: "In" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setFilterType("out"), className: `px-3 py-1 text-xs font-bold rounded ${filterType === "out" ? "bg-rose-50 text-rose-600" : "text-slate-500"}`, children: "Out" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden px-6 pb-6 mt-2", children: /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full", children: /* @__PURE__ */ jsx("div", { className: "overflow-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-[#fcfdfe] dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            "Type ",
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "opacity-0 group-hover:opacity-100" })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            "Name ",
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "opacity-0 group-hover:opacity-100" })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            "Date ",
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "opacity-0 group-hover:opacity-100" })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight text-right w-48", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            "Amount ",
            /* @__PURE__ */ jsx(Filter, { size: 12, className: "opacity-0 group-hover:opacity-100" })
          ] }) }),
          /* @__PURE__ */ jsx("th", { className: "w-12" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
          filteredLedger.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: `${idx % 2 === 0 ? "bg-white" : "bg-[#fcfdfe]"} dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group`, children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 border-r border-slate-50 dark:border-slate-800", children: item.type }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 border-r border-slate-50 dark:border-slate-800", children: [
              item.name,
              item.description && item.description !== item.name && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1", children: item.description })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-50 dark:border-slate-800", children: item.date }),
            /* @__PURE__ */ jsxs("td", { className: `px-4 py-4 text-right text-sm font-black tabular-nums ${item.mode === "in" ? "text-[#10b981]" : "text-[#f43f5e]"}`, children: [
              getCurrencySymbol(),
              " ",
              item.amount.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-right", children: /* @__PURE__ */ jsx("button", { className: "p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }) })
          ] }, item.id)),
          filteredLedger.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-20 text-center text-slate-400 italic text-sm", children: "No transactions found in this period." }) })
        ] })
      ] }) }) }) })
    ] })
  ] });
}
export {
  CashHistory as default
};
