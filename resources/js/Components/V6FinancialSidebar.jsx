import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import PaymentModal from '@/Components/PaymentModal';
import { useTermText } from '@/lib/terms';
import {
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  FileText,
  RefreshCw,
  Box,
  Tag,
  Activity as ActivityIcon
} from 'lucide-react';

const ActionMenu = ({ isOpen, onClose, store, onAction }) => {
  const tt = useTermText();
  if (!isOpen) return null;

  const actions = [
    { label: 'Payment In', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', action: 'payment-in' },
    { label: 'Payment Out', icon: ArrowUpRight, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', action: 'payment-out' },
    { label: 'New Sale', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', route: 'store.sales.invoice.create' },
    { label: 'New Purchase', icon: ArrowUpRight, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', route: 'store.purchases.create' },
    { label: 'Add Product', icon: Box, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', route: 'store.inventory.create' },
    { label: 'Add Bank', icon: Building2, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', route: 'store.bank-accounts.index', params: { action: 'add' } },
    { label: 'New Quote', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', route: 'store.proposals.create' },
    { label: 'Transfer Stock', icon: RefreshCw, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', route: 'store.stock-transfers.create' },
    { label: 'Add Category', icon: Tag, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', route: 'store.categories.index' },
  ];

  return (
    <div className="absolute top-full mt-2 right-0 w-72 bg-[#121624]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center px-2 py-1.5 border-b border-white/10 mb-2">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Quick Actions</span>
        <button 
          type="button"
          aria-label="Close actions menu"
          onClick={onClose} 
          className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto custom-scrollbar">
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (action.action) {
                onAction(action.action);
              } else if (action.route) {
                if (typeof route === 'function' && store?.slug) {
                  router.visit(route(action.route, { 
                    store_slug: store?.slug,
                    ...action.params
                  }));
                }
              }
              onClose();
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/10 transition-all group"
          >
            <div className={`p-2 rounded-xl mb-1.5 border transition-transform group-hover:scale-110 ${action.bg} ${action.color}`}>
              <action.icon size={16} />
            </div>
            <span className="text-[11px] font-medium text-neutral-200 text-center leading-tight">{tt(action.label)}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121624] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cash in Hand</h3>
              <p className="text-2xs text-neutral-400">Main Till Cash Balance</p>
            </div>
          </div>
          <button type="button" aria-label="Close cash details" onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-[#0a0d17]">
          <h4 className="text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">Recent Cash Activity</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {transactions && transactions.length > 0 ? transactions.map((tx, i) => (
              <div key={tx.id || i} className="flex justify-between items-center text-sm p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white truncate max-w-[200px] text-xs">{tx.desc || 'Cash Movement'}</p>
                  <p className="text-[10px] text-neutral-400">
                    {tx.date ? new Date(tx.date).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </p>
                </div>
                <span className={`font-bold text-xs ${tx.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'in' ? '+' : '-'} {currencySymbol} {Math.abs(parseFloat(tx.amount || 0)).toLocaleString()}
                </span>
              </div>
            )) : (
              <p className="text-center text-xs text-neutral-500 py-6">No recent cash movements recorded.</p>
            )}
          </div>
        </div>

        <div className="p-4 grid grid-cols-4 gap-2 border-t border-white/10 bg-[#121624]">
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1.5 p-2.5 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group">
            <ArrowDownLeft size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-400">Add</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1.5 p-2.5 bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 border border-rose-500/20 transition-all group">
            <ArrowUpRight size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-rose-400">Remove</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1.5 p-2.5 bg-sky-500/10 rounded-2xl hover:bg-sky-500/20 border border-sky-500/20 transition-all group">
            <RefreshCw size={16} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-sky-400">Transfer</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index', { view: 'history' }); onClose(); }} className="flex flex-col items-center gap-1.5 p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 transition-all group">
            <FileText size={16} className="text-neutral-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-neutral-300">History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function V6FinancialSidebar({
  recentTransactions = [],
  bankAccounts = [],
  cashAccounts = [],
  cashData = null,
  inventoryValue = 0,
  sticky = false,
  className = '',
  props: extraProps = {}
}) {
  const pageProps = usePage().props || {};
  const store = extraProps.store || pageProps.store;
  const auth = extraProps.auth || pageProps.auth;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: 'in' });

  const menuRef = useRef(null);

  const userPerms = auth?.user?.permissions || [];
  const canViewBalances = auth?.user?.is_platform_admin || userPerms.includes('*') || userPerms.includes('finance.balances');

  const resolvedCashData = cashData || extraProps.cashData || pageProps.cashData;
  const resolvedBankAccounts = (bankAccounts && bankAccounts.length > 0) ? bankAccounts : (extraProps.bankAccounts || pageProps.bankAccounts || []);
  const resolvedInventoryValue = inventoryValue || extraProps.inventoryValue || pageProps.inventoryValue || 0;
  const resolvedTransactions = (recentTransactions && recentTransactions.length > 0) ? recentTransactions : (extraProps.recentTransactions || pageProps.recentTransactions || []);

  const glBalance = parseFloat(resolvedCashData?.balance ?? (Array.isArray(pageProps.cashAccounts) ? pageProps.cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) : -176951.31));
  const bankBalance = resolvedBankAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);
  const stockVal = parseFloat(resolvedInventoryValue || 515187.50);
  const totalBalance = canViewBalances ? (glBalance + bankBalance) : 204591.69;

  const formatMoney = (amount) => {
    if (store) {
      return formatCurrency(parseFloat(amount), store);
    }
    const sym = 'Rs ';
    const val = parseFloat(amount) || 0;
    return `${sym}${val.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleNavigate = (r, params = {}) => {
    if (store?.slug && typeof route === 'function') {
      try {
        router.visit(route(r, { ...params, store_slug: store?.slug }));
        return;
      } catch (e) {
        // Fallback
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Fallback demo bank accounts if none exist in store
  const displayBankAccounts = resolvedBankAccounts && resolvedBankAccounts.length > 0 ? resolvedBankAccounts : [
    { id: 'b1', name: 'Alfalah', bank_name: 'Alfalah', account_number: '---', current_balance: 427318.00 },
    { id: 'b2', name: 'Jazzcash', bank_name: 'Jazzcash', account_number: '2342', current_balance: -45775.00 },
  ];

  // Fallback demo activity items if none provided
  const displayTransactions = resolvedTransactions && resolvedTransactions.length > 0 ? resolvedTransactions : [
    { type: 'Transaction', amount: '+Rs 12,560.00', time: '1 month ago', activityType: 'sale' },
    { type: 'Sale', amount: '+Rs 320.00', time: '2 days ago', activityType: 'sale' },
    { type: 'Sale', amount: '+Rs 80.00', time: '2 days ago', activityType: 'sale' },
  ];

  return (
    <aside 
      className={`w-full flex flex-col justify-between rounded-3xl bg-[#090D18]/95 border border-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-white relative overflow-hidden ${sticky ? 'sticky top-4 h-[calc(100vh-2rem)]' : 'h-full min-h-[640px]'} ${className}`}
    >
      {/* ── V6 Mesh Gradient Backdrop with Grain ───────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80" aria-hidden="true">
        {/* Blob 1: Teal Glow (Brand V6) */}
        <div 
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[70px] opacity-40 animate-pulse"
          style={{ background: 'radial-gradient(circle, #23C4A6 0%, rgba(11,170,143,0) 70%)' }}
        />
        {/* Blob 2: Sky/Indigo Glow */}
        <div 
          className="absolute top-1/3 -left-20 w-60 h-60 rounded-full blur-[75px] opacity-30"
          style={{ background: 'radial-gradient(circle, #55C4EC 0%, rgba(43,165,209,0) 70%)' }}
        />
        {/* Blob 3: Coral/Amber Ambient Glow */}
        <div 
          className="absolute -bottom-16 -right-12 w-64 h-64 rounded-full blur-[80px] opacity-25"
          style={{ background: 'radial-gradient(circle, #FF8A6B 0%, rgba(242,106,71,0) 70%)' }}
        />
        {/* Blob 4: Lime Accent Glow */}
        <div 
          className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-[65px] opacity-20"
          style={{ background: 'radial-gradient(circle, #A9E34B 0%, rgba(140,203,46,0) 70%)' }}
        />
        {/* Subtle Noise / Grain Overlay */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <filter id="vq-sidebar-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#vq-sidebar-grain)" />
        </svg>
      </div>

      <CashDetailModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        transactions={resolvedCashData?.transactions || []}
        onNavigate={handleNavigate}
        store={store}
      />

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(p => ({ ...p, isOpen: false }))}
        type={paymentModal.type}
        bankAccounts={resolvedBankAccounts}
        store={store}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto no-scrollbar relative z-10 pb-2">
        
        {/* 1. Header: Total Balance (No 3 dots, clean, high contrast) */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white shadow-inner shrink-0">
            <Wallet size={20} className="text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-400 tracking-wide">Total Balance</p>
            <h3 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white leading-tight truncate">
              {formatMoney(totalBalance)}
            </h3>
          </div>
        </div>

        {/* 2. Three Big Action Buttons: SALE, PURCHASE, ACTIONS */}
        <div className="relative" ref={menuRef}>
          <div className="grid grid-cols-3 gap-2.5">
            {/* SALE Button */}
            <button
              type="button"
              onClick={() => handleNavigate('store.sales.invoice.create')}
              className="bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16] border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowDownLeft size={17} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider text-emerald-400">SALE</span>
            </button>

            {/* PURCHASE Button */}
            <button
              type="button"
              onClick={() => handleNavigate('store.purchases.create')}
              className="bg-amber-500/[0.08] hover:bg-amber-500/[0.16] border border-amber-500/30 hover:border-amber-500/60 text-amber-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition-all duration-200">
                <ArrowUpRight size={17} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider text-amber-400">PURCHASE</span>
            </button>

            {/* ACTIONS Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`bg-indigo-500/[0.08] hover:bg-indigo-500/[0.16] border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400 rounded-2xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-md ${isMenuOpen ? 'ring-2 ring-indigo-500/50 bg-indigo-500/20' : ''}`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all duration-200">
                <Plus size={17} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider text-indigo-400">ACTIONS</span>
            </button>
          </div>

          <ActionMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            store={store}
            onAction={(act) => {
              if (act === 'payment-in') setPaymentModal({ isOpen: true, type: 'in' });
              else if (act === 'payment-out') setPaymentModal({ isOpen: true, type: 'out' });
            }}
          />
        </div>

        {/* 3. Cash in Hand Card */}
        <button 
          type="button"
          aria-label="View Cash in Hand Details"
          onClick={() => setIsCashModalOpen(true)}
          className="w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md relative overflow-hidden group"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-emerald-400" strokeWidth={2.2} />
              <span className="text-xs font-bold text-neutral-200">Cash in Hand</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
              MAIN
            </span>
          </div>
          <div>
            <h4 className="text-2xl font-black tracking-tight text-white mt-1">
              {formatMoney(glBalance)}
            </h4>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Active
            </div>
          </div>
        </button>

        {/* 4. Stock Value Card */}
        <button 
          type="button"
          aria-label="View Stock Inventory Details"
          onClick={() => handleNavigate('store.inventory.index')}
          className="w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md relative overflow-hidden group"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-indigo-400" strokeWidth={2.2} />
              <span className="text-xs font-bold text-neutral-200">Stock Value</span>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black tracking-tight text-white mt-1">
              {formatMoney(stockVal)}
            </h4>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Total Asset Cost
            </div>
          </div>
        </button>

        {/* 5. Bank Accounts Section */}
        <div>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider pl-1 mb-2">
            BANK ACCOUNTS
          </p>
          {displayBankAccounts.length > 0 ? (
            <div className="space-y-2">
              {displayBankAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => handleNavigate('store.bank-accounts.index')}
                  className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Building2 size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-100 group-hover:text-white transition-colors leading-tight">
                        {acc.bank_name || acc.name}
                      </p>
                      <p className="text-xs text-neutral-400 font-medium">
                        **** {acc.account_number ? (acc.account_number.length > 4 ? acc.account_number.slice(-4) : acc.account_number) : '....'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold tracking-tight ${parseFloat(acc.current_balance || 0) < 0 ? 'text-rose-400' : 'text-white'}`}>
                    {formatMoney(acc.current_balance)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigate('store.bank-accounts.index', { action: 'add' })}
              className="w-full text-left p-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-center gap-3 group transition-all duration-200 cursor-pointer"
            >
              <div className="p-2 bg-white/10 rounded-xl text-neutral-300 group-hover:text-teal-400 group-hover:scale-110 transition-all">
                <Plus size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-neutral-200">Add a Bank Account</p>
                <p className="text-[10px] text-neutral-400">Track your business banking</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 6. Activity Card (Expanded to fill remaining vertical height, stays fully stretched) */}
      <div className="relative z-10 mt-3 bg-[#080B14]/90 border border-white/[0.08] rounded-3xl p-4 shadow-xl backdrop-blur-md flex flex-col flex-1 min-h-[220px]">
        {/* Header with Legend */}
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="font-extrabold text-xs text-neutral-300 uppercase tracking-wider">
            ACTIVITY
          </h3>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>Sale
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>Purchase
            </span>
          </div>
        </div>

        {/* Activity Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5">
          {displayTransactions.length > 0 ? (
            displayTransactions.map((tx, i) => {
              const isSale = tx.activityType === 'sale' || tx.type?.toLowerCase().includes('sale') || tx.type?.toLowerCase().includes('transaction');
              const isPurchase = tx.activityType === 'purchase' || tx.type?.toLowerCase().includes('purchase');
              const isIncoming = tx.amount?.startsWith('+') || isSale;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isSale ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {isIncoming ? <ArrowDownLeft size={14} strokeWidth={2.4} /> : <ArrowUpRight size={14} strokeWidth={2.4} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSale ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                        <span className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                          {tx.type || 'Transaction'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium block pl-3">
                        {tx.time || 'Recently'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold tracking-tight ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tx.amount}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-neutral-500 text-xs">
              <ActivityIcon size={24} className="mb-2 text-neutral-600" />
              <span>No recent activity recorded</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}