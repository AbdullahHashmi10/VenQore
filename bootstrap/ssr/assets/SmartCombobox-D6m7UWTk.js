import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Search, Loader2, ArrowUp, ArrowDown, Package, Star, Phone, Mail, MapPin, Edit2, Check, Plus, User, Truck, ShoppingBag, AlertTriangle, Clock, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { useDebounce } from "use-debounce";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
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
  showDetailedView = true,
  // Show enhanced details
  disableLocalFiltering = false,
  hideCostAndMargin = false,
  hideSearchIcon = false,
  id
}) => {
  const { store, settings } = usePage().props;
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
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem[displayKey] || "");
    }
  }, [selectedItem, displayKey]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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
      (part, i) => regex.test(part) ? /* @__PURE__ */ jsx("mark", { className: "bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-0.5 rounded font-black", children: part }, i) : part
    );
  };
  const getTypeBadge = (item) => {
    if (item.type === "customer") {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30", children: [
        /* @__PURE__ */ jsx(ShoppingBag, { size: 10 }),
        "Customer"
      ] });
    }
    if (item.type === "supplier") {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30", children: [
        /* @__PURE__ */ jsx(Truck, { size: 10 }),
        "Supplier"
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
        colorClass = "text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600";
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
        colorClass = "text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600";
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
    return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${colorClass}`, children: [
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
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " Credit Limit!"
      ] });
    } else if (usagePercent >= 70) {
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " ",
        Math.round(usagePercent),
        "% Used"
      ] });
    }
    return null;
  };
  const getStockBadge = (item) => {
    if (item.stock_quantity === void 0) return null;
    const totalStock = item.stock_quantity;
    const reserved = item.reserved_quantity || 0;
    const available = item.available_stock !== void 0 ? item.available_stock : Math.max(0, totalStock - reserved);
    const lowStockThreshold = item.low_stock_threshold || 10;
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 flex-wrap", children: [
      available <= 0 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " OUT OF STOCK"
      ] }) : available <= lowStockThreshold ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
        " Avail: ",
        available
      ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30", children: [
        /* @__PURE__ */ jsx(Package, { size: 10 }),
        " Avail: ",
        available
      ] }),
      reserved > 0 && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30", children: [
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
      return /* @__PURE__ */ jsx("span", { className: "text-[10px] text-red-500 font-bold", children: "⚠️ No Profit" });
    }
    return /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400", children: [
      "Margin: ",
      /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-bold", children: formatCurrency(margin, store || settings) }),
      /* @__PURE__ */ jsxs("span", { className: "text-slate-300 ml-1", children: [
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
    return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] text-slate-400", children: [
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
      return /* @__PURE__ */ jsx(Truck, { size: 18, className: "text-purple-500" });
    }
    if (item.stock_quantity !== void 0 || item.sku) {
      return /* @__PURE__ */ jsx(Package, { size: 18, className: "text-indigo-500" });
    }
    return /* @__PURE__ */ jsx(Package, { size: 18, className: "text-slate-400" });
  };
  const isParty = (item) => item.type === "customer" || item.type === "supplier" || item.phone;
  const isProduct = (item) => item.stock_quantity !== void 0 || item.sku || item.price !== void 0;
  return /* @__PURE__ */ jsxs("div", { id, className: `relative ${className}`, ref: wrapperRef, children: [
    label && /* @__PURE__ */ jsx("label", { className: "text-xs text-slate-500 font-bold uppercase block mb-1", children: label }),
    /* @__PURE__ */ jsxs("div", { className: `relative flex items-center ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, children: [
      !hideSearchIcon && /* @__PURE__ */ jsx(Search, { size: 18, className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" }),
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
                        bg-white dark:bg-slate-800 
                        border border-slate-200 dark:border-slate-700 
                        rounded-xl 
                        focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                        text-sm font-bold text-slate-800 dark:text-white 
                        placeholder-slate-400 
                        transition-all shadow-sm
                        ${inputClassName}
                    `
        }
      ),
      loading && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin text-indigo-500" }) })
    ] }),
    isOpen && filteredItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: `absolute right-0 text-[9px] text-slate-400 flex items-center gap-2 ${openUpwards ? "-top-5" : "-bottom-5"}`, children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsx(ArrowUp, { size: 10 }),
        /* @__PURE__ */ jsx(ArrowDown, { size: 10 })
      ] }),
      /* @__PURE__ */ jsx("span", { children: "↵ Select" }),
      /* @__PURE__ */ jsx("span", { children: "Esc Close" })
    ] }),
    isOpen && /* @__PURE__ */ jsxs("div", { className: `absolute ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"} left-1/2 -translate-x-1/2 min-w-full w-max max-w-[350px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl z-[120] animate-in fade-in zoom-in-95 duration-100`, children: [
      filteredItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: [
          filteredItems.length,
          " Result",
          filteredItems.length !== 1 ? "s" : ""
        ] }),
        query && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400", children: [
          'Searching: "',
          /* @__PURE__ */ jsx("span", { className: "text-indigo-500 font-bold", children: query }),
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: listRef, className: "max-h-[320px] overflow-y-auto custom-scrollbar", children: [
        loading && filteredItems.length === 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-8 text-center", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 32, className: "mx-auto animate-spin text-indigo-500 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: "Searching..." })
        ] }),
        !loading && filteredItems.length === 0 && query && /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(Search, { size: 28, className: "text-slate-300 dark:text-slate-600" }) }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: [
            'No results for "',
            query,
            '"'
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Try a different search term" })
        ] }),
        !loading && filteredItems.length === 0 && !query && /* @__PURE__ */ jsxs("div", { className: "px-4 py-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Package, { size: 28, className: "text-indigo-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-500", children: "Start typing to search" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Search by name, phone, SKU, or email" })
        ] }),
        filteredItems.map((item, idx) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `
                                    px-4 py-3 flex items-start justify-between gap-3 
                                    border-b border-slate-100 dark:border-slate-800 last:border-0
                                    cursor-pointer transition-all duration-150
                                    ${highlightedIndex === idx ? "bg-indigo-50 dark:bg-indigo-600/20 scale-[1.01]" : selectedItem?.id === item.id ? "bg-emerald-50 dark:bg-emerald-600/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
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
                    showTypeIcon && /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === "customer" ? "bg-blue-100 dark:bg-blue-500/20" : item.type === "supplier" ? "bg-purple-100 dark:bg-purple-500/20" : "bg-slate-100 dark:bg-slate-800"}`, children: getItemIcon(item) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [
                        /* @__PURE__ */ jsx("span", { className: `font-black text-base truncate ${highlightedIndex === idx || selectedItem?.id === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`, children: highlightMatch(item[displayKey], query) }),
                        getTypeBadge(item),
                        item.is_vip && /* @__PURE__ */ jsx(Star, { size: 14, className: "text-amber-500 fill-amber-500" }),
                        item.price !== void 0 && /* @__PURE__ */ jsx("span", { className: "font-black text-lg text-emerald-600 dark:text-emerald-400 ml-auto shrink-0", children: formatCurrency(item.price, store || settings) })
                      ] }),
                      isParty(item) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-slate-500 mb-1.5", children: [
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
                        item.sku && /* @__PURE__ */ jsxs("span", { className: "font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]", children: [
                          "SKU: ",
                          item.sku
                        ] }),
                        item.category?.name && /* @__PURE__ */ jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold", children: item.category.name }),
                        getStockBadge(item)
                      ] }),
                      isProduct(item) && !hideCostAndMargin && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        item.cost !== void 0 && /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-slate-400", children: [
                          "Cost: ",
                          /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300 font-semibold", children: formatCurrency(item.cost, store || settings) })
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
                    className: "p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors",
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
      onAddNew && /* @__PURE__ */ jsx("div", { className: "border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-900/20", children: /* @__PURE__ */ jsxs(
        "button",
        {
          id: "tour-add-new-party-btn",
          onClick: () => {
            onAddNew(query);
            setIsOpen(false);
          },
          className: "w-full px-4 py-3.5 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/10 transition-colors group",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors group-hover:scale-110", children: /* @__PURE__ */ jsx(Plus, { size: 20, className: "text-indigo-600 dark:text-indigo-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm block", children: [
                addNewLabel,
                query && /* @__PURE__ */ jsxs("span", { className: "text-slate-500 dark:text-slate-400 font-normal ml-1", children: [
                  '"',
                  query,
                  '"'
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400", children: "Create a new entry" })
            ] })
          ]
        }
      ) })
    ] })
  ] });
};
export {
  SmartCombobox as S
};
