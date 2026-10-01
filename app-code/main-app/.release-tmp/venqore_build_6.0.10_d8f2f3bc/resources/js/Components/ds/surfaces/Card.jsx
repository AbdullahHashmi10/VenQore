import React from "react";

/**
 * The floating panel every screen is built from. White (or --vq-surface) on the
 * soft page, 20px radius, hairline + soft shadow, optional hover lift.
 */
export function Card({ title, eyebrow, action, children, pad = 20, tone = "surface", lift = false, radius = "var(--vq-r-lg)", style }) {
  const [hover, setHover] = React.useState(false);
  const filled = tone === "accent";
  const dark = tone === "ink";
  return (
    <section
      onMouseEnter={() => lift && setHover(true)}
      onMouseLeave={() => lift && setHover(false)}
      style={{
        display: "flex", flexDirection: "column", gap: title || eyebrow ? 16 : 0,
        padding: pad, borderRadius: radius, position: "relative", overflow: "hidden",
        background: filled ? "var(--vq-grad-mint)" : dark ? "var(--vq-ink-950)" : "var(--vq-surface)",
        color: filled ? "var(--vq-on-accent)" : dark ? "var(--vq-ink-50)" : "var(--vq-text)",
        border: filled || dark ? "1px solid transparent" : "1px solid var(--vq-line)",
        boxShadow: filled ? (hover ? "var(--vq-glow-accent-strong)" : "var(--vq-glow-accent)") : hover ? "var(--vq-elev-2)" : "var(--vq-elev-1)",
        transform: hover ? "translateY(-2px)" : "none",
        transition: "transform var(--vq-dur-3) var(--vq-ease-spring), box-shadow var(--vq-dur-3) var(--vq-ease-out)",
        ...style,
      }}
    >
      {(title || eyebrow || action) ? (
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {eyebrow ? <span className="vq-eyebrow" style={{ color: filled ? "rgb(255 255 255 / .72)" : undefined }}>{eyebrow}</span> : null}
            {title ? <h3 style={{ font: "600 17px/1.25 var(--vq-font-display)", letterSpacing: "-0.02em", margin: 0, color: "inherit" }}>{title}</h3> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
