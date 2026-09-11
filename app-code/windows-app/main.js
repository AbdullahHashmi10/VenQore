/**
 * VenQore Station - Electron Main Process
 * SaaS Cloud Edition — Hardware Bridge Only
 *
 * This application is a HARDWARE BRIDGE ONLY.
 * It contains NO website source code, NO database, NO PHP.
 * All business logic lives on the VenQore cloud servers.
 *
 * Anti-tamper: The cloud URL is sealed at compile time.
 * Device fingerprinting prevents license transfer.
 *
 * v2.0.0 — Cloud/SaaS Edition
 */

const {
    app, BrowserWindow, ipcMain, Menu, Tray,
    nativeImage, dialog, shell
} = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const { PosPrinter } = require('electron-pos-printer');
const { autoUpdater } = require('electron-updater');

// ─── SEALED CLOUD CONFIG (NOT USER EDITABLE) ─────────────────────────────────
// This URL is the ONLY endpoint this application will ever load.
// Changing this requires rebuilding the application from source.
// In dev mode (launched with --dev), we connect to the local Laravel server.
const CLOUD_URL = process.argv.includes('--dev')
    ? 'http://127.0.0.1:8000'
    : 'https://app.venqore.com';
const APP_NAME  = 'VenQore Station';
const APP_VER   = app.getVersion();

// ─── SEC-06 (2026-09-10): ORIGIN BOUNDARY ─────────────────────────────────────
// The hardware bridge (printer, cash drawer, serial ports, prefs) must only be
// reachable from the sealed VenQore origin, and only from the top-level frame.
// Any other page — a redirect, a popup, an injected iframe — gets nothing.
const TRUSTED_ORIGIN = new URL(CLOUD_URL).origin;

function originOf(url) {
    try { return new URL(url).origin; } catch { return null; }
}

function isTrustedUrl(url) {
    return originOf(url) === TRUSTED_ORIGIN;
}

/** True when the IPC comes from the local shell (shell.html in mainWindow). */
function isShellSender(event) {
    return !!(mainWindow && event.sender && event.sender.id === mainWindow.webContents.id
        && event.senderFrame && String(event.senderFrame.url || '').startsWith('file://'));
}

/** True when the IPC comes from the trusted cloud page's top-level frame. */
function isTrustedGuestSender(event) {
    const frame = event.senderFrame;
    if (!frame || !event.sender) return false;
    if (frame !== event.sender.mainFrame) return false; // no iframes
    return isTrustedUrl(frame.url);
}

function isAllowedSender(event) {
    return isShellSender(event) || isTrustedGuestSender(event);
}

/** ipcMain.handle with sender validation. */
function secureHandle(channel, handler) {
    ipcMain.handle(channel, (event, ...args) => {
        if (!isAllowedSender(event)) {
            console.warn(`[Security] Blocked ${channel} from ${event.senderFrame && event.senderFrame.url}`);
            return { success: false, error: 'Blocked: untrusted sender' };
        }
        return handler(event, ...args);
    });
}

/** ipcMain.on with sender validation. */
function secureOn(channel, handler) {
    ipcMain.on(channel, (event, ...args) => {
        if (!isAllowedSender(event)) {
            console.warn(`[Security] Blocked ${channel} from ${event.senderFrame && event.senderFrame.url}`);
            return;
        }
        handler(event, ...args);
    });
}

// Pref keys each kind of sender may write. Identity/credential keys are never writable over IPC.
const GUEST_WRITABLE_PREFS = ['defaultPrinter', 'scannerPort', 'scannerBaudRate', 'scalePort', 'scaleBaudRate'];
const NEVER_WRITABLE_PREFS = ['cloudUrl', 'deviceId', 'deviceSecret', 'terminalId', 'lastOnlineSyncAt'];

// Lock every webContents (webview guests, dual-screen window) to the trusted origin.
app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // Never open new Electron windows from web content. Plain https links
        // (help pages, payment portals) go to the system browser.
        if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
    });

    contents.on('will-navigate', (event, url) => {
        if (contents.getType() === 'webview' || contents.getType() === 'window') {
            if (url.startsWith('file://') && mainWindow && contents.id === mainWindow.webContents.id) return; // shell reload
            if (url === 'about:blank') return;
            if (!isTrustedUrl(url)) {
                event.preventDefault();
                console.warn(`[Security] Blocked navigation to ${url}`);
                if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
            }
        }
    });

    contents.on('will-redirect', (event, url) => {
        if (contents.getType() === 'webview' && url !== 'about:blank' && !isTrustedUrl(url)) {
            event.preventDefault();
            console.warn(`[Security] Blocked redirect to ${url}`);
        }
    });

    // Enforce safe settings on any <webview> the shell attaches.
    contents.on('will-attach-webview', (event, webPreferences, params) => {
        webPreferences.nodeIntegration = false;
        webPreferences.nodeIntegrationInSubFrames = false;
        webPreferences.contextIsolation = true;
        webPreferences.webSecurity = true;
        webPreferences.allowRunningInsecureContent = false;
        const expectedPreload = path.join(__dirname, 'preload.js');
        if (webPreferences.preload && path.resolve(String(webPreferences.preload).replace(/^file:\/\//, '')) !== path.resolve(expectedPreload)) {
            delete webPreferences.preload;
        }
        if (params.src && params.src !== 'about:blank' && !isTrustedUrl(params.src)) {
            console.warn(`[Security] Refused to attach webview for ${params.src}`);
            event.preventDefault();
        }
    });
});

// ─── GLOBALS ──────────────────────────────────────────────────────────────────
let mainWindow;
let tray;
let heartbeatInterval;
let activeSerialPorts = {};

// ─── GPU / COMPAT FIXES ───────────────────────────────────────────────────────
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-software-rasterizer');

// ─── SINGLE INSTANCE LOCK ─────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        console.log(`[${APP_NAME}] v${APP_VER} — Cloud Edition Starting...`);
        createWindow();
        setupTray();
        buildMenu();

        // Auto-updater: check silently after 10s
        if (!process.argv.includes('--dev')) {
            setupAutoUpdater();
        }
    });
}

// ─── CONFIGURATION (User preferences only — NO server URL) ───────────────────
const userDataPath = app.getPath('userData');
const configPath   = path.join(userDataPath, 'station-prefs.json');

let prefs = {
    terminalId:     null,        // Assigned by cloud after first login
    deviceId:       null,        // Machine fingerprint (generated once)
    defaultPrinter: null,
    scannerPort:    null,
    scannerBaudRate: 9600,
    scalePort:      null,
    scaleBaudRate:  9600,
    connectedStore: null,        // Connected store slug
    activityTrackingEnabled: false,
    lastOnlineSyncAt: new Date().toISOString(),
    exitPasscode:   "1234",      // Default manager passcode
};

function loadPrefs() {
    try {
        if (fs.existsSync(configPath)) {
            const saved = JSON.parse(fs.readFileSync(configPath));
            prefs = { ...prefs, ...saved };
        }
        // Generate device fingerprint once, store forever
        if (!prefs.deviceId) {
            prefs.deviceId = crypto.randomUUID();
            savePrefs({});
        }
    } catch (e) {
        console.error('[Prefs] Load failed:', e.message);
    }
}

function savePrefs(updates) {
    try {
        prefs = { ...prefs, ...updates };
        fs.writeFileSync(configPath, JSON.stringify(prefs, null, 2));
        return true;
    } catch (e) {
        console.error('[Prefs] Save failed:', e.message);
        return false;
    }
}

loadPrefs();

// ─── WINDOW CREATION ──────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: APP_NAME,
        frame: false,
        fullscreen: true,
        alwaysOnTop: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        backgroundColor: '#020617',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            // Sessions persist across restarts — user stays logged in
            partition: 'persist:venqore_cloud'
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'shell.html'));

    // DevTools shortcut (Ctrl+Shift+Alt+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.alt && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    });

    // BLOCK UNAUTHORIZED CLOSE
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.webContents.send('amd:request-close-check');
        }
    });

    // RENDERER CRASH → AUTO RECOVER
    mainWindow.webContents.on('render-process-gone', () => {
        console.error('[CRASH] Renderer gone — respawning...');
        setTimeout(() => { if (mainWindow) mainWindow.reload(); }, 1000);
    });

    // Check offline limit gate (7 Days)
    const lastSync = new Date(prefs.lastOnlineSyncAt || new Date());
    const daysOffline = (new Date() - lastSync) / (1000 * 60 * 60 * 24);
    if (daysOffline > 7) {
        console.warn(`[Station] Offline limit exceeded: ${daysOffline.toFixed(1)} days.`);
        setTimeout(() => {
            if (mainWindow) mainWindow.webContents.send('status:offline-lock', { days: Math.floor(daysOffline) });
        }, 1500);
    }

    // Start monitoring after window is ready
    startConnectionMonitor();
    startHeartbeat();
    initTrackingListeners();

    console.log(`[${APP_NAME}] Kiosk locked → ${CLOUD_URL}`);
}

// ─── TRAY ─────────────────────────────────────────────────────────────────────
function setupTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    tray = new Tray(nativeImage.createFromPath(iconPath));
    const menu = Menu.buildFromTemplate([
        { label: APP_NAME, enabled: false },
        { type: 'separator' },
        { label: 'Show',    click: () => mainWindow.show() },
        { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
        { type: 'separator' },
        { label: 'Quit',    click: () => { app.isQuitting = true; app.quit(); } }
    ]);
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(menu);
    tray.on('double-click', () => mainWindow.show());
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function buildMenu() {
    const template = [
        {
            label: 'Station',
            submenu: [
                { label: 'Settings', click: () => mainWindow.webContents.send('amd:open-settings') },
                { type: 'separator' },
                { label: 'Restart Station', click: () => { app.relaunch(); app.exit(0); } },
                { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
            ]
        },
        {
            label: 'Hardware',
            submenu: [
                { label: 'Test Printer',      click: () => testPrint() },
                { label: 'Test Cash Drawer',  click: () => kickDrawer() },
                { label: 'Printer Settings',  click: () => mainWindow.webContents.send('amd:open-settings') }
            ]
        },
        {
            label: 'Updates',
            submenu: [
                { label: 'Check for Updates', click: () => autoUpdater.checkForUpdatesAndNotify() }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── HEARTBEAT ────────────────────────────────────────────────────────────────
/** SEC-04: attach this terminal's device credential when we have one. */
function deviceHeaders(base = {}) {
    return prefs.deviceSecret ? { ...base, 'X-Device-Secret': prefs.deviceSecret } : base;
}

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 60000);
}

async function sendHeartbeat(pairingCode = null) {
    if (!prefs.connectedStore) return { ok: false, error: 'No store linked.' }; // Not yet linked to a store
    try {
        const payload = {
            terminal_id: prefs.terminalId,
            device_id: prefs.deviceId,
            store_slug: prefs.connectedStore,
            version: APP_VER,
            status: 'OPEN'
        };
        if (pairingCode) payload.pairing_token = pairingCode;
        const res = await fetch(`${CLOUD_URL}/api/heartbeat`, {
            method: 'POST',
            headers: deviceHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (mainWindow && (err.code === 'PAIRING_REQUIRED' || err.code === 'DEVICE_AUTH_FAILED')) {
                mainWindow.webContents.send('status:pairing-required', { code: err.code });
            }
            return { ok: false, status: res.status, code: err.code, error: err.error || `Server answered ${res.status}` };
        }
        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            // SEC-04: the server returns a device secret exactly once (pairing,
            // or first heartbeat after upgrade). Keep it; send it on every call.
            if (typeof data.device_secret === 'string' && data.device_secret.length >= 32) {
                savePrefs({ deviceSecret: data.device_secret });
            }
            if (data.terminal_id && data.terminal_id !== prefs.terminalId) {
                savePrefs({ terminalId: data.terminal_id });
                console.log(`[Station] Registered terminal ID from server: ${data.terminal_id}`);
            }
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (mainWindow) mainWindow.webContents.send('status:sync', now);
            savePrefs({ lastOnlineSyncAt: new Date().toISOString() });
            return { ok: true };
        }
    } catch (e) {
        // Internet may be down
        return { ok: false, error: 'Could not reach VenQore. Check the internet connection.' };
    }
}

// ─── IPC: PAIRING (shell only) ────────────────────────────────────────────────
// The local shell sends the store slug + one-time pairing code; we link the
// store and send the first heartbeat carrying the code. An already-paired
// terminal (it holds a device secret) can re-link without a code.
ipcMain.handle('amd:pair', async (event, { slug, code } = {}) => {
    if (!isShellSender(event)) return { ok: false, error: 'Blocked: untrusted sender' };
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,63}$/i.test(slug)) return { ok: false, error: 'That store slug is not valid.' };
    const cleanCode = typeof code === 'string' ? code.trim().toUpperCase().replace(/\s+/g, '') : '';
    if (!prefs.deviceSecret && !cleanCode) return { ok: false, error: 'Enter the pairing code from Settings → Terminals.' };

    const previousStore = prefs.connectedStore;
    savePrefs({ connectedStore: slug.toLowerCase() });
    const result = await sendHeartbeat(cleanCode || null);
    if (!result || !result.ok) {
        savePrefs({ connectedStore: previousStore || null });
        const msg = result && result.code === 'PAIRING_REQUIRED'
            ? 'That pairing code is not valid for this store, or it has expired. Create a new one in Settings → Terminals.'
            : (result && result.status === 403 ? 'This terminal belongs to a different store.' : (result && result.error) || 'Pairing failed.');
        return { ok: false, error: msg };
    }
    startHeartbeat();
    return { ok: true };
});

// ─── CONNECTION MONITOR ───────────────────────────────────────────────────────
function startConnectionMonitor() {
    setInterval(async () => {
        if (!mainWindow) return;

        // Check internet via socket probe matching CLOUD_URL
        let isOnline = false;
        try {
            const cloudUrlObj = new URL(CLOUD_URL);
            const host = cloudUrlObj.hostname;
            const port = parseInt(cloudUrlObj.port) || (cloudUrlObj.protocol === 'https:' ? 443 : 80);

            await new Promise((resolve, reject) => {
                const s = new net.Socket();
                s.setTimeout(1500);
                s.on('connect', () => { s.destroy(); resolve(); });
                s.on('error',   () => { s.destroy(); reject();  });
                s.on('timeout', () => { s.destroy(); reject();  });
                s.connect(port, host);
            });
            isOnline = true;
        } catch {
            isOnline = false;
        }

        mainWindow.webContents.send('status:connection', { online: isOnline });

        if (isOnline) {
            savePrefs({ lastOnlineSyncAt: new Date().toISOString() });
            syncActivityLogsToServer().catch(() => {});
        }

        // Check printers
        try {
            const printers = await mainWindow.webContents.getPrintersAsync();
            const active = printers.find(p => p.name === prefs.defaultPrinter)
                         || printers.find(p => p.isDefault)
                         || printers[0];
            if (active) mainWindow.webContents.send('status:printer', active.displayName || active.name);
        } catch {}

    }, 5000);
}

// ─── IPC: SHELL CONTROLS ──────────────────────────────────────────────────────
secureOn('amd:window-close',  () => {
    if (mainWindow) mainWindow.close();
});
secureOn('amd:force-close',   () => quitApp());
secureOn('amd:confirm-close', () => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Cancel', 'Exit Station'],
        defaultId: 1,
        title: 'Exit VenQore Station',
        message: 'Are you sure you want to close VenQore Station?',
        detail: 'This will disconnect the hardware printer and scale bridge.'
    });
    if (choice === 1) {
        quitApp();
    }
});
secureOn('amd:window-reload', () => mainWindow.webContents.send('amd:reload-app'));

// ─── IPC: CLOUD URL (Read-Only) ───────────────────────────────────────────────
secureHandle('amd:get-cloud-url', () => CLOUD_URL);

// ─── IPC: PREFS (User preferences, NOT the cloud URL) ─────────────────────────
secureHandle('amd:get-prefs', (event) => {
    // SEC-06: never hand credentials to web content.
    const { deviceSecret, exitPasscode, ...safe } = prefs;
    const out = { ...safe, cloudUrl: CLOUD_URL, appVersion: APP_VER };
    if (isShellSender(event)) out.exitPasscode = exitPasscode; // local shell only (exit gate)
    out.hasDeviceSecret = !!deviceSecret;
    return out;
});

secureHandle('amd:save-prefs', (event, updates) => {
    if (!updates || typeof updates !== 'object') return { success: false };
    const fromShell = isShellSender(event);
    const clean = {};
    for (const [k, v] of Object.entries(updates)) {
        if (NEVER_WRITABLE_PREFS.includes(k)) continue;
        if (!fromShell && !GUEST_WRITABLE_PREFS.includes(k)) continue; // cloud page: hardware prefs only
        if (k === 'connectedStore' && v !== null && !/^[a-z0-9-]{1,63}$/i.test(String(v))) continue;
        clean[k] = v;
    }
    return { success: savePrefs(clean) };
});

// Store terminal ID assigned by cloud (sent via the web page postMessage → IPC)
secureOn('amd:register-terminal', (event, { terminalId }) => {
    if (terminalId && !isNaN(terminalId)) {
        savePrefs({ terminalId: parseInt(terminalId) });
        startHeartbeat();
        console.log(`[Station] Terminal registered: ID ${terminalId}`);
    }
});

// ─── IPC: IDENTITY (for the web app to identify this device) ──────────────────
secureHandle('amd:check', () => ({
    isAMDStation: true,
    version: APP_VER,
    deviceId: prefs.deviceId,
    terminalId: prefs.terminalId,
    platform: process.platform
}));

// ─── IPC: HARDWARE — PRINTING ─────────────────────────────────────────────────
async function printReceipt(data) {
    const options = {
        preview: false,
        type: 'epson',
        width: data.paperWidth || '80mm',
        margin: '0 0 0 0',
        copies: data.copies || 1,
        printerName: data.printerName || prefs.defaultPrinter,
        timeOutPerLine: 400,
        silent: true,
        pageSize: { width: 80000, height: 297000 }
    };
    try {
        await PosPrinter.print(data.content, options);
        return { success: true };
    } catch (e) {
        console.error('[Print]', e.message);
        return { success: false, error: e.message };
    }
}

function kickDrawer(printerName) {
    try {
        PosPrinter.print([{ type: 'text', value: '' }], {
            preview: false, width: '80mm', copies: 1,
            printerName: printerName || prefs.defaultPrinter,
            silent: true
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function getPrinters() {
    const list = await mainWindow.webContents.getPrintersAsync();
    return list.map(p => ({
        name: p.name, displayName: p.displayName,
        isDefault: p.isDefault, status: p.status
    }));
}

async function testPrint() {
    return printReceipt({
        content: [
            { type: 'text', value: APP_NAME,               style: { fontWeight: '700', textAlign: 'center', fontSize: '18px' } },
            { type: 'text', value: 'Hardware Test Print',  style: { textAlign: 'center' } },
            { type: 'text', value: `v${APP_VER}`,          style: { textAlign: 'center', fontSize: '11px' } },
            { type: 'text', value: '----------------',     style: { textAlign: 'center' } },
            { type: 'text', value: 'Printer OK ✓',         style: { textAlign: 'center', fontWeight: '700' } },
        ]
    });
}

secureHandle('amd:print',       async (e, d) => {
    if (!d || !Array.isArray(d.content) || d.content.length > 500) return { success: false, error: 'Invalid print payload' };
    if (d.copies && (!Number.isInteger(d.copies) || d.copies < 1 || d.copies > 5)) return { success: false, error: 'Invalid copies' };
    return printReceipt(d);
});
secureHandle('amd:drawer',      async (e, p) => kickDrawer(p));
secureHandle('amd:printers',    async ()    => getPrinters());
secureHandle('amd:set-printer', async (e, name) => { savePrefs({ defaultPrinter: name }); return { success: true }; });
secureHandle('amd:test-print',  async ()    => testPrint());

// ─── IPC: OPEN EXTERNAL LINK ──────────────────────────────────────────────────
secureHandle('amd:open-external', async (event, url) => {
    try {
        // SEC-06: only web links — never file:, smb:, ms-*: or custom schemes.
        if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
            return { success: false, error: 'Only http(s) links can be opened.' };
        }
        await shell.openExternal(url);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ─── IPC: FILE BROWSER (for printer/COM port setup only) ──────────────────────
secureHandle('amd:browse-file', async (event, opts = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: opts.title || 'Select File',
        defaultPath: opts.defaultPath || 'C:\\',
        filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
        properties: ['openFile']
    });
    return result.canceled ? { path: null } : { path: result.filePaths[0] };
});

// ─── IPC: SERIAL / COM PORT ───────────────────────────────────────────────────
secureHandle('amd:serial-list', async () => {
    try {
        const { SerialPort } = require('serialport');
        return { success: true, ports: await SerialPort.list() };
    } catch (e) {
        return { success: false, error: e.message, ports: [] };
    }
});

const VALID_BAUD = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
function validSerial(portPath, baudRate) {
    return typeof portPath === 'string' && /^(COM\d{1,3}|\/dev\/tty[A-Za-z0-9._-]+)$/.test(portPath) && VALID_BAUD.includes(Number(baudRate));
}

secureHandle('amd:serial-open-scanner', async (event, { portPath, baudRate = 9600 } = {}) => {
    if (!validSerial(portPath, baudRate)) return { success: false, error: 'Invalid port or baud rate' };
    try {
        const { SerialPort } = require('serialport');
        const { ReadlineParser } = require('@serialport/parser-readline');
        if (activeSerialPorts['scanner']) { try { activeSerialPorts['scanner'].close(); } catch {} }
        const port   = new SerialPort({ path: portPath, baudRate });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        port.on('error', e => console.error('[Scanner]', e.message));
        parser.on('data', d => { if (mainWindow) mainWindow.webContents.send('amd:barcode-scan', d.trim()); });
        activeSerialPorts['scanner'] = port;
        savePrefs({ scannerPort: portPath, scannerBaudRate: baudRate });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
});

secureHandle('amd:serial-open-scale', async (event, { portPath, baudRate = 9600 } = {}) => {
    if (!validSerial(portPath, baudRate)) return { success: false, error: 'Invalid port or baud rate' };
    try {
        const { SerialPort } = require('serialport');
        const { ReadlineParser } = require('@serialport/parser-readline');
        if (activeSerialPorts['scale']) { try { activeSerialPorts['scale'].close(); } catch {} }
        const port   = new SerialPort({ path: portPath, baudRate });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        port.on('error', e => console.error('[Scale]', e.message));
        parser.on('data', d => {
            const m = d.match(/[\d.]+/);
            if (m && mainWindow) mainWindow.webContents.send('amd:scale-reading', { weight: parseFloat(m[0]), raw: d.trim() });
        });
        activeSerialPorts['scale'] = port;
        savePrefs({ scalePort: portPath, scaleBaudRate: baudRate });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
});

secureHandle('amd:serial-close', async (event, device) => {
    if (device !== 'scanner' && device !== 'scale') return { success: false, error: 'Unknown device' };
    if (activeSerialPorts[device]) {
        try { activeSerialPorts[device].close(); delete activeSerialPorts[device]; return { success: true }; }
        catch (e) { return { success: false, error: e.message }; }
    }
    return { success: false, error: 'Not open' };
});

// ─── IPC: DUAL SCREEN ─────────────────────────────────────────────────────────
secureOn('amd:launch-dual-pos', () => {
    const { screen } = require('electron');
    const external = screen.getAllDisplays().find(d => d.bounds.x !== 0 || d.bounds.y !== 0);
    if (!external) {
        dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'Dual Screen',
            message: 'No second monitor detected.',
            buttons: ['OK']
        });
        return;
    }
    const win = new BrowserWindow({
        x: external.bounds.x, y: external.bounds.y,
        width: external.bounds.width, height: external.bounds.height,
        fullscreen: true, frame: false,
        webPreferences: {
            partition: 'persist:venqore_cloud',
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        }
    });
    win.loadURL(`${CLOUD_URL}/pos/display`);
});

// ─── IPC: UPDATER TRIGGERS ────────────────────────────────────────────────────
secureOn('amd:download-update', () => autoUpdater.downloadUpdate());
secureOn('amd:install-update',  () => { app.isQuitting = true; autoUpdater.quitAndInstall(false, true); });

// ─── AUTO-UPDATER ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
    autoUpdater.logger = console;
    autoUpdater.autoDownload = false;

    autoUpdater.on('update-available',  (i) => mainWindow?.webContents.send('amd:update-available',  { version: i.version }));
    autoUpdater.on('download-progress', (p) => mainWindow?.webContents.send('amd:update-progress',   { percent: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (i) => mainWindow?.webContents.send('amd:update-ready',      { version: i.version }));
    autoUpdater.on('error', e => console.error('[Updater]', e.message));

    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 10000);
}

// ─── QUIT ─────────────────────────────────────────────────────────────────────
async function quitApp() {
    for (const [, port] of Object.entries(activeSerialPorts)) {
        try { port.close(); } catch {}
    }
    try {
        if (prefs.terminalId) {
            await fetch(`${CLOUD_URL}/api/heartbeat`, {
                method: 'POST',
                headers: deviceHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ terminal_id: prefs.terminalId, device_id: prefs.deviceId, status: 'CLOSED_NORMALLY' })
            });
        }
    } catch {}
    app.isQuitting = true;
    app.quit();
}

app.on('before-quit', e => { if (!app.isQuitting) { e.preventDefault(); quitApp(); } });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
app.on('window-all-closed', () => { /* Intentional: prevent default quit */ });
process.on('uncaughtException', e => console.error('[FATAL]', e));

// ─── FOCUS LOSS & ENCRYPTED SCREENSHOT MONITORING ────────────────────────────
let blurTimer = null;
let blurStart = null;

function initTrackingListeners() {
    if (!mainWindow) return;

    mainWindow.on('blur', () => {
        if (!prefs.activityTrackingEnabled) return;
        blurStart = new Date();
        
        // Take screenshot after 5 seconds of focus loss
        blurTimer = setTimeout(async () => {
            await captureAndEncryptScreen();
            
            // Take screenshot every 15 minutes of away time
            blurTimer = setInterval(captureAndEncryptScreen, 15 * 60 * 1000);
        }, 5000);
    });
    
    mainWindow.on('focus', () => {
        if (blurTimer) {
            clearTimeout(blurTimer);
            clearInterval(blurTimer);
            blurTimer = null;
        }
        if (blurStart) {
            const duration = Math.floor((new Date() - blurStart) / 1000);
            if (duration >= 5) { // Log window shifts >= 5 seconds
                logActivity(blurStart.toISOString(), new Date().toISOString(), duration);
            }
            blurStart = null;
        }
    });

    // Sync activity logs and screenshots to the server every minute
    setInterval(syncActivityLogsToServer, 60000);
    // Initial sync check 5 seconds after startup
    setTimeout(syncActivityLogsToServer, 5000);
}

// Screenshot queue format v2: 'VQS2' | 12-byte IV | 16-byte tag | ciphertext.
const SHOT_MAGIC = Buffer.from('VQS2');
function screenshotKey() {
    if (!prefs.deviceSecret) return null;
    const crypto = require('crypto');
    return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(prefs.deviceSecret), Buffer.from('venqore-screenshot-v2'), Buffer.from(prefs.deviceId || ''), 32));
}
// Returns the PNG for a v2 queue file, or the raw bytes for an old-format
// file (the server still accepts the old format and re-encrypts it).
function screenshotUploadBytes(fileBuffer) {
    if (fileBuffer.length > 32 && fileBuffer.subarray(0, 4).equals(SHOT_MAGIC)) {
        const key = screenshotKey();
        if (!key) return null;
        const crypto = require('crypto');
        const iv = fileBuffer.subarray(4, 16), tag = fileBuffer.subarray(16, 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(fileBuffer.subarray(32)), decipher.final()]);
    }
    return fileBuffer;
}

async function captureAndEncryptScreen() {
    if (!prefs.activityTrackingEnabled) return null;
    try {
        const { desktopCapturer } = require('electron');
        const sources = await desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: 1280, height: 720 } 
        });
        const primarySource = sources[0];
        if (primarySource && primarySource.thumbnail) {
            const imgBuffer = primarySource.thumbnail.toPNG();
            
            // Local queue encryption (recheck SEC-04): AES-256-GCM with a key
            // derived from the server-issued device secret — not from the
            // device ID, which is not secret. Unpaired stations capture nothing.
            const crypto = require('crypto');
            const key = screenshotKey();
            if (!key) return null;
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            const body = Buffer.concat([cipher.update(imgBuffer), cipher.final()]);
            const encrypted = Buffer.concat([SHOT_MAGIC, iv, cipher.getAuthTag(), body]);
            
            // Write encrypted buffer to hidden folder
            const logsDir = path.join(app.getPath('userData'), 'station-logs', 'sys_data');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            const filename = `data_${Date.now()}_0x${crypto.randomBytes(4).toString('hex')}.bin`;
            fs.writeFileSync(path.join(logsDir, filename), encrypted);
            console.log(`[Tracking] Captured and encrypted active screen: ${filename}`);
            return filename;
        }
    } catch (e) {
        console.error('[Tracking] Screen capture failed:', e.message);
    }
    return null;
}

function logActivity(awayAt, backAt, duration) {
    try {
        const logsDir = path.join(app.getPath('userData'), 'station-logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const logFile = path.join(logsDir, 'activity.json');
        let logs = [];
        if (fs.existsSync(logFile)) {
            try { logs = JSON.parse(fs.readFileSync(logFile)); } catch {}
        }
        logs.push({ away_at: awayAt, back_at: backAt, duration_seconds: duration });
        if (logs.length > 200) logs.shift(); // Bound history size
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error('[Tracking] Log activity failed:', e.message);
    }
}

// ─── IPC: TRACKING LOGS INTERFACE ────────────────────────────────────────────
secureHandle('amd:get-activity-logs', async () => {
    try {
        const logFile = path.join(app.getPath('userData'), 'station-logs', 'activity.json');
        if (fs.existsSync(logFile)) {
            return { success: true, logs: JSON.parse(fs.readFileSync(logFile)) };
        }
    } catch {}
    return { success: true, logs: [] };
});

secureHandle('amd:clear-activity-logs', async () => {
    try {
        const logFile = path.join(app.getPath('userData'), 'station-logs', 'activity.json');
        if (fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, JSON.stringify([]));
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ─── DESKTOP SYNC SERVICE ───────────────────────────────────────────────────
async function syncActivityLogsToServer() {
    if (!prefs.activityTrackingEnabled) return;
    
    try {
        const logsDir = path.join(app.getPath('userData'), 'station-logs');
        const logFile = path.join(logsDir, 'activity.json');
        if (!fs.existsSync(logFile)) return;
        
        let logs = [];
        try {
            logs = JSON.parse(fs.readFileSync(logFile));
        } catch {
            return;
        }
        
        const unsynced = logs.filter(l => !l.synced);
        if (unsynced.length === 0) {
            await syncScreenshotsToServer();
            return;
        }
        
        const res = await fetch(`${CLOUD_URL}/api/terminal/activities`, {
            method: 'POST',
            headers: deviceHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
            body: JSON.stringify({
                device_id: prefs.deviceId,
                terminal_id: prefs.terminalId,
                store_slug: prefs.connectedStore,
                activities: unsynced
            })
        });
        
        if (res.ok) {
            logs.forEach(l => {
                if (!l.synced) l.synced = true;
            });
            fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
            console.log(`[Sync] Successfully synced ${unsynced.length} activity logs.`);
            await syncScreenshotsToServer();
        }
    } catch (e) {
        console.error('[Sync] Sync activity logs failed:', e.message);
    }
}

async function syncScreenshotsToServer() {
    const sysDataDir = path.join(app.getPath('userData'), 'station-logs', 'sys_data');
    if (!fs.existsSync(sysDataDir)) return;
    
    try {
        const files = fs.readdirSync(sysDataDir).filter(f => f.endsWith('.bin'));
        for (const file of files) {
            const filePath = path.join(sysDataDir, file);
            let uploadBytes;
            try {
                uploadBytes = screenshotUploadBytes(fs.readFileSync(filePath));
            } catch (e) {
                // Unreadable (e.g. the station was re-paired and the key changed): drop it.
                fs.unlinkSync(filePath);
                continue;
            }
            if (!uploadBytes) continue; // not paired yet — keep it for later

            // Sent as PNG over TLS on an authenticated call; the server encrypts it at rest.
            const fileBlob = new Blob([uploadBytes], { type: 'application/octet-stream' });
            
            const formData = new FormData();
            formData.append('device_id', prefs.deviceId);
            formData.append('store_slug', prefs.connectedStore);
            formData.append('file', fileBlob, file);
            
            const res = await fetch(`${CLOUD_URL}/api/terminal/screenshot`, {
                method: 'POST',
                headers: deviceHeaders({ 'Accept': 'application/json' }),
                body: formData
            });
            
            if (res.ok) {
                fs.unlinkSync(filePath);
                console.log(`[Sync] Successfully uploaded and removed local screenshot: ${file}`);
            }
        }
    } catch (e) {
        console.error('[Sync] Sync screenshots failed:', e.message);
    }
}
