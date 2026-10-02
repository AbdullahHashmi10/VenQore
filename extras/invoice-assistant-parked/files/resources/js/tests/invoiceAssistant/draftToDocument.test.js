import { describe, it, expect } from 'vitest';
import { buildInvoiceFromPrefill, describeHandoff, isAssistantPrefill } from '@/Domain/invoiceAssistant/draftToDocument';

let n = 0;
const deps = {
    blankLine: () => ({ id: `b${++n}`, product: null, quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: 'fixed' }),
    uid: () => `u${++n}`,
    today: () => '2026-10-02',
    availableOf: (p, fallback) => (fallback !== undefined ? fallback : p?.available_stock),
    defaultTax: 5,
};

const prefill = (over = {}) => ({
    version: 1, source: 'invoice_assistant', draft_id: 'd-1', revision: 3,
    party: { id: '7', name: 'Ali Traders', current_balance: 120 },
    notes: 'Deliver Monday', payment_method: 'credit', amount_paid: 0, amount_source: 'default_zero',
    date: '2026-10-02', due_date: '2026-10-17',
    items: [
        { product: { id: 1, name: 'ABC-101', cost: 40, tax_rate: 17 }, variant: null, quantity: 3, price: 100, discount: 10, discountType: 'percent', tax_rate: 17, available_stock: 8 },
        { product: { id: 2, name: 'XYZ', cost_price: 5 }, quantity: 10, price: 20, discount: 0, discountType: 'fixed', tax_rate: null, available_stock: 50 },
    ],
    warnings: [{ code: 'price_override', message: 'You asked for 90.' }],
    notices: ['Price of ABC-101 changed since review: 90 → 100.'],
    ...over,
});

describe('buildInvoiceFromPrefill', () => {
    it('refuses a prefill it does not understand', () => {
        expect(() => buildInvoiceFromPrefill({ version: 2, source: 'invoice_assistant', items: [] }, deps)).toThrow('unsupported_prefill');
        expect(() => buildInvoiceFromPrefill({ version: 1, source: 'scan', items: [] }, deps)).toThrow('unsupported_prefill');
        expect(() => buildInvoiceFromPrefill(null, deps)).toThrow();
        expect(isAssistantPrefill(prefill())).toBe(true);
    });

    it('maps the party onto `customer`, which is what the workspace calls it', () => {
        const { invoice } = buildInvoiceFromPrefill(prefill(), deps);
        expect(invoice.customer.id).toBe('7');
        expect(invoice).not.toHaveProperty('party');
    });

    it('keeps every resolved line, adds one blank line, and invents nothing', () => {
        const { invoice, lineCount } = buildInvoiceFromPrefill(prefill(), deps);
        expect(lineCount).toBe(2);
        expect(invoice.items).toHaveLength(3);
        expect(invoice.items[2].product).toBeNull();
        expect(invoice.items[0]).toMatchObject({ quantity: 3, price: 100, discount: 10, discountType: 'percent', tax_rate: 17, cost: 40 });
        expect(invoice.items[1]).toMatchObject({ tax_rate: null, cost: 5 });
    });

    it('drops lines without a product or a positive quantity', () => {
        const p = prefill({ items: [{ product: null, quantity: 1, price: 1 }, { product: { id: 3, name: 'Z' }, quantity: 0, price: 1 }, { product: { id: 4, name: 'Q' }, quantity: 2, price: 3 }] });
        expect(buildInvoiceFromPrefill(p, deps).lineCount).toBe(1);
    });

    it('never settles a bill: a payment METHOD without a stated amount is 0', () => {
        const cash = buildInvoiceFromPrefill(prefill({ payment_method: 'cash', amount_paid: 999, amount_source: 'default_zero' }), deps).invoice;
        expect(cash.paymentMethod).toBe('cash');
        expect(cash.amountPaid).toBe(0);
        expect(cash.assistantStatedPaid).toBe(0);
    });

    it('keeps an amount the operator actually stated', () => {
        const r = buildInvoiceFromPrefill(prefill({ payment_method: 'cash', amount_paid: 250, amount_source: 'explicit' }), deps);
        expect(r.invoice.amountPaid).toBe(250);
        expect(r.statedPayment).toBe(true);
    });

    it('defaults the date, carries the due date, and applies the store tax at invoice level', () => {
        const a = buildInvoiceFromPrefill(prefill({ date: null, due_date: null }), deps).invoice;
        expect(a.date).toBe('2026-10-02');
        expect(a).not.toHaveProperty('dueDate');
        expect(a.tax).toBe(5);
        expect(buildInvoiceFromPrefill(prefill(), deps).invoice.dueDate).toBe('2026-10-17');
    });

    it('records provenance on the tab', () => {
        const { invoice } = buildInvoiceFromPrefill(prefill(), deps);
        expect(invoice.assistantDraftId).toBe('d-1');
        expect(invoice.assistantRevision).toBe(3);
    });

    it('collects notices and warnings for the banner', () => {
        const r = buildInvoiceFromPrefill(prefill(), deps);
        expect(r.notices).toEqual(['Price of ABC-101 changed since review: 90 → 100.', 'You asked for 90.']);
        expect(describeHandoff(r).text).toMatch(/Nothing is saved yet/);
        expect(describeHandoff({ ...r, lineCount: 1 }).text).toMatch(/1 line\./);
    });
});
