import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Users, Briefcase, FileText, Handshake, Clock, Send, ChevronRight } from "lucide-react";
function ContactsModuleTabs({ activeTab }) {
  const { store } = usePage().props;
  const getRoute = (name, params = {}) => {
    try {
      return route(`store.${name}`, { ...params, store_slug: store?.slug });
    } catch (e) {
      console.warn(`Route ${name} not found`);
      return "#";
    }
  };
  const groups = [
    {
      id: "partners",
      label: "Partners",
      icon: Handshake,
      items: [
        { id: "customers", label: "Customers", href: getRoute("parties.index", { type: "customer" }), icon: Users },
        { id: "suppliers", label: "Suppliers", href: getRoute("parties.index", { type: "supplier" }), icon: Briefcase },
        { id: "all", label: "All Parties", href: getRoute("parties.index"), icon: Users },
        { id: "ledgers", label: "Ledgers", href: getRoute("parties.ledgers"), icon: FileText }
      ]
    },
    {
      id: "team",
      label: "Team",
      icon: Users,
      items: [
        { id: "attendance", label: "Staff Attendance", href: getRoute("admin.attendance", { tab: "attendance" }), icon: Clock },
        { id: "summaries", label: "Staff Summaries", href: getRoute("admin.attendance", { tab: "summaries" }), icon: FileText },
        { id: "members", label: "Members", href: getRoute("admin.attendance", { tab: "members" }), icon: Users },
        { id: "invitations", label: "Invitations", href: getRoute("admin.attendance", { tab: "invitations" }), icon: Send }
      ]
    }
  ];
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : "partners";
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
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 shrink-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Handshake, { size: 16, className: "text-indigo-500" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight", children: [
          "Directory: ",
          /* @__PURE__ */ jsxs("span", { className: "text-slate-800 dark:text-white font-black", children: [
            activeGroupObj?.label || "Partners",
            activeItemObj ? ` > ${activeItemObj.label}` : ""
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsExpanded(!isExpanded),
          className: "px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-all flex items-center gap-1 border border-slate-200 dark:border-slate-700",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold uppercase tracking-wider", children: isExpanded ? "Collapse" : "Expand" }),
            /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}` })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `
                flex flex-col lg:flex-row lg:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm
                ${isExpanded ? "flex" : "hidden lg:flex"}
            `, children: [
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
  ContactsModuleTabs as C
};
