import React, { useState } from 'react';
import { Calendar, ChevronDown, Filter, X, RefreshCw } from 'lucide-react';

/**
 * FilterPanel - Reusable filter panel for reports and lists
 * 
 * @param {Array} filters - Filter definitions [{key, label, type, options}]
 * @param {Object} values - Current filter values
 * @param {Function} onChange - Callback when filters change
 * @param {Function} onReset - Callback to reset filters
 * @param {Function} onApply - Callback when apply is clicked (optional)
 * @param {Boolean} collapsible - Allow collapsing the filter panel
 */
export default function FilterPanel({
    filters = [],
    values = {},
    onChange,
    onReset,
    onApply,
    collapsible = true,
    defaultExpanded = true,
    compact = false
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleChange = (key, value) => {
        onChange({ ...values, [key]: value });
    };

    const hasActiveFilters = Object.values(values).some(v => v !== '' && v !== null && v !== undefined);

    const renderFilter = (filter) => {
        const inputBaseClass = `w-full ${compact ? 'px-2 py-1 text-xs rounded-lg' : 'px-3 py-2 text-sm rounded-xl'} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500/20`;

        switch (filter.type) {
            case 'select':
                return (
                    <div key={filter.key} className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {filter.label}
                        </label>
                        <div className="relative">
                            <select
                                value={values[filter.key] || ''}
                                onChange={(e) => handleChange(filter.key, e.target.value)}
                                className={`${inputBaseClass} appearance-none cursor-pointer`}
                            >
                                <option value="">All</option>
                                {filter.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <div key={filter.key} className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {filter.label}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={values[filter.key] || ''}
                                onChange={(e) => handleChange(filter.key, e.target.value)}
                                className={`${inputBaseClass} pl-3`} // Browser native date picker usually needs less horizontal padding management than custom icons unless we have an icon overlay
                            />
                        </div>
                    </div>
                );

            case 'dateRange':
                return (
                    <div key={filter.key} className="flex-1 min-w-[300px]">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {filter.label}
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={values[`${filter.key}_from`] || ''}
                                    onChange={(e) => handleChange(`${filter.key}_from`, e.target.value)}
                                    className={inputBaseClass}
                                />
                            </div>
                            <span className="text-slate-400 text-sm">to</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={values[`${filter.key}_to`] || ''}
                                    onChange={(e) => handleChange(`${filter.key}_to`, e.target.value)}
                                    className={inputBaseClass}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'search':
                return (
                    <div key={filter.key} className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {filter.label}
                        </label>
                        <input
                            type="text"
                            placeholder={filter.placeholder || 'Search...'}
                            value={values[filter.key] || ''}
                            onChange={(e) => handleChange(filter.key, e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div key={filter.key} className="flex-1 min-w-[120px]">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {filter.label}
                        </label>
                        <input
                            type="number"
                            placeholder={filter.placeholder || '0'}
                            value={values[filter.key] || ''}
                            onChange={(e) => handleChange(filter.key, e.target.value)}
                            className={inputBaseClass}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden ${compact ? 'mb-2 shadow-sm' : 'mb-6'}`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3'} ${collapsible ? 'cursor-pointer' : ''} border-b border-slate-100 dark:border-slate-800`}
                onClick={() => collapsible && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Filter size={compact ? 14 : 16} className="text-slate-400" />
                    <span className={`font-semibold ${compact ? 'text-xs uppercase tracking-wider' : 'text-sm'} text-slate-700 dark:text-slate-200`}>Filters</span>
                    {hasActiveFilters && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded">
                            Active
                        </span>
                    )}
                </div>

                {/* Compact Actions in Header */}
                <div className="flex items-center gap-2">
                    {compact && isExpanded && (
                        <div className="flex items-center gap-2 mr-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                                    className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                            {onApply && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onApply(); }}
                                    className="px-2 py-0.5 text-[10px] font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                    )}

                    {collapsible && (
                        <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    )}
                </div>
            </div>

            {/* Filter Content */}
            {isExpanded && (
                <div className={compact ? 'p-2' : 'p-4'}>
                    <div className={`flex flex-wrap ${compact ? 'gap-2' : 'gap-4'}`}>
                        {filters.map(renderFilter)}
                    </div>

                    {/* Standard Actions Footer (Only if NOT compact) */}
                    {!compact && (
                        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            {hasActiveFilters && (
                                <button
                                    onClick={onReset}
                                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            )}
                            {onApply && (
                                <button
                                    onClick={onApply}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                    <RefreshCw size={14} />
                                    Apply
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

}

/**
 * Quick date range presets
 */
export function DateRangePresets({ onSelect }) {
    const presets = [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Last 7 Days', value: 'last7days' },
        { label: 'Last 30 Days', value: 'last30days' },
        { label: 'This Month', value: 'thisMonth' },
        { label: 'Last Month', value: 'lastMonth' },
        { label: 'This Year', value: 'thisYear' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
                <button
                    key={preset.value}
                    onClick={() => onSelect(preset.value)}
                    className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    {preset.label}
                </button>
            ))}
        </div>
    );
}
