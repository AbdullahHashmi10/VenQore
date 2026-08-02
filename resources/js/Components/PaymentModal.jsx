import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { router } from '@inertiajs/react';
import FormModal from '@/Components/FormModal';
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
        axios.get(route("store.parties.search", { store_slug: store.slug }), { params: {} })
            .then(res => setDefaultResults((res.data || []).slice(0, 5)))
            .catch(() => { });
    }, [store.slug]);

    const search = useCallback(async (q) => {
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
    }, [store.slug]);

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
        const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const balanceBadge = () => {
        if (!selectedParty) return null;
        const bal = parseFloat(selectedParty.current_balance || 0);
        const dir = selectedParty.balance_direction || (bal > 0 ? 'To Receive' : bal < 0 ? 'To Pay' : 'Settled');
        if (Math.abs(bal) < 0.01) return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-2xs font-bold">
                <Minus size={10} /> Settled
            </span>
        );
        const isReceive = dir === 'To Receive';
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold ${isReceive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {isReceive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {dir}: {formatCurrency(Math.abs(bal), store?.currency_symbol)}
            </span>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            <div style={{ outline: 'none' }} className={`flex items-center gap-2 w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${selectedParty ? (isIn ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-200 dark:border-slate-700'} transition-all focus-within:border-indigo-500`}>
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    name={AC_OFF_NAME}
                    value={query}
                    onChange={handleInput}
                    onFocus={handleFocus}
                    placeholder="Click or type name / phone..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-white placeholder-slate-400"
                    autoComplete="new-password"
                    style={{ outline: 'none', boxShadow: 'none' }}
                />
                {loading && <div className={`w-4 h-4 border-2 border-slate-300 ${isIn ? 'border-t-emerald-500' : 'border-t-rose-500'} rounded-full animate-spin shrink-0`} />}
                {(query || selectedParty) && !loading && (
                    <button type="button" onClick={handleClear} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0">
                        <X size={14} />
                    </button>
                )}
            </div>

            {selectedParty && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full ${isIn ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'} flex items-center justify-center`}>
                            <User size={10} className={isIn ? 'text-emerald-600' : 'text-rose-600'} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedParty.name}</span>
                        {selectedParty.type && (
                            <span className={`text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full ${selectedParty.type === 'customer' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {selectedParty.type}
                            </span>
                        )}
                    </div>
                    {balanceBadge()}
                </div>
            )}

            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-auto">
                    {results.map(party => {
                        const bal = parseFloat(party.current_balance || 0);
                        const dir = party.balance_direction || (bal > 0 ? 'To Receive' : bal < 0 ? 'To Pay' : 'Settled');
                        const settled = Math.abs(bal) < 0.01;
                        return (
                            <button
                                key={party.id}
                                type="button"
                                onClick={() => handleSelect(party)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${party.type === 'customer' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                    {party.type === 'customer'
                                        ? <User size={13} className="text-blue-600 dark:text-blue-400" />
                                        : <Building2 size={13} className="text-amber-600 dark:text-amber-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{party.name}</p>
                                    <p className="text-2xs text-slate-400 truncate">{party.phone || party.email || party.type}</p>
                                </div>
                                {!settled && (
                                    <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${dir === 'To Receive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {dir}: {formatCurrency(Math.abs(bal), store?.currency_symbol)}
                                    </span>
                                )}
                                {settled && <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Settled</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {open && results.length === 0 && !loading && query && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 px-4 py-5 text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No contacts found for "{query}"</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try a different name or phone number</p>
                </div>
            )}
        </div>
    );
}

export default function PaymentModal({ isOpen, onClose, type = 'in', bankAccounts = [], store }) {
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
            }, 1000);
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const accentColor = isIn ? 'emerald' : 'rose';
    const accentClass = isIn ? 'border-emerald-500' : 'border-rose-500';
    const ringClass = isIn ? 'ring-emerald-500/20' : 'ring-rose-500/20';
    const buttonBgClass = isIn
        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25';

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isIn ? 'Record Payment In' : 'Record Payment Out'}
            subtitle={isIn ? 'Money received from a contact' : 'Money paid to a contact'}
            size="md"
            confirmClose={!success && (formData.amount || formData.party_id || formData.description)}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Party Search */}
                <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        {isIn ? 'Receive From' : 'Pay To'} <span className="text-red-500">*</span>
                    </label>
                    <PartySearchField
                        selectedParty={selectedParty}
                        onSelect={handlePartySelect}
                        onClear={handlePartyClear}
                        store={store}
                        isIn={isIn}
                    />
                    {errors.party_id && <p className="mt-1 text-xs text-red-500">{errors.party_id[0]}</p>}
                </div>

                {/* Date + Amount */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`}
                            />
                        </div>
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{getCurrencySymbol(store)}</span>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                                placeholder="0"
                                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`}
                            />
                        </div>
                        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount[0]}</p>}
                    </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {METHODS.map(m => {
                            const isSelected = formData.payment_method === m.value;
                            return (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, payment_method: m.value }))}
                                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border-2 transition-all text-2xs font-bold uppercase ${isSelected
                                        ? `${isIn ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`
                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40'
                                        }`}
                                >
                                    <m.icon size={16} />
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bank Account (conditional) */}
                {formData.payment_method === 'bank' && (
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Bank Account</label>
                        <select
                            value={formData.bank_account_id}
                            onChange={e => setFormData(p => ({ ...p, bank_account_id: e.target.value }))}
                            className={`w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`}
                        >
                            <option value="">Select account...</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Reference + Description */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Reference No.</label>
                        <div className="relative">
                            <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={formData.reference}
                                onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
                                placeholder="Cheque / TxID"
                                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                        <div className="relative">
                            <FileText size={13} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Notes..."
                                className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ${ringClass} focus:border-indigo-500 transition`}
                            />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || success}
                        className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-60 ${buttonBgClass}`}
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
        </FormModal>
    );
}
