import React from 'react';
import { usePage } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    Save,
    Printer,
    User,
    Package,
    X,
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Banknote,
    Percent,
    DollarSign,
    Info,
    ScanBarcode,
    Zap,
    Eye,
    EyeOff,
    CheckCircle2,
    Search,
    TrendingUp,
    GripVertical,
    Settings,
    Type,
    ArrowLeftRight,
    Wallet,
    Edit
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

// ==========================================
// PHASE 1: TOP NAVIGATION & ACTIONS
// ==========================================

export const InvoiceTabNavigation = ({
    activeInvoices,
    currentInvoiceId,
    setCurrentInvoiceId,
    removeInvoice,
    addInvoice,
    defaultDelivery,
    defaultExtraValue,
    defaultExtraLabel,
    router
}) => {
    const { showConfirm } = useAlert();

    return (
        <div className="flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            {activeInvoices.map((inv, idx) => (
                <div
                    key={inv.id}
                    onClick={() => setCurrentInvoiceId(inv.id)}
                    className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
                    ${currentInvoiceId === inv.id
                            ? 'bg-white dark:bg-slate-900 text-indigo-600'
                            : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}
                `}
                >
                    <div className={`w-2 h-2 rounded-full ${currentInvoiceId === inv.id ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="text-xs font-bold truncate">
                        {inv.customer?.name || `Sale #${idx + 1}`}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const proceed = () => {
                                removeInvoice(inv.id);
                                if (activeInvoices.length === 1) router.visit(window.route('store.sales.index', { store_slug: usePage().props.store?.slug }));
                            };

                            if (activeInvoices.length === 1 && inv.items.length > 1) {
                                showConfirm({
                                    title: 'Discard Sale?',
                                    message: 'You have unsaved items. Discarding will lose this data.',
                                    type: 'error',
                                    confirmLabel: 'Discard',
                                    onConfirm: proceed
                                });
                            } else {
                                proceed();
                            }
                        }}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => addInvoice({
                    delivery_charge: defaultDelivery,
                    extra_charge_value: defaultExtraValue,
                    extra_charge_label: defaultExtraLabel
                })}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0"
                title="New Tab"
            >
                <Plus size={12} />
            </button>
        </div>
    );
};

export const QuickEntryToggle = ({ showQuickEntry, setShowQuickEntry }) => {
    return (
        <button
            onClick={() => {
                setShowQuickEntry(!showQuickEntry);
                if (!showQuickEntry) {
                    setTimeout(() => document.getElementById('quick-entry-input')?.focus(), 50);
                }
            }}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
            title="Toggle Quick Add (Alt+Q)"
        >
            <Zap size={20} className={showQuickEntry ? 'fill-current' : ''} />
        </button>
    );
};

export const ScanModeButton = ({ setIsScanning }) => {
    return (
        <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Scanning Mode"
        >
            <ScanBarcode size={20} />
            <span className="text-sm font-bold">Scan</span>
        </button>
    );
};

export const CustomerSearchWidget = ({
    currentInvoice,
    customerSearch,
    setCustomerSearch,
    patchInvoice,
    customerError,
    showCustomerDropdown,
    setShowCustomerDropdown,
    customerResults,
    setIsPartyModalOpen
}) => {
    return (
        <div className="relative flex-1 max-w-xl">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
            </div>
            <input
                type="text"
                placeholder="Search Customer (Name/Phone)..."
                value={currentInvoice.customer ? currentInvoice.customer.name : customerSearch}
                onChange={(e) => {
                    const val = e.target.value;
                    setCustomerSearch(val);
                    if (currentInvoice.customer) {
                        patchInvoice({ customer: null });
                    }
                    if (val.length >= 2) {
                        setShowCustomerDropdown(true);
                    } else {
                        setShowCustomerDropdown(false);
                    }
                }}
                onFocus={() => {
                    if (!currentInvoice.customer && customerSearch.length >= 2) {
                        setShowCustomerDropdown(true);
                    }
                }}
                className={`w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-4 ring-indigo-500/10 text-sm font-bold shadow-sm transition-all ${customerError ? 'border-red-500 ring-red-500/20 animate-shake' : ''}`}
                onBlur={() => {
                    setTimeout(() => {
                        setShowCustomerDropdown(false);
                    }, 400);
                }}
            />
            {customerError && (
                <p className="absolute -bottom-5 left-2 text-[10px] font-bold text-red-500 animate-pulse">
                    Please select a registered customer
                </p>
            )}
            {currentInvoice.customer && (
                <button
                    onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                >
                    <X size={18} />
                </button>
            )}

            {showCustomerDropdown && customerResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 max-h-80 overflow-y-auto p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {customerResults.map(c => (
                        <div
                            key={c.id}
                            onClick={() => { patchInvoice({ customer: c }); setShowCustomerDropdown(false); }}
                            className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                        >
                            <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{c.name}</p>
                                <p className="text-xs text-slate-500 font-bold">{c.phone || 'No Phone'}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-all" />
                        </div>
                    ))}
                    {/* Create New Option */}
                    <div
                        onClick={() => { setShowCustomerDropdown(false); setIsPartyModalOpen(true); }}
                        className="p-3 mt-2 border-t border-slate-100 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Plus size={16} />
                        </div>
                        <span>Create New Customer</span>
                    </div>
                </div>
            )}
            {showCustomerDropdown && customerResults.length === 0 && customerSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div
                        onClick={() => { setShowCustomerDropdown(false); setIsPartyModalOpen(true); }}
                        className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Plus size={16} />
                        </div>
                        <span>"{customerSearch}" not found. Create New?</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export const PaymentModeToggle = ({ currentInvoice, patchInvoice }) => {
    return (
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
                onClick={() => patchInvoice({ paymentMethod: 'credit' })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'credit'
                    ? 'bg-emerald-500 text-white shadow shadow-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <CreditCard size={12} /> CREDIT
            </button>
            <button
                onClick={() => patchInvoice({ paymentMethod: 'cash' })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'cash'
                    ? 'bg-orange-500 text-white shadow shadow-orange-500/20'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <Banknote size={12} /> CASH
            </button>
        </div>
    );
};

export const PaymentAccountSelector = ({ currentInvoice, patchInvoice, accounts }) => {
    return (
        <div className="relative group/accounts">
            <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black min-w-[120px] justify-between"
            >
                <span className="flex items-center gap-1.5 truncate">
                    <Wallet size={12} className="text-indigo-500" />
                    {currentInvoice.selectedBankName || accounts.find(a => a.id === (currentInvoice.paymentAccountId || 1))?.name || 'Cash in Hand'}
                </span>
                <ChevronRight size={12} className="rotate-90 text-slate-400" />
            </button>

            <div className="absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Deposit To</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {accounts.map(acc => (
                            <button
                                key={acc.id}
                                onClick={() => {
                                    if (acc.isBank) {
                                        patchInvoice({
                                            paymentAccountId: acc.realAccountId,
                                            selectedBankName: acc.name,
                                            paymentReference: `Deposited to: ${acc.name}`
                                        });
                                    } else {
                                        patchInvoice({
                                            paymentAccountId: acc.id,
                                            selectedBankName: null,
                                            paymentReference: ''
                                        });
                                    }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${(currentInvoice.paymentAccountId || 1) === acc.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span>{acc.name}</span>
                                {(currentInvoice.paymentAccountId || 1) === acc.id && <CheckCircle2 size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MarginToggle = ({ handleProfitDown, handleProfitUp }) => {
    return (
        <button
            onMouseDown={handleProfitDown}
            onMouseUp={handleProfitUp}
            onMouseLeave={handleProfitUp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200 dark:border-emerald-800 text-[10px] font-black select-none"
        >
            <TrendingUp size={12} /> MARGIN
        </button>
    );
};

export const TextSizeSelector = ({ textSize, setTextSize, showTextSizeMenu, setShowTextSizeMenu }) => {
    return (
        <div className="relative">
            <button
                onClick={() => setShowTextSizeMenu(!showTextSizeMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-[10px] font-black ${textSize > 1
                    ? 'bg-purple-500 text-white border-purple-500 shadow shadow-purple-500/20'
                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                title="Change Text Size"
            >
                <Type size={12} /> Aa+ {textSize > 1 && `(${textSize})`}
            </button>

            {showTextSizeMenu && (
                <div className="absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {[1, 2, 3, 4, 5].map((size) => (
                        <button
                            key={size}
                            onClick={() => { setTextSize(size); setShowTextSizeMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${textSize === size ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            {size === 1 ? 'Normal' : size === 2 ? 'Large' : size === 3 ? 'Larger' : size === 4 ? 'Senior' : 'Max'}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SettingsDrawerToggle = ({ setShowSettingsDrawer }) => {
    return (
        <button
            onClick={() => setShowSettingsDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black"
            title="Quick Settings"
        >
            <Settings size={12} />
        </button>
    );
};

export const TopActionBar = ({
    children
}) => {
    return (
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            {children}
        </div>
    );
};

// ==========================================
// PHASE 2: ITEMS TABLE AREA
// ==========================================

export const ItemsTableContainer = ({ children }) => {
    return (
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3">
            <table className="w-full border-separate border-spacing-y-1.5">
                {children}
            </table>
        </div>
    );
};

export const ItemsTableHeader = () => {
    return (
        <thead>
            <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                <th className="pb-2 w-8"></th>
                <th className="pb-2 pl-3 w-10 text-center">#</th>
                <th className="pb-2">Item Description</th>
                <th className="pb-2 w-20 text-center">Qty</th>
                <th className="pb-2 w-20 text-center text-xs text-emerald-600">Free</th>
                <th className="pb-2 w-28 text-right">Price</th>
                <th className="pb-2 w-32 text-right">Discount</th>
                <th className="pb-2 w-28 text-right">Total</th>
                <th className="pb-2 w-10"></th>
            </tr>
        </thead>
    );
};

export const DiscountTypeToggle = ({ discountType, onToggle, variant = 'default' }) => {
    const isPercent = discountType === 'percent';
    const baseClasses = variant === 'quick'
        ? `w-8 h-8 rounded-lg text-xs font-black transition-all ${isPercent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`
        : `w-8 h-8 rounded-lg text-xs font-black transition-all ${isPercent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`;

    return (
        <button onClick={onToggle} className={baseClasses}>
            {isPercent ? '%' : 'Rs'}
        </button>
    );
};

export const QuickEntryRow = ({
    quickEntry,
    setQuickEntry,
    quickResults,
    setQuickResults,
    quickSelectedIndex,
    selectQuickProduct,
    handleQuickSearch,
    handleQuickKeyDown,
    addQuickItem,
    quantityRef,
    discountRef,
    setEditingProduct,
    setProductModalMode,
    setIsProductModalOpen
}) => {
    return (
        <tr className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <td className="py-3"></td>
            <td className="py-3 pl-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Zap size={16} className="text-indigo-600" />
                </div>
            </td>
            <td className="py-3 relative">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-indigo-200 dark:border-indigo-900/30 focus-within:ring-2 ring-indigo-500/20 transition-all">
                    <Search size={16} className="text-indigo-400 shrink-0" />
                    <input
                        id="quick-entry-input"
                        type="text"
                        placeholder="Quick Add Product..."
                        value={quickEntry.name}
                        onChange={(e) => handleQuickSearch(e.target.value)}
                        onKeyDown={handleQuickKeyDown}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-indigo-600 dark:text-indigo-400 placeholder-indigo-300 py-0"
                    />
                </div>
                {quickResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 z-50 max-h-60 overflow-y-auto p-2">
                        {quickResults.map((p, pIdx) => (
                            <div
                                key={p.id}
                                className={`p-3 rounded-lg transition-all flex items-center justify-between group ${quickSelectedIndex === pIdx ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                            >
                                <div
                                    onClick={() => selectQuickProduct(p)}
                                    className="flex-1 cursor-pointer"
                                >
                                    <p className={`font-bold text-sm ${quickSelectedIndex === pIdx ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{p.name}</p>
                                    <p className={`text-xs ${quickSelectedIndex === pIdx ? 'text-indigo-100' : 'text-slate-500'}`}>Stock: {p.stock_quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className={`font-bold ${quickSelectedIndex === pIdx ? 'text-white' : 'text-indigo-600'}`}>Rs {p.price.toLocaleString()}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProduct(p);
                                            setProductModalMode('edit');
                                            setIsProductModalOpen(true);
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${quickSelectedIndex === pIdx ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-100 text-indigo-600'}`}
                                        title="Edit Product"
                                    >
                                        <Edit size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Create New Product Option */}
                        <div
                            onClick={() => {
                                setProductModalMode('create');
                                setEditingProduct(null);
                                setQuickResults([]);
                                setIsProductModalOpen(true);
                            }}
                            className="p-3 mt-1 border-t border-slate-100 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                            <Plus size={14} />
                            <span>Create "{quickEntry.name}" as New Product</span>
                        </div>
                    </div>
                )}
                {/* Show Create Option if No Results */}
                {quickEntry.name.length >= 2 && quickResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 z-50 p-2">
                        <div
                            onClick={() => {
                                setProductModalMode('create');
                                setEditingProduct({ name: quickEntry.name });
                                setIsProductModalOpen(true);
                            }}
                            className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                            <Plus size={14} />
                            <span>"{quickEntry.name}" not found. Create New?</span>
                        </div>
                    </div>
                )}
            </td>
            <td className="py-3 text-center">
                <input
                    ref={quantityRef}
                    type="number"
                    value={quickEntry.quantity}
                    onChange={(e) => setQuickEntry(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') discountRef.current?.focus();
                    }}
                    onFocus={() => setQuickResults([])}
                    className="w-16 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 outline-none"
                />
            </td>
            <td className="py-3 text-center">
                <input
                    type="number"
                    value={quickEntry.freeQuantity || ''}
                    placeholder="0"
                    onChange={(e) => setQuickEntry(prev => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 }))}
                    onFocus={() => setQuickResults([])}
                    className="w-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 outline-none placeholder-emerald-300"
                />
            </td>
            <td className="py-3 text-right">
                <input
                    type="number"
                    value={quickEntry.price}
                    onChange={(e) => setQuickEntry(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    onFocus={() => setQuickResults([])}
                    onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                    className="w-24 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                />
            </td>
            <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <input
                        ref={discountRef}
                        type="number"
                        value={quickEntry.discount}
                        onChange={(e) => setQuickEntry(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        onFocus={() => setQuickResults([])}
                        onKeyDown={(e) => e.key === 'Enter' && addQuickItem()}
                        className="w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                    />
                    <DiscountTypeToggle
                        discountType={quickEntry.discountType}
                        onToggle={() => {
                            setQuickResults([]);
                            setQuickEntry(prev => ({ ...prev, discountType: prev.discountType === 'fixed' ? 'percent' : 'fixed' }));
                        }}
                        variant="quick"
                    />
                </div>
            </td>
            <td className="py-3 text-right">
                <button
                    onClick={addQuickItem}
                    className="w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow shadow-indigo-500/30 flex items-center justify-center active:scale-90"
                >
                    <Plus size={18} />
                </button>
            </td>
            <td className="py-3 pr-3"></td>
        </tr>
    );
};

export const ItemRow = ({
    item,
    idx,
    draggedItemIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    updateItem,
    removeItem,
    searchProducts,
    selectProduct,
    productResults,
    activeItemIndex,
    setActiveItemIndex,
    setProductResults,
    setEditingProduct,
    setProductModalMode,
    setIsProductModalOpen,
    patchInvoice,
    currentInvoice,
    calculateLineTotal
}) => {
    return (
        <tr
            key={item.id}
            className={`group animate-in fade-in duration-200 ${draggedItemIndex === idx ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
        >
            {/* Drag Handle */}
            <td
                className="bg-slate-50 dark:bg-slate-800/50 rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing"
                onMouseDown={(e) => {
                    e.currentTarget.parentElement.setAttribute('draggable', 'true');
                }}
                onMouseUp={(e) => {
                    e.currentTarget.parentElement.setAttribute('draggable', 'false');
                }}
            >
                <GripVertical size={16} className="text-slate-300 hover:text-slate-500 transition-colors" />
            </td>
            {/* Row Number */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-sm font-bold text-slate-400 text-center">
                {idx + 1}
            </td>
            {/* Product Name */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 relative">
                <input
                    type="text"
                    placeholder="Search product..."
                    value={item.product ? item.product.name : (item.name || '')}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (item.product) {
                            const newItems = currentInvoice.items.map(i =>
                                i.id === item.id ? { ...i, product: null, name: newValue } : i
                            );
                            patchInvoice({ items: newItems });
                        } else {
                            updateItem(item.id, 'name', newValue);
                        }

                        if (newValue.length > 0) {
                            searchProducts(newValue, idx);
                        } else {
                            setProductResults([]);
                            setActiveItemIndex(null);
                        }
                    }}
                    onFocus={(e) => {
                        e.target.select();
                        if (item.name && item.name.length > 0 && !item.product) {
                            searchProducts(item.name, idx);
                        }
                    }}
                    onBlur={() => {
                        setTimeout(() => {
                            setProductResults([]);
                            setActiveItemIndex(null);
                        }, 400);
                    }}
                    className={`w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-300 py-0 ${!item.product ? 'text-slate-500 italic' : 'text-slate-800 dark:text-white'}`}
                />
                {!item.product && item.name && (
                    <button
                        onClick={() => {
                            setEditingProduct({ name: item.name });
                            setProductModalMode('create');
                            setIsProductModalOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded-lg shadow-sm border border-red-100 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1 z-10"
                        title="Click to create this product"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Unregistered
                    </button>
                )}
                {activeItemIndex === idx && productResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 max-h-72 overflow-y-auto p-2">
                        {productResults.map(p => (
                            <div
                                key={p.id}
                                className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all flex items-center justify-between group"
                            >
                                <div
                                    onClick={() => selectProduct(p, item.id)}
                                    className="flex-1 cursor-pointer"
                                >
                                    <p className="font-bold text-sm group-hover:text-indigo-600 transition-colors">{p.name}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-slate-500">Cost: <span className="font-bold text-slate-700 dark:text-slate-300">Rs {(p.cost || p.cost_price || 0).toLocaleString()}</span></span>
                                        <span className={`font-bold ${(p.stock_quantity || 0) > 10 ? 'text-emerald-600' : (p.stock_quantity || 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>Stock: {p.stock_quantity || 0}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-indigo-600">Rs {p.price.toLocaleString()}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingProduct(p);
                                            setProductModalMode('edit');
                                            setIsProductModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 transition-all"
                                        title="Edit Product"
                                    >
                                        <Edit size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div
                            onClick={() => {
                                setProductModalMode('create');
                                setEditingProduct(null);
                                setProductResults([]);
                                setIsProductModalOpen(true);
                            }}
                            className="p-3 mt-1 border-t border-slate-100 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                            <Plus size={14} />
                            <span>Create "{currentInvoice.items[idx]?.name || ''}" as New Product</span>
                        </div>
                    </div>
                )}
                {activeItemIndex === idx && productResults.length === 0 && item.name && item.name.length >= 2 && !item.product && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 p-2">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setProductModalMode('create');
                                setEditingProduct({ name: item.name });
                                setProductResults([]);
                                setActiveItemIndex(null);
                                setIsProductModalOpen(true);
                            }}
                            className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                        >
                            <Plus size={14} />
                            <span>"{item.name}" not found. Create New?</span>
                        </div>
                    </div>
                )}
            </td>
            {/* Quantity */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-center">
                <input
                    type="number"
                    value={item.quantity ?? 1}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => {
                        e.target.select();
                        setActiveItemIndex(null);
                        setProductResults([]);
                    }}
                    className="w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 transition-all"
                />
            </td>
            {/* Free Quantity */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-center">
                <input
                    type="number"
                    value={item.freeQuantity || ''}
                    placeholder="0"
                    onChange={(e) => updateItem(item.id, 'freeQuantity', parseFloat(e.target.value) || 0)}
                    className="w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50"
                />
            </td>
            {/* Price */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-right">
                <input
                    type="number"
                    value={item.price ?? 0}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => {
                        e.target.select();
                        setActiveItemIndex(null);
                        setProductResults([]);
                    }}
                    className="w-24 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all"
                />
            </td>
            {/* Discount */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <input
                        type="number"
                        value={item.discount ?? 0}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all"
                    />
                    <DiscountTypeToggle
                        discountType={item.discountType}
                        onToggle={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                    />
                </div>
            </td>
            {/* Total */}
            <td className="bg-slate-50 dark:bg-slate-800/50 py-3 text-right font-bold text-slate-800 dark:text-white pr-3 text-sm">
                Rs {calculateLineTotal(item).toLocaleString()}
            </td>
            {/* Delete */}
            <td className="bg-slate-50 dark:bg-slate-800/50 rounded-r-xl py-3 pr-3">
                <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

export const StickyAddButton = ({ addItem }) => {
    return (
        <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-3 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 transition-all"
            >
                <Plus size={18} /> ADD NEW ITEM
            </button>
        </div>
    );
};

// ==========================================
// PHASE 3: SIDEBAR (RIGHT PANEL)
// ==========================================

export const CustomerSummaryCard = ({ customer, patchInvoice, setCustomerSearch, textSize }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className={`rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? 'w-16 h-16 text-xl' : textSize >= 3 ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-lg'}`}>
                    {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-white font-bold truncate ${textSize >= 4 ? 'text-lg' : textSize >= 3 ? 'text-base' : 'text-sm'}`}>{customer.name}</p>
                    <p className={`text-slate-400 font-medium ${textSize >= 4 ? 'text-sm' : textSize >= 3 ? 'text-xs' : 'text-[10px]'}`}>{customer.phone || 'No Phone'}</p>
                </div>
                <button
                    onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
                    className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
            {/* Balance & Address */}
            <div className={`space-y-1 bg-slate-800/30 rounded-lg p-2 ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Balance:</span>
                    <span className={`font-black ${customer.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {customer.current_balance >= 0 ? '$ ' : '-Rs '}{Math.abs(customer.current_balance || 0).toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium shrink-0">Address:</span>
                    <span className={`text-right ${customer.address ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                        {customer.address || 'Not set'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const NoCustomerPlaceholder = ({ textSize }) => {
    return (
        <div className="text-center py-4 border border-dashed border-slate-700 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2 text-slate-500">
                <User size={20} />
            </div>
            <p className={`text-slate-400 font-bold ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>No Customer Selected</p>
        </div>
    );
};

export const InvoiceMetaData = ({ currentInvoice, patchInvoice }) => {
    return (
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Invoice #</label>
                <input
                    type="text"
                    value={currentInvoice.invoiceNumber || ''}
                    onChange={(e) => patchInvoice({ invoiceNumber: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="INV-000001"
                />
            </div>
            <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Date</label>
                <input
                    type="date"
                    value={currentInvoice.date || ''}
                    onChange={(e) => patchInvoice({ date: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>
        </div>
    );
};

export const InvoiceTermsSelect = ({ currentInvoice, patchInvoice }) => {
    return (
        <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Terms</label>
            <select
                value={currentInvoice.paymentTerms || 'net30'}
                onChange={(e) => patchInvoice({ paymentTerms: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
                <option value="immediate">Immediate</option>
                <option value="net7">Net 7</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net60">Net 60</option>
            </select>
        </div>
    );
};

export const ChequeDetailsCard = ({ currentInvoice, patchInvoice }) => {
    if (currentInvoice.paymentAccountId !== 'CHEQUE') return null;

    return (
        <div className="grid grid-cols-2 gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 animate-in slide-in-from-top-2">
            <div className="col-span-2">
                <p className="text-[10px] text-indigo-400 font-black uppercase mb-2 flex items-center gap-1">
                    <Wallet size={12} /> CHEQUE DETAILS
                </p>
            </div>
            <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Cheque No</label>
                <input
                    type="text"
                    value={currentInvoice.paymentReference || ''}
                    onChange={(e) => patchInvoice({ paymentReference: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-600"
                    placeholder="XXXXXX"
                />
            </div>
            <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Cheque Date</label>
                <input
                    type="date"
                    value={currentInvoice.chequeDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => patchInvoice({ chequeDate: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>
        </div>
    );
};

export const FinancialSummary = ({ subtotal, itemDiscounts }) => {
    return (
        <div className="space-y-2 pt-3 border-t border-slate-800/50">
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Subtotal</span>
                <span className="text-white font-bold text-base">Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Item Discounts</span>
                <span className="text-red-400 font-bold text-sm">- Rs {itemDiscounts.toLocaleString()}</span>
            </div>
        </div>
    );
};

export const GlobalDiscountInput = ({ currentInvoice, patchInvoice }) => {
    return (
        <div className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-bold">Invoice Discount</span>
            <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Rs</span>
                <input
                    type="number"
                    value={currentInvoice.discount ?? 0}
                    onChange={(e) => patchInvoice({ discount: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all"
                    placeholder="0"
                />
            </div>
        </div>
    );
};

export const GlobalTaxInput = ({ currentInvoice, patchInvoice }) => {
    return (
        <div className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-bold">Tax</span>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={currentInvoice.tax ?? 0}
                    onChange={(e) => patchInvoice({ tax: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all"
                    placeholder="0"
                />
                <span className="text-slate-500 text-xs">%</span>
            </div>
        </div>
    );
};

export const DeliveryChargeInput = ({ currentInvoice, patchInvoice, showDeliveryCharges }) => {
    if (!showDeliveryCharges) return null;

    return (
        <div className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
            <span className="text-xs text-slate-500 font-bold group-hover:text-slate-400">Delivery Charges</span>
            <div className="flex items-center gap-2">
                <span className="text-slate-600 text-[10px]">Rs</span>
                <input
                    type="number"
                    value={currentInvoice.delivery_charge ?? 0}
                    onChange={(e) => patchInvoice({ delivery_charge: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                    placeholder="0"
                />
            </div>
        </div>
    );
};

export const ExtraChargeInput = ({
    currentInvoice,
    patchInvoice,
    showExtraField,
    enableMultipleExtras
}) => {
    if (!showExtraField) return null;

    if (!enableMultipleExtras) {
        return (
            <div className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={currentInvoice.extra_charge_label ?? ''}
                        onChange={(e) => patchInvoice({ extra_charge_label: e.target.value })}
                        className="bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0"
                        placeholder="Extra"
                    />
                    <span className="text-[10px] text-slate-700">✎</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-[10px]">Rs</span>
                    <input
                        type="number"
                        value={currentInvoice.extra_charge_value ?? 0}
                        onChange={(e) => patchInvoice({ extra_charge_value: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                        placeholder="0"
                    />
                </div>
            </div>
        );
    }

    // Multiple Extra Fields Mode
    return (
        <div className="space-y-1">
            {(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }]).map((field, idx) => (
                <div key={field.id || idx} className="flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group">
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={field.label ?? ''}
                            onChange={(e) => {
                                const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                patchInvoice({ extraFields: updated });
                            }}
                            className="bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0"
                            placeholder={`Extra ${idx + 1}`}
                        />
                        <span className="text-[10px] text-slate-700">✎</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[10px]">Rs</span>
                        <input
                            type="number"
                            value={field.value ?? 0}
                            onChange={(e) => {
                                const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
                                updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                                patchInvoice({ extraFields: updated });
                            }}
                            className="w-16 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500"
                            placeholder="0"
                        />
                        {(currentInvoice.extraFields || []).length > 1 && (
                            <button
                                onClick={() => {
                                    const updated = (currentInvoice.extraFields || []).filter((_, i) => i !== idx);
                                    patchInvoice({ extraFields: updated });
                                }}
                                className="text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {(currentInvoice.extraFields || []).length < 10 && (
                <button
                    onClick={() => {
                        const current = currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }];
                        patchInvoice({ extraFields: [...current, { id: Date.now(), label: '', value: 0 }] });
                    }}
                    className="w-full text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-bold py-1 hover:bg-indigo-900/20 rounded-lg transition-all"
                >
                    + Add Extra Field
                </button>
            )}
        </div>
    );
};

export const AmountPaidInput = ({ currentInvoice, patchInvoice }) => {
    return (
        <div className="flex items-center justify-between bg-emerald-900/20 rounded-xl p-3 border border-emerald-800/30">
            <span className="text-xs text-emerald-400 font-bold">Amount Paid</span>
            <div className="flex items-center gap-2">
                <span className="text-emerald-600 text-xs">Rs</span>
                <input
                    type="number"
                    value={currentInvoice.amountPaid ?? 0}
                    onChange={(e) => patchInvoice({ amountPaid: parseFloat(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    className="w-24 bg-emerald-800/30 border border-emerald-700/50 rounded-lg px-2 py-1.5 text-emerald-400 font-bold text-sm text-right focus:ring-2 ring-emerald-500/20 transition-all"
                    placeholder="0"
                />
            </div>
        </div>
    );
};

export const BalanceDueDisplay = ({ balanceDue }) => {
    return (
        <div className={`flex items-center justify-between rounded-xl p-3 border ${balanceDue > 0 ? 'bg-red-900/20 border-red-800/30' : 'bg-emerald-900/20 border-emerald-800/30'}`}>
            <span className={`text-xs font-bold ${balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Balance Due</span>
            <span className={`font-bold text-base ${balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                Rs {balanceDue.toLocaleString()}
            </span>
        </div>
    );
};

export const GrandTotalActionPanel = ({
    grandTotal,
    saving,
    isEditMode,
    initiateSave,
    currentInvoice,
    removeInvoice,
    showConfirm,
    router
}) => {
    return (
        <div className="p-3 bg-slate-900 space-y-2 shrink-0 border-t border-slate-800">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                <span className="text-2xl font-black text-white">Rs {grandTotal.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
                <button
                    onClick={() => initiateSave(false)}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                    <CheckCircle2 size={16} />
                    {saving ? 'SAVING...' : (isEditMode ? 'UPDATE SALE' : 'COMPLETE SALE')}
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => initiateSave(true)}
                        disabled={saving}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                    >
                        <Printer size={16} />
                        {saving ? '...' : 'PRINT SALE'}
                    </button>
                    <button
                        onClick={() => {
                            if (isEditMode) {
                                router.visit(window.route('store.sales.index', { store_slug: usePage().props.store?.slug }));
                                return;
                            }
                            showConfirm({
                                title: 'Cancel Sale?',
                                message: 'Discard this sale? Items will be lost.',
                                type: 'warning',
                                confirmLabel: 'Yes, Discard',
                                onConfirm: () => {
                                    removeInvoice(currentInvoice.id);
                                    router.visit(window.route('store.sales.index', { store_slug: usePage().props.store?.slug }));
                                }
                            });
                        }}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95"
                    >
                        <X size={16} /> CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SideInfoPanel = ({ children }) => {
    return (
        <div className="w-80 bg-[#1a1d2e] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-800">
            {children}
        </div>
    );
};

export const CustomerSummarySection = ({ currentInvoice, patchInvoice, setCustomerSearch, textSize }) => {
    return (
        <div className="p-4 border-b border-slate-800/50 bg-slate-900/30 shrink-0">
            {currentInvoice.customer ? (
                <CustomerSummaryCard
                    customer={currentInvoice.customer}
                    patchInvoice={patchInvoice}
                    setCustomerSearch={setCustomerSearch}
                    textSize={textSize}
                />
            ) : (
                <NoCustomerPlaceholder textSize={textSize} />
            )}
        </div>
    );
};

export const InvoiceDetailsSection = ({ children }) => {
    return (
        <div className="flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar">
            {children}
        </div>
    );
};

// ==========================================
// PHASE 4: MODALS & OVERLAYS
// ==========================================

export const InlineProfitDisplay = ({ showProfit, showProfitModal, profit, grandTotal }) => {
    if (!showProfit || showProfitModal) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-slate-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-slate-700 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <TrendingUp size={24} className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Profit Margin</p>
                        <p className={`text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            Rs {profit.toLocaleString()}
                        </p>
                    </div>
                </div>
                {grandTotal > 0 && (
                    <div className="border-l border-slate-700 pl-6">
                        <p className="text-xs text-slate-400 font-bold uppercase">Margin %</p>
                        <p className={`text-xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {((profit / grandTotal) * 100).toFixed(1)}%
                        </p>
                    </div>
                )}
                <p className="text-xs text-slate-500 italic">↓ Drag down for details</p>
            </div>
        </div>
    );
};

export const SuccessModalContent = ({
    lastSaleId,
    onPrintReceipt,
    onNewTransaction
}) => {
    return (
        <div className="flex flex-col items-center py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle2 size={48} className="text-emerald-500" />
            </div>

            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Transaction Successful</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">The receipt has been generated and stock updated.</p>

            <div className="grid grid-cols-1 gap-3 w-full">
                <button
                    onClick={onPrintReceipt}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                >
                    <Printer size={20} /> PRINT RECEIPT
                </button>

                <button
                    onClick={onNewTransaction}
                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                    NEW TRANSACTION
                </button>
            </div>
        </div>
    );
};

export const ScanningModal = ({
    isScanning,
    setIsScanning,
    scanBuffer,
    setScanBuffer,
    handleScan,
    scannedItems,
    setScannedItems,
    confirmScan
}) => {
    if (!isScanning) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <ScanBarcode size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Scanning Mode</h2>
                            <p className="text-sm text-slate-500 font-bold">Scan items one after another</p>
                        </div>
                    </div>
                    <button onClick={() => setIsScanning(false)} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                        <X size={28} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Scan Barcode Now..."
                            value={scanBuffer}
                            onChange={(e) => setScanBuffer(e.target.value)}
                            onKeyDown={handleScan}
                            className="w-full py-8 px-10 bg-slate-50 dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-[32px] text-3xl font-black text-center focus:ring-8 ring-indigo-500/10 placeholder-slate-200 transition-all"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {scannedItems.length === 0 ? (
                            <div className="text-center py-16 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                                <Package size={64} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black text-lg">No items scanned yet</p>
                            </div>
                        ) : (
                            scannedItems.map((item, idx) => (
                                <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center gap-5">
                                        <span className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm">{idx + 1}</span>
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-lg">
                                                {item.name}
                                                {item.quantity > 1 && <span className="ml-2 text-emerald-500 text-base">x{item.quantity}</span>}
                                            </p>
                                            <p className="text-sm text-indigo-500 font-black">
                                                {item.quantity} @ Rs {item.price.toLocaleString()} = Rs {(item.quantity * item.price).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <p className="text-base font-black text-slate-500 uppercase tracking-widest">Total: <span className="text-indigo-600">{scannedItems.length} items</span></p>
                    <div className="flex gap-4">
                        <button onClick={() => setScannedItems([])} className="px-8 py-4 text-sm font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest">Clear All</button>
                        <button
                            onClick={confirmScan}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                        >
                            Add to Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProfitAnalysisModal = ({
    showProfitModal,
    setShowProfitModal,
    setProfitLocked,
    setShowProfit,
    currentInvoice,
    calculateLineTotal,
    totalCost,
    grandTotal,
    profit
}) => {
    if (!showProfitModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Profit Analysis</h3>
                            <p className="text-xs text-slate-500">Per-item breakdown</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowProfitModal(false); setProfitLocked(false); setShowProfit(false); }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                                <th className="pb-2 pl-2">#</th>
                                <th className="pb-2">Product</th>
                                <th className="pb-2 text-center">Qty</th>
                                <th className="pb-2 text-right">Cost</th>
                                <th className="pb-2 text-right">Price</th>
                                <th className="pb-2 text-right">Margin</th>
                                <th className="pb-2 text-right pr-2">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentInvoice.items.filter(item => item.product).map((item, idx) => {
                                const cost = (item.cost || item.product?.cost || item.product?.cost_price || 0);
                                const lineTotal = calculateLineTotal(item);
                                const lineCost = cost * item.quantity;
                                const lineProfit = lineTotal - lineCost;
                                const marginPercent = lineTotal > 0 ? (lineProfit / lineTotal * 100).toFixed(1) : 0;

                                return (
                                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="py-2 pl-2 text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="py-2">
                                            <p className="font-bold text-slate-800 dark:text-white text-xs">{item.product?.name || item.name}</p>
                                            <p className="text-[10px] text-slate-400">{item.product?.sku || 'N/A'}</p>
                                        </td>
                                        <td className="py-2 text-center text-xs">{item.quantity}</td>
                                        <td className="py-2 text-right text-xs text-slate-500">Rs {cost.toLocaleString()}</td>
                                        <td className="py-2 text-right text-xs">Rs {item.price.toLocaleString()}</td>
                                        <td className="py-2 text-right">
                                            <span className={`text-xs font-bold ${parseFloat(marginPercent) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {marginPercent}%
                                            </span>
                                        </td>
                                        <td className="py-2 text-right pr-2">
                                            <span className={`text-xs font-bold ${lineProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                Rs {lineProfit.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {currentInvoice.items.filter(item => item.product).length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No products added yet</p>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Cost</p>
                            <p className="text-lg font-bold text-slate-600">Rs {totalCost.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Revenue</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">Rs {grandTotal.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Net Profit</p>
                            <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                Rs {profit.toLocaleString()}
                                {grandTotal > 0 && (
                                    <span className="text-xs ml-1 opacity-70">({((profit / grandTotal) * 100).toFixed(1)}%)</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SettingsDrawerToggleItem = ({ icon: Icon, iconColor, label, sublabel, isActive, onToggle }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-3">
                <Icon size={18} className={iconColor} />
                <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-500">{sublabel}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full transition-all ${isActive ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );
};

export const SettingsDrawer = ({
    showSettingsDrawer,
    setShowSettingsDrawer,
    textSize,
    setTextSize,
    showQuickEntry,
    setShowQuickEntry,
    defaultDelivery,
    setDefaultDelivery,
    defaultExtraLabel,
    setDefaultExtraLabel,
    defaultExtraValue,
    setDefaultExtraValue,
    enableMultipleExtras,
    setEnableMultipleExtras,
    showDeliveryCharges,
    setShowDeliveryCharges,
    showExtraField,
    setShowExtraField,
    currentInvoice,
    patchInvoice
}) => {
    if (!showSettingsDrawer) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] animate-in fade-in duration-200"
                onClick={() => setShowSettingsDrawer(false)}
            />
            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Settings size={20} className="text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Quick Settings</h3>
                            <p className="text-xs text-slate-500">Invoice preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettingsDrawer(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Settings Content */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* Display Settings */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Display</h4>

                        {/* Large Text Mode */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Type size={18} className="text-purple-500" />
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-white">Large Text</p>
                                    <p className="text-xs text-slate-500">Bigger fonts for better visibility</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setTextSize(s)}
                                        className={`w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Show Quick Entry */}
                        <SettingsDrawerToggleItem
                            icon={Zap}
                            iconColor="text-indigo-500"
                            label="Quick Entry"
                            sublabel="Fast product entry row"
                            isActive={showQuickEntry}
                            onToggle={() => setShowQuickEntry(!showQuickEntry)}
                        />
                    </div>

                    {/* Invoice Settings */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Permanent Defaults</h4>

                        {/* Permanent Delivery */}
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-800/50">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Default Delivery</p>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs font-bold">Rs</span>
                                <input
                                    type="number"
                                    value={defaultDelivery}
                                    onChange={(e) => setDefaultDelivery(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Permanent Extra */}
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-2 border border-purple-100 dark:border-purple-800/50">
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Default Extra Field</p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={defaultExtraLabel}
                                    onChange={(e) => setDefaultExtraLabel(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white"
                                    placeholder="Field Name (e.g. Service)"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-xs font-bold">Rs</span>
                                    <input
                                        type="number"
                                        value={defaultExtraValue}
                                        onChange={(e) => setDefaultExtraValue(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Multiple Extra Fields Toggle */}
                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                        <Plus size={16} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">Multiple Extra Fields</p>
                                        <p className="text-[10px] text-slate-500">Add up to 10 custom charges</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnableMultipleExtras(!enableMultipleExtras)}
                                    className={`w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Show/Hide Fields */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Show/Hide Fields</h4>

                        <SettingsDrawerToggleItem
                            icon={Package}
                            iconColor="text-indigo-500"
                            label="Delivery Charges"
                            sublabel="Show delivery charges field"
                            isActive={showDeliveryCharges}
                            onToggle={() => setShowDeliveryCharges(!showDeliveryCharges)}
                        />

                        <SettingsDrawerToggleItem
                            icon={Plus}
                            iconColor="text-indigo-500"
                            label="Extra Field"
                            sublabel="Show extra charge field(s)"
                            isActive={showExtraField}
                            onToggle={() => setShowExtraField(!showExtraField)}
                        />
                    </div>

                    {/* Invoice Logic */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Invoice Logic</h4>

                        {/* Default Payment Method */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-white">Payment Method</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => patchInvoice({ paymentMethod: 'credit' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'credit'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                        }`}
                                >
                                    Credit
                                </button>
                                <button
                                    onClick={() => patchInvoice({ paymentMethod: 'cash' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'cash'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                        }`}
                                >
                                    Cash
                                </button>
                            </div>
                        </div>

                        {/* Default Tax */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-white">Default Tax Rate</p>
                            <div className="flex gap-2">
                                {[0, 5, 10, 17].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => patchInvoice({ tax: rate })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.tax === rate
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                            }`}
                                    >
                                        {rate}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                            <p className="text-sm font-bold text-slate-700 dark:text-white">Payment Terms</p>
                            <select
                                value={currentInvoice.paymentTerms || 'net30'}
                                onChange={(e) => patchInvoice({ paymentTerms: e.target.value })}
                                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ring-indigo-500/20"
                            >
                                <option value="immediate">Immediate</option>
                                <option value="net7">Net 7 Days</option>
                                <option value="net15">Net 15 Days</option>
                                <option value="net30">Net 30 Days</option>
                                <option value="net60">Net 60 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={() => setShowSettingsDrawer(false)}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </>
    );
};

export const OverpaymentModal = ({
    showOverpaymentModal,
    setShowOverpaymentModal,
    overpaymentDetails,
    processSale,
    tempPrintIntent
}) => {
    if (!showOverpaymentModal) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                onClick={() => setShowOverpaymentModal(false)}
            />
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[210] p-4">
                <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50">
                    {/* Header - Orange Midnight Nebula Style */}
                    <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 dark:from-amber-600 dark:via-orange-700 dark:to-orange-900 p-6 overflow-hidden">
                        {/* Midnight Nebula ambient glows */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 via-transparent to-red-500/20"></div>
                        <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-400/40 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/4"></div>

                        {/* Glass icon - Midnight Nebula style */}
                        <div className="relative flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                                <CreditCard size={26} className="text-white drop-shadow-lg" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white drop-shadow-sm">Overpayment Detected</h3>
                                <p className="text-white/80 text-sm font-medium">Customer paid extra</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50 dark:from-[#1a1d2e] dark:to-[#0f121d]">
                        <div className="text-center py-2">
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium">
                                {overpaymentDetails.customerName} paid
                            </p>
                            <p className="text-5xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                                Rs {overpaymentDetails.amount.toLocaleString()}
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium">more than the total</p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                            <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
                                What would you like to do with this extra amount?
                            </p>
                        </div>

                        {/* Options */}
                        <div className="grid gap-3">
                            {/* Option 1: Give Change */}
                            <button
                                onClick={() => {
                                    setShowOverpaymentModal(false);
                                    processSale(false, tempPrintIntent);
                                }}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group text-left flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform border border-amber-200 dark:border-amber-800/50">
                                    <ArrowLeftRight size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-white">Give Change</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Return Rs {overpaymentDetails.amount.toLocaleString()} to customer
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Credit to Ledger */}
                            <button
                                onClick={() => {
                                    setShowOverpaymentModal(false);
                                    processSale(true, tempPrintIntent);
                                }}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group text-left flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform border border-emerald-200 dark:border-emerald-800/50">
                                    <Wallet size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-white">Credit to Ledger</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Save Rs {overpaymentDetails.amount.toLocaleString()} to {overpaymentDetails.customerName}'s account
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/50">
                        <button
                            onClick={() => setShowOverpaymentModal(false)}
                            className="w-full py-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-sm transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

