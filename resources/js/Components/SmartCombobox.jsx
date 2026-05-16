import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Search, Plus, Check, Edit2, Package, User, Loader2, ArrowUp, ArrowDown,
    Star, AlertTriangle, TrendingUp, Clock, ShoppingBag, Truck, CreditCard,
    BadgePercent, Wallet, MapPin, Phone, Mail
} from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { formatCurrency } from '@/Utils/format';

const SmartCombobox = ({
    items = [],
    selectedItem,
    onSelect,
    onAddNew,
    placeholder = "Search...",
    label,
    addNewLabel = "Add New",
    displayKey = 'name',
    filterKey = 'name',
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
    showDetailedView = true, // Show enhanced details
    disableLocalFiltering = false,
    hideCostAndMargin = false
}) => {
    const { store, settings } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [internalQuery, setInternalQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const isControlled = value !== undefined;
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
            setQuery(selectedItem[displayKey] || '');
        }
    }, [selectedItem, displayKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                if (selectedItem) {
                    setQuery(selectedItem[displayKey] || '');
                } else {
                    setQuery('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedItem, displayKey]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [items]);

    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex];
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [highlightedIndex]);

    // Filter and sort items
    // Filter and sort items
    const filteredItems = (items || [])
        .filter(item => {
            if (disableLocalFiltering) return true;
            if (!query) return true;
            const val = item[filterKey] ? String(item[filterKey]).toLowerCase() : '';
            const phone = item.phone ? String(item.phone).toLowerCase() : '';
            const sku = item.sku ? String(item.sku).toLowerCase() : '';
            const q = query.toLowerCase();
            return val.includes(q) || phone.includes(q) || sku.includes(q);
        })
        .sort((a, b) => {
            // Prioritize exact matches
            const aName = (a[displayKey] || '').toLowerCase();
            const bName = (b[displayKey] || '').toLowerCase();
            const q = query.toLowerCase();

            if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
            if (!aName.startsWith(q) && bName.startsWith(q)) return 1;

            return aName.localeCompare(bName);
        });

    const handleKeyDown = (e) => {
        if (onKeyDown) onKeyDown(e);

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredItems.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
                    onSelect(filteredItems[highlightedIndex]);
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Highlight matching text
    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = String(text).split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit px-0.5 rounded font-black">
                    {part}
                </mark>
            ) : part
        );
    };

    // Get party type badge
    const getTypeBadge = (item) => {
        if (item.type === 'customer') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    <ShoppingBag size={10} />
                    Customer
                </span>
            );
        }
        if (item.type === 'supplier') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                    <Truck size={10} />
                    Supplier
                </span>
            );
        }
        return null;
    };

    // Get balance display with proper color coding
    const getBalanceDisplay = (item) => {
        if (item.current_balance === undefined && item.balance === undefined) return null;

        const balance = item.current_balance ?? item.balance ?? 0;
        const isCustomer = item.type === 'customer';
        const isSupplier = item.type === 'supplier';

        // For Customers: Positive = They owe us (To Receive - Green), Negative = We owe them (Rare)
        // For Suppliers: Positive = We owe them (To Pay - Red), Negative = They owe us (Advance paid)

        let label, colorClass, icon;

        if (isCustomer) {
            if (balance > 0) {
                // Customer owes us money - TO RECEIVE
                label = 'To Receive';
                colorClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
                icon = <TrendingUp size={12} />;
            } else if (balance < 0) {
                // We owe customer (advance/credit)
                label = 'Advance';
                colorClass = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
                icon = <Wallet size={12} />;
            } else {
                label = 'Settled';
                colorClass = 'text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600';
                icon = <Check size={12} />;
            }
        } else if (isSupplier) {
            if (balance > 0) {
                // We owe supplier money - TO PAY
                label = 'To Pay';
                colorClass = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
                icon = <CreditCard size={12} />;
            } else if (balance < 0) {
                // Supplier owes us (advance paid)
                label = 'Advance Paid';
                colorClass = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
                icon = <Wallet size={12} />;
            } else {
                label = 'Settled';
                colorClass = 'text-slate-500 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600';
                icon = <Check size={12} />;
            }
        } else {
            // Generic balance display
            if (balance > 0) {
                label = 'Balance';
                colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                icon = <Wallet size={12} />;
            } else if (balance < 0) {
                label = 'Due';
                colorClass = 'text-red-600 bg-red-50 border-red-200';
                icon = <AlertTriangle size={12} />;
            } else {
                return null;
            }
        }

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${colorClass}`}>
                {icon}
                {label}: {formatCurrency(Math.abs(balance), store || settings)}
            </span>
        );
    };

    // Get credit limit warning
    const getCreditLimitWarning = (item) => {
        if (!item.credit_limit || item.credit_limit <= 0) return null;
        const balance = item.current_balance ?? item.balance ?? 0;
        const usagePercent = (balance / item.credit_limit) * 100;

        if (usagePercent >= 90) {
            return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse">
                    <AlertTriangle size={10} /> Credit Limit!
                </span>
            );
        } else if (usagePercent >= 70) {
            return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={10} /> {Math.round(usagePercent)}% Used
                </span>
            );
        }
        return null;
    };

    // Get stock status badge for products
    const getStockBadge = (item) => {
        if (item.stock_quantity === undefined) return null;

        const totalStock = item.stock_quantity;
        const reserved = item.reserved_quantity || 0;
        const available = item.available_stock !== undefined ? item.available_stock : Math.max(0, totalStock - reserved);
        const lowStockThreshold = item.low_stock_threshold || 10;

        return (
            <span className="inline-flex items-center gap-1.5 flex-wrap">
                {available <= 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                        <AlertTriangle size={10} /> OUT OF STOCK
                    </span>
                ) : available <= lowStockThreshold ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                        <AlertTriangle size={10} /> Avail: {available}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        <Package size={10} /> Avail: {available}
                    </span>
                )}
                {reserved > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                        🔒 Reserved: {reserved}
                    </span>
                )}
            </span>
        );
    };

    // Get profit margin indicator
    const getProfitMargin = (item) => {
        if (item.price === undefined || item.cost === undefined) return null;

        const margin = item.price - item.cost;
        const marginPercent = item.cost > 0 ? ((margin / item.cost) * 100).toFixed(0) : 0;

        if (margin <= 0) {
            return (
                <span className="text-[10px] text-red-500 font-bold">
                    ⚠️ No Profit
                </span>
            );
        }

        return (
            <span className="text-[10px] text-slate-400">
                Margin: <span className="text-emerald-500 font-bold">{formatCurrency(margin, store || settings)}</span>
                <span className="text-slate-300 ml-1">({marginPercent}%)</span>
            </span>
        );
    };

    // Get last activity indicator
    const getLastActivity = (item) => {
        if (!item.last_transaction_date && !item.updated_at) return null;

        const date = new Date(item.last_transaction_date || item.updated_at);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        let timeText;
        if (diffDays === 0) timeText = 'Today';
        else if (diffDays === 1) timeText = 'Yesterday';
        else if (diffDays < 7) timeText = `${diffDays}d ago`;
        else if (diffDays < 30) timeText = `${Math.floor(diffDays / 7)}w ago`;
        else if (diffDays < 365) timeText = `${Math.floor(diffDays / 30)}m ago`;
        else timeText = `${Math.floor(diffDays / 365)}y ago`;

        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                <Clock size={10} /> {timeText}
            </span>
        );
    };

    // Get item icon based on type
    const getItemIcon = (item) => {
        if (item.type === 'customer') {
            return <User size={18} className="text-blue-500" />;
        }
        if (item.type === 'supplier') {
            return <Truck size={18} className="text-purple-500" />;
        }
        if (item.stock_quantity !== undefined || item.sku) {
            return <Package size={18} className="text-indigo-500" />;
        }
        return <Package size={18} className="text-slate-400" />;
    };

    // Check if item is a party (customer/supplier)
    const isParty = (item) => item.type === 'customer' || item.type === 'supplier' || item.phone;

    // Check if item is a product
    const isProduct = (item) => item.stock_quantity !== undefined || item.sku || item.price !== undefined;

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="text-xs text-slate-500 font-bold uppercase block mb-1">{label}</label>}

            <div className={`relative flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        if (onQueryChange) onQueryChange(val);
                        if (!isOpen) setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => !readOnly && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={`
                        w-full pl-11 pr-4 py-3 
                        bg-white dark:bg-slate-800 
                        border border-slate-200 dark:border-slate-700 
                        rounded-xl 
                        focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                        text-sm font-bold text-slate-800 dark:text-white 
                        placeholder-slate-400 
                        transition-all shadow-sm
                        ${inputClassName}
                    `}
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-indigo-500" />
                    </div>
                )}
            </div>

            {/* Keyboard Hint */}
            {isOpen && filteredItems.length > 0 && (
                <div className="absolute -bottom-5 right-0 text-[9px] text-slate-400 flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><ArrowUp size={10} /><ArrowDown size={10} /></span>
                    <span>↵ Select</span>
                    <span>Esc Close</span>
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 min-w-full w-max max-w-[350px] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">

                    {/* Results Count Header */}
                    {filteredItems.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {filteredItems.length} Result{filteredItems.length !== 1 ? 's' : ''}
                            </span>
                            {query && (
                                <span className="text-[10px] text-slate-400">
                                    Searching: "<span className="text-indigo-500 font-bold">{query}</span>"
                                </span>
                            )}
                        </div>
                    )}

                    {/* Scrollable List */}
                    <div ref={listRef} className="max-h-[320px] overflow-y-auto custom-scrollbar">
                        {/* Loading State */}
                        {loading && filteredItems.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <Loader2 size={32} className="mx-auto animate-spin text-indigo-500 mb-2" />
                                <p className="text-sm text-slate-500 font-medium">Searching...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && filteredItems.length === 0 && query && (
                            <div className="px-4 py-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                    <Search size={28} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No results for "{query}"</p>
                                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                            </div>
                        )}

                        {/* Initial Empty State */}
                        {!loading && filteredItems.length === 0 && !query && (
                            <div className="px-4 py-6 text-center">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                                    <Package size={28} className="text-indigo-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Start typing to search</p>
                                <p className="text-xs text-slate-400 mt-1">Search by name, phone, SKU, or email</p>
                            </div>
                        )}

                        {filteredItems.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className={`
                                    px-4 py-3 flex items-start justify-between gap-3 
                                    border-b border-slate-100 dark:border-slate-800 last:border-0
                                    cursor-pointer transition-all duration-150
                                    ${highlightedIndex === idx
                                        ? 'bg-indigo-50 dark:bg-indigo-600/20 scale-[1.01]'
                                        : selectedItem?.id === item.id
                                            ? 'bg-emerald-50 dark:bg-emerald-600/10'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }
                                `}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                                {/* Left: Icon + Main Info */}
                                <div
                                    className="flex items-start gap-3 flex-1 min-w-0"
                                    onClick={() => {
                                        onSelect(item);
                                        setIsOpen(false);
                                        setHighlightedIndex(-1);
                                    }}
                                >
                                    {/* Type Icon */}
                                    {showTypeIcon && (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'customer' ? 'bg-blue-100 dark:bg-blue-500/20' :
                                            item.type === 'supplier' ? 'bg-purple-100 dark:bg-purple-500/20' :
                                                'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            {getItemIcon(item)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {/* Row 1: Name + Type Badge + Price */}
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`font-black text-base truncate ${highlightedIndex === idx || selectedItem?.id === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                {highlightMatch(item[displayKey], query)}
                                            </span>
                                            {getTypeBadge(item)}
                                            {item.is_vip && (
                                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                            )}
                                            {item.price !== undefined && (
                                                <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 ml-auto shrink-0">
                                                    {formatCurrency(item.price, store || settings)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 2: Contact Info */}
                                        {isParty(item) && (
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-1.5">
                                                {item.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={11} /> {item.phone}
                                                    </span>
                                                )}
                                                {item.email && (
                                                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                                                        <Mail size={11} /> {item.email}
                                                    </span>
                                                )}
                                                {item.address && (
                                                    <span className="flex items-center gap-1 truncate max-w-[150px]" title={item.address}>
                                                        <MapPin size={11} /> {item.address}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Row 3: Balance & Credit Info (for Parties) */}
                                        {isParty(item) && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {getBalanceDisplay(item)}
                                                {getCreditLimitWarning(item)}
                                                {getLastActivity(item)}
                                            </div>
                                        )}

                                        {/* Row 2: Product Info */}
                                        {isProduct(item) && (
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {item.sku && (
                                                    <span className="font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                                        SKU: {item.sku}
                                                    </span>
                                                )}
                                                {item.category?.name && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {item.category.name}
                                                    </span>
                                                )}
                                                {getStockBadge(item)}
                                            </div>
                                        )}

                                        {/* Row 3: Cost & Margin (for Products) */}
                                        {isProduct(item) && !hideCostAndMargin && (
                                            <div className="flex items-center gap-3">
                                                {item.cost !== undefined && (
                                                    <span className="text-[11px] text-slate-400">
                                                        Cost: <span className="text-slate-600 dark:text-slate-300 font-semibold">{formatCurrency(item.cost, store || settings)}</span>
                                                    </span>
                                                )}
                                                {getProfitMargin(item)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {/* Edit Button */}
                                    {onEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(item);
                                                setIsOpen(false);
                                            }}
                                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}

                                    {/* Check mark for selected */}
                                    {selectedItem?.id === item.id && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sticky Footer: Add New Button */}
                    {onAddNew && (
                        <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-900/20">
                            <button
                                onClick={() => {
                                    onAddNew(query);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3.5 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/10 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors group-hover:scale-110">
                                    <Plus size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <span className="font-bold text-sm block">
                                        {addNewLabel}
                                        {query && <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">"{query}"</span>}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Create a new entry</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartCombobox;
