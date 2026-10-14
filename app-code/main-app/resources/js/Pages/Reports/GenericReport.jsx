import React from 'react';
import { router } from '@inertiajs/react';
import { ReportShell } from '@/Components/Reports/ReportKit';
import MasterReport from '@/Components/Reports/MasterReport';

export default function GenericReport(props) {
    const {
        title,
        meta,
        filters = {},
        ...reportProps
    } = props;

    // MasterReport's date-range presets and custom start/end inputs call
    // onFilterChange(newFilterValues); re-request the current page with the new
    // date range, as the bespoke report pages do.
    const handleFilterChange = (newFilterValues) => {
        router.get(window.location.pathname, {
            start_date: newFilterValues.start_date,
            end_date: newFilterValues.end_date,
            range: 'custom',
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <ReportShell title={title || 'Report'}>
            <MasterReport
                title={title}
                filterValues={{ start_date: filters.start_date, end_date: filters.end_date }}
                onFilterChange={handleFilterChange}
                {...reportProps}
            />
        </ReportShell>
    );
}
