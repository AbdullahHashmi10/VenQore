import React from 'react';
import { ReportShell } from '@/Components/Reports/ReportKit';

/**
 * Back-compat wrapper. Every report used to wrap itself in this layout with a
 * dark left sidebar; the frame now lives in Components/Reports/ReportKit
 * (toolbar with a categorised report menu, filters row, dashboard-style scroll).
 * New pages should use <ReportShell> directly.
 */
export default function ReportsLayout({ children, title, showSidebar, ...rest }) {
    return <ReportShell title={title || 'Reports'} {...rest}>{children}</ReportShell>;
}
