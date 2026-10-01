import React, { useCallback, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('sales-invoice');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function SalesInvoiceApprovalView({
    document = {},
    payload = {},
    locked = true,
    notice,
    extraActions,
    onApproveWithEdits,
    warehouses = [],
    products = [],
    customers = [],
    bankAccounts = [],
    storeSlug,
    actionNotes = '',
}) {
    const { settings } = usePage().props;

    const editSeed = useCallback(() => {
        const p = payload || {};
        return {
            id: document.id || uid(),
            party: p.customer || (p.customer_id || p.party_id ? {
                id: p.customer_id || p.party_id,
                name: p.customer_name || p.party_name || 'Customer',
                current_balance: p.party_balance ?? 0
            } : null),
            date: p.sale_date || p.date || (document.created_at ? document.created_at.slice(0, 10) : today()),
            due_date: p.due_date || '',
            reference: p.reference || p.invoice_number || document.document_number || '',
            warehouse_id: p.warehouse_id || (warehouses?.find(w => w.is_default)?.id || warehouses?.[0]?.id || ''),
            notes: p.notes || p.description || '',
            discount: num(p.discount),
            tax: num(p.tax || p.tax_amount),
            delivery_charge: num(p.delivery_charge || p.shipping_cost || 0),
            extra_charge_value: num(p.extra_charge_value || 0),
            extra_charge_label: p.extra_charge_label || 'Extra',
            paymentMethod: p.payment_method || (p.amount_paid > 0 ? 'cash' : 'credit'),
            amountPaid: num(p.amount_paid ?? p.paid_amount ?? 0),
            paymentAccountId: p.payment_account_id || p.bank_account_id || null,
            paymentAccountKey: p.payment_account_id ? `bank:${p.payment_account_id}` : null,
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
                freeQuantity: num(i.free_qty ?? i.free_quantity ?? 0),
                price: num(i.unit_price ?? i.price ?? i.rate ?? 0),
                discount: num(i.discount_amount ?? i.discount ?? 0),
                discountType: 'fixed',
                tax_rate: i.tax_rate !== undefined && i.tax_rate !== null ? num(i.tax_rate) : null,
            })) : [blankLine()],
        };
    }, [payload, document, warehouses]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={editSeed}
            editSeed={editSeed}
            isEdit={true}
            locked={locked}
            lockNote="This sales invoice is pending review and approval."
            notice={notice}
            extraActions={extraActions}
            products={products}
            parties={customers}
            transport="axios"
            saveLabel="Save & Approve to Ledger"
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
                    warehouse_id: d.warehouse_id || null,
                    date: d.date,
                    due_date: d.due_date || null,
                    reference: d.reference || null,
                    notes: d.notes || null,
                    discount: num(d.discount),
                    tax: num(d.tax),
                    delivery_charge: num(d.delivery_charge),
                    extra_charge_value: num(d.extra_charge_value),
                    extra_charge_label: d.extra_charge_label,
                    payment_method: d.paymentMethod,
                    amount_paid: num(d.amountPaid),
                    payment_account_id: d.paymentAccountId || null,
                    items: priced.map(src => ({
                        product_id: src.product?.id,
                        product_name: src.product?.name,
                        qty: num(src.quantity),
                        free_qty: num(src.freeQuantity || 0),
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
