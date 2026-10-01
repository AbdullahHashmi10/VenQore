import React from "react";

/** Floating confirmation. Springs up from the bottom-right. */
export function Toast({ title, description, tone = "success", onDismiss, visible = true, style }) {
  const fg = tone === "danger" ? "var(--vq-danger)" : tone === "warning" ? "var(--vq-warning)" : "var(--vq-success)";
  return (
    <div role="status" style={{
      display: "flex", gap: 12, alignItems: "flex-start", width: 340, padding: 16,
      background: "var(--vq-raised)", border: "1px solid var(--vq-line)", borderRadius: "var(--vq-r-lg)",
      boxShadow: "var(--vq-elev-3)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(.96)",
      transition: "opacity var(--vq-dur-3) var(--vq-ease-out), transform var(--vq-dur-3) var(--vq-ease-spring)",
      ...style,
    }}>
      <span style={{ width: 30, height: 30, borderRadius: 999, flex: "0 0 auto", display: "grid", placeItems: "center", background: "var(--vq-accent-quiet)", color: fg }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="m5 13 4.5 4.5L19 7"/></svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", font: "600 14px/1.35 var(--vq-font-sans)", color: "var(--vq-text)" }}>{title}</span>
        {description ? <span style={{ display: "block", marginTop: 2, font: "500 12.5px/1.45 var(--vq-font-sans)", color: "var(--vq-text-3)" }}>{description}</span> : null}
      </span>
      {onDismiss ? (
        <button aria-label="Dismiss" onClick={onDismiss} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--vq-text-3)", lineHeight: 0, padding: 2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      ) : null}
    </div>
  );
}
