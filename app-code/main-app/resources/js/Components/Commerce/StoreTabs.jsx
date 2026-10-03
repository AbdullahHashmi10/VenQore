import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

// short double beep (no audio file) when a NEW order arrives while this page is open
const beep = () => {
    try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        const ctx = new C();
        [0, 0.22].forEach((t) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.15;
            o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
        });
        setTimeout(() => ctx.close(), 800);
    } catch { /* sound is optional */ }
};


/** Online Store sub-navigation + live in-app new-order alert (polls the alerts endpoint). */
export default function StoreTabs({ active, urls, status }) {
    const { flash } = usePage().props;
    const [alerts, setAlerts] = useState({ unread: 0, latest: [] });
    const seen = useRef(null);

    useEffect(() => {
        if (!urls?.alerts) return undefined;
        let stop = false;
        const load = () => fetch(urls.alerts, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => { if (j && !stop) { if (seen.current !== null && j.unread > seen.current) beep(); seen.current = j.unread; setAlerts(j); } })
            .catch(() => {});
        load();
        const t = setInterval(load, 10000);
        return () => { stop = true; clearInterval(t); };
    }, [urls?.alerts]);

    const tabs = [
        ['home', 'Overview', urls?.home],
        ['settings', 'Store settings', urls?.settings],
        ['products', 'Products & pricing', urls?.products],
        ['promotions', 'Offers & coupons', urls?.promotions],
        ['orders', 'Online orders', urls?.orders],
    ].filter(([, , href]) => !!href);

    return (
        <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
                {tabs.map(([key, label, href]) => (
                    <Link key={key} href={href}
                        className={`px-3 py-2 rounded-xl text-sm font-medium ${active === key ? 'bg-brand-600 text-white' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
                        {label}
                        {key === 'orders' && alerts.unread > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-xs">{alerts.unread}</span>
                        )}
                    </Link>
                ))}
                {status && (
                    <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'}`}>
                        {status === 'published' ? 'Live' : status === 'suspended' ? 'Suspended' : 'Not live'}
                    </span>
                )}
            </div>
            {alerts.unread > 0 && alerts.latest?.[0] && (
                <a href={alerts.latest[0].url} className="mt-3 block rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-2 text-sm">
                    New online order: {alerts.latest[0].title}{alerts.unread > 1 ? ` (+${alerts.unread - 1} more)` : ''}
                </a>
            )}
            {flash?.success && <output className="mt-3 block rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-2 text-sm">{flash.success}</output>}
            {flash?.error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-900 px-4 py-2 text-sm" role="alert">{flash.error}</div>}
            {flash?.info && <output className="mt-3 block rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-2 text-sm">{flash.info}</output>}
        </div>
    );
}
