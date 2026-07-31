import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { ArrowRight, CreditCard, TrendingUp, TrendingDown, List, Repeat, Wallet, Check, Landmark, ChevronDown, ChevronRight } from "lucide-react";
function MoneyModuleTabs({ activeTab, className = "" }) {
  const { store } = usePage().props;
  const getRoute = (name, params = {}) => {
    try {
      return route(`store.${name}`, { ...params, store_slug: store?.slug });
    } catch (e) {
      return "#";
    }
  };
  const groups = useMemo(() => [
    {
      id: "cash-flow",
      label: "Cash Flow",
      icon: Repeat,
      items: [
        { id: "payments", label: "Payments", href: getRoute("payments.index"), icon: ArrowRight },
        { id: "expenses", label: "Expenses", href: getRoute("expenses.index"), icon: CreditCard },
        { id: "receivables", label: "To Receive", href: getRoute("finance.receivables"), icon: TrendingUp },
        { id: "payables", label: "To Pay", href: getRoute("finance.payables"), icon: TrendingDown },
        { id: "all", label: "All Transactions", href: getRoute("transactions.index"), icon: List }
      ]
    },
    {
      id: "banking",
      label: "Banking",
      icon: Landmark,
      items: [
        { id: "funds", label: "Fund Management", href: getRoute("funds.index"), icon: Wallet },
        { id: "accounts", label: "Bank Accounts", href: getRoute("bank-accounts.index"), icon: Wallet },
        { id: "reconciliation", label: "Bank Reconciliation", href: getRoute("bank-reconciliation.index"), icon: Check }
      ]
    }
  ], []);
  const [activeGroup, setActiveGroup] = useState(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : "cash-flow";
  });
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [activeTab, groups]);
  const currentGroup = groups.find((g) => g.id === activeGroup);
  const activeItemObj = currentGroup?.items.find((item) => item.id === activeTab);
  const ActiveIcon = activeItemObj?.icon || currentGroup?.icon;
  return /* @__PURE__ */ jsxs("div", { className: `flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm shrink-0 ${className}`, children: [
    /* @__PURE__ */ jsx("div", { className: "flex lg:hidden items-center justify-between w-full", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setIsExpanded(!isExpanded),
        className: "flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200",
        children: [
          ActiveIcon && /* @__PURE__ */ jsx(ActiveIcon, { size: 16, className: "text-indigo-600 dark:text-indigo-400" }),
          /* @__PURE__ */ jsxs("span", { children: [
            currentGroup?.label,
            ": ",
            activeItemObj?.label || activeTab
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}` })
        ]
      }
    ) }),
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
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade", children: currentGroup?.items.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
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
      }) })
    ] })
  ] });
}
export {
  MoneyModuleTabs as M
};
