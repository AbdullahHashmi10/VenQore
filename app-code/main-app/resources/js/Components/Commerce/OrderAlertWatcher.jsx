import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';

export const ORDER_ALERT_EVENT = 'venqore:commerce-order-alerts';

const ACTIVE_POLL_MS = 15_000;
const BACKGROUND_POLL_MS = 60_000;

const beep = () => {
    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        const context = new Audio();
        [0, 0.22].forEach((offset) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.value = 0.15;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(context.currentTime + offset);
            oscillator.stop(context.currentTime + offset + 0.16);
        });
        window.setTimeout(() => context.close(), 800);
    } catch {
        // The visual alert remains available when browsers block audio.
    }
};

/** Keep online-order alerts live throughout the signed-in store app. */
export default function OrderAlertWatcher({ addToast }) {
    const { auth, store, modules = [], my_role: membershipRole, userRole } = usePage().props;
    const addToastRef = useRef(addToast);

    useEffect(() => {
        addToastRef.current = addToast;
    }, [addToast]);

    useEffect(() => {
        if (!store?.slug || !auth?.user) return undefined;

        // If online_store module is configured and disabled for this store, do not poll
        if (Array.isArray(modules) && modules.length > 0 && !modules.includes('online_store')) {
            return undefined;
        }

        const role = membershipRole || userRole || auth.user.role;
        const permissions = auth.user.permissions || [];
        const canViewOrders = Boolean(auth.user.is_platform_admin)
            || ['owner', 'admin', 'manager', 'platform_admin'].includes(role)
            || permissions.includes('sales.view');
        if (!canViewOrders) return undefined;

        const endpoint = route('store.commerce.alerts', { store_slug: store.slug });
        const storageKey = `venqore:commerce-alert:${store.id}:latest`;
        let stopped = false;
        let timer = null;
        let controller = null;
        let lastLatestId = null;

        try { lastLatestId = sessionStorage.getItem(storageKey); } catch { /* optional */ }

        const schedule = () => {
            if (stopped) return;
            timer = window.setTimeout(check, document.hidden ? BACKGROUND_POLL_MS : ACTIVE_POLL_MS);
        };

        const announce = (latest) => {
            beep();
            addToastRef.current(latest?.title || 'A new online order has arrived.', 'warning');

            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(latest?.title || 'New online order', {
                    body: 'Open VenQore to review the order.',
                    tag: `commerce-order-${latest?.id || 'new'}`,
                });
                notification.onclick = () => {
                    window.focus();
                    if (latest?.url) router.visit(latest.url);
                    notification.close();
                };
            }
        };

        async function check() {
            if (stopped || controller) return;
            controller = new AbortController();

            try {
                const response = await fetch(endpoint, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if ([401, 403, 404].includes(response.status)) {
                    stopped = true;
                    return;
                }
                if (!response.ok) return;

                const data = await response.json();
                const latest = data.latest?.[0] || null;
                const nextLatestId = latest?.id == null ? null : String(latest.id);
                const changed = Boolean(nextLatestId && nextLatestId !== lastLatestId);

                if (nextLatestId) {
                    lastLatestId = nextLatestId;
                    try { sessionStorage.setItem(storageKey, nextLatestId); } catch { /* optional */ }
                }

                window.dispatchEvent(new CustomEvent(ORDER_ALERT_EVENT, {
                    detail: { ...data, changed },
                }));

                if (changed) announce(latest);
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    // Retry quietly on the next scheduled check.
                }
            } finally {
                controller = null;
                schedule();
            }
        }

        const onVisibilityChange = () => {
            if (document.hidden || stopped) return;
            if (timer) window.clearTimeout(timer);
            timer = null;
            check();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        check();

        return () => {
            stopped = true;
            if (timer) window.clearTimeout(timer);
            controller?.abort();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [auth?.user, membershipRole, store?.id, store?.slug, userRole]);

    return null;
}
