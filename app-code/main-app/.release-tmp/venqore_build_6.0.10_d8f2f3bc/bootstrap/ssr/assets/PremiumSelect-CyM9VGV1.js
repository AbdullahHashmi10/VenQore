import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { createPortal } from "react-dom";
const PremiumSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  onAddNew,
  addNewLabel,
  disabled,
  className = "",
  inputClassName = "",
  icon: Icon,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const portalRef = useRef(null);
  const searchInputRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const getOptionKey = (o) => o?.id !== void 0 ? o.id : o?.value;
  const getOptionLabel = (o) => o?.name !== void 0 ? o.name : o?.label !== void 0 ? o.label : String(getOptionKey(o) ?? "");
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
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    } else {
      setSearchQuery("");
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, searchable]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && portalRef.current && !portalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedOption = options.find((o) => String(getOptionKey(o)) === String(value));
  const filteredOptions = searchable && searchQuery ? options.filter((o) => getOptionLabel(o).toLowerCase().includes(searchQuery.toLowerCase())) : options;
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, ref: dropdownRef, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => !disabled && setIsOpen(!isOpen),
        className: `
                    w-full px-3.5 py-2.5 rounded-xl bg-app border border-line 
                    text-ink text-sm font-bold focus:ring-2 ring-brand-500/20 outline-none transition-all 
                    cursor-pointer flex items-center justify-between shadow-xs
                    ${isOpen ? "ring-2 ring-brand-500/20 border-brand-500" : ""} 
                    ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-line-strong"}
                    ${inputClassName}
                `,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0 flex-1", children: [
            Icon && /* @__PURE__ */ jsx(Icon, { size: 16, className: "text-ink-muted shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: `truncate text-sm font-bold ${!selectedOption ? "text-ink-muted" : "text-ink"}`, children: selectedOption ? getOptionLabel(selectedOption) : placeholder })
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `text-ink-muted transition-transform duration-slow shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    isOpen && createPortal(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: portalRef,
          className: "fixed mt-1.5 bg-surface rounded-xl shadow-2xl border border-line z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-fast",
          style: {
            top: coords.top,
            left: coords.left,
            width: Math.max(coords.width, 240)
          },
          children: [
            searchable && options.length > 5 && /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-line bg-surface", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: searchInputRef,
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Search...",
                  className: "w-full pl-8 pr-3 py-1.5 text-xs bg-app border border-line rounded-lg outline-none focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-ink-muted",
                  onClick: (e) => e.stopPropagation()
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "max-h-60 overflow-y-auto custom-scrollbar p-1", children: [
              filteredOptions.length === 0 && !onAddNew && /* @__PURE__ */ jsx("div", { className: "px-3 py-3 text-xs text-ink-muted text-center font-medium", children: searchQuery ? "No matching options" : "No options available" }),
              filteredOptions.map((option) => {
                const optKey = getOptionKey(option);
                const optLabel = getOptionLabel(option);
                const isSelected = String(value) === String(optKey);
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => {
                      onChange(optKey, option);
                      setIsOpen(false);
                    },
                    className: `
                                        px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-between mb-0.5
                                        ${isSelected ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" : "text-ink hover:bg-interactive-hover"}
                                    `,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "truncate", children: optLabel }),
                      isSelected && /* @__PURE__ */ jsx(Check, { size: 14, className: "shrink-0 ml-2 text-brand-600 dark:text-brand-400" })
                    ]
                  },
                  optKey
                );
              }),
              onAddNew && /* @__PURE__ */ jsx(
                "div",
                {
                  id: "tour-add-new-category-btn",
                  onClick: () => {
                    onAddNew();
                    setIsOpen(false);
                  },
                  className: "px-3 py-2 rounded-lg text-xs font-bold text-brand-600 dark:text-brand-400 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-line mt-1",
                  children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "+" }),
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
