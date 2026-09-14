import React from "react";

/** Feed row: tinted glyph bubble, title + meta, signed amount. */
export function ActivityRow({ title, meta, amount, tone = "neutral", icon, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const c = tone === "in" ? "var(--vq-success)" : tone === "out" ? "var(--vq-danger)" : "var(--vq-text-2)";
  const bg = tone === "in" ? "var(--vq-success-bg)" : tone === "out" ? "var(--vq-danger-bg)" : "var(--vq-sunken)";
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--vq-r-md)",
        background: hover ? "var(--vq-sunken)" : "transparent", cursor: onClick ? "pointer" : "default",
        transition: "background-color var(--vq-dur-1) var(--vq-ease-out)", ...style,
      }}>
      <span style={{ width: 32, height: 32, borderRadius: "var(--vq-r-sm)", background: bg, color: c, display: "grid", placeItems: "center", flex: "0 0 auto", font: "600 15px/1 var(--vq-font-numeric)" }}>
        {icon || (tone === "out" ? "−" : tone === "in" ? "+" : "•")}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ font: "600 13.5px/1.3 var(--vq-font-sans)", color: "var(--vq-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {meta ? <span style={{ font: "500 12px/1.3 var(--vq-font-sans)", color: "var(--vq-text-3)" }}>{meta}</span> : null}
      </span>
      {amount ? <span className="vq-num" style={{ font: "600 13px/1 var(--vq-font-numeric)", color: tone === "out" ? "var(--vq-danger)" : tone === "in" ? "var(--vq-success)" : "var(--vq-text)" }}>{amount}</span> : null}
    </div>
  );
}
