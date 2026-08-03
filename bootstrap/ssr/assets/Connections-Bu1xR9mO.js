import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { ShoppingCart, Plus, AlertTriangle, ExternalLink, Clock, Zap, Trash2, CheckCircle } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function StatusBadge({ status }) {
  const cfg = {
    active: { color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle, label: "Active" },
    pending: { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", icon: Clock, label: "Pending" },
    paused: { color: "text-slate-500 bg-slate-100 dark:bg-slate-800", icon: AlertTriangle, label: "Paused" }
  }[status] ?? { color: "text-slate-400 bg-slate-100", icon: Clock, label: status };
  const Icon = cfg.icon;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 10 }),
    " ",
    cfg.label
  ] });
}
function AddConnectionModal({ storeSlug, onClose }) {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    priority_source: "venqore",
    site_url: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("store.woo.connections.store", { store_slug: storeSlug }), {
      onSuccess: onClose
    });
  };
  const handleUrlBlur = () => {
    if (!data.site_url) return;
    let url = data.site_url.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url;
      setData("site_url", url);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-slate-800 dark:text-white", children: "Add WooCommerce Connection" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "$10/month per connection, billed to your store." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold", children: "×" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1", children: "Connection Name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: data.name,
            onChange: (e) => setData("name", e.target.value),
            placeholder: "e.g. My WordPress Store",
            className: "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500",
            required: true
          }
        ),
        errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1", children: "WordPress Site URL (Optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: data.site_url,
            onChange: (e) => setData("site_url", e.target.value),
            onBlur: handleUrlBlur,
            placeholder: "https://my-wordpress-store.com",
            className: "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-0.5", children: "Recommended. Allows triggering instant remote handshakes directly from the POS." }),
        errors.site_url && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.site_url })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1", children: "Conflict Priority" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: data.priority_source,
            onChange: (e) => setData("priority_source", e.target.value),
            className: "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500",
            children: [
              /* @__PURE__ */ jsx("option", { value: "venqore", children: "VenQore wins (recommended)" }),
              /* @__PURE__ */ jsx("option", { value: "woocommerce", children: "WooCommerce wins" }),
              /* @__PURE__ */ jsx("option", { value: "manual", children: "Manual — review each conflict" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-2 flex gap-2 justify-end", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors", children: "Cancel" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "px-5 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50",
            children: processing ? "Creating…" : "Create & Proceed"
          }
        )
      ] })
    ] })
  ] }) });
}
function ConnectionCard({ connection, storeSlug }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const handleDelete = () => {
    setDeleting(true);
    router.delete(route("store.woo.connections.destroy", { store_slug: storeSlug, connection: connection.id }), {
      onFinish: () => {
        setDeleting(false);
        setShowConfirm(false);
      }
    });
  };
  const isActive = connection.status === "active";
  const synced = connection.product_links_count ?? 0;
  const staged = connection.staged_count ?? 0;
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group relative", children: [
    showConfirm && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200", children: [
      /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-3 animate-bounce", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }) }),
      /* @__PURE__ */ jsx("h4", { className: "text-white font-bold text-sm", children: "Delete Connection?" }),
      /* @__PURE__ */ jsxs("p", { className: "text-1xs text-slate-400 mt-1 max-w-[210px] leading-relaxed", children: [
        'This permanently disconnects "',
        connection.name,
        '" and purges all live sync metadata.'
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-4 w-full px-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowConfirm(false),
            className: "flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleDelete,
            disabled: deleting,
            className: "flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1",
            children: deleting ? "Deleting..." : "Delete"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `h-1.5 w-full ${isActive ? "bg-gradient-to-r from-violet-500 to-blue-500" : "bg-amber-400"}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-violet-50 dark:bg-violet-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`, children: /* @__PURE__ */ jsx(ShoppingCart, { size: 18, className: isActive ? "text-violet-500" : "text-amber-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white text-sm", children: connection.name }),
            connection.site_url ? /* @__PURE__ */ jsxs(
              "a",
              {
                href: connection.site_url,
                target: "_blank",
                rel: "noreferrer",
                className: "text-xs text-slate-400 hover:text-violet-500 flex items-center gap-1",
                children: [
                  connection.site_url.replace(/^https?:\/\//, ""),
                  /* @__PURE__ */ jsx(ExternalLink, { size: 10 })
                ]
              }
            ) : /* @__PURE__ */ jsxs("span", { className: "text-xs text-amber-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { size: 10 }),
              " Setup pending"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(StatusBadge, { status: connection.status })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [
        { label: "Synced", value: synced, color: "text-emerald-600" },
        { label: "Staged", value: staged, color: "text-amber-600" },
        { label: "Priority", value: connection.priority_source, color: "text-violet-600" }
      ].map((stat) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: `font-bold text-sm ${stat.color} capitalize`, children: stat.value }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: stat.label })
      ] }, stat.label)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.woo.connections.sync", { store_slug: storeSlug, connection: connection.id }),
            className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors",
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 13 }),
              "Sync Page"
            ]
          }
        ),
        connection.status === "pending" && /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.woo.connections.setup", { store_slug: storeSlug, connection: connection.id }),
            className: "flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors",
            children: "Setup"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowConfirm(true),
            className: "p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors",
            children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
          }
        )
      ] })
    ] })
  ] });
}
function Connections({ connections = [], store_slug }) {
  const [showAdd, setShowAdd] = useState(false);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "WooCommerce Sync", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: "WooCommerce Sync — VenQore" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 22, className: "text-violet-500" }),
            "WooCommerce Sync"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-0.5", children: "Bidirectional product sync between VenQore and your WooCommerce stores. $10/month per connection." })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowAdd(true),
            className: "flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 16 }),
              "Add Connection"
            ]
          }
        )
      ] }),
      connections.length === 0 && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-16 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 28, className: "text-violet-400" }) }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white mb-2", children: "No WooCommerce connections yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mb-6 max-w-sm mx-auto", children: "Connect your WooCommerce store to sync products, prices, and stock automatically — in both directions." }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowAdd(true),
            className: "px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14, className: "inline mr-2" }),
              "Add Your First Connection"
            ]
          }
        )
      ] }),
      connections.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: connections.map((conn) => /* @__PURE__ */ jsx(ConnectionCard, { connection: conn, storeSlug: store_slug }, conn.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-700 dark:text-slate-300 text-sm mb-3", children: "How it works" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          { step: "1", title: "Add Connection", desc: "Create a connection in VenQore and download your customized WordPress plugin." },
          { step: "2", title: "Install & Activate", desc: "Upload the plugin zip to WordPress. Activation triggers the secure handshake automatically." },
          { step: "3", title: "Synchronize", desc: "Products, prices, and stock counts sync in real-time between VenQore and WooCommerce." }
        ].map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs flex items-center justify-center font-bold flex-shrink-0", children: item.step }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-700 dark:text-slate-300 text-sm", children: item.title }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-0.5", children: item.desc })
          ] })
        ] }, item.step)) })
      ] })
    ] }),
    showAdd && /* @__PURE__ */ jsx(AddConnectionModal, { storeSlug: store_slug, onClose: () => setShowAdd(false) })
  ] });
}
export {
  Connections as default
};
