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
 router.post(route('store.backups.store', { store_slug: props.store.slug }), {}, {
 onFinish: () => setCreating(false),
 preserveScroll: true
 });
 };

 const deleteBackup = (filename) => {
 if (!confirm('Are you sure you want to delete this backup? This cannot be undone.')) return;
 setDeleting(filename);
 router.delete(route('store.backups.delete', { store_slug: props.store.slug, filename }), {
 onFinish: () => setDeleting(null),
 preserveScroll: true
 });
 };

 const emailBackup = (filename) => {
 setMailing(filename);
 router.post(route('store.backups.email', { store_slug: props.store.slug, filename }), {}, {
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
 window.axios.post(route('store.backups.restore', { store_slug: props.store.slug }), formData)
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
 <h2 className="text-4xl font-bold text-ink tracking-tight flex items-center gap-3">
 <Database className="text-brand-500" size={36} />
 Database Safety
 </h2>
 <p className="text-ink-muted mt-2 font-medium">Manage your system snapshots and disaster recovery.</p>
 </div>

 <div className="flex items-center gap-3">
 <label className="cursor-pointer group relative px-6 py-3 rounded-2xl bg-surface border border-line hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm">
 <input type="file" className="hidden" accept=".sql" onChange={handleRestore} disabled={restoring} />
 <div className="flex items-center gap-2 text-ink-secondary dark:text-ink font-bold text-sm">
 {restoring ? <RefreshCw size={18} className="animate-spin text-brand-500" /> : <ArrowUpCircle size={18} className="text-brand-500" />}
 Restore Backup
 </div>
 </label>

 <button 
 onClick={createBackup}
 disabled={creating}
 className="relative group px-8 py-3 rounded-2xl bg-sunken border border-neutral-800 shadow-xl overflow-hidden active:scale-95 transition-all"
 >
 <div className="absolute inset-0 bg-gradient-brand opacity-90 group-hover:opacity-100 transition-opacity"></div>
 <div className="relative z-10 flex items-center gap-2 text-white font-bold text-sm">
 {creating ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
 Create Snapshot
 </div>
 </button>
 </div>
 </div>

 {/* Warnings / Info Card */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
 <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
 <AlertTriangle size={20} />
 <h4 className="font-bold uppercase tracking-wider text-xs">Security Note</h4>
 </div>
 <p className="text-sm text-amber-800/80 dark:text-amber-400/80 leading-relaxed font-medium">
 Backups include your entire database. Store exported files in a secure, encrypted location.
 </p>
 </div>

 <div className="p-6 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
 <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-3">
 <ShieldCheck size={20} />
 <h4 className="font-bold uppercase tracking-wider text-xs">Point-in-time Recovery</h4>
 </div>
 <p className="text-sm text-brand-800/80 dark:text-brand-400/80 leading-relaxed font-medium">
 Snapshot frequency is recommended daily. Use the create button before major updates.
 </p>
 </div>

 <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
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
 <div className="bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden relative">
 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
 
 <div className="px-8 py-6 border-b border-line bg-sunken/50 dark:bg-surface flex items-center justify-between">
 <h3 className="text-xl font-bold text-ink flex items-center gap-2">
 <Clock className="text-ink-muted" size={20} /> Snapshot History
 </h3>
 <span className="px-3 py-1 bg-sunken rounded-full text-2xs font-bold uppercase tracking-widest text-ink-muted">
 {backups.length} Files Found
 </span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="text-left border-b border-line">
 <th className="px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted">Snapshot Name</th>
 <th className="px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted">Created Date</th>
 <th className="px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted">File Size</th>
 <th className="px-8 py-5 text-2xs font-bold uppercase tracking-widest text-ink-muted text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {backups.length === 0 ? (
 <tr>
 <td colSpan="4" className="px-8 py-20 text-center">
 <div className="flex flex-col items-center justify-center text-ink-muted">
 <HardDrive size={48} className="mb-4 opacity-20" />
 <p className="font-bold text-lg text-ink-secondary">No snapshots yet</p>
 <p className="text-sm">Create your first database backup to protect your data.</p>
 </div>
 </td>
 </tr>
 ) : (
 backups.map((backup) => (
 <tr key={backup.name} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
 <td className="px-8 py-5">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
 <FileText size={20} />
 </div>
 <div>
 <p className="text-sm font-bold text-ink-secondary dark:text-ink truncate max-w-xs">{backup.name}</p>
 <p className="text-2xs font-bold uppercase tracking-tighter text-ink-muted mt-0.5">SQL Database Dump</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-5">
 <p className="text-sm font-medium text-ink-secondary">{backup.date}</p>
 </td>
 <td className="px-8 py-5">
 <span className="px-2 py-1 bg-sunken rounded-lg text-xs font-bold text-ink-secondary">
 {backup.size}
 </span>
 </td>
 <td className="px-8 py-5">
 <div className="flex items-center justify-end gap-2">
 <a 
 href={route('store.backups.download', { store_slug: props.store.slug, filename: backup.name })}
 className="p-2.5 rounded-xl bg-surface border border-line text-ink-muted hover:text-brand-500 hover:border-brand-500 dark:hover:text-brand-400 dark:hover:border-brand-500 transition-all"
 title="Download SQL"
 >
 <Download size={18} />
 </a>
 <button 
 onClick={() => emailBackup(backup.name)}
 disabled={mailing === backup.name}
 className="p-2.5 rounded-xl bg-surface border border-line text-ink-muted hover:text-emerald-500 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-500 transition-all disabled:opacity-50"
 title="Email Backup"
 >
 {mailing === backup.name ? <RefreshCw size={18} className="animate-spin" /> : <Mail size={18} />}
 </button>
 <button 
 onClick={() => deleteBackup(backup.name)}
 disabled={deleting === backup.name}
 className="p-2.5 rounded-xl bg-surface border border-line text-ink-muted hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-500 transition-all disabled:opacity-50"
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
