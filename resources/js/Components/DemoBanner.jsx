import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sparkles, ArrowRight, RefreshCw, UserCheck } from 'lucide-react';

export default function DemoBanner() {
    const { props } = usePage();
    const { is_demo, demo_reset_at, store, auth } = props;
    const isDemoStore = is_demo || store?.is_demo || store?.slug === 'demo';
    const [timeLeft, setTimeLeft] = useState('');
    const currentRole = auth?.user?.demo_role || auth?.user?.role || 'cashier';

    useEffect(() => {
        if (!demo_reset_at) return;
        const tick = () => {
            const now = new Date();
            const reset = new Date(demo_reset_at);
            const diff = reset - now;
            if (diff <= 0) {
                setTimeLeft('Resetting soon...');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${h}h ${m}m`);
        };
        tick();
        const interval = setInterval(tick, 60000);
        return () => clearInterval(interval);
    }, [demo_reset_at]);

    if (!isDemoStore) return null;

    const handleRoleSwitch = (role) => {
        window.location.href = route('demo.login', { role });
    };

    return (
        <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs py-2 px-4 border-b border-indigo-500/30 shadow-md relative z-[100] flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Left Info & Message */}
            <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-extrabold tracking-wide uppercase text-[10px]">
                    <Sparkles size={12} className="text-indigo-400 animate-pulse" />
                    LIVE DEMO STORE
                </span>
                
                <p className="text-slate-200 font-medium leading-tight">
                    You are exploring <span className="text-white font-bold">VenQore</span> with 5 years of live pre-loaded store data.
                </p>

                {timeLeft && (
                    <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        <RefreshCw size={10} className="animate-spin" />
                        Resets in {timeLeft}
                    </span>
                )}
            </div>

            {/* Right Actions: Role Switcher & Free Trial CTA */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Quick Role Switcher */}
                <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 text-[11px]">
                    <span className="px-2 text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <UserCheck size={11} className="text-indigo-400" />
                        Role:
                    </span>
                    {['owner', 'manager', 'cashier', 'accountant'].map((role) => (
                        <button
                            key={role}
                            onClick={() => handleRoleSwitch(role)}
                            disabled={currentRole === role}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                                currentRole === role
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {/* Primary CTA */}
                <a
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-[11px] shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <span>Start Free Trial & Full Guided Tour</span>
                    <ArrowRight size={12} />
                </a>
            </div>
        </div>
    );
}
