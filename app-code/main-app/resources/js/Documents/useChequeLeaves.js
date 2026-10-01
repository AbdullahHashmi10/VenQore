import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * useChequeLeaves
 *
 * Fetches available cheque leaves for a given bank account ID and returns
 * options shaped for VqSelect. When `bankAccountId` is falsy the hook returns
 * an empty list and fires `onClearLeaf` so the caller can reset its state.
 *
 *   const { options, loading, error } = useChequeLeaves(bankAccountId, selectedLeafId, onClearLeaf);
 *
 * The API endpoint is `/banking/cheque-books/available-leaves?bank_account_id=…`
 * which is the same endpoint ChequeSelector.jsx uses.
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
        if (!bankAccountId) {
            setLeaves([]);
            setError(null);
            if (selectedLeafId) {
                onClearLeaf?.();
            }
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        axios.get('/banking/cheque-books/available-leaves', {
            params: { bank_account_id: bankAccountId },
        })
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
        label: leaf.display_serial_number || `#${leaf.serial_number}`,
        hint: leaf.serial_number ? `Serial ${leaf.serial_number}` : undefined,
    }));

    return { options, loading, error, leaves };
}
