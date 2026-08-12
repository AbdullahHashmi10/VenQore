import { formatCurrency, formatNumber } from '@/Utils/format';

/**
 * Format a reading value according to its unit and precision.
 * No mathematical calculation on React-side!
 */
export function formatValue(value, unit, precision = 0, settings = null) {
    if (value === null || value === undefined) {
        return '-';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return value; // text or status states
    }

    switch (unit) {
        case 'currency':
            return formatCurrency(numValue, settings);
        case 'percentage':
            return `${formatNumber(numValue, precision, settings)}%`;
        case 'integer':
            return formatNumber(numValue, 0, settings);
        case 'decimal':
            return formatNumber(numValue, precision, settings);
        default:
            return formatNumber(numValue, precision, settings);
    }
}
