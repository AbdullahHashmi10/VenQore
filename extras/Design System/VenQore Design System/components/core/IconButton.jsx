import React from "react";

/** Square-ish icon-only control. */
export function IconButton({ children, label, variant = "secondary", size = 40, active = false, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? "var(--vq-accent-quiet)" : variant === "ghost" ? "transparent" : "var(--vq-surface)";
  return (
    <button
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: hover ? (active ? "var(--vq-accent-quiet)" : "var(--vq-sunken)") : bg,
        color: active ? "var(--vq-accent-text)" : "var(--vq-text-2)",
        border: `1px solid ${variant === "ghost" ? "transparent" : "var(--vq-line)"}`,
        borderRadius: "var(--vq-r-md)", cursor: "pointer",
        boxShadow: variant === "ghost" ? "none" : "var(--vq-elev-1)",
        transition: "background-color var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)",
        transform: hover ? "translateY(-1px)" : "none", ...style,
      }}
      {...rest}
    >{children}</button>
  );
}
