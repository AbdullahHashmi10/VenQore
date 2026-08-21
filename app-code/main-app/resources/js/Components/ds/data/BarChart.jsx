import React from "react";

/** Rounded-cap bar chart with a highlighted bar. Playful, chunky, 2px gaps. */
export function BarChart({ data = [], labels = [], height = 170, color = "var(--vq-series-1)", highlight = -1, style }) {
  const max = Math.max(...data, 1);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { const t = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(t); }, []);
  return (
    <div style={{ ...style }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
        {data.map((v, i) => {
          const hi = i === highlight;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div title={String(v)} style={{
                height: on ? `${(v / max) * 100}%` : "4%",
                borderRadius: "var(--vq-r-sm)",
                background: hi ? color : "var(--vq-chart-track)",
                boxShadow: hi ? "var(--vq-glow-accent)" : "none",
                transition: `height 640ms var(--vq-ease-spring-soft) ${i * 45}ms, background-color var(--vq-dur-2) var(--vq-ease-out)`,
              }} />
            </div>
          );
        })}
      </div>
      {labels.length ? (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {labels.map((l, i) => (
            <span key={l + i} className="vq-num" style={{ flex: 1, textAlign: "center", font: "500 11px/1 var(--vq-font-numeric)", color: i === highlight ? "var(--vq-text)" : "var(--vq-chart-label)" }}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
