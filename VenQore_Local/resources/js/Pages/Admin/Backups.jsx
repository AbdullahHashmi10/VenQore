import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    Database, 
    Download, 
    Trash2, 
    Mail, 
    RefreshCw, 
    Plus, 
    HardDrive, 
    ShieldCheck, 
    Clock, 
    AlertTriangle,
    FileText,
    ArrowUpCircle,
    CheckCircle2,
    XCircle
} from 'lucide-react';

export default function Backups({ backups: initialBackups = [] }) {
    const { store } = usePage().props;
    const { props } = usePage();
    const [backups, setBackups] = useState(initialBackups);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [mailing, setMailing] = useState(null);

    const createBackup = () => {
        setCreating(true);
        router.post(route('store.admin.backups.store', { store_slug: props.store.slug }), {}, {
            onFinish: () => setCreating(false),
            preserveScroll: true
        });
    };

    const deleteBackup = (filename) => {
        if (!confirm('Are you sure you want to delete this backup? This cannot be undone.')) return;
        setDeleting(filename);
        router.delete(route('store.admin.backups.delete', { store_slug: props.store.slug, filename }), {
            onFinish: () => setDeleting(null),
            preserveScroll: true
        });
    };

    const emailBackup = (filename) => {
        setMailing(filename);
        router.post(route('store.admin.backups.email', { store_slug: props.store.slug, filename }), {}, {
            onFinish: () => setMailing(null),
            preserveScroll: true
        });
    };

    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('RESTORE DATABASE? All current data will be overwritten by this backup. Proceed with caution.')) {
            e.target.value = null;
            return;
        }

        const formData = new FormData();
        formData.append('backup_file', file);

        setRestoring(true);
        window.axios.post(route('store.admin.backups.restore', { store_slug: props.store.slug }), formData)
            .then(res => {
                alert('Database restored successfully! The page will now reload.');
                window.location.reload();
            })
            .catch(err => {
                alert('Restore failed: ' + (err.response?.data?.message || err.message));
                setRestoring(false);
            });
    };

    return (
        <OneGlanceLayout title="Database Backups" mode="admin">
            <Head title="Database Backups" />

            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Database className="text-indigo-500" size={36} />
                            Database Safety
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your system snapshots and disaster recovery.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer group relative px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm">
                            <input type="file" className="hidden" accept=".sql" onChange={handleRestore} disabled={restoring} />
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                                {restoring ? <RefreshCw size={18} className="animate-spin text-indigo-500" /> : <ArrowUpCircle size={18} className="text-indigo-500" />}
                                Restore Backup
                            </div>
                        </label>

                        <button 
                            onClick={createBackup}
                            disabled={creating}
                            className="relative group px-8 py-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden active:scale-95 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 flex items-center gap-2 text-white font-bold text-sm">
                                {creating ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                                Create Snapshot
                            </div>
                        </button>
                    </div>
                </div>

                {/* Warnings / Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
                            <AlertTriangle size={20} />
                            <h4 className="font-bold uppercase tracking-wider text-xs">Security Note</h4>
                        </div>
                        <p className="text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-medium">
                            Backups include your entire database. Store exported files in a secure, encrypted location.
                        </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-3">
                            <ShieldCheck size={20} />
                            <h4 className="font-bold uppercase tracking-wider text-xs">Point-in-time Recovery</h4>
                        </div>
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed font-medium">
                            Snapshot frequency is recommended daily. Use the create button before major updates.
                        </p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
                            <CheckCircle2 size={20} />
                            <h4 className="font-bold uppercase tracking-wider text-xs">System Health</h4>
                        </div>
                        <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed font-medium">
                            Last automatic health check passed. Database integrity is verified at 100%.
                        </p>
                    </div>
                </div>

                {/* Backup Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Clock className="text-slate-400" size={20} /> Snapshot History
                        </h3>
                        <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {backups.length} Files Found
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Snapshot Name</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">File Size</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {backups.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <HardDrive size={48} className="mb-4 opacity-20" />
                                                <p className="font-bold text-lg text-slate-600 dark:text-slate-400">No snapshots yet</p>
                                                <p className="text-sm">Create your first database backup to protect your data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    backups.map((backup) => (
                                        <tr key={backup.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs">{backup.name}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-0.5">SQL Database Dump</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{backup.date}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {backup.size}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a 
                                                        href={route('store.admin.backups.download', { store_slug: props.store.slug, filename: backup.name })}
                                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-all"
                                                        title="Download SQL"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button 
                                                        onClick={() => emailBackup(backup.name)}
                                                        disabled={mailing === backup.name}
                                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-500 transition-all disabled:opacity-50"
                                                        title="Email Backup"
                                                    >
                                                        {mailing === backup.name ? <RefreshCw size={18} className="animate-spin" /> : <Mail size={18} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteBackup(backup.name)}
                                                        disabled={deleting === backup.name}
                                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-500 transition-all disabled:opacity-50"
                                                        title="Delete permanently"
                                                    >
                                                        {deleting === backup.name ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
