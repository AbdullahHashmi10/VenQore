import { jsxs, jsx } from "react/jsx-runtime";
import "react";
function SectionHeader({ title, description, className = "" }) {
  return /* @__PURE__ */ jsxs("div", { className: `mb-6 ${className}`, children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: description })
  ] });
}
export {
  SectionHeader as S
};
