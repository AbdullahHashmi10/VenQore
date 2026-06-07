/**
 * VenQore Station - Preload Bridge (SaaS Edition)
 * Exposes ONLY hardware APIs to the cloud web page.
 * The cloud URL is sealed in main.js — this script does not expose it.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('amdAPI', {

    // ── Identity ───────────────────────────────────────────
    /** Returns { isAMDStation, version, deviceId, terminalId, platform } */
    check: () => ipcRenderer.invoke('amd:check'),

    /** Register this terminal's ID (sent by the cloud after login) */
    registerTerminal: (terminalId) => ipcRenderer.send('amd:register-terminal', { terminalId }),

    // ── Preferences (NOT the cloud URL) ───────────────────
    getPrefs:  ()        => ipcRenderer.invoke('amd:get-prefs'),
    savePrefs: (updates) => ipcRenderer.invoke('amd:save-prefs', updates),

    // ── Printing ───────────────────────────────────────────
    print:           (data)        => ipcRenderer.invoke('amd:print', data),
    openDrawer:      (printerName) => ipcRenderer.invoke('amd:drawer', printerName),
    getPrinters:     ()            => ipcRenderer.invoke('amd:printers'),
    setDefaultPrinter: (name)      => ipcRenderer.invoke('amd:set-printer', name),
    testPrint:       ()            => ipcRenderer.invoke('amd:test-print'),

    // ── File Browser (for hardware setup) ──────────────────
    browseFile: (opts) => ipcRenderer.invoke('amd:browse-file', opts),

    // ── Window Controls ────────────────────────────────────
    close:      () => ipcRenderer.send('amd:window-close'),
    forceClose: () => ipcRenderer.send('amd:force-close'),
    reload:     () => ipcRenderer.send('amd:window-reload'),

    // ── Exit gate (web app sends back auth result) ─────────
    onExitRequest: (cb) => {
        const fn = (_e, v) => cb(v);
        ipcRenderer.on('amd:request-exit-auth', fn);
        return () => ipcRenderer.removeListener('amd:request-exit-auth', fn);
    },

    // ── COM Port: Scanner ──────────────────────────────────
    listSerialPorts: ()                        => ipcRenderer.invoke('amd:serial-list'),
    openScanner:     (portPath, baudRate=9600) => ipcRenderer.invoke('amd:serial-open-scanner', { portPath, baudRate }),
    openScale:       (portPath, baudRate=9600) => ipcRenderer.invoke('amd:serial-open-scale',   { portPath, baudRate }),
    closeSerial:     (device)                  => ipcRenderer.invoke('amd:serial-close', device),

    onBarcodeScan: (cb) => {
        const fn = (_e, b) => cb(b);
        ipcRenderer.on('amd:barcode-scan', fn);
        return () => ipcRenderer.removeListener('amd:barcode-scan', fn);
    },

    onScaleReading: (cb) => {
        const fn = (_e, d) => cb(d);
        ipcRenderer.on('amd:scale-reading', fn);
        return () => ipcRenderer.removeListener('amd:scale-reading', fn);
    },

    // ── Auto-Updater ───────────────────────────────────────
    onUpdateAvailable: (cb) => {
        const fn = (_e, i) => cb(i);
        ipcRenderer.on('amd:update-available', fn);
        return () => ipcRenderer.removeListener('amd:update-available', fn);
    },
    onUpdateProgress: (cb) => {
        const fn = (_e, p) => cb(p);
        ipcRenderer.on('amd:update-progress', fn);
        return () => ipcRenderer.removeListener('amd:update-progress', fn);
    },
    onUpdateReady: (cb) => {
        const fn = (_e, i) => cb(i);
        ipcRenderer.on('amd:update-ready', fn);
        return () => ipcRenderer.removeListener('amd:update-ready', fn);
    },
    downloadUpdate: () => ipcRenderer.send('amd:download-update'),
    installUpdate:  () => ipcRenderer.send('amd:install-update'),
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('[VenQore Station] Hardware bridge ready.');
    window.dispatchEvent(new CustomEvent('amd-station-ready', { detail: { version: '2.0.0' } }));
});
