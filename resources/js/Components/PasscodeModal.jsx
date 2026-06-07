import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, Lock, Check } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function PasscodeModal({ isOpen, onClose, onSuccess, settings: propSettings }) {
    const { settings: sharedSettings } = usePage().props;
    const settings = propSettings || sharedSettings;

    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    // Determine the expected length
    const validPasscode = settings?.admin_passcode || '123456';
    const expectedLength = validPasscode.length;

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
        if (code === validPasscode) {
            // Reset state before success to prevent showing filled dots on next open if component isn't unmounted
            setInput('');
            setError(false);
            onSuccess();
        } else {
            setError(true);
            // Clear input after error animation
            setTimeout(() => {
                setInput('');
                setError(false);
            }, 600);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* No Hidden Input Needed - Using Global Listener */}

            <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Admin Access</h3>
                    <div className="h-4"></div>
                </div>

                {/* Display */}
                <div className="py-8 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                    <div className="flex gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${i < input.length
                                    ? 'bg-indigo-600 scale-110'
                                    : 'bg-slate-300 dark:bg-slate-700'
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
                            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                        >
                            {num}
                        </button>
                    ))}

                    <div className="col-start-1">
                        <button
                            onClick={() => verifyPasscode(input)}
                            className="w-full h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 hover:shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center"
                        >
                            <Check size={28} />
                        </button>
                    </div>

                    <div className="col-start-2">
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                        >
                            0
                        </button>
                    </div>

                    <div className="col-start-3">
                        <button
                            onClick={handleDelete}
                            className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex items-center justify-center active:scale-95"
                        >
                            <Delete size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
