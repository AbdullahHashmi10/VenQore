'use strict';
/**
 * Bridge for the local Station shell (shell.html). v2 ran the shell with
 * nodeIntegration on and contextIsolation off — any script in the shell had
 * full Node. The shell now gets exactly these calls and nothing else.
 */
const { contextBridge, ipcRenderer } = require('electron');

const inv = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
const EVENTS = [
    'station:connection', 'station:sync', 'station:hardware', 'station:job', 'station:update',
    'station:close-request', 'station:command', 'station:pairing-required', 'station:offline-lock',
    'station:zoom', 'station:window', 'station:toast', 'station:guest', 'station:scan', 'station:weight',
    'station:devtools-request',
];

contextBridge.exposeInMainWorld('station', Object.freeze({
    state: inv('shell:state'),
    pair: inv('shell:pair'),
    linkStore: inv('shell:link-store'),
    disconnectStore: inv('shell:disconnect-store'),
    savePrefs: inv('shell:save-prefs'),
    verifyPin: inv('shell:verify-pin'),
    setPin: inv('shell:set-pin'),
    quit: inv('shell:quit'),
    relaunch: inv('shell:relaunch'),
    consent: inv('shell:consent'),

    printers: inv('shell:printers'),
    setDefaultPrinter: inv('amd:set-printer'),
    printRoles: inv('amd:print-roles'),
    setPrintRole: inv('shell:set-role'),
    setPrinterProfile: inv('shell:printer-profile'),
    addNetworkPrinter: inv('shell:network-printer-add'),
    removeNetworkPrinter: inv('shell:network-printer-remove'),
    testPrint: inv('amd:test-print'),
    openDrawer: inv('amd:drawer'),
    history: inv('amd:print-history'),
    hardware: inv('amd:hardware-status'),

    serialList: inv('amd:serial-list'),
    serialOpen: inv('shell:serial-open'),
    serialClose: inv('shell:serial-close'),
    poleTest: inv('shell:pole-test'),
    customerDisplayOpen: inv('amd:customer-display-open'),
    customerDisplayClose: inv('amd:customer-display-close'),

    checkUpdates: inv('shell:check-updates'),
    installUpdate: inv('shell:install-update'),
    zoom: inv('shell:zoom'),
    windowAction: inv('shell:window'),
    openLogs: inv('shell:open-logs'),
    openFile: inv('shell:open-file'),
    diagnostics: inv('shell:diagnostics'),
    clearCache: inv('shell:clear-cache'),
    devtools: inv('shell:devtools'),
    openExternal: inv('amd:open-external'),

    on(event, cb) {
        const ch = 'station:' + event;
        if (!EVENTS.includes(ch) || typeof cb !== 'function') return () => {};
        const fn = (_e, v) => cb(v);
        ipcRenderer.on(ch, fn);
        return () => ipcRenderer.removeListener(ch, fn);
    },
}));
