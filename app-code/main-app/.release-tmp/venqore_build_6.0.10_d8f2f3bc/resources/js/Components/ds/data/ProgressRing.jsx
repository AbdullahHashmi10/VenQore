import React from "react";

/** Donut gauge. Draws with a stroke-dash sweep on mount. */
export function ProgressRing({ value = 0, size = 132, thickness = 14, label, sublabel, color = "var(--vq-accent)", track = "var(--vq-chart-track)" }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(t);
  }, [value]);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: "stroke-dashoffset var(--vq-dur-4) var(--vq-ease-out)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="vq-num" style={{ font: "600 var(--vq-fs-metric-sm)/1 var(--vq-font-numeric)", letterSpacing: "-0.02em", color: "var(--vq-text)" }}>{label ?? shown + "%"}</div>
          {sublabel ? <div className="vq-eyebrow" style={{ marginTop: 6 }}>{sublabel}</div> : null}
        </div>
      </div>
    </div>
  );
}
