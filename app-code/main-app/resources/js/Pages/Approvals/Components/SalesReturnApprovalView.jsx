import React, { useCallback } from 'react';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('sale-return');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function SalesReturnApprovalView({
    document = {},
    payload = {},
    locked = true,
    notice,
    extraActions,
    onApproveWithEdits,
    products = [],
    customers = [],
    storeSlug,
    actionNotes = '',
}) {
    const editSeed = useCallback(() => {
        const p = payload || {};
        return {
            id: document.id || uid(),
            party: p.customer || (p.customer_id || p.party_id ? {
                id: p.customer_id || p.party_id,
                name: p.customer_name || p.party_name || 'Customer',
                current_balance: p.party_balance ?? 0
            } : null),
            date: p.return_date || p.date || (document.created_at ? document.created_at.slice(0, 10) : today()),
            reference: p.reference || document.document_number || '',
            reason: p.reason || p.notes || '',
            notes: p.notes || '',
            refund: num(p.amount_refunded ?? p.refund_amount ?? p.amount ?? 0),
            items: (p.items && p.items.length) ? p.items.map(i => ({
                id: uid(),
                product: {
                    id: i.product_id || i.id,
                    name: i.product_name || i.item_name || i.name || 'Product',
                    unit: i.base_unit || i.unit_name || i.unit || 'pcs',
                    sale_price: num(i.unit_price ?? i.price ?? i.rate ?? 0)
                },
                quantity: num(i.qty ?? i.quantity ?? 1),
                ordered_quantity: num(i.ordered_qty ?? i.max_quantity ?? i.quantity ?? 1),
                price: num(i.unit_price ?? i.price ?? i.rate ?? 0),
                discount: num(i.discount_amount ?? i.discount ?? 0),
                tax_rate: num(i.tax_rate ?? 0),
            })) : [blankLine()],
        };
    }, [payload, document]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={editSeed}
            editSeed={editSeed}
            isEdit={true}
            locked={locked}
            lockNote="This sales return / credit note is pending review and approval."
            notice={notice}
            extraActions={extraActions}
            products={products}
            parties={customers}
            transport="axios"
            saveLabel="Save & Approve Credit Note"
            afterUrl={route('store.approvals.inbox', { store_slug: storeSlug })}
            url={() => route('store.approvals.approve', { store_slug: storeSlug, id: document.id })}
            onSaved={onApproveWithEdits}
            buildPayload={({ d, items, totals }) => {
                const priced = items.filter(i => i.product);
                const updatedPayload = {
                    customer_id: d.party?.id,
                    party_id: d.party?.id,
                    customer_name: d.party?.name,
                    date: d.date,
                    reason: d.reason,
                    notes: d.notes,
                    amount: totals.grandTotal,
                    items: priced.map(src => ({
                        product_id: src.product?.id,
                        product_name: src.product?.name,
                        qty: num(src.quantity),
                        unit_price: num(src.price),
                        discount_amount: num(src.discount),
                        tax_rate: num(src.tax_rate ?? 0),
                    })),
                };

                return {
                    notes: actionNotes || 'Approved with reviewer modifications',
                    version: document.version,
                    updated_payload: updatedPayload,
                    updated_amount: totals.grandTotal,
                };
            }}
        />
    );
}
