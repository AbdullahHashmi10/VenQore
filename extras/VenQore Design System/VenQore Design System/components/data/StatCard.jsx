import React from "react";

/** KPI tile: eyebrow label, big tabular figure, delta chip. */
export function StatCard({ label, value, unit, delta, deltaTone = "up", caption, icon, tone = "surface", onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const filled = tone === "accent";
  const dTone = deltaTone === "up" ? "var(--vq-success)" : deltaTone === "down" ? "var(--vq-danger)" : "var(--vq-text-3)";
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 14, padding: 20, minWidth: 0,
        borderRadius: "var(--vq-r-xl)", cursor: onClick ? "pointer" : "default",
        background: filled ? "var(--vq-grad-mint)" : "var(--vq-surface)",
        color: filled ? "#fff" : "var(--vq-text)",
        border: filled ? "1px solid transparent" : "1px solid var(--vq-line)",
        boxShadow: filled ? (hover ? "var(--vq-glow-accent-strong)" : "var(--vq-glow-accent)") : hover ? "var(--vq-elev-2)" : "var(--vq-elev-1)",
        transform: hover && onClick ? "translateY(-2px)" : "none",
        transition: "transform var(--vq-dur-3) var(--vq-ease-spring), box-shadow var(--vq-dur-3) var(--vq-ease-out)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span className="vq-eyebrow" style={{ color: filled ? "rgb(255 255 255 / .78)" : undefined }}>{label}</span>
        <span style={{
          width: 30, height: 30, borderRadius: "var(--vq-r-full)", display: "grid", placeItems: "center", flex: "0 0 auto",
          background: filled ? "rgb(255 255 255 / .18)" : "var(--vq-accent-quiet)",
          color: filled ? "#fff" : "var(--vq-accent-text)",
          transform: hover ? "rotate(-8deg) scale(1.06)" : "none",
          transition: "transform var(--vq-dur-3) var(--vq-ease-spring)",
        }}>{icon || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M7 17 17 7m0 0h-7m7 0v7"/></svg>}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="vq-metric" style={{ font: "600 var(--vq-fs-metric)/var(--vq-lh-metric) var(--vq-font-numeric)", letterSpacing: "var(--vq-ls-metric)" }}>{value}</span>
        {unit ? <span style={{ font: "500 14px/1 var(--vq-font-sans)", color: filled ? "rgb(255 255 255 / .78)" : "var(--vq-text-3)" }}>{unit}</span> : null}
      </div>
      {(delta || caption) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {delta ? (
            <span className="vq-num" style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999,
              font: "600 12px/1 var(--vq-font-numeric)",
              background: filled ? "rgb(255 255 255 / .18)" : deltaTone === "down" ? "var(--vq-danger-bg)" : "var(--vq-success-bg)",
              color: filled ? "#fff" : dTone,
            }}>{deltaTone === "down" ? "▾" : "▴"} {delta}</span>
          ) : null}
          {caption ? <span style={{ font: "500 12px/1.3 var(--vq-font-sans)", color: filled ? "rgb(255 255 255 / .8)" : "var(--vq-text-3)" }}>{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
