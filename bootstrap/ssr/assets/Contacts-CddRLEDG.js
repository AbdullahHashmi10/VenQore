import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, MessagesSquare, CheckCircle, Clock, Mail, CheckCircle2 } from "lucide-react";
import { P as PlatformShell } from "./PlatformShell-a5p7K_Zs.js";
import "./PlatformLayout-CV-DtcbF.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ui-Dd6dJcJr.js";
function Contacts({ submissions, filters }) {
  const [selected, setSelected] = useState(null);
  const statusFilter = filters.status || "new";
  function setFilter(status) {
    router.get(route("platform.health.contacts"), { status }, { preserveState: true });
  }
  function markAsRead() {
    if (!selected) return;
    router.post(route("platform.health.contacts.read", selected.id), {}, {
      onSuccess: () => {
        const updated = { ...selected, status: "read", read_at: (/* @__PURE__ */ new Date()).toISOString() };
        setSelected(updated);
      }
    });
  }
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "Contact Desk", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Contact Forms - System Health" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col relative overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(99,102,241,0.05) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "32px",
        borderRadius: "24px 24px 0 0",
        marginBottom: 8
      }, className: "flex-shrink-0 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx(Link, { href: route("platform.dashboard"), className: "p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(MessagesSquare, { className: "text-sky-500", size: 24 }),
              /* @__PURE__ */ jsx("h1", { className: "text-3xl font-extrabold text-white tracking-tight", children: "Contact Desk" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-medium mt-1", children: "Queries submitted via marketing pages." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setFilter("new"), className: `px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === "new" ? "bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-lg shadow-sky-500/5" : "text-slate-500 hover:text-white hover:bg-white/5"}`, children: "Unread" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setFilter("read"), className: `px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === "read" ? "bg-white/10 text-white border border-white/10 shadow-lg" : "text-slate-500 hover:text-white hover:bg-white/5"}`, children: "Read" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar flex gap-8", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 max-w-4xl flex flex-col gap-4", children: submissions.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "mx-auto text-sky-500 mb-4 opacity-50", size: 48 }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-700 dark:text-slate-300", children: "Inbox Zero 🎉" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
            "No ",
            statusFilter,
            " contact submissions right now."
          ] })
        ] }) : submissions.data.map((sub) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setSelected(sub),
            className: `p-5 rounded-2xl border cursor-pointer transition-all ${selected?.id === sub.id ? "bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-900/50 shadow-md" : "bg-white border-slate-200 hover:border-sky-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600"} ${sub.status === "new" ? "border-l-4 border-l-sky-500" : ""}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-slate-200", children: sub.name }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
                    "<",
                    sub.email,
                    ">"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 font-medium flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 12 }),
                  " ",
                  new Date(sub.created_at).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-700 dark:text-slate-300 mb-2 truncate", children: sub.subject || "No Subject" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 truncate max-w-2xl", children: sub.message })
            ]
          },
          sub.id
        )) }),
        selected && /* @__PURE__ */ jsxs("div", { className: "w-[400px] flex-shrink-0 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl sticky top-0 h-fit flex flex-col max-h-[calc(100vh-140px)]", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4", children: [
            /* @__PURE__ */ jsx(Mail, { className: "text-sky-500" }),
            "Message Details"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto hide-scrollbar space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Sender" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: selected.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Email" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsx("a", { href: `mailto:${selected.email}`, className: "text-sky-600 hover:underline", children: selected.email }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Company" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: selected.company || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-1", children: "Date" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: new Date(selected.created_at).toLocaleString() })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-slate-400 uppercase mb-2", children: "Message" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-normal text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed", children: selected.message })
            ] })
          ] }),
          selected.status === "new" && /* @__PURE__ */ jsx("div", { className: "mt-6 pt-6 border-t border-slate-100 dark:border-slate-700", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: markAsRead,
              className: "w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }),
                "Mark as Read"
              ]
            }
          ) })
        ] })
      ] })
    ] })
  ] });
}
export {
  Contacts as default
};
