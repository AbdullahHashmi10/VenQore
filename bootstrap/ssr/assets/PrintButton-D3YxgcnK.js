import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Receipt, Printer, ChevronDown, FileText, Check } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { P as PrintService } from "./PrintService-B05R75aO.js";
function PrintButton({
  sale,
  settings = null,
  label = "Print",
  showThermal = true,
  showRegular = true,
  defaultType = null,
  // null means 'auto' - will read from settings
  variant = "primary",
  // 'primary', 'secondary', 'ghost'
  size = "md",
  // 'sm', 'md', 'lg'
  onPrint = null,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastPrinted, setLastPrinted] = useState(null);
  const dropdownRef = useRef(null);
  const { settings: sharedSettings } = usePage().props;
  const printSettings = settings || sharedSettings || window.amdSettings || {};
  const effectiveDefaultType = defaultType || printSettings.default_print_type || "regular";
  const isThermalDefault = effectiveDefaultType === "thermal";
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handlePrint = (type) => {
    PrintService.printInvoice(sale, printSettings, type);
    setLastPrinted(type);
    setIsOpen(false);
    if (onPrint) {
      onPrint(type);
    }
    setTimeout(() => setLastPrinted(null), 3e3);
  };
  const singleOption = showThermal && !showRegular || !showThermal && showRegular;
  if (singleOption) {
    const type = showThermal ? "thermal" : "regular";
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handlePrint(type),
        className: `
                    inline-flex items-center gap-2 font-semibold rounded-xl transition-all active:scale-95
                    ${variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20" : ""}
                    ${variant === "secondary" ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" : ""}
                    ${variant === "ghost" ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : ""}
                    ${size === "sm" ? "px-3 py-1.5 text-xs" : ""}
                    ${size === "md" ? "px-4 py-2.5 text-sm" : ""}
                    ${size === "lg" ? "px-6 py-3 text-base" : ""}
                    ${className}
                `,
        children: [
          type === "thermal" ? /* @__PURE__ */ jsx(Receipt, { size: size === "sm" ? 14 : 18 }) : /* @__PURE__ */ jsx(Printer, { size: size === "sm" ? 14 : 18 }),
          label
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => handlePrint(effectiveDefaultType),
          className: `
                        inline-flex items-center gap-2 font-semibold rounded-l-xl transition-all active:scale-95
                        ${variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}
                        ${variant === "secondary" ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-r-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" : ""}
                        ${variant === "ghost" ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : ""}
                        ${size === "sm" ? "px-3 py-1.5 text-xs" : ""}
                        ${size === "md" ? "px-4 py-2.5 text-sm" : ""}
                        ${size === "lg" ? "px-5 py-3 text-base" : ""}
                        ${className}
                    `,
          children: [
            isThermalDefault ? /* @__PURE__ */ jsx(Receipt, { size: size === "sm" ? 14 : 18 }) : /* @__PURE__ */ jsx(Printer, { size: size === "sm" ? 14 : 18 }),
            /* @__PURE__ */ jsx("span", { className: "ml-1", children: isThermalDefault ? `${label} (Thermal)` : label })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsOpen(!isOpen),
          className: `
                        inline-flex items-center justify-center rounded-r-xl transition-all border-l
                        ${variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-500" : ""}
                        ${variant === "secondary" ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" : ""}
                        ${variant === "ghost" ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700" : ""}
                        ${size === "sm" ? "px-2 py-1.5" : ""}
                        ${size === "md" ? "px-2.5 py-2.5" : ""}
                        ${size === "lg" ? "px-3 py-3" : ""}
                    `,
          children: /* @__PURE__ */ jsx(ChevronDown, { size: size === "sm" ? 12 : 16, className: `transition-transform ${isOpen ? "rotate-180" : ""}` })
        }
      )
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-1", children: [
        showRegular && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handlePrint("regular"),
            className: "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2", children: [
                  "Regular Print",
                  lastPrinted === "regular" && /* @__PURE__ */ jsx(Check, { size: 14, className: "text-emerald-500" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "A4 / Letter paper invoice" })
              ] })
            ]
          }
        ),
        showThermal && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handlePrint("thermal"),
            className: "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Receipt, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2", children: [
                  "Thermal Receipt",
                  lastPrinted === "thermal" && /* @__PURE__ */ jsx(Check, { size: 14, className: "text-emerald-500" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500", children: [
                  printSettings.thermal_page_size === "2inch" ? "58mm" : "80mm",
                  " receipt paper"
                ] })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: "Configure paper size in Settings → Print" }) })
    ] })
  ] });
}
export {
  PrintButton as P
};
