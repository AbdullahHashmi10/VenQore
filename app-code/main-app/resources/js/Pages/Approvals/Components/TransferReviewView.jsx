import React from 'react';
import { 
    ArrowRightLeft, 
    ArrowRight, 
    Building2, 
    Calendar, 
    FileText, 
    DollarSign, 
    Wallet,
    Landmark,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function TransferReviewView({
    document,
    payload,
    isEditing,
    onChangePayload,
    store,
    bankAccounts = []
}) {
    const docType = document.document_type;
    const isCapital = docType === 'capital_injection';
    const isDrawing = docType === 'owner_drawings';
    const isTransfer = docType === 'fund_transfer';

    const handleFieldChange = (key, val) => {
        onChangePayload({
            ...payload,
            [key]: val,
            ...(key === 'amount' ? { grand_total: parseFloat(val) || 0, total_amount: parseFloat(val) || 0 } : {})
        });
    };

    const amount = parseFloat(payload.amount ?? document.amount ?? 0);
    const fromAccountName = payload.from_account_name || (isCapital ? 'Owner Personal Equity' : 'Main Cash Till');
    const toAccountName = payload.to_account_name || (isDrawing ? 'Owner Personal Account' : 'Business Bank Account');
    const transferFee = parseFloat(payload.fee || payload.transfer_fee || 0);

    const getTitle = () => {
        if (isCapital) return 'Owner Capital Addition';
        if (isDrawing) return 'Owner Drawing / Withdrawal';
        return 'Internal Vault / Bank Transfer';
    };

    const getTone = () => {
        if (isCapital) return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' };
        if (isDrawing) return { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' };
        return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' };
    };

    const tone = getTone();

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Header Card */}
            <div className={`p-4 sm:p-5 rounded-2xl ${tone.bg} border ${tone.border} shadow-xs`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center shadow-xs">
                            <ArrowRightLeft size={20} className={tone.text} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-ink">
                                {getTitle()}
                            </h2>
                            <p className="text-2xs text-ink-muted flex items-center gap-2 mt-0.5">
                                <span className="font-mono">Ref: {payload.reference || document.document_number || 'N/A'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {payload.transfer_date || payload.date || new Date(document.created_at).toLocaleDateString('en-PK')}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-3xs uppercase font-bold text-ink-muted block">Transfer Amount</span>
                        {isEditing ? (
                            <input
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => handleFieldChange('amount', e.target.value)}
                                className="w-36 text-right px-2.5 py-1 text-base font-bold rounded-lg border border-line bg-surface text-ink tabular-nums font-mono shadow-xs"
                            />
                        ) : (
                            <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight block ${tone.text}`}>
                                {formatCurrency(amount, store)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Route Card: From -> To */}
            <div className="p-5 rounded-xl bg-surface border border-line shadow-xs">
                <h3 className="text-3xs uppercase font-bold text-ink-muted tracking-wider mb-3">Fund Movement Route</h3>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* From Account */}
                    <div className="w-full sm:flex-1 p-3.5 rounded-xl bg-sunken/60 border border-line">
                        <span className="text-3xs font-bold text-ink-muted uppercase block">Source (Money Leaves)</span>
                        {isEditing && isTransfer ? (
                            <select
                                value={payload.from_account_id || ''}
                                onChange={(e) => handleFieldChange('from_account_id', e.target.value)}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink font-semibold"
                            >
                                <option value="">Select Source Account</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>{b.account_name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <Wallet size={16} className="text-rose-500 shrink-0" />
                                <span className="font-bold text-ink text-sm truncate">{fromAccountName}</span>
                            </div>
                        )}
                    </div>

                    {/* Arrow */}
                    <div className="w-8 h-8 rounded-full bg-sunken border border-line flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="text-ink-muted" />
                    </div>

                    {/* To Account */}
                    <div className="w-full sm:flex-1 p-3.5 rounded-xl bg-sunken/60 border border-line">
                        <span className="text-3xs font-bold text-ink-muted uppercase block">Destination (Money Lands)</span>
                        {isEditing && isTransfer ? (
                            <select
                                value={payload.to_account_id || ''}
                                onChange={(e) => handleFieldChange('to_account_id', e.target.value)}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink font-semibold"
                            >
                                <option value="">Select Destination Account</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>{b.account_name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <Landmark size={16} className="text-emerald-500 shrink-0" />
                                <span className="font-bold text-ink text-sm truncate">{toAccountName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Details Card */}
            <div className="p-4 rounded-xl bg-surface border border-line shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Reference / Cheque Number</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={payload.reference || ''}
                                onChange={(e) => handleFieldChange('reference', e.target.value)}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink font-mono"
                            />
                        ) : (
                            <span className="font-mono font-bold text-ink mt-0.5 block">
                                {payload.reference || '—'}
                            </span>
                        )}
                    </div>

                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Bank Transfer Fee</span>
                        {isEditing ? (
                            <input
                                type="number"
                                step="any"
                                value={transferFee}
                                onChange={(e) => handleFieldChange('fee', e.target.value)}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink text-right font-mono"
                            />
                        ) : (
                            <span className="font-bold text-ink mt-0.5 block tabular-nums">
                                {transferFee > 0 ? formatCurrency(transferFee, store) : 'Rs 0 (No fee)'}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-3xs font-semibold text-ink-muted uppercase block mb-1">Purpose / Notes</span>
                    {isEditing ? (
                        <textarea
                            value={payload.notes || payload.description || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows={2}
                            placeholder="Enter transfer details..."
                            className="w-full p-2 text-xs rounded-lg border border-line bg-surface text-ink"
                        />
                    ) : (
                        <p className="p-2.5 rounded-lg bg-sunken/40 border border-line text-xs italic text-ink">
                            {payload.notes || payload.description || 'No additional transfer remarks recorded.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
