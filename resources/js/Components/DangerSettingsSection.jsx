import React, { useState } from 'react';
import { Trash2, AlertOctagon, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function DangerSettingsSection({ data, setData }) {
    const [resetting, setResetting] = useState(false);

    const handleFactoryReset = async (type = 'all') => {
        let title = 'Are you sure?';
        let text = 'This action cannot be undone.';
        let confirmText = 'Yes, delete it!';
        let url = '/api/system/reset'; // Default URL for factory reset

        if (type === 'all') {
            title = 'FACTORY RESET';
            text = 'WARNING: This will delete ALL sales, products, customers, and transactions. Only your admin account will remain. This process is IRREVERSIBLE.';
            confirmText = 'I UNDERSTAND, WIPE EVERYTHING';
            // url remains /api/system/reset
        } else {
            // For selective delete, we use a different endpoint format if backend supports distinct routes, 
            // but SystemResetController uses `deleteEntity` method usually mapped to something dynamic.
            // Based on previous code, it seemed to be /api/system/reset/{entity}. 
            // SystemResetController code showed "deleteEntity" method. Routes must map it.
            // Let's assume the router handles it.
            url = `/api/system/reset/${type}`;
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
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        // 2. Password Authentication Prompt
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
            background: '#1e293b',
            color: '#fff',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter your password!'
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
                        <div class="mb-2 flex justify-between text-sm font-medium text-slate-300">
                            <span id="swal-reset-text">Initializing wipe sequence...</span>
                            <span id="swal-reset-percent">0%</span>
                        </div>
                        <div class="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden border border-slate-600">
                            <div id="swal-reset-bar" class="bg-red-600 h-3 rounded-full transition-all duration-300 relative" style="width: 0%">
                                <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p class="text-xs text-red-400 mt-2 animate-pulse">DO NOT CLOSE THIS WINDOW. POWER OFF MAY CAUSE CORRUPTION.</p>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    background: '#1e293b',
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
                        background: '#1e293b',
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
                        background: '#1e293b',
                        color: '#fff'
                    }).then(() => {
                        setResetting(false);
                    });
                }
            }, 600); // 600ms delay to allow Password prompt to close
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Intro */}
            <div className="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-red-950 via-red-900 to-slate-900 relative overflow-hidden shadow-2xl border border-red-900/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-red-500/20 rounded-lg backdrop-blur-md border border-white/10">
                            <AlertOctagon className="text-red-400" size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Danger Zone</h2>
                    </div>
                    <p className="text-red-200/60 font-medium ml-14 text-lg max-w-2xl">
                        Irreversible destructive actions. Proceed with extreme caution.
                    </p>
                </div>
            </div>

            <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-500/20">
                <div className="space-y-6">
                    {/* Factory Reset Button */}
                    <button
                        type="button"
                        onClick={() => handleFactoryReset('all')}
                        disabled={resetting}
                        className={`w-full py-6 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/20 text-xl tracking-wide group ${resetting ? 'bg-red-900/80 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-[1.01] active:scale-95'}`}
                    >
                        {resetting ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="animate-spin text-red-200" size={24} />
                                <span className="animate-pulse">Processing...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                                    <Trash2 size={24} />
                                </div>
                                FACTORY RESET (DELETE ALL DATA)
                            </>
                        )}
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-red-200 dark:border-red-800/50"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-red-50 dark:bg-[#2A1818] text-xs font-bold uppercase tracking-widest text-red-400">Selective Deletion</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('products')}
                            disabled={resetting}
                            className="py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50"
                        >
                            <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                                <Trash2 size={20} />
                            </span>
                            Delete All Products
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('sales')}
                            disabled={resetting}
                            className="py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50"
                        >
                            <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                                <Trash2 size={20} />
                            </span>
                            Delete All Sales
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFactoryReset('stock')}
                            disabled={resetting}
                            className="py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg group disabled:opacity-50"
                        >
                            <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                                <Trash2 size={20} />
                            </span>
                            Reset Stock to 0
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
