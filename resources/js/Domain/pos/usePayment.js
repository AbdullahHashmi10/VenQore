/**
 * usePayment.js
 *
 * Headless hook containing payment calculations, change computations,
 * and payload builder for checking out POS sales.
 */

import { useMemo, useCallback } from 'react';
import { roundTotal } from '@/Utils/settings';

export function computeCartTotals(activeSale, settings = {}) {
    if (!activeSale) {
        return {
            subtotal: 0,
            itemDiscounts: 0,
            afterItemDiscounts: 0,
            globalDiscount: 0,
            afterDiscount: 0,
            taxAmount: 0,
            taxRate: 0,
            cartTotal: 0,
            balanceDue: 0
        };
    }

    const cart = activeSale.cart || [];
    
    // 1. Subtotal & item discounts
    const subtotal = cart.reduce((sum, item) => sum + (item.qty * (item.original_price || item.price)), 0);
    const itemDiscounts = cart.reduce((sum, item) => {
        const disc = (item.original_price || item.price) - item.price;
        return sum + (disc * item.qty);
    }, 0);

    const afterItemDiscounts = subtotal - itemDiscounts;

    // 2. Global Discount
    const discountVal = parseFloat(activeSale.discountValue) || 0;
    const isPercent = activeSale.discountType === 'percent';
    const globalDiscount = isPercent ? (afterItemDiscounts * (discountVal / 100)) : discountVal;

    const afterDiscount = Math.max(0, afterItemDiscounts - globalDiscount);

    // 3. Tax
    const taxRate = settings?.default_tax_rate ? parseFloat(settings.default_tax_rate) : 0;
    const taxAmount = afterDiscount * (taxRate / 100);

    // 4. Grand Total
    const rawTotal = afterDiscount + taxAmount;
    const cartTotal = roundTotal(rawTotal, settings);

    // 5. Balance / Cash Received
    const cashReceived = parseFloat(activeSale.cashReceived) || 0;
    const change = Math.max(0, cashReceived - cartTotal);

    return {
        subtotal,
        itemDiscounts,
        afterItemDiscounts,
        globalDiscount,
        afterDiscount,
        taxAmount,
        taxRate,
        cartTotal,
        cashReceived,
        change
    };
}

export function usePayment(activeSale, settings = {}) {
    const totals = useMemo(() => computeCartTotals(activeSale, settings), [activeSale, settings]);

    const buildCheckoutPayload = useCallback((paymentData, selectedWarehouseId, isOffline = false) => {
        if (!activeSale) return null;
        
        let remainingInvoiceTotal = totals.cartTotal;
        const adjustedPayments = (paymentData.payments || []).map(p => {
            const isCash = p.method === 'cash';
            const originalAmount = parseFloat(p.amount) || 0;
            
            if (isCash) {
                const cashPortion = Math.min(originalAmount, remainingInvoiceTotal);
                remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - cashPortion);
                return { ...p, amount: cashPortion };
            } else {
                remainingInvoiceTotal = Math.max(0, remainingInvoiceTotal - originalAmount);
                return p;
            }
        });

        return {
            items: activeSale.cart.map(item => ({
                product_id: item.id,
                variant_id: item.variant_id,
                quantity: item.qty,
                free_quantity: item.freeQuantity || 0,
                price: item.original_price || item.price,
                discount: item.discount || 0,
                discount_type: item.discountType || 'fixed'
            })),
            customer_id: activeSale.customer?.id || null,
            payment_method: 'split',
            warehouse_id: selectedWarehouseId,
            payments: adjustedPayments,
            amount_paid: totals.cartTotal,
            tax: totals.taxAmount,
            tax_rate: totals.taxRate,
            discount: totals.globalDiscount,
            notes: paymentData.notes || '',
            add_to_ledger: paymentData.addToLedger || false,
            source: 'pos',
            is_dropship: false,
        };
    }, [activeSale, totals]);

    return {
        totals,
        buildCheckoutPayload
    };
}
