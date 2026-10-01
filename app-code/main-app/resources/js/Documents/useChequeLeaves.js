import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * useChequeLeaves
 *
 * Fetches available cheque leaves for a given bank account ID (or all bank accounts
 * if omitted) and returns options shaped for VqSelect.
 *
 *   const { options, loading, error, leaves } = useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf, storeSlug);
 *
 * The API endpoint is `/{store_slug}/banking/cheque-books/available-leaves`
 */
export function useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf, storeSlug) {
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
                /* If the currently-selected leaf is not in the new list, clear it. */
                if (selectedLeafId && !available.some((l) => l.id === selectedLeafId)) {
                    onClearLeaf?.();
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

    const options = leaves.map((leaf) => ({
        value: leaf.id,
        label: leaf.bank_account_name
            ? `${leaf.display_serial_number || '#' + leaf.serial_number} — ${leaf.bank_account_name}`
            : (leaf.display_serial_number || `#${leaf.serial_number}`),
        hint: leaf.serial_number ? `Serial ${leaf.serial_number}` : undefined,
    }));

    return { options, loading, error, leaves };
}
