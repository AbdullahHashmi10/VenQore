import React from "react";

/** Segmented pill tabs with a sliding mint thumb. */
export function Tabs({ tabs = [], value, onChange, size = "md", style }) {
  const active = Math.max(0, tabs.findIndex(t => (typeof t === "string" ? t : t.value) === value));
  const h = size === "sm" ? 34 : 42;
  return (
    <div style={{
      position: "relative", display: "inline-grid", gridAutoFlow: "column", gridAutoColumns: "1fr",
      padding: 4, height: h + 8, background: "var(--vq-sunken)", borderRadius: "var(--vq-r-full)", ...style,
    }}>
      <span style={{
        position: "absolute", top: 4, bottom: 4, left: 4, width: `calc((100% - 8px) / ${tabs.length})`,
        transform: `translateX(${active * 100}%)`, background: "var(--vq-surface)",
        borderRadius: "var(--vq-r-full)", boxShadow: "var(--vq-elev-1)",
        transition: "transform var(--vq-dur-3) var(--vq-ease-spring)",
      }} />
      {tabs.map((t, i) => {
        const v = typeof t === "string" ? t : t.value;
        const l = typeof t === "string" ? t : t.label;
        return (
          <button key={v} onClick={() => onChange && onChange(v)} style={{
            position: "relative", zIndex: 1, height: h, padding: "0 18px", background: "none", border: 0,
            cursor: "pointer", whiteSpace: "nowrap",
            font: `${i === active ? 600 : 500} ${size === "sm" ? 13 : 14}px/1 var(--vq-font-sans)`,
            color: i === active ? "var(--vq-text)" : "var(--vq-text-3)",
            transition: "color var(--vq-dur-2) var(--vq-ease-out)",
          }}>{l}</button>
        );
      })}
    </div>
  );
}
