import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, X, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

const REASON_PRESETS_IN = [
    'Add Cash Float',
    'Change / Coin replenishment',
    'Bank Cash Withdrawal',
    'Owner / Manager Deposit',
];

const REASON_PRESETS_OUT = [
    'Petty Cash: Milk / Supplies',
    'Petty Cash: Kitchen items',
    'Safe Drop / Excess Cash Deposit',
    'Vendor / Supplier Cash Payment',
    'Courier / Delivery Expenses',
];

export default function CashMovementModal({
    isOpen,
    onClose,
    onSuccess,
    shiftId,
}) {
    const { store } = usePage().props;
    const [type, setType] = useState('in'); // 'in' | 'out'
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const amtVal = parseFloat(amount);
            if (isNaN(amtVal) || amtVal <= 0) {
                setError('Please enter a valid amount greater than 0.');
                setLoading(false);
                return;
            }

            if (!reason.trim()) {
                setError('Please specify a reason for this cash movement.');
                setLoading(false);
                return;
            }

            const response = await window.axios.post(route('store.shifts.movement', { store_slug: store?.slug }), {
                shift_id: shiftId,
                type: type,
                amount: amtVal,
                reason: reason.trim(),
            });

            if (response.data?.success) {
                if (onSuccess) onSuccess(response.data.movement, response.data.metrics);
                onClose();
            }
        } catch (err) {
            console.error('Failed to record cash movement:', err);
            setError(err.response?.data?.message || 'Failed to record cash movement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const presets = type === 'in' ? REASON_PRESETS_IN : REASON_PRESETS_OUT;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className={`p-5 border-b border-slate-700 flex justify-between items-center ${
                    type === 'in'
                        ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80'
                        : 'bg-gradient-to-r from-rose-950/80 to-amber-950/80'
                }`}>
                    <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl border ${
                            type === 'in'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                            {type === 'in' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                {type === 'in' ? 'Cash In (Pay-In)' : 'Cash Out (Pay-Out)'}
                            </h2>
                            <p className="text-xs text-slate-300">Shift #{shiftId}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Type Selector Toggle */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setType('in')}
                            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                                type === 'in'
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ArrowDownLeft className="w-4 h-4" />
                            <span>Cash In (Pay-In)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('out')}
                            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                                type === 'out'
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Cash Out (Petty)</span>
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Amount
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <DollarSign className={`w-5 h-5 ${type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`} />
                            </div>
                            <input
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Reason / Description
                        </label>
                        <input
                            type="text"
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Petty Cash for supplies..."
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {presets.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setReason(p)}
                                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700/60 transition"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50 text-white ${
                                type === 'in'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Record {type === 'in' ? 'Cash In' : 'Cash Out'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
