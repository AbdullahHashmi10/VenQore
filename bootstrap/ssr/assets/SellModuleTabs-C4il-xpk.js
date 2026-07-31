import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { F as FeatureLockBadge } from "./OneGlanceLayout-C-94hBqK.js";
import { ClipboardList, FileText, PauseCircle, Settings, ChevronDown, Plus, ChevronRight } from "lucide-react";
function SellModuleTabs({ activeTab }) {
  const { store } = usePage().props;
  const getRoute = (name, params = {}) => {
    try {
      return route(name, { ...params, store_slug: store?.slug });
    } catch (e) {
      return "#";
    }
  };
  const groups = [
    {
      id: "transactions",
      label: "Transactions",
      icon: ClipboardList,
      items: [
        { id: "orders", label: "All Sales Orders", href: getRoute("store.sales.index"), icon: ClipboardList },
        { id: "pre-sales", label: "Quotations / Pre-Sales", href: getRoute("store.pre-sales.index"), icon: ClipboardList },
        { id: "proposals", label: "Proposals", href: getRoute("store.proposals.index"), icon: FileText }
      ]
    },
    {
      id: "post-sale",
      label: "Post-Sale",
      icon: FileText,
      items: [
        { id: "returns", label: "Returns History", href: getRoute("store.returns-history.index"), icon: FileText },
        { id: "recurring", label: "Recurring Invoices", href: getRoute("store.recurring-invoices.index"), icon: PauseCircle, locked: !store?.features?.recurring_invoices },
        { id: "reminders", label: "Invoice Reminders", href: getRoute("store.invoice-reminders.index"), icon: PauseCircle, locked: !store?.features?.invoice_reminders }
      ]
    },
    {
      id: "config",
      label: "Config",
      icon: Settings,
      items: [
        { id: "e-invoicing", label: "E-Invoicing (Coming Soon)", href: getRoute("store.e-invoicing.index"), icon: FileText, locked: true }
      ]
    }
  ];
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : "transactions";
  };
  const [activeGroup, setActiveGroup] = useState(getInitialGroup);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [activeTab]);
  const activeGroupObj = groups.find((g) => g.id === activeGroup);
  const activeItemObj = activeGroupObj?.items.find((item) => item.id === activeTab);
  const ActiveIcon = activeItemObj?.icon || activeGroupObj?.icon;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden items-center justify-between w-full", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsExpanded(!isExpanded),
          className: "flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200",
          children: [
            ActiveIcon && /* @__PURE__ */ jsx(ActiveIcon, { size: 16, className: "text-indigo-600 dark:text-indigo-400" }),
            /* @__PURE__ */ jsxs("span", { children: [
              activeGroupObj?.label,
              ": ",
              activeItemObj?.label || activeTab
            ] }),
            /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}` })
          ]
        }
      ),
      !isExpanded && /* @__PURE__ */ jsx("div", { className: "shrink-0 flex items-center", children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.sales.invoice.create", { store_slug: store?.slug }),
          className: "relative px-4 py-2 text-white rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-300 flex items-center gap-2 overflow-hidden group shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-10 h-10 bg-indigo-600/50 rounded-full blur-lg -translate-y-1/2 translate-x-1/4" }),
              /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-8 h-8 bg-purple-600/40 rounded-full blur-lg translate-y-1/3 -translate-x-1/3" })
            ] }),
            /* @__PURE__ */ jsx(Plus, { size: 18, strokeWidth: 3, className: "relative z-10" })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `w-full lg:flex lg:flex-row lg:items-center lg:gap-4 ${isExpanded ? "flex flex-col gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800" : "hidden"}`, children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full", children: groups.map((group) => {
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
        const isComingSoon = tab.label.includes("Coming Soon");
        const isLocked = tab.locked;
        if (isComingSoon) {
          return /* @__PURE__ */ jsx(FeatureLockBadge, { isLocked: true, showBadge: false, children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap bg-transparent border-transparent text-slate-400 dark:text-slate-600 cursor-pointer",
              children: [
                /* @__PURE__ */ jsx(Icon, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: tab.label })
              ]
            }
          ) }, tab.id);
        }
        if (isLocked) {
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: (e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("amd:plan-limit", {
                  detail: {
                    feature: tab.id === "e-invoicing" ? "e_invoicing" : tab.id === "recurring" ? "recurring_invoicing" : tab.id.replace("-", "_"),
                    message: `${tab.label} is not available on your current plan. Please upgrade your plan to unlock.`,
                    current_plan: store?.plan === "ltd" ? "starter" : "starter",
                    upgrade_url: `/s/${store?.slug}/billing/upgrade`,
                    billing_url: `/s/${store?.slug}/billing`,
                    portal_url: `/s/${store?.slug}/billing/portal`
                  }
                }));
              },
              className: "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap bg-transparent border-transparent text-slate-400 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 cursor-pointer",
              children: [
                /* @__PURE__ */ jsx(Icon, { size: 14 }),
                /* @__PURE__ */ jsx("span", { children: tab.label }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px]", children: "🔒" })
              ]
            },
            tab.id
          );
        }
        return /* @__PURE__ */ jsxs(
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
          },
          tab.id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { className: "shrink-0 self-stretch flex items-center", children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.sales.invoice.create", { store_slug: store?.slug }),
          className: "relative h-full w-full lg:w-auto px-5 py-2.5 text-white rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-20 h-20 bg-indigo-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-indigo-500/60 transition-colors" }),
              /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-16 h-16 bg-purple-600/40 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-purple-500/50 transition-colors" }),
              /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" })
            ] }),
            /* @__PURE__ */ jsx(Plus, { size: 18, strokeWidth: 3, className: "relative z-10" }),
            /* @__PURE__ */ jsx("span", { className: "relative z-10", children: "New Invoice" })
          ]
        }
      ) })
    ] })
  ] });
}
export {
  SellModuleTabs as S
};
