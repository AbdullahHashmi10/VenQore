import React from 'react';
import { Head } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import MasterReport from '@/Components/Reports/MasterReport';

export default function GenericReport(props) {
    const {
        title,
        meta,
        ...reportProps
    } = props;

    return (
        <ReportsLayout title={title || 'Report'}>
            <Head title={title || 'Report'} />
            <MasterReport
                title={title}
                {...reportProps}
            />
        </ReportsLayout>
    );
}
