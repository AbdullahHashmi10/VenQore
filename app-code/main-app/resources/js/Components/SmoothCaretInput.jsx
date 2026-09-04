import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * SmoothCaretInput — Animated smooth gliding cursor input
 * Inspired by Skiper UI & 21st.dev
 */
export default function SmoothCaretInput({
    type = 'text',
    value = '',
    onChange,
    placeholder = '',
    className = '',
    inputClassName = '',
    icon: Icon = null,
    caretColor = 'bg-brand-500',
    disabled = false,
    autoFocus = false,
    id,
    name,
    required = false,
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 20 });
    const inputRef = useRef(null);
    const mirrorRef = useRef(null);
    const containerRef = useRef(null);

    const updateCaretPosition = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        if (!input || !mirror) return;

        const selectionStart = input.selectionStart || 0;
        const textBeforeCursor = (input.value || '').substring(0, selectionStart);

        const computed = window.getComputedStyle(input);
        mirror.style.font = computed.font;
        mirror.style.letterSpacing = computed.letterSpacing;
        mirror.style.textTransform = computed.textTransform;
        mirror.textContent = textBeforeCursor;

        if (textBeforeCursor.endsWith(' ')) {
            mirror.innerHTML = textBeforeCursor.replace(/ /g, '&nbsp;');
        }

        const textWidth = mirror.getBoundingClientRect().width;
        const paddingLeft = parseFloat(computed.paddingLeft) || 0;
        const scrollLeft = input.scrollLeft || 0;
        const inputHeight = input.clientHeight;
        const fontSize = parseFloat(computed.fontSize) || 14;

        setCaretPos({
            left: paddingLeft + textWidth - scrollLeft,
            top: (inputHeight - fontSize * 1.2) / 2,
            height: fontSize * 1.2,
        });
    }, []);

    useEffect(() => {
        updateCaretPosition();
    }, [value, isFocused, updateCaretPosition]);

    const handleChange = (e) => {
        onChange?.(e);
        requestAnimationFrame(updateCaretPosition);
    };

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center w-full ${className}`}
            onClick={() => inputRef.current?.focus()}
        >
            {Icon && (
                <div className="absolute left-3.5 z-10 text-ink-muted pointer-events-none flex items-center justify-center">
                    <Icon size={18} />
                </div>
            )}

            {/* Hidden measuring mirror */}
            <span
                ref={mirrorRef}
                className="absolute opacity-0 pointer-events-none whitespace-pre select-none left-0 top-0 invisible"
                aria-hidden="true"
            />

            {/* Actual Input with transparent native caret */}
            <input
                ref={inputRef}
                id={id}
                name={name}
                type={type}
                value={value}
                required={required}
                onChange={handleChange}
                onFocus={() => {
                    setIsFocused(true);
                    updateCaretPosition();
                }}
                onBlur={() => setIsFocused(false)}
                onSelect={updateCaretPosition}
                onKeyUp={updateCaretPosition}
                onClick={updateCaretPosition}
                onScroll={updateCaretPosition}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                style={{ caretColor: 'transparent' }}
                className={`w-full bg-surface border border-line rounded-xl py-2.5 ${
                    Icon ? 'pl-10 ' : 'pl-3.5 '
                }pr-3.5 text-sm font-medium text-ink placeholder-ink-muted outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${inputClassName}`}
                {...props}
            />

            {/* Smooth animated caret */}
            <AnimatePresence>
                {isFocused && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, scaleY: 0.6 }}
                        animate={{
                            opacity: 1,
                            scaleY: 1,
                            left: caretPos.left,
                            top: caretPos.top,
                            height: caretPos.height,
                        }}
                        exit={{ opacity: 0, scaleY: 0.6 }}
                        transition={{
                            type: 'spring',
                            stiffness: 550,
                            damping: 38,
                            mass: 0.4,
                        }}
                        className={`absolute w-[2px] rounded-full pointer-events-none ${caretColor} shadow-[0_0_8px_rgba(11,170,143,0.6)] animate-[pulse_1.2s_ease-in-out_infinite]`}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
