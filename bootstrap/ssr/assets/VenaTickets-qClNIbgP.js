import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { Sparkles, Plus, Filter, Inbox, MessageSquare, Clock, ChevronRight, Zap, User, AlertCircle, Bot } from "lucide-react";
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
  ai_failure: {
    label: "AI Failure",
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: Bot
  },
  billing_or_complex: {
    label: "Billing / Complex",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: AlertCircle
  },
  user_requested: {
    label: "User Requested",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: User
  },
  repeated_failure: {
    label: "Repeated Failure",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: Zap
  }
};
const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500"
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500"
  },
  closed: {
    label: "Closed",
    color: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400"
  }
};
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`, children: [
    /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${cfg.dot}` }),
    cfg.label
  ] });
}
function EscalationBadge({ type }) {
  const cfg = ESCALATION_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cfg.color}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 9 }),
    cfg.label
  ] });
}
function formatTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const diffHours = (now - d) / (1e3 * 60 * 60);
  if (diffHours < 1) return `${Math.round(diffHours * 60)}m ago`;
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}
function VenaTickets({ tickets, context, filters, open_count }) {
  const { store } = usePage().props;
  const [statusFilter, setStatusFilter] = useState(filters?.status || "all");
  const [escalationFilter, setEscalationFilter] = useState(filters?.escalation_type || "all");
  const [openModal, setOpenModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formPriority, setFormPriority] = useState("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function handleSubmit(e) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formSubject.trim() || !formMessage.trim()) return;
    setIsSubmitting(true);
    router.post(route("store.admin.vena.ticket.create", { store_slug: store?.slug }), {
      requester_name: formName,
      requester_email: formEmail,
      subject: formSubject,
      message: formMessage,
      priority: formPriority
    }, {
      onSuccess: () => {
        setFormName("");
        setFormEmail("");
        setFormSubject("");
        setFormMessage("");
        setFormPriority("normal");
        setOpenModal(false);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  }
  const isPlatform = context === "platform";
  const applyFilters = (newFilters) => {
    const params = { ...newFilters };
    if (isPlatform) {
      router.get(route("platform.vena.tickets"), params, { preserveState: true, replace: true });
    } else {
      router.get(route("store.admin.vena.tickets", { store_slug: store?.slug }), params, { preserveState: true, replace: true });
    }
  };
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    applyFilters({ status: val, escalation_type: escalationFilter });
  };
  const handleEscalationChange = (val) => {
    setEscalationFilter(val);
    applyFilters({ status: statusFilter, escalation_type: val });
  };
  const handleStatusUpdate = (ticket, newStatus) => {
    const routeName = isPlatform ? "platform.vena.ticket.status" : "store.admin.vena.ticket.status";
    const params = isPlatform ? { ticket: ticket.id } : { store_slug: store?.slug, ticket: ticket.id };
    router.post(route(routeName, params), { status: newStatus }, { preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Vena Tickets", activeMenu: "Vena Tickets", children: [
    /* @__PURE__ */ jsx(Head, { title: "Vena Chat Tickets" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "text-indigo-600 dark:text-indigo-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-lg font-black text-slate-900 dark:text-white tracking-tight", children: "Vena Chat Tickets" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: isPlatform ? "Auto-generated tickets from Vena chat escalations across all stores" : "Customer support tickets raised through your store's Vena chat widget" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          open_count > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-rose-500 animate-pulse" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-rose-700 dark:text-rose-300", children: [
              open_count,
              " open ",
              open_count === 1 ? "ticket" : "tickets"
            ] })
          ] }),
          !isPlatform && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setOpenModal(true),
              className: "flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-sm shadow-indigo-500/10",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 12 }),
                "Log Ticket"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm", children: [
          /* @__PURE__ */ jsx(Filter, { size: 12, className: "text-slate-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-slate-500", children: "Status:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: statusFilter,
              onChange: (e) => handleStatusChange(e.target.value),
              className: "text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
                /* @__PURE__ */ jsx("option", { value: "open", children: "Open" }),
                /* @__PURE__ */ jsx("option", { value: "in_progress", children: "In Progress" }),
                /* @__PURE__ */ jsx("option", { value: "resolved", children: "Resolved" }),
                /* @__PURE__ */ jsx("option", { value: "closed", children: "Closed" })
              ]
            }
          )
        ] }),
        isPlatform && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm", children: [
          /* @__PURE__ */ jsx(Filter, { size: 12, className: "text-slate-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-slate-500", children: "Reason:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: escalationFilter,
              onChange: (e) => handleEscalationChange(e.target.value),
              className: "text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
                /* @__PURE__ */ jsx("option", { value: "ai_failure", children: "AI Failure" }),
                /* @__PURE__ */ jsx("option", { value: "billing_or_complex", children: "Billing / Complex" }),
                /* @__PURE__ */ jsx("option", { value: "user_requested", children: "User Requested" }),
                /* @__PURE__ */ jsx("option", { value: "repeated_failure", children: "Repeated Failure" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar", children: tickets.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full py-24 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Inbox, { size: 28, className: "text-indigo-400" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-700 dark:text-slate-200", children: "No tickets found" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Vena tickets appear here when chat escalations occur and agents are offline." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: tickets.data.map((ticket) => {
        const showRoute = isPlatform ? route("platform.vena.ticket.show", { ticket: ticket.id }) : route("store.admin.vena.ticket.show", { store_slug: store?.slug, ticket: ticket.id });
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5 relative overflow-hidden",
            children: [
              ticket.status === "open" && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-0.5 bg-rose-500 rounded-l-2xl" }),
              /* @__PURE__ */ jsx("div", { className: "shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(MessageSquare, { size: 16, className: "text-indigo-500 dark:text-indigo-400" }) }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [
                    /* @__PURE__ */ jsx(StatusBadge, { status: ticket.status }),
                    /* @__PURE__ */ jsx(EscalationBadge, { type: ticket.escalation_type })
                  ] }),
                  /* @__PURE__ */ jsx("h3", { className: "text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", children: ticket.subject }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-1 flex-wrap", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-slate-500 dark:text-slate-400", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold", children: ticket.requester_name }),
                      ticket.requester_email && ` · ${ticket.requester_email}`
                    ] }),
                    isPlatform && ticket.tenant && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700", children: ticket.tenant.name })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex flex-col items-end gap-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] text-slate-400", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 10 }),
                    formatTime(ticket.created_at)
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    ticket.status === "open" && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.preventDefault();
                          handleStatusUpdate(ticket, "in_progress");
                        },
                        className: "px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors",
                        children: "Pick Up"
                      }
                    ),
                    ticket.status === "in_progress" && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.preventDefault();
                          handleStatusUpdate(ticket, "resolved");
                        },
                        className: "px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors",
                        children: "Resolve"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: showRoute,
                        className: "w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all",
                        children: /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
                      }
                    )
                  ] })
                ] })
              ] }) })
            ]
          },
          ticket.id
        );
      }) }) }),
      tickets.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
          "Showing ",
          tickets.from,
          "–",
          tickets.to,
          " of ",
          tickets.total,
          " tickets"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: tickets.links.map((link, i) => /* @__PURE__ */ jsx(
          Link,
          {
            href: link.url || "#",
            className: `px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${link.active ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : link.url ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200" : "bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed"}`,
            preserveState: true,
            children: (link.label || "").replace(/<[^>]*>/g, "").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
          },
          i
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            ` }),
    openModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in", style: { animation: "fadeIn 0.2s ease-out" }, children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-up", style: { animation: "scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-900 dark:text-white tracking-tight", children: "Log New Customer Ticket" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Record customer issues manually while on the call or in-store" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpenModal(false), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg p-1", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5", children: "Customer Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                placeholder: "e.g. John Doe",
                value: formName,
                onChange: (e) => setFormName(e.target.value),
                className: "w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5", children: "Customer Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                required: true,
                placeholder: "e.g. john@example.com",
                value: formEmail,
                onChange: (e) => setFormEmail(e.target.value),
                className: "w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5", children: "Subject / Summary" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Brief description of the issue",
              value: formSubject,
              onChange: (e) => setFormSubject(e.target.value),
              className: "w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5", children: "Priority" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: formPriority,
              onChange: (e) => setFormPriority(e.target.value),
              className: "w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-bold",
              children: [
                /* @__PURE__ */ jsx("option", { value: "low", children: "Low" }),
                /* @__PURE__ */ jsx("option", { value: "normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "high", children: "High" }),
                /* @__PURE__ */ jsx("option", { value: "urgent", children: "Urgent" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5", children: "Issue details / notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              required: true,
              rows: 4,
              placeholder: "Describe the customer inquiry or ticket details...",
              value: formMessage,
              onChange: (e) => setFormMessage(e.target.value),
              className: "w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2 flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setOpenModal(false), className: "px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: isSubmitting, className: "flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-sm shadow-indigo-500/10", children: isSubmitting ? "Logging..." : "Log Ticket" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  VenaTickets as default
};
