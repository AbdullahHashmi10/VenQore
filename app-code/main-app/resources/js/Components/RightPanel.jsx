import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import PaymentModal from '@/Components/PaymentModal';
import {
 Wallet,
 MoreHorizontal,
 Landmark,
 ArrowDownRight,
 ArrowUpRight,
 Plus,
 X,
 FileText,
 RefreshCw,
 Box,
 Tag,
 UserPlus,
 FileMinus,
 LogOut,
 Truck,
 Shield,
 BarChart2
} from 'lucide-react';

const ActionMenu = ({ isOpen, onClose, store, onAction }) => {
 if (!isOpen) return null;

 const actions = [
 { label: 'Payment In', icon: ArrowDownRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: 'store.payments.in' },
 { label: 'Payment Out', icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-500/10', route: 'store.payments.out' },
 { label: 'New Quote', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', route: 'store.proposals.create' },
 { label: 'Transfer Stock', icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-500/10', route: 'store.stock-transfers.create' },
 { label: 'Add Product', icon: Box, color: 'text-brand-500', bg: 'bg-brand-500/10', route: 'store.inventory.create' },
 { label: 'Add Category', icon: Tag, color: 'text-brand-500', bg: 'bg-brand-500/10', route: 'store.categories.index' },
 { label: 'Add User', icon: UserPlus, color: 'text-brand-500', bg: 'bg-brand-500/10', route: 'store.admin.users' },
 { label: 'Expense', icon: FileMinus, color: 'text-red-500', bg: 'bg-red-500/10', route: 'store.expenses.index' },
 { label: 'Refund', icon: LogOut, color: 'text-yellow-500', bg: 'bg-yellow-500/10', route: 'store.returns.create' },
 { label: 'Supplier', icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', route: 'store.parties.index' },
 ];

 return (
 <div className="absolute top-full mt-2 right-0 w-64 bg-surface rounded-2xl shadow-2xl border border-line p-2 z-50 animate-in fade-in slide-in-from-top-4 duration-normal">
 <div className="flex justify-between items-center px-3 py-2 border-b border-line mb-2">
 <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Quick Actions</span>
 <button onClick={onClose} className="text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200"><X size={14} /></button>
 </div>
 <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto custom-scrollbar">
 {actions.map((action, i) => (
 <button
 key={i}
 onClick={() => {
 if (action.label === 'Payment In') {
 onAction('payment-in');
 } else if (action.label === 'Payment Out') {
 onAction('payment-out');
 } else if (action.route) {
 router.visit(route(action.route, { 
 store_slug: store?.slug,
 ...(action.params || {})
 }));
 }
 onClose();
 }}
 className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group"
 >
 <div className={`p-2 rounded-lg mb-1 transition-transform ${action.bg} ${action.color}`}>
 <action.icon size={18} />
 </div>
 <span className="text-2xs font-medium text-ink-secondary text-center leading-tight">{action.label}</span>
 </button>
 ))}
 </div>
 </div>
 );
};

const CashDetailModal = ({ isOpen, onClose, transactions, onNavigate, store }) => {
 if (!isOpen) return null;

 const currencySymbol = getCurrencySymbol(store);

 return (
 <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal">
 <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-line overflow-hidden" onClick={e => e.stopPropagation()}>
 <div className="p-4 border-b border-line flex justify-between items-center">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
 <Wallet size={18} />
 </div>
 <h3 className="font-bold text-ink">Cash in Hand</h3>
 </div>
 <button onClick={onClose} className="p-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted"><X size={18} /></button>
 </div>

 <div className="p-4 bg-app">
 <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Cash Activity (Chronological)</h4>
 <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
 {transactions && transactions.length > 0 ? transactions.map((tx, i) => (
 <div key={tx.id || i} className="flex justify-between items-center text-sm p-2 bg-surface rounded-lg border border-line">
 <div>
 <p className="font-medium text-ink-secondary dark:text-ink truncate max-w-[170px]">{tx.desc}</p>
 <p className="text-2xs text-ink-muted">{new Date(tx.date).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
 </div>
 <span className={`font-bold ${tx.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
 {tx.type === 'in' ? '+' : '-'} {currencySymbol} {Math.abs(parseFloat(tx.amount)).toLocaleString()}
 </span>
 </div>
 )) : (
 <p className="text-center text-xs text-ink-muted py-4">No recent history.</p>
 )}
 </div>
 </div>

 <div className="p-4 grid grid-cols-4 gap-2">
 <button onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group">
 <ArrowDownRight size={18} className="text-emerald-500 transition-transform" />
 <span className="text-3xs font-bold text-emerald-600 dark:text-emerald-400">Add</span>
 </button>
 <button onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors group">
 <ArrowUpRight size={18} className="text-red-500 transition-transform" />
 <span className="text-3xs font-bold text-red-600 dark:text-red-400">Remove</span>
 </button>
 <button onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors group">
 <RefreshCw size={18} className="text-blue-500 transition-transform" />
 <span className="text-3xs font-bold text-blue-600 dark:text-blue-400">Transfer</span>
 </button>
 <button onClick={() => { onNavigate('store.funds.index', { view: 'history' }); onClose(); }} className="flex flex-col items-center gap-1 p-3 bg-sunken rounded-2xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
 <FileText size={18} className="text-ink-muted transition-transform" />
 <span className="text-3xs font-bold text-ink-secondary">History</span>
 </button>
 </div>
 </div>
 </div>
 );
};

const RightPanel = ({ recentTransactions, bankAccounts = [], cashAccounts = [], cashData, inventoryValue = 0 }) => {
 const { store, auth } = usePage().props;
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [isSettingsOpen, setIsSettingsOpen] = useState(false);
 const [isCashModalOpen, setIsCashModalOpen] = useState(false);
 const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: 'in' });

 const menuRef = useRef(null);
 const settingsRef = useRef(null);

 const userPerms = auth?.user?.permissions || [];
 const canViewBalances = auth?.user?.is_platform_admin || userPerms.includes('*') || userPerms.includes('finance.balances');

 // Calc Total: cashData.balance + sum(banks) + sum(cashAccounts if any separate)
 // We assume cashData covers GL 1000. cashAccounts might be duplicate if they are sub-accounts.
 // For safety, let's just sum banks + cashData.balance.
 const glBalance = parseFloat(cashData?.balance || 0);
 const bankBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
 const totalBalance = canViewBalances ? glBalance + bankBalance : 0;

 const formatMoney = (amount) => formatCurrency(parseFloat(amount), store);

 
 const handleNavigate = (r, params = {}) => router.visit(route(r, { ...params, store_slug: store?.slug }));

 useEffect(() => {
 function handleClickOutside(event) {
 if (menuRef.current && !menuRef.current.contains(event.target)) {
 setIsMenuOpen(false);
 }
 if (settingsRef.current && !settingsRef.current.contains(event.target)) {
 setIsSettingsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, [menuRef, settingsRef]);

 return (
 <div className="bg-neutral-900 text-white rounded-lg p-6 flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-white/10">
 {/* Mesh Gradient Background */}
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
 <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>

 <CashDetailModal
 isOpen={isCashModalOpen}
 onClose={() => setIsCashModalOpen(false)}
 transactions={cashData?.transactions || []}
 onNavigate={handleNavigate}
 store={store}
 />

 <PaymentModal
 isOpen={paymentModal.isOpen}
 onClose={() => setPaymentModal(p => ({ ...p, isOpen: false }))}
 type={paymentModal.type}
 bankAccounts={bankAccounts}
 store={store}
 />

 {/* Header */}
 <div className="relative z-30 flex justify-between items-center mb-8">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
 <Wallet size={18} className="text-white" />
 </div>
 <div>
 <p className="text-xs text-neutral-300 font-medium">Total Balance</p>
 <h3 className="text-xl font-bold tracking-tight">
 {canViewBalances ? formatMoney(totalBalance) : 'Restricted'}
 </h3>
 </div>
 </div>
 <div className="relative" ref={settingsRef}>
 <button
 onClick={() => setIsSettingsOpen(!isSettingsOpen)}
 className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm ${isSettingsOpen ? 'bg-white/20' : ''}`}
 >
 <MoreHorizontal size={20} className="text-neutral-300" />
 </button>

 {isSettingsOpen && (
 <div className="absolute top-12 right-0 w-48 bg-neutral-800 rounded-xl shadow-xl border border-neutral-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-normal">
 <button className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-interactive-hover hover:text-white rounded-lg transition-colors">View Profile</button>
 <button className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-interactive-hover hover:text-white rounded-lg transition-colors">Account Settings</button>
 <div className="h-px bg-neutral-700 my-1"></div>
 <button className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Sign Out</button>
 </div>
 )}
 </div>
 </div>

 {/* The 3 Main Buttons */}
 <div className="relative z-20 mb-8" ref={menuRef}>
 <div className="grid grid-cols-3 gap-2 h-20">
 <button onClick={() => router.visit(route('store.sales.invoice.create', { store_slug: store?.slug }))} className="col-span-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm">
 <div className="p-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><ArrowDownRight size={18} /></div>
 <span className="text-2xs font-bold tracking-wider">SALE</span>
 </button>
 <button onClick={() => router.visit(route('store.purchases.create', { store_slug: store?.slug }))} className="col-span-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm">
 <div className="p-1.5 rounded-full bg-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-colors"><ArrowUpRight size={18} /></div>
 <span className="text-2xs font-bold tracking-wider">PURCHASE</span>
 </button>
 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`col-span-1 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/50 text-brand-400 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group backdrop-blur-sm ${isMenuOpen ? 'bg-brand-500/20 ring-2 ring-brand-500/30' : ''}`}>
 <div className="p-1.5 rounded-full bg-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-colors"><Plus size={18} /></div>
 <span className="text-2xs font-bold tracking-wider">ACTIONS</span>
 </button>
 </div>
 <ActionMenu 
 isOpen={isMenuOpen} 
 onClose={() => setIsMenuOpen(false)} 
 store={store} 
 onAction={(act) => {
 if (act === 'payment-in') {
 setPaymentModal({ isOpen: true, type: 'in' });
 } else if (act === 'payment-out') {
 setPaymentModal({ isOpen: true, type: 'out' });
 }
 }}
 />
 </div>

 {/* Accounts Section */}
 <div className="relative z-10 mb-8 flex-1 content-start space-y-3">

 {/* 1. Cash in Hand (Protected) */}
 {canViewBalances && (
 <div onClick={() => setIsCashModalOpen(true)} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <Wallet size={18} className="text-emerald-300" />
 <span className="text-[12px] font-bold text-neutral-200">Cash in Hand</span>
 </div>
 <span className="text-3xs text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Main</span>
 </div>
 <div>
 <h4 className="text-2xl font-bold tracking-tight text-white mb-1">{formatMoney(glBalance)}</h4>
 <div className="flex items-center gap-2 text-2xs text-emerald-400">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
 Active
 </div>
 </div>
 </div>
 )}

 {/* 1.5 Inventory Value */}
 <div id="tour-stock-value" onClick={() => router.visit(route('store.inventory.index', { store_slug: store?.slug }))} className="bg-brand-500/10 backdrop-blur-md rounded-2xl p-4 border border-brand-500/20 hover:border-brand-500/40 transition-all cursor-pointer group">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <Box size={18} className="text-brand-300" />
 <span className="text-[12px] font-bold text-neutral-200">Stock Value</span>
 </div>
 </div>
 <div>
 <h4 className="text-2xl font-bold tracking-tight text-white mb-1">{formatMoney(inventoryValue)}</h4>
 <div className="flex items-center gap-2 text-2xs text-brand-400">
 <div className="w-1.5 h-1.5 rounded-full bg-brand-400"></div>
 Total Asset Cost
 </div>
 </div>
 </div>

 {/* 2. Bank Accounts List (Protected) */}
 {canViewBalances && (
 bankAccounts.length > 0 ? (
 <div className="space-y-2">
 <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider pl-1">Bank Accounts</p>
 {bankAccounts.map((acc) => (
 <div key={acc.id} onClick={() => handleNavigate('store.bank-accounts.index')} className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-all flex justify-between items-center group cursor-pointer active:scale-[0.99]">
 <div className="flex items-center gap-3">
 <Landmark size={18} className="text-blue-300" />
 <div>
 <p className="text-sm font-bold text-neutral-200">{acc.bank_name || acc.name}</p>
 <p className="text-2xs text-ink-muted">**** {acc.account_number ? acc.account_number.slice(-4) : '....'}</p>
 </div>
 </div>
 <span className="font-bold text-white text-sm">{formatMoney(acc.current_balance)}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-4 rounded-2xl border border-dashed border-neutral-700 bg-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleNavigate('store.bank-accounts.index', { action: 'add' })}>
 <div className="p-2 bg-neutral-800 rounded-full text-ink-muted group-hover:text-brand-400 transition-all">
 <Plus size={16} />
 </div>
 <div>
 <p className="text-xs font-bold text-neutral-300">Add Bank Account</p>
 <p className="text-2xs text-ink-muted">Track your business banking</p>
 </div>
 </div>
 )
 )}
 </div>

 {/* Recent Transactions (Bottom) */}
 <div className="relative z-10 mt-auto bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5 flex flex-col">
 <div className="flex justify-between items-center mb-3 shrink-0">
 <h3 className="font-bold text-xs text-neutral-300 uppercase tracking-wider">Activity</h3>
 <div className="flex items-center gap-2 text-3xs text-ink-muted">
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Sale</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Purchase</span>
 </div>
 </div>
 <div className="p-1 space-y-2">
 {recentTransactions && recentTransactions.length > 0 ? recentTransactions.map((tx, i) => {
 // Determine colors based on activity type
 const activityType = tx.activityType || (tx.type === 'Sale' ? 'sale' : (tx.type === 'Purchase' ? 'purchase' : 'other'));

 const colorMap = {
 sale: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500', amountColor: 'text-emerald-400' },
 return: { bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-500', amountColor: 'text-rose-400' },
 purchase: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500', amountColor: 'text-amber-400' },
 payment_in: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', amountColor: 'text-emerald-400' },
 payment_out: { bg: 'bg-brand-500/20', text: 'text-brand-400', dot: 'bg-brand-500', amountColor: 'text-brand-400' },
 expense: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500', amountColor: 'text-red-400' },
 other: { bg: 'bg-neutral-500/20', text: 'text-ink-muted', dot: 'bg-neutral-500', amountColor: 'text-neutral-300' }
 };

 const colors = colorMap[activityType] || colorMap.other;
 // Return is actually outgoing value, so it shouldn't be green like Sale
 const isIncoming = tx.amount?.startsWith('+') || activityType === 'sale' || activityType === 'payment_in';
 const isReturn = activityType === 'return';

 const handleActivityClick = () => {
 if (!tx.reference_id || !tx.reference_type) return;

 if (tx.reference_type === 'sale' || activityType === 'sale' || activityType === 'return') {
 router.visit(route('store.sales.show', { store_slug: store?.slug, sale: tx.reference_id }));
 } else if (tx.reference_type === 'purchase' || activityType === 'purchase') {
 router.visit(route('store.purchases.show', { store_slug: store?.slug, purchase: tx.reference_id }));
 } else if (tx.reference_type === 'expense' || activityType === 'expense') {
 router.visit(route('store.expenses.index', { store_slug: store?.slug }));
 } else if (tx.reference_type === 'fund_transaction' || activityType === 'payment_in' || activityType === 'payment_out') {
 router.visit(route('store.funds.index', { store_slug: store?.slug }));
 }
 };

 return (
 <div key={i}
 onClick={handleActivityClick}
 className="flex items-center justify-between group cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
 >
 <div className="flex items-center gap-3">
 {/* Color-coded activity indicator */}
 <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>
 {isReturn ? <RefreshCw size={12} /> : (isIncoming ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />)}
 </div>
 <div className="flex flex-col">
 <div className="flex items-center gap-1.5">
 {/* Colored Dot */}
 <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
 <span className="text-1xs font-semibold text-white/90">{tx.type}</span>
 </div>
 <span className="text-3xs text-ink-muted leading-none">{tx.time}</span>
 </div>
 </div>
 <span className={`text-1xs font-bold ${isIncoming ? 'text-emerald-400' : colors.amountColor}`}>{tx.amount}</span>
 </div>
 );
 }) : (
 <div className="text-center py-4 text-ink-muted text-xs">
 No recent activity
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default RightPanel;
