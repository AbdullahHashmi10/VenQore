import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { r as role } from "./runtime-DwSFgQZq.js";
import { Settings, ClipboardList, AlertCircle, TrendingUp, ArrowUpRight, Receipt, Users, Activity, Clock, Wallet, TrendingDown, FileText, Package, DollarSign, Shield, Plus, Minus } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from "recharts";
import "react-dom";
import "./plans-CxabWI_P.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function BklitTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "var(--vq-raised)",
    border: "1px solid var(--vq-line)",
    borderRadius: "var(--vq-r-md)",
    boxShadow: "var(--vq-elev-3)",
    padding: "10px 14px",
    fontFamily: "var(--vq-font-sans)",
    fontSize: "12px",
    minWidth: "130px"
  }, children: [
    label && /* @__PURE__ */ jsx("div", { style: {
      fontFamily: "var(--vq-font-mono)",
      fontSize: "10px",
      color: "var(--vq-text-3)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
      paddingBottom: "6px",
      borderBottom: "1px solid var(--vq-line-soft)"
    }, children: label }),
    payload.map((p, i) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginTop: i > 0 ? "5px" : 0 }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: "8px", height: "8px", borderRadius: "2px", background: p.color || p.fill, flexShrink: 0 } }),
      /* @__PURE__ */ jsx("span", { style: { color: "var(--vq-text-2)", flex: 1 }, children: p.name }),
      /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--vq-text)" }, children: valueFormatter ? valueFormatter(p.value) : p.value })
    ] }, i))
  ] });
}
function BklitAreaChart({
  data = [],
  dataKey = "value",
  xKey = "month",
  name = "Value",
  color = "var(--chart-1)",
  valueFormatter,
  currencySymbol = "",
  height = "100%"
}) {
  const id = `bklit-area-${dataKey}`;
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height, children: /* @__PURE__ */ jsxs(AreaChart, { data, margin: { top: 6, right: 4, left: -28, bottom: 0 }, children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: color, stopOpacity: 0.3 }),
      /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: color, stopOpacity: 0 })
    ] }) }),
    /* @__PURE__ */ jsx(
      CartesianGrid,
      {
        strokeDasharray: "3 3",
        vertical: false,
        stroke: "var(--vq-line-soft)",
        strokeOpacity: 0.6
      }
    ),
    /* @__PURE__ */ jsx(
      XAxis,
      {
        dataKey: xKey,
        axisLine: false,
        tickLine: false,
        tick: {
          fill: "var(--vq-text-3)",
          fontSize: 10,
          fontFamily: "var(--vq-font-mono)",
          letterSpacing: "0.04em"
        },
        dy: 5
      }
    ),
    /* @__PURE__ */ jsx(
      YAxis,
      {
        axisLine: false,
        tickLine: false,
        tick: {
          fill: "var(--vq-text-3)",
          fontSize: 10,
          fontFamily: "var(--vq-font-mono)"
        },
        tickFormatter: (v) => valueFormatter ? valueFormatter(v) : `${currencySymbol}${v}`
      }
    ),
    /* @__PURE__ */ jsx(
      Tooltip,
      {
        content: /* @__PURE__ */ jsx(BklitTooltip, { valueFormatter }),
        cursor: { stroke: color, strokeWidth: 1, strokeDasharray: "4 2", strokeOpacity: 0.5 }
      }
    ),
    /* @__PURE__ */ jsx(
      Area,
      {
        name,
        type: "monotone",
        dataKey,
        stroke: color,
        strokeWidth: 2.5,
        fillOpacity: 1,
        fill: `url(#${id})`,
        dot: false,
        activeDot: { r: 5, fill: color, stroke: "var(--vq-surface)", strokeWidth: 2 },
        isAnimationActive: true,
        animationDuration: 800,
        animationEasing: "ease-out"
      }
    )
  ] }) });
}
function BklitDonut({
  data = [],
  centerLabel,
  centerSublabel,
  height = "100%",
  innerRadius = "55%",
  outerRadius = "80%",
  valueFormatter
}) {
  return /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height, children: /* @__PURE__ */ jsxs(PieChart, { children: [
    /* @__PURE__ */ jsx(
      Pie,
      {
        data,
        cx: "50%",
        cy: "50%",
        innerRadius,
        outerRadius,
        paddingAngle: 3,
        dataKey: "value",
        stroke: "none",
        startAngle: 90,
        endAngle: -270,
        isAnimationActive: true,
        animationDuration: 700,
        animationEasing: "ease-out",
        children: data.map((entry, i) => /* @__PURE__ */ jsx(Cell, { fill: entry.color || `var(--chart-${i % 5 + 1})` }, i))
      }
    ),
    /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(BklitTooltip, { valueFormatter }) }),
    centerLabel && /* @__PURE__ */ jsxs(
      "text",
      {
        x: "50%",
        y: "50%",
        textAnchor: "middle",
        dominantBaseline: "middle",
        children: [
          /* @__PURE__ */ jsx(
            "tspan",
            {
              x: "50%",
              dy: "-0.4em",
              style: {
                fontFamily: "var(--vq-font-mono)",
                fontVariantNumeric: "tabular-nums",
                fontSize: "18px",
                fontWeight: 600,
                fill: "var(--vq-text)",
                letterSpacing: "-0.02em"
              },
              children: centerLabel
            }
          ),
          centerSublabel && /* @__PURE__ */ jsx(
            "tspan",
            {
              x: "50%",
              dy: "1.4em",
              style: {
                fontFamily: "var(--vq-font-mono)",
                fontSize: "10px",
                fill: "var(--vq-text-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              },
              children: centerSublabel
            }
          )
        ]
      }
    )
  ] }) });
}
const RingChartContext = createContext(null);
const LegendContext = createContext(null);
function RingChart({
  data = [],
  hoveredIndex = null,
  onHoverChange = () => {
  },
  size = 180,
  strokeWidth = 10,
  ringGap = 6,
  children
}) {
  return /* @__PURE__ */ jsx(RingChartContext.Provider, { value: { data, hoveredIndex, onHoverChange, size, strokeWidth, ringGap }, children: /* @__PURE__ */ jsx("div", { style: { position: "relative", width: size, height: size, margin: "0 auto", flexShrink: 0 }, children: /* @__PURE__ */ jsx("svg", { width: size, height: size, style: { transform: "rotate(-90deg)", overflow: "visible" }, children }) }) });
}
function Ring({ index }) {
  const ctx = useContext(RingChartContext);
  if (!ctx) return null;
  const { data, hoveredIndex, onHoverChange, size, strokeWidth, ringGap } = ctx;
  const item = data[index];
  if (!item) return null;
  const center = size / 2;
  const r = center - strokeWidth / 2 - index * (strokeWidth + ringGap);
  if (r <= 0) return null;
  const circ = 2 * Math.PI * r;
  const val = item.value ?? item.val ?? 0;
  const maxVal = item.maxVal ?? item.total ?? 100;
  const pct = Math.min(Math.max(val / maxVal, 0), 1);
  const dash = pct * circ;
  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && !isHovered;
  const color = item.color || `var(--chart-${index % 5 + 1})`;
  return /* @__PURE__ */ jsxs(
    "g",
    {
      onMouseEnter: () => onHoverChange(index),
      onMouseLeave: () => onHoverChange(null),
      style: {
        cursor: "pointer",
        opacity: isDimmed ? 0.35 : 1,
        transition: "opacity 200ms ease"
      },
      children: [
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: center,
            cy: center,
            r,
            fill: "none",
            stroke: "var(--vq-line-soft)",
            strokeWidth,
            strokeOpacity: 0.6
          }
        ),
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: center,
            cy: center,
            r,
            fill: "none",
            stroke: color,
            strokeWidth: isHovered ? strokeWidth + 2 : strokeWidth,
            strokeDasharray: `${dash} ${circ - dash}`,
            strokeLinecap: "round",
            style: {
              transition: "stroke-dasharray 800ms cubic-bezier(0,0,0.2,1), stroke-width 200ms ease"
            }
          }
        )
      ]
    }
  );
}
function RingCenter({ defaultLabel = "Total" }) {
  const ctx = useContext(RingChartContext);
  if (!ctx) return null;
  const { data, hoveredIndex, size } = ctx;
  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const label = activeItem ? activeItem.name || activeItem.label || activeItem.k : defaultLabel;
  const displayVal = activeItem ? `${activeItem.value ?? activeItem.val ?? 0}%` : `${Math.round(data.reduce((acc, curr) => acc + (curr.value ?? curr.val ?? 0), 0) / (data.length || 1))}%`;
  return /* @__PURE__ */ jsx("foreignObject", { x: 0, y: 0, width: size, height: size, style: { pointerEvents: "none" }, children: /* @__PURE__ */ jsxs("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    transform: "rotate(90deg)"
  }, children: [
    /* @__PURE__ */ jsx("span", { style: {
      fontFamily: "var(--vq-font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: "18px",
      fontWeight: 600,
      color: "var(--vq-text)",
      lineHeight: 1.1
    }, children: displayVal }),
    /* @__PURE__ */ jsx("span", { style: {
      fontFamily: "var(--vq-font-mono)",
      fontSize: "9px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--vq-text-3)",
      marginTop: "3px"
    }, children: label })
  ] }) });
}
function Legend({ items = [], hoveredIndex = null, onHoverChange = () => {
}, children }) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "6px" }, children: items.map((item, index) => /* @__PURE__ */ jsx(LegendContext.Provider, { value: { item, index, hoveredIndex, onHoverChange }, children: /* @__PURE__ */ jsx(
    "div",
    {
      onMouseEnter: () => onHoverChange(index),
      onMouseLeave: () => onHoverChange(null),
      style: {
        cursor: "pointer",
        opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
        transition: "opacity 200ms ease"
      },
      children
    }
  ) }, index)) });
}
function LegendItemComponent({ children }) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "3px", width: "100%" }, children: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }, children }) });
}
function LegendMarker() {
  const ctx = useContext(LegendContext);
  if (!ctx) return null;
  const { item, index } = ctx;
  const color = item.color || `var(--chart-${index % 5 + 1})`;
  return /* @__PURE__ */ jsx("div", { style: { width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, marginRight: "6px" } });
}
function LegendLabel() {
  const ctx = useContext(LegendContext);
  if (!ctx) return null;
  const { item } = ctx;
  const label = item.name || item.label || item.k || "";
  return /* @__PURE__ */ jsx("span", { style: {
    fontFamily: "var(--vq-font-mono)",
    fontSize: "11px",
    color: "var(--vq-text-2)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    flex: 1
  }, children: label });
}
function LegendValue({ showPercentage = true }) {
  const ctx = useContext(LegendContext);
  if (!ctx) return null;
  const { item } = ctx;
  const val = item.value ?? item.val ?? 0;
  return /* @__PURE__ */ jsxs("span", { style: {
    fontFamily: "var(--vq-font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--vq-text)"
  }, children: [
    val,
    showPercentage ? "%" : ""
  ] });
}
function LegendProgress() {
  const ctx = useContext(LegendContext);
  if (!ctx) return null;
  const { item, index } = ctx;
  const val = item.value ?? item.val ?? 0;
  const maxVal = item.maxVal ?? item.total ?? 100;
  const pct = Math.min(Math.max(val / maxVal * 100, 0), 100);
  const color = item.color || `var(--chart-${index % 5 + 1})`;
  return /* @__PURE__ */ jsx("div", { style: {
    width: "100%",
    height: "4px",
    borderRadius: "2px",
    background: "var(--vq-sunken)",
    overflow: "hidden",
    marginTop: "2px"
  }, children: /* @__PURE__ */ jsx("div", { style: {
    width: `${pct}%`,
    height: "100%",
    borderRadius: "2px",
    background: color,
    transition: "width 600ms cubic-bezier(0,0,0.2,1)"
  } }) });
}
const FALLBACK_INK = "#888";
function getCssVar(name) {
  if (typeof window === "undefined") return FALLBACK_INK;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || FALLBACK_INK;
}
function Eyebrow({ children, color }) {
  return /* @__PURE__ */ jsx("span", { style: {
    fontFamily: "var(--vq-font-mono)",
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 500,
    color: color || "var(--vq-text-3)",
    display: "block",
    lineHeight: 1.4
  }, children });
}
function Pill({ type = "neutral", children }) {
  const styles = {
    ok: { bg: "var(--vq-success-bg)", color: "var(--vq-success)", ring: "var(--vq-success-line)" },
    warn: { bg: "var(--vq-warning-bg)", color: "var(--vq-warning)", ring: "var(--vq-warning-line)" },
    bad: { bg: "var(--vq-danger-bg)", color: "var(--vq-danger)", ring: "var(--vq-danger-line)" },
    neutral: { bg: "var(--vq-sunken)", color: "var(--vq-text-2)", ring: "var(--vq-line-soft)" }
  };
  const s = styles[type] || styles.neutral;
  return /* @__PURE__ */ jsx("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "var(--vq-r-sm)",
    fontSize: "11px",
    fontWeight: 500,
    lineHeight: 1.5,
    background: s.bg,
    color: s.color,
    boxShadow: `inset 0 0 0 1px ${s.ring}`,
    fontFamily: "var(--vq-font-sans)",
    whiteSpace: "nowrap"
  }, children });
}
function IconBadge({ icon: Icon, color }) {
  return /* @__PURE__ */ jsx("div", { style: {
    width: "38px",
    height: "38px",
    borderRadius: "var(--vq-r-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    color
  }, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) });
}
function CountUp({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    let start = null;
    const dur = 1e3;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setDisplay(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  const fmt = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    prefix,
    fmt,
    suffix
  ] });
}
function Card({ children, style = {}, pad = "18px 20px", hover = true }) {
  const [hov, setHov] = useState(false);
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        background: "var(--vq-surface)",
        border: `1px solid ${hov && hover ? "var(--vq-line-strong)" : "var(--vq-line)"}`,
        borderRadius: "var(--vq-r-xl)",
        boxShadow: hov && hover ? "var(--vq-elev-2)" : "var(--vq-elev-1)",
        padding: pad,
        transition: "border-color 180ms, box-shadow 180ms, transform 180ms",
        transform: hov && hover ? "translateY(-2px)" : "none",
        fontFamily: "var(--vq-font-sans)",
        ...style
      },
      onMouseEnter: () => setHov(true),
      onMouseLeave: () => setHov(false),
      children
    }
  );
}
function ActivityRow({ act }) {
  const [hov, setHov] = useState(false);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        borderRadius: "var(--vq-r-md)",
        background: hov ? "var(--vq-sunken)" : "transparent",
        transition: "background 100ms",
        borderBottom: "1px solid var(--vq-line-soft)"
      },
      onMouseEnter: () => setHov(true),
      onMouseLeave: () => setHov(false),
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            width: "28px",
            height: "28px",
            borderRadius: "var(--vq-r-sm)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: act.is_plus ? "var(--vq-success-bg)" : "var(--vq-danger-bg)",
            color: act.is_plus ? "var(--vq-success)" : "var(--vq-danger)",
            boxShadow: `inset 0 0 0 1px ${act.is_plus ? "var(--vq-success-line)" : "var(--vq-danger-line)"}`
          }, children: act.is_plus ? /* @__PURE__ */ jsx(Plus, { size: 12 }) : /* @__PURE__ */ jsx(Minus, { size: 12 }) }),
          /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: "12px", fontWeight: 500, color: "var(--vq-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: act.title }),
            /* @__PURE__ */ jsxs("div", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "10px", color: "var(--vq-text-3)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }, children: [
              /* @__PURE__ */ jsx(Clock, { size: 8 }),
              " ",
              act.time
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { style: {
          fontFamily: "var(--vq-font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "12px",
          fontWeight: 600,
          flexShrink: 0,
          marginLeft: "8px",
          color: act.is_plus ? "var(--vq-success)" : "var(--vq-danger)"
        }, children: act.amount })
      ]
    }
  );
}
function AdminDashboard({
  stats = { net_profit: 0, total_revenue: 0, total_expenses: 0, active_staff: 0, total_staff: 0 },
  profitData = [],
  recentActivity = [],
  inventoryHealth = { healthy: 0, lowStock: 0, outOfStock: 0, lowStockCount: 0 },
  expenseData = [],
  paymentMethods = [],
  currencySymbol = "$"
}) {
  const { store } = usePage().props;
  const tt = useTermText();
  if (!store?.slug) return null;
  const S = [
    "var(--vq-series-1)",
    "var(--vq-series-2)",
    "var(--vq-series-3)",
    "var(--vq-series-4)",
    "var(--vq-series-5)",
    "var(--vq-series-6)"
  ];
  const totalExpenseValue = expenseData.reduce((a, c) => a + (parseFloat(c.value) || 0), 0);
  const finalExpenseData = totalExpenseValue > 0 ? expenseData.map((d, i) => ({ ...d, pct: Math.round(d.value / totalExpenseValue * 100), color: S[i % 6] })) : [{ name: "No Data", value: 1, pct: 0, color: "var(--vq-line)" }];
  const invStats = [
    { k: "Healthy", val: inventoryHealth.healthy ?? 0, type: "ok", color: S[0] },
    { k: "Low", val: inventoryHealth.lowStock ?? 0, type: "warn", color: S[1] },
    { k: "Out", val: inventoryHealth.outOfStock ?? 0, type: "bad", color: S[5] }
  ];
  invStats.filter((d) => d.val > 0).map((d) => ({ name: d.k, value: d.val, color: d.color }));
  const emptyPie = [{ name: "No Data", value: 1, color: "var(--vq-line)" }];
  const invStatus = inventoryHealth.outOfStock > 0 ? { label: "Action Needed", type: "bad" } : inventoryHealth.lowStock > 0 ? { label: "Low Stock", type: "warn" } : { label: "Healthy", type: "ok" };
  const profitMarginPct = stats.total_revenue > 0 ? Math.round(stats.net_profit / stats.total_revenue * 100) : 0;
  const payPie = paymentMethods.length > 0 ? paymentMethods.map((m, i) => ({ ...m, color: S[i % 6] })) : emptyPie;
  const [inventoryHoveredIndex, setInventoryHoveredIndex] = useState(null);
  const [laserColor, setLaserColor] = useState(role.brand[500]);
  useEffect(() => {
    const c = getCssVar("--vq-accent");
    if (c && c !== FALLBACK_INK) setLaserColor(c);
  }, []);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Executive Dashboard", mode: "admin", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Executive Dashboard" }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes vq-fade-up {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .exec-fade { animation: vq-fade-up 0.5s cubic-bezier(0,0,.2,1) both; }
                .exec-fade:nth-child(1) { animation-delay: 0.00s; }
                .exec-fade:nth-child(2) { animation-delay: 0.05s; }
                .exec-fade:nth-child(3) { animation-delay: 0.10s; }
                .exec-fade:nth-child(4) { animation-delay: 0.15s; }
                .exec-fade:nth-child(5) { animation-delay: 0.20s; }

                /* SplitText h1 */
                .exec-h1.split-parent {
                    font-size: 22px !important;
                    line-height: 1.2 !important;
                    letter-spacing: -0.025em !important;
                    font-weight: 600 !important;
                    color: var(--vq-text) !important;
                    font-family: var(--vq-font-sans) !important;
                    margin: 0 !important;
                    display: block !important;
                }
                .exec-h1 .split-word { display: inline-block !important; }

                /* Shine sweep for section labels */
                @keyframes vq-shine-sweep {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                .shine-label {
                    font-family: var(--vq-font-mono);
                    font-size: 10px;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    font-weight: 600;
                    background-image: linear-gradient(110deg,
                        var(--vq-accent-text) 0%,
                        var(--vq-accent-text) 35%,
                        #fff 50%,
                        var(--vq-accent-text) 65%,
                        var(--vq-accent-text) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: vq-shine-sweep 3.5s linear infinite;
                    display: inline-block;
                }
` }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      gap: "14px",
      height: "100%",
      width: "100%",
      padding: "14px 18px",
      overflow: "hidden",
      boxSizing: "border-box",
      fontFamily: "var(--vq-font-sans)",
      background: "var(--vq-bg)"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: 0, overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "exec-fade", style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Eyebrow, { color: "var(--vq-accent-text)", children: "Executive Overview" }),
            /* @__PURE__ */ jsx("div", { style: { marginTop: "3px" }, children: /* @__PURE__ */ jsx("h1", { className: "exec-h1", children: "Business Dashboard" }) })
          ] }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.admin.settings", { store_slug: store.slug }),
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 14px",
                borderRadius: "var(--vq-r-md)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--vq-text-2)",
                border: "1px solid var(--vq-line)",
                background: "transparent",
                textDecoration: "none",
                transition: "background 180ms"
              },
              onMouseEnter: (e) => e.currentTarget.style.background = "var(--vq-sunken)",
              onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
              children: [
                /* @__PURE__ */ jsx(Settings, { size: 13 }),
                " Settings"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "exec-fade", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.low-stock", { store_slug: store.slug }), style: { textDecoration: "none", display: "block" }, children: /* @__PURE__ */ jsxs(Card, { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: ClipboardList, color: "var(--vq-warning)" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Eyebrow, { children: "Pending Actions" }),
                /* @__PURE__ */ jsx("div", { style: { marginTop: "5px" }, children: inventoryHealth.lowStockCount > 0 ? /* @__PURE__ */ jsxs(Pill, { type: "warn", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { size: 9 }),
                  " Action Needed"
                ] }) : /* @__PURE__ */ jsx(Pill, { type: "ok", children: "All clear" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "22px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--vq-text)", lineHeight: 1 }, children: inventoryHealth.lowStockCount > 0 ? inventoryHealth.lowStockCount : 0 }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--vq-text-3)", marginTop: "3px" }, children: "items" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(Card, { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: TrendingUp, color: "var(--vq-success)" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Eyebrow, { children: "Profit Margin" }),
                /* @__PURE__ */ jsx("div", { style: { marginTop: "5px" }, children: /* @__PURE__ */ jsxs(Pill, { type: "ok", children: [
                  /* @__PURE__ */ jsx(ArrowUpRight, { size: 9 }),
                  " Healthy"
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "22px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--vq-text)", lineHeight: 1 }, children: /* @__PURE__ */ jsx(CountUp, { value: profitMarginPct, suffix: "%" }) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--vq-text-3)", marginTop: "3px" }, children: "net / revenue" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: Receipt, color: "var(--vq-mod-reports-accent)" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Eyebrow, { children: "Overdue" }),
                /* @__PURE__ */ jsx("div", { style: { marginTop: "5px" }, children: stats.overdue_payments > 0 ? /* @__PURE__ */ jsx(Pill, { type: "bad", children: "Outstanding" }) : /* @__PURE__ */ jsx(Pill, { type: "ok", children: "On Track" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: stats.overdue_payments > 0 ? "var(--vq-danger)" : "var(--vq-text)", lineHeight: 1 }, children: formatCurrency(stats.overdue_payments) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "var(--vq-text-3)", marginTop: "3px" }, children: "receivables" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "exec-fade", style: { flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "3fr 2fr", gridTemplateRows: "1fr 1fr", gap: "12px", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxs(Card, { hover: false, pad: "16px 18px", style: { display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.01em", marginBottom: "2px" }, children: "Purchases Trend" }),
                /* @__PURE__ */ jsx(Eyebrow, { children: "Past 6 months spending" })
              ] }),
              /* @__PURE__ */ jsx(IconBadge, { icon: TrendingUp, color: "var(--vq-mod-accounting-accent, var(--vq-accent))" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1, minHeight: 0, width: "100%" }, children: /* @__PURE__ */ jsx(
              BklitAreaChart,
              {
                data: profitData,
                dataKey: "purchases",
                xKey: "month",
                name: "Purchases",
                color: "var(--chart-1)",
                currencySymbol,
                valueFormatter: (v) => `${currencySymbol} ${v.toLocaleString()}`
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { hover: false, pad: "14px 16px", style: { display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexShrink: 0 }, children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.01em", marginBottom: "2px" }, children: "Inventory" }),
              /* @__PURE__ */ jsx(Pill, { type: invStatus.type, children: invStatus.label })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: "12px", minHeight: 0 }, children: [
              /* @__PURE__ */ jsxs(
                RingChart,
                {
                  data: invStats,
                  hoveredIndex: inventoryHoveredIndex,
                  onHoverChange: setInventoryHoveredIndex,
                  size: 120,
                  strokeWidth: 8,
                  ringGap: 4,
                  children: [
                    invStats.map((_, i) => /* @__PURE__ */ jsx(Ring, { index: i }, i)),
                    /* @__PURE__ */ jsx(RingCenter, { defaultLabel: "Inventory" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { style: { flex: 1, minWidth: 0 }, children: /* @__PURE__ */ jsxs(
                Legend,
                {
                  hoveredIndex: inventoryHoveredIndex,
                  items: invStats,
                  onHoverChange: setInventoryHoveredIndex,
                  children: [
                    /* @__PURE__ */ jsxs(LegendItemComponent, { children: [
                      /* @__PURE__ */ jsx(LegendMarker, {}),
                      /* @__PURE__ */ jsx(LegendLabel, {}),
                      /* @__PURE__ */ jsx(LegendValue, { showPercentage: true })
                    ] }),
                    /* @__PURE__ */ jsx(LegendProgress, {})
                  ]
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { hover: false, pad: "16px 18px", style: { display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: "10px", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.01em", marginBottom: "2px" }, children: "Payments" }),
              /* @__PURE__ */ jsx(Eyebrow, { children: "Transaction types" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: "14px", minHeight: 0 }, children: [
              /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }, children: paymentMethods.length > 0 ? paymentMethods.map((m, i) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "5px" }, children: [
                  /* @__PURE__ */ jsx("div", { style: { width: "6px", height: "6px", borderRadius: "50%", background: S[i % 6], flexShrink: 0 } }),
                  /* @__PURE__ */ jsx(Eyebrow, { children: m.name })
                ] }),
                /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "15px", fontWeight: 600, color: "var(--vq-text)", marginLeft: "11px", lineHeight: 1.2 }, children: m.value })
              ] }, i)) : /* @__PURE__ */ jsx("span", { style: { fontSize: "12px", color: "var(--vq-text-3)" }, children: "No sales yet" }) }),
              /* @__PURE__ */ jsx("div", { style: { flex: 1, height: "100%", minHeight: 0 }, children: /* @__PURE__ */ jsx(
                BklitDonut,
                {
                  data: payPie,
                  centerLabel: paymentMethods.reduce((a, c) => a + (parseInt(c.value) || 0), 0).toString(),
                  centerSublabel: "Total Sales"
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { hover: false, pad: "16px 18px", style: { display: "flex", flexDirection: "column" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexShrink: 0 }, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.01em", marginBottom: "2px" }, children: "Expenses" }),
                /* @__PURE__ */ jsx(Eyebrow, { children: "Monthly breakdown" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Eyebrow, { children: "Total" }),
                /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--vq-text)" }, children: formatCurrency(totalExpenseValue) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, minHeight: 0, display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { width: "42%", height: "100%", flexShrink: 0 }, children: /* @__PURE__ */ jsx(
                BklitDonut,
                {
                  data: finalExpenseData,
                  valueFormatter: (v) => `${currencySymbol} ${v.toLocaleString()}`
                }
              ) }),
              /* @__PURE__ */ jsx("div", { style: {
                flex: 1,
                display: "grid",
                gridTemplateColumns: finalExpenseData.length > 2 ? "1fr 1fr" : "1fr",
                gap: "5px",
                alignContent: "center"
              }, children: finalExpenseData.map((d, i) => /* @__PURE__ */ jsx("div", { style: { padding: "6px 8px", borderRadius: "var(--vq-r-sm)", background: "var(--vq-sunken)", border: "1px solid var(--vq-line-soft)" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }, children: [
                /* @__PURE__ */ jsx("div", { style: { width: "5px", height: "5px", borderRadius: "50%", background: d.color, flexShrink: 0 } }),
                /* @__PURE__ */ jsx(Eyebrow, { children: d.name })
              ] }) }, i)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "exec-fade", style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx(Card, { pad: "14px 18px", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: Users, color: "var(--vq-mod-staff-accent, var(--vq-accent))" }),
              /* @__PURE__ */ jsx(Eyebrow, { children: tt("Active Staff") })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "20px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.02em" }, children: [
              /* @__PURE__ */ jsx(CountUp, { value: stats.active_staff }),
              " / ",
              stats.total_staff
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { pad: "14px 18px", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: Activity, color: "var(--vq-success)" }),
              /* @__PURE__ */ jsx(Eyebrow, { children: "System Status" })
            ] }),
            /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--vq-success)", letterSpacing: "0.1em", textTransform: "uppercase" }, children: "Operational" })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { pad: "14px 18px", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: Clock, color: "var(--vq-mod-platform-accent, var(--vq-text-2))" }),
              /* @__PURE__ */ jsx(Eyebrow, { children: "Last Backup" })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--vq-text)" }, children: stats.last_backup || "N/A" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        width: "286px",
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "hidden"
      }, children: [
        /* @__PURE__ */ jsxs(Card, { className: "exec-fade", hover: false, pad: "18px", style: {
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--vq-surface)",
          border: "1px solid var(--vq-line-strong)",
          boxShadow: "var(--vq-elev-2)"
        }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "var(--vq-accent)",
            opacity: 0.12,
            filter: "blur(35px)",
            pointerEvents: "none"
          } }),
          /* @__PURE__ */ jsxs("div", { style: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "14px" }, children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
              /* @__PURE__ */ jsx(IconBadge, { icon: Wallet, color: "var(--vq-accent)" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Eyebrow, { color: "var(--vq-text-3)", children: "Net Balance" }),
                /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "22px", fontWeight: 600, color: "var(--vq-text)", letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "2px" }, children: formatCurrency(stats.net_balance) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }, children: [
              /* @__PURE__ */ jsxs("div", { style: { background: "var(--vq-sunken)", borderRadius: "var(--vq-r-md)", padding: "10px 12px", border: "1px solid var(--vq-line-soft)" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
                  /* @__PURE__ */ jsx(TrendingUp, { size: 13, style: { color: "var(--vq-success)" } }),
                  /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--vq-success)", textTransform: "uppercase", fontWeight: 600 }, children: "IN" })
                ] }),
                /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "13px", fontWeight: 600, color: "var(--vq-text)" }, children: formatCurrency(stats.today_in) }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: "10px", color: "var(--vq-text-3)", marginTop: "2px" }, children: "Today's In" })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { background: "var(--vq-sunken)", borderRadius: "var(--vq-r-md)", padding: "10px 12px", border: "1px solid var(--vq-line-soft)" }, children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
                  /* @__PURE__ */ jsx(TrendingDown, { size: 13, style: { color: "var(--vq-danger)" } }),
                  /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--vq-danger)", textTransform: "uppercase", fontWeight: 600 }, children: "OUT" })
                ] }),
                /* @__PURE__ */ jsx("div", { style: { fontFamily: "var(--vq-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "13px", fontWeight: 600, color: "var(--vq-text)" }, children: formatCurrency(stats.today_out) }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: "10px", color: "var(--vq-text-3)", marginTop: "2px" }, children: "Today's Out" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }, children: [
              { label: "Users", icon: Users, route: "store.admin.users" },
              { label: "Reports", icon: FileText, route: "store.reports.index" },
              { label: "Logs", icon: Activity, route: "store.activity-log.index" }
            ].map((s, i) => /* @__PURE__ */ jsxs(
              Link,
              {
                href: route(s.route, { store_slug: store.slug }),
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 4px",
                  borderRadius: "var(--vq-r-md)",
                  background: "var(--vq-sunken)",
                  border: "1px solid var(--vq-line-soft)",
                  textDecoration: "none",
                  transition: "background 180ms, border-color 180ms"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "var(--vq-raised)";
                  e.currentTarget.style.borderColor = "var(--vq-line-strong)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "var(--vq-sunken)";
                  e.currentTarget.style.borderColor = "var(--vq-line-soft)";
                },
                children: [
                  /* @__PURE__ */ jsx(s.icon, { size: 14, style: { color: "var(--vq-text-2)" } }),
                  /* @__PURE__ */ jsx("span", { style: { fontFamily: "var(--vq-font-mono)", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--vq-text-3)", fontWeight: 500 }, children: s.label })
                ]
              },
              i
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "exec-fade", hover: false, pad: "14px 16px", style: { flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx("div", { style: { marginBottom: "10px" }, children: /* @__PURE__ */ jsx("span", { className: "shine-label", children: "Alerts" }) }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "5px" }, children: [
            inventoryHealth.lowStock > 0 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "var(--vq-warning-bg)", borderRadius: "var(--vq-r-sm)", boxShadow: "inset 0 0 0 1px var(--vq-warning-line)" }, children: [
              /* @__PURE__ */ jsx(Package, { size: 12, style: { color: "var(--vq-warning)", flexShrink: 0 } }),
              /* @__PURE__ */ jsxs("p", { style: { fontSize: "12px", color: "var(--vq-warning)", margin: 0 }, children: [
                inventoryHealth.lowStock,
                "% inventory low"
              ] })
            ] }),
            inventoryHealth.outOfStock > 0 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "var(--vq-danger-bg)", borderRadius: "var(--vq-r-sm)", boxShadow: "inset 0 0 0 1px var(--vq-danger-line)" }, children: [
              /* @__PURE__ */ jsx(AlertCircle, { size: 12, style: { color: "var(--vq-danger)", flexShrink: 0 } }),
              /* @__PURE__ */ jsxs("p", { style: { fontSize: "12px", color: "var(--vq-danger)", margin: 0 }, children: [
                inventoryHealth.outOfStock,
                "% out of stock"
              ] })
            ] }),
            inventoryHealth.lowStock === 0 && inventoryHealth.outOfStock === 0 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "var(--vq-success-bg)", borderRadius: "var(--vq-r-sm)", boxShadow: "inset 0 0 0 1px var(--vq-success-line)" }, children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 12, style: { color: "var(--vq-success)", flexShrink: 0 } }),
              /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "var(--vq-success)", margin: 0 }, children: "All systems good" })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", background: "var(--vq-accent-quiet)", borderRadius: "var(--vq-r-sm)", boxShadow: "inset 0 0 0 1px rgba(50,120,130,0.2)" }, children: [
              /* @__PURE__ */ jsx(DollarSign, { size: 12, style: { color: "var(--vq-accent-text)", flexShrink: 0 } }),
              /* @__PURE__ */ jsxs("p", { style: { fontSize: "12px", color: "var(--vq-accent-text)", margin: 0 }, children: [
                "Profit: ",
                formatCurrency(stats.net_profit)
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "exec-fade", hover: false, pad: "14px 16px", style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexShrink: 0 }, children: [
            /* @__PURE__ */ jsx("span", { className: "shine-label", children: "Activity" }),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.funds.index", { store_slug: store.slug, view: "history" }),
                style: { fontFamily: "var(--vq-font-mono)", fontSize: "10px", color: "var(--vq-accent-text)", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" },
                children: "View All"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1, overflowY: "auto", minHeight: 0 }, children: recentActivity.length > 0 ? recentActivity.map((act, i) => /* @__PURE__ */ jsx(ActivityRow, { act }, i)) : /* @__PURE__ */ jsxs("div", { style: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--vq-text-3)", gap: "8px", padding: "20px 0" }, children: [
            /* @__PURE__ */ jsx(Activity, { size: 20 }),
            /* @__PURE__ */ jsx(Eyebrow, { children: "No Recent Activity" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "exec-fade", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", flexShrink: 0 }, children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.admin.settings", { store_slug: store.slug }),
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px",
                borderRadius: "var(--vq-r-md)",
                fontSize: "11px",
                fontWeight: 500,
                fontFamily: "var(--vq-font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--vq-text-2)",
                background: "var(--vq-sunken)",
                border: "1px solid var(--vq-line-soft)",
                textDecoration: "none",
                transition: "background 180ms"
              },
              onMouseEnter: (e) => e.currentTarget.style.background = "var(--vq-surface)",
              onMouseLeave: (e) => e.currentTarget.style.background = "var(--vq-sunken)",
              children: [
                /* @__PURE__ */ jsx(Settings, { size: 12 }),
                " Settings"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "9px",
                borderRadius: "var(--vq-r-md)",
                fontSize: "11px",
                fontWeight: 500,
                fontFamily: "var(--vq-font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--vq-text-2)",
                background: "var(--vq-sunken)",
                border: "1px solid var(--vq-line-soft)",
                cursor: "pointer",
                transition: "background 180ms"
              },
              onMouseEnter: (e) => e.currentTarget.style.background = "var(--vq-surface)",
              onMouseLeave: (e) => e.currentTarget.style.background = "var(--vq-sunken)",
              children: [
                /* @__PURE__ */ jsx(Shield, { size: 12 }),
                " Security"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as default
};
