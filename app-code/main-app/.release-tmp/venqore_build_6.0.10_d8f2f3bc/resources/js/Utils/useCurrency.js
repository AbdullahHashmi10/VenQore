/**
 * useCurrency — Phase 5.2
 *
 * A shared React hook that returns the correct currency symbol regardless
 * of whether the app is running in single-tenant (AMD Outlets) or
 * SaaS multi-tenant (VenQore) mode.
 *
 * Priority:
 *   1. tenant.currency_symbol  — SaaS mode (set by TenantMiddleware::Inertia::share)
 *   2. settings.currency_symbol — Single-tenant mode (from the settings table)
 *   3. 'Rs. '                  — Pakistani Rupee fallback (original default)
 *
 * Usage:
 *   import { useCurrency } from '@/Utils/useCurrency';
 *
 *   const { symbol, format, formatNumber } = useCurrency();
 *
 *   // Display a money value:
 *   <span>{format(1234.5)}</span>   // → "Rs. 1,234.50" or "$ 1,234.50"
 *
 *   // Display symbol only:
 *   <span>{symbol}</span>           // → "Rs. "
 *
 * This replaces ALL hardcoded instances of:
 *   - "Rs."
 *   - "'Rs. '"
 *   - "'Rs'"
 *   - "PKR"
 *   - "$ "
 */

import { usePage } from '@inertiajs/react';

export function useCurrency() {
    const { props } = usePage();

    // Resolve with priority: store/tenant → settings → fallback
    const symbol = props.store?.currency_symbol || props.tenant?.currency_symbol || props.settings?.currency_symbol || 'Rs. ';
    const code   = props.store?.currency_code   || props.tenant?.currency_code   || props.settings?.currency_code || 'PKR';
    const decimals = parseInt(props.settings?.decimal_places !== undefined ? props.settings.decimal_places : 2);

    /**
     * Format a numeric amount as a currency string.
     * e.g. format(1234.5) → "Rs. 1,234.50"
     */
    const format = (amount, d = null) => {
        const num = parseFloat(amount) || 0;
        const finalDecimals = d !== null ? d : decimals;
        
        const formattedNumber = num.toLocaleString('en-US', {
            minimumFractionDigits: finalDecimals,
            maximumFractionDigits: finalDecimals,
        });

        // Ensure single space between symbol and number if not already present
        const s = symbol.trim();
        return `${s} ${formattedNumber}`;
    };

    /**
     * Format a number with commas but no currency prefix.
     * e.g. formatNumber(1234567) → "1,234,567"
     */
    const formatNumber = (amount, d = null) => {
        const num = parseFloat(amount) || 0;
        const finalDecimals = d !== null ? d : decimals;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: finalDecimals,
            maximumFractionDigits: finalDecimals,
        });
    };

    return { symbol: symbol.trim(), code, format, formatNumber };
}

/**
 * Standalone helper for use outside React components (e.g. print callbacks).
 * Falls back to the window.amdSettings object set by OneGlanceLayout.
 */
export function getCurrencySymbol() {
    return window?.amdSettings?.currency_symbol || 'Rs. ';
}
