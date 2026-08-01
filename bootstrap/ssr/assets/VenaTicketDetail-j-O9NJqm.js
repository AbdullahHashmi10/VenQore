import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { Zap, User, AlertCircle, Bot, ArrowLeft, MessageSquare } from "lucide-react";
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
const ESCALATION_CONFIG = {
  ai_failure: { label: "AI Failure", icon: Bot, color: "text-rose-500" },
  billing_or_complex: { label: "Billing / Complex", icon: AlertCircle, color: "text-amber-500" },
  user_requested: { label: "User Requested", icon: User, color: "text-blue-500" },
  repeated_failure: { label: "Repeated Failure", icon: Zap, color: "text-orange-500" }
};
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];
function parseChatTranscript(message) {
  const transcriptStart = message.indexOf("--- CHAT TRANSCRIPT ---");
  if (transcriptStart === -1) {
    return { header: message, lines: [] };
  }
  const header = message.slice(0, transcriptStart).trim();
  const transcriptRaw = message.slice(transcriptStart + "--- CHAT TRANSCRIPT ---".length).trim();
  const lines = transcriptRaw.split("\n").filter(Boolean).map((line) => {
    const match = line.match(/^\[([^\]]+)\]\s+(\w+):\s+(.+)$/);
    if (match) {
      return { time: match[1], sender: match[2], body: match[3] };
    }
    return { time: "", sender: "", body: line };
  });
  return { header, lines };
}
function VenaTicketDetail({ ticket, context }) {
  const { store } = usePage().props;
  const isPlatform = context === "platform";
  const { header, lines } = parseChatTranscript(ticket.message || "");
  const escalationCfg = ESCALATION_CONFIG[ticket.escalation_type];
  const handleStatusChange = (newStatus) => {
    const routeName = isPlatform ? "platform.vena.ticket.status" : "store.admin.vena.ticket.status";
    const params = isPlatform ? { ticket: ticket.id } : { store_slug: store?.slug, ticket: ticket.id };
    router.post(route(routeName, params), { status: newStatus }, { preserveScroll: true });
  };
  const backRoute = isPlatform ? route("platform.vena.tickets") : route("store.admin.vena.tickets", { store_slug: store?.slug });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Vena Ticket Detail", activeMenu: "Vena Tickets", children: [
    /* @__PURE__ */ jsx(Head, { title: `Ticket — ${ticket.subject}` }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: backRoute,
            className: "w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 transition-all",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-base font-black text-slate-900 dark:text-white tracking-tight truncate", children: ticket.subject }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-400", children: [
            "From ",
            /* @__PURE__ */ jsx("strong", { className: "text-slate-600 dark:text-slate-300", children: ticket.requester_name }),
            ticket.requester_email && /* @__PURE__ */ jsxs(Fragment, { children: [
              " · ",
              ticket.requester_email
            ] }),
            ticket.tenant && isPlatform && /* @__PURE__ */ jsxs(Fragment, { children: [
              " · ",
              ticket.tenant.name
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx(
          "select",
          {
            value: ticket.status,
            onChange: (e) => handleStatusChange(e.target.value),
            className: "px-4 py-2 text-xs font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 cursor-pointer",
            children: STATUS_OPTIONS.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, children: opt.label }, opt.value))
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1", children: "Session ID" }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-slate-600 dark:text-slate-300 truncate", children: [
              header.match(/Session UUID:\s*([a-f0-9-]+)/i)?.[1]?.slice(0, 12) || "—",
              "…"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1", children: "Escalation Reason" }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: escalationCfg ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(escalationCfg.icon, { size: 12, className: escalationCfg.color }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-300", children: escalationCfg.label })
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "—" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1", children: "Priority" }),
            /* @__PURE__ */ jsx("span", { className: `text-xs font-black uppercase tracking-wider ${ticket.priority === "high" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`, children: ticket.priority || "Normal" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1", children: "Created" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: new Date(ticket.created_at).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(MessageSquare, { size: 13, className: "text-indigo-500 dark:text-indigo-400" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-black text-slate-900 dark:text-white", children: "Chat Transcript" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-slate-400 ml-auto", children: [
              lines.length,
              " messages"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-5 space-y-3", children: lines.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 text-center py-8", children: "No transcript available." }) : lines.map((line, i) => {
            const isVisitor = line.sender.toLowerCase() === "visitor";
            const isBot = line.sender.toLowerCase() === "bot";
            const isSystem = line.sender.toLowerCase() === "system";
            if (isSystem) {
              return /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-full text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center max-w-sm", children: line.body }) }, i);
            }
            return /* @__PURE__ */ jsx("div", { className: `flex ${isVisitor ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${isVisitor ? "bg-indigo-600 text-white rounded-tr-none" : isBot ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-100 dark:border-emerald-800 rounded-tl-none"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-60", children: [
                isBot ? "Vena" : line.sender,
                line.time && /* @__PURE__ */ jsx("span", { className: "ml-2 opacity-60 normal-case font-normal", children: line.time.slice(11, 16) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: line.body })
            ] }) }, i);
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            ` })
  ] });
}
export {
  VenaTicketDetail as default
};
