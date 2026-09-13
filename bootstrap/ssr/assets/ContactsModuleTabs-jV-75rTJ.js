import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { b as useTerms, u as useTermText } from "./terms-DwYjlWsV.js";
import { Users, Briefcase, FileText, Handshake, Clock, Send, ChevronRight } from "lucide-react";
function ContactsModuleTabs({ activeTab }) {
  const { store, modules } = usePage().props;
  const { tp } = useTerms();
  const tt = useTermText();
  const getRoute = (name, params = {}) => {
    try {
      return route(`store.${name}`, { ...params, store_slug: store?.slug });
    } catch (e) {
      console.warn(`Route ${name} not found`);
      return "#";
    }
  };
  const rawGroups = [
    {
      id: "partners",
      label: "Partners",
      icon: Handshake,
      items: [
        { id: "customers", label: tp("customer", "Customers"), href: getRoute("parties.index", { type: "customer" }), icon: Users },
        { id: "suppliers", label: tp("supplier", "Suppliers"), href: getRoute("parties.index", { type: "supplier" }), icon: Briefcase },
        { id: "all", label: "All Parties", href: getRoute("parties.index"), icon: Users },
        { id: "ledgers", label: "Ledgers", href: getRoute("parties.ledgers"), icon: FileText }
      ]
    },
    {
      id: "team",
      label: "Team",
      icon: Users,
      items: [
        { id: "attendance", label: tt("Staff Attendance"), href: getRoute("admin.attendance", { tab: "attendance" }), icon: Clock },
        { id: "summaries", label: tt("Staff Summaries"), href: getRoute("admin.attendance", { tab: "summaries" }), icon: FileText },
        { id: "members", label: "Members", href: getRoute("admin.attendance", { tab: "members" }), icon: Users },
        { id: "invitations", label: "Invitations", href: getRoute("admin.attendance", { tab: "invitations" }), icon: Send }
      ]
    }
  ];
  const itemModuleMap = {
    "customers": ["customers"],
    "suppliers": ["suppliers"],
    "all": ["customers", "suppliers"],
    "ledgers": ["khata_credit"],
    "attendance": ["staff_attendance"],
    "summaries": ["staff_attendance"],
    "members": ["staff_attendance"],
    "invitations": ["staff_attendance"]
  };
  const groups = React.useMemo(() => {
    if (!Array.isArray(modules)) {
      return rawGroups;
    }
    return rawGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const req = itemModuleMap[item.id];
        return !req || req.some((m) => modules.includes(m));
      })
    })).filter((group) => group.items.length > 0);
  }, [rawGroups, modules]);
  const getInitialGroup = () => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    return foundGroup ? foundGroup.id : groups[0]?.id || "partners";
  };
  const [activeGroup, setActiveGroup] = useState(getInitialGroup);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    const foundGroup = groups.find((g) => g.items.some((item) => item.id === activeTab));
    if (foundGroup) {
      setActiveGroup(foundGroup.id);
    } else if (groups[0]) {
      setActiveGroup(groups[0].id);
    }
  }, [activeTab, groups]);
  const activeGroupObj = groups.find((g) => g.id === activeGroup);
  const activeItemObj = activeGroupObj?.items.find((item) => item.id === activeTab);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 shrink-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:hidden flex items-center justify-between bg-surface border border-line p-2.5 rounded-xl shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Handshake, { size: 16, className: "text-brand-500" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-tight", children: [
          "Directory: ",
          /* @__PURE__ */ jsxs("span", { className: "text-ink font-bold", children: [
            activeGroupObj?.label || "Partners",
            activeItemObj ? ` > ${activeItemObj.label}` : ""
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsExpanded(!isExpanded),
          className: "px-2 py-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-all flex items-center gap-1 border border-line",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider", children: isExpanded ? "Collapse" : "Expand" }),
            /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `transition-transform duration-normal ${isExpanded ? "rotate-90" : ""}` })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `
                flex flex-col lg:flex-row lg:items-center gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm
                ${isExpanded ? "flex" : "hidden lg:flex"}
`, children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full", children: groups.map((group) => {
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
  ContactsModuleTabs as C
};
