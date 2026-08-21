import React from "react";

/** Rail row. Active = tinted wash + mint left rule. Never a transform. */
export function SidebarItem({ icon, label, active = false, collapsed = false, badge, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={collapsed ? label : undefined}
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: 12, width: "100%",
        height: 44, padding: collapsed ? 0 : "0 12px 0 14px", justifyContent: collapsed ? "center" : "flex-start",
        background: active ? "var(--vq-accent-quiet)" : hover ? "var(--vq-sunken)" : "transparent",
        color: active ? "var(--vq-accent-text)" : "var(--vq-text-2)",
        border: 0, borderRadius: "var(--vq-r-md)", cursor: "pointer", textAlign: "left",
        font: `${active ? 600 : 500} 14px/1 var(--vq-font-sans)`,
        transition: "background-color var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out)",
        ...style,
      }}
    >
      {active ? <span style={{ position: "absolute", left: 0, top: 11, bottom: 11, width: 3, borderRadius: 999, background: "var(--vq-accent)" }} /> : null}
      <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, flex: "0 0 auto" }}>{icon}</span>
      {collapsed ? null : <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>}
      {!collapsed && badge != null ? (
        <span className="vq-num" style={{
          font: "600 11px/1 var(--vq-font-numeric)", padding: "4px 7px", borderRadius: 999,
          background: active ? "var(--vq-accent-fill)" : "var(--vq-sunken)",
          color: active ? "var(--vq-on-accent)" : "var(--vq-text-3)",
        }}>{badge}</span>
      ) : null}
    </button>
  );
}
