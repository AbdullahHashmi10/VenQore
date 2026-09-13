import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Lock, Check } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function PasscodeModal({ isOpen, onClose, onSuccess, externalError, settings: propSettings }) {
    const { settings: sharedSettings } = usePage().props;
    const settings = propSettings || sharedSettings;

    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const expectedLength = 6;

    useEffect(() => {
        if (externalError) {
            setError(true);
            setTimeout(() => setError(false), 600);
        }
    }, [externalError]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            const key = e.key;

            // Handle Numbers
            if (/^[0-9]$/.test(key)) {
                handleNumberClick(key);
            }
            // Handle Backspace
            else if (key === 'Backspace') {
                handleDelete();
            }
            // Handle Escape
            else if (key === 'Escape') {
                onClose();
            }
            // Handle Enter
            else if (key === 'Enter') {
                e.preventDefault();
                verifyPasscode(input);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, input]); // Dependencies ensure fresh state access

    const handleNumberClick = (num) => {
        if (input.length < 6) {
            const newInput = input + num;
            setInput(newInput);

            // Auto check when length is reached
            if (newInput.length === expectedLength) {
                // Small delay to let user see the last dot fill
                setTimeout(() => verifyPasscode(newInput), 100);
            } else {
                setError(false);
            }
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError(false);
    };

    const verifyPasscode = (code) => {
        if (code.length < expectedLength) return;
        setInput('');
        setError(false);
        onSuccess(code);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-command flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm animate-in fade-in duration-normal">
            {/* No Hidden Input Needed - Using Global Listener */}

            <div className="bg-surface w-full max-w-xs rounded-2xl shadow-2xl border border-line overflow-hidden scale-100 animate-in zoom-in-95 duration-normal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 text-center border-b border-line relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-ink">Admin Access</h3>
                    <div className="h-4"></div>
                </div>

                {/* Display */}
                <div className="py-8 bg-app flex justify-center">
                    <div className="flex gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-normal ${i < input.length
                                    ? 'bg-brand-600 scale-110'
                                    : 'bg-sunken'
                                    } ${error ? 'bg-red-500 animate-pulse' : ''}`}
                            />
                        ))}
                    </div>
                </div>
                {error && (
                    <p className="text-center text-red-500 text-xs font-bold -mt-4 mb-4 animate-bounce">Incorrect PIN</p>
                )}

                {/* Keypad */}
                <div className="p-6 grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-14 rounded-2xl bg-sunken text-xl font-bold text-ink-secondary dark:text-ink hover:bg-white dark:hover:bg-interactive-hover hover:shadow-lg transition-all active:scale-95"
                        >
                            {num}
                        </button>
                    ))}

                    <div className="col-start-1">
                        <button
                            onClick={() => verifyPasscode(input)}
                            className="w-full h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800/30 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center"
                        >
                            <Check size={28} />
                        </button>
                    </div>

                    <div className="col-start-2">
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="w-full h-14 rounded-2xl bg-sunken text-xl font-bold text-ink-secondary dark:text-ink hover:bg-white dark:hover:bg-interactive-hover hover:shadow-lg transition-all active:scale-95"
                        >
                            0
                        </button>
                    </div>

                    <div className="col-start-3">
                        <button
                            onClick={handleDelete}
                            className="w-full h-14 rounded-2xl bg-sunken text-ink-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center active:scale-95"
                        >
                            <Delete size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
