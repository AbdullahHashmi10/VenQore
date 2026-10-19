import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';
import { useConnectivity } from '@/lib/connectivity';
import { OFFLINE_LIMIT_DAYS, offlineKind } from '@/lib/offlinePolicy';
import { db } from '@/DB/LocalDB';

/**
 * The one honest message about offline mode, shown on every store page.
 *  - offline: what works here and what does not
 *  - online but showing a saved copy (slow server): says the data is saved, not live
 * Stays out of the way: a small card in the bottom-left corner.
 */
export default function OfflineModeBanner() {
    const { props, url } = usePage();
    const online = useConnectivity();
    const [checkedDaysLeft, setCheckedDaysLeft] = useState(null);

    const savedAt = props.vq_offline_snapshot?.at || null;
    const kind = offlineKind(typeof window !== 'undefined' ? window.location.pathname : url);
    const visible = !online || !!savedAt;

    // When this device last checked in with the server (stored by SyncService on every heartbeat).
    useEffect(() => {
        if (online) return undefined;
        let live = true;
        db.settings.get('last_online_verify').then((row) => {
            if (live && row?.value) setCheckedDaysLeft(Math.max(0, Math.ceil(OFFLINE_LIMIT_DAYS - (Date.now() - row.value) / 86400000)));
        }).catch(() => {});
        return () => { live = false; };
    }, [online]);
    const daysLeft = online ? null : checkedDaysLeft;

    if (!visible || !props.auth?.user || !props.store) return null;

    const at = savedAt ? new Date(savedAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : null;
    let title; let text;
    if (online) {
        title = 'Showing a saved copy';
        text = `This page is from ${at}, not live. It will refresh when the server answers.`;
    } else if (kind === 'pos') {
        title = 'Offline: sales are saved on this device';
        text = 'Keep selling. Every sale is sent automatically when the internet returns.';
    } else if (kind === 'foh') {
        title = 'Offline: orders are saved on this device';
        text = 'Tables, takeaway and delivery keep working and are sent when the internet returns. Use one device per table. Splitting a bill and online orders need internet.';
    } else {
        title = at ? `Offline: saved data from ${at}` : 'Offline: saved data, not live';
        text = 'You can look, but saving changes needs internet. The POS till still works.';
    }

    let posHref = null;
    try { posHref = kind === 'pos' ? null : route('store.pos', { store_slug: props.store.slug }); } catch { /* route not available */ }

    return (
        <output
            aria-live="polite"
            style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 8000, maxWidth: 340 }}
            className="rounded-2xl border border-amber-300/60 bg-white/95 p-3 text-sm shadow-xl backdrop-blur dark:border-amber-500/40 dark:bg-neutral-900/95"
        >
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                    <WifiOff size={16} />
                </span>
                <div className="min-w-0">
                    <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
                    <p className="mt-0.5 leading-snug text-neutral-600 dark:text-neutral-300">{text}</p>
                    {!online && daysLeft !== null && daysLeft <= 3 && (
                        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                            Reconnect within {daysLeft} day{daysLeft === 1 ? '' : 's'} or this device will lock.
                        </p>
                    )}
                    {posHref && (
                        <Link href={posHref} className="mt-2 inline-block rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
                            Open POS
                        </Link>
                    )}
                </div>
            </div>
        </output>
    );
}
