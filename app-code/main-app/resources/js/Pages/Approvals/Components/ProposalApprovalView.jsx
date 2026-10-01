import React, { useCallback } from 'react';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('quotation');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function ProposalApprovalView({
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
            date: p.proposal_date || p.date || (document.created_at ? document.created_at.slice(0, 10) : today()),
            validity: p.validity || p.expiry_date || p.due_date || '',
            reference: p.reference || document.document_number || '',
            notes: p.notes || p.terms || '',
            discount: num(p.discount),
            tax: num(p.tax || p.tax_amount),
            items: (p.items && p.items.length) ? p.items.map(i => ({
                id: uid(),
                product: {
                    id: i.product_id || i.id,
                    name: i.product_name || i.item_name || i.name || 'Product',
                    tax_rate: num(i.tax_rate ?? 0),
                    unit: i.base_unit || i.unit_name || i.unit || 'pcs',
                    sale_price: num(i.unit_price ?? i.price ?? i.rate ?? 0)
                },
                quantity: num(i.qty ?? i.quantity ?? 1),
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
            lockNote="This quotation / proposal is pending review and approval."
            notice={notice}
            extraActions={extraActions}
            products={products}
            parties={customers}
            transport="axios"
            saveLabel="Save & Approve Quotation"
            priceOf={(pr) => num(pr.sale_price ?? pr.price ?? 0)}
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
                    validity: d.validity || null,
                    notes: d.notes || null,
                    discount: num(d.discount),
                    tax: num(d.tax),
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
