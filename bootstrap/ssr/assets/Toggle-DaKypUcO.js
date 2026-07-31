import { jsxs, jsx } from "react/jsx-runtime";
import "react";
function Toggle({ enabled, onChange, label, description, upcoming = false, comingSoon = false, variant = "default", disabled = false }) {
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between py-4 ${upcoming || comingSoon || disabled ? "opacity-60 grayscale-[0.5]" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 pr-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("p", { className: `font-bold text-sm ${variant === "danger" ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"}`, children: label }),
        upcoming && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30", children: "Upcoming" }),
        comingSoon && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider rounded border border-blue-200 dark:border-blue-500/30", children: "Coming Soon" }),
        variant === "danger" && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-wider rounded border border-red-200 dark:border-red-500/30", children: "Risk" })
      ] }),
      description && /* @__PURE__ */ jsx("p", { className: `text-xs mt-0.5 ${variant === "danger" ? "text-red-500/80" : "text-slate-500"}`, children: description })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        disabled: upcoming || comingSoon || disabled,
        onClick: () => onChange(!enabled),
        className: `relative w-12 h-6 rounded-full transition-all duration-200 ${upcoming || comingSoon || disabled ? "cursor-not-allowed bg-slate-200 dark:bg-slate-700" : enabled ? variant === "danger" ? "bg-red-600 shadow-lg shadow-red-500/30" : "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-300 dark:bg-slate-600"}`,
        children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${enabled && !upcoming && !comingSoon && !disabled ? "left-7" : "left-1"}` })
      }
    )
  ] });
}
export {
  Toggle as T
};
