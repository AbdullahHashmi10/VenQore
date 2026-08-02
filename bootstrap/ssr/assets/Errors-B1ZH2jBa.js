import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, ShieldAlert, Sparkles, CheckCircle, Copy, Terminal, MonitorSmartphone, Bug } from "lucide-react";
import { P as PlatformShell } from "./PlatformShell-VlY6tyr6.js";
import "./PlatformLayout-Bffb0vmW.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-Bi1AXgyR.js";
function Errors({ errors, filters }) {
  const [selected, setSelected] = useState(null);
  const [resolveNote, setResolveNote] = useState("");
  const statusFilter = filters.resolved ? "resolved" : "open";
  function setFilter(resolved, type = filters.type) {
    router.get(route("platform.health.errors"), { resolved, type }, { preserveState: true });
  }
  function resolveError(errId = selected?.id) {
    if (!errId) return;
    router.post(route("platform.health.errors.resolve", errId), { note: resolveNote }, {
      onSuccess: () => {
        if (selected?.id === errId) {
          setSelected(null);
          setResolveNote("");
        }
      }
    });
  }
  function resolveAll() {
    if (!confirm("Mark ALL current open errors as resolved?")) return;
    router.post(route("platform.health.errors.resolve-all"), {}, {
      onSuccess: () => setSelected(null)
    });
  }
  function detectFixes() {
    router.post(route("platform.health.errors.detect-fixes"), {}, {
      onFinish: () => setSelected(null)
    });
  }
  const copyToClipboard = (err) => {
    const text = `Error: ${err.message}
File: ${err.file || "N/A"}:${err.line || "N/A"}
URL: ${err.url || "N/A"}
Store: ${err.tenant?.name || "N/A"}
User: ${err.user?.name || "N/A"}
Occurrences: ${err.occurrence_count}x
Last Seen: ${new Date(err.last_seen_at).toLocaleString()}

Stack Trace:
${err.stack_trace || "N/A"}`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Error details copied to clipboard!");
    });
  };
  const copyAllErrors = () => {
    if (errors.data.length === 0) return;
    const text = errors.data.map((err, idx) => {
      return `--- ERROR #${idx + 1} ---
Error: ${err.message}
File: ${err.file || "N/A"}:${err.line || "N/A"}
URL: ${err.url || "N/A"}
Store: ${err.tenant?.name || "N/A"}
User: ${err.user?.name || "N/A"}
Occurrences: ${err.occurrence_count}x
Last Seen: ${new Date(err.last_seen_at).toLocaleString()}`;
    }).join("\n\n========================================\n\n");
    navigator.clipboard.writeText(text).then(() => {
      alert("All error summaries copied to clipboard!");
    });
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "System Health", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Error Logs - System Health" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col relative overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "32px",
        borderRadius: "24px 24px 0 0",
        marginBottom: 8
      }, className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx(Link, { href: route("platform.dashboard"), className: "p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(ShieldAlert, { className: "text-red-500", size: 24 }),
              /* @__PURE__ */ jsx("h1", { className: "text-3xl font-extrabold text-white tracking-tight", children: "System Health" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-medium mt-1", children: "Platform-wide frontend and backend logs." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setFilter(0), className: `px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === "open" ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5" : "text-slate-500 hover:text-white hover:bg-white/5"}`, children: "Open Errors" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setFilter(1), className: `px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === "resolved" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "text-slate-500 hover:text-white hover:bg-white/5"}`, children: "Resolved" })
        ] }),
        errors.data.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          statusFilter === "open" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "relative group/hint", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    if (!confirm('⚠️ HEURISTIC SCAN\n\nThis uses file modification times to guess which errors may be fixed. It does NOT confirm errors are actually resolved.\n\nAuto-resolved items will be labelled "[HEURISTIC]" — please verify each one manually.\n\nProceed?')) return;
                    detectFixes();
                  },
                  className: "bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/25 flex items-center gap-2",
                  title: "Heuristic only — estimates fixes by file modification times. Verify manually.",
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 16 }),
                    "Scan (Heuristic)"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hint:block z-50 w-64 bg-amber-900/95 text-amber-100 text-xs rounded-xl p-3 border border-amber-600/30 shadow-xl pointer-events-none", children: [
                "⚠️ ",
                /* @__PURE__ */ jsx("strong", { children: "Heuristic only." }),
                " Marks errors as likely-fixed if the source file was modified after the error was last seen. Always verify manually — not a guaranteed fix."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: resolveAll,
                className: "bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle, { size: 16 }),
                  "Resolve All"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: copyAllErrors,
              className: "bg-slate-600 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-slate-500/25 flex items-center gap-2",
              title: "Copy all currently listed errors to clipboard",
              children: [
                /* @__PURE__ */ jsx(Copy, { size: 16 }),
                "Copy All"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar flex gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 max-w-4xl flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setFilter(filters.resolved, null), className: `px-3 py-1.5 rounded-lg text-xs font-bold border ${!filters.type ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300" : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`, children: "All Types" }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(filters.resolved, "backend"), className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === "backend" ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300" : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`, children: [
              /* @__PURE__ */ jsx(Terminal, { size: 12 }),
              " Backend"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(filters.resolved, "frontend"), className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === "frontend" ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300" : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`, children: [
              /* @__PURE__ */ jsx(MonitorSmartphone, { size: 12 }),
              " Frontend"
            ] })
          ] }),
          errors.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "mx-auto text-emerald-500 mb-4 opacity-50", size: 48 }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-700 dark:text-slate-300", children: "Clean slate" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
              "No ",
              statusFilter,
              " tracking notifications found."
            ] })
          ] }) : errors.data.map((err) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => setSelected(err),
              className: `p-5 rounded-2xl border cursor-pointer transition-all group relative ${selected?.id === err.id ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50 shadow-md" : "bg-white border-slate-200 hover:border-red-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600"}`,
              children: [
                !err.is_resolved && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      resolveError(err.id);
                    },
                    className: "absolute top-4 right-4 p-2 rounded-xl bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 z-10",
                    title: "Quick Resolve",
                    children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      copyToClipboard(err);
                    },
                    className: `absolute top-4 ${!err.is_resolved ? "right-14" : "right-4"} p-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-slate-500/20 hover:scale-105 active:scale-95 z-10`,
                    title: "Copy Error Details",
                    children: /* @__PURE__ */ jsx(Copy, { size: 16 })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    err.type === "frontend" ? /* @__PURE__ */ jsx(MonitorSmartphone, { className: "text-amber-500", size: 18 }) : /* @__PURE__ */ jsx(Terminal, { className: "text-red-500", size: 18 }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 uppercase tracking-wider", children: err.type }),
                    err.status_code && /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", children: [
                      "HTTP ",
                      err.status_code
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", children: [
                      err.occurrence_count,
                      "x Events"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `text-xs font-mono transition-all ${selected?.id === err.id ? "pr-8" : ""} text-slate-400`, children: new Date(err.last_seen_at).toLocaleString() })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-slate-200 truncate pr-12", children: err.message }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-xs text-slate-500", children: [
                  /* @__PURE__ */ jsx("div", { className: "truncate max-w-md", children: err.file ? `${err.file}:${err.line}` : err.url || "Unknown Source" }),
                  err.tenant && /* @__PURE__ */ jsxs("div", { className: "font-bold shrink-0 ml-4 py-1 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-indigo-500" }),
                    err.tenant.name
                  ] })
                ] })
              ]
            },
            err.id
          )),
          errors.last_page > 1 && /* @__PURE__ */ jsx("div", { className: "flex gap-2 justify-center mt-6" })
        ] }),
        selected && /* @__PURE__ */ jsxs("div", { className: "w-96 flex-shrink-0 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl sticky top-0 h-fit flex flex-col max-h-[calc(100vh-140px)]", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Bug, { className: "text-red-500" }),
              "Error Details"
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => copyToClipboard(selected),
                className: "p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all hover:scale-105",
                title: "Copy Details",
                children: /* @__PURE__ */ jsx(Copy, { size: 16 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto hide-scrollbar space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Message" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300 break-words", children: selected.message })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Store / Tenant" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: selected.tenant?.name || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "User" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: selected.user?.name || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "URL / Endpoint" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs font-mono text-slate-600 dark:text-slate-400 break-all bg-slate-50 dark:bg-slate-900 p-2 rounded", children: selected.url || "N/A" })
              ] })
            ] }),
            selected.stack_trace && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Stack Trace Snippet" }),
              /* @__PURE__ */ jsx("pre", { className: "text-2xs font-mono whitespace-pre-wrap bg-slate-900 text-red-300 p-3 rounded-xl overflow-x-auto border border-slate-800 max-h-48", children: selected.stack_trace })
            ] }),
            selected.is_resolved && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1", children: "Resolution Note" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-emerald-800 dark:text-emerald-200", children: selected.resolution_note || "Resolved without a specific note." })
            ] })
          ] }),
          !selected.is_resolved && /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-slate-100 dark:border-slate-700", children: [
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: resolveNote,
                onChange: (e) => setResolveNote(e.target.value),
                placeholder: "Resolution note (optional)",
                className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 mb-4 text-slate-800 dark:text-slate-200",
                rows: "2"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: resolveError,
                className: "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex justify-center items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
                  "Mark as Resolved"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Errors as default
};
