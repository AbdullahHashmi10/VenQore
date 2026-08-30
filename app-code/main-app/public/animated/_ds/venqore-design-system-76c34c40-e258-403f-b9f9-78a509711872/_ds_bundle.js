/* @ds-bundle: {"format":4,"namespace":"VenQoreDesignSystem_76c34c","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"AvatarStack","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ActivityRow","sourcePath":"components/data/ActivityRow.jsx"},{"name":"AreaChart","sourcePath":"components/data/AreaChart.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"BarMeter","sourcePath":"components/data/BarMeter.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"ProgressRing","sourcePath":"components/data/ProgressRing.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"SidebarItem","sourcePath":"components/navigation/SidebarItem.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"ThemeToggle","sourcePath":"components/navigation/ThemeToggle.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"96b8095c437d","components/core/Badge.jsx":"0e846e94848d","components/core/Button.jsx":"20b6dbc410a3","components/core/Chip.jsx":"652e6ea48b5e","components/core/IconButton.jsx":"2e171bf69a86","components/data/ActivityRow.jsx":"0b1917593102","components/data/AreaChart.jsx":"5e9ca06e13b2","components/data/BarChart.jsx":"3f6171905c84","components/data/BarMeter.jsx":"812e9e4d7567","components/data/DataTable.jsx":"7a3dd2e0baa9","components/data/ProgressRing.jsx":"1808c7c1f588","components/data/StatCard.jsx":"c14b9f05a2e5","components/feedback/Alert.jsx":"52f72675453b","components/feedback/EmptyState.jsx":"40b6fdbfe08a","components/feedback/Modal.jsx":"356af8a901d0","components/feedback/Toast.jsx":"5a70e3326a4d","components/feedback/Tooltip.jsx":"c04f2aff2e6f","components/forms/Checkbox.jsx":"0888a0b1c783","components/forms/Input.jsx":"9ff6fe152092","components/forms/SearchField.jsx":"81feb1d074fc","components/forms/Select.jsx":"798cb6a02277","components/forms/Switch.jsx":"8996a54fc8c6","components/navigation/SidebarItem.jsx":"89d183b9a42f","components/navigation/Tabs.jsx":"9f43913a96fd","components/navigation/ThemeToggle.jsx":"b581c08299e8","components/surfaces/Card.jsx":"7f83d04ce6ed","ui_kits/app/AppShell.jsx":"2dc4d29211c1","ui_kits/app/BlueprintScreen.jsx":"2ac3feaead80","ui_kits/app/DashboardScreen.jsx":"2173affb88ef","ui_kits/app/LedgerScreen.jsx":"a103c305df1d","ui_kits/marketing/Hero.jsx":"a8c1e91468b8","ui_kits/marketing/Sections.jsx":"92cf336fb478"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VenQoreDesignSystem_76c34c = window.VenQoreDesignSystem_76c34c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
const HUES = ["var(--vq-teal-400)", "var(--vq-coral-400)", "var(--vq-sky-400)", "var(--vq-butter-400)", "var(--vq-lime-400)", "var(--vq-plum-400)"];

/** Initial-or-image avatar. Deterministic colour from the name. */
function Avatar({
  name = "",
  src,
  size = 36,
  ring = false,
  style
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "var(--vq-r-full)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flex: "0 0 auto",
      background: src ? "var(--vq-sunken)" : hue,
      color: "#08201C",
      font: `600 ${Math.round(size * 0.38)}px/1 var(--vq-font-sans)`,
      boxShadow: ring ? "0 0 0 2px var(--vq-surface), 0 0 0 4px var(--vq-accent)" : "none",
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials);
}

/** Overlapping stack with a +N overflow bubble. */
function AvatarStack({
  people = [],
  size = 32,
  max = 4
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center"
    }
  }, shown.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i ? -10 : 0,
      boxShadow: "0 0 0 2px var(--vq-surface)",
      borderRadius: 999,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: typeof p === "string" ? p : p.name,
    src: typeof p === "string" ? undefined : p.src,
    size: size
  }))), rest > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      marginLeft: -10,
      width: size,
      height: size,
      borderRadius: 999,
      background: "var(--vq-sunken)",
      color: "var(--vq-text-2)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      font: `600 ${Math.round(size * 0.34)}px/1 var(--vq-font-numeric)`,
      boxShadow: "0 0 0 2px var(--vq-surface)"
    }
  }, "+", rest) : null);
}
Object.assign(__ds_scope, { Avatar, AvatarStack });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: ["var(--vq-sunken)", "var(--vq-text-2)", "var(--vq-line)"],
  accent: ["var(--vq-accent-quiet)", "var(--vq-accent-text)", "var(--vq-accent-quiet-line)"],
  success: ["var(--vq-success-bg)", "var(--vq-success)", "var(--vq-success-line)"],
  warning: ["var(--vq-warning-bg)", "var(--vq-warning)", "var(--vq-warning-line)"],
  danger: ["var(--vq-danger-bg)", "var(--vq-danger)", "var(--vq-danger-line)"],
  info: ["var(--vq-info-bg)", "var(--vq-info)", "var(--vq-info-line)"]
};

/** Status pill. Colour never carries the meaning alone — always a word, usually a dot. */
function Badge({
  children,
  tone = "neutral",
  dot = true,
  icon,
  style
}) {
  const [bg, fg, bd] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 26,
      padding: "0 10px",
      background: bg,
      color: fg,
      border: `1px solid ${bd}`,
      borderRadius: "var(--vq-r-full)",
      font: "600 12px/1 var(--vq-font-sans)",
      letterSpacing: "-0.005em",
      whiteSpace: "nowrap",
      ...style
    }
  }, icon || (dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: fg
    }
  }) : null), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: "var(--vq-control-sm)",
    px: 16,
    fs: 13
  },
  md: {
    h: "var(--vq-control-md)",
    px: 22,
    fs: 14
  },
  lg: {
    h: "var(--vq-control-lg)",
    px: 28,
    fs: 15
  }
};
const VARIANTS = {
  primary: {
    bg: "var(--vq-accent-fill)",
    fg: "var(--vq-on-accent)",
    bd: "transparent",
    sh: "var(--vq-glow-accent)"
  },
  secondary: {
    bg: "var(--vq-surface)",
    fg: "var(--vq-text)",
    bd: "var(--vq-line)",
    sh: "var(--vq-elev-1)"
  },
  soft: {
    bg: "var(--vq-accent-quiet)",
    fg: "var(--vq-accent-text)",
    bd: "var(--vq-accent-quiet-line)",
    sh: "none"
  },
  ghost: {
    bg: "transparent",
    fg: "var(--vq-text-2)",
    bd: "transparent",
    sh: "none"
  },
  danger: {
    bg: "var(--vq-danger)",
    fg: "var(--vq-on-danger)",
    bd: "transparent",
    sh: "none"
  }
};

/** Pill button. One primary per view. */
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  full = false,
  disabled = false,
  onClick,
  type = "button",
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: s.h,
      padding: `0 ${s.px}px`,
      width: full ? "100%" : undefined,
      font: `${size === "lg" ? 600 : 600} ${s.fs}px/1 var(--vq-font-sans)`,
      letterSpacing: "-0.01em",
      background: hover && !disabled && variant === "primary" ? "var(--vq-accent-fill-hover)" : hover && !disabled && variant === "secondary" ? "var(--vq-surface-2)" : hover && !disabled && variant === "ghost" ? "var(--vq-sunken)" : v.bg,
      color: v.fg,
      border: `1px solid ${v.bd}`,
      borderRadius: "var(--vq-r-full)",
      boxShadow: press ? "none" : hover && variant === "primary" ? "var(--vq-glow-accent-strong)" : v.sh,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transform: press ? "scale(.97)" : hover && !disabled ? "translateY(-1px)" : "none",
      transition: "transform var(--vq-dur-2) var(--vq-ease-spring), background-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), opacity var(--vq-dur-1) linear",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      fontSize: "1.1em"
    }
  }, icon) : null, children, iconAfter ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      transform: hover ? "translateX(2px)" : "none",
      transition: "transform var(--vq-dur-2) var(--vq-ease-spring)"
    }
  }, iconAfter) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/** Selectable filter chip / segment. */
function Chip({
  children,
  selected = false,
  onClick,
  count,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 34,
      padding: "0 14px",
      background: selected ? "var(--vq-accent-fill)" : hover ? "var(--vq-sunken)" : "var(--vq-surface)",
      color: selected ? "var(--vq-on-accent)" : "var(--vq-text-2)",
      border: `1px solid ${selected ? "transparent" : "var(--vq-line)"}`,
      borderRadius: "var(--vq-r-full)",
      cursor: "pointer",
      font: "600 13px/1 var(--vq-font-sans)",
      boxShadow: selected ? "var(--vq-glow-accent)" : "none",
      transform: hover && !selected ? "translateY(-1px)" : "none",
      transition: "background-color var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), border-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)",
      ...style
    }
  }, children, count != null ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      fontSize: 11,
      padding: "2px 6px",
      borderRadius: 999,
      background: selected ? "rgb(255 255 255 / .22)" : "var(--vq-sunken)",
      color: selected ? "var(--vq-on-accent)" : "var(--vq-text-3)"
    }
  }, count) : null);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square-ish icon-only control. */
function IconButton({
  children,
  label,
  variant = "secondary",
  size = 40,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? "var(--vq-accent-quiet)" : variant === "ghost" ? "transparent" : "var(--vq-surface)";
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: size,
      height: size,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: hover ? active ? "var(--vq-accent-quiet)" : "var(--vq-sunken)" : bg,
      color: active ? "var(--vq-accent-text)" : "var(--vq-text-2)",
      border: `1px solid ${variant === "ghost" ? "transparent" : "var(--vq-line)"}`,
      borderRadius: "var(--vq-r-md)",
      cursor: "pointer",
      boxShadow: variant === "ghost" ? "none" : "var(--vq-elev-1)",
      transition: "background-color var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)",
      transform: hover ? "translateY(-1px)" : "none",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/ActivityRow.jsx
try { (() => {
/** Feed row: tinted glyph bubble, title + meta, signed amount. */
function ActivityRow({
  title,
  meta,
  amount,
  tone = "neutral",
  icon,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const c = tone === "in" ? "var(--vq-success)" : tone === "out" ? "var(--vq-danger)" : "var(--vq-text-2)";
  const bg = tone === "in" ? "var(--vq-success-bg)" : tone === "out" ? "var(--vq-danger-bg)" : "var(--vq-sunken)";
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: onClick,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: "var(--vq-r-md)",
      background: hover ? "var(--vq-sunken)" : "transparent",
      cursor: onClick ? "pointer" : "default",
      transition: "background-color var(--vq-dur-1) var(--vq-ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--vq-r-sm)",
      background: bg,
      color: c,
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
      font: "600 15px/1 var(--vq-font-numeric)"
    }
  }, icon || (tone === "out" ? "−" : tone === "in" ? "+" : "•")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 13.5px/1.3 var(--vq-font-sans)",
      color: "var(--vq-text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 12px/1.3 var(--vq-font-sans)",
      color: "var(--vq-text-3)"
    }
  }, meta) : null), amount ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      font: "600 13px/1 var(--vq-font-numeric)",
      color: tone === "out" ? "var(--vq-danger)" : tone === "in" ? "var(--vq-success)" : "var(--vq-text)"
    }
  }, amount) : null);
}
Object.assign(__ds_scope, { ActivityRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ActivityRow.jsx", error: String((e && e.message) || e) }); }

// components/data/AreaChart.jsx
try { (() => {
/** Dependency-free area + line chart. One series, mint by default. */
function AreaChart({
  data = [],
  labels = [],
  height = 200,
  color = "var(--vq-series-1)",
  showGrid = true,
  valueFormat = v => v,
  style
}) {
  const w = 640,
    pad = {
      l: 8,
      r: 8,
      t: 14,
      b: 24
    };
  const max = Math.max(...data, 1),
    min = Math.min(...data, 0);
  const span = max - min || 1;
  const x = i => pad.l + i * (w - pad.l - pad.r) / Math.max(data.length - 1, 1);
  const y = v => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height - pad.b} L${x(0)},${height - pad.b} Z`;
  const gid = React.useId().replace(/:/g, "");
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${height}`,
    width: "100%",
    height: height,
    preserveAspectRatio: "none",
    style: {
      display: "block",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.34"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), showGrid ? [0, .25, .5, .75, 1].map(t => /*#__PURE__*/React.createElement("line", {
    key: t,
    x1: pad.l,
    x2: w - pad.r,
    y1: pad.t + t * (height - pad.t - pad.b),
    y2: pad.t + t * (height - pad.t - pad.b),
    stroke: "var(--vq-chart-grid)",
    strokeWidth: "1",
    strokeDasharray: "4 6"
  })) : null, /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${gid})`,
    style: {
      opacity: on ? 1 : 0,
      transition: "opacity var(--vq-dur-4) var(--vq-ease-out) 120ms"
    }
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    pathLength: "1",
    strokeDasharray: "1",
    strokeDashoffset: on ? 0 : 1,
    style: {
      transition: "stroke-dashoffset 900ms var(--vq-ease-out)"
    }
  }), data.map((v, i) => i === data.length - 1 ? /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x(i),
    cy: y(v),
    r: "4.5",
    fill: "var(--vq-chart-surface)",
    stroke: color,
    strokeWidth: "2.5"
  }) : null)), labels.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, labels.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    className: "vq-num",
    style: {
      font: "500 11px/1 var(--vq-font-numeric)",
      color: "var(--vq-chart-label)"
    }
  }, l))) : null);
}
Object.assign(__ds_scope, { AreaChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/AreaChart.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
/** Rounded-cap bar chart with a highlighted bar. Playful, chunky, 2px gaps. */
function BarChart({
  data = [],
  labels = [],
  height = 170,
  color = "var(--vq-series-1)",
  highlight = -1,
  style
}) {
  const max = Math.max(...data, 1);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      height
    }
  }, data.map((v, i) => {
    const hi = i === highlight;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height: "100%"
      }
    }, /*#__PURE__*/React.createElement("div", {
      title: String(v),
      style: {
        height: on ? `${v / max * 100}%` : "4%",
        borderRadius: "var(--vq-r-sm)",
        background: hi ? color : "var(--vq-chart-track)",
        boxShadow: hi ? "var(--vq-glow-accent)" : "none",
        transition: `height 640ms var(--vq-ease-spring-soft) ${i * 45}ms, background-color var(--vq-dur-2) var(--vq-ease-out)`
      }
    }));
  })), labels.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 8
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: l + i,
    className: "vq-num",
    style: {
      flex: 1,
      textAlign: "center",
      font: "500 11px/1 var(--vq-font-numeric)",
      color: i === highlight ? "var(--vq-text)" : "var(--vq-chart-label)"
    }
  }, l))) : null);
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/data/BarMeter.jsx
try { (() => {
/** Labelled horizontal meter: dot, label, track, value. */
function BarMeter({
  label,
  value,
  max = 100,
  display,
  color = "var(--vq-accent)",
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      font: "500 13px/1 var(--vq-font-sans)",
      color: "var(--vq-text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: color
    }
  }), label), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 8,
      borderRadius: 999,
      background: "var(--vq-chart-track)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: w + "%",
      borderRadius: 999,
      background: color,
      transition: "width var(--vq-dur-4) var(--vq-ease-out)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      font: "600 13px/1 var(--vq-font-numeric)",
      color: "var(--vq-text)",
      minWidth: 44,
      textAlign: "right"
    }
  }, display ?? pct.toFixed(0) + "%"));
}
Object.assign(__ds_scope, { BarMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarMeter.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
/**
 * Horizontal-rules-only table. Numbers right-aligned, mono, tabular.
 * Columns: { key, label, align, numeric, render }
 */
function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  totals,
  style
}) {
  const [hover, setHover] = React.useState(-1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      overflowX: "auto",
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "auto"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      height: "var(--vq-row-head-h)",
      textAlign: c.numeric ? "right" : c.align || "left",
      padding: "0 14px",
      whiteSpace: "nowrap",
      font: "500 11px/1 var(--vq-font-numeric)",
      letterSpacing: "var(--vq-ls-eyebrow)",
      textTransform: "uppercase",
      color: "var(--vq-text-3)",
      borderBottom: "1px solid var(--vq-line)"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id ?? i,
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(-1),
    onClick: () => onRowClick && onRowClick(r),
    style: {
      background: hover === i ? "var(--vq-sunken)" : "transparent",
      cursor: onRowClick ? "pointer" : "default",
      transition: "background-color var(--vq-dur-1) var(--vq-ease-out)"
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.numeric ? "vq-num" : undefined,
    style: {
      height: "var(--vq-row-h)",
      padding: "0 14px",
      textAlign: c.numeric ? "right" : c.align || "left",
      borderBottom: "1px solid var(--vq-line-soft)",
      font: c.numeric ? "500 14px/1.4 var(--vq-font-numeric)" : "500 14px/1.4 var(--vq-font-sans)",
      color: "var(--vq-text)",
      whiteSpace: "nowrap"
    }
  }, c.render ? c.render(r) : r[c.key])))), totals ? /*#__PURE__*/React.createElement("tr", null, columns.map((c, i) => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.numeric ? "vq-num" : undefined,
    style: {
      height: "var(--vq-row-h)",
      padding: "0 14px",
      textAlign: c.numeric ? "right" : c.align || "left",
      borderTop: "1px solid var(--vq-line-strong)",
      font: c.numeric ? "600 14px/1.4 var(--vq-font-numeric)" : "600 14px/1.4 var(--vq-font-sans)",
      color: "var(--vq-text)"
    }
  }, totals[c.key] ?? (i === 0 ? "Total" : "")))) : null)));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressRing.jsx
try { (() => {
/** Donut gauge. Draws with a stroke-dash sweep on mount. */
function ProgressRing({
  value = 0,
  size = 132,
  thickness = 14,
  label,
  sublabel,
  color = "var(--vq-accent)",
  track = "var(--vq-chart-track)"
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(t);
  }, [value]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: track,
    strokeWidth: thickness
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c - c * shown / 100,
    style: {
      transition: "stroke-dashoffset var(--vq-dur-4) var(--vq-ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "vq-num",
    style: {
      font: "600 var(--vq-fs-metric-sm)/1 var(--vq-font-numeric)",
      letterSpacing: "-0.02em",
      color: "var(--vq-text)"
    }
  }, label ?? shown + "%"), sublabel ? /*#__PURE__*/React.createElement("div", {
    className: "vq-eyebrow",
    style: {
      marginTop: 6
    }
  }, sublabel) : null)));
}
Object.assign(__ds_scope, { ProgressRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressRing.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
/** KPI tile: eyebrow label, big tabular figure, delta chip. */
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaTone = "up",
  caption,
  icon,
  tone = "surface",
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const filled = tone === "accent";
  const dTone = deltaTone === "up" ? "var(--vq-success)" : deltaTone === "down" ? "var(--vq-danger)" : "var(--vq-text-3)";
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      padding: 20,
      minWidth: 0,
      borderRadius: "var(--vq-r-xl)",
      cursor: onClick ? "pointer" : "default",
      background: filled ? "var(--vq-grad-mint)" : "var(--vq-surface)",
      color: filled ? "#fff" : "var(--vq-text)",
      border: filled ? "1px solid transparent" : "1px solid var(--vq-line)",
      boxShadow: filled ? hover ? "var(--vq-glow-accent-strong)" : "var(--vq-glow-accent)" : hover ? "var(--vq-elev-2)" : "var(--vq-elev-1)",
      transform: hover && onClick ? "translateY(-2px)" : "none",
      transition: "transform var(--vq-dur-3) var(--vq-ease-spring), box-shadow var(--vq-dur-3) var(--vq-ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "vq-eyebrow",
    style: {
      color: filled ? "rgb(255 255 255 / .78)" : undefined
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "var(--vq-r-full)",
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
      background: filled ? "rgb(255 255 255 / .18)" : "var(--vq-accent-quiet)",
      color: filled ? "#fff" : "var(--vq-accent-text)",
      transform: hover ? "rotate(-8deg) scale(1.06)" : "none",
      transition: "transform var(--vq-dur-3) var(--vq-ease-spring)"
    }
  }, icon || /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7m0 0h-7m7 0v7"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "vq-metric",
    style: {
      font: "600 var(--vq-fs-metric)/var(--vq-lh-metric) var(--vq-font-numeric)",
      letterSpacing: "var(--vq-ls-metric)"
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 14px/1 var(--vq-font-sans)",
      color: filled ? "rgb(255 255 255 / .78)" : "var(--vq-text-3)"
    }
  }, unit) : null), delta || caption ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, delta ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 8px",
      borderRadius: 999,
      font: "600 12px/1 var(--vq-font-numeric)",
      background: filled ? "rgb(255 255 255 / .18)" : deltaTone === "down" ? "var(--vq-danger-bg)" : "var(--vq-success-bg)",
      color: filled ? "#fff" : dTone
    }
  }, deltaTone === "down" ? "▾" : "▴", " ", delta) : null, caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 12px/1.3 var(--vq-font-sans)",
      color: filled ? "rgb(255 255 255 / .8)" : "var(--vq-text-3)"
    }
  }, caption) : null) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const TONES = {
  info: ["var(--vq-info-bg)", "var(--vq-info)", "var(--vq-info-line)"],
  success: ["var(--vq-success-bg)", "var(--vq-success)", "var(--vq-success-line)"],
  warning: ["var(--vq-warning-bg)", "var(--vq-warning)", "var(--vq-warning-line)"],
  danger: ["var(--vq-danger-bg)", "var(--vq-danger)", "var(--vq-danger-line)"]
};

/** Inline alert row. Icon + word, never colour alone. */
function Alert({
  children,
  tone = "info",
  icon,
  action,
  onDismiss,
  style
}) {
  const [bg, fg, bd] = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: bg,
      border: `1px solid ${bd}`,
      borderRadius: "var(--vq-r-md)",
      font: "600 13px/1.4 var(--vq-font-sans)",
      color: fg,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto"
    }
  }, icon || /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v5m0 3.2v.1"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, children), action, onDismiss ? /*#__PURE__*/React.createElement("button", {
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      background: "none",
      border: 0,
      color: "inherit",
      cursor: "pointer",
      opacity: .7,
      padding: 2,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6 6 18"
  }))) : null);
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/** What-goes-here + one action. Never "No data". */
function EmptyState({
  title,
  body,
  action,
  icon,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 12,
      padding: "32px 20px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "var(--vq-r-lg)",
      display: "grid",
      placeItems: "center",
      background: "var(--vq-accent-quiet)",
      color: "var(--vq-accent-text)",
      border: "1px solid var(--vq-accent-quiet-line)"
    }
  }, icon || /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 17V7l8-4 8 4v10l-8 4-8-4Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m4 7 8 4 8-4M12 21V11"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 16px/1.3 var(--vq-font-display)",
      letterSpacing: "-0.02em",
      color: "var(--vq-text)"
    }
  }, title), body ? /*#__PURE__*/React.createElement("span", {
    style: {
      maxWidth: 320,
      font: "500 13.5px/1.5 var(--vq-font-sans)",
      color: "var(--vq-text-3)"
    }
  }, body) : null, action);
}

/** Shimmer placeholder — the honest answer to "is this broken or just slow". */
function Skeleton({
  width = "100%",
  height = 14,
  radius = "var(--vq-r-sm)",
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, var(--vq-sunken) 0%, var(--vq-line-soft) 40%, var(--vq-sunken) 80%)",
      backgroundSize: "300% 100%",
      animation: "vqShimmer 1.4s linear infinite",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes vqShimmer{from{background-position:100% 0}to{background-position:-100% 0}}"));
}
Object.assign(__ds_scope, { EmptyState, Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
/** Centred dialog with a blurred scrim. Escape closes. */
function Modal({
  open = true,
  title,
  description,
  children,
  footer,
  onClose,
  width = 560
}) {
  React.useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 600,
      display: "grid",
      placeItems: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--vq-scrim)",
      backdropFilter: "blur(6px)",
      animation: "vqFade var(--vq-dur-3) var(--vq-ease-out) both"
    }
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      position: "relative",
      width: "100%",
      maxWidth: width,
      background: "var(--vq-raised)",
      border: "1px solid var(--vq-line)",
      borderRadius: "var(--vq-r-xl)",
      boxShadow: "var(--vq-elev-3)",
      padding: 26,
      display: "flex",
      flexDirection: "column",
      gap: 18,
      animation: "vqPop var(--vq-dur-4) var(--vq-ease-spring-soft) both"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes vqFade{from{opacity:0}to{opacity:1}}@keyframes vqPop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}"), title || description ? /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: "600 22px/1.2 var(--vq-font-display)",
      letterSpacing: "-0.025em",
      color: "var(--vq-text)"
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: "500 14px/1.55 var(--vq-font-sans)",
      color: "var(--vq-text-2)"
    }
  }, description) : null) : null, children, footer ? /*#__PURE__*/React.createElement("footer", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
/** Floating confirmation. Springs up from the bottom-right. */
function Toast({
  title,
  description,
  tone = "success",
  onDismiss,
  visible = true,
  style
}) {
  const fg = tone === "danger" ? "var(--vq-danger)" : tone === "warning" ? "var(--vq-warning)" : "var(--vq-success)";
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      width: 340,
      padding: 16,
      background: "var(--vq-raised)",
      border: "1px solid var(--vq-line)",
      borderRadius: "var(--vq-r-lg)",
      boxShadow: "var(--vq-elev-3)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(.96)",
      transition: "opacity var(--vq-dur-3) var(--vq-ease-out), transform var(--vq-dur-3) var(--vq-ease-spring)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      flex: "0 0 auto",
      display: "grid",
      placeItems: "center",
      background: "var(--vq-accent-quiet)",
      color: fg
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m5 13 4.5 4.5L19 7"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "600 14px/1.35 var(--vq-font-sans)",
      color: "var(--vq-text)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2,
      font: "500 12.5px/1.45 var(--vq-font-sans)",
      color: "var(--vq-text-3)"
    }
  }, description) : null), onDismiss ? /*#__PURE__*/React.createElement("button", {
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      background: "none",
      border: 0,
      cursor: "pointer",
      color: "var(--vq-text-3)",
      lineHeight: 0,
      padding: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6 6 18"
  }))) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/** Hover label. In production, portal this to <body> — never let it be clipped. */
function Tooltip({
  label,
  children,
  side = "top"
}) {
  const [show, setShow] = React.useState(false);
  const pos = side === "right" ? {
    left: "calc(100% + 10px)",
    top: "50%",
    transform: `translateY(-50%) scale(${show ? 1 : .94})`
  } : {
    bottom: "calc(100% + 10px)",
    left: "50%",
    transform: `translateX(-50%) scale(${show ? 1 : .94})`
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      ...pos,
      zIndex: 800,
      pointerEvents: "none",
      whiteSpace: "nowrap",
      padding: "7px 11px",
      borderRadius: "var(--vq-r-sm)",
      background: "var(--vq-ink-900)",
      color: "#EDF2EF",
      font: "600 12px/1 var(--vq-font-sans)",
      boxShadow: "var(--vq-elev-2)",
      opacity: show ? 1 : 0,
      transition: "opacity var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)"
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox with a spring tick. */
function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  id,
  style
}) {
  const fid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      font: "500 14px/1.4 var(--vq-font-sans)",
      color: "var(--vq-text)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: fid,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: "0 0 auto",
      borderRadius: "var(--vq-r-xs)",
      background: checked ? "var(--vq-accent-fill)" : "var(--vq-surface)",
      border: `1px solid ${checked ? "transparent" : "var(--vq-line-strong)"}`,
      boxShadow: checked ? "var(--vq-glow-accent)" : "var(--vq-elev-1)",
      display: "grid",
      placeItems: "center",
      transition: "background-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 6,
      borderLeft: "2.5px solid var(--vq-on-accent)",
      borderBottom: "2.5px solid var(--vq-on-accent)",
      transform: checked ? "rotate(-45deg) scale(1)" : "rotate(-45deg) scale(.4)",
      opacity: checked ? 1 : 0,
      marginTop: -2,
      transition: "background-color var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), border-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-spring)"
    }
  })), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
/** Labelled text field. Label above, always. 16px minimum font-size. */
function Input({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  size = "md",
  disabled = false,
  id,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  const h = size === "lg" ? "var(--vq-control-xl)" : "var(--vq-control-lg)";
  const border = error ? "var(--vq-danger)" : focus ? "var(--vq-focus)" : "var(--vq-line)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      font: "600 13px/1.3 var(--vq-font-sans)",
      color: "var(--vq-text-2)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: h,
      padding: "0 16px",
      background: disabled ? "var(--vq-sunken)" : "var(--vq-surface)",
      border: `1px solid ${border}`,
      borderRadius: "var(--vq-r-md)",
      boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
      transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)"
    }
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vq-text-3)",
      display: "flex"
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", {
    id: fid,
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: "transparent",
      font: "500 16px/1 var(--vq-font-sans)",
      color: "var(--vq-text)"
    }
  }), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vq-text-3)",
      display: "flex"
    }
  }, suffix) : null), error || hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 12px/1.4 var(--vq-font-sans)",
      color: error ? "var(--vq-danger)" : "var(--vq-text-3)"
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
/** Top-bar search with a keyboard-shortcut cap. */
function SearchField({
  value,
  onChange,
  placeholder = "Search anything…",
  shortcut = "⌘K",
  width = 340,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: "var(--vq-control-md)",
      width,
      padding: "0 6px 0 14px",
      background: "var(--vq-surface)",
      border: `1px solid ${focus ? "var(--vq-focus)" : "var(--vq-line)"}`,
      borderRadius: "var(--vq-r-full)",
      boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
      transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--vq-text-3)",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-3.5-3.5"
  })), /*#__PURE__*/React.createElement("input", {
    value: value,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: "transparent",
      font: "500 14px/1 var(--vq-font-sans)",
      color: "var(--vq-text)"
    }
  }), shortcut ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      font: "500 11px/1 var(--vq-font-numeric)",
      color: "var(--vq-text-3)",
      background: "var(--vq-sunken)",
      border: "1px solid var(--vq-line-soft)",
      borderRadius: "var(--vq-r-full)",
      padding: "5px 9px"
    }
  }, shortcut) : null);
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
/** Native select in VenQore clothing. */
function Select({
  label,
  value,
  onChange,
  options = [],
  size = "md",
  disabled = false,
  id,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      font: "600 13px/1.3 var(--vq-font-sans)",
      color: "var(--vq-text-2)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: size === "sm" ? "var(--vq-control-sm)" : "var(--vq-control-lg)",
      background: "var(--vq-surface)",
      border: `1px solid ${focus ? "var(--vq-focus)" : "var(--vq-line)"}`,
      borderRadius: "var(--vq-r-md)",
      boxShadow: focus ? "var(--vq-ring-focus)" : "var(--vq-elev-1)",
      transition: "border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)"
    }
  }, /*#__PURE__*/React.createElement("select", {
    id: fid,
    value: value,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      width: "100%",
      height: "100%",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: `0 38px 0 ${size === "sm" ? 12 : 16}px`,
      color: "var(--vq-text)",
      font: `600 ${size === "sm" ? 13 : 15}px/1 var(--vq-font-sans)`,
      cursor: "pointer"
    }
  }, options.map(o => {
    const val = typeof o === "string" ? o : o.value;
    const lab = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 14,
      top: "50%",
      width: 8,
      height: 8,
      marginTop: -6,
      borderRight: "2px solid var(--vq-text-3)",
      borderBottom: "2px solid var(--vq-text-3)",
      transform: "rotate(45deg)",
      pointerEvents: "none"
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Toggle. The knob overshoots slightly — the one place a spring is obvious. */
function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  id,
  style
}) {
  const fid = id || React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      font: "500 14px/1.4 var(--vq-font-sans)",
      color: "var(--vq-text)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: fid,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 26,
      borderRadius: 999,
      padding: 3,
      flex: "0 0 auto",
      background: checked ? "var(--vq-accent-fill)" : "var(--vq-line-strong)",
      boxShadow: checked ? "var(--vq-glow-accent)" : "none",
      transition: "background-color var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out)",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 3px rgb(13 20 18 / .3)",
      transform: checked ? "translateX(20px)" : "translateX(0)",
      transition: "transform var(--vq-dur-3) var(--vq-ease-spring)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarItem.jsx
try { (() => {
/** Rail row. Active = tinted wash + mint left rule. Never a transform. */
function SidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  badge,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: collapsed ? label : undefined,
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      height: 44,
      padding: collapsed ? 0 : "0 12px 0 14px",
      justifyContent: collapsed ? "center" : "flex-start",
      background: active ? "var(--vq-accent-quiet)" : hover ? "var(--vq-sunken)" : "transparent",
      color: active ? "var(--vq-accent-text)" : "var(--vq-text-2)",
      border: 0,
      borderRadius: "var(--vq-r-md)",
      cursor: "pointer",
      textAlign: "left",
      font: `${active ? 600 : 500} 14px/1 var(--vq-font-sans)`,
      transition: "background-color var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out)",
      ...style
    }
  }, active ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 0,
      top: 11,
      bottom: 11,
      width: 3,
      borderRadius: 999,
      background: "var(--vq-accent)"
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      width: 20,
      height: 20,
      flex: "0 0 auto"
    }
  }, icon), collapsed ? null : /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, label), !collapsed && badge != null ? /*#__PURE__*/React.createElement("span", {
    className: "vq-num",
    style: {
      font: "600 11px/1 var(--vq-font-numeric)",
      padding: "4px 7px",
      borderRadius: 999,
      background: active ? "var(--vq-accent-fill)" : "var(--vq-sunken)",
      color: active ? "var(--vq-on-accent)" : "var(--vq-text-3)"
    }
  }, badge) : null);
}
Object.assign(__ds_scope, { SidebarItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Segmented pill tabs with a sliding mint thumb. */
function Tabs({
  tabs = [],
  value,
  onChange,
  size = "md",
  style
}) {
  const active = Math.max(0, tabs.findIndex(t => (typeof t === "string" ? t : t.value) === value));
  const h = size === "sm" ? 34 : 42;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-grid",
      gridAutoFlow: "column",
      gridAutoColumns: "1fr",
      padding: 4,
      height: h + 8,
      background: "var(--vq-sunken)",
      borderRadius: "var(--vq-r-full)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      width: `calc((100% - 8px) / ${tabs.length})`,
      transform: `translateX(${active * 100}%)`,
      background: "var(--vq-surface)",
      borderRadius: "var(--vq-r-full)",
      boxShadow: "var(--vq-elev-1)",
      transition: "transform var(--vq-dur-3) var(--vq-ease-spring)"
    }
  }), tabs.map((t, i) => {
    const v = typeof t === "string" ? t : t.value;
    const l = typeof t === "string" ? t : t.label;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => onChange && onChange(v),
      style: {
        position: "relative",
        zIndex: 1,
        height: h,
        padding: "0 18px",
        background: "none",
        border: 0,
        cursor: "pointer",
        whiteSpace: "nowrap",
        font: `${i === active ? 600 : 500} ${size === "sm" ? 13 : 14}px/1 var(--vq-font-sans)`,
        color: i === active ? "var(--vq-text)" : "var(--vq-text-3)",
        transition: "color var(--vq-dur-2) var(--vq-ease-out)"
      }
    }, l);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ThemeToggle.jsx
try { (() => {
/** Sun/moon switch. Writes data-theme on <html> and remembers the choice. */
function ThemeToggle({
  size = 40,
  storageKey = "vq-theme",
  style
}) {
  const [dark, setDark] = React.useState(() => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark");
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("vq-theming");
    root.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem(storageKey, dark ? "dark" : "light");
    } catch (e) {}
    const f = requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("vq-theming")));
    return () => cancelAnimationFrame(f);
  }, [dark, storageKey]);
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": dark ? "Switch to light" : "Switch to dark",
    onClick: () => setDark(d => !d),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: size,
      height: size,
      borderRadius: "var(--vq-r-md)",
      display: "grid",
      placeItems: "center",
      background: hover ? "var(--vq-sunken)" : "var(--vq-surface)",
      color: "var(--vq-text-2)",
      border: "1px solid var(--vq-line)",
      boxShadow: "var(--vq-elev-1)",
      cursor: "pointer",
      transition: "background-color var(--vq-dur-1) var(--vq-ease-out)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      transform: dark ? "rotate(-40deg)" : "none",
      transition: "transform var(--vq-dur-4) var(--vq-ease-spring)"
    }
  }, dark ? /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4"
  }))));
}
Object.assign(__ds_scope, { ThemeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ThemeToggle.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
/**
 * The floating panel every screen is built from. White (or --vq-surface) on the
 * soft page, 20px radius, hairline + soft shadow, optional hover lift.
 */
function Card({
  title,
  eyebrow,
  action,
  children,
  pad = 20,
  tone = "surface",
  lift = false,
  radius = "var(--vq-r-lg)",
  style
}) {
  const [hover, setHover] = React.useState(false);
  const filled = tone === "accent";
  const dark = tone === "ink";
  return /*#__PURE__*/React.createElement("section", {
    onMouseEnter: () => lift && setHover(true),
    onMouseLeave: () => lift && setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      gap: title || eyebrow ? 16 : 0,
      padding: pad,
      borderRadius: radius,
      position: "relative",
      overflow: "hidden",
      background: filled ? "var(--vq-grad-mint)" : dark ? "var(--vq-ink-950)" : "var(--vq-surface)",
      color: filled ? "#fff" : dark ? "#EDF2EF" : "var(--vq-text)",
      border: filled || dark ? "1px solid transparent" : "1px solid var(--vq-line)",
      boxShadow: filled ? hover ? "var(--vq-glow-accent-strong)" : "var(--vq-glow-accent)" : hover ? "var(--vq-elev-2)" : "var(--vq-elev-1)",
      transform: hover ? "translateY(-2px)" : "none",
      transition: "transform var(--vq-dur-3) var(--vq-ease-spring), box-shadow var(--vq-dur-3) var(--vq-ease-out)",
      ...style
    }
  }, title || eyebrow || action ? /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, eyebrow ? /*#__PURE__*/React.createElement("span", {
    className: "vq-eyebrow",
    style: {
      color: filled ? "rgb(255 255 255 / .72)" : undefined
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "600 17px/1.25 var(--vq-font-display)",
      letterSpacing: "-0.02em",
      margin: 0,
      color: "inherit"
    }
  }, title) : null), action) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
(function () {
  const {
    SidebarItem,
    SearchField,
    IconButton,
    Avatar,
    ThemeToggle,
    Button,
    Badge
  } = window.VenQoreDesignSystem_76c34c;
  const G = (d, sw = 1.9) => React.createElement("svg", {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, d);
  const ICONS = {
    dash: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "7",
      height: "7",
      rx: "2"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "3",
      width: "7",
      height: "7",
      rx: "2"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "14",
      width: "7",
      height: "7",
      rx: "2"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "14",
      width: "7",
      height: "7",
      rx: "2"
    }))),
    blueprint: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3v18M3 12h18"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "18",
      height: "18",
      rx: "4"
    }))),
    sales: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M3 5h2l2.4 11h11L21 8H6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "20",
      r: "1.4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "18",
      cy: "20",
      r: "1.4"
    }))),
    stock: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 17V7l8-4 8 4v10l-8 4-8-4Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m4 7 8 4 8-4M12 21V11"
    }))),
    ledger: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M5 4h11l3 3v13H5z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8 9h8M8 13h8M8 17h5"
    }))),
    parties: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "8",
      r: "3.2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M18 20c0-2.4-1-4.5-2.6-5.7"
    }))),
    reports: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 20V10M10 20V4M16 20v-7M22 20H2"
    }))),
    bell: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10.5 20a2 2 0 0 0 3 0"
    }))),
    spark: G(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"
    })))
  };
  const NAV = [{
    id: "dashboard",
    label: "Dashboard",
    icon: ICONS.dash
  }, {
    id: "blueprint",
    label: "Blueprint",
    icon: ICONS.blueprint,
    badge: "AI"
  }, {
    id: "sales",
    label: "Sales & POS",
    icon: ICONS.sales,
    badge: 12
  }, {
    id: "inventory",
    label: "Inventory",
    icon: ICONS.stock
  }, {
    id: "ledger",
    label: "Core Ledger",
    icon: ICONS.ledger
  }, {
    id: "parties",
    label: "Customers",
    icon: ICONS.parties
  }, {
    id: "reports",
    label: "Reports",
    icon: ICONS.reports
  }];
  function AppShell({
    screen,
    onNavigate,
    children,
    title,
    subtitle,
    actions
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "var(--vq-rail-w) 1fr",
        minHeight: "100vh",
        background: "var(--vq-bg)"
      }
    }, /*#__PURE__*/React.createElement("aside", {
      style: {
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: 14,
        borderRight: "1px solid var(--vq-line)",
        background: "var(--vq-surface)",
        zIndex: 300
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.png",
      alt: "",
      width: "28",
      height: "28"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 19px/1 var(--vq-font-display)",
        letterSpacing: "-0.03em"
      }
    }, "VenQore")), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "vq-eyebrow",
      style: {
        padding: "6px 10px 2px"
      }
    }, "Operate"), NAV.map(n => /*#__PURE__*/React.createElement(SidebarItem, {
      key: n.id,
      icon: n.icon,
      label: n.label,
      badge: n.badge,
      active: screen === n.id,
      onClick: () => onNavigate(n.id)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: "var(--vq-r-lg)",
        background: "var(--vq-grad-mint)",
        color: "#fff",
        boxShadow: "var(--vq-glow-accent)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "vq-eyebrow",
      style: {
        color: "rgb(255 255 255 / .78)"
      }
    }, "Trial"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: "600 15px/1.3 var(--vq-font-display)",
        marginTop: 4
      }
    }, "3 days left"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: "500 12px/1.45 var(--vq-font-sans)",
        color: "rgb(255 255 255 / .82)",
        marginTop: 4
      }
    }, "Keep everything you've built."), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      full: true,
      style: {
        marginTop: 12
      }
    }, "Choose a plan")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 6px"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Ahmad Raza",
      ring: true
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 13px/1.3 var(--vq-font-sans)"
      }
    }, "Ahmad Raza"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "500 11.5px/1.3 var(--vq-font-sans)",
        color: "var(--vq-text-3)"
      }
    }, "Rana Traders")), /*#__PURE__*/React.createElement(ThemeToggle, {
      size: 34,
      style: {
        marginLeft: "auto"
      }
    })))), /*#__PURE__*/React.createElement("main", {
      style: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        position: "sticky",
        top: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: "var(--vq-topbar-h)",
        padding: "0 24px",
        background: "var(--vq-glass)",
        backdropFilter: "blur(var(--vq-glass-blur))",
        borderBottom: "1px solid var(--vq-line)"
      }
    }, /*#__PURE__*/React.createElement(SearchField, {
      width: 300
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      size: "sm",
      icon: ICONS.spark
    }, "Ask Vena"), /*#__PURE__*/React.createElement(Badge, {
      tone: "success"
    }, "Live sync"), /*#__PURE__*/React.createElement(IconButton, {
      label: "Notifications"
    }, ICONS.bell))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "26px 24px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--vq-gutter)",
        maxWidth: 1320
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "vq-eyebrow"
    }, subtitle), /*#__PURE__*/React.createElement("h1", {
      style: {
        font: "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)",
        letterSpacing: "var(--vq-ls-h1)",
        margin: 0
      }
    }, title)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        gap: 10,
        alignItems: "center"
      }
    }, actions)), children)));
  }
  Object.assign(window, {
    AppShell,
    ICONS,
    NAV
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/BlueprintScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    Button,
    Input,
    Badge,
    Chip,
    Checkbox,
    Switch,
    Toast,
    EmptyState,
    Alert
  } = window.VenQoreDesignSystem_76c34c;
  const MODULES = [{
    name: "Point of sale",
    why: "You said you ring up walk-in sales.",
    on: true
  }, {
    name: "Batch & expiry tracking",
    why: "Pharmacy stock needs expiry dates.",
    on: true
  }, {
    name: "Supplier credit — 30 days",
    why: "Four distributors on credit terms.",
    on: true
  }, {
    name: "Core Ledger — double entry",
    why: "Always on. Every module posts through it.",
    on: true,
    locked: true
  }, {
    name: "Payroll",
    why: "You have 6 staff on fixed salaries.",
    on: true
  }, {
    name: "Manufacturing / BOM",
    why: "Nothing you described is assembled.",
    on: false
  }];
  function BlueprintScreen() {
    const [prompt, setPrompt] = React.useState("Two pharmacy branches, 30-day credit from four distributors, batch & expiry tracking, trial balance monthly.");
    const [state, setState] = React.useState("draft");
    const [mods, setMods] = React.useState(MODULES);
    const toggle = i => setMods(m => m.map((x, j) => j === i && !x.locked ? {
      ...x,
      on: !x.on
    } : x));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 340px",
        gap: "var(--vq-gutter)",
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "accent",
      eyebrow: "Step 1 \xB7 describe",
      title: "Tell us how you actually work",
      pad: 24
    }, /*#__PURE__*/React.createElement("textarea", {
      value: prompt,
      onChange: e => setPrompt(e.target.value),
      rows: 3,
      style: {
        width: "100%",
        boxSizing: "border-box",
        resize: "none",
        background: "rgb(255 255 255 / .16)",
        border: "1px solid rgb(255 255 255 / .3)",
        borderRadius: "var(--vq-r-md)",
        padding: 14,
        color: "#fff",
        font: "500 15px/1.55 var(--vq-font-sans)",
        outline: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setState("draft")
    }, "Redraft the blueprint"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "500 12.5px/1.4 var(--vq-font-sans)",
        color: "rgb(255 255 255 / .8)"
      }
    }, "Sentences, not a 40-field wizard."))), /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Step 2 \xB7 review",
      title: "Your blueprint",
      action: /*#__PURE__*/React.createElement(Badge, {
        tone: state === "approved" ? "success" : "accent"
      }, state === "approved" ? "Approved" : "Draft")
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "info"
    }, "AI decides what your system looks like. It never decides what your numbers say."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, mods.map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: m.name,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: "var(--vq-r-md)",
        border: "1px solid var(--vq-line)",
        background: m.on ? "var(--vq-surface)" : "var(--vq-sunken)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "600 14px/1.3 var(--vq-font-sans)"
      }
    }, m.name, m.locked ? /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      dot: false
    }, "Locked") : null), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        marginTop: 3,
        font: "500 12.5px/1.45 var(--vq-font-sans)",
        color: "var(--vq-text-3)"
      }
    }, m.why)), /*#__PURE__*/React.createElement(Switch, {
      checked: m.on,
      onChange: () => toggle(i)
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => setState("approved"),
      disabled: state === "approved"
    }, "Approve blueprint"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost"
    }, "Export as PDF")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Detected",
      title: "What we read"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8
      }
    }, ["2 branches", "Pharmacy", "Batch + expiry", "30-day credit", "4 suppliers", "Monthly trial balance", "6 staff"].map(t => /*#__PURE__*/React.createElement(Chip, {
      key: t,
      selected: false
    }, t)))), /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Step 3 \xB7 go live",
      title: "What happens next"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Import my supplier list (CSV)",
      checked: true,
      onChange: () => {}
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Open with last month's stock count",
      checked: true,
      onChange: () => {}
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Invite my accountant",
      onChange: () => {}
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Go-live date",
      value: "1 Sep 2026"
    })), state === "approved" ? /*#__PURE__*/React.createElement(Toast, {
      title: "Blueprint approved",
      description: "Assembling your system \u2014 about 40 seconds."
    }) : /*#__PURE__*/React.createElement(Card, {
      pad: 6
    }, /*#__PURE__*/React.createElement(EmptyState, {
      title: "Nothing is real yet",
      body: "Every line above is editable. Nothing posts to a ledger until you approve."
    }))));
  }
  Object.assign(window, {
    BlueprintScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/BlueprintScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DashboardScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    StatCard,
    AreaChart,
    BarChart,
    ProgressRing,
    BarMeter,
    ActivityRow,
    Alert,
    Badge,
    Button,
    Tabs,
    Select,
    IconButton
  } = window.VenQoreDesignSystem_76c34c;
  function DashboardScreen() {
    const [period, setPeriod] = React.useState("Month");
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      tone: "accent",
      label: "Net balance",
      value: "6,636,549",
      unit: "Rs",
      delta: "8.2%",
      caption: "vs last month"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Profit margin",
      value: "54",
      unit: "%",
      delta: "2.1%",
      caption: "net / revenue"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Overdue",
      value: "10,260",
      unit: "Rs",
      delta: "3.1%",
      deltaTone: "down",
      caption: "receivables"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Pending actions",
      value: "3",
      unit: "items",
      caption: "needs approval"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)",
        gap: "var(--vq-gutter)",
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--vq-gutter)",
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Past 6 months spending",
      title: "Purchases trend",
      action: /*#__PURE__*/React.createElement(Tabs, {
        size: "sm",
        tabs: ["Month", "Quarter", "Year"],
        value: period,
        onChange: setPeriod
      })
    }, /*#__PURE__*/React.createElement(AreaChart, {
      data: [700, 1400, 2100, 2400, 2600, 5200],
      labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      height: 210
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.15fr 1fr",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Inventory",
      action: /*#__PURE__*/React.createElement(Badge, {
        tone: "warning"
      }, "Action needed")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 18,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(ProgressRing, {
      value: 33,
      size: 116,
      sublabel: "Inventory"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(BarMeter, {
      label: "Healthy",
      value: 75,
      color: "var(--vq-success)"
    }), /*#__PURE__*/React.createElement(BarMeter, {
      label: "Low",
      value: 12,
      color: "var(--vq-warning)"
    }), /*#__PURE__*/React.createElement(BarMeter, {
      label: "Out",
      value: 13,
      color: "var(--vq-danger)"
    })))), /*#__PURE__*/React.createElement(Card, {
      eyebrow: "This week",
      title: "Sales by day",
      action: /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        options: ["Units", "Value"]
      })
    }, /*#__PURE__*/React.createElement(BarChart, {
      data: [3, 7, 5, 9, 4, 6, 2],
      labels: ["S", "M", "T", "W", "T", "F", "S"],
      highlight: 3,
      height: 148
    }))), /*#__PURE__*/React.createElement(Card, {
      title: "Payments",
      eyebrow: "Transaction types"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px 28px"
      }
    }, /*#__PURE__*/React.createElement(BarMeter, {
      label: "Cash",
      value: 2511,
      max: 2511,
      display: "2,511",
      color: "var(--vq-series-1)"
    }), /*#__PURE__*/React.createElement(BarMeter, {
      label: "Credit",
      value: 830,
      max: 2511,
      display: "830",
      color: "var(--vq-series-3)"
    }), /*#__PURE__*/React.createElement(BarMeter, {
      label: "Bank",
      value: 884,
      max: 2511,
      display: "884",
      color: "var(--vq-series-2)"
    }), /*#__PURE__*/React.createElement(BarMeter, {
      label: "Split",
      value: 1,
      max: 2511,
      display: "1",
      color: "var(--vq-series-4)"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--vq-gutter)",
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Today",
      title: "Cash position",
      action: /*#__PURE__*/React.createElement(IconButton, {
        label: "More",
        variant: "ghost"
      }, "\xB7\xB7\xB7")
    }, /*#__PURE__*/React.createElement("div", {
      className: "vq-num",
      style: {
        font: "600 30px/1 var(--vq-font-numeric)",
        letterSpacing: "-0.03em"
      }
    }, "Rs 6,636,549.20"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: "var(--vq-r-md)",
        background: "var(--vq-success-bg)",
        border: "1px solid var(--vq-success-line)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "vq-eyebrow",
      style: {
        color: "var(--vq-success)"
      }
    }, "In"), /*#__PURE__*/React.createElement("div", {
      className: "vq-num",
      style: {
        font: "600 17px/1.2 var(--vq-font-numeric)",
        marginTop: 6
      }
    }, "Rs 14,561.15")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: "var(--vq-r-md)",
        background: "var(--vq-danger-bg)",
        border: "1px solid var(--vq-danger-line)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "vq-eyebrow",
      style: {
        color: "var(--vq-danger)"
      }
    }, "Out"), /*#__PURE__*/React.createElement("div", {
      className: "vq-num",
      style: {
        font: "600 17px/1.2 var(--vq-font-numeric)",
        marginTop: 6
      }
    }, "Rs 54,251.00")))), /*#__PURE__*/React.createElement(Card, {
      title: "Alerts",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm"
      }, "View all")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "warning"
    }, "13% inventory running low"), /*#__PURE__*/React.createElement(Alert, {
      tone: "danger"
    }, "9% products out of stock"), /*#__PURE__*/React.createElement(Alert, {
      tone: "success"
    }, "Profit: Rs 53,544.70 today"))), /*#__PURE__*/React.createElement(Card, {
      title: "Business activity",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm"
      }, "View all"),
      pad: 14
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(ActivityRow, {
      tone: "in",
      title: "Sale #SAL-R1-160826",
      meta: "1 day ago",
      amount: "+Rs 1,244.00"
    }), /*#__PURE__*/React.createElement(ActivityRow, {
      tone: "out",
      title: "Purchase #PUR-R1-2210",
      meta: "1 week ago",
      amount: "\u2212Rs 1,700.00"
    }), /*#__PURE__*/React.createElement(ActivityRow, {
      tone: "out",
      title: "Purchase #PUR-R1-2209",
      meta: "1 week ago",
      amount: "\u2212Rs 1,000.00"
    }), /*#__PURE__*/React.createElement(ActivityRow, {
      tone: "in",
      title: "Sale #SAL-R1-070826",
      meta: "1 week ago",
      amount: "+Rs 5,922.00"
    }))), /*#__PURE__*/React.createElement(Card, {
      tone: "ink",
      eyebrow: "Signals",
      title: "Two customers are slipping"
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        font: "500 13px/1.55 var(--vq-font-sans)",
        color: "rgb(237 242 239 / .7)"
      }
    }, "Their order gap has doubled since June. Reach out while it is still cheap to keep them."), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      style: {
        alignSelf: "flex-start"
      }
    }, "Open Signals")))));
  }
  Object.assign(window, {
    DashboardScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/LedgerScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    DataTable,
    Badge,
    Button,
    Chip,
    Tabs,
    Select,
    StatCard,
    Modal,
    IconButton,
    Alert
  } = window.VenQoreDesignSystem_76c34c;
  const ROWS = [{
    id: 1,
    ref: "INV-2291",
    party: "Rana Traders",
    date: "16 Aug 2026",
    status: "Paid",
    tone: "success",
    amount: "128,400.00"
  }, {
    id: 2,
    ref: "INV-2290",
    party: "Bilal Pharmacy",
    date: "15 Aug 2026",
    status: "Overdue",
    tone: "danger",
    amount: "10,260.00"
  }, {
    id: 3,
    ref: "INV-2289",
    party: "Zoya Retail",
    date: "14 Aug 2026",
    status: "Draft",
    tone: "neutral",
    amount: "274,240.00"
  }, {
    id: 4,
    ref: "INV-2288",
    party: "Kashif & Sons",
    date: "12 Aug 2026",
    status: "Paid",
    tone: "success",
    amount: "45,120.00"
  }, {
    id: 5,
    ref: "CRN-0112",
    party: "Bilal Pharmacy",
    date: "11 Aug 2026",
    status: "Posted",
    tone: "accent",
    amount: "(3,900.00)",
    neg: true
  }, {
    id: 6,
    ref: "INV-2287",
    party: "Metro Mart",
    date: "09 Aug 2026",
    status: "Paid",
    tone: "success",
    amount: "88,650.00"
  }];
  function LedgerScreen() {
    const [tab, setTab] = React.useState("All");
    const [row, setRow] = React.useState(null);
    const rows = tab === "All" ? ROWS : ROWS.filter(r => r.status === tab);
    const total = rows.reduce((s, r) => s + (r.neg ? -1 : 1) * Number(r.amount.replace(/[(),]/g, "")), 0);
    const fmt = n => n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      tone: "accent",
      label: "Receivables",
      value: "412,900",
      unit: "Rs",
      delta: "4.4%",
      caption: "6 open invoices"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Overdue",
      value: "10,260",
      unit: "Rs",
      delta: "3.1%",
      deltaTone: "down",
      caption: "1 invoice \xB7 12 days"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Posted this month",
      value: "128",
      unit: "entries",
      caption: "all balanced"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Trial balance",
      value: "0.00",
      unit: "Rs diff",
      caption: "debits = credits"
    })), /*#__PURE__*/React.createElement(Card, {
      pad: 16,
      title: "Invoices",
      eyebrow: "Core Ledger \xB7 August 2026",
      action: /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 10,
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        options: ["August 2026", "July 2026", "Q3 2026"]
      }), /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm"
      }, "Export"), /*#__PURE__*/React.createElement(Button, {
        size: "sm"
      }, "New invoice"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap"
      }
    }, ["All", "Paid", "Overdue", "Draft"].map(t => /*#__PURE__*/React.createElement(Chip, {
      key: t,
      selected: tab === t,
      count: t === "All" ? ROWS.length : ROWS.filter(r => r.status === t).length,
      onClick: () => setTab(t)
    }, t)), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto"
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      size: "sm",
      tabs: ["Table", "Cards"],
      value: "Table",
      onChange: () => {}
    }))), /*#__PURE__*/React.createElement(DataTable, {
      onRowClick: setRow,
      columns: [{
        key: "ref",
        label: "Reference"
      }, {
        key: "party",
        label: "Customer"
      }, {
        key: "date",
        label: "Date"
      }, {
        key: "status",
        label: "Status",
        render: r => /*#__PURE__*/React.createElement(Badge, {
          tone: r.tone
        }, r.status)
      }, {
        key: "amount",
        label: "Amount (Rs)",
        numeric: true,
        render: r => /*#__PURE__*/React.createElement("span", {
          style: {
            color: r.neg ? "var(--vq-danger)" : "inherit"
          }
        }, r.neg ? "−" : "", r.amount)
      }],
      rows: rows,
      totals: {
        ref: "Total",
        amount: fmt(total)
      }
    })), /*#__PURE__*/React.createElement(Modal, {
      open: !!row,
      onClose: () => setRow(null),
      width: 720,
      title: row ? row.ref + " · " + row.party : "",
      description: "Every line below posted through Core Ledger. Debits equal credits or nothing posted.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: () => setRow(null)
      }, "Close"), /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "Print"), /*#__PURE__*/React.createElement(Button, null, "Record payment"))
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "success"
    }, "Balanced \u2014 2 debits, 2 credits."), /*#__PURE__*/React.createElement(DataTable, {
      columns: [{
        key: "acct",
        label: "Account"
      }, {
        key: "dr",
        label: "Debit",
        numeric: true
      }, {
        key: "cr",
        label: "Credit",
        numeric: true
      }],
      rows: [{
        acct: "Accounts receivable",
        dr: "128,400.00",
        cr: "—"
      }, {
        acct: "Sales revenue",
        dr: "—",
        cr: "112,631.58"
      }, {
        acct: "Output tax",
        dr: "—",
        cr: "15,768.42"
      }],
      totals: {
        acct: "Total",
        dr: "128,400.00",
        cr: "128,400.00"
      }
    })));
  }
  Object.assign(window, {
    LedgerScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/LedgerScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
(function () {
  const {
    Button,
    Badge,
    Chip,
    ThemeToggle,
    Card
  } = window.VenQoreDesignSystem_76c34c;
  function Nav() {
    const links = ["Product", "Blueprint", "Core Ledger", "Pricing", "Docs"];
    return /*#__PURE__*/React.createElement("nav", {
      style: {
        position: "sticky",
        top: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "16px 34px",
        background: "rgb(6 36 33 / .55)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgb(255 255 255 / .1)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.png",
      alt: "",
      width: "28",
      height: "28"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 20px/1 var(--vq-font-display)",
        letterSpacing: "-0.03em",
        color: "#EAFBF5"
      }
    }, "VenQore")), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 22,
        marginLeft: 18
      }
    }, links.map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      style: {
        font: "500 14px/1 var(--vq-font-sans)",
        color: "rgb(234 251 245 / .74)",
        textDecoration: "none"
      }
    }, l))), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      style: {
        font: "600 14px/1 var(--vq-font-sans)",
        color: "#EAFBF5",
        textDecoration: "none"
      }
    }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "Start building")));
  }
  function Hero() {
    const [prompt, setPrompt] = React.useState("");
    const examples = ["Two pharmacy branches", "Wholesale + 3 sales reps", "Restaurant with central kitchen", "Online store on Amazon & Woo"];
    return /*#__PURE__*/React.createElement("header", {
      style: {
        position: "relative",
        background: "var(--vq-grad-hero)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "var(--vq-grad-spot)",
        animation: "vqDrift var(--vq-dur-amb) ease-in-out infinite alternate"
      }
    }), /*#__PURE__*/React.createElement("style", null, "@keyframes vqDrift{from{transform:translate3d(-2%,-1%,0) scale(1.04)}to{transform:translate3d(3%,2%,0) scale(1.12)}}@keyframes vqRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}"), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1000,
        margin: "0 auto",
        padding: "86px 24px 120px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        animation: "vqRise 620ms var(--vq-ease-out) both"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      style: {
        background: "rgb(255 255 255 / .14)",
        color: "#C6F5E9",
        borderColor: "rgb(255 255 255 / .22)"
      }
    }, "240+ features \xB7 one source of truth")), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        font: "600 var(--vq-fs-hero)/var(--vq-lh-hero) var(--vq-font-display)",
        letterSpacing: "var(--vq-ls-hero)",
        color: "#F4FFFB",
        animation: "vqRise 720ms var(--vq-ease-out) 80ms both"
      }
    }, "Tell us your business.", /*#__PURE__*/React.createElement("br", null), "We\u2019ll build the ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#93EBD6"
      }
    }, "system"), "."), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        maxWidth: 640,
        font: "400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans)",
        color: "rgb(234 251 245 / .78)",
        animation: "vqRise 760ms var(--vq-ease-out) 140ms both"
      }
    }, "Describe how you actually work. VenQore assembles the ERP that runs it \u2014 and every number it produces is backed by double-entry accounting."), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "min(680px, 100%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px 8px 22px",
        background: "rgb(255 255 255 / .1)",
        border: "1px solid rgb(255 255 255 / .24)",
        borderRadius: "var(--vq-r-full)",
        backdropFilter: "blur(10px)",
        animation: "vqRise 800ms var(--vq-ease-out) 200ms both"
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: prompt,
      onChange: e => setPrompt(e.target.value),
      placeholder: "Describe your business\u2026",
      style: {
        flex: 1,
        minWidth: 0,
        background: "transparent",
        border: 0,
        outline: 0,
        color: "#F4FFFB",
        font: "500 17px/1 var(--vq-font-sans)"
      }
    }), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      iconAfter: /*#__PURE__*/React.createElement("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.4",
        strokeLinecap: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h13m-5-6 6 6-6 6"
      }))
    }, "Build it")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center",
        animation: "vqRise 840ms var(--vq-ease-out) 260ms both"
      }
    }, examples.map(e => /*#__PURE__*/React.createElement(Chip, {
      key: e,
      onClick: () => setPrompt(e),
      selected: prompt === e
    }, e))), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "500 12.5px/1 var(--vq-font-sans)",
        color: "rgb(234 251 245 / .6)"
      }
    }, "14-day trial \xB7 no card \xB7 live in 15 minutes"))));
  }
  Object.assign(window, {
    Hero,
    MarketingNav: Nav
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Sections.jsx
try { (() => {
(function () {
  const {
    Card,
    Button,
    Badge,
    StatCard,
    AreaChart,
    BarMeter,
    ProgressRing,
    Alert,
    Chip,
    DataTable,
    ActivityRow,
    Tabs
  } = window.VenQoreDesignSystem_76c34c;
  function Band({
    children,
    alt = false,
    style
  }) {
    return /*#__PURE__*/React.createElement("section", {
      style: {
        background: alt ? "var(--vq-bg-alt)" : "var(--vq-bg)",
        padding: "var(--vq-section-y) 24px",
        ...style
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--vq-page-max)",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 40
      }
    }, children));
  }
  function Head({
    eyebrow,
    title,
    body,
    center = true
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: center ? "center" : "flex-start",
        textAlign: center ? "center" : "left"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "vq-eyebrow"
    }, eyebrow), /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        font: "600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display)",
        letterSpacing: "var(--vq-ls-display)",
        maxWidth: 760
      }
    }, title), body ? /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        maxWidth: 620,
        font: "400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans)",
        color: "var(--vq-text-2)"
      }
    }, body) : null);
  }

  /* The product screenshot, framed. */
  function ProductPreview() {
    return /*#__PURE__*/React.createElement(Card, {
      pad: 0,
      radius: "var(--vq-r-2xl)",
      style: {
        overflow: "hidden",
        boxShadow: "var(--vq-elev-3)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "14px 18px",
        borderBottom: "1px solid var(--vq-line)",
        background: "var(--vq-surface-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 6
      }
    }, ["#FF8A6B", "#FFCD5B", "#A9E34B"].map(c => /*#__PURE__*/React.createElement("span", {
      key: c,
      style: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: c
      }
    }))), /*#__PURE__*/React.createElement("span", {
      className: "vq-num",
      style: {
        margin: "0 auto",
        font: "500 12px/1 var(--vq-font-numeric)",
        color: "var(--vq-text-3)"
      }
    }, "app.venqore.com/dashboard"), /*#__PURE__*/React.createElement(Badge, {
      tone: "success"
    }, "Live sync")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "var(--vq-bg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      tone: "accent",
      label: "Net balance",
      value: "6,636,549",
      unit: "Rs",
      delta: "8.2%",
      caption: "vs last month"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Profit margin",
      value: "54",
      unit: "%",
      delta: "2.1%",
      caption: "net / revenue"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Overdue",
      value: "10,260",
      unit: "Rs",
      delta: "3.1%",
      deltaTone: "down",
      caption: "receivables"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Stock health",
      value: "87",
      unit: "%",
      caption: "1,204 SKUs"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: 16,
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      eyebrow: "Past 6 months",
      title: "Purchases trend"
    }, /*#__PURE__*/React.createElement(AreaChart, {
      data: [700, 1400, 2100, 2400, 2600, 5200],
      labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      height: 170
    })), /*#__PURE__*/React.createElement(Card, {
      title: "Alerts"
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "warning"
    }, "13% inventory running low"), /*#__PURE__*/React.createElement(Alert, {
      tone: "success"
    }, "Profit: Rs 53,544.70 today"), /*#__PURE__*/React.createElement(ActivityRow, {
      tone: "in",
      title: "Sale #SAL-R1-160826",
      meta: "1 day ago",
      amount: "+Rs 1,244.00"
    })))));
  }
  const STEPS = [{
    n: "01",
    t: "Describe it",
    b: "Plain sentences about how your business runs. Not a 40-field wizard."
  }, {
    n: "02",
    t: "Review the blueprint",
    b: "Modules, fields in your words, tax rules, roles, approvals. Every line editable."
  }, {
    n: "03",
    t: "Approve, and it exists",
    b: "Not a demo — your live system, your data model, ready for the first transaction."
  }];
  const FEATURES = [{
    t: "Core Ledger",
    b: "Every module posts through one double-entry engine. Debits equal credits or nothing posts.",
    tone: "accent",
    wide: true
  }, {
    t: "SmartCapture",
    b: "The order arrived as a voice note. It leaves as a sale."
  }, {
    t: "VenSynQ",
    b: "Sell in five places. Count stock once."
  }, {
    t: "Vena",
    b: "Ask your business a question, in plain language."
  }, {
    t: "Signals",
    b: "Know a customer is leaving while you can still keep them.",
    tone: "ink"
  }];
  function Sections() {
    const [plan, setPlan] = React.useState("Monthly");
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Band, {
      style: {
        paddingTop: 0,
        marginTop: -78,
        background: "transparent"
      }
    }, /*#__PURE__*/React.createElement(ProductPreview, null)), /*#__PURE__*/React.createElement(Band, null, /*#__PURE__*/React.createElement(Head, {
      eyebrow: "The mechanism",
      title: "Three steps, then it is running.",
      body: "No discovery call. No partner firm. No month four."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "var(--vq-gutter)"
      }
    }, STEPS.map(s => /*#__PURE__*/React.createElement(Card, {
      key: s.n,
      lift: true
    }, /*#__PURE__*/React.createElement("span", {
      className: "vq-num",
      style: {
        font: "600 28px/1 var(--vq-font-numeric)",
        color: "var(--vq-accent-text)",
        letterSpacing: "-0.03em"
      }
    }, s.n), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 21px/1.3 var(--vq-font-display)",
        letterSpacing: "-0.02em"
      }
    }, s.t), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        font: "500 14.5px/1.6 var(--vq-font-sans)",
        color: "var(--vq-text-2)"
      }
    }, s.b))))), /*#__PURE__*/React.createElement(Band, {
      alt: true
    }, /*#__PURE__*/React.createElement(Head, {
      eyebrow: "The moat",
      title: "AI decides what your system looks like. It never decides what your numbers say.",
      center: false
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr 1fr",
        gridAutoRows: "minmax(150px, auto)",
        gap: "var(--vq-gutter)"
      }
    }, FEATURES.map(f => /*#__PURE__*/React.createElement(Card, {
      key: f.t,
      tone: f.tone === "accent" ? "accent" : f.tone === "ink" ? "ink" : "surface",
      lift: true,
      style: f.wide ? {
        gridColumn: "span 2"
      } : undefined
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 22px/1.25 var(--vq-font-display)",
        letterSpacing: "-0.024em"
      }
    }, f.t), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        font: "500 14.5px/1.6 var(--vq-font-sans)",
        color: f.tone ? "rgb(255 255 255 / .82)" : "var(--vq-text-2)"
      }
    }, f.b))))), /*#__PURE__*/React.createElement(Band, null, /*#__PURE__*/React.createElement(Head, {
      eyebrow: "Proof, not logos",
      title: "Where a normal site puts a logo wall, we put a correctness wall."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "var(--vq-gutter)"
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Correctness checks",
      value: "7",
      unit: "independent",
      caption: "on the accounting engine"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Automated tests",
      value: "73",
      unit: "tests",
      caption: "across 20 modules, every release"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Live businesses",
      value: "2",
      unit: "daily",
      caption: "including the shop it was built for"
    }), /*#__PURE__*/React.createElement(StatCard, {
      tone: "accent",
      label: "Features in the box",
      value: "240",
      unit: "+",
      caption: "no module fees"
    }))), /*#__PURE__*/React.createElement(Band, {
      alt: true
    }, /*#__PURE__*/React.createElement(Head, {
      eyebrow: "Pricing",
      title: "$36 a month. No implementation fee.",
      body: "Every module, every feature, every user role. The implementation was the expensive part everywhere else."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      tabs: ["Monthly", "Yearly"],
      value: plan,
      onChange: setPlan
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "var(--vq-gutter)",
        alignItems: "stretch"
      }
    }, [{
      n: "Starter",
      p: plan === "Monthly" ? "$36" : "$29",
      b: "One branch, two users",
      cta: "secondary"
    }, {
      n: "Business",
      p: plan === "Monthly" ? "$79" : "$64",
      b: "Up to five branches, ten users",
      cta: "primary",
      best: true
    }, {
      n: "Scale",
      p: "Talk to us",
      b: "Multi-company, custom modules",
      cta: "secondary"
    }].map(t => /*#__PURE__*/React.createElement(Card, {
      key: t.n,
      tone: t.best ? "accent" : "surface",
      lift: true,
      pad: 24
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 20px/1 var(--vq-font-display)",
        letterSpacing: "-0.02em"
      }
    }, t.n), t.best ? /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      dot: false,
      style: {
        background: "rgb(255 255 255 / .2)",
        color: "#fff",
        borderColor: "rgb(255 255 255 / .3)"
      }
    }, "Most picked") : null), /*#__PURE__*/React.createElement("div", {
      className: "vq-num",
      style: {
        font: "600 42px/1 var(--vq-font-numeric)",
        letterSpacing: "-0.03em"
      }
    }, t.p, t.p.startsWith("$") ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: "500 14px/1 var(--vq-font-sans)",
        opacity: .7
      }
    }, " /mo") : null), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        font: "500 14px/1.55 var(--vq-font-sans)",
        color: t.best ? "rgb(255 255 255 / .84)" : "var(--vq-text-2)"
      }
    }, t.b), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 4
      }
    }, ["Core Ledger included", "Unlimited transactions", "Export your data any time"].map(f => /*#__PURE__*/React.createElement("span", {
      key: f,
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        font: "500 13.5px/1.4 var(--vq-font-sans)",
        color: t.best ? "rgb(255 255 255 / .9)" : "var(--vq-text-2)"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: t.best ? "#fff" : "var(--vq-accent)",
      strokeWidth: "3",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "m5 13 4.5 4.5L19 7"
    })), f))), /*#__PURE__*/React.createElement(Button, {
      variant: t.best ? "secondary" : "soft",
      full: true,
      style: {
        marginTop: "auto"
      }
    }, t.p === "Talk to us" ? "Book a call" : "Start free trial"))))), /*#__PURE__*/React.createElement("section", {
      style: {
        padding: "var(--vq-section-y) 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--vq-page-max)",
        margin: "0 auto",
        padding: "56px 44px",
        borderRadius: "var(--vq-r-2xl)",
        background: "var(--vq-grad-mint)",
        boxShadow: "var(--vq-glow-accent-strong)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 32,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 300
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        font: "600 40px/1.08 var(--vq-font-display)",
        letterSpacing: "-0.03em"
      }
    }, "Describe your business. See the blueprint in a minute."), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "12px 0 0",
        font: "400 17px/1.55 var(--vq-font-sans)",
        color: "rgb(255 255 255 / .84)"
      }
    }, "Nothing posts to a ledger until you approve it.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg"
    }, "Start free trial"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "lg",
      style: {
        color: "#fff"
      }
    }, "Book a call")))), /*#__PURE__*/React.createElement("footer", {
      style: {
        background: "var(--vq-ink-950)",
        color: "rgb(237 242 239 / .7)",
        padding: "56px 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: "var(--vq-page-max)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.png",
      alt: "",
      width: "26",
      height: "26"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "600 19px/1 var(--vq-font-display)",
        letterSpacing: "-0.03em",
        color: "#EDF2EF"
      }
    }, "VenQore")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "14px 0 0",
        font: "500 13.5px/1.6 var(--vq-font-sans)",
        maxWidth: 260
      }
    }, "The AI ERP builder. Built by one person, running two real shops.")), [["Product", ["Blueprint", "Core Ledger", "SmartCapture", "VenSynQ"]], ["Company", ["About", "Changelog", "Contact"]], ["Legal", ["Terms", "Privacy", "Security"]]].map(([h, items]) => /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "vq-eyebrow",
      style: {
        color: "rgb(237 242 239 / .5)"
      }
    }, h), items.map(i => /*#__PURE__*/React.createElement("a", {
      key: i,
      href: "#",
      style: {
        font: "500 13.5px/1 var(--vq-font-sans)",
        color: "rgb(237 242 239 / .72)",
        textDecoration: "none"
      }
    }, i)))))));
  }
  Object.assign(window, {
    MarketingSections: Sections
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarStack = __ds_scope.AvatarStack;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ActivityRow = __ds_scope.ActivityRow;

__ds_ns.AreaChart = __ds_scope.AreaChart;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.BarMeter = __ds_scope.BarMeter;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ProgressRing = __ds_scope.ProgressRing;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.SidebarItem = __ds_scope.SidebarItem;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.ThemeToggle = __ds_scope.ThemeToggle;

__ds_ns.Card = __ds_scope.Card;

})();
