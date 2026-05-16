import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link } from '@inertiajs/react';
import {
    User, Calendar, ArrowLeft, AlertTriangle
} from 'lucide-react';

export default function Show({ staffMember, attendanceHistory }) {
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
                        <Link href={route('store.staff-attendance.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <User className="text-indigo-600" />
                                {staffMember.name}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{staffMember.role || 'Staff Member'} • {staffMember.email}</p>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Attendance History</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Check In</th>
                                    <th className="px-6 py-4 text-center">Check Out</th>
                                    <th className="px-6 py-4 text-center">Hours</th>
                                    <th className="px-6 py-4 text-center">Gaps</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {attendanceHistory.data.length > 0 ? (
                                    attendanceHistory.data.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {formatDate(record.check_in)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {/* Status Badge Logic */}
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                    ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                        record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {record.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">
                                                {formatTime(record.check_in)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-400">
                                                {formatTime(record.check_out)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {record.hours_worked ? parseFloat(record.hours_worked).toFixed(1) : '0.0'}h
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {record.total_gap_minutes > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-xs">
                                                        <AlertTriangle size={12} />
                                                        {record.total_gap_minutes}m
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                            No attendance records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {attendanceHistory.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                            <div className="flex gap-1">
                                {attendanceHistory.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-3 py-1 rounded-lg text-sm font-bold ${link.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${!link.url && 'opacity-50 pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
