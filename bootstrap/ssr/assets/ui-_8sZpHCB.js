import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { f as formatToFit } from "./engine-Cd795qy4.js";
const HUE_VAR = {
  teal: "var(--vq-teal-300)",
  sky: "var(--vq-sky-400)",
  lime: "var(--vq-lime-400)",
  coral: "var(--vq-coral-400)",
  butter: "var(--vq-butter-400)",
  plum: "var(--vq-plum-400)"
};
const n0 = (v) => Math.round(v).toLocaleString("en-US");
const n2 = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function Money({ value, font = 15, avail = 160, ccy = "", className = "", style }) {
  const n = Number(value);
  const f = formatToFit(Number.isFinite(n) && n !== 0 ? n : 0, avail, font, ccy);
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: `num ${className}`,
      style: { fontSize: font, cursor: f.truncated ? "help" : void 0, ...style },
      title: f.exact + (f.truncated ? "  (shortened to fit — exact value here)" : ""),
      children: f.text
    }
  );
}
function Icon({ children, label, onClick, on, rank, title, className = "", ns = "nqp" }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: `${ns}-iconbtn ${className}`,
      "aria-label": label,
      title: title || label,
      "data-on": on ? "true" : void 0,
      "data-rank": rank,
      onClick,
      children
    }
  );
}
function Pane({ title, extra, children, footer, width, rank = 1, bodyRef, minWidth }) {
  return /* @__PURE__ */ jsxs("section", { className: "nqp-pane", style: { width: width != null ? `${width}px` : void 0 }, "data-rank": rank, children: [
    /* @__PURE__ */ jsxs("header", { className: "nqp-ph", children: [
      /* @__PURE__ */ jsx("span", { children: title }),
      /* @__PURE__ */ jsx("span", { style: { flex: 1 } }),
      extra
    ] }),
    /* @__PURE__ */ jsx("div", { className: "nqp-pb", ref: bodyRef, style: minWidth ? { minWidth } : void 0, children }),
    footer
  ] });
}
function RowButton({ className, children, onClick, ...rest }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "button",
      tabIndex: 0,
      className,
      onClick,
      onKeyDown: (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(e);
        }
      },
      ...rest,
      children
    }
  );
}
function Stepper({ qty, onMinus, onPlus, disabled, rank = 1 }) {
  return /* @__PURE__ */ jsxs("div", { className: "nqp-step", "data-rank": rank, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "One fewer", onClick: onMinus, disabled, children: "−" }),
    /* @__PURE__ */ jsx("span", { className: "num", children: qty }),
    /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "One more", onClick: onPlus, disabled, children: "+" })
  ] });
}
function Flag({ tone, children, title, ns = "nqp" }) {
  return /* @__PURE__ */ jsx("span", { className: `${ns}-flag`, "data-tone": tone, title, children });
}
function Kbd({ children, ns = "nqp" }) {
  return /* @__PURE__ */ jsx("kbd", { className: `${ns}-kbd`, children });
}
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function focusTrap(ref, open) {
  if (!open) return void 0;
  return (e) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const here = document.activeElement;
    if (!ref.current.contains(here)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }
    if (e.shiftKey && here === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && here === last) {
      e.preventDefault();
      first.focus();
    }
  };
}
function Sheet({
  open,
  onClose,
  title,
  subtitle,
  size = "side",
  side,
  width,
  children,
  footer,
  labelExtra,
  ns = "nqp"
}) {
  const ref = useRef(null);
  const returnTo = useRef(null);
  useEffect(() => {
    if (!open) {
      if (returnTo.current) {
        try {
          returnTo.current.focus();
        } catch {
        }
        returnTo.current = null;
      }
      return void 0;
    }
    returnTo.current = document.activeElement;
    const id = setTimeout(() => {
      const node = ref.current;
      if (!node) return;
      const target = node.querySelector("[data-sheet-focus]") || node.querySelector('input:not([type="range"]), textarea, select') || node.querySelector("button");
      if (target) target.focus();
    }, 80);
    return () => clearTimeout(id);
  }, [open]);
  const trap = focusTrap(ref, open);
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      ref,
      className: `${ns}-sheet`,
      "data-open": open ? "true" : "false",
      "data-size": size === "side" ? void 0 : size,
      "data-side": side,
      style: width ? { width: `${width}px` } : void 0,
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title,
      "aria-hidden": !open,
      onKeyDown: trap,
      children: [
        /* @__PURE__ */ jsxs("header", { className: `${ns}-sh`, children: [
          /* @__PURE__ */ jsx("span", { children: title }),
          subtitle ? /* @__PURE__ */ jsx("span", { className: "mono", children: subtitle }) : null,
          labelExtra,
          /* @__PURE__ */ jsx("span", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx(Icon, { label: "Close", onClick: onClose, ns, children: "✕" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: ns === "nqp" ? "nqp-pb" : `${ns}-sb`, children }),
        footer ? /* @__PURE__ */ jsx("div", { className: `${ns}-sf`, children: footer }) : null
      ]
    }
  );
}
function Seg({ label, value, options, labels, onPick, note, disabled, ns = "nqp" }) {
  const box = ns === "nqp" ? "nqp-ctl" : `${ns}-ctlbox`;
  return /* @__PURE__ */ jsxs("div", { className: box, children: [
    label ? /* @__PURE__ */ jsx("div", { className: "lbl", children: /* @__PURE__ */ jsx("span", { children: label }) }) : null,
    /* @__PURE__ */ jsx("div", { className: `${ns}-seg`, role: "group", "aria-label": label, children: options.map((o, i) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        "aria-pressed": o === value,
        disabled: disabled ? disabled(o) : false,
        onClick: () => onPick(o),
        children: labels && labels[i] || String(o)
      },
      String(o)
    )) }),
    note ? /* @__PURE__ */ jsx("div", { className: "note", children: note }) : null
  ] });
}
function Slider({ label, value, lo, hi, step, fmt, onSet, note, ns = "nqp", disabled }) {
  const box = ns === "nqp" ? "nqp-ctl" : `${ns}-ctlbox`;
  return /* @__PURE__ */ jsxs("div", { className: box, children: [
    /* @__PURE__ */ jsxs("div", { className: "lbl", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      /* @__PURE__ */ jsx("b", { children: fmt ? fmt(value) : value })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "range",
        min: lo,
        max: hi,
        step,
        value,
        "aria-label": label,
        disabled,
        onChange: (e) => onSet(Number(e.target.value))
      }
    ),
    note ? /* @__PURE__ */ jsx("div", { className: "note", children: note }) : null
  ] });
}
function Switch({ label, note, value, onChange, ns = "nqp" }) {
  return /* @__PURE__ */ jsxs("button", { type: "button", className: `${ns}-switch`, "aria-pressed": !!value, onClick: () => onChange(!value), children: [
    /* @__PURE__ */ jsxs("span", { style: { minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: 13, fontWeight: 600 }, children: label }),
      note ? /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: 11, color: "var(--vq-text-3)", lineHeight: 1.4 }, children: note }) : null
    ] }),
    /* @__PURE__ */ jsx("span", { className: `${ns}-switchbox` })
  ] });
}
function Toasts({ items = [], onAction, onDismiss, ns = "nqp" } = {}) {
  return /* @__PURE__ */ jsx("div", { className: `${ns}-toasts`, "aria-live": "polite", children: (items || []).map((t) => /* @__PURE__ */ jsxs("div", { className: `${ns}-toast`, "data-tone": t.tone, children: [
    /* @__PURE__ */ jsx("span", { style: { minWidth: 0 }, children: t.text }),
    t.action ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onAction?.(t), children: t.action }) : /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Dismiss", onClick: () => onDismiss?.(t), children: "✕" })
  ] }, t.id)) });
}
function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight
  }));
  useEffect(() => {
    let frame = 0;
    const on = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVp({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    on();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  return vp;
}
function Splitter({ leftKey, rightKey, pool, get, set, onCommit, label }) {
  const ref = useRef(null);
  const nudge = (dir) => {
    const a0 = get(leftKey);
    const b0 = rightKey ? get(rightKey) : 0;
    const d = dir * 16 / pool;
    set(leftKey, a0 + d, rightKey, rightKey ? b0 - d : void 0);
    if (onCommit) onCommit();
  };
  const onPointerDown = (e) => {
    e.preventDefault();
    const node = ref.current;
    node.setPointerCapture(e.pointerId);
    node.dataset.drag = "true";
    const x0 = e.clientX;
    const a0 = get(leftKey);
    const b0 = rightKey ? get(rightKey) : 0;
    const move = (ev) => {
      const d = (ev.clientX - x0) / pool;
      set(leftKey, a0 + d, rightKey, rightKey ? b0 - d : void 0);
    };
    const up = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      delete node.dataset.drag;
      if (onCommit) onCommit();
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: "nqp-split",
      role: "separator",
      tabIndex: 0,
      "aria-orientation": "vertical",
      "aria-label": label || "Resize the panes",
      "aria-valuenow": Math.round(get(leftKey) * 100),
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      title: "Drag to resize — or focus it and use the arrow keys. The law stops you at the floor.",
      onKeyDown: (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          nudge(-1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          nudge(1);
        }
      },
      onPointerDown
    }
  );
}
export {
  Flag as F,
  HUE_VAR as H,
  Icon as I,
  Kbd as K,
  Money as M,
  Pane as P,
  RowButton as R,
  Sheet as S,
  Toasts as T,
  Switch as a,
  Slider as b,
  n2 as c,
  Seg as d,
  Splitter as e,
  focusTrap as f,
  Stepper as g,
  n0 as n,
  useViewport as u
};
