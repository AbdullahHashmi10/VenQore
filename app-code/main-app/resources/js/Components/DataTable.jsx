import React, { useState, useMemo } from 'react';
import {
    Search,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Download,
    Filter,
    X
} from 'lucide-react';
import SmartCombobox from '@/Components/SmartCombobox';

/**
 * DataTable - Reusable data table component with Midnight Nebula design
 * 
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column definitions [{key, label, sortable, render}]
 * @param {Function} onEdit - Callback when edit action clicked
 * @param {Function} onDelete - Callback when delete action clicked
 * @param {Function} onView - Callback when view action clicked
 * @param {Boolean} searchable - Enable global search
 * @param {Boolean} selectable - Enable row selection
 * @param {String} emptyMessage - Message when no data
 * @param {Boolean} loading - Show loading state
 * @param {Array} actions - Custom actions [{icon, label, onClick, color}]
 */
export default function DataTable({
    data = [],
    columns = [],
    onEdit,
    onDelete,
    onView,
    searchable = true,
    selectable = false,
    emptyMessage = "No data found",
    loading = false,
    actions = [],
    pageSize: initialPageSize = 10,
    onExport,
    title,
    subtitle,
    headerActions,
    disablePagination = false,
    emptyState // Custom empty state component
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter(item =>
            columns.some(col => {
                const value = item[col.key];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const comparison = String(aVal).localeCompare(String(bVal));
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (disablePagination) return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize, disablePagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedRows.length === paginatedData.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(paginatedData.map((_, idx) => idx));
        }
    };

    // Handle row select
    const handleRowSelect = (idx) => {
        setSelectedRows(prev =>
            prev.includes(idx)
                ? prev.filter(i => i !== idx)
                : [...prev, idx]
        );
    };

    // Render sort icon
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronUp size={14} className="opacity-0 group-hover:opacity-30" />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-brand-500" />
            : <ChevronDown size={14} className="text-brand-500" />;
    };

    return (
        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
            {/* Header */}
            {(title || searchable || headerActions) && (
                <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        {title && (
                            <h3 className="text-lg font-bold text-ink">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-ink-muted">{subtitle}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {searchable && (
                            <div className="w-48 md:w-64">
                                <SmartCombobox
                                    items={data}
                                    value={searchTerm}
                                    onQueryChange={(val) => {
                                        setSearchTerm(val);
                                        setCurrentPage(1);
                                    }}
                                    onSelect={(item) => {
                                        // Upon selection, filter by that specific item's primary key
                                        const key = columns[0]?.key || 'name';
                                        setSearchTerm(item[key]);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search..."
                                    displayKey={columns[0]?.key || 'name'}
                                    filterKey={columns[0]?.key || 'name'}
                                />
                            </div>
                        )}

                        {onExport && (
                            <button
                                onClick={onExport}
                                className="p-2 bg-app border border-line rounded-xl text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                title="Export"
                            >
                                <Download size={18} />
                            </button>
                        )}

                        {headerActions}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-app">
                            {selectable && (
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-line dark:border-line text-brand-600 focus:ring-brand-500"
                                    />
                                </th>
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-bold text-ink-muted uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer group' : ''}`}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable !== false && renderSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                            {(onEdit || onDelete || onView || actions.length > 0) && (
                                <th className="w-20 px-4 py-3 text-right text-xs font-bold text-ink-muted uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {loading ? (
                            // Loading skeleton
                            [...Array(5)].map((_, idx) => (
                                <tr key={idx}>
                                    {selectable && (
                                        <td className="px-4 py-4">
                                            <div className="w-4 h-4 bg-sunken rounded animate-pulse" />
                                        </td>
                                    )}
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-4">
                                            <div className="h-4 bg-sunken rounded animate-pulse w-3/4" />
                                        </td>
                                    ))}
                                    <td className="px-4 py-4">
                                        <div className="h-4 bg-sunken rounded animate-pulse w-8 ml-auto" />
                                    </td>
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + 1}
                                    className="px-4 py-12 text-center text-ink-muted"
                                >
                                    {emptyState ? emptyState : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter size={24} className="opacity-50" />
                                            <span>{emptyMessage}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                >
                                    {selectable && (
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(rowIdx)}
                                                onChange={() => handleRowSelect(rowIdx)}
                                                className="rounded border-line dark:border-line text-brand-600 focus:ring-brand-500"
                                            />
                                        </td>
                                    )}
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-4 text-sm text-ink-secondary">
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete || onView || actions.length > 0) && (
                                        <td className="px-4 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === rowIdx ? null : rowIdx)}
                                                className="p-1.5 rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                            >
                                                <MoreHorizontal size={16} className="text-ink-muted" />
                                            </button>

                                            {activeDropdown === rowIdx && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setActiveDropdown(null)}
                                                    />
                                                    <div className="absolute right-4 top-full mt-1 bg-surface rounded-xl shadow-xl border border-line py-1 z-20 min-w-[140px]">
                                                        {onView && (
                                                            <button
                                                                onClick={() => { onView(row); setActiveDropdown(null); }}
                                                                className="w-full px-3 py-2 text-left text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-2"
                                                            >
                                                                <Eye size={14} /> View
                                                            </button>
                                                        )}
                                                        {onEdit && (
                                                            <button
                                                                onClick={() => { onEdit(row); setActiveDropdown(null); }}
                                                                className="w-full px-3 py-2 text-left text-sm text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-2"
                                                            >
                                                                <Edit size={14} /> Edit
                                                            </button>
                                                        )}
                                                        {actions.map((action, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => { action.onClick(row); setActiveDropdown(null); }}
                                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-2 ${action.color || 'text-ink-secondary'}`}
                                                            >
                                                                {action.icon && <action.icon size={14} />}
                                                                {action.label}
                                                            </button>
                                                        ))}
                                                        {onDelete && (
                                                            <>
                                                                <div className="h-px bg-sunken my-1" />
                                                                <button
                                                                    onClick={() => { onDelete(row); setActiveDropdown(null); }}
                                                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                                >
                                                                    <Trash2 size={14} /> Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer - Pagination */}
            {!disablePagination && !loading && sortedData.length > 0 && (
                <div className="px-4 py-3 border-t border-line flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-ink-muted">
                        Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * pageSize, sortedData.length)}</span> of <span className="font-semibold">{sortedData.length}</span> results
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-app border border-line rounded-lg text-sm outline-none"
                        >
                            {[10, 25, 50, 100].map(size => (
                                <option key={size} value={size}>{size} per page</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = idx + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = idx + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + idx;
                                } else {
                                    pageNum = currentPage - 2 + idx;
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-brand-600 text-white'
                                            : 'hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
