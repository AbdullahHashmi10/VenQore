import React from "react";

/** Hover label. In production, portal this to <body> — never let it be clipped. */
export function Tooltip({ label, children, side = "top" }) {
  const [show, setShow] = React.useState(false);
  const pos = side === "right"
    ? { left: "calc(100% + 10px)", top: "50%", transform: `translateY(-50%) scale(${show ? 1 : .94})` }
    : { bottom: "calc(100% + 10px)", left: "50%", transform: `translateX(-50%) scale(${show ? 1 : .94})` };
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <span role="tooltip" style={{
        position: "absolute", ...pos, zIndex: 800, pointerEvents: "none", whiteSpace: "nowrap",
        padding: "7px 11px", borderRadius: "var(--vq-r-sm)",
        background: "var(--vq-ink-900)", color: "#EDF2EF",
        font: "600 12px/1 var(--vq-font-sans)", boxShadow: "var(--vq-elev-2)",
        opacity: show ? 1 : 0,
        transition: "opacity var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)",
      }}>{label}</span>
    </span>
  );
}
