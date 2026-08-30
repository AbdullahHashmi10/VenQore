import React, { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { PackageCheck } from 'lucide-react';

import { Field } from '@/Documents/DocumentShell';
import MoneyDocument, { uid, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';
import { formatCurrency } from '@/Utils/format';

const DOC = documentType('goods-receipt');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/**
 * The goods receipt.
 *
 * A count at the door, not a negotiation: the prices were agreed on the
 * purchase, so no money appears on this screen at all. What matters here is
 * how many actually turned up, and what batch and expiry are printed on them —
 * the only place in the app where those are captured, and the figures every
 * FIFO cost and every expiry report is built on afterwards.
 *
 * Each line starts at what is still outstanding and is capped there. The
 * server checks the same thing again under a row lock, so two people
 * receiving the same delivery cannot book it twice.
 */
export default function ReceivePurchase({ purchase, items = [] }) {
    const { store, settings } = usePage().props;
    const money = (n) => formatCurrency(n, store || settings);

    const remainingOf = (i) => Math.max(0, num(i.qty ?? i.quantity) - num(i.received_qty));

    const seed = useCallback(() => ({
        id: purchase?.id || uid(),
        party: { id: purchase?.party_id, name: purchase?.supplier_name || 'Supplier' },
        reference: purchase?.reference_number || purchase?.invoice_number || '',
        date: today(),
        notes: '',
        items: (items || []).map((i) => ({
            id: uid(),
            product: { id: i.product_id, name: i.product_name, sku: i.sku, unit: i.base_unit },
            source_line_id: i.id,
            ordered_quantity: num(i.qty ?? i.quantity),
            max_quantity: remainingOf(i),
            /* Everything outstanding, because that is what a delivery usually
               is. A short one is a number the operator changes, not a form
               they have to fill in from scratch. */
            quantity: remainingOf(i),
            price: num(i.unit_cost),
            cost: num(i.unit_cost),
            batch: '',
            expiry: '',
        })),
    }), [purchase, items]);

    /* What this delivery is worth at the costs already agreed — the figure
       that will be locked into the FIFO batches and reach cost of sales. */
    const valueOf = (lines) => lines.reduce((s, i) => s + num(i.quantity) * num(i.price), 0);

    return (
        <MoneyDocument
            doc={DOC}
            seed={seed}
            transport="inertia"
            method="post"
            saveLabel="Receive these goods"
            partyLocked
            lockItems
            canAddLines={false}
            qtyFloor={0}
            url={() => route('store.v3.purchases.receive.store', { store_slug: store?.slug, purchase: purchase?.id })}
            afterUrl={route('store.v3.purchases.show', { store_slug: store?.slug, purchase: purchase?.id })}
            validate={({ items: lines }) => {
                if (!lines.some((i) => num(i.quantity) > 0)) {
                    return { items: 'Nothing is being received — put a quantity against at least one line.' };
                }
                const over = lines.find((i) => num(i.quantity) > num(i.max_quantity) + 0.0001);
                if (over) return { items: `Only ${over.max_quantity} of ${over.product?.name} is still outstanding.` };
                const dated = lines.find((i) => i.expiry && i.expiry < today());
                if (dated) return { items: `${dated.product?.name} has an expiry date in the past.` };
                return null;
            }}
            header={({ d, patch, chrome }) => (
                <>
                    <Field label="Against purchase" span={4}>
                        <div className="vqdoc-in" style={{ display: 'flex', alignItems: 'center' }}>
                            {purchase?.reference_number || purchase?.invoice_number || 'This purchase'}
                        </div>
                    </Field>
                    {/* No date field: the receive endpoint books the delivery as
                        of now and takes no date, so one here would be a
                        control the operator could change to no effect. */}
                    {chrome.field('notes') && (
                        <Field label="Condition on arrival" span={5}
                            hint="Kept with the purchase — it is the one thing nobody can reconstruct later.">
                            <input type="text" className="vqdoc-in" value={d.notes}
                                placeholder="Two cartons crushed, driver noted it…"
                                onChange={(e) => patch({ notes: e.target.value })} />
                        </Field>
                    )}
                </>
            )}
            dockTotal={({ items: lines }) => money(valueOf(lines))}
            dockLabel="Value arriving"
            extraRows={({ items: lines }) => (
                <div className="vqdoc-sum-row">
                    <span className="k">Value arriving</span>
                    <span className="v">{money(valueOf(lines))}</span>
                </div>
            )}
            buildPayload={({ d, items: lines }) => ({
                notes: d.notes || null,
                items: lines
                    .filter((i) => num(i.quantity) > 0)
                    .map((i) => ({
                        purchase_item_id: i.source_line_id,
                        receiving_qty: num(i.quantity),
                        batch_number: i.batch || null,
                        expiry_date: i.expiry || null,
                    })),
            })}
            extraTools={(
                <span className="vqdoc-icon" title="Goods arriving onto the shelf" aria-hidden>
                    <PackageCheck size={17} />
                </span>
            )}
        />
    );
}
