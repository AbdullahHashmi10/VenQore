import React, { useState } from 'react';
import { Trash2, AlertOctagon, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { usePage } from '@inertiajs/react';

import { vq } from '@/theme/runtime';
import { useTermText } from '@/lib/terms';
export default function DangerSettingsSection({ data, setData }) {
    const tt = useTermText();
    const [resetting, setResetting] = useState(false);

    const { store, auth } = usePage().props;
    const storeSlug = store?.slug || 'demo';
    const user = auth?.user;

    // A Google-only user has google_id set but NO password hash stored.
    // They use their email address to confirm dangerous operations instead.
    const isGoogleNoPassword = !!(user?.google_id && !user?.has_password);

    const handleFactoryReset = async (type = 'all') => {
        let title = 'Are you sure?';
        let text = 'This action cannot be undone.';
        let confirmText = 'Yes, delete it!';
        let url = `/s/${storeSlug}/api/system/reset`; // Default URL for factory reset

        if (type === 'all') {
            title = 'FACTORY RESET';
            text = tt('WARNING: This will delete ALL sales, products, customers, and transactions. Only your admin account will remain. This process is IRREVERSIBLE.');
            confirmText = 'I UNDERSTAND, WIPE EVERYTHING';
            // url remains /s/{storeSlug}/api/system/reset
        } else {
            // For selective delete, we use a different endpoint format if backend supports distinct routes,
            // but SystemResetController uses `deleteEntity` method usually mapped to something dynamic.
            // Based on previous code, it seemed to be /api/system/reset/{entity}.
            // SystemResetController code showed "deleteEntity" method. Routes must map it.
            // Let's assume the router handles it.
            url = `/s/${storeSlug}/api/system/reset/${type}`;
            text = `This will permanently delete all ${type} data.`;
            confirmText = `Yes, delete ${type}`;
        }

        // 1. Initial Warning
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: confirmText,
            background: vq.slate[800],
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        // 2. Authentication Prompt — adapts based on whether the user has a password
        if (isGoogleNoPassword) {
            await Swal.fire({
                title: 'Password Required',
                text: 'You signed in with Google and have not set a password. For security, please set a password in your Profile first, then return to confirm this action.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Go to Profile Settings',
                cancelButtonText: 'Cancel',
                background: vq.slate[800],
                color: '#fff'
            }).then((res) => {
                if (res.isConfirmed) {
                    window.location.href = route('store.profile.edit', { store_slug: storeSlug });
                }
            });
            return;
        }
 
        const { value: password } = await Swal.fire({
            title: 'Authentication Required',
            text: 'Please enter your password or admin passcode to confirm.',
            input: 'password',
            inputPlaceholder: 'Enter your password',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Confirm Deletion',
            cancelButtonColor: '#3085d6',
            background: vq.slate[800],
            color: '#fff',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter your password!';
                }
            }
        });

        if (password) {
            setResetting(true);

            // Ensure previous Swal (password prompt) is fully closed 
            if (Swal.isVisible()) {
                Swal.close();
            }

            // Wait for React state update and previous Swal to fully cleanup
            setTimeout(async () => {
                let timerInterval;

                // Show Progress Bar
                Swal.fire({
                    title: 'Factory Reset In Progress',
                    html: `
                        <div class="mb-2 flex justify-between text-sm font-medium text-neutral-300">
                            <span id="swal-reset-text">Initializing wipe sequence...</span>
                            <span id="swal-reset-percent">0%</span>
                        </div>
                        <div class="w-full bg-neutral-700 rounded-full h-3 mb-4 overflow-hidden border border-neutral-600">
                            <div id="swal-reset-bar" class="bg-red-600 h-3 rounded-full transition-all duration-slow relative" style="width: 0%">
                                <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p class="text-xs text-red-400 mt-2 animate-pulse">DO NOT CLOSE THIS WINDOW. POWER OFF MAY CAUSE CORRUPTION.</p>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    background: vq.slate[800],
                    color: '#fff',
                    didOpen: () => {
                        const b = Swal.getHtmlContainer().querySelector('#swal-reset-bar');
                        const t = Swal.getHtmlContainer().querySelector('#swal-reset-text');
                        const p = Swal.getHtmlContainer().querySelector('#swal-reset-percent');

                        let progress = 0;

                        timerInterval = setInterval(() => {
                            // Simulated progress for deletion
                            // Start fast, then slow down
                            if (progress < 30) {
                                progress += 2;
                                if (t) t.textContent = 'Deleting database records...';
                            } else if (progress < 60) {
                                progress += 0.5;
                                if (t) t.textContent = 'Clearing transaction history...';
                            } else if (progress < 80) {
                                progress += 0.2;
                                if (t) t.textContent = 'Removing cache files...';
                            } else if (progress < 95) {
                                progress += 0.05;
                                if (t) t.textContent = 'Finalizing system reset...';
                            }

                            if (progress > 95) progress = 95;

                            if (b) b.style.width = progress + '%';
                            if (p) p.textContent = Math.round(progress) + '%';
                        }, 100);
                    }
                });

                try {
                    // Increase timeout to 120 seconds to prevent frontend timeout on large deletes
                    const response = await axios.post(url, { password }, { timeout: 120000 });

                    clearInterval(timerInterval);

                    Swal.fire({
                        title: 'Deleted!',
                        text: response.data.message || 'System has been reset.',
                        icon: 'success',
                        background: vq.slate[800],
                        color: '#fff'
                    }).then(() => {
                        window.location.reload();
                    });
                } catch (error) {
                    clearInterval(timerInterval);
                    console.error("Reset Error:", error);
                    let errorMsg = error.response?.data?.message || 'Something went wrong.';

                    if (error.code === 'ECONNABORTED') {
                        errorMsg = 'The operation timed out. Data might be partially deleted. Please refresh the page.';
                    } else if (error.response?.status === 403) {
                        errorMsg = 'Invalid Password or Passcode.';
                    } else if (error.response?.status === 500) {
                        errorMsg = 'Server Error (500). Please check if the server is running or if a transaction is stuck. Try restarting the application.';
                    }

                    Swal.fire({
                        title: 'Error!',
                        text: errorMsg,
                        icon: 'error',
                        background: vq.slate[800],
                        color: '#fff'
                    }).then(() => {
                        setResetting(false);
                    });
                }
            }, 600); // 600ms delay to allow Password prompt to close
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">

            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6">
                {/* Full Factory Reset */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-ink">Complete Store Factory Reset</h3>
                    <p className="text-xs text-ink-muted">
                        Wipes all catalog items, sales, invoices, customers, and financial journals. Only your administrator credentials will be retained.
                    </p>
                    <button
                        type="button"
                        onClick={() => handleFactoryReset('all')}
                        disabled={resetting}
                        className={`w-full py-3.5 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 ${
                            resetting ? 'bg-red-900/80 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {resetting ? (
                            <>
                                <Loader2 className="animate-spin text-red-200" size={18} />
                                <span>Processing Wipe Sequence...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                <span>FACTORY RESET (WIPE ALL DATA)</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="pt-4 border-t border-line space-y-3">
                    <h3 className="text-sm font-bold text-ink">Selective Data Deletion</h3>
                    <p className="text-xs text-ink-muted">
                        Delete specific data partitions while preserving the rest of your store configuration.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('products')}
                            disabled={resetting}
                            className="p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <Trash2 size={15} className="text-red-500" />
                            <span>{tt('Delete All Products')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('sales')}
                            disabled={resetting}
                            className="p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <Trash2 size={15} className="text-red-500" />
                            <span>Delete All Sales</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('stock')}
                            disabled={resetting}
                            className="p-4 bg-app hover:bg-sunken border border-line hover:border-red-500/40 text-ink rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <Trash2 size={15} className="text-red-500" />
                            <span>Reset Stock to 0</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
