/**
 * Settings-based utility functions for formatting
 * These functions rely on settings being passed from the backend via Inertia
 */

/**
 * Format a number with the configured decimal places
 * @param {number} value - The number to format
 * @param {object} settings - Settings object from Inertia
 * @param {number} decimalOverride - Optional override for decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, settings, decimalOverride = null) {
    const decimals = decimalOverride ?? (parseInt(settings?.decimal_places) || 2);
    return parseFloat(value || 0).toFixed(decimals);
}

/**
 * Format a currency value with symbol
 * @param {number} value - The amount to format
 * @param {object} settings - Settings object from Inertia
 * @param {boolean} includeSymbol - Whether to include currency symbol
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, settings, includeSymbol = true) {
    const decimals = parseInt(settings?.decimal_places) || 2;
    const formatted = parseFloat(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    if (!includeSymbol) return formatted;

    const currency = settings?.currency || 'PKR';
    const symbols = {
        'PKR': 'Rs. ',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'AED': 'AED ',
        'SAR': 'SAR ',
        'INR': '₹',
    };

    return (symbols[currency] || currency + ' ') + formatted;
}

/**
 * Format a date according to settings
 * @param {string|Date} date - The date to format
 * @param {object} settings - Settings object from Inertia
 * @returns {string} Formatted date string
 */
export function formatDate(date, settings) {
    if (!date) return '';

    const d = new Date(date);
    const format = settings?.date_format || 'DD/MM/YYYY';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${day}/${month}/${year}`;
    }
}

/**
 * Round off total if setting is enabled
 * @param {number} total - The total to potentially round
 * @param {object} settings - Settings object from Inertia
 * @returns {number} Rounded or original total
 */
export function roundTotal(total, settings) {
    const shouldRound = settings?.round_off_total === '1' || settings?.round_off_total === true;
    return shouldRound ? Math.round(parseFloat(total || 0)) : parseFloat(total || 0);
}

/**
 * Check if negative stock sales should be stopped
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function shouldStopNegativeStock(settings) {
    return isSettingEnabled('stop_sale_negative_stock', settings);
}

/**
 * Get business info for display
 * @param {object} settings - Settings object from Inertia
 * @returns {object} Business info object
 */
export function getBusinessInfo(settings) {
    return {
        name: settings?.store_name || settings?.business_name || 'VENQORE',
        address: settings?.store_address || settings?.business_address || '',
        phone: settings?.store_phone || settings?.business_phone || '',
        email: settings?.business_email || '',
        taxNumber: settings?.tax_number || '',
        currency: settings?.currency || 'PKR',
    };
}

/**
 * Get print settings
 * @param {object} settings - Settings object from Inertia
 * @returns {object} Print settings object
 */
export function getPrintSettings(settings) {
    return {
        paperSize: settings?.paper_size || 'A4',
        thermalSize: settings?.thermal_page_size || '3inch',
        showLogo: settings?.print_logo !== '0',
        headerAllPages: settings?.print_header_all_pages !== '0',
        signatureText: settings?.print_signature_text || 'Authorized Signatory',
    };
}

/**
 * Check if a feature/setting is enabled
 * @param {string} key - The setting key to check
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isSettingEnabled(key, settings) {
    const value = settings?.[key];
    return value === '1' || value === true || value === 1 || value === 'true';
}

/**
 * Check if wholesale pricing is enabled
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isWholesalePricingEnabled(settings) {
    return isSettingEnabled('wholesale_price_enabled', settings);
}

/**
 * Get the appropriate price for a product based on quantity and wholesale settings
 * @param {object} product - Product object with price and wholesale_price fields
 * @param {number} quantity - Quantity being ordered
 * @param {object} settings - Settings object from Inertia
 * @param {boolean} isWholesaleCustomer - Whether customer is a wholesale customer
 * @returns {number} The applicable price
 */
export function getProductPrice(product, quantity, settings, isWholesaleCustomer = false) {
    if (isWholesalePricingEnabled(settings)) {
        const wholesalePrice = product?.wholesale_price;
        const minQty = product?.wholesale_min_quantity || 1;

        if (wholesalePrice && (quantity >= minQty || isWholesaleCustomer)) {
            return parseFloat(wholesalePrice);
        }
    }

    return parseFloat(product?.price || product?.selling_price || 0);
}

/**
 * Check if batch tracking is enabled
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isBatchTrackingEnabled(settings) {
    return isSettingEnabled('batch_tracking_enabled', settings);
}

/**
 * Check if barcode scanning is enabled
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isBarcodeScanningEnabled(settings) {
    return isSettingEnabled('barcode_scan_enabled', settings);
}

/**
 * Check if loyalty rewards is enabled
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isLoyaltyEnabled(settings) {
    return isSettingEnabled('loyalty_enabled', settings);
}

/**
 * Get default tax rate
 * @param {object} settings - Settings object from Inertia
 * @returns {number}
 */
export function getDefaultTaxRate(settings) {
    return parseFloat(settings?.default_tax_rate) || 0;
}

/**
 * Get auto-logout minutes
 * @param {object} settings - Settings object from Inertia
 * @returns {number}
 */
export function getAutoLogoutMinutes(settings) {
    return parseInt(settings?.auto_logout) || 60;
}

/**
 * Get low stock threshold
 * @param {object} settings - Settings object from Inertia
 * @returns {number}
 */
export function getLowStockThreshold(settings) {
    return parseInt(settings?.low_stock_threshold) || 10;
}

/**
 * Check if cash sale is default
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isCashSaleDefault(settings) {
    return isSettingEnabled('cash_sale_default', settings);
}

/**
 * Check if stock maintenance is enabled
 * @param {object} settings - Settings object from Inertia
 * @returns {boolean}
 */
export function isStockMaintenanceEnabled(settings) {
    return isSettingEnabled('stock_maintenance', settings);
}

