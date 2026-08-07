import React from 'react';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function OfflineWarningBanner() {
    const { terminals } = usePage().props;

    const [isBrowserOnline, setIsBrowserOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    React.useEffect(() => {
        const handleStatusChange = () => {
            setIsBrowserOnline(navigator.onLine);
        };
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    if (!isBrowserOnline) {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-800 dark:text-red-200 font-bold">
                            ⚠️ OFFLINE MODE: Showing Local Data Only.
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300/80 mt-1 leading-relaxed">
                            <strong className="font-extrabold">Data from other branches or historical archives is unavailable.</strong>
                            <span className="block mt-1">You are currently viewing data stored on this device only. Sales made now will sync when connection returns.</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!terminals || terminals.length === 0) return null;
    const terminal = terminals[0]; // Focusing on main terminal for now

    // ... existing logic ...
    const lastHeartbeat = terminal.last_heartbeat_at ? new Date(terminal.last_heartbeat_at) : null;
    const now = new Date();
    // Use getTime to be safe
    const diffMinutes = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 1000 / 60 : 999;

    const isClosed = terminal.status === 'CLOSED_NORMALLY' || terminal.status === 'CLOSED';
    const isStrike = terminal.status === 'STRIKE';
    const isLive = diffMinutes < 2.5;

    // SCENARIO 1: RED (OFFLINE UNEXPECTEDLY)
    if (!isLive && !isClosed && !isStrike) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 mb-6 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-bold">
                            ⚠️ WARNING: SHOP IS OFFLINE
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                            The data below is <strong className="font-extrabold">outdated</strong> (Last seen: {Math.floor(diffMinutes)} mins ago).
                            The shop may have made transactions that are not reflected here yet.
                            <span className="block mt-1 font-medium">Please proceed with caution when making inventory decisions.</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // SCENARIO 2: CLOSED (Safe Mode)
    // Only show if user is admin (implied by usage context)
    if (isClosed) {
        return (
            <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-400 dark:border-slate-500 p-4 mb-6 rounded-r shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-bold">
                            Shop is Closed. Safe to edit.
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            The register was closed normally. You can safely make inventory updates or price changes.
                            Changes will sync automatically when the shop opens.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // SCENARIO 3: STRIKE
    if (isStrike) {
        return (
            <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 p-4 mb-6 rounded-r shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-orange-800 dark:text-orange-200 font-bold">
                            Shop Closed: {terminal.last_status_reason || 'Strike / Emergency'}
                        </p>
                        <p className="text-sm text-orange-700 dark:text-orange-300/80 mt-1">
                            No active transactions are expected. Safe to review data.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
