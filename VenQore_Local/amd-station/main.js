/**
 * VenQore Station - Electron Main Process
 * Hardware control bridge for VenQore POS
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { spawn } = require('child_process');
const { PosPrinter } = require('electron-pos-printer');

// Keep global references
let mainWindow;
// let view; // Removed BrowserView
let tray;
let heartbeatInterval;
let serverProcess;
let mysqlProcess;
let vdevProcess;

// --- CONFIGURATION MANAGEMENT ---
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'amd-config.json');

// --- HARDWARE ACCELERATION FIXES ---
// This suppresses "Access Denied" errors in terminal
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-software-rasterizer');

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log('[VenQore Station] Another instance is already running. Quitting...');
    app.quit();
    // process.exit(0); // Optional: Hard exit
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            // mainWindow.setKiosk(true); // Don't force kiosk anymore, focus is enough
            mainWindow.focus();
        }
    });

    // ONLY create window if we got lock
    app.whenReady().then(() => {
        console.log('[VenQore Station] Starting...');
        createWindow();
        createMenu(); // Initialize application menu

        // Tray Icon
        const iconPath = path.join(__dirname, 'assets', 'icon.png');
        tray = new Tray(nativeImage.createFromPath(iconPath));
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Show', click: () => mainWindow.show() },
            { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
            { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
        ]);
        tray.setToolTip('VenQore Station');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => mainWindow.show());
    });
}

// Default Config
let config = {
    serverUrl: process.argv.includes('--dev') ? 'http://127.0.0.1:8000' : 'http://localhost:8000',
    windowTitle: 'VenQore Station',
    defaultPrinter: null,
    terminalId: 1
};

// Load Config from Disk
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const savedConfig = JSON.parse(fs.readFileSync(configPath));
            config = { ...config, ...savedConfig };
        }
    } catch (e) {
        console.error("Failed to load config:", e);
    }
}

// Save Config to Disk
function saveConfig(newConfig) {
    try {
        config = { ...config, ...newConfig };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to save config:", e);
        return false;
    }
}

loadConfig();

// --- WINDOW MANAGEMENT ---

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: config.windowTitle,
        frame: false, // Frameless for the cockpit
        fullscreen: true, // Use standard fullscreen instead of Kiosk to prevent focus bugs
        alwaysOnTop: false, // Allow user to alt-tab if needed, fixes auto-minimize
        icon: path.join(__dirname, 'assets', 'icon.png'),
        transparent: false, // PERFORMANCE FIX: Disable transparency to stop lag
        backgroundColor: '#0f172a', // Dark slate background to prevent flash
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true, // Enable <webview> for easier notch overlay
            partition: 'persist:amd_storage'
        }
    });

    // Load the Shell (Notch UI + WebView)
    mainWindow.loadFile(path.join(__dirname, 'shell.html'));

    // Auto-Ignition: Start the Local Cloud
    startLocalServer();

    // Global Shortcut for DevTools (Debugging)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // Changed to Ctrl+Alt+Shift+I to avoid VenQore Driver conflict (Ctrl+Shift+I)
        if (input.control && input.shift && input.alt && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    });


    // PREVENT UNAUTHORIZED CLOSING
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            // Trigger the "Ask the Brain" protocol
            requestExitPermission();
        }
    });

    // PREVENTION: Auto-Restore on Minimize - DISABLED (Caused focus bugs)
    // mainWindow.on('minimize', (event) => {
    //     event.preventDefault();
    //     mainWindow.restore();
    //     mainWindow.focus();
    // });

    // RECOVERY: Auto-Reload on Crash (The "Phoenix" Protocol)
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error(`[CRASH] Renderer process gone: ${details.reason}. Respawning...`);
        // Wait a second then reload
        setTimeout(() => {
            if (mainWindow) mainWindow.reload();
        }, 1000);
    });

    if (process.argv.includes('--dev')) {
        // Main window devtools (Shell)
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
        // Website devtools
        // view.webContents.openDevTools();
    }

    console.log(`[VenQore Station] Locked to Kiosk Mode (Server: ${config.serverUrl})`);
    startHeartbeat();
    startStatusLoop();
}

function requestExitPermission() {
    console.log('[Main] Requesting Exit Permission...');
    if (mainWindow) mainWindow.webContents.send('amd:request-exit');
}

// ... (loadAppUrl stays same)

async function startLocalServer() {
    console.log('[System] Initializing Full Offline Stack (WebView Mode)...');

    // Send updates to the Shell Renderer via Main Window
    const updateUI = (msg) => {
        if (mainWindow) mainWindow.webContents.send('status:update', msg);
    };

    updateUI('Igniting Manufacturer Engine...');

    // Auto-detect PHP and MySQL paths
    let phpPath = config.phpPath;
    let mysqlPath = config.mysqlPath;

    const possiblePhpPaths = [
        'D:\\Software\\XAMPP\\php\\php.exe',
        'C:\\xampp\\php\\php.exe',
        'C:\\laragon\\bin\\php\\php-8.2\\php.exe',
        'C:\\laragon\\bin\\php\\php-8.1\\php.exe',
        'C:\\php\\php.exe'
    ];

    const possibleMysqlPaths = [
        'D:\\Software\\XAMPP\\mysql\\bin\\mysqld.exe',
        'C:\\xampp\\mysql\\bin\\mysqld.exe',
        'C:\\laragon\\bin\\mysql\\mysql-8.0\\bin\\mysqld.exe'
    ];

    if (!phpPath || !fs.existsSync(phpPath)) {
        phpPath = possiblePhpPaths.find(p => fs.existsSync(p)) || 'php';
    }

    if (!mysqlPath || !fs.existsSync(mysqlPath)) {
        mysqlPath = possibleMysqlPaths.find(p => fs.existsSync(p));
    }

    const artisanPath = path.join(__dirname, '..', 'artisan');
    const cwd = path.join(__dirname, '..');

    console.log(`[System] Using PHP: ${phpPath}`);
    if (mysqlPath) console.log(`[System] Using MySQL: ${mysqlPath}`);

    // 1. Database Pulse (Managed - only if MySQL is found and not already running)
    if (mysqlPath) {
        // Check if MySQL is already running before starting
        const mysqlDir = path.dirname(mysqlPath);
        const mysqlIniPath = path.join(mysqlDir, 'my.ini');

        if (fs.existsSync(mysqlIniPath)) {
            console.log('[System] Launching Database...');
            mysqlProcess = spawn(mysqlPath, [`--defaults-file=${mysqlIniPath}`], {
                cwd: mysqlDir,
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            if (mysqlProcess.stdout) {
                mysqlProcess.stdout.on('data', (data) => console.log(`[MySQL] ${data}`));
            }
            if (mysqlProcess.stderr) {
                mysqlProcess.stderr.on('data', (data) => console.error(`[MySQL Error] ${data}`));
            }

            mysqlProcess.on('error', (err) => console.error('[MySQL] Failed to start:', err));
            mysqlProcess.unref();
        } else {
            console.log('[System] MySQL config not found, skipping database startup (may already be running)');
        }
    } else {
        console.log('[System] MySQL not found locally, assuming external database');
    }

    // 2. Backend Cloud (Laravel)
    const startLaravel = () => {
        console.log('[System] Spawning Laravel...');
        console.log(`[System] Artisan path: ${artisanPath}`);
        console.log(`[System] CWD: ${cwd}`);

        // Don't use shell:true as it breaks paths with spaces
        // spawn handles arguments correctly when not using shell
        serverProcess = spawn(phpPath, [artisanPath, 'serve', '--host=127.0.0.1', '--port=8000'], {
            cwd,
            windowsHide: true // Hide console window on Windows
        });

        if (serverProcess.stdout) {
            serverProcess.stdout.on('data', (data) => console.log(`[Laravel] ${data}`));
        }
        if (serverProcess.stderr) {
            serverProcess.stderr.on('data', (data) => console.error(`[Laravel Error] ${data}`));
        }

        serverProcess.on('exit', (code) => {
            console.log(`[Laravel] Server process exited with code ${code}. Restarting in 3s...`);
            setTimeout(startLaravel, 3000);
        });

        serverProcess.on('error', (err) => {
            console.error('[Laravel] Failed to start:', err);
            updateUI('PHP not found! Install PHP or XAMPP.');
        });
    };

    startLaravel();

    // 3. Frontend Development Assets (Vite) - DISABLED FOR PRODUCTION
    // We rely on 'npm run build' having been run.
    // Ensure 'hot' file is removed to force Laravel to use build manifest.
    const hotPath = path.join(cwd, 'public', 'hot');
    if (fs.existsSync(hotPath)) {
        try {
            fs.unlinkSync(hotPath);
            console.log('[System] Cleaned up hot file for Production Mode.');
        } catch (e) {
            console.error('[System] Failed to delete hot file:', e);
        }
    }

    // 4. OFFLINE-FIRST LAUNCH STRATEGY
    // We do NOT wait for the server to be strictly "ready" via TCP check.
    // We launch the URL immediately. The Service Worker will handle it if offline.
    // If it's a first run (no SW), the Webview's internal retry loop will handle it.

    setTimeout(() => {
        console.log('[System] Launching Interface (Offline-First Strategy)...');
        loadAppUrl();
    }, 3000); // Give Laravel 3s head start, then go.

    /* 
    Legacy TCP Check Removed:
    We no longer block the UI waiting for Port 8000. 
    This allows the App to load from Cache (Service Worker) even if PHP/Server fails.
    */
}

// IPC Listeners for prompts
ipcMain.on('amd:prompt-url', () => promptForUrl());

function loadAppUrl() {
    console.log(`[Main] Loading: ${config.serverUrl}`);
    if (mainWindow) mainWindow.webContents.send('amd:load', config.serverUrl);
}

// --- MENUS & TRAY ---

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Connection / Server URL',
                    click: async () => promptForUrl()
                },
                {
                    label: 'Terminal ID',
                    click: async () => promptForTerminalId()
                },
                { type: 'separator' },
                {
                    label: 'Test Printer',
                    click: () => testPrinter()
                },
                {
                    label: 'Test Cash Drawer',
                    click: () => openCashDrawer()
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    try {
        tray = new Tray(iconPath);
    } catch (e) {
        const icon = nativeImage.createEmpty();
        tray = new Tray(icon);
    }

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        { label: 'Reload Page', click: () => mainWindow.reload() },
        { type: 'separator' },
        { label: 'Update Server URL', click: () => promptForUrl() },
        { type: 'separator' },
        { label: 'Quit', click: () => quitApp() }
    ]);

    tray.setToolTip(`VenQore Station - Terminal ${config.terminalId}`);
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
}

// --- HEARTBEAT SYSTEM ---

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    // Initial Ping
    sendHeartbeat('OPEN');

    // Loop every 60s
    heartbeatInterval = setInterval(() => {
        sendHeartbeat('OPEN');
    }, 60000);
}

async function sendHeartbeat(status, reason = null) {
    console.log(`[Heartbeat] Sending status: ${status} (Term ID: ${config.terminalId})`);
    try {
        const response = await fetch(`${config.serverUrl}/api/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                terminal_id: config.terminalId,
                status: status,
                reason: reason
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Update last sync time on success
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (mainWindow) mainWindow.webContents.send('status:sync', `Just now (${now})`);

            if (data.has_pending_updates) {
                console.log('[Heartbeat] Server reports pending updates.');
            }
        } else {
            console.warn(`[Heartbeat] Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('[Heartbeat] Connection failed:', e.message);
    }
}

// --- STATUS MONITORING ---

function startStatusLoop() {
    setInterval(async () => {
        if (!mainWindow) return;

        // 1. Check Printer
        const printers = await mainWindow.webContents.getPrintersAsync();
        const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
        const printerName = defaultPrinter ? defaultPrinter.name : 'None';
        mainWindow.webContents.send('status:printer', printerName);

        // 2. Check Local Engine (Capacity to serve)
        let isLocalAlive = false;
        try {
            const response = await fetch(`${config.serverUrl}/api/check-connection?t=${Date.now()}`).catch(() => null);
            isLocalAlive = response && response.ok;
        } catch (e) {
            isLocalAlive = false;
        }

        // 3. Check Internet (Cloud Sync Capability)
        // We use a raw socket connect to 8.8.8.8 (Google DNS) as it's faster/reliable than DNS lookup
        let isInternetAlive = false;
        try {
            await new Promise((resolve, reject) => {
                const s = new net.Socket();
                s.setTimeout(1500);
                s.on('connect', () => { s.destroy(); resolve(true); });
                s.on('error', (e) => { s.destroy(); reject(e); });
                s.on('timeout', (e) => { s.destroy(); reject(e); });
                s.connect(53, '8.8.8.8');
            }).then(() => { isInternetAlive = true; }).catch(() => { isInternetAlive = false; });
        } catch (e) { isInternetAlive = false; }

        // Send Consolidated Status
        // payload: { local: boolean, internet: boolean }
        mainWindow.webContents.send('status:connection', { local: isLocalAlive, internet: isInternetAlive });

        if (!isLocalAlive) {
            console.log('[Monitor] Local Engine offline.');
        }

    }, 5000); // Check every 5s
}

// --- HELPERS (Prompts) ---

function createPromptWindow(title, label, value, ipcChannel) {
    const inputWin = new BrowserWindow({
        width: 450,
        height: 220,
        parent: mainWindow,
        modal: true,
        title: title,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        autoHideMenuBar: true,
        resizable: false
    });

    const html = `
        <body style="background:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding:25px; display:flex; flex-direction:column; user-select:none;">
            <label style="font-size:11px; font-weight:800; color:#475569; margin-bottom:8px; letter-spacing:0.05em;">${label}</label>
            <input id="val" value="${value}" style="padding:10px 12px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; font-size:14px; outline:none; color:#1e293b;" />
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button onclick="window.close()" style="padding:10px 18px; border:1px solid #cbd5e1; background:white; color:#475569; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">Cancel</button>
                <button onclick="save()" style="padding:10px 18px; border:none; background:#4f46e5; color:white; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Save</button>
            </div>
            <script>
                const { ipcRenderer } = require('electron');
                document.getElementById('val').focus();
                function save() { ipcRenderer.send('${ipcChannel}', document.getElementById('val').value); }
                document.getElementById('val').addEventListener('keypress', (e) => { if (e.key === 'Enter') save(); });
            </script>
        </body>
    `;
    inputWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    return inputWin;
}

async function promptForUrl() {
    createPromptWindow('Connection Settings', 'SERVER URL', config.serverUrl, 'update-url');
}

async function promptForTerminalId() {
    createPromptWindow('Terminal Configuration', 'TERMINAL ID (Integer)', config.terminalId, 'update-terminal-id');
}

// IPC Listeners
ipcMain.on('update-url', (event, newUrl) => {
    if (newUrl && newUrl.trim().length > 0) {
        if (!newUrl.startsWith('http')) newUrl = 'http://' + newUrl;
        saveConfig({ serverUrl: newUrl });
        config.serverUrl = newUrl;
        BrowserWindow.getAllWindows().forEach(w => { if (w !== mainWindow) w.close(); });
        loadAppUrl();
    }
});

ipcMain.on('update-terminal-id', (event, newId) => {
    if (newId && !isNaN(newId)) {
        const id = parseInt(newId);
        saveConfig({ terminalId: id });
        config.terminalId = id;
        BrowserWindow.getAllWindows().forEach(w => { if (w !== mainWindow) w.close(); });
        startHeartbeat();
        console.log(`[Config] Terminal ID updated to ${id}`);
    }
});

// --- HARDWARE FUNCTIONS ---
async function printReceipt(data) {
    const options = {
        preview: false, type: 'epson', width: data.paperWidth || '80mm', margin: '0 0 0 0',
        copies: data.copies || 1, printerName: data.printerName || config.defaultPrinter,
        timeOutPerLine: 400, silent: true, pageSize: { width: 80000, height: 297000 }
    };
    try { await PosPrinter.print(data.content, options); return { success: true }; }
    catch (error) { console.error('[Print] Error:', error); return { success: false, error: error.message }; }
}

function openCashDrawer(printerName) {
    const drawerKickData = [{ type: 'text', value: '', style: {} }];
    const options = { preview: false, width: '80mm', copies: 1, printerName: printerName || config.defaultPrinter, silent: true };
    try { PosPrinter.print(drawerKickData, options); return { success: true }; }
    catch (error) { return { success: false, error: error.message }; }
}

async function getPrinters() {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map(p => ({ name: p.name, displayName: p.displayName, isDefault: p.isDefault, status: p.status }));
}

async function testPrinter() {
    await printReceipt({
        content: [
            { type: 'text', value: 'VenQore STATION TEST', style: { fontWeight: '700', textAlign: 'center' } },
            { type: 'text', value: `Terminal ID: ${config.terminalId}`, style: { textAlign: 'center' } },
            { type: 'text', value: 'Connection: OK', style: { textAlign: 'center' } },
            { type: 'text', value: '----------------', style: { textAlign: 'center' } },
        ]
    });
}

// --- IPC BRIDGE HANDLERS ---
ipcMain.handle('amd:print', async (e, d) => printReceipt(d));
ipcMain.handle('amd:drawer', async (e, p) => openCashDrawer(p));
ipcMain.handle('amd:printers', async () => getPrinters());
ipcMain.handle('amd:set-printer', async (e, name) => { saveConfig({ defaultPrinter: name }); return { success: true }; });
ipcMain.handle('amd:check', async () => ({ isAMDStation: true, version: app.getVersion() }));

// --- WINDOW CONTROLS ---
ipcMain.on('amd:window-minimize', () => {
    // Disabled for Kiosk mode
});
ipcMain.on('amd:window-maximize', () => {
    // Disabled for Kiosk mode
});
ipcMain.on('amd:window-close', () => {
    requestExitPermission();
});
ipcMain.on('amd:force-close', () => {
    quitApp();
});
ipcMain.on('amd:window-reload', () => {
    if (mainWindow) mainWindow.webContents.send('amd:reload-app');
});

// --- PRIVACY BLUR LOGIC ---
ipcMain.on('amd:toggle-blur', (event, shouldBlur) => {
    // Handled by Shell Renderer directly
});

// --- DUAL SCREEN LOGIC ---
ipcMain.on('amd:launch-dual-pos', () => {
    const { screen } = require('electron');
    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
    });

    if (externalDisplay) {
        let posWindow = new BrowserWindow({
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            width: externalDisplay.bounds.width,
            height: externalDisplay.bounds.height,
            fullscreen: true,
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                partition: 'persist:amd_storage'
            }
        });

        posWindow.loadURL(`${config.serverUrl}/pos`);
    } else {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Dual Screen',
            message: 'No second monitor detected. Please connect an external display to extend the POS terminal.',
            buttons: ['OK']
        });
    }
});


// --- SHUTDOWN HANDLING ---

async function quitApp() {
    console.log('[VenQore Station] Quitting...');

    if (serverProcess) serverProcess.kill();
    // Double-tap removed.
    // if (vdevProcess) vdevProcess.kill();

    // Send graceful shutdown signal
    await sendHeartbeat('CLOSED_NORMALLY', 'Manager quit application');
    app.isQuitting = true;
    app.quit();
}

app.on('before-quit', (e) => {
    if (!app.isQuitting) {
        e.preventDefault();
        quitApp();
    }
});

// --- APP LIFECYCLE ---
// Note: Main app.whenReady() is in the single instance lock block above (line ~47)
// This handler is for activate events only (macOS dock click)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow) mainWindow.show();
});

app.on('window-all-closed', () => { /* Prevent default quit */ });

// GLOBAL ERROR TRAP
process.on('uncaughtException', (error) => {
    console.error('[FATAL] Uncaught Exception:', error);
    // Do not quit, try to keep running
});

