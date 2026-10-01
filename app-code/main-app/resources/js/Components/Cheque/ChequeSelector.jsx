import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import VqSelect from '@/Documents/VqSelect';

export default function ChequeSelector({
    bankAccountId,
    value,
    onChange,
    error,
    disabled = false,
    className = '',
    storeSlug
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

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const slug = storeSlug || (pathParts.length > 0 && pathParts[0] !== 'banking' && pathParts[0] !== 'admin' ? pathParts[0] : '');

        let targetUrl = '/banking/cheque-books/available-leaves';
        try {
            if (typeof window.route === 'function') {
                targetUrl = window.route('store.banking.cheque-books.available-leaves', { store_slug: slug || undefined });
            } else if (slug) {
                targetUrl = `/${slug}/banking/cheque-books/available-leaves`;
            }
        } catch (_) {
            if (slug) {
                targetUrl = `/${slug}/banking/cheque-books/available-leaves`;
            }
        }

        axios.get(targetUrl, {
            params: { bank_account_id: bankAccountId }
        })
        .then(res => {
            if (isMounted) {
                const available = res.data?.leaves || [];
                setLeaves(available);
                // If value is empty and leaves exist, auto-suggest the first leaf
                if (!value && available.length > 0) {
                    onChange(available[0].id);
                } else if (value && !available.some(l => l.id === value)) {
                    onChange(available.length > 0 ? available[0].id : '');
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
    }, [bankAccountId, storeSlug]);

    const leafOptions = useMemo(() => {
        return leaves.map((leaf, index) => ({
            value: leaf.id,
            label: `${leaf.display_serial_number}${index === 0 ? ' ★ (Next Available)' : ''}`,
            hint: `Serial #${leaf.serial_number}`,
        }));
    }, [leaves]);

    if (!bankAccountId) {
        return (
            <div className={`text-xs text-neutral-400 italic p-2.5 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg ${className}`}>
                Select a bank account first to view and select available cheque leaves.
            </div>
        );
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">
                Cheque Leaf <span className="text-red-500">*</span>
            </label>

            <div className="relative">
                {loading ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-line bg-app text-xs text-ink-muted">
                        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                        <span>Loading available leaves…</span>
                    </div>
                ) : (
                    <VqSelect
                        value={value || ''}
                        onChange={(val) => onChange(val)}
                        options={leafOptions}
                        disabled={disabled || loading || leaves.length === 0}
                        placeholder={leaves.length === 0 ? "No available leaves in this bank" : "Search leaf serial..."}
                        searchable={true}
                        searchPlaceholder="Type serial or reference..."
                    />
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
