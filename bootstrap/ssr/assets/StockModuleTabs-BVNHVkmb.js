import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { F as FeatureLockBadge } from "./OneGlanceLayout-BqRkhJQJ.js";
import { Package, Settings, FileText, Layers, BarChart2, Clipboard, Box, RefreshCcw, Search, Factory, ChevronRight } from "lucide-react";
function StockModuleTabs({ activeTab }) {
  const { store } = usePage().props;
  const groups = [
    {
      id: "catalog",
      label: "Catalog",
      icon: Layers,
      items: [
        { id: "products", label: "Products", href: route("store.inventory.index", { store_slug: store?.slug }), icon: Package },
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
  ];
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : "catalog";
  };
  const [activeGroup, setActiveGroup] = useState(getInitialGroup);
  const [isCollapsed, setIsCollapsed] = useState(true);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [activeTab]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm shrink-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden items-center justify-between w-full px-1.5 py-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Layers, { size: 14, className: "text-slate-400" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-500 uppercase tracking-wider", children: "Stock Navigation Menu" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setIsCollapsed(!isCollapsed),
          className: "p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
          children: /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: `transition-transform duration-200 ${isCollapsed ? "rotate-90" : "-rotate-90"}` })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `flex-col lg:flex-row items-center gap-3 lg:gap-4 w-full lg:w-auto lg:flex-1 ${isCollapsed ? "hidden lg:flex" : "flex"}`, children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full w-full lg:w-auto", children: groups.map((group) => {
        const Icon = group.icon;
        const isActive = activeGroup === group.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveGroup(group.id),
            className: `
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                                    ${isActive ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}
                                `,
            children: [
              /* @__PURE__ */ jsx(Icon, { size: 14, className: isActive ? "opacity-100" : "opacity-70" }),
              group.label
            ]
          },
          group.id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center text-slate-300 dark:text-slate-600", children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade", children: groups.find((g) => g.id === activeGroup)?.items.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: tab.locked, showBadge: false, children: tab.locked ? /* @__PURE__ */ jsxs(
          "div",
          {
            className: `
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap cursor-not-allowed
                                            text-slate-400 dark:text-slate-600 border-transparent
                                        `,
            children: [
              /* @__PURE__ */ jsx(Icon, { size: 14 }),
              tab.label,
              /* @__PURE__ */ jsx("span", { className: "text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 ml-1", children: "LOCK" })
            ]
          }
        ) : /* @__PURE__ */ jsxs(
          Link,
          {
            href: tab.href,
            className: `
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap
                                            ${isActive ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 font-semibold" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700"}
                                        `,
            children: [
              /* @__PURE__ */ jsx(Icon, { size: 14 }),
              tab.label
            ]
          }
        ) }, tab.id);
      }) })
    ] })
  ] });
}
export {
  StockModuleTabs as S
};
