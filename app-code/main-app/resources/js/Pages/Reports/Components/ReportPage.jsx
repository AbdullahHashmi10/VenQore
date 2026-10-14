import React from 'react';
import FilterPanel from '@/Components/FilterPanel';
import { ReportShell, ReportSection } from '@/Components/Reports/ReportKit';

/**
 * Simple report page: optional filters, optional stat cards, one content card.
 * Kept for the small reports; richer ones compose ReportShell directly.
 */
export default function ReportPage({
    title,
    subtitle,
    filters = [],
    filterValues = {},
    onFilterChange,
    onResetFilters,
    stats = null,
    exportConfig,
    actions,
    children,
}) {
    return (
        <ReportShell title={title} subtitle={subtitle} exportConfig={exportConfig} actions={actions}>
            {filters.length > 0 && (
                <div className="shrink-0 print:hidden">
                    <FilterPanel
                        filters={filters}
                        values={filterValues}
                        onChange={onFilterChange}
                        onReset={onResetFilters}
                        compact={true}
                        defaultExpanded={false}
                    />
                </div>
            )}
            {stats && (
                <div className="grid shrink-0 gap-2 print:grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
                    {stats}
                </div>
            )}
            <ReportSection flush className="print:border-none print:shadow-none">
                {children}
            </ReportSection>
        </ReportShell>
    );
}
