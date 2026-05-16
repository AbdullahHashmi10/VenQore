import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Database,
    HardDrive,
    Save,
    Trash2,
    Download,
    Mail,
    RefreshCw,
    Plus,
    Server,
    Shield,
    Clock,
    FileCode,
    Activity
} from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';

export default function AdminDatabase({ stats, backups }) {
    // Default values to prevent crashes if props are missing
    const safeStats = stats || { size: '0 MB', tables: 0, db_name: 'Loading...', driver: '-' };
    const safeBackups = backups || [];

    const [processing, setProcessing] = useState(false);
    const [emailing, setEmailing] = useState(null); // 'filename' being emailed

    // Create Backup
    const handleCreateBackup = () => {
        if (confirm('Are you sure you want to create a new database backup? This might take a few moments.')) {
            setProcessing(true);
            router.post(route('backups.store'), {}, {
                onFinish: () => setProcessing(false),
                preserveScroll: true
            });
        }
    };

    // Delete Backup
    const handleDelete = (filename) => {
        if (confirm(`Are you sure you want to delete backup "${filename}"?`)) {
            router.delete(route('backups.delete', filename), {
                preserveScroll: true
            });
        }
    };

    // Download
    const handleDownload = (filename) => {
        window.location.href = route('backups.download', filename);
    };

    // Email Backup
    const handleEmail = (filename) => {
        const email = prompt('Enter email address to send backup to:', usePage().props.auth.user.email);
        if (email) {
            setEmailing(filename);
            router.post(route('backups.email', filename), { email }, {
                onFinish: () => setEmailing(null),
                preserveScroll: true
            });
        }
    };

    return (
        <OneGlanceLayout title="Database Center" mode="admin">
            <Head title="Database Management" />

            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Server className="text-indigo-500" />
                            Database Operations
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage backups, monitor size, and optimize performance</p>
                    </div>

                    <button
                        onClick={handleCreateBackup}
                        disabled={processing}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {processing ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                        Create New Backup
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                    {/* Database Name Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                <Database size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Name</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[150px]" title={safeStats.db_name}>{safeStats.db_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Size Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Size</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{safeStats.size}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tables Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tables</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{safeStats.tables}</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                <Server size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connection</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white capitalize">{safeStats.driver}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Backups List */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <Save size={20} className="text-slate-400" />
                                Available Backups
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">{safeBackups.length} Files</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {safeBackups.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                                        <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4">Filename</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4">Created At</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {safeBackups.map((backup, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                                                            <FileCode size={18} />
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{backup.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-slate-500">{backup.size}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                        <Clock size={14} />
                                                        {backup.date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEmail(backup.name)}
                                                            disabled={emailing === backup.name}
                                                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                            title="Email Backup"
                                                        >
                                                            {emailing === backup.name ? <RefreshCw className="animate-spin" size={16} /> : <Mail size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(backup.name)}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(backup.name)}
                                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                                    <Shield size={48} className="mb-4 stroke-1" />
                                    <p className="text-lg font-medium">No backups found</p>
                                    <p className="text-sm">Create your first backup to secure your data.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Information */}
                    <div className="flex flex-col gap-6">
                        <MidnightNebula className="rounded-3xl p-6" primaryColor="indigo" secondaryColor="cyan">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <Shield className="text-white" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Data Safety</h4>
                                    <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                                        Regular backups are critical. We recommend running a backup:
                                    </p>
                                    <ul className="text-xs text-indigo-100 mt-2 list-disc list-inside opacity-90">
                                        <li>Before running any updates</li>
                                        <li>After significant data entry</li>
                                        <li>At least once a week</li>
                                    </ul>
                                </div>
                            </div>
                        </MidnightNebula>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wide">Backup Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex gap-2 items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <Mail size={16} className="text-slate-400" /> Auto-Email
                                    </div>
                                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded">Enabled</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex gap-2 items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <Clock size={16} className="text-slate-400" /> Schedule
                                    </div>
                                    <span className="text-xs text-slate-500">Daily @ 12:00 AM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
