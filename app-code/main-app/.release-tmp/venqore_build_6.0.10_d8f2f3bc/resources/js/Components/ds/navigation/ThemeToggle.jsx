import React from "react";

/** Sun/moon switch. Writes data-theme on <html> and remembers the choice. */
export function ThemeToggle({ size = 40, storageKey = "vq-theme", style }) {
  const [dark, setDark] = React.useState(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark");
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("vq-theming");
    root.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem(storageKey, dark ? "dark" : "light"); } catch (e) {}
    const f = requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("vq-theming")));
    return () => cancelAnimationFrame(f);
  }, [dark, storageKey]);
  const [hover, setHover] = React.useState(false);
  return (
    <button aria-label={dark ? "Switch to light" : "Switch to dark"} onClick={() => setDark(d => !d)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: "var(--vq-r-md)", display: "grid", placeItems: "center",
        background: hover ? "var(--vq-sunken)" : "var(--vq-surface)", color: "var(--vq-text-2)",
        border: "1px solid var(--vq-line)", boxShadow: "var(--vq-elev-1)", cursor: "pointer",
        transition: "background-color var(--vq-dur-1) var(--vq-ease-out)", ...style,
      }}>
      <span style={{ display: "grid", placeItems: "center", transform: dark ? "rotate(-40deg)" : "none", transition: "transform var(--vq-dur-4) var(--vq-ease-spring)" }}>
        {dark
          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4"/></svg>}
      </span>
    </button>
  );
}
