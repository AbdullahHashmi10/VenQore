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

export default function GlobalProviderLayout({ children }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const [showExitModal, setShowExitModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    // const [settings, setSettings] = useState({ admin_passcode: '123456' }); // Removed hardcoded
    const isInstaller = window.location.pathname.startsWith('/installer');
    const isMarketing = [
        '/', '/features', '/pricing', '/about', '/contact', '/blog',
        '/terms', '/privacy', '/demo', '/demo-expired', '/login', '/register', '/forgot-password', '/reset-password'
    ].some(path => window.location.pathname === path || window.location.pathname === path + '/') || window.location.pathname.startsWith('/blog/');

    // Enable Global Shortcuts
    useGlobalShortcuts();

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
