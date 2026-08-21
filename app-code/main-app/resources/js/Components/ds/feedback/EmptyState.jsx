import React from "react";

/** What-goes-here + one action. Never "No data". */
export function EmptyState({ title, body, action, icon, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "32px 20px", ...style }}>
      <span style={{
        width: 56, height: 56, borderRadius: "var(--vq-r-lg)", display: "grid", placeItems: "center",
        background: "var(--vq-accent-quiet)", color: "var(--vq-accent-text)",
        border: "1px solid var(--vq-accent-quiet-line)",
      }}>
        {icon || <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 21V11"/></svg>}
      </span>
      <span style={{ font: "600 16px/1.3 var(--vq-font-display)", letterSpacing: "-0.02em", color: "var(--vq-text)" }}>{title}</span>
      {body ? <span style={{ maxWidth: 320, font: "500 13.5px/1.5 var(--vq-font-sans)", color: "var(--vq-text-3)" }}>{body}</span> : null}
      {action}
    </div>
  );
}

/** Shimmer placeholder — the honest answer to "is this broken or just slow". */
export function Skeleton({ width = "100%", height = 14, radius = "var(--vq-r-sm)", style }) {
  return (
    <span style={{
      display: "block", width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--vq-sunken) 0%, var(--vq-line-soft) 40%, var(--vq-sunken) 80%)",
      backgroundSize: "300% 100%", animation: "vqShimmer 1.4s linear infinite", ...style,
    }}>
      <style>{"@keyframes vqShimmer{from{background-position:100% 0}to{background-position:-100% 0}}"}</style>
    </span>
  );
}
