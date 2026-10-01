import React from "react";

const TONES = {
  info: ["var(--vq-info-bg)", "var(--vq-info)", "var(--vq-info-line)"],
  success: ["var(--vq-success-bg)", "var(--vq-success)", "var(--vq-success-line)"],
  warning: ["var(--vq-warning-bg)", "var(--vq-warning)", "var(--vq-warning-line)"],
  danger: ["var(--vq-danger-bg)", "var(--vq-danger)", "var(--vq-danger-line)"],
};

/** Inline alert row. Icon + word, never colour alone. */
export function Alert({ children, tone = "info", icon, action, onDismiss, style }) {
  const [bg, fg, bd] = TONES[tone] || TONES.info;
  return (
    <div role="status" style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
      background: bg, border: `1px solid ${bd}`, borderRadius: "var(--vq-r-md)",
      font: "600 13px/1.4 var(--vq-font-sans)", color: fg, ...style,
    }}>
      <span style={{ display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        {icon || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3.2v.1"/></svg>}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {action}
      {onDismiss ? (
        <button aria-label="Dismiss" onClick={onDismiss} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", opacity: .7, padding: 2, lineHeight: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      ) : null}
    </div>
  );
}
