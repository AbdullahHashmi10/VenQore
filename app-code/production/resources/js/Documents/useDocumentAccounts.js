import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * useDocumentAccounts — "where does the money come from / go to", once.
 *
 * Every document that settles has to offer the same short list: the drawer, a
 * cheque, and the bank accounts this shop has actually added. Getting that list
 * right turns out to be fiddly, and each screen that built its own got it wrong
 * in a different way:
 *
 *   · the chart of accounts poured in raw, so "Inventory Asset" and "Prepaid
 *     Expenses" were offered as places to put a customer's cash;
 *   · the same name three times over, because the chart carries duplicates;
 *   · a bank account that a shop had named "Cash in Hand" sitting directly
 *     under the real Cash in Hand, with nothing to tell them apart;
 *   · 'CHEQUE' — a word, not an account — posted to the server as an account
 *     id, where it failed to resolve and fell back to the cash code, so every
 *     cheque quietly debited the till.
 *
 * All of that is fixed here rather than thirteen times over.
 *
 * Each option carries two identities: `id` is what the dropdown is driven by,
 * `realAccountId` is where the money actually posts. Keeping them apart is what
 * lets "Cheque" be a legible choice on screen and a real ledger account on the
 * server.
 */

/* Spelled the way the server reads it: PurchaseService and SaleController both
   understand this sentinel and turn it into Cheques in Hand, opening the
   account the first time one is needed. */
const CHEQUE = 'CHEQUE';

export default function useDocumentAccounts({ storeSlug, direction = 'in', withCheque = true }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [accRes, bankRes] = await Promise.all([
                    window.axios.get(route('store.accounting.accounts.api', { store_slug: storeSlug, type: 'asset' })),
                    window.axios.get(route('store.api.bank-accounts', { store_slug: storeSlug })),
                ]);
                if (!alive) return;

                const raw = accRes.data?.data || accRes.data || [];
                const byCode = (code, ...names) => raw.find(
                    (a) => a.code === code || names.includes(a.name),
                );

                const cashGL = byCode('1000', 'Cash on Hand', 'Cash in Hand');
                const bankGL = byCode('1010', 'Bank Account');
                /* An uncleared cheque is an asset, but it is not the till. If the
                   shop's chart has no account for it the server opens 1020 the
                   first time one is needed. */
                const chequeGL = raw.find((a) => a.code === '1020' || /cheque/i.test(a.name || ''));

                /* `bank_accounts` is not only banks — it is every place the shop
                   keeps money, and its `type` says which: a till, a bank, or a
                   mobile wallet. Treating them all as banks is what put the
                   shop's own drawer in the list a second time, under "Bank
                   account", next to the Cash in Hand it already was. */
                const tills = (bankRes.data || []).map((b) => ({
                    id: `BANK_${b.id}`,
                    kind: b.type === 'cash' ? 'cash' : b.type === 'mobile_wallet' ? 'wallet' : 'bank',
                    name: b.name || b.bank_name || 'Account',
                    bankName: b.bank_name || null,
                    accountNumber: b.account_number || null,
                    /* A till posts to cash, a wallet and a bank to the bank
                       account — the same split the ledger makes. */
                    realAccountId: (b.type === 'cash' ? cashGL?.id : bankGL?.id) || null,
                    bankReferenceId: b.id,
                }));

                /* The generic drawer is only offered when the shop has not
                   registered one of its own. */
                const ownTill = tills.some((t) => t.kind === 'cash');

                const out = [
                    ...(ownTill ? [] : [{ id: 'CASH', name: 'Cash in Hand', kind: 'cash', realAccountId: cashGL?.id || null }]),
                    ...tills.filter((t) => t.kind === 'cash'),
                    ...(withCheque ? [{ id: CHEQUE, name: 'Cheque', kind: 'cheque', realAccountId: chequeGL?.id || null }] : []),
                    ...tills.filter((t) => t.kind !== 'cash'),
                ];

                /* Two rows the operator cannot tell apart are worse than one. Any
                   later row whose visible name AND sub-line already appeared is
                   dropped. */
                const seen = new Set();
                setAccounts(out.filter((a) => {
                    const key = `${String(a.name).trim().toLowerCase()}|${String(a.bankName || a.kind).trim().toLowerCase()}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }));
            } catch (_) {
                /* The drawer at least, so a sale can still be rung up offline. */
                if (alive) setAccounts([{ id: 'CASH', name: 'Cash in Hand', kind: 'cash', realAccountId: null }]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [storeSlug, withCheque]);

    const options = useMemo(() => accounts.map((a) => ({
        value: a.id,
        label: a.name,
        hint: a.kind === 'bank' || a.kind === 'wallet'
            ? [a.bankName, a.accountNumber && `…${String(a.accountNumber).slice(-4)}`].filter(Boolean).join(' · ')
              || (a.kind === 'wallet' ? 'Mobile wallet' : 'Bank account')
            : a.kind === 'cheque'
                ? 'Held until it clears'
                : direction === 'out' ? 'Straight out of the drawer' : 'Straight into the drawer',
    })), [accounts, direction]);

    const hasBank = accounts.some((a) => a.kind === 'bank' || a.kind === 'wallet');

    /* What a picked option means for the document: what to show, where to post,
       and which bank it was, so a payment row can say more than "a bank". */
    const resolve = useCallback((value) => {
        const acc = accounts.find((a) => String(a.id) === String(value));
        if (!acc) return null;
        return {
            paymentAccountKey: acc.id,
            /* 'cash' | 'bank' | 'wallet' | 'cheque'. Screens were deducing this
               from the shape of the key, which is how an expense paid by bank
               came to be posted out of the till. */
            paymentAccountKind: acc.kind,
            paymentAccountId: acc.realAccountId || (acc.id === CHEQUE ? 'CHEQUE' : null),
            bankReferenceId: acc.bankReferenceId || null,
            selectedBankName: acc.kind === 'bank' || acc.kind === 'wallet' ? acc.name : null,
            isCheque: acc.kind === 'cheque',
        };
    }, [accounts]);

    /* The drawer, resolved, for a document that has not been told otherwise. */
    const fallbackAccountId = useMemo(
        () => accounts.find((a) => a.kind === 'cash')?.realAccountId || null,
        [accounts],
    );

    /* The one a document starts on. Every shop has a till and nearly every
       counter sale goes into it, so leaving the box reading "Choose" makes the
       operator answer a question that has an obvious answer. */
    const defaultKey = useMemo(
        () => accounts.find((a) => a.kind === 'cash')?.id || accounts[0]?.id || null,
        [accounts],
    );

    return { accounts, options, resolve, hasBank, loading, fallbackAccountId, defaultKey, CHEQUE };
}
