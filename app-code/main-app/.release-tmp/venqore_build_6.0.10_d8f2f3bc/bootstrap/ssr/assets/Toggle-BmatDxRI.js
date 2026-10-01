import { jsxs, jsx } from "react/jsx-runtime";
import "react";
function Toggle({
  enabled,
  onChange,
  label,
  description,
  icon: Icon,
  iconColor = "brand",
  upcoming = false,
  comingSoon = false,
  variant = "default",
  disabled = false,
  className = ""
}) {
  const isChecked = Boolean(enabled);
  const isDisabled = upcoming || comingSoon || disabled;
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between py-3.5 ${isDisabled ? "opacity-60 grayscale-[0.5]" : ""} ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5 flex-1 pr-4 min-w-0", children: [
      Icon && /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" : "bg-app text-ink-muted"}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("p", { className: `font-bold text-sm leading-snug ${variant === "danger" ? "text-red-600 dark:text-red-400" : "text-ink"}`, children: label }),
          upcoming && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-4xs font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30", children: "Upcoming" }),
          comingSoon && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-4xs font-bold uppercase tracking-wider rounded border border-sky-200 dark:border-sky-500/30", children: "Coming Soon" }),
          variant === "danger" && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-4xs font-bold uppercase tracking-wider rounded border border-red-200 dark:border-red-500/30", children: "Warning" })
        ] }),
        description && /* @__PURE__ */ jsx("p", { className: `text-xs mt-0.5 leading-relaxed ${variant === "danger" ? "text-red-500/80" : "text-ink-muted"}`, children: description })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": isChecked,
        "aria-label": typeof label === "string" ? label : "Toggle",
        disabled: isDisabled,
        onClick: () => !isDisabled && onChange(!isChecked),
        className: `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${isDisabled ? "cursor-not-allowed bg-sunken" : isChecked ? variant === "danger" ? "bg-red-600" : "bg-brand-600" : "bg-sunken dark:bg-white/10"}`,
        children: /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isChecked ? "translate-x-5" : "translate-x-0"}`
          }
        )
      }
    )
  ] });
}
export {
  Toggle as T
};
