import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import PageHeader from '@/Components/PageHeader';
import FilterPanel from '@/Components/FilterPanel';
import { Printer, Download, FileText } from 'lucide-react';

export default function ReportPage({
    title,
    subtitle,
    icon: Icon = FileText,
    breadcrumbs = [],
    filters = [],
    filterValues = {},
    onFilterChange,
    onResetFilters,
    stats = null,
    children
}) {
    const {
        store
    } = usePage().props;

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        // Implement export logic (CSV/PDF)
        alert('Export functionality coming soon');
    };

    return (
        <ReportsLayout title={title}>
            <Head title={title} />
            <div className="h-full flex flex-col gap-4 overflow-hidden">
                <div className="flex-none print:hidden">
                    <PageHeader
                        title={title}
                        subtitle={subtitle}
                        icon={Icon}
                        breadcrumbs={[
                            { label: 'Reports', href: route("store.reports.index", {
                                store_slug: store.slug
                            }) },
                            ...breadcrumbs
                        ]}
                        actions={
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="px-3 py-2 bg-surface border border-line rounded-lg text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Download size={16} />
                                    Export
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg "
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                            </div>
                        }
                    />
                    <div className="mt-4">
                        {/* ReportsNavigation removed in favor of Sidebar */}
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold text-ink">{title}</h1>
                    <p className="text-ink-muted">{subtitle}</p>
                    <p className="text-sm text-ink-muted mt-2">Generated on {new Date().toLocaleString()}</p>
                </div>

                {/* Content Container with overflow auto */}
                <div className="flex-1 overflow-auto min-h-0 pb-6">
                    {/* Filters (Hidden on Print) */}
                    {filters.length > 0 && (
                        <div className="print:hidden mb-4">
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

                    {/* Stats Section */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 mb-6">
                            {stats}
                        </div>
                    )}

                    {/* Report Content */}
                    <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-line shadow-sm overflow-hidden print:shadow-none print:border-none">
                        {children}
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}
