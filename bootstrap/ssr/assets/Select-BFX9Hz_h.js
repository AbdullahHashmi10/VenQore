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
  return /* @__PURE__ */ jsxs("div", { ref, className: `relative ${className}`, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        onKeyDown,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        className: "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm hover:border-slate-900/20 dark:hover:border-white/20 focus:outline-none focus:border-indigo-400/60 transition-colors text-left",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: selected?.label ?? "Select…" }),
            selected?.badge && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 shrink-0", children: selected.badge })
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}` })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx(
      "div",
      {
        role: "listbox",
        className: "absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-[#0d0b1c] border border-slate-900/10 dark:border-white/10 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-1.5",
        children: grouped.map((group, gi) => /* @__PURE__ */ jsxs("div", { children: [
          group.key && /* @__PURE__ */ jsx("p", { className: "px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600", children: group.key }),
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
                onMouseEnter: () => setActiveIndex(idx),
                onClick: () => commit(opt.value),
                className: `w-full flex items-start justify-between gap-3 px-3 py-2 text-left transition-colors ${isActive ? "bg-indigo-500/10" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("span", { className: `block text-sm truncate ${isSelected ? "font-bold text-indigo-600 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`, children: opt.label }),
                    opt.hint && /* @__PURE__ */ jsx("span", { className: "block text-[11px] text-slate-400 dark:text-slate-500 truncate", children: opt.hint })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 shrink-0", children: [
                    opt.badge && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400", children: opt.badge }),
                    isSelected && /* @__PURE__ */ jsx(Check, { size: 14, className: "text-indigo-500" })
                  ] })
                ]
              },
              opt.value
            );
          })
        ] }, gi))
      }
    )
  ] });
}
export {
  Select as default
};
