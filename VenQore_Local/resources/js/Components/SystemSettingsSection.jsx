import React, { useRef, useState } from 'react';
import { ToggleLeft, Shield, Bell, Database, Wifi, Lock, Download, HardDrive } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function SystemSettingsSection({ data, setData, activeSubSection = 'system' }) {
    const fileInputRef = useRef(null);
    const [restoring, setRestoring] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadBackup = async () => {
        setDownloading(true);
        let timerInterval;

        // Show Simulated Progress Bar
        Swal.fire({
            title: 'Creating Backup...',
            html: `
                <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                    <span id="swal-backup-text">Initializing backup process...</span>
                    <span id="swal-backup-percent">0%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                    <div id="swal-backup-bar" class="bg-sky-500 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
                        <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <p class="text-xs text-slate-500 mt-2">Dumping database, compressing files...</p>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff',
            didOpen: () => {
                const b = Swal.getHtmlContainer().querySelector('#swal-backup-bar');
                const t = Swal.getHtmlContainer().querySelector('#swal-backup-text');
                const p = Swal.getHtmlContainer().querySelector('#swal-backup-percent');

                let progress = 0;

                timerInterval = setInterval(() => {
                    if (progress < 40) {
                        progress += 2;
                        t.textContent = 'Dumping database tables...';
                    } else if (progress < 70) {
                        progress += 1;
                        t.textContent = 'Compressing SQL file...';
                    } else if (progress < 90) {
                        progress += 0.5;
                        t.textContent = 'Finalizing validation...';
                    }

                    if (progress > 95) progress = 95;

                    if (b) b.style.width = progress + '%';
                    if (p) p.textContent = Math.round(progress) + '%';
                }, 100);
            }
        });

        try {
            const response = await axios.post('/admin-panel/backups', {}, {
                headers: { 'Accept': 'application/json' },
                timeout: 300000
            });

            clearInterval(timerInterval);

            if (response.data.success) {
                Swal.fire({
                    title: 'Backup Ready!',
                    text: 'Download starting now...',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#fff'
                });

                // Trigger download
                window.location.href = `/admin-panel/backups/${response.data.filename}`;
            }
        } catch (error) {
            clearInterval(timerInterval);
            console.error(error);
            Swal.fire({
                title: 'Backup Failed',
                text: error.response?.data?.message || 'Could not create backup.',
                icon: 'error',
                background: '#1e293b',
                color: '#fff'
            });
        } finally {
            setDownloading(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current.click();
    };

    const handleRestoreFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        const isSql = extension === 'sql';
        const isVyapar = ['vyb', 'vyp'].includes(extension);
        const isExcel = ['xlsx', 'xls', 'csv'].includes(extension);

        if (!isSql && !isVyapar && !isExcel) {
            Swal.fire({ title: 'Unsupported File', text: 'Accepted formats: .sql, .vyb, .vyp, .xlsx, .xls, .csv', icon: 'error', background: '#1e293b', color: '#fff' });
            e.target.value = null;
            return;
        }

        // Build confirmation dialog based on file type
        let title, text, confirmText;
        if (isSql) {
            title = 'Restore Full Database?';
            text = 'This will OVERWRITE all current data with the backup file. This cannot be undone. Proceed?';
            confirmText = 'Yes, Restore Everything';
        } else if (isVyapar) {
            title = 'Import Vyapar Backup?';
            text = 'This will import all items, parties, transactions, and bank accounts from your Vyapar backup into VENQORE.';
            confirmText = 'Yes, Import Vyapar Data';
        } else {
            title = 'Import Data from File?';
            text = 'This will import products and parties from the spreadsheet. Existing records with the same name will be updated.';
            confirmText = 'Yes, Import Data';
        }

        const result = await Swal.fire({
            title, text,
            icon: isSql ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: isSql ? '#dc2626' : '#3085d6',
            cancelButtonColor: '#64748b',
            confirmButtonText: confirmText,
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) {
            e.target.value = null;
            return;
        }

        const formData = new FormData();

        // Route: SQL -> /restore (backup_file), Everything else -> /import-data (import_file)
        let url;
        if (isSql) {
            formData.append('backup_file', file);
            url = '/admin-panel/backups/restore';
        } else {
            formData.append('import_file', file);
            url = '/admin-panel/backups/import-data';
        }

        setRestoring(true);

        // Show Progress Bar immediately
        let progressInterval;

        // Use a more robust check for Swal instance
        if (Swal.isVisible()) {
            Swal.close();
        }

        // Slight delay to allow DOM to clear if Swal was open, but minimal
        await new Promise(r => setTimeout(r, 100));

        Swal.fire({
            title: isVyapar ? 'Importing Vyapar Data...' : 'Processing File...',
            html: `
                 <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                     <span id="swal-progress-text">Starting upload...</span>
                     <span id="swal-progress-percent">0%</span>
                 </div>
                 <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                     <div id="swal-progress-bar" class="bg-indigo-500 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
                         <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                     </div>
                 </div>
                 <p class="text-xs text-slate-500 mt-2">Large backups may take several minutes. Please do not close this window.</p>
             `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#1e293b',
            color: '#fff',
            didOpen: () => {
                const b = Swal.getHtmlContainer()?.querySelector('#swal-progress-bar');
                const t = Swal.getHtmlContainer()?.querySelector('#swal-progress-text');
                const p = Swal.getHtmlContainer()?.querySelector('#swal-progress-percent');

                // Start Polling immediately for server-side progress
                progressInterval = setInterval(async () => {
                    try {
                        const res = await axios.get('/admin-panel/backups/progress');
                        const { percent, message } = res.data;

                        // Only update if server reports meaningful progress
                        if (percent > 0) {
                            if (b) b.style.width = percent + '%';
                            if (p) p.textContent = Math.round(percent) + '%';
                            if (t) t.textContent = message;
                        }
                    } catch (e) {
                        // ignore poll errors
                    }
                }, 1000);
            },
            willClose: () => {
                if (progressInterval) clearInterval(progressInterval);
            }
        });

        try {
            const response = await axios.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0, // No timeout
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const visualPercent = Math.round(percentCompleted * 0.3);

                    const b = Swal.getHtmlContainer()?.querySelector('#swal-progress-bar');
                    const t = Swal.getHtmlContainer()?.querySelector('#swal-progress-text');
                    const p = Swal.getHtmlContainer()?.querySelector('#swal-progress-percent');

                    if (t && !t.textContent.includes('Initializing') && !t.textContent.includes('Importing')) {
                        if (b) b.style.width = visualPercent + '%';
                        if (p) p.textContent = visualPercent + '%';
                        t.textContent = `Uploading... ${percentCompleted}%`;
                    }
                }
            });

            Swal.fire({
                title: 'Success!',
                text: response.data.message || 'Operation completed successfully.',
                icon: 'success',
                background: '#1e293b',
                color: '#fff'
            }).then(() => {
                window.location.reload();
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Operation Failed',
                text: error.response?.data?.message || 'Something went wrong. Please check your file and try again.',
                icon: 'error',
                background: '#1e293b',
                color: '#fff'
            });
        } finally {
            setRestoring(false);
            if (e.target) e.target.value = null;
        }
    };

    const renderContent = () => {
        switch (activeSubSection) {
            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-500 rounded-xl text-white">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-indigo-900 dark:text-white">Notification Center</h3>
                                    <p className="text-indigo-600 dark:text-indigo-300">Control what alerts you receive.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle enabled={data.low_stock_alerts} onChange={v => setData('low_stock_alerts', v)} label="Low Stock Alerts" description="Notify when items fall below threshold" />
                                <Toggle enabled={data.email_notifications} onChange={v => setData('email_notifications', v)} label="Email Summaries" description="Daily sales digest via email" />
                                <Toggle enabled={data.daily_sales_summary} onChange={v => setData('daily_sales_summary', v)} label="Daily Sales Report" description="End of day push notification" />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-500 rounded-xl text-white">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Security & Access</h3>
                                    <p className="text-slate-500">Protect your account and data.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle enabled={data.two_factor_auth} onChange={v => setData('two_factor_auth', v)} label="Two-Factor Authentication" description="Require code verification on login" />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Auto-Logout Timer (Minutes)</label>
                                    <input
                                        type="number"
                                        value={data.auto_logout}
                                        onChange={e => setData('auto_logout', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'backup':
                return (
                    <div className="space-y-6">
                        <div className="p-8 bg-sky-50 dark:bg-sky-900/10 rounded-[2rem] border border-sky-100 dark:border-sky-500/20">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-sky-500 rounded-xl text-white">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-sky-900 dark:text-white">Data & Backup</h3>
                                    <p className="text-sky-600 dark:text-sky-300">Prevent data loss.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Toggle enabled={data.auto_backup} onChange={v => setData('auto_backup', v)} label="Automatic Daily Backups" description="Backup database to local storage every night" />

                                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={handleDownloadBackup}
                                        disabled={downloading}
                                        className={`flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${downloading ? 'bg-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20'}`}
                                    >
                                        <Download size={18} /> {downloading ? 'Creating Backup...' : 'Download Backup'}
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleRestoreFile}
                                        accept=".sql,.vyb,.vyp,.xlsx,.xls,.csv"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRestoreClick}
                                        disabled={restoring}
                                        className={`flex-1 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${restoring ? 'bg-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                                    >
                                        <HardDrive size={18} /> {restoring ? 'Processing...' : 'Restore / Import File'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                );

            case 'integrations':
                return (
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                            <Toggle
                                enabled={data.fbr_integration}
                                onChange={v => setData('fbr_integration', v)}
                                label="FBR POS Integration"
                                description="Real-time sales reporting to FBR"
                            />
                            {data.fbr_integration && (
                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">FBR POS ID</label>
                                            <input
                                                type="text"
                                                value={data.fbr_pos_id}
                                                onChange={e => setData('fbr_pos_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">FBR USIN</label>
                                            <input
                                                type="text"
                                                value={data.fbr_usin}
                                                onChange={e => setData('fbr_usin', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* WooCommerce */}
                            <div className={`p-8 bg-white dark:bg-slate-800 border-2 rounded-[2.5rem] transition-all duration-300 ${data.woocommerce_enabled ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'border-transparent shadow-lg'}`}>
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl flex-shrink-0">
                                        <Wifi size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-lg font-black text-slate-900 dark:text-white leading-tight">WooCommerce</h5>
                                        <p className="text-xs text-slate-500 font-medium">Sync online orders</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('woocommerce_enabled', !data.woocommerce_enabled)}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-200 ${data.woocommerce_enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${data.woocommerce_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {data.woocommerce_enabled && (
                                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Store URL</label>
                                            <input
                                                type="text"
                                                value={data.woocommerce_url}
                                                onChange={e => setData('woocommerce_url', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                placeholder="https://yourstore.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Consumer Key</label>
                                            <input
                                                type="text"
                                                value={data.woocommerce_consumer_key}
                                                onChange={e => setData('woocommerce_consumer_key', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                                placeholder="ck_..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Consumer Secret</label>
                                            <input
                                                type="password"
                                                value={data.woocommerce_consumer_secret}
                                                onChange={e => setData('woocommerce_consumer_secret', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                                placeholder="cs_..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stripe (Upcoming) */}
                            <div className="p-8 bg-white dark:bg-slate-800 border-2 rounded-[2.5rem] opacity-60">
                                <div className="flex items-center gap-5 mb-2">
                                    <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center text-white shadow-xl flex-shrink-0">
                                        <Wifi size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Stripe</h5>
                                            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30">Upcoming</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">Process card payments</p>
                                    </div>
                                    <button disabled type="button" className="relative w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-700 cursor-not-allowed">
                                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'system':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Localization</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Language</label>
                                        <select
                                            value={data.language}
                                            onChange={e => setData('language', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="es" disabled>Spanish (Coming Soon)</option>
                                            <option value="fr" disabled>French (Coming Soon)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Date Format</label>
                                        <select
                                            value={data.date_format}
                                            onChange={e => setData('date_format', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Appearance</h4>
                                <Toggle enabled={data.dark_mode_default} onChange={v => setData('dark_mode_default', v)} label="Force Dark Mode" description="Use dark theme by default" />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderContent()}
        </div>
    );
}
