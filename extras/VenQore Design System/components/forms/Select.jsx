import React from "react";

/** Native select in VenQore clothing. */
export function Select({ label, value, onChange, options = [], size = "md", disabled = false, id, style }) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label ? <label htmlFor={fid} style={{ font: "600 13px/1.3 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{label}</label> : null}
      <div style={{
        position: "relative", height: size === "sm" ? "var(--vq-control-sm)" : "var(--vq-control-lg)",
        background: "var(--vq-surface)", border: `1px solid ${focus ? "var(--vq-focus)" : "var(--vq-line)"}`,
        borderRadius: "var(--vq-r-md)", boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
        transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
      }}>
        <select
          id={fid} value={value} disabled={disabled} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            appearance: "none", width: "100%", height: "100%", border: 0, outline: 0, background: "transparent",
            padding: `0 38px 0 ${size === "sm" ? 12 : 16}px`, color: "var(--vq-text)",
            font: `600 ${size === "sm" ? 13 : 15}px/1 var(--vq-font-sans)`, cursor: "pointer",
          }}
        >
          {options.map(o => {
            const val = typeof o === "string" ? o : o.value;
            const lab = typeof o === "string" ? o : o.label;
            return <option key={val} value={val}>{lab}</option>;
          })}
        </select>
        <span style={{
          position: "absolute", right: 14, top: "50%", width: 8, height: 8, marginTop: -6,
          borderRight: "2px solid var(--vq-text-3)", borderBottom: "2px solid var(--vq-text-3)",
          transform: "rotate(45deg)", pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}
