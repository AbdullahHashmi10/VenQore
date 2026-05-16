import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function DemoBanner() {
    const { props } = usePage();
    const { is_demo, demo_reset_at } = props;
    const resetAt = demo_reset_at;
    const [timeLeft, setTimeLeft] = useState('');
    const buyUrl = '/register';

    useEffect(() => {
        if (!resetAt) return;
        const tick = () => {
            const now = new Date();
            const reset = new Date(resetAt);
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
    }, [resetAt]);

    if (!is_demo || !resetAt) return null;

    return (
        <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm flex items-center justify-between px-4 py-2 border-b border-indigo-700">
            <div className="flex items-center gap-3">
                <span className="font-bold flex items-center gap-2">🎯 DEMO MODE</span>
                <span className="hidden sm:inline opacity-80 pl-2 border-l border-white/20">All data resets every 24 hours.</span>
                <span className="opacity-100 text-xs font-bold bg-white/20 px-2 rounded ml-2">Resets in {timeLeft}</span>
            </div>
            <a
                href={buyUrl}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-black px-4 py-1 rounded-full text-xs transition-colors shadow"
            >
                Start Free Trial &rarr;
            </a>
        </div>
    );
}
