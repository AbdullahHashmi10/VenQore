import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
function Select({ value, onChange, options = [], className = "" }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const commit = (val) => {
    onChange(val);
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(options.findIndex((o) => o.value === value));
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      commit(options[activeIndex].value);
    }
  };
  const grouped = [];
  options.forEach((opt) => {
    const key = opt.group || "";
    const last = grouped[grouped.length - 1];
    if (last && last.key === key) last.items.push(opt);
    else grouped.push({ key, items: [opt] });
  });
  return /* @__PURE__ */ jsxs("div", { ref, className: `vq-tsel ${className}`, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        onKeyDown,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        className: "vq-tsel__trigger",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "vq-tsel__value", children: [
            /* @__PURE__ */ jsx("span", { children: selected?.label ?? "Select…" }),
            selected?.badge && /* @__PURE__ */ jsx("span", { className: "vq-badge", children: selected.badge })
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 18, className: "vq-tsel__chev", "aria-hidden": "true" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { role: "listbox", className: "vq-tsel__menu", children: grouped.map((group, gi) => /* @__PURE__ */ jsxs("div", { children: [
      group.key && /* @__PURE__ */ jsx("p", { className: "vq-tsel__group", children: group.key }),
      group.items.map((opt) => {
        const idx = options.indexOf(opt);
        const isSelected = opt.value === value;
        const isActive = idx === activeIndex;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            role: "option",
            "aria-selected": isSelected,
            "data-active": isActive ? "true" : "false",
            onMouseEnter: () => setActiveIndex(idx),
            onClick: () => commit(opt.value),
            className: "vq-tsel__opt",
            children: [
              /* @__PURE__ */ jsxs("span", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tsel__opt-label", children: opt.label }),
                opt.hint && /* @__PURE__ */ jsx("span", { className: "vq-tsel__hint", children: opt.hint })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "vq-tsel__side", children: [
                opt.badge && /* @__PURE__ */ jsx("span", { className: "vq-badge", children: opt.badge }),
                isSelected && /* @__PURE__ */ jsx(Check, { size: 16, "aria-hidden": "true" })
              ] })
            ]
          },
          opt.value
        );
      })
    ] }, gi)) })
  ] });
}
export {
  Select as default
};
