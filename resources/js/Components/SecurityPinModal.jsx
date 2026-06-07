import React, { useState, useEffect } from 'react';
import { X, Delete, Shield, Check, Settings, AlertCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

/**
 * SecurityPinModal
 * 
 * A reusable component to verify the 6-digit security PIN before sensitive operations.
 * If the user hasn't set up a security PIN, it guides them to the profile settings.
 * 
 * Props:
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Function to call when closing the modal
 * @param {function} onSuccess - Function to call when the PIN is successfully verified
 * @param {object} store - The current store object (for routing)
 */
export default function SecurityPinModal({ isOpen, onClose, onSuccess, store }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [noPinSet, setNoPinSet] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setInput('');
            setError('');
            setNoPinSet(false);
            return;
        }

        const handleKeyDown = (e) => {
            if (noPinSet || loading) return;

            const key = e.key;

            if (/^[0-9]$/.test(key)) {
                handleNumberClick(key);
            } else if (key === 'Backspace') {
                handleDelete();
            } else if (key === 'Escape') {
                onClose();
            } else if (key === 'Enter' && input.length === 6) {
                e.preventDefault();
                verifySecurityPin(input);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, input, noPinSet, loading]);

    const handleNumberClick = (num) => {
        if (input.length < 6) {
            const newInput = input + num;
            setInput(newInput);
            setError('');

            if (newInput.length === 6) {
                // Auto-verify when 6 digits are entered
                setTimeout(() => verifySecurityPin(newInput), 200);
            }
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError('');
    };

    const verifySecurityPin = async (pin) => {
        if (pin.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(route('store.profile.verify-security-pin', { store_slug: store?.slug }), { pin });
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('PIN Verification Error:', err);
            if (err.response?.status === 404) {
                setNoPinSet(true);
            } else {
                setError(err.response?.data?.message || 'Incorrect Security PIN');
                // Shake effect or feedback
                setTimeout(() => {
                    setInput('');
                }, 400);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-200">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all z-10"
                >
                    <X size={20} />
                </button>

                {noPinSet ? (
                    /* No PIN Set Content */
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-[2rem] flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Setup Required</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                A Security Passcode is required to perform this sensitive action. Please set it up in your profile settings.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link
                                href={route('store.profile.edit', { store_slug: store?.slug }) + '#security-pin-section'}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                                onClick={onClose}
                            >
                                <Settings size={18} />
                                Go to Profile Settings
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    /* PIN Entry Content */
                    <>
                        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800 space-y-4">
                            <div className={`w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto text-violet-600 dark:text-violet-400 transition-transform duration-300 ${loading ? 'animate-pulse scale-90' : ''}`}>
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Security Authorization</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Enter your 6-digit security passcode to authorize this action.</p>
                            </div>
                        </div>

                        {/* PIN Dots */}
                        <div className={`py-10 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-6 ${error ? 'animate-bounce' : ''}`}>
                            <div className="flex gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < input.length
                                            ? 'bg-violet-600 scale-125 shadow-lg shadow-violet-500/50'
                                            : 'bg-slate-300 dark:bg-slate-700'
                                            } ${error ? 'bg-red-500' : ''}`}
                                    />
                                ))}
                            </div>
                            {error && (
                                <p className="text-red-500 text-xs font-black uppercase tracking-wider">{error}</p>
                            )}
                        </div>

                        {/* Keypad */}
                        <div className="p-8 grid grid-cols-3 gap-3 bg-white dark:bg-slate-900">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    disabled={loading}
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                disabled={loading}
                                onClick={handleDelete}
                                className="h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Delete size={24} />
                            </button>
                            <button
                                disabled={loading}
                                onClick={() => handleNumberClick('0')}
                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                0
                            </button>
                            <button
                                disabled={loading || input.length !== 6}
                                onClick={() => verifySecurityPin(input)}
                                className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${input.length === 6 ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
                            >
                                <Check size={28} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
