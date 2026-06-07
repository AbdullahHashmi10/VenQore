import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard - Reusable stat display card with Midnight Nebula design
 * 
 * @param {String} title - Stat title/label
 * @param {String|Number} value - Main value to display
 * @param {String} subtitle - Optional subtitle/description
 * @param {ReactNode} icon - Lucide icon component
 * @param {String} iconColor - Tailwind color class for icon bg (e.g., 'indigo', 'emerald', 'amber')
 * @param {Number} trend - Percentage change (positive/negative)
 * @param {String} trendLabel - Label for trend (e.g., "vs last month")
 * @param {Boolean} loading - Show loading state
 */
export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'indigo',
    trend,
    trendLabel,
    loading = false,
    onClick,
    className = ''
}) {
    const colorClasses = {
        indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
        red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
        slate: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400'
    };

    const glowClasses = {
        indigo: 'bg-indigo-500/10',
        emerald: 'bg-emerald-500/10',
        amber: 'bg-amber-500/10',
        red: 'bg-red-500/10',
        purple: 'bg-purple-500/10',
        blue: 'bg-blue-500/10',
        slate: 'bg-slate-500/10'
    };

    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-900 rounded-2xl p-6
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none
                border border-slate-100 dark:border-slate-800
                relative overflow-hidden group
                ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
                transition-all duration-300
                ${className}
            `}
        >
            {/* Glow Effect */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${glowClasses[iconColor]} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`p-2.5 rounded-xl ${colorClasses[iconColor]} shadow-sm`}>
                                <Icon size={20} />
                            </div>
                        )}
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {title}
                        </span>
                    </div>

                    {trend !== undefined && (
                        <span className={`
                            text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1
                            ${trend >= 0
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                            }
                        `}>
                            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>

                {/* Value */}
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {value}
                        </h2>
                        {(subtitle || trendLabel) && (
                            <p className="text-xs text-slate-400 mt-1">
                                {subtitle || trendLabel}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * StatCardGrid - Grid wrapper for stat cards
 */
export function StatCardGrid({ children, columns = 4 }) {
    const colClasses = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };

    return (
        <div className={`grid ${colClasses[columns]} gap-6`}>
            {children}
        </div>
    );
}
