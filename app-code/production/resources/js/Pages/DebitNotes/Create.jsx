import React, { useCallback, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { FileSearch, PackageX } from 'lucide-react';

import { Field, Sheet } from '@/Documents/DocumentShell';
import VqSelect from '@/Documents/VqSelect';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { formatCurrency } from '@/Utils/format';

const DOC = documentType('debit-note');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The debit note.
 *
 * It says the shop owes the supplier LESS than their bill claimed — a short
 * delivery, damage, a price that was wrong. It is not paid, so there is no
 * settlement row; it adjusts the ledger, which is the whole of its effect.
 *
 * Two things the old screen decided on the operator's behalf and should not
 * have. It hardcoded `status: 'approved'`, so every note was final the instant
 * it was saved and could never be corrected. And it assumed goods were going
 * back, when a billing adjustment moves no stock at all — which is why that is
 * now a switch, and why the warehouse is only asked for when it is on.
 */
export default function CreateDebitNote({ note, suppliers = [], products = [], warehouses = [] }) {
    const { store, settings } = usePage().props;
    const isEdit = !!note?.id;
    const locked = isEdit && note?.status !== 'pending';

    const [picking, setPicking] = useState(false);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const money = (n) => formatCurrency(n, store || settings);

    const seed = useCallback(() => ({
        id: uid(),
        party: null,
        source: null,
        reference: '',
        date: today(),
        status: 'pending',
        reason: '',
        notes: '',
        returns_stock: false,
        warehouse_id: warehouses?.find((w) => w.is_default)?.id || warehouses?.[0]?.id || '',
        discount: 0,
        tax: num(settings?.default_tax_rate),
        items: [blankLine()],
    }), [warehouses, settings]);

    const editSeed = useCallback(() => ({
        ...seed(),
        id: note.id,
        party: note.supplier ? { id: note.supplier.id, name: note.supplier.name } : null,
        source: note.purchase_id ? { id: note.purchase_id, reference: note.purchase_reference || 'the purchase' } : null,
        reference: note.reference_number || '',
        date: (note.date || '').slice(0, 10) || today(),
        status: note.status || 'pending',
        reason: note.reason || '',
        notes: note.notes || '',
        returns_stock: !!note.returns_stock,
        warehouse_id: note.warehouse_id || '',
        discount: num(note.discount),
        tax: num(note.tax_rate),
        items: (note.items || []).length
            ? note.items.map((i) => ({
                id: uid(),
                product: i.product || { id: i.product_id, name: i.product_name },
                quantity: num(i.quantity),
                price: num(i.unit_price),
                discount: 0,
                discountType: 'fixed',
            }))
            : [blankLine()],
    }), [seed, note]);

    /* Which of this supplier's bills the note is arguing with. `purchase_id`
       has been a column since the table was made and was never once written,
       so a note could not say what it was about. */
    const findBills = async (partyId) => {
        if (!partyId) { setBills([]); return; }
        setLoading(true);
        try {
            const res = await window.axios.get(route('store.api.purchases.for-party', { store_slug: store?.slug, party: partyId }));
            setBills(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            editSeed={editSeed}
            isEdit={isEdit}
            locked={locked}
            lockNote="This note has been approved. It has moved the ledger, so correcting it means raising another one."
            products={products}
            parties={suppliers}
            transport="axios"
            saveLabel={isEdit ? 'Update note' : 'Raise the note'}
            url={({ d }) => (isEdit
                ? route('store.debit-notes.update', { store_slug: store?.slug, id: d.id })
                : route('store.debit-notes.store', { store_slug: store?.slug }))}
            validate={({ d }) => {
                if (d.returns_stock && !d.warehouse_id) {
                    return { warehouse: 'Say which warehouse the goods are going back off.' };
                }
                return null;
            }}
            header={({ d, patch, chrome, errors }) => (
                <>
                    {chrome.field('source') && (
                        <Field label="Against purchase" span={4}
                            hint="Optional, but it is what lets somebody find this note from the bill.">
                            <button type="button" className="vqdoc-in"
                                style={{ textAlign: 'left', cursor: d.party?.id ? 'pointer' : 'not-allowed' }}
                                disabled={!d.party?.id}
                                onClick={() => { setPicking(true); findBills(d.party?.id); }}>
                                {d.source ? d.source.reference : (d.party?.id ? 'Pick the bill this is about…' : 'Choose the supplier first')}
                            </button>
                        </Field>
                    )}

                    <Field label="Goods" span={4}
                        hint={DOC.stock.optionHint}>
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="credit" aria-pressed={!d.returns_stock}
                                onClick={() => patch({ returns_stock: false })}>Billing only</button>
                            <button type="button" data-tone="cash" aria-pressed={!!d.returns_stock}
                                onClick={() => patch({ returns_stock: true })}>Going back too</button>
                        </div>
                    </Field>

                    {d.returns_stock && (
                        <Field label="Goods leave from" span={4} required error={errors.warehouse}>
                            <VqSelect
                                ariaLabel="Which warehouse the goods go back off"
                                value={d.warehouse_id}
                                onChange={(v) => patch({ warehouse_id: v })}
                                options={(warehouses || []).map((w) => ({ value: w.id, label: w.name }))}
                            />
                        </Field>
                    )}

                    <Field label="Stage" span={4}
                        hint="A pending note changes nothing until it is approved.">
                        <div className="vqdoc-seg">
                            <button type="button" data-tone="credit" aria-pressed={d.status === 'pending'}
                                onClick={() => patch({ status: 'pending' })}>Pending</button>
                            <button type="button" data-tone="cash" aria-pressed={d.status === 'approved'}
                                onClick={() => patch({ status: 'approved' })}>Approve now</button>
                        </div>
                    </Field>

                    {chrome.field('docno') && (
                        <Field label="Note no." span={3}>
                            <input type="text" className="vqdoc-in" value={d.reference}
                                placeholder="Auto" onChange={(e) => patch({ reference: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('date') && (
                        <Field label="Date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.date}
                                onChange={(e) => patch({ date: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('reason') && (
                        <Field label="Reason" span={6} required
                            hint="It prints on the note the supplier receives.">
                            <input type="text" className="vqdoc-in" value={d.reason}
                                placeholder="Short delivery, damaged in transit, price differs from the quote…"
                                onChange={(e) => patch({ reason: e.target.value })} />
                        </Field>
                    )}
                    {chrome.field('notes') && (
                        <Field label="Note" span={12}>
                            <textarea className="vqdoc-in" rows={2} value={d.notes}
                                placeholder="Who agreed it, when they were told…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            buildPayload={({ d, totals }) => ({
                supplier_id: d.party?.id,
                purchase_id: d.source?.id || null,
                date: d.date,
                /* Sent only where the server takes it: an approved note is
                   history and its update route refuses one. */
                ...(isEdit ? {} : { status: d.status || 'pending' }),
                reason: d.reason || null,
                notes: d.notes || null,
                returns_stock: !!d.returns_stock,
                warehouse_id: d.returns_stock ? (d.warehouse_id || null) : null,
                discount: totals.invoiceDiscount,
                tax: totals.taxAmount,
                tax_rate: totals.taxRate,
            })}
            extraTools={(
                <span className="vqdoc-icon" title="A debit note reduces what you owe this supplier" aria-hidden>
                    <PackageX size={17} />
                </span>
            )}
            extraSheets={({ patch }) => (picking ? (
                <Sheet
                    title="Which bill is this about?"
                    hint="Their recent purchases. Picking one files the note against it so the two can be found together later."
                    icon={<FileSearch size={18} />}
                    width={700}
                    onClose={() => setPicking(false)}
                >
                    <div style={{ display: 'grid', gap: 'var(--d-s2)' }}>
                        {loading && <span style={{ color: 'var(--vq-text-3)' }}>Looking…</span>}
                        {!loading && !bills.length && (
                            <span style={{ color: 'var(--vq-text-3)' }}>Nothing bought from them yet.</span>
                        )}
                        {bills.map((b) => (
                            <button key={b.id} type="button" className="vqdoc-strip" style={{ width: '100%' }}
                                onClick={() => { patch({ source: { id: b.id, reference: b.reference } }); setPicking(false); }}>
                                <span className="who">{b.reference}</span>
                                <span className="meta">{(b.date || '').slice(0, 10)}{b.invoice_number ? ` · their no. ${b.invoice_number}` : ''}</span>
                                <span className="amt">{money(b.total)}</span>
                            </button>
                        ))}
                        <button type="button" className="vqdoc-btn"
                            onClick={() => { patch({ source: null }); setPicking(false); }}>
                            Not against a particular bill
                        </button>
                    </div>
                </Sheet>
            ) : null)}
        />
    );
}
