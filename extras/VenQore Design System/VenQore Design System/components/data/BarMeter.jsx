import React from "react";

/** Labelled horizontal meter: dot, label, track, value. */
export function BarMeter({ label, value, max = 100, display, color = "var(--vq-accent)", style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const t = requestAnimationFrame(() => setW(pct)); return () => cancelAnimationFrame(t); }, [pct]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12, ...style }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "500 13px/1 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
        {label}
      </span>
      <span style={{ height: 8, borderRadius: 999, background: "var(--vq-chart-track)", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: w + "%", borderRadius: 999, background: color, transition: "width var(--vq-dur-4) var(--vq-ease-out)" }} />
      </span>
      <span className="vq-num" style={{ font: "600 13px/1 var(--vq-font-numeric)", color: "var(--vq-text)", minWidth: 44, textAlign: "right" }}>{display ?? pct.toFixed(0) + "%"}</span>
    </div>
  );
}
