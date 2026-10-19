/**
 * Is this page running inside the VenQore Station Windows app?
 * (preload.js exposes window.amdAPI, and main.js adds VenQoreStation/x.y.z to the user agent.)
 * Used to hide things that make no sense inside the app, such as "install this app".
 */
export function isStation() {
    if (typeof window === 'undefined') return false;
    if (window.amdAPI !== undefined) return true;
    return typeof navigator !== 'undefined' && /VenQoreStation\//.test(navigator.userAgent || '');
}
