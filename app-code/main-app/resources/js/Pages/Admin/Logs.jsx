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
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';

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
        <OneGlanceLayout title="Security Command Center" mode="admin" noPadding>
            <Head title="Security Logs" />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:max-w-[1600px] max-md:mx-auto max-md:h-full max-md:flex max-md:flex-col max-md:gap-6">
                <ListToolbar
                    title="Security Audit Log"
                    left={<ListFilterPill icon={Filter} label="Status" value={filterLevel} onChange={setFilterLevel} options={['all', 'info', 'success', 'warning', 'error'].map(l => ({ value: l, label: l === 'all' ? 'All statuses' : l.charAt(0).toUpperCase() + l.slice(1) }))} />}
                    search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search logs...' }}
                    actions={<button type="button" onClick={refreshPage} className="h-10 w-10 rounded-[12px] border border-line bg-app text-ink-muted hover:text-brand-500 hover:bg-interactive-hover flex items-center justify-center transition-colors" title="Refresh Logs"><RefreshCw size={16} /></button>}
                />
                <ListStatCards cards={[
                    { label: 'Total Events', value: displayLogs.length, icon: FileText },
                    { label: 'Critical', value: displayLogs.filter(l => l.level === 'error').length, icon: AlertOctagon, icon_tone: 'bg-rose-50 text-rose-600' },
                    { label: 'Warnings', value: displayLogs.filter(l => l.level === 'warning').length, icon: AlertTriangle, icon_tone: 'bg-amber-50 text-amber-600' },
                    { label: 'Success', value: displayLogs.filter(l => l.level === 'success').length, icon: CheckCircle, icon_tone: 'bg-emerald-50 text-emerald-600' },
                ]} />

                <MobileListHeader
                    title="Security Audit Log"
                    filter={{
                        active: filterLevel !== 'all',
                        sections: [{ label: 'Status', value: filterLevel, options: ['all', 'info', 'success', 'warning', 'error'].map(l => ({ value: l, label: l === 'all' ? 'All statuses' : l.charAt(0).toUpperCase() + l.slice(1) })), onSelect: setFilterLevel }],
                    }}
                    search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search logs...' }}
                    actions={[{ icon: RefreshCw, label: 'Refresh', onClick: refreshPage }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Events', value: displayLogs.length, tone: 'ink', icon: FileText },
                    { label: 'Critical', value: displayLogs.filter(l => l.level === 'error').length, tone: 'rose', icon: AlertOctagon },
                    { label: 'Warnings', value: displayLogs.filter(l => l.level === 'warning').length, tone: 'amber', icon: AlertTriangle },
                    { label: 'Success', value: displayLogs.filter(l => l.level === 'success').length, tone: 'emerald', icon: CheckCircle },
                ]} />

                {/* Logs Table */}
                <div className="flex-1 bg-surface border border-line rounded-2xl md:rounded-[14px] shadow-sm flex flex-col overflow-hidden min-h-0">
                    {/* Table Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app sticky top-0 z-10 backdrop-blur-md">
                                <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-line">
                                    <th className="sticky top-0 z-10 bg-app px-6 py-4 w-48">Timestamp</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-4 w-32">Status</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-4">Activity</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-4">User</th>
                                    {/* <th className="sticky top-0 z-10 bg-app px-6 py-4 text-right">IP Address</th> */}
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
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
