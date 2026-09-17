import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getCurrencySymbol } from '@/Utils/format';
import { router } from '@inertiajs/react';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Search,
    X,
    User,
    TrendingUp,
    TrendingDown,
    Minus,
    CalendarDays,
    Banknote,
    CreditCard,
    Smartphone,
    Building2,
    FileText,
    Hash,
    CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const formatCurrency = (v, symbol = 'Rs') => (symbol) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const AC_OFF_NAME = 'party-search-' + Math.random().toString(36).slice(2);

const METHODS = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'bank', label: 'Bank', icon: Building2 },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI/JazzCash', icon: Smartphone },
];

function PartySearchField({ selectedParty, onSelect, onClear, store, isIn }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [defaultResults, setDefaultResults] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!store?.slug) return;
        axios.get(route("store.parties.search", { store_slug: store.slug }), { params: {} })
            .then(res => setDefaultResults((res.data || []).slice(0, 5)))
            .catch(() => { });
    }, [store?.slug]);

    const search = useCallback(async (q) => {
        if (!store?.slug) return;
        setLoading(true);
        try {
            const res = await axios.get(route("store.parties.search", { store_slug: store.slug }), { params: q ? { search: q } : {} });
            setResults(res.data || []);
            setOpen(true);
        } catch (e) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [store?.slug]);

    const handleInput = (e) => {
        const q = e.target.value;
        setQuery(q);
        if (selectedParty) onClear();
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(q), 220);
    };

    const handleFocus = () => {
        if (!query) {
            setResults(defaultResults);
            setOpen(defaultResults.length > 0);
        } else {
            setOpen(results.length > 0);
        }
    };

    const handleSelect = (party) => {
        setQuery(party.name);
        setOpen(false);
        setResults([]);
        onSelect(party);
    };

    const handleClear = () => {
        setQuery('');
        setResults(defaultResults);
        setOpen(false);
        onClear();
    };

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const balanceBadge = () => {
        if (!selectedParty) return null;
        const bal = parseFloat(selectedParty.current_balance || 0);
        const dir = selectedParty.balance_direction || (bal > 0 ? 'To Receive' : bal < 0 ? 'To Pay' : 'Settled');
        if (Math.abs(bal) < 0.01) return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-2xs font-bold">
                <Minus size={10} /> Settled
            </span>
        );
        const isReceive = dir === 'To Receive';
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold ${isReceive ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-600/30' : 'bg-red-100 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border border-rose-300/40 dark:border-rose-600/30'}`}>
                {isReceive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {dir}: {formatCurrency(Math.abs(bal), store?.currency_symbol)}
            </span>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <div className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border ${selectedParty ? (isIn ? 'border-emerald-500 dark:border-emerald-500/60 ring-2 ring-emerald-500/10' : 'border-rose-500 dark:border-rose-500/60 ring-2 ring-rose-500/10') : 'border-slate-200 dark:border-white/10'} transition-all focus-within:border-teal-500 dark:focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/15`}>
                <Search size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                    type="text"
                    name={AC_OFF_NAME}
                    value={query}
                    onChange={handleInput}
                    onFocus={handleFocus}
                    placeholder="Click or type name / phone..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    autoComplete="new-password"
                    style={{ outline: 'none', boxShadow: 'none' }}
                />
                {loading && <div className={`w-4 h-4 border-2 border-slate-300 dark:border-neutral-700 ${isIn ? 'border-t-emerald-500' : 'border-t-rose-500'} rounded-full animate-spin shrink-0`} />}
                {(query || selectedParty) && !loading && (
                    <button type="button" onClick={handleClear} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition shrink-0 cursor-pointer">
                        <X size={14} />
                    </button>
                )}
            </div>

            {selectedParty && (
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded-full ${isIn ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'} flex items-center justify-center shrink-0`}>
                            <User size={11} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedParty.name}</span>
                        {selectedParty.type && (
                            <span className={`text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${selectedParty.type === 'customer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                {selectedParty.type}
                            </span>
                        )}
                    </div>
                    {balanceBadge()}
                </div>
            )}

            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#151E1A] border border-slate-200 dark:border-white/10 rounded-[14px] shadow-2xl z-[100] max-h-56 overflow-auto">
                    {results.map(party => {
                        const bal = parseFloat(party.current_balance || 0);
                        const dir = party.balance_direction || (bal > 0 ? 'To Receive' : bal < 0 ? 'To Pay' : 'Settled');
                        const settled = Math.abs(bal) < 0.01;
                        return (
                            <button
                                key={party.id}
                                type="button"
                                onClick={() => handleSelect(party)}
                                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 cursor-pointer"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${party.type === 'customer' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'}`}>
                                    {party.type === 'customer' ? <User size={14} /> : <Building2 size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{party.name}</p>
                                    <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{party.phone || party.email || party.type}</p>
                                </div>
                                {!settled && (
                                    <span className={`text-2xs font-bold px-2 py-0.5 rounded-full shrink-0 ${dir === 'To Receive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'}`}>
                                        {dir}: {formatCurrency(Math.abs(bal), store?.currency_symbol)}
                                    </span>
                                )}
                                {settled && <span className="text-2xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">Settled</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {open && results.length === 0 && !loading && query && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#151E1A] border border-slate-200 dark:border-white/10 rounded-[14px] shadow-xl z-[100] px-4 py-5 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No contacts found for "{query}"</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try a different name or phone number</p>
                </div>
            )}
        </div>
    );
}

export default function PaymentModal({ isOpen, onClose, type = 'in', bankAccounts = [], store }) {
    if (!isOpen) return null;

    const isIn = type === 'in';
    const [loading, setLoading] = useState(false);
    const [selectedParty, setSelectedParty] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        party_id: '',
        party_name: '',
        amount: '',
        payment_method: 'cash',
        bank_account_id: '',
        reference: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                party_id: '',
                party_name: '',
                amount: '',
                payment_method: 'cash',
                bank_account_id: '',
                reference: '',
                description: ''
            });
            setSelectedParty(null);
            setErrors({});
            setSuccess(false);
        }
    }, [isOpen]);

    // Handle ESC key to dismiss
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handlePartySelect = (party) => {
        setSelectedParty(party);
        setFormData(prev => ({ ...prev, party_id: party.id, party_name: party.name }));
    };

    const handlePartyClear = () => {
        setSelectedParty(null);
        setFormData(prev => ({ ...prev, party_id: '', party_name: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await axios.post(route('store.payments.store', { store_slug: store.slug }), { ...formData, type });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                router.reload();
            }, 800);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert(error.response?.data?.message || 'An error occurred while recording payment');
            }
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
            style={{
                background: 'rgba(8, 12, 11, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-[540px] max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] bg-white dark:bg-[#0D1412] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 flex flex-col gap-5 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
                style={{
                    boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                    backgroundImage: isIn
                        ? 'radial-gradient(40% 40% at 15% 10%, rgba(35, 196, 166, 0.12), transparent 70%)'
                        : 'radial-gradient(40% 40% at 15% 10%, rgba(242, 106, 71, 0.12), transparent 70%)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/8">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-9 rounded-full ${isIn ? 'bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[0_0_12px_rgba(35,196,166,0.5)]' : 'bg-gradient-to-b from-coral-400 to-rose-600 shadow-[0_0_12px_rgba(242,106,71,0.5)]'}`} />
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                                {isIn ? 'Record Payment In' : 'Record Payment Out'}
                            </h2>
                            <p className="text-xs font-semibold text-slate-500 dark:text-emerald-400/80 mt-0.5">
                                {isIn ? 'Money received from customer / debtor' : 'Money disbursed to supplier / creditor'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                        aria-label="Close"
                    >
                        <X size={16} strokeWidth={2.4} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Party Search */}
                    <div>
                        <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            {isIn ? 'Receive From (Customer)' : 'Pay To (Supplier)'} <span className="text-rose-500">*</span>
                        </label>
                        <PartySearchField
                            selectedParty={selectedParty}
                            onSelect={handlePartySelect}
                            onClear={handlePartyClear}
                            store={store}
                            isIn={isIn}
                        />
                        {errors.party_id && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.party_id[0]}</p>}
                    </div>

                    {/* Date + Amount */}
                    <div className="grid grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Date <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 transition font-semibold"
                                />
                            </div>
                            {errors.date && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.date[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Amount <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-bold font-numeric">
                                    {getCurrencySymbol(store)}
                                </span>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.amount}
                                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                    placeholder="0"
                                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 transition font-bold font-numeric"
                                />
                            </div>
                            {errors.amount && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.amount[0]}</p>}
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Payment Method <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {METHODS.map(m => {
                                const isSelected = formData.payment_method === m.value;
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, payment_method: m.value }))}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[14px] border transition-all text-2xs font-extrabold uppercase cursor-pointer ${isSelected
                                            ? isIn
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                                                : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm ring-2 ring-rose-500/20'
                                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/60 dark:bg-[#121A17]'
                                            }`}
                                    >
                                        <m.icon size={16} />
                                        <span>{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bank Account (conditional) */}
                    {formData.payment_method === 'bank' && (
                        <div>
                            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Bank Account <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={formData.bank_account_id}
                                onChange={e => setFormData(p => ({ ...p, bank_account_id: e.target.value }))}
                                className="w-full px-3.5 py-2.5 text-sm rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 transition font-semibold"
                            >
                                <option value="">Select bank account...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} {acc.account_number ? `(•••• ${String(acc.account_number).slice(-4)})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.bank_account_id && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.bank_account_id[0]}</p>}
                        </div>
                    )}

                    {/* Reference + Description */}
                    <div className="grid grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Reference No.</label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
                                    placeholder="Cheque / TxID"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 transition font-semibold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description / Note</label>
                            <div className="relative">
                                <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Notes..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[14px] bg-slate-50/90 dark:bg-[#121A17] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15 transition font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/8 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-[14px] hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`flex items-center gap-2 px-6 py-2.5 text-white font-black text-sm rounded-[14px] shadow-lg transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                                isIn
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-emerald-900/30'
                                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-900/30'
                            }`}
                        >
                            {success ? (
                                <><CheckCircle2 size={16} /> Recorded!</>
                            ) : loading ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Recording...</>
                            ) : (
                                <>
                                    {isIn ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                                    Record Payment {isIn ? 'In' : 'Out'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
