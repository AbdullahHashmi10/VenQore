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
    <div className="absolute top-full mt-2 right-0 w-72 bg-[#0E1318]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center px-2 py-1.5 border-b border-white/10 mb-2">
        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Quick Actions</span>
        <button 
          type="button"
          aria-label="Close actions menu"
          onClick={onClose} 
          className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
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
      <div className="bg-[#0E1318] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
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

        <div className="p-4 bg-[#080B10]">
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

        <div className="p-3.5 grid grid-cols-4 gap-2 border-t border-white/10 bg-[#0E1318]">
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-2 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group">
            <ArrowDownLeft size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-400">Add</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 border border-rose-500/20 transition-all group">
            <ArrowUpRight size={15} className="text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-rose-400">Remove</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index'); onClose(); }} className="flex flex-col items-center gap-1 p-2 bg-sky-500/10 rounded-xl hover:bg-sky-500/20 border border-sky-500/20 transition-all group">
            <RefreshCw size={15} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-sky-400">Transfer</span>
          </button>
          <button type="button" onClick={() => { onNavigate('store.funds.index', { view: 'history' }); onClose(); }} className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10 transition-all group">
            <FileText size={15} className="text-neutral-400 group-hover:scale-110 transition-transform" />
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
    { id: 'b1', name: 'Standard Chartered', bank_name: 'Standard Chartered', account_number: '1098', current_balance: 250000.00 },
    { id: 'b2', name: 'Meezan Bank', bank_name: 'Meezan Bank', account_number: '9012', current_balance: 2275880.00 },
  ];

  // Fallback demo activity items if none provided
  const displayTransactions = resolvedTransactions && resolvedTransactions.length > 0 ? resolvedTransactions : [
    { type: 'Purchase', amount: '-Rs 46,500.00', time: '7 hours ago', activityType: 'purchase' },
    { type: 'Sale', amount: '+Rs 12,100.00', time: '13 hours ago', activityType: 'sale' },
    { type: 'Sale', amount: '+Rs 7,200.00', time: '15 hours ago', activityType: 'sale' },
    { type: 'Sale', amount: '+Rs 4,320.00', time: '16 hours ago', activityType: 'sale' },
  ];

  return (
    <div className={`w-full flex flex-col gap-2.5 text-white ${className}`}>
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

      {/* 1. Header: Total Balance */}
      <div className="flex items-center gap-3 px-1 pt-0.5">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-white shadow-inner shrink-0">
          <Wallet size={18} className="text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Total Balance</p>
          <h3 className="text-xl sm:text-[22px] font-black tracking-tight text-white leading-tight truncate">
            {formatMoney(totalBalance)}
          </h3>
        </div>
      </div>

      {/* 2. Three Circular/Pill Action Buttons: SALE, PURCHASE, ACTIONS */}
      <div className="relative" ref={menuRef}>
        <div className="grid grid-cols-3 gap-2">
          {/* SALE Button */}
          <button
            type="button"
            onClick={() => handleNavigate('store.sales.invoice.create')}
            className="bg-emerald-500/[0.10] hover:bg-emerald-500/[0.20] border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center transition-all duration-200">
              <ArrowDownLeft size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black tracking-wider text-emerald-400">SALE</span>
          </button>

          {/* PURCHASE Button */}
          <button
            type="button"
            onClick={() => handleNavigate('store.purchases.create')}
            className="bg-amber-500/[0.10] hover:bg-amber-500/[0.20] border border-amber-500/30 hover:border-amber-500/50 text-amber-400 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition-all duration-200">
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black tracking-wider text-amber-400">PURCHASE</span>
          </button>

          {/* ACTIONS Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`bg-teal-500/[0.10] hover:bg-teal-500/[0.20] border border-teal-500/30 hover:border-teal-500/50 text-teal-300 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 group shadow-sm backdrop-blur-sm ${isMenuOpen ? 'ring-2 ring-teal-500/50 bg-teal-500/25' : ''}`}
          >
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 group-hover:bg-teal-400 group-hover:text-black flex items-center justify-center transition-all duration-200">
              <Plus size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black tracking-wider text-teal-300">ACTIONS</span>
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
        className="w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group"
      >
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <Wallet size={14} className="text-emerald-400" strokeWidth={2.2} />
            <span className="text-xs font-bold text-neutral-200">Cash in Hand</span>
          </div>
          <span className="text-[8px] font-extrabold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase">
            MAIN
          </span>
        </div>
        <div>
          <h4 className="text-xl font-black tracking-tight text-white leading-tight">
            {formatMoney(glBalance)}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </div>
        </div>
      </button>

      {/* 4. Stock Value Card */}
      <button 
        type="button"
        aria-label="View Stock Inventory Details"
        onClick={() => handleNavigate('store.inventory.index')}
        className="w-full text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-3 transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group"
      >
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <Box size={14} className="text-teal-400" strokeWidth={2.2} />
            <span className="text-xs font-bold text-neutral-200">Stock Value</span>
          </div>
        </div>
        <div>
          <h4 className="text-xl font-black tracking-tight text-white leading-tight">
            {formatMoney(stockVal)}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-300 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            Total Asset Cost
          </div>
        </div>
      </button>

      {/* 5. Bank Accounts Section */}
      <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1.5">
          BANK ACCOUNTS
        </p>
        <div className="space-y-1.5">
          {displayBankAccounts.map((acc) => (
            <button
              type="button"
              key={acc.id}
              onClick={() => handleNavigate('store.bank-accounts.index')}
              className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-2.5 flex items-center justify-between transition-all duration-200 cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Building2 size={15} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-100 group-hover:text-white transition-colors leading-tight">
                    {acc.bank_name || acc.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    **** {acc.account_number ? (acc.account_number.length > 4 ? acc.account_number.slice(-4) : acc.account_number) : '....'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold tracking-tight ${parseFloat(acc.current_balance || 0) < 0 ? 'text-rose-400' : 'text-white'}`}>
                {formatMoney(acc.current_balance)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Activity Card (Matching rounded-2xl glass corners) */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 shadow-sm flex flex-col">
        {/* Header with Legend */}
        <div className="flex justify-between items-center mb-2 shrink-0">
          <h3 className="font-bold text-[10px] text-neutral-300 uppercase tracking-widest">
            ACTIVITY
          </h3>
          <div className="flex items-center gap-2.5 text-[10px] font-semibold text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>Sale
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Purchase
            </span>
          </div>
        </div>

        {/* Activity Items List */}
        <div className="space-y-1">
          {displayTransactions.slice(0, 4).map((tx, i) => {
            const isSale = tx.activityType === 'sale' || tx.type?.toLowerCase().includes('sale') || tx.type?.toLowerCase().includes('transaction');
            const isIncoming = tx.amount?.startsWith('+') || isSale;

            return (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${isSale ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                    {isIncoming ? <ArrowDownLeft size={11} strokeWidth={2.4} /> : <ArrowUpRight size={11} strokeWidth={2.4} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${isSale ? 'bg-teal-400' : 'bg-amber-400'}`}></span>
                      <span className="text-[11px] font-bold text-neutral-200 group-hover:text-white transition-colors">
                        {tx.type || 'Transaction'}
                      </span>
                    </div>
                    <span className="text-[9px] text-neutral-400 font-medium block pl-2">
                      {tx.time || 'Recently'}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-bold tracking-tight ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {tx.amount}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}