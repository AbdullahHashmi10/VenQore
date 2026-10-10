import { describe, it, expect } from 'vitest';
import { computeTotals } from '@/Sell/core/cartMath';
import { buildSalePayload } from '@/Sell/core/salePayload';

function calculate(cart, overrides = {}, enableTax = false) {
    const sale = { cart, discountType: 'fixed', discountValue: 0, ...overrides };
    const settings = { round_off_total: 'none', default_tax_rate: '0' };
    const totals = computeTotals({ cart, sale, settings, enableTax, enableFreeQty: false,
        tableMode: false, serviceChargePct: 0, tipEnabled: false, roundOff: false });
    const payload = buildSalePayload({ sale, totals, settings,
        paymentData: { payments: [{ method: 'cash', amount: totals.cartTotal }] },
        registerShift: null, warehouseId: null });
    return { totals, payload };
}

const line = (id, qty, price) => ({ id, qty, price, original_price: price });

describe('Sale money contracts (synthetic examples, not recovered incident payloads)', () => {
    it('keeps a plain sale consistent between displayed total and payment', () => {
        const { totals, payload } = calculate([line('a', 2, 100)]);
        expect(totals.cartTotal).toBe(200);
        expect(payload.payments[0].amount).toBe(200);
    });

    it('does not send fractional paisa when bill rounding is disabled', () => {
        const { totals, payload } = calculate([line('a', 1, 7725)],
            { discountType: 'percentage', discountValue: 12.5 });
        // Deliberately tests representability, without choosing whether discount
        // or net is rounded first. The implementation plan settles that policy.
        for (const value of [totals.cartTotal, payload.discount, payload.payments[0].amount]) {
            expect(value).toBe(Number(value.toFixed(2)));
        }
    });

    it('quantizes a weighed line to currency precision', () => {
        const { totals } = calculate([line('a', 1.235, 399)]);
        expect(totals.cartTotal).toBe(492.77);
    });

    it('uses the server per-line half-up tax policy for two small taxable lines', () => {
        const { totals } = calculate([line('a', 1, 0.05), line('b', 1, 0.05)], { taxRate: 10 }, true);
        // Each line tax is 0.005 -> 0.01; two lines must total 0.02 tax.
        expect(totals.taxAmount).toBe(0.02);
        expect(totals.cartTotal).toBe(0.12);
    });

    it('sends a delivery charge exactly once across the server charge fields', () => {
        const { totals, payload } = calculate([line('a', 2, 450)],
            { additionalCharges: 120, additionalChargesLabel: 'Delivery fee' });
        expect(totals.cartTotal).toBe(1020);
        expect(payload.delivery_charge + payload.extra_charge_value).toBe(120);
    });
});

describe('Cash change comes only from cash (cross-check round 2)', () => {
    const body = (payments, customer = null) => buildSalePayload({
        sale: { customer, cart: [line('a', 1, 100)] },
        totals: { cartTotal: 100, globalDiscount: 0, additionalCharges: 0, serviceCharge: 0, tipAmount: 0, taxAmount: 0, taxRate: 0 },
        paymentData: { payments }, settings: {}, warehouseId: null,
    });

    it('card + cash paid with a larger note: change is from the cash part only', () => {
        const b = body([{ method: 'card', amount: 60 }, { method: 'cash', amount: 50 }]);
        expect([b.tendered_amount, b.cash_tendered, b.change_return]).toEqual([110, 50, 10]);
        expect(b.payments.map(p => p.amount)).toEqual([60, 40]);
    });

    it('a card overpayment never becomes cash change', () => {
        const b = body([{ method: 'card', amount: 150 }]);
        expect([b.cash_tendered, b.change_return]).toEqual([0, 0]);
    });

    it('cash with a credit leg gives no change', () => {
        const b = body([{ method: 'cash', amount: 40 }, { method: 'credit', amount: 60 }], { id: 'c' });
        expect([b.tendered_amount, b.cash_tendered, b.change_return]).toEqual([40, 40, 0]);
    });
});
