import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Lock, AlertCircle, CheckCircle2, X, Loader2, FileText, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import CashDrawerCountSheet from './CashDrawerCountSheet';

export default function CloseShiftModal({
    isOpen,
    onClose,
    onSuccess,
    shift,
    metrics = {},
}) {
    const { store } = usePage().props;
    const [countedCash, setCountedCash] = useState(0);
    const [denominations, setDenominations] = useState({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !shift) return null;

    const expectedCash = metrics?.expected_cash ?? (parseFloat(shift.opening_float || 0));
    const variance = countedCash - expectedCash;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await window.axios.post(route('store.shifts.close', { store_slug: store?.slug }), {
                shift_id: shift.id,
                counted_cash: countedCash,
                denominations: denominations,
                notes: notes.trim() || null,
            });

            if (response.data?.success) {
                if (onSuccess) {
                    onSuccess(response.data.shift, response.data.z_report, response.data.metrics);
                }
                onClose();
            }
        } catch (err) {
            console.error('Failed to close shift:', err);
            setError(err.response?.data?.message || 'Failed to close register shift. Please check input and retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                Close Shift & Print Z-Report
                            </h2>
                            <p className="text-xs text-slate-400">
                                Shift #{shift.id} • Register: <span className="text-slate-200 font-semibold">{shift.register_id || 'REG-1'}</span>
                            </p>
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

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-medium flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Shift Performance Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-[11px] font-medium text-slate-400 block">Opening Float</span>
                            <span className="text-sm font-mono font-bold text-slate-200">
                                {formatCurrency(metrics.opening_float || shift.opening_float || 0)}
                            </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-[11px] font-medium text-slate-400 block">Cash Sales</span>
                            <span className="text-sm font-mono font-bold text-emerald-400">
                                {formatCurrency(metrics.cash_sales || 0)}
                            </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-[11px] font-medium text-slate-400 block">Pay-Ins / Drops</span>
                            <span className="text-sm font-mono font-bold text-slate-300">
                                +{formatCurrency(metrics.cash_in || 0)} / -{formatCurrency(metrics.cash_out || 0)}
                            </span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-[11px] font-medium text-indigo-300 block font-semibold">Expected Cash</span>
                            <span className="text-sm font-mono font-bold text-indigo-400">
                                {formatCurrency(expectedCash)}
                            </span>
                        </div>
                    </div>

                    {/* Denominations Cash Counter */}
                    <div>
                        <CashDrawerCountSheet
                            expectedCash={expectedCash}
                            onTotalChange={setCountedCash}
                            onCountsChange={setDenominations}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            End-of-Shift / Reconciliation Notes
                        </label>
                        <textarea
                            rows="2"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add reason for cash overage/shortage or any end of day handover notes..."
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        ></textarea>
                    </div>

                    {/* Reconciliation Alert Banner */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        variance === 0
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                            : variance > 0
                            ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                            : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    }`}>
                        <div className="flex items-center space-x-3">
                            {variance === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                            )}
                            <div>
                                <span className="font-bold text-sm block">
                                    {variance === 0 ? 'Till is Perfectly Balanced' : variance > 0 ? 'Cash Overage (+)' : 'Cash Shortage (-)'}
                                </span>
                                <span className="text-xs opacity-80">
                                    Counted: {formatCurrency(countedCash)} • Expected: {formatCurrency(expectedCash)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-mono font-bold text-base">
                                {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                            </span>
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
                            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    <span>Close Shift & View Z-Report</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
