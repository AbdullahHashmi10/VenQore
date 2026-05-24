import React, { useEffect, useState } from 'react';
import { AttendanceProvider } from '@/Contexts/AttendanceContext';
import { WorkspaceProvider } from '@/Contexts/WorkspaceContext';
import { AlertProvider } from '@/Contexts/AlertContext';
import OfflineLockScreen from '@/Components/OfflineLockScreen';
import GlobalDialogOverride from '@/Utils/GlobalDialogOverride';
import { SyncService } from '@/Services/SyncService';
import PasscodeModal from '@/Components/PasscodeModal';
import { useGlobalShortcuts } from '@/Hooks/useGlobalShortcuts';
import KeyboardShortcutsModal from '@/Components/KeyboardShortcutsModal';

import { usePage } from '@inertiajs/react';
import { ThemeProvider } from '@/Contexts/ThemeContext';

export default function GlobalProviderLayout({ children }) {
    const { props } = usePage();
    const settings = props.settings || {};
    
    return (
        <ThemeProvider>
            <InnerGlobalLayout settings={settings}>
                {children}
            </InnerGlobalLayout>
        </ThemeProvider>
    );
}

function InnerGlobalLayout({ children, settings }) {
    const { props } = usePage();
    const [showExitModal, setShowExitModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showUpdateOverlay, setShowUpdateOverlay] = useState(false);
    // const [settings, setSettings] = useState({ admin_passcode: '123456' }); // Removed hardcoded
    const isInstaller = window.location.pathname.startsWith('/installer');
    const isMarketing = [
        '/', '/features', '/pricing', '/about', '/contact', '/blog',
        '/terms', '/privacy', '/demo', '/demo-expired', '/login', '/register', '/forgot-password', '/reset-password'
    ].some(path => window.location.pathname === path || window.location.pathname === path + '/') || window.location.pathname.startsWith('/blog/');

    // Enable Global Shortcuts
    useGlobalShortcuts();

    // ── Soft Update Interceptor ───────────────────────────────────
    useEffect(() => {
        const handleSystemUpdate = () => {
            if (!showUpdateOverlay) {
                setShowUpdateOverlay(true);
            }
        };

        window.addEventListener('amd:system-update-in-progress', handleSystemUpdate);

        return () => {
            window.removeEventListener('amd:system-update-in-progress', handleSystemUpdate);
        };
    }, [showUpdateOverlay]);

    // Active recovery polling
    useEffect(() => {
        if (!showUpdateOverlay) return;

        // Poll every 3.5 seconds to see if the server is back online
        const pollInterval = setInterval(() => {
            fetch('/up', { method: 'GET', cache: 'no-store' })
                .then(res => {
                    if (res.status === 200 || res.status === 204 || res.status === 404) {
                        clearInterval(pollInterval);
                        window.location.reload();
                    }
                })
                .catch(() => {
                    // Ignore network failures while server is offline/restarting
                });
        }, 3500);

        return () => clearInterval(pollInterval);
    }, [showUpdateOverlay]);

    useEffect(() => {
        // 🛑 DO NOT RUN SYNC/ATTENDANCE/ETC IF INSTALLING OR ON MARKETING PAGES
        if (isInstaller || isMarketing) {
            return;
        }

        // Initial Sync/Check on load
        SyncService.runBackgroundSync();

        // Background Interval (30 Mins)
        const interval = setInterval(() => {
            SyncService.runBackgroundSync();
        }, 30 * 60 * 1000);

        // Listen for Electron Exit Request
        const handleExitRequest = () => {
            console.log('[Global] Exit Request Received');
            setShowExitModal(true);
        };

        // Use the Bridge API if available (Preferred)
        let cleanup = () => { };
        if (window.amdAPI && window.amdAPI.onExitRequest) {
            cleanup = window.amdAPI.onExitRequest(handleExitRequest);
        } else {
            // Fallback for non-bridge environments or legacy
            window.addEventListener('amd:request-exit-auth', handleExitRequest);
            cleanup = () => window.removeEventListener('amd:request-exit-auth', handleExitRequest);
        }

        // Also facilitate direct manual calls if needed
        window.handleAMDExit = handleExitRequest;

        return () => {
            clearInterval(interval);
            cleanup();
            if (window.handleAMDExit) delete window.handleAMDExit;
        };
    }, []);

    const handleExitSuccess = () => {
        console.log('[Global] Exit Authorized. Terminating...');
        if (window.amdAPI) {
            window.amdAPI.forceClose();
        } else {
            // Fallback for browser testing
            window.close();
            setShowExitModal(false);
        }
    };

    // Determine Logic Check Mode
    const isPosCtx = window.location.pathname.includes('/pos');

    return (
        <WorkspaceProvider settings={settings}>
            <AttendanceProvider>
                <AlertProvider>
                    {!isInstaller && <OfflineLockScreen />}
                    <PasscodeModal
                        isOpen={showExitModal}
                        onClose={() => setShowExitModal(false)}
                        onSuccess={handleExitSuccess}
                        settings={settings}
                    />

                    <KeyboardShortcutsModal
                        isOpen={showShortcuts}
                        onClose={() => setShowShortcuts(false)}
                        mode={isPosCtx ? 'pos' : 'global'}
                    />

                    {children}

                    {showUpdateOverlay && (
                        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6 select-none">
                            <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                                {/* Glow and Loader */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
                                
                                <div className="relative flex items-center justify-center mb-8 h-24">
                                    <div className="absolute w-20 h-20 rounded-full border border-indigo-500/20 bg-indigo-500/5 animate-ping opacity-60" />
                                    <div className="absolute w-16 h-16 rounded-full border border-indigo-500/30 bg-indigo-500/10 animate-pulse" />
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-20">
                                        <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">System Upgrade in Progress</h2>
                                    <p className="text-slate-400 text-xs leading-relaxed max-w-[320px] mx-auto">
                                        We are currently applying a live system update to your app. To prevent any data loss, <strong className="text-indigo-400">please do not refresh, close the page, or perform any actions</strong> right now.
                                    </p>
                                    
                                    <div className="pt-3 border-t border-slate-800/60 max-w-[280px] mx-auto">
                                        <p className="text-[11px] font-medium text-amber-400/90 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2 leading-relaxed">
                                            ⚠️ Warning: Any transactions or changes made during this brief period will not be saved.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 pt-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span>Reconnecting to server...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fixed Shortcuts Trigger - Hidden for Platform HQ, Marketing, and Unauthenticated Users */}
                    {!isInstaller && !isMarketing && props.auth?.user && !window.location.pathname.startsWith('/VenQore') && window.location.pathname !== '/hub' && (
                        <div
                            onClick={() => setShowShortcuts(true)}
                            className="fixed bottom-1 left-1 z-[9999] opacity-40 hover:opacity-100 transition-opacity cursor-pointer group"
                            title="View Keyboard Shortcuts"
                        >
                            <div className="bg-black/80 text-white px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/10">
                                <span>⌨</span>
                                <span className="hidden group-hover:inline">Shortcuts</span>
                            </div>
                        </div>
                    )}

                    <GlobalDialogOverride />
                </AlertProvider>
            </AttendanceProvider>
        </WorkspaceProvider>
    );
}
