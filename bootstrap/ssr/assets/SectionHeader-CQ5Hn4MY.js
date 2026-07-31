import { jsxs, jsx } from "react/jsx-runtime";
import "react";
function SectionHeader({ title, description, className = "" }) {
  return /* @__PURE__ */ jsxs("div", { className: `mb-6 ${className}`, children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: description })
  ] });
}
export {
  SectionHeader as S
};
