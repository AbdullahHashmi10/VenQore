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
        <div className="w-full bg-gradient-to-r from-neutral-900 via-brand-950 to-neutral-900 text-white text-xs py-2 px-4 border-b border-brand-500/30 shadow-md relative z-drawer flex flex-col md:flex-row items-center justify-between gap-2.5">
            {/* Left Info & Message */}
            <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 font-bold tracking-wide uppercase text-2xs">
                    <Sparkles size={12} className="text-brand-400 animate-pulse" />
                    LIVE DEMO STORE
                </span>
                
                <p className="text-neutral-200 font-medium leading-tight">
                    You are exploring <span className="text-white font-bold">VenQore</span> with 5 years of live pre-loaded store data.
                </p>

                {timeLeft && (
                    <span className="hidden lg:inline-flex items-center gap-1 text-2xs font-semibold text-ink-muted bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                        <RefreshCw size={10} className="animate-spin" />
                        Resets in {timeLeft}
                    </span>
                )}
            </div>

            {/* Right Actions: Role Switcher & Free Trial CTA */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Quick Role Switcher */}
                <div className="hidden sm:flex items-center bg-neutral-800/80 border border-neutral-700/80 rounded-lg p-0.5 text-1xs">
                    <span className="px-2 text-ink-muted font-semibold text-2xs uppercase tracking-wider flex items-center gap-1">
                        <UserCheck size={11} className="text-brand-400" />
                        Role:
                    </span>
                    {['owner', 'manager', 'cashier', 'accountant'].map((role) => (
                        <button
                            key={role}
                            onClick={() => handleRoleSwitch(role)}
                            disabled={currentRole === role}
                            className={`px-2 py-0.5 rounded text-2xs font-bold capitalize transition-all ${
                                currentRole === role
                                    ? 'bg-brand-600 text-white shadow'
                                    : 'text-ink-faint hover:text-white hover:bg-interactive-hover'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {/* Primary CTA */}
                <a
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-bold text-1xs shadow-md active:scale-[0.98] transition-all"
                >
                    <span>Start Free Trial & Full Guided Tour</span>
                    <ArrowRight size={12} />
                </a>
            </div>
        </div>
    );
}
