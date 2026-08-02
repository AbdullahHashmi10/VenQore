import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Database,
    Download,
    Upload,
    FileSpreadsheet,
    FileText,
    CheckSquare,
    Square,
    AlertCircle,
    Check,
    Archive,
    Grid,
    FileType,
    ArrowRight,
    RefreshCw,
    ShieldCheck,
    Lock,
    Sparkles,
    Cloud,
    Settings,
    Link2,
    Unlink,
    ExternalLink,
    Trash2,
    Mail,
    Plus,
    HardDrive,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';
import PremiumSelect from '@/Components/PremiumSelect';
import { useAlert } from '@/Contexts/AlertContext';

// NOTE: This page absorbed three things that used to live elsewhere:
//  - The "Backups" tab below replaces the old Settings > "Backup & Data" tab
//    AND the standalone Admin/Backups.jsx page AND Admin/Database.jsx's own
//    backup list — those were three separate places to download/restore/delete
//    the same SQL backups. This is now the one place.
//  - The "Migrate from Another System" tab replaces the standalone
//    Admin/Migration.jsx page, which worked fine but had no link pointing to
//    it anywhere in the app.
// Both still call the exact same backend routes/controllers as before
// (BackupController / MigrationController) — only the frontend moved.
export default function DataManagement() {
    const { store, googleBackups = [], backups: initialBackupsList = [], autoBackupEnabled = true } = usePage().props;
    const { showConfirm, showAlert } = useAlert();
    const csrfToken = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') : '';
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const [activeTab, setActiveTab] = useState(urlParams?.get('tab') || 'drive_sync');

    const [exportFormat, setExportFormat] = useState('xlsx');
    const [selectedExports, setSelectedExports] = useState([]);
    const [uploadingBackup, setUploadingBackup] = useState(false);
    const [syncingToDrive, setSyncingToDrive] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(null);

    const renderPortal = (content) => {
        if (typeof document === 'undefined') return null;
        return createPortal(content, document.body);
    };

    // Google Drive settings state
    const driveForm = useForm({
        google_backup_enabled: store?.google_backup_enabled ?? false,
        google_backup_retention: store?.google_backup_retention ?? 7,
    });

    const formatBytes = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleGoogleRestore = (fileId, fileName) => {
        showConfirm({
            title: 'Restore from Google Drive?',
            text: `This will download "${fileName}" from Google Drive and completely replace all your current store data. This operation CANNOT be undone!`,
            icon: 'warning',
            onConfirm: () => {
                setActionInProgress(fileId);
                router.post(route('store.google.backup.restore', { store_slug: store?.slug, fileId: fileId }), {}, {
                    onSuccess: () => {
                        showAlert({
                            title: "Success",
                            message: "Store data restored directly from Google Drive backup successfully!",
                            type: "success"
                        });
                    },
                    onFinish: () => setActionInProgress(null)
                });
            }
        });
    };

    const handleGoogleDelete = (fileId, fileName) => {
        showConfirm({
            title: 'Delete from Google Drive?',
            text: `Are you sure you want to delete "${fileName}" from your Google Drive folder?`,
            icon: 'warning',
            onConfirm: () => {
                setActionInProgress(fileId);
                router.post(route('store.google.backup.delete', { store_slug: store?.slug, fileId: fileId }), {}, {
                    onFinish: () => setActionInProgress(null)
                });
            }
        });
    };

    const getEstimatedTotalStorage = () => {
        const avgSize = googleBackups.length > 0 
            ? googleBackups.reduce((acc, f) => acc + (parseInt(f.size) || 0), 0) / googleBackups.length 
            : 500000; // fallback to 500KB if empty
        return formatBytes(avgSize * driveForm.data.google_backup_retention);
    };

    const handleGoogleSettingsChange = (fields) => {
        const updatedData = {
            google_backup_enabled: driveForm.data.google_backup_enabled,
            google_backup_retention: driveForm.data.google_backup_retention,
            ...fields
        };

        // Update form state
        Object.entries(fields).forEach(([k, v]) => driveForm.setData(k, v));

        // Submit form
        router.post(route('store.google.settings', { store_slug: store?.slug }), updatedData, {
            preserveScroll: true
        });
    };

    const handleGoogleSyncNow = () => {
        setSyncingToDrive(true);
        router.post(route('store.google.sync-now', { store_slug: store?.slug }), {}, {
            preserveScroll: true,
            onFinish: () => setSyncingToDrive(false)
        });
    };

    // Import State
    const [importType, setImportType] = useState('products');
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        type: 'products'
    });

    const exportOptions = [
        { id: 'products', label: 'Products & Stock', description: 'Inventory, prices, levels', icon: Archive, color: 'text-blue-500' },
        { id: 'parties', label: 'Contacts', description: 'Customers & Suppliers', icon: FileText, color: 'text-emerald-500' },
        { id: 'sales', label: 'Sales History', description: 'Invoices & Transactions', icon: FileSpreadsheet, color: 'text-purple-500' },
        { id: 'purchases', label: 'Purchases', description: 'Orders & Bills', icon: Grid, color: 'text-orange-500' },
        { id: 'expenses', label: 'Expenses', description: 'Records & Categories', icon: FileText, color: 'text-rose-500' },
        { id: 'transactions', label: 'Ledger', description: 'All financial movements', icon: Database, color: 'text-indigo-500' },
    ];

    const toggleExport = (id) => {
        if (selectedExports.includes(id)) {
            setSelectedExports(prev => prev.filter(item => item !== id));
        } else {
            setSelectedExports(prev => [...prev, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedExports.length === exportOptions.length) {
            setSelectedExports([]);
        } else {
            setSelectedExports(exportOptions.map(o => o.id));
        }
    };

    const handleExport = (e) => {
        e.preventDefault();
        if (selectedExports.length === 0) return;

        if (selectedExports.length > 1) {
            alert('Bulk export coming soon. Please select one type at a time.');
            return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('store.admin.data.export', { store_slug: store?.slug });

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        const typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'type';
        typeInput.value = selectedExports[0];
        form.appendChild(typeInput);

        const formatInput = document.createElement('input');
        formatInput.type = 'hidden';
        formatInput.name = 'format';
        formatInput.value = exportFormat;
        form.appendChild(formatInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        post(route('store.admin.data.upload-mapping', { store_slug: store?.slug }), {
            onSuccess: () => {
                // Inertia handles redirection to the DataMapping component
            },
            onError: (err) => console.error(err)
        });
    };

    // Handle full system backup (.vq file upload/restore)
    const handleBackupUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showConfirm({
            title: "Confirm",
            message: "WARNING: Restoring a full system backup (.vq) will COMPLETELY OVERWRITE all products, transactions, stock, cash in hand, and configuration settings in this store. This cannot be undone. Are you sure you want to proceed?",
            type: "warning",
            confirmLabel: "Yes, Continue",
            cancelLabel: "Cancel",
            onConfirm: () => {
                setUploadingBackup(true);
                const formData = new FormData();
                formData.append('file', file);

                router.post(route('store.backup.import', { store_slug: store?.slug }), formData, {
                    forceFormData: true,
                    onSuccess: () => {
                        showAlert({
                            title: "Success",
                            message: "Store restored successfully!",
                            type: "success"
                        });
                    },
                    onFinish: () => setUploadingBackup(false)
                });
            }
        });
    };

    const downloadTemplate = () => {
        window.location.href = route('store.admin.data.template', { store_slug: store?.slug, type: importType, format: 'xlsx' });
    };

    // ── Backups tab (SQL snapshots — merged in from Backups.jsx / Settings) ──
    const [backupsList, setBackupsList] = useState(initialBackupsList);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [restoringBackup, setRestoringBackup] = useState(false);
    const [deletingBackup, setDeletingBackup] = useState(null);
    const [mailingBackup, setMailingBackup] = useState(null);
    const autoBackupForm = useForm({ auto_backup: !!autoBackupEnabled });

    const createBackupNow = () => {
        setCreatingBackup(true);
        router.post(route('store.backups.store', { store_slug: store?.slug }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                showAlert({ title: 'Success', message: 'Backup created successfully.', type: 'success' });
            },
            onFinish: () => setCreatingBackup(false)
        });
    };

    const deleteBackupFile = (filename) => {
        showConfirm({
            title: 'Delete this backup?',
            text: `"${filename}" will be permanently deleted. This cannot be undone.`,
            icon: 'warning',
            onConfirm: () => {
                setDeletingBackup(filename);
                router.delete(route('store.backups.delete', { store_slug: store?.slug, filename }), {
                    preserveScroll: true,
                    onFinish: () => setDeletingBackup(null)
                });
            }
        });
    };

    const emailBackupFile = (filename) => {
        setMailingBackup(filename);
        router.post(route('store.backups.email', { store_slug: store?.slug, filename }), {}, {
            preserveScroll: true,
            onFinish: () => setMailingBackup(null)
        });
    };

    const handleBackupRestoreFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showConfirm({
            title: 'Restore database from this file?',
            message: 'WARNING: All current data will be OVERWRITTEN by this backup. This cannot be undone. Are you sure you want to proceed?',
            type: 'warning',
            confirmLabel: 'Yes, Restore',
            cancelLabel: 'Cancel',
            onConfirm: () => {
                setRestoringBackup(true);
                const formData = new FormData();
                formData.append('backup_file', file);
                router.post(route('store.backups.restore', { store_slug: store?.slug }), formData, {
                    forceFormData: true,
                    onSuccess: () => {
                        showAlert({ title: 'Success', message: 'Database restored successfully! Reloading...', type: 'success' });
                        setTimeout(() => window.location.reload(), 1500);
                    },
                    onFinish: () => setRestoringBackup(false)
                });
            }
        });
        e.target.value = null;
    };

    const toggleAutoBackup = (enabled) => {
        autoBackupForm.setData('auto_backup', enabled);
        router.post(route('store.admin.settings.update', { store_slug: store?.slug }), { auto_backup: enabled ? '1' : '0' }, { preserveScroll: true });
    };

    // ── Migrate from Another System tab (merged in from Migration.jsx) ──────
    const [migrationFile, setMigrationFile] = useState(null);
    const [migrationStep, setMigrationStep] = useState('upload'); // upload, analyzing, review, importing, results
    const [migrationAnalysis, setMigrationAnalysis] = useState(null);
    const [migrationError, setMigrationError] = useState(null);
    const [migrationLog, setMigrationLog] = useState([]);

    const handleMigrationFileChange = (e) => {
        if (e.target.files[0]) {
            setMigrationFile(e.target.files[0]);
            setMigrationError(null);
        }
    };

    const handleMigrationAnalyze = () => {
        if (!migrationFile) return;
        setMigrationStep('analyzing');
        const formData = new FormData();
        formData.append('file', migrationFile);

        axios.post(route('store.legacy.admin.migration.analyze', { store_slug: store?.slug }), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(res => {
                if (res.data.success) {
                    setMigrationAnalysis(res.data);
                    setMigrationStep('review');
                } else {
                    setMigrationError(res.data.message);
                    setMigrationStep('upload');
                }
            })
            .catch(err => {
                setMigrationError(err.response?.data?.message || 'Failed to analyze file.');
                setMigrationStep('upload');
            });
    };

    const handleMigrationExecute = () => {
        if (!migrationAnalysis) return;
        setMigrationStep('importing');

        axios.post(route('store.legacy.admin.migration.execute', { store_slug: store?.slug }), {
            path: migrationAnalysis.path,
        })
            .then(res => {
                if (res.data.success) {
                    setMigrationLog(res.data.log);
                    setMigrationStep('results');
                } else {
                    setMigrationError(res.data.message);
                    setMigrationStep('review');
                }
            })
            .catch(err => {
                setMigrationError(err.response?.data?.message || 'Import failed.');
                setMigrationStep('review');
            });
    };

    return (
        <OneGlanceLayout title="System Data Center" activeMenu="Data Management" mode="admin">
            <Head title="Data Management" />

            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Database className="text-indigo-500" />
                            Data Operations
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Securely import, export, and manage system records</p>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        {[
                            { id: 'backups', label: 'Backups', icon: HardDrive },
                            { id: 'drive_sync', label: 'Cloud Sync', icon: Cloud },
                            { id: 'export', label: 'Export Data', icon: Download },
                            { id: 'import', label: 'Import Data', icon: Upload },
                            { id: 'backup', label: 'Full System', icon: ShieldCheck },
                            { id: 'migrate', label: 'Migrate', icon: RefreshCw }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                id={tab.id === 'import' ? 'tour-import-tab' : undefined}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'drive_sync' && (
                        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">
                            {/* Main Connection Status Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Cloud size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                                Google Drive Automated Backups
                                                {store.google_connected && (
                                                    <span className="px-2 py-0.5 rounded-full text-2xs font-black tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 animate-pulse">
                                                        CONNECTED & ACTIVE
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Link your Google account to automatically sync your encrypted store database every night. VenQore limits its access to only write files inside its own folder, keeping your personal Drive items 100% private.
                                            </p>
                                        </div>
                                    </div>

                                    {store.google_connected && (
                                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                <span className="font-medium text-slate-400">Connected Account:</span>
                                                <span className="font-bold">{store.google_backup_email}</span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={driveForm.data.google_backup_enabled}
                                                        onChange={(e) => handleGoogleSettingsChange({ google_backup_enabled: e.target.checked })}
                                                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">Daily Auto-Backup</span>
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-400">Keep last:</span>
                                                    <select
                                                        value={driveForm.data.google_backup_retention}
                                                        onChange={(e) => handleGoogleSettingsChange({ google_backup_retention: parseInt(e.target.value) })}
                                                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value={7}>7 backups</option>
                                                        <option value={14}>14 backups</option>
                                                        <option value={30}>30 backups</option>
                                                    </select>
                                                    <span className="text-slate-400 dark:text-slate-500 text-1xs ml-1">
                                                        (Est. total size: ~{getEstimatedTotalStorage()})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 gap-3 w-full md:w-auto">
                                    {store.google_connected ? (
                                        <>
                                            <button
                                                onClick={handleGoogleSyncNow}
                                                disabled={syncingToDrive}
                                                className="flex-1 md:flex-none px-5 py-3 border-2 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                {syncingToDrive ? (
                                                    <RefreshCw className="animate-spin" size={14} />
                                                ) : (
                                                    <RefreshCw size={14} />
                                                )}
                                                {syncingToDrive ? "Uploading..." : "Sync Now"}
                                            </button>
                                            <form action={route('store.google.disconnect', { store_slug: store?.slug })} method="POST" className="flex-1 md:flex-none">
                                                <input type="hidden" name="_token" value={csrfToken} />
                                                <button
                                                    type="submit"
                                                    className="w-full px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <Unlink size={14} /> Disconnect
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <a
                                            href={route('store.google.redirect', { store_slug: store?.slug })}
                                            className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                                        >
                                            <Link2 size={16} /> Link Google Drive
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Backups History List */}
                            {store.google_connected && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex-1 flex flex-col min-h-[400px]">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800/60 font-bold">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                                <Database className="text-indigo-500" size={20} />
                                                Google Drive Backup Vault
                                            </h3>
                                            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                                                Manage and restore historical database checkpoints stored directly on your cloud drive.
                                            </p>
                                        </div>
                                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {googleBackups.length} of {driveForm.data.google_backup_retention} backup slots used
                                        </div>
                                    </div>

                                    {googleBackups.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 mb-4 animate-bounce">
                                                <Cloud size={28} />
                                            </div>
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300">No backups found on Google Drive</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                                                Click "Sync Now" above to upload your first database backup checkpoint directly into your VenQore folder.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                        <th className="pb-3 pl-2">Filename</th>
                                                        <th className="pb-3">Created At</th>
                                                        <th className="pb-3">File Size</th>
                                                        <th className="pb-3 text-right pr-2">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                                                    {googleBackups.map((file) => (
                                                        <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                                                            <td className="py-4 pl-2 font-bold text-slate-700 dark:text-slate-200 max-w-[400px] truncate">
                                                                <span className="flex items-center gap-2">
                                                                    <Cloud className="text-blue-500 shrink-0" size={16} />
                                                                    {file.name}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-slate-500 dark:text-slate-400">
                                                                {new Date(file.createdTime).toLocaleString()}
                                                            </td>
                                                            <td className="py-4 text-slate-500 dark:text-slate-400">
                                                                {formatBytes(file.size)}
                                                            </td>
                                                            <td className="py-4 text-right pr-2">
                                                                <div className="flex justify-end items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleGoogleRestore(file.id, file.name)}
                                                                        disabled={actionInProgress !== null}
                                                                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg font-bold text-xs transition-colors"
                                                                    >
                                                                        {actionInProgress === file.id ? 'Restoring...' : 'Restore'}
                                                                    </button>
                                                                    <a
                                                                        href={route('store.google.backup.download', { store_slug: store?.slug, fileId: file.id })}
                                                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-lg font-bold text-xs transition-colors"
                                                                    >
                                                                        Download
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleGoogleDelete(file.id, file.name)}
                                                                        disabled={actionInProgress !== null}
                                                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white rounded-lg font-bold text-xs transition-colors"
                                                                    >
                                                                        {actionInProgress === file.id ? 'Deleting...' : 'Delete'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                            {/* Left: Selection Grid */}
                            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col h-full shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">1</div>
                                            Select Data Entities
                                        </h3>
                                        <button onClick={handleSelectAll} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {selectedExports.length === exportOptions.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2">
                                        {exportOptions.map((option) => {
                                            const isSelected = selectedExports.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleExport(option.id)}
                                                    className={`relative p-5 rounded-2xl border-2 text-left transition-all group ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-slate-50/50 dark:bg-slate-800/20'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 ' + option.color} shadow-sm transition-colors`}>
                                                            <option.icon size={20} />
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                            {isSelected && <Check size={12} strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                    <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{option.label}</p>
                                                    <p className={`text-xs ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300/80' : 'text-slate-400'}`}>{option.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">2</div>
                                        Format & Export
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Export Format</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['xlsx', 'csv', 'pdf'].map(fmt => (
                                                    <button
                                                        key={fmt}
                                                        onClick={() => setExportFormat(fmt)}
                                                        className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase transition-all flex flex-col items-center gap-1
                                                            ${exportFormat === fmt
                                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700'}
                                                        `}
                                                    >
                                                        <FileType size={16} />
                                                        {fmt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="py-4"></div>

                                        <button
                                            onClick={handleExport}
                                            disabled={selectedExports.length === 0}
                                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                                        >
                                            {selectedExports.length === 0 ? 'Select Data First' : (
                                                <>
                                                    Export Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                                            {selectedExports.length > 0 ? `${selectedExports.length} modules selected` : 'No modules selected'}
                                        </p>
                                    </div>
                                </div>

                                <MidnightNebula className="rounded-3xl p-6" primaryColor="indigo" secondaryColor="purple">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <ShieldCheck className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Secure Export</h4>
                                            <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                                                Exported files contain sensitive business data. Please ensure they are stored securely.
                                                <br /><br />
                                                <strong>Pro Tip:</strong> Use XLSX for re-importing data.
                                            </p>
                                        </div>
                                    </div>
                                </MidnightNebula>
                            </div>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                            {/* Left: Upload Area */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                <form onSubmit={handleImportSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col gap-6 flex-1 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs font-bold">1</div>
                                        Upload Data File
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Target Module</label>
                                            <div id="tour-import-type">
                                                <PremiumSelect
                                                    options={exportOptions.map(opt => ({ id: opt.id, name: opt.label }))}
                                                    value={data.type}
                                                    onChange={(val) => { setData('type', val); setImportType(val); }}
                                                    searchable={false}
                                                    className="w-full text-lg"
                                                />
                                            </div>
                                        </div>

                                        <div id="tour-import-upload-zone" className="relative group cursor-pointer">
                                            <input
                                                type="file"
                                                onChange={e => setData('file', e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                accept=".csv, .xlsx, .xls"
                                            />
                                            <div className="w-full h-64 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-4 group-hover:border-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 transition-all">
                                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-indigo-500">
                                                    <Upload size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-700 dark:text-white text-lg">
                                                        {data.file ? data.file.name : 'Drag & Drop or Click to Upload'}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-1">Supports XLSX, CSV (Max 10MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {data.file && (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3 animate-in slide-in-from-top-2">
                                            <CheckCircle className="text-emerald-500" size={24} />
                                            <div>
                                                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">File Ready for Processing</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">The system will update existing records matching unique IDs.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto">
                                        <button
                                            id="tour-import-submit"
                                            type="submit"
                                            disabled={!data.file || processing}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={20} /> Start Import Process</>}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Right: Instructions */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">2</div>
                                        Use Correct Format
                                    </h3>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                        Data integrity is critical. Start by downloading the official template for the <strong>{exportOptions.find(o => o.id === importType)?.label}</strong> module.
                                    </p>

                                    <button
                                        id="tour-import-download-template"
                                        onClick={downloadTemplate}
                                        className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-all mb-6"
                                    >
                                        <FileSpreadsheet size={18} /> Download Excel Template
                                    </button>

                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Checklist</h4>
                                    <ul className="space-y-3">
                                        {['Do not rename column headers', 'Use unique IDs for updates', 'Dates format: YYYY-MM-DD', 'Max 5000 rows per file'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <CheckSquare size={16} className="text-emerald-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in duration-300">
                            {/* Left: Backup Actions */}
                            <div className="lg:col-span-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col gap-6 shadow-sm min-h-[360px] justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                            <Download className="text-indigo-500" />
                                            Full System Backup
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                                            Generates a single encrypted **`.vq`** file holding **100% of your store data**.
                                            <br /><br />
                                            This includes your complete transaction history, sales records, purchase orders, products list, variations, brand configurations, contacts list, cash in hand records, bank accounts, and chatbot settings.
                                            <span className="text-indigo-500 dark:text-indigo-400 font-bold block mt-3">Absolutely nothing—not even a single dot—is left behind.</span>
                                        </p>
                                    </div>

                                    <div>
                                        <a
                                            href={route('store.backup.export', { store_slug: store?.slug })}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
                                        >
                                            <Download size={18} /> Download Encrypted Backup (.vq)
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Restore Actions */}
                            <div className="lg:col-span-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col gap-6 shadow-sm min-h-[360px] justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                            <Upload className="text-purple-500" />
                                            Full System Restore
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-4">
                                            Upload a previously downloaded **`.vq`** backup file to restore your entire database state exactly to the point where you left off.
                                            <br /><br />
                                            <span className="text-red-500 font-black block p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                                🚨 WARNING: Restoring a backup will completely replace all your current store data. Any changes made since the backup was taken will be lost. This operation cannot be undone.
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-base shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none text-center">
                                            <Upload size={18} /> {uploadingBackup ? 'Restoring System...' : 'Upload & Restore (.vq)'}
                                            <input
                                                type="file"
                                                accept=".vq"
                                                className="hidden"
                                                onChange={handleBackupUpload}
                                                disabled={uploadingBackup}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <HardDrive className="text-indigo-500" size={20} /> Daily Auto-Backup
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Back up the database to local storage every night</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleAutoBackup(!autoBackupForm.data.auto_backup)}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${autoBackupForm.data.auto_backup ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoBackupForm.data.auto_backup ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <button
                                    onClick={createBackupNow}
                                    disabled={creatingBackup}
                                    className="bg-slate-900 rounded-3xl p-6 flex items-center justify-center gap-2 text-white font-bold shadow-xl hover:scale-[1.01] transition-transform active:scale-95 disabled:opacity-60"
                                >
                                    {creatingBackup ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {creatingBackup ? 'Creating Snapshot...' : 'Create Snapshot Now'}
                                </button>
                                <label className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-3xl p-6 flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-300 transition-all text-center">
                                    <input type="file" className="hidden" accept=".sql" onChange={handleBackupRestoreFile} disabled={restoringBackup} />
                                    {restoringBackup ? <RefreshCw size={18} className="animate-spin text-indigo-500" /> : <Upload size={18} className="text-indigo-500" />}
                                    {restoringBackup ? 'Restoring...' : 'Restore from .sql File'}
                                </label>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Database className="text-slate-400" size={20} /> Snapshot History
                                    </h3>
                                    <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-2xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        {backupsList.length} Files Found
                                    </span>
                                </div>
                                <div className="overflow-auto flex-1">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-8 py-4 text-2xs font-black uppercase tracking-widest text-slate-400">Snapshot</th>
                                                <th className="px-8 py-4 text-2xs font-black uppercase tracking-widest text-slate-400">Created</th>
                                                <th className="px-8 py-4 text-2xs font-black uppercase tracking-widest text-slate-400">Size</th>
                                                <th className="px-8 py-4 text-2xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {backupsList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-16 text-center">
                                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                                            <HardDrive size={40} className="mb-3 opacity-20" />
                                                            <p className="font-bold text-slate-600 dark:text-slate-400">No snapshots yet</p>
                                                            <p className="text-xs">Create your first database backup to protect your data.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : backupsList.map((backup) => (
                                                <tr key={backup.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                                <FileText size={18} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs">{backup.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-sm text-slate-500 dark:text-slate-400">{backup.date}</td>
                                                    <td className="px-8 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">{backup.size}</span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a href={route('store.backups.download', { store_slug: store?.slug, filename: backup.name })} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all" title="Download">
                                                                <Download size={16} />
                                                            </a>
                                                            <button onClick={() => emailBackupFile(backup.name)} disabled={mailingBackup === backup.name} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all disabled:opacity-50" title="Email">
                                                                {mailingBackup === backup.name ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
                                                            </button>
                                                            <button onClick={() => deleteBackupFile(backup.name)} disabled={deletingBackup === backup.name} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all disabled:opacity-50" title="Delete">
                                                                {deletingBackup === backup.name ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'migrate' && (
                        <div className="h-full flex flex-col items-center overflow-y-auto py-4 animate-in fade-in duration-300">
                            <div className="w-full max-w-3xl">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl mb-4">
                                        <Database size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Migrate from Another System</h2>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm">
                                        Seamlessly import your data from Vyapar backups (.vyp). We'll analyze your file and map Customers, Items, and Stock automatically.
                                    </p>
                                </div>

                                <div className="flex items-center justify-center mb-10">
                                    <div className={`flex flex-col items-center z-10 ${migrationStep === 'upload' ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${migrationStep === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                                        <span className="text-xs font-bold uppercase">Upload</span>
                                    </div>
                                    <div className="w-16 h-0.5 bg-slate-200 mx-2"></div>
                                    <div className={`flex flex-col items-center z-10 ${['analyzing', 'review', 'importing', 'results'].includes(migrationStep) ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${['review', 'importing', 'results'].includes(migrationStep) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                                        <span className="text-xs font-bold uppercase">Review</span>
                                    </div>
                                    <div className="w-16 h-0.5 bg-slate-200 mx-2"></div>
                                    <div className={`flex flex-col items-center z-10 ${migrationStep === 'results' ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${migrationStep === 'results' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                                        <span className="text-xs font-bold uppercase">Done</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[380px] relative">
                                    {migrationError && (
                                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center z-10">
                                            <AlertTriangle size={18} className="mr-2" /> {migrationError}
                                        </div>
                                    )}

                                    {migrationStep === 'upload' && (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                            <div className="w-full max-w-md p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50">
                                                <Upload size={40} className="mx-auto text-slate-400 mb-4" />
                                                <h3 className="font-bold text-lg mb-2">Drop your .vyp file here</h3>
                                                <p className="text-xs text-slate-500 mb-6">Found in AppData/Roaming/Vyaparapp/DBUpdateBackup</p>
                                                <input
                                                    type="file"
                                                    accept=".vyp,.db,.sqlite"
                                                    onChange={handleMigrationFileChange}
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4"
                                                />
                                                {migrationFile && (
                                                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-mono text-sm inline-block">
                                                        {migrationFile.name} ({(migrationFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                disabled={!migrationFile}
                                                onClick={handleMigrationAnalyze}
                                                className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                                            >
                                                Analyze File <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    )}

                                    {migrationStep === 'analyzing' && (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                                            <h3 className="font-bold text-lg">Scanning Database...</h3>
                                            <p className="text-slate-500 text-sm">Identifying Parties, Items, and transaction history.</p>
                                        </div>
                                    )}

                                    {migrationStep === 'review' && migrationAnalysis && (
                                        <div className="p-8 h-full flex flex-col">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                                    <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 mb-1">Parties</h3>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{migrationAnalysis.analysis.potential_parties}</p>
                                                </div>
                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                                    <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">Items</h3>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{migrationAnalysis.analysis.potential_items}</p>
                                                </div>
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                                                    <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-1">Sales</h3>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{migrationAnalysis.analysis.potential_sales}</p>
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800">
                                                    <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400 mb-1">Purchases</h3>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{migrationAnalysis.analysis.potential_purchases}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-8 flex-1 overflow-y-auto">
                                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Raw Table Data Detected</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {Object.entries(migrationAnalysis.tables).map(([name, count]) => (
                                                        <div key={name} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-700 rounded border border-slate-100 dark:border-slate-600">
                                                            <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[120px]" title={name}>{name}</span>
                                                            <span className="font-bold bg-slate-100 dark:bg-slate-600 px-1.5 rounded">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-center mt-auto">
                                                <button onClick={handleMigrationExecute} className="w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                                                    <RefreshCw size={20} /> Start Migration Process
                                                </button>
                                                <p className="text-xs text-slate-400 mt-3">This action will merge data into your existing system. No existing data will be overwritten.</p>
                                            </div>
                                        </div>
                                    )}

                                    {migrationStep === 'importing' && (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                            <div className="mb-6 relative">
                                                <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                                                <RefreshCw size={56} className="animate-spin text-indigo-600 relative z-10" />
                                            </div>
                                            <h3 className="font-bold text-2xl mb-2">Importing Data...</h3>
                                            <p className="text-slate-500 max-w-sm text-sm">Please wait while we transfer your accounts and inventory. Do not close this window.</p>
                                        </div>
                                    )}

                                    {migrationStep === 'results' && (
                                        <div className="p-12 h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                                <Check size={32} strokeWidth={4} />
                                            </div>
                                            <h3 className="font-bold text-2xl mb-4 text-slate-900 dark:text-white">Migration Successful!</h3>
                                            <p className="text-slate-500 mb-8 max-w-md text-sm">Your external data has been successfully imported. You can now view your new customers and products in the system.</p>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-40 overflow-y-auto">
                                                {migrationLog.map((log, i) => (
                                                    <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center gap-2">
                                                        <Check size={12} className="text-green-500" /> {log}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => router.visit(route('store.parties.index', { store_slug: store?.slug }))} className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors">View Parties</button>
                                                <button onClick={() => router.visit(route('store.inventory.index', { store_slug: store?.slug }))} className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-colors">View Products</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Google Drive Onboarding Step Modal */}
            {store?.onboarding_step === 'drive_sync_tour' && renderPortal(
                <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"></div>

                    <div className="relative w-full max-w-lg mx-auto my-6 px-4 z-[151] animate-in zoom-in-95 duration-300">
                        <div className="relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden">
                            <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="p-8 flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 shadow-inner">
                                    <Cloud size={32} className="animate-pulse" />
                                </div>

                                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">
                                    Secure Your Store Data! ☁️
                                </h2>

                                <p className="text-slate-400 text-sm font-semibold mb-4">
                                    Final Step: Enable Automated Daily Backups
                                </p>

                                <p className="text-slate-300 text-xs leading-relaxed max-w-sm mb-8">
                                    Amazing job setting up your catalog, purchases, sales, and expenses!
                                    <br /><br />
                                    Now, connect your Google Drive to enable automated nightly backups. This guarantees you never lose your database, keeping your data safe and private inside its own folder.
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <a
                                        href={route('store.google.redirect', { store_slug: store?.slug })}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm"
                                    >
                                        <Link2 size={16} /> Connect Google Drive
                                    </a>
                                    <button
                                        onClick={() => {
                                            router.post(route('store.onboarding.step', { store_slug: store?.slug }), { step: 'completed' }, {
                                                onSuccess: () => router.visit(route('store.dashboard', { store_slug: store?.slug }))
                                            });
                                        }}
                                        className="w-full py-3 px-5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl transition-all text-xs border border-slate-700/50 cursor-pointer"
                                    >
                                        Maybe Later / Skip
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}

// Helper for check circle icon
function CheckCircle({ className, size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
