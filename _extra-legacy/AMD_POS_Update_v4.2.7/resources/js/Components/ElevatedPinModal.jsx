import React, { useState, useEffect } from 'react';
import { X, Delete, Shield, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

/**
 * ElevatedPinModal
 *
 * Allows any store member with the required permission to authorize an action.
 * Step 1: Select who is authorizing (dropdown of store members with PINs set)
 * Step 2: Enter their 6-digit security PIN
 *
 * Props:
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onSuccess(pin, authorizedBy) — called when verified
 * @param {string} permission — the permission key required (e.g. 'funds.manage')
 * @param {string} actionLabel — human label shown in the modal ("Add Funds")
 * @param {object} store
 */
export default function ElevatedPinModal({ isOpen, onClose, onSuccess, permission, actionLabel = 'this action', store }) {
    const [step, setStep] = useState('select'); // 'select' | 'pin'
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setSelectedMember(null);
            setInput('');
            setError('');
            return;
        }
        fetchMembers();
    }, [isOpen]);

    useEffect(() => {
        if (step !== 'pin' || !isOpen) return;
        const handleKeyDown = (e) => {
            if (/^[0-9]$/.test(e.key)) handleNumberClick(e.key);
            else if (e.key === 'Backspace') handleDelete();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, isOpen, input]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await axios.get(route('store.profile.store-members', { store_slug: store?.slug }));
            setMembers(res.data.members || []);
        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleNumberClick = (num) => {
        if (input.length >= 6) return;
        const newInput = input + num;
        setInput(newInput);
        setError('');
        if (newInput.length === 6) setTimeout(() => verifyPin(newInput), 200);
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError('');
    };

    const verifyPin = async (pin) => {
        if (pin.length !== 6) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(route('store.profile.verify-elevated-pin', { store_slug: store?.slug }), {
                pin,
                user_id: selectedMember?.user_id ?? null,
                permission,
            });
            if (res.data.success) {
                onSuccess(pin, res.data.authorized_by);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Incorrect PIN');
            setTimeout(() => setInput(''), 400);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 z-10 transition-colors">
                    <X size={20} />
                </button>

                {step === 'select' ? (
                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto text-violet-600">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Authorization Required</h3>
                            <p className="text-slate-500 text-xs">Select who is authorizing <strong>{actionLabel}</strong></p>
                        </div>

                        {loadingMembers ? (
                            <p className="text-center text-slate-400 text-sm py-4">Loading members...</p>
                        ) : members.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">No store members with a PIN set up.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {members.map(m => (
                                    <button
                                        key={m.user_id}
                                        onClick={() => { setSelectedMember(m); setStep('pin'); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 font-black text-sm">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{m.name}</p>
                                            <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800 space-y-2">
                            <button onClick={() => { setStep('select'); setInput(''); setError(''); }} className="text-xs text-violet-500 font-bold mb-2 flex items-center gap-1 mx-auto">
                                ← {selectedMember?.name}
                            </button>
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[1.5rem] flex items-center justify-center mx-auto text-violet-600">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Enter PIN</h3>
                            <p className="text-slate-500 text-xs">{selectedMember?.name}'s 6-digit security PIN</p>
                        </div>

                        <div className={`py-8 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center gap-4`}>
                            <div className="flex gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < input.length ? 'bg-violet-600 scale-125' : 'bg-slate-300 dark:bg-slate-700'} ${error ? 'bg-red-500 animate-pulse' : ''}`} />
                                ))}
                            </div>
                            {error && <p className="text-red-500 text-xs font-black uppercase tracking-wider">{error}</p>}
                        </div>

                        <div className="p-8 grid grid-cols-3 gap-3 bg-white dark:bg-slate-900">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} disabled={loading} onClick={() => handleNumberClick(num.toString())}
                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50">
                                    {num}
                                </button>
                            ))}
                            <button disabled={loading} onClick={handleDelete} className="h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                <Delete size={24} />
                            </button>
                            <button disabled={loading} onClick={() => handleNumberClick('0')} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xl font-black text-slate-700 dark:text-white hover:bg-violet-50 hover:text-violet-600 transition-all active:scale-95 disabled:opacity-50">0</button>
                            <button disabled={loading || input.length !== 6} onClick={() => verifyPin(input)}
                                className={`h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${input.length === 6 ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}>
                                <Check size={28} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
