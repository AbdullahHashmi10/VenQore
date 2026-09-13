import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import "./OneGlanceLayout-D0x15wPs.js";
import { Package, Settings, FileText, Layers, BarChart2, Clipboard, Box, RefreshCcw, Search, Factory, ChevronRight } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
const itemModuleMap = {
  products: "products",
  categories: "products",
  attributes: "variants",
  labels: "barcodes_labels",
  levels: "inventory",
  adjustments: "inventory",
  warehouses: "multi_location",
  transfers: "stock_transfers",
  audit: "stock_takes",
  batch: "batches_expiry",
  serial: "serials",
  production: "production_runs",
  cookbook: "cookbook"
};
function StockModuleTabs({ activeTab }) {
  const { store, modules } = usePage().props;
  const tt = useTermText();
  const rawGroups = useMemo(() => [
    {
      id: "catalog",
      label: "Catalog",
      icon: Layers,
      items: [
        { id: "products", label: tt("Products"), href: route("store.inventory.index", { store_slug: store?.slug }), icon: Package },
        { id: "categories", label: "Categories", href: route("store.categories.index", { store_slug: store?.slug }), icon: Settings },
        { id: "attributes", label: "Attributes", href: route("store.attributes.index", { store_slug: store?.slug }), icon: Settings },
        { id: "labels", label: "Labels", href: route("store.labels.index", { store_slug: store?.slug }), icon: FileText }
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: RefreshCcw,
      items: [
        { id: "levels", label: "Stock Levels", href: route("store.inventory.stock-levels", { store_slug: store?.slug }), icon: BarChart2 },
        { id: "adjustments", label: "Stock Adjustments", href: route("store.stock-operations", { store_slug: store?.slug, tab: "adjustments" }), icon: Clipboard },
        { id: "warehouses", label: "Warehouses", href: route("store.stock-operations", { store_slug: store?.slug, tab: "warehouses" }), icon: Box },
        { id: "transfers", label: "Stock Transfers", href: route("store.stock-transfers.index", { store_slug: store?.slug }), icon: RefreshCcw },
        { id: "audit", label: "Stock Audit", href: route("store.stock-takes.index", { store_slug: store?.slug }), icon: Search }
      ]
    },
    {
      id: "tracking",
      label: "Tracking",
      icon: Search,
      items: [
        { id: "batch", label: "Batch Tracking", href: route("store.batches.index", { store_slug: store?.slug }), icon: Package },
        { id: "serial", label: "Serial Tracking", href: route("store.serials.index", { store_slug: store?.slug }), icon: Package }
      ]
    },
    {
      id: "manufacturing",
      label: "Manufacturing",
      icon: Factory,
      items: [
        { id: "production", label: "Production", href: route("store.production.index", { store_slug: store?.slug }), icon: Factory },
        { id: "cookbook", label: "Cookbook", href: route("store.cookbook.index", { store_slug: store?.slug }), icon: FileText }
      ]
    }
  ], [store, tt]);
  const groups = useMemo(() => {
    if (!Array.isArray(modules)) {
      return rawGroups;
    }
    return rawGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const required = itemModuleMap[item.id];
        return !required || modules.includes(required);
      })
    })).filter((group) => group.items.length > 0);
  }, [rawGroups, modules]);
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : groups[0]?.id || "catalog";
  };
  const [activeGroup, setActiveGroup] = useState(getInitialGroup);
  const [isCollapsed, setIsCollapsed] = useState(true);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    } else if (groups[0]) {
      setActiveGroup(groups[0].id);
    }
  }, [activeTab, groups]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden items-center justify-between w-full px-1.5 py-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Layers, { size: 14, className: "text-ink-muted" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Stock Navigation Menu" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setIsCollapsed(!isCollapsed),
          "aria-label": "Toggle Stock Navigation Menu",
          "aria-expanded": !isCollapsed,
          className: "p-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
          children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: `transition-transform duration-normal ${isCollapsed ? "rotate-90" : "-rotate-90"}` })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `flex-col lg:flex-row items-center gap-3 lg:gap-4 w-full lg:w-auto lg:flex-1 ${isCollapsed ? "hidden lg:flex" : "flex"}`, children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full w-full lg:w-auto", children: groups.map((group) => {
        const Icon = group.icon;
        const isActive = activeGroup === group.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveGroup(group.id),
            className: `
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-normal whitespace-nowrap
                                    ${isActive ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
            children: [
              /* @__PURE__ */ jsx(Icon, { size: 14, className: isActive ? "opacity-100" : "opacity-70" }),
              group.label
            ]
          },
          group.id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary", children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade", children: groups.find((g) => g.id === activeGroup)?.items.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: tab.href,
            className: `
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-normal border whitespace-nowrap
                                    ${isActive ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 font-semibold" : "bg-transparent border-transparent text-ink-secondary hover:bg-interactive-hover hover:border-line dark:text-ink-muted dark:hover:bg-interactive-hover dark:hover:border-line-strong"}
                                `,
            children: [
              /* @__PURE__ */ jsx(Icon, { size: 14 }),
              tab.label
            ]
          },
          tab.id
        );
      }) })
    ] })
  ] });
}
export {
  StockModuleTabs as S
};
