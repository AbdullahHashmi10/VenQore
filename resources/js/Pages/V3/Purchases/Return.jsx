import React, { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Undo2 } from 'lucide-react';

import { Field } from '@/Documents/DocumentShell';
import MoneyDocument, { uid, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('purchase-return');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The purchase return.
 *
 * Opened from the purchase it answers to, so the lines are already known and
 * so is the batch each one came out of: goods go back at the cost they came
 * in at, per FIFO batch, which is why the rate is reported here rather than
 * offered. What the operator is deciding is how many of each are leaving.
 *
 * The cap on every line is that batch's remaining quantity — the server
 * re-checks it under a row lock, because a cap enforced only in a browser is
 * not a cap.
 */
export default function PurchaseReturn({ purchase, items = [] }) {
    const { store } = usePage().props;

    const seed = useCallback(() => ({
        id: purchase?.id || uid(),
        party: { id: purchase?.party_id, name: purchase?.supplier_name || 'Supplier' },
        reference: purchase?.reference_number || purchase?.invoice_number || '',
        date: today(),
        reason: '',
        notes: '',
        discount: 0,
        tax: 0,
        amountPaid: 0,
        paymentMethod: 'credit',
        items: (items || []).map((i) => ({
            id: uid(),
            product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit },
            source_line_id: i.id,
            inventory_batch_id: i.inventory_batch_id,
            ordered_quantity: num(i.original_qty),
            /* What is left in THIS batch, which is not the same as what was
               bought on the line — some of it may already be sold or already
               returned. */
            max_quantity: Math.max(0, num(i.remaining_qty)),
            quantity: 0,
            price: num(i.unit_cost),
            discount: 0,
            discountType: 'fixed',
            cost: num(i.unit_cost),
        })),
    }), [purchase, items]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            transport="inertia"
            method="post"
            saveLabel="Send these back"
            partyLocked
            lockItems
            canAddLines={false}
            qtyFloor={0}
            /* The value of a return is the batch cost of what is going back —
               not a price anybody is negotiating here. */
            readOnlyCells={{ rate: true, disc: true, total: true }}
            url={() => route('store.v3.purchases.return.store', { store_slug: store?.slug, purchaseId: purchase?.id })}
            afterUrl={route('store.v3.purchases.show', { store_slug: store?.slug, purchase: purchase?.id })}
            validate={({ d, items: lines }) => {
                if (!d.reason?.trim()) return { reason: 'Say why these are going back — the supplier will ask.' };
                if (!lines.some((i) => num(i.quantity) > 0)) {
                    return { items: 'Put a quantity against at least one line.' };
                }
                const over = lines.find((i) => num(i.quantity) > num(i.max_quantity) + 0.0001);
                if (over) return { items: `Only ${over.max_quantity} of ${over.product?.name} is left to send back.` };
                return null;
            }}
            header={({ d, patch, chrome, errors }) => (
                <>
                    <Field label="Against purchase" span={4}>
                        <div className="vqdoc-in" style={{ display: 'flex', alignItems: 'center' }}>
                            {purchase?.reference_number || purchase?.invoice_number || 'This purchase'}
                        </div>
                    </Field>
                    {chrome.field('date') && (
                        <Field label="Return date" span={3}>
                            <input type="date" className="vqdoc-in" value={d.date} max={today()}
                                onChange={(e) => patch({ date: e.target.value })} />
                        </Field>
                    )}
                    <Field label="Reason" span={5} required error={errors.reason}>
                        <input type="text" className="vqdoc-in" value={d.reason}
                            placeholder="Damaged on arrival, wrong item sent, short shipment…"
                            onChange={(e) => patch({ reason: e.target.value })} />
                    </Field>
                </>
            )}
            buildPayload={({ d, items: lines }) => ({
                return_date: d.date,
                reason: d.reason,
                /* Only the lines actually going back, each naming its batch.
                   The old screen computed this filter and then threw it away —
                   `useForm().post(url, { data })` takes visit options, not a
                   payload — so every empty row was posted too. */
                items: lines
                    .filter((i) => num(i.quantity) > 0)
                    .map((i) => ({
                        purchase_item_id: i.source_line_id,
                        inventory_batch_id: i.inventory_batch_id,
                        return_qty: num(i.quantity),
                    })),
            })}
            extraTools={(
                <span className="vqdoc-icon" title="Goods leaving the shelf, back to the supplier" aria-hidden>
                    <Undo2 size={17} />
                </span>
            )}
        />
    );
}
