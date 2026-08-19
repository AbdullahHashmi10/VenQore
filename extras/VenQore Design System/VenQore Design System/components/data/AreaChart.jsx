import React from "react";

/** Dependency-free area + line chart. One series, mint by default. */
export function AreaChart({ data = [], labels = [], height = 200, color = "var(--vq-series-1)", showGrid = true, valueFormat = v => v, style }) {
  const w = 640, pad = { l: 8, r: 8, t: 14, b: 24 };
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const span = max - min || 1;
  const x = i => pad.l + (i * (w - pad.l - pad.r)) / Math.max(data.length - 1, 1);
  const y = v => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height - pad.b} L${x(0)},${height - pad.b} Z`;
  const gid = React.useId().replace(/:/g, "");
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { const t = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(t); }, []);
  return (
    <div style={{ width: "100%", ...style }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid ? [0, .25, .5, .75, 1].map(t => (
          <line key={t} x1={pad.l} x2={w - pad.r} y1={pad.t + t * (height - pad.t - pad.b)} y2={pad.t + t * (height - pad.t - pad.b)}
            stroke="var(--vq-chart-grid)" strokeWidth="1" strokeDasharray="4 6" />
        )) : null}
        <path d={area} fill={`url(#${gid})`} style={{ opacity: on ? 1 : 0, transition: "opacity var(--vq-dur-4) var(--vq-ease-out) 120ms" }} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          pathLength="1" strokeDasharray="1" strokeDashoffset={on ? 0 : 1}
          style={{ transition: "stroke-dashoffset 900ms var(--vq-ease-out)" }} />
        {data.map((v, i) => i === data.length - 1 ? (
          <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill="var(--vq-chart-surface)" stroke={color} strokeWidth="2.5" />
        ) : null)}
      </svg>
      {labels.length ? (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {labels.map(l => <span key={l} className="vq-num" style={{ font: "500 11px/1 var(--vq-font-numeric)", color: "var(--vq-chart-label)" }}>{l}</span>)}
        </div>
      ) : null}
    </div>
  );
}
