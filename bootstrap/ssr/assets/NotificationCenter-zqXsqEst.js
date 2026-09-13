import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { Bell, Check, Clock, Trash2, AlertOctagon, AlertTriangle, CheckCircle, Info } from "lucide-react";
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
function NotificationsIndex({ notifications }) {
  const { store } = usePage().props;
  const getIcon = (type) => {
    if (type.includes("Error") || type.includes("Risk")) return /* @__PURE__ */ jsx(AlertOctagon, { size: 20, className: "text-red-500" });
    if (type.includes("Warning")) return /* @__PURE__ */ jsx(AlertTriangle, { size: 20, className: "text-amber-500" });
    if (type.includes("Success")) return /* @__PURE__ */ jsx(CheckCircle, { size: 20, className: "text-emerald-500" });
    return /* @__PURE__ */ jsx(Info, { size: 20, className: "text-blue-500" });
  };
  const markAllRead = () => {
    router.post(route("store.notifications.mark-all-read", { store_slug: store.slug }));
  };
  const markAsRead = (id) => {
    router.post(route("store.notifications.mark-read", id));
  };
  const deleteNotification = (id) => {
    router.delete(route("store.notifications.destroy", id));
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Notifications", activeMenu: "Notifications", children: [
    /* @__PURE__ */ jsx(Head, { title: "Notifications" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center bg-surface p-6 rounded-2xl shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600", children: /* @__PURE__ */ jsx(Bell, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-ink", children: "All Notifications" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Manage your system alerts and messages." })
          ] })
        ] }),
        notifications.data.length > 0 && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: markAllRead,
            className: "flex items-center gap-2 px-4 py-2 bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary rounded-xl transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsx(Check, { size: 16 }),
              " Mark all read"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl shadow-sm border border-line overflow-hidden min-h-[400px]", children: notifications.data.length > 0 ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: notifications.data.map((notification) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `p-6 flex items-start gap-4 transition-colors ${notification.read_at ? "opacity-75 bg-sunken/50 dark:bg-app" : "bg-surface hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "shrink-0 mt-1", children: getIcon(notification.type) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
                /* @__PURE__ */ jsx("p", { className: `text-base ${notification.read_at ? "font-medium text-ink-secondary" : "font-bold text-ink"}`, children: notification.data.title || "Notification" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted flex items-center gap-1 shrink-0 ml-4", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 12 }),
                  new Date(notification.created_at).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-secondary text-sm leading-relaxed mb-3", children: notification.data.message || "No details." }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                !notification.read_at && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => markAsRead(notification.id),
                    className: "text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline",
                    children: "Mark as Read"
                  }
                ),
                notification.data.action_url && /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: notification.data.action_url,
                    className: "text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline",
                    children: "View Details"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteNotification(notification.id),
                className: "p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                title: "Delete",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ]
        },
        notification.id
      )) }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-4 text-ink-muted", children: /* @__PURE__ */ jsx(Bell, { size: 32 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink-secondary dark:text-ink", children: "All caught up!" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: "You have no new notifications." })
      ] }) }),
      notifications.links && notifications.data.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-6", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: notifications.links.map((link, i) => /* @__PURE__ */ jsx(
        Link,
        {
          href: link.url,
          className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${link.active ? "bg-brand-600 text-white" : "bg-surface text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover"} ${!link.url && "opacity-50 cursor-not-allowed"}`,
          children: (link.label || "").replace(/<[^>]*>/g, "").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
        },
        i
      )) }) })
    ] })
  ] });
}
export {
  NotificationsIndex as default
};
