/**
 * The offline contract, in one place (docs/OFFLINE_CONTRACT.md).
 *
 * The same limit is enforced by the browser licence check (Services/SyncService),
 * the Windows Station lock (windows-app/main.js), the service worker (public/sw.js,
 * which cannot import this file) and the public pages. Change it everywhere together.
 */
export const OFFLINE_LIMIT_DAYS = 7;
export const OFFLINE_LIMIT_MS = OFFLINE_LIMIT_DAYS * 24 * 60 * 60 * 1000;

/**
 * How a store page behaves with no internet.
 *  - 'pos':  fully usable. Sales are saved on this device and sent when back online.
 *  - 'foh':  fully usable on ONE device (lib/offlineFloor.js): seat, order, fire to the kitchen,
 *            take payment, takeaway and delivery. Kept on the device and sent when the server
 *            answers. Two devices cannot see each other's tables without the server.
 *  - 'other': opens from the saved copy for reading; saving anything needs internet.
 */
export function offlineKind(pathname = '') {
    if (/\/s\/[^/]+\/pos(\/|$|\?)/.test(pathname)) return 'pos';
    if (/\/s\/[^/]+\/foh(-online|-settings)?(\/|$|\?)/.test(pathname)) return 'foh';
    return 'other';
}

/** Writes that must still go out with no internet: the till's own queue and licence check-in. */
const WRITE_ALLOWED_OFFLINE = [
    /\/pos\/queue-status$/,
    /\/api\/heartbeat$/,
    /\/heartbeat$/,
    /\/api\/report-error$/,
    /\/sync\//,
];
export function writeAllowedOffline(url = '') {
    return WRITE_ALLOWED_OFFLINE.some((re) => re.test(String(url).split('?')[0]));
}
