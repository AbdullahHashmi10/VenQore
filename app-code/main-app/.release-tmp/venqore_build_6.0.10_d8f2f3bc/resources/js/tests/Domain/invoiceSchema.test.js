/**
 * invoiceSchema.test.js
 *
 * Unit tests for the pure arithmetic helpers in the invoice domain.
 * These run in the frontend test harness (Vitest) — no browser, no HTTP.
 */

import { describe, it, expect } from 'vitest';
import {
    blankLine,
    blankInvoice,
    saleToInvoiceState,
    lineDiscount,
    lineGross,
    computeTotals,
} from '../../Domain/invoice/invoiceSchema';

// ---------------------------------------------------------------------------
// lineDiscount
// ---------------------------------------------------------------------------
describe('lineDiscount', () => {
    it('returns fixed discount verbatim', () => {
        expect(lineDiscount({ quantity: 2, price: 100, discount: 15, discountType: 'fixed' })).toBe(15);
    });

    it('returns percent discount as fraction of line subtotal', () => {
        // 2 × 100 = 200 subtotal; 10% = 20
        expect(lineDiscount({ quantity: 2, price: 100, discount: 10, discountType: 'percent' })).toBe(20);
    });

    it('returns 0 when no discount provided', () => {
        expect(lineDiscount({ quantity: 1, price: 50, discount: 0, discountType: 'fixed' })).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// lineGross
// ---------------------------------------------------------------------------
describe('lineGross', () => {
    it('includes freeQuantity in gross', () => {
        // 3 paid + 1 free = 4 × 50 = 200
        expect(lineGross({ quantity: 3, freeQuantity: 1, price: 50 })).toBe(200);
    });

    it('treats missing freeQuantity as 0', () => {
        expect(lineGross({ quantity: 2, price: 75 })).toBe(150);
    });
});

// ---------------------------------------------------------------------------
// computeTotals
// ---------------------------------------------------------------------------
describe('computeTotals', () => {
    const line1 = blankLine({ quantity: 2, price: 100, discount: 0, discountType: 'fixed', cost: 60 });
    const line2 = blankLine({ quantity: 1, price: 200, discount: 10, discountType: 'percent', cost: 120 });

    it('computes subtotal correctly', () => {
        const { subtotal } = computeTotals({ items: [line1, line2] });
        // line1: (2+0)×100 = 200; line2: (1+0)×200 = 200 → subtotal = 400
        expect(subtotal).toBe(400);
    });

    it('deducts item-level discounts', () => {
        const { itemDiscounts, afterItemDiscounts } = computeTotals({ items: [line1, line2] });
        // line1: fixed 0, line2: 10% of (1×200) = 20
        expect(itemDiscounts).toBe(20);
        // 400 - 20 = 380
        expect(afterItemDiscounts).toBe(380);
    });

    it('deducts invoice-level flat discount', () => {
        const { afterDiscount } = computeTotals({ items: [line1, line2], discount: 30 });
        // 380 - 30 = 350
        expect(afterDiscount).toBe(350);
    });

    it('adds tax on after-discount amount', () => {
        const { taxAmount } = computeTotals({ items: [line1, line2], discount: 0, tax: 10 });
        // afterDiscount = 380; 10% of 380 = 38
        expect(taxAmount).toBe(38);
    });

    it('computes grand total correctly with tax and delivery', () => {
        const { grandTotal } = computeTotals({
            items: [line1, line2],
            discount: 0,
            tax: 10,
            delivery_charge: 50,
        });
        // afterDiscount=380; tax=38; delivery=50 → 380+38+50 = 468
        expect(grandTotal).toBe(468);
    });

    it('computes profit correctly', () => {
        const { profit, grandTotal } = computeTotals({ items: [line1, line2] });
        // totalCost = 2×60 + 1×120 = 240;  profit = grandTotal - 240
        // grandTotal here = 580 (no tax/delivery)
        expect(profit).toBe(grandTotal - 240);
    });

    it('computes balance due', () => {
        const { balanceDue } = computeTotals({ items: [line1], amountPaid: 100 });
        // grandTotal = 200, amountPaid = 100, balance = 100
        expect(balanceDue).toBe(100);
    });
});

// ---------------------------------------------------------------------------
// blankLine / blankInvoice / saleToInvoiceState
// ---------------------------------------------------------------------------
describe('invoiceSchema helpers', () => {
    it('blankLine has correct defaults', () => {
        const l = blankLine();
        expect(l.quantity).toBe(1);
        expect(l.discount).toBe(0);
        expect(l.discountType).toBe('fixed');
    });

    it('blankInvoice respects default_tax_rate setting', () => {
        const inv = blankInvoice({ default_tax_rate: '18' });
        expect(inv.tax).toBe(18);
    });

    it('saleToInvoiceState parses payment sum correctly', () => {
        const sale = {
            id: 1, reference_number: 'SI-001', customer: { id: 5 },
            items: [], date: '2026-08-12', notes: '',
            payments: [{ amount: '500' }, { amount: '250' }],
            method: 'credit', discount: '0', tax: '0',
            delivery_charge: '0', extra_charge_value: '0',
            status: 'posted', total: '750', overpayment_action: null,
        };
        const state = saleToInvoiceState(sale);
        expect(state.amountPaid).toBe(750);
        expect(state.originalPaidAmount).toBe(750);
    });
});
