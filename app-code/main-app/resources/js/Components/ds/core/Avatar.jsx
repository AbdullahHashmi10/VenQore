import React from "react";

const HUES = ["var(--vq-teal-400)", "var(--vq-coral-400)", "var(--vq-sky-400)", "var(--vq-butter-400)", "var(--vq-lime-400)", "var(--vq-plum-400)"];

/** Initial-or-image avatar. Deterministic colour from the name. */
export function Avatar({ name = "", src, size = 36, ring = false, style }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span style={{
      width: size, height: size, borderRadius: "var(--vq-r-full)", display: "inline-flex",
      alignItems: "center", justifyContent: "center", overflow: "hidden", flex: "0 0 auto",
      background: src ? "var(--vq-sunken)" : hue, color: "var(--vq-ink-950)",
      font: `600 ${Math.round(size * 0.38)}px/1 var(--vq-font-sans)`,
      boxShadow: ring ? "0 0 0 2px var(--vq-surface), 0 0 0 4px var(--vq-accent)" : "none", ...style,
    }}>
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </span>
  );
}

/** Overlapping stack with a +N overflow bubble. */
export function AvatarStack({ people = [], size = 32, max = 4 }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {shown.map((p, i) => (
        <span key={i} style={{ marginLeft: i ? -10 : 0, boxShadow: "0 0 0 2px var(--vq-surface)", borderRadius: 999, display: "inline-flex" }}>
          <Avatar name={typeof p === "string" ? p : p.name} src={typeof p === "string" ? undefined : p.src} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="vq-num" style={{
          marginLeft: -10, width: size, height: size, borderRadius: 999, background: "var(--vq-sunken)",
          color: "var(--vq-text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center",
          font: `600 ${Math.round(size * 0.34)}px/1 var(--vq-font-numeric)`, boxShadow: "0 0 0 2px var(--vq-surface)",
        }}>+{rest}</span>
      ) : null}
    </span>
  );
}
