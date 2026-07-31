import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { g as useTheme } from "../ssr.js";
import { ArrowUpRight, ArrowDownRight, Inbox, Construction, Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
const BRAND = {
  indigo: "#6366f1",
  indigo2: "#818cf8",
  violet: "#8b5cf6",
  fuchsia: "#d946ef",
  sky: "#38bdf8",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#ef4444",
  slate: "#64748b"
};
const GRADIENTS = {
  brand: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #d946ef 100%)",
  brandSoft: "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))",
  revenue: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  gmv: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
  aurora: "radial-gradient(ellipse at 12% -8%, rgba(99,102,241,0.18), transparent 45%), radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.12), transparent 42%)"
};
function tokens(isDark) {
  if (isDark) {
    return {
      isDark: true,
      // surfaces
      appBg: "#06080f",
      shellBg: "rgba(9,11,20,0.72)",
      panel: "rgba(17,24,39,0.66)",
      panel2: "rgba(30,41,59,0.45)",
      panelSolid: "#0d1119",
      hover: "rgba(99,102,241,0.10)",
      // lines
      border: "rgba(148,163,184,0.14)",
      border2: "rgba(148,163,184,0.26)",
      rowBorder: "rgba(148,163,184,0.08)",
      // ink
      ink: "#f1f5f9",
      sub: "#cbd5e1",
      muted: "#7c8aa3",
      faint: "#5b6b86",
      // controls
      inputBg: "rgba(255,255,255,0.04)",
      inputBorder: "rgba(148,163,184,0.18)",
      // effects
      ring: "rgba(99,102,241,0.55)",
      shadow: "0 18px 50px -12px rgba(0,0,0,0.7)",
      glow: "0 0 0 1px rgba(99,102,241,0.20), 0 10px 40px -10px rgba(99,102,241,0.35)",
      aurora: GRADIENTS.aurora
    };
  }
  return {
    isDark: false,
    appBg: "#f4f5fb",
    shellBg: "rgba(255,255,255,0.82)",
    panel: "#ffffff",
    panel2: "#f8fafc",
    panelSolid: "#ffffff",
    hover: "rgba(99,102,241,0.06)",
    border: "rgba(15,23,42,0.10)",
    border2: "rgba(15,23,42,0.16)",
    rowBorder: "rgba(15,23,42,0.06)",
    ink: "#0f172a",
    sub: "#334155",
    muted: "#64748b",
    faint: "#94a3b8",
    inputBg: "#ffffff",
    inputBorder: "rgba(15,23,42,0.14)",
    ring: "rgba(99,102,241,0.45)",
    shadow: "0 16px 40px -16px rgba(15,23,42,0.22)",
    glow: "0 0 0 1px rgba(99,102,241,0.16), 0 12px 32px -12px rgba(99,102,241,0.28)",
    aurora: "radial-gradient(ellipse at 12% -8%, rgba(99,102,241,0.10), transparent 45%), radial-gradient(ellipse at 100% 0%, rgba(139,92,246,0.07), transparent 42%)"
  };
}
function statusColor(status) {
  const s = String(status || "").toLowerCase();
  const map = {
    active: BRAND.emerald,
    trial: BRAND.sky,
    suspended: BRAND.amber,
    cancelled: BRAND.rose,
    churned: BRAND.rose,
    deleted: BRAND.slate,
    pending: BRAND.amber,
    approved: BRAND.emerald,
    rejected: BRAND.rose,
    paid: BRAND.emerald,
    open: BRAND.sky,
    resolved: BRAND.emerald,
    new: BRAND.indigo
  };
  return map[s] || BRAND.slate;
}
function fmtCurrency(n, currency = "USD") {
  const num = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: num >= 1e3 ? 0 : 2
    }).format(num);
  } catch {
    return "$" + num.toLocaleString();
  }
}
function fmtNumber(n) {
  return Number(n || 0).toLocaleString();
}
function fmtCompact(n) {
  const num = Number(n || 0);
  if (Math.abs(num) >= 1e3) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  }
  return String(num);
}
function useT() {
  const { isDarkMode } = useTheme();
  return useMemo(() => tokens(isDarkMode), [isDarkMode]);
}
let injected = false;
function ensurePlatformStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const el = document.createElement("style");
  el.id = "venqore-platform-styles";
  el.textContent = `
      @keyframes vq-fade { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
      @keyframes vq-fade-soft { from { opacity:0;} to { opacity:1;} }
      @keyframes vq-rise { from { opacity:0; transform: translateY(16px) scale(.985);} to { opacity:1; transform:none;} }
      @keyframes vq-spin { to { transform: rotate(360deg);} }
      @keyframes vq-shimmer { 0% { background-position: -468px 0;} 100% { background-position: 468px 0;} }
      @keyframes vq-pulse-ring { 0% { box-shadow:0 0 0 0 rgba(99,102,241,.35);} 70%{box-shadow:0 0 0 10px rgba(99,102,241,0);} 100%{box-shadow:0 0 0 0 rgba(99,102,241,0);} }
      @keyframes vq-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
      @keyframes vq-drift { 0%{transform:translate(0,0);} 50%{transform:translate(14px,-10px);} 100%{transform:translate(0,0);} }
      .vq-scroll::-webkit-scrollbar{width:8px;height:8px;}
      .vq-scroll::-webkit-scrollbar-track{background:transparent;}
      .vq-scroll::-webkit-scrollbar-thumb{background:rgba(120,130,160,.28);border-radius:10px;}
      .vq-scroll::-webkit-scrollbar-thumb:hover{background:rgba(120,130,160,.5);}
      .vq-card-hover{transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s;}
      .vq-card-hover:hover{transform:translateY(-3px);}
      .vq-row{transition:background .15s;}
      .vq-press{transition:transform .12s, filter .12s, background .15s, border-color .15s, color .15s;}
      .vq-press:active{transform:scale(.97);}
      @media (prefers-reduced-motion: reduce){
        *{animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important;}
      }
    `;
  document.head.appendChild(el);
}
function Panel({ children, style, className = "", hover = false, pad = 20, ...rest }) {
  const t = useT();
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `${hover ? "vq-card-hover" : ""} ${className}`,
      style: {
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 18,
        padding: pad,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: t.isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04)",
        ...style
      },
      ...rest,
      children
    }
  );
}
function Button({ children, variant = "primary", size = "md", icon: Icon, style, disabled, ...rest }) {
  const t = useT();
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 12.5, gap: 6, iconSize: 14 },
    md: { padding: "10px 16px", fontSize: 13.5, gap: 8, iconSize: 16 },
    lg: { padding: "13px 22px", fontSize: 15, gap: 9, iconSize: 18 }
  }[size];
  const variants = {
    primary: { background: GRADIENTS.brand, color: "#fff", border: "1px solid transparent", boxShadow: "0 8px 20px -6px rgba(99,102,241,.5)" },
    secondary: { background: t.inputBg, color: t.ink, border: `1px solid ${t.border2}` },
    ghost: { background: "transparent", color: t.sub, border: "1px solid transparent" },
    danger: { background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" },
    success: { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }
  }[variant];
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: "vq-press",
      disabled,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.gap,
        padding: sizes.padding,
        fontSize: sizes.fontSize,
        fontWeight: 700,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
        ...variants,
        ...style
      },
      ...rest,
      children: [
        Icon && /* @__PURE__ */ jsx(Icon, { size: sizes.iconSize }),
        children
      ]
    }
  );
}
function Badge({ children, color, tone = "soft", style }) {
  useT();
  const c = color || BRAND.slate;
  const bg = tone === "solid" ? c : `${c}22`;
  const fg = tone === "solid" ? "#fff" : c;
  return /* @__PURE__ */ jsx("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 999,
    background: bg,
    color: fg,
    border: `1px solid ${c}33`,
    textTransform: "capitalize",
    letterSpacing: "0.01em",
    lineHeight: 1.5,
    ...style
  }, children });
}
function StatusBadge({ status }) {
  return /* @__PURE__ */ jsx(Badge, { color: statusColor(status), children: status || "—" });
}
function KpiCard({ label, value, sub, icon: Icon, accent = BRAND.indigo, trend, footnote, gradient, big = false }) {
  const t = useT();
  const up = typeof trend === "number" ? trend >= 0 : null;
  return /* @__PURE__ */ jsxs(Panel, { hover: true, pad: big ? 22 : 18, style: { position: "relative", overflow: "hidden", animation: "vq-rise .5s ease both" }, children: [
    gradient && /* @__PURE__ */ jsx("div", { style: {
      position: "absolute",
      inset: 0,
      background: gradient,
      opacity: t.isDark ? 0.14 : 0.08,
      pointerEvents: "none"
    } }),
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: t.muted }, children: label }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: big ? 34 : 27, fontWeight: 900, letterSpacing: "-0.03em", color: t.ink, marginTop: 6, lineHeight: 1.05 }, children: value }),
        sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: t.sub, marginTop: 4 }, children: sub })
      ] }),
      Icon && /* @__PURE__ */ jsx("div", { style: {
        width: 42,
        height: 42,
        borderRadius: 13,
        flexShrink: 0,
        background: `${accent}1f`,
        color: accent,
        display: "grid",
        placeItems: "center",
        border: `1px solid ${accent}33`
      }, children: /* @__PURE__ */ jsx(Icon, { size: 20 }) })
    ] }),
    trend !== void 0 && trend !== null && /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 12, fontWeight: 700, color: up ? BRAND.emerald : BRAND.rose }, children: [
      up ? /* @__PURE__ */ jsx(ArrowUpRight, { size: 14 }) : /* @__PURE__ */ jsx(ArrowDownRight, { size: 14 }),
      Math.abs(trend),
      "%",
      /* @__PURE__ */ jsx("span", { style: { color: t.muted, fontWeight: 500 }, children: "vs last period" })
    ] }),
    footnote && /* @__PURE__ */ jsx("div", { style: { position: "relative", fontSize: 11, color: t.faint, marginTop: 10 }, children: footnote })
  ] });
}
function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  const t = useT();
  return /* @__PURE__ */ jsx("div", { style: {
    width: w,
    height: h,
    borderRadius: r,
    background: t.isDark ? "linear-gradient(90deg, rgba(148,163,184,.08) 25%, rgba(148,163,184,.16) 37%, rgba(148,163,184,.08) 63%)" : "linear-gradient(90deg, rgba(15,23,42,.05) 25%, rgba(15,23,42,.10) 37%, rgba(15,23,42,.05) 63%)",
    backgroundSize: "936px 100%",
    animation: "vq-shimmer 1.4s ease infinite",
    ...style
  } });
}
function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "56px 24px", animation: "vq-fade .4s ease both" }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 64,
      height: 64,
      borderRadius: 20,
      margin: "0 auto 16px",
      background: `${BRAND.indigo}14`,
      color: BRAND.indigo2,
      display: "grid",
      placeItems: "center",
      border: `1px solid ${BRAND.indigo}26`
    }, children: /* @__PURE__ */ jsx(Icon, { size: 30 }) }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: t.ink }, children: title }),
    message && /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: t.muted, marginTop: 6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }, children: message }),
    action && /* @__PURE__ */ jsx("div", { style: { marginTop: 18, display: "flex", justifyContent: "center" }, children: action })
  ] });
}
function Drawer({ open, onClose, title, subtitle, children, footer, width = 480 }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 1e3 }, children: [
    /* @__PURE__ */ jsx("div", { onClick: onClose, style: { position: "absolute", inset: 0, background: "rgba(2,4,10,0.55)", backdropFilter: "blur(4px)", animation: "vq-fade-soft .25s ease" } }),
    /* @__PURE__ */ jsxs("div", { className: "vq-scroll", style: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: `min(${width}px, 100%)`,
      background: t.panelSolid,
      borderLeft: `1px solid ${t.border2}`,
      boxShadow: t.shadow,
      display: "flex",
      flexDirection: "column",
      animation: "vq-rise .3s cubic-bezier(.2,.8,.2,1) both",
      overflowY: "auto"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: t.panelSolid, zIndex: 2 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: 18, fontWeight: 900, color: t.ink, letterSpacing: "-0.02em" }, children: title }),
          subtitle && /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", fontSize: 12.5, color: t.muted }, children: subtitle })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "vq-press", style: { background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", color: t.sub }, children: /* @__PURE__ */ jsx(X, { size: 17 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { padding: 24, flex: 1 }, children }),
      footer && /* @__PURE__ */ jsx("div", { style: { padding: "16px 24px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 10, justifyContent: "flex-end", position: "sticky", bottom: 0, background: t.panelSolid }, children: footer })
    ] })
  ] });
}
function Input({ style, ...rest }) {
  const t = useT();
  const [focus, setFocus] = useState(false);
  return /* @__PURE__ */ jsx(
    "input",
    {
      onFocus: (e) => {
        setFocus(true);
        rest.onFocus?.(e);
      },
      onBlur: (e) => {
        setFocus(false);
        rest.onBlur?.(e);
      },
      style: {
        width: "100%",
        padding: "10px 13px",
        fontSize: 13.5,
        borderRadius: 11,
        background: t.inputBg,
        color: t.ink,
        fontFamily: "inherit",
        border: `1px solid ${focus ? BRAND.indigo : t.inputBorder}`,
        outline: "none",
        boxShadow: focus ? `0 0 0 3px ${t.ring}` : "none",
        transition: "border-color .15s, box-shadow .15s",
        ...style
      },
      ...rest
    }
  );
}
function Field({ label, hint, error, children }) {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 16 }, children: [
    label && /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }, children: label }),
    children,
    hint && !error && /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.faint, marginTop: 5 }, children: hint }),
    error && /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: BRAND.rose, marginTop: 5, fontWeight: 600 }, children: error })
  ] });
}
function DataTable({
  columns,
  rows,
  loading,
  searchValue,
  onSearch,
  searchPlaceholder = "Search…",
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyAction,
  filters,
  pagination,
  rowKey = "id",
  toolbar
}) {
  const t = useT();
  return /* @__PURE__ */ jsxs(Panel, { pad: 0, style: { overflow: "hidden" }, children: [
    (onSearch || filters || toolbar) && /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [
      onSearch && /* @__PURE__ */ jsxs("div", { style: { position: "relative", flex: "1 1 240px", minWidth: 200 }, children: [
        /* @__PURE__ */ jsx(Search, { size: 16, style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.muted } }),
        /* @__PURE__ */ jsx(Input, { value: searchValue, onChange: (e) => onSearch(e.target.value), placeholder: searchPlaceholder, style: { paddingLeft: 36 } })
      ] }),
      filters,
      /* @__PURE__ */ jsx("div", { style: { marginLeft: "auto", display: "flex", gap: 10 }, children: toolbar })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "vq-scroll", style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 640 }, children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c, i) => /* @__PURE__ */ jsx("th", { style: {
        textAlign: c.align || "left",
        padding: "11px 16px",
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: t.muted,
        background: t.panel2,
        borderBottom: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
        width: c.width
      }, children: c.header }, i)) }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        loading && Array.from({ length: 5 }).map((_, r) => /* @__PURE__ */ jsx("tr", { children: columns.map((c, i) => /* @__PURE__ */ jsx("td", { style: { padding: "13px 16px", borderBottom: `1px solid ${t.rowBorder}` }, children: /* @__PURE__ */ jsx(Skeleton, { w: i === 0 ? "60%" : "40%" }) }, i)) }, `s${r}`)),
        !loading && rows.map((row, ri) => /* @__PURE__ */ jsx(
          "tr",
          {
            className: "vq-row",
            style: { cursor: row.__onClick ? "pointer" : "default" },
            onClick: row.__onClick,
            onMouseEnter: (e) => {
              e.currentTarget.style.background = t.hover;
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "transparent";
            },
            children: columns.map((c, ci) => /* @__PURE__ */ jsx("td", { style: { padding: "12px 16px", fontSize: 13.5, color: t.sub, borderBottom: `1px solid ${t.rowBorder}`, textAlign: c.align || "left", whiteSpace: c.nowrap ? "nowrap" : "normal" }, children: c.cell ? c.cell(row) : row[c.key] }, ci))
          },
          row[rowKey] ?? ri
        ))
      ] })
    ] }) }),
    !loading && rows.length === 0 && /* @__PURE__ */ jsx(EmptyState, { title: emptyTitle, message: emptyMessage, action: emptyAction }),
    pagination && pagination.last_page > 1 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${t.border}` }, children: [
      /* @__PURE__ */ jsxs("span", { style: { fontSize: 12.5, color: t.muted }, children: [
        "Page ",
        pagination.current_page,
        " of ",
        pagination.last_page,
        " · ",
        fmtCompact(pagination.total),
        " total"
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", icon: ChevronLeft, disabled: pagination.current_page <= 1, onClick: () => pagination.onPage(pagination.current_page - 1), children: "Prev" }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "secondary", disabled: pagination.current_page >= pagination.last_page, onClick: () => pagination.onPage(pagination.current_page + 1), children: [
          "Next",
          /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
        ] })
      ] })
    ] })
  ] });
}
function ComingSoon({ title, description, status = "Coming Soon", children, icon: Icon = Construction, preview }) {
  const t = useT();
  const statusColors = {
    "Coming Soon": BRAND.indigo,
    "Under Development": BRAND.amber,
    "Backend Pending": BRAND.sky
  };
  const c = statusColors[status] || BRAND.indigo;
  return /* @__PURE__ */ jsxs("div", { style: { animation: "vq-fade .4s ease both" }, children: [
    /* @__PURE__ */ jsxs(Panel, { style: { position: "relative", overflow: "hidden", marginBottom: preview ? 22 : 0 }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: GRADIENTS.brandSoft, pointerEvents: "none" } }),
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 56, height: 56, borderRadius: 16, background: `${c}1f`, color: c, display: "grid", placeItems: "center", border: `1px solid ${c}33`, animation: "vq-float 4s ease-in-out infinite" }, children: /* @__PURE__ */ jsx(Icon, { size: 28 }) }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 220 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsx("h2", { style: { margin: 0, fontSize: 20, fontWeight: 900, color: t.ink, letterSpacing: "-0.02em" }, children: title }),
            /* @__PURE__ */ jsx(Badge, { color: c, tone: "solid", children: status })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { margin: "6px 0 0", fontSize: 13.5, color: t.sub, lineHeight: 1.6, maxWidth: 640 }, children: description })
        ] })
      ] }),
      children && /* @__PURE__ */ jsx("div", { style: { position: "relative", marginTop: 18 }, children })
    ] }),
    preview && /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 10, right: 0, zIndex: 2 }, children: /* @__PURE__ */ jsx(Badge, { color: c, children: "Interface preview" }) }),
      /* @__PURE__ */ jsx("div", { style: { opacity: 0.96, filter: "saturate(.96)" }, children: preview })
    ] })
  ] });
}
function Spinner({ size = 18, color }) {
  return /* @__PURE__ */ jsx(Loader2, { size, style: { animation: "vq-spin .8s linear infinite", color } });
}
function Select({ value, onChange, options, style }) {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", ...style }, children: [
    /* @__PURE__ */ jsx("select", { value, onChange, style: {
      appearance: "none",
      width: "100%",
      padding: "10px 34px 10px 13px",
      fontSize: 13.5,
      borderRadius: 11,
      background: t.inputBg,
      color: t.ink,
      fontFamily: "inherit",
      border: `1px solid ${t.inputBorder}`,
      outline: "none",
      cursor: "pointer"
    }, children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value)) }),
    /* @__PURE__ */ jsx(ChevronDown, { size: 15, style: { position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: t.muted, pointerEvents: "none" } })
  ] });
}
export {
  BRAND as B,
  ComingSoon as C,
  DataTable as D,
  EmptyState as E,
  Field as F,
  GRADIENTS as G,
  Input as I,
  KpiCard as K,
  Panel as P,
  Spinner as S,
  fmtNumber as a,
  Badge as b,
  Button as c,
  StatusBadge as d,
  Select as e,
  fmtCurrency as f,
  Drawer as g,
  ensurePlatformStyles as h,
  tokens as t,
  useT as u
};
