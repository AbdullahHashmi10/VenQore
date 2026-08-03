import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { Trash2, RefreshCw } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
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
      /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1", children: /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Item Details" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Deleted At" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: items.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "4", className: "p-12 text-center text-slate-400", children: [
          /* @__PURE__ */ jsx(Trash2, { size: 48, className: "mx-auto mb-3 opacity-20" }),
          /* @__PURE__ */ jsx("p", { children: "Recycle Bin is empty" })
        ] }) }) : items.map((item, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded text-xs font-bold uppercase ${item.type === "product" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"}`, children: item.type }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 dark:text-white", children: item.title }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500 dark:text-slate-400", children: item.description })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-500 dark:text-slate-400", children: new Date(item.deleted_at).toLocaleString() }),
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
