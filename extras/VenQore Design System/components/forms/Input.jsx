import React from "react";

/** Labelled text field. Label above, always. 16px minimum font-size. */
export function Input({
  label, hint, error, value, onChange, placeholder, type = "text",
  prefix, suffix, size = "md", disabled = false, id, style,
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  const h = size === "lg" ? "var(--vq-control-xl)" : "var(--vq-control-lg)";
  const border = error ? "var(--vq-danger)" : focus ? "var(--vq-focus)" : "var(--vq-line)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label ? <label htmlFor={fid} style={{ font: "600 13px/1.3 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{label}</label> : null}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, height: h, padding: "0 16px",
        background: disabled ? "var(--vq-sunken)" : "var(--vq-surface)",
        border: `1px solid ${border}`, borderRadius: "var(--vq-r-md)",
        boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
        transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
      }}>
        {prefix ? <span style={{ color: "var(--vq-text-3)", display: "flex" }}>{prefix}</span> : null}
        <input
          id={fid} type={type} value={value} placeholder={placeholder} disabled={disabled}
          onChange={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent",
            font: "500 16px/1 var(--vq-font-sans)", color: "var(--vq-text)",
          }}
        />
        {suffix ? <span style={{ color: "var(--vq-text-3)", display: "flex" }}>{suffix}</span> : null}
      </div>
      {(error || hint) ? (
        <span style={{ font: "500 12px/1.4 var(--vq-font-sans)", color: error ? "var(--vq-danger)" : "var(--vq-text-3)" }}>{error || hint}</span>
      ) : null}
    </div>
  );
}
