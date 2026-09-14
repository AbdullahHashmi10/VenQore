import { jsxs, jsx } from "react/jsx-runtime";
import React from "react";
const SIZES = {
  sm: { h: "var(--vq-control-sm)", px: 16, fs: 13 },
  md: { h: "var(--vq-control-md)", px: 22, fs: 14 },
  lg: { h: "var(--vq-control-lg)", px: 28, fs: 15 }
};
const VARIANTS = {
  primary: { bg: "var(--vq-accent-fill)", fg: "var(--vq-on-accent)", bd: "transparent", sh: "var(--vq-glow-accent)" },
  secondary: { bg: "var(--vq-surface)", fg: "var(--vq-text)", bd: "var(--vq-line)", sh: "var(--vq-elev-1)" },
  soft: { bg: "var(--vq-accent-quiet)", fg: "var(--vq-accent-text)", bd: "var(--vq-accent-quiet-line)", sh: "none" },
  ghost: { bg: "transparent", fg: "var(--vq-text-2)", bd: "transparent", sh: "none" },
  danger: { bg: "var(--vq-danger)", fg: "var(--vq-on-danger)", bd: "transparent", sh: "none" }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  full = false,
  pill = false,
  disabled = false,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type,
      disabled,
      onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => {
        setHover(false);
        setPress(false);
      },
      onMouseDown: () => setPress(true),
      onMouseUp: () => setPress(false),
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: s.h,
        padding: `0 ${s.px}px`,
        width: full ? "100%" : void 0,
        font: `${size === "lg" ? 600 : 600} ${s.fs}px/1 var(--vq-font-sans)`,
        letterSpacing: "-0.01em",
        background: hover && !disabled && variant === "primary" ? "var(--vq-accent-fill-hover)" : hover && !disabled && variant === "secondary" ? "var(--vq-surface-2)" : hover && !disabled && variant === "ghost" ? "var(--vq-sunken)" : v.bg,
        color: v.fg,
        border: `1px solid ${v.bd}`,
        // §13: lg (20px) is the standard button; `pill` is the deliberate 999px
        // case. This used to be r-full unconditionally, which is why a
        // full-width button read 24px narrower than the input above it at
        // the seam where they meet.
        borderRadius: pill ? "var(--vq-r-full)" : "var(--vq-r-lg)",
        boxShadow: press ? "none" : hover && variant === "primary" ? "var(--vq-glow-accent-strong)" : v.sh,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transform: press ? "scale(.97)" : hover && !disabled ? "translateY(-1px)" : "none",
        transition: "transform var(--vq-dur-2) var(--vq-ease-spring), background-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), opacity var(--vq-dur-1) linear",
        ...style
      },
      ...rest,
      children: [
        icon ? /* @__PURE__ */ jsx("span", { style: { display: "flex", fontSize: "1.1em" }, children: icon }) : null,
        children,
        iconAfter ? /* @__PURE__ */ jsx("span", { style: { display: "flex", transform: hover ? "translateX(2px)" : "none", transition: "transform var(--vq-dur-2) var(--vq-ease-spring)" }, children: iconAfter }) : null
      ]
    }
  );
}
const Input = React.forwardRef(function Input2({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  size = "md",
  disabled = false,
  id,
  style,
  className,
  ...rest
}, ref) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  const h = size === "lg" ? "var(--vq-control-xl)" : "var(--vq-control-lg)";
  const border = error ? "var(--vq-danger)" : focus ? "var(--vq-focus)" : "var(--vq-line)";
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6, ...style }, children: [
    label ? /* @__PURE__ */ jsx("label", { htmlFor: fid, style: { font: "600 13px/1.3 var(--vq-font-sans)", color: "var(--vq-text-2)" }, children: label }) : null,
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: h,
      padding: "0 16px",
      background: disabled ? "var(--vq-sunken)" : "var(--vq-surface)",
      border: `1px solid ${border}`,
      borderRadius: "var(--vq-r-md)",
      boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
      transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)"
    }, children: [
      prefix ? /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)", display: "flex" }, children: prefix }) : null,
      /* @__PURE__ */ jsx(
        "input",
        {
          ref,
          id: fid,
          type,
          value,
          placeholder,
          disabled,
          onChange,
          onFocus: (e) => {
            setFocus(true);
            rest.onFocus?.(e);
          },
          onBlur: (e) => {
            setFocus(false);
            rest.onBlur?.(e);
          },
          className,
          style: {
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            background: "transparent",
            font: "500 16px/1 var(--vq-font-sans)",
            color: "var(--vq-text)"
          },
          ...rest
        }
      ),
      suffix ? /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-3)", display: "flex" }, children: suffix }) : null
    ] }),
    error || hint ? /* @__PURE__ */ jsx("span", { style: { font: "500 12px/1.4 var(--vq-font-sans)", color: error ? "var(--vq-danger)" : "var(--vq-text-3)" }, children: error || hint }) : null
  ] });
});
export {
  Button as B,
  Input as I
};
