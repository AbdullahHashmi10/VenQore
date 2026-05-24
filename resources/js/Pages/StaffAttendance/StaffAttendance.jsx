import React, { useState, useMemo } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import {
    UserCheck,
    Search,
    Download,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Play,
    Pause,
    User,
    Timer,
    Coffee,
    TrendingUp,
    ChevronUp,
    ChevronDown,
    Printer
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function StaffAttendanceIndex({ staff = [], attendance = [], gaps = [], filters = {} }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const { showAlert } = useAlert();

    // Stats for selected date
    const stats = useMemo(() => {
        // Attendance prop is already filtered by controller for the selected date
        // But we filter again just in case or for safety
        const currentData = attendance;
        return {
            totalStaff: staff.length,
            present: currentData.filter(a => a.status === 'present').length,
            absent: staff.length - currentData.filter(a => a.status === 'present').length,
            pendingGaps: gaps.filter(g => g.status === 'pending').length,
            totalHoursToday: currentData.reduce((sum, a) => sum + parseFloat(a.hours_worked || 0), 0)
        };
    }, [staff, attendance, gaps]);

    // Filter staff
    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'present':
                return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle, label: 'Present' };
            case 'absent':
                return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, label: 'Absent' };
            case 'late':
                return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, label: 'Late' };
            case 'on_break':
                return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Coffee, label: 'On Break' };
            default:
                return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', icon: User, label: status || 'Absent' };
        }
    };

    const formatTime = (time) => {
        if (!time) return '-';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleApproveGap = (gapId) => {
        router.post(route('store.staff-attendance.approve-gap', gapId), {}, {
            onSuccess: () => showAlert({ title: 'Approved', message: 'Gap claim approved', type: 'success' })
        });
    };

    const handleRejectGap = (gapId) => {
        router.post(route('store.staff-attendance.reject-gap', gapId), {}, {
            onSuccess: () => showAlert({ title: 'Rejected', message: 'Gap claim rejected', type: 'info' })
        });
    };

    return (
        <OneGlanceLayout title="Staff Attendance" activeMenu="Staff Attendance" mode="admin">
            <Head title="Staff Attendance" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab="attendance" />

                {/* Stats Cards - 5 Separate Cards in Row */}
                <div className="grid grid-cols-5 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <UserCheck size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Staff</p>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalStaff}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Present</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{stats.present}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                <XCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Absent</p>
                        </div>
                        <p className="text-lg font-black text-red-600">{stats.absent}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending Gaps</p>
                        </div>
                        <p className="text-lg font-black text-amber-600">{stats.pendingGaps}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Timer size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Hours Today</p>
                        </div>
                        <p className="text-lg font-black text-purple-600">{stats.totalHoursToday.toFixed(1)}h</p>
                    </div>
                </div>

                {/* Header Bar - Title + Date + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Date Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Staff <span className="text-indigo-600">Attendance</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    setDateFilter(newDate);
                                    router.get(route('store.staff-attendance.index', { store_slug: store.slug }), { date: newDate }, { preserveState: true, preserveScroll: true });
                                }}
                                className="pl-8 pr-2 py-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300 w-36"
                            />
                        </div>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search staff..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pending Gap Claims (if any) */}
                {gaps.filter(g => g.status === 'pending').length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-2 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Pending Gap Approvals</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {gaps.filter(g => g.status === 'pending').map(gap => (
                                <div key={gap.id} className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 rounded-lg p-2 flex items-center gap-2 shadow-sm">
                                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                                        <User size={12} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="mr-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{gap.user?.name}</p>
                                        <p className="text-[10px] text-slate-500">{formatTime(gap.start_time)} - {formatTime(gap.end_time)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleApproveGap(gap.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors" title="Approve">
                                            <CheckCircle size={12} />
                                        </button>
                                        <button onClick={() => handleRejectGap(gap.id)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="Reject">
                                            <XCircle size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff Member</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Check In</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Check Out</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Hours</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Breaks</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Gaps</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStaff.length > 0 ? (
                                filteredStaff.map((member) => {
                                    const attendanceRecord = attendance.find(a => a.user_id === member.id && a.date === dateFilter);
                                    const memberGaps = gaps.filter(g => g.user_id === member.id);
                                    const statusStyle = getStatusStyle(attendanceRecord?.status);
                                    const StatusIcon = statusStyle.icon;

                                    return (
                                        <tr key={member.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                        <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{member.name}</p>
                                                        <p className="text-[10px] text-slate-500">{member.role || 'Staff'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                    <StatusIcon size={10} />
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400">
                                                {formatTime(attendanceRecord?.check_in)}
                                            </td>
                                            <td className="p-3 text-center text-sm font-mono text-slate-600 dark:text-slate-400">
                                                {formatTime(attendanceRecord?.check_out)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-bold text-sm text-slate-800 dark:text-white">
                                                    {attendanceRecord?.hours_worked?.toFixed(1) || '0'}h
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">
                                                    <Coffee size={10} />
                                                    {attendanceRecord?.breaks || 0}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {memberGaps.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold">
                                                        <AlertTriangle size={10} />
                                                        {memberGaps.length}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Link
                                                    href={route('store.staff-attendance.show', member.id)}
                                                    className="inline-flex p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    title="View Full History"
                                                >
                                                    <TrendingUp size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                                <UserCheck size={28} className="text-slate-400" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No staff members found</p>
                                            <p className="text-sm text-slate-500">Add staff members to start tracking attendance</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
