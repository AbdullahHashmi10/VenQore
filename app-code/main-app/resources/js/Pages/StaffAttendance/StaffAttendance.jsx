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
    Printer,
    Monitor,
    Eye,
    Shield
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function StaffAttendanceIndex({ staff = [], attendance = [], gaps = [], terminalActivities = [], filters = {} }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(filters.date || new Date().toISOString().split('T')[0]);
    const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' or 'security'
    const [selectedScreenshotId, setSelectedScreenshotId] = useState(null);
    const { showAlert } = useAlert();

    // Stats for selected date
    const stats = useMemo(() => {
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
                return { bg: 'bg-sunken', text: 'text-ink-muted', icon: User, label: status || 'Absent' };
        }
    };

    const formatTime = (time) => {
        if (!time) return '-';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '-';
        try {
            return new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return dateTimeStr;
        }
    };

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    const handleApproveGap = (gapId) => {
        router.post(route('store.staff-attendance.approve-gap', { store_slug: store.slug, id: gapId }), {}, {
            onSuccess: () => showAlert({ title: 'Approved', message: 'Gap claim approved', type: 'success' })
        });
    };

    const handleRejectGap = (gapId) => {
        router.post(route('store.staff-attendance.reject-gap', { store_slug: store.slug, id: gapId }), {}, {
            onSuccess: () => showAlert({ title: 'Rejected', message: 'Gap claim rejected', type: 'info' })
        });
    };

    return (
        <OneGlanceLayout title="Staff Attendance" activeMenu="Staff Attendance" mode="admin">
            <Head title="Staff Attendance" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab="attendance" />

                {/* Stats Cards - 5 Separate Cards in Row */}
                <div className="grid grid-cols-5 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <UserCheck size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Staff</p>
                        </div>
                        <p className="text-lg font-bold text-ink">{stats.totalStaff}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Present</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{stats.present}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                <XCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Absent</p>
                        </div>
                        <p className="text-lg font-bold text-red-600">{stats.absent}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Pending Gaps</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{stats.pendingGaps}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Timer size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Hours Today</p>
                        </div>
                        <p className="text-lg font-bold text-purple-600">{stats.totalHoursToday.toFixed(1)}h</p>
                    </div>
                </div>

                {/* Header Bar - Title + Sub-Tabs + Date + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Sub-Tabs + Date Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Staff <span className="text-brand-600">Attendance</span>
                        </h1>
                        
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        
                        <div className="flex gap-1 bg-sunken p-0.5 rounded-lg text-xs font-bold uppercase shrink-0">
                            <button 
                                onClick={() => setActiveSubTab('attendance')}
                                className={`px-2.5 py-1 rounded-md transition-all ${activeSubTab === 'attendance' ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm' : 'text-ink-muted hover:text-ink-secondary'}`}
                            >
                                📋 Staff Log
                            </button>
                            <button 
                                onClick={() => setActiveSubTab('security')}
                                className={`px-2.5 py-1 rounded-md transition-all ${activeSubTab === 'security' ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm' : 'text-ink-muted hover:text-ink-secondary'}`}
                            >
                                🛡️ Terminal Security
                            </button>
                        </div>

                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        
                        <div className="relative">
                            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    setDateFilter(newDate);
                                    router.get(route('store.staff-attendance.index', { store_slug: store.slug }), { date: newDate }, { preserveState: true, preserveScroll: true });
                                }}
                                className="pl-8 pr-2 py-1 text-sm font-medium bg-sunken border-none rounded-lg focus:ring-0 cursor-pointer text-ink-secondary w-36"
                            />
                        </div>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        {activeSubTab === 'attendance' && (
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search staff..."
                                    className="pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-44"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-0.5 border-l border-line pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pending Gap Claims (if any) */}
                {activeSubTab === 'attendance' && gaps.filter(g => g.status === 'pending').length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-2 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Pending Gap Approvals</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {gaps.filter(g => g.status === 'pending').map(gap => (
                                <div key={gap.id} className="bg-surface border border-amber-100 dark:border-line rounded-lg p-2 flex items-center gap-2 shadow-sm">
                                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                                        <User size={12} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="mr-2">
                                        <p className="text-xs font-bold text-ink">{gap.user?.name}</p>
                                        <p className="text-2xs text-ink-muted">{formatTime(gap.start_time)} - {formatTime(gap.end_time)}</p>
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

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    {activeSubTab === 'attendance' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app border-b border-line sticky top-0 z-10">
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Staff Member</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Status</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Check In</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Check Out</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Hours</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Breaks</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Gaps</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredStaff.length > 0 ? (
                                    filteredStaff.map((member) => {
                                        const attendanceRecord = attendance.find(a => a.user_id === member.id && a.date === dateFilter);
                                        const memberGaps = gaps.filter(g => g.user_id === member.id);
                                        const statusStyle = getStatusStyle(attendanceRecord?.status);
                                        const StatusIcon = statusStyle.icon;

                                        return (
                                            <tr key={member.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                                                            <User size={14} className="text-brand-600 dark:text-brand-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-ink">{member.name}</p>
                                                            <p className="text-2xs text-ink-muted">{member.role || 'Staff'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                                                        <StatusIcon size={10} />
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center text-sm font-mono text-ink-secondary">
                                                    {formatTime(attendanceRecord?.check_in)}
                                                </td>
                                                <td className="p-3 text-center text-sm font-mono text-ink-secondary">
                                                    {formatTime(attendanceRecord?.check_out)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-bold text-sm text-ink">
                                                        {attendanceRecord?.hours_worked?.toFixed(1) || '0'}h
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-2xs font-bold">
                                                        <Coffee size={10} />
                                                        {attendanceRecord?.breaks || 0}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {memberGaps.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-2xs font-bold">
                                                            <AlertTriangle size={10} />
                                                            {memberGaps.length}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-300 dark:text-ink-secondary">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Link
                                                        href={route('store.staff-attendance.show', { store_slug: store.slug, id: member.id })}
                                                        className="inline-flex p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
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
                                                <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                    <UserCheck size={28} className="text-ink-muted" />
                                                </div>
                                                <p className="text-base font-bold text-ink-secondary mb-1">No staff members found</p>
                                                <p className="text-sm text-ink-muted">Add staff members to start tracking attendance</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app border-b border-line sticky top-0 z-10">
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Terminal ID / Name</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Device Fingerprint</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Away (Focus Lost)</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Resume (Focus Back)</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Duration</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Screen Capture</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {terminalActivities.length > 0 ? (
                                    terminalActivities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                                                        <Monitor size={14} className="text-brand-600 dark:text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-ink">
                                                            {activity.terminal?.name || 'Unknown Terminal'}
                                                        </p>
                                                        <p className="text-2xs text-ink-muted">POS Terminal</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-xs font-mono text-ink-secondary">
                                                {activity.device_id ? activity.device_id.substring(0, 16) + '...' : '-'}
                                            </td>
                                            <td className="p-3 text-center text-sm font-mono text-ink-secondary">
                                                {formatDateTime(activity.away_at)}
                                            </td>
                                            <td className="p-3 text-center text-sm font-mono text-ink-secondary">
                                                {formatDateTime(activity.back_at)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                    <Timer size={10} />
                                                    {formatDuration(activity.duration_seconds)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {activity.screenshot_path ? (
                                                    <button
                                                        onClick={() => setSelectedScreenshotId(activity.id)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow transition-all"
                                                    >
                                                        <Eye size={12} />
                                                        View Capture
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-ink-muted">No Capture</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-12">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                    <Shield size={28} className="text-ink-muted" />
                                                </div>
                                                <p className="text-base font-bold text-ink-secondary mb-1">No security logs recorded</p>
                                                <p className="text-sm text-ink-muted">Terminal activity is clean for this date</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Decrypted Screen Capture Modal */}
            {selectedScreenshotId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-fast">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Shield className="text-brand-500" size={20} />
                                <div>
                                    <h3 className="text-base font-bold text-white uppercase">Decrypted Terminal Capture</h3>
                                    <p className="text-2xs text-ink-muted font-bold">
                                        Terminal: {terminalActivities.find(a => a.id === selectedScreenshotId)?.terminal?.name || 'Unknown'} | 
                                        Duration Away: {formatDuration(terminalActivities.find(a => a.id === selectedScreenshotId)?.duration_seconds || 0)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedScreenshotId(null)}
                                className="p-1 text-ink-muted hover:text-white hover:bg-interactive-hover rounded-lg transition-all"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 min-h-[300px] max-h-[60vh] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800">
                            <img
                                src={route('store.terminal-activities.screenshot', { store_slug: store.slug, id: selectedScreenshotId })}
                                alt="Terminal screen capture"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E";
                                    showAlert({ title: 'Error', message: 'Failed to decrypt or load screen capture.', type: 'error' });
                                }}
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2 border-t border-neutral-800 pt-3 text-xs text-ink-muted">
                            <p>🔒 This screen capture was stored with AES-256 encryption and decrypted securely on request.</p>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
