import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { PlayCircle, DollarSign, X, Check, Loader2, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

const PRESET_FLOATS = [0, 500, 1000, 2000, 5000];

export default function OpenShiftModal({
    isOpen,
    onClose,
    onSuccess,
    registerId = 'REG-1',
}) {
    const { store } = usePage().props;
    const [openingFloat, setOpeningFloat] = useState('1000');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const floatVal = parseFloat(openingFloat);
            if (isNaN(floatVal) || floatVal < 0) {
                setError('Please enter a valid opening float amount.');
                setLoading(false);
                return;
            }

            const response = await window.axios.post(route('store.shifts.open', { store_slug: store?.slug }), {
                opening_float: floatVal,
                register_id: registerId,
                notes: notes.trim() || null,
            });

            if (response.data?.success) {
                if (onSuccess) onSuccess(response.data.shift, response.data.metrics);
                onClose();
            }
        } catch (err) {
            console.error('Failed to open shift:', err);
            setError(err.response?.data?.message || 'Failed to open register shift. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-5 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <PlayCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Open Register Shift</h2>
                            <p className="text-xs text-indigo-200/80">Register: <span className="font-semibold text-white">{registerId}</span></p>
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

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Opening Cash Float
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <DollarSign className="w-5 h-5 text-indigo-400" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                autoFocus
                                value={openingFloat}
                                onChange={(e) => setOpeningFloat(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {PRESET_FLOATS.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setOpeningFloat(val.toString())}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                        parseFloat(openingFloat) === val
                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {formatCurrency(val)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Shift Notes (Optional)
                        </label>
                        <textarea
                            rows="2"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Morning counter shift, float counted & verified."
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        ></textarea>
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
                            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Open Shift</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
