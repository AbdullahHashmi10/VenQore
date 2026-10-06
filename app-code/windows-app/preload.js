'use strict';
/**
 * VenQore Station — bridge for the cloud POS page (window.amdAPI).
 * Every v2 method keeps its name and return shape; v3 adds hardware status,
 * silent document printing, the customer display and the pole display.
 * Runs sandboxed: only contextBridge + ipcRenderer, no Node.
 */
const { contextBridge, ipcRenderer } = require('electron');

const listen = (channel) => (cb) => {
    if (typeof cb !== 'function') return () => {};
    const fn = (_e, v) => { try { cb(v); } catch (err) { console.error('[amdAPI]', channel, err); } };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
};

const api = {
    // ── Identity ─────────────────────────────────────────────
    check: () => ipcRenderer.invoke('amd:check'),
    registerTerminal: (terminalId) => ipcRenderer.send('amd:register-terminal', { terminalId }),
    getPrefs: () => ipcRenderer.invoke('amd:get-prefs'),
    savePrefs: (updates) => ipcRenderer.invoke('amd:save-prefs', updates),

    // ── Printing ─────────────────────────────────────────────
    /** { content, printerName?, copies?, paperWidth?, autoCut?, openDrawer? } → { success, error?, mode } */
    print: (data) => ipcRenderer.invoke('amd:print', data),
    /** Silent A4/Letter document print: { html, printerName?, pageSize?, copies?, landscape? } */
    printHtml: (data) => ipcRenderer.invoke('amd:print-html', data),
    openDrawer: (printerName) => ipcRenderer.invoke('amd:drawer', printerName || null),
    getPrinters: () => ipcRenderer.invoke('amd:printers'),
    setDefaultPrinter: (name) => ipcRenderer.invoke('amd:set-printer', name),
    testPrint: (printerName) => ipcRenderer.invoke('amd:test-print', printerName || null),
    getPrintHistory: () => ipcRenderer.invoke('amd:print-history'),
    getPrintRoles: () => ipcRenderer.invoke('amd:print-roles'),

    // ── Live hardware status ─────────────────────────────────
    getHardwareStatus: () => ipcRenderer.invoke('amd:hardware-status'),
    onHardwareStatus: listen('amd:hardware-status'),
    onConnectionChange: listen('amd:connection'),

    // ── Window ───────────────────────────────────────────────
    close: () => ipcRenderer.send('amd:window-close'),
    forceClose: () => ipcRenderer.send('amd:force-close'),
    reload: () => ipcRenderer.send('amd:window-reload'),
    openStationSettings: () => ipcRenderer.send('amd:open-settings'),
    openExternal: (url) => ipcRenderer.invoke('amd:open-external', url),
    onExitRequest: listen('amd:request-exit-auth'),

    // ── COM devices ──────────────────────────────────────────
    listSerialPorts: () => ipcRenderer.invoke('amd:serial-list'),
    openScanner: (portPath, baudRate = 9600) => ipcRenderer.invoke('amd:serial-open-scanner', { portPath, baudRate }),
    openScale: (portPath, baudRate = 9600) => ipcRenderer.invoke('amd:serial-open-scale', { portPath, baudRate }),
    closeSerial: (device) => ipcRenderer.invoke('amd:serial-close', device),
    onBarcodeScan: listen('amd:barcode-scan'),
    /** { weight (kg), value, unit, stable, raw } */
    onScaleReading: listen('amd:scale-reading'),
    getWeight: () => ipcRenderer.invoke('amd:scale-weight'),

    // ── Customer-facing displays ─────────────────────────────
    openCustomerDisplay: () => ipcRenderer.invoke('amd:customer-display-open'),
    closeCustomerDisplay: () => ipcRenderer.invoke('amd:customer-display-close'),
    /** { mode:'idle'|'cart'|'paid'|'message', storeName, currency, items:[{name,qty,price,total}], subtotal, discount, tax, total, paid, change, message } */
    updateCustomerDisplay: (state) => ipcRenderer.invoke('amd:customer-display-update', state),
    poleDisplay: (line1, line2) => ipcRenderer.invoke('amd:pole-display', { line1, line2 }),

    // ── Updates ──────────────────────────────────────────────
    onUpdateAvailable: listen('amd:update-available'),
    onUpdateProgress: listen('amd:update-progress'),
    onUpdateReady: listen('amd:update-ready'),
    downloadUpdate: () => ipcRenderer.send('amd:download-update'),
    installUpdate: () => ipcRenderer.send('amd:install-update'),
};

contextBridge.exposeInMainWorld('amdAPI', Object.freeze(api));

// Serial scanner in "event" mode (keyboard-wedge off): also raise a DOM event
// so code that listens on window (useBarcodeScannerPort) gets it.
ipcRenderer.on('amd:barcode-scan', (_e, code) => {
    window.dispatchEvent(new CustomEvent('amd:barcode-scan', { detail: code }));
});
ipcRenderer.on('amd:request-exit-auth', () => {
    window.dispatchEvent(new CustomEvent('amd:request-exit-auth'));
});

window.addEventListener('DOMContentLoaded', async () => {
    if (location.protocol === 'about:') return;
    let detail = { version: null };
    try { detail = await ipcRenderer.invoke('amd:check'); } catch {}
    window.dispatchEvent(new CustomEvent('amd-station-ready', { detail }));
});
