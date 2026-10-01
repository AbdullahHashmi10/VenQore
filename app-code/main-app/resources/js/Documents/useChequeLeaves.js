import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * useChequeLeaves
 *
 * Fetches available cheque leaves for a given bank account ID (or all bank accounts
 * if omitted) and returns options shaped for VqSelect with search and auto-suggestion.
 *
 *   const { options, loading, error, leaves, nextLeaf } = useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf, storeSlug, onAutoSelect);
 *
 * The API endpoint is `/{store_slug}/banking/cheque-books/available-leaves`
 */
export function useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf, storeSlug, onAutoSelect) {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = {};
        if (bankAccountId) {
            params.bank_account_id = bankAccountId;
        }

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

        axios.get(targetUrl, { params })
            .then((res) => {
                if (cancelled) return;
                const available = res.data?.leaves || [];
                setLeaves(available);
                /* If no leaf is currently selected, auto-suggest the next available leaf */
                if (!selectedLeafId && available.length > 0 && onAutoSelect) {
                    onAutoSelect(available[0].id, available[0]);
                } else if (selectedLeafId && !available.some((l) => l.id === selectedLeafId)) {
                    /* If the currently-selected leaf is not in the new list, clear or reset to first */
                    if (available.length > 0 && onAutoSelect) {
                        onAutoSelect(available[0].id, available[0]);
                    } else {
                        onClearLeaf?.();
                    }
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.data?.message || 'Could not load cheque leaves');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bankAccountId, storeSlug]);

    const options = leaves.map((leaf, index) => ({
        value: leaf.id,
        label: leaf.bank_account_name
            ? `${leaf.display_serial_number || '#' + leaf.serial_number} — ${leaf.bank_account_name}${index === 0 ? ' (Next Available)' : ''}`
            : `${leaf.display_serial_number || '#' + leaf.serial_number}${index === 0 ? ' (Next Available)' : ''}`,
        hint: leaf.serial_number ? `Serial ${leaf.serial_number}` : undefined,
    }));

    const nextLeaf = leaves.length > 0 ? leaves[0] : null;

    return { options, loading, error, leaves, nextLeaf };
}
