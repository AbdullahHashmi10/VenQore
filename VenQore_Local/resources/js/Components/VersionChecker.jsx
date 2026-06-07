import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';

export default function VersionChecker({ checkInterval = 60000 }) {
    const [newVersionAvailable, setNewVersionAvailable] = useState(false);
    const [initialVersion, setInitialVersion] = useState(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        // Initial check to set the baseline
        checkVersion(true);

        // Setup interval
        const intervalId = setInterval(() => {
            checkVersion(false);
        }, checkInterval);

        return () => clearInterval(intervalId);
    }, []);

    const checkVersion = async (isInitial = false) => {
        try {
            // Avoid multiple simultaneous checks
            if (checking) return;
            // setChecking(true); // Optional: don't really need to block strictly

            const response = await axios.get('/api/app-version');
            const serverVersion = response.data.version;

            if (isInitial) {
                setInitialVersion(serverVersion);
            } else {
                if (initialVersion && serverVersion !== initialVersion) {
                    setNewVersionAvailable(true);
                }
            }
        } catch (error) {
            // Squelch errors during offline mode
            if (process.env.NODE_ENV === 'development') {
                // console.warn('App version check failed (Offline?)');
            }
        } finally {
            setChecking(false);
        }
    };

    const handleReload = () => {
        // Hard reload
        window.location.reload(true);
    };

    if (!newVersionAvailable) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-[#0f172a] border border-slate-700/50 shadow-2xl rounded-2xl p-4 pl-5 flex items-center gap-6 max-w-md w-full relative overflow-hidden">

                {/* Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                <div className="absolute -left-10 top-0 w-20 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 animate-pulse">
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <h4 className="font-bold text-white text-md">Update Available</h4>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">
                        A new version of the application has been released.
                        <br />Reload to unlock new features.
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={handleReload}
                    className="group bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-black py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    RELOAD
                </button>
            </div>
        </div>
    );
}
