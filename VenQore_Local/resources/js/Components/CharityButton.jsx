import { usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import { HeartHandshake, Check, X, Edit2 } from 'lucide-react';
import axios from 'axios';

export default function CharityButton() {
    const [stats, setStats] = useState({ today: 0, default_amount: 10, enabled: false });
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const holdTimer = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        if (!navigator.onLine) return;

        try {
            const response = await axios.get(route('store.charity.stats', { store_slug: store.slug }));
            setStats(response.data);
            setCustomAmount(response.data.default_amount?.toString() || '10');
        } catch (error) {
            // Silent fail for offline consistency
        }
    };

    const handleClick = async () => {
        if (showEdit) return;

        setIsLoading(true);
        try {
            const response = await axios.post(route('store.charity.add', { store_slug: store.slug }), {
                amount: parseFloat(customAmount) || stats.default_amount
            });

            if (response.data.success) {
                setStats(prev => ({ ...prev, today: response.data.today_total }));
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            }
        } catch (error) {
            console.error('Failed to add charity:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMouseDown = () => {
        holdTimer.current = setTimeout(() => {
            setShowEdit(true);
            setTimeout(() => inputRef.current?.focus(), 50);
        }, 500); // 500ms hold to edit
    };

    const handleMouseUp = () => {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
        }
    };

    const saveCustomAmount = async () => {
        try {
            await axios.post(route('store.charity.update-default', { store_slug: store.slug }), {
                amount: parseFloat(customAmount)
            });
            setStats(prev => ({ ...prev, default_amount: parseFloat(customAmount) }));
            setShowEdit(false);
        } catch (error) {
            console.error('Failed to update default:', error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveCustomAmount();
        } else if (e.key === 'Escape') {
            setShowEdit(false);
            setCustomAmount(stats.default_amount?.toString() || '10');
        }
    };

    if (!stats.enabled) return null;

    return (
        <div className="relative">
            {/* Main Button */}
            <button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                disabled={isLoading || showEdit}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                    ${showSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800'
                    }
                    ${isLoading ? 'opacity-50 cursor-wait' : ''}
                `}
                title="Click to donate | Hold to change amount"
            >
                {showSuccess ? (
                    <Check size={18} className="animate-bounce" />
                ) : (
                    <HeartHandshake size={18} className={isLoading ? 'animate-pulse' : ''} />
                )}

                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Charity</span>
                    <span className="text-xs font-black">
                        {showSuccess ? 'Added!' : `Rs ${stats.today?.toLocaleString() || 0}`}
                    </span>
                </div>
            </button>

            {/* Edit Popup */}
            {showEdit && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-rose-100 dark:border-rose-900/30 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[160px]">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                        Amount (Rs)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-20 px-2 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center focus:ring-2 ring-rose-500/20 outline-none"
                            min="1"
                        />
                        <button
                            onClick={saveCustomAmount}
                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => {
                                setShowEdit(false);
                                setCustomAmount(stats.default_amount?.toString() || '10');
                            }}
                            className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                        Hold button to edit default
                    </p>
                </div>
            )}
        </div>
    );
}
