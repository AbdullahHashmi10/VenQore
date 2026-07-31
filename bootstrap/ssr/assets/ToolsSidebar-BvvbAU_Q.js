import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "@inertiajs/react";
import { X, Menu } from "lucide-react";
function ToolsSidebar({ groups = [], currentSlug = null }) {
  const [open, setOpen] = useState(false);
  const Item = ({ tool }) => {
    const isCurrent = tool.slug === currentSlug;
    const base = "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors";
    if (tool.status !== "live" || !tool.href) {
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: `${base} text-slate-400 dark:text-slate-600 cursor-default select-none`,
          title: "Coming soon",
          children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: tool.short }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 shrink-0", children: "Soon" })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx(
      Link,
      {
        href: tool.href,
        onClick: () => setOpen(false),
        className: `${base} ${isCurrent ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]"}`,
        children: /* @__PURE__ */ jsx("span", { className: "truncate", children: tool.short })
      }
    );
  };
  const Nav = () => /* @__PURE__ */ jsx("nav", { className: "space-y-6", children: groups.map((group) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-2 px-3", children: group.label }),
    /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: group.tools.map((tool) => /* @__PURE__ */ jsx(Item, { tool }, tool.slug)) })
  ] }, group.key)) });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:hidden mb-6", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setOpen((v) => !v),
          className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-300",
          children: [
            open ? /* @__PURE__ */ jsx(X, { size: 16 }) : /* @__PURE__ */ jsx(Menu, { size: 16 }),
            "All tools"
          ]
        }
      ),
      open && /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.03] border border-slate-900/[0.06] dark:border-white/10", children: /* @__PURE__ */ jsx(Nav, {}) })
    ] }),
    /* @__PURE__ */ jsx("aside", { className: "hidden lg:block w-56 shrink-0 sticky top-36 self-start", children: /* @__PURE__ */ jsx(Nav, {}) })
  ] });
}
export {
  ToolsSidebar as default
};
