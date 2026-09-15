import { describe, it, expect } from 'vitest';
import { computeCartTotals } from '../../Domain/pos/usePayment';

describe('computeCartTotals', () => {
    it('calculates empty cart correctly', () => {
        const totals = computeCartTotals(null);
        expect(totals.subtotal).toBe(0);
        expect(totals.cartTotal).toBe(0);
    });

    it('calculates basic subtotal and grand total', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 100, original_price: 100, qty: 2 },
                { id: 2, price: 50, original_price: 50, qty: 1 }
            ],
            discountType: 'fixed',
            discountValue: 0
        };

        const totals = computeCartTotals(activeSale);
        expect(totals.subtotal).toBe(250);
        expect(totals.cartTotal).toBe(250);
    });

    it('deducts item-level row discounts correctly', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 90, original_price: 100, qty: 2 }, // Discount of 10 per unit
                { id: 2, price: 50, original_price: 50, qty: 1 }
            ],
            discountType: 'fixed',
            discountValue: 0
        };

        const totals = computeCartTotals(activeSale);
        expect(totals.subtotal).toBe(250);
        expect(totals.itemDiscounts).toBe(20);
        expect(totals.afterItemDiscounts).toBe(230);
        expect(totals.cartTotal).toBe(230);
    });

    it('applies global fixed discount', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 100, original_price: 100, qty: 2 }
            ],
            discountType: 'fixed',
            discountValue: 15
        };

        const totals = computeCartTotals(activeSale);
        expect(totals.globalDiscount).toBe(15);
        expect(totals.cartTotal).toBe(185);
    });

    it('applies global percentage discount', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 100, original_price: 100, qty: 2 }
            ],
            discountType: 'percent',
            discountValue: 10
        };

        const totals = computeCartTotals(activeSale);
        expect(totals.globalDiscount).toBe(20);
        expect(totals.cartTotal).toBe(180);
    });

    it('applies default tax rates correctly', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 100, original_price: 100, qty: 2 }
            ],
            discountType: 'fixed',
            discountValue: 0
        };
        const settings = { default_tax_rate: '15' };

        const totals = computeCartTotals(activeSale, settings);
        expect(totals.taxAmount).toBe(30);
        expect(totals.cartTotal).toBe(230);
    });

    it('respects round total settings', () => {
        const activeSale = {
            cart: [
                { id: 1, price: 99.55, original_price: 99.55, qty: 1 }
            ]
        };
        const settingsWithRounding = { round_off_total: '1' };
        const settingsNoRounding = { round_off_total: 'none' };

        expect(computeCartTotals(activeSale, settingsWithRounding).cartTotal).toBe(100);
        expect(computeCartTotals(activeSale, settingsNoRounding).cartTotal).toBe(99.55);
    });
});
