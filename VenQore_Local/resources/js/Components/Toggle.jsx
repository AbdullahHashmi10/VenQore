import React from 'react';

export default function Toggle({ enabled, onChange, label, description, upcoming = false, variant = 'default', disabled = false }) {
    return (
        <div className={`flex items-center justify-between py-4 ${upcoming || disabled ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{label}</p>
                    {upcoming && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30">Upcoming</span>
                    )}
                    {variant === 'danger' && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-wider rounded border border-red-200 dark:border-red-500/30">Risk</span>
                    )}
                </div>
                {description && <p className={`text-xs mt-0.5 ${variant === 'danger' ? 'text-red-500/80' : 'text-slate-500'}`}>{description}</p>}
            </div>
            <button
                type="button"
                disabled={upcoming || disabled}
                onClick={() => onChange(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${upcoming || disabled ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-700' : enabled ? (variant === 'danger' ? 'bg-red-600 shadow-lg shadow-red-500/30' : 'bg-indigo-600 shadow-lg shadow-indigo-500/30') : 'bg-slate-300 dark:bg-slate-600'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${enabled && !upcoming && !disabled ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}
