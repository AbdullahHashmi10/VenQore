import React from "react";

/** Centred dialog with a blurred scrim. Escape closes. */
export function Modal({ open = true, title, description, children, footer, onClose, width = 560 }) {
  React.useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "var(--vq-scrim)",
        backdropFilter: "blur(6px)", animation: "vqFade var(--vq-dur-3) var(--vq-ease-out) both",
      }} />
      <div role="dialog" aria-modal="true" style={{
        position: "relative", width: "100%", maxWidth: width, background: "var(--vq-raised)",
        border: "1px solid var(--vq-line)", borderRadius: "var(--vq-r-xl)", boxShadow: "var(--vq-elev-3)",
        padding: 26, display: "flex", flexDirection: "column", gap: 18,
        animation: "vqPop var(--vq-dur-4) var(--vq-ease-spring-soft) both",
      }}>
        <style>{"@keyframes vqFade{from{opacity:0}to{opacity:1}}@keyframes vqPop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}"}</style>
        {(title || description) ? (
          <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {title ? <h2 style={{ margin: 0, font: "600 22px/1.2 var(--vq-font-display)", letterSpacing: "-0.025em", color: "var(--vq-text)" }}>{title}</h2> : null}
            {description ? <p style={{ margin: 0, font: "500 14px/1.55 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{description}</p> : null}
          </header>
        ) : null}
        {children}
        {footer ? <footer style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>{footer}</footer> : null}
      </div>
    </div>
  );
}
