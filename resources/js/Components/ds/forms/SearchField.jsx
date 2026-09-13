import React from "react";

/** Top-bar search with a keyboard-shortcut cap. */
export function SearchField({ value, onChange, placeholder = "Search anything…", shortcut = "⌘K", width = 340, style }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, height: "var(--vq-control-md)", width,
      padding: "0 6px 0 14px", background: "var(--vq-surface)",
      border: `1px solid ${focus ? "var(--vq-focus)" : "var(--vq-line)"}`,
      borderRadius: "var(--vq-r-full)", boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
      transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)", ...style,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--vq-text-3)" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value} placeholder={placeholder} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", font: "500 14px/1 var(--vq-font-sans)", color: "var(--vq-text)" }}
      />
      {shortcut ? (
        <span className="vq-num" style={{
          font: "500 11px/1 var(--vq-font-numeric)", color: "var(--vq-text-3)", background: "var(--vq-sunken)",
          border: "1px solid var(--vq-line-soft)", borderRadius: "var(--vq-r-full)", padding: "5px 9px",
        }}>{shortcut}</span>
      ) : null}
    </div>
  );
}
