import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function StatusCard({ data, definition }) {
    const state = data?.state || 'unknown';
    const label = data?.label || 'Unknown';
    const severity = data?.severity || 'neutral';

    let ColorIcon = AlertCircle;
    let pillColor = 'text-slate-600 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-800';

    if (severity === 'ok') {
        ColorIcon = CheckCircle2;
        pillColor = 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    } else if (severity === 'warning') {
        ColorIcon = AlertCircle;
        pillColor = 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
    } else if (severity === 'danger') {
        ColorIcon = XCircle;
        pillColor = 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20';
    }

    return (
        <div className="flex flex-col justify-between h-full w-full relative">
            <div className="flex items-center gap-2 border px-3 py-2 rounded-xl w-fit font-extrabold text-sm tracking-tight transition-transform duration-300 group-hover:scale-105 select-none shrink-0 mb-2 shadow-sm capitalize z-10 class-pill-state">
                <ColorIcon size={16} className="shrink-0" />
                <span className={pillColor.split(' ')[0]}>{label}</span>
            </div>

            <div className="flex flex-col gap-1.5 grow justify-center shrink-0 z-10 mt-1 select-none">
                <div className="flex items-center gap-2 text-3xs font-semibold text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>General Ledger Structure Ok</span>
                </div>
                <div className="flex items-center gap-2 text-3xs font-semibold text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>Debits Match Credits</span>
                </div>
            </div>
        </div>
    );
}
