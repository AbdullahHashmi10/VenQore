import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * useChequeLeaves
 *
 * Fetches available cheque leaves for a given bank account ID (or all bank accounts
 * if omitted) and returns options shaped for VqSelect.
 *
 *   const { options, loading, error, leaves } = useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf);
 *
 * The API endpoint is `/banking/cheque-books/available-leaves`
 */
export function useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf) {
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

        axios.get('/banking/cheque-books/available-leaves', { params })
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
    }, [bankAccountId]);

    const options = leaves.map((leaf) => ({
        value: leaf.id,
        label: leaf.bank_account_name
            ? `${leaf.display_serial_number || '#' + leaf.serial_number} — ${leaf.bank_account_name}`
            : (leaf.display_serial_number || `#${leaf.serial_number}`),
        hint: leaf.serial_number ? `Serial ${leaf.serial_number}` : undefined,
    }));

    return { options, loading, error, leaves };
}
