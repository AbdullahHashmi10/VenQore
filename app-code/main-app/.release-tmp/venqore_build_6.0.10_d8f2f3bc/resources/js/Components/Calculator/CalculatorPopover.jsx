import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Copy, Check, Delete, X } from 'lucide-react';
import {
    evaluateExpression,
    appendCharacter,
    toggleSign,
    backspace,
    formatResult,
} from './calculatorEngine';

export default function CalculatorPopover({ isOpen, onClose, buttonRef }) {
    const [expression, setExpression] = useState('');
    const [display, setDisplay] = useState('0');
    const [lastResult, setLastResult] = useState(null);
    const [memory, setMemory] = useState(0);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const containerRef = useRef(null);
    const firstButtonRef = useRef(null);
    const isMountedRef = useRef(true);
    const copyTimeoutRef = useRef(null);
    const prevIsOpenRef = useRef(false);

    // Track component mount status and clean up timeouts
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // Focus management:
    // 1. Move focus into calculator when opened
    // 2. Return focus to trigger ONLY on transition from open (true) to closed (false)
    useEffect(() => {
        if (isOpen) {
            if (firstButtonRef.current) {
                firstButtonRef.current.focus();
            }
        } else if (prevIsOpenRef.current && !isOpen && buttonRef?.current) {
            buttonRef.current.focus();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, buttonRef]);

    // Close calculator on Inertia navigation start or navigate
    useEffect(() => {
        if (!isOpen) return;

        const unbind = router?.on?.('start', () => {
            if (isMountedRef.current) {
                onClose();
            }
        });

        return () => {
            if (typeof unbind === 'function') {
                unbind();
            }
        };
    }, [isOpen, onClose]);

    // Reset state
    const handleClearAll = () => {
        setExpression('');
        setDisplay('0');
        setError(null);
        setLastResult(null);
        setAnnouncement('Calculator cleared');
    };

    const handleCalculate = () => {
        if (!expression) return;
        const res = evaluateExpression(expression);
        if (res.status === 'ok') {
            setDisplay(res.value);
            setLastResult(res.value);
            setExpression(res.value);
            setError(null);
            setAnnouncement(`Result: ${res.value}`);
        } else {
            setError(res.error);
            setDisplay(res.error);
            setAnnouncement(`Error: ${res.error}`);
        }
    };

    const handleInput = (char) => {
        // Error recovery: start clean expression if typing after an error
        if (error) {
            setError(null);
            setExpression(char);
            setDisplay(char);
            return;
        }

        if (lastResult !== null && expression === lastResult && /[0-9\.]/.test(char)) {
            setLastResult(null);
            setExpression(char);
            setDisplay(char);
            return;
        }

        const nextExpr = appendCharacter(expression, char);
        setExpression(nextExpr);

        const preview = evaluateExpression(nextExpr);
        if (preview.status === 'ok' && nextExpr.match(/[\+\-\*\/\%]/)) {
            setDisplay(preview.value);
        } else {
            setDisplay(nextExpr || '0');
        }
    };

    const handleToggleSign = () => {
        setError(null);
        const nextExpr = toggleSign(expression);
        setExpression(nextExpr);
        setDisplay(nextExpr || '0');
    };

    const handleBackspace = () => {
        setError(null);
        const nextExpr = backspace(expression);
        setExpression(nextExpr);
        setDisplay(nextExpr || '0');
    };

    // Memory operations
    const handleMemoryClear = () => {
        setMemory(0);
        setAnnouncement('Memory cleared');
    };

    const handleMemoryRecall = () => {
        setError(null);
        const memStr = formatResult(memory);
        const nextExpr = appendCharacter(expression, memStr);
        setExpression(nextExpr);
        setDisplay(nextExpr || '0');
        setAnnouncement(`Memory recall ${memStr}`);
    };

    const handleMemoryAdd = () => {
        const currentVal = evaluateExpression(expression || display);
        if (currentVal.status === 'ok') {
            setMemory((prev) => prev + currentVal.numberValue);
            setAnnouncement(`Added ${currentVal.value} to memory`);
        }
    };

    const handleMemorySubtract = () => {
        const currentVal = evaluateExpression(expression || display);
        if (currentVal.status === 'ok') {
            setMemory((prev) => prev - currentVal.numberValue);
            setAnnouncement(`Subtracted ${currentVal.value} from memory`);
        }
    };

    // Clipboard copy with timer ref cleanup & unmount guard
    const handleCopy = async () => {
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        const textToCopy = display || expression || '0';
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
                if (isMountedRef.current) {
                    setCopied(true);
                    setAnnouncement('Result copied to clipboard');
                    copyTimeoutRef.current = setTimeout(() => {
                        if (isMountedRef.current) setCopied(false);
                    }, 2000);
                }
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (e) {
            if (isMountedRef.current) {
                setAnnouncement('Failed to copy to clipboard');
            }
        }
    };

    // Click outside listener
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                buttonRef?.current &&
                !buttonRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, buttonRef]);

    // Keyboard listener (active only when open)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const key = e.key;

            if (key >= '0' && key <= '9') {
                e.preventDefault();
                handleInput(key);
            } else if (['+', '-', '*', '/', '.', '(', ')', '%'].includes(key)) {
                e.preventDefault();
                handleInput(key);
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleCalculate();
            } else if (key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            } else if (key === 'Delete') {
                e.preventDefault();
                handleClearAll();
            } else if (key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, expression, display, error, lastResult, memory]);

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            id="header-calculator-popover"
            role="dialog"
            aria-label="Calculator"
            tabIndex={-1}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-24px)] bg-surface rounded-2xl shadow-2xl border border-line z-[100] p-4 animate-in fade-in zoom-in-95 origin-top-right text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
            {/* Live region for status announcements */}
            <div className="sr-only" role="status" aria-live="polite">
                {announcement}
            </div>

            {/* Header & Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Calculator</span>
                    {memory !== 0 && (
                        <span className="px-1.5 py-0.5 text-4xs font-extrabold bg-brand-500 text-white rounded-md">
                            M
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close calculator"
                    className="p-1 rounded-lg hover:bg-interactive-hover text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Display Screen */}
            <div className="bg-sunken dark:bg-slate-900/80 p-3 rounded-xl border border-line mb-3 flex flex-col justify-between min-h-[72px]">
                <div aria-label="Calculation expression" className="text-2xs font-mono text-ink-muted truncate text-right h-4">
                    {expression || ' '}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy result"
                        aria-label="Copy result"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-brand-600 hover:bg-surface transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <div
                        aria-label="Current result display"
                        className={`text-xl font-bold font-mono text-right truncate ${
                            error ? 'text-red-500 text-sm font-sans' : 'text-ink'
                        }`}
                    >
                        {display}
                    </div>
                </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-1.5">
                {/* Memory Row */}
                <button
                    type="button"
                    onClick={handleMemoryClear}
                    aria-label="Memory clear"
                    className="h-10 text-2xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-muted transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    MC
                </button>
                <button
                    type="button"
                    onClick={handleMemoryRecall}
                    aria-label="Memory recall"
                    className="h-10 text-2xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-muted transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    MR
                </button>
                <button
                    type="button"
                    onClick={handleMemoryAdd}
                    aria-label="Memory add"
                    className="h-10 text-2xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-muted transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    M+
                </button>
                <button
                    type="button"
                    onClick={handleMemorySubtract}
                    aria-label="Memory subtract"
                    className="h-10 text-2xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-muted transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    M-
                </button>

                {/* Operations & Editing */}
                <button
                    ref={firstButtonRef}
                    type="button"
                    onClick={handleClearAll}
                    aria-label="Clear all"
                    className="h-11 text-xs font-bold rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    AC
                </button>
                <button
                    type="button"
                    onClick={handleBackspace}
                    aria-label="Backspace"
                    className="h-11 flex items-center justify-center rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-secondary transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <Delete size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('(')}
                    aria-label="Open parenthesis"
                    className="h-11 text-xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-secondary transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    (
                </button>
                <button
                    type="button"
                    onClick={() => handleInput(')')}
                    aria-label="Close parenthesis"
                    className="h-11 text-xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-secondary transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    )
                </button>

                {/* Functions */}
                <button
                    type="button"
                    onClick={() => handleInput('%')}
                    aria-label="Percentage"
                    className="h-11 text-xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-brand-600 dark:text-brand-400 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    %
                </button>
                <button
                    type="button"
                    onClick={handleToggleSign}
                    aria-label="Positive or negative toggle"
                    className="h-11 text-xs font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink-secondary transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    ±
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('/')}
                    aria-label="Divide"
                    className="h-11 text-sm font-bold rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    ÷
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('*')}
                    aria-label="Multiply"
                    className="h-11 text-sm font-bold rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    ×
                </button>

                {/* Numbers 7, 8, 9, Subtract */}
                <button
                    type="button"
                    onClick={() => handleInput('7')}
                    aria-label="Digit 7"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    7
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('8')}
                    aria-label="Digit 8"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    8
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('9')}
                    aria-label="Digit 9"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    9
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('-')}
                    aria-label="Subtract"
                    className="h-11 text-sm font-bold rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    -
                </button>

                {/* Numbers 4, 5, 6, Add */}
                <button
                    type="button"
                    onClick={() => handleInput('4')}
                    aria-label="Digit 4"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    4
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('5')}
                    aria-label="Digit 5"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    5
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('6')}
                    aria-label="Digit 6"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    6
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('+')}
                    aria-label="Add"
                    className="h-11 text-sm font-bold rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    +
                </button>

                {/* Numbers 1, 2, 3 */}
                <button
                    type="button"
                    onClick={() => handleInput('1')}
                    aria-label="Digit 1"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    1
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('2')}
                    aria-label="Digit 2"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    2
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('3')}
                    aria-label="Digit 3"
                    className="h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    3
                </button>

                {/* Equals */}
                <button
                    type="button"
                    onClick={handleCalculate}
                    aria-label="Equals"
                    className="h-11 text-base font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    =
                </button>

                {/* Bottom Row: 0, Decimal */}
                <button
                    type="button"
                    onClick={() => handleInput('0')}
                    aria-label="Digit 0"
                    className="col-span-2 h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    0
                </button>
                <button
                    type="button"
                    onClick={() => handleInput('.')}
                    aria-label="Decimal point"
                    className="col-span-2 h-11 text-sm font-bold rounded-xl bg-surface hover:bg-interactive-hover border border-line text-ink transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    .
                </button>
            </div>
        </div>
    );
}
