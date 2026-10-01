import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';

export default function ChequeSelector({
    bankAccountId,
    value,
    onChange,
    error,
    disabled = false,
    className = ''
}) {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (!bankAccountId) {
            setLeaves([]);
            setFetchError(null);
            if (value) {
                onChange('');
            }
            return;
        }

        let isMounted = true;
        setLoading(true);
        setFetchError(null);

        axios.get('/banking/cheque-books/available-leaves', {
            params: { bank_account_id: bankAccountId }
        })
        .then(res => {
            if (isMounted) {
                const available = res.data?.leaves || [];
                setLeaves(available);
                // If current value is not in available leaves and not empty, reset it
                if (value && !available.some(l => l.id === value)) {
                    onChange('');
                }
            }
        })
        .catch(err => {
            if (isMounted) {
                setFetchError(err.response?.data?.message || 'Failed to load available cheque leaves');
            }
        })
        .finally(() => {
            if (isMounted) {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [bankAccountId]);

    if (!bankAccountId) {
        return (
            <div className={`text-xs text-neutral-400 italic p-2 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg ${className}`}>
                Select a bank account first to view and select available cheque leaves.
            </div>
        );
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Cheque Leaf <span className="text-red-500">*</span>
            </label>

            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled || loading || leaves.length === 0}
                    className={`w-full rounded-lg border text-sm transition-colors py-2 px-3 pr-8 ${
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-neutral-300 dark:border-neutral-700 focus:border-brand-500 focus:ring-brand-500'
                    } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 disabled:opacity-50`}
                >
                    <option value="">
                        {loading
                            ? 'Loading available leaves...'
                            : leaves.length === 0
                            ? 'No available leaves found'
                            : '-- Select Available Cheque Leaf --'}
                    </option>
                    {leaves.map((leaf) => (
                        <option key={leaf.id} value={leaf.id}>
                            {leaf.display_serial_number} (Serial #{leaf.serial_number})
                        </option>
                    ))}
                </select>

                {loading && (
                    <div className="absolute right-3 top-2.5 text-neutral-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}

            {fetchError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {fetchError}
                </p>
            )}

            {!loading && bankAccountId && leaves.length === 0 && !fetchError && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">No available cheque leaves</p>
                        <p>This bank account has no available cheque leaves. Please register a new chequebook under Banking → Chequebooks.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
