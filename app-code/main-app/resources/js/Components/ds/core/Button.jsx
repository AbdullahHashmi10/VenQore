import React from "react";

const SIZES = {
  sm: { h: "var(--vq-control-sm)", px: 16, fs: 13 },
  md: { h: "var(--vq-control-md)", px: 22, fs: 14 },
  lg: { h: "var(--vq-control-lg)", px: 28, fs: 15 },
};

const VARIANTS = {
  primary: { bg: "var(--vq-accent-fill)", fg: "var(--vq-on-accent)", bd: "transparent", sh: "var(--vq-glow-accent)" },
  secondary: { bg: "var(--vq-surface)", fg: "var(--vq-text)", bd: "var(--vq-line)", sh: "var(--vq-elev-1)" },
  soft: { bg: "var(--vq-accent-quiet)", fg: "var(--vq-accent-text)", bd: "var(--vq-accent-quiet-line)", sh: "none" },
  ghost: { bg: "transparent", fg: "var(--vq-text-2)", bd: "transparent", sh: "none" },
  danger: { bg: "var(--vq-danger)", fg: "var(--vq-on-danger)", bd: "transparent", sh: "none" },
};

/** Pill button. One primary per view. */
export function Button({
  children, variant = "primary", size = "md", icon, iconAfter,
  full = false, disabled = false, onClick, type = "button", style, ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        height: s.h, padding: `0 ${s.px}px`, width: full ? "100%" : undefined,
        font: `${size === "lg" ? 600 : 600} ${s.fs}px/1 var(--vq-font-sans)`,
        letterSpacing: "-0.01em",
        background: hover && !disabled && variant === "primary" ? "var(--vq-accent-fill-hover)"
          : hover && !disabled && variant === "secondary" ? "var(--vq-surface-2)"
          : hover && !disabled && variant === "ghost" ? "var(--vq-sunken)" : v.bg,
        color: v.fg,
        border: `1px solid ${v.bd}`,
        borderRadius: "var(--vq-r-full)",
        boxShadow: press ? "none" : hover && variant === "primary" ? "var(--vq-glow-accent-strong)" : v.sh,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transform: press ? "scale(.97)" : hover && !disabled ? "translateY(-1px)" : "none",
        transition: "transform var(--vq-dur-2) var(--vq-ease-spring), background-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), opacity var(--vq-dur-1) linear",
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ display: "flex", fontSize: "1.1em" }}>{icon}</span> : null}
      {children}
      {iconAfter ? <span style={{ display: "flex", transform: hover ? "translateX(2px)" : "none", transition: "transform var(--vq-dur-2) var(--vq-ease-spring)" }}>{iconAfter}</span> : null}
    </button>
  );
}
