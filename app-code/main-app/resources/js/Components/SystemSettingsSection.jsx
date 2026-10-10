import React, { useRef, useState } from 'react';
import { ToggleLeft, Shield, Bell, Database, Wifi, Lock, Download, HardDrive } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import axios from 'axios';
import Swal from 'sweetalert2';
import { usePage } from '@inertiajs/react';

import { vq } from '@/theme/runtime';
export default function SystemSettingsSection({ data, setData, activeSubSection = 'system' }) {
    const { woocommerce_enabled, store } = usePage().props;
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
                <div class="mb-2 flex justify-between text-sm font-medium text-neutral-300">
                    <span id="swal-backup-text">Initializing backup process...</span>
                    <span id="swal-backup-percent">0%</span>
                </div>
                <div class="w-full bg-neutral-700 rounded-full h-3 mb-4 overflow-hidden border border-neutral-600">
                    <div id="swal-backup-bar" class="bg-sky-500 h-3 rounded-full transition-all duration-slow relative" style="width: 0%">
                        <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <p class="text-xs text-ink-muted mt-2">Dumping database, compressing files...</p>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: vq.slate[800],
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
                    background: vq.slate[800],
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
                background: vq.slate[800],
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
            Swal.fire({ title: 'Unsupported File', text: 'Accepted formats: .sql, .vyb, .vyp, .xlsx, .xls, .csv', icon: 'error', background: vq.slate[800], color: '#fff' });
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
            confirmButtonColor: isSql ? vq.red[600] : '#3085d6',
            cancelButtonColor: vq.slate[500],
            confirmButtonText: confirmText,
            background: vq.slate[800],
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
                 <div class="mb-2 flex justify-between text-sm font-medium text-neutral-300">
                     <span id="swal-progress-text">Starting upload...</span>
                     <span id="swal-progress-percent">0%</span>
                 </div>
                 <div class="w-full bg-neutral-700 rounded-full h-3 mb-4 overflow-hidden border border-neutral-600">
                     <div id="swal-progress-bar" class="bg-brand-500 h-3 rounded-full transition-all duration-slow relative" style="width: 0%">
                         <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                     </div>
                 </div>
                 <p class="text-xs text-ink-muted mt-2">Large backups may take several minutes. Please do not close this window.</p>
             `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: vq.slate[800],
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
                background: vq.slate[800],
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
                background: vq.slate[800],
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
                        <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs">
                            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-ink leading-tight">Notification Center</h3>
                                    <p className="text-xs text-ink-muted">Control in-app alerts and scheduled email reports</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Toggle enabled={data.low_stock_alerts} onChange={v => setData('low_stock_alerts', v)} label="Low Stock Alerts" description="Notify when items fall below threshold" />
                                <Toggle enabled={data.email_notifications} onChange={v => setData('email_notifications', v)} label="Email Summaries" description="Periodic digest & report summaries via email" />
                                <Toggle enabled={data.daily_sales_summary} onChange={v => setData('daily_sales_summary', v)} label="Daily Sales Report" description="End of day sales summary via email" />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs">
                            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-ink leading-tight">Security & Access</h3>
                                    <p className="text-xs text-ink-muted">Protect account sessions, 2FA credentials and staff permissions</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-app rounded-xl border border-line flex flex-wrap items-center justify-between gap-y-2 col-span-1 md:col-span-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-ink">Two-Factor Authentication (2FA)</h4>
                                        <p className="text-xs text-ink-muted">Set up Authenticator App (TOTP) verification for account logins.</p>
                                    </div>
                                    <a
                                        href="/profile#security"
                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
                                    >
                                        <span>Manage in Profile</span>
                                    </a>
                                </div>
                                <div className="p-4 bg-app rounded-xl border border-line flex flex-wrap items-center justify-between gap-y-2 col-span-1 md:col-span-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-ink">Staff Roles &amp; Discount Authority</h4>
                                        <p className="text-xs text-ink-muted">Configure staff roles (admin, manager, cashier), per-role maximum discount limits, and team access.</p>
                                    </div>
                                    <a
                                        href="/users"
                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
                                    >
                                        <span>Manage Staff &amp; Roles</span>
                                    </a>
                                </div>
                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                    <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Auto-Logout Timer (Minutes)</label>
                                    <input
                                        type="number"
                                        value={data.auto_logout}
                                        onChange={e => setData('auto_logout', e.target.value)}
                                        className="w-full max-w-xs px-4 py-2.5 bg-app border border-line rounded-xl font-bold text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SSO / SAML Configuration */}
                        <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs">
                            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-ink leading-tight">SSO / SAML Authentication</h3>
                                    <p className="text-xs text-ink-muted">Configure Single Sign-On for your enterprise organization</p>
                                </div>
                            </div>

                            {/* Honest availability notice */}
                            <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                                <span className="shrink-0 mt-0.5 font-bold text-base">⚠</span>
                                <div>
                                    <p className="font-bold">Configuration saved, but SSO login is not yet active.</p>
                                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400 leading-relaxed">
                                        SAML 2.0 metadata, signature validation and tenant-bound callback are under development.
                                        Enabling this toggle saves your IdP details but does not redirect any login attempts through your provider.
                                        Users will continue to log in with their email and password until this feature ships.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <Toggle
                                    enabled={data.sso_enabled === '1' || data.sso_enabled === true}
                                    onChange={v => setData('sso_enabled', v)}
                                    label="Enable SSO (pre-configure)"
                                    description="Enterprise feature: SAML 2.0 Identity Provider integration — saves configuration for when the feature is available"
                                />
                            </div>

                            {(data.sso_enabled === '1' || data.sso_enabled === true) && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">IdP Entity ID</label>
                                        <input
                                            type="text"
                                            value={data.sso_idp_entity_id || ''}
                                            onChange={(e) => setData('sso_idp_entity_id', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="https://identity-provider.com/metadata"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">Single Sign-On Service URL</label>
                                        <input
                                            type="text"
                                            value={data.sso_url || ''}
                                            onChange={(e) => setData('sso_url', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                            placeholder="https://identity-provider.com/sso"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">X.509 Public Certificate</label>
                                        <textarea
                                            value={data.sso_certificate || ''}
                                            onChange={(e) => setData('sso_certificate', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                            rows={5}
                                            placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'backup':
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs">
                            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                    <Database size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-ink leading-tight">Data & Backup</h3>
                                    <p className="text-xs text-ink-muted">Download manual snapshots or restore database files</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Toggle enabled={false} onChange={() => {}} label="Automatic Daily Backups" description="Backup database to local storage every night" comingSoon={true} />
                                
                                <div className="p-4 bg-app rounded-xl border border-line text-ink-muted text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <p className="font-medium text-ink">💡 Automatic local database backups are coming soon. Use Google Drive Automated Backups to secure your data in the cloud.</p>
                                    <a
                                        href={route('store.admin.data', { store_slug: store?.slug })}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
                                    >
                                        Configure Google Drive
                                    </a>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={handleDownloadBackup}
                                        disabled={downloading}
                                        className={`flex-1 py-3 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${downloading ? 'bg-sunken cursor-not-allowed text-ink-muted' : 'bg-brand-600 hover:bg-brand-500 active:scale-95'}`}
                                    >
                                        <Download size={16} /> {downloading ? 'Creating Backup...' : 'Download Backup'}
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
                                        className={`flex-1 py-3 bg-app hover:bg-sunken text-ink border border-line rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${restoring ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <HardDrive size={16} /> {restoring ? 'Processing...' : 'Restore / Import File'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                );

            case 'integrations':
                return (
                    <div className="space-y-6">
                        <div className="bg-surface p-6 rounded-2xl border border-line shadow-xs">
                            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-line">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-ink leading-tight">FBR POS Fiscalization</h3>
                                    <p className="text-xs text-ink-muted">Real-time fiscal invoice integration with Federal Board of Revenue</p>
                                </div>
                            </div>
                            <Toggle
                                enabled={data.fbr_integration}
                                onChange={v => setData('fbr_integration', v)}
                                label="Enable FBR Integration"
                                description="Automatically sign and broadcast sales invoices to FBR API"
                            />
                            {data.fbr_integration && (
                                <div className="mt-4 pt-4 border-t border-line space-y-4 animate-in slide-in-from-top-2 duration-normal">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">FBR POS ID</label>
                                            <input
                                                type="text"
                                                value={data.fbr_pos_id}
                                                onChange={e => setData('fbr_pos_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink"
                                                placeholder="e.g. 100234"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">FBR USIN</label>
                                            <input
                                                type="text"
                                                value={data.fbr_usin}
                                                onChange={e => setData('fbr_usin', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-ink"
                                                placeholder="e.g. USIN-994821"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stripe Integration Card */}
                        <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs opacity-75">
                            <div className="flex flex-wrap items-center justify-between gap-y-2">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                                        <Wifi size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-ink">Stripe Terminal & Online Payments</h4>
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-4xs font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30">Upcoming</span>
                                        </div>
                                        <p className="text-xs text-ink-muted">Process in-person NFC and online credit card payments</p>
                                    </div>
                                </div>
                                <Toggle enabled={false} disabled={true} upcoming={true} onChange={() => {}} />
                            </div>
                        </div>
                    </div>
                );

            case 'system':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4">
                                <h4 className="font-bold text-ink mb-2">Localization</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Language</label>
                                        <select
                                            value={data.language}
                                            onChange={e => setData('language', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-app border border-line rounded-xl font-bold text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="es" disabled>Spanish (Coming Soon)</option>
                                            <option value="fr" disabled>French (Coming Soon)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Date Format</label>
                                        <select
                                            value={data.date_format}
                                            onChange={e => setData('date_format', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-app border border-line rounded-xl font-bold text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4">
                                <h4 className="font-bold text-ink mb-2">Appearance</h4>
                                <div className="divide-y divide-line">
                                    <Toggle enabled={data.dark_mode_default} onChange={v => setData('dark_mode_default', v)} label="Force Dark Mode" description="Use dark theme by default" />
                                    <Toggle
                                        enabled={data.header_calculator_enabled === '1'}
                                        onChange={v => setData('header_calculator_enabled', v ? '1' : '0')}
                                        label="Header Calculator"
                                        description="Show a calculator in the application header for everyone in this store."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {renderContent()}
        </div>
    );
}
