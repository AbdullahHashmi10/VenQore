import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { CheckCircle, AlertTriangle, ChevronRight, RefreshCw, CheckCheck, Settings, Search, Clock, Package, ShoppingCart, ArrowDownLeft, ArrowUpRight, XCircle, EyeOff } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
const statusConfig = {
  synced: { color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle, label: "Synced" },
  conflict: { color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20", icon: AlertTriangle, label: "Conflict" },
  pending: { color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", icon: Clock, label: "Pending" },
  staged: { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", icon: Clock, label: "Staged" },
  ignored: { color: "text-slate-400 bg-slate-50 dark:bg-slate-800", icon: EyeOff, label: "Ignored" }
};
function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`, children: [
    /* @__PURE__ */ jsx(Icon, { size: 10 }),
    cfg.label
  ] });
}
function StatsBar({ stats, filter, onFilter }) {
  const tabs = [
    { key: "all", label: "All", count: null },
    { key: "synced", label: "Synced", count: stats.synced, color: "text-emerald-600" },
    { key: "conflict", label: "Conflicts", count: stats.conflicts, color: "text-orange-600" },
    { key: "staged", label: "Staged", count: stats.staged, color: "text-amber-600" },
    { key: "ignored", label: "Ignored", count: stats.ignored, color: "text-slate-400" }
  ];
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl", children: tabs.map((tab) => /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => onFilter(tab.key),
      className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === tab.key ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
      children: [
        tab.label,
        tab.count !== null && tab.count > 0 && /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${filter === tab.key ? "" : tab.color ?? ""}`, children: tab.count })
      ]
    },
    tab.key
  )) });
}
function StagedQueueRow({ entry, connectionId, storeSlug }) {
  const [acting, setActing] = useState(false);
  const isFromWoo = entry.direction === "from_woo";
  const handleApprove = () => {
    setActing(true);
    router.post(route("store.woo.connections.approve", { store_slug: storeSlug, connection: connectionId }), {
      queue_ids: [entry.id]
    }, { onFinish: () => setActing(false) });
  };
  const handleIgnore = () => {
    router.post(route("store.woo.connections.ignore", { store_slug: storeSlug, connection: connectionId }), {
      queue_id: entry.id
    });
  };
  const wooProduct = isFromWoo ? entry.payload : null;
  const venqoreData = !isFromWoo ? entry.payload : null;
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Package, { size: 14, className: "text-violet-500" }) }),
      isFromWoo ? /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400 italic", children: "— not in VenQore yet —" }) : /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-slate-800 dark:text-white", children: venqoreData?.name ?? "Unknown" }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400 font-mono", children: [
          "SKU: ",
          venqoreData?.sku ?? "—"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 14, className: "text-blue-500" }) }),
        !isFromWoo ? /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400 italic", children: "— not on WooCommerce yet —" }) : /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-slate-800 dark:text-white", children: wooProduct?.name ?? "Unknown" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400 font-mono", children: [
            "SKU: ",
            wooProduct?.sku ?? "—"
          ] }),
          wooProduct?.regular_price && /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500", children: [
            "$",
            wooProduct.regular_price
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleApprove,
            disabled: acting,
            className: "flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
            children: [
              isFromWoo ? /* @__PURE__ */ jsx(ArrowDownLeft, { size: 12 }) : /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 }),
              isFromWoo ? "Pull" : "Push"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleIgnore,
            className: "p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
            title: "Ignore",
            children: /* @__PURE__ */ jsx(XCircle, { size: 14 })
          }
        )
      ] })
    ] })
  ] });
}
function LinkedProductRow({ link, connectionId, storeSlug }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);
  const product = link.product;
  const isConflict = link.sync_status === "conflict";
  const conflictData = link.conflict_data ?? {};
  const handlePush = () => {
    setActing(true);
    router.post(route("store.woo.connections.push", { store_slug: storeSlug, connection: connectionId }), {
      link_id: link.id
    }, { onFinish: () => setActing(false) });
  };
  const handlePull = () => {
    setActing(true);
    router.post(route("store.woo.connections.pull", { store_slug: storeSlug, connection: connectionId }), {
      link_id: link.id
    }, { onFinish: () => setActing(false) });
  };
  const handleResolve = (side) => {
    setActing(true);
    router.post(route("store.woo.connections.resolve", { store_slug: storeSlug, connection: connectionId }), {
      link_id: link.id,
      resolution: side
    }, { onFinish: () => setActing(false) });
  };
  const handleIgnore = () => {
    router.post(route("store.woo.connections.ignore", { store_slug: storeSlug, connection: connectionId }), {
      link_id: link.id
    });
  };
  return /* @__PURE__ */ jsx("div", { className: `border-b border-slate-100 dark:border-slate-800 last:border-0 ${isConflict ? "bg-orange-50/30 dark:bg-orange-900/10" : ""}`, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Package, { size: 14, className: "text-violet-500" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-slate-800 dark:text-white truncate", children: product?.name ?? "—" }),
          /* @__PURE__ */ jsx(StatusBadge, { status: link.sync_status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400 font-mono", children: [
          "SKU: ",
          link.sku
        ] }),
        product?.price && /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 mt-0.5", children: [
          "Price: ",
          /* @__PURE__ */ jsxs("span", { className: isConflict && conflictData?.venqore?.price !== conflictData?.woocommerce?.price ? "text-orange-600 font-bold" : "", children: [
            "$",
            product.price
          ] }),
          product.stock_quantity !== void 0 && ` · Stock: ${product.stock_quantity}`
        ] }),
        isConflict && conflictData?.venqore && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleResolve("venqore"),
            disabled: acting,
            className: "mt-1.5 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
            children: "Use VenQore ✓"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 14, className: "text-blue-500" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm text-slate-800 dark:text-white truncate", children: product?.name ?? "—" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
            "Woo ID: #",
            link.woo_product_id
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: link.last_synced_at ? `Synced: ${new Date(link.last_synced_at).toLocaleDateString()}` : "Not yet synced" }),
          isConflict && conflictData?.woocommerce && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleResolve("woocommerce"),
              disabled: acting,
              className: "mt-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
              children: "Use WooCommerce ✓"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
        !isConflict && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handlePush,
              disabled: acting,
              title: "Push VenQore → WooCommerce",
              className: "p-1.5 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors disabled:opacity-50",
              children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 14 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handlePull,
              disabled: acting,
              title: "Pull WooCommerce → VenQore",
              className: "p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50",
              children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 14 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleIgnore,
            title: "Unlink / Ignore",
            className: "p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
            children: /* @__PURE__ */ jsx(EyeOff, { size: 14 })
          }
        )
      ] })
    ] })
  ] }) });
}
function SyncPage({
  connection,
  links,
  staged_queue = [],
  stats,
  filter,
  search: initialSearch,
  store_slug
}) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [bulking, setBulking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { showAlert } = useAlert();
  const handleFilterChange = (newFilter) => {
    router.get(route("store.woo.connections.sync", { store_slug, connection: connection.id }), {
      filter: newFilter,
      search
    }, { preserveState: true, replace: true });
  };
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("store.woo.connections.sync", { store_slug, connection: connection.id }), {
      filter,
      search
    }, { preserveState: true, replace: true });
  };
  const handleApproveAll = () => {
    setBulking(true);
    router.post(route("store.woo.connections.approve", { store_slug, connection: connection.id }), {
      approve_all: true
    }, {
      onSuccess: () => showAlert({ title: "All staged items approved and queued.", type: "success" }),
      onFinish: () => setBulking(false)
    });
  };
  const statusIcon = connection.status === "active" ? /* @__PURE__ */ jsx(CheckCircle, { size: 13, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 13, className: "text-amber-500" });
  const totalStaged = staged_queue.length + (stats.staged ?? 0);
  const handleScan = () => {
    setScanning(true);
    router.post(route("store.woo.connections.scan", { store_slug, connection: connection.id }), {}, {
      onSuccess: () => showAlert({ title: "Scan complete!", type: "success" }),
      onFinish: () => setScanning(false)
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "WooCommerce Sync", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: `Sync — ${connection.name} — VenQore` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500 mb-1", children: [
            /* @__PURE__ */ jsx(Link, { href: route("store.woo.connections.index", { store_slug }), className: "hover:text-violet-500", children: "WooCommerce" }),
            /* @__PURE__ */ jsx(ChevronRight, { size: 13 }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-700 dark:text-slate-300 font-medium", children: connection.name })
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            "Sync Page",
            /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${connection.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"}`, children: [
              statusIcon,
              connection.status === "active" ? "Connected" : "Pending"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-0.5", children: [
            connection.last_synced_at ? `Last sync: ${new Date(connection.last_synced_at).toLocaleString()}` : "Never synced",
            " · ",
            "Priority: ",
            /* @__PURE__ */ jsx("span", { className: "font-semibold capitalize", children: connection.priority_source }),
            " · ",
            connection.site_url ? /* @__PURE__ */ jsxs("a", { href: connection.site_url, target: "_blank", rel: "noreferrer", className: "text-violet-500 hover:underline", children: [
              connection.site_url.replace(/^https?:\/\//, ""),
              " ↗"
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic", children: "Site URL not configured" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleScan,
              disabled: scanning,
              className: "flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: scanning ? "animate-spin" : "" }),
                scanning ? "Scanning..." : "Scan & Map Products"
              ]
            }
          ),
          totalStaged > 0 && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleApproveAll,
              disabled: bulking,
              className: "flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(CheckCheck, { size: 14 }),
                "Approve All Staged (",
                totalStaged,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.woo.connections.setup", { store_slug, connection: connection.id }),
              className: "p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors",
              children: /* @__PURE__ */ jsx(Settings, { size: 16 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsx(StatsBar, { stats, filter: filter ?? "all", onFilter: handleFilterChange }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: "Search by name or SKU…",
                className: "pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 w-56"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-200 transition-colors", children: "Go" })
        ] })
      ] }),
      staged_queue.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-amber-200 dark:border-amber-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-amber-600" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800 dark:text-white text-sm", children: [
              "Staging Queue — ",
              staged_queue.length,
              " new product",
              staged_queue.length !== 1 ? "s" : "",
              " need review"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleApproveAll,
              disabled: bulking,
              className: "flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(CheckCheck, { size: 12 }),
                "Approve All"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 px-4 py-2 bg-amber-100/60 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Package, { size: 11 }),
            " VenQore"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 11 }),
            " WooCommerce"
          ] })
        ] }),
        staged_queue.map((entry) => /* @__PURE__ */ jsx(
          StagedQueueRow,
          {
            entry,
            connectionId: connection.id,
            storeSlug: store_slug
          },
          entry.id
        ))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Package, { size: 11 }),
            " VenQore Product"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 11 }),
            " WooCommerce Product"
          ] })
        ] }),
        links.data?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16 text-slate-400", children: [
          /* @__PURE__ */ jsx(Package, { size: 28, className: "mx-auto mb-3 opacity-40" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
            "No products found",
            filter !== "all" ? ` with status "${filter}"` : "",
            "."
          ] }),
          filter !== "all" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("all"),
              className: "mt-2 text-violet-500 text-sm hover:underline",
              children: "Show all"
            }
          )
        ] }),
        links.data?.map((link) => /* @__PURE__ */ jsx(
          LinkedProductRow,
          {
            link,
            connectionId: connection.id,
            storeSlug: store_slug
          },
          link.id
        )),
        links.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
            "Showing ",
            links.from,
            "–",
            links.to,
            " of ",
            links.total,
            " products"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            links.prev_page_url && /* @__PURE__ */ jsx(
              Link,
              {
                href: links.prev_page_url,
                className: "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 transition-colors",
                children: "← Prev"
              }
            ),
            links.next_page_url && /* @__PURE__ */ jsx(
              Link,
              {
                href: links.next_page_url,
                className: "px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors",
                children: "Next →"
              }
            )
          ] })
        ] })
      ] }),
      stats.conflicts > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-orange-500 flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800 dark:text-white text-sm", children: [
            stats.conflicts,
            " product",
            stats.conflicts !== 1 ? "s" : "",
            " have conflicts."
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-400 text-sm ml-1", children: "Both sides changed since last sync. Choose which version to keep." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("conflict"),
              className: "block mt-1.5 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:underline",
              children: "Filter to conflicts only →"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  SyncPage as default
};
