import { jsx, jsxs } from "react/jsx-runtime";
import "react";
const MidnightNebula = ({
  children,
  className = "",
  active = true,
  primaryColor = "indigo",
  secondaryColor = "purple"
}) => {
  if (!active) {
    return /* @__PURE__ */ jsx("div", { className: `relative ${className}`, children });
  }
  return /* @__PURE__ */ jsxs("div", { className: `relative overflow-hidden ${className}`, children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-slate-900 z-0" }),
    /* @__PURE__ */ jsx("div", { className: `absolute top-0 right-0 w-32 h-32 bg-${primaryColor}-600/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2` }),
    /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-0 w-32 h-32 bg-${secondaryColor}-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3` }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
    /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${primaryColor}-500 to-transparent opacity-50` }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10", children })
  ] });
};
export {
  MidnightNebula as M
};
