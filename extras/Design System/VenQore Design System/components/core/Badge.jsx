import React from "react";

const TONES = {
  neutral: ["var(--vq-sunken)", "var(--vq-text-2)", "var(--vq-line)"],
  accent: ["var(--vq-accent-quiet)", "var(--vq-accent-text)", "var(--vq-accent-quiet-line)"],
  success: ["var(--vq-success-bg)", "var(--vq-success)", "var(--vq-success-line)"],
  warning: ["var(--vq-warning-bg)", "var(--vq-warning)", "var(--vq-warning-line)"],
  danger: ["var(--vq-danger-bg)", "var(--vq-danger)", "var(--vq-danger-line)"],
  info: ["var(--vq-info-bg)", "var(--vq-info)", "var(--vq-info-line)"],
};

/** Status pill. Colour never carries the meaning alone — always a word, usually a dot. */
export function Badge({ children, tone = "neutral", dot = true, icon, style }) {
  const [bg, fg, bd] = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px",
      background: bg, color: fg, border: `1px solid ${bd}`, borderRadius: "var(--vq-r-full)",
      font: "600 12px/1 var(--vq-font-sans)", letterSpacing: "-0.005em", whiteSpace: "nowrap", ...style,
    }}>
      {icon || (dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} /> : null)}
      {children}
    </span>
  );
}
