import React, { useState, useEffect } from 'react';
import { Banknote, Coins, RefreshCw, Calculator } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export const DEFAULT_DENOMINATIONS = [
    { value: 5000, label: '5,000 Note', isNote: true },
    { value: 1000, label: '1,000 Note', isNote: true },
    { value: 500,  label: '500 Note',   isNote: true },
    { value: 100,  label: '100 Note',   isNote: true },
    { value: 50,   label: '50 Note',    isNote: true },
    { value: 20,   label: '20 Note',    isNote: true },
    { value: 10,   label: '10 Note',    isNote: true },
    { value: 5,    label: '5 Coin',     isNote: false },
    { value: 2,    label: '2 Coin',     isNote: false },
    { value: 1,    label: '1 Coin',     isNote: false },
    { value: 0.5,  label: '0.50 Coin',  isNote: false },
];

export default function CashDrawerCountSheet({
    initialCounts = {},
    expectedCash = null,
    onTotalChange,
    onCountsChange,
    readOnly = false
}) {
    const [counts, setCounts] = useState(() => {
        const initial = {};
        DEFAULT_DENOMINATIONS.forEach(d => {
            initial[d.value] = initialCounts[d.value] || 0;
        });
        return initial;
    });

    const calculateTotal = (currentCounts) => {
        return DEFAULT_DENOMINATIONS.reduce((sum, d) => {
            const count = parseInt(currentCounts[d.value] || 0, 10);
            return sum + (isNaN(count) ? 0 : count * d.value);
        }, 0);
    };

    const totalCounted = calculateTotal(counts);

    useEffect(() => {
        if (onTotalChange) onTotalChange(totalCounted);
        if (onCountsChange) onCountsChange(counts);
    }, [counts]);

    const handleCountChange = (value, countStr) => {
        if (readOnly) return;
        const count = countStr === '' ? '' : Math.max(0, parseInt(countStr, 10) || 0);
        const updated = { ...counts, [value]: count };
        setCounts(updated);
    };

    const handleReset = () => {
        if (readOnly) return;
        const reset = {};
        DEFAULT_DENOMINATIONS.forEach(d => { reset[d.value] = 0; });
        setCounts(reset);
    };

    const variance = expectedCash !== null ? totalCounted - expectedCash : null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-sm tracking-wide text-slate-200">
                        Cash Drawer Count Sheet
                    </span>
                </div>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                    </button>
                )}
            </div>

            {/* Denominations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {DEFAULT_DENOMINATIONS.map((d) => {
                    const count = counts[d.value] ?? '';
                    const subtotal = (parseInt(count || 0, 10) || 0) * d.value;

                    return (
                        <div
                            key={d.value}
                            className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 hover:border-slate-600 transition"
                        >
                            <div className="flex items-center space-x-2 w-32">
                                {d.isNote ? (
                                    <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                                )}
                                <span className="text-xs font-medium text-slate-300">
                                    {d.label}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-slate-400 text-xs">×</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={count}
                                    onChange={(e) => handleCountChange(d.value, e.target.value)}
                                    placeholder="0"
                                    disabled={readOnly}
                                    className="w-16 h-8 text-center text-sm font-semibold bg-slate-900 border border-slate-700 rounded text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                />
                                <span className="text-slate-400 text-xs w-2">=</span>
                                <span className="text-xs font-mono font-semibold text-right w-20 text-slate-200">
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reconciliation Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center bg-slate-800/90 rounded-lg p-3">
                    <span className="text-sm font-bold text-slate-300">Total Counted Cash:</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                        {formatCurrency(totalCounted)}
                    </span>
                </div>

                {expectedCash !== null && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-800/40 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 block">Expected in Drawer:</span>
                            <span className="font-mono font-semibold text-slate-200 text-sm">
                                {formatCurrency(expectedCash)}
                            </span>
                        </div>
                        <div className={`p-2 rounded border ${
                            variance === 0
                                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                                : variance > 0
                                ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        }`}>
                            <span className="block opacity-80">
                                {variance === 0 ? 'Variance (Balanced)' : variance > 0 ? 'Overage (+)' : 'Shortage (-)'}
                            </span>
                            <span className="font-mono font-bold text-sm">
                                {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
