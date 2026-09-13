/**
 * invoiceSchema.js
 *
 * Canonical field definitions for invoice / sale form.
 * Consumed by both shells:
 *   - Pages/Sales/CreateInvoice.jsx (classic)
 *   - Next/Screens/Invoice/InvoiceForm.jsx (new)
 *
 * Rule: no JSX, no rendering, no side-effects in this file.
 */

/** Build a blank invoice line with a stable client id. */
export function blankLine(overrides = {}) {
    return {
        id: Date.now() + Math.random(),
        product: null,
        name: '',
        quantity: 1,
        freeQuantity: 0,
        price: 0,
        cost: 0,
        discount: 0,
        discountType: 'fixed', // 'fixed' | 'percent'
        available_stock: null,
        aiRawName: null,
        ...overrides,
    };
}

/** Build a blank invoice (new, not edit). */
export function blankInvoice(settings = {}) {
    return {
        customer: null,
        items: [blankLine()],
        date: new Date().toISOString().split('T')[0],
        notes: '',
        discount: 0,
        tax: settings?.default_tax_rate ? parseFloat(settings.default_tax_rate) : 0,
        delivery_charge: 0,
        extra_charge_value: 0,
        extraFields: [],
        amountPaid: 0,
        paymentMethod: settings?.cash_sale_default === '1' ? 'cash' : 'credit',
        overpaymentAction: null,
    };
}

/** Parse a sale record from the server into edit-mode invoice state. */
export function saleToInvoiceState(sale) {
    return {
        id: sale.id,
        invoiceNumber: sale.reference_number,
        customer: sale.customer,
        items: (sale.items || []).map(i => ({
            id: i.id,
            product: i.product,
            name: i.product?.name || i.name || 'Unknown Item',
            quantity: parseFloat(i.quantity) || 1,
            originalQuantity: parseFloat(i.quantity) || 0,
            freeQuantity: parseFloat(i.free_quantity || 0),
            price: parseFloat(i.unit_price) || parseFloat(i.price) || parseFloat(i.product?.price) || 0,
            cost: parseFloat(i.product?.cost || i.product?.cost_price || 0),
            discount: parseFloat(i.discount_amount || i.discount || 0),
            discountType: i.discount_type || 'fixed',
        })),
        date: sale.date || new Date().toISOString().split('T')[0],
        notes: sale.notes || '',
        amountPaid: (sale.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        originalPaidAmount: (sale.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        paymentMethod: sale.method || 'cash',
        discount: parseFloat(sale.global_discount ?? sale.discount) || 0,
        tax: parseFloat(sale.tax) || 0,
        delivery_charge: parseFloat(sale.delivery_charge) || 0,
        extra_charge_value: parseFloat(sale.extra_charge_value) || 0,
        extraFields: [],
        status: sale.status,
        originalTotal: parseFloat(sale.total) || 0,
        overpaymentAction: sale.overpayment_action,
    };
}

// ---------------------------------------------------------------------------
// Pure arithmetic helpers — no React, always safe to unit-test in isolation
// ---------------------------------------------------------------------------

/** Compute per-line discount amount (supports fixed + percent). */
export function lineDiscount(item) {
    const lineSubtotal = item.quantity * item.price;
    if (item.discountType === 'percent') {
        return lineSubtotal * ((item.discount || 0) / 100);
    }
    return parseFloat(item.discount) || 0;
}

/** Gross value of one line including free-quantity but before discounts. */
export function lineGross(item) {
    return (item.quantity + (item.freeQuantity || 0)) * item.price;
}

/**
 * Compute all invoice totals from the current invoice state.
 */
export function computeTotals(invoice, settings = {}) {
    const items = invoice?.items || [];

    const subtotal     = items.reduce((s, i) => s + lineGross(i), 0);
    const totalCost    = items.reduce((s, i) => s + ((i.quantity + (i.freeQuantity || 0)) * (i.cost || 0)), 0);
    const itemDiscounts = items.reduce((s, i) => {
        const freeItemValue = (i.freeQuantity || 0) * i.price;
        return s + lineDiscount(i) + freeItemValue;
    }, 0);

    const afterItemDiscounts = subtotal - itemDiscounts;
    const invoiceDiscount    = parseFloat(invoice?.discount) || 0;
    const afterDiscount      = afterItemDiscounts - invoiceDiscount;
    const taxAmount          = afterDiscount * ((parseFloat(invoice?.tax) || 0) / 100);
    const deliveryCharge     = parseFloat(invoice?.delivery_charge) || 0;

    let extraCharge = 0;
    if (invoice?.extraFields?.length) {
        extraCharge = invoice.extraFields.reduce((s, f) => s + (parseFloat(f.value) || 0), 0);
    } else {
        extraCharge = parseFloat(invoice?.extra_charge_value) || 0;
    }

    const rawGrandTotal = afterDiscount + taxAmount + deliveryCharge + extraCharge;
    const roundingEnabled = settings?.round_totals === '1';
    const grandTotal = roundingEnabled
        ? Math.round(rawGrandTotal)
        : parseFloat(rawGrandTotal.toFixed(2));

    const balanceDue = grandTotal - (parseFloat(invoice?.amountPaid) || 0);
    const profit     = grandTotal - totalCost;

    return {
        subtotal, itemDiscounts, afterItemDiscounts,
        invoiceDiscount, afterDiscount,
        taxAmount, deliveryCharge, extraCharge,
        rawGrandTotal, grandTotal, totalCost,
        balanceDue, profit,
    };
}
