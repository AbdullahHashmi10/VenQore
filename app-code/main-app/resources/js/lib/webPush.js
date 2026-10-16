import axios from 'axios';

/*
 * Web Push for the browser and the installed web app.
 *
 * The page asks permission in plain words, subscribes the browser to the server's VAPID key, and tells the
 * server which rider it is for (the server works that out from the link or the login, never from here).
 * Nothing is sent without the person pressing the switch; turning it off removes the subscription.
 */

export function pushSupported() {
    return typeof window !== 'undefined'
        && window.isSecureContext
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

function keyToBytes(base64Url) {
    const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
    const raw = atob((base64Url + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
    return navigator.serviceWorker.ready;
}

export async function pushState() {
    if (!pushSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'blocked';
    try {
        const sub = await (await registration()).pushManager.getSubscription();
        return sub && Notification.permission === 'granted' ? 'on' : 'off';
    } catch {
        return 'off';
    }
}

/* The page the notification should open on tap. Kept on this device only: a private rider link is
   a secret and is never sent to the server just to be played back in a notification. */
async function rememberLanding() {
    try {
        const cache = await caches.open('vq-push-landing');
        await cache.put('/__landing', new Response(location.pathname + location.search));
    } catch { /* best effort */ }
}

export async function enablePush({ key, on }) {
    if (!pushSupported()) return { ok: false, reason: 'unsupported' };
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: permission === 'denied' ? 'blocked' : 'dismissed' };

    try {
        const reg = await registration();
        const sub = (await reg.pushManager.getSubscription())
            || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
        await axios.post(on, sub.toJSON());
        await rememberLanding();
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: e?.response?.status === 503 ? 'server' : 'failed' };
    }
}

export async function disablePush({ off }) {
    try {
        const sub = await (await registration()).pushManager.getSubscription();
        if (sub) {
            await axios.post(off, { endpoint: sub.endpoint }).catch(() => {});
            await sub.unsubscribe();
        }
        return { ok: true };
    } catch {
        return { ok: false };
    }
}
