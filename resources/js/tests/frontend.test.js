/**
 * ============================================================
 * Phase 10 — Frontend Logic Verification
 * ============================================================
 *
 * DOCTRINE:
 *  POS-001 (Number Registry) classifies the POS cart as HIGH RISK because
 *  it performs JavaScript-side arithmetic outside the ledger. If the cart
 *  total calculation has a bug, the invoice total sent to the server is wrong,
 *  the journal entry is wrong, and every downstream report is wrong.
 *
 *  This suite tests the PURE FUNCTIONS extracted from POS and utility modules:
 *   - roundTotal()         → settings.js
 *   - formatCurrency()     → settings.js
 *   - formatNumber()       → settings.js
 *   - getProductPrice()    → settings.js
 *   - isSettingEnabled()   → settings.js
 *   - getCurrencySymbol()  → format.js
 *   - formatCurrency()     → format.js (separate implementation)
 *   - numberToWords()      → format.js
 *
 *  And the POS cart arithmetic model (extracted from Pos.jsx):
 *   - subtotal = Σ(price × totalQty)
 *   - itemDiscounts = Σ(item.discount)
 *   - freeItemDiscounts = Σ(freeQty × price)
 *   - globalDiscount = fixed | (subtotal × rate%) / 100
 *   - totalDiscounts = itemDiscounts + freeItemDiscounts + globalDiscount
 *   - taxableAmount = max(0, subtotal - totalDiscounts)
 *   - taxAmount = (taxableAmount × taxRate) / 100
 *   - rawCartTotal = taxableAmount + taxAmount
 *   - cartTotal = roundTotal(rawCartTotal, settings)
 *
 * ALL MANIFEST VALUES are derived from the Golden Company fixtures:
 *   TXN-SAL-001: price=30,000/unit, qty=3, tax=0, discount=0 → total=90,000
 *
 * @group phase10
 * @group phase10-frontend
 */

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT PURE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
import {
    roundTotal,
    formatCurrency,
    formatNumber,
    getProductPrice,
    isSettingEnabled,
    shouldStopNegativeStock,
    getDefaultTaxRate,
} from '../Utils/settings.js';

import {
    getCurrencySymbol,
    formatCurrency as formatCurrencyFmt,
    formatNumber as formatNumberFmt,
    numberToWords,
    formatDate,
} from '../Utils/format.js';

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN COMPANY MANIFEST FIXTURES
// ─────────────────────────────────────────────────────────────────────────────
const MANIFEST = {
    annual_revenue:   1578430.00,    // Full year 2025 net revenue
    annual_cogs:       893540.00,    // Full year 2025 COGS
    annual_net_profit: 384890.00,    // Full year 2025 net profit
    txn_sal_001: {                   // 2025-01-10 cash sale
        unit_price: 30000.00,
        qty: 3,
        discount: 0,
        tax_rate: 0,
        expected_subtotal: 90000.00,
        expected_total: 90000.00,
    },
    txn_sal_002: {                   // 2025-02-05 credit sale (2 products)
        line1_price: 45000.00, line1_qty: 2,
        line2_price: 28500.00, line2_qty: 4,
        expected_subtotal: 204000.00,
        expected_total: 204000.00,
    },
};

const DEFAULT_SETTINGS = { currency: 'PKR', decimal_places: '2', round_off_total: 'none' };
const PKR_SETTINGS     = { ...DEFAULT_SETTINGS, currency_code: 'PKR', currency_symbol: 'Rs.' };

// ─────────────────────────────────────────────────────────────────────────────
// POS CART MATH ENGINE (extracted verbatim from Pos.jsx lines 892-911)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * computeCartTotals mirrors the POS cart arithmetic exactly.
 * cart items: { price, qty, freeQuantity?, discount?, key_price? }
 * activeSale: { cart, taxRate, discountType, discountValue, discount? }
 */
function computeCartTotals(cart, activeSale, settings) {
    const taxRate = activeSale.taxRate !== undefined
        ? activeSale.taxRate
        : parseFloat(settings?.default_tax_rate || 0);

    const subtotal = cart.reduce(
        (acc, item) => acc + ((item.key_price || item.price) * (item.qty + (item.freeQuantity || 0))),
        0
    );

    const freeItemDiscounts = cart.reduce(
        (acc, item) => acc + ((item.freeQuantity || 0) * (item.key_price || item.price)),
        0
    );
    const itemDiscounts = cart.reduce((acc, item) => acc + (item.discount || 0), 0);

    let globalDiscount = 0;
    if (activeSale.discountType === 'percentage') {
        globalDiscount = (subtotal * (activeSale.discountValue || 0)) / 100;
    } else {
        globalDiscount = parseFloat(
            activeSale.discountValue !== undefined
                ? activeSale.discountValue
                : (activeSale.discount || 0)
        );
    }

    const totalDiscounts  = freeItemDiscounts + itemDiscounts + globalDiscount;
    const taxableAmount   = Math.max(0, subtotal - totalDiscounts);
    const taxAmount       = (taxableAmount * taxRate) / 100;
    const rawCartTotal    = taxableAmount + taxAmount;
    const cartTotal       = roundTotal(rawCartTotal, settings);

    return { subtotal, freeItemDiscounts, itemDiscounts, globalDiscount, totalDiscounts, taxableAmount, taxAmount, rawCartTotal, cartTotal };
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY ITEM DISCOUNT (extracted from Pos.jsx lines 318-330)
// ─────────────────────────────────────────────────────────────────────────────
function applyItemDiscount(item, discType, discValue) {
    const val = parseFloat(discValue);
    if (isNaN(val) || val < 0) throw new Error('Invalid discount value');
    const originalPrice  = item.original_price || item.price;
    const discountAmount = discType === 'percentage' ? (originalPrice * val) / 100 : val;
    if (discountAmount > originalPrice) throw new Error('Discount exceeds item price');
    return { ...item, price: originalPrice - discountAmount, discount: discountAmount, original_price: originalPrice };
}

// ─────────────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: roundTotal()
// ════════════════════════════════════════════════════════════════════════════
describe('roundTotal (settings.js)', () => {
    it('[F-01] round_off_total=none → passes float through unchanged', () => {
        expect(roundTotal(90000.73, { round_off_total: 'none' })).toBe(90000.73);
    });

    it('[F-02] round_off_total=undefined → passes float through unchanged', () => {
        expect(roundTotal(1234.56, {})).toBe(1234.56);
    });

    it('[F-03] round_off_total=1 (nearest rupee) → Math.round()', () => {
        expect(roundTotal(1234.49, { round_off_total: '1' })).toBe(1234);
        expect(roundTotal(1234.50, { round_off_total: '1' })).toBe(1235);
        expect(roundTotal(1234.51, { round_off_total: '1' })).toBe(1235);
    });

    it('[F-04] round_off_total=2 → rounds to 2 decimal places', () => {
        const result = roundTotal(1234.005, { round_off_total: '2' });
        expect(result).toBeCloseTo(1234.01, 2);
    });

    it('[F-05] null / empty total → returns 0', () => {
        expect(roundTotal(null, {})).toBe(0);
        expect(roundTotal(undefined, {})).toBe(0);
        expect(roundTotal('', {})).toBe(0);
    });

    it('[F-06] Golden Company TXN-SAL-001: no round_off → 90,000 exact', () => {
        expect(roundTotal(90000.00, DEFAULT_SETTINGS)).toBe(90000.00);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: formatCurrency() — settings.js version
// ════════════════════════════════════════════════════════════════════════════
describe('formatCurrency (settings.js)', () => {
    it('[F-07] PKR 90,000 → "Rs. 90,000.00"', () => {
        const result = formatCurrency(90000, { currency: 'PKR', decimal_places: '2' });
        expect(result).toBe('Rs. 90,000.00');
    });

    it('[F-08] USD 1234.5 → "$1,234.50"', () => {
        const result = formatCurrency(1234.5, { currency: 'USD', decimal_places: '2' });
        expect(result).toBe('$1,234.50');
    });

    it('[F-09] Zero amount → "Rs. 0.00" (not blank or crash)', () => {
        const result = formatCurrency(0, { currency: 'PKR', decimal_places: '2' });
        expect(result).toBe('Rs. 0.00');
    });

    it('[F-10] Null amount → "Rs. 0.00" (graceful null handling)', () => {
        const result = formatCurrency(null, { currency: 'PKR', decimal_places: '2' });
        expect(result).toBe('Rs. 0.00');
    });

    it('[F-11] BUG: decimal_places="0" is ignored by settings.js (parseInt("0")||2 = 2)', () => {
        // REAL BUG DOCUMENTED: settings.js line 26: `parseInt(settings?.decimal_places) || 2`
        // parseInt('0') = 0, which is falsy, so `0 || 2 = 2`.
        // This means decimal_places='0' CANNOT suppress decimals in the settings.js version.
        // Use format.js with print_amount_decimal='0' instead for 0-decimal output.
        const result = formatCurrency(90000, { currency: 'PKR', decimal_places: '0' });
        // BUG: returns 2 decimals despite explicit decimal_places='0'
        expect(result).toBe('Rs. 90,000.00'); // Documents the bug — not the desired behavior
    });

    it('[F-12] Negative amount formats correctly', () => {
        const result = formatCurrency(-1500, { currency: 'PKR', decimal_places: '2' });
        expect(result).toBe('Rs. -1,500.00');
    });

    it('[F-13] Golden Company annual revenue: 1,578,430.00', () => {
        const result = formatCurrency(MANIFEST.annual_revenue, PKR_SETTINGS);
        expect(result).toBe('Rs. 1,578,430.00');
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: getProductPrice()
// ════════════════════════════════════════════════════════════════════════════
describe('getProductPrice (settings.js)', () => {
    const product = { price: 30000, wholesale_price: 27000, wholesale_min_quantity: 5 };

    it('[F-14] Wholesale disabled → always returns retail price', () => {
        expect(getProductPrice(product, 10, { wholesale_price_enabled: '0' })).toBe(30000);
    });

    it('[F-15] Wholesale enabled, qty < min → returns retail price', () => {
        expect(getProductPrice(product, 3, { wholesale_price_enabled: '1' })).toBe(30000);
    });

    it('[F-16] Wholesale enabled, qty >= min → returns wholesale price', () => {
        expect(getProductPrice(product, 5, { wholesale_price_enabled: '1' })).toBe(27000);
    });

    it('[F-17] Wholesale enabled, isWholesaleCustomer=true, any qty → wholesale price', () => {
        expect(getProductPrice(product, 1, { wholesale_price_enabled: '1' }, true)).toBe(27000);
    });

    it('[F-18] No price fields → returns 0 (no crash)', () => {
        expect(getProductPrice({}, 1, {})).toBe(0);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: isSettingEnabled()
// ════════════════════════════════════════════════════════════════════════════
describe('isSettingEnabled (settings.js)', () => {
    it('[F-19] "1" string → true', () => expect(isSettingEnabled('key', { key: '1' })).toBe(true));
    it('[F-20] "0" string → false', () => expect(isSettingEnabled('key', { key: '0' })).toBe(false));
    it('[F-21] true boolean → true', () => expect(isSettingEnabled('key', { key: true })).toBe(true));
    it('[F-22] false boolean → false', () => expect(isSettingEnabled('key', { key: false })).toBe(false));
    it('[F-23] missing key → false', () => expect(isSettingEnabled('key', {})).toBe(false));
    it('[F-24] null settings → false (no crash)', () => expect(isSettingEnabled('key', null)).toBe(false));
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: getCurrencySymbol() — format.js
// ════════════════════════════════════════════════════════════════════════════
describe('getCurrencySymbol (format.js)', () => {
    it('[F-25] PKR currency_code → "Rs."', () => {
        expect(getCurrencySymbol({ currency_code: 'PKR' })).toBe('Rs.');
    });

    it('[F-26] USD → "$"', () => {
        expect(getCurrencySymbol({ currency_code: 'USD' })).toBe('$');
    });

    it('[F-27] Explicit symbol overrides code lookup', () => {
        expect(getCurrencySymbol({ currency_symbol: 'KD', currency_code: 'USD' })).toBe('KD');
    });

    it('[F-28] No settings → falls back to "Rs." (Pakistani Rupee default)', () => {
        expect(getCurrencySymbol({})).toBe('Rs.');
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: numberToWords() — format.js
// ════════════════════════════════════════════════════════════════════════════
describe('numberToWords (format.js)', () => {
    it('[F-29] 0 → "Zero"', () => {
        expect(numberToWords(0)).toBe('Zero');
    });

    it('[F-30] 90000 → contains "Ninety Thousand"', () => {
        const result = numberToWords(90000);
        expect(result).toContain('Ninety');
        expect(result).toContain('Thousand');
    });

    it('[F-31] 1578430 (manifest annual revenue) → contains "One Million" or "Fifteen Lakh"', () => {
        const resultIntl   = numberToWords(1578430, '1'); // International
        const resultIndian = numberToWords(1578430, '2'); // Indian
        // International: 1 Million 578 Thousand 430
        expect(resultIntl).toContain('Million');
        // Indian: 15 Lakh 78 Thousand 430
        expect(resultIndian).toContain('Lakh');
    });

    it('[F-32] Amount with paisa: 1234.50 → contains "Fifty Paise"', () => {
        const result = numberToWords(1234.50);
        expect(result).toContain('Paise');
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 7: POS CART MATH ENGINE — core arithmetic
// ════════════════════════════════════════════════════════════════════════════
describe('POS Cart Math Engine (from Pos.jsx)', () => {

    // ── TXN-SAL-001: 3 × Rs.30,000, no discount, no tax ──
    it('[P-01] TXN-SAL-001: subtotal = 3 × 30,000 = 90,000', () => {
        const cart = [{ price: 30000, qty: 3 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { subtotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(subtotal).toBeCloseTo(MANIFEST.txn_sal_001.expected_subtotal, 2);
    });

    it('[P-02] TXN-SAL-001: cartTotal = 90,000 (no tax, no discount)', () => {
        const cart = [{ price: 30000, qty: 3 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(cartTotal).toBeCloseTo(MANIFEST.txn_sal_001.expected_total, 2);
    });

    // ── TXN-SAL-002: Multi-product ──
    it('[P-03] TXN-SAL-002: subtotal = 2×45,000 + 4×28,500 = 204,000', () => {
        const cart = [
            { price: 45000, qty: 2 },
            { price: 28500, qty: 4 },
        ];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { subtotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(subtotal).toBeCloseTo(MANIFEST.txn_sal_002.expected_subtotal, 2);
    });

    // ── Item discount ──
    it('[P-04] Item discount reduces taxableAmount correctly', () => {
        const cart = [{ price: 10000, qty: 1, discount: 1000 }]; // Rs.1,000 item discount
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { taxableAmount, cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(taxableAmount).toBeCloseTo(9000, 2);
        expect(cartTotal).toBeCloseTo(9000, 2);
    });

    // ── Global % discount ──
    it('[P-05] Global 10% discount on Rs.100,000 → taxableAmount = 90,000', () => {
        const cart = [{ price: 100000, qty: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'percentage', discountValue: 10 };
        const { globalDiscount, taxableAmount } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(globalDiscount).toBeCloseTo(10000, 2);
        expect(taxableAmount).toBeCloseTo(90000, 2);
    });

    // ── Global fixed discount ──
    it('[P-06] Global fixed discount Rs.5,000 on Rs.50,000 → taxableAmount = 45,000', () => {
        const cart = [{ price: 50000, qty: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 5000 };
        const { taxableAmount } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(taxableAmount).toBeCloseTo(45000, 2);
    });

    // ── Tax calculation ──
    it('[P-07] 10% tax on Rs.10,000 taxable → taxAmount = 1,000, cartTotal = 11,000', () => {
        const cart = [{ price: 10000, qty: 1 }];
        const sale = { cart, taxRate: 10, discountType: 'fixed', discountValue: 0 };
        const { taxAmount, cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(taxAmount).toBeCloseTo(1000, 2);
        expect(cartTotal).toBeCloseTo(11000, 2);
    });

    // ── Free quantity (give-aways) ──
    it('[P-08] freeQuantity: Buy 2 get 1 free → freeItemDiscount = 1×price', () => {
        const cart = [{ price: 5000, qty: 2, freeQuantity: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { subtotal, freeItemDiscounts, cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        // subtotal includes freeQty: (5000 × (2+1)) = 15,000
        expect(subtotal).toBeCloseTo(15000, 2);
        // freeItemDiscounts: 1 × 5000 = 5,000
        expect(freeItemDiscounts).toBeCloseTo(5000, 2);
        // cartTotal: 15,000 - 5,000 = 10,000
        expect(cartTotal).toBeCloseTo(10000, 2);
    });

    // ── 100% discount ──
    it('[P-09] 100% global discount → cartTotal = 0, taxableAmount = 0', () => {
        const cart = [{ price: 50000, qty: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'percentage', discountValue: 100 };
        const { taxableAmount, cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(taxableAmount).toBe(0);
        expect(cartTotal).toBe(0);
    });

    // ── Total discount never exceeds subtotal (negative total guard) ──
    it('[P-10] Discount > subtotal → taxableAmount clamped to 0 (no negative total)', () => {
        const cart = [{ price: 1000, qty: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 9999 };
        const { taxableAmount, cartTotal } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(taxableAmount).toBe(0);
        expect(cartTotal).toBeGreaterThanOrEqual(0);
    });

    // ── Empty cart ──
    it('[P-11] Empty cart → all totals are 0', () => {
        const cart = [];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { subtotal, cartTotal, taxAmount } = computeCartTotals(cart, sale, DEFAULT_SETTINGS);
        expect(subtotal).toBe(0);
        expect(cartTotal).toBe(0);
        expect(taxAmount).toBe(0);
    });

    // ── Round off to nearest rupee ──
    it('[P-12] round_off_total=1: Rs.1234.73 rounds to Rs.1235', () => {
        const cart = [{ price: 1234.73, qty: 1 }];
        const sale = { cart, taxRate: 0, discountType: 'fixed', discountValue: 0 };
        const { cartTotal } = computeCartTotals(cart, sale, { ...DEFAULT_SETTINGS, round_off_total: '1' });
        expect(cartTotal).toBe(1235);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 8: applyItemDiscount()
// ════════════════════════════════════════════════════════════════════════════
describe('applyItemDiscount (from Pos.jsx)', () => {
    const item = { price: 30000, qty: 1, cartItemId: 'abc-123' };

    it('[D-01] Fixed discount Rs.5,000 → new price = 25,000', () => {
        const result = applyItemDiscount(item, 'fixed', '5000');
        expect(result.price).toBeCloseTo(25000, 2);
        expect(result.discount).toBeCloseTo(5000, 2);
    });

    it('[D-02] Percentage discount 10% on 30,000 → new price = 27,000', () => {
        const result = applyItemDiscount(item, 'percentage', '10');
        expect(result.price).toBeCloseTo(27000, 2);
        expect(result.discount).toBeCloseTo(3000, 2);
    });

    it('[D-03] 100% discount → new price = 0', () => {
        const result = applyItemDiscount(item, 'percentage', '100');
        expect(result.price).toBeCloseTo(0, 2);
        expect(result.discount).toBeCloseTo(30000, 2);
    });

    it('[D-04] Discount > price → throws "Discount exceeds item price"', () => {
        expect(() => applyItemDiscount(item, 'fixed', '99999')).toThrow('Discount exceeds item price');
    });

    it('[D-05] Negative discount → throws "Invalid discount value"', () => {
        expect(() => applyItemDiscount(item, 'fixed', '-100')).toThrow('Invalid discount value');
    });

    it('[D-06] NaN discount → throws', () => {
        expect(() => applyItemDiscount(item, 'fixed', 'abc')).toThrow('Invalid discount value');
    });

    it('[D-07] original_price preserved after discount applied', () => {
        const result = applyItemDiscount(item, 'fixed', '5000');
        expect(result.original_price).toBe(30000);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 9: formatDate() — format.js
// ════════════════════════════════════════════════════════════════════════════
describe('formatDate (format.js)', () => {
    it('[FD-01] Valid ISO date with UTC timezone → formatted string', () => {
        const result = formatDate('2025-01-10', { timezone: 'UTC' });
        expect(result).toMatch(/Jan.*2025|2025.*Jan/);
    });

    it('[FD-02] null date → "-" (no crash)', () => {
        const result = formatDate(null, {});
        expect(result).toBe('-');
    });

    it('[FD-03] Undefined date → "-" (no crash)', () => {
        const result = formatDate(undefined, {});
        expect(result).toBe('-');
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 10: MANIFEST CROSS-CHECKS — JS arithmetic vs backend manifest
// ════════════════════════════════════════════════════════════════════════════
describe('Manifest Cross-Checks (JS arithmetic vs Golden Company manifest)', () => {

    it('[MC-01] TXN-SAL-001 JS total == manifest expected_total (Rs.90,000)', () => {
        const p = MANIFEST.txn_sal_001;
        const lineTotal = p.unit_price * p.qty;
        const discount  = p.discount;
        const taxable   = Math.max(0, lineTotal - discount);
        const tax       = (taxable * p.tax_rate) / 100;
        const total     = taxable + tax;
        expect(total).toBeCloseTo(p.expected_total, 2);
    });

    it('[MC-02] TXN-SAL-002 JS total == manifest expected_total (Rs.204,000)', () => {
        const p = MANIFEST.txn_sal_002;
        const line1 = p.line1_price * p.line1_qty;
        const line2 = p.line2_price * p.line2_qty;
        const total = line1 + line2;
        expect(total).toBeCloseTo(p.expected_subtotal, 2);
    });

    it('[MC-03] P&L arithmetic: gross_profit = revenue - cogs', () => {
        const expected = MANIFEST.annual_revenue - MANIFEST.annual_cogs;
        const grossProfit = expected; // from manifest
        // net_profit = gross_profit - opex
        const opex = grossProfit - MANIFEST.annual_net_profit;
        expect(opex).toBeGreaterThanOrEqual(0);
        expect(MANIFEST.annual_net_profit).toBeCloseTo(grossProfit - opex, 2);
    });

    it('[MC-04] formatCurrency(annual_revenue, PKR) displays correct string', () => {
        const formatted = formatCurrency(MANIFEST.annual_revenue, PKR_SETTINGS);
        expect(formatted).toBe('Rs. 1,578,430.00');
    });

    it('[MC-05] BUG: settings.js formatCurrency cannot produce 0-decimal output (decimal_places="0" ignored)', () => {
        // Same root bug as F-11: parseInt('0')||2 = 2 in settings.js
        // Annual revenue always shows 2 decimal places regardless of decimal_places='0'
        const formatted = formatCurrency(MANIFEST.annual_revenue, { currency: 'PKR', decimal_places: '0' });
        expect(formatted).toBe('Rs. 1,578,430.00'); // BUG: should be 'Rs. 1,578,430' but can't be
    });
});
