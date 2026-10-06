'use strict';
/**
 * VenQore Station 3 — Electron main process.
 *
 * Station is a hardware bridge for the VenQore cloud POS. It holds no business
 * logic: it shows the sealed VenQore origin and gives that page (and only that
 * page) receipt printers, the cash drawer, COM scanners and scales, a pole
 * display and a customer-facing second screen.
 *
 *   main.js            lifecycle, windows, IPC boundary, cloud heartbeat
 *   lib/printers.js    printer discovery, profiles, queues, ESC/POS vs driver
 *   lib/winspool.js    Windows spooler bridge (RAW jobs, status, default)
 *   lib/renderer.js    hidden Chromium surfaces that rasterise / print
 *   lib/serial.js      scanner, scale and pole display with hot-plug
 *   preload.js         window.amdAPI for the cloud page (backwards compatible)
 *   shell-preload.js   window.station for the local shell UI
 */

const {
    app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog, shell,
    session, screen, powerSaveBlocker, net, safeStorage,
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const netSock = require('net');

// Optional signed environment profile (see lib/env-profile.js). Settled before anything reads userData.
const PROFILE = (() => {
    try {
        const base = app.getPath('appData');
        const p = require('./lib/env-profile').load(path.join(base, 'VenQore Station'));
        if (p) app.setPath('userData', path.join(base, 'VenQore Station (profile)'));
        return p;
    } catch { return null; }
})();

const logger = require('./lib/logger');
const { Prefs } = require('./lib/prefs');
const { WinSpool } = require('./lib/winspool');
const { PrinterService } = require('./lib/printers');
const { SerialManager } = require('./lib/serial');
const renderer = require('./lib/renderer');

// ─── SEALED CLOUD ORIGIN ──────────────────────────────────────────────────────
// The only site Station will load. Command-line flags cannot change it in an installed build.
const DEV = !app.isPackaged && process.argv.includes('--dev');
const TESTING = DEV || !!PROFILE;
// VenQore serves its public site AND the POS from one domain (no subdomains), so Station loads
// www.venqore.com and keeps the cashier inside the app (see isMarketingUrl).
const CLOUD_URL = PROFILE ? PROFILE.origin : DEV ? (process.env.VENQORE_DEV_URL || 'http://127.0.0.1:8000') : 'https://www.venqore.com';
const TRUSTED_ORIGIN = new URL(CLOUD_URL).origin;
// The bare domain redirects to www; both are ours.
const TRUSTED_ORIGINS = new Set(DEV || PROFILE ? [TRUSTED_ORIGIN] : [TRUSTED_ORIGIN, 'https://venqore.com']);
const PARTITION = 'persist:venqore_cloud';
const APP_NAME = 'VenQore Station';
const APP_VER = app.getVersion();
const PORTABLE = !!process.env.PORTABLE_EXECUTABLE_DIR;
const ASSETS = path.join(__dirname, 'assets');

// ─── BOOTSTRAP (before ready) ─────────────────────────────────────────────────
app.setAppUserModelId('com.venqore.station');
app.userAgentFallback = `${app.userAgentFallback} VenQoreStation/${APP_VER}`;
logger.install(path.join(app.getPath('userData'), 'logs'));
const prefs = new Prefs(app.getPath('userData'));
if (prefs.get('safeGraphics')) app.disableHardwareAcceleration();
// v2 passed --disable-software-rasterizer, which turns the window black on
// till PCs without a working GPU driver. Chromium's fallback is left alone.

const spool = new WinSpool(path.join(app.getPath('userData'), 'bin'));
const printers = new PrinterService({ prefs, spool });
const serial = new SerialManager();

let mainWindow = null;
let guest = null;            // the <webview> webContents showing the cloud POS
let displayWindow = null;    // customer-facing second screen
let displayState = null;
let tray = null;
let isQuitting = false;
let online = null;
let pinFailures = 0;
let pinLockedUntil = 0;
let keepAwakeId = null;
let gpuCrashes = 0;
// The pairing secret is the till's password to VenQore. Keep it encrypted with the Windows user's
// own key (DPAPI) instead of readable text in the prefs file.
const secretStore = {
    get() {
        try {
            const enc = prefs.get('deviceSecretEnc');
            if (enc && safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(Buffer.from(enc, 'base64'));
        } catch (e) { console.warn('[Security] Could not decrypt the device secret:', e.message); }
        return prefs.get('deviceSecret') || null;   // legacy / no key store available
    },
    set(v) {
        if (safeStorage.isEncryptionAvailable()) prefs.set({ deviceSecretEnc: safeStorage.encryptString(String(v)).toString('base64'), deviceSecret: null }, { immediate: true });
        else prefs.set({ deviceSecret: v }, { immediate: true });
    },
    has() { return !!(prefs.get('deviceSecretEnc') || prefs.get('deviceSecret')); },
    migrate() { const legacy = prefs.get('deviceSecret'); if (legacy && !prefs.get('deviceSecretEnc') && safeStorage.isEncryptionAvailable()) this.set(legacy); },
};
let updateState = { state: PORTABLE ? 'portable' : 'idle' };

const originOf = (u) => { try { return new URL(u).origin; } catch { return null; } };
const isTrustedUrl = (u) => TRUSTED_ORIGINS.has(originOf(u));
// Public marketing pages live on the same origin as the app. A till should never end up there
// (a logo click, a stray link). Customer receipts (/r/…) and the app (/s/…, /login…) are not on this list.
const MARKETING_ROOTS = new Set(['features', 'roadmap', 'solutions', 'compare', 'pricing', 'about', 'contact', 'vensynq', 'smartcapture',
    'documents', 'reckoner', 'ledger', 'blueprint', 'security', 'onboarding', 'dashboard-preview', 'pos', 'subscribe', 'digital-products',
    'partner-support', 'docs', 'blog', 'privacy', 'terms', 'next-dashboard', 'new-dashboard']);
function isMarketingUrl(u) {
    try {
        const url = new URL(u);
        if (!TRUSTED_ORIGINS.has(url.origin)) return false;
        const root = url.pathname.split('/').filter(Boolean)[0] || '';
        return root === '' || MARKETING_ROOTS.has(root.toLowerCase().replace(/\.html$/, ''));
    } catch { return false; }
}

// ─── IPC BOUNDARY ─────────────────────────────────────────────────────────────
function isShellSender(event) {
    return !!(mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents
        && event.senderFrame && event.senderFrame === event.sender.mainFrame
        && String(event.senderFrame.url || '').startsWith('file://'));
}
/** A popup the POS opened (print views): a window that is neither the shell, the customer display nor a render surface. */
const docWindows = new WeakSet();
function isDocWindow(wc) { return !!wc && docWindows.has(wc); }
function isGuestSender(event) {
    const f = event.senderFrame;
    return !!(f && event.sender && f === event.sender.mainFrame && isTrustedUrl(f.url)
        && (event.sender.getType() === 'webview' || isDocWindow(event.sender)));
}
function handle(channel, who, fn) {
    ipcMain.handle(channel, async (event, ...args) => {
        const ok = (who.includes('shell') && isShellSender(event)) || (who.includes('guest') && isGuestSender(event));
        if (!ok) {
            console.warn(`[Security] Blocked ${channel} from ${event.senderFrame && event.senderFrame.url}`);
            return { success: false, error: 'Blocked: untrusted sender' };
        }
        try { return await fn(event, ...args); }
        catch (e) { console.error(`[IPC] ${channel}:`, e); return { success: false, error: e.message }; }
    });
}
function on(channel, who, fn) {
    ipcMain.on(channel, (event, ...args) => {
        const ok = (who.includes('shell') && isShellSender(event)) || (who.includes('guest') && isGuestSender(event));
        if (!ok) return console.warn(`[Security] Blocked ${channel}`);
        try { fn(event, ...args); } catch (e) { console.error(`[IPC] ${channel}:`, e); }
    });
}
const toShell = (ch, payload) => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(ch, payload); };
const toGuest = (ch, payload) => { if (guest && !guest.isDestroyed()) guest.send(ch, payload); };

// ─── WEB CONTENTS HARDENING ───────────────────────────────────────────────────
app.on('web-contents-created', (_e, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // VenQore pages the POS opens in a new tab (invoice / report print views)
        // get a Station document window — same session, same hardware bridge —
        // instead of replacing the POS. Anything else goes to the system browser.
        if (isTrustedUrl(url) && contents.getType() !== 'browserView') {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 1100, height: 820, parent: mainWindow || undefined, autoHideMenuBar: true,
                    title: APP_NAME, icon: iconPath(process.platform === 'win32' ? 'icon.ico' : 'icon.png'), backgroundColor: '#F1F5F2',
                    webPreferences: {
                        partition: PARTITION, preload: path.join(__dirname, 'preload.js'), sandbox: true,
                        contextIsolation: true, nodeIntegration: false, spellcheck: false,
                    },
                },
            };
        }
        if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
    });
    contents.on('did-create-window', (win) => { docWindows.add(win.webContents); win.setMenu(null); });

    contents.on('will-navigate', (event, url) => {
        if (mainWindow && contents === mainWindow.webContents) {
            if (!url.startsWith('file://')) event.preventDefault();
            return;
        }
        if (contents.getType() !== 'webview' && !isDocWindow(contents)) return;
        if (url !== 'about:blank' && !isTrustedUrl(url)) {
            event.preventDefault();
            console.warn('[Security] Blocked navigation to', url);
            if (/^https:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
        }
    });

    contents.on('will-redirect', (event, url) => {
        if (contents.getType() === 'webview' && url !== 'about:blank' && !isTrustedUrl(url)) {
            event.preventDefault();
            console.warn('[Security] Blocked redirect to', url);
        }
    });

    contents.on('will-attach-webview', (event, webPreferences, params) => {
        webPreferences.preload = path.join(__dirname, 'preload.js'); // always ours, never the page's
        webPreferences.nodeIntegration = false;
        webPreferences.nodeIntegrationInSubFrames = false;
        webPreferences.contextIsolation = true;
        webPreferences.sandbox = true;
        webPreferences.webSecurity = true;
        webPreferences.allowRunningInsecureContent = false;
        webPreferences.spellcheck = false;           // red squiggles + CPU on every POS input
        webPreferences.backgroundThrottling = false; // timers keep running when minimised
        params.partition = PARTITION;
        if (params.src && params.src !== 'about:blank' && !isTrustedUrl(params.src)) {
            console.warn('[Security] Refused webview for', params.src);
            event.preventDefault();
        }
    });
});

// ─── SINGLE INSTANCE ──────────────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => showWindow());
    app.whenReady().then(start).catch(e => console.error('[Boot]', e));
}

async function start() {
    console.log(`[${APP_NAME}] v${APP_VER} starting (${DEV ? 'dev' : 'production'}, ${PORTABLE ? 'portable' : 'installed'}) → ${CLOUD_URL}`);
    Menu.setApplicationMenu(null);
    try { secretStore.migrate(); } catch (e) { console.warn('[Security] secret migration:', e.message); }
    configureSession();
    createWindow();
    setupTray();
    applySystemPrefs();
    printers.electronList = () => (mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getPrintersAsync() : Promise.resolve([]));

    // Warm the slow parts in the background so the first receipt is instant.
    setTimeout(() => {
        spool.start().catch(e => console.warn('[Spool] helper unavailable:', e.message));
        renderer.warm();
        printers.refreshStatus().then(autoPickPrinter).catch(() => {});
    }, 1500);

    reconnectSerialDevices();
    startConnectionMonitor();
    startHeartbeat();
    startStatusLoop();
    initTracking();
    if (!TESTING && !PORTABLE) setupAutoUpdater();
    setupDisplays();
}

function configureSession() {
    const ses = session.fromPartition(PARTITION);
    ses.setUserAgent(`${ses.getUserAgent()} VenQoreStation/${APP_VER}`);
    ses.setSpellCheckerEnabled(false);
    try { ses.preconnect({ url: CLOUD_URL, numSockets: 2 }); } catch {}

    const ALLOWED = new Set(['media', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen', 'geolocation', 'idle-detection', 'window-management']);
    ses.setPermissionRequestHandler((wc, permission, cb, details) => {
        const origin = originOf(details?.requestingUrl || wc.getURL());
        cb(TRUSTED_ORIGINS.has(originOf(origin)) && ALLOWED.has(permission));
    });
    ses.setPermissionCheckHandler((_wc, permission, origin) => TRUSTED_ORIGINS.has(originOf(origin)) && ALLOWED.has(permission));
    // Station owns the serial/HID devices; the page must use amdAPI.
    ses.on('select-serial-port', (e, _ports, _wc, cb) => { e.preventDefault(); cb(''); });
    ses.on('select-hid-device', (e, _d, cb) => { e.preventDefault(); cb(); });

    // Kiosk downloads: no save dialog hidden behind a fullscreen window.
    ses.on('will-download', (_e, item) => {
        const dir = app.getPath('downloads');
        const base = item.getFilename().replace(/[\\/:*?"<>|]/g, '_') || 'download';
        let target = path.join(dir, base);
        for (let i = 1; fs.existsSync(target) && i < 500; i++) {
            const ext = path.extname(base);
            target = path.join(dir, `${path.basename(base, ext)} (${i})${ext}`);
        }
        item.setSavePath(target);
        item.once('done', (_ev, state) => toShell('station:toast', state === 'completed'
            ? { type: 'success', message: `Saved to Downloads: ${path.basename(target)}`, action: { kind: 'open-file', path: target } }
            : { type: 'error', message: `Download ${state}: ${base}` }));
    });
}

// ─── WINDOW ───────────────────────────────────────────────────────────────────
function iconPath(name = 'icon.png') { return path.join(ASSETS, name); }

function createWindow() {
    const fullscreen = prefs.get('windowMode') !== 'windowed';
    const b = prefs.get('windowBounds');
    mainWindow = new BrowserWindow({
        width: b?.width || 1366, height: b?.height || 820, x: b?.x, y: b?.y,
        minWidth: 900, minHeight: 600,
        title: APP_NAME,
        frame: false,
        fullscreen,
        show: false,
        icon: iconPath(process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        backgroundColor: '#0C1211',
        webPreferences: {
            preload: path.join(__dirname, 'shell-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webviewTag: true,
            spellcheck: false,
            backgroundThrottling: false,
        },
    });
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.loadFile(path.join(__dirname, 'shell.html'));

    mainWindow.webContents.on('did-attach-webview', (_e, wc) => attachGuest(wc));
    mainWindow.webContents.on('before-input-event', (e, input) => shortcut(e, input));

    mainWindow.on('close', (e) => {
        if (isQuitting) return;
        e.preventDefault();
        requestClose('window');
    });
    const saveBounds = () => {
        if (!mainWindow || mainWindow.isFullScreen() || mainWindow.isMaximized() || mainWindow.isMinimized()) return;
        prefs.set({ windowBounds: mainWindow.getBounds() });
    };
    mainWindow.on('resize', saveBounds);
    mainWindow.on('move', saveBounds);
    for (const ev of ['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize']) {
        mainWindow.on(ev, () => toShell('station:window', windowState()));
    }

    mainWindow.webContents.on('render-process-gone', (_e, d) => {
        console.error('[Crash] shell renderer gone:', d.reason);
        if (!isQuitting) setTimeout(() => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload(), 800);
    });
    mainWindow.on('unresponsive', () => console.warn('[Shell] unresponsive'));
    // Windows shutdown / sign-out must never be blocked by the exit PIN.
    mainWindow.on('query-session-end', () => { isQuitting = true; });
    mainWindow.on('session-end', () => { isQuitting = true; prefs.flush(); });
}

function windowState() {
    if (!mainWindow || mainWindow.isDestroyed()) return {};
    return { fullscreen: mainWindow.isFullScreen(), maximized: mainWindow.isMaximized(), mode: prefs.get('windowMode') };
}

function showWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return createWindow();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
}

function attachGuest(wc) {
    guest = wc;
    guest.setZoomFactor(Number(prefs.get('zoom')) || 1);
    guest.on('before-input-event', (e, input) => shortcut(e, input));
    guest.on('render-process-gone', (_e, d) => {
        console.error('[Crash] POS page renderer gone:', d.reason);
        toShell('station:guest', { event: 'crashed', reason: d.reason });
        if (!isQuitting) setTimeout(() => { try { guest.reload(); } catch {} }, 1000);
    });
    let unresponsiveTimer = null;
    guest.on('unresponsive', () => {
        unresponsiveTimer = setTimeout(() => toShell('station:guest', { event: 'unresponsive' }), 8000);
    });
    guest.on('responsive', () => { clearTimeout(unresponsiveTimer); toShell('station:guest', { event: 'responsive' }); });
    // Belt and braces with will-navigate: every main-frame navigation of the
    // POS view must stay on the sealed origin. (Calling stop() from
    // did-start-navigation crashes Electron 44 — preventDefault here instead.)
    guest.on('will-frame-navigate', (details) => {
        if (details.isMainFrame && details.url !== 'about:blank' && !isTrustedUrl(details.url)) {
            details.preventDefault();
            console.warn('[Security] Blocked POS navigation to', details.url);
            if (/^https:\/\//i.test(details.url)) shell.openExternal(details.url).catch(() => {});
        }
    });
    const backToApp = () => setTimeout(() => { if (guest && !guest.isDestroyed()) guest.loadURL(`${CLOUD_URL}/login`).catch(() => {}); }, 0);
    guest.on('will-frame-navigate', (details) => {
        if (details.isMainFrame && isMarketingUrl(details.url)) { details.preventDefault(); console.warn('[Station] Marketing page blocked on the till:', details.url); backToApp(); }
    });
    guest.on('did-navigate-in-page', (_e, url, isMain) => { if (isMain && isMarketingUrl(url)) backToApp(); });
    guest.on('zoom-changed', (_e, dir) => setZoom((Number(prefs.get('zoom')) || 1) + (dir === 'in' ? 0.1 : -0.1)));
}

function setZoom(z) {
    const zoom = Math.max(0.6, Math.min(2, Math.round(Number(z) * 100) / 100 || 1));
    prefs.set({ zoom });
    if (guest && !guest.isDestroyed()) guest.setZoomFactor(zoom);
    toShell('station:zoom', zoom);
    return zoom;
}

/** Station shortcuts, from the shell or the POS page. */
function shortcut(e, input) {
    if (input.type !== 'keyDown') return;
    const k = String(input.key || '').toLowerCase();
    const ctrl = input.control || input.meta;
    const act = (fn) => { e.preventDefault(); fn(); };
    if (ctrl && input.shift && input.alt && k === 'i') return act(() => toShell('station:devtools-request', 'guest'));
    if (ctrl && input.shift && input.alt && k === 'j' && TESTING) return act(() => mainWindow.webContents.openDevTools({ mode: 'detach' }));
    if (ctrl && input.shift && !input.alt && k === 'r') return act(() => toShell('station:command', 'reload'));
    if (ctrl && input.shift && !input.alt && k === 's') return act(() => toShell('station:command', 'settings'));
    if (ctrl && input.shift && !input.alt && k === 'p') return act(() => toShell('station:command', 'privacy'));
    if (ctrl && !input.shift && !input.alt && (k === '=' || k === '+')) return act(() => setZoom((Number(prefs.get('zoom')) || 1) + 0.1));
    if (ctrl && !input.shift && !input.alt && k === '-') return act(() => setZoom((Number(prefs.get('zoom')) || 1) - 0.1));
    if (ctrl && !input.shift && !input.alt && k === '0') return act(() => setZoom(1));
    if (k === 'f11' && !input.shift && !ctrl) return act(() => mainWindow.setFullScreen(!mainWindow.isFullScreen()));
}

// ─── TRAY ─────────────────────────────────────────────────────────────────────
function setupTray() {
    try {
        const img = nativeImage.createFromPath(iconPath(process.platform === 'win32' ? 'icon.ico' : 'tray.png'));
        tray = new Tray(img.isEmpty() ? nativeImage.createFromPath(iconPath()) : img);
        tray.setToolTip(`${APP_NAME} ${APP_VER}`);
        const build = () => Menu.buildFromTemplate([
            { label: `${APP_NAME} ${APP_VER}`, enabled: false },
            { type: 'separator' },
            { label: 'Show Station', click: showWindow },
            { label: 'Station settings', click: () => { showWindow(); toShell('station:command', 'settings'); } },
            { label: 'Reload POS', click: () => toShell('station:command', 'reload') },
            { label: 'Print test page', click: () => printers.testPrint(null, APP_VER) },
            { label: 'Open cash drawer', click: () => printers.openDrawer(null) },
            { type: 'separator' },
            { label: 'Exit…', click: () => { showWindow(); requestClose('tray'); } },
        ]);
        tray.setContextMenu(build());
        tray.on('double-click', showWindow);
        tray.on('click', showWindow);
    } catch (e) { console.warn('[Tray]', e.message); }
}

// ─── SYSTEM PREFS ─────────────────────────────────────────────────────────────
function applySystemPrefs() {
    if (app.isPackaged && !PROFILE && process.platform === 'win32') {
        const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
        try { app.setLoginItemSettings({ openAtLogin: !!prefs.get('autoStart'), path: exe, args: ['--autostart'] }); } catch (e) { console.warn('[AutoStart]', e.message); }
    }
    if (prefs.get('keepAwake') && keepAwakeId === null) keepAwakeId = powerSaveBlocker.start('prevent-display-sleep');
    if (!prefs.get('keepAwake') && keepAwakeId !== null) { powerSaveBlocker.stop(keepAwakeId); keepAwakeId = null; }
}

app.on('child-process-gone', (_e, d) => {
    if (d.type !== 'GPU' || d.reason === 'clean-exit') return;
    gpuCrashes++;
    console.error('[GPU] process gone:', d.reason, `(${gpuCrashes})`);
    if (gpuCrashes >= 2 && !prefs.get('safeGraphics')) {
        console.error('[GPU] switching to safe graphics and restarting');
        prefs.set({ safeGraphics: true }, { immediate: true });
        isQuitting = true; app.relaunch(); app.exit(0);
    }
});

// ─── CLOSE / QUIT ─────────────────────────────────────────────────────────────
function requestClose(source) {
    if (isQuitting) return;
    toShell('station:close-request', {
        source,
        needPin: prefs.hasPin(),
        monitored: !!prefs.get('activityTrackingEnabled'),
    });
}

function pinGate(pin) {
    if (!prefs.hasPin()) return { ok: true };
    const now = Date.now();
    if (now < pinLockedUntil) return { ok: false, error: `Too many wrong PINs. Try again in ${Math.ceil((pinLockedUntil - now) / 1000)} s.`, locked: true };
    if (prefs.verifyPin(String(pin || ''))) { pinFailures = 0; return { ok: true }; }
    pinFailures++;
    if (pinFailures >= 5) { pinLockedUntil = now + 60_000; pinFailures = 0; console.warn('[Security] PIN locked after 5 failures'); }
    return { ok: false, error: 'Wrong PIN' };
}

async function quitApp() {
    if (isQuitting) return;
    isQuitting = true;
    console.log('[Station] quitting');
    try { await serial.closeAll(); } catch {}
    try {
        if (prefs.get('connectedStore')) {
            await cloudFetch('/api/heartbeat', {
                terminal_id: prefs.get('terminalId'), device_id: prefs.get('deviceId'),
                store_slug: prefs.get('connectedStore'), version: APP_VER, status: 'CLOSED_NORMALLY',
            }, 2500);
        }
    } catch {}
    prefs.flush();
    spool.stop();
    renderer.dispose();
    app.quit();
}

app.on('before-quit', (e) => { if (!isQuitting) { e.preventDefault(); requestClose('system'); } });
app.on('window-all-closed', () => { if (isQuitting) app.quit(); });
process.on('uncaughtException', (e) => console.error('[FATAL]', e));
process.on('unhandledRejection', (e) => console.error('[Unhandled]', e));

// ─── CLOUD CALLS ──────────────────────────────────────────────────────────────
/** Chromium's network stack: honours the shop's proxy settings, unlike Node fetch. */
async function cloudFetch(pathname, body, timeoutMs = 10000, raw = false) {
    const headers = { 'Accept': 'application/json' };
    if (!raw) headers['Content-Type'] = 'application/json';
    if (secretStore.has()) headers['X-Device-Secret'] = secretStore.get();
    return net.fetch(`${CLOUD_URL}${pathname}`, {
        method: 'POST', headers, body: raw ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
    });
}

let heartbeatTimer = null;
let heartbeatBusy = false;
function startHeartbeat() {
    clearInterval(heartbeatTimer);
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 60_000);
}

async function sendHeartbeat(pairingCode = null) {
    if (!prefs.get('connectedStore')) return { ok: false, error: 'No store linked.' };
    if (heartbeatBusy && !pairingCode) return { ok: false, error: 'busy' };
    heartbeatBusy = true;
    try {
        const payload = {
            terminal_id: prefs.get('terminalId'), device_id: prefs.get('deviceId'),
            store_slug: prefs.get('connectedStore'), version: APP_VER, status: 'OPEN',
            hostname: os.hostname(),
        };
        if (pairingCode) payload.pairing_token = pairingCode;
        const res = await cloudFetch('/api/heartbeat', payload);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            if (data.code === 'PAIRING_REQUIRED' || data.code === 'DEVICE_AUTH_FAILED') toShell('station:pairing-required', { code: data.code });
            return { ok: false, status: res.status, code: data.code, error: data.error || `Server answered ${res.status}` };
        }
        if (typeof data.device_secret === 'string' && data.device_secret.length >= 32) secretStore.set(data.device_secret);
        if (data.terminal_id && data.terminal_id !== prefs.get('terminalId')) prefs.set({ terminalId: data.terminal_id });
        markOnlineSync();
        toShell('station:sync', { at: new Date().toISOString(), paired: true });
        return { ok: true };
    } catch (e) {
        return { ok: false, error: 'Could not reach VenQore. Check the internet connection.' };
    } finally { heartbeatBusy = false; }
}

let lastSyncWrite = 0;
function markOnlineSync() {
    if (Date.now() - lastSyncWrite < 10 * 60_000) return;
    lastSyncWrite = Date.now();
    prefs.set({ lastOnlineSyncAt: new Date().toISOString() });
}

function offlineDays() {
    const t = Date.parse(prefs.get('lastOnlineSyncAt') || '');
    return Number.isFinite(t) ? (Date.now() - t) / 86_400_000 : 0;
}

// ─── CONNECTION MONITOR ───────────────────────────────────────────────────────
function probe() {
    const u = new URL(CLOUD_URL);
    const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80);
    return new Promise((resolve) => {
        const s = new netSock.Socket();
        const done = (v) => { s.destroy(); resolve(v); };
        s.setTimeout(2500);
        s.once('connect', () => done(true));
        s.once('error', () => done(false));
        s.once('timeout', () => done(false));
        s.connect(port, u.hostname);
    });
}

function startConnectionMonitor() {
    const tick = async () => {
        const now = net.isOnline() ? await probe() : false;
        if (now !== online) {
            online = now;
            console.log('[Net]', now ? 'online' : 'offline');
            toShell('station:connection', { online: now });
            toGuest('amd:connection', { online: now });
            pushHardware();
            if (now) sendHeartbeat();
        }
        if (now) { markOnlineSync(); syncActivityLogs().catch(() => {}); }
        const days = offlineDays();
        toShell('station:offline-lock', { locked: !now && days > 7, days: Math.floor(days), lastSync: prefs.get('lastOnlineSyncAt') });
        setTimeout(tick, now ? 10_000 : 4_000);
    };
    tick();
}

// ─── HARDWARE STATUS ──────────────────────────────────────────────────────────
let pushTimer = null;
let lastPrinterList = [];
function hardwareStatus() {
    const def = prefs.get('defaultPrinter');
    return {
        online,
        defaultPrinter: def,
        printRoles: printers.rolesView(),
        printers: lastPrinterList.map(p => ({
            name: p.name, displayName: p.displayName, kind: p.kind, state: p.state, status: p.status,
            isDefault: p.isDefault, isStationDefault: p.name === def, thermal: p.thermal, jobs: p.jobs,
        })),
        serial: serial.status(),
        customerDisplay: { open: !!(displayWindow && !displayWindow.isDestroyed()), screens: screen.getAllDisplays().length },
        version: APP_VER,
    };
}
function pushHardware() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        const s = hardwareStatus();
        toShell('station:hardware', s);
        toGuest('amd:hardware-status', s);
    }, 250);
}
function startStatusLoop() {
    printers.on('status', (list) => { lastPrinterList = list; pushHardware(); });
    printers.on('job', (job) => toShell('station:job', job));
    serial.on('status', pushHardware);
    const loop = async () => {
        try { await printers.refreshStatus(); } catch {}
        setTimeout(loop, 20_000);
    };
    setTimeout(loop, 4000);
}

/** First run: exactly one receipt printer installed → make it the default. */
function autoPickPrinter(list) {
    if (prefs.get('defaultPrinter')) return;
    const thermal = (list || []).filter(p => p.thermal && p.kind === 'windows');
    if (thermal.length === 1) {
        prefs.set({ defaultPrinter: thermal[0].name });
        console.log('[Printers] auto-selected receipt printer:', thermal[0].name);
        pushHardware();
    }
}

async function getPrinterList(force = false) {
    const list = await printers.list(force);
    lastPrinterList = list;
    return list.map(p => ({ name: p.name, displayName: p.displayName, isDefault: p.isDefault, status: p.status, state: p.state, kind: p.kind, thermal: p.thermal, driver: p.driver, port: p.port, profile: printers.profile(p.name) }));
}

// ─── SERIAL DEVICES ───────────────────────────────────────────────────────────
serial.devices.scanner.on('scan', (code) => {
    console.log('[Scanner] scan', code.length, 'chars');
    if (prefs.get('scannerWedge') !== false) typeIntoGuest(code, prefs.get('scannerSuffix'));
    else toGuest('amd:barcode-scan', code);
    toShell('station:scan', code);
});
serial.devices.scale.on('weight', (r) => {
    toGuest('amd:scale-reading', r);
    toShell('station:weight', r);
});

/** Make a COM scanner behave exactly like a USB keyboard-wedge scanner. */
function typeIntoGuest(code, suffix = 'enter') {
    if (!guest || guest.isDestroyed()) return;
    if (mainWindow && !mainWindow.isFocused()) mainWindow.focus();
    guest.focus();
    for (const ch of code) {
        const keyCode = ch === ' ' ? 'Space' : ch;
        guest.sendInputEvent({ type: 'keyDown', keyCode });
        guest.sendInputEvent({ type: 'char', keyCode });
        guest.sendInputEvent({ type: 'keyUp', keyCode });
    }
    if (suffix === 'tab' || suffix === 'enter') {
        const keyCode = suffix === 'tab' ? 'Tab' : 'Enter';
        guest.sendInputEvent({ type: 'keyDown', keyCode });
        guest.sendInputEvent({ type: 'char', keyCode: suffix === 'tab' ? '\t' : '\r' });
        guest.sendInputEvent({ type: 'keyUp', keyCode });
    }
}

async function reconnectSerialDevices() {
    const tasks = [];
    if (prefs.get('scannerPort')) tasks.push(serial.devices.scanner.open(prefs.get('scannerPort'), prefs.get('scannerBaudRate')));
    if (prefs.get('scalePort')) tasks.push(serial.devices.scale.open(prefs.get('scalePort'), prefs.get('scaleBaudRate'), { poll: prefs.get('scalePoll'), unit: prefs.get('scaleUnit') }));
    if (prefs.get('polePort')) tasks.push(serial.devices.pole.open(prefs.get('polePort'), prefs.get('poleBaudRate')).then(r => { if (r.success) serial.pole(prefs.get('poleIdleLine1'), prefs.get('poleIdleLine2')); return r; }));
    const results = await Promise.all(tasks);
    results.forEach(r => { if (!r.success) console.warn('[Serial] reconnect:', r.error); });
}

async function openSerial(kind, portPath, baudRate, opts = {}) {
    const dev = serial.devices[kind];
    if (!dev) return { success: false, error: 'Unknown device' };
    const res = await dev.open(portPath, baudRate, kind === 'scale' ? { poll: opts.poll || prefs.get('scalePoll'), unit: opts.unit || prefs.get('scaleUnit') } : {});
    if (res.success || dev.wanted) {
        const key = { scanner: 'scanner', scale: 'scale', pole: 'pole' }[kind];
        const upd = { [`${key}Port`]: portPath, [`${key}BaudRate`]: Number(baudRate) };
        if (kind === 'scale') { if (opts.poll) upd.scalePoll = opts.poll; if (opts.unit) upd.scaleUnit = opts.unit; }
        prefs.set(upd);
    }
    if (res.success && kind === 'pole') serial.pole(prefs.get('poleIdleLine1'), prefs.get('poleIdleLine2'));
    return res;
}

async function closeSerial(kind) {
    const dev = serial.devices[kind];
    if (!dev) return { success: false, error: 'Unknown device' };
    await dev.close(true);
    prefs.set({ [`${kind}Port`]: null });
    return { success: true };
}

// ─── CUSTOMER DISPLAY (second monitor) + POLE DISPLAY ─────────────────────────
function externalDisplay() {
    const primary = screen.getPrimaryDisplay();
    return screen.getAllDisplays().find(d => d.id !== primary.id) || null;
}

function openCustomerDisplay() {
    if (displayWindow && !displayWindow.isDestroyed()) { displayWindow.showInactive(); return { success: true }; }
    const ext = externalDisplay();
    if (!ext) return { success: false, error: 'No second screen detected. Connect the customer monitor and set Windows to "Extend these displays".' };
    displayWindow = new BrowserWindow({
        x: ext.bounds.x, y: ext.bounds.y, width: ext.bounds.width, height: ext.bounds.height,
        fullscreen: true, frame: false, focusable: false, skipTaskbar: true, show: false,
        backgroundColor: '#0C1211', icon: iconPath(),
        webPreferences: { preload: path.join(__dirname, 'display-preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
    });
    displayWindow.loadFile(path.join(__dirname, 'customer-display.html'));
    displayWindow.once('ready-to-show', () => { displayWindow.showInactive(); if (displayState) displayWindow.webContents.send('display:update', displayState); });
    displayWindow.on('closed', () => { displayWindow = null; pushHardware(); });
    pushHardware();
    return { success: true };
}

function closeCustomerDisplay() {
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.destroy();
    displayWindow = null;
    pushHardware();
    return { success: true };
}

const str = (v, n = 80) => (v === undefined || v === null ? '' : String(v).slice(0, n));
function cleanDisplayState(s = {}) {
    const items = Array.isArray(s.items) ? s.items.slice(-60).map(i => ({ name: str(i.name, 80), qty: str(i.qty, 12), price: str(i.price, 20), total: str(i.total, 20), note: str(i.note, 60) })) : [];
    return {
        mode: ['idle', 'cart', 'paid', 'message'].includes(s.mode) ? s.mode : (items.length ? 'cart' : 'idle'),
        storeName: str(s.storeName || '', 60), currency: str(s.currency, 8), items,
        subtotal: str(s.subtotal, 20), discount: str(s.discount, 20), tax: str(s.tax, 20), total: str(s.total, 20),
        paid: str(s.paid, 20), change: str(s.change, 20), message: str(s.message, 140),
        logo: typeof s.logo === 'string' && /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i.test(s.logo) && s.logo.length < 400_000 ? s.logo : null,
    };
}

function updateCustomerDisplay(state) {
    displayState = cleanDisplayState(state);
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.webContents.send('display:update', displayState);
    // Mirror onto a 2×20 pole display if one is connected.
    if (serial.devices.pole.connected) {
        const cur = displayState.currency ? displayState.currency + ' ' : '';
        if (displayState.mode === 'idle') serial.pole(prefs.get('poleIdleLine1'), prefs.get('poleIdleLine2'));
        else if (displayState.mode === 'paid') serial.pole(`PAID ${cur}${displayState.paid}`.slice(0, 20), `CHANGE ${cur}${displayState.change}`.slice(0, 20));
        else {
            const last = displayState.items[displayState.items.length - 1];
            const l1 = last ? `${last.name.slice(0, 12).padEnd(12)}${last.total.slice(-8).padStart(8)}` : '';
            serial.pole(l1, `TOTAL ${cur}${displayState.total}`.slice(0, 20));
        }
    }
    return { success: true };
}

function setupDisplays() {
    if (prefs.get('customerDisplayAuto')) setTimeout(() => openCustomerDisplay(), 2500);
    screen.on('display-added', () => { if (prefs.get('customerDisplayAuto')) setTimeout(openCustomerDisplay, 1500); pushHardware(); });
    screen.on('display-removed', () => { if (displayWindow && !externalDisplay()) closeCustomerDisplay(); pushHardware(); });
}

// ─── AUTO-UPDATER ─────────────────────────────────────────────────────────────
let autoUpdater = null;
function setUpdate(s) { updateState = { ...updateState, ...s }; toShell('station:update', updateState); }
function setupAutoUpdater() {
    try { ({ autoUpdater } = require('electron-updater')); } catch (e) { console.warn('[Updater] unavailable', e.message); return; }
    autoUpdater.logger = { info: (m) => console.log('[Updater]', m), warn: (m) => console.warn('[Updater]', m), error: (m) => console.error('[Updater]', m), debug: () => {} };
    autoUpdater.autoDownload = true;          // v2 never downloaded: autoDownload=false and nothing called download
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => setUpdate({ state: 'checking', error: null }));
    autoUpdater.on('update-not-available', () => setUpdate({ state: 'current', checkedAt: new Date().toISOString() }));
    autoUpdater.on('update-available', (i) => { setUpdate({ state: 'downloading', version: i.version, percent: 0 }); toGuest('amd:update-available', { version: i.version }); });
    autoUpdater.on('download-progress', (p) => { setUpdate({ state: 'downloading', percent: Math.round(p.percent) }); toGuest('amd:update-progress', { percent: Math.round(p.percent) }); });
    autoUpdater.on('update-downloaded', (i) => { setUpdate({ state: 'ready', version: i.version, percent: 100 }); toGuest('amd:update-ready', { version: i.version }); });
    autoUpdater.on('error', (e) => setUpdate({ state: 'error', error: String(e && e.message || e).split('\n')[0].slice(0, 160) }));
    setTimeout(checkUpdates, 20_000);
    setInterval(checkUpdates, 6 * 3600_000);
}
function checkUpdates() {
    if (!autoUpdater) return { success: false, error: PORTABLE ? 'The portable build updates manually — install the setup version for automatic updates.' : 'Updates are not available in this build.' };
    autoUpdater.checkForUpdates().catch(e => setUpdate({ state: 'error', error: e.message }));
    return { success: true };
}
function installUpdate() {
    if (!autoUpdater || updateState.state !== 'ready') return { success: false, error: 'No update is ready yet.' };
    isQuitting = true;
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return { success: true };
}

// ─── DIAGNOSTICS ──────────────────────────────────────────────────────────────
async function exportDiagnostics() {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Station diagnostics',
        defaultPath: path.join(app.getPath('desktop'), `venqore-station-diagnostics-${new Date().toISOString().slice(0, 10)}.json`),
        filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { success: false, canceled: true };
    const report = {
        generatedAt: new Date().toISOString(),
        station: { version: APP_VER, electron: process.versions.electron, chrome: process.versions.chrome, portable: PORTABLE, dev: DEV, cloud: CLOUD_URL },
        system: { platform: process.platform, release: os.release(), arch: process.arch, hostname: os.hostname(), cpus: os.cpus().length, memGB: Math.round(os.totalmem() / 1e9), uptimeH: Math.round(os.uptime() / 3600), displays: screen.getAllDisplays().map(d => ({ size: d.size, scale: d.scaleFactor })) },
        prefs: prefs.publicView(),
        hardware: hardwareStatus(),
        printers: await getPrinterList(true).catch(e => ({ error: e.message })),
        serialPorts: (await serial.list()).ports,
        jobs: printers.history,
        update: updateState,
        log: logger.recent(),
    };
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    shell.showItemInFolder(filePath);
    return { success: true, path: filePath };
}

// ══════════════════════════════════════════════════════════════════════════════
// IPC — CLOUD PAGE (window.amdAPI). Channel names are kept from v2.
// ══════════════════════════════════════════════════════════════════════════════
const GUEST_PREFS = ['defaultPrinter', 'scannerPort', 'scannerBaudRate', 'scalePort', 'scaleBaudRate'];

handle('amd:check', ['guest', 'shell'], () => ({
    isAMDStation: true, version: APP_VER, deviceId: prefs.get('deviceId'), terminalId: prefs.get('terminalId'),
    platform: process.platform, capabilities: ['escpos', 'raster', 'drawer', 'cut', 'network-printers', 'serial-scanner', 'scale', 'pole-display', 'customer-display', 'print-html', 'hardware-status', 'print-roles', 'printer-failover', 'label-size'],
}));
handle('amd:get-prefs', ['guest'], () => ({ ...prefs.publicView(), cloudUrl: CLOUD_URL, appVersion: APP_VER }));
handle('amd:save-prefs', ['guest'], (_e, updates) => {
    if (!updates || typeof updates !== 'object') return { success: false };
    const clean = {};
    for (const k of GUEST_PREFS) if (k in updates) clean[k] = updates[k];
    // The page may only name hardware, never free-form targets.
    if ('defaultPrinter' in clean && clean.defaultPrinter !== null) {
        const known = lastPrinterList.some(p => p.name === clean.defaultPrinter);
        if (typeof clean.defaultPrinter !== 'string' || !known) delete clean.defaultPrinter;
    }
    for (const k of ['scannerPort', 'scalePort']) if (k in clean && clean[k] !== null && !(typeof clean[k] === 'string' && /^(COM\d{1,3}|\/dev\/[\w.\-\/]{1,60})$/i.test(clean[k]))) delete clean[k];
    if ('scannerBaudRate' in clean) clean.scannerBaudRate = Number(clean.scannerBaudRate) || 9600;
    if ('scaleBaudRate' in clean) clean.scaleBaudRate = Number(clean.scaleBaudRate) || 9600;
    prefs.set(clean);
    pushHardware();
    return { success: true };
});
on('amd:register-terminal', ['guest'], (_e, { terminalId } = {}) => {
    const id = String(terminalId ?? '').trim();
    if (/^\d{1,12}$/.test(id) || /^[0-9a-f-]{36}$/i.test(id)) {
        prefs.set({ terminalId: /^\d+$/.test(id) ? Number(id) : id });
        startHeartbeat();
    }
});

// Printing
handle('amd:print', ['guest'], async (_e, d) => {
    if (!d || !Array.isArray(d.content) || d.content.length > 800) return { success: false, error: 'Invalid print payload' };
    // Store settings arrive as strings ("2"); v2 rejected those as "Invalid copies".
    const copies = Math.max(1, Math.min(5, Math.floor(Number(d.copies) || 1)));
    return printers.print({
        content: d.content, printerName: typeof d.printerName === 'string' && d.printerName ? d.printerName : null,
        role: typeof d.role === 'string' ? d.role : undefined,
        copies, paperWidth: d.paperWidth, autoCut: d.autoCut, openDrawer: d.openDrawer === true, label: str(d.label || 'Receipt', 40),
    });
});
handle('amd:print-html', ['guest'], (_e, d = {}) => printers.printHtml({
    html: d.html, printerName: typeof d.printerName === 'string' && d.printerName ? d.printerName : null, role: typeof d.role === 'string' ? d.role : undefined,
    pageSize: d.pageSize, copies: d.copies, landscape: d.landscape,
}));
// Which printer each kind of job goes to (read-only for the page; managers set it in Station settings)
handle('amd:print-roles', ['guest', 'shell'], () => printers.rolesView());
handle('shell:set-role', ['shell'], async (_e, { role, printer, fallback } = {}) => {
    const r = await printers.setRole(String(role || ''), { printer: printer || null, fallback: fallback || null });
    if (r.success) pushHardware();
    return r;
});
handle('amd:drawer', ['guest', 'shell'], (_e, printerName) => printers.openDrawer(typeof printerName === 'string' && printerName ? printerName : null));
handle('amd:printers', ['guest'], async () => (await getPrinterList()).map(({ profile, driver, port, ...p }) => p));
handle('amd:set-printer', ['guest', 'shell'], async (_e, name) => {
    if (name === null || name === '') { prefs.set({ defaultPrinter: null }); pushHardware(); return { success: true }; }
    const list = await printers.list(true);
    if (typeof name !== 'string' || !list.some(p => p.name === name)) return { success: false, error: 'Select an installed printer.' };
    prefs.set({ defaultPrinter: name });
    pushHardware();
    return { success: true };
});
handle('amd:test-print', ['guest', 'shell'], (_e, name) => printers.testPrint(typeof name === 'string' ? name : null, APP_VER));
handle('amd:print-history', ['guest', 'shell'], () => printers.history);
handle('amd:hardware-status', ['guest', 'shell'], () => hardwareStatus());

// Serial
handle('amd:serial-list', ['guest', 'shell'], () => serial.list());
handle('amd:serial-open-scanner', ['guest'], (_e, { portPath, baudRate = 9600 } = {}) => openSerial('scanner', portPath, baudRate));
handle('amd:serial-open-scale', ['guest'], (_e, { portPath, baudRate = 9600 } = {}) => openSerial('scale', portPath, baudRate));
handle('amd:serial-close', ['guest'], (_e, device) => closeSerial(device));
handle('amd:scale-weight', ['guest'], () => serial.devices.scale.last || null);

// Displays
handle('amd:customer-display-open', ['guest', 'shell'], () => openCustomerDisplay());
handle('amd:customer-display-close', ['guest', 'shell'], () => closeCustomerDisplay());
handle('amd:customer-display-update', ['guest'], (_e, s) => updateCustomerDisplay(s));
handle('amd:pole-display', ['guest', 'shell'], (_e, { line1, line2 } = {}) => serial.pole(str(line1, 40), str(line2, 40)));
on('amd:launch-dual-pos', ['guest'], () => openCustomerDisplay()); // v2 name

// Window / app
on('amd:window-close', ['guest'], () => requestClose('page'));
on('amd:force-close', ['guest'], () => quitApp()); // the page ran its own manager check
on('amd:window-reload', ['guest'], () => toShell('station:command', 'reload'));
on('amd:open-settings', ['guest'], () => toShell('station:command', 'settings'));
handle('amd:open-external', ['guest', 'shell'], async (_e, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return { success: false, error: 'Only http(s) links can be opened.' };
    await shell.openExternal(url);
    return { success: true };
});
on('amd:download-update', ['guest'], () => checkUpdates());
on('amd:install-update', ['guest'], () => installUpdate());
handle('amd:get-cloud-url', ['shell'], () => CLOUD_URL);

// ══════════════════════════════════════════════════════════════════════════════
// IPC — LOCAL SHELL (window.station)
// ══════════════════════════════════════════════════════════════════════════════
handle('shell:state', ['shell'], () => ({
    prefs: prefs.publicView(), cloudUrl: CLOUD_URL, version: APP_VER, platform: process.platform,
    portable: PORTABLE, dev: TESTING, profile: PROFILE ? { slug: PROFILE.slug } : null, online, update: updateState, window: windowState(),
    offline: { days: Math.floor(offlineDays()), lastSync: prefs.get('lastOnlineSyncAt') },
    hardware: hardwareStatus(), electron: process.versions.electron,
}));

handle('shell:pair', ['shell'], async (_e, { slug, code } = {}) => {
    slug = String(slug || '').trim().toLowerCase();
    const m = /\/s\/([a-z0-9-]{1,63})(\/|$)/i.exec(slug); // pasted a full POS link
    if (m) slug = m[1].toLowerCase();
    if (!/^[a-z0-9-]{1,63}$/.test(slug)) return { ok: false, error: 'That store link is not valid. Use the part after /s/ in your POS address.' };
    const cleanCode = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!secretStore.has() && !cleanCode) return { ok: false, error: 'Enter the pairing code from Settings → Terminals.' };
    const previous = prefs.get('connectedStore');
    prefs.set({ connectedStore: slug });
    const r = await sendHeartbeat(cleanCode || null);
    if (!r.ok) {
        prefs.set({ connectedStore: previous || null });
        const msg = r.code === 'PAIRING_REQUIRED' ? 'That pairing code is not valid for this store, or it has expired. Create a new one in Settings → Terminals.'
            : r.status === 403 ? 'This terminal belongs to a different store.'
                : r.status === 404 ? 'No store was found with that name.' : r.error || 'Pairing failed.';
        return { ok: false, error: msg };
    }
    startHeartbeat();
    return { ok: true, slug };
});

handle('shell:link-store', ['shell'], (_e, slug) => {
    // The page signed in directly: remember which store's POS it shows.
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,63}$/i.test(slug)) return { ok: false };
    if (prefs.get('connectedStore') && prefs.get('connectedStore') !== slug.toLowerCase() && secretStore.has()) return { ok: false, error: 'paired-elsewhere' };
    if (prefs.get('connectedStore') !== slug.toLowerCase()) { prefs.set({ connectedStore: slug.toLowerCase() }); sendHeartbeat(); }
    return { ok: true };
});

handle('shell:disconnect-store', ['shell'], (_e, { pin } = {}) => {
    const g = pinGate(pin); if (!g.ok) return { success: false, ...g };
    prefs.set({ connectedStore: null }, { immediate: true });
    return { success: true };
});

const SHELL_PREFS = {
    windowMode: v => ['fullscreen', 'windowed'].includes(v),
    autoStart: v => typeof v === 'boolean', keepAwake: v => typeof v === 'boolean', safeGraphics: v => typeof v === 'boolean',
    scannerWedge: v => typeof v === 'boolean', scannerSuffix: v => ['enter', 'tab', 'none'].includes(v),
    customerDisplayAuto: v => typeof v === 'boolean', theme: v => ['dark', 'light'].includes(v),
    poleIdleLine1: v => typeof v === 'string' && v.length <= 20, poleIdleLine2: v => typeof v === 'string' && v.length <= 20,
    lockSettings: v => typeof v === 'boolean', consentAccepted: v => typeof v === 'boolean',
    activityTrackingEnabled: v => typeof v === 'boolean',
};
handle('shell:save-prefs', ['shell'], (_e, updates = {}) => {
    const clean = {};
    for (const [k, v] of Object.entries(updates || {})) if (SHELL_PREFS[k] && SHELL_PREFS[k](v)) clean[k] = v;
    if (clean.activityTrackingEnabled === true && !prefs.hasPin()) return { success: false, error: 'Set a manager PIN before turning on monitoring.' };
    if (clean.activityTrackingEnabled === true && !prefs.get('activityTrackingEnabled')) clean.consentAccepted = false;
    const restartNeeded = 'safeGraphics' in clean && clean.safeGraphics !== prefs.get('safeGraphics');
    prefs.set(clean, { immediate: true });
    if ('windowMode' in clean && mainWindow) mainWindow.setFullScreen(clean.windowMode === 'fullscreen');
    if ('autoStart' in clean || 'keepAwake' in clean) applySystemPrefs();
    if (clean.customerDisplayAuto === true) openCustomerDisplay();
    return { success: true, restartNeeded, prefs: prefs.publicView() };
});

handle('shell:verify-pin', ['shell'], (_e, pin) => pinGate(pin));
handle('shell:set-pin', ['shell'], (_e, { current, next } = {}) => {
    const g = pinGate(current); if (!g.ok) return { success: false, ...g };
    if (next === null) {
        if (prefs.get('activityTrackingEnabled')) return { success: false, error: 'Turn off monitoring before removing the PIN.' };
        prefs.setPin(null); prefs.set({ lockSettings: false }, { immediate: true });
        return { success: true };
    }
    if (!/^\d{4,8}$/.test(String(next || ''))) return { success: false, error: 'Use 4 to 8 digits.' };
    if (next === '1234' || /^(\d)\1+$/.test(next)) return { success: false, error: 'Pick a PIN that is harder to guess.' };
    prefs.setPin(String(next));
    return { success: true };
});
handle('shell:quit', ['shell'], async (_e, { pin } = {}) => {
    const g = pinGate(pin); if (!g.ok) return { success: false, ...g };
    setImmediate(quitApp);
    return { success: true };
});
handle('shell:relaunch', ['shell'], (_e, { pin } = {}) => {
    const g = pinGate(pin); if (!g.ok) return { success: false, ...g };
    isQuitting = true; app.relaunch(); setTimeout(() => app.exit(0), 200);
    return { success: true };
});

// Printers
handle('shell:printers', ['shell'], (_e, force) => getPrinterList(!!force));
handle('shell:printer-profile', ['shell'], (_e, { name, profile } = {}) => typeof name === 'string' ? printers.setProfile(name, profile || {}) : null);
handle('shell:network-printer-add', ['shell'], async (_e, { label, host, port = 9100 } = {}) => {
    host = String(host || '').trim();
    if (!/^([a-z0-9-]+\.)*[a-z0-9-]+$|^\d{1,3}(\.\d{1,3}){3}$/i.test(host)) return { success: false, error: 'Enter the printer IP address, e.g. 192.168.1.50' };
    port = Number(port) || 9100;
    const list = (prefs.get('networkPrinters') || []).filter(n => !(n.host === host && Number(n.port) === port));
    list.push({ id: crypto.randomUUID(), label: String(label || '').slice(0, 40) || 'Network printer', host, port });
    prefs.set({ networkPrinters: list });
    printers.cache = null;
    const st = await require('./lib/netprinter').status(host, port);
    printers.refreshStatus().catch(() => {});
    return { success: true, name: `tcp://${host}:${port}`, status: st };
});
handle('shell:network-printer-remove', ['shell'], (_e, name) => {
    const list = (prefs.get('networkPrinters') || []).filter(n => `tcp://${n.host}:${n.port || 9100}` !== name);
    prefs.set({ networkPrinters: list });
    if (prefs.get('defaultPrinter') === name) prefs.set({ defaultPrinter: null });
    printers.cache = null;
    printers.refreshStatus().catch(() => {});
    return { success: true };
});

// Serial
handle('shell:serial-open', ['shell'], (_e, { kind, path: p, baudRate, poll, unit } = {}) => openSerial(kind, p, baudRate, { poll, unit }));
handle('shell:serial-close', ['shell'], (_e, kind) => closeSerial(kind));
handle('shell:pole-test', ['shell'], () => serial.pole('VenQore Station', 'Display OK'));

// Station
handle('shell:check-updates', ['shell'], () => checkUpdates());
handle('shell:install-update', ['shell'], () => installUpdate());
handle('shell:zoom', ['shell'], (_e, z) => setZoom(z));
handle('shell:window', ['shell'], (_e, action) => {
    if (!mainWindow) return;
    if (action === 'minimize') mainWindow.minimize();
    if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    if (action === 'fullscreen') mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return windowState();
});
handle('shell:open-logs', ['shell'], () => { const d = logger.dir(); if (d) shell.openPath(d); return { success: !!d }; });
handle('shell:open-file', ['shell'], (_e, p) => {
    const dl = app.getPath('downloads');
    if (typeof p !== 'string' || !path.resolve(p).startsWith(path.resolve(dl))) return { success: false };
    shell.openPath(p); return { success: true };
});
handle('shell:diagnostics', ['shell'], () => exportDiagnostics());
handle('shell:clear-cache', ['shell'], async (_e, { pin } = {}) => {
    const g = pinGate(pin); if (!g.ok) return { success: false, ...g };
    const ses = session.fromPartition(PARTITION);
    await ses.clearCache();
    await ses.clearStorageData({ storages: ['cachestorage', 'serviceworkers', 'shadercache'] });
    return { success: true };
});
handle('shell:devtools', ['shell'], (_e, { pin } = {}) => {
    if (!TESTING) { const g = pinGate(pin); if (!g.ok) return { success: false, ...g }; }
    if (guest && !guest.isDestroyed()) guest.openDevTools({ mode: 'detach' });
    return { success: true };
});
handle('shell:consent', ['shell'], () => { prefs.set({ consentAccepted: true }, { immediate: true }); return { success: true }; });

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY MONITORING (opt-in by the store owner, consent-gated, PIN-protected)
// ══════════════════════════════════════════════════════════════════════════════
let blurStart = null;
let blurTimeout = null;
let blurInterval = null;
const logsDir = () => path.join(app.getPath('userData'), 'station-logs');
const shotsDir = () => path.join(logsDir(), 'sys_data');
const SHOT_MAGIC = Buffer.from('VQS2');

function monitoringActive() { return !!(prefs.get('activityTrackingEnabled') && prefs.get('consentAccepted')); }

function initTracking() {
    if (!mainWindow) return;
    mainWindow.on('blur', () => {
        if (!monitoringActive()) return;
        blurStart = new Date();
        clearTimeout(blurTimeout); clearInterval(blurInterval);
        blurTimeout = setTimeout(async () => {
            await captureScreen();
            blurInterval = setInterval(captureScreen, 15 * 60_000);
        }, 5000);
    });
    mainWindow.on('focus', () => {
        clearTimeout(blurTimeout); clearInterval(blurInterval);
        blurTimeout = blurInterval = null;
        if (blurStart) {
            const secs = Math.floor((Date.now() - blurStart) / 1000);
            if (secs >= 5) logActivity(blurStart.toISOString(), new Date().toISOString(), secs);
            blurStart = null;
        }
    });
}

function screenshotKey() {
    if (!secretStore.has()) return null;
    return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(secretStore.get()), Buffer.from('venqore-screenshot-v2'), Buffer.from(prefs.get('deviceId') || ''), 32));
}

async function captureScreen() {
    if (!monitoringActive()) return;
    const key = screenshotKey();
    if (!key) return;
    try {
        const { desktopCapturer } = require('electron');
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: 720 } });
        const png = sources[0]?.thumbnail?.toPNG();
        if (!png || !png.length) return;
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const body = Buffer.concat([cipher.update(png), cipher.final()]);
        fs.mkdirSync(shotsDir(), { recursive: true });
        const files = fs.readdirSync(shotsDir()).filter(f => f.endsWith('.bin')).sort();
        while (files.length >= 100) { try { fs.unlinkSync(path.join(shotsDir(), files.shift())); } catch {} } // bounded queue
        fs.writeFileSync(path.join(shotsDir(), `data_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.bin`), Buffer.concat([SHOT_MAGIC, iv, cipher.getAuthTag(), body]));
    } catch (e) { console.error('[Tracking] capture failed:', e.message); }
}

function readLogs() {
    try { return JSON.parse(fs.readFileSync(path.join(logsDir(), 'activity.json'), 'utf8')); } catch { return []; }
}
function writeLogs(logs) {
    fs.mkdirSync(logsDir(), { recursive: true });
    fs.writeFileSync(path.join(logsDir(), 'activity.json'), JSON.stringify(logs.slice(-200), null, 2));
}
function logActivity(away_at, back_at, duration_seconds) {
    try { const l = readLogs(); l.push({ away_at, back_at, duration_seconds }); writeLogs(l); } catch (e) { console.error('[Tracking]', e.message); }
}

let syncing = false;
async function syncActivityLogs() {
    if (!prefs.get('activityTrackingEnabled') || syncing || !secretStore.has()) return;
    syncing = true;
    try {
        const logs = readLogs();
        const unsynced = logs.filter(l => !l.synced);
        if (unsynced.length) {
            const res = await cloudFetch('/api/terminal/activities', { device_id: prefs.get('deviceId'), terminal_id: prefs.get('terminalId'), store_slug: prefs.get('connectedStore'), activities: unsynced });
            if (res.ok) { logs.forEach(l => { l.synced = true; }); writeLogs(logs); }
        }
        if (!fs.existsSync(shotsDir())) return;
        const key = screenshotKey();
        for (const file of fs.readdirSync(shotsDir()).filter(f => f.endsWith('.bin')).slice(0, 10)) {
            const fp = path.join(shotsDir(), file);
            let bytes;
            try {
                const buf = fs.readFileSync(fp);
                if (buf.length > 32 && buf.subarray(0, 4).equals(SHOT_MAGIC)) {
                    if (!key) continue;
                    const d = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(4, 16));
                    d.setAuthTag(buf.subarray(16, 32));
                    bytes = Buffer.concat([d.update(buf.subarray(32)), d.final()]);
                } else bytes = buf;
            } catch { try { fs.unlinkSync(fp); } catch {} continue; }
            const form = new FormData();
            form.append('device_id', prefs.get('deviceId'));
            form.append('store_slug', prefs.get('connectedStore') || '');
            form.append('file', new Blob([bytes], { type: 'application/octet-stream' }), file);
            const res = await cloudFetch('/api/terminal/screenshot', form, 30000, true);
            if (res.ok) fs.unlinkSync(fp); else break;
        }
    } catch (e) { console.warn('[Sync] activity sync failed:', e.message); }
    finally { syncing = false; }
}
