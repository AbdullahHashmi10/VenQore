import React, { useState, useEffect } from 'react';
import { WifiOff, RotateCcw, MonitorX } from 'lucide-react';
import PremiumButton from '@/Components/PremiumButton';
import { SyncService } from '@/Services/SyncService';

export default function OfflineLockScreen() {
    const [isBlocked, setIsBlocked] = useState(false);
    const [showGame, setShowGame] = useState(false);
    const [reason, setReason] = useState('Offline limit exceeded.');

    useEffect(() => {
        // Perform initial license check
        checkAccess();

        // If we come back online, try to re-verify immediately
        const handleOnline = () => checkAccess();
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const checkAccess = async () => {
        const { blocked, message } = await SyncService.checkLicensing();
        setIsBlocked(blocked);
        if (message) setReason(message);
    };

    const checkConnection = () => {
        // User manually clicked Retry
        checkAccess();
        // Visual feedback if still blocked
        if (isBlocked) {
            const btn = document.getElementById('retry-btn');
            btn?.classList.add('animate-shake');
            setTimeout(() => btn?.classList.remove('animate-shake'), 500);
        }
    };

    if (!isBlocked) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                    <WifiOff size={40} className="text-red-500" />
                </div>

                <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Access Suspended</h2>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                    {reason}
                </p>

                <div className="space-y-4">
                    <button
                        id="retry-btn"
                        onClick={checkConnection}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <RotateCcw size={20} />
                        Retry Connection
                    </button>

                    {!showGame && (
                        <button
                            onClick={() => setShowGame(true)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                        >
                            <MonitorX size={20} />
                            I'm bored, let's play
                        </button>
                    )}
                </div>

                {showGame && (
                    <div className="mt-8 pt-8 border-t border-white/10 animate-in slide-in-from-bottom-4">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/20 relative">
                            {/* Simple CSS-only Ping Pong Game representation or iframe */}
                            {/* Ideally, we'd embed a simple JS game canvas here, but for "playable" in a lock screen context: */}
                            <iframe
                                src="https://chromedino.com/"
                                className="w-full h-full opacity-80"
                                title="Offline Game"
                                frameBorder="0"
                            ></iframe>
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-mono">Connection will auto-retry in the background.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
                .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
            `}</style>
        </div>
    );
}
