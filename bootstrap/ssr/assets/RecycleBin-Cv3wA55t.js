import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { Trash2, RefreshCw } from "lucide-react";
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
function RecycleBin({ items = [] }) {
  const { store } = usePage().props;
  const handleRestore = (id, type) => {
    if (confirm("Are you sure you want to restore this item?")) {
      router.post(route("store.admin.recycle-bin.restore", { store_slug: store.slug, id }), { type });
    }
  };
  const handleForceDelete = (id, type) => {
    if (confirm("Are you sure? This will PERMANENTLY delete the item. This action cannot be undone.")) {
      router.delete(route("store.admin.recycle-bin.force-delete", { store_slug: store.slug, id }), {
        data: { type }
      });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Recycle Bin", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Recycle Bin" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-6 p-6 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Recycle Bin",
          subtitle: "Restore deleted items or permanently remove them",
          icon: Trash2,
          breadcrumbs: [
            { label: "Recycle Bin" }
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1", children: /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-xl border border-line overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Item Details" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Deleted At" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: items.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "4", className: "p-12 text-center text-ink-muted", children: [
          /* @__PURE__ */ jsx(Trash2, { size: 48, className: "mx-auto mb-3 opacity-20" }),
          /* @__PURE__ */ jsx("p", { children: "Recycle Bin is empty" })
        ] }) }) : items.map((item, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded text-xs font-bold uppercase ${item.type === "product" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"}`, children: item.type }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink", children: item.title }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-ink-muted", children: item.description })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-ink-muted", children: new Date(item.deleted_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleRestore(item.id, item.type),
                className: "flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 14 }),
                  "Restore"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleForceDelete(item.id, item.type),
                className: "flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                  "Delete Forever"
                ]
              }
            )
          ] }) })
        ] }, `${item.type}-${item.id}-${index}`)) })
      ] }) }) })
    ] })
  ] });
}
export {
  RecycleBin as default
};
