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

    // SaaS (multi-tenant): TenantMiddleware shares this via Inertia::share('tenant', [...])
    const tenantSymbol = props.tenant?.currency_symbol;

    // Single-tenant: SetupController saves it to the settings table,
    // HandleInertiaRequests shares the entire settings table as props.settings
    const settingsSymbol = props.settings?.currency_symbol;

    // Resolve with priority: tenant → settings → fallback
    const symbol = tenantSymbol || settingsSymbol || 'Rs. ';
    const code   = props.tenant?.currency_code || props.settings?.currency_code || 'PKR';

    /**
     * Format a numeric amount as a currency string.
     * e.g. format(1234.5) → "Rs. 1,234.50"
     */
    const format = (amount, decimals = 2) => {
        const num = parseFloat(amount) || 0;
        return `${symbol}${num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    };

    /**
     * Format a number with commas but no currency prefix.
     * e.g. formatNumber(1234567) → "1,234,567"
     */
    const formatNumber = (amount, decimals = 0) => {
        const num = parseFloat(amount) || 0;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    return { symbol, code, format, formatNumber };
}

/**
 * Standalone helper for use outside React components (e.g. print callbacks).
 * Falls back to the window.amdSettings object set by OneGlanceLayout.
 */
export function getCurrencySymbol() {
    return window?.amdSettings?.currency_symbol || 'Rs. ';
}
