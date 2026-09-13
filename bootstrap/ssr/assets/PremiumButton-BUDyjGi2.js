import { jsxs, jsx } from "react/jsx-runtime";
import "react";
function PremiumButton({ children, onClick, className = "", type = "button", disabled = false }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type,
      onClick,
      disabled,
      className: `
                relative group overflow-hidden rounded-xl shadow-lg active:scale-95 transition-all duration-slow
                ${disabled ? "opacity-70 cursor-not-allowed" : ""}
                ${className}
`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-neutral-900 z-0", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-full h-full bg-brand-600/40 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-slower" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-full bg-brand-600/30 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-slower" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 group-hover:from-neutral-700 group-hover:to-neutral-800 transition-colors duration-slow" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center justify-center gap-2 px-6 py-3 text-white font-bold tracking-wide", children })
      ]
    }
  );
}
export {
  PremiumButton as P
};
