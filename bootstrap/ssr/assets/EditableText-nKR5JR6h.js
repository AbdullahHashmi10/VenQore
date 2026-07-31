import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
function EditableText({
  value,
  onChange,
  placeholder = "Click to edit",
  as = "input",
  // 'input' | 'textarea' | 'number' | 'date'
  className = "",
  editClassName = "",
  multiline = false,
  rows = 2,
  emptyLabel = null,
  // shown (styled as placeholder) when value is empty and not focused
  formatDisplay = null,
  // (value) => string, for read-mode-only formatting (e.g. currency)
  min,
  max,
  step,
  pulse = true,
  inline = true
  // set false for fields that should be block-level (own line) rather than inline-block
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [showPulse, setShowPulse] = useState(pulse);
  const ref = useRef(null);
  useEffect(() => {
    if (!pulse) return void 0;
    const stop = () => setShowPulse(false);
    const timer = setTimeout(stop, 4500);
    window.addEventListener("venqore-tool-edited", stop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("venqore-tool-edited", stop);
    };
  }, [pulse]);
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current.select) ref.current.select();
    }
  }, [editing]);
  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
    window.dispatchEvent(new Event("venqore-tool-edited"));
  };
  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };
  if (editing) {
    const sharedProps = {
      ref,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown,
      placeholder,
      className: `bg-indigo-50 dark:bg-indigo-500/10 outline-none ring-2 ring-indigo-400/60 rounded px-1 -mx-1 ${className} ${editClassName}`
    };
    if (as === "textarea" || multiline) {
      return /* @__PURE__ */ jsx("textarea", { ...sharedProps, rows, className: `${sharedProps.className} w-full resize-none block` });
    }
    if (as === "number") {
      return /* @__PURE__ */ jsx("input", { ...sharedProps, type: "number", min, max, step: step ?? "any" });
    }
    if (as === "date") {
      return /* @__PURE__ */ jsx("input", { ...sharedProps, type: "date" });
    }
    return /* @__PURE__ */ jsx("input", { ...sharedProps, type: "text" });
  }
  const isEmpty = value === "" || value === null || value === void 0;
  const display = isEmpty ? emptyLabel ?? placeholder : formatDisplay ? formatDisplay(value) : value;
  return /* @__PURE__ */ jsxs(
    "span",
    {
      role: "button",
      tabIndex: 0,
      onClick: () => setEditing(true),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      },
      className: `group/edit relative ${inline ? "inline-block" : "block"} cursor-text rounded px-1.5 -mx-1.5 py-0.5 -my-0.5 transition-colors
                border-b border-dashed border-slate-300 dark:border-slate-600
                hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-400
                ${showPulse ? "animate-[editablePulse_1.8s_ease-in-out_2]" : ""}
                ${isEmpty ? "italic text-slate-400 dark:text-slate-600" : ""} ${className}`,
      children: [
        display,
        /* @__PURE__ */ jsx(
          Pencil,
          {
            size: 11,
            "aria-hidden": "true",
            className: "hidden sm:inline-block ml-1 -mt-0.5 align-middle opacity-0 group-hover/edit:opacity-60 text-indigo-500 transition-opacity"
          }
        )
      ]
    }
  );
}
export {
  EditableText as default
};
