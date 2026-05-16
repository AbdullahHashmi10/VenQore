import React from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import { History, User, Clock, FileText, Trash2, RefreshCw } from 'lucide-react';

export default function ActivityLog({ logs }) {
    return (
        <OneGlanceLayout title="Activity Log">
            <Head title="Activity Log" />

            <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
                <PageHeader
                    title="Activity Log"
                    subtitle="Track changes and important events"
                    icon={History}
                    breadcrumbs={[
                        { label: 'Activity Log' }
                    ]}
                />

                <div className="overflow-y-auto flex-1">

                    <div className="space-y-4">
                        {logs.data.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <History size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No activity recorded yet</p>
                            </div>
                        ) : (
                            logs.data.map(log => (
                                <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                                    <div className={`p-2 rounded-lg mt-1 ${log.action === 'delete' || log.action === 'force_delete' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        log.action === 'restore' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {log.action === 'delete' || log.action === 'force_delete' ? <Trash2 size={18} /> :
                                            log.action === 'restore' ? <RefreshCw size={18} /> :
                                                <FileText size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{log.description}</h3>
                                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <User size={14} />
                                            <span>{log.user?.name || 'Unknown User'}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono uppercase">
                                                {log.action}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
