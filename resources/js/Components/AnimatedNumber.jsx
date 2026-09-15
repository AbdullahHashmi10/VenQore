import React from 'react';
import NumberFlow, { useNumberFlowGroup } from '@number-flow/react';

/**
 * AnimatedNumber — Smooth rolling odometer digit animations
 * Inspired by Skiper UI & 21st.dev
 */
export default function AnimatedNumber({
    value = 0,
    format = undefined,
    locales = 'en-US',
    currency = undefined,
    prefix = '',
    suffix = '',
    className = '',
    trend = true,
    animated = true,
    digits = undefined,
    ...props
}) {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : Number(value) || 0;

    const formatOptions = format || (currency ? {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: digits !== undefined ? digits : (numericValue % 1 === 0 ? 0 : 2),
        maximumFractionDigits: digits !== undefined ? digits : 2,
    } : {
        minimumFractionDigits: digits !== undefined ? digits : (numericValue % 1 === 0 ? 0 : 2),
        maximumFractionDigits: digits !== undefined ? digits : 2,
    });

    if (!animated) {
        return (
            <span className={`inline-flex items-baseline font-mono ${className}`}>
                {prefix}
                {numericValue.toLocaleString(locales, formatOptions)}
                {suffix}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-baseline font-mono tracking-tight select-none ${className}`}>
            {prefix && <span className="mr-0.5 select-none">{prefix}</span>}
            <NumberFlow
                value={numericValue}
                locales={locales}
                format={formatOptions}
                trend={trend}
                className="font-inherit font-mono"
                {...props}
            />
            {suffix && <span className="ml-0.5 select-none">{suffix}</span>}
        </span>
    );
}
