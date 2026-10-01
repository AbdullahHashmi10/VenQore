import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link } from '@inertiajs/react';
import {
    User, Calendar, ArrowLeft, AlertTriangle
} from 'lucide-react';

export default function Show({ staffMember, attendanceHistory }) {
    const { store } = usePage().props;
    // Helper to format time
    const formatTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <OneGlanceLayout title={`Attendance: ${staffMember.name}`} activeMenu="Staff Attendance" mode="admin">
            <Head title={`Attendance - ${staffMember.name}`} />

            <div className="max-w-5xl mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('store.staff-attendance.index', { store_slug: store.slug })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-full text-ink-muted transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
                                <User className="text-brand-600" />
                                {staffMember.name}
                            </h1>
                            <p className="text-ink-muted font-medium">{staffMember.role || 'Staff Member'} • {staffMember.email}</p>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-line">
                        <h3 className="font-bold text-lg text-ink">Attendance History</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app">
                                <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Check In</th>
                                    <th className="px-6 py-4 text-center">Check Out</th>
                                    <th className="px-6 py-4 text-center">Hours</th>
                                    <th className="px-6 py-4 text-center">Gaps</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {attendanceHistory.data.length > 0 ? (
                                    attendanceHistory.data.map((record) => (
                                        <tr key={record.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="px-6 py-4 font-medium text-ink">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-ink-muted" />
                                                    {formatDate(record.check_in)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {/* Status Badge Logic */}
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase
                                                    ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                        record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-sunken text-ink-secondary'}`}>
                                                    {record.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-ink-secondary">
                                                {formatTime(record.check_in)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-ink-secondary">
                                                {formatTime(record.check_out)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-ink-secondary">
                                                {record.hours_worked ? parseFloat(record.hours_worked).toFixed(1) : '0.0'}h
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {record.total_gap_minutes > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                                                        <AlertTriangle size={12} />
                                                        {record.total_gap_minutes}m
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-ink-muted">
                                            No attendance records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {attendanceHistory.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-line flex justify-center">
                            <div className="flex gap-1">
                                {attendanceHistory.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-3 py-1 rounded-lg text-sm font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-secondary hover:bg-interactive-hover'} ${!link.url && 'opacity-50 pointer-events-none'}`}
                                    >{(link.label || '').replace(/<[^>]*>/g, '').replace(/&laquo;/g, '\u00ab').replace(/&raquo;/g, '\u00bb').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')}</Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
