import { presetComposition } from '@/Layout/venqoreLayoutEngine';

const base = presetComposition('column');
const compositions = Object.fromEntries(['overview', 'tables', 'takeaway', 'delivery'].map(tab => [tab, {
    ...base, floor: 'off', showOrder: true,
    catalog: { ...base.catalog, mode: 'right', size: tab === 'takeaway' ? .36 : .5 },
    tender: tab === 'takeaway' ? 'column' : 'sheet', tenderSide: 'right',
}]));
export const fohComposition = tab => compositions[tab] || compositions.tables;

export function payableLines(cart, card) {
    const ids = card?.pending_settle?.mode === 'lines' ? new Set((card.pending_settle.line_ids || []).map(String)) : null;
    return cart.filter(line => !line.paidSaleId && (!ids || ids.has(String(line.lineId || line.cartItemId))));
}

export function orderExtras(card) {
    const delivery = card?.order_type === 'delivery';
    const fee = delivery ? Number(card.delivery?.fee || 0) : 0;
    return {
        customer: card?.party_id ? { id: card.party_id, name: card.customer_name, phone: card.phone } : null,
        walkInName: card?.customer_name || '', remarks: card?.note || '', notes: card?.note || '',
        discountType: 'fixed', discountValue: 0, tipAmount: '',
        additionalCharges: fee, additionalChargesLabel: delivery ? 'Delivery fee' : '', delivery_charge: fee,
    };
}
