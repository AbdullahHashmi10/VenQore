import React from "react";

/** Checkbox with a spring tick. */
export function Checkbox({ label, checked = false, onChange, disabled = false, id, style }) {
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
        width: 20, height: 20, flex: "0 0 auto", borderRadius: "var(--vq-r-xs)",
        background: checked ? "var(--vq-accent-fill)" : "var(--vq-surface)",
        border: `1px solid ${checked ? "transparent" : "var(--vq-line-strong)"}`,
        boxShadow: checked ? "var(--vq-glow-accent)" : "var(--vq-elev-1)",
        display: "grid", placeItems: "center",
        transition: "background-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
      }}>
        <span style={{
          width: 10, height: 6, borderLeft: "2.5px solid var(--vq-on-accent)", borderBottom: "2.5px solid var(--vq-on-accent)",
          transform: checked ? "rotate(-45deg) scale(1)" : "rotate(-45deg) scale(.4)", opacity: checked ? 1 : 0,
          marginTop: -2, transition: "background-color var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), border-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)",
        }} />
      </span>
      {label}
    </label>
  );
}
