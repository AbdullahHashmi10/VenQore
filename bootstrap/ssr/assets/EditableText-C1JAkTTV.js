import { jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
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
  step
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef(null);
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
  return /* @__PURE__ */ jsx(
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
      className: `inline-block cursor-text rounded px-1 -mx-1 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:ring-1 hover:ring-indigo-300/60 dark:hover:ring-indigo-400/30 ${isEmpty ? "italic text-slate-400 dark:text-slate-600" : ""} ${className}`,
      children: display
    }
  );
}
export {
  EditableText as default
};
