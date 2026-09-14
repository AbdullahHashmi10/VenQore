import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePage } from "@inertiajs/react";
import { Search, Loader2, ArrowUp, ArrowDown, Package, Star, Phone, Mail, MapPin, Edit2, Check, Plus, User, Truck, Sparkles, ShoppingBag, AlertTriangle, Clock, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { useDebounce } from "use-debounce";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
const SmartCombobox = ({
  items = [],
  selectedItem,
  onSelect,
  onAddNew,
  placeholder = "Search...",
  label,
  addNewLabel = "Add New",
  displayKey = "name",
  filterKey = "name",
  disabled = false,
  readOnly = false,
  onEdit,
  onQueryChange,
  value,
  className = "",
  inputClassName = "",
  onKeyDown,
  loading = false,
  showTypeIcon = true,
  /* Opt-in. When true the results list is rendered into <body> at fixed
  coordinates instead of absolutely inside the field's own box. A list
  positioned inside its field is clipped by the first ancestor that
  scrolls or hides its overflow — which is exactly what happens on a
  document screen where the item rows scroll in their own container.
  Off by default so no existing screen changes. */
  portal = false,
  showDetailedView = true,
  // Show enhanced details
  disableLocalFiltering = false,
  hideCostAndMargin = false,
  hideSearchIcon = false,
  id
}) => {
  const { store, settings } = usePage().props;
  const tt = useTermText();
  const [isOpen, setIsOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const isControlled = value !== void 0;
  const query = isControlled ? value : internalQuery;
  const setQuery = (val) => {
    if (!isControlled) setInternalQuery(val);
  };
  const [debouncedQuery] = useDebounce(query, 300);
  const wrapperRef = useRef(null);
  const popRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem[displayKey] || "");
    }
  }, [selectedItem, displayKey]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      const inPop = popRef.current && popRef.current.contains(event.target);
      if (!inPop && wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedItem) {
          setQuery(selectedItem[displayKey] || "");
        } else {
          setQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedItem, displayKey]);
  const [openUpwards, setOpenUpwards] = useState(false);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 350);
    }
  }, [isOpen]);
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [items]);
  useEffect(() => {
    if (!portal || !isOpen) return void 0;
    const measure = () => {
      const el = inputRef.current;
      if (el) setAnchor(el.getBoundingClientRect());
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [portal, isOpen]);
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);
  const filteredItems = (items || []).filter((item) => {
    if (disableLocalFiltering) return true;
    if (!query) return true;
    const val = item[filterKey] ? String(item[filterKey]).toLowerCase() : "";
    const phone = item.phone ? String(item.phone).toLowerCase() : "";
    const sku = item.sku ? String(item.sku).toLowerCase() : "";
    const q = query.toLowerCase();
    return val.includes(q) || phone.includes(q) || sku.includes(q);
  }).sort((a, b) => {
    const aName = (a[displayKey] || "").toLowerCase();
    const bName = (b[displayKey] || "").toLowerCase();
    const q = query.toLowerCase();
    if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
    if (!aName.startsWith(q) && bName.startsWith(q)) return 1;
    return aName.localeCompare(bName);
  });
  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => prev > 0 ? prev - 1 : 0);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          onSelect(filteredItems[highlightedIndex]);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };
  const highlightMatch = (text, query2) => {
    if (!query2 || !text) return text;
    const regex = new RegExp(`(${query2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = String(text).split(regex);
    return parts.map(
      (part, i) => regex.test(part) ? /* @__PURE__ */ jsx("mark", { className: "bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-0.5 rounded font-bold", children: part }, i) : part
    );
  };
  const isServiceItem = (item) => {
    if (!item) return false;
    return Boolean(
      item.type === "service" || item.is_service === true || item.item_type === "service" || item.unit === "service" || item.sku && String(item.sku).toUpperCase().startsWith("SRV-") || item.category?.name && String(item.category.name).toLowerCase().includes("service") || item.service_pricing || item.default_duration || item.service_duration_minutes
    );
  };
  const getTypeBadge = (item) => {
    if (item.type === "customer") {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { size: 10 }),
        tt("Customer")
      ] });
    }
    if (item.type === "supplier") {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30", children: [
        /* @__PURE__ */ jsx(Truck, { size: 10 }),
        tt("Supplier")
      ] });
    }
    if (isServiceItem(item)) {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 10 }),
        tt("Service")
      ] });
    }
    return null;
  };
  const getBalanceDisplay = (item) => {
    if (item.current_balance === void 0 && item.balance === void 0) return null;
    const balance = item.current_balance ?? item.balance ?? 0;
    const isCustomer = item.type === "customer";
    const isSupplier = item.type === "supplier";
    let label2, colorClass, icon;
    if (isCustomer) {
      if (balance > 0) {
        label2 = "To Receive";
        colorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30";
        icon = /* @__PURE__ */ jsx(TrendingUp, { size: 12 });
      } else if (balance < 0) {
        label2 = "Advance";
        colorClass = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30";
        icon = /* @__PURE__ */ jsx(Wallet, { size: 12 });
      } else {
        label2 = "Settled";
        colorClass = "text-ink-muted bg-sunken border-line dark:border-line";
        icon = /* @__PURE__ */ jsx(Check, { size: 12 });
      }
    } else if (isSupplier) {
      if (balance > 0) {
        label2 = "To Pay";
        colorClass = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30";
        icon = /* @__PURE__ */ jsx(CreditCard, { size: 12 });
      } else if (balance < 0) {
        label2 = "Advance Paid";
        colorClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
        icon = /* @__PURE__ */ jsx(Wallet, { size: 12 });
      } else {
        label2 = "Settled";
        colorClass = "text-ink-muted bg-sunken border-line dark:border-line";
        icon = /* @__PURE__ */ jsx(Check, { size: 12 });
      }
    } else {
      if (balance > 0) {
        label2 = "Balance";
        colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
        icon = /* @__PURE__ */ jsx(Wallet, { size: 12 });
      } else if (balance < 0) {
        label2 = "Due";
        colorClass = "text-red-600 bg-red-50 border-red-200";
        icon = /* @__PURE__ */ jsx(AlertTriangle, { size: 12 });
      } else {
        return null;
      }
    }
    return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-1xs font-bold border ${colorClass}`, children: [
      icon,
      label2,
      ": ",
      formatCurrency(Math.abs(balance), store || settings)
    ] });
  };
  const getCreditLimitWarning = (item) => {
    if (!item.credit_limit || item.credit_limit <= 0) return null;
    const balance = item.current_balance ?? item.balance ?? 0;
    const usagePercent = balance / item.credit_limit * 100;
    if (usagePercent >= 90) {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " Credit Limit!"
      ] });
    } else if (usagePercent >= 70) {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " ",
        Math.round(usagePercent),
        "% Used"
      ] });
    }
    return null;
  };
  const getStockBadge = (item) => {
    if (isServiceItem(item)) {
      const duration = item.service_duration_minutes || item.default_duration;
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 10 }),
        " ",
        duration ? `${duration} min` : tt("Service")
      ] });
    }
    if (item.stock_quantity === void 0) return null;
    const totalStock = item.stock_quantity;
    const reserved = item.reserved_quantity || 0;
    const available = item.available_stock !== void 0 ? item.available_stock : Math.max(0, totalStock - reserved);
    const lowStockThreshold = item.low_stock_threshold || 10;
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 flex-wrap", children: [
      available <= 0 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " OUT OF STOCK"
      ] }) : available <= lowStockThreshold ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " Avail: ",
        available
      ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", children: [
        /* @__PURE__ */ jsx(Package, { size: 10 }),
        " Avail: ",
        available
      ] }),
      reserved > 0 && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30", children: [
        "🔒 Reserved: ",
        reserved
      ] })
    ] });
  };
  const getProfitMargin = (item) => {
    if (item.price === void 0 || item.cost === void 0) return null;
    const margin = item.price - item.cost;
    const marginPercent = item.cost > 0 ? (margin / item.cost * 100).toFixed(0) : 0;
    if (margin <= 0) {
      return /* @__PURE__ */ jsx("span", { className: "text-2xs text-red-500 font-bold", children: "⚠️ No Profit" });
    }
    return /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted", children: [
      "Margin: ",
      /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-bold", children: formatCurrency(margin, store || settings) }),
      /* @__PURE__ */ jsxs("span", { className: "text-neutral-300 ml-1", children: [
        "(",
        marginPercent,
        "%)"
      ] })
    ] });
  };
  const getLastActivity = (item) => {
    if (!item.last_transaction_date && !item.updated_at) return null;
    const date = new Date(item.last_transaction_date || item.updated_at);
    const now = /* @__PURE__ */ new Date();
    const diffDays = Math.floor((now - date) / (1e3 * 60 * 60 * 24));
    let timeText;
    if (diffDays === 0) timeText = "Today";
    else if (diffDays === 1) timeText = "Yesterday";
    else if (diffDays < 7) timeText = `${diffDays}d ago`;
    else if (diffDays < 30) timeText = `${Math.floor(diffDays / 7)}w ago`;
    else if (diffDays < 365) timeText = `${Math.floor(diffDays / 30)}m ago`;
    else timeText = `${Math.floor(diffDays / 365)}y ago`;
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-2xs text-ink-muted", children: [
      /* @__PURE__ */ jsx(Clock, { size: 10 }),
      " ",
      timeText
    ] });
  };
  const getItemIcon = (item) => {
    if (item.type === "customer") {
      return /* @__PURE__ */ jsx(User, { size: 18, className: "text-blue-500" });
    }
    if (item.type === "supplier") {
      return /* @__PURE__ */ jsx(Truck, { size: 18, className: "text-brand-500" });
    }
    if (isServiceItem(item)) {
      return /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "text-teal-500" });
    }
    if (item.stock_quantity !== void 0 || item.sku) {
      return /* @__PURE__ */ jsx(Package, { size: 18, className: "text-brand-500" });
    }
    return /* @__PURE__ */ jsx(Package, { size: 18, className: "text-ink-muted" });
  };
  const renderList = (node) => portal && typeof document !== "undefined" ? createPortal(node, document.body) : node;
  const isParty = (item) => item.type === "customer" || item.type === "supplier" || item.phone;
  const isProduct = (item) => item.stock_quantity !== void 0 || item.sku || item.price !== void 0;
  return /* @__PURE__ */ jsxs("div", { id, className: `relative ${className}`, ref: wrapperRef, children: [
    label && /* @__PURE__ */ jsx("label", { className: "text-xs text-ink-muted font-bold uppercase block mb-1", children: label }),
    /* @__PURE__ */ jsxs("div", { className: `relative flex items-center ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: [
      !hideSearchIcon && /* @__PURE__ */ jsx(Search, { size: 18, className: "absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none z-10" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: query,
          onChange: (e) => {
            const val = e.target.value;
            setQuery(val);
            if (onQueryChange) onQueryChange(val);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          },
          onFocus: () => !readOnly && setIsOpen(true),
          onKeyDown: handleKeyDown,
          placeholder,
          disabled,
          readOnly,
          className: `
 w-full ${hideSearchIcon ? "pl-4" : "pl-11"} pr-4 py-3 
 bg-surface 
 border border-line 
 rounded-xl 
 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 
 text-sm font-bold text-ink 
 placeholder-slate-400 
 transition-all shadow-sm
 ${inputClassName}
`
        }
      ),
      loading && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin text-brand-500" }) })
    ] }),
    isOpen && filteredItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: `absolute right-0 text-3xs text-ink-muted flex items-center gap-2 ${openUpwards ? "-top-5" : "-bottom-5"}`, children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(ArrowUp, { size: 10 }),
        /* @__PURE__ */ jsx(ArrowDown, { size: 10 })
      ] }),
      /* @__PURE__ */ jsx("span", { children: "↵ Select" }),
      /* @__PURE__ */ jsx("span", { children: "Esc Close" })
    ] }),
    isOpen && renderList(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: popRef,
          className: portal ? "fixed bg-surface border border-line rounded-[14px] shadow-2xl animate-in fade-in zoom-in-95 duration-fast" : `absolute ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"} left-1/2 -translate-x-1/2 min-w-full w-max max-w-[350px] bg-surface border border-line rounded-[14px] shadow-2xl z-drawer animate-in fade-in zoom-in-95 duration-fast`,
          style: portal && anchor ? {
            left: anchor.left + anchor.width / 2,
            transform: "translateX(-50%)",
            minWidth: anchor.width,
            maxWidth: Math.max(anchor.width, 350),
            zIndex: 700,
            ...openUpwards ? { bottom: Math.max(8, window.innerHeight - anchor.top + 4) } : { top: anchor.bottom + 4 }
          } : void 0,
          children: [
            filteredItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 bg-app border-b border-line flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: [
                filteredItems.length,
                " Result",
                filteredItems.length !== 1 ? "s" : ""
              ] }),
              query && /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted", children: [
                'Searching: "',
                /* @__PURE__ */ jsx("span", { className: "text-brand-500 font-bold", children: query }),
                '"'
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { ref: listRef, className: "max-h-[320px] overflow-y-auto custom-scrollbar", children: [
              loading && filteredItems.length === 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-8 text-center", children: [
                /* @__PURE__ */ jsx(Loader2, { size: 32, className: "mx-auto animate-spin text-brand-500 mb-2" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted font-medium", children: "Searching..." })
              ] }),
              !loading && filteredItems.length === 0 && query && /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(Search, { size: 28, className: "text-neutral-300 dark:text-ink-secondary" }) }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-ink-secondary", children: [
                  'No results for "',
                  query,
                  '"'
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Try a different search term" })
              ] }),
              !loading && filteredItems.length === 0 && !query && /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto mb-3 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Package, { size: 28, className: "text-brand-400" }) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink-muted", children: "Start typing to search" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Search by name, phone, SKU, or email" })
              ] }),
              filteredItems.map((item, idx) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `
 px-4 py-3 flex items-start justify-between gap-3 
 border-b border-line last:border-0
 cursor-pointer transition-all duration-fast
 ${highlightedIndex === idx ? "bg-brand-50 dark:bg-brand-600/20 scale-[1.01]" : selectedItem?.id === item.id ? "bg-emerald-50 dark:bg-emerald-600/10" : "hover:bg-interactive-hover dark:hover:bg-interactive-hover"}
`,
                  onMouseEnter: () => setHighlightedIndex(idx),
                  children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "flex items-start gap-3 flex-1 min-w-0",
                        onClick: () => {
                          onSelect(item);
                          setIsOpen(false);
                          setHighlightedIndex(-1);
                        },
                        children: [
                          showTypeIcon && /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === "customer" ? "bg-blue-100 dark:bg-blue-500/20" : item.type === "supplier" ? "bg-brand-100 dark:bg-brand-500/20" : isServiceItem(item) ? "bg-teal-100 dark:bg-teal-500/20" : "bg-sunken"}`, children: getItemIcon(item) }),
                          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [
                              /* @__PURE__ */ jsx("span", { className: `font-bold text-base truncate ${highlightedIndex === idx || selectedItem?.id === item.id ? "text-brand-600 dark:text-brand-400" : "text-ink"}`, children: highlightMatch(item[displayKey], query) }),
                              getTypeBadge(item),
                              item.is_vip && /* @__PURE__ */ jsx(Star, { size: 14, className: "text-amber-500 fill-amber-500" }),
                              item.price !== void 0 && /* @__PURE__ */ jsx("span", { className: "font-bold text-lg text-emerald-600 dark:text-emerald-400 ml-auto shrink-0", children: formatCurrency(item.price, store || settings) })
                            ] }),
                            isParty(item) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-ink-muted mb-1.5", children: [
                              item.phone && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                                /* @__PURE__ */ jsx(Phone, { size: 11 }),
                                " ",
                                item.phone
                              ] }),
                              item.email && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 truncate max-w-[150px]", children: [
                                /* @__PURE__ */ jsx(Mail, { size: 11 }),
                                " ",
                                item.email
                              ] }),
                              item.address && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 truncate max-w-[150px]", title: item.address, children: [
                                /* @__PURE__ */ jsx(MapPin, { size: 11 }),
                                " ",
                                item.address
                              ] })
                            ] }),
                            isParty(item) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                              getBalanceDisplay(item),
                              getCreditLimitWarning(item),
                              getLastActivity(item)
                            ] }),
                            isProduct(item) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [
                              item.sku && /* @__PURE__ */ jsxs("span", { className: "font-mono text-ink-muted bg-sunken px-1.5 py-0.5 rounded text-2xs", children: [
                                "SKU: ",
                                item.sku
                              ] }),
                              item.category?.name && /* @__PURE__ */ jsx("span", { className: "text-2xs px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold", children: item.category.name }),
                              getStockBadge(item)
                            ] }),
                            isProduct(item) && !hideCostAndMargin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                              item.cost !== void 0 && /* @__PURE__ */ jsxs("span", { className: "text-1xs text-ink-muted", children: [
                                "Cost: ",
                                /* @__PURE__ */ jsx("span", { className: "text-ink-secondary font-semibold", children: formatCurrency(item.cost, store || settings) })
                              ] }),
                              getProfitMargin(item)
                            ] })
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1 shrink-0", children: [
                      onEdit && /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            onEdit(item);
                            setIsOpen(false);
                          },
                          className: "p-2 rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted hover:text-brand-500 transition-colors",
                          title: "Edit",
                          children: /* @__PURE__ */ jsx(Edit2, { size: 14 })
                        }
                      ),
                      selectedItem?.id === item.id && /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center", children: /* @__PURE__ */ jsx(Check, { size: 12, className: "text-white" }) })
                    ] })
                  ]
                },
                item.id || idx
              ))
            ] }),
            onAddNew && /* @__PURE__ */ jsx("div", { className: "border-t-2 border-line bg-gradient-to-r from-neutral-50 to-brand-50 dark:from-neutral-800/80 dark:to-brand-900/20", children: /* @__PURE__ */ jsxs(
              "button",
              {
                id: "tour-add-new-party-btn",
                onClick: () => {
                  onAddNew(query);
                  setIsOpen(false);
                },
                className: "w-full px-4 py-3.5 flex items-center gap-3 text-brand-600 dark:text-brand-400 hover:bg-brand-100/50 dark:hover:bg-brand-500/10 transition-colors group",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-500/30 transition-colors", children: /* @__PURE__ */ jsx(Plus, { size: 20, className: "text-brand-600 dark:text-brand-400" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                    /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm block", children: [
                      addNewLabel,
                      query && /* @__PURE__ */ jsxs("span", { className: "text-ink-muted font-normal ml-1", children: [
                        '"',
                        query,
                        '"'
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Create a new entry" })
                  ] })
                ]
              }
            ) })
          ]
        }
      )
    )
  ] });
};
export {
  SmartCombobox as S
};
