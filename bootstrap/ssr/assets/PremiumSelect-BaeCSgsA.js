import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { createPortal } from "react-dom";
const PremiumSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select option",
  onAddNew,
  addNewLabel,
  disabled,
  className = "",
  searchable = true
  // Enable search by default
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const portalRef = useRef(null);
  const searchInputRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };
  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords);
      window.addEventListener("resize", updateCoords);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
    return () => {
      window.removeEventListener("scroll", updateCoords);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && portalRef.current && !portalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedOption = options.find((o) => String(o.id) === String(value));
  const filteredOptions = searchable && searchQuery ? options.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase())) : options;
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, ref: dropdownRef, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => !disabled && setIsOpen(!isOpen),
        className: `
                    w-full px-4 py-3 rounded-xl bg-surface border border-line 
                    text-ink font-medium focus:ring-2 ring-brand-500/20 outline-none transition-all 
                    cursor-pointer flex items-center justify-between shadow-sm
                    ${isOpen ? "ring-2 ring-brand-500/20 border-brand-500" : ""} 
                    ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-line dark:hover:border-line-strong"}
`,
        children: [
          /* @__PURE__ */ jsx("span", { className: `truncate ${!selectedOption ? "text-ink-muted" : ""}`, children: selectedOption ? selectedOption.name : placeholder }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 18, className: `text-ink-muted transition-transform duration-slow ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    isOpen && createPortal(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: portalRef,
          className: "fixed mt-2 bg-surface rounded-[14px] shadow-2xl border border-line z-command overflow-hidden animate-in fade-in zoom-in-95 duration-normal",
          style: {
            top: coords.top,
            left: coords.left,
            width: Math.max(coords.width, 280)
          },
          children: [
            searchable && /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-line", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: searchInputRef,
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Search...",
                  className: "w-full pl-9 pr-3 py-2 text-sm bg-app border border-line dark:border-line rounded-lg outline-none focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all text-ink placeholder-slate-400",
                  onClick: (e) => e.stopPropagation()
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "max-h-64 overflow-y-auto custom-scrollbar p-1.5", children: [
              filteredOptions.length === 0 && !onAddNew && /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm text-ink-muted text-center", children: searchQuery ? "No matching options" : "No options available" }),
              filteredOptions.map((option) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => {
                    onChange(option.id);
                    setIsOpen(false);
                  },
                  className: `
                                    px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all flex items-center justify-between mb-0.5
                                    ${String(value) === String(option.id) ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" : "text-ink-secondary dark:text-ink hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: option.name }),
                    String(value) === String(option.id) && /* @__PURE__ */ jsx(Check, { size: 16, className: "shrink-0" })
                  ]
                },
                option.id
              )),
              onAddNew && /* @__PURE__ */ jsx(
                "div",
                {
                  id: "tour-add-new-category-btn",
                  onClick: () => {
                    onAddNew();
                    setIsOpen(false);
                  },
                  className: "px-4 py-2.5 rounded-xl text-sm font-bold text-brand-600 dark:text-brand-400 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-line mt-1.5 pt-3",
                  children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg", children: "+" }),
                    " ",
                    addNewLabel
                  ] })
                }
              )
            ] })
          ]
        }
      ),
      document.body
    )
  ] });
};
export {
  PremiumSelect as P
};
