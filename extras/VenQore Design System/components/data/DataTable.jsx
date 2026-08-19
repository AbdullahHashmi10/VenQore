import React from "react";

/**
 * Horizontal-rules-only table. Numbers right-aligned, mono, tabular.
 * Columns: { key, label, align, numeric, render }
 */
export function DataTable({ columns = [], rows = [], onRowClick, totals, style }) {
  const [hover, setHover] = React.useState(-1);
  return (
    <div style={{ width: "100%", overflowX: "auto", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{
                height: "var(--vq-row-head-h)", textAlign: c.numeric ? "right" : c.align || "left",
                padding: "0 14px", whiteSpace: "nowrap",
                font: "500 11px/1 var(--vq-font-numeric)", letterSpacing: "var(--vq-ls-eyebrow)",
                textTransform: "uppercase", color: "var(--vq-text-3)",
                borderBottom: "1px solid var(--vq-line)",
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}
              onClick={() => onRowClick && onRowClick(r)}
              style={{
                background: hover === i ? "var(--vq-sunken)" : "transparent",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background-color var(--vq-dur-1) var(--vq-ease-out)",
              }}>
              {columns.map(c => (
                <td key={c.key} className={c.numeric ? "vq-num" : undefined} style={{
                  height: "var(--vq-row-h)", padding: "0 14px",
                  textAlign: c.numeric ? "right" : c.align || "left",
                  borderBottom: "1px solid var(--vq-line-soft)",
                  font: c.numeric ? "500 14px/1.4 var(--vq-font-numeric)" : "500 14px/1.4 var(--vq-font-sans)",
                  color: "var(--vq-text)", whiteSpace: "nowrap",
                }}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
          {totals ? (
            <tr>
              {columns.map((c, i) => (
                <td key={c.key} className={c.numeric ? "vq-num" : undefined} style={{
                  height: "var(--vq-row-h)", padding: "0 14px",
                  textAlign: c.numeric ? "right" : c.align || "left",
                  borderTop: "1px solid var(--vq-line-strong)",
                  font: c.numeric ? "600 14px/1.4 var(--vq-font-numeric)" : "600 14px/1.4 var(--vq-font-sans)",
                  color: "var(--vq-text)",
                }}>{totals[c.key] ?? (i === 0 ? "Total" : "")}</td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
