import React, { useState, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head } from '@inertiajs/react';
import {
    Shield,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle,
    Info,
    Clock,
    AlertOctagon,
    FileText,
    RefreshCw,
    Terminal,
    Globe
} from 'lucide-react';

export default function AdminLogs({ logs = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');

    // Process Logs from backend
    const displayLogs = useMemo(() => {
        if (!logs || logs.length === 0) return [];

        return logs.map(log => {
            // Derive level from action string since DB doesn't have it explicitly
            let level = 'info';
            const act = (log.action || '').toLowerCase();
            const desc = (log.description || '').toLowerCase();

            if (act.includes('fail') || act.includes('error') || act.includes('delet') || act.includes('destroy') || act.includes('alert')) {
                level = 'error';
            } else if (act.includes('warn') || desc.includes('warn')) {
                level = 'warning';
            } else if (act.includes('succ') || act.includes('create') || act.includes('add') || act.includes('update') || act.includes('sale') || act.includes('purchase')) {
                level = 'success';
            }

            return {
                ...log,
                id: log.id,
                action: log.action || 'Unknown Action',
                description: log.description || 'No details provided',
                level: level,
                user: log.user ? log.user.name : 'System/Guest',
                ip: log.properties?.ip || '-',
                created_at: log.created_at
            };
        });
    }, [logs]);

    // Filtering Logic
    const filteredLogs = useMemo(() => {
        return displayLogs.filter(log => {
            const matchesSearch =
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter = filterLevel === 'all' || log.level === filterLevel;

            return matchesSearch && matchesFilter;
        });
    }, [displayLogs, searchQuery, filterLevel]);

    const getLevelConfig = (level) => {
        switch (level) {
            case 'error': return { color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/20', icon: AlertOctagon, label: 'Critical' };
            case 'warning': return { color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20', icon: AlertTriangle, label: 'Warning' };
            case 'success': return { color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20', icon: CheckCircle, label: 'Success' };
            default: return { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20', icon: Info, label: 'Info' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const refreshPage = () => {
        window.location.reload();
    };

    return (
        <OneGlanceLayout title="Security Command Center" mode="admin">
            <Head title="Security Logs" />

            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
                            <Shield className="text-brand-500" />
                            Security Audit Log
                        </h1>
                        <p className="text-sm text-ink-muted">Real-time system activity tracking</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-brand-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-line rounded-xl bg-surface text-ink focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                            />
                        </div>

                        <button onClick={refreshPage} className="p-2 bg-sunken rounded-xl text-ink-muted hover:text-brand-500 transition-colors" title="Refresh Logs">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Events</p>
                            <p className="text-2xl font-bold text-ink">{displayLogs.length}</p>
                        </div>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Critical</p>
                            <p className="text-2xl font-bold text-ink">{displayLogs.filter(l => l.level === 'error').length}</p>
                        </div>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Warnings</p>
                            <p className="text-2xl font-bold text-ink">{displayLogs.filter(l => l.level === 'warning').length}</p>
                        </div>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Success</p>
                            <p className="text-2xl font-bold text-ink">{displayLogs.filter(l => l.level === 'success').length}</p>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="flex-1 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-line flex items-center gap-2">
                        <Filter size={16} className="text-ink-muted" />
                        <span className="text-sm font-bold text-ink-secondary mr-2">Status:</span>

                        {['all', 'info', 'success', 'warning', 'error'].map(level => (
                            <button
                                key={level}
                                onClick={() => setFilterLevel(level)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                    ${filterLevel === level
                                        ? 'bg-brand-600 text-white shadow-md '
                                        : 'bg-sunken text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                    }
`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-10 backdrop-blur-md">
                                <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-line">
                                    <th className="px-6 py-4 w-48">Timestamp</th>
                                    <th className="px-6 py-4 w-32">Status</th>
                                    <th className="px-6 py-4">Activity</th>
                                    <th className="px-6 py-4">User</th>
                                    {/* <th className="px-6 py-4 text-right">IP Address</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => {
                                        const status = getLevelConfig(log.level);
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr key={log.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-ink-secondary text-sm font-mono">
                                                        <Clock size={14} className="text-neutral-300" />
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider ${status.color} ${status.bg}`}>
                                                        <StatusIcon size={12} />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-ink-secondary dark:text-ink mb-0.5">{log.action}</p>
                                                        <p className="text-xs text-ink-muted font-mono">{log.description}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-sunken flex items-center justify-center text-xs font-bold text-ink-muted uppercase">
                                                            {log.user.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium text-ink-secondary">{log.user}</span>
                                                    </div>
                                                </td>
                                                {/* <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted bg-app px-2 py-1 rounded-md font-mono">
                                                        <Globe size={12} />
                                                        {log.ip}
                                                    </div>
                                                </td> */}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-ink-muted opacity-60">
                                                <Terminal size={48} className="mb-4 stroke-1" />
                                                <p className="text-lg font-medium">No system logs found</p>
                                                <p className="text-sm">Activities will appear here once recorded by the system.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
