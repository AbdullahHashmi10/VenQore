import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Link } from "@inertiajs/react";
import { ClipboardList, Calendar, Wrench, Sparkles, Plus } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
function ServiceNavTabs({ active = "jobs" }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const tabs = [
    {
      key: "jobs",
      label: tt("Work Orders"),
      icon: ClipboardList,
      href: route("store.service-jobs.index", { store_slug: storeSlug }),
      description: "Field jobs, work orders & statuses"
    },
    {
      key: "calendar",
      label: "Dispatch Calendar",
      icon: Calendar,
      href: route("store.service-jobs.calendar", { store_slug: storeSlug }),
      description: "Technician lanes & schedule slots"
    },
    {
      key: "tools",
      label: "Tools & Equipment",
      icon: Wrench,
      href: route("store.tools.index", { store_slug: storeSlug }),
      description: "Tool checkout, custody & maintenance"
    },
    {
      key: "catalog",
      label: tt("Services Catalog"),
      icon: Sparkles,
      href: route("store.services.catalogue", { store_slug: storeSlug }) + "?type=service",
      description: "Standard services, pricing & add-ons"
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4", children: [
    /* @__PURE__ */ jsx("nav", { className: "flex flex-wrap items-center gap-1.5 sm:gap-2", children: tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = active === tab.key;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          href: tab.href,
          className: `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-fast ${isActive ? "bg-accent-fill text-accent-on shadow-sm" : "bg-surface text-ink-secondary hover:bg-sunken hover:text-ink border border-line"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 15, className: isActive ? "text-accent-on" : "text-ink-muted" }),
            /* @__PURE__ */ jsx("span", { children: tab.label })
          ]
        },
        tab.key
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(
      Link,
      {
        href: route("store.service-jobs.create", { store_slug: storeSlug }),
        className: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface border border-line px-3 text-xs font-semibold text-ink hover:bg-sunken transition-colors",
        children: [
          /* @__PURE__ */ jsx(Plus, { size: 14, className: "text-accent-text" }),
          /* @__PURE__ */ jsx("span", { children: tt("New Work Order") })
        ]
      }
    ) })
  ] });
}
export {
  ServiceNavTabs as default
};
