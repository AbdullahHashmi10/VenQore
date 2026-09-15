import { useEffect, useMemo, useState } from 'react';

/**
 * usePartyBalance — what this party's position with the shop actually is.
 *
 * Read from the ledger, never from `parties.current_balance`. That cached
 * column is written by several code paths, and its sign means the opposite
 * thing for a customer and for a supplier — which is how buying something from
 * a customer came to show their balance going UP when the shop had just taken
 * on a debt to them.
 *
 * One signed figure, always from the shop's point of view:
 *
 *     net > 0    they owe the shop
 *     net < 0    the shop owes them
 *
 * The same party can be both a customer and a supplier, so `receivable` and
 * `payable` come back separately too — a party who owes 10,000 on sales and is
 * owed 4,000 on purchases nets to 6,000, and both halves are worth showing.
 */
export default function usePartyBalance({ storeSlug, partyId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!partyId) { setData(null); return undefined; }
        let alive = true;
        setLoading(true);
        window.axios
            .get(route('store.api.party-balance', { store_slug: storeSlug, party: partyId }))
            .then((res) => { if (alive) setData(res.data); })
            /* A balance the shop cannot fetch is shown as nothing rather than
               as zero: "we do not know" and "they owe nothing" are different
               statements and only one of them is safe to make up. */
            .catch(() => { if (alive) setData(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [storeSlug, partyId]);

    return useMemo(() => ({
        loading,
        known: !!data,
        net: data ? Number(data.net) || 0 : 0,
        receivable: data ? Number(data.receivable) || 0 : 0,
        payable: data ? Number(data.payable) || 0 : 0,
    }), [data, loading]);
}

/**
 * Where a party stands once this document is added to what they already owe.
 *
 * `direction` is the document's own `ledger` value: +1 where the unsettled
 * part increases what they owe the shop, -1 where it increases what the shop
 * owes them, 0 where the document posts nothing.
 */
export function projectBalance({ net, unsettled, direction }) {
    const after = net + (direction || 0) * (unsettled || 0);
    return {
        before: net,
        after,
        moves: !!direction && Math.abs(unsettled || 0) > 0.005,
        /* Said the way a shopkeeper would say it, in whichever direction it
           happens to fall. "Al Ujrat will owe" is simply wrong once the shop
           is the one in debt. */
        label: (name) => (after >= -0.005
            ? `${name} will owe`
            : `You will owe ${name}`),
        beforeLabel: (name) => (net >= -0.005
            ? 'Previous balance'
            : `Already owed to ${name}`),
    };
}
