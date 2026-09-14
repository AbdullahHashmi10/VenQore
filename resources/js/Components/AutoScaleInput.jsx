import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

/**
 * AutoScaleInput — Dynamically scales font size to fit container width
 * Inspired by Skiper UI Auto Scale Input
 */
export default function AutoScaleInput({
    value = '',
    onChange,
    placeholder = '0',
    prefix = '',
    suffix = '',
    minFontSize = 14,
    maxFontSize = 48,
    className = '',
    inputClassName = '',
    disabled = false,
    readOnly = false,
    type = 'text',
    ...props
}) {
    const containerRef = useRef(null);
    const textMeasureRef = useRef(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

    const recalculateScale = useCallback(() => {
        const container = containerRef.current;
        const textMeasure = textMeasureRef.current;
        if (!container || !textMeasure) return;

        const availableWidth = container.clientWidth - 24; // padding allowance
        if (availableWidth <= 0) return;

        textMeasure.style.fontSize = `${maxFontSize}px`;
        const measuredWidth = textMeasure.scrollWidth;

        if (measuredWidth > availableWidth) {
            const scaleFactor = availableWidth / measuredWidth;
            const newSize = Math.max(minFontSize, Math.floor(maxFontSize * scaleFactor));
            setFontSize(newSize);
        } else {
            setFontSize(maxFontSize);
        }
    }, [maxFontSize, minFontSize]);

    useEffect(() => {
        recalculateScale();
        window.addEventListener('resize', recalculateScale);
        return () => window.removeEventListener('resize', recalculateScale);
    }, [value, prefix, suffix, recalculateScale]);

    const displayValue = value || placeholder;

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center justify-center w-full overflow-hidden p-2 rounded-2xl bg-surface border border-line transition-all duration-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 ${className}`}
        >
            {/* Hidden measuring element */}
            <div
                ref={textMeasureRef}
                className="absolute opacity-0 pointer-events-none whitespace-pre font-bold tracking-tight select-none invisible"
                aria-hidden="true"
            >
                {prefix}
                {displayValue}
                {suffix}
            </div>

            {/* Display / Input Container */}
            <div className="flex items-baseline justify-center gap-1 w-full max-w-full">
                {prefix && (
                    <span
                        style={{ fontSize: `${Math.max(minFontSize, fontSize * 0.6)}px` }}
                        className="font-bold text-ink-muted select-none transition-all duration-150"
                    >
                        {prefix}
                    </span>
                )}

                <input
                    type={type}
                    value={value}
                    onChange={(e) => {
                        onChange?.(e);
                        requestAnimationFrame(recalculateScale);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.1,
                    }}
                    className={`bg-transparent border-none outline-none text-center font-bold tracking-tight text-ink placeholder-ink-muted/50 p-0 m-0 w-full focus:ring-0 transition-all duration-150 ${inputClassName}`}
                    {...props}
                />

                {suffix && (
                    <span
                        style={{ fontSize: `${Math.max(minFontSize, fontSize * 0.55)}px` }}
                        className="font-semibold text-ink-muted select-none transition-all duration-150"
                    >
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}
