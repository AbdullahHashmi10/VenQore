import React from 'react';
import { Head, router } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import MasterReport from '@/Components/Reports/MasterReport';

export default function GenericReport(props) {
    const {
        title,
        meta,
        filters = {},
        ...reportProps
    } = props;

    // MasterReport's date-range presets (Today/This Month/This Year) and the
    // custom start/end inputs call onFilterChange(newFilterValues) directly —
    // previously unwired here, so clicking them threw "onFilterChange is not a
    // function" on every report using this factory (Category Profitability,
    // Customer Insights, Supplier Insights, and any future GenericReport page).
    // Wired to re-request the current page with the new date range, following
    // the same pattern as the bespoke report pages (e.g. ItemWiseProfit.jsx).
    const handleFilterChange = (newFilterValues) => {
        router.get(window.location.pathname, {
            start_date: newFilterValues.start_date,
            end_date: newFilterValues.end_date,
            range: 'custom',
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <ReportsLayout title={title || 'Report'}>
            <Head title={title || 'Report'} />
            <MasterReport
                title={title}
                filterValues={{ start_date: filters.start_date, end_date: filters.end_date }}
                onFilterChange={handleFilterChange}
                {...reportProps}
            />
        </ReportsLayout>
    );
}
