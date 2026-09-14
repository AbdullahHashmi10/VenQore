import React, { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, FileSearch } from 'lucide-react';

import { Field, Sheet } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { linePayload } from '@/Documents/documentMoney';
import { formatCurrency } from '@/Utils/format';
import { useAlert } from '@/Contexts/AlertContext';

const DOC = documentType('sale-return');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The sale return.
 *
 * A return answers to a sale. That sounds obvious and it is the thing the old
 * screen did not do: it was a free-form document with a customer and a product
 * search, so the same goods could be handed back three times, each time
 * putting stock on the shelf and cash out of the drawer, and no report would
 * disagree with any of it.
 *
 * Here the sale comes first. Picking it loads its lines, each capped at what
 * is still returnable — sold, less whatever has already come back — and each
 * line carries the id of the ORIGINAL line so the server can enforce the same
 * cap again, per line rather than per product, because the same item can
 * appear twice on one invoice at two prices.
 */
export default function CreateReturn({ aiPrefill }) {
    const { store, settings } = usePage().props;
    const { showAlert } = useAlert();

    const [picking, setPicking] = useState(false);
    const [query, setQuery] = useState('');
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const money = (n) => formatCurrency(n, store || settings);

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        source: null,               /* the sale this answers to */
        reference: '',
        date: today(),
        reason: '',
        notes: '',
        discount: 0,
        tax: 0,
        delivery_charge: 0,
        extra_charge_value: 0,
        extra_charge_label: '',
        paymentMethod: 'cash',
        amountPaid: 0,
        paymentAccountId: null,
        paymentAccountKey: null,
        items: [blankLine()],
        ...(aiPrefill && typeof aiPrefill === 'object' ? aiPrefill : {}),
    }), [aiPrefill]);

    /* ── finding the sale ───────────────────────────────────────────────── */

    const search = useCallback(async (term, partyId) => {
        setLoading(true);
        try {
            const res = await window.axios.get(route('store.api.sales.returnable', { store_slug: store?.slug }), {
                params: { query: term || undefined, party: partyId || undefined },
            });
            setSales(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setSales([]);
        } finally {
            setLoading(false);
        }
    }, [store]);

    useEffect(() => { if (picking) search(query, null); }, [picking]);

    const load = async (saleId, patch) => {
        setLoading(true);
        try {
            const res = await window.axios.get(route('store.api.sales.returnable.show', { store_slug: store?.slug, sale: saleId }));
            const { sale, items, fully_returned: done } = res.data;
            if (done) {
                showAlert({
                    title: 'Nothing left to return',
                    message: `Everything on ${sale.reference} has already come back.`,
                    type: 'warning',
                });
                return;
            }
            patch({
                source: sale,
                party: { id: sale.party_id, name: sale.party_name },
                /* The lines, as they were sold, capped at what is left. A line
                   with nothing returnable is still shown — greyed by its own
                   zero cap — so the operator can see it was already done
                   rather than wondering where it went. */
                items: items.map((i) => ({
                    id: uid(),
                    product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit, tax_rate: i.tax_rate },
                    source_line_id: i.original_sale_item_id,
                    ordered_quantity: i.sold_qty,
                    max_quantity: i.returnable_qty,
                    quantity: i.returnable_qty,
                    freeQuantity: 0,
                    price: i.unit_price,
                    discount: 0,
                    discountType: 'fixed',
                    tax_rate: i.tax_rate,
                    cost: i.cost_price,
                })),
            });
            setPicking(false);
        } catch (err) {
            showAlert({ title: 'Could not load that sale', message: err?.response?.data?.message || 'Try another one.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            transport="axios"
            saveLabel="Take the return"
            /* The lines are the sale's, not a shopping list: the item cannot be
               swapped, only the quantity coming back can be changed. */
            lockItems
            canAddLines={false}
            settleDefault={(d, totals) => (d.paymentMethod === 'cash' ? totals.grandTotal : 0)}
            url={() => route('store.returns.store', { store_slug: store?.slug })}
            validate={({ d, items }) => {
                if (!d.source?.id) return { source: 'Choose the invoice this is being returned against.' };
                if (!items.some((i) => i.product && num(i.quantity) > 0)) {
                    return { items: 'Put a quantity against at least one line.' };
                }
                const over = items.find((i) => i.max_quantity !== undefined && num(i.quantity) > num(i.max_quantity) + 0.0001);
                if (over) {
                    return { items: `Only ${over.max_quantity} of ${over.product?.name} is still returnable on that invoice.` };
                }
                return null;
            }}
            header={({ d, patch, chrome, acct, errors, setSettleMode }) => (
                <>
                    <Field label="Against invoice" span={4} required error={errors.source}>
                        <button type="button" className="vqdoc-in"
                            style={{ textAlign: 'left', cursor: 'pointer' }}
                            onClick={() => setPicking(true)}>
                            {d.source
                                ? `${d.source.reference} · ${money(d.source.total)}`
                                : 'Find the sale being returned…'}
                        </button>
                    </Field>

                    <Field label="Refund" span={4}>
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="cash" aria-pressed={d.paymentMethod === 'cash'}
                                onClick={() => setSettleMode('cash')}>Money back now</button>
                            <button type="button" data-tone="credit" aria-pressed={d.paymentMethod === 'credit'}
                                onClick={() => setSettleMode('credit')}>Credit their account</button>
                        </div>
                    </Field>

                    {chrome.field('refund') && d.paymentMethod === 'cash' && (
                        <Field label="Refund from" span={4}>
                            <VqSelect
                                ariaLabel="Which account the refund is paid out of"
                                value={d.paymentAccountKey ?? acct.defaultKey ?? ''}
                                onChange={(v) => { const p = acct.resolve(v); if (p) patch(p); }}
                                options={acct.options}
                            />
                        </Field>
                    )}

                    {chrome.field('docno') && (
                        <Field label="Return no." span={3}>
                            <input type="text" className="vqdoc-in" value={d.reference}
                                placeholder="Auto" onChange={(e) => patch({ reference: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('date') && (
                        <Field label="Date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.date} max={today()}
                                onChange={(e) => patch({ date: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('reason') && (
                        <Field label="Reason" span={6} hint="It prints on the credit note and shows in the ledger.">
                            <input type="text" className="vqdoc-in" value={d.reason}
                                placeholder="Damaged, wrong size, changed their mind…"
                                onChange={(e) => patch({ reason: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('notes') && (
                        <Field label="Note" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Condition the goods came back in, who authorised it…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, items, totals }) => ({
                customer_id: d.party?.id,
                original_sale_id: d.source?.id,
                return_reason: d.reason || null,
                notes: d.notes || null,
                date: d.date,
                payment_method: d.paymentMethod === 'cash' ? 'cash' : 'credit',
                /* What actually went back over the counter. Anything short of
                   the return's value becomes credit on their account rather
                   than quietly disappearing. */
                amount_refunded: totals.settled,
                payment_account_id: d.paymentMethod === 'cash' ? (d.paymentAccountId || null) : null,
                /* Lines nobody is returning are not part of the return. */
                items: linePayload({
                    doc: DOC,
                    items: items.filter((i) => i.product && num(i.quantity) > 0),
                    totals,
                }),
            })}
            /* A slot given as a function gets the same bag the header does,
               which is how the picker reaches `patch` to replace the lines. */
            extraSheets={({ patch }) => (picking ? (
                <Sheet
                    title="Which sale is coming back?"
                    hint="Only posted sales can be returned against. Picking one loads its lines and caps each of them at what is still returnable."
                    icon={<FileSearch size={18} />}
                    width={760}
                    onClose={() => setPicking(false)}
                >
                    <div className="vqdoc-hdr" style={{ padding: 0 }}>
                        <Field label="Search" span={12}>
                            <div style={{ display: 'flex', gap: 'var(--d-s3)' }}>
                                <input type="text" className="vqdoc-in" value={query} autoFocus
                                    placeholder="Invoice number or customer name"
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') search(query, null); }} />
                                <button type="button" className="vqdoc-btn" onClick={() => search(query, null)}>
                                    <Search size={15} /> Find
                                </button>
                            </div>
                        </Field>
                    </div>

                    <div style={{ display: 'grid', gap: 'var(--d-s2)', marginTop: 'var(--d-s4)' }}>
                        {loading && <span style={{ color: 'var(--vq-text-3)' }}>Looking…</span>}
                        {!loading && !sales.length && (
                            <span style={{ color: 'var(--vq-text-3)' }}>No posted sales match that.</span>
                        )}
                        {sales.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                className="vqdoc-strip"
                                style={{ width: '100%' }}
                                onClick={() => load(s.id, patch)}
                            >
                                <span className="who">{s.party_name || 'Walk-in'}</span>
                                <span className="meta">{s.reference_number} · {(s.posted_at || '').slice(0, 10)}</span>
                                <span className="amt">{money(s.total)}</span>
                            </button>
                        ))}
                    </div>
                </Sheet>
            ) : null)}
        />
    );
}
