import React, { useCallback } from 'react';
import MoneyDocument, { uid, blankLine, today } from '@/Documents/MoneyDocument';
import { documentType } from '@/Documents/documentTypes';

const DOC = documentType('expense');
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function OperatingExpenseApprovalView({
    document = {},
    payload = {},
    locked = true,
    notice,
    extraActions,
    onApproveWithEdits,
    categories = [],
    suppliers = [],
    bankAccounts = [],
    storeSlug,
    actionNotes = '',
}) {
    const editSeed = useCallback(() => {
        const p = payload || {};
        const items = p.items && p.items.length ? p.items.map(it => ({
            id: uid(),
            category_id: it.expense_category_id || it.category_id || p.expense_category_id || (categories?.[0]?.id || ''),
            desc: it.description || it.desc || p.description || '',
            amount: num(it.amount ?? p.amount ?? 0),
        })) : [{
            id: uid(),
            category_id: p.expense_category_id || (categories?.[0]?.id || ''),
            desc: p.description || p.notes || '',
            amount: num(p.amount ?? document.amount ?? 0),
        }];

        return {
            id: document.id || uid(),
            party: p.party || (p.payee_id || p.party_id || p.supplier_id ? {
                id: p.payee_id || p.party_id || p.supplier_id,
                name: p.payee || p.party_name || p.supplier_name || 'Payee',
            } : null),
            reference: p.reference || document.document_number || '',
            date: p.expense_date || p.date || (document.created_at ? document.created_at.slice(0, 10) : today()),
            notes: p.description || p.notes || '',
            discount: num(p.discount),
            tax: num(p.tax || p.tax_amount),
            paymentMethod: p.payment_method || 'cash',
            amountPaid: num(p.amount_paid ?? p.amount ?? document.amount ?? 0),
            paymentAccountId: p.bank_account_id || p.payment_account_id || null,
            paymentAccountKey: p.bank_account_id ? `bank:${p.bank_account_id}` : null,
            isCheque: p.payment_method === 'cheque',
            chequeLeafId: p.cheque_leaf_id || null,
            chequeDate: p.cheque_date || today(),
            items,
        };
    }, [payload, document, categories]);

    return (
        <MoneyDocument
            doc={DOC}
            seed={editSeed}
            editSeed={editSeed}
            isEdit={true}
            locked={locked}
            lockNote="This operating expense voucher is pending review and approval."
            notice={notice}
            extraActions={extraActions}
            parties={suppliers}
            categories={categories}
            transport="axios"
            saveLabel="Save & Approve Expense"
            afterUrl={route('store.approvals.inbox', { store_slug: storeSlug })}
            url={() => route('store.approvals.approve', { store_slug: storeSlug, id: document.id })}
            onSaved={onApproveWithEdits}
            buildPayload={({ d, items, totals }) => {
                const validLines = items.filter(i => i.category_id || num(i.amount) > 0);
                const updatedPayload = {
                    party_id: d.party?.id || null,
                    payee: d.party?.name || null,
                    date: d.date,
                    notes: d.notes,
                    description: d.notes,
                    amount: totals.grandTotal,
                    amount_paid: num(d.amountPaid),
                    payment_method: d.paymentMethod,
                    bank_account_id: d.paymentAccountId || null,
                    cheque_leaf_id: d.isCheque ? (d.chequeLeafId || null) : null,
                    cheque_date: d.isCheque ? (d.chequeDate || null) : null,
                    items: validLines.map(src => ({
                        category_id: src.category_id,
                        expense_category_id: src.category_id,
                        description: src.desc,
                        amount: num(src.amount),
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
