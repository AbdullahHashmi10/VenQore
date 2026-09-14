import React from "react";

/** Selectable filter chip / segment. */
export function Chip({ children, selected = false, onClick, count, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px",
        background: selected ? "var(--vq-accent-fill)" : hover ? "var(--vq-sunken)" : "var(--vq-surface)",
        color: selected ? "var(--vq-on-accent)" : "var(--vq-text-2)",
        border: `1px solid ${selected ? "transparent" : "var(--vq-line)"}`,
        borderRadius: "var(--vq-r-full)", cursor: "pointer",
        font: "600 13px/1 var(--vq-font-sans)",
        boxShadow: selected ? "var(--vq-glow-accent)" : "none",
        transform: hover && !selected ? "translateY(-1px)" : "none",
        transition: "background-color var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), border-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)", ...style,
      }}
    >
      {children}
      {count != null ? (
        <span className="vq-num" style={{
          fontSize: 11, padding: "2px 6px", borderRadius: 999,
          background: selected ? "rgb(255 255 255 / .22)" : "var(--vq-sunken)",
          color: selected ? "var(--vq-on-accent)" : "var(--vq-text-3)",
        }}>{count}</span>
      ) : null}
    </button>
  );
}
