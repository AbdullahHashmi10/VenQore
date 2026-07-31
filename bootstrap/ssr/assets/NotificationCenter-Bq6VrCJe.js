import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { Bell, Check, Clock, Trash2, AlertOctagon, AlertTriangle, CheckCircle, Info } from "lucide-react";
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
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600", children: /* @__PURE__ */ jsx(Bell, { size: 24 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-800 dark:text-white", children: "All Notifications" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Manage your system alerts and messages." })
          ] })
        ] }),
        notifications.data.length > 0 && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: markAllRead,
            className: "flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors text-sm font-medium",
            children: [
              /* @__PURE__ */ jsx(Check, { size: 16 }),
              " Mark all read"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]", children: notifications.data.length > 0 ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: notifications.data.map((notification) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `p-6 flex items-start gap-4 transition-colors ${notification.read_at ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/50" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "shrink-0 mt-1", children: getIcon(notification.type) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
                /* @__PURE__ */ jsx("p", { className: `text-base ${notification.read_at ? "font-medium text-slate-700 dark:text-slate-300" : "font-bold text-slate-900 dark:text-white"}`, children: notification.data.title || "Notification" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-4", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 12 }),
                  new Date(notification.created_at).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3", children: notification.data.message || "No details." }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                !notification.read_at && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => markAsRead(notification.id),
                    className: "text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline",
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
                className: "p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                title: "Delete",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ]
        },
        notification.id
      )) }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400", children: /* @__PURE__ */ jsx(Bell, { size: 32 }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-700 dark:text-slate-200", children: "All caught up!" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "You have no new notifications." })
      ] }) }),
      notifications.links && notifications.data.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-6", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: notifications.links.map((link, i) => /* @__PURE__ */ jsx(
        Link,
        {
          href: link.url,
          className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${link.active ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"} ${!link.url && "opacity-50 cursor-not-allowed"}`,
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
