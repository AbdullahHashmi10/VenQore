import React from 'react';
import { formatValue } from '../utils/format';

export default function TableChart({ data, definition, settings }) {
    const rawColumns = data?.columns || [];
    const rawRows = data?.rows || data?.items || [];
    
    // Auto-derive columns for RANKING shape if not passed
    const columns = rawColumns.length > 0 ? rawColumns : [
        { key: 'rank', label: '#', unit: 'integer' },
        { key: 'name', label: 'Item', unit: 'text' },
        { key: 'value', label: 'Value', unit: definition?.unit || 'currency' }
    ];

    if (rawRows.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-ink-muted dark:text-ink-secondary text-3xs font-bold uppercase tracking-wider select-none">
                No Table Data
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col justify-start overflow-hidden">
            <div className="grow overflow-y-auto max-h-[95px] custom-scrollbar">
                <table className="w-full text-[9px] font-bold text-ink-secondary select-none">
                    <thead>
                        <tr className="border-b border-border dark:border-border text-ink-muted uppercase text-3xs">
                            {columns.map(c => (
                                <th key={c.key} className="pb-1 text-left font-bold tracking-wider">{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rawRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="hover:bg-sunken dark:hover:bg-sunken">
                                {columns.map(c => (
                                    <td key={c.key} className="py-1 truncate max-w-[120px]">
                                        {formatValue(row[c.key], c.unit, 0, settings)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
