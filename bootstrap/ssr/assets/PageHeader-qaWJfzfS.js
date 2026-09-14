import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage } from "@inertiajs/react";
function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  icon: Icon
}) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      Icon && /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl", children: /* @__PURE__ */ jsx(Icon, { size: 24 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-ink tracking-tight", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-0.5", children: subtitle })
      ] })
    ] }),
    actions && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: actions })
  ] }) });
}
export {
  PageHeader as P
};
