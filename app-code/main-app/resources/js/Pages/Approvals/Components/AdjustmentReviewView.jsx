import React from 'react';
import { 
    SlidersHorizontal, 
    Calendar, 
    FileText, 
    ArrowRight, 
    User, 
    Warehouse, 
    AlertCircle,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function AdjustmentReviewView({
    document,
    payload,
    isEditing,
    onChangePayload,
    store
}) {
    const handleFieldChange = (key, val) => {
        onChangePayload({
            ...payload,
            [key]: val,
            ...(key === 'amount' ? { grand_total: parseFloat(val) || 0, total_amount: parseFloat(val) || 0 } : {})
        });
    };

    const targetName = payload.party_name || payload.customer_name || payload.supplier_name || payload.warehouse_name || 'Account';
    const amount = parseFloat(payload.amount ?? document.amount ?? 0);
    const prevBalance = parseFloat(payload.previous_balance ?? payload.party_balance ?? 0);
    const adjustmentType = payload.adjustment_type || (amount >= 0 ? 'credit' : 'debit');
    const newBalance = adjustmentType === 'credit' ? prevBalance + Math.abs(amount) : prevBalance - Math.abs(amount);

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Header Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center shadow-xs">
                            <SlidersHorizontal size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-ink">
                                Balance / Stock Adjustment
                            </h2>
                            <p className="text-2xs text-ink-muted flex items-center gap-2 mt-0.5">
                                <span className="font-mono">Ref: {payload.reference || document.document_number || 'N/A'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {payload.adjustment_date || payload.date || new Date(document.created_at).toLocaleDateString('en-PK')}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-3xs uppercase font-bold text-ink-muted block">Adjustment Amount</span>
                        {isEditing ? (
                            <input
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => handleFieldChange('amount', e.target.value)}
                                className="w-36 text-right px-2.5 py-1 text-base font-bold rounded-lg border border-line bg-surface text-ink tabular-nums font-mono shadow-xs"
                            />
                        ) : (
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight block text-amber-600 dark:text-amber-400">
                                {formatCurrency(amount, store)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Target & Flow Card */}
            <div className="p-5 rounded-xl bg-surface border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-primary-500" />
                        <span className="text-sm font-bold text-ink">{targetName}</span>
                    </div>
                    <span className="text-3xs uppercase font-bold px-2 py-0.5 rounded bg-sunken text-ink-muted">
                        Adjustment Type: {adjustmentType}
                    </span>
                </div>

                {/* Balance Transition Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-sunken/60 border border-line">
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Previous Balance</span>
                        <span className="font-bold text-ink tabular-nums mt-0.5 block">
                            {formatCurrency(prevBalance, store)}
                        </span>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <span className="text-3xs font-semibold text-amber-800 dark:text-amber-300 uppercase block">Adjustment Delta</span>
                        <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums mt-0.5 block">
                            {adjustmentType === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(amount), store)}
                        </span>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-3xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase block">Projected New Balance</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 tabular-nums mt-0.5 block">
                            {formatCurrency(newBalance, store)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Reason & Notes Card */}
            <div className="p-4 rounded-xl bg-surface border border-line shadow-xs space-y-3 text-xs">
                <div>
                    <span className="text-3xs font-semibold text-ink-muted uppercase block">Reason Code</span>
                    <span className="font-bold text-ink mt-0.5 block font-mono">
                        {payload.reason_code || payload.reason || 'DIRECT_LEDGER_ADJUSTMENT'}
                    </span>
                </div>

                <div>
                    <span className="text-3xs font-semibold text-ink-muted uppercase block mb-1">Detailed Explanation</span>
                    {isEditing ? (
                        <textarea
                            value={payload.notes || payload.description || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows={3}
                            placeholder="Enter justification for this adjustment..."
                            className="w-full p-2 text-xs rounded-lg border border-line bg-surface text-ink"
                        />
                    ) : (
                        <p className="p-2.5 rounded-lg bg-sunken/40 border border-line italic text-ink">
                            {payload.notes || payload.description || 'No detailed reason provided.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
