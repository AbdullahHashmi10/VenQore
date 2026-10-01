import React from "react";

/** Toggle. The knob overshoots slightly — the one place a spring is obvious. */
export function Switch({ label, checked = false, onChange, disabled = false, id, style }) {
  const fid = id || React.useId();
  return (
    <label htmlFor={fid} style={{
      display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, font: "500 14px/1.4 var(--vq-font-sans)", color: "var(--vq-text)", ...style,
    }}>
      <input id={fid} type="checkbox" checked={checked} disabled={disabled}
        onChange={e => onChange && onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{
        width: 46, height: 26, borderRadius: 999, padding: 3, flex: "0 0 auto",
        background: checked ? "var(--vq-accent-fill)" : "var(--vq-line-strong)",
        boxShadow: checked ? "var(--vq-glow-accent)" : "none",
        transition: "background-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
        display: "flex", alignItems: "center",
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: "var(--vq-r-full)", background: "var(--vq-surface)",
          boxShadow: "0 1px 3px rgb(13 20 18 / .3)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform var(--vq-dur-3) var(--vq-ease-spring)",
        }} />
      </span>
      {label}
    </label>
  );
}
