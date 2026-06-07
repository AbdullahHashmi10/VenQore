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
function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 60000);
}

async function sendHeartbeat() {
    if (!prefs.connectedStore) return; // Not yet linked to a store
    try {
        const res = await fetch(`${CLOUD_URL}/api/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                terminal_id: prefs.terminalId,
                device_id: prefs.deviceId,
                store_slug: prefs.connectedStore,
                version: APP_VER,
                status: 'OPEN'
            })
        });
        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.terminal_id && data.terminal_id !== prefs.terminalId) {
                savePrefs({ terminalId: data.terminal_id });
                console.log(`[Station] Registered terminal ID from server: ${data.terminal_id}`);
            }
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (mainWindow) mainWindow.webContents.send('status:sync', now);
            savePrefs({ lastOnlineSyncAt: new Date().toISOString() });
        }
    } catch (e) {
        // Silently fail — internet may be down
    }
}

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
ipcMain.on('amd:window-close',  () => {
    if (mainWindow) mainWindow.close();
});
ipcMain.on('amd:force-close',   () => quitApp());
ipcMain.on('amd:confirm-close', () => {
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
ipcMain.on('amd:window-reload', () => mainWindow.webContents.send('amd:reload-app'));

// ─── IPC: CLOUD URL (Read-Only) ───────────────────────────────────────────────
ipcMain.handle('amd:get-cloud-url', () => CLOUD_URL);

// ─── IPC: PREFS (User preferences, NOT the cloud URL) ─────────────────────────
ipcMain.handle('amd:get-prefs', () => ({
    ...prefs,
    cloudUrl: CLOUD_URL,    // Read-only, informational only
    appVersion: APP_VER
}));

ipcMain.handle('amd:save-prefs', (event, updates) => {
    // SECURITY: Prevent overwriting the cloud URL via IPC
    delete updates.cloudUrl;
    delete updates.deviceId;  // Device ID is immutable
    return { success: savePrefs(updates) };
});

// Store terminal ID assigned by cloud (sent via the web page postMessage → IPC)
ipcMain.on('amd:register-terminal', (event, { terminalId }) => {
    if (terminalId && !isNaN(terminalId)) {
        savePrefs({ terminalId: parseInt(terminalId) });
        startHeartbeat();
        console.log(`[Station] Terminal registered: ID ${terminalId}`);
    }
});

// ─── IPC: IDENTITY (for the web app to identify this device) ──────────────────
ipcMain.handle('amd:check', () => ({
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

ipcMain.handle('amd:print',       async (e, d) => printReceipt(d));
ipcMain.handle('amd:drawer',      async (e, p) => kickDrawer(p));
ipcMain.handle('amd:printers',    async ()    => getPrinters());
ipcMain.handle('amd:set-printer', async (e, name) => { savePrefs({ defaultPrinter: name }); return { success: true }; });
ipcMain.handle('amd:test-print',  async ()    => testPrint());

// ─── IPC: OPEN EXTERNAL LINK ──────────────────────────────────────────────────
ipcMain.handle('amd:open-external', async (event, url) => {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// ─── IPC: FILE BROWSER (for printer/COM port setup only) ──────────────────────
ipcMain.handle('amd:browse-file', async (event, opts = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: opts.title || 'Select File',
        defaultPath: opts.defaultPath || 'C:\\',
        filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
        properties: ['openFile']
    });
    return result.canceled ? { path: null } : { path: result.filePaths[0] };
});

// ─── IPC: SERIAL / COM PORT ───────────────────────────────────────────────────
ipcMain.handle('amd:serial-list', async () => {
    try {
        const { SerialPort } = require('serialport');
        return { success: true, ports: await SerialPort.list() };
    } catch (e) {
        return { success: false, error: e.message, ports: [] };
    }
});

ipcMain.handle('amd:serial-open-scanner', async (event, { portPath, baudRate = 9600 }) => {
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

ipcMain.handle('amd:serial-open-scale', async (event, { portPath, baudRate = 9600 }) => {
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

ipcMain.handle('amd:serial-close', async (event, device) => {
    if (activeSerialPorts[device]) {
        try { activeSerialPorts[device].close(); delete activeSerialPorts[device]; return { success: true }; }
        catch (e) { return { success: false, error: e.message }; }
    }
    return { success: false, error: 'Not open' };
});

// ─── IPC: DUAL SCREEN ─────────────────────────────────────────────────────────
ipcMain.on('amd:launch-dual-pos', () => {
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
        webPreferences: { partition: 'persist:venqore_cloud' }
    });
    win.loadURL(`${CLOUD_URL}/pos/display`);
});

// ─── IPC: UPDATER TRIGGERS ────────────────────────────────────────────────────
ipcMain.on('amd:download-update', () => autoUpdater.downloadUpdate());
ipcMain.on('amd:install-update',  () => { app.isQuitting = true; autoUpdater.quitAndInstall(false, true); });

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
                headers: { 'Content-Type': 'application/json' },
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
            
            // Encrypt screen buffer using AES-256-CBC with Device ID key
            const crypto = require('crypto');
            const key = crypto.createHash('sha256').update(prefs.deviceId || 'venqore_fallback').digest();
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            const encrypted = Buffer.concat([iv, cipher.update(imgBuffer), cipher.final()]);
            
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
ipcMain.handle('amd:get-activity-logs', async () => {
    try {
        const logFile = path.join(app.getPath('userData'), 'station-logs', 'activity.json');
        if (fs.existsSync(logFile)) {
            return { success: true, logs: JSON.parse(fs.readFileSync(logFile)) };
        }
    } catch {}
    return { success: true, logs: [] };
});

ipcMain.handle('amd:clear-activity-logs', async () => {
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
            headers: { 'Content-Type': 'application/json' },
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
            const fileBuffer = fs.readFileSync(filePath);
            
            // Native Blob is available globally in newer Node.js/Electron versions
            const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });
            
            const formData = new FormData();
            formData.append('device_id', prefs.deviceId);
            formData.append('store_slug', prefs.connectedStore);
            formData.append('file', fileBlob, file);
            
            const res = await fetch(`${CLOUD_URL}/api/terminal/screenshot`, {
                method: 'POST',
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
