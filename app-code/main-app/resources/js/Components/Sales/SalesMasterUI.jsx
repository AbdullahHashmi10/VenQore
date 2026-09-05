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
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

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
 <div className="flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-line bg-sunken/50 dark:bg-surface shrink-0">
 {activeInvoices.map((inv, idx) => (
 <div
 key={inv.id}
 onClick={() => setCurrentInvoiceId(inv.id)}
 className={`
 flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
 ${currentInvoiceId === inv.id
 ? 'bg-surface text-brand-600'
 : 'bg-sunken/50 dark:bg-surface text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'}
`}
 >
 <div className={`w-2 h-2 rounded-full ${currentInvoiceId === inv.id ? 'bg-brand-500 animate-pulse' : 'bg-neutral-400'}`}></div>
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
 className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg active:scale-95 shrink-0"
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
 className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? 'bg-brand-600 text-white border-brand-500 shadow-lg ' : 'bg-surface text-ink-muted border-line hover:bg-interactive-hover'}`}
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
 className="flex items-center gap-2 px-5 py-3 bg-surface text-ink-secondary rounded-2xl hover:bg-interactive-hover transition-all border border-line shadow-sm"
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
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
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
 className={`w-full pl-12 pr-10 py-3.5 rounded-2xl bg-surface border-line focus:ring-4 ring-brand-500/10 text-sm font-bold shadow-sm transition-all ${customerError ? 'border-red-500 ring-red-500/20 animate-shake' : ''}`}
 onBlur={() => {
 setTimeout(() => {
 setShowCustomerDropdown(false);
 }, 400);
 }}
 />
 {customerError && (
 <p className="absolute -bottom-5 left-2 text-2xs font-bold text-red-500 animate-pulse">
 Please select a registered customer
 </p>
 )}
 {currentInvoice.customer && (
 <button
 onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-red-500"
 >
 <X size={18} />
 </button>
 )}

 {showCustomerDropdown && customerResults.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-3 bg-surface rounded-[14px] shadow-2xl border border-line z-50 max-h-80 overflow-y-auto p-3 animate-in fade-in slide-in-from-top-2 duration-normal">
 {customerResults.map(c => (
 <div
 key={c.id}
 onClick={() => { patchInvoice({ customer: c }); setShowCustomerDropdown(false); }}
 className="p-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
 >
 <div>
 <p className="font-bold text-ink text-sm group-hover:text-brand-600 transition-colors">{c.name}</p>
 <p className="text-xs text-ink-muted font-bold">{c.phone || 'No Phone'}</p>
 </div>
 <ChevronRight size={16} className="text-neutral-300 group-hover:text-brand-400 transition-all" />
 </div>
 ))}
 {/* Create New Option */}
 <div
 onClick={() => { setShowCustomerDropdown(false); setIsPartyModalOpen(true); }}
 className="p-3 mt-2 border-t border-line hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold"
 >
 <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
 <Plus size={16} />
 </div>
 <span>Create New Customer</span>
 </div>
 </div>
 )}
 {showCustomerDropdown && customerResults.length === 0 && customerSearch.length >= 2 && (
 <div className="absolute top-full left-0 right-0 mt-3 bg-surface rounded-[14px] shadow-2xl border border-line z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-normal">
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
 <div className="flex items-center gap-0.5 bg-sunken rounded-xl p-1 border border-line">
 <button
 onClick={() => patchInvoice({ paymentMethod: 'credit' })}
 className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'credit'
 ? 'bg-emerald-500 text-white shadow '
 : 'text-ink-muted hover:text-ink-secondary'
 }`}
 >
 <CreditCard size={12} /> CREDIT
 </button>
 <button
 onClick={() => patchInvoice({ paymentMethod: 'cash' })}
 className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === 'cash'
 ? 'bg-orange-500 text-white shadow shadow-glow'
 : 'text-ink-muted hover:text-ink-secondary'
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
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all border border-line text-2xs font-bold min-w-[120px] justify-between"
 >
 <span className="flex items-center gap-1.5 truncate">
 <Wallet size={12} className="text-brand-500" />
 {currentInvoice.selectedBankName || accounts.find(a => a.id === (currentInvoice.paymentAccountId || 1))?.name || 'Cash in Hand'}
 </span>
 <ChevronRight size={12} className="rotate-90 text-ink-muted" />
 </button>

 <div className="absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2">
 <div className="bg-surface rounded-xl shadow-xl border border-line overflow-hidden">
 <div className="p-2 border-b border-line bg-app">
 <p className="text-2xs font-bold text-ink-muted uppercase">Deposit To</p>
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
 ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
 : 'text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'
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
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200 dark:border-emerald-800 text-2xs font-bold select-none"
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
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-2xs font-bold ${textSize > 1
 ? 'bg-brand-500 text-white border-brand-500 shadow '
 : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/30'
 }`}
 title="Change Text Size"
 >
 <Type size={12} /> Aa+ {textSize > 1 && `(${textSize})`}
 </button>

 {showTextSizeMenu && (
 <div className="absolute top-full mt-2 right-0 w-32 bg-surface rounded-[14px] shadow-xl border border-line z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
 {[1, 2, 3, 4, 5].map((size) => (
 <button
 key={size}
 onClick={() => { setTextSize(size); setShowTextSizeMenu(false); }}
 className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${textSize === size ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-ink-secondary'}`}
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
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sunken text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all border border-line text-2xs font-bold"
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
 <div className="px-3 py-2 border-b border-line flex items-center gap-3 bg-sunken/50 dark:bg-surface shrink-0">
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
 <tr className="text-left text-xs font-bold text-ink-muted uppercase tracking-wide">
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
 ? `w-8 h-8 rounded-lg text-xs font-bold transition-all ${isPercent ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-ink-muted'}`
 : `w-8 h-8 rounded-lg text-xs font-bold transition-all ${isPercent ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-ink-secondary'}`;

 return (
 <button onClick={onToggle} className={baseClasses}>
 {isPercent ? '%' : (usePage().props.store?.currency_symbol || getCurrencySymbol())}
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
 <tr className="bg-brand-50/50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/50 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-normal">
 <td className="py-3"></td>
 <td className="py-3 pl-3">
 <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
 <Zap size={16} className="text-brand-600" />
 </div>
 </td>
 <td className="py-3 relative">
 <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-brand-200 dark:border-brand-900/30 focus-within:ring-2 ring-brand-500/20 transition-all">
 <Search size={16} className="text-brand-400 shrink-0" />
 <input
 id="quick-entry-input"
 type="text"
 placeholder="Quick Add Product..."
 value={quickEntry.name}
 onChange={(e) => handleQuickSearch(e.target.value)}
 onKeyDown={handleQuickKeyDown}
 className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-brand-600 dark:text-brand-400 placeholder-brand-300 py-0"
 />
 </div>
 {quickResults.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-[14px] shadow-xl border border-brand-100 dark:border-brand-900/30 z-50 max-h-60 overflow-y-auto p-2">
 {quickResults.map((p, pIdx) => (
 <div
 key={p.id}
 className={`p-3 rounded-lg transition-all flex items-center justify-between group ${quickSelectedIndex === pIdx ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}
 >
 <div
 onClick={() => selectQuickProduct(p)}
 className="flex-1 cursor-pointer"
 >
 <p className={`font-bold text-sm ${quickSelectedIndex === pIdx ? 'text-white' : 'text-ink'}`}>{p.name}</p>
 <p className={`text-xs ${quickSelectedIndex === pIdx ? 'text-brand-100' : 'text-ink-muted'}`}>Stock: {p.stock_quantity}</p>
 </div>
 <div className="flex items-center gap-2">
 <p className={`font-bold ${quickSelectedIndex === pIdx ? 'text-white' : 'text-brand-600'}`}>{getCurrencySymbol()} {p.price.toLocaleString()}</p>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setEditingProduct(p);
 setProductModalMode('edit');
 setIsProductModalOpen(true);
 }}
 className={`p-1.5 rounded-lg transition-all ${quickSelectedIndex === pIdx ? 'bg-brand-500 text-white' : 'hover:bg-brand-100 text-brand-600'}`}
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
 className="p-3 mt-1 border-t border-line hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
 >
 <Plus size={14} />
 <span>Create "{quickEntry.name}" as New Product</span>
 </div>
 </div>
 )}
 {/* Show Create Option if No Results */}
 {quickEntry.name.length >= 2 && quickResults.length === 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-[14px] shadow-xl border border-brand-100 dark:border-brand-900/30 z-50 p-2">
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
 className="w-16 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-brand-500/20 outline-none"
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
 className="w-24 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 outline-none"
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
 className="w-20 bg-surface border border-brand-200 dark:border-brand-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 outline-none"
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
 className="w-8 h-8 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow flex items-center justify-center active:scale-90"
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
 className={`group animate-in fade-in duration-normal ${draggedItemIndex === idx ? 'opacity-50' : ''}`}
 draggable
 onDragStart={(e) => handleDragStart(e, idx)}
 onDragOver={(e) => handleDragOver(e, idx)}
 onDragEnd={handleDragEnd}
 >
 {/* Drag Handle */}
 <td
 className="bg-app rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing"
 onMouseDown={(e) => {
 e.currentTarget.parentElement.setAttribute('draggable', 'true');
 }}
 onMouseUp={(e) => {
 e.currentTarget.parentElement.setAttribute('draggable', 'false');
 }}
 >
 <GripVertical size={16} className="text-neutral-300 hover:text-ink-muted transition-colors" />
 </td>
 {/* Row Number */}
 <td className="bg-app py-3 text-sm font-bold text-ink-muted text-center">
 {idx + 1}
 </td>
 {/* Product Name */}
 <td className="bg-app py-3 relative">
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
 className={`w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-300 py-0 ${!item.product ? 'text-ink-muted italic' : 'text-ink'}`}
 />
 {!item.product && item.name && (
 <button
 onClick={() => {
 setEditingProduct({ name: item.name });
 setProductModalMode('create');
 setIsProductModalOpen(true);
 }}
 className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-red-500 font-bold bg-surface px-2 py-1 rounded-lg shadow-sm border border-red-100 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1 z-10"
 title="Click to create this product"
 >
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
 Unregistered
 </button>
 )}
 {activeItemIndex === idx && productResults.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-[14px] shadow-2xl border border-line z-50 max-h-72 overflow-y-auto p-2">
 {productResults.map(p => (
 <div
 key={p.id}
 className="p-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all flex items-center justify-between group"
 >
 <div
 onClick={() => selectProduct(p, item.id)}
 className="flex-1 cursor-pointer"
 >
 <p className="font-bold text-sm group-hover:text-brand-600 transition-colors">{p.name}</p>
 <div className="flex items-center gap-3 text-xs">
 <span className="text-ink-muted">Cost: <span className="font-bold text-ink-secondary">{getCurrencySymbol()} {(p.cost || p.cost_price || 0).toLocaleString()}</span></span>
 <span className={`font-bold ${(p.stock_quantity || 0) > 10 ? 'text-emerald-600' : (p.stock_quantity || 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>Stock: {p.stock_quantity || 0}</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <p className="font-bold text-brand-600">{getCurrencySymbol()} {p.price.toLocaleString()}</p>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setEditingProduct(p);
 setProductModalMode('edit');
 setIsProductModalOpen(true);
 }}
 className="p-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-600 transition-all"
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
 className="p-3 mt-1 border-t border-line hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
 >
 <Plus size={14} />
 <span>Create "{currentInvoice.items[idx]?.name || ''}" as New Product</span>
 </div>
 </div>
 )}
 {activeItemIndex === idx && productResults.length === 0 && item.name && item.name.length >= 2 && !item.product && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-[14px] shadow-2xl border border-line z-50 p-2">
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
 <td className="bg-app py-3 text-center">
 <input
 type="number"
 value={item.quantity ?? 1}
 onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
 onFocus={(e) => {
 e.target.select();
 setActiveItemIndex(null);
 setProductResults([]);
 }}
 className="w-16 bg-sunken border border-line dark:border-line rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-brand-500/20 transition-all"
 />
 </td>
 {/* Free Quantity */}
 <td className="bg-app py-3 text-center">
 <input
 type="number"
 value={item.freeQuantity || ''}
 placeholder="0"
 onChange={(e) => updateItem(item.id, 'freeQuantity', parseFloat(e.target.value) || 0)}
 className="w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50"
 />
 </td>
 {/* Price */}
 <td className="bg-app py-3 text-right">
 <input
 type="number"
 value={item.price ?? 0}
 onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
 onFocus={(e) => {
 e.target.select();
 setActiveItemIndex(null);
 setProductResults([]);
 }}
 className="w-24 bg-sunken border border-line dark:border-line rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 transition-all"
 />
 </td>
 {/* Discount */}
 <td className="bg-app py-3 text-right">
 <div className="flex items-center justify-end gap-2">
 <input
 type="number"
 value={item.discount ?? 0}
 onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
 className="w-20 bg-sunken border border-line dark:border-line rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-brand-500/20 transition-all"
 />
 <DiscountTypeToggle
 discountType={item.discountType}
 onToggle={() => updateItem(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
 />
 </div>
 </td>
 {/* Total */}
 <td className="bg-app py-3 text-right font-bold text-ink pr-3 text-sm">
 <p className="text-sm font-bold text-ink">
 {formatCurrency(calculateLineTotal(item))}
 </p>
 </td>
 {/* Delete */}
 <td className="bg-app rounded-r-xl py-3 pr-3">
 <button
 onClick={() => removeItem(item.id)}
 className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
 >
 <Trash2 size={16} />
 </button>
 </td>
 </tr>
 );
};

export const StickyAddButton = ({ addItem }) => {
 return (
 <div className="shrink-0 px-4 py-3 border-t border-line bg-surface">
 <button
 onClick={addItem}
 className="w-full flex items-center justify-center gap-2 text-brand-600 font-bold text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 py-3 rounded-xl border border-dashed border-brand-200 dark:border-brand-800 transition-all"
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
 <div className={`rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? 'w-16 h-16 text-xl' : textSize >= 3 ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-lg'}`}>
 {customer.name.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-white font-bold truncate ${textSize >= 4 ? 'text-lg' : textSize >= 3 ? 'text-base' : 'text-sm'}`}>{customer.name}</p>
 <p className={`text-ink-muted font-medium ${textSize >= 4 ? 'text-sm' : textSize >= 3 ? 'text-xs' : 'text-2xs'}`}>{customer.phone || 'No Phone'}</p>
 </div>
 <button
 onClick={() => { patchInvoice({ customer: null }); setCustomerSearch(''); }}
 className="text-ink-secondary hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
 >
 <X size={16} />
 </button>
 </div>
 {/* Balance & Address */}
 <div className={`space-y-1 bg-neutral-800/30 rounded-lg p-2 ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>
 <div className="flex justify-between items-center">
 <span className="text-ink-muted font-medium">Balance:</span>
 <span className={`font-bold ${customer.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
 {customer.current_balance >= 0 ? (getCurrencySymbol()) + ' ' : '- ' + (getCurrencySymbol()) + ''}{Math.abs(customer.current_balance || 0).toLocaleString()}
 </span>
 </div>
 <div className="flex justify-between items-start gap-2">
 <span className="text-ink-muted font-medium shrink-0">Address:</span>
 <span className={`text-right ${customer.address ? 'text-neutral-300' : 'text-ink-secondary italic'}`}>
 {customer.address || 'Not set'}
 </span>
 </div>
 </div>
 </div>
 );
};

export const NoCustomerPlaceholder = ({ textSize }) => {
 return (
 <div className="text-center py-4 border border-dashed border-neutral-700 rounded-xl">
 <div className="w-10 h-10 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-2 text-ink-muted">
 <User size={20} />
 </div>
 <p className={`text-ink-muted font-bold ${textSize >= 3 ? 'text-sm' : 'text-xs'}`}>No Customer Selected</p>
 </div>
 );
};

export const InvoiceMetaData = ({ currentInvoice, patchInvoice }) => {
 return (
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Invoice #</label>
 <input
 type="text"
 value={currentInvoice.invoiceNumber || ''}
 onChange={(e) => patchInvoice({ invoiceNumber: e.target.value })}
 className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
 placeholder="INV-000001"
 />
 </div>
 <div>
 <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Date</label>
 <input
 type="date"
 value={currentInvoice.date || ''}
 onChange={(e) => patchInvoice({ date: e.target.value })}
 className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
 />
 </div>
 </div>
 );
};

export const InvoiceTermsSelect = ({ currentInvoice, patchInvoice }) => {
 return (
 <div>
 <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Terms</label>
 <select
 value={currentInvoice.paymentTerms || 'net30'}
 onChange={(e) => patchInvoice({ paymentTerms: e.target.value })}
 className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
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
 <div className="grid grid-cols-2 gap-2 p-2 bg-brand-500/10 rounded-lg border border-brand-500/30 animate-in slide-in-from-top-2">
 <div className="col-span-2">
 <p className="text-2xs text-brand-400 font-bold uppercase mb-2 flex items-center gap-1">
 <Wallet size={12} /> CHEQUE DETAILS
 </p>
 </div>
 <div>
 <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Cheque No</label>
 <input
 type="text"
 value={currentInvoice.paymentReference || ''}
 onChange={(e) => patchInvoice({ paymentReference: e.target.value })}
 className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all placeholder-slate-600"
 placeholder="XXXXXX"
 />
 </div>
 <div>
 <label className="text-3xs text-ink-muted font-bold uppercase block mb-1">Cheque Date</label>
 <input
 type="date"
 value={currentInvoice.chequeDate || new Date().toISOString().split('T')[0]}
 onChange={(e) => patchInvoice({ chequeDate: e.target.value })}
 className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-brand-500/20 focus:border-brand-500 transition-all"
 />
 </div>
 </div>
 );
};

export const FinancialSummary = ({ subtotal, itemDiscounts }) => {
 return (
 <div className="space-y-2 pt-3 border-t border-neutral-800/50">
 <div className="flex justify-between items-center">
 <span className="text-xs text-ink-muted font-bold">Subtotal</span>
 <span className="text-white font-bold text-base">{getCurrencySymbol()} {subtotal.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs text-ink-muted font-bold">Item Discounts</span>
 <span className="text-red-400 font-bold text-sm">- {getCurrencySymbol()} {itemDiscounts.toLocaleString()}</span>
 </div>
 </div>
 );
};

export const GlobalDiscountInput = ({ currentInvoice, patchInvoice }) => {
 return (
 <div className="flex items-center justify-between bg-neutral-800/30 rounded-xl p-3 border border-neutral-700/50">
 <span className="text-xs text-ink-muted font-bold">Invoice Discount</span>
 <div className="flex items-center gap-2">
 <span className="text-ink-muted text-xs">{getCurrencySymbol()}</span>
 <input
 type="number"
 value={currentInvoice.discount ?? 0}
 onChange={(e) => patchInvoice({ discount: parseFloat(e.target.value) || 0 })}
 className="w-20 bg-neutral-700/50 border border-neutral-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-brand-500/20 transition-all"
 placeholder="0"
 />
 </div>
 </div>
 );
};

export const GlobalTaxInput = ({ currentInvoice, patchInvoice }) => {
 return (
 <div className="flex items-center justify-between bg-neutral-800/30 rounded-xl p-3 border border-neutral-700/50">
 <span className="text-xs text-ink-muted font-bold">Tax</span>
 <div className="flex items-center gap-2">
 <input
 type="number"
 value={currentInvoice.tax ?? 0}
 onChange={(e) => patchInvoice({ tax: parseFloat(e.target.value) || 0 })}
 className="w-16 bg-neutral-700/50 border border-neutral-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-brand-500/20 transition-all"
 placeholder="0"
 />
 <span className="text-ink-muted text-xs">%</span>
 </div>
 </div>
 );
};

export const DeliveryChargeInput = ({ currentInvoice, patchInvoice, showDeliveryCharges }) => {
 if (!showDeliveryCharges) return null;

 return (
 <div className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
 <span className="text-xs text-ink-muted font-bold group-hover:text-ink-muted">Delivery Charges</span>
 <div className="flex items-center gap-2">
 <span className="text-ink-secondary text-2xs">Rs</span>
 <input
 type="number"
 value={currentInvoice.delivery_charge ?? 0}
 onChange={(e) => patchInvoice({ delivery_charge: parseFloat(e.target.value) || 0 })}
 className="w-20 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
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
 <div className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
 <div className="flex items-center gap-1">
 <input
 type="text"
 value={currentInvoice.extra_charge_label ?? ''}
 onChange={(e) => patchInvoice({ extra_charge_label: e.target.value })}
 className="bg-transparent border-none p-0 text-xs text-ink-muted font-bold w-20 group-hover:text-ink-muted focus:ring-0"
 placeholder="Extra"
 />
 <span className="text-2xs text-ink-secondary">{"\u270E"}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-ink-secondary text-2xs">{getCurrencySymbol()}</span>
 <input
 type="number"
 value={currentInvoice.extra_charge_value ?? 0}
 onChange={(e) => patchInvoice({ extra_charge_value: parseFloat(e.target.value) || 0 })}
 className="w-20 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
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
 <div key={field.id || idx} className="flex items-center justify-between p-2 hover:bg-interactive-hover rounded-lg transition-colors group">
 <div className="flex items-center gap-1">
 <input
 type="text"
 value={field.label ?? ''}
 onChange={(e) => {
 const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
 updated[idx] = { ...updated[idx], label: e.target.value };
 patchInvoice({ extraFields: updated });
 }}
 className="bg-transparent border-none p-0 text-xs text-ink-muted font-bold w-20 group-hover:text-ink-muted focus:ring-0"
 placeholder={`Extra ${idx + 1}`}
 />
 <span className="text-2xs text-ink-secondary">{"\u270E"}</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-ink-secondary text-2xs">{getCurrencySymbol()}</span>
 <input
 type="number"
 value={field.value ?? 0}
 onChange={(e) => {
 const updated = [...(currentInvoice.extraFields || [{ id: 1, label: '', value: 0 }])];
 updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
 patchInvoice({ extraFields: updated });
 }}
 className="w-16 bg-transparent border-b border-dashed border-neutral-700 hover:border-brand-500 transition-all text-xs font-bold text-neutral-300 text-right focus:ring-0 focus:border-brand-500"
 placeholder="0"
 />
 {(currentInvoice.extraFields || []).length > 1 && (
 <button
 onClick={() => {
 const updated = (currentInvoice.extraFields || []).filter((_, i) => i !== idx);
 patchInvoice({ extraFields: updated });
 }}
 className="text-ink-secondary hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all"
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
 className="w-full text-center text-2xs text-brand-400 hover:text-brand-300 font-bold py-1 hover:bg-brand-900/20 rounded-lg transition-all"
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
 <span className="text-emerald-600 text-xs">{getCurrencySymbol()}</span>
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
 <p className="text-xl font-bold text-ink">
 {formatCurrency(balanceDue)}
 </p>
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
 <div className="p-3 bg-neutral-900 space-y-2 shrink-0 border-t border-neutral-800">
 <div className="flex justify-between items-center">
 <span className="text-2xs text-ink-muted font-bold uppercase">Total</span>
 <span className="text-2xl font-bold text-white">{getCurrencySymbol()} {grandTotal.toLocaleString()}</span>
 </div>
 <div className="space-y-2">
 <button
 onClick={() => initiateSave(false)}
 disabled={saving}
 className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
 >
 <CheckCircle2 size={16} />
 {saving ? 'SAVING...' : (isEditMode ? 'UPDATE SALE' : 'COMPLETE SALE')}
 </button>

 <div className="flex gap-2">
 <button
 onClick={() => initiateSave(true)}
 disabled={saving}
 className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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
 <div className="w-80 bg-void-700 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-neutral-800">
 {children}
 </div>
 );
};

export const CustomerSummarySection = ({ currentInvoice, patchInvoice, setCustomerSearch, textSize }) => {
 return (
 <div className="p-4 border-b border-neutral-800/50 bg-neutral-900/30 shrink-0">
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
 <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-normal">
 <div className="bg-neutral-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-neutral-700 flex items-center gap-6">
 <div className="flex items-center gap-3">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
 <TrendingUp size={24} className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
 </div>
 <div>
 <p className="text-xs text-ink-muted font-bold uppercase">Profit Margin</p>
 <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
 <p className="text-lg font-bold text-emerald-600">
 {formatCurrency(profit)}
 </p>
 </p>
 </div>
 </div>
 {grandTotal > 0 && (
 <div className="border-l border-neutral-700 pl-6">
 <p className="text-xs text-ink-muted font-bold uppercase">Margin %</p>
 <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
 {((profit / grandTotal) * 100).toFixed(1)}%
 </p>
 </div>
 )}
 <p className="text-xs text-ink-muted italic">↓ Drag down for details</p>
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

 <h3 className="text-xl font-bold text-ink mb-2">Transaction Successful</h3>
 <p className="text-ink-muted text-sm mb-8">The receipt has been generated and stock updated.</p>

 <div className="grid grid-cols-1 gap-3 w-full">
 <button
 onClick={onPrintReceipt}
 className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl "
 >
 <Printer size={20} /> PRINT RECEIPT
 </button>

 <button
 onClick={onNewTransaction}
 className="w-full py-4 bg-sunken text-ink-secondary rounded-2xl font-bold hover:bg-interactive-hover transition-all"
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
 <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-drawer flex items-center justify-center p-4">
 <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-slow">
 <div className="p-8 border-b border-line flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800/50 dark:to-neutral-900">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl ">
 <ScanBarcode size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-ink">Scanning Mode</h2>
 <p className="text-sm text-ink-muted font-bold">Scan items one after another</p>
 </div>
 </div>
 <button onClick={() => setIsScanning(false)} className="p-4 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-2xl transition-all">
 <X size={28} className="text-ink-muted" />
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
 className="w-full py-8 px-10 bg-app border-4 border-brand-100 dark:border-brand-900/30 rounded-xl text-3xl font-bold text-center focus:ring-8 ring-brand-500/10 placeholder-slate-200 transition-all"
 />
 <div className="absolute right-8 top-1/2 -translate-y-1/2">
 <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
 </div>
 </div>

 <div className="max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2">
 {scannedItems.length === 0 ? (
 <div className="text-center py-16 border-4 border-dashed border-line rounded-2xl">
 <Package size={64} className="mx-auto text-neutral-200 mb-4" />
 <p className="text-ink-muted font-bold text-lg">No items scanned yet</p>
 </div>
 ) : (
 scannedItems.map((item, idx) => (
 <div key={item.id} className="flex items-center justify-between p-5 bg-app rounded-2xl border-2 border-line animate-in slide-in-from-bottom-2 duration-normal">
 <div className="flex items-center gap-5">
 <span className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center text-xs font-bold text-ink-muted shadow-sm">{idx + 1}</span>
 <div>
 <p className="font-bold text-ink text-lg">
 {item.name}
 {item.quantity > 1 && <span className="ml-2 text-emerald-500 text-base">x{item.quantity}</span>}
 </p>
 <p className="text-sm text-brand-500 font-bold">
 {item.quantity} @ {getCurrencySymbol()} {item.price.toLocaleString()} = {getCurrencySymbol()} {(item.quantity * item.price).toLocaleString()}
 </p>
 </div>
 </div>
 <button onClick={() => setScannedItems(prev => prev.filter(i => i.id !== item.id))} className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
 <Trash2 size={24} />
 </button>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="p-8 bg-app flex items-center justify-between border-t border-line">
 <p className="text-base font-bold text-ink-muted uppercase tracking-widest">Total: <span className="text-brand-600">{scannedItems.length} items</span></p>
 <div className="flex gap-4">
 <button onClick={() => setScannedItems([])} className="px-8 py-4 text-sm font-bold text-ink-muted hover:text-red-500 transition-colors uppercase tracking-widest">Clear All</button>
 <button
 onClick={confirmScan}
 className="bg-brand-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-700 transition-all active:scale-95 uppercase tracking-widest"
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
 <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-drawer flex items-center justify-center p-4">
 <div className="bg-surface rounded-2xl shadow-2xl border border-line w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[80vh]">
 {/* Header */}
 <div className="p-4 border-b border-line flex justify-between items-center bg-app shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
 <TrendingUp className="text-emerald-600" size={20} />
 </div>
 <div>
 <h3 className="text-lg font-bold text-ink">Profit Analysis</h3>
 <p className="text-xs text-ink-muted">Per-item breakdown</p>
 </div>
 </div>
 <button
 onClick={() => { setShowProfitModal(false); setProfitLocked(false); setShowProfit(false); }}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-all"
 >
 <X size={20} className="text-ink-muted" />
 </button>
 </div>

 {/* Items Table */}
 <div className="flex-1 overflow-y-auto p-4">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-left text-2xs font-bold text-ink-muted uppercase border-b border-line">
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
 <tr key={item.id} className="border-b border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover">
 <td className="py-2 pl-2 text-ink-muted text-xs">{idx + 1}</td>
 <td className="py-2">
 <p className="font-bold text-ink text-xs">{item.product?.name || item.name}</p>
 <p className="text-2xs text-ink-muted">{item.product?.sku || 'N/A'}</p>
 </td>
 <td className="py-2 text-center text-xs">{item.quantity}</td>
 <td className="py-2 text-right text-xs text-ink-muted">{getCurrencySymbol()} {cost.toLocaleString()}</td>
 <td className="py-2 text-right text-xs">{getCurrencySymbol()} {item.price.toLocaleString()}</td>
 <td className="py-2 text-right">
 <span className={`text-xs font-bold ${parseFloat(marginPercent) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
 {marginPercent}%
 </span>
 </td>
 <td className="py-2 text-right pr-2">
 <span className={`text-xs font-bold ${lineProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
 {getCurrencySymbol()} {lineProfit.toLocaleString()}
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>

 {currentInvoice.items.filter(item => item.product).length === 0 && (
 <div className="text-center py-8 text-ink-muted">
 <p className="text-sm">No products added yet</p>
 </div>
 )}
 </div>

 {/* Summary Footer */}
 <div className="p-4 bg-app border-t border-line shrink-0">
 <div className="grid grid-cols-3 gap-4">
 <div className="bg-surface rounded-xl p-3 border border-line">
 <p className="text-2xs text-ink-muted font-bold uppercase mb-1">Total Cost</p>
 <p className="text-lg font-bold text-ink-secondary">{getCurrencySymbol()} {totalCost.toLocaleString()}</p>
 </div>
 <div className="bg-surface rounded-xl p-3 border border-line">
 <p className="text-2xs text-ink-muted font-bold uppercase mb-1">Total Revenue</p>
 <p className="text-lg font-bold text-ink">{getCurrencySymbol()} {grandTotal.toLocaleString()}</p>
 </div>
 <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
 <p className="text-2xs text-emerald-600 font-bold uppercase mb-1">Net Profit</p>
 <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
 <p className="text-lg font-bold text-emerald-600">
 {formatCurrency(profit)}
 </p>
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
 <div className="flex items-center justify-between p-3 bg-app rounded-xl">
 <div className="flex items-center gap-3">
 <Icon size={18} className={iconColor} />
 <div>
 <p className="text-sm font-bold text-ink-secondary dark:text-white">{label}</p>
 <p className="text-xs text-ink-muted">{sublabel}</p>
 </div>
 </div>
 <button
 onClick={onToggle}
 className={`w-12 h-6 rounded-full transition-all ${isActive ? 'bg-brand-500' : 'bg-sunken'}`}
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
 className="fixed inset-0 bg-black/30 backdrop-blur-sm z-drawer animate-in fade-in duration-normal"
 onClick={() => setShowSettingsDrawer(false)}
 />
 {/* Drawer */}
 <div className="fixed top-0 right-0 h-full w-80 bg-surface shadow-2xl z-drawer animate-in slide-in-from-right duration-slow flex flex-col">
 {/* Header */}
 <div className="p-4 border-b border-line flex items-center justify-between bg-app">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-sunken flex items-center justify-center">
 <Settings size={20} className="text-ink-secondary" />
 </div>
 <div>
 <h3 className="font-bold text-ink">Quick Settings</h3>
 <p className="text-xs text-ink-muted">Invoice preferences</p>
 </div>
 </div>
 <button
 onClick={() => setShowSettingsDrawer(false)}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-all"
 >
 <X size={20} className="text-ink-muted" />
 </button>
 </div>

 {/* Settings Content */}
 <div className="flex-1 p-4 space-y-4 overflow-y-auto">
 {/* Display Settings */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Display</h4>

 {/* Large Text Mode */}
 <div className="flex items-center justify-between p-3 bg-app rounded-xl">
 <div className="flex items-center gap-3">
 <Type size={18} className="text-brand-500" />
 <div>
 <p className="text-sm font-bold text-ink-secondary dark:text-white">Large Text</p>
 <p className="text-xs text-ink-muted">Bigger fonts for better visibility</p>
 </div>
 </div>
 <div className="flex bg-sunken rounded-lg p-1">
 {[1, 2, 3, 4, 5].map(s => (
 <button
 key={s}
 onClick={() => setTextSize(s)}
 className={`w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200'}`}
 >
 {s}
 </button>
 ))}
 </div>
 </div>

 {/* Show Quick Entry */}
 <SettingsDrawerToggleItem
 icon={Zap}
 iconColor="text-brand-500"
 label="Quick Entry"
 sublabel="Fast product entry row"
 isActive={showQuickEntry}
 onToggle={() => setShowQuickEntry(!showQuickEntry)}
 />
 </div>

 {/* Invoice Settings */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Permanent Defaults</h4>

 {/* Permanent Delivery */}
 <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl space-y-2 border border-brand-100 dark:border-brand-800/50">
 <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">Default Delivery</p>
 <div className="flex items-center gap-2">
 <span className="text-ink-muted text-xs font-bold">Rs</span>
 <input
 type="number"
 value={defaultDelivery}
 onChange={(e) => setDefaultDelivery(parseFloat(e.target.value) || 0)}
 className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-sm font-bold text-ink-secondary dark:text-white"
 placeholder="0"
 />
 </div>
 </div>

 {/* Permanent Extra */}
 <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl space-y-2 border border-brand-100 dark:border-brand-800/50">
 <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">Default Extra Field</p>
 <div className="space-y-2">
 <input
 type="text"
 value={defaultExtraLabel}
 onChange={(e) => setDefaultExtraLabel(e.target.value)}
 className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-xs font-bold text-ink-secondary dark:text-white"
 placeholder="Field Name (e.g. Service)"
 />
 <div className="flex items-center gap-2">
 <span className="text-ink-muted text-xs font-bold">Rs</span>
 <input
 type="number"
 value={defaultExtraValue}
 onChange={(e) => setDefaultExtraValue(parseFloat(e.target.value) || 0)}
 className="w-full bg-surface border border-line rounded-lg px-2 py-1.5 text-sm font-bold text-ink-secondary dark:text-white"
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
 <p className="text-sm font-bold text-ink-secondary dark:text-white">Multiple Extra Fields</p>
 <p className="text-2xs text-ink-muted">Add up to 10 custom charges</p>
 </div>
 </div>
 <button
 onClick={() => setEnableMultipleExtras(!enableMultipleExtras)}
 className={`w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? 'bg-amber-500' : 'bg-sunken'}`}
 >
 <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? 'translate-x-6' : 'translate-x-0.5'}`} />
 </button>
 </div>
 </div>
 </div>

 {/* Show/Hide Fields */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Show/Hide Fields</h4>

 <SettingsDrawerToggleItem
 icon={Package}
 iconColor="text-brand-500"
 label="Delivery Charges"
 sublabel="Show delivery charges field"
 isActive={showDeliveryCharges}
 onToggle={() => setShowDeliveryCharges(!showDeliveryCharges)}
 />

 <SettingsDrawerToggleItem
 icon={Plus}
 iconColor="text-brand-500"
 label="Extra Field"
 sublabel="Show extra charge field(s)"
 isActive={showExtraField}
 onToggle={() => setShowExtraField(!showExtraField)}
 />
 </div>

 {/* Invoice Logic */}
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wide">Invoice Logic</h4>

 {/* Default Payment Method */}
 <div className="p-3 bg-app rounded-xl space-y-2">
 <p className="text-sm font-bold text-ink-secondary dark:text-white">Payment Method</p>
 <div className="flex gap-2">
 <button
 onClick={() => patchInvoice({ paymentMethod: 'credit' })}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'credit'
 ? 'bg-emerald-500 text-white'
 : 'bg-sunken text-ink-secondary border border-line dark:border-line'
 }`}
 >
 Credit
 </button>
 <button
 onClick={() => patchInvoice({ paymentMethod: 'cash' })}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === 'cash'
 ? 'bg-orange-500 text-white'
 : 'bg-sunken text-ink-secondary border border-line dark:border-line'
 }`}
 >
 Cash
 </button>
 </div>
 </div>

 {/* Default Tax */}
 <div className="p-3 bg-app rounded-xl space-y-2">
 <p className="text-sm font-bold text-ink-secondary dark:text-white">Default Tax Rate</p>
 <div className="flex gap-2">
 {[0, 5, 10, 17].map(rate => (
 <button
 key={rate}
 onClick={() => patchInvoice({ tax: rate })}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.tax === rate
 ? 'bg-brand-500 text-white'
 : 'bg-sunken text-ink-secondary border border-line dark:border-line'
 }`}
 >
 {rate}%
 </button>
 ))}
 </div>
 </div>

 {/* Payment Terms */}
 <div className="p-3 bg-app rounded-xl space-y-2">
 <p className="text-sm font-bold text-ink-secondary dark:text-white">Payment Terms</p>
 <select
 value={currentInvoice.paymentTerms || 'net30'}
 onChange={(e) => patchInvoice({ paymentTerms: e.target.value })}
 className="w-full bg-sunken border border-line dark:border-line rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ring-brand-500/20"
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
 <div className="p-4 border-t border-line bg-app">
 <button
 onClick={() => setShowSettingsDrawer(false)}
 className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-ink rounded-xl font-bold text-sm hover:opacity-90 transition-all"
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
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal"
 onClick={() => setShowOverpaymentModal(false)}
 />
 {/* Modal */}
 <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
 <div className="bg-white dark:bg-void-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-normal border border-line">
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
 <div className="p-6 space-y-5 bg-gradient-to-b from-white to-neutral-50 dark:from-void-700 dark:to-void-800">
 <div className="text-center py-2">
 <p className="text-ink-muted text-sm mb-2 font-medium">
 {overpaymentDetails.customerName} paid
 </p>
 <p className="text-5xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
 {getCurrencySymbol()} {overpaymentDetails.amount.toLocaleString()}
 </p>
 <p className="text-ink-muted text-sm mt-2 font-medium">more than the total</p>
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
 className="w-full p-4 rounded-xl border-2 border-line hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group text-left flex items-center gap-4"
 >
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-transform border border-amber-200 dark:border-amber-800/50">
 <ArrowLeftRight size={24} />
 </div>
 <div className="flex-1">
 <p className="font-bold text-ink">Give Change</p>
 <p className="text-sm text-ink-muted">
 Return {getCurrencySymbol()} {overpaymentDetails.amount.toLocaleString()} to customer
 </p>
 </div>
 </button>

 {/* Option 2: Credit to Ledger */}
 <button
 onClick={() => {
 setShowOverpaymentModal(false);
 processSale(true, tempPrintIntent);
 }}
 className="w-full p-4 rounded-xl border-2 border-line hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group text-left flex items-center gap-4"
 >
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-transform border border-emerald-200 dark:border-emerald-800/50">
 <Wallet size={24} />
 </div>
 <div className="flex-1">
 <p className="font-bold text-ink">Credit to Ledger</p>
 <p className="text-sm text-ink-muted">
 Save {getCurrencySymbol()} {overpaymentDetails.amount.toLocaleString()} to {overpaymentDetails.customerName}'s account
 </p>
 </div>
 </button>
 </div>
 </div>

 {/* Footer */}
 <div className="p-4 bg-sunken/50 dark:bg-app border-t border-line">
 <button
 onClick={() => setShowOverpaymentModal(false)}
 className="w-full py-2.5 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300 font-semibold text-sm transition-colors hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 </>
 );
};

