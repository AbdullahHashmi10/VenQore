import React from 'react';
import { HelpCircle, RefreshCw, AlertCircle, EyeOff, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function DashboardCardFrame({
    card,
    definition,
    loading,
    error,
    isGated,
    isLocked,
    onEdit,
    onRemove,
    children
}) {
    const title = card?.title_override || definition?.label || 'Metric';
    const description = definition?.description || '';
    const help = definition?.help || '';

    // Handle gated / plan downgrade state: hide card entirely from layout view
    if (isGated) {
        return null; 
    }

    return (
        <div 
            className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_10px_30px_rgb(0,0,0,0.04)] hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between h-full select-none"
            id={`card-${card.id}`}
        >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 shrink-0 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide truncate max-w-[160px] cursor-help" title={description}>
                        {title}
                    </span>
                    {help && (
                        <div className="relative group/help cursor-help text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors shrink-0">
                            <HelpCircle size={13} />
                            <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 w-48 bg-slate-800 text-white dark:bg-slate-950 dark:text-slate-300 p-2 rounded-lg text-3xs font-medium opacity-0 pointer-events-none group-hover/help:opacity-100 transition-opacity duration-200 z-50 shadow-md leading-normal text-center">
                                {help}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Actions Menu (rendered if layout is unlocked) */}
                {!isLocked && (onEdit || onRemove) && (
                    <div className="relative group/menu flex items-center shrink-0">
                        <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-0.5 rounded transition-colors">
                            <MoreVertical size={14} />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-opacity duration-200 z-40 py-1 min-w-[100px]">
                            {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-3xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                                >
                                    <Edit2 size={10} />
                                    <span>Configure</span>
                                </button>
                            )}
                            {onRemove && (
                                <button 
                                    onClick={onRemove}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-3xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                                >
                                    <Trash2 size={10} />
                                    <span>Delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Card Body & States */}
            <div className="grow flex flex-col justify-center w-full min-h-0 relative">
                {loading ? (
                    <div className="flex flex-col gap-2 w-full animate-pulse">
                        <div className="h-7 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        <div className="h-4 w-1/3 bg-slate-50 dark:bg-slate-800/60 rounded" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600 select-none">
                        <AlertCircle size={20} className="text-rose-500/80" />
                        <span className="text-3xs font-bold uppercase tracking-wider">Failed to load</span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
